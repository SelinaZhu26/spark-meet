import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SwipeDeck, type Decision } from '@/components/swipe-deck';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Spark } from '@/lib/types';

export type SparkAlertProps = {
  spark: Spark | null;
  onOpen: (spark: Spark) => void;
  onDismiss: () => void;
};

/** The card that pops up over everything when a spark lands in the foreground. */
export function SparkAlert({ spark, onOpen, onDismiss }: SparkAlertProps) {
  const insets = useSafeAreaInsets();
  const [waving, setWaving] = useState(false);

  const decide = async (decided: Spark, decision: Decision) => {
    if (decision === 'pass') {
      onDismiss();
      return;
    }
    setWaving(true);
    try {
      const next = await api.wave(decided.id);
      Haptics.notificationAsync(
        next.connected
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    } catch (error) {
      console.warn('[spark] could not wave', error);
    } finally {
      setWaving(false);
    }
    onOpen(decided);
  };

  return (
    <Modal visible={!!spark} transparent animationType="fade" onRequestClose={onDismiss}>
      <GestureHandlerRootView
        style={[styles.backdrop, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.four }]}>
        {spark && (
          <Animated.View entering={SlideInDown.springify().damping(18)} style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.dot} />
              <AppText variant="heading">Someone&apos;s near you</AppText>
            </View>
            <SwipeDeck sparks={[spark]} onDecide={decide} onOpen={onOpen} disabled={waving} />
          </Animated.View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 10, 14, 0.9)',
    paddingHorizontal: Spacing.three,
  },
  sheet: {
    flex: 1,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.live,
  },
});
