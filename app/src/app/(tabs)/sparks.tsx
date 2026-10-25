import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SparkRow } from '@/components/spark-row';
import { useTabBarSpace } from '@/components/tab-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dots } from '@/components/ui/dots';
import { rise } from '@/components/ui/rise';
import { Segmented } from '@/components/ui/segmented';
import { SparkMark } from '@/components/ui/spark-mark';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing, Tones } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { useMe } from '@/lib/session';
import type { Spark } from '@/lib/types';

const FILTERS = [
  { value: 'friends', label: 'friends', test: (spark: Spark) => spark.mode === 'friends' },
  {
    value: 'dating',
    label: 'dating',
    color: Tones.dating,
    test: (spark: Spark) => spark.mode === 'dating',
  },
  { value: 'mutual', label: 'mutual', test: (spark: Spark) => spark.connected },
] as const;

type Filter = 'all' | (typeof FILTERS)[number]['value'];

export default function Sparks() {
  const router = useRouter();
  const { profile } = useMe();
  const tabBarSpace = useTabBarSpace();
  const [sparks, setSparks] = useState<Spark[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    try {
      setError(null);
      setSparks(await api.sparks());
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const all = sparks ?? [];
  // Only offer filters that would actually narrow the list.
  const filters = FILTERS.filter(({ test }) => {
    const count = all.filter(test).length;
    return count > 0 && count < all.length;
  });
  const selected = filters.find(({ value }) => value === filter);
  const shown = selected ? all.filter(selected.test) : all;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Tones.accent}
            colors={[Colors.ink]}
            progressBackgroundColor={Tones.accent}
          />
        }>
        <Animated.View entering={rise(0)} style={styles.heading}>
          <AppText variant="title">sparks</AppText>
          <AppText variant="title" tone="muted">
            {sparks === null ? ' ' : all.length === 0 ? 'none yet' : `${all.length} so far`}
          </AppText>
        </Animated.View>

        {filters.length > 0 && (
          <Animated.View entering={rise(1)}>
            <Segmented
              options={[{ value: 'all', label: 'all' }, ...filters]}
              value={selected ? filter : 'all'}
              onChange={setFilter}
            />
          </Animated.View>
        )}

        {error && <AppText tone="danger">{error}</AppText>}

        {sparks === null ? (
          <View style={styles.empty}>
            <Dots color={Tones.accent} />
          </View>
        ) : all.length === 0 ? (
          <Animated.View entering={rise(1)} style={styles.empty}>
            <SparkMark
              size={80}
              ink={Colors.textMuted}
              gold={Colors.textMuted}
              ash={Colors.surfaceRaised}
            />
            <AppText variant="heading">no sparks yet</AppText>
            {!profile.active && (
              <Button title="turn on spark" onPress={() => router.navigate('/')} />
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={rise(2)}>
            <Card style={styles.list}>
              {shown.map((spark) => (
                <Animated.View
                  key={spark.id}
                  layout={LinearTransition.springify().damping(20)}
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}>
                  <SparkRow spark={spark} />
                </Animated.View>
              ))}
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three + 4,
  },
  heading: {
    paddingHorizontal: Spacing.one,
    paddingTop: Spacing.two,
  },
  list: {
    gap: Spacing.three + 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
