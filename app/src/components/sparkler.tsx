import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { HUB, SparkMark, VIEW, type Stroke } from '@/components/ui/spark-mark';
import { Colors, MarkColors } from '@/constants/theme';

const isBody = (stroke: Stroke) => stroke.tone === 'ink';
const isGoldRay = (stroke: Stroke) => stroke.part === 'ray' && stroke.tone === 'gold';
const isInner = (stroke: Stroke) => stroke.part === 'inner';

/** Specks fly off the hub in every direction except down the stick. Angles are in degrees, clockwise from 3 o'clock. */
const SPECKS = [
  { angle: -150, reach: 0.3, duration: 1700, delay: 0, gold: true },
  { angle: -62, reach: 0.34, duration: 2100, delay: 380, gold: true },
  { angle: -18, reach: 0.27, duration: 1500, delay: 760, gold: false },
  { angle: 168, reach: 0.31, duration: 1900, delay: 220, gold: true },
  { angle: -104, reach: 0.36, duration: 2300, delay: 1050, gold: true },
  { angle: 12, reach: 0.33, duration: 1800, delay: 560, gold: true },
  { angle: 128, reach: 0.24, duration: 1600, delay: 1320, gold: false },
  { angle: -128, reach: 0.25, duration: 1400, delay: 880, gold: true },
  { angle: -36, reach: 0.38, duration: 2400, delay: 1500, gold: true },
  { angle: 196, reach: 0.22, duration: 1500, delay: 1180, gold: true },
] as const;

/** An irregular flicker: opacity multipliers and how long each takes to reach. */
function flicker(steps: readonly (readonly [value: number, duration: number])[]) {
  return withRepeat(
    withSequence(...steps.map(([value, duration]) => withTiming(value, { duration }))),
    -1
  );
}

export type SparklerProps = {
  /** Height in points. */
  size: number;
  /** 0 is a dim graphite sparkler, 1 is fully lit; in between lights it partway. */
  lit: number;
  style?: StyleProp<ViewStyle>;
};

/** The logo as an illustration that ignites: gold rays flicker and pulse, specks drift off the hub. */
export function Sparkler({ size, lit, style }: SparklerProps) {
  const width = (size * VIEW.width) / VIEW.height;
  // The hub's offset from the center, to scale layers around it.
  const hub = {
    x: ((HUB.x - VIEW.x) / VIEW.width - 0.5) * width,
    y: ((HUB.y - VIEW.y) / VIEW.height - 0.5) * size,
  };
  const burning = lit > 0;

  const heat = useSharedValue(lit);
  const rays = useSharedValue(1);
  const inner = useSharedValue(1);
  const pulse = useSharedValue(0);

  useEffect(() => {
    heat.set(withTiming(lit, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [lit, heat]);

  useEffect(() => {
    if (!burning) {
      cancelAnimation(rays);
      cancelAnimation(inner);
      cancelAnimation(pulse);
      pulse.set(withTiming(0, { duration: 400 }));
      return;
    }
    rays.set(
      flicker([
        [0.78, 140],
        [1, 110],
        [0.88, 220],
        [1, 160],
        [0.7, 120],
        [0.96, 260],
      ])
    );
    inner.set(
      flicker([
        [0.5, 90],
        [1, 130],
        [0.75, 170],
        [0.95, 80],
        [0.6, 210],
        [1, 140],
      ])
    );
    pulse.set(
      withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
    return () => {
      cancelAnimation(rays);
      cancelAnimation(inner);
      cancelAnimation(pulse);
    };
  }, [burning, rays, inner, pulse]);

  const around = (scale: number) => {
    'worklet';
    return [
      { translateX: hub.x },
      { translateY: hub.y },
      { scale },
      { translateX: -hub.x },
      { translateY: -hub.y },
    ];
  };

  const unlitStyle = useAnimatedStyle(() => ({ opacity: 1 - heat.get() }));
  const bodyStyle = useAnimatedStyle(() => ({ opacity: heat.get() }));
  const raysStyle = useAnimatedStyle(() => ({
    opacity: heat.get() * rays.get(),
    transform: around(0.86 + heat.get() * 0.14 + pulse.get() * 0.035),
  }));
  const innerStyle = useAnimatedStyle(() => ({
    opacity: heat.get() * inner.get(),
    transform: around(0.7 + heat.get() * 0.3 + pulse.get() * 0.06),
  }));

  const mark = { size, ...MarkColors.lit };
  return (
    <View style={[styles.box, { width, height: size }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, unlitStyle]}>
        <SparkMark size={size} {...MarkColors.unlit} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        <SparkMark {...mark} show={isBody} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, raysStyle]}>
        <SparkMark {...mark} show={isGoldRay} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, innerStyle]}>
        <SparkMark {...mark} show={isInner} />
      </Animated.View>
      {SPECKS.map((speck, index) => (
        <Speck
          key={index}
          x={width / 2 + hub.x}
          y={size / 2 + hub.y}
          angle={speck.angle}
          start={size * 0.05}
          distance={size * speck.reach}
          fall={size * 0.06}
          length={Math.max(4, size * 0.02)}
          thickness={Math.max(1.5, size * 0.0065)}
          duration={speck.duration}
          delay={speck.delay}
          color={speck.gold ? Colors.gold : Colors.text}
          heat={heat}
          // A partly lit sparkler throws fewer specks.
          on={index < Math.round(lit * SPECKS.length)}
        />
      ))}
    </View>
  );
}

export type SpeckProps = {
  /** Where it starts from. */
  x: number;
  y: number;
  /** Degrees, clockwise from 3 o'clock. */
  angle: number;
  /** How far from the origin it appears, and how far it then flies. */
  start: number;
  distance: number;
  /** How far it drops by the time it burns out. */
  fall: number;
  length: number;
  thickness: number;
  duration: number;
  delay: number;
  color: string;
  /** Fades every speck together, e.g. while the sparkler lights up. */
  heat: SharedValue<number>;
  on: boolean;
};

/** A short dash that shoots out from a point, falls a little and burns out, over and over. */
export function Speck({
  x,
  y,
  angle,
  start,
  distance,
  fall,
  length,
  thickness,
  duration,
  delay,
  color,
  heat,
  on,
}: SpeckProps) {
  const progress = useSharedValue(0);
  const radians = (angle * Math.PI) / 180;

  useEffect(() => {
    if (!on) {
      cancelAnimation(progress);
      progress.set(0);
      return;
    }
    progress.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false)
      )
    );
    return () => cancelAnimation(progress);
  }, [on, delay, duration, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    const r = start + p * distance;
    return {
      opacity: on ? heat.get() * (p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88) : 0,
      transform: [
        { translateX: Math.cos(radians) * r },
        { translateY: Math.sin(radians) * r + p * p * fall },
        { rotate: `${angle}deg` },
        { scaleX: 1 - p * 0.6 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.speck,
        {
          left: x - length / 2,
          top: y - thickness / 2,
          width: length,
          height: thickness,
          borderRadius: thickness / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    pointerEvents: 'none',
  },
  speck: {
    position: 'absolute',
  },
});
