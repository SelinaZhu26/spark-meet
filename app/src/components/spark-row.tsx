import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SparkCover } from '@/components/spark-block';
import { Avatar } from '@/components/ui/avatar';
import { PressableScale } from '@/components/ui/pressable-scale';
import { AppText } from '@/components/ui/text';
import { Fonts, Spacing, Tones } from '@/constants/theme';
import type { Spark } from '@/lib/types';

/** Anonymous sparks get a cover; people you've met get their avatar. */
export function SparkRow({ spark }: { spark: Spark }) {
  const dating = spark.mode === 'dating';
  const title = spark.other?.display_name ?? spark.shared_interests.slice(0, 2).join(', ');
  const status = spark.connected ? 'mutual' : spark.waved ? 'waved' : 'new';
  const fresh = !spark.waved && !spark.connected;

  return (
    <Link href={{ pathname: '/spark/[id]', params: { id: spark.id } }} asChild>
      <PressableScale pressedScale={0.97} style={styles.row}>
        {spark.other ? (
          <Avatar name={spark.other.display_name} url={spark.other.avatar_url} size={48} />
        ) : (
          <SparkCover seed={spark.id} mode={spark.mode} size={48} />
        )}
        <View style={styles.text}>
          <AppText numberOfLines={1} style={styles.title}>
            {title || 'a spark'}
          </AppText>
          <View style={styles.meta}>
            {fresh && (
              <View
                style={[styles.dot, { backgroundColor: dating ? Tones.dating : Tones.accent }]}
              />
            )}
            <AppText variant="caption" tone="secondary">
              {dating ? 'dating' : 'friends'} · {status}
            </AppText>
          </View>
        </View>
        <AppText style={styles.score}>{spark.score}%</AppText>
      </PressableScale>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  score: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    lineHeight: 24,
  },
});
