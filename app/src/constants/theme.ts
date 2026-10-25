/**
 * Spark is a sparkler lit in the dark: a warm charcoal night, warm-white
 * type, graphite hairlines, and gold only where there's light. Nothing
 * casts a shadow or glows; light is gold strokes and color.
 */

export const Colors = {
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
  ink: '#1E1E1C',
  gold: '#F5C94E',
  /** The gold, under the name the notification and foreground-service tints use. */
  yellow: '#F5C94E',
  danger: '#EE8C7E',
} as const;

/** The logo's strokes, recolored for the dark: unlit is graphite, lit reads as light. */
export const MarkColors = {
  unlit: { ink: '#3A3734', gold: '#46423D', ash: '#2C2A27' },
  lit: { stick: '#7F796F', ink: '#D2CABC', gold: Colors.gold, ash: '#A9A399' },
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
