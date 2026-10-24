use std::collections::HashMap;

use reqwest::Url;
use serde::{Deserialize, de::DeserializeOwned};
use serde_json::json;

use super::Snapshot;
use crate::{config::OAuthClient, errors::AppResult};

const AUTHORIZE_URL: &str = "https://accounts.spotify.com/authorize";
const TOKEN_URL: &str = "https://accounts.spotify.com/api/token";
const API_BASE: &str = "https://api.spotify.com/v1";
const SCOPES: &str = "user-top-read";

pub fn authorize_url(client: &OAuthClient, redirect_uri: &str, state: &str) -> String {
    Url::parse_with_params(
        AUTHORIZE_URL,
        [
            ("client_id", client.client_id.as_str()),
            ("response_type", "code"),
            ("redirect_uri", redirect_uri),
            ("scope", SCOPES),
            ("state", state),
        ],
    )
    .expect("Spotify authorize URL is valid")
    .into()
}

#[derive(Deserialize)]
struct Token {
    access_token: String,
}

#[derive(Deserialize)]
struct Page<T> {
    items: Vec<T>,
}

#[derive(Deserialize)]
struct Artist {
    name: String,
    #[serde(default)]
    genres: Vec<String>,
}

#[derive(Deserialize)]
struct Track {
    name: String,
    artists: Vec<ArtistRef>,
}

#[derive(Deserialize)]
struct ArtistRef {
    name: String,
}

pub async fn snapshot(
    http: &reqwest::Client,
    client: &OAuthClient,
    redirect_uri: &str,
    code: &str,
) -> AppResult<Snapshot> {
    let token = http
        .post(TOKEN_URL)
        .basic_auth(&client.client_id, Some(&client.client_secret))
        .form(&[
            ("grant_type", "authorization_code"),
            ("code", code),
            ("redirect_uri", redirect_uri),
        ])
        .send()
        .await?
        .error_for_status()?
        .json::<Token>()
        .await?
        .access_token;

    let (artists, tracks) = tokio::try_join!(
        get::<Page<Artist>>(
            http,
            &token,
            "/me/top/artists?limit=20&time_range=medium_term"
        ),
        get::<Page<Track>>(
            http,
            &token,
            "/me/top/tracks?limit=10&time_range=short_term"
        ),
    )?;

    let artist_names = artists
        .items
        .iter()
        .map(|artist| artist.name.as_str())
        .collect::<Vec<_>>();
    let genres = top_genres(&artists.items, 8);
    let tracks = tracks
        .items
        .iter()
        .map(|track| match track.artists.first() {
            Some(artist) => format!("\"{}\" by {}", track.name, artist.name),
            None => format!("\"{}\"", track.name),
        })
        .collect::<Vec<_>>();

    let mut summary = String::from("Spotify:");
    if artist_names.is_empty() && tracks.is_empty() {
        summary.push_str(" connected, but no listening history yet.");
    }
    if !artist_names.is_empty() {
        summary.push_str(&format!(
            " top artists {}.",
            artist_names[..artist_names.len().min(10)].join(", ")
        ));
    }
    if !genres.is_empty() {
        summary.push_str(&format!(" Favorite genres {}.", genres.join(", ")));
    }
    if !tracks.is_empty() {
        summary.push_str(&format!(
            " On repeat: {}.",
            tracks[..tracks.len().min(5)].join(", ")
        ));
    }

    Ok(Snapshot {
        summary,
        data: json!({ "top_artists": artist_names, "genres": genres, "top_tracks": tracks }),
    })
}

async fn get<T: DeserializeOwned>(http: &reqwest::Client, token: &str, path: &str) -> AppResult<T> {
    Ok(http
        .get(format!("{API_BASE}{path}"))
        .bearer_auth(token)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?)
}

/// Genres ranked by how many top artists share them, ties broken by the
/// rank of the first artist that has them.
fn top_genres(artists: &[Artist], limit: usize) -> Vec<String> {
    let mut counts: HashMap<&str, (usize, usize)> = HashMap::new();
    for (rank, artist) in artists.iter().enumerate() {
        for genre in &artist.genres {
            counts.entry(genre).or_insert((0, rank)).0 += 1;
        }
    }
    let mut genres = counts.into_iter().collect::<Vec<_>>();
    genres.sort_by(|(_, (count_a, rank_a)), (_, (count_b, rank_b))| {
        count_b.cmp(count_a).then(rank_a.cmp(rank_b))
    });
    genres
        .into_iter()
        .take(limit)
        .map(|(genre, _)| genre.to_owned())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn artist(genres: &[&str]) -> Artist {
        Artist {
            name: String::new(),
            genres: genres.iter().map(|genre| genre.to_string()).collect(),
        }
    }

    #[test]
    fn genres_rank_by_frequency_then_first_appearance() {
        let artists = [
            artist(&["shoegaze", "dream pop"]),
            artist(&["indie rock"]),
            artist(&["indie rock", "dream pop"]),
            artist(&["indie rock"]),
        ];
        assert_eq!(top_genres(&artists, 2), ["indie rock", "dream pop"]);
        assert_eq!(
            top_genres(&artists, 10),
            ["indie rock", "dream pop", "shoegaze"]
        );
    }
}
