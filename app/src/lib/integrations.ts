import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { api } from '@/lib/api';
import type { Provider } from '@/lib/types';

export const integrationsReturnUrl = Linking.createURL('integrations');

export const providerInfo: Record<Provider, { label: string; color: string; pitch: string }> = {
  spotify: {
    label: 'Spotify',
    color: '#1ED760',
    pitch: 'Your top artists and genres',
  },
  strava: {
    label: 'Strava',
    color: '#FC5200',
    pitch: 'The sports you actually do',
  },
};

export type ConnectResult = 'connected' | 'denied' | 'error' | 'cancelled';

export async function connectIntegration(provider: Provider): Promise<ConnectResult> {
  const { url } = await api.connectIntegration(provider, integrationsReturnUrl);
  const result = await WebBrowser.openAuthSessionAsync(url, integrationsReturnUrl);
  if (result.type !== 'success') {
    return 'cancelled';
  }
  const status = Linking.parse(result.url).queryParams?.status;
  return status === 'connected' || status === 'denied' ? status : 'error';
}
