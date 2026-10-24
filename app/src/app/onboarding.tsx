import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileForm } from '@/components/profile-form';
import { AppText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';
import { useMe, useSession } from '@/lib/session';

export default function Onboarding() {
  const { setMe } = useSession();
  const { profile } = useMe();

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
          initial={profile}
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
