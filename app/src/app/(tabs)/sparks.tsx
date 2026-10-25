import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MomentTile } from '@/components/moment-tile';
import { Avatar } from '@/components/ui/avatar';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { api, errorMessage } from '@/lib/api';
import { pastel } from '@/lib/moment';
import type { Spark } from '@/lib/types';

const COLUMNS = 2;
/** Space between tiles; each tile pads half of it on either side. */
const GAP = 12;

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

  const mutual = (sparks ?? []).flatMap((spark) =>
    spark.connected && spark.other ? [{ spark, other: spark.other }] : []
  );
  const moments = (sparks ?? []).filter((spark) => !spark.connected);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={moments}
        keyExtractor={(spark) => spark.id}
        numColumns={COLUMNS}
        renderItem={({ item }) => (
          <View style={styles.tile}>
            <MomentTile spark={item} />
          </View>
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.text} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="title">Sparks</AppText>
            {error && <AppText tone="danger">{error}</AppText>}
            {mutual.length > 0 && (
              <View style={styles.section}>
                <AppText variant="heading">Mutual</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mutual}>
                  {mutual.map(({ spark, other }) => (
                    <Link key={spark.id} href={{ pathname: '/chat/[id]', params: { id: spark.id } }} asChild>
                      <Pressable style={({ pressed }) => pressed && styles.pressed}>
                        <View style={styles.person}>
                          <Avatar
                            name={other.display_name}
                            url={other.avatar_url}
                            color={pastel(spark)}
                            size={76}
                          />
                          <AppText variant="caption" numberOfLines={1}>
                            {other.display_name}
                          </AppText>
                        </View>
                      </Pressable>
                    </Link>
                  ))}
                </ScrollView>
              </View>
            )}
            {moments.length > 0 && <AppText variant="heading">Moments</AppText>}
          </View>
        }
        ListEmptyComponent={
          sparks && mutual.length === 0 ? (
            <View style={styles.empty}>
              <AppText variant="heading">No sparks yet</AppText>
              <AppText tone="secondary" style={styles.emptyText}>
                Go live and go somewhere with people: a café, a gym, a hackathon.
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
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three - GAP / 2,
    gap: GAP,
  },
  tile: {
    width: `${100 / COLUMNS}%`,
    paddingHorizontal: GAP / 2,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.one,
    paddingHorizontal: GAP / 2,
  },
  section: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  mutual: {
    gap: Spacing.three,
  },
  person: {
    width: 76,
    alignItems: 'center',
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.six,
    paddingHorizontal: GAP / 2,
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 300,
  },
});
