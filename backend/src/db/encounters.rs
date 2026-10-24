use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

/// A sparked encounter as seen by one of its two participants. The other
/// person's profile is only present once both have waved.
#[derive(Debug, Clone)]
pub struct SparkRow {
    pub id: Uuid,
    pub score: i16,
    pub mode: String,
    pub shared_interests: Vec<String>,
    pub reason: String,
    pub icebreaker: String,
    pub sparked_at: DateTime<Utc>,
    pub waved: bool,
    pub connected: bool,
    pub other_id: Uuid,
    pub other_display_name: Option<String>,
    pub other_bio: Option<String>,
    pub other_avatar_url: Option<String>,
    pub other_interests: Option<Vec<String>>,
}

#[derive(Debug, Clone)]
pub struct Verdict<'a> {
    pub similarity: Option<f32>,
    pub score: Option<i16>,
    pub mode: Option<&'a str>,
    pub shared_interests: &'a [String],
    pub reason: Option<&'a str>,
    pub icebreaker: Option<&'a str>,
    pub sparked: bool,
}

/// Claims the right to score the pair `(user_a, user_b)`, where
/// `user_a < user_b`. Returns `None` when the pair is already scored or
/// being scored, which is how two phones reporting the same encounter end up
/// with exactly one evaluation.
///
/// Failed or abandoned evaluations can be reclaimed, and fizzled pairs are
/// re-scored once either profile changed after the verdict.
pub async fn claim(
    db: &PgPool,
    user_a: Uuid,
    user_b: Uuid,
    profiles_updated_at: DateTime<Utc>,
) -> sqlx::Result<Option<Uuid>> {
    sqlx::query_scalar!(
        r#"
        INSERT INTO encounters (user_a, user_b)
        VALUES ($1, $2)
        ON CONFLICT (user_a, user_b) DO UPDATE
        SET status = 'scoring', updated_at = now()
        WHERE encounters.status = 'failed'
           OR (encounters.status = 'scoring'
               AND encounters.updated_at < now() - INTERVAL '2 minutes')
           OR (encounters.status = 'fizzled' AND encounters.updated_at < $3)
        RETURNING id
        "#,
        user_a,
        user_b,
        profiles_updated_at
    )
    .fetch_optional(db)
    .await
}

