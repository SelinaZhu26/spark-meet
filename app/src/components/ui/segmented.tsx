import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { SQUIGGLE_WIDTH, Squiggle } from '@/components/ui/squiggle';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Spacing, Springs } from '@/constants/theme';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** A row of italic words; a gold squiggle slides under the picked one. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  // Each label's center, measured, so the squiggle can sit under words of any length.
  const [centers, setCenters] = useState<Record<string, number>>({});
  const center = centers[value];
  const x = useSharedValue(0);
  const shown = useSharedValue(0);

  useEffect(() => {
    if (center === undefined) {
      return;
    }
    const target = center - SQUIGGLE_WIDTH / 2;
    if (shown.get() === 0) {
      x.set(target);
      shown.set(1);
    } else {
      x.set(withSpring(target, Springs.slide));
    }
  }, [center, x, shown]);

  const squiggle = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ translateX: x.get() }],
  }));

  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            onLayout={(event) => {
              const { x: left, width } = event.nativeEvent.layout;
              setCenters((current) => ({ ...current, [option.value]: left + width / 2 }));
            }}
            hitSlop={8}
            style={styles.option}>
            <AppText style={[styles.label, { color: selected ? Colors.text : Colors.textMuted }]}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
      <Animated.View style={[styles.squiggle, squiggle]}>
        <Squiggle />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.four - 2,
    paddingBottom: Spacing.three - 4,
  },
  option: {
    paddingVertical: Spacing.one,
  },
  label: {
    fontFamily: Fonts.italic,
    fontSize: 20,
    lineHeight: 24,
  },
  squiggle: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
});
