use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct Integration {
    pub provider: String,
    pub summary: String,
    pub connected_at: DateTime<Utc>,
}

pub struct OAuthState {
    pub user_id: Uuid,
    pub provider: String,
    pub return_to: String,
}

pub async fn list(db: &PgPool, user_id: Uuid) -> sqlx::Result<Vec<Integration>> {
    sqlx::query_as!(
        Integration,
        r#"
        SELECT provider, summary, connected_at
        FROM integrations
        WHERE user_id = $1
        ORDER BY provider
        "#,
        user_id
    )
    .fetch_all(db)
    .await
}

pub async fn upsert(
    db: &PgPool,
    user_id: Uuid,
    provider: &str,
    summary: &str,
    data: &serde_json::Value,
) -> sqlx::Result<()> {
    sqlx::query!(
        r#"
        INSERT INTO integrations (user_id, provider, summary, data)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, provider) DO UPDATE
        SET summary = EXCLUDED.summary, data = EXCLUDED.data, connected_at = now()
        "#,
        user_id,
        provider,
        summary,
        data
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn delete(db: &PgPool, user_id: Uuid, provider: &str) -> sqlx::Result<bool> {
    let result = sqlx::query!(
        "DELETE FROM integrations WHERE user_id = $1 AND provider = $2",
        user_id,
        provider
    )
    .execute(db)
    .await?;
    Ok(result.rows_affected() == 1)
}

pub async fn create_state(
    db: &PgPool,
    state: &str,
    user_id: Uuid,
    provider: &str,
    return_to: &str,
) -> sqlx::Result<()> {
    sqlx::query!(
        r#"
        INSERT INTO oauth_states (state, user_id, provider, return_to, expires_at)
        VALUES ($1, $2, $3, $4, now() + INTERVAL '10 minutes')
        "#,
        state,
        user_id,
        provider,
        return_to
    )
    .execute(db)
    .await?;
    Ok(())
}

/// Consumes an OAuth state. Each state is single use.
pub async fn take_state(db: &PgPool, state: &str) -> sqlx::Result<Option<OAuthState>> {
    sqlx::query_as!(
        OAuthState,
        r#"
        DELETE FROM oauth_states
        WHERE state = $1 AND expires_at > now()
        RETURNING user_id, provider, return_to
        "#,
        state
    )
    .fetch_optional(db)
    .await
}
