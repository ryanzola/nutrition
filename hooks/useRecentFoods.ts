/**
 * hooks/useRecentFoods.ts
 *
 * Real-time subscription to the user's recent foods collection in Firestore.
 * Returns the last 200 unique foods ordered by most recently used.
 */

import { useEffect, useState } from 'react';

import type { RecentFood } from '@/types';
import { subscribeToRecentFoods } from '@/services/firestore';

interface UseRecentFoodsResult {
  /** The list of recent foods, ordered by lastUsed descending. */
  recentFoods: RecentFood[];
  /** True while waiting for the initial snapshot. */
  loading: boolean;
}

/**
 * Subscribes to `users/{uid}/recentFoods` in Firestore.
 *
 * Returns an empty array when the user is signed out.
 * Re-subscribes whenever `uid` changes.
 */
export function useRecentFoods(uid: string | null): UseRecentFoodsResult {
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setRecentFoods([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToRecentFoods(uid, (foods) => {
      setRecentFoods(foods);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  return { recentFoods, loading };
}
