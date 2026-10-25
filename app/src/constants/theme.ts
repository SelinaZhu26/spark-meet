/**
 * Spark is always dark, like Spotify: flat near-black surfaces and warm
 * pastels for color. Nothing casts a shadow.
 */

export const Colors = {
  background: '#121212',
  surface: '#1F1F1F',
  surfaceRaised: '#2A2A2A',
  border: '#3E3E3E',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#7A7A7A',
  /** Text and icons drawn on a pastel. */
  ink: '#1C1418',
  butter: '#FFD96B',
  peach: '#FFB997',
  coral: '#FF9F87',
  bubblegum: '#FF9EC4',
  lilac: '#CDB4FF',
  danger: '#FF8A8A',
} as const;

/** Friends sparks and the brand are butter, dating sparks are bubblegum. */
export const Tones = {
  accent: Colors.butter,
  dating: Colors.bubblegum,
} as const;

export type Tone = keyof typeof Tones;

/** Cover art palettes: background, then two blobs. Dating covers stay pink. */
export const CoverPalettes = {
  friends: [
    [Colors.butter, Colors.peach, Colors.coral],
    [Colors.peach, Colors.butter, Colors.bubblegum],
    [Colors.coral, Colors.butter, Colors.peach],
  ],
  dating: [
    [Colors.bubblegum, Colors.lilac, Colors.butter],
    [Colors.lilac, Colors.bubblegum, Colors.peach],
  ],
} as const;

/** Loaded in the root layout. Each weight is its own family. */
export const Fonts = {
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  body: 'Figtree_500Medium',
  bodySemiBold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
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
  small: 8,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

/** Every press and pop uses one of these, so motion feels like one system. */
export const Springs = {
  press: { damping: 20, stiffness: 400 },
  pop: { damping: 12, stiffness: 260 },
} as const;

/** `#RRGGBB` plus an opacity, as `#RRGGBBAA`. */
export function alpha(hex: string, opacity: number) {
  return `${hex}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')}`;
}
