import { Pastels } from '@/constants/theme';
import type { Spark } from '@/lib/types';

/** A stable pastel for a spark, from its pool's half of the palette. */
export function pastel(spark: Pick<Spark, 'id' | 'mode'>): string {
  const colors = Pastels[spark.mode];
  let hash = 0;
  for (const char of spark.id) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

/** What a spark is about, e.g. "Bouldering & Coffee". */
export function momentTitle(spark: Pick<Spark, 'shared_interests'>): string {
  const [first, second] = spark.shared_interests;
  if (!first) {
    return "Someone you'd click with";
  }
  return second ? `${first} & ${second}` : first;
}

/** How long ago a spark happened, e.g. "Just now" or "12m ago". */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}
