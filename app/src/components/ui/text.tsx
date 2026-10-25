import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export type AppTextProps = TextProps & {
  variant?: 'hero' | 'title' | 'heading' | 'body' | 'caption' | 'label';
  tone?: 'default' | 'secondary' | 'muted' | 'accent' | 'danger' | 'ink';
};

export function AppText({ style, variant = 'body', tone = 'default', ...rest }: AppTextProps) {
  return <Text style={[styles[variant], { color: tones[tone] }, style]} {...rest} />;
}

const tones = {
  default: Colors.text,
  secondary: Colors.textSecondary,
  muted: Colors.textMuted,
  accent: Colors.gold,
  danger: Colors.danger,
  ink: Colors.ink,
} as const;

const styles = StyleSheet.create({
  hero: {
    fontFamily: Fonts.lightItalic,
    fontSize: 54,
    lineHeight: 56,
    letterSpacing: -1.2,
  },
  title: {
    fontFamily: Fonts.lightItalic,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  heading: {
    fontFamily: Fonts.semiBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.2,
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
