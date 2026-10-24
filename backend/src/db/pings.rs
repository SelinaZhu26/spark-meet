//! Location pings in Tiger Data. Coordinates go in, user ids come out;
//! nothing here ever returns a location.

use sqlx::PgPool;
use uuid::Uuid;

pub async fn record(
    db: &PgPool,
    user_id: Uuid,
    latitude: f64,
    longitude: f64,
    accuracy_m: Option<f32>,
) -> sqlx::Result<()> {
    sqlx::query!(
        r#"
        INSERT INTO location_pings (user_id, location, accuracy_m)
        VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4)
        "#,
        user_id,
        longitude,
        latitude,
        accuracy_m
    )
    .execute(db)
    .await?;
    Ok(())
}

/// Users other than `user_id` who pinged within `radius_m` of the given point
/// in the last `window_secs` seconds.
pub async fn nearby(
    db: &PgPool,
    user_id: Uuid,
    latitude: f64,
    longitude: f64,
    radius_m: f64,
    window_secs: f64,
) -> sqlx::Result<Vec<Uuid>> {
    sqlx::query_scalar!(
        r#"
        SELECT DISTINCT user_id
        FROM location_pings
        WHERE recorded_at > now() - make_interval(secs => $5)
          AND user_id <> $1
          AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $4)
        "#,
        user_id,
        longitude,
        latitude,
        radius_m,
        window_secs
    )
    .fetch_all(db)
    .await
}

/// Deletes all of a user's pings, e.g. when they switch Spark off.
pub async fn forget(db: &PgPool, user_id: Uuid) -> sqlx::Result<()> {
    sqlx::query!("DELETE FROM location_pings WHERE user_id = $1", user_id)
        .execute(db)
        .await?;
    Ok(())
}

/// Deletes pings older than an hour. Redundant with the TimescaleDB
/// retention policy, but keeps plain Postgres deployments tidy too.
pub async fn prune(db: &PgPool) -> sqlx::Result<u64> {
    let result =
        sqlx::query!("DELETE FROM location_pings WHERE recorded_at < now() - INTERVAL '1 hour'")
            .execute(db)
            .await?;
    Ok(result.rows_affected())
}
