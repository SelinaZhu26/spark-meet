import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SparkOrb } from '@/components/spark-orb';
import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { errorMessage } from '@/lib/api';
import { startPresence, stopPresence, type PresenceMode } from '@/lib/presence';
import { useMe, useSession } from '@/lib/session';

export default function Home() {
  const { refreshMe } = useSession();
  const { profile } = useMe();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<PresenceMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = profile.active;

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (active) {
        await stopPresence();
        setMode(null);
      } else {
        setMode(await startPresence());
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      await refreshMe();
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="label" tone="ember">
          spark
        </AppText>
        <AppText variant="title">Hey {profile.display_name}</AppText>
      </View>

      <View style={styles.center}>
        <SparkOrb active={active} busy={busy} onPress={toggle} />
        <AppText variant="heading" style={styles.status}>
          {active ? 'Looking for your people nearby…' : 'Spark is off'}
        </AppText>
        <AppText tone="secondary" style={styles.status}>
          {active
            ? "Put your phone away. We'll buzz you when someone who shares your interests is within a few steps."
            : 'Switch on and walk around. When someone you’d click with is close, both your phones buzz.'}
        </AppText>
        {active && mode === 'foreground' && (
          <AppText variant="caption" tone="muted" style={styles.status}>
            Keep Spark open: background mode needs a development build.
          </AppText>
        )}
        {error && (
          <AppText tone="danger" style={styles.status}>
            {error}
          </AppText>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.pools}>
          {profile.friends_enabled && <Chip label="🤝  Friends" selected />}
          {profile.dating_enabled && <Chip label="💗  Dating" tone="dating" selected />}
        </View>
        <AppText variant="caption" tone="muted" style={styles.status}>
          Your location is never shown to anyone. A buzz means someone compatible is near — not
          who, and not where.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.four,
  },
  header: {
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  status: {
    textAlign: 'center',
    maxWidth: 340,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  pools: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
