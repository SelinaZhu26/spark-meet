import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/text';
import { Colors, Gradients } from '@/constants/theme';

const ORB_SIZE = 220;
const RIPPLE_DELAYS = [0, 800, 1600];

export type SparkOrbProps = {
  active: boolean;
  busy: boolean;
  onPress: () => void;
};

/** The big ON/OFF switch. Breathes and sends out ripples while active. */
export function SparkOrb({ active, busy, onPress }: SparkOrbProps) {
  const breath = useSharedValue(0);

  useEffect(() => {
    if (active) {
      breath.set(
        withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true)
      );
    } else {
      cancelAnimation(breath);
      breath.set(withTiming(0, { duration: 300 }));
    }
  }, [active, breath]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.get() * 0.04 }],
    shadowOpacity: 0.35 + breath.get() * 0.4,
  }));

  return (
    <View style={styles.stage}>
      {RIPPLE_DELAYS.map((delay) => (
        <Ripple key={delay} delay={delay} active={active} />
      ))}
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: active, busy }}
        accessibilityLabel={active ? 'Spark is on. Tap to switch off.' : 'Spark is off. Tap to switch on.'}
        onPress={onPress}
        disabled={busy}>
        {({ pressed }) => (
          <Animated.View style={[styles.orb, active && styles.orbActive, orbStyle, pressed && styles.pressed]}>
            <LinearGradient
              colors={active ? Gradients.ember : Gradients.ash}
              start={{ x: 0.15, y: 0.1 }}
              end={{ x: 0.85, y: 0.95 }}
              style={styles.fill}>
              {busy ? (
                <ActivityIndicator size="large" color={active ? Colors.background : Colors.flame} />
              ) : (
                <>
                  <AppText style={[styles.bolt, !active && styles.boltOff]}>⚡</AppText>
                  <AppText
                    variant="label"
                    style={{ color: active ? Colors.background : Colors.textSecondary }}>
                    {active ? 'Spark is on' : 'Tap to light up'}
                  </AppText>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

function Ripple({ delay, active }: { delay: number; active: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.set(
        withDelay(
          delay,
          withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false)
        )
      );
    } else {
      cancelAnimation(progress);
      progress.set(0);
    }
  }, [active, delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: active ? (1 - progress.get()) * 0.5 : 0,
    transform: [{ scale: 1 + progress.get() * 0.8 }],
  }));

  return <Animated.View pointerEvents="none" style={[styles.ripple, style]} />;
}

const styles = StyleSheet.create({
  stage: {
    width: ORB_SIZE * 1.9,
    height: ORB_SIZE * 1.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.ember,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 48,
    elevation: 12,
  },
  orbActive: {
    borderColor: Colors.glow,
  },
  pressed: {
    opacity: 0.9,
  },
  fill: {
    flex: 1,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bolt: {
    fontSize: 72,
    lineHeight: 84,
  },
  boltOff: {
    opacity: 0.45,
  },
  ripple: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.flame,
  },
});
