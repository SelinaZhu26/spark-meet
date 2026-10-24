//! A user's interest profile: their own interests and bio plus everything
//! their linked accounts say about them, flattened into one document. The
//! same document is embedded for the similarity prefilter and shown to
//! Gemini for the verdict. It never contains the user's name.

use std::fmt::Write;

use uuid::Uuid;

use crate::{
    db::{
        integrations::{self, Integration},
        profiles::{self, Profile},
    },
    errors::{AppError, AppResult},
    state::AppState,
};

pub struct InterestProfile {
    pub profile: Profile,
    pub document: String,
}

pub fn document(profile: &Profile, integrations: &[Integration]) -> String {
    let mut doc = String::new();
    if !profile.interests.is_empty() {
        let _ = writeln!(doc, "Interests: {}", profile.interests.join(", "));
    }
    if !profile.bio.trim().is_empty() {
        let _ = writeln!(doc, "About: {}", profile.bio.trim());
    }
    for integration in integrations {
        let _ = writeln!(doc, "{}", integration.summary);
    }
    // The judge prompt wraps each document in <person_x> tags; user text must
    // not be able to close or forge them.
    doc.replace(['<', '>'], "")
}

pub async fn load(state: &AppState, user_id: Uuid) -> AppResult<InterestProfile> {
    let (profile, integrations) = tokio::try_join!(
        profiles::get(&state.db, user_id),
        integrations::list(&state.db, user_id),
    )?;
    let profile = profile.ok_or(AppError::NotFound("profile"))?;
    let document = document(&profile, &integrations);
    Ok(InterestProfile { profile, document })
}

pub async fn refresh_embedding(state: &AppState, user_id: Uuid) -> AppResult<()> {
    let doc = load(state, user_id).await?.document;
    if doc.trim().is_empty() {
        return Ok(());
    }
    let embedding = state.gemini.embed(&doc).await?;
    profiles::set_embedding(&state.db, user_id, &embedding).await?;
    Ok(())
}

/// Re-embeds a user's interest profile in the background.
pub fn spawn_refresh(state: AppState, user_id: Uuid) {
    tokio::spawn(async move {
        if let Err(err) = refresh_embedding(&state, user_id).await {
            tracing::warn!(%user_id, error = %err, "failed to refresh interest embedding");
        }
    });
}
