use reqwest::Url;
use serde::Deserialize;
use serde_json::json;

use super::Snapshot;
use crate::{config::OAuthClient, errors::AppResult};

const AUTHORIZE_URL: &str = "https://www.strava.com/oauth/authorize";
const TOKEN_URL: &str = "https://www.strava.com/oauth/token";
const API_BASE: &str = "https://www.strava.com/api/v3";
const SCOPES: &str = "read,activity:read";

pub fn authorize_url(client: &OAuthClient, redirect_uri: &str, state: &str) -> String {
    Url::parse_with_params(
        AUTHORIZE_URL,
        [
            ("client_id", client.client_id.as_str()),
            ("redirect_uri", redirect_uri),
            ("response_type", "code"),
            ("approval_prompt", "auto"),
            ("scope", SCOPES),
            ("state", state),
        ],
    )
    .expect("Strava authorize URL is valid")
    .into()
}

#[derive(Deserialize)]
struct Token {
    access_token: String,
}

#[derive(Deserialize)]
struct Activity {
    sport_type: String,
    #[serde(default)]
    distance: f64,
}

/// Activity counts and distance per sport, most frequent first.
#[derive(Debug, PartialEq)]
struct SportTotal {
    sport: String,
    count: usize,
    km: f64,
}

pub async fn snapshot(
    http: &reqwest::Client,
    client: &OAuthClient,
    code: &str,
) -> AppResult<Snapshot> {
    let token = http
        .post(TOKEN_URL)
        .form(&[
            ("client_id", client.client_id.as_str()),
            ("client_secret", client.client_secret.as_str()),
            ("code", code),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await?
        .error_for_status()?
        .json::<Token>()
        .await?
        .access_token;

    let activities = http
        .get(format!("{API_BASE}/athlete/activities"))
        .query(&[("per_page", "100")])
        .bearer_auth(&token)
        .send()
        .await?
        .error_for_status()?
        .json::<Vec<Activity>>()
        .await?;

    let totals = sport_totals(&activities);
    let summary = if totals.is_empty() {
        "Strava: connected, but no recent activities.".to_owned()
    } else {
        let sports = totals
            .iter()
            .take(5)
            .map(|total| match total.km {
                km if km >= 1.0 => format!("{} ×{} ({km:.0} km)", total.sport, total.count),
                _ => format!("{} ×{}", total.sport, total.count),
            })
            .collect::<Vec<_>>();
        format!(
            "Strava, last {} activities: {}.",
            activities.len(),
            sports.join(", ")
        )
    };

    Ok(Snapshot {
        summary,
        data: json!({
            "activities": activities.len(),
            "sports": totals
                .iter()
                .map(|total| json!({ "sport": total.sport, "count": total.count, "km": total.km }))
                .collect::<Vec<_>>(),
        }),
    })
}

fn sport_totals(activities: &[Activity]) -> Vec<SportTotal> {
    let mut totals: Vec<SportTotal> = Vec::new();
    for activity in activities {
        let sport = humanize(&activity.sport_type);
        match totals.iter_mut().find(|total| total.sport == sport) {
            Some(total) => {
                total.count += 1;
                total.km += activity.distance / 1000.0;
            }
            None => totals.push(SportTotal {
                sport,
                count: 1,
                km: activity.distance / 1000.0,
            }),
        }
    }
    // Stable sort keeps first-seen order (most recent) among ties.
    totals.sort_by_key(|total| std::cmp::Reverse(total.count));
    totals
}

/// "MountainBikeRide" -> "Mountain Bike Ride".
fn humanize(sport_type: &str) -> String {
    let mut out = String::with_capacity(sport_type.len() + 4);
    for (i, ch) in sport_type.chars().enumerate() {
        if i > 0 && ch.is_uppercase() {
            out.push(' ');
        }
        out.push(ch);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn activity(sport_type: &str, distance: f64) -> Activity {
        Activity {
            sport_type: sport_type.to_owned(),
            distance,
        }
    }

    #[test]
    fn totals_group_by_sport_most_frequent_first() {
        let totals = sport_totals(&[
            activity("Ride", 30_000.0),
            activity("TrailRun", 8_000.0),
            activity("TrailRun", 12_000.0),
            activity("Yoga", 0.0),
        ]);
        assert_eq!(
            totals,
            [
                SportTotal {
                    sport: "Trail Run".into(),
                    count: 2,
                    km: 20.0
                },
                SportTotal {
                    sport: "Ride".into(),
                    count: 1,
                    km: 30.0
                },
                SportTotal {
                    sport: "Yoga".into(),
                    count: 1,
                    km: 0.0
                },
            ]
        );
    }

    #[test]
    fn humanizes_camel_case_sport_types() {
        assert_eq!(humanize("MountainBikeRide"), "Mountain Bike Ride");
        assert_eq!(humanize("Run"), "Run");
    }
}
