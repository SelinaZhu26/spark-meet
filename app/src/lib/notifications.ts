import { requireOptionalNativeModule } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { AppState, Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import type { Spark } from '@/lib/types';

export type NotificationData =
  | { type: 'spark'; spark_id: string }
  | { type: 'connected'; spark_id: string }
  | { type: 'message'; spark_id: string };

type NotificationsModule = typeof import('expo-notifications');

// Expo Go on Android ships without expo-notifications' native push module,
// and the package loads it on import, so importing it there crashes the app.
// Check for the module itself rather than guessing the environment. Without
// it, notifications are no-ops; the in-app buzz still works.
const Notifications: NotificationsModule | null =
  Platform.OS === 'android' && !requireOptionalNativeModule('ExpoTopicSubscriptionModule')
    ? null
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('expo-notifications');

Notifications?.setNotificationHandler({
  handleNotification: async (notification) => {
    // In the foreground a spark gets the full-screen buzz instead of a banner.
    const data = notification.request.content.data as Partial<NotificationData> | undefined;
    const inAppSpark = data?.type === 'spark' && AppState.currentState === 'active';
    return {
      shouldShowBanner: !inAppSpark,
      shouldShowList: true,
      shouldPlaySound: !inAppSpark,
      shouldSetBadge: false,
    };
  },
});

/**
 * Asks for notification permission and returns an Expo push token, or null
 * where push isn't available (Expo Go, simulators, no EAS project).
 */
export async function setupNotifications(): Promise<string | null> {
  if (!Notifications) {
    return null;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Sparks',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 120, 80, 120, 80, 240],
      lightColor: Colors.accent,
    });
  }
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted || !Device.isDevice) {
    return null;
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    return null;
  }
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (error) {
    console.warn('[spark] push notifications unavailable', error);
    return null;
  }
}

/** Says what's shared, never who or where. */
export function sparkTeaser(spark: Spark): string {
  const interest = spark.shared_interests[0];
  return interest
    ? `Someone near you is into ${interest.toLowerCase()} too.`
    : "Someone you'd click with is near you right now.";
}

export async function notifySpark(spark: Spark) {
  const data: NotificationData = { type: 'spark', spark_id: spark.id };
  await Notifications?.scheduleNotificationAsync({
    content: { title: '✦ Spark nearby', body: sparkTeaser(spark), data },
    trigger: null,
  });
}

/** Notifications that arrive while the app is open. */
export function onNotificationReceived(listener: (data: Partial<NotificationData>) => void) {
  const subscription = Notifications?.addNotificationReceivedListener((notification) =>
    listener((notification.request.content.data ?? {}) as Partial<NotificationData>)
  );
  return () => subscription?.remove();
}

/** Notification taps, including the one that launched the app. */
export function onNotificationTapped(listener: (data: Partial<NotificationData>) => void) {
  if (!Notifications) {
    return () => {};
  }
  const handle = (response: import('expo-notifications').NotificationResponse) =>
    listener((response.notification.request.content.data ?? {}) as Partial<NotificationData>);
  Notifications.getLastNotificationResponseAsync().then((response) => response && handle(response));
  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