pub async fn finish(db: &PgPool, id: Uuid, verdict: &Verdict<'_>) -> sqlx::Result<()> {
    sqlx::query!(
        r#"
        UPDATE encounters
        SET status = CASE WHEN $2 THEN 'sparked' ELSE 'fizzled' END,
            similarity = $3,
            score = $4,
            mode = $5,
            shared_interests = $6,
            reason = $7,
            icebreaker = $8,
            sparked_at = CASE WHEN $2 THEN now() END,
            updated_at = now()
        WHERE id = $1
        "#,
        id,
        verdict.sparked,
        verdict.similarity,
        verdict.score,
        verdict.mode,
        verdict.shared_interests,
        verdict.reason,
        verdict.icebreaker,
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn mark_failed(db: &PgPool, id: Uuid) -> sqlx::Result<()> {
    sqlx::query!(
        "UPDATE encounters SET status = 'failed', updated_at = now() WHERE id = $1",
        id
    )
    .execute(db)
    .await?;
    Ok(())
}

/// Sparks visible to `viewer`, newest first. `only` restricts to given ids.
pub async fn sparks_for(
    db: &PgPool,
    viewer: Uuid,
    only: Option<&[Uuid]>,
) -> sqlx::Result<Vec<SparkRow>> {
    sqlx::query_as!(
        SparkRow,
        r#"
        SELECT e.id,
               e.score AS "score!",
               e.mode AS "mode!",
               e.shared_interests,
               e.reason AS "reason!",
               e.icebreaker AS "icebreaker!",
               e.sparked_at AS "sparked_at!",
               (CASE WHEN e.user_a = $1 THEN e.a_waved_at ELSE e.b_waved_at END)
                   IS NOT NULL AS "waved!",
               (e.a_waved_at IS NOT NULL AND e.b_waved_at IS NOT NULL) AS "connected!",
               (CASE WHEN e.user_a = $1 THEN e.user_b ELSE e.user_a END) AS "other_id!",
               p.display_name AS "other_display_name?",
               p.bio AS "other_bio?",
               p.avatar_url AS "other_avatar_url?",
               p.interests AS "other_interests?"
        FROM encounters e
        LEFT JOIN profiles p
            ON p.id = (CASE WHEN e.user_a = $1 THEN e.user_b ELSE e.user_a END)
           AND e.a_waved_at IS NOT NULL
           AND e.b_waved_at IS NOT NULL
        WHERE (e.user_a = $1 OR e.user_b = $1)
          AND e.status = 'sparked'
          AND ($2::uuid[] IS NULL OR e.id = ANY($2))
        ORDER BY e.sparked_at DESC
        "#,
        viewer,
        only as Option<&[Uuid]>,
    )
    .fetch_all(db)
    .await
}

pub async fn spark_for(db: &PgPool, viewer: Uuid, id: Uuid) -> sqlx::Result<Option<SparkRow>> {
    Ok(sparks_for(db, viewer, Some(&[id]))
        .await?
        .into_iter()
        .next())
}

/// Marks every spark `viewer` hasn't been told about as delivered and
/// returns their ids.
pub async fn take_undelivered(db: &PgPool, viewer: Uuid) -> sqlx::Result<Vec<Uuid>> {
    sqlx::query_scalar!(
        r#"
        UPDATE encounters
        SET a_notified_at = CASE WHEN user_a = $1 THEN now() ELSE a_notified_at END,
            b_notified_at = CASE WHEN user_b = $1 THEN now() ELSE b_notified_at END
        WHERE status = 'sparked'
          AND ((user_a = $1 AND a_notified_at IS NULL)
               OR (user_b = $1 AND b_notified_at IS NULL))
        RETURNING id
        "#,
        viewer
    )
    .fetch_all(db)
    .await
}

pub async fn mark_delivered(db: &PgPool, id: Uuid, viewer: Uuid) -> sqlx::Result<()> {
    sqlx::query!(
        r#"
        UPDATE encounters
        SET a_notified_at = CASE WHEN user_a = $2 THEN now() ELSE a_notified_at END,
            b_notified_at = CASE WHEN user_b = $2 THEN now() ELSE b_notified_at END
        WHERE id = $1
        "#,
        id,
        viewer
    )
    .execute(db)
    .await?;
    Ok(())
}

pub struct Wave {
    pub connected: bool,
    pub other_id: Uuid,
}

/// Records `viewer`'s wave. Returns `None` if the spark doesn't exist for
/// them or they already waved, so callers can tell a fresh connection apart
/// from a repeated tap.
pub async fn wave(db: &PgPool, id: Uuid, viewer: Uuid) -> sqlx::Result<Option<Wave>> {
    sqlx::query_as!(
        Wave,
        r#"
        UPDATE encounters
        SET a_waved_at = CASE WHEN user_a = $2 THEN now() ELSE a_waved_at END,
            b_waved_at = CASE WHEN user_b = $2 THEN now() ELSE b_waved_at END
        WHERE id = $1
          AND status = 'sparked'
          AND ((user_a = $2 AND a_waved_at IS NULL)
               OR (user_b = $2 AND b_waved_at IS NULL))
        RETURNING (a_waved_at IS NOT NULL AND b_waved_at IS NOT NULL) AS "connected!",
                  (CASE WHEN user_a = $2 THEN user_b ELSE user_a END) AS "other_id!"
        "#,
        id,
        viewer
    )
    .fetch_optional(db)
    .await
}

/// The other participant of a connected spark, if `viewer` is in it.
pub async fn connected_peer(db: &PgPool, id: Uuid, viewer: Uuid) -> sqlx::Result<Option<Uuid>> {
    sqlx::query_scalar!(
        r#"
        SELECT (CASE WHEN user_a = $2 THEN user_b ELSE user_a END) AS "other_id!"
        FROM encounters
        WHERE id = $1
          AND status = 'sparked'
          AND (user_a = $2 OR user_b = $2)
          AND a_waved_at IS NOT NULL
          AND b_waved_at IS NOT NULL
        "#,
        id,
        viewer
    )
    .fetch_optional(db)
    .await
}
