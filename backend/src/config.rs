use std::{env, net::SocketAddr, path::PathBuf, str::FromStr};

use crate::errors::ConfigError;

#[derive(Debug, Clone)]
pub struct Config {
    pub bind_addr: SocketAddr,
    /// Public URL of this server, used to build OAuth callback URLs.
    pub public_base_url: String,
    pub database_url: String,
    /// Tiger Data instance holding location pings. Defaults to `database_url`.
    pub pings_database_url: String,
    pub supabase_url: String,
    /// Legacy HS256 secret. When unset, tokens are verified against the
    /// project's JWKS instead.
    pub supabase_jwt_secret: Option<String>,
    pub gemini: GeminiConfig,
    pub elevenlabs: Option<ElevenLabsConfig>,
    pub spotify: Option<OAuthClient>,
    pub strava: Option<OAuthClient>,
    /// URL prefixes the app may ask to be redirected to after OAuth.
    pub app_redirect_allowlist: Vec<String>,
    pub audio_cache_dir: PathBuf,
    pub matching: MatchingConfig,
}

#[derive(Debug, Clone)]
pub struct GeminiConfig {
    pub api_key: String,
    pub model: String,
    pub embedding_model: String,
}

#[derive(Debug, Clone)]
pub struct ElevenLabsConfig {
    pub api_key: String,
    pub voice_id: String,
    pub tts_model: String,
}

#[derive(Debug, Clone)]
pub struct OAuthClient {
    pub client_id: String,
    pub client_secret: String,
}

#[derive(Debug, Clone)]
pub struct MatchingConfig {
    /// How close two people must be, in meters.
    pub radius_m: f64,
    /// How recent another user's ping must be to count as "here right now".
    pub ping_window_secs: f64,
    /// Embedding cosine similarity below which Gemini isn't even asked.
    pub similarity_floor: f32,
    /// Gemini score (0-100) at or above which a pair sparks.
    pub spark_threshold: i16,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        let database_url = required("DATABASE_URL")?;
        Ok(Self {
            bind_addr: parsed("BIND_ADDR", SocketAddr::from(([0, 0, 0, 0], 8080)))?,
            public_base_url: optional("PUBLIC_BASE_URL")
                .unwrap_or_else(|| "http://localhost:8080".to_owned())
                .trim_end_matches('/')
                .to_owned(),
            pings_database_url: optional("PINGS_DATABASE_URL")
                .unwrap_or_else(|| database_url.clone()),
            database_url,
            supabase_url: required("SUPABASE_URL")?.trim_end_matches('/').to_owned(),
            supabase_jwt_secret: optional("SUPABASE_JWT_SECRET"),
            gemini: GeminiConfig {
                api_key: required("GEMINI_API_KEY")?,
                model: optional("GEMINI_MODEL").unwrap_or_else(|| "gemini-3.8-flash".to_owned()),
                embedding_model: optional("GEMINI_EMBEDDING_MODEL")
                    .unwrap_or_else(|| "gemini-embedding-001".to_owned()),
            },
            elevenlabs: optional("ELEVENLABS_API_KEY").map(|api_key| ElevenLabsConfig {
                api_key,
                voice_id: optional("ELEVENLABS_VOICE_ID")
                    .unwrap_or_else(|| "JBFqnCBsd6RMkjVDRZzb".to_owned()),
                tts_model: optional("ELEVENLABS_TTS_MODEL")
                    .unwrap_or_else(|| "eleven_multilingual_v2".to_owned()),
            }),
            spotify: oauth_client("SPOTIFY"),
            strava: oauth_client("STRAVA"),
            app_redirect_allowlist: redirect_allowlist()?,
            audio_cache_dir: optional("AUDIO_CACHE_DIR")
                .unwrap_or_else(|| "./cache".to_owned())
                .into(),
            matching: MatchingConfig {
                radius_m: parsed("PROXIMITY_RADIUS_M", 30.0)?,
                ping_window_secs: parsed("PING_WINDOW_SECS", 120.0)?,
                similarity_floor: parsed("SIMILARITY_FLOOR", 0.5)?,
                spark_threshold: parsed("SPARK_THRESHOLD", 70)?,
            },
        })
    }
}

fn optional(key: &str) -> Option<String> {
    env::var(key).ok().filter(|value| !value.trim().is_empty())
}

fn required(key: &'static str) -> Result<String, ConfigError> {
    optional(key).ok_or(ConfigError::Missing(key))
}

fn parsed<T: FromStr>(key: &'static str, default: T) -> Result<T, ConfigError> {
    match optional(key) {
        Some(value) => value
            .trim()
            .parse()
            .map_err(|_| ConfigError::Invalid { key, value }),
        None => Ok(default),
    }
}

/// Prefixes must end in `/` (e.g. `spark://`) so `https://app.example`
/// can't also allow `https://app.example.evil`.
fn redirect_allowlist() -> Result<Vec<String>, ConfigError> {
    let key = "APP_REDIRECT_ALLOWLIST";
    let value = optional(key).unwrap_or_else(|| "spark://".to_owned());
    let prefixes = value
        .split(',')
        .map(str::trim)
        .filter(|prefix| !prefix.is_empty())
        .map(str::to_owned)
        .collect::<Vec<_>>();
    if prefixes.iter().any(|prefix| !prefix.ends_with('/')) {
        return Err(ConfigError::Invalid { key, value });
    }
    Ok(prefixes)
}

fn oauth_client(prefix: &str) -> Option<OAuthClient> {
    Some(OAuthClient {
        client_id: optional(&format!("{prefix}_CLIENT_ID"))?,
        client_secret: optional(&format!("{prefix}_CLIENT_SECRET"))?,
    })
}
