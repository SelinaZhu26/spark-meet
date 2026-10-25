import { PressableScale } from '@/components/ui/pressable-scale';
import { AppText } from '@/components/ui/text';
import { Fonts, Radius, Spacing, alpha } from '@/constants/theme';
import { themedStyles, useColors } from '@/lib/appearance';

export type ChipProps = {
  label: string;
  /** Selected chips are lit: a gold outline instead of a graphite one. */
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <PressableScale
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      disabled={!onPress}
      onPress={onPress}
      pressedScale={0.92}
      style={[
        styles.chip,
        selected ? styles.on : styles.off,
        { transitionProperty: ['borderColor', 'backgroundColor'], transitionDuration: 220 },
      ]}>
      <AppText style={[styles.label, { color: selected ? colors.text : colors.textSecondary }]}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const useStyles = themedStyles((colors) => ({
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two - 1,
  },
  on: {
    borderColor: colors.gold,
    backgroundColor: alpha(colors.gold, 0.1),
  },
  off: {
    borderColor: colors.line,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 20,
  },
}));
