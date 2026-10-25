import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export type AppTextProps = TextProps & {
  variant?: 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';
  tone?: 'default' | 'secondary' | 'muted' | 'ink' | 'live' | 'danger';
};

export function AppText({ style, variant = 'body', tone = 'default', ...rest }: AppTextProps) {
  return <Text style={[styles[variant], { color: tones[tone] }, style]} {...rest} />;
}

const tones = {
  default: Colors.text,
  secondary: Colors.textSecondary,
  muted: Colors.textMuted,
  ink: Colors.ink,
  live: Colors.live,
  danger: Colors.danger,
} as const;

const styles = StyleSheet.create({
  display: {
    fontFamily: Fonts.rounded,
    fontSize: 44,
    lineHeight: 46,
    fontWeight: 800,
    letterSpacing: -1.5,
  },
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: 800,
    letterSpacing: -0.8,
  },
  heading: {
    fontFamily: Fonts.rounded,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 500,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 600,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: 800,
  },
});
