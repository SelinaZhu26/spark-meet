import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileForm } from '@/components/profile-form';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { useMe, useSession } from '@/lib/session';

export default function Onboarding() {
  const { session, setMe } = useSession();
  const { profile } = useMe();
  // Prefill from the identity provider (Google gives a name and a photo).
  const metadata = session?.user.user_metadata ?? {};
  const fullName: string = metadata.full_name ?? metadata.name ?? '';
  const avatar: string | null = metadata.avatar_url ?? metadata.picture ?? null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <AppText variant="label" tone="ember">
            Step 1 of 1
          </AppText>
          <AppText variant="title">What lights you up?</AppText>
          <AppText tone="secondary">
            Spark compares this with people near you. Nobody sees your profile unless you both wave.
          </AppText>
        </View>
        <ProfileForm
          initial={{
            display_name: profile.display_name || fullName.split(' ')[0] || '',
            bio: profile.bio,
            avatar_url: profile.avatar_url ?? (avatar?.startsWith('https://') ? avatar : null),
            interests: profile.interests,
            friends_enabled: profile.friends_enabled,
            dating_enabled: profile.dating_enabled,
          }}
          submitLabel="Light my spark"
          onSaved={setMe}
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
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.five,
  },
  header: {
    gap: Spacing.two,
  },
});
