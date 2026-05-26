/**
 * Food search service.
 *
 * Queries USDA FoodData Central and Open Food Facts in parallel,
 * returning normalised `SearchResult` objects.
 */

import type { SearchResult } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Map USDA internal unit codes to human-readable labels. */
const UNIT_MAP: Record<string, string> = {
  GRM: 'g',
  G: 'g',
  MLT: 'ml',
  ML: 'ml',
  OZ: 'oz',
  LB: 'lb',
  IU: 'IU',
};

function normalizeUnit(raw?: string): string {
  if (!raw) return 'g';
  const upper = raw.trim().toUpperCase();
  return UNIT_MAP[upper] ?? raw.toLowerCase();
}

/** Convert "CHEERIOS CEREAL" → "Cheerios Cereal". */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ═══════════════════════════════════════════════════════════════════════════
// USDA FoodData Central
// ═══════════════════════════════════════════════════════════════════════════

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1/foods/search';

/** USDA nutrient IDs we care about. */
const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  sodium: 1093,
  sugar: 2000,
} as const;

/** Extract a nutrient value from USDA foodNutrients array. */
function usdaNutrient(foodNutrients: any[], nutrientId: number): number {
  const match = foodNutrients?.find(
    (n: any) => n.nutrientId === nutrientId || n.nutrientNumber === String(nutrientId),
  );
  return match?.value ?? 0;
}

export async function searchUSDA(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.EXPO_PUBLIC_USDA_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(`${USDA_BASE}?api_key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        // Only Branded — has actual label serving sizes.
        // SR Legacy is per-100g survey data with verbose names.
        dataType: ['Branded'],
        pageSize: 25,
        nutrients: [1008, 1003, 1005, 1004, 1093, 2000],
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const foods: any[] = data.foods ?? [];

    // Deduplicate by name + brand (keep first = best match)
    const seen = new Set<string>();
    const results: SearchResult[] = [];

    for (const food of foods) {
      const name = titleCase(food.description ?? '');
      const brand = food.brandName ?? food.brandOwner ?? '';
      const key = `${name.toLowerCase()}|${brand.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const nutrients = food.foodNutrients ?? [];
      const servingSize: number | undefined = food.servingSize;
      const scale = servingSize ? servingSize / 100 : 1;

      results.push({
        name,
        brand: brand || undefined,
        servingAmount: servingSize ?? 100,
        servingUnit: normalizeUnit(food.servingSizeUnit),
        calories: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.calories) * scale),
        carbs: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.carbs) * scale * 10) / 10,
        fat: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.fat) * scale * 10) / 10,
        protein: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.protein) * scale * 10) / 10,
        sodium: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.sodium) * scale),
        sugar: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.sugar) * scale * 10) / 10,
        source: 'usda',
        apiId: String(food.fdcId),
      });

      if (results.length >= 10) break;
    }

    return results;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Open Food Facts
// ═══════════════════════════════════════════════════════════════════════════

const OFF_BASE = 'https://world.openfoodfacts.org/api/v2/search';

/** Safely read a nutrient value from OFF nutriments, preferring per-serving. */
function offNutrient(nutriments: any, key: string): number {
  return nutriments?.[`${key}_serving`] ?? nutriments?.[`${key}_100g`] ?? 0;
}

export async function searchOpenFoodFacts(query: string): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      fields: 'product_name,brands,nutriments,serving_size,serving_quantity,code',
      page_size: '25',
      json: '1',
    });

    const res = await fetch(`${OFF_BASE}?${params}`, {
      headers: { 'User-Agent': 'NutritionTracker/1.0' },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const products: any[] = data.products ?? [];

    const seen = new Set<string>();
    const results: SearchResult[] = [];

    for (const product of products) {
      if (!product.product_name) continue;

      const name = product.product_name;
      const brand = product.brands ?? '';
      const key = `${name.toLowerCase()}|${brand.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const n = product.nutriments ?? {};
      const sodiumG = offNutrient(n, 'sodium');

      // Parse serving_size string (e.g. "39g", "1 cup (240ml)", "30 g")
      const servingText: string = product.serving_size ?? '';
      const servingMatch = servingText.match(/^([\d.]+)\s*(\w+)/);
      const servingAmount = product.serving_quantity
        ?? (servingMatch ? parseFloat(servingMatch[1]) : undefined);
      const servingUnit = servingMatch
        ? normalizeUnit(servingMatch[2])
        : undefined;

      results.push({
        name,
        brand: brand || undefined,
        servingAmount,
        servingUnit,
        calories: Math.round(offNutrient(n, 'energy-kcal')),
        carbs: Math.round(offNutrient(n, 'carbohydrates') * 10) / 10,
        fat: Math.round(offNutrient(n, 'fat') * 10) / 10,
        protein: Math.round(offNutrient(n, 'proteins') * 10) / 10,
        sodium: Math.round(sodiumG * 1000),
        sugar: Math.round(offNutrient(n, 'sugars') * 10) / 10,
        source: 'openfoodfacts',
        apiId: product.code ?? undefined,
      });

      if (results.length >= 10) break;
    }

    return results;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Combined search
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Searches USDA and Open Food Facts in parallel, returning combined results.
 */
export async function searchAllAPIs(query: string): Promise<SearchResult[]> {
  const results = await Promise.allSettled([
    searchUSDA(query),
    searchOpenFoodFacts(query),
  ]);

  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
