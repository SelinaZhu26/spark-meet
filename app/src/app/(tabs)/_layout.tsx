import { Tabs } from 'expo-router/js-tabs';

import { TabBar, TabEmoji } from '@/components/tab-bar';
import { Avatar } from '@/components/ui/avatar';
import { Colors, Tones } from '@/constants/theme';
import { useMe } from '@/lib/session';

export default function TabLayout() {
  const { profile } = useMe();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: Colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'spark',
          tabBarIcon: ({ focused }) => (
            <TabEmoji
              emoji="⚡"
              focused={focused}
              dot={profile.active ? Tones.accent : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sparks"
        options={{
          title: 'sparks',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="✨" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'you',
          tabBarIcon: () => (
            <Avatar name={profile.display_name} url={profile.avatar_url} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
