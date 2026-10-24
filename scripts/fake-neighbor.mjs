#!/usr/bin/env node
// A fake second user, for testing Spark with one phone.
//
//   node scripts/fake-neighbor.mjs <latitude> <longitude> [--interests "Bouldering,Jazz"]
//
// Signs in (or signs up) a bot account, gives it a profile, switches Spark on
// and pings from the given spot every 20 s. It waves at every spark it gets
// and replies to chat messages. Ctrl+C switches it off again.
//
// Reads EXPO_PUBLIC_* from app/.env; BOT_EMAIL / BOT_PASSWORD override the
// bot account.

import { readFileSync } from 'node:fs';

const env = { ...readEnv(new URL('../app/.env', import.meta.url)), ...process.env };
const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const API_URL = (env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const EMAIL = env.BOT_EMAIL ?? 'neighbor@spark-bot.dev';
const PASSWORD = env.BOT_PASSWORD ?? 'spark-neighbor-bot';
const PING_MS = 20_000;

const args = process.argv.slice(2);
const [latitude, longitude] = args.slice(0, 2).map(Number);
const interestsFlag = args.indexOf('--interests');
const interests =
  interestsFlag >= 0
    ? args[interestsFlag + 1].split(',').map((interest) => interest.trim())
    : ['Bouldering', 'Indie music', 'Coffee', 'Startups', 'AI', 'Hiking'];

if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
  console.error('usage: node scripts/fake-neighbor.mjs <latitude> <longitude> [--interests "a,b,c"]');
  process.exit(1);
}

let token = await signIn();
const seenMessages = new Map();

await api('PUT', '/me', {
  display_name: 'Robo',
  bio: 'A friendly test neighbor. Loves whatever you love.',
  avatar_url: null,
  interests,
  friends_enabled: true,
  dating_enabled: false,
});
await api('POST', '/presence', { active: true });
console.log(`🤖 ${EMAIL} is on at ${latitude}, ${longitude} with interests: ${interests.join(', ')}`);

process.on('SIGINT', async () => {
  await api('POST', '/presence', { active: false }).catch(() => {});
  console.log('\n🤖 switched off');
  process.exit(0);
});

while (true) {
  await tick().catch((error) => console.error('🤖', error.message));
  await new Promise((resolve) => setTimeout(resolve, PING_MS));
}

async function tick() {
  const { sparks } = await api('POST', '/presence/ping', { latitude, longitude, accuracy: 5 });
  for (const spark of sparks) {
    console.log(`⚡ spark ${spark.id} (${spark.score}%): ${spark.reason}`);
    await api('POST', `/sparks/${spark.id}/wave`);
    console.log('👋 waved back');
  }

  for (const spark of await api('GET', '/sparks')) {
    if (!spark.connected) continue;
    const after = seenMessages.get(spark.id) ?? 0;
    for (const message of await api('GET', `/sparks/${spark.id}/messages?after=${after}`)) {
      seenMessages.set(spark.id, message.id);
      if (message.from_me) continue;
      console.log(`💬 ${spark.other.display_name}: ${message.body}`);
      await api('POST', `/sparks/${spark.id}/messages`, {
        body: `🤖 beep boop, you said "${message.body}"`,
      });
    }
  }
}

async function api(method, path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) {
    token = await signIn();
    return api(method, path, body);
  }
  if (!response.ok) {
    throw new Error(`${method} ${path} → ${response.status} ${await response.text()}`);
  }
  return response.status === 204 ? undefined : response.json();
}

async function signIn() {
  const auth = (path) =>
    fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    }).then((response) => response.json());

  let session = await auth('token?grant_type=password');
  if (!session.access_token) {
    session = await auth('signup');
  }
  if (!session.access_token) {
    throw new Error(
      `Supabase sign-in failed (is "Confirm email" off?): ${JSON.stringify(session)}`
    );
  }
  return session.access_token;
}

function readEnv(url) {
  try {
    return Object.fromEntries(
      readFileSync(url, 'utf8')
        .split('\n')
        .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
        .filter(Boolean)
        .map(([, key, value]) => [key, value])
    );
  } catch {
    return {};
  }
}
