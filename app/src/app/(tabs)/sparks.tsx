import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SparkRow } from '@/components/spark-row';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import type { Spark } from '@/lib/types';

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
        renderItem={({ item }) => <SparkRow spark={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.flame} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="title">Sparks</AppText>
            <AppText tone="secondary">
              People you crossed paths with and would click with. Wave to reveal each other.
            </AppText>
            {error && <AppText tone="danger">{error}</AppText>}
          </View>
        }
        ListEmptyComponent={
          sparks ? (
            <View style={styles.empty}>
              <AppText style={styles.emptyIcon}>🕯️</AppText>
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
    padding: Spacing.four,
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  emptyIcon: {
    fontSize: 44,
    lineHeight: 52,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
