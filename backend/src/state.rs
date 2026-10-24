use std::sync::Arc;

use sqlx::PgPool;
use tokio::sync::Mutex;

use crate::{
    auth::JwtVerifier,
    config::Config,
    services::{elevenlabs::ElevenLabs, gemini::Gemini},
};

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    /// Supabase: profiles, encounters, messages.
    pub db: PgPool,
    /// Tiger Data: location pings.
    pub pings_db: PgPool,
    pub http: reqwest::Client,
    pub auth: Arc<JwtVerifier>,
    pub gemini: Gemini,
    pub elevenlabs: Option<ElevenLabs>,
    /// Serializes audio generation so a cold cache costs one API call.
    pub audio_lock: Arc<Mutex<()>>,
}

impl AppState {
    pub fn new(config: Config, db: PgPool, pings_db: PgPool) -> Self {
        let http = reqwest::Client::builder()
            .user_agent(concat!("spark-backend/", env!("CARGO_PKG_VERSION")))
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .expect("failed to build HTTP client");
        let auth = JwtVerifier::new(
            &config.supabase_url,
            config.supabase_jwt_secret.as_deref(),
            http.clone(),
        );
        let gemini = Gemini::new(http.clone(), config.gemini.clone());
        let elevenlabs = config
            .elevenlabs
            .clone()
            .map(|elevenlabs| ElevenLabs::new(http.clone(), elevenlabs));
        Self {
            config: Arc::new(config),
            db,
            pings_db,
            http,
            auth: Arc::new(auth),
            gemini,
            elevenlabs,
            audio_lock: Arc::default(),
        }
    }
}
