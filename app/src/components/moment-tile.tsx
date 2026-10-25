import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { momentTitle, pastel, timeAgo } from '@/lib/moment';
import type { Spark } from '@/lib/types';

/** A spark in the Sparks grid: a small version of the card that popped up. */
export function MomentTile({ spark }: { spark: Spark }) {
  const status = spark.waved ? 'You waved' : 'Tap to wave';

  return (
    <Link href={{ pathname: '/spark/[id]', params: { id: spark.id } }} asChild>
      <Pressable style={({ pressed }) => pressed && styles.pressed}>
        <View style={[styles.tile, { backgroundColor: pastel(spark) }]}>
          <View style={styles.top}>
            <AppText variant="caption" tone="ink">
              {timeAgo(spark.sparked_at)}
            </AppText>
            <AppText variant="label" tone="ink">
              {spark.score}%
            </AppText>
          </View>
          <View style={styles.bottom}>
            <AppText variant="heading" tone="ink" numberOfLines={3}>
              {momentTitle(spark)}
            </AppText>
            <AppText variant="caption" tone="ink" style={styles.status}>
              {status}
            </AppText>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  tile: {
    aspectRatio: 0.86,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottom: {
    gap: Spacing.one,
  },
  status: {
    opacity: 0.7,
  },
});
