import { NativeTabs } from 'expo-router/native-tabs';

import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={Colors.background}
      tintColor={Colors.brass}
      indicatorColor={Colors.surfaceRaised}
      labelStyle={{ selected: { color: Colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Spark</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bolt.fill" md="bolt" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sparks">
        <NativeTabs.Trigger.Label>Sparks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>You</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
