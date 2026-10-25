import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AppText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

export type DiamondProps = {
  size?: number;
  color?: string;
  outline?: boolean;
  style?: ViewStyle;
};

/** The square-on-its-corner motif used for bullets, trim and markers. */
export function Diamond({ size = 8, color = Colors.brass, outline = false, style }: DiamondProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          transform: [{ rotate: '45deg' }],
          ...(outline ? { borderWidth: 1.5, borderColor: color } : { backgroundColor: color }),
        },
        style,
      ]}
    />
  );
}

/** A brass rule with a diamond at its center. */
export function Divider({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.divider, style]}>
      <View style={styles.rule} />
      <Diamond size={6} outline />
      <Diamond size={7} />
      <Diamond size={6} outline />
      <View style={styles.rule} />
    </View>
  );
}

export type StarsProps = {
  count: number;
  size?: number;
  /** Pop the stars in one by one, like a reveal. */
  stagger?: number;
};

export function Stars({ count, size = 16, stagger }: StarsProps) {
  return (
    <View style={styles.stars} accessibilityLabel={`${count} stars`}>
      {Array.from({ length: count }, (_, index) => (
        <Animated.View
          key={index}
          entering={stagger === undefined ? undefined : ZoomIn.delay(index * stagger).springify()}>
          <AppText style={[styles.star, { fontSize: size, lineHeight: size * 1.2 }]}>★</AppText>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: `${Colors.brass}59`,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  star: {
    color: Colors.confirm,
  },
});
