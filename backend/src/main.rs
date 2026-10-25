mod auth;
mod config;
mod db;
mod errors;
mod routes;
mod services;
mod state;

use std::time::Duration;

use sqlx::{PgPool, postgres::PgPoolOptions};
use tokio::net::TcpListener;
use tracing_subscriber::EnvFilter;

use crate::{config::Config, state::AppState};

const PRUNE_INTERVAL: Duration = Duration::from_secs(10 * 60);

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "spark_backend=debug,tower_http=info".into()),
        )
        .init();

    let config = Config::from_env()?;
    let db = connect(&config.database_url).await?;
    let pings_db = if config.pings_database_url == config.database_url {
        db.clone()
    } else {
        connect(&config.pings_database_url).await?
    };

    tokio::spawn(prune_pings(pings_db.clone()));

    let bind_addr = config.bind_addr;
    let app = routes::router(AppState::new(config, db, pings_db));
    let listener = TcpListener::bind(bind_addr).await?;
    tracing::info!(%bind_addr, "spark backend listening");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

async fn connect(url: &str) -> sqlx::Result<PgPool> {
    PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(Duration::from_secs(10))
        .connect(url)
        .await
}

async fn prune_pings(pings_db: PgPool) {
    let mut interval = tokio::time::interval(PRUNE_INTERVAL);
    loop {
        interval.tick().await;
        match db::pings::prune(&pings_db).await {
            Ok(0) => {}
            Ok(pruned) => tracing::debug!(pruned, "pruned old location pings"),
            Err(err) => tracing::warn!(error = %err, "failed to prune location pings"),
        }
    }
}

async fn shutdown_signal() {
    if let Err(err) = tokio::signal::ctrl_c().await {
        tracing::error!(error = %err, "failed to listen for shutdown signal");
    }
}
