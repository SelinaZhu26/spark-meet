import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SparkBlock, blockPalette } from '@/components/spark-block';
import { StatusScreen } from '@/components/status-screen';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { rise } from '@/components/ui/rise';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Radius, Spacing, Springs, Tones } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import type { Spark } from '@/lib/types';

/** How often to check whether they waved back. */
const WAVE_POLL_MS = 5_000;

export default function SparkDetail() {
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
  const router = useRouter();
  const { width } = useWindowDimensions();
  const blockWidth = Math.min(width - Spacing.three * 2, 480);
  const dating = spark.mode === 'dating';

  return (
    <>
      <Animated.View entering={rise(0)}>
        <SparkBlock
          palette={blockPalette(spark.id, spark.mode)}
          seed={spark.id}
          width={blockWidth}
          height={blockWidth * 1.05}
          live>
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>
              {dating ? 'dating' : 'friends'} · {spark.score}% match
            </AppText>
          </View>
          <AppText variant="title" tone="ink">
            {spark.reason}
          </AppText>
        </SparkBlock>
      </Animated.View>

      <Animated.View entering={rise(1)} style={styles.chips}>
        {spark.shared_interests.map((interest) => (
          <Chip key={interest} label={interest} />
        ))}
      </Animated.View>

      <Animated.View entering={rise(2)}>
        <Card>
          <AppText variant="label" tone="secondary">
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
            variant={dating ? 'dating' : 'primary'}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: spark.id } })}
          />
        ) : spark.waved ? (
          <Animated.View
            entering={ZoomIn.springify(Springs.pop.duration).dampingRatio(Springs.pop.dampingRatio)}
            style={styles.waved}>
            <Icon name="check" size={20} color={dating ? Tones.dating : Tones.accent} />
            <AppText style={styles.wavedText}>waved · waiting for them</AppText>
          </Animated.View>
        ) : (
          <>
            <Button
              title="wave"
              icon="wave"
              variant={dating ? 'dating' : 'primary'}
              loading={waving}
              onPress={onWave}
            />
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
              <AppText variant="heading" numberOfLines={1} style={styles.peerName}>
                {spark.other.display_name}
              </AppText>
            </View>
            {!!spark.other.bio && <AppText tone="secondary">{spark.other.bio}</AppText>}
            {spark.other.interests.length > 0 && (
              <View style={styles.chips}>
                {spark.other.interests.map((interest) => (
                  <Chip key={interest} label={interest} />
                ))}
              </View>
            )}
          </Card>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  back: {
    position: 'absolute',
    left: Spacing.three,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.ink,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.one + 1,
    marginBottom: Spacing.three - 4,
  },
  badgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    lineHeight: 19,
    color: Colors.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  icebreaker: {
    fontFamily: Fonts.semiBoldItalic,
    fontSize: 25,
    lineHeight: 30,
  },
  action: {
    gap: Spacing.two,
  },
  waved: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
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
    gap: Spacing.three - 4,
  },
  peerName: {
    flex: 1,
  },
});
