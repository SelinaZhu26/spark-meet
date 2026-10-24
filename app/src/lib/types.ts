/** Mirrors the backend's JSON payloads. */

export type Mode = 'friends' | 'dating';

export type Provider = 'spotify' | 'strava';

export type Profile = {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  interests: string[];
  friends_enabled: boolean;
  dating_enabled: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileInput = Pick<
  Profile,
  'display_name' | 'bio' | 'avatar_url' | 'interests' | 'friends_enabled' | 'dating_enabled'
>;

export type Integration = {
  provider: Provider;
  summary: string;
  connected_at: string;
};

export type Me = {
  profile: Profile;
  integrations: Integration[];
  available_integrations: Provider[];
};

export type PeerProfile = {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  interests: string[];
};

export type Spark = {
  id: string;
  score: number;
  mode: Mode;
  shared_interests: string[];
  reason: string;
  icebreaker: string;
  sparked_at: string;
  /** Whether you waved. Whether they waved stays secret until both do. */
  waved: boolean;
  connected: boolean;
  /** Only present once both people waved. */
  other: PeerProfile | null;
};

export type Message = {
  id: number;
  from_me: boolean;
  body: string;
  created_at: string;
};
