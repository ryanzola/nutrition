/**
 * hooks/useSettings.ts
 *
 * React hook that subscribes to the authenticated user's settings
 * document in Firestore and provides helpers to update or reset them.
 * Falls back to DEFAULT_SETTINGS when no document exists.
 */

import { useCallback, useEffect, useState } from 'react';

import type { UserSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants/defaults';
import {
  updateSettings as saveSettings,
  subscribeToSettings,
} from '@/services/firestore';

interface UseSettingsResult {
  /** Current settings (always defined — falls back to defaults) */
  settings: UserSettings;
  /** True while waiting for the initial snapshot */
  loading: boolean;
  /** Merge a partial settings object into the stored settings */
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  /** Reset all settings back to the app defaults */
  resetToDefaults: () => Promise<void>;
}

/**
 * Subscribes to `users/{uid}/settings/preferences` in Firestore.
 *
 * While loading — or when the user is signed out — the hook returns
 * `DEFAULT_SETTINGS` so consumers never have to null-check.
 *
 * @param uid - The authenticated user's UID, or null if signed out
 */
export function useSettings(uid: string | null): UseSettingsResult {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // ── Real-time subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToSettings(uid, (doc) => {
      setSettings(doc ?? DEFAULT_SETTINGS);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  // ── Mutation helpers ────────────────────────────────────────────────

  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>): Promise<void> => {
      if (!uid) return;
      const merged: UserSettings = { ...settings, ...partial };
      await saveSettings(uid, merged);
    },
    [uid, settings],
  );

  const resetToDefaults = useCallback(async (): Promise<void> => {
    if (!uid) return;
    await saveSettings(uid, DEFAULT_SETTINGS);
  }, [uid]);

  return { settings, loading, updateSettings, resetToDefaults };
}
