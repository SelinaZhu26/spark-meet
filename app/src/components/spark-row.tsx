import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SparkMark } from '@/components/ui/spark-mark';
import { AppText } from '@/components/ui/text';
import { Colors, Fonts, MarkColors, Spacing } from '@/constants/theme';
import type { Spark } from '@/lib/types';

const MARK = 46;

/** Anonymous sparks get a little sparkler, lit while they're new; people you've met get their avatar. */
export function SparkRow({ spark }: { spark: Spark }) {
  const title = spark.other?.display_name ?? spark.shared_interests.slice(0, 2).join(', ');
  const status = spark.connected ? 'mutual' : spark.waved ? 'waved' : 'new';
  const fresh = !spark.waved && !spark.connected;

  return (
    <Link href={{ pathname: '/spark/[id]', params: { id: spark.id } }} asChild>
      <PressableScale pressedScale={0.97} style={styles.row}>
        <View style={styles.art}>
          {spark.other ? (
            <Avatar name={spark.other.display_name} url={spark.other.avatar_url} size={MARK} />
          ) : (
            <SparkMark size={MARK} {...(fresh ? MarkColors.lit : MarkColors.unlit)} />
          )}
        </View>
        <View style={styles.text}>
          <AppText numberOfLines={1} style={styles.title}>
            {title || 'a spark'}
          </AppText>
          <View style={styles.meta}>
            {fresh && <View style={styles.dot} />}
            <AppText variant="caption" tone={fresh ? 'accent' : 'muted'}>
              {status}
            </AppText>
            <AppText variant="caption" tone="muted">
              · {spark.mode}
            </AppText>
          </View>
        </View>
        <View style={styles.score}>
          <AppText style={styles.scoreNumber}>{spark.score}</AppText>
          <AppText style={styles.scoreUnit}>%</AppText>
        </View>
      </PressableScale>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 2,
    paddingVertical: Spacing.three - 2,
  },
  art: {
    width: MARK,
    alignItems: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 19,
    lineHeight: 23,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: Spacing.half,
    backgroundColor: Colors.gold,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scoreNumber: {
    fontFamily: Fonts.lightItalic,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
  },
  scoreUnit: {
    fontFamily: Fonts.italic,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textMuted,
  },
});
