import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type LiveSwitchProps = {
  active: boolean;
  busy: boolean;
  onPress: () => void;
};

/** The ON/OFF switch: a pill that says Live with a beating dot while Spark is on. */
export function LiveSwitch({ active, busy, onPress }: LiveSwitchProps) {
  const beat = useSharedValue(0);

  useEffect(() => {
    if (active) {
      beat.set(withRepeat(withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }), -1, false));
    } else {
      cancelAnimation(beat);
      beat.set(0);
    }
  }, [active, beat]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: active ? 1 - beat.get() : 0,
    transform: [{ scale: 1 + beat.get() * 1.6 }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: active, busy }}
      accessibilityLabel={active ? 'Spark is on. Tap to switch off.' : 'Spark is off. Tap to switch on.'}
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        { transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}>
      <View style={styles.dotSlot}>
        {busy ? (
          <ActivityIndicator size="small" color={active ? Colors.ink : Colors.text} />
        ) : (
          <>
            <Animated.View style={[styles.dot, styles.ring, ringStyle]} />
            <View style={[styles.dot, active ? styles.dotActive : styles.dotOff]} />
          </>
        )}
      </View>
      <AppText variant="label" tone={active ? 'ink' : 'default'}>
        {active ? 'Live' : 'Off'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingLeft: Spacing.three - 4,
    paddingRight: Spacing.three,
    paddingVertical: Spacing.two + 2,
    backgroundColor: Colors.surfaceRaised,
  },
  pillActive: {
    backgroundColor: Colors.live,
  },
  dotSlot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: Colors.ink,
  },
  dotOff: {
    backgroundColor: Colors.textMuted,
  },
  ring: {
    position: 'absolute',
    backgroundColor: Colors.ink,
  },
});
