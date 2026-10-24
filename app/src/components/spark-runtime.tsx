import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { SparkAlert } from '@/components/spark-alert';
import { api } from '@/lib/api';
import { buzz } from '@/lib/buzz';
import { setupNotifications, type NotificationData } from '@/lib/notifications';
import { onPresenceStopped, onSparks, resumePresence } from '@/lib/presence';
import { useMe, useSession } from '@/lib/session';
import type { Spark } from '@/lib/types';

/**
 * App-wide side effects for a signed-in user: push registration, resuming
 * Spark after a relaunch, and the foreground buzz when a spark lands.
 */
export function SparkRuntime() {
  const router = useRouter();
  const { refreshMe } = useSession();
  const { profile } = useMe();
  const [alert, setAlert] = useState<Spark | null>(null);
  const [wasActiveAtLaunch] = useState(profile.active);

  useEffect(() => {
    setupNotifications()
      .then((token) => (token ? api.setPushToken(token) : undefined))
      .catch((error) => console.warn('[spark] push setup failed', error));
  }, []);

  useEffect(() => {
    if (!wasActiveAtLaunch) {
      return;
    }
    resumePresence()
      .then((mode) => (mode === null ? refreshMe() : undefined))
      .catch((error) => console.warn('[spark] could not resume', error));
  }, [wasActiveAtLaunch, refreshMe]);

  useEffect(() => onPresenceStopped(() => refreshMe()), [refreshMe]);

  useEffect(
    () =>
      onSparks((sparks) => {
        buzz();
        setAlert(sparks[0]);
      }),
    []
  );

  // A spark scored by the other phone arrives as a push while we're open.
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data as Partial<NotificationData> | undefined;
      if (data?.type === 'spark' && data.spark_id) {
        const spark = await api.spark(data.spark_id).catch(() => null);
        if (spark) {
          buzz();
          setAlert(spark);
        }
      }
    });
    return () => subscription.remove();
  }, []);

  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    const data = response?.notification.request.content.data as Partial<NotificationData> | undefined;
    if (!data?.spark_id) {
      return;
    }
    if (data.type === 'message') {
      router.push({ pathname: '/chat/[id]', params: { id: data.spark_id } });
    } else {
      router.push({ pathname: '/spark/[id]', params: { id: data.spark_id } });
    }
  }, [response, router]);

  return (
    <SparkAlert
      spark={alert}
      onOpen={(spark) => {
        setAlert(null);
        router.push({ pathname: '/spark/[id]', params: { id: spark.id } });
      }}
      onDismiss={() => setAlert(null)}
    />
  );
}
