import { StyleSheet } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Radius, Spacing, Tones, Welcome, type Tone } from '@/constants/theme';

export type ChipProps = {
  label: string;
  selected?: boolean;
  tone?: Tone;
  /** For chips on the light screens. */
  light?: boolean;
  onPress?: () => void;
};

export function Chip({
  label,
  selected = false,
  tone = 'accent',
  light = false,
  onPress,
}: ChipProps) {
  const fill = selected
    ? light
      ? Colors.ink
      : Tones[tone]
    : light
      ? Welcome.fill
      : Colors.surfaceRaised;
  const color = selected ? (light ? Colors.text : Colors.ink) : light ? Colors.ink : Colors.text;
  return (
    <PressableScale
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      disabled={!onPress}
      onPress={onPress}
      pressedScale={0.92}
      style={[styles.chip, { backgroundColor: fill }]}>
      <AppText style={[styles.label, { color }]}>{label}</AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 20,
  },
});
