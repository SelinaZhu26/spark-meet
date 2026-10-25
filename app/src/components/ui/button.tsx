import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Dots } from '@/components/ui/dots';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { AppText } from '@/components/ui/text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { themedStyles, useColors } from '@/lib/appearance';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  /** `primary` is a gold pill, the one lit thing on a screen; `ghost` is a graphite outline. */
  variant?: 'primary' | 'ghost';
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
  const colors = useColors();
  const styles = useStyles();
  const inactive = disabled || loading;
  // A disabled gold pill goes unlit: graphite with muted text, rather than a murky gold.
  const unlit = disabled && variant === 'primary';
  const color = unlit ? colors.textMuted : variant === 'primary' ? colors.ink : colors.text;
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
        unlit ? styles.unlit : disabled && styles.disabled,
        { transitionProperty: 'backgroundColor', transitionDuration: 250 },
        style,
      ]}>
      {loading ? (
        <Dots color={color} size={small ? 5 : 7} />
      ) : (
        <View style={styles.content}>
          {icon && <Icon name={icon} size={small ? 16 : 19} color={color} />}
          <AppText style={[styles.title, small && styles.smallTitle, { color }]}>{title}</AppText>
        </View>
      )}
    </PressableScale>
  );
}

const useStyles = themedStyles((colors) => ({
  base: {
    height: 54,
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
    backgroundColor: colors.gold,
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  unlit: {
    backgroundColor: colors.surfaceRaised,
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
    fontSize: 20,
    lineHeight: 24,
  },
  smallTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
}));
