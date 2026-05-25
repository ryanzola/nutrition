/**
 * hooks/useDay.ts
 *
 * React hook that subscribes to a day document in Firestore
 * and exposes mutation helpers for managing food entries
 * within meals.
 */

import { useCallback, useEffect, useState } from 'react';

import type { DayDocument, FoodEntry, MealType } from '@/types';
import {
  addFoodEntry,
  deleteFoodEntry,
  moveFoodEntry,
  subscribeToDay,
  updateFoodEntry,
} from '@/services/firestore';

interface UseDayResult {
  /** The current day document, or null if it doesn't exist yet */
  dayData: DayDocument | null;
  /** True while waiting for the initial snapshot */
  loading: boolean;
  /** Add a food entry to a specific meal */
  addEntry: (
    mealType: MealType,
    entry: Omit<FoodEntry, 'id' | 'createdAt'>,
  ) => Promise<void>;
  /** Update fields on an existing food entry */
  updateEntry: (
    mealType: MealType,
    entryId: string,
    updates: Partial<FoodEntry>,
  ) => Promise<void>;
  /** Delete a food entry from a meal */
  deleteEntry: (mealType: MealType, entryId: string) => Promise<void>;
  /** Move a food entry from one meal to another */
  moveEntry: (
    fromMeal: MealType,
    toMeal: MealType,
    entryId: string,
  ) => Promise<void>;
}

/**
 * Subscribes to the Firestore document at `users/{uid}/days/{date}`.
 *
 * Re-subscribes whenever `uid` or `date` changes. Returns `null` for
 * `dayData` when the user is not authenticated or the document doesn't
 * exist yet.
 *
 * @param uid  - The authenticated user's UID (or null if signed out)
 * @param date - The date string in YYYY-MM-DD format
 */
export function useDay(uid: string | null, date: string): UseDayResult {
  const [dayData, setDayData] = useState<DayDocument | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Real-time subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setDayData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToDay(uid, date, (doc) => {
      setDayData(doc);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid, date]);

  // ── Mutation helpers ────────────────────────────────────────────────

  const addEntry = useCallback(
    async (
      mealType: MealType,
      entry: Omit<FoodEntry, 'id' | 'createdAt'>,
    ): Promise<void> => {
      if (!uid) return;
      await addFoodEntry(uid, date, mealType, entry);
    },
    [uid, date],
  );

  const updateEntry = useCallback(
    async (
      mealType: MealType,
      entryId: string,
      updates: Partial<FoodEntry>,
    ): Promise<void> => {
      if (!uid) return;
      await updateFoodEntry(uid, date, mealType, entryId, updates);
    },
    [uid, date],
  );

  const deleteEntry = useCallback(
    async (mealType: MealType, entryId: string): Promise<void> => {
      if (!uid) return;
      await deleteFoodEntry(uid, date, mealType, entryId);
    },
    [uid, date],
  );

  const moveEntry = useCallback(
    async (
      fromMeal: MealType,
      toMeal: MealType,
      entryId: string,
    ): Promise<void> => {
      if (!uid) return;
      await moveFoodEntry(uid, date, fromMeal, toMeal, entryId);
    },
    [uid, date],
  );

  return { dayData, loading, addEntry, updateEntry, deleteEntry, moveEntry };
}
