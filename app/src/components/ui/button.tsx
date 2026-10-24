import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors, Gradients, Radius, Spacing } from '@/constants/theme';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'dating' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
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
  const filled = variant === 'primary' || variant === 'dating';
  const label = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={filled ? Colors.background : Colors.text} />
      ) : (
        <AppText
          variant="heading"
          style={[styles.title, { color: filled ? Colors.background : Colors.text }]}>
          {icon ? `${icon}  ${title}` : title}
        </AppText>
      )}
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' && styles.secondary,
        { opacity: inactive ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}>
      {filled ? (
        <LinearGradient
          colors={variant === 'dating' ? Gradients.dating : Gradients.ember}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fill}>
          {label}
        </LinearGradient>
      ) : (
        label
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fill: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
  },
});
