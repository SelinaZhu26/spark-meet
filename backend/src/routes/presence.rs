use axum::{Json, extract::State};
use serde::{Deserialize, Serialize};

use crate::{
    auth::AuthUser,
    db::{
        encounters, pings,
        profiles::{self, Profile},
    },
    errors::{AppError, AppResult},
    routes::sparks::SparkCard,
    services::matcher,
    state::AppState,
};

/// Fixes less accurate than this are too vague to say who's "right here".
const MAX_ACCURACY_M: f32 = 100.0;

#[derive(Deserialize)]
pub struct Presence {
    active: bool,
}

/// The ON/OFF switch. Switching off also forgets the user's location pings.
pub async fn set_presence(
    State(state): State<AppState>,
    user: AuthUser,
    Json(body): Json<Presence>,
) -> AppResult<Json<Profile>> {
    let profile = profiles::get(&state.db, user.id)
        .await?
        .ok_or(AppError::NotFound("profile"))?;
    if body.active && profile.display_name.is_empty() {
        return Err(AppError::Conflict(
            "finish your profile before switching Spark on",
        ));
    }
    let profile = profiles::set_active(&state.db, user.id, body.active)
        .await?
        .ok_or(AppError::NotFound("profile"))?;
    if !body.active {
        pings::forget(&state.pings_db, user.id).await?;
    }
    Ok(Json(profile))
}

#[derive(Deserialize)]
pub struct Ping {
    latitude: f64,
    longitude: f64,
    accuracy: Option<f32>,
}

#[derive(Serialize)]
pub struct PingResponse {
    /// Sparks the user hasn't been told about yet.
    sparks: Vec<SparkCard>,
}

pub async fn ping(
    State(state): State<AppState>,
    user: AuthUser,
    Json(body): Json<Ping>,
) -> AppResult<Json<PingResponse>> {
    if !(-90.0..=90.0).contains(&body.latitude) || !(-180.0..=180.0).contains(&body.longitude) {
        return Err(AppError::bad_request("latitude or longitude out of range"));
    }
    let profile = profiles::get(&state.db, user.id)
        .await?
        .ok_or(AppError::NotFound("profile"))?;
    if !profile.active {
        return Err(AppError::Conflict("Spark is switched off"));
    }

    let precise = body
        .accuracy
        .is_none_or(|accuracy| accuracy <= MAX_ACCURACY_M);
    if precise {
        pings::record(
            &state.pings_db,
            user.id,
            body.latitude,
            body.longitude,
            body.accuracy,
        )
        .await?;
        matcher::on_ping(&state, user.id, body.latitude, body.longitude).await?;
    }

    let undelivered = encounters::take_undelivered(&state.db, user.id).await?;
    let sparks = if undelivered.is_empty() {
        Vec::new()
    } else {
        encounters::sparks_for(&state.db, user.id, Some(&undelivered))
            .await?
            .into_iter()
            .map(SparkCard::from)
            .collect()
    };
    Ok(Json(PingResponse { sparks }))
}
