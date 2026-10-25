import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

/** A menu panel with a hairline of brass set just inside its edge. */
export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      <View pointerEvents="none" style={styles.trim} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  trim: {
    ...StyleSheet.absoluteFill,
    margin: 4,
    borderRadius: Radius.medium - 4,
    borderWidth: 1,
    borderColor: `${Colors.brass}2E`,
  },
});
