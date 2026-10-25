import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { Shape, type ShapeKind } from '@/components/ui/shapes';
import { BlockPalettes, Radius, Spacing } from '@/constants/theme';
import { pick, seedOf } from '@/lib/seed';
import type { Mode } from '@/lib/types';

export type Palette = readonly [background: string, first: string, second: string];

export function blockPalette(seed: string, mode: Mode = 'friends'): Palette {
  return pick(seedOf(seed), BlockPalettes[mode]);
}

/** Shape layouts for big blocks, as fractions of the block's width. They stay top and right, clear of the text. */
const LAYOUTS: readonly (readonly {
  kind: ShapeKind;
  size: number;
  x: number;
  y: number;
  color: 1 | 2;
}[])[] = [
  [
    { kind: 'circle', size: 0.62, x: 0.56, y: -0.2, color: 1 },
    { kind: 'ring', size: 0.26, x: 0.7, y: 0.34, color: 2 },
    { kind: 'bolt', size: 0.18, x: 0.34, y: 0.08, color: 2 },
  ],
  [
    { kind: 'ring', size: 0.5, x: 0.6, y: -0.12, color: 1 },
    { kind: 'circle', size: 0.2, x: 0.42, y: 0.12, color: 2 },
    { kind: 'star', size: 0.24, x: 0.72, y: 0.4, color: 2 },
  ],
  [
    { kind: 'circle', size: 0.46, x: 0.64, y: 0.04, color: 1 },
    { kind: 'star', size: 0.2, x: 0.48, y: -0.02, color: 2 },
    { kind: 'ring', size: 0.22, x: 0.84, y: -0.06, color: 2 },
  ],
];

export type SparkBlockProps = {
  palette: Palette;
  /** Picks the shape layout. */
  seed: string;
  width: number;
  height: number;
  /** Shapes float and spin while live. */
  live?: boolean;
  /** A ring pings outward, like a radar. */
  pulse?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** A pastel color block with shapes, like a story slide. Children sit at the bottom. */
export function SparkBlock({
  palette,
  seed,
  width,
  height,
  live = false,
  pulse = false,
  children,
  style,
}: SparkBlockProps) {
  const [background, first, second] = palette;
  const layout = pick(seedOf(seed) >>> 3, LAYOUTS);

  return (
    <Animated.View
      style={[
        styles.block,
        {
          width,
          height,
          backgroundColor: background,
          transitionProperty: 'backgroundColor',
          transitionDuration: 450,
        },
        style,
      ]}>
      {layout.map((shape, index) => (
        <Shape
          key={index}
          kind={shape.kind}
          size={shape.size * width}
          color={shape.color === 1 ? first : second}
          motion={live ? (shape.kind === 'star' ? 'spin' : 'float') : 'none'}
          rotate={shape.kind === 'bolt' ? 12 : 0}
          style={{ left: shape.x * width, top: shape.y * width }}
        />
      ))}
      {pulse && (
        <Shape
          kind="ring"
          size={layout[0].size * width}
          color={first}
          motion="pulse"
          style={{ left: layout[0].x * width, top: layout[0].y * width }}
        />
      )}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const COVER_SHAPES: readonly ShapeKind[] = ['circle', 'ring', 'bolt', 'star'];

/** A small square cover for lists: the spark's color with one shape. */
export function SparkCover({ seed, mode, size }: { seed: string; mode: Mode; size: number }) {
  const n = seedOf(seed);
  const [background, first] = blockPalette(seed, mode);
  const kind = pick(n >>> 5, COVER_SHAPES);
  return (
    <View
      style={[
        styles.cover,
        { width: size, height: size, borderRadius: size * 0.28, backgroundColor: background },
      ]}>
      <Shape
        kind={kind}
        size={size * (kind === 'circle' ? 0.7 : 0.62)}
        color={first}
        style={
          kind === 'circle'
            ? { right: -size * 0.18, top: -size * 0.18 }
            : { left: size * 0.19, top: size * 0.19 }
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.three + 6,
  },
  cover: {
    overflow: 'hidden',
  },
});
