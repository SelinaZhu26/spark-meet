import { LinearGradient } from 'expo-linear-gradient';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { Colors, Gradients, Radius, Spacing } from '@/constants/theme';
import { sparkTeaser } from '@/lib/notifications';
import type { Spark } from '@/lib/types';

export type SparkAlertProps = {
  spark: Spark | null;
  onOpen: (spark: Spark) => void;
  onDismiss: () => void;
};

/** Full-screen "someone's near" moment shown when a spark lands in the foreground. */
export function SparkAlert({ spark, onOpen, onDismiss }: SparkAlertProps) {
  const dating = spark?.mode === 'dating';
  return (
    <Modal visible={!!spark} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {spark && (
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.sheet}>
            <LinearGradient
              colors={dating ? Gradients.dating : Gradients.ember}
              style={styles.flare}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <AppText style={styles.bolt}>{dating ? '💗' : '⚡'}</AppText>
            </LinearGradient>
            <AppText variant="label" tone={dating ? 'dating' : 'ember'}>
              {dating ? 'Dating spark' : 'Spark'} · {spark.score}% match
            </AppText>
            <AppText variant="title" style={styles.center}>
              {sparkTeaser(spark)}
            </AppText>
            <View style={styles.chips}>
              {spark.shared_interests.map((interest) => (
                <Chip key={interest} label={interest} selected tone={dating ? 'dating' : 'ember'} />
              ))}
            </View>
            <AppText tone="secondary" style={styles.center}>
              They don&apos;t know who you are, and you don&apos;t know who they are. Wave to find out.
            </AppText>
            <Button
              title="See the spark"
              variant={dating ? 'dating' : 'primary'}
              onPress={() => onOpen(spark)}
              style={styles.button}
            />
            <Button title="Later" variant="ghost" onPress={onDismiss} style={styles.button} />
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 3, 2, 0.86)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheet: {
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Colors.surface,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.four,
    paddingTop: Spacing.five,
  },
  flare: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolt: {
    fontSize: 48,
    lineHeight: 58,
  },
  center: {
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  button: {
    alignSelf: 'stretch',
  },
});
