import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type ChipProps = {
  label: string;
  selected?: boolean;
  tone?: 'ember' | 'dating';
  onPress?: () => void;
};

export function Chip({ label, selected = false, tone = 'ember', onPress }: ChipProps) {
  const accent = tone === 'dating' ? Colors.dating : Colors.ember;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: `${accent}26`, borderColor: accent },
        pressed && styles.pressed,
      ]}>
      <AppText variant="caption" style={[styles.label, selected && { color: Colors.text }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two,
  },
  label: {
    color: Colors.textSecondary,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
