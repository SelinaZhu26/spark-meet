export const SUGGESTED_INTERESTS = [
  { name: 'Bouldering', emoji: '🧗' },
  { name: 'Running', emoji: '🏃' },
  { name: 'Cycling', emoji: '🚴' },
  { name: 'Hiking', emoji: '🥾' },
  { name: 'Yoga', emoji: '🧘' },
  { name: 'Tennis', emoji: '🎾' },
  { name: 'Board games', emoji: '🎲' },
  { name: 'Chess', emoji: '♟️' },
  { name: 'Gaming', emoji: '🎮' },
  { name: 'Anime', emoji: '🍥' },
  { name: 'Indie music', emoji: '🎸' },
  { name: 'Jazz', emoji: '🎷' },
  { name: 'Hip-hop', emoji: '🎤' },
  { name: 'Photography', emoji: '📷' },
  { name: 'Film', emoji: '🎬' },
  { name: 'Reading', emoji: '📚' },
  { name: 'Cooking', emoji: '🍳' },
  { name: 'Coffee', emoji: '☕' },
  { name: 'Startups', emoji: '🚀' },
  { name: 'AI', emoji: '🤖' },
  { name: 'Open source', emoji: '💻' },
  { name: 'Design', emoji: '🎨' },
  { name: 'Thrifting', emoji: '🧥' },
  { name: 'Travel', emoji: '✈️' },
] as const;

export const MAX_INTERESTS = 20;

export function sameInterest(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

export function isSuggested(interest: string) {
  return SUGGESTED_INTERESTS.some((suggested) => sameInterest(suggested.name, interest));
}

/** Toggles an interest, ignoring case and capping the list at MAX_INTERESTS. */
export function toggleInterest(interests: string[], interest: string): string[] {
  if (interests.some((existing) => sameInterest(existing, interest))) {
    return interests.filter((existing) => !sameInterest(existing, interest));
  }
  return interests.length < MAX_INTERESTS ? [...interests, interest] : interests;
}

/** Trims and collapses whitespace in a typed interest. */
export function cleanInterest(text: string) {
  return text.trim().replace(/\s+/g, ' ');
}
