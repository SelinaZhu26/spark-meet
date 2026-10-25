//! Turns location pings into sparks.
//!
//! Every ping looks up who else pinged nearby. For each nearby pair the
//! database hands out a single claim (see [`encounters::claim`]), so only one
//! of the two phones triggers scoring. Scoring runs in the background:
//!
//! 1. Deterministic prefilter: cosine similarity of the two interest
//!    embeddings. Clearly unrelated pairs fizzle without an LLM call.
//! 2. Gemini verdict: score, shared interests, reason, icebreaker and mode.
//! 3. Score at or above the threshold sparks the pair and buzzes both phones.

use serde_json::json;
use uuid::Uuid;

use crate::{
    db::{
        encounters::{self, Verdict},
        pings,
        profiles::{self, Candidate, Profile},
    },
    errors::AppResult,
    services::{
        gemini::Judgement,
        interest_profile,
        push::{self, Notification},
    },
    state::AppState,
};

/// Friends and dating are separate pools.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    Friends,
    Dating,
}

impl Mode {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Friends => "friends",
            Self::Dating => "dating",
        }
    }
}

/// Pools both users opted into.
pub fn shared_modes(a: &Candidate, b: &Candidate) -> Vec<Mode> {
    let mut modes = Vec::with_capacity(2);
    if a.friends_enabled && b.friends_enabled {
        modes.push(Mode::Friends);
    }
    if a.dating_enabled && b.dating_enabled {
        modes.push(Mode::Dating);
    }
    modes
}

/// Resolves Gemini's chosen mode against the pools both users allowed. A
/// mode neither of them allowed is never returned.
pub fn pick_mode(judged: &str, allowed: &[Mode]) -> Option<Mode> {
    let judged = match judged {
        "friends" => Mode::Friends,
        "dating" => Mode::Dating,
        _ => return None,
    };
    if allowed.contains(&judged) {
        Some(judged)
    } else {
        allowed.iter().copied().find(|&mode| mode == Mode::Friends)
    }
}

pub fn cosine_similarity(a: &[f32], b: &[f32]) -> Option<f32> {
    if a.len() != b.len() || a.is_empty() {
        return None;
    }
    let (mut dot, mut norm_a, mut norm_b) = (0.0f32, 0.0f32, 0.0f32);
    for (x, y) in a.iter().zip(b) {
        dot += x * y;
        norm_a += x * x;
        norm_b += y * y;
    }
    let norms = norm_a.sqrt() * norm_b.sqrt();
    (norms > 0.0).then(|| dot / norms)
}

/// Finds nearby active users and starts scoring every pair not yet scored.
pub async fn on_ping(
    state: &AppState,
    user_id: Uuid,
    latitude: f64,
    longitude: f64,
) -> AppResult<()> {
    let matching = &state.config.matching;
    let mut ids = pings::nearby(
        &state.pings_db,
        user_id,
        latitude,
        longitude,
        matching.radius_m,
        matching.ping_window_secs,
    )
    .await?;
    if ids.is_empty() {
        return Ok(());
    }

    ids.push(user_id);
    let mut candidates = profiles::active_candidates(&state.db, &ids).await?;
    let Some(me) = candidates
        .iter()
        .position(|candidate| candidate.id == user_id)
    else {
        return Ok(());
    };
    let me = candidates.swap_remove(me);

    for other in candidates {
        let modes = shared_modes(&me, &other);
        if modes.is_empty() {
            continue;
        }
        let (a, b) = if me.id < other.id {
            (me.clone(), other)
        } else {
            (other, me.clone())
        };
        let changed_at = a.updated_at.max(b.updated_at);
        let Some(encounter_id) = encounters::claim(&state.db, a.id, b.id, changed_at).await? else {
            continue;
        };

        let state = state.clone();
        tokio::spawn(async move {
            if let Err(err) = evaluate(&state, encounter_id, &a, &b, &modes).await {
                tracing::warn!(%encounter_id, error = %err, "encounter evaluation failed");
                if let Err(err) = encounters::mark_failed(&state.db, encounter_id).await {
                    tracing::error!(%encounter_id, error = %err, "failed to mark encounter failed");
                }
            }
        });
    }
    Ok(())
}

