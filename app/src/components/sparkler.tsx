import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { HUB, STROKES, SparkMark, VIEW } from '@/components/ui/spark-mark';
import { useAppearance } from '@/lib/appearance';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How much of the fill the stick takes before color reaches the hub and spreads into the rays. */
const STICK_SHARE = 0.45;
/** How long a full fill takes, from dark to lit; going dark is quicker. */
const LIGHT_MS = 1900;
const DOUSE_MS = 1100;

const numbers = (d: string) => d.match(/-?\d+(\.\d+)?/g)!.map(Number);

/** Arc length of a path made of an M and cubic C segments, so a dash can travel exactly along it. */
function pathLength(d: string) {
  const n = numbers(d);
  let [x, y] = [n[0], n[1]];
  let length = 0;
  for (let i = 2; i + 5 < n.length; i += 6) {
    const [x1, y1, x2, y2, x3, y3] = n.slice(i, i + 6);
    let [px, py] = [x, y];
    for (let step = 1; step <= 24; step++) {
      const t = step / 24;
      const u = 1 - t;
      const qx = u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
      const qy = u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
      length += Math.hypot(qx - px, qy - py);
      [px, py] = [qx, qy];
    }
    [x, y] = [x3, y3];
  }
  return length;
}

const fromHub = (x: number, y: number) => Math.hypot(x - HUB.x, y - HUB.y);

/**
 * Each stroke's length and the end its color starts from: the stick fills up toward the
 * hub, and every other stroke, the dangling loop included, spreads out from it.
 */
const FILLS = STROKES.map((stroke) => {
  const n = numbers(stroke.d);
  const start = fromHub(n[0], n[1]);
  const end = fromHub(n[n.length - 2], n[n.length - 1]);
  return {
    stroke,
    length: pathLength(stroke.d),
    fromEnd: stroke.part === 'stick' ? end > start : end < start,
    window: stroke.part === 'stick' ? ([0, STICK_SHARE] as const) : ([STICK_SHARE, 1] as const),
  };
});

export type SparklerProps = {
  /** Height in points. */
  size: number;
  /** 0 is a dim sketch, 1 is fully lit; in between lights it partway. */
  lit: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The logo as an illustration that lights up: color climbs the stick to the hub, then
 * spreads out along every ray and the loop at once. Once lit it holds still.
 */
export function Sparkler({ size, lit, style }: SparklerProps) {
  const { marks } = useAppearance();
  const width = (size * VIEW.width) / VIEW.height;
  const scale = size / VIEW.height;
  const progress = useSharedValue(0);

  useEffect(() => {
    const current = progress.get();
    progress.set(
      withTiming(lit, {
        duration: Math.abs(lit - current) * (lit > current ? LIGHT_MS : DOUSE_MS),
        easing: Easing.inOut(Easing.quad),
      })
    );
  }, [lit, progress]);

  return (
    <View style={[styles.box, { width, height: size }, style]}>
      <View style={StyleSheet.absoluteFill}>
        <SparkMark size={size} {...marks.unlit} />
      </View>
      <Svg
        style={StyleSheet.absoluteFill}
        width={width}
        height={size}
        viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}>
        {FILLS.map(({ stroke, length, fromEnd, window }, index) => (
          <Fill
            key={index}
            d={stroke.d}
            length={length}
            fromEnd={fromEnd}
            window={window}
            color={
              stroke.part === 'ray' || stroke.part === 'inner'
                ? marks.lit[stroke.tone]
                : marks.lit.stick
            }
            width={Math.max(stroke.width, (stroke.width > 20 ? 1.6 : 1.1) / scale)}
            progress={progress}
          />
        ))}
      </Svg>
    </View>
  );
}

type FillProps = {
  d: string;
  length: number;
  /** Starts from the path's last point instead of its first. */
  fromEnd: boolean;
  /** The part of the overall progress this stroke fills during. */
  window: readonly [from: number, to: number];
  color: string;
  width: number;
  progress: SharedValue<number>;
};

/** One stroke in color, revealed along its own curve by sliding a single dash over it. */
function Fill({ d, length, fromEnd, window, color, width, progress }: FillProps) {
  // A touch longer than the path, so a full dash covers it with no seam.
  const dash = length + 2;
  const animatedProps = useAnimatedProps(() => {
    const [from, to] = window;
    const t = Math.min(1, Math.max(0, (progress.get() - from) / (to - from)));
    const hidden = dash * (1 - t);
    return {
      strokeDashoffset: fromEnd ? -hidden : hidden,
      // A zero-length dash would still draw its round cap as a dot.
      strokeOpacity: t > 0 ? 1 : 0,
    };
  });

  return (
    <AnimatedPath
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={[dash, dash]}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    pointerEvents: 'none',
  },
});
