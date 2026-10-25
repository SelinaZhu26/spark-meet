import { supabase } from '@/lib/supabase';
import type { Me, Message, Profile, ProfileInput, Provider, Spark } from '@/lib/types';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  ''
);

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new ApiError(401, 'You are signed out.');
  }
  return token;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${await accessToken()}` };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(response.status, payload?.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export const api = {
  me: () => request<Me>('GET', '/me'),
  updateMe: (input: ProfileInput) => request<Me>('PUT', '/me', input),
  setPushToken: (token: string | null) => request<void>('PUT', '/me/push-token', { token }),
  setPresence: (active: boolean) => request<Profile>('POST', '/presence', { active }),
  ping: (coordinates: Coordinates) =>
    request<{ sparks: Spark[] }>('POST', '/presence/ping', coordinates),
  sparks: () => request<Spark[]>('GET', '/sparks'),
  spark: (id: string) => request<Spark>('GET', `/sparks/${id}`),
  wave: (id: string) => request<Spark>('POST', `/sparks/${id}/wave`),
  messages: (id: string, after = 0) =>
    request<Message[]>('GET', `/sparks/${id}/messages?after=${after}`),
  sendMessage: (id: string, body: string) =>
    request<Message>('POST', `/sparks/${id}/messages`, { body }),
  connectIntegration: (provider: Provider, returnTo: string) =>
    request<{ url: string }>(
      'GET',
      `/integrations/${provider}/connect?return_to=${encodeURIComponent(returnTo)}`
    ),
  disconnectIntegration: (provider: Provider) =>
    request<void>('DELETE', `/integrations/${provider}`),
};

export const buzzUrl = `${API_URL}/audio/spark.mp3`;

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}
