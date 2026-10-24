import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Colors, Gradients, Radius, Spacing } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { otpTarget, sendOtp, signInWithGoogle, verifyOtp, type OtpTarget } from '@/lib/auth';

export default function SignIn() {
  const [contact, setContact] = useState('');
  const [target, setTarget] = useState<OtpTarget | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'google' | 'send' | 'verify' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: 'google' | 'send' | 'verify', task: () => Promise<void>) => {
    setBusy(action);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const send = () =>
    run('send', async () => {
      const next = otpTarget(contact);
      await sendOtp(next);
      setTarget(next);
    });

  const verify = () => run('verify', () => verifyOtp(target!, code.trim()));

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}>
        <View style={styles.hero}>
          <LinearGradient colors={Gradients.ember} style={styles.logo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <AppText style={styles.bolt}>⚡</AppText>
          </LinearGradient>
          <AppText variant="display">spark</AppText>
          <AppText tone="secondary" style={styles.tagline}>
            The people you&apos;d click with are already around you. Spark buzzes when one walks by.
          </AppText>
        </View>

        <View style={styles.actions}>
          {target ? (
            <>
              <AppText tone="secondary">
                Enter the code we sent to {'email' in target ? target.email : target.phone}.
              </AppText>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={8}
                style={[styles.input, styles.code]}
              />
              <Button title="Verify" onPress={verify} loading={busy === 'verify'} disabled={code.trim().length < 6} />
              <Button title="Use something else" variant="ghost" onPress={() => setTarget(null)} />
            </>
          ) : (
            <>
              <Button
                title="Continue with Google"
                variant="secondary"
                onPress={() => run('google', signInWithGoogle)}
                loading={busy === 'google'}
              />
              <View style={styles.divider}>
                <View style={styles.rule} />
                <AppText variant="caption" tone="muted">
                  or
                </AppText>
                <View style={styles.rule} />
              </View>
              <TextInput
                value={contact}
                onChangeText={setContact}
                placeholder="Email or phone (+1 555 123 4567)"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />
              <Button title="Send me a code" onPress={send} loading={busy === 'send'} disabled={!contact.trim()} />
            </>
          )}
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
    padding: Spacing.four,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  bolt: {
    fontSize: 60,
    lineHeight: 72,
  },
  tagline: {
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: {
    gap: Spacing.three,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 16,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  code: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
  },
  center: {
    textAlign: 'center',
  },
});
