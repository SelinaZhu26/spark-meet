//! Linked accounts. Each provider runs a standard OAuth authorization code
//! flow, then we take a one-time snapshot of what the account says about
//! the user's interests. Tokens are discarded after the snapshot.

mod spotify;
mod strava;

use serde::{Deserialize, Serialize};

use crate::{
    config::{Config, OAuthClient},
    errors::AppResult,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Provider {
    Spotify,
    Strava,
}

/// Interest data pulled from a linked account.
pub struct Snapshot {
    /// One or two lines of plain text for the interest profile.
    pub summary: String,
    pub data: serde_json::Value,
}

impl Provider {
    pub const ALL: [Self; 2] = [Self::Spotify, Self::Strava];

    pub fn as_str(self) -> &'static str {
        match self {
            Self::Spotify => "spotify",
            Self::Strava => "strava",
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            Self::Spotify => "Spotify",
            Self::Strava => "Strava",
        }
    }

    pub fn client(self, config: &Config) -> Option<&OAuthClient> {
        match self {
            Self::Spotify => config.spotify.as_ref(),
            Self::Strava => config.strava.as_ref(),
        }
    }

    /// Must match the redirect URI registered with the provider.
    pub fn callback_url(self, config: &Config) -> String {
        format!(
            "{}/integrations/{}/callback",
            config.public_base_url,
            self.as_str()
        )
    }

    pub fn authorize_url(self, client: &OAuthClient, redirect_uri: &str, state: &str) -> String {
        match self {
            Self::Spotify => spotify::authorize_url(client, redirect_uri, state),
            Self::Strava => strava::authorize_url(client, redirect_uri, state),
        }
    }

    pub async fn snapshot(
        self,
        http: &reqwest::Client,
        client: &OAuthClient,
        redirect_uri: &str,
        code: &str,
    ) -> AppResult<Snapshot> {
        match self {
            Self::Spotify => spotify::snapshot(http, client, redirect_uri, code).await,
            Self::Strava => strava::snapshot(http, client, code).await,
        }
    }
}
