import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type ChipProps = {
  label: string;
  selected?: boolean;
  /** Fill when selected. Defaults to white. */
  color?: string;
  /** For chips sitting on a pastel card. */
  onCard?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, color = Colors.text, onCard = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        onCard && styles.onCard,
        selected && { backgroundColor: color },
        pressed && styles.pressed,
      ]}>
      <AppText
        variant="caption"
        style={[styles.label, (selected || onCard) && styles.inkLabel]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceRaised,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two,
  },
  onCard: {
    backgroundColor: 'rgba(28, 23, 34, 0.1)',
  },
  label: {
    color: Colors.textSecondary,
    fontWeight: 700,
  },
  inkLabel: {
    color: Colors.ink,
  },
  pressed: {
    opacity: 0.7,
  },
});
