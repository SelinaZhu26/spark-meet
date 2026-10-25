import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/ornament';
import { AppText } from '@/components/ui/text';
import { Colors, Gradients, Radius, Spacing } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';

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
    <LinearGradient colors={Gradients.sky} style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}>
          <View style={styles.hero}>
            <AppText tone="brass" style={styles.glyph}>
              ✦
            </AppText>
            <AppText variant="display">Spark</AppText>
            <Divider style={styles.divider} />
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
              icon="confirm"
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.four,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  glyph: {
    fontSize: 48,
    lineHeight: 56,
  },
  divider: {
    width: 200,
  },
  tagline: {
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: {
    gap: Spacing.three,
  },
  input: {
    backgroundColor: `${Colors.background}CC`,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: `${Colors.brass}59`,
    color: Colors.text,
    fontSize: 16,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
});
