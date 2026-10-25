import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/pressable-scale';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Radius, Spacing, Springs, alpha } from '@/constants/theme';

const PAD = Spacing.two;
const GAP = Spacing.three - 4;
const BAR_HEIGHT = 64;

/** Bottom padding a tab screen needs so its content can scroll clear of the floating bar. */
export function useTabBarSpace() {
  const { bottom } = useSafeAreaInsets();
  return Math.max(bottom, GAP) + BAR_HEIGHT + Spacing.four;
}

/** A floating bar; the highlight slides to the focused tab. */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const [width, setWidth] = useState(0);
  const segment = (width - PAD * 2) / state.routes.length;
  const x = useSharedValue(0);

  useEffect(() => {
    x.set(withSpring(state.index * segment, Springs.slide));
  }, [state.index, segment, x]);

  const highlight = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View
      role="tablist"
      style={[styles.bar, { bottom: Math.max(insets.bottom, GAP) }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && <Animated.View style={[styles.highlight, { width: segment }, highlight]} />}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = index === state.index;
        const color = focused ? Colors.text : Colors.textSecondary;
        const onPress = () => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };
        return (
          <PressableScale
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.title}
            onPress={onPress}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            pressedScale={0.88}
            style={styles.tab}>
            {options.tabBarIcon?.({ focused, color, size: 22 })}
            <AppText style={[styles.label, { color }]}>{options.title}</AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

/** An emoji tab icon: dimmed when idle, a little bigger when focused. */
export function TabEmoji({
  emoji,
  focused,
  dot,
}: {
  emoji: string;
  focused: boolean;
  dot?: string;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: withSpring(focused ? 1 : 0.5, Springs.press),
    transform: [{ scale: withSpring(focused ? 1.12 : 1, Springs.pop) }],
  }));
  return (
    <View>
      <Animated.Text style={[styles.emoji, style]}>{emoji}</Animated.Text>
      {dot && <View style={[styles.dot, { backgroundColor: dot }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: GAP,
    right: GAP,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    padding: PAD,
    borderRadius: Radius.large,
    backgroundColor: alpha(Colors.surface, 0.96),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.line,
  },
  highlight: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: Radius.medium - 2,
    backgroundColor: Colors.surfaceRaised,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 15,
  },
  emoji: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  dot: {
    position: 'absolute',
    top: 0,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
});
