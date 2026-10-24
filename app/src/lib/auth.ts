import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

/** Must be in the Supabase project's redirect URL allowlist. */
export const authRedirectUrl = Linking.createURL('auth-callback');

const exchangedCodes = new Set<string>();

/**
 * Exchanges a Supabase PKCE code for a session. Safe to call twice with the
 * same code: on Android both the auth session and the deep link route may
 * see the redirect.
 */
export async function exchangeCode(code: string) {
  if (exchangedCodes.has(code)) {
    return;
  }
  exchangedCodes.add(code);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    throw error;
  }
}

async function completeAuthRedirect(url: string) {
  const { queryParams } = Linking.parse(url);
  if (typeof queryParams?.error_description === 'string') {
    throw new Error(queryParams.error_description);
  }
  if (typeof queryParams?.code === 'string') {
    await exchangeCode(queryParams.code);
  }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: authRedirectUrl, skipBrowserRedirect: true },
  });
  if (error) {
    throw error;
  }
  const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUrl);
  if (result.type === 'success') {
    await completeAuthRedirect(result.url);
  }
}

/** Email addresses get an email code, anything else is treated as a phone number. */
export type OtpTarget = { email: string } | { phone: string };

export function otpTarget(input: string): OtpTarget {
  const value = input.trim();
  return value.includes('@') ? { email: value } : { phone: value.replace(/[\s()-]/g, '') };
}

export async function sendOtp(target: OtpTarget) {
  const { error } = await supabase.auth.signInWithOtp(target);
  if (error) {
    throw error;
  }
}

export async function verifyOtp(target: OtpTarget, token: string) {
  const { error } =
    'email' in target
      ? await supabase.auth.verifyOtp({ email: target.email, token, type: 'email' })
      : await supabase.auth.verifyOtp({ phone: target.phone, token, type: 'sms' });
  if (error) {
    throw error;
  }
}
