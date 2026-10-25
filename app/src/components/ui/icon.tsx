import { MaterialSymbols_600SemiBold_Filled } from '@expo-google-fonts/material-symbols/600SemiBold_Filled';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

/** Material Symbols' filled set, so Android and web match the iOS `.fill` symbols. */
export const iconFont = {
  name: 'MaterialSymbols_600SemiBold_Filled',
  font: MaterialSymbols_600SemiBold_Filled,
};

const glyphs = {
  spark: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  sparks: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  you: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  pause: { ios: 'pause.fill', android: 'pause', web: 'pause' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  wave: { ios: 'hand.wave.fill', android: 'waving_hand', web: 'waving_hand' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  chat: { ios: 'bubble.left.fill', android: 'chat_bubble', web: 'chat_bubble' },
  send: { ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' },
  friends: { ios: 'person.2.fill', android: 'group', web: 'group' },
  dating: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
} satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof glyphs;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 24, color = Colors.text, style }: IconProps) {
  return (
    <SymbolView
      name={glyphs[name]}
      size={size}
      tintColor={color}
      weight={{ ios: 'semibold', android: iconFont }}
      style={style}
    />
  );
}
