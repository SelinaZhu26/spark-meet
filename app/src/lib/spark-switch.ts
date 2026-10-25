import { useState } from 'react';

import { errorMessage } from '@/lib/api';
import { startPresence, stopPresence, type PresenceMode } from '@/lib/presence';
import { useMe, useSession } from '@/lib/session';

/** The ON switch, shared by the home screen and the mini-player. */
export function useSparkSwitch() {
  const { refreshMe } = useSession();
  const { profile } = useMe();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<PresenceMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = profile.active;

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (active) {
        await stopPresence();
        setMode(null);
      } else {
        setMode(await startPresence());
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      await refreshMe();
      setBusy(false);
    }
  };

  return { active, busy, mode, error, toggle };
}
