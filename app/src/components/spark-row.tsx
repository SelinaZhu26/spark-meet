import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Spark } from '@/lib/types';

export function SparkRow({ spark }: { spark: Spark }) {
  const dating = spark.mode === 'dating';
  const title = spark.other?.display_name ?? spark.shared_interests.slice(0, 2).join(' · ');
  const status = spark.connected ? 'Connected — say hi' : spark.waved ? 'You waved' : 'Tap to see what you share';

  return (
    <Link href={{ pathname: '/spark/[id]', params: { id: spark.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {spark.other ? (
          <Avatar name={spark.other.display_name} url={spark.other.avatar_url} size={48} />
        ) : (
          <View style={[styles.badge, dating && styles.badgeDating]}>
            <AppText style={styles.badgeIcon}>{dating ? '💗' : '⚡'}</AppText>
          </View>
        )}
        <View style={styles.text}>
          <AppText variant="heading" numberOfLines={1}>
            {title || 'A spark'}
          </AppText>
          <AppText variant="caption" tone={spark.connected ? 'ember' : 'secondary'}>
            {status}
          </AppText>
        </View>
        <View style={[styles.score, dating && styles.scoreDating]}>
          <AppText variant="caption" style={styles.scoreText}>
            {spark.score}
          </AppText>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    backgroundColor: Colors.surfaceRaised,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.ember}26`,
  },
  badgeDating: {
    backgroundColor: Colors.datingSoft,
  },
  badgeIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  score: {
    minWidth: 40,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: Colors.ember,
    alignItems: 'center',
  },
  scoreDating: {
    backgroundColor: Colors.dating,
  },
  scoreText: {
    color: Colors.background,
    fontWeight: 800,
  },
});
