/**
 * Spark is always dark: a deep plum canvas with bright pastel color blocks
 * and shapes on top. Nothing casts a shadow.
 */

export const Colors = {
  background: '#17111D',
  surface: '#211A29',
  surfaceRaised: '#2D2436',
  line: 'rgba(255, 255, 255, 0.09)',
  text: '#FFFFFF',
  textSecondary: '#B3A7BF',
  textMuted: '#7D7088',
  /** Text and icons drawn on a pastel. */
  ink: '#22182A',
  yellow: '#FFD97A',
  pink: '#FF8FB8',
  lime: '#B5E48C',
  purple: '#A18BFF',
  teal: '#7FDCD0',
  orange: '#FFA173',
  danger: '#FF6B81',
} as const;

/** Friends sparks and the brand are yellow, dating sparks are pink. */
export const Tones = {
  accent: Colors.yellow,
  dating: Colors.pink,
} as const;

export type Tone = keyof typeof Tones;

type BlockPalette = readonly [background: string, first: string, second: string];

/** Color blocks: a background and two shape colors. Dating blocks stay pink and purple. */
export const BlockPalettes: Record<'friends' | 'dating', readonly BlockPalette[]> = {
  friends: [
    [Colors.yellow, Colors.purple, Colors.ink],
    [Colors.lime, Colors.pink, Colors.ink],
    [Colors.teal, Colors.yellow, Colors.ink],
    [Colors.orange, Colors.yellow, Colors.purple],
  ],
  dating: [
    [Colors.pink, Colors.purple, Colors.ink],
    [Colors.purple, Colors.pink, Colors.yellow],
  ],
};

/** The light screens you see before signing in. */
export const Welcome = {
  gradient: ['#FFE9A6', '#FFF4EC', '#E7DCFF'],
  /** Ink at 8% and 20%: input fills and borders on the light screens. */
  fill: 'rgba(34, 24, 42, 0.08)',
  border: 'rgba(34, 24, 42, 0.2)',
} as const;

/** Crimson Pro, loaded in the root layout. Each weight is its own family. */
export const Fonts = {
  regular: 'CrimsonPro_400Regular',
  medium: 'CrimsonPro_500Medium',
  semiBold: 'CrimsonPro_600SemiBold',
  bold: 'CrimsonPro_700Bold',
  italic: 'CrimsonPro_500Medium_Italic',
  semiBoldItalic: 'CrimsonPro_600SemiBold_Italic',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 14,
  medium: 20,
  large: 26,
  pill: 999,
} as const;

/** Every press, pop and slide uses one of these, so motion feels like one system. */
export const Springs = {
  press: { duration: 280, dampingRatio: 0.65 },
  pop: { duration: 520, dampingRatio: 0.55 },
  slide: { duration: 420, dampingRatio: 0.9 },
} as const;

/** `#RRGGBB` plus an opacity, as `#RRGGBBAA`. */
export function alpha(hex: string, opacity: number) {
  return `${hex}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')}`;
}
