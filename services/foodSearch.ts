/**
 * Food search service.
 *
 * Queries USDA FoodData Central and Open Food Facts in parallel,
 * returning normalised `SearchResult` objects.
 */

import type { SearchResult } from '@/types';

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
        dataType: ['Branded', 'SR Legacy'],
        pageSize: 15,
        nutrients: [1008, 1003, 1005, 1004, 1093, 2000],
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const foods: any[] = data.foods ?? [];

    return foods.map((food): SearchResult => {
      const nutrients = food.foodNutrients ?? [];
      const isBranded = food.dataType === 'Branded';
      const servingSize: number | undefined = food.servingSize;
      const scale = isBranded && servingSize ? servingSize / 100 : 1;

      return {
        name: food.description ?? '',
        brand: food.brandName ?? food.brandOwner ?? undefined,
        servingAmount: isBranded && servingSize ? servingSize : 100,
        servingUnit: food.servingSizeUnit ?? 'g',
        calories: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.calories) * scale),
        carbs: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.carbs) * scale * 10) / 10,
        fat: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.fat) * scale * 10) / 10,
        protein: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.protein) * scale * 10) / 10,
        sodium: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.sodium) * scale),
        sugar: Math.round(usdaNutrient(nutrients, NUTRIENT_IDS.sugar) * scale * 10) / 10,
        source: 'usda',
        apiId: String(food.fdcId),
      };
    });
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
      page_size: '15',
      json: '1',
    });

    const res = await fetch(`${OFF_BASE}?${params}`, {
      headers: { 'User-Agent': 'NutritionTracker/1.0' },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const products: any[] = data.products ?? [];

    return products
      .filter((p: any) => p.product_name)
      .map((product): SearchResult => {
        const n = product.nutriments ?? {};
        const sodiumG = offNutrient(n, 'sodium');

        return {
          name: product.product_name,
          brand: product.brands || undefined,
          servingAmount: product.serving_quantity ?? undefined,
          servingUnit: product.serving_size ?? undefined,
          calories: Math.round(offNutrient(n, 'energy-kcal')),
          carbs: Math.round(offNutrient(n, 'carbohydrates') * 10) / 10,
          fat: Math.round(offNutrient(n, 'fat') * 10) / 10,
          protein: Math.round(offNutrient(n, 'proteins') * 10) / 10,
          sodium: Math.round(sodiumG * 1000),
          sugar: Math.round(offNutrient(n, 'sugars') * 10) / 10,
          source: 'openfoodfacts',
          apiId: product.code ?? undefined,
        };
      });
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
