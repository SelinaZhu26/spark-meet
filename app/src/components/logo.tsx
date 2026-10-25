import { StyleSheet, View } from 'react-native';

import { SparkMark } from '@/components/ui/spark-mark';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, MarkColors } from '@/constants/theme';

/** The lit sparkler and the wordmark. */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel="Spark"
      style={[styles.row, { gap: size * 0.16 }]}>
      <SparkMark size={size * 1.3} {...MarkColors.lit} />
      <AppText
        style={{
          fontFamily: Fonts.semiBoldItalic,
          fontSize: size * 1.05,
          lineHeight: size * 1.2,
          letterSpacing: -size * 0.02,
          color: Colors.text,
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
