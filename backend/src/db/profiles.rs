use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct Profile {
    pub id: Uuid,
    pub display_name: String,
    pub bio: String,
    pub avatar_url: Option<String>,
    pub interests: Vec<String>,
    pub friends_enabled: bool,
    pub dating_enabled: bool,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct ProfileUpdate {
    pub display_name: String,
    pub bio: String,
    pub avatar_url: Option<String>,
    pub interests: Vec<String>,
    pub friends_enabled: bool,
    pub dating_enabled: bool,
}

/// What the matcher needs to know about a nearby user.
#[derive(Debug, Clone)]
pub struct Candidate {
    pub id: Uuid,
    pub friends_enabled: bool,
    pub dating_enabled: bool,
    pub embedding: Option<Vec<f32>>,
    pub push_token: Option<String>,
    pub updated_at: DateTime<Utc>,
}

/// Returns the user's profile, creating an empty one on first sight.
pub async fn ensure(db: &PgPool, id: Uuid) -> sqlx::Result<Profile> {
    sqlx::query!(
        "INSERT INTO profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
        id
    )
    .execute(db)
    .await?;
    get(db, id).await?.ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn get(db: &PgPool, id: Uuid) -> sqlx::Result<Option<Profile>> {
    sqlx::query_as!(
        Profile,
        r#"
        SELECT id, display_name, bio, avatar_url, interests, friends_enabled,
               dating_enabled, active, created_at, updated_at
        FROM profiles
        WHERE id = $1
        "#,
        id
    )
    .fetch_optional(db)
    .await
}

pub async fn update(db: &PgPool, id: Uuid, update: &ProfileUpdate) -> sqlx::Result<Profile> {
    sqlx::query_as!(
        Profile,
        r#"
        INSERT INTO profiles (id, display_name, bio, avatar_url, interests,
                              friends_enabled, dating_enabled)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            bio = EXCLUDED.bio,
            avatar_url = EXCLUDED.avatar_url,
            interests = EXCLUDED.interests,
            friends_enabled = EXCLUDED.friends_enabled,
            dating_enabled = EXCLUDED.dating_enabled,
            updated_at = CASE
                WHEN (profiles.bio, profiles.interests, profiles.friends_enabled,
                      profiles.dating_enabled)
                     IS DISTINCT FROM (EXCLUDED.bio, EXCLUDED.interests,
                                       EXCLUDED.friends_enabled, EXCLUDED.dating_enabled)
                THEN now()
                ELSE profiles.updated_at
            END
        RETURNING id, display_name, bio, avatar_url, interests, friends_enabled,
                  dating_enabled, active, created_at, updated_at
        "#,
        id,
        update.display_name,
        update.bio,
        update.avatar_url,
        &update.interests,
        update.friends_enabled,
        update.dating_enabled,
    )
    .fetch_one(db)
    .await
}

pub async fn set_active(db: &PgPool, id: Uuid, active: bool) -> sqlx::Result<Option<Profile>> {
    sqlx::query_as!(
        Profile,
        r#"
        UPDATE profiles
        SET active = $2
        WHERE id = $1
        RETURNING id, display_name, bio, avatar_url, interests, friends_enabled,
                  dating_enabled, active, created_at, updated_at
        "#,
        id,
        active
    )
    .fetch_optional(db)
    .await
}

/// Stores a device's push token, taking it away from any other account that
/// signed in on the same device before.
pub async fn set_push_token(db: &PgPool, id: Uuid, token: Option<&str>) -> sqlx::Result<bool> {
    let mut tx = db.begin().await?;
    if let Some(token) = token {
        sqlx::query!(
            "UPDATE profiles SET push_token = NULL WHERE push_token = $1 AND id <> $2",
            token,
            id
        )
        .execute(&mut *tx)
        .await?;
    }
    let result = sqlx::query!(
        "UPDATE profiles SET push_token = $2 WHERE id = $1",
        id,
        token
    )
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    Ok(result.rows_affected() == 1)
}

pub async fn push_token(db: &PgPool, id: Uuid) -> sqlx::Result<Option<String>> {
    let token = sqlx::query_scalar!("SELECT push_token FROM profiles WHERE id = $1", id)
        .fetch_optional(db)
        .await?;
    Ok(token.flatten())
}

pub async fn set_embedding(db: &PgPool, id: Uuid, embedding: &[f32]) -> sqlx::Result<()> {
    sqlx::query!(
        "UPDATE profiles SET embedding = $2 WHERE id = $1",
        id,
        embedding
    )
    .execute(db)
    .await?;
    Ok(())
}

/// Marks match-relevant content as changed.
pub async fn touch(db: &PgPool, id: Uuid) -> sqlx::Result<()> {
    sqlx::query!("UPDATE profiles SET updated_at = now() WHERE id = $1", id)
        .execute(db)
        .await?;
    Ok(())
}

/// Active users among `ids`, ready to be matched.
pub async fn active_candidates(db: &PgPool, ids: &[Uuid]) -> sqlx::Result<Vec<Candidate>> {
    sqlx::query_as!(
        Candidate,
        r#"
        SELECT id, friends_enabled, dating_enabled, embedding, push_token, updated_at
        FROM profiles
        WHERE id = ANY($1) AND active AND display_name <> ''
        "#,
        ids
    )
    .fetch_all(db)
    .await
}
