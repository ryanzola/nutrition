/**
 * context/AppContext.tsx
 *
 * App-wide React context that composes auth state, user settings,
 * and the currently-selected date into a single provider.
 *
 * Usage:
 * ```tsx
 * // In your root layout
 * <AppProvider>
 *   <Slot />
 * </AppProvider>
 *
 * // In any child component
 * const { uid, settings, selectedDate } = useApp();
 * ```
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { UserSettings } from '@/types';
import { theme } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a date string in `YYYY-MM-DD` format.
 *
 * @param date - Optional `Date` object; defaults to `new Date()` (today).
 */
export function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Context shape ───────────────────────────────────────────────────────

interface AppContextValue {
  /** The current user's UID, or null when signed out */
  uid: string | null;
  /** Whether Firebase Auth has finished initializing */
  initialized: boolean;
  /** The currently-selected date in YYYY-MM-DD format */
  selectedDate: string;
  /** Update the selected date */
  setSelectedDate: (date: string) => void;
  /** User settings (always defined — falls back to defaults) */
  settings: UserSettings;
  /** True while the settings snapshot is loading */
  settingsLoading: boolean;
  /** Merge partial settings into the stored document */
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  /** Reset all settings to app defaults */
  resetSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────────────────

/**
 * Wraps the component tree with app-wide state.
 *
 * Renders a centered loading spinner until Firebase Auth has
 * initialized, preventing downstream components from rendering
 * in an indeterminate auth state.
 */
export function AppProvider({ children }: PropsWithChildren) {
  const { uid, initialized } = useAuth();
  const {
    settings,
    loading: settingsLoading,
    updateSettings,
    resetToDefaults,
  } = useSettings(uid);

  const [selectedDate, setSelectedDate] = useState<string>(getDateString());

  // Memoize the context value to avoid unnecessary re-renders
  const value = useMemo<AppContextValue>(
    () => ({
      uid,
      initialized,
      selectedDate,
      setSelectedDate,
      settings,
      settingsLoading,
      updateSettings,
      resetSettings: resetToDefaults,
    }),
    [
      uid,
      initialized,
      selectedDate,
      settings,
      settingsLoading,
      updateSettings,
      resetToDefaults,
    ],
  );

  // Block rendering until auth has resolved
  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ── Consumer hook ───────────────────────────────────────────────────────

/**
 * Access the app-wide context.
 *
 * Must be called from a component wrapped by `<AppProvider>`.
 * Throws a descriptive error if called outside the provider.
 */
export function useApp(): AppContextValue {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error(
      'useApp() must be used within an <AppProvider>. ' +
        'Wrap your root layout with <AppProvider> to fix this.',
    );
  }

  return context;
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
