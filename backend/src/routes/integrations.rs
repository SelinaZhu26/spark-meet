use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Redirect, Response},
};
use reqwest::Url;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    db::{integrations, profiles},
    errors::{AppError, AppResult},
    services::{integrations::Provider, interest_profile},
    state::AppState,
};

#[derive(Deserialize)]
pub struct ConnectQuery {
    /// App deep link to land on once the provider flow finishes.
    return_to: String,
}

#[derive(Serialize)]
pub struct ConnectResponse {
    /// Provider authorization page for the app to open in a browser.
    url: String,
}

pub async fn connect(
    State(state): State<AppState>,
    user: AuthUser,
    Path(provider): Path<Provider>,
    Query(query): Query<ConnectQuery>,
) -> AppResult<Json<ConnectResponse>> {
    let client = provider
        .client(&state.config)
        .ok_or(AppError::NotConfigured(provider.label()))?;
    if !is_allowed_return_to(&query.return_to, &state.config.app_redirect_allowlist) {
        return Err(AppError::bad_request("return_to is not an allowed app URL"));
    }
    profiles::ensure(&state.db, user.id).await?;

    let oauth_state = Uuid::new_v4().simple().to_string();
    integrations::create_state(
        &state.db,
        &oauth_state,
        user.id,
        provider.as_str(),
        &query.return_to,
    )
    .await?;
    let url = provider.authorize_url(client, &provider.callback_url(&state.config), &oauth_state);
    Ok(Json(ConnectResponse { url }))
}

#[derive(Deserialize)]
pub struct CallbackQuery {
    code: Option<String>,
    state: Option<String>,
    error: Option<String>,
}

/// Provider redirect target. Always bounces back into the app with a
/// `status` of `connected`, `denied` or `error`.
pub async fn callback(
    State(state): State<AppState>,
    Path(provider): Path<Provider>,
    Query(query): Query<CallbackQuery>,
) -> AppResult<Response> {
    let oauth = match query.state.as_deref() {
        Some(oauth_state) => integrations::take_state(&state.db, oauth_state).await?,
        None => None,
    };
    let Some(oauth) = oauth.filter(|oauth| oauth.provider == provider.as_str()) else {
        return Ok((
            StatusCode::BAD_REQUEST,
            "This link has expired. Head back to Spark and try again.",
        )
            .into_response());
    };

    let status = match (query.error, query.code) {
        (Some(_), _) | (None, None) => "denied",
        (None, Some(code)) => match complete(&state, provider, oauth.user_id, &code).await {
            Ok(()) => "connected",
            Err(err) => {
                tracing::warn!(provider = provider.as_str(), error = %err, "OAuth callback failed");
                "error"
            }
        },
    };
    let location = return_url(&oauth.return_to, provider, status);
    Ok(Redirect::to(&location).into_response())
}

async fn complete(
    state: &AppState,
    provider: Provider,
    user_id: Uuid,
    code: &str,
) -> AppResult<()> {
    let client = provider
        .client(&state.config)
        .ok_or(AppError::NotConfigured(provider.label()))?;
    let snapshot = provider
        .snapshot(
            &state.http,
            client,
            &provider.callback_url(&state.config),
            code,
        )
        .await?;
    integrations::upsert(
        &state.db,
        user_id,
        provider.as_str(),
        &snapshot.summary,
        &snapshot.data,
    )
    .await?;
    profiles::touch(&state.db, user_id).await?;
    interest_profile::spawn_refresh(state.clone(), user_id);
    Ok(())
}

pub async fn disconnect(
    State(state): State<AppState>,
    user: AuthUser,
    Path(provider): Path<Provider>,
) -> AppResult<StatusCode> {
    if integrations::delete(&state.db, user.id, provider.as_str()).await? {
        profiles::touch(&state.db, user.id).await?;
        interest_profile::spawn_refresh(state.clone(), user.id);
    }
    Ok(StatusCode::NO_CONTENT)
}

fn is_allowed_return_to(return_to: &str, allowlist: &[String]) -> bool {
    allowlist
        .iter()
        .any(|prefix| return_to.starts_with(prefix.as_str()))
}

fn return_url(return_to: &str, provider: Provider, status: &str) -> String {
    match Url::parse(return_to) {
        Ok(mut url) => {
            url.query_pairs_mut()
                .append_pair("provider", provider.as_str())
                .append_pair("status", status);
            url.into()
        }
        Err(_) => format!("{return_to}?provider={}&status={status}", provider.as_str()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn return_to_must_match_an_app_prefix() {
        let allowlist = ["spark://".to_owned(), "exp://".to_owned()];
        assert!(is_allowed_return_to("spark://integrations", &allowlist));
        assert!(is_allowed_return_to(
            "exp://192.168.1.20:8081/--/integrations",
            &allowlist
        ));
        assert!(!is_allowed_return_to(
            "https://evil.example/spark://",
            &allowlist
        ));
        assert!(!is_allowed_return_to("javascript:alert(1)", &allowlist));
    }

    #[test]
    fn return_url_keeps_existing_query() {
        assert_eq!(
            return_url(
                "spark://integrations?from=profile",
                Provider::Strava,
                "connected"
            ),
            "spark://integrations?from=profile&provider=strava&status=connected"
        );
        assert_eq!(
            return_url(
                "exp://10.0.0.2:8081/--/integrations",
                Provider::Spotify,
                "denied"
            ),
            "exp://10.0.0.2:8081/--/integrations?provider=spotify&status=denied"
        );
    }
}
