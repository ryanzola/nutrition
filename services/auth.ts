/**
 * Authentication service.
 *
 * The app uses anonymous auth so users can start tracking immediately without
 * creating an account. The UID is used to scope all Firestore data.
 */

import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Initializes Firebase Auth and subscribes to state changes.
 *
 * If no user is signed in, triggers anonymous sign-in automatically.
 * The callback is called whenever the auth state changes (initial load,
 * sign-in, sign-out).
 *
 * @param callback - Called with the current User (or null) on each auth state change.
 * @returns An unsubscribe function to clean up the listener.
 */
export function initAuth(callback: (user: User | null) => void): () => void {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // No user signed in — trigger anonymous sign-in
      try {
        await signInAnonymously(auth);
        // onAuthStateChanged will fire again with the new user
      } catch (error) {
        console.error('Anonymous sign-in failed:', error);
        callback(null);
      }
    } else {
      callback(user);
    }
  });

  return unsubscribe;
}

/**
 * Returns the current user's UID, or `null` if nobody is signed in.
 */
export function getCurrentUid(): string | null {
  return auth.currentUser?.uid ?? null;
}
