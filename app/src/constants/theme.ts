/**
 * Spark is always dark: a night-sky menu canvas with brass trim and
 * parchment buttons, like an open-world RPG's pause screen.
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#151925',
  surface: '#1F2433',
  surfaceRaised: '#2A3043',
  border: '#3A4156',
  text: '#ECEEF3',
  textSecondary: '#A4AABA',
  textMuted: '#6C7387',
  /** Trim, headings and stars. */
  brass: '#D3BC8E',
  /** Button and selected-chip fill. */
  parchment: '#ECE5D8',
  /** Text on parchment. */
  ink: '#3B4255',
  /** An activated waypoint. */
  accent: '#86D8F2',
  friends: '#74C2A8',
  dating: '#F2A2BC',
  confirm: '#F2C14E',
  cancel: '#8FC3E8',
  danger: '#FF8A80',
  success: '#9EE6A8',
} as const;

export const Gradients = {
  /** Card art backgrounds by star rating. */
  rarity5: ['#8E5A33', '#B87A44', '#DDA65E'],
  rarity4: ['#4E4380', '#7360A8', '#9C82CC'],
  rarity3: ['#3D5A82', '#55779F', '#7397BF'],
  waypoint: ['#4FB6E0', '#86D8F2', '#D6F3FB'],
  dormant: ['#2E3446', '#232838'],
  sky: ['#0E1220', '#1B2340', '#3A3563'],
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
  small: 6,
  medium: 10,
  large: 16,
  pill: 999,
} as const;
