import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SparkOrb } from '@/components/spark-orb';
import { Chip } from '@/components/ui/chip';
import { Divider } from '@/components/ui/ornament';
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
        <AppText variant="title">Hey {profile.display_name}</AppText>
        <View style={styles.pools}>
          {profile.friends_enabled && <Chip label="Friends" accent={Colors.friends} />}
          {profile.dating_enabled && <Chip label="Dating" accent={Colors.dating} />}
        </View>
      </View>

      <View style={styles.center}>
        <SparkOrb active={active} busy={busy} onPress={toggle} />
        <AppText variant="title" tone={active ? 'default' : 'secondary'} style={styles.status}>
          {active ? 'Spark is on' : 'Spark is off'}
        </AppText>
        <AppText tone="secondary" style={styles.status}>
          {active
            ? "Put your phone away. We'll buzz you when someone you'd click with is close."
            : 'Tap the crystal to switch on.'}
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
        <Divider style={styles.divider} />
        <AppText variant="caption" tone="muted" style={styles.status}>
          Nobody sees your location. A buzz never says who or where.
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
    gap: Spacing.three,
  },
  pools: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  status: {
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  divider: {
    alignSelf: 'stretch',
  },
});
