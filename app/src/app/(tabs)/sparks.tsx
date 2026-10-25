import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SparkCard } from '@/components/spark-card';
import { Diamond, Divider } from '@/components/ui/ornament';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import type { Spark } from '@/lib/types';

const COLUMNS = 3;
/** Space between cards; each tile pads half of it on either side. */
const GAP = 10;

export default function Sparks() {
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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={sparks ?? []}
        keyExtractor={(spark) => spark.id}
        numColumns={COLUMNS}
        renderItem={({ item }) => (
          <View style={styles.tile}>
            <SparkCard spark={item} />
          </View>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.brass} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <AppText variant="title">Sparks</AppText>
              {!!sparks?.length && (
                <AppText variant="heading" tone="brass">
                  {sparks.length}
                </AppText>
              )}
            </View>
            <AppText tone="secondary">People you crossed paths with. Wave to reveal each other.</AppText>
            <Divider />
            {error && <AppText tone="danger">{error}</AppText>}
          </View>
        }
        ListEmptyComponent={
          sparks ? (
            <View style={styles.empty}>
              <Diamond size={40} outline style={styles.emptyIcon} />
              <AppText variant="heading">No sparks yet</AppText>
              <AppText tone="secondary" style={styles.emptyText}>
                Switch Spark on and go somewhere with people: a café, a gym, a hackathon.
              </AppText>
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four - GAP / 2,
    gap: GAP,
  },
  tile: {
    width: `${100 / COLUMNS}%`,
    paddingHorizontal: GAP / 2,
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
    paddingHorizontal: GAP / 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: GAP / 2,
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  emptyIcon: {
    marginBottom: Spacing.three,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
