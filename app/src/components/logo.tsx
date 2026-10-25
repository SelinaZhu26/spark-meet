import { StyleSheet, View } from 'react-native';

import { SparkMark } from '@/components/ui/spark-mark';
import { AppText } from '@/components/ui/text';
import { Fonts } from '@/constants/theme';
import { useAppearance } from '@/lib/appearance';

/** The lit sparkler and the wordmark. */
export function Logo({ size = 26 }: { size?: number }) {
  const { colors, marks } = useAppearance();
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel="Spark"
      style={[styles.row, { gap: size * 0.16 }]}>
      <SparkMark size={size * 1.3} {...marks.lit} />
      <AppText
        style={{
          fontFamily: Fonts.semiBoldItalic,
          fontSize: size * 1.05,
          lineHeight: size * 1.2,
          letterSpacing: -size * 0.02,
          color: colors.text,
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
