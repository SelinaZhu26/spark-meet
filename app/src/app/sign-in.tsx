import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { rise } from '@/components/ui/rise';
import { AppText } from '@/components/ui/text';
import { WelcomeShapes } from '@/components/welcome-shapes';
import { Colors, Fonts, Radius, Spacing, Welcome } from '@/constants/theme';
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
    <LinearGradient colors={Welcome.gradient} style={styles.screen}>
      <StatusBar style="dark" />
      <WelcomeShapes />
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}>
          <Logo dark />
          <View style={styles.bottom}>
            <Animated.View entering={rise(0)}>
              <AppText variant="hero" tone="ink">
                your people are already nearby.
              </AppText>
            </Animated.View>
            <Animated.View entering={rise(1)} style={styles.form}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email"
                placeholderTextColor={PLACEHOLDER}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="password"
                placeholderTextColor={PLACEHOLDER}
                secureTextEntry
                autoComplete="password"
                style={styles.input}
              />
              <Button
                title="sign in"
                variant="dark"
                onPress={() => submit('sign-in')}
                loading={busy === 'sign-in'}
                disabled={!ready || busy !== null}
              />
              <Button
                title="create account"
                variant="light"
                onPress={() => submit('sign-up')}
                loading={busy === 'sign-up'}
                disabled={!ready || busy !== null}
              />
              {error && (
                <AppText tone="danger" style={styles.center}>
                  {error}
                </AppText>
              )}
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const PLACEHOLDER = 'rgba(34, 24, 42, 0.45)';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four - 2,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  bottom: {
    gap: Spacing.four,
  },
  form: {
    gap: Spacing.three - 4,
  },
  input: {
    height: 56,
    backgroundColor: Welcome.fill,
    borderRadius: Radius.medium - 2,
    borderWidth: 1,
    borderColor: Welcome.border,
    color: Colors.ink,
    fontFamily: Fonts.medium,
    fontSize: 20,
    paddingHorizontal: Spacing.three + 2,
  },
  center: {
    textAlign: 'center',
  },
});
