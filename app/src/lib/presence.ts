/**
 * The ON switch. While Spark is on, the phone reports its location to the
 * backend, which finds nearby people and scores each pair once. Coordinates
 * never come back out of the backend.
 *
 * Development builds report from a background location task. Expo Go can't
 * run background location, so there Spark only works while the app is open.
 */

import { isRunningInExpoGo } from 'expo';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';

import { Colors } from '@/constants/theme';
import { ApiError, api } from '@/lib/api';
import { notifySpark } from '@/lib/notifications';
import type { Spark } from '@/lib/types';

const LOCATION_TASK = 'spark-presence';
/** Pings closer together than this are dropped. */
const MIN_PING_INTERVAL_MS = 20_000;
/** Re-sends the last fix so standing still doesn't make you invisible. */
const HEARTBEAT_MS = 45_000;

export type PresenceMode = 'background' | 'foreground';

const isExpoGo = isRunningInExpoGo();

let lastLocation: Location.LocationObject | null = null;
let lastPingAt = 0;
let pinging = false;
let watcher: Location.LocationSubscription | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;

const sparkListeners = new Set<(sparks: Spark[]) => void>();
const stopListeners = new Set<() => void>();

/** Called with new sparks while the app is open. */
export function onSparks(listener: (sparks: Spark[]) => void) {
  sparkListeners.add(listener);
  return () => {
    sparkListeners.delete(listener);
  };
}

/** Called when the backend reports Spark was switched off. */
export function onPresenceStopped(listener: () => void) {
  stopListeners.add(listener);
  return () => {
    stopListeners.delete(listener);
  };
}

TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  LOCATION_TASK,
  async ({ data, error }) => {
    if (error) {
      console.warn('[spark] background location error', error.message);
      return;
    }
    const latest = data?.locations?.at(-1);
    if (latest) {
      await report(latest);
    }
  }
);

async function report(location: Location.LocationObject, force = false) {
  lastLocation = location;
  const now = Date.now();
  if (pinging || (!force && now - lastPingAt < MIN_PING_INTERVAL_MS)) {
    return;
  }
  pinging = true;
  lastPingAt = now;
  try {
    const { sparks } = await api.ping({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
    });
    if (sparks.length > 0) {
      deliver(sparks);
    }
  } catch (error) {
    if (error instanceof ApiError && (error.status === 409 || error.status === 401)) {
      // Switched off elsewhere, or signed out: stop burning GPS.
      await stopLocationUpdates();
      stopListeners.forEach((listener) => listener());
    } else {
      console.warn('[spark] ping failed', error);
    }
  } finally {
    pinging = false;
  }
}

function deliver(sparks: Spark[]) {
  if (AppState.currentState === 'active' && sparkListeners.size > 0) {
    sparkListeners.forEach((listener) => listener(sparks));
  } else {
    sparks.forEach((spark) => notifySpark(spark));
  }
}

/** Switches Spark on. Throws if location permission is denied. */
export async function startPresence(): Promise<PresenceMode> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) {
    throw new Error("Spark needs your location to know when someone's nearby.");
  }
  await api.setPresence(true);
  try {
    const mode = await startUpdates(true);
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    await report(current, true);
    return mode;
  } catch (error) {
    // Don't leave the server thinking we're on with nothing reporting.
    await stopPresence().catch(() => {});
    throw error;
  }
}

export async function stopPresence() {
  await stopLocationUpdates();
  await api.setPresence(false);
}

/**
 * Restarts location updates after an app launch if Spark was left on,
 * without prompting. Returns null if permission was revoked meanwhile.
 */
export async function resumePresence(): Promise<PresenceMode | null> {
  const { granted } = await Location.getForegroundPermissionsAsync();
  if (!granted) {
    await api.setPresence(false);
    return null;
  }
  return startUpdates(false);
}

async function startUpdates(prompt: boolean): Promise<PresenceMode> {
  startHeartbeat();
  if (!isExpoGo) {
    try {
      return await startBackgroundUpdates(prompt);
    } catch (error) {
      // Background location isn't available (e.g. no permission, Expo Go):
      // fall back to reporting while the app is open.
      console.warn('[spark] background location unavailable', error);
    }
  }
  watcher ??= await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, distanceInterval: 0, timeInterval: MIN_PING_INTERVAL_MS },
    (location) => report(location)
  );
  return 'foreground';
}

async function startBackgroundUpdates(prompt: boolean): Promise<PresenceMode> {
  const permission = prompt
    ? await Location.requestBackgroundPermissionsAsync()
    : await Location.getBackgroundPermissionsAsync();
  if (permission.granted) {
    if (!(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        distanceInterval: 0,
        timeInterval: MIN_PING_INTERVAL_MS,
        pausesUpdatesAutomatically: false,
        showsBackgroundLocationIndicator: true,
        activityType: Location.ActivityType.Other,
        foregroundService: {
          notificationTitle: 'Spark is on',
          notificationBody: "We'll buzz you when someone you'd click with is near.",
          notificationColor: Colors.ember,
        },
      });
    }
    return 'background';
  }
  throw new Error('background location permission denied');
}

/** Stops reporting locally without telling the backend. */
export async function stopLocationUpdates() {
  watcher?.remove();
  watcher = null;
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
  lastLocation = null;
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}

function startHeartbeat() {
  heartbeat ??= setInterval(() => {
    if (lastLocation) {
      report(lastLocation);
    }
  }, HEARTBEAT_MS);
}
