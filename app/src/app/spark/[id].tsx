import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MomentCard } from '@/components/moment-card';
import { StatusScreen } from '@/components/status-screen';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { pastel } from '@/lib/moment';
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

  const color = pastel(spark);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: '' }} />

      <View style={styles.hero}>
        <MomentCard spark={spark} />
      </View>

      {spark.shared_interests.length > 2 && (
        <View style={styles.chips}>
          {spark.shared_interests.map((interest) => (
            <Chip key={interest} label={interest} selected color={color} />
          ))}
        </View>
      )}

      <Card>
        <AppText variant="label" tone="secondary">
          Icebreaker
        </AppText>
        <AppText variant="title">{spark.icebreaker}</AppText>
      </Card>

      {spark.connected && spark.other ? (
        <Card>
          <AppText variant="label" tone="live">
            It&apos;s mutual
          </AppText>
          <View style={styles.peer}>
            <Avatar name={spark.other.display_name} url={spark.other.avatar_url} color={color} size={64} />
            <AppText variant="title" style={styles.peerName}>
              {spark.other.display_name}
            </AppText>
          </View>
          {!!spark.other.bio && <AppText tone="secondary">{spark.other.bio}</AppText>}
          <View style={styles.chips}>
            {spark.other.interests.map((interest) => (
              <Chip key={interest} label={interest} />
            ))}
          </View>
          <Button
            title="Say hi"
            color={color}
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
          {!spark.waved && (
            <Button title="Wave" icon="👋" color={Colors.wave} onPress={wave} loading={waving} />
          )}
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
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  hero: {
    height: 480,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  peer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  peerName: {
    flex: 1,
  },
});
