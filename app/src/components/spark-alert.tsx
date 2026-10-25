import { LinearGradient } from 'expo-linear-gradient';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SparkBurst } from '@/components/spark-burst';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { reveal } from '@/components/ui/rise';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Spacing, alpha } from '@/constants/theme';
import { sparkTeaser } from '@/lib/notifications';
import type { Spark } from '@/lib/types';

/** The big match number, centered on the burst's hub. */
const MEGA = 184;

export type SparkAlertProps = {
  spark: Spark | null;
  onOpen: (spark: Spark) => void;
  onDismiss: () => void;
};

/** Full-screen burst shown when a spark lands while the app is open: gold strokes radiate from behind the match. */
export function SparkAlert({ spark, onOpen, onDismiss }: SparkAlertProps) {
  return (
    <Modal
      visible={!!spark}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      {spark && <Burst spark={spark} onOpen={onOpen} onDismiss={onDismiss} />}
    </Modal>
  );
}

function Burst({
  spark,
  onOpen,
  onDismiss,
}: {
  spark: Spark;
  onOpen: (spark: Spark) => void;
  onDismiss: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const hub = { x: width / 2, y: height * 0.4 };

  return (
    <View style={styles.slide}>
      <SparkBurst width={width} height={height} hub={hub} core={MEGA * 0.62} seed={spark.id} />
      {/* The rays run out into the dark before the words and buttons at the bottom. */}
      <LinearGradient
        colors={[alpha(Colors.night, 0), Colors.night]}
        locations={[0, 0.6]}
        style={[styles.fade, { height: height * 0.4 }]}
      />

      <Animated.View entering={reveal(0)} style={[styles.float, { top: hub.y - MEGA * 0.95 }]}>
        <AppText variant="label" tone="accent">
          someone&apos;s near
        </AppText>
      </Animated.View>

      <Animated.View
        entering={ZoomIn.delay(200).duration(900)}
        style={[styles.float, { top: hub.y - MEGA * 0.56 }]}>
        <View style={styles.score}>
          <AppText style={styles.mega}>{spark.score}</AppText>
          <AppText style={styles.percent}>%</AppText>
        </View>
        <AppText variant="title" style={styles.match}>
          {spark.mode} match
        </AppText>
      </Animated.View>

      <SafeAreaView style={styles.inner}>
        <View style={styles.top}>
          <IconButton
            icon="close"
            onPress={onDismiss}
            accessibilityLabel="Close"
            color={Colors.night}
            size={38}
          />
        </View>

        <View style={styles.bottom}>
          <Animated.View entering={reveal(1)}>
            <AppText tone="secondary" style={styles.center}>
              {sparkTeaser(spark).toLowerCase()}
            </AppText>
          </Animated.View>
          <Animated.View entering={reveal(2)} style={styles.actions}>
            <Button title="see the spark" onPress={() => onOpen(spark)} />
            <Button title="later" variant="ghost" onPress={onDismiss} style={styles.later} />
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: Colors.night,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  float: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  match: {
    marginTop: -Spacing.three,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mega: {
    fontFamily: Fonts.thinItalic,
    fontSize: MEGA,
    lineHeight: MEGA * 1.08,
    letterSpacing: -7,
    color: Colors.text,
  },
  percent: {
    fontFamily: Fonts.lightItalic,
    fontSize: 54,
    lineHeight: 84,
    color: Colors.gold,
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: Spacing.three,
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: Spacing.four,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.three - 4,
  },
  later: {
    backgroundColor: Colors.night,
  },
});
