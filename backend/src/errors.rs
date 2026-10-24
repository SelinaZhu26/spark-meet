use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("missing or invalid access token")]
    Unauthorized,

    #[error("{0} not found")]
    NotFound(&'static str),

    #[error("{0}")]
    BadRequest(String),

    #[error("{0}")]
    Conflict(&'static str),

    #[error("{0} is not configured on this server")]
    NotConfigured(&'static str),

    #[error("{service} request failed: {message}")]
    Upstream {
        service: &'static str,
        message: String,
    },

    #[error(transparent)]
    Database(#[from] sqlx::Error),

    #[error(transparent)]
    Http(#[from] reqwest::Error),

    #[error(transparent)]
    Io(#[from] std::io::Error),
}

impl AppError {
    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::BadRequest(message.into())
    }

    pub fn upstream(service: &'static str, message: impl Into<String>) -> Self {
        Self::Upstream {
            service,
            message: message.into(),
        }
    }

    fn status(&self) -> StatusCode {
        match self {
            Self::Unauthorized => StatusCode::UNAUTHORIZED,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::Conflict(_) => StatusCode::CONFLICT,
            Self::NotConfigured(_) => StatusCode::SERVICE_UNAVAILABLE,
            Self::Upstream { .. } | Self::Http(_) => StatusCode::BAD_GATEWAY,
            Self::Database(_) | Self::Io(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = self.status();
        // Never leak internals (SQL, upstream URLs) to clients; log them instead.
        let message = match &self {
            Self::Database(_) | Self::Io(_) => "internal server error".to_owned(),
            Self::Upstream { service, .. } => format!("{service} is unavailable right now"),
            Self::Http(_) => "an upstream service is unavailable right now".to_owned(),
            _ => self.to_string(),
        };
        if status.is_server_error() {
            tracing::error!(error = %self, "request failed");
        }
        (status, Json(json!({ "error": message }))).into_response()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("missing required environment variable {0}")]
    Missing(&'static str),

    #[error("invalid value {value:?} for environment variable {key}")]
    Invalid { key: &'static str, value: String },
}
