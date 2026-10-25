import { Tabs } from 'expo-router/js-tabs';

import { TabBar, TabSpeck } from '@/components/tab-bar';

import { useColors } from '@/lib/appearance';
import { useMe } from '@/lib/session';

export default function TabLayout() {
  const colors = useColors();
  const { profile } = useMe();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'spark',
          tabBarIcon: () => (profile.active ? <TabSpeck /> : null),
        }}
      />
      <Tabs.Screen name="sparks" options={{ title: 'sparks' }} />
      <Tabs.Screen name="profile" options={{ title: 'you' }} />
    </Tabs>
  );
}
