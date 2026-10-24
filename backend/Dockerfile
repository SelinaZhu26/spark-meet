FROM rust:1-bookworm AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY .sqlx .sqlx
COPY migrations migrations
COPY migrations_pings migrations_pings
COPY src src
ENV SQLX_OFFLINE=true
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/release/spark-backend /usr/local/bin/spark-backend
ENV BIND_ADDR=0.0.0.0:8080 AUDIO_CACHE_DIR=/app/cache
VOLUME /app/cache
EXPOSE 8080
CMD ["spark-backend"]
