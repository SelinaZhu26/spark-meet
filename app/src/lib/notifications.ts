import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { Colors } from '@/constants/theme';
import type { Spark } from '@/lib/types';

export type NotificationData =
  | { type: 'spark'; spark_id: string }
  | { type: 'connected'; spark_id: string }
  | { type: 'message'; spark_id: string };

Notifications.setNotificationHandler({
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
 * where push isn't available (simulators, Expo Go on Android, no EAS
 * project). Local notifications still work in those cases.
 */
export async function setupNotifications(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Sparks',
      // eslint-disable-next-line import/namespace -- re-exported enum the resolver misses
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 120, 80, 120, 80, 240],
      lightColor: Colors.ember,
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
  await Notifications.scheduleNotificationAsync({
    content: { title: '⚡ Spark nearby', body: sparkTeaser(spark), data },
    trigger: null,
  });
}
