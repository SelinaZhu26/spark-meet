import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { blockPalette } from '@/components/spark-block';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { reveal } from '@/components/ui/rise';
import { Shape } from '@/components/ui/shapes';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, Spacing, Springs, Welcome } from '@/constants/theme';
import { sparkTeaser } from '@/lib/notifications';
import type { Spark } from '@/lib/types';

export type SparkAlertProps = {
  spark: Spark | null;
  onOpen: (spark: Spark) => void;
  onDismiss: () => void;
};

/** Full-screen story slide shown when a spark lands while the app is open. Shapes stay in the top band, clear of the text and buttons. */
export function SparkAlert({ spark, onOpen, onDismiss }: SparkAlertProps) {
  return (
    <Modal
      visible={!!spark}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      {spark && <Slide spark={spark} onOpen={onOpen} onDismiss={onDismiss} />}
    </Modal>
  );
}

function Slide({
  spark,
  onOpen,
  onDismiss,
}: {
  spark: Spark;
  onOpen: (spark: Spark) => void;
  onDismiss: () => void;
}) {
  const { width } = useWindowDimensions();
  const [background, first, second] = blockPalette(spark.id, spark.mode);
  const grow = ZoomIn.springify(Springs.pop.duration).dampingRatio(Springs.pop.dampingRatio);

  return (
    <View style={[styles.slide, { backgroundColor: background }]}>
      <Animated.View entering={grow} style={StyleSheet.absoluteFill}>
        <Shape
          kind="circle"
          size={width * 0.9}
          color={first}
          motion="float"
          style={{ top: -width * 0.3, right: -width * 0.35 }}
        />
      </Animated.View>
      <Animated.View entering={grow.delay(150)} style={StyleSheet.absoluteFill}>
        <Shape
          kind="ring"
          size={width * 0.36}
          color={second}
          motion="float"
          style={{ top: width * 0.2, left: -width * 0.12 }}
        />
      </Animated.View>
      <Animated.View entering={grow.delay(300)} style={StyleSheet.absoluteFill}>
        <Shape
          kind="star"
          size={width * 0.2}
          color={Colors.ink}
          motion="spin"
          style={{ top: width * 0.42, left: width * 0.36 }}
        />
      </Animated.View>

      <SafeAreaView style={styles.inner}>
        <View style={styles.top}>
          <Logo dark size={20} />
          <IconButton
            icon="close"
            onPress={onDismiss}
            accessibilityLabel="Close"
            color={Welcome.fill}
            iconColor={Colors.ink}
            size={36}
          />
        </View>

        <View style={styles.content}>
          <Animated.View entering={reveal(0)}>
            <AppText variant="heading" tone="ink">
              someone&apos;s near ⚡
            </AppText>
          </Animated.View>
          <Animated.View entering={reveal(1)}>
            <AppText style={styles.mega}>{spark.score}%</AppText>
            <AppText variant="title" tone="ink">
              match
            </AppText>
          </Animated.View>
          <Animated.View entering={reveal(2)}>
            <AppText style={styles.body}>{sparkTeaser(spark)}</AppText>
          </Animated.View>
        </View>

        <Animated.View entering={reveal(3)} style={styles.actions}>
          <Button title="see the spark" variant="dark" onPress={() => onOpen(spark)} />
          <Button title="later" variant="light" onPress={onDismiss} />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.four - 2,
    paddingBottom: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  mega: {
    fontFamily: Fonts.semiBold,
    fontSize: 116,
    lineHeight: 116,
    letterSpacing: -3,
    color: Colors.ink,
  },
  body: {
    fontFamily: Fonts.medium,
    fontSize: 21,
    lineHeight: 27,
    color: Colors.ink,
  },
  actions: {
    gap: Spacing.three - 4,
  },
});
