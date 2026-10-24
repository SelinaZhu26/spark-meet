//! Expo push notifications. Failures are logged, never fatal: the app also
//! picks up undelivered sparks on its next location ping.

use serde::Deserialize;
use serde_json::{Value, json};
use uuid::Uuid;

use crate::{db::profiles, state::AppState};

const EXPO_PUSH_URL: &str = "https://exp.host/--/api/v2/push/send";

pub struct Notification {
    pub title: String,
    pub body: String,
    pub data: Value,
}

/// Sends a notification to an Expo push token. Returns whether Expo
/// accepted it.
pub async fn send(http: &reqwest::Client, token: &str, notification: &Notification) -> bool {
    #[derive(Deserialize)]
    struct Response {
        data: Ticket,
    }
    #[derive(Deserialize)]
    struct Ticket {
        status: String,
        message: Option<String>,
    }

    let body = json!({
        "to": token,
        "title": notification.title,
        "body": notification.body,
        "data": notification.data,
        "sound": "default",
        "priority": "high",
    });
    let result = async {
        http.post(EXPO_PUSH_URL)
            .json(&body)
            .send()
            .await?
            .error_for_status()?
            .json::<Response>()
            .await
    }
    .await;

    match result {
        Ok(Response { data }) if data.status == "ok" => true,
        Ok(Response { data }) => {
            tracing::warn!(message = ?data.message, "Expo rejected push notification");
            false
        }
        Err(err) => {
            tracing::warn!(error = %err, "failed to send push notification");
            false
        }
    }
}

/// Sends a notification to a user if they registered a push token.
pub async fn send_to_user(state: &AppState, user_id: Uuid, notification: &Notification) -> bool {
    match profiles::push_token(&state.db, user_id).await {
        Ok(Some(token)) => send(&state.http, &token, notification).await,
        Ok(None) => false,
        Err(err) => {
            tracing::warn!(%user_id, error = %err, "failed to look up push token");
            false
        }
    }
}
