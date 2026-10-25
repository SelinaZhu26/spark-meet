import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

export type SparkyProps = {
  /** Height of the body; the mascot is a little wider than tall. */
  size: number;
  /** Squishes gently on a loop. */
  idle?: boolean;
  /** Closed eyes, for empty and quiet moments. */
  sleepy?: boolean;
};

/** Spark's mascot: a squishy yellow blob. */
export function Sparky({ size, idle = true, sleepy = false }: SparkyProps) {
  const squish = useSharedValue(0);

  useEffect(() => {
    if (!idle) {
      return;
    }
    const easing = Easing.inOut(Easing.sin);
    squish.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1260, easing }),
          withTiming(-0.5, { duration: 420, easing }),
          withTiming(0, { duration: 1120, easing })
        ),
        -1
      )
    );
    return () => cancelAnimation(squish);
  }, [idle, squish]);

  const body = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 + squish.get() * 0.08 }, { scaleY: 1 - squish.get() * 0.1 }],
  }));

  const width = size * 1.25;
  const eye = Math.max(2, size * 0.13);
  return (
    <Animated.View
      style={[
        styles.body,
        {
          width,
          height: size,
          borderTopLeftRadius: size * 0.62,
          borderTopRightRadius: size * 0.62,
          borderBottomLeftRadius: size * 0.4,
          borderBottomRightRadius: size * 0.4,
        },
        body,
      ]}>
      <View style={[styles.eyes, { top: size * 0.4, gap: width * 0.22 }]}>
        {[0, 1].map((index) => (
          <View
            key={index}
            style={{
              width: eye,
              height: sleepy ? eye * 0.35 : eye,
              borderRadius: eye / 2,
              backgroundColor: Colors.ink,
            }}
          />
        ))}
      </View>
      <View style={[styles.cheeks, { top: size * 0.56, gap: width * 0.4 }]}>
        {[0, 1].map((index) => (
          <View
            key={index}
            style={{
              width: size * 0.24,
              height: size * 0.11,
              borderRadius: size * 0.06,
              backgroundColor: 'rgba(255, 120, 120, 0.55)',
            }}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.yellow,
    transformOrigin: 'bottom',
  },
  eyes: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cheeks: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
