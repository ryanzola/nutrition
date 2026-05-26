/**
 * useSearch — debounced food search across local entries + external APIs.
 *
 * Returns sectioned results: local matches first, then USDA, then Open Food Facts.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import { searchAllAPIs } from '@/services/foodSearch';
import { getRecentEntries } from '@/services/firestore';
import type { SearchResult, SearchResultSource, FoodEntry, FavoriteFood } from '@/types';

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

interface SearchSection {
  title: string;
  data: SearchResult[];
}

interface UseSearchReturn {
  sections: SearchSection[];
  isLoading: boolean;
  error: string | null;
  hasResults: boolean;
}

export function useSearch(
  uid: string | null,
  query: string,
  favorites: FavoriteFood[],
): UseSearchReturn {
  const [sections, setSections] = useState<SearchSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(0); // incremented to cancel stale results

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = query.trim();

    // Reset if query too short
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSections([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    timerRef.current = setTimeout(async () => {
      const requestId = ++abortRef.current;

      try {
        // Run local search and API search in parallel
        const [localResults, apiResults] = await Promise.all([
          searchLocal(uid, trimmed, favorites),
          searchAllAPIs(trimmed),
        ]);

        // Bail if a newer request has started
        if (requestId !== abortRef.current) return;

        // Deduplicate API results against local matches
        const localNames = new Set(localResults.map((r) => r.name.toLowerCase()));
        const dedupedApi = apiResults.filter(
          (r) => !localNames.has(r.name.toLowerCase()),
        );

        // Group API results by source
        const usdaResults = dedupedApi.filter((r) => r.source === 'usda');
        const offResults = dedupedApi.filter((r) => r.source === 'openfoodfacts');

        const newSections: SearchSection[] = [];
        if (localResults.length > 0) {
          newSections.push({ title: 'Your Foods', data: localResults });
        }
        if (usdaResults.length > 0) {
          newSections.push({ title: 'USDA Database', data: usdaResults });
        }
        if (offResults.length > 0) {
          newSections.push({ title: 'Open Food Facts', data: offResults });
        }

        setSections(newSections);
        setError(null);
      } catch (err) {
        if (requestId !== abortRef.current) return;
        setError('Search failed. Please try again.');
        setSections([]);
      } finally {
        if (requestId === abortRef.current) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [uid, query, favorites]);

  return {
    sections,
    isLoading,
    error,
    hasResults: sections.some((s) => s.data.length > 0),
  };
}

// ── Local search helper ──────────────────────────────────────────────────────

async function searchLocal(
  uid: string | null,
  query: string,
  favorites: FavoriteFood[],
): Promise<SearchResult[]> {
  const lowerQ = query.toLowerCase();
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  // Search favorites
  for (const fav of favorites) {
    if (fav.name.toLowerCase().includes(lowerQ)) {
      const key = fav.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push(favToResult(fav));
      }
    }
  }

  // Search recent entries (last 7 days)
  if (uid) {
    try {
      const recent = await getRecentEntries(uid, 7);
      for (const entry of recent) {
        if (entry.name.toLowerCase().includes(lowerQ)) {
          const key = entry.name.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            results.push(entryToResult(entry));
          }
        }
      }
    } catch {
      // Silently fail — local search is best-effort
    }
  }

  return results;
}

function favToResult(fav: FavoriteFood): SearchResult {
  return {
    name: fav.name,
    servingAmount: fav.servingAmount,
    servingUnit: fav.servingUnit,
    calories: fav.calories,
    carbs: fav.carbs,
    fat: fav.fat,
    protein: fav.protein,
    sodium: fav.sodium,
    sugar: fav.sugar,
    source: 'local',
  };
}

function entryToResult(entry: FoodEntry): SearchResult {
  return {
    name: entry.name,
    servingAmount: entry.servingAmount,
    servingUnit: entry.servingUnit,
    calories: entry.calories,
    carbs: entry.carbs,
    fat: entry.fat,
    protein: entry.protein,
    sodium: entry.sodium,
    sugar: entry.sugar,
    source: 'local',
  };
}
