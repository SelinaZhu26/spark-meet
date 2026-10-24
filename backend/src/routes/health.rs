use axum::{Json, extract::State};
use serde_json::{Value, json};

use crate::{errors::AppResult, state::AppState};

pub async fn health(State(state): State<AppState>) -> AppResult<Json<Value>> {
    sqlx::query_scalar!("SELECT 1 AS \"one!\"")
        .fetch_one(&state.db)
        .await?;
    sqlx::query_scalar!("SELECT 1 AS \"one!\"")
        .fetch_one(&state.pings_db)
        .await?;
    Ok(Json(json!({ "status": "ok" })))
}
