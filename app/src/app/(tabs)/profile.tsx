import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IntegrationRow } from '@/components/integration-row';
import { ProfileForm } from '@/components/profile-form';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { useMe, useSession } from '@/lib/session';

export default function Profile() {
  const { setMe, refreshMe, signOut } = useSession();
  const { profile, integrations, available_integrations } = useMe();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Avatar name={profile.display_name} url={profile.avatar_url} size={72} />
          <View style={styles.headerText}>
            <AppText variant="title">{profile.display_name}</AppText>
            <AppText tone="secondary">This is what Spark matches on.</AppText>
          </View>
        </View>

        {available_integrations.length > 0 && (
          <Card>
            <View style={styles.cardHeader}>
              <AppText variant="heading">Linked accounts</AppText>
              <AppText variant="caption" tone="muted">
                We take a one-time snapshot of your interests and throw the access away.
              </AppText>
            </View>
            {available_integrations.map((provider) => (
              <IntegrationRow
                key={provider}
                provider={provider}
                integration={integrations.find((integration) => integration.provider === provider)}
                onChanged={refreshMe}
              />
            ))}
          </Card>
        )}

        <ProfileForm
          key={profile.updated_at}
          initial={profile}
          submitLabel="Save"
          onSaved={setMe}
        />

        <Button title="Sign out" variant="ghost" onPress={signOut} />
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
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  cardHeader: {
    gap: Spacing.one,
  },
});
