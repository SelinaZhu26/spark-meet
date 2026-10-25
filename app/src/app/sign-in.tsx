import { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sparkler } from '@/components/sparkler';
import { Button } from '@/components/ui/button';
import { rise } from '@/components/ui/rise';
import { AppText } from '@/components/ui/text';
import { Fonts, Spacing } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { themedStyles, useColors } from '@/lib/appearance';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const colors = useColors();
  const styles = useStyles();
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
        <Animated.View entering={FadeIn.duration(1200)} style={styles.hero}>
          <Sparkler size={300} lit={1} />
        </Animated.View>
        <View style={styles.bottom}>
          <Animated.View entering={rise(0)}>
            <AppText style={styles.wordmark}>spark</AppText>
            <AppText variant="hero">your people are already nearby.</AppText>
          </Animated.View>
          <Animated.View entering={rise(1)} style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email"
              placeholderTextColor={colors.textMuted}
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
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoComplete="password"
              style={styles.input}
            />
            <View style={styles.buttons}>
              <Button
                title="sign in"
                onPress={() => submit('sign-in')}
                loading={busy === 'sign-in'}
                disabled={!ready || busy !== null}
              />
              <Button
                title="create account"
                variant="ghost"
                onPress={() => submit('sign-up')}
                loading={busy === 'sign-up'}
                disabled={!ready || busy !== null}
              />
            </View>
            {error && (
              <AppText tone="danger" style={styles.center}>
                {error}
              </AppText>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    gap: Spacing.four,
  },
  wordmark: {
    fontFamily: Fonts.semiBoldItalic,
    fontSize: 22,
    lineHeight: 28,
    color: colors.accent,
    marginBottom: Spacing.one,
  },
  form: {
    gap: Spacing.two,
  },
  input: {
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
    color: colors.text,
    fontFamily: Fonts.regular,
    fontSize: 20,
  },
  buttons: {
    gap: Spacing.three - 4,
    marginTop: Spacing.four - 4,
  },
  center: {
    textAlign: 'center',
  },
}));
