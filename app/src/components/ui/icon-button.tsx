import { type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { themedStyles, useColors } from '@/lib/appearance';

export type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  color?: string;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** A round button with a graphite hairline. */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
  color,
  iconColor,
  style,
}: IconButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      pressedScale={0.9}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color ?? colors.surface,
        },
        style,
      ]}>
      <Icon name={icon} size={size * 0.48} color={iconColor ?? colors.text} />
    </PressableScale>
  );
}

const useStyles = themedStyles((colors) => ({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
}));
