import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IntegrationRow } from '@/components/integration-row';
import { ProfileForm } from '@/components/profile-form';
import { useTabBarSpace } from '@/components/tab-bar';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { rise } from '@/components/ui/rise';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { useMe, useSession } from '@/lib/session';

export default function Profile() {
  const { setMe, refreshMe, signOut } = useSession();
  const { profile, integrations, available_integrations } = useMe();
  const tabBarSpace = useTabBarSpace();
  const stats = [
    `${profile.interests.length} interests`,
    integrations.length > 0 && `${integrations.length} linked`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        keyboardShouldPersistTaps="handled">
        <Animated.View entering={rise(0)} style={styles.header}>
          <Avatar name={profile.display_name} url={profile.avatar_url} size={84} />
          <View style={styles.headerText}>
            <AppText variant="title" numberOfLines={1}>
              {profile.display_name}
            </AppText>
            <AppText tone="secondary">{stats}</AppText>
          </View>
        </Animated.View>

        {available_integrations.length > 0 && (
          <Animated.View entering={rise(1)} style={styles.section}>
            <AppText variant="heading" style={styles.sectionTitle}>
              linked accounts
            </AppText>
            <Card>
              {available_integrations.map((provider) => (
                <IntegrationRow
                  key={provider}
                  provider={provider}
                  integration={integrations.find(
                    (integration) => integration.provider === provider
                  )}
                  onChanged={refreshMe}
                />
              ))}
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={rise(2)}>
          <ProfileForm
            key={profile.updated_at}
            initial={profile}
            submitLabel="save"
            onSaved={setMe}
          />
        </Animated.View>

        <Button
          title="sign out"
          variant="ghost"
          size="small"
          onPress={signOut}
          style={styles.signOut}
        />
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
  },
  section: {
    gap: Spacing.three - 4,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
  },
  signOut: {
    alignSelf: 'center',
  },
});
