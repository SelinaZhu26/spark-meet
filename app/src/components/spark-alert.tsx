import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Stars } from '@/components/ui/ornament';
import { AppText } from '@/components/ui/text';
import { Colors, Gradients, Radius, Spacing } from '@/constants/theme';
import { sparkTeaser } from '@/lib/notifications';
import { rarity, rarityGlow, rarityGradient } from '@/lib/rarity';
import type { Spark } from '@/lib/types';

const FALL_MS = 1100;
/** Fixed specks of starlight on the night sky, as fractions of the screen. */
const SKY = [
  [0.12, 0.08], [0.78, 0.12], [0.42, 0.18], [0.9, 0.3], [0.06, 0.36], [0.64, 0.42],
  [0.24, 0.58], [0.86, 0.66], [0.5, 0.74], [0.1, 0.84], [0.72, 0.9], [0.34, 0.94],
] as const;

export type SparkAlertProps = {
  spark: Spark | null;
  onOpen: (spark: Spark) => void;
  onDismiss: () => void;
};

/**
 * Full-screen "someone's near" moment shown when a spark lands in the
 * foreground: a shooting star in the spark's rarity color, then the reveal.
 */
export function SparkAlert({ spark, onOpen, onDismiss }: SparkAlertProps) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const fall = useSharedValue(0);
  const flash = useSharedValue(0);
  const sparkId = spark?.id;
  const revealed = !!spark && (reducedMotion || revealedId === spark.id);

  useEffect(() => {
    if (!sparkId || reducedMotion) {
      return;
    }
    fall.set(0);
    fall.set(withTiming(1, { duration: FALL_MS, easing: Easing.in(Easing.quad) }));
    flash.set(
      withDelay(FALL_MS - 150, withSequence(withTiming(1, { duration: 150 }), withTiming(0, { duration: 500 })))
    );
    const timer = setTimeout(() => setRevealedId(sparkId), FALL_MS);
    return () => clearTimeout(timer);
  }, [sparkId, reducedMotion, fall, flash]);

  const streakStyle = useAnimatedStyle(() => ({
    opacity: fall.get() < 0.95 ? 1 : 0,
    transform: [
      { translateX: (1 - fall.get()) * width * 0.6 },
      { translateY: (fall.get() - 1) * height * 0.9 },
      { rotate: '26deg' },
    ],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.get() * 0.85 }));

  const stars = spark ? rarity(spark.score) : 3;
  const dating = spark?.mode === 'dating';

  return (
    <Modal visible={!!spark} transparent animationType="fade" onRequestClose={onDismiss}>
      <LinearGradient colors={Gradients.sky} style={styles.sky}>
        {SKY.map(([x, y]) => (
          <View key={`${x}-${y}`} style={[styles.speck, { left: x * width, top: y * height }]} />
        ))}

        {spark && !revealed && (
          <Pressable
            style={styles.fallStage}
            accessibilityRole="button"
            accessibilityLabel="Skip"
            onPress={() => setRevealedId(spark.id)}>
            <AppText variant="label" tone="secondary" style={styles.skip}>
              Skip
            </AppText>
            <Animated.View style={[styles.streak, streakStyle]}>
              <LinearGradient
                colors={['transparent', rarityGlow[stars], '#FFFFFF']}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </Pressable>
        )}

        {spark && revealed && (
          <Animated.View entering={ZoomIn.springify().damping(15)} style={styles.sheet}>
            <LinearGradient
              colors={rarityGradient[stars]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.art}>
              <AppText style={styles.glyph}>✦</AppText>
              <Stars count={stars} size={22} stagger={140} />
            </LinearGradient>
            <View style={styles.body}>
              <View style={styles.chips}>
                <Chip label={dating ? 'Dating' : 'Friends'} accent={dating ? Colors.dating : Colors.friends} />
                <Chip label={`${spark.score}% match`} />
              </View>
              <AppText variant="title" style={styles.center}>
                {sparkTeaser(spark)}
              </AppText>
              <View style={styles.chips}>
                {spark.shared_interests.map((interest) => (
                  <Chip key={interest} label={interest} selected />
                ))}
              </View>
              <AppText tone="secondary" style={styles.center}>
                Neither of you knows who. Wave to find out.
              </AppText>
              <Animated.View entering={FadeIn.delay(stars * 140)} style={styles.actions}>
                <Button title="See the spark" icon="confirm" onPress={() => onOpen(spark)} />
                <Button title="Later" icon="cancel" variant="secondary" onPress={onDismiss} />
              </Animated.View>
            </View>
          </Animated.View>
        )}

        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: rarityGlow[stars] }, flashStyle]}
        />
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sky: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  speck: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.parchment,
    opacity: 0.5,
  },
  fallStage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    position: 'absolute',
    top: Spacing.six,
    right: Spacing.four,
  },
  streak: {
    width: 5,
    height: 260,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sheet: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: `${Colors.brass}80`,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  art: {
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  glyph: {
    fontSize: 64,
    lineHeight: 72,
    color: Colors.parchment,
  },
  body: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  center: {
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  actions: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
});
