import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { StatusScreen } from '@/components/status-screen';
import { exchangeCode } from '@/lib/auth';

/** Deep link target for Supabase OAuth redirects. */
export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [done, setDone] = useState(false);

  useEffect(() => {
    (code ? exchangeCode(code) : Promise.resolve())
      .catch((error) => console.warn('[spark] sign-in redirect failed', error))
      .finally(() => setDone(true));
  }, [code]);

  return done ? <Redirect href="/" /> : <StatusScreen />;
}
