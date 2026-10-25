import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Radius, Spacing, alpha } from '@/constants/theme';

export type ChipProps = {
  label: string;
  /** Selected chips are lit: a gold outline instead of a graphite one. */
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
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
      <AppText style={[styles.label, { color: selected ? Colors.text : Colors.textSecondary }]}>
        {label}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two - 1,
  },
  on: {
    borderColor: Colors.gold,
    backgroundColor: alpha(Colors.gold, 0.1),
  },
  off: {
    borderColor: Colors.line,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 20,
  },
});
