import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SparkRow } from '@/components/spark-row';
import { useTabBarSpace } from '@/components/tab-bar';
import { Button } from '@/components/ui/button';
import { Dots } from '@/components/ui/dots';
import { rise } from '@/components/ui/rise';
import { SparkMark } from '@/components/ui/spark-mark';
import { AppText } from '@/components/ui/text';
import { Spacing, Springs } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { themedStyles, useAppearance } from '@/lib/appearance';
import { useMe } from '@/lib/session';
import type { Spark } from '@/lib/types';

export default function Sparks() {
  const { colors, marks } = useAppearance();
  const styles = useStyles();
  const router = useRouter();
  const { profile } = useMe();
  const tabBarSpace = useTabBarSpace();
  const [sparks, setSparks] = useState<Spark[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.gold}
            colors={[colors.ink]}
            progressBackgroundColor={colors.gold}
          />
        }>
        <Animated.View entering={rise(0)} style={styles.heading}>
          <AppText variant="hero">sparks</AppText>
          <AppText variant="label" tone="muted" style={styles.count}>
            {sparks === null || all.length === 0 ? ' ' : `${all.length} so far`}
          </AppText>
        </Animated.View>

        {error && <AppText tone="danger">{error}</AppText>}

        {sparks === null ? (
          <View style={styles.empty}>
            <Dots color={colors.gold} />
          </View>
        ) : all.length === 0 ? (
          <Animated.View entering={rise(1)} style={styles.empty}>
            <SparkMark size={150} {...marks.unlit} />
            <AppText variant="title">no sparks yet</AppText>
            <AppText tone="secondary" style={styles.center}>
              {profile.active ? "we'll buzz you when one lands" : 'they land while spark is on'}
            </AppText>
            {!profile.active && (
              <Button
                title="turn on spark"
                onPress={() => router.navigate('/')}
                style={styles.emptyButton}
              />
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={rise(2)}>
            {all.map((spark, index) => (
              <Animated.View
                key={spark.id}
                layout={LinearTransition.springify(Springs.slide.duration).dampingRatio(
                  Springs.slide.dampingRatio
                )}
                entering={FadeIn.duration(220)}
                exiting={FadeOut.duration(150)}
                style={index > 0 && styles.divider}>
                <SparkRow spark={spark} />
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four - 4,
    paddingTop: Spacing.four,
    gap: Spacing.four - 4,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  count: {
    marginLeft: Spacing.three,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  emptyButton: {
    minWidth: 200,
    marginTop: Spacing.four,
  },
}));
