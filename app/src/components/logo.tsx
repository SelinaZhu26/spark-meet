import { StyleSheet, View } from 'react-native';

import { Sparky } from '@/components/ui/sparky';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

/** The mascot and the wordmark. `dark` is for the light screens. */
export function Logo({ size = 26, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel="Spark"
      style={[styles.row, { gap: size * 0.28 }]}>
      <Sparky size={size * 0.82} />
      <AppText
        style={{
          fontFamily: Fonts.semiBoldItalic,
          fontSize: size * 1.1,
          lineHeight: size * 1.2,
          letterSpacing: -size * 0.02,
          color: dark ? Colors.ink : Colors.text,
        }}>
        spark
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
