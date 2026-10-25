import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, tracking, type Palette } from '@/constants/theme';
import { useColors } from '@/lib/appearance';

export type AppTextProps = TextProps & {
  variant?: 'hero' | 'title' | 'heading' | 'body' | 'caption' | 'label';
  tone?: 'default' | 'secondary' | 'muted' | 'accent' | 'danger' | 'ink';
};

export function AppText({ style, variant = 'body', tone = 'default', ...rest }: AppTextProps) {
  const colors = useColors();
  return (
    <Text
      // Android's default "highQuality" breaking can measure a line narrower than it draws.
      textBreakStrategy="simple"
      style={[styles[variant], { color: colors[tones[tone]] }, style]}
      {...rest}
    />
  );
}

const tones = {
  default: 'text',
  secondary: 'textSecondary',
  muted: 'textMuted',
  accent: 'accent',
  danger: 'danger',
  ink: 'ink',
} as const satisfies Record<string, keyof Palette>;

const styles = StyleSheet.create({
  hero: {
    fontFamily: Fonts.lightItalic,
    fontSize: 54,
    lineHeight: 56,
    letterSpacing: tracking(-1.2),
  },
  title: {
    fontFamily: Fonts.lightItalic,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: tracking(-0.6),
  },
  heading: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: tracking(-0.2),
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 18,
    lineHeight: 24,
  },
  caption: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 20,
  },
  /** Small italic section labels: "icebreaker", "linked accounts". */
  label: {
    fontFamily: Fonts.italic,
    fontSize: 16,
    lineHeight: 20,
  },
});
