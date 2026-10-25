import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  /** The round badge on the left: a gold ring to go ahead, a cross to back out. */
  icon?: 'confirm' | 'cancel';
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;
  const filled = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        filled && styles.primary,
        variant === 'secondary' && styles.secondary,
        { opacity: inactive ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        pressed && filled && styles.primaryPressed,
        style,
      ]}>
      {icon && variant !== 'ghost' && (
        <View style={[styles.badge, !filled && styles.badgeOnDark]}>
          {icon === 'confirm' ? (
            <View style={styles.ring} />
          ) : (
            <AppText style={styles.cross}>✕</AppText>
          )}
        </View>
      )}
      {loading ? (
        <ActivityIndicator color={filled ? Colors.ink : Colors.text} />
      ) : (
        <AppText
          variant="heading"
          style={[styles.title, { color: filled ? Colors.ink : variant === 'ghost' ? Colors.textSecondary : Colors.text }]}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    minHeight: 52,
    paddingHorizontal: Spacing.five + Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.parchment,
  },
  primaryPressed: {
    backgroundColor: '#FFFFFF',
  },
  secondary: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: `${Colors.brass}66`,
  },
  badge: {
    position: 'absolute',
    left: 7,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOnDark: {
    backgroundColor: Colors.background,
  },
  ring: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: Colors.confirm,
  },
  cross: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: 800,
    color: Colors.cancel,
  },
  title: {
    fontSize: 17,
  },
});
