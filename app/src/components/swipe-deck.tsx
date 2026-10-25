import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { MomentCard } from '@/components/moment-card';
import { RoundButton } from '@/components/ui/round-button';
import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Spark } from '@/lib/types';

export type Decision = 'wave' | 'pass';

export type SwipeDeckProps = {
  sparks: Spark[];
  /** Called once the card has left the screen. */
  onDecide: (spark: Spark, decision: Decision) => void;
  onOpen: (spark: Spark) => void;
  disabled?: boolean;
};

/** Sparks stacked like cards: swipe right to wave, left to leave it for later. */
export function SwipeDeck({ sparks, onDecide, onOpen, disabled = false }: SwipeDeckProps) {
  const [queued, setQueued] = useState<{ id: string; decision: Decision } | null>(null);
  const [top, ...rest] = sparks;
  const behind = rest.slice(0, 2);

  if (!top) {
    return null;
  }

  return (
    <View style={styles.deck}>
      <View style={styles.stack}>
        {behind
          .map((spark, index) => (
            <MomentCard
              key={spark.id}
              spark={spark}
              style={[
                styles.layer,
                { transform: [{ translateY: (index + 1) * 26 }, { scale: 1 - (index + 1) * 0.05 }] },
              ]}
            />
          ))
          .reverse()}
        <SwipeCard
          key={top.id}
          decision={queued?.id === top.id ? queued.decision : null}
          onDecide={(decision) => onDecide(top, decision)}
          onPress={() => onOpen(top)}
          onQueue={(decision) => setQueued({ id: top.id, decision })}>
          <MomentCard spark={top} />
        </SwipeCard>
      </View>
      <View style={styles.actions}>
        <RoundButton
          glyph="✕"
          label="Later"
          disabled={disabled}
          onPress={() => setQueued({ id: top.id, decision: 'pass' })}
        />
        <RoundButton
          glyph="👋"
          label="Wave"
          size={84}
          color={Colors.wave}
          disabled={disabled}
          onPress={() => setQueued({ id: top.id, decision: 'wave' })}
        />
      </View>
    </View>
  );
}

/** The next card rises into place when the one above it is thrown away. */
const rise: EntryExitAnimationFunction = () => {
  'worklet';
  return {
    initialValues: { transform: [{ translateY: 26 }, { scale: 0.95 }] },
    animations: {
      transform: [
        { translateY: withTiming(0, { duration: 220 }) },
        { scale: withTiming(1, { duration: 220 }) },
      ],
    },
  };
};

type SwipeCardProps = {
  decision: Decision | null;
  onDecide: (decision: Decision) => void;
  onPress: () => void;
  /** Screen reader actions throw the card the same way the buttons do. */
  onQueue: (decision: Decision) => void;
  children: ReactNode;
};

const ACCESSIBILITY_ACTIONS = [
  { name: 'activate' },
  { name: 'wave', label: 'Wave' },
  { name: 'pass', label: 'Later' },
];

function SwipeCard({ decision, onDecide, onPress, onQueue, children }: SwipeCardProps) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const gone = useSharedValue(false);

  const throwAway = useCallback(
    (direction: number) => {
      'worklet';
      if (gone.get()) {
        return;
      }
      gone.set(true);
      y.set(withTiming(y.get() + 60, { duration: 260 }));
      x.set(
        withTiming(direction * width * 1.4, { duration: 260 }, (finished) => {
          if (finished) {
            scheduleOnRN(onDecide, direction > 0 ? 'wave' : 'pass');
          }
        })
      );
    },
    [gone, x, y, width, onDecide]
  );

  useEffect(() => {
    if (decision) {
      throwAway(decision === 'wave' ? 1 : -1);
    }
  }, [decision, throwAway]);

  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    onUpdate: (event) => {
      x.set(event.translationX);
      y.set(event.translationY * 0.4);
    },
    onDeactivate: (event) => {
      if (Math.abs(event.translationX) > width * 0.28 || Math.abs(event.velocityX) > 900) {
        throwAway(Math.sign(event.translationX || event.velocityX));
      } else {
        x.set(withSpring(0));
        y.set(withSpring(0));
      }
    },
  });

  // A tap opens the card; a drag that wins the race throws it instead.
  const tap = useTapGesture({
    maxDistance: 10,
    onActivate: () => {
      scheduleOnRN(onPress);
    },
  });
  const gesture = useCompetingGestures(pan, tap);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { rotate: `${(x.get() / width) * 14}deg` },
    ],
  }));
  const waveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [16, 110], [0, 1], Extrapolation.CLAMP),
  }));
  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [-110, -16], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View entering={rise} style={styles.layer}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityHint="Opens this spark"
          accessibilityActions={ACCESSIBILITY_ACTIONS}
          onAccessibilityAction={({ nativeEvent }) => {
            if (nativeEvent.actionName === 'activate') {
              onPress();
            } else {
              onQueue(nativeEvent.actionName === 'wave' ? 'wave' : 'pass');
            }
          }}
          style={[styles.layer, cardStyle]}>
          {children}
          <Animated.View pointerEvents="none" style={[styles.stamp, styles.waveStamp, waveStyle]}>
            <AppText variant="heading" tone="ink">
              Wave
            </AppText>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.stamp, styles.passStamp, passStyle]}>
            <AppText variant="heading" tone="ink">
              Later
            </AppText>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
    gap: Spacing.four,
  },
  stack: {
    flex: 1,
    marginBottom: 40,
  },
  layer: {
    ...StyleSheet.absoluteFill,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  stamp: {
    position: 'absolute',
    top: 72,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.small,
    borderWidth: 3,
    borderColor: Colors.ink,
  },
  waveStamp: {
    left: Spacing.four,
    transform: [{ rotate: '-12deg' }],
  },
  passStamp: {
    right: Spacing.four,
    transform: [{ rotate: '12deg' }],
  },
});
