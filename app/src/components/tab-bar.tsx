import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/pressable-scale';
import { SQUIGGLE_WIDTH, Squiggle } from '@/components/ui/squiggle';
import { AppText } from '@/components/ui/text';
import { Fonts, Spacing, Springs } from '@/constants/theme';
import { themedStyles, useColors } from '@/lib/appearance';

const BAR_HEIGHT = 58;

/** Bottom padding a tab screen needs so its content can scroll clear of the bar. */
export function useTabBarSpace() {
  const { bottom } = useSafeAreaInsets();
  return Math.max(bottom, Spacing.two) + BAR_HEIGHT + Spacing.four;
}

/** Italic words along the bottom edge; a gold squiggle slides under the focused tab. */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const colors = useColors();
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const segment = width / state.routes.length;
  const x = useSharedValue(0);

  useEffect(() => {
    x.set(withSpring(state.index * segment, Springs.slide));
  }, [state.index, segment, x]);

  const squiggle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View
      role="tablist"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.two) }]}>
      <View style={styles.tabs} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && (
          <Animated.View
            style={[styles.squiggle, { left: (segment - SQUIGGLE_WIDTH) / 2 }, squiggle]}>
            <Squiggle />
          </Animated.View>
        )}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = index === state.index;
          const color = focused ? colors.text : colors.textMuted;
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
              pressedScale={0.9}
              style={styles.tab}>
              <View>
                <AppText style={[styles.label, { color }]}>{options.title}</AppText>
                <View style={styles.adornment}>
                  {options.tabBarIcon?.({ focused, color, size: 6 })}
                </View>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

/** A gold speck beside a tab's name, e.g. while Spark is on. */
export function TabSpeck() {
  const styles = useStyles();
  return <View style={styles.speck} />;
}

const useStyles = themedStyles((colors) => ({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  tabs: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.italic,
    fontSize: 20,
    lineHeight: 24,
  },
  adornment: {
    position: 'absolute',
    top: Spacing.one + 1,
    right: -Spacing.three + 4,
  },
  squiggle: {
    position: 'absolute',
    bottom: Spacing.one + 1,
  },
  speck: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
}));
