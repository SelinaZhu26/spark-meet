import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LiveSwitch } from '@/components/live-switch';
import { SwipeDeck, type Decision } from '@/components/swipe-deck';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { onSparks, startPresence, stopPresence, type PresenceMode } from '@/lib/presence';
import { useMe, useSession } from '@/lib/session';
import type { Spark } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const { refreshMe } = useSession();
  const { profile } = useMe();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<PresenceMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sparks, setSparks] = useState<Spark[]>([]);
  /** Sparks swiped left this session; they stay in the Sparks tab. */
  const [later, setLater] = useState<string[]>([]);
  const active = profile.active;

  const load = useCallback(
    () => api.sparks().then(setSparks, (err) => setError(errorMessage(err))),
    []
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => onSparks(() => load()), [load]);

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

  const replace = (next: Spark) =>
    setSparks((current) => current.map((spark) => (spark.id === next.id ? next : spark)));

  const decide = async (spark: Spark, decision: Decision) => {
    if (decision === 'pass') {
      setLater((ids) => [...ids, spark.id]);
      return;
    }
    replace({ ...spark, waved: true });
    try {
      const next = await api.wave(spark.id);
      Haptics.notificationAsync(
        next.connected
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
      replace(next);
      if (next.connected) {
        router.push({ pathname: '/spark/[id]', params: { id: next.id } });
      }
    } catch (err) {
      setError(errorMessage(err));
      replace(spark);
    }
  };

  const deck = sparks.filter((spark) => !spark.waved && !later.includes(spark.id));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="title">spark</AppText>
        <LiveSwitch active={active} busy={busy} onPress={toggle} />
      </View>

      <View style={styles.body}>
        {deck.length > 0 ? (
          <SwipeDeck
            sparks={deck}
            onDecide={decide}
            onOpen={(spark) => router.push({ pathname: '/spark/[id]', params: { id: spark.id } })}
          />
        ) : (
          <EmptyDeck active={active} busy={busy} onGoLive={toggle} />
        )}
      </View>

      {(error || (active && mode === 'foreground')) && (
        <View style={styles.notes}>
          {active && mode === 'foreground' && (
            <AppText variant="caption" tone="muted" style={styles.center}>
              Keep Spark open: background mode needs a development build.
            </AppText>
          )}
          {error && (
            <AppText variant="caption" tone="danger" style={styles.center}>
              {error}
            </AppText>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const PULSE_DELAYS = [0, 900];

function EmptyDeck({ active, busy, onGoLive }: { active: boolean; busy: boolean; onGoLive: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyCenter}>
        {active && (
          <View style={styles.pulse}>
            {PULSE_DELAYS.map((delay) => (
              <Pulse key={delay} delay={delay} />
            ))}
            <View style={styles.pulseCore} />
          </View>
        )}
        <AppText variant="title" style={styles.center}>
          {active ? "You're live" : 'Spark is off'}
        </AppText>
        <AppText tone="secondary" style={styles.center}>
          {active
            ? "Put your phone away. A card pops up when someone you'd click with is close."
            : 'Go live and walk around. When someone you’d click with is close, a card pops up on both your phones.'}
        </AppText>
        {!active && (
          <Button title="Go live" color={Colors.live} onPress={onGoLive} loading={busy} style={styles.goLive} />
        )}
      </View>
      <AppText variant="caption" tone="muted" style={styles.center}>
        Nobody sees your location. A card never says who or where.
      </AppText>
    </View>
  );
}

function Pulse({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false)
      )
    );
    return () => cancelAnimation(progress);
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.get(),
    transform: [{ scale: 0.4 + progress.get() * 1.6 }],
  }));

  return <Animated.View style={[styles.pulseRing, style]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  body: {
    flex: 1,
    paddingBottom: Spacing.four,
  },
  notes: {
    gap: Spacing.one,
    paddingBottom: Spacing.three,
  },
  center: {
    textAlign: 'center',
  },
  empty: {
    flex: 1,
    borderRadius: Radius.large,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    padding: Spacing.four,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  goLive: {
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
  pulse: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.live}55`,
  },
  pulseCore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.live,
  },
});
