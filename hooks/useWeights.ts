/**
 * hooks/useWeights.ts
 *
 * Real-time subscription to the user's weigh-ins over the past year,
 * with an upsert helper for logging today's weight.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  subscribeToWeights,
  setWeight as setWeightInFirestore,
  deleteWeight as deleteWeightInFirestore,
} from '@/services/firestore';
import { getDateString } from '@/context/AppContext';
import type { WeightEntry } from '@/types';

interface UseWeightsResult {
  /** Weigh-ins from the past year, sorted by date ascending. */
  weights: WeightEntry[];
  /** Upsert the weigh-in for a date (defaults to today). */
  logWeight: (weight: number, date?: string) => Promise<void>;
  /** Remove the weigh-in for a date. */
  removeWeight: (date: string) => Promise<void>;
}

export function useWeights(uid: string | null): UseWeightsResult {
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  // One year of history covers the largest chart window.
  const startDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return getDateString(d);
  }, []);

  useEffect(() => {
    if (!uid) {
      setWeights([]);
      return;
    }
    return subscribeToWeights(uid, startDate, setWeights);
  }, [uid, startDate]);

  const logWeight = useCallback(
    async (weight: number, date: string = getDateString()) => {
      if (!uid) return;
      await setWeightInFirestore(uid, date, weight);
    },
    [uid],
  );

  const removeWeight = useCallback(
    async (date: string) => {
      if (!uid) return;
      await deleteWeightInFirestore(uid, date);
    },
    [uid],
  );

  return { weights, logWeight, removeWeight };
}
