//! ElevenLabs: the generated Spark buzz and spoken icebreakers.

use bytes::Bytes;
use serde_json::{Value, json};

use crate::{
    config::ElevenLabsConfig,
    errors::{AppError, AppResult},
};

const API_BASE: &str = "https://api.elevenlabs.io/v1";
const OUTPUT_FORMAT: &str = "mp3_44100_128";

#[derive(Clone)]
pub struct ElevenLabs {
    http: reqwest::Client,
    config: ElevenLabsConfig,
}

impl ElevenLabs {
    pub fn new(http: reqwest::Client, config: ElevenLabsConfig) -> Self {
        Self { http, config }
    }

    pub async fn sound_effect(&self, prompt: &str, duration_secs: f32) -> AppResult<Bytes> {
        let body = json!({
            "text": prompt,
            "duration_seconds": duration_secs,
            "prompt_influence": 0.6,
        });
        self.post(&format!("{API_BASE}/sound-generation"), &body)
            .await
    }

    pub async fn speak(&self, text: &str) -> AppResult<Bytes> {
        let url = format!("{API_BASE}/text-to-speech/{}", self.config.voice_id);
        let body = json!({ "text": text, "model_id": self.config.tts_model });
        self.post(&url, &body).await
    }

    async fn post(&self, url: &str, body: &Value) -> AppResult<Bytes> {
        let response = self
            .http
            .post(url)
            .query(&[("output_format", OUTPUT_FORMAT)])
            .header("xi-api-key", &self.config.api_key)
            .json(body)
            .send()
            .await?;
        let status = response.status();
        if !status.is_success() {
            let detail = response.text().await.unwrap_or_default();
            return Err(AppError::upstream(
                "ElevenLabs",
                format!("{status}: {detail}"),
            ));
        }
        Ok(response.bytes().await?)
    }
}
