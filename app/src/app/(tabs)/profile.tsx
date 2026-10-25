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
          <Avatar name={profile.display_name} url={profile.avatar_url} size={76} />
          <View style={styles.headerText}>
            <AppText variant="hero" numberOfLines={1}>
              {profile.display_name}
            </AppText>
            <AppText variant="label" tone="muted">
              {stats}
            </AppText>
          </View>
        </Animated.View>

        {available_integrations.length > 0 && (
          <Animated.View entering={rise(1)} style={styles.section}>
            <AppText variant="label" tone="secondary" style={styles.sectionTitle}>
              linked accounts
            </AppText>
            <Card>
              {available_integrations.map((provider, index) => (
                <View key={provider} style={index > 0 && styles.divider}>
                  <IntegrationRow
                    provider={provider}
                    integration={integrations.find(
                      (integration) => integration.provider === provider
                    )}
                    onChanged={refreshMe}
                  />
                </View>
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
    paddingHorizontal: Spacing.four - 4,
    paddingTop: Spacing.five,
    gap: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three + 2,
  },
  headerText: {
    flex: 1,
  },
  section: {
    gap: Spacing.two + 2,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.line,
    paddingTop: Spacing.three,
  },
  signOut: {
    alignSelf: 'center',
    minWidth: 140,
  },
});
