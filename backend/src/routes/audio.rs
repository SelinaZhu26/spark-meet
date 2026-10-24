use std::path::Path as FsPath;

use axum::{
    extract::{Path, State},
    http::header::{CACHE_CONTROL, CONTENT_TYPE},
    response::{IntoResponse, Response},
};
use bytes::Bytes;
use uuid::Uuid;

use crate::{
    auth::AuthUser,
    db::encounters,
    errors::{AppError, AppResult},
    state::AppState,
};

const BUZZ_PROMPT: &str = "A short bright electric spark crackle that blooms into a warm, \
playful two-note chime. Friendly, magical, clean mobile notification sound, no voice.";
const BUZZ_SECONDS: f32 = 1.5;

/// Spark's signature buzz, generated once with ElevenLabs sound effects.
pub async fn spark_buzz(State(state): State<AppState>) -> AppResult<Response> {
    let elevenlabs = state
        .elevenlabs
        .as_ref()
        .ok_or(AppError::NotConfigured("ElevenLabs"))?;
    let path = state.config.audio_cache_dir.join("spark-buzz.mp3");
    let audio = cached_or_generate(&state, &path, || {
        elevenlabs.sound_effect(BUZZ_PROMPT, BUZZ_SECONDS)
    })
    .await?;
    Ok(mp3(audio, "public, max-age=86400"))
}

/// The spark's icebreaker read aloud, for accessibility.
pub async fn icebreaker(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Response> {
    let elevenlabs = state
        .elevenlabs
        .as_ref()
        .ok_or(AppError::NotConfigured("ElevenLabs"))?;
    let spark = encounters::spark_for(&state.db, user.id, id)
        .await?
        .ok_or(AppError::NotFound("spark"))?;
    let path = state
        .config
        .audio_cache_dir
        .join("icebreakers")
        .join(format!("{id}.mp3"));
    let audio = cached_or_generate(&state, &path, || elevenlabs.speak(&spark.icebreaker)).await?;
    Ok(mp3(audio, "private, max-age=86400"))
}

async fn cached_or_generate<F, Fut>(
    state: &AppState,
    path: &FsPath,
    generate: F,
) -> AppResult<Bytes>
where
    F: FnOnce() -> Fut,
    Fut: Future<Output = AppResult<Bytes>>,
{
    if let Ok(audio) = tokio::fs::read(path).await {
        return Ok(audio.into());
    }
    let _guard = state.audio_lock.lock().await;
    // Someone else may have generated it while we waited.
    if let Ok(audio) = tokio::fs::read(path).await {
        return Ok(audio.into());
    }
    let audio = generate().await?;
    if let Some(dir) = path.parent() {
        tokio::fs::create_dir_all(dir).await?;
    }
    tokio::fs::write(path, &audio).await?;
    Ok(audio)
}

fn mp3(audio: Bytes, cache_control: &'static str) -> Response {
    (
        [(CONTENT_TYPE, "audio/mpeg"), (CACHE_CONTROL, cache_control)],
        audio,
    )
        .into_response()
}
