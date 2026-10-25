import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { StatusScreen } from '@/components/status-screen';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Diamond, Stars } from '@/components/ui/ornament';
import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { rarity, rarityGradient } from '@/lib/rarity';
import type { Spark } from '@/lib/types';

/** How often to check whether they waved back. */
const WAVE_POLL_MS = 5_000;

export default function SparkDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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

  if (!spark) {
    return error ? (
      <StatusScreen title="Spark not found" message={error} actions={[{ title: 'Back', onPress: router.back }]} />
    ) : (
      <StatusScreen />
    );
  }

  const dating = spark.mode === 'dating';
  const stars = rarity(spark.score);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: dating ? 'Dating spark' : 'Spark' }} />

      <LinearGradient
        colors={rarityGradient[stars]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}>
        <View style={styles.bannerTop}>
          <Chip label={dating ? 'Dating' : 'Friends'} accent={dating ? Colors.dating : Colors.friends} />
        </View>
        {spark.other ? (
          <Avatar name={spark.other.display_name} url={spark.other.avatar_url} size={96} />
        ) : (
          <AppText style={styles.glyph}>✦</AppText>
        )}
        <Stars count={stars} size={22} />
        <AppText variant="heading" style={styles.score}>
          {spark.score}% match
        </AppText>
      </LinearGradient>

      <View style={styles.hero}>
        <AppText variant="title" style={styles.centerText}>
          {spark.reason}
        </AppText>
        <View style={styles.chips}>
          {spark.shared_interests.map((interest) => (
            <Chip key={interest} label={interest} selected />
          ))}
        </View>
      </View>

      <View style={styles.dialogue}>
        <View style={styles.speaker}>
          <Diamond size={7} />
          <AppText variant="label" tone="brass">
            Icebreaker
          </AppText>
        </View>
        <AppText variant="heading" style={styles.line}>
          {spark.icebreaker}
        </AppText>
        <AppText tone="brass" style={styles.more}>
          ▾
        </AppText>
      </View>

      {spark.connected && spark.other ? (
        <Card>
          <View style={styles.peer}>
            <Avatar name={spark.other.display_name} url={spark.other.avatar_url} size={64} />
            <View style={styles.peerText}>
              <AppText variant="label" tone={dating ? 'dating' : 'friends'}>
                It&apos;s mutual
              </AppText>
              <AppText variant="title">{spark.other.display_name}</AppText>
            </View>
          </View>
          {!!spark.other.bio && <AppText tone="secondary">{spark.other.bio}</AppText>}
          <View style={styles.chipsLeft}>
            {spark.other.interests.map((interest) => (
              <Chip key={interest} label={interest} />
            ))}
          </View>
          <Button
            title="Say hi"
            icon="confirm"
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: spark.id } })}
          />
        </Card>
      ) : (
        <Card>
          <AppText variant="heading">{spark.waved ? 'You waved' : 'Want to meet?'}</AppText>
          <AppText tone="secondary">
            {spark.waved
              ? "If they wave back, you'll see each other and can chat. They're never told about a one-sided wave."
              : 'Wave to reveal each other. Nothing is shared unless you both wave.'}
          </AppText>
          {!spark.waved && <Button title="Wave" icon="confirm" onPress={wave} loading={waving} />}
        </Card>
      )}

      {error && <AppText tone="danger">{error}</AppText>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  banner: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    paddingBottom: Spacing.four,
    borderRadius: Radius.small,
    borderTopRightRadius: 32,
  },
  bannerTop: {
    alignSelf: 'stretch',
    flexDirection: 'row',
  },
  glyph: {
    fontSize: 72,
    lineHeight: 84,
    color: Colors.parchment,
  },
  score: {
    color: Colors.parchment,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  chipsLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  dialogue: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: `${Colors.brass}4D`,
    backgroundColor: `${Colors.surface}CC`,
  },
  speaker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  line: {
    fontWeight: 600,
  },
  more: {
    alignSelf: 'center',
    fontSize: 14,
    lineHeight: 16,
  },
  peer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  peerText: {
    flex: 1,
  },
});
