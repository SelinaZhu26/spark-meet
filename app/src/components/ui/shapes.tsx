import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';

const POINTS = {
  bolt: '58,4 16,57 45,57 37,96 84,39 55,39 63,4',
  star: '50,2 61,35 98,35 68,57 79,92 50,71 21,92 32,57 2,35 39,35',
};

export type ShapeKind = 'circle' | 'ring' | 'bolt' | 'star';
export type ShapeMotion = 'none' | 'float' | 'spin' | 'pulse';

export type ShapeProps = {
  kind: ShapeKind;
  size: number;
  color: string;
  motion?: ShapeMotion;
  /** Resting rotation in degrees. */
  rotate?: number;
  /** Position it; shapes are absolutely positioned. */
  style?: StyleProp<ViewStyle>;
};

/** A decorative shape. Floats, spins or pings outward when given a motion. */
export function Shape({ kind, size, color, motion = 'none', rotate = 0, style }: ShapeProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (motion === 'none') {
      cancelAnimation(t);
      t.set(withTiming(0, { duration: 400 }));
      return;
    }
    const timing =
      motion === 'spin'
        ? { duration: 18000, easing: Easing.linear }
        : motion === 'pulse'
          ? { duration: 2000, easing: Easing.out(Easing.quad) }
          : { duration: 3600, easing: Easing.inOut(Easing.sin) };
    t.set(withRepeat(withTiming(1, timing), -1, motion === 'float'));
    return () => cancelAnimation(t);
  }, [motion, t]);

  const animated = useAnimatedStyle(() => {
    const v = t.get();
    if (motion === 'spin') {
      return { transform: [{ rotate: `${rotate + v * 360}deg` }] };
    }
    if (motion === 'pulse') {
      return { opacity: 1 - v, transform: [{ rotate: `${rotate}deg` }, { scale: 1 + v * 0.6 }] };
    }
    return {
      transform: [
        { translateY: (v - 0.5) * size * 0.14 },
        { rotate: `${rotate + (v - 0.5) * 12}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.shape, { width: size, height: size }, style, animated]}>
      {kind === 'circle' && (
        <View style={[styles.fill, { borderRadius: size / 2, backgroundColor: color }]} />
      )}
      {kind === 'ring' && (
        <View
          style={[
            styles.fill,
            { borderRadius: size / 2, borderWidth: size * 0.13, borderColor: color },
          ]}
        />
      )}
      {(kind === 'bolt' || kind === 'star') && (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Polygon
            points={POINTS[kind]}
            fill={color}
            stroke={color}
            strokeWidth={kind === 'bolt' ? 7 : 3}
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shape: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  fill: {
    flex: 1,
  },
});
