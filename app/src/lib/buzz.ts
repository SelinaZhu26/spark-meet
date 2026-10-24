import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { buzzUrl } from '@/lib/api';

let player: AudioPlayer | null = null;

/**
 * The Spark buzz: a haptic double-tap plus the sound generated for Spark
 * with ElevenLabs. The haptics still fire if the sound can't load.
 */
export async function buzz() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 220);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 360);
  try {
    player ??= createAudioPlayer({ uri: buzzUrl });
    await player.seekTo(0);
    player.play();
  } catch (error) {
    console.warn('[spark] could not play buzz', error);
  }
}
