mod audio;
mod health;
mod integrations;
mod me;
mod presence;
mod sparks;

use axum::{
    Router,
    routing::{delete, get, post, put},
};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

use crate::state::AppState;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health::health))
        .route("/me", get(me::get_me).put(me::update_me))
        .route("/me/push-token", put(me::set_push_token))
        .route("/presence", post(presence::set_presence))
        .route("/presence/ping", post(presence::ping))
        .route("/sparks", get(sparks::list))
        .route("/sparks/{id}", get(sparks::get))
        .route("/sparks/{id}/wave", post(sparks::wave))
        .route(
            "/sparks/{id}/messages",
            get(sparks::list_messages).post(sparks::send_message),
        )
        .route("/sparks/{id}/icebreaker.mp3", get(audio::icebreaker))
        .route("/audio/spark.mp3", get(audio::spark_buzz))
        .route("/integrations/{provider}", delete(integrations::disconnect))
        .route(
            "/integrations/{provider}/connect",
            get(integrations::connect),
        )
        .route(
            "/integrations/{provider}/callback",
            get(integrations::callback),
        )
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(state)
}
