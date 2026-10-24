import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import { StatusScreen } from '@/components/status-screen';
import { useSession } from '@/lib/session';

/**
 * Deep link target the backend sends people back to after linking an
 * account. On iOS the auth session swallows it; on Android it can land here.
 */
export default function IntegrationsReturn() {
  const { session, refreshMe } = useSession();

  useEffect(() => {
    if (session) {
      refreshMe();
    }
  }, [session, refreshMe]);

  return session ? <Redirect href="/profile" /> : <StatusScreen />;
}