async fn evaluate(
    state: &AppState,
    encounter_id: Uuid,
    a: &Candidate,
    b: &Candidate,
    modes: &[Mode],
) -> AppResult<()> {
    let matching = &state.config.matching;
    let similarity = match (&a.embedding, &b.embedding) {
        (Some(x), Some(y)) => cosine_similarity(x, y),
        _ => None,
    };
    if similarity.is_some_and(|similarity| similarity < matching.similarity_floor) {
        tracing::info!(%encounter_id, ?similarity, "encounter fizzled in prefilter");
        let verdict = Verdict {
            similarity,
            score: None,
            mode: None,
            shared_interests: &[],
            reason: None,
            icebreaker: None,
            sparked: false,
        };
        return Ok(encounters::finish(&state.db, encounter_id, &verdict).await?);
    }

    let (profile_a, profile_b) = tokio::try_join!(
        interest_profile::load(state, a.id),
        interest_profile::load(state, b.id),
    )?;
    let judgement = match state
        .gemini
        .judge(&profile_a.document, &profile_b.document, modes)
        .await
    {
        Ok(judgement) => judgement,
        Err(err) => {
            tracing::warn!(%encounter_id, error = %err, "Gemini unavailable; using local verdict");
            local_judgement(&profile_a.profile, &profile_b.profile, modes)
        }
    };
    let score = judgement.score.clamp(0, 100) as i16;
    let mode = pick_mode(&judgement.mode, modes);
    // Cards are shown before anyone waves, so a verdict that quotes a bio
    // (e.g. a bio crafted to make Gemini repeat the other person's) is
    // dropped rather than shown.
    let quotes_bio = [&judgement.reason, &judgement.icebreaker]
        .into_iter()
        .chain(&judgement.shared_interests)
        .any(|text| quotes(text, &profile_a.profile.bio) || quotes(text, &profile_b.profile.bio));
    if quotes_bio {
        tracing::warn!(%encounter_id, "verdict quoted a bio; discarding it");
    }
    let sparked = score >= matching.spark_threshold && mode.is_some() && !quotes_bio;
    tracing::info!(%encounter_id, ?similarity, score, ?mode, sparked, "encounter scored");

    let verdict = Verdict {
        similarity,
        score: Some(score),
        mode: mode.map(Mode::as_str),
        shared_interests: if quotes_bio {
            &[]
        } else {
            &judgement.shared_interests
        },
        reason: (!quotes_bio).then_some(judgement.reason.as_str()),
        icebreaker: (!quotes_bio).then_some(judgement.icebreaker.as_str()),
        sparked,
    };
    encounters::finish(&state.db, encounter_id, &verdict).await?;

    if sparked {
        let notification = Notification {
            title: "⚡ Spark nearby".to_owned(),
            body: spark_teaser(&judgement.shared_interests),
            data: json!({ "type": "spark", "spark_id": encounter_id }),
        };
        for user in [a, b] {
            let Some(token) = user.push_token.as_deref() else {
                continue;
            };
            // The spark is already stored; failing here must not undo it.
            // Worst case the phone also hears about it on its next ping.
            if push::send(&state.http, token, &notification).await
                && let Err(err) = encounters::mark_delivered(&state.db, encounter_id, user.id).await
            {
                tracing::warn!(%encounter_id, error = %err, "failed to mark spark delivered");
            }
        }
    }
    Ok(())
}

/// Deterministic stand-in for when Gemini is down: interests both people
/// listed by name, scored by how many there are.
fn local_judgement(a: &Profile, b: &Profile, modes: &[Mode]) -> Judgement {
    let shared = a
        .interests
        .iter()
        .filter(|interest| {
            b.interests
                .iter()
                .any(|other| other.eq_ignore_ascii_case(interest))
        })
        .take(5)
        .cloned()
        .collect::<Vec<_>>();
    let (score, reason, icebreaker) = match shared.as_slice() {
        [] => (40, String::new(), String::new()),
        [only] => (
            74,
            format!("You both love {}.", only.to_lowercase()),
            format!("What got you into {}?", only.to_lowercase()),
        ),
        [init @ .., last] => (
            (62 + 12 * shared.len() as i64).min(95),
            format!(
                "You both love {} and {}.",
                init.iter()
                    .map(|s| s.to_lowercase())
                    .collect::<Vec<_>>()
                    .join(", "),
                last.to_lowercase()
            ),
            format!("What got you into {}?", init[0].to_lowercase()),
        ),
    };
    Judgement {
        mode: modes
            .first()
            .map_or("none", |mode| mode.as_str())
            .to_owned(),
        shared_interests: shared,
        reason,
        score,
        icebreaker,
    }
}

/// Words in a row that count as quoting someone's bio.
const QUOTE_WORDS: usize = 5;

