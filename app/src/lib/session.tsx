import type { Session } from '@supabase/supabase-js';
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';

import { api, errorMessage } from '@/lib/api';
import { stopLocationUpdates, stopPresence } from '@/lib/presence';
import { supabase } from '@/lib/supabase';
import type { Me } from '@/lib/types';

type SessionContextValue = {
  session: Session | null;
  /** The backend profile; null until loaded or while signed out. */
  me: Me | null;
  /** True while the session is restored or the profile first loads. */
  loading: boolean;
  error: string | null;
  refreshMe: () => Promise<void>;
  setMe: (me: Me) => void;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);
  // Keyed by user so a profile never outlives the session it was loaded for.
  const [loaded, setLoaded] = useState<{ userId: string; me: Me } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setRestoring(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        // Covers expired or revoked sessions too, not just signOut().
        stopLocationUpdates().catch(() => {});
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const me = loaded && loaded.userId === userId ? loaded.me : null;

  const refreshMe = useCallback(async () => {
    if (!userId) {
      return;
    }
    await api.me().then(
      (next) => {
        setError(null);
        setLoaded({ userId, me: next });
      },
      (err) => setError(errorMessage(err))
    );
  }, [userId]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const setMe = useCallback((next: Me) => setLoaded({ userId: next.profile.id, me: next }), []);

  const signOut = useCallback(async () => {
    if (me?.profile.active) {
      await stopPresence().catch(() => {});
    }
    // This device's push token must not keep notifying the old account.
    await api.setPushToken(null).catch(() => {});
    setError(null);
    await supabase.auth.signOut();
  }, [me]);

  const loading = restoring || (!!session && !me && !error);

  return (
    <SessionContext value={{ session, me, loading, error, refreshMe, setMe, signOut }}>
      {children}
    </SessionContext>
  );
}

export function useSession(): SessionContextValue {
  const value = use(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return value;
}

/** For screens that only render once signed in with a loaded profile. */
export function useMe(): Me {
  const { me } = useSession();
  if (!me) {
    throw new Error('useMe used before the profile loaded');
  }
  return me;
}
