/**
 * Spark is always dark: a warm, low-light canvas so the ember glow pops.
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#0D0907',
  surface: '#1A1310',
  surfaceRaised: '#251B16',
  border: '#3A2A22',
  text: '#FFF4EC',
  textSecondary: '#B9A79C',
  textMuted: '#7C6B61',
  ember: '#FF6A1F',
  flame: '#FFB23F',
  glow: '#FFD873',
  dating: '#FF4F8B',
  datingSoft: '#3A1424',
  danger: '#FF5A5A',
  success: '#5EE6A0',
} as const;

/** Friends get the ember gradient, dating gets a rose one. */
export const Gradients = {
  ember: ['#FF4D1A', '#FF8A1F', '#FFC23F'],
  dating: ['#FF3D7F', '#FF6A9A', '#FFB0A0'],
  ash: ['#2A1F1A', '#1A1310'],
} as const;

export const Fonts = Platform.select({
  ios: { rounded: 'ui-rounded', mono: 'ui-monospace' },
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
  small: 10,
  medium: 16,
  large: 28,
  pill: 999,
} as const;
