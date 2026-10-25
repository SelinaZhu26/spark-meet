import { Gradients } from '@/constants/theme';

export type Rarity = 3 | 4 | 5;

/** Star rating for a spark: the stronger the match, the rarer the pull. */
export function rarity(score: number): Rarity {
  return score >= 85 ? 5 : score >= 75 ? 4 : 3;
}

export const rarityGradient = {
  5: Gradients.rarity5,
  4: Gradients.rarity4,
  3: Gradients.rarity3,
} as const;

/** The streak color a pull falls in before it's revealed. */
export const rarityGlow = {
  5: '#FFD27A',
  4: '#C9A8FF',
  3: '#9CCBFF',
} as const;
