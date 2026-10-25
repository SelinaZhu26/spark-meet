import Svg, { Path } from 'react-native-svg';

import { useColors } from '@/lib/appearance';

export const SQUIGGLE_WIDTH = 30;

/** A short hand-drawn gold wave, the underline for whatever is picked. */
export function Squiggle({ color }: { color?: string }) {
  const colors = useColors();
  return (
    <Svg width={SQUIGGLE_WIDTH} height={10} viewBox="0 0 30 10">
      <Path
        d="M2 6.5 C5 2.5 8.5 2.2 11.5 5.2 C14.5 8.2 18 8.4 21 5.4 C23.5 3 26 2.6 28 4"
        fill="none"
        stroke={color ?? colors.gold}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
