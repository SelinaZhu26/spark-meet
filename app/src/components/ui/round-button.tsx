import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

export type RoundButtonProps = {
  glyph: string;
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
};

/** The big circular pass / wave buttons under a card. */
export function RoundButton({
  glyph,
  label,
  onPress,
  color = Colors.surfaceRaised,
  size = 68,
  disabled = false,
}: RoundButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        { opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
      ]}>
      <AppText style={{ fontSize: size * 0.4, lineHeight: size * 0.5, fontWeight: 800, color: Colors.text }}>
        {glyph}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
