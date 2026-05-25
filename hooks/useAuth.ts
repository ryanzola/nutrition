/**
 * hooks/useAuth.ts
 *
 * Returns a hardcoded UID for single-user mode.
 * This ensures the same Firestore data is shared across all devices
 * (simulator, physical phone, etc.) without needing a login flow.
 *
 * To switch back to anonymous auth, restore the initAuth() listener.
 */

const HARDCODED_UID = 'CgVmvrTz2PZ2Ku16OjfZhFpVNr92';

interface UseAuthResult {
  /** The current user's UID */
  uid: string | null;
  /** Always false in hardcoded mode */
  loading: boolean;
  /** Always true in hardcoded mode */
  initialized: boolean;
}

export function useAuth(): UseAuthResult {
  return {
    uid: HARDCODED_UID,
    loading: false,
    initialized: true,
  };
}
