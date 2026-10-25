import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Colors } from '@/constants/theme';

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
  color = Colors.surface,
  iconColor = Colors.text,
  style,
}: IconButtonProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      pressedScale={0.9}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}>
      <Icon name={icon} size={size * 0.48} color={iconColor} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.lineStrong,
  },
});
