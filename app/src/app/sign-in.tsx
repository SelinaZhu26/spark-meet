import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Colors, Pastels, Radius, Spacing } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';

/** Example sparks fanned out behind the wordmark. */
const FAN = [
  { title: 'Jazz & Film', when: '3m ago', color: Pastels.dating[1], rotate: '-12deg', left: 0 },
  { title: 'Startups & AI', when: 'Just now', color: Pastels.friends[1], rotate: '10deg', left: 120 },
  { title: 'Bouldering & Coffee', when: 'Just now', color: Pastels.friends[0], rotate: '-2deg', left: 60 },
] as const;

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'sign-in' | 'sign-up' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // With "Confirm email" off in Supabase, both return a session right away.
  const submit = async (action: 'sign-in' | 'sign-up') => {
    setBusy(action);
    setError(null);
    const credentials = { email: email.trim(), password };
    const { data, error: authError } =
      action === 'sign-in'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);
    if (authError) {
      setError(errorMessage(authError));
    } else if (!data.session) {
      setError('Account created, but Supabase wants email confirmation. Turn off "Confirm email".');
    }
    setBusy(null);
  };

  const ready = email.includes('@') && password.length >= 6;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.fan}>
            {FAN.map((card) => (
              <View
                key={card.title}
                style={[
                  styles.fanCard,
                  { backgroundColor: card.color, left: card.left, transform: [{ rotate: card.rotate }] },
                ]}>
                <AppText variant="caption" tone="ink">
                  {card.when}
                </AppText>
                <AppText variant="heading" tone="ink">
                  {card.title}
                </AppText>
              </View>
            ))}
          </View>
          <AppText variant="display">spark</AppText>
          <AppText tone="secondary" style={styles.tagline}>
            The people you&apos;d click with are already around you. Spark buzzes when one walks by.
          </AppText>
        </View>

        <View style={styles.actions}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password (6+ characters)"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            autoComplete="password"
            style={styles.input}
          />
          <Button
            title="Sign in"
            onPress={() => submit('sign-in')}
            loading={busy === 'sign-in'}
            disabled={!ready || busy !== null}
          />
          <Button
            title="Create account"
            variant="secondary"
            onPress={() => submit('sign-up')}
            loading={busy === 'sign-up'}
            disabled={!ready || busy !== null}
          />
          {error && (
            <AppText tone="danger" style={styles.center}>
              {error}
            </AppText>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  fan: {
    width: 260,
    height: 210,
    marginBottom: Spacing.two,
  },
  fanCard: {
    position: 'absolute',
    top: 10,
    width: 140,
    height: 180,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  tagline: {
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: {
    gap: Spacing.three,
  },
  input: {
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radius.pill,
    color: Colors.text,
    fontSize: 16,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
});
