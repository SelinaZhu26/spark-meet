/**
 * Spark is a sparkler lit in the dark: a warm charcoal night, warm-white
 * type, graphite hairlines, and gold only where there's light. A daylight
 * scheme puts the same sparkler on white. Nothing casts a shadow or glows.
 */

export type ColorScheme = 'dark' | 'light';

/** The logo's own gold and charcoal, the same in both schemes. */
export const Brand = {
  gold: '#F5C94E',
  charcoal: '#1E1E1C',
};

const dark = {
  background: '#141312',
  /** Deeper night behind the spark alert. */
  night: '#0E0D0C',
  surface: '#1B1A18',
  surfaceRaised: '#252321',
  /** Graphite hairlines around cards, fields and quiet buttons. */
  line: '#33312E',
  lineStrong: '#4A4743',
  text: '#F3EEE5',
  textSecondary: '#A9A399',
  textMuted: '#7C766E',
  /** Text and icons drawn on gold. */
  ink: Brand.charcoal,
  /** Gold for fills and strokes. */
  gold: Brand.gold,
  /** Gold for text, which needs more contrast against a light page. */
  accent: Brand.gold,
  danger: '#EE8C7E',
};

/** Daylight: the logo's white page, charcoal type, the same gold. */
const light: typeof dark = {
  background: '#FFFFFF',
  night: '#FFFFFF',
  surface: '#F7F6F3',
  surfaceRaised: '#EEECE7',
  line: '#E3E1DB',
  lineStrong: '#CBC8C0',
  text: Brand.charcoal,
  textSecondary: '#5C5C5A',
  textMuted: '#8C8982',
  ink: Brand.charcoal,
  gold: Brand.gold,
  accent: '#946B00',
  danger: '#B3261E',
};

export type Palette = typeof dark;

export const Palettes: Record<ColorScheme, Palette> = { dark, light };

/** The logo's strokes per scheme: unlit is a faint sketch, lit reads as light. */
export const MarkPalettes = {
  dark: {
    unlit: { ink: '#3A3734', gold: '#46423D', ash: '#2C2A27' },
    lit: { stick: '#7F796F', ink: '#D2CABC', gold: Brand.gold, ash: '#A9A399' },
  },
  light: {
    unlit: { ink: '#D8D5CE', gold: '#E4E1DA', ash: '#E9E7E1' },
    lit: { stick: '#4A4845', ink: Brand.charcoal, gold: Brand.gold, ash: '#5C5C5A' },
  },
} as const;

/** Crimson Pro, loaded in the root layout. Each weight is its own family. */
export const Fonts = {
  light: 'CrimsonPro_300Light',
  regular: 'CrimsonPro_400Regular',
  medium: 'CrimsonPro_500Medium',
  semiBold: 'CrimsonPro_600SemiBold',
  /** Huge numbers, like the match on the spark alert. */
  thinItalic: 'CrimsonPro_200ExtraLight_Italic',
  lightItalic: 'CrimsonPro_300Light_Italic',
  regularItalic: 'CrimsonPro_400Regular_Italic',
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
  small: 12,
  medium: 18,
  large: 24,
  pill: 999,
} as const;

/** Every press, pop and slide uses one of these, so motion feels like one system. */
export const Springs = {
  press: { duration: 280, dampingRatio: 0.7 },
  pop: { duration: 520, dampingRatio: 0.6 },
  slide: { duration: 420, dampingRatio: 0.9 },
} as const;

/** `#RRGGBB` plus an opacity, as `#RRGGBBAA`. */
export function alpha(hex: string, opacity: number) {
  return `${hex}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')}`;
}
