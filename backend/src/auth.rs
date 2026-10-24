//! Supabase access token verification.
//!
//! The app signs in with Supabase Auth (Google, phone, email) and sends the
//! session's access token as a bearer token. We only need the `sub` claim.

use std::time::{Duration, Instant};

use axum::{
    extract::FromRequestParts,
    http::{header::AUTHORIZATION, request::Parts},
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, decode_header, jwk::JwkSet};
use serde::Deserialize;
use tokio::sync::{Mutex, RwLock};
use uuid::Uuid;

use crate::{
    errors::{AppError, AppResult},
    state::AppState,
};

const AUDIENCE: &str = "authenticated";
/// Minimum time between JWKS refetches triggered by unknown key ids.
const JWKS_REFRESH_COOLDOWN: Duration = Duration::from_secs(60);
/// Shorter cooldown after a failed fetch, so a blip doesn't lock out logins.
const JWKS_RETRY_COOLDOWN: Duration = Duration::from_secs(5);

/// Extractor for routes that require a signed-in user.
#[derive(Debug, Clone, Copy)]
pub struct AuthUser {
    pub id: Uuid,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> AppResult<Self> {
        let token = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("Bearer "))
            .ok_or(AppError::Unauthorized)?;
        let id = state.auth.verify(token.trim()).await?;
        Ok(Self { id })
    }
}

#[derive(Deserialize)]
struct Claims {
    sub: Uuid,
}

pub struct JwtVerifier {
    source: KeySource,
}

enum KeySource {
    Secret(DecodingKey),
    Jwks(Jwks),
}

struct Jwks {
    url: String,
    http: reqwest::Client,
    cache: RwLock<JwksCache>,
    /// Single-flights refetches without holding `cache` across the network.
    refresh: Mutex<()>,
}

#[derive(Default)]
struct JwksCache {
    keys: Option<JwkSet>,
    next_fetch: Option<Instant>,
}

impl JwtVerifier {
    pub fn new(supabase_url: &str, jwt_secret: Option<&str>, http: reqwest::Client) -> Self {
        let source = match jwt_secret {
            Some(secret) => KeySource::Secret(DecodingKey::from_secret(secret.as_bytes())),
            None => KeySource::Jwks(Jwks {
                url: format!("{supabase_url}/auth/v1/.well-known/jwks.json"),
                http,
                cache: RwLock::default(),
                refresh: Mutex::default(),
            }),
        };
        Self { source }
    }

    pub async fn verify(&self, token: &str) -> AppResult<Uuid> {
        let header = decode_header(token).map_err(|_| AppError::Unauthorized)?;
        let (key, algorithm) = match &self.source {
            KeySource::Secret(key) => (key.clone(), Algorithm::HS256),
            KeySource::Jwks(jwks) => {
                // Only asymmetric algorithms are valid against a JWKS; this
                // blocks HS256 tokens "signed" with a public key.
                if !matches!(
                    header.alg,
                    Algorithm::ES256 | Algorithm::RS256 | Algorithm::EdDSA
                ) {
                    return Err(AppError::Unauthorized);
                }
                let kid = header.kid.as_deref().ok_or(AppError::Unauthorized)?;
                (jwks.key(kid).await?, header.alg)
            }
        };

        let mut validation = Validation::new(algorithm);
        validation.set_audience(&[AUDIENCE]);
        let data = decode::<Claims>(token, &key, &validation).map_err(|err| {
            tracing::debug!(error = %err, "rejected access token");
            AppError::Unauthorized
        })?;
        Ok(data.claims.sub)
    }
}

impl Jwks {
    async fn key(&self, kid: &str) -> AppResult<DecodingKey> {
        if let Some(key) = self.cached(kid).await? {
            return Ok(key);
        }

        let _refresh = self.refresh.lock().await;
        // Another request may have refreshed while we waited.
        if let Some(key) = self.cached(kid).await? {
            return Ok(key);
        }
        let due = self
            .cache
            .read()
            .await
            .next_fetch
            .is_none_or(|at| Instant::now() >= at);
        if due {
            let fetched = self.fetch().await;
            let mut cache = self.cache.write().await;
            match fetched {
                Ok(keys) => {
                    cache.keys = Some(keys);
                    cache.next_fetch = Some(Instant::now() + JWKS_REFRESH_COOLDOWN);
                }
                Err(err) => {
                    cache.next_fetch = Some(Instant::now() + JWKS_RETRY_COOLDOWN);
                    return Err(err);
                }
            }
        }

        self.cached(kid).await?.ok_or(AppError::Unauthorized)
    }

    async fn fetch(&self) -> AppResult<JwkSet> {
        Ok(self
            .http
            .get(&self.url)
            .send()
            .await?
            .error_for_status()?
            .json()
            .await?)
    }

    async fn cached(&self, kid: &str) -> AppResult<Option<DecodingKey>> {
        let cache = self.cache.read().await;
        let Some(jwk) = cache.keys.as_ref().and_then(|keys| keys.find(kid)) else {
            return Ok(None);
        };
        DecodingKey::from_jwk(jwk)
            .map(Some)
            .map_err(|_| AppError::Unauthorized)
    }
}
