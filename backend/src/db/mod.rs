pub mod encounters;
pub mod integrations;
pub mod messages;
pub mod pings;
pub mod profiles;

use sqlx::{PgPool, migrate::MigrateError};

/// Runs both migration sets. Each ignores the other's history entries so the
/// main and pings databases can be the same instance in development.
pub async fn migrate(db: &PgPool, pings_db: &PgPool) -> Result<(), MigrateError> {
    sqlx::migrate!("./migrations")
        .set_ignore_missing(true)
        .run(db)
        .await?;
    sqlx::migrate!("./migrations_pings")
        .set_ignore_missing(true)
        .run(pings_db)
        .await
}
