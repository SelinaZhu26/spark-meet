import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export type AppTextProps = TextProps & {
  variant?: 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';
  tone?: 'default' | 'secondary' | 'muted' | 'ember' | 'dating' | 'danger';
};

export function AppText({ style, variant = 'body', tone = 'default', ...rest }: AppTextProps) {
  return <Text style={[styles[variant], { color: tones[tone] }, style]} {...rest} />;
}

const tones = {
  default: Colors.text,
  secondary: Colors.textSecondary,
  muted: Colors.textMuted,
  ember: Colors.flame,
  dating: Colors.dating,
  danger: Colors.danger,
} as const;

const styles = StyleSheet.create({
  display: {
    fontFamily: Fonts.rounded,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: 800,
    letterSpacing: -1,
  },
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 800,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: Fonts.rounded,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 700,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: 500,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 800,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
