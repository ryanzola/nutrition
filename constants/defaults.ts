/**
 * Default app settings and meal-related constants.
 *
 * These values are used as initial defaults when a new user is created and
 * whenever a settings document hasn't been written to Firestore yet.
 */

import type { MealType, UserSettings } from '../types';

// ── Default nutritional goals ───────────────────────────────────────────────

export const DEFAULT_SETTINGS: UserSettings = {
  calorieGoal: 2400,
  carbsGoal: 293, // grams
  fatGoal: 65, // grams
  proteinGoal: 146, // grams
  sodiumGoal: 2300, // mg
  sugarGoal: 50, // grams
  carbsPercent: 50,
  fatPercent: 25,
  proteinPercent: 25,
};

// ── Meal types ──────────────────────────────────────────────────────────────

/** Ordered list of meal types used throughout the app. */
export const MEAL_TYPES: readonly MealType[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snacks',
] as const;

// ── Meal → Ionicons icon mapping ────────────────────────────────────────────

/**
 * Maps each meal type to an Ionicons icon name.
 * Used in meal section headers, tab bars, and selection sheets.
 */
export const MEAL_ICONS: Record<MealType, string> = {
  breakfast: 'sunny-outline',
  lunch: 'restaurant-outline',
  dinner: 'moon-outline',
  snacks: 'cafe-outline',
};

// ── Meal → Display label mapping ────────────────────────────────────────────

/** Human-readable labels for each meal type. */
export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};
