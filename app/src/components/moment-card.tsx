import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { AppText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { momentTitle, pastel, timeAgo } from '@/lib/moment';
import type { Spark } from '@/lib/types';

/** Rings around a dot: someone is within a few steps. */
const PING_RINGS = [200, 136, 72];

export type MomentCardProps = {
  spark: Spark;
  style?: StyleProp<ViewStyle>;
};

/** A spark as a full-bleed card: what you share and when, never who. */
export function MomentCard({ spark, style }: MomentCardProps) {
  const [room, setRoom] = useState(0);

  return (
    <View style={[styles.card, { backgroundColor: pastel(spark) }, style]}>
      <View style={styles.top}>
        <Chip label={spark.mode === 'dating' ? 'Dating' : 'Friends'} onCard />
        <AppText variant="caption" tone="ink">
          {timeAgo(spark.sparked_at)}
        </AppText>
      </View>
      <View
        style={styles.ping}
        pointerEvents="none"
        onLayout={(event) => setRoom(event.nativeEvent.layout.height)}>
        {PING_RINGS.filter((size) => size <= room).map((size) => (
          <View key={size} style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]} />
        ))}
        <View style={styles.pingDot} />
      </View>
      <View style={styles.body}>
        <AppText variant="display" tone="ink" numberOfLines={3} adjustsFontSizeToFit>
          {momentTitle(spark)}
        </AppText>
        <AppText tone="ink" style={styles.reason} numberOfLines={3}>
          {spark.reason}
        </AppText>
      </View>
      <View style={styles.score}>
        <AppText tone="ink" style={styles.scoreValue}>
          {spark.score}%
        </AppText>
        <AppText variant="label" tone="ink">
          match
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ping: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(28, 23, 34, 0.12)',
  },
  pingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.ink,
  },
  body: {
    gap: Spacing.two,
  },
  reason: {
    opacity: 0.75,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  scoreValue: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: 800,
    letterSpacing: -1.5,
  },
});
