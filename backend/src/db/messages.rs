use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct Message {
    pub id: i64,
    pub from_me: bool,
    pub body: String,
    pub created_at: DateTime<Utc>,
}

/// Messages of an encounter after `after_id`, oldest first.
pub async fn list(
    db: &PgPool,
    encounter_id: Uuid,
    viewer: Uuid,
    after_id: i64,
) -> sqlx::Result<Vec<Message>> {
    sqlx::query_as!(
        Message,
        r#"
        SELECT id, sender_id = $2 AS "from_me!", body, created_at
        FROM messages
        WHERE encounter_id = $1 AND id > $3
        ORDER BY id
        LIMIT 200
        "#,
        encounter_id,
        viewer,
        after_id
    )
    .fetch_all(db)
    .await
}

pub async fn create(
    db: &PgPool,
    encounter_id: Uuid,
    sender: Uuid,
    body: &str,
) -> sqlx::Result<Message> {
    sqlx::query_as!(
        Message,
        r#"
        INSERT INTO messages (encounter_id, sender_id, body)
        VALUES ($1, $2, $3)
        RETURNING id, TRUE AS "from_me!", body, created_at
        "#,
        encounter_id,
        sender,
        body
    )
    .fetch_one(db)
    .await
}
