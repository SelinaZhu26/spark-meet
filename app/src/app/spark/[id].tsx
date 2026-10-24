import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { StatusScreen } from '@/components/status-screen';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { Colors, Gradients, Radius, Spacing } from '@/constants/theme';
import { accessToken, api, errorMessage, icebreakerUrl } from '@/lib/api';
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
  const tone = dating ? 'dating' : 'ember';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: dating ? 'Dating spark' : 'Spark' }} />

      <View style={styles.hero}>
        <LinearGradient
          colors={dating ? Gradients.dating : Gradients.ember}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.score}>
          <AppText style={styles.scoreValue}>{spark.score}</AppText>
          <AppText variant="label" style={styles.scoreLabel}>
            match
          </AppText>
        </LinearGradient>
        <AppText variant="title" style={styles.centerText}>
          {spark.reason}
        </AppText>
        <View style={styles.chips}>
          {spark.shared_interests.map((interest) => (
            <Chip key={interest} label={interest} selected tone={tone} />
          ))}
        </View>
      </View>

      <Icebreaker sparkId={spark.id} text={spark.icebreaker} dating={dating} />

      {spark.connected && spark.other ? (
        <Card>
          <View style={styles.peer}>
            <Avatar name={spark.other.display_name} url={spark.other.avatar_url} size={64} />
            <View style={styles.peerText}>
              <AppText variant="label" tone={tone}>
                It&apos;s mutual
              </AppText>
              <AppText variant="title">{spark.other.display_name}</AppText>
            </View>
          </View>
          {!!spark.other.bio && <AppText tone="secondary">{spark.other.bio}</AppText>}
          <View style={styles.chips}>
            {spark.other.interests.map((interest) => (
              <Chip key={interest} label={interest} />
            ))}
          </View>
          <Button
            title="Say hi"
            icon="💬"
            variant={dating ? 'dating' : 'primary'}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: spark.id } })}
          />
        </Card>
      ) : (
        <Card>
          <AppText variant="heading">{spark.waved ? 'You waved 👋' : 'Want to meet?'}</AppText>
          <AppText tone="secondary">
            {spark.waved
              ? "If they wave back, you'll see each other's profiles and can chat. They won't know you waved unless they do too."
              : "Wave to reveal each other. Nothing is shared unless you both wave, and they're never told about a one-sided wave."}
          </AppText>
          {!spark.waved && (
            <Button
              title="Wave"
              icon="👋"
              variant={dating ? 'dating' : 'primary'}
              onPress={wave}
              loading={waving}
            />
          )}
        </Card>
      )}

      {error && <AppText tone="danger">{error}</AppText>}
    </ScrollView>
  );
}

/** The icebreaker, with an ElevenLabs read-aloud for accessibility. */
function Icebreaker({ sparkId, text, dating }: { sparkId: string; text: string; dating: boolean }) {
  const player = useRef<AudioPlayer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => player.current?.remove(), []);

  const speak = async () => {
    setLoading(true);
    try {
      player.current ??= createAudioPlayer({
        uri: icebreakerUrl(sparkId),
        headers: { Authorization: `Bearer ${await accessToken()}` },
      });
      await player.current.seekTo(0);
      player.current.play();
    } catch (error) {
      console.warn('[spark] could not play icebreaker', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.icebreaker, dating && styles.icebreakerDating]}>
      <AppText variant="label" tone={dating ? 'dating' : 'ember'}>
        Icebreaker
      </AppText>
      <AppText variant="heading">“{text}”</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Read the icebreaker aloud"
        onPress={speak}
        disabled={loading}
        style={({ pressed }) => [styles.speak, (pressed || loading) && styles.pressed]}>
        <AppText variant="caption" style={styles.speakText}>
          {loading ? 'Loading…' : '🔊  Read it to me'}
        </AppText>
      </Pressable>
    </View>
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
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  score: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: 800,
    color: Colors.background,
  },
  scoreLabel: {
    color: Colors.background,
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
  icebreaker: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderLeftWidth: 4,
    borderLeftColor: Colors.ember,
    backgroundColor: Colors.surfaceRaised,
  },
  icebreakerDating: {
    borderLeftColor: Colors.dating,
  },
  speak: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  speakText: {
    fontWeight: 700,
    color: Colors.text,
  },
  pressed: {
    opacity: 0.6,
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
