import '@/lib/presence';

import {
  CrimsonPro_200ExtraLight_Italic,
  CrimsonPro_300Light,
  CrimsonPro_300Light_Italic,
  CrimsonPro_400Regular,
  CrimsonPro_400Regular_Italic,
  CrimsonPro_500Medium,
  CrimsonPro_500Medium_Italic,
  CrimsonPro_600SemiBold,
  CrimsonPro_600SemiBold_Italic,
} from '@expo-google-fonts/crimson-pro';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SparkRuntime } from '@/components/spark-runtime';
import { StatusScreen } from '@/components/status-screen';
import { iconFont } from '@/components/ui/icon';
import { Colors, Fonts } from '@/constants/theme';
import { SessionProvider, useSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.gold,
    background: Colors.background,
    card: Colors.background,
    text: Colors.text,
    border: Colors.line,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CrimsonPro_200ExtraLight_Italic,
    CrimsonPro_300Light,
    CrimsonPro_300Light_Italic,
    CrimsonPro_400Regular,
    CrimsonPro_400Regular_Italic,
    CrimsonPro_500Medium,
    CrimsonPro_500Medium_Italic,
    CrimsonPro_600SemiBold,
    CrimsonPro_600SemiBold_Italic,
    [iconFont.name]: iconFont.font,
  });

  return (
    <SessionProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <RootNavigator fontsReady={fontsLoaded || !!fontError} />
      </ThemeProvider>
    </SessionProvider>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { session, me, loading, error, refreshMe, signOut } = useSession();
  const ready = !loading && fontsReady;

  useEffect(() => {
    if (ready) {
      SplashScreen.hide();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }
  if (session && !me) {
    return (
      <StatusScreen
        title="can't reach spark"
        message={error}
        actions={[
          { title: 'try again', onPress: refreshMe },
          { title: 'sign out', onPress: signOut, variant: 'ghost' },
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
          headerTitleStyle: { fontFamily: Fonts.semiBoldItalic, fontSize: 22 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: Colors.background },
          animation: 'ios_from_right',
        }}>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="sign-in" options={{ headerShown: false, animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={!!session && !onboarded}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="spark/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ title: '' }} />
        </Stack.Protected>
        <Stack.Screen name="integrations" options={{ headerShown: false }} />
      </Stack>
      {onboarded && <SparkRuntime />}
    </>
  );
}
