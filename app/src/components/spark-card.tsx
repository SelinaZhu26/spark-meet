import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Diamond, Stars } from '@/components/ui/ornament';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { rarity, rarityGradient } from '@/lib/rarity';
import type { Spark } from '@/lib/types';

/** A spark in the collection grid, drawn like a character card. */
export function SparkCard({ spark }: { spark: Spark }) {
  const stars = rarity(spark.score);
  const title = spark.other?.display_name ?? spark.shared_interests[0] ?? 'A spark';
  const status = spark.connected ? 'Mutual' : spark.waved ? 'Waved' : null;

  return (
    <Link href={{ pathname: '/spark/[id]', params: { id: spark.id } }} asChild>
      <Pressable
        accessibilityLabel={`${title}, ${stars} stars${status ? `, ${status.toLowerCase()}` : ''}`}
        style={({ pressed }) => pressed && styles.pressed}>
        <View style={styles.card}>
          <LinearGradient
            colors={rarityGradient[stars]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.art}>
            <View style={styles.top}>
              <Diamond size={9} color={spark.mode === 'dating' ? Colors.dating : Colors.friends} />
              {status && (
                <View style={styles.status}>
                  <AppText style={styles.statusText}>{status}</AppText>
                </View>
              )}
            </View>
            <AppText style={styles.portrait}>
              {spark.other ? spark.other.display_name.charAt(0).toUpperCase() : '✦'}
            </AppText>
            <Stars count={stars} size={12} />
          </LinearGradient>
          <View style={styles.plate}>
            <AppText variant="caption" numberOfLines={1} style={styles.name}>
              {title}
            </AppText>
        </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 6,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.parchment,
  },
  pressed: {
    opacity: 0.8,
  },
  art: {
    aspectRatio: 0.84,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
  },
  top: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 18,
    paddingLeft: 3,
  },
  status: {
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: `${Colors.ink}CC`,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: 700,
    color: Colors.parchment,
  },
  portrait: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: 700,
    color: `${Colors.parchment}E6`,
  },
  plate: {
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.one + 1,
  },
  name: {
    textAlign: 'center',
    fontWeight: 700,
    color: Colors.ink,
  },
});
