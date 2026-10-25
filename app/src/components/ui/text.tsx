import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

export type AppTextProps = TextProps & {
  variant?: 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';
  tone?: 'default' | 'secondary' | 'muted' | 'brass' | 'ink' | 'friends' | 'dating' | 'danger';
};

export function AppText({ style, variant = 'body', tone = 'default', ...rest }: AppTextProps) {
  return <Text style={[styles[variant], { color: tones[tone] }, style]} {...rest} />;
}

const tones = {
  default: Colors.text,
  secondary: Colors.textSecondary,
  muted: Colors.textMuted,
  brass: Colors.brass,
  ink: Colors.ink,
  friends: Colors.friends,
  dating: Colors.dating,
  danger: Colors.danger,
} as const;

const styles = StyleSheet.create({
  display: {
    fontFamily: Fonts.rounded,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: 700,
    letterSpacing: 1,
  },
  title: {
    fontFamily: Fonts.rounded,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: 700,
  },
  heading: {
    fontFamily: Fonts.rounded,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
  },
  body: {
    fontFamily: Fonts.rounded,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 500,
  },
  caption: {
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  label: {
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 700,
    letterSpacing: 0.4,
  },
});
