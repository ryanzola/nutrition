/**
 * Firebase configuration & singleton instances.
 *
 * Uses the Firebase JS SDK with React Native–compatible auth persistence
 * backed by AsyncStorage.
 */

import { initializeApp } from 'firebase/app';
// @ts-expect-error — getReactNativePersistence is exported from the RN bundle
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Firebase project config ─────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: 'AIzaSyCAee5Bk1jgT6m0Yzj3BIgZwguBJjIad70',
  authDomain: 'nutrition-72cec.firebaseapp.com',
  projectId: 'nutrition-72cec',
  storageBucket: 'nutrition-72cec.firebasestorage.app',
  messagingSenderId: '637199422658',
  appId: '1:637199422658:web:1035a6940c23f79c9e975b',
  measurementId: 'G-2RTXM5J2H8',
};

// ── Initialise Firebase ─────────────────────────────────────────────────────

/** Firebase application instance. */
export const app = initializeApp(firebaseConfig);

/**
 * Firebase Auth instance with React Native persistence.
 *
 * `getReactNativePersistence` stores the auth state in AsyncStorage so the
 * user stays signed in across app restarts.
 */
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

/** Cloud Firestore instance. */
export const db = getFirestore(app);
