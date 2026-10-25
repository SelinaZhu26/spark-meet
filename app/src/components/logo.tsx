import { StyleSheet, View } from 'react-native';

import { SparkMark } from '@/components/ui/spark-mark';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts } from '@/constants/theme';

/** The sparkler and the wordmark. `dark` is for the light screens. */
export function Logo({ size = 26, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel="Spark"
      style={[styles.row, { gap: size * 0.18 }]}>
      <SparkMark
        size={size * 1.3}
        ink={dark ? Colors.ink : Colors.text}
        gold={Colors.yellow}
        ash={dark ? Colors.textMuted : Colors.textSecondary}
      />
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
