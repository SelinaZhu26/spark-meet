import { Pressable, StyleSheet } from 'react-native';

import { Diamond } from '@/components/ui/ornament';
import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type ChipProps = {
  label: string;
  selected?: boolean;
  /** Draws a colored diamond before the label, e.g. for the friends or dating pool. */
  accent?: string;
  onPress?: () => void;
};

export function Chip({ label, selected = false, accent, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      {accent && <Diamond size={7} color={accent} />}
      <AppText variant="caption" style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two - 1,
  },
  selected: {
    backgroundColor: Colors.parchment,
    borderColor: Colors.parchment,
  },
  label: {
    color: Colors.textSecondary,
    fontWeight: 700,
  },
  selectedLabel: {
    color: Colors.ink,
  },
  pressed: {
    opacity: 0.7,
  },
});
