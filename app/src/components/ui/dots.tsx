import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/lib/appearance';

export type DotsProps = {
  color?: string;
  size?: number;
};

/** The loading indicator: three dots bouncing in turn. */
export function Dots({ color, size = 8 }: DotsProps) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[styles.row, { gap: size * 0.75, height: size * 2 }]}>
      {[0, 1, 2].map((index) => (
        <Dot key={index} index={index} color={color ?? colors.text} size={size} />
      ))}
    </View>
  );
}

function Dot({ index, color, size }: { index: number; color: string; size: number }) {
  const lift = useSharedValue(0);

  useEffect(() => {
    lift.set(
      withDelay(
        index * 120,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) }),
            withTiming(0, { duration: 260 })
          ),
          -1
        )
      )
    );
    return () => cancelAnimation(lift);
  }, [index, lift]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.45 + lift.get() * 0.55,
    transform: [{ translateY: -lift.get() * size * 0.8 }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
