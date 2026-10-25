import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Radius, Springs, Tones } from '@/constants/theme';

const PAD = 4;

export type SegmentedOption<T extends string> = { value: T; label: string; color?: string };

export type SegmentedProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** A pill track whose highlight slides to the picked option. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const segment = (width - PAD * 2) / options.length;
  const x = useSharedValue(0);

  useEffect(() => {
    x.set(withSpring(index * segment, Springs.slide));
  }, [index, segment, x]);

  const highlight = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View
      accessibilityRole="tablist"
      style={styles.track}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View
          style={[
            styles.highlight,
            { width: segment, backgroundColor: options[index]?.color ?? Tones.accent },
            highlight,
          ]}
        />
      )}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={styles.segment}>
            <AppText
              style={[styles.label, { color: selected ? Colors.ink : Colors.textSecondary }]}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: PAD,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
  },
  highlight: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: Radius.pill,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 20,
  },
});
