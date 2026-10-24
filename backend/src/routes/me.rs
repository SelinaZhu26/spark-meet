use axum::{Json, extract::State, http::StatusCode};
use serde::{Deserialize, Serialize};

use crate::{
    auth::AuthUser,
    db::{
        integrations::{self, Integration},
        profiles::{self, Profile, ProfileUpdate},
    },
    errors::{AppError, AppResult},
    services::{integrations::Provider, interest_profile},
    state::AppState,
};

const MAX_NAME_CHARS: usize = 40;
const MAX_BIO_CHARS: usize = 300;
const MAX_INTERESTS: usize = 20;
const MAX_INTEREST_CHARS: usize = 40;

#[derive(Serialize)]
pub struct MeResponse {
    profile: Profile,
    integrations: Vec<Integration>,
    /// Providers this server has OAuth credentials for.
    available_integrations: Vec<Provider>,
}

pub async fn get_me(State(state): State<AppState>, user: AuthUser) -> AppResult<Json<MeResponse>> {
    let profile = profiles::ensure(&state.db, user.id).await?;
    me_response(&state, profile).await
}

#[derive(Deserialize)]
pub struct UpdateProfile {
    display_name: String,
    #[serde(default)]
    bio: String,
    avatar_url: Option<String>,
    #[serde(default)]
    interests: Vec<String>,
    friends_enabled: bool,
    dating_enabled: bool,
}

pub async fn update_me(
    State(state): State<AppState>,
    user: AuthUser,
    Json(body): Json<UpdateProfile>,
) -> AppResult<Json<MeResponse>> {
    let update = validate(body)?;
    let profile = profiles::update(&state.db, user.id, &update).await?;
    interest_profile::spawn_refresh(state.clone(), user.id);
    me_response(&state, profile).await
}

#[derive(Deserialize)]
pub struct PushToken {
    token: Option<String>,
}

pub async fn set_push_token(
    State(state): State<AppState>,
    user: AuthUser,
    Json(body): Json<PushToken>,
) -> AppResult<StatusCode> {
    let token = body
        .token
        .as_deref()
        .map(str::trim)
        .filter(|token| !token.is_empty());
    if !profiles::set_push_token(&state.db, user.id, token).await? {
        return Err(AppError::NotFound("profile"));
    }
    Ok(StatusCode::NO_CONTENT)
}

async fn me_response(state: &AppState, profile: Profile) -> AppResult<Json<MeResponse>> {
    let integrations = integrations::list(&state.db, profile.id).await?;
    let available_integrations = Provider::ALL
        .into_iter()
        .filter(|provider| provider.client(&state.config).is_some())
        .collect();
    Ok(Json(MeResponse {
        profile,
        integrations,
        available_integrations,
    }))
}

fn validate(body: UpdateProfile) -> AppResult<ProfileUpdate> {
    let display_name = collapse_whitespace(&body.display_name);
    if display_name.is_empty() || display_name.chars().count() > MAX_NAME_CHARS {
        return Err(AppError::bad_request(format!(
            "display_name must be 1-{MAX_NAME_CHARS} characters"
        )));
    }
    let bio = body.bio.trim().to_owned();
    if bio.chars().count() > MAX_BIO_CHARS {
        return Err(AppError::bad_request(format!(
            "bio must be at most {MAX_BIO_CHARS} characters"
        )));
    }
    let avatar_url = body.avatar_url.filter(|url| !url.trim().is_empty());
    if avatar_url
        .as_ref()
        .is_some_and(|url| !url.starts_with("https://"))
    {
        return Err(AppError::bad_request("avatar_url must be an https URL"));
    }
    if !body.friends_enabled && !body.dating_enabled {
        return Err(AppError::bad_request("enable friends, dating or both"));
    }
    Ok(ProfileUpdate {
        display_name,
        bio,
        avatar_url,
        interests: normalize_interests(&body.interests)?,
        friends_enabled: body.friends_enabled,
        dating_enabled: body.dating_enabled,
    })
}

/// Trims, collapses whitespace and drops case-insensitive duplicates,
/// keeping the first spelling.
fn normalize_interests(raw: &[String]) -> AppResult<Vec<String>> {
    let mut interests: Vec<String> = Vec::new();
    for interest in raw {
        let interest = collapse_whitespace(interest);
        if interest.is_empty()
            || interests
                .iter()
                .any(|existing| existing.to_lowercase() == interest.to_lowercase())
        {
            continue;
        }
        if interest.chars().count() > MAX_INTEREST_CHARS {
            return Err(AppError::bad_request(format!(
                "interests must be at most {MAX_INTEREST_CHARS} characters each"
            )));
        }
        interests.push(interest);
    }
    if interests.len() > MAX_INTERESTS {
        return Err(AppError::bad_request(format!(
            "at most {MAX_INTERESTS} interests"
        )));
    }
    Ok(interests)
}

fn collapse_whitespace(value: &str) -> String {
    value.split_whitespace().collect::<Vec<_>>().join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn strings(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| value.to_string()).collect()
    }

    #[test]
    fn interests_are_trimmed_and_deduplicated_case_insensitively() {
        let interests = normalize_interests(&strings(&[
            "  Rock  climbing ",
            "rock climbing",
            "",
            "Jazz",
        ]))
        .unwrap();
        assert_eq!(interests, ["Rock climbing", "Jazz"]);
    }

    #[test]
    fn duplicates_do_not_count_toward_the_limit() {
        let raw = vec!["chess".to_owned(); MAX_INTERESTS + 5];
        assert_eq!(normalize_interests(&raw).unwrap(), ["chess"]);

        let raw = (0..=MAX_INTERESTS)
            .map(|i| format!("interest {i}"))
            .collect::<Vec<_>>();
        assert!(normalize_interests(&raw).is_err());
    }
}
