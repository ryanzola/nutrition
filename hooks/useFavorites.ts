/**
 * hooks/useFavorites.ts
 *
 * Real-time subscription to the user's favorite foods collection.
 * Provides add/remove helpers and a name-based lookup for checking
 * if a food is already favorited.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';

import {
  subscribeToFavorites,
  addFavorite as addFavoriteToFirestore,
  removeFavorite as removeFavoriteFromFirestore,
} from '@/services/firestore';
import type { FavoriteFood } from '@/types';

interface UseFavoritesResult {
  /** All saved favorites, newest first. */
  favorites: FavoriteFood[];
  /** Check if a food name is already in favorites. */
  isFavorited: (name: string) => boolean;
  /** Get the favorite entry matching a food name, if any. */
  getFavoriteByName: (name: string) => FavoriteFood | undefined;
  /** Save a food to favorites. */
  addFavorite: (food: Omit<FavoriteFood, 'id' | 'createdAt'>) => Promise<void>;
  /** Remove a food from favorites by its ID. */
  removeFavorite: (favoriteId: string) => Promise<void>;
  /** Toggle favorite status for a food entry. Returns the new favorited state. */
  toggleFavorite: (food: Omit<FavoriteFood, 'id' | 'createdAt'>) => Promise<boolean>;
}

export function useFavorites(uid: string | null): UseFavoritesResult {
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);

  // ── Subscribe to favorites collection ─────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setFavorites([]);
      return;
    }

    const unsubscribe = subscribeToFavorites(uid, setFavorites);
    return unsubscribe;
  }, [uid]);

  // ── Name-based lookup set (case-insensitive) ─────────────────────────
  const favoriteNameMap = useMemo(() => {
    const map = new Map<string, FavoriteFood>();
    for (const fav of favorites) {
      map.set(fav.name.toLowerCase(), fav);
    }
    return map;
  }, [favorites]);

  const isFavorited = useCallback(
    (name: string): boolean => {
      return favoriteNameMap.has(name.toLowerCase());
    },
    [favoriteNameMap],
  );

  const getFavoriteByName = useCallback(
    (name: string): FavoriteFood | undefined => {
      return favoriteNameMap.get(name.toLowerCase());
    },
    [favoriteNameMap],
  );

  // ── Mutations ─────────────────────────────────────────────────────────
  const addFavorite = useCallback(
    async (food: Omit<FavoriteFood, 'id' | 'createdAt'>) => {
      if (!uid) return;
      await addFavoriteToFirestore(uid, food);
    },
    [uid],
  );

  const removeFavorite = useCallback(
    async (favoriteId: string) => {
      if (!uid) return;
      await removeFavoriteFromFirestore(uid, favoriteId);
    },
    [uid],
  );

  const toggleFavorite = useCallback(
    async (food: Omit<FavoriteFood, 'id' | 'createdAt'>): Promise<boolean> => {
      if (!uid) return false;

      const existing = favoriteNameMap.get(food.name.toLowerCase());
      if (existing) {
        await removeFavoriteFromFirestore(uid, existing.id);
        return false;
      } else {
        await addFavoriteToFirestore(uid, food);
        return true;
      }
    },
    [uid, favoriteNameMap],
  );

  return {
    favorites,
    isFavorited,
    getFavoriteByName,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
