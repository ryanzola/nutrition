/**
 * Core data types for the NutritionTracker app.
 *
 * These types mirror the Firestore document shapes and are used across
 * services, stores, and UI components.
 */

// ── Meal type ───────────────────────────────────────────────────────────────

/** The four meal slots available each day. */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

// ── Food entry ──────────────────────────────────────────────────────────────

/** A single tracked food item within a meal. */
export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  sodium: number;
  sugar: number;
  /** If this entry was logged from a saved recipe, the recipe ID. */
  recipeId?: string;
  /** Unix-ms timestamp of when this entry was created. */
  createdAt: number;
}

// ── Meal data ───────────────────────────────────────────────────────────────

/** Container for all food entries within a single meal. */
export interface MealData {
  entries: FoodEntry[];
}

// ── Nutrition totals ────────────────────────────────────────────────────────

/** Aggregated macro / micro totals for a day or recipe. */
export interface NutritionTotals {
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  sodium: number;
  sugar: number;
}

// ── Day document ────────────────────────────────────────────────────────────

/**
 * A single day's tracking data.
 *
 * Firestore path: `users/{uid}/days/{YYYY-MM-DD}`
 */
export interface DayDocument {
  /** ISO date string in YYYY-MM-DD format. */
  date: string;
  /** Meal slots keyed by MealType. */
  meals: Record<MealType, MealData>;
  /** Pre-computed totals across all meals. */
  totals: NutritionTotals;
}

// ── Recipe ──────────────────────────────────────────────────────────────────

/**
 * A saved recipe (template of food entries that can be logged as a group).
 *
 * Firestore path: `users/{uid}/recipes/{recipeId}`
 */
export interface Recipe {
  id: string;
  name: string;
  entries: FoodEntry[];
  totals: NutritionTotals;
  /** Unix-ms timestamp of when this recipe was created. */
  createdAt: number;
}

// ── User settings ───────────────────────────────────────────────────────────

/**
 * Per-user nutritional goals and macro split.
 *
 * Firestore path: `users/{uid}/settings/config`
 */
export interface UserSettings {
  calorieGoal: number;
  /** Daily carbs goal in grams. */
  carbsGoal: number;
  /** Daily fat goal in grams. */
  fatGoal: number;
  /** Daily protein goal in grams. */
  proteinGoal: number;
  /** Daily sodium goal in milligrams. */
  sodiumGoal: number;
  /** Daily sugar goal in grams. */
  sugarGoal: number;
  /** Target carbs percentage of total calories. */
  carbsPercent: number;
  /** Target fat percentage of total calories. */
  fatPercent: number;
  /** Target protein percentage of total calories. */
  proteinPercent: number;
}
