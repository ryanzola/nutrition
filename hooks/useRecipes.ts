/**
 * hooks/useRecipes.ts
 *
 * React hook that subscribes to the authenticated user's
 * recipes collection in Firestore and provides helpers to
 * create and archive recipes.
 */

import { useCallback, useEffect, useState } from 'react';

import type { Recipe } from '@/types';
import {
  createRecipe as createRecipeService,
  archiveRecipe as archiveRecipeService,
  subscribeToRecipes,
} from '@/services/firestore';

interface UseRecipesResult {
  /** The list of saved recipes */
  recipes: Recipe[];
  /** True while waiting for the initial snapshot */
  loading: boolean;
  /** Create a new recipe and return its generated ID */
  createRecipe: (
    recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>,
  ) => Promise<string>;
  /** Soft-delete a recipe by ID */
  archiveRecipe: (id: string) => Promise<void>;
}

/**
 * Subscribes to `users/{uid}/recipes` in Firestore.
 *
 * Returns an empty array when the user is signed out.
 * Re-subscribes whenever `uid` changes.
 *
 * @param uid - The authenticated user's UID, or null if signed out
 */
export function useRecipes(uid: string | null): UseRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Real-time subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToRecipes(uid, (docs) => {
      setRecipes(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  // ── Mutation helpers ────────────────────────────────────────────────

  const createRecipe = useCallback(
    async (
      recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>,
    ): Promise<string> => {
      if (!uid) throw new Error('User must be authenticated to create a recipe');
      return createRecipeService(uid, recipe);
    },
    [uid],
  );

  const archiveRecipe = useCallback(
    async (id: string): Promise<void> => {
      if (!uid) return;
      await archiveRecipeService(uid, id);
    },
    [uid],
  );

  return { recipes, loading, createRecipe, archiveRecipe };
}
