import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Dots } from '@/components/ui/dots';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Radius, Spacing, Tones, Welcome } from '@/constants/theme';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  /** `dark` and `light` are for buttons sitting on a pastel. */
  variant?: 'primary' | 'dating' | 'dark' | 'ghost' | 'light';
  size?: 'regular' | 'small';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'regular',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;
  const color = foregrounds[variant];
  const small = size === 'small';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={[
        styles.base,
        small && styles.small,
        styles[variant],
        disabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <Dots color={color} size={small ? 5 : 7} />
      ) : (
        <View style={styles.content}>
          {icon && <Icon name={icon} size={small ? 16 : 20} color={color} />}
          <AppText style={[styles.title, small && styles.smallTitle, { color }]}>{title}</AppText>
        </View>
      )}
    </PressableScale>
  );
}

const foregrounds = {
  primary: Colors.ink,
  dating: Colors.ink,
  dark: Colors.text,
  ghost: Colors.text,
  light: Colors.ink,
} as const;

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  small: {
    height: 38,
    paddingHorizontal: Spacing.three,
  },
  primary: {
    backgroundColor: Tones.accent,
  },
  dating: {
    backgroundColor: Tones.dating,
  },
  dark: {
    backgroundColor: Colors.ink,
  },
  ghost: {
    backgroundColor: Colors.surfaceRaised,
  },
  light: {
    backgroundColor: Welcome.fill,
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.semiBoldItalic,
    fontSize: 19,
    lineHeight: 23,
  },
  smallTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
});
