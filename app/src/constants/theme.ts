/**
 * Spark is always dark: a plum-black canvas where each spark is a bright
 * pastel card that pops up and gets swiped away.
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#16131A',
  surface: '#221E27',
  surfaceRaised: '#2D2833',
  border: '#3A3441',
  text: '#FBF8FF',
  textSecondary: '#B7AFC2',
  textMuted: '#7D7488',
  /** Text on a pastel card. */
  ink: '#1C1722',
  /** Spark is switched on. */
  live: '#8EF0B4',
  wave: '#FFB1CF',
  danger: '#FF7A85',
  success: '#8EF0B4',
} as const;

/** Card colors. Friends sparks get the cool half, dating sparks the warm half. */
export const Pastels = {
  friends: ['#9FE2C5', '#FFE38A', '#A9D4FF'],
  dating: ['#FFB1CF', '#CDB8FF', '#FFB8A8'],
} as const;

export const Fonts = Platform.select({
  ios: { rounded: 'ui-rounded', mono: 'ui-monospace' },
  web: { rounded: 'ui-rounded, system-ui, sans-serif', mono: 'ui-monospace, monospace' },
  default: { rounded: 'normal', mono: 'monospace' },
});

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
  medium: 20,
  large: 32,
  pill: 999,
} as const;
