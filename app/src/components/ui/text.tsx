import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, Tones } from '@/constants/theme';

export type AppTextProps = TextProps & {
  variant?: 'hero' | 'title' | 'heading' | 'body' | 'caption' | 'label';
  tone?: 'default' | 'secondary' | 'muted' | 'accent' | 'dating' | 'danger' | 'ink';
};

export function AppText({ style, variant = 'body', tone = 'default', ...rest }: AppTextProps) {
  return <Text style={[styles[variant], { color: tones[tone] }, style]} {...rest} />;
}

const tones = {
  default: Colors.text,
  secondary: Colors.textSecondary,
  muted: Colors.textMuted,
  accent: Tones.accent,
  dating: Tones.dating,
  danger: Colors.danger,
  ink: Colors.ink,
} as const;

const styles = StyleSheet.create({
  hero: {
    fontFamily: Fonts.semiBold,
    fontSize: 54,
    lineHeight: 54,
    letterSpacing: -1.2,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  heading: {
    fontFamily: Fonts.semiBold,
    fontSize: 23,
    lineHeight: 27,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    lineHeight: 24,
  },
  caption: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 20,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    lineHeight: 20,
  },
});
