import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Fill for a primary button, e.g. the spark's own card color. Defaults to white. */
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  color = Colors.text,
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;
  const filled = variant === 'primary';
  const textColor = filled ? Colors.ink : variant === 'ghost' ? Colors.textSecondary : Colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        filled && { backgroundColor: color },
        variant === 'secondary' && styles.secondary,
        { opacity: inactive ? 0.45 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <AppText variant="heading" style={[styles.title, { color: textColor }]}>
          {icon ? `${icon}  ${title}` : title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    minHeight: 56,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: Colors.surfaceRaised,
  },
  title: {
    fontSize: 17,
  },
});
