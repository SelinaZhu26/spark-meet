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

import { Diamond } from '@/components/ui/ornament';
import { AppText } from '@/components/ui/text';
import { Colors, Gradients } from '@/constants/theme';

const FRAME = 136;
const CRYSTAL = 92;
const RIPPLE_DELAYS = [0, 900, 1800];

export type SparkOrbProps = {
  active: boolean;
  busy: boolean;
  onPress: () => void;
};

/** The big ON/OFF switch: a waypoint that lights up and floats while Spark is on. */
export function SparkOrb({ active, busy, onPress }: SparkOrbProps) {
  const hover = useSharedValue(0);

  useEffect(() => {
    if (active) {
      hover.set(
        withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }), -1, true)
      );
    } else {
      cancelAnimation(hover);
      hover.set(withTiming(0, { duration: 300 }));
    }
  }, [active, hover]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 - hover.get() * 10 }],
  }));
  const groundStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 - hover.get() * 0.18 }],
    opacity: 0.5 - hover.get() * 0.2,
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
        disabled={busy}
        style={styles.hit}>
        {({ pressed }) => (
          <Animated.View style={[styles.waypoint, floatStyle, pressed && styles.pressed]}>
            <View style={[styles.frame, active && styles.frameActive]} />
            <View style={styles.crystal}>
              <LinearGradient
                colors={active ? Gradients.waypoint : Gradients.dormant}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
            {busy ? (
              <ActivityIndicator size="large" color={active ? Colors.ink : Colors.brass} />
            ) : (
              <AppText style={[styles.glyph, { color: active ? Colors.ink : Colors.textMuted }]}>✦</AppText>
            )}
            <Diamond
              size={14}
              color={active ? Colors.accent : Colors.border}
              style={styles.pendant}
            />
          </Animated.View>
        )}
      </Pressable>
      <Animated.View style={[styles.ground, active && styles.groundActive, groundStyle]} />
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
          withRepeat(withTiming(1, { duration: 2700, easing: Easing.out(Easing.quad) }), -1, false)
        )
      );
    } else {
      cancelAnimation(progress);
      progress.set(0);
    }
  }, [active, delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: active ? (1 - progress.get()) * 0.6 : 0,
    transform: [{ translateY: -20 }, { rotate: '45deg' }, { scale: 1 + progress.get() * 0.9 }],
  }));

  return <Animated.View pointerEvents="none" style={[styles.ripple, style]} />;
}

const styles = StyleSheet.create({
  stage: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hit: {
    width: FRAME * 1.45,
    height: FRAME * 1.45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waypoint: {
    width: FRAME,
    height: FRAME,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  frame: {
    position: 'absolute',
    width: FRAME,
    height: FRAME,
    borderWidth: 1.5,
    borderColor: Colors.border,
    transform: [{ rotate: '45deg' }],
  },
  frameActive: {
    borderColor: Colors.brass,
  },
  crystal: {
    position: 'absolute',
    width: CRYSTAL,
    height: CRYSTAL,
    overflow: 'hidden',
    transform: [{ rotate: '45deg' }],
  },
  glyph: {
    fontSize: 40,
    lineHeight: 48,
  },
  pendant: {
    position: 'absolute',
    bottom: -48,
  },
  ground: {
    position: 'absolute',
    bottom: 22,
    width: 120,
    height: 14,
    borderRadius: 60,
    backgroundColor: Colors.surfaceRaised,
  },
  groundActive: {
    backgroundColor: `${Colors.accent}40`,
  },
  ripple: {
    position: 'absolute',
    width: FRAME,
    height: FRAME,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
});
