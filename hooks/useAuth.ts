/**
 * hooks/useAuth.ts
 *
 * React hook that initializes Firebase Authentication on mount
 * and tracks the current user's UID, loading state, and
 * whether auth has been initialized.
 */

import { useEffect, useState } from 'react';

import { initAuth } from '@/services/auth';

interface UseAuthResult {
  /** The current user's UID, or null if signed out */
  uid: string | null;
  /** True while waiting for the initial auth state to resolve */
  loading: boolean;
  /** True once the auth listener has fired at least once */
  initialized: boolean;
}

/**
 * Subscribes to Firebase Auth state changes.
 *
 * - Calls `initAuth()` on mount, which registers an `onAuthStateChanged`
 *   listener and returns an unsubscribe function.
 * - Sets `initialized` to `true` after the first callback.
 * - Updates `uid` whenever the auth state changes.
 */
export function useAuth(): UseAuthResult {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth((user) => {
      setUid(user?.uid ?? null);
      setLoading(false);
      setInitialized(true);
    });

    return unsubscribe;
  }, []);

  return { uid, loading, initialized };
}
