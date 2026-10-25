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
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Speck } from '@/components/sparkler';
import { Colors, MarkColors } from '@/constants/theme';
import { seedOf } from '@/lib/seed';

const RAYS = 22;
const SPECKS = 16;

type Ray = { d: string; from: Point; to: Point; width: number; color: string };
type Point = { x: number; y: number };

/** A tiny seeded random, so a spark always bursts the same way. */
function random(seed: number) {
  let state = seed || 1;
  return (min: number, max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return min + (state / 2 ** 32) * (max - min);
  };
}

/**
 * Wavy rays like the logo's, all around the hub: long gold and warm-white ones that run
 * off the screen, and short gold and ash ones close in. Each is an S-curve. They start on
 * an ellipse around the hub, taller than wide, to keep the text above and below it clear.
 */
function makeRays(seed: number, hub: Point, reach: number, core: number): Ray[] {
  const rand = random(seed);
  return Array.from({ length: RAYS }, (_, index) => {
    const short = index % 3 === 2;
    const angle = (index / RAYS) * Math.PI * 2 + rand(-0.1, 0.1);
    const tall = core * 1.6;
    const edge = (core * tall) / Math.hypot(tall * Math.cos(angle), core * Math.sin(angle));
    const start = edge * rand(1, 1.2);
    const end = short ? start + rand(34, 70) : reach * rand(0.7, 1.15);
    const wave = (short ? rand(4, 8) : rand(12, 26)) * (index % 2 ? 1 : -1);
    const along = (t: number, offset: number): Point => {
      const r = start + (end - start) * t;
      return {
        x: hub.x + Math.cos(angle) * r - Math.sin(angle) * offset,
        y: hub.y + Math.sin(angle) * r + Math.cos(angle) * offset,
      };
    };
    const p = [along(0, 0), along(0.17, wave), along(0.33, wave), along(0.5, 0)];
    const q = [along(0.67, -wave), along(0.83, -wave), along(1, 0)];
    const f = (point: Point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    return {
      d: `M${f(p[0])} C${f(p[1])} ${f(p[2])} ${f(p[3])} C${f(q[0])} ${f(q[1])} ${f(q[2])}`,
      from: p[0],
      to: q[2],
      width: short ? 2.5 : rand(4, 7.5),
      color: short
        ? index % 2
          ? Colors.gold
          : MarkColors.lit.ash
        : index % 4 === 0
          ? Colors.text
          : Colors.gold,
    };
  });
}

export type SparkBurstProps = {
  width: number;
  height: number;
  /** Where the rays burst from. */
  hub: Point;
  /** Keeps the rays clear of this radius around the hub. */
  core: number;
  seed: string;
};

/** Gold strokes bursting across the screen from the hub, then flickering, with specks flying off. */
export function SparkBurst({ width, height, hub, core, seed }: SparkBurstProps) {
  const reach = Math.hypot(Math.max(hub.x, width - hub.x), Math.max(hub.y, height - hub.y));
  const rays = makeRays(seedOf(seed), hub, reach, core);
  // The hub's offset from the center, to scale around it.
  const offset = { x: hub.x - width / 2, y: hub.y - height / 2 };

  const grow = useSharedValue(0);
  const flickerA = useSharedValue(1);
  const flickerB = useSharedValue(1);
  const breath = useSharedValue(0);

  useEffect(() => {
    grow.set(withDelay(120, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) })));
    const flicker = (steps: readonly (readonly [number, number])[]) =>
      withDelay(
        1200,
        withRepeat(withSequence(...steps.map(([v, duration]) => withTiming(v, { duration }))), -1)
      );
    flickerA.set(
      flicker([
        [0.7, 160],
        [1, 120],
        [0.82, 240],
        [1, 180],
      ])
    );
    flickerB.set(
      flicker([
        [1, 140],
        [0.66, 200],
        [0.9, 110],
        [0.75, 260],
      ])
    );
    breath.set(
      withDelay(
        1200,
        withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true)
      )
    );
    return () => {
      cancelAnimation(grow);
      cancelAnimation(flickerA);
      cancelAnimation(flickerB);
      cancelAnimation(breath);
    };
  }, [grow, flickerA, flickerB, breath]);

  const around = (scale: number) => {
    'worklet';
    return [
      { translateX: offset.x },
      { translateY: offset.y },
      { scale },
      { translateX: -offset.x },
      { translateY: -offset.y },
    ];
  };

  const groupA = useAnimatedStyle(() => ({
    opacity: grow.get() * flickerA.get(),
    transform: around(0.2 + grow.get() * 0.8 + breath.get() * 0.025),
  }));
  const groupB = useAnimatedStyle(() => ({
    opacity: grow.get() * flickerB.get(),
    transform: around(0.12 + grow.get() * 0.88 - breath.get() * 0.02),
  }));

  const layer = (half: 0 | 1) => (
    <Svg width={width} height={height}>
      <Defs>
        {rays.map(
          (ray, index) =>
            index % 2 === half && (
              // Strokes fade toward the hub, like the chalk logo.
              <LinearGradient
                key={index}
                id={`ray-${index}`}
                gradientUnits="userSpaceOnUse"
                x1={ray.from.x}
                y1={ray.from.y}
                x2={ray.to.x}
                y2={ray.to.y}>
                <Stop offset={0} stopColor={ray.color} stopOpacity={0.1} />
                <Stop offset={0.4} stopColor={ray.color} stopOpacity={0.9} />
                <Stop offset={1} stopColor={ray.color} stopOpacity={1} />
              </LinearGradient>
            )
        )}
      </Defs>
      {rays.map(
        (ray, index) =>
          index % 2 === half && (
            <Path
              key={index}
              d={ray.d}
              fill="none"
              stroke={`url(#ray-${index})`}
              strokeWidth={ray.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
      )}
    </Svg>
  );

  return (
    <View style={styles.burst}>
      <Animated.View style={[StyleSheet.absoluteFill, groupA]}>{layer(0)}</Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, groupB]}>{layer(1)}</Animated.View>
      {Array.from({ length: SPECKS }, (_, index) => (
        <Speck
          key={index}
          x={hub.x}
          y={hub.y}
          angle={(index / SPECKS) * 360 + (index % 3) * 9}
          start={core * 0.9}
          distance={reach * (index % 2 ? 0.32 : 0.5)}
          fall={40}
          length={index % 3 ? 9 : 6}
          thickness={2.5}
          duration={1600 + (index % 5) * 260}
          delay={900 + index * 110}
          color={index % 4 === 0 ? Colors.text : Colors.gold}
          heat={grow}
          on
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  burst: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
});
