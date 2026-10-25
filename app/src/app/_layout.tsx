import '@/lib/presence';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SparkRuntime } from '@/components/spark-runtime';
import { StatusScreen } from '@/components/status-screen';
import { Colors } from '@/constants/theme';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.brass,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.border,
  },
};

export default function RootLayout() {
  return (
    <SessionProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <RootNavigator />
      </ThemeProvider>
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session, me, loading, error, refreshMe, signOut } = useSession();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hide();
    }
  }, [loading]);

  if (loading) {
    return null;
  }
  if (session && !me) {
    return (
      <StatusScreen
        title="Can't reach Spark"
        message={error}
        actions={[
          { title: 'Try again', onPress: refreshMe, icon: 'confirm' },
          { title: 'Sign out', onPress: signOut, variant: 'ghost' },
        ]}
      />
    );
  }

  const onboarded = !!me && me.profile.display_name !== '';
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: Colors.background },
        }}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!!session && !onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="spark/[id]" options={{ title: '' }} />
          <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
        </Stack.Protected>
        <Stack.Screen name="integrations" options={{ headerShown: false }} />
      </Stack>
      {onboarded && <SparkRuntime />}
    </>
  );
}