/// Whether `text` repeats `QUOTE_WORDS` or more consecutive words of `source`,
/// ignoring case and punctuation.
fn quotes(text: &str, source: &str) -> bool {
    fn words(value: &str) -> Vec<String> {
        value
            .split(|ch: char| !ch.is_alphanumeric())
            .filter(|word| !word.is_empty())
            .map(str::to_lowercase)
            .collect()
    }
    let text = format!(" {} ", words(text).join(" "));
    words(source)
        .windows(QUOTE_WORDS)
        .any(|window| text.contains(&format!(" {} ", window.join(" "))))
}

/// Notification text. Says what's shared, never who or where.
fn spark_teaser(shared_interests: &[String]) -> String {
    match shared_interests.first() {
        Some(interest) => format!("Someone near you is into {} too.", interest.to_lowercase()),
        None => "Someone you'd click with is near you right now.".to_owned(),
    }
}

#[cfg(test)]
mod tests {
    use chrono::Utc;

    use super::*;

    fn candidate(friends: bool, dating: bool) -> Candidate {
        Candidate {
            id: Uuid::new_v4(),
            friends_enabled: friends,
            dating_enabled: dating,
            embedding: None,
            push_token: None,
            updated_at: Utc::now(),
        }
    }

    #[test]
    fn dating_requires_both_to_opt_in() {
        let dating_only = candidate(false, true);
        let friends_only = candidate(true, false);
        let both = candidate(true, true);

        assert_eq!(shared_modes(&both, &both), [Mode::Friends, Mode::Dating]);
        assert_eq!(shared_modes(&both, &friends_only), [Mode::Friends]);
        assert_eq!(shared_modes(&both, &dating_only), [Mode::Dating]);
        assert!(shared_modes(&friends_only, &dating_only).is_empty());
    }

    #[test]
    fn pick_mode_never_escapes_allowed_pools() {
        assert_eq!(pick_mode("dating", &[Mode::Friends]), Some(Mode::Friends));
        assert_eq!(
            pick_mode("dating", &[Mode::Friends, Mode::Dating]),
            Some(Mode::Dating)
        );
        assert_eq!(pick_mode("friends", &[Mode::Dating]), None);
        assert_eq!(pick_mode("none", &[Mode::Friends, Mode::Dating]), None);
        assert_eq!(pick_mode("enemies", &[Mode::Friends]), None);
    }

    fn profile(interests: &[&str]) -> Profile {
        Profile {
            id: Uuid::new_v4(),
            display_name: "x".into(),
            bio: String::new(),
            avatar_url: None,
            interests: interests
                .iter()
                .map(|interest| interest.to_string())
                .collect(),
            friends_enabled: true,
            dating_enabled: false,
            active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    #[test]
    fn local_verdict_sparks_on_shared_interests_only() {
        let climber = profile(&["Bouldering", "Jazz", "Coffee"]);
        let verdict = local_judgement(
            &climber,
            &profile(&["coffee", "bouldering"]),
            &[Mode::Friends],
        );
        assert_eq!(verdict.shared_interests, ["Bouldering", "Coffee"]);
        assert_eq!(verdict.reason, "You both love bouldering and coffee.");
        assert_eq!(verdict.mode, "friends");
        assert!(verdict.score >= 70);

        let verdict = local_judgement(&climber, &profile(&["Chess"]), &[Mode::Friends]);
        assert!(verdict.shared_interests.is_empty());
        assert!(verdict.score < 70);
    }

    #[test]
    fn detects_bio_quoted_in_verdict_text() {
        let bio = "I work at Acme Robotics on Market Street, ask me about drones";
        assert!(quotes("They said: work at acme robotics on market!", bio));
        assert!(!quotes("You both love building drones and robots.", bio));
        assert!(!quotes("anything", ""));
    }

    #[test]
    fn cosine_similarity_handles_degenerate_vectors() {
        let same = cosine_similarity(&[1.0, 2.0, 3.0], &[2.0, 4.0, 6.0]).unwrap();
        assert!((same - 1.0).abs() < 1e-6);
        let orthogonal = cosine_similarity(&[1.0, 0.0], &[0.0, 1.0]).unwrap();
        assert!(orthogonal.abs() < 1e-6);
        assert_eq!(cosine_similarity(&[0.0, 0.0], &[1.0, 1.0]), None);
        assert_eq!(cosine_similarity(&[1.0], &[1.0, 1.0]), None);
        assert_eq!(cosine_similarity(&[], &[]), None);
    }
}
