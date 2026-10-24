use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    db::{
        encounters::{self, SparkRow},
        messages::{self, Message},
        profiles,
    },
    errors::{AppError, AppResult},
    services::push::{self, Notification},
    state::AppState,
};

const MAX_MESSAGE_CHARS: usize = 2000;
const NOTIFICATION_PREVIEW_CHARS: usize = 120;

/// What a user sees about a spark. Until both people wave, this is only
/// what they share, never who the other person is.
#[derive(Serialize)]
pub struct SparkCard {
    id: Uuid,
    score: i16,
    mode: String,
    shared_interests: Vec<String>,
    reason: String,
    icebreaker: String,
    sparked_at: DateTime<Utc>,
    waved: bool,
    connected: bool,
    other: Option<PeerProfile>,
}

#[derive(Serialize)]
pub struct PeerProfile {
    id: Uuid,
    display_name: String,
    bio: String,
    avatar_url: Option<String>,
    interests: Vec<String>,
}

impl From<SparkRow> for SparkCard {
    fn from(row: SparkRow) -> Self {
        let other = match (row.connected, row.other_display_name) {
            (true, Some(display_name)) => Some(PeerProfile {
                id: row.other_id,
                display_name,
                bio: row.other_bio.unwrap_or_default(),
                avatar_url: row.other_avatar_url,
                interests: row.other_interests.unwrap_or_default(),
            }),
            _ => None,
        };
        Self {
            id: row.id,
            score: row.score,
            mode: row.mode,
            shared_interests: row.shared_interests,
            reason: row.reason,
            icebreaker: row.icebreaker,
            sparked_at: row.sparked_at,
            waved: row.waved,
            connected: row.connected,
            other,
        }
    }
}

pub async fn list(
    State(state): State<AppState>,
    user: AuthUser,
) -> AppResult<Json<Vec<SparkCard>>> {
    let sparks = encounters::sparks_for(&state.db, user.id, None).await?;
    Ok(Json(sparks.into_iter().map(SparkCard::from).collect()))
}

pub async fn get(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<SparkCard>> {
    let spark = encounters::spark_for(&state.db, user.id, id)
        .await?
        .ok_or(AppError::NotFound("spark"))?;
    Ok(Json(spark.into()))
}

/// Waves at a spark. A one-sided wave reveals nothing to the other person;
/// only the wave that completes the pair notifies them.
pub async fn wave(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<SparkCard>> {
    if let Some(wave) = encounters::wave(&state.db, id, user.id).await?
        && wave.connected
    {
        let notification = Notification {
            title: "👋 It's mutual".to_owned(),
            body: "You both waved. Say hi!".to_owned(),
            data: json!({ "type": "connected", "spark_id": id }),
        };
        let state = state.clone();
        tokio::spawn(async move {
            push::send_to_user(&state, wave.other_id, &notification).await;
        });
    }
    let spark = encounters::spark_for(&state.db, user.id, id)
        .await?
        .ok_or(AppError::NotFound("spark"))?;
    Ok(Json(spark.into()))
}

#[derive(Deserialize)]
pub struct MessagesQuery {
    #[serde(default)]
    after: i64,
}

pub async fn list_messages(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
    Query(query): Query<MessagesQuery>,
) -> AppResult<Json<Vec<Message>>> {
    encounters::connected_peer(&state.db, id, user.id)
        .await?
        .ok_or(AppError::NotFound("chat"))?;
    Ok(Json(
        messages::list(&state.db, id, user.id, query.after).await?,
    ))
}

#[derive(Deserialize)]
pub struct NewMessage {
    body: String,
}

pub async fn send_message(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
    Json(message): Json<NewMessage>,
) -> AppResult<(StatusCode, Json<Message>)> {
    let peer = encounters::connected_peer(&state.db, id, user.id)
        .await?
        .ok_or(AppError::NotFound("chat"))?;
    let body = message.body.trim();
    if body.is_empty() || body.chars().count() > MAX_MESSAGE_CHARS {
        return Err(AppError::bad_request(format!(
            "message must be 1-{MAX_MESSAGE_CHARS} characters"
        )));
    }
    let message = messages::create(&state.db, id, user.id, body).await?;

    let sender = profiles::get(&state.db, user.id).await?;
    let notification = Notification {
        title: sender.map_or_else(|| "New message".to_owned(), |sender| sender.display_name),
        body: preview(body),
        data: json!({ "type": "message", "spark_id": id }),
    };
    let state = state.clone();
    tokio::spawn(async move {
        push::send_to_user(&state, peer, &notification).await;
    });

    Ok((StatusCode::CREATED, Json(message)))
}

fn preview(body: &str) -> String {
    if body.chars().count() <= NOTIFICATION_PREVIEW_CHARS {
        return body.to_owned();
    }
    let mut preview = body
        .chars()
        .take(NOTIFICATION_PREVIEW_CHARS - 1)
        .collect::<String>();
    preview.push('…');
    preview
}
