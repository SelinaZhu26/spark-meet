import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sparkler } from '@/components/sparkler';
import { StatusScreen } from '@/components/status-screen';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { rise } from '@/components/ui/rise';
import { AppText } from '@/components/ui/text';
import { Fonts, Radius, Spacing, Springs, tracking } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { themedStyles, useColors } from '@/lib/appearance';
import type { Spark } from '@/lib/types';

/** How often to check whether they waved back. */
const WAVE_POLL_MS = 5_000;

export default function SparkDetail() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [spark, setSpark] = useState<Spark | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waving, setWaving] = useState(false);

  const load = useCallback(
    () => api.spark(id).then(setSpark, (err) => setError(errorMessage(err))),
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  const waitingForWave = !!spark && spark.waved && !spark.connected;
  useEffect(() => {
    if (!waitingForWave) {
      return;
    }
    const timer = setInterval(load, WAVE_POLL_MS);
    return () => clearInterval(timer);
  }, [waitingForWave, load]);

  const wave = async () => {
    setWaving(true);
    try {
      const next = await api.wave(id);
      Haptics.notificationAsync(
        next.connected
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
      setSpark(next);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setWaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      {spark ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 64, paddingBottom: insets.bottom + Spacing.five },
          ]}>
          <Details spark={spark} waving={waving} onWave={wave} />
          {error && <AppText tone="danger">{error}</AppText>}
        </ScrollView>
      ) : error ? (
        <StatusScreen
          title="spark not found"
          message={error}
          actions={[{ title: 'back', onPress: router.back }]}
        />
      ) : (
        <StatusScreen />
      )}
      <IconButton
        icon="back"
        onPress={router.back}
        accessibilityLabel="Back"
        style={[styles.back, { top: insets.top + Spacing.three - 4 }]}
      />
    </View>
  );
}

function Details({ spark, waving, onWave }: { spark: Spark; waving: boolean; onWave: () => void }) {
  const colors = useColors();
  const styles = useStyles();
  const router = useRouter();

  return (
    <>
      <Animated.View entering={rise(0)} style={styles.hero}>
        <Sparkler size={210} lit={1} style={styles.sparkler} />
        <View style={styles.score}>
          <AppText style={styles.scoreNumber}>{spark.score}</AppText>
          <AppText style={styles.scoreUnit}>%</AppText>
        </View>
        <AppText variant="label" tone="secondary">
          match
        </AppText>
      </Animated.View>

      <Animated.View entering={rise(1)} style={styles.reason}>
        <AppText variant="title">{spark.reason}</AppText>
        <View style={styles.chips}>
          {spark.shared_interests.map((interest) => (
            <Chip key={interest} label={interest} selected />
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={rise(2)}>
        <Card>
          <AppText variant="label" tone="muted">
            icebreaker
          </AppText>
          <AppText style={styles.icebreaker}>{spark.icebreaker}</AppText>
        </Card>
      </Animated.View>

      <Animated.View entering={rise(3)} style={styles.action}>
        {spark.connected ? (
          <Button
            title="say hi"
            icon="chat"
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: spark.id } })}
          />
        ) : spark.waved ? (
          <Animated.View
            entering={ZoomIn.springify(Springs.pop.duration).dampingRatio(Springs.pop.dampingRatio)}
            style={styles.waved}>
            <Icon name="check" size={18} color={colors.accent} />
            <AppText style={styles.wavedText}>waved · waiting for them</AppText>
          </Animated.View>
        ) : (
          <>
            <Button title="wave" icon="wave" loading={waving} onPress={onWave} />
            <AppText variant="caption" tone="muted" style={styles.center}>
              nothing&apos;s shared unless you both wave
            </AppText>
          </>
        )}
      </Animated.View>

      {spark.connected && spark.other && (
        <Animated.View entering={rise(4)}>
          <Card>
            <View style={styles.peer}>
              <Avatar name={spark.other.display_name} url={spark.other.avatar_url} size={56} />
              <View style={styles.peerText}>
                <AppText variant="heading" numberOfLines={1}>
                  {spark.other.display_name}
                </AppText>
                <AppText variant="label" tone="accent">
                  you both waved
                </AppText>
              </View>
            </View>
            {!!spark.other.bio && <AppText tone="secondary">{spark.other.bio}</AppText>}
            {spark.other.interests.length > 0 && (
              <View style={styles.chips}>
                {spark.other.interests.map((interest) => (
                  <Chip
                    key={interest}
                    label={interest}
                    selected={spark.shared_interests.includes(interest)}
                  />
                ))}
              </View>
            )}
          </Card>
        </Animated.View>
      )}
    </>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.four - 4,
    gap: Spacing.four - 4,
    alignItems: 'stretch',
  },
  back: {
    position: 'absolute',
    left: Spacing.three,
  },
  hero: {
    height: 210,
    justifyContent: 'flex-end',
    marginTop: -Spacing.five,
  },
  sparkler: {
    position: 'absolute',
    top: 0,
    right: -Spacing.two,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scoreNumber: {
    fontFamily: Fonts.thinItalic,
    fontSize: 112,
    lineHeight: 112,
    letterSpacing: tracking(-4),
  },
  scoreUnit: {
    fontFamily: Fonts.lightItalic,
    fontSize: 40,
    lineHeight: 56,
    color: colors.accent,
  },
  reason: {
    gap: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  icebreaker: {
    fontFamily: Fonts.italic,
    fontSize: 24,
    lineHeight: 30,
  },
  action: {
    gap: Spacing.two + 2,
  },
  waved: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  wavedText: {
    fontFamily: Fonts.semiBoldItalic,
    fontSize: 19,
    lineHeight: 23,
  },
  center: {
    textAlign: 'center',
  },
  peer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 2,
  },
  peerText: {
    flex: 1,
    gap: Spacing.half,
  },
}));
