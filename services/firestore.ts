/**
 * Firestore CRUD service.
 *
 * Every function takes `uid` as its first argument so all data is scoped
 * under `users/{uid}/…`.
 *
 * Firestore paths:
 *   users/{uid}/settings/config   → UserSettings
 *   users/{uid}/days/{YYYY-MM-DD} → DayDocument
 *   users/{uid}/recipes/{id}      → Recipe
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import type {
  DayDocument,
  FavoriteFood,
  FoodEntry,
  MealType,
  NutritionTotals,
  RecentFood,
  Recipe,
  UserSettings,
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Generate a unique ID. */
function generateId(): string {
  // crypto.randomUUID is available in modern Hermes / JSC via expo
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: simple random ID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Zero-valued nutrition totals. */
function emptyTotals(): NutritionTotals {
  return { calories: 0, carbs: 0, fat: 0, protein: 0, sodium: 0, sugar: 0 };
}

/**
 * Creates an empty day document for the given date.
 */
export function createEmptyDay(date: string): DayDocument {
  return {
    date,
    meals: {
      breakfast: { entries: [] },
      lunch: { entries: [] },
      dinner: { entries: [] },
      snacks: { entries: [] },
    },
    totals: emptyTotals(),
  };
}

/**
 * Recalculates totals by summing every entry across all four meals.
 */
export function recalculateTotals(dayDoc: DayDocument): NutritionTotals {
  const totals = emptyTotals();
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  for (const meal of mealTypes) {
    for (const entry of dayDoc.meals[meal].entries) {
      const s = entry.servings ?? 1;
      totals.calories += entry.calories * s;
      totals.carbs += entry.carbs * s;
      totals.fat += entry.fat * s;
      totals.protein += entry.protein * s;
      totals.sodium += entry.sodium * s;
      totals.sugar += entry.sugar * s;
    }
  }

  return totals;
}

// ═══════════════════════════════════════════════════════════════════════════
// Day operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetches a day document. Returns an empty day if the document doesn't exist.
 */
export async function getDayDocument(uid: string, date: string): Promise<DayDocument> {
  const ref = doc(db, 'users', uid, 'days', date);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return createEmptyDay(date);
  }

  return snap.data() as DayDocument;
}

/**
 * Writes (or overwrites) a full day document.
 * Strips undefined values since Firestore rejects them.
 */
export async function saveDayDocument(uid: string, dayDoc: DayDocument): Promise<void> {
  const ref = doc(db, 'users', uid, 'days', dayDoc.date);
  // JSON round-trip drops keys with `undefined` values
  const cleaned = JSON.parse(JSON.stringify(dayDoc));
  await setDoc(ref, cleaned);
}

/**
 * Adds a food entry to the specified meal and recalculates totals.
 */
export async function addFoodEntry(
  uid: string,
  date: string,
  mealType: MealType,
  entry: Omit<FoodEntry, 'id' | 'createdAt'> | FoodEntry,
): Promise<void> {
  const dayDoc = await getDayDocument(uid, date);
  const fullEntry: FoodEntry = {
    ...entry,
    id: ('id' in entry && entry.id) ? entry.id : generateId(),
    createdAt: ('createdAt' in entry && entry.createdAt) ? entry.createdAt : Date.now(),
  } as FoodEntry;
  dayDoc.meals[mealType].entries.push(fullEntry);
  dayDoc.totals = recalculateTotals(dayDoc);
  await saveDayDocument(uid, dayDoc);
}

/**
 * Updates fields on an existing food entry and recalculates totals.
 */
export async function updateFoodEntry(
  uid: string,
  date: string,
  mealType: MealType,
  entryId: string,
  updates: Partial<FoodEntry>,
): Promise<void> {
  const dayDoc = await getDayDocument(uid, date);
  const entries = dayDoc.meals[mealType].entries;
  const index = entries.findIndex((e) => e.id === entryId);

  if (index === -1) {
    throw new Error(`Entry ${entryId} not found in ${mealType}`);
  }

  entries[index] = { ...entries[index], ...updates };
  dayDoc.totals = recalculateTotals(dayDoc);
  await saveDayDocument(uid, dayDoc);
}

/**
 * Deletes a food entry from the specified meal and recalculates totals.
 */
export async function deleteFoodEntry(
  uid: string,
  date: string,
  mealType: MealType,
  entryId: string,
): Promise<void> {
  const dayDoc = await getDayDocument(uid, date);
  dayDoc.meals[mealType].entries = dayDoc.meals[mealType].entries.filter(
    (e) => e.id !== entryId,
  );
  dayDoc.totals = recalculateTotals(dayDoc);
  await saveDayDocument(uid, dayDoc);
}

/**
 * Moves a food entry from one meal to another within the same day.
 */
export async function moveFoodEntry(
  uid: string,
  date: string,
  fromMeal: MealType,
  toMeal: MealType,
  entryId: string,
): Promise<void> {
  const dayDoc = await getDayDocument(uid, date);
  const fromEntries = dayDoc.meals[fromMeal].entries;
  const index = fromEntries.findIndex((e) => e.id === entryId);

  if (index === -1) {
    throw new Error(`Entry ${entryId} not found in ${fromMeal}`);
  }

  const [entry] = fromEntries.splice(index, 1);
  dayDoc.meals[toMeal].entries.push(entry);
  dayDoc.totals = recalculateTotals(dayDoc);
  await saveDayDocument(uid, dayDoc);
}

/**
 * Subscribes to real-time updates for a day document.
 *
 * @returns An unsubscribe function.
 */
export function subscribeToDay(
  uid: string,
  date: string,
  callback: (doc: DayDocument) => void,
): () => void {
  const ref = doc(db, 'users', uid, 'days', date);

  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as DayDocument);
      } else {
        callback(createEmptyDay(date));
      }
    },
    (error) => {
      console.error('subscribeToDay error:', error);
      // Still provide empty data so the UI doesn't break
      callback(createEmptyDay(date));
    },
  );
}

/**
 * Subscribes to all day documents within an inclusive date range.
 * Days with no logged data have no document and are simply absent.
 *
 * @param startDate - Range start in YYYY-MM-DD format (inclusive)
 * @param endDate   - Range end in YYYY-MM-DD format (inclusive)
 * @returns An unsubscribe function.
 */
export function subscribeToDaysInRange(
  uid: string,
  startDate: string,
  endDate: string,
  callback: (days: DayDocument[]) => void,
): () => void {
  const col = collection(db, 'users', uid, 'days');
  const q = query(col, where('date', '>=', startDate), where('date', '<=', endDate));

  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => d.data() as DayDocument));
    },
    (error) => {
      console.error('subscribeToDaysInRange error:', error);
      callback([]);
    },
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Settings
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetches user settings. Returns `DEFAULT_SETTINGS` if no document exists.
 */
export async function getSettings(uid: string): Promise<UserSettings> {
  const ref = doc(db, 'users', uid, 'settings', 'config');
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { ...DEFAULT_SETTINGS };
  }

  return snap.data() as UserSettings;
}

/**
 * Merges partial updates into the user's settings document.
 */
export async function updateSettings(
  uid: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'settings', 'config');
  await setDoc(ref, settings, { merge: true });
}

/**
 * Subscribes to real-time settings updates.
 *
 * @returns An unsubscribe function.
 */
export function subscribeToSettings(
  uid: string,
  callback: (settings: UserSettings) => void,
): () => void {
  const ref = doc(db, 'users', uid, 'settings', 'config');

  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserSettings);
      } else {
        callback({ ...DEFAULT_SETTINGS });
      }
    },
    (error) => {
      console.error('subscribeToSettings error:', error);
      callback({ ...DEFAULT_SETTINGS });
    },
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Recipes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetches all recipes for the user, ordered by creation date (newest first).
 */
export async function getRecipes(uid: string): Promise<Recipe[]> {
  const col = collection(db, 'users', uid, 'recipes');
  const q = query(col, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => d.data() as Recipe);
}

/**
 * Creates a new recipe and returns its generated ID.
 */
export async function createRecipe(
  uid: string,
  recipe: Omit<Recipe, 'id' | 'createdAt'>,
): Promise<string> {
  const id = generateId();
  const full: Recipe = {
    ...recipe,
    id,
    createdAt: Date.now(),
  };

  const ref = doc(db, 'users', uid, 'recipes', id);
  await setDoc(ref, full);
  return id;
}

/**
 * Soft-deletes a recipe by setting archived = true.
 */
export async function archiveRecipe(uid: string, recipeId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'recipes', recipeId);
  await setDoc(ref, { archived: true }, { merge: true });
}

/**
 * Subscribes to real-time recipe list updates, ordered by creation date.
 *
 * @returns An unsubscribe function.
 */
export function subscribeToRecipes(
  uid: string,
  callback: (recipes: Recipe[]) => void,
): () => void {
  const col = collection(db, 'users', uid, 'recipes');
  const q = query(col, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snap) => {
    const recipes = snap.docs
      .map((d) => d.data() as Recipe)
      .filter((r) => !r.archived);
    callback(recipes);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Favorites
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subscribes to real-time favorite foods list, most recently used first.
 *
 * Sorted client-side by `lastUsed` (falling back to `createdAt`) so that
 * favorites saved before the `lastUsed` field existed still sort correctly.
 *
 * @returns An unsubscribe function.
 */
export function subscribeToFavorites(
  uid: string,
  callback: (favorites: FavoriteFood[]) => void,
): () => void {
  const col = collection(db, 'users', uid, 'favorites');

  return onSnapshot(
    col,
    (snap) => {
      const favorites = snap.docs
        .map((d) => d.data() as FavoriteFood)
        .sort((a, b) => (b.lastUsed ?? b.createdAt) - (a.lastUsed ?? a.createdAt));
      callback(favorites);
    },
    (error) => {
      console.error('subscribeToFavorites error:', error);
      callback([]);
    },
  );
}

/**
 * Adds a food to favorites. Stores per-serving nutrition values.
 */
export async function addFavorite(
  uid: string,
  food: Omit<FavoriteFood, 'id' | 'createdAt'>,
): Promise<string> {
  const id = generateId();
  const now = Date.now();
  const favorite: FavoriteFood = {
    ...food,
    id,
    createdAt: now,
    lastUsed: now,
  };

  const ref = doc(db, 'users', uid, 'favorites', id);
  await setDoc(ref, favorite);
  return id;
}

/**
 * Marks a favorite as just-used so it sorts to the top of the list.
 */
export async function touchFavorite(uid: string, favoriteId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'favorites', favoriteId);
  await setDoc(ref, { lastUsed: Date.now() }, { merge: true });
}

/**
 * Removes a food from favorites by ID.
 */
export async function removeFavorite(uid: string, favoriteId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'favorites', favoriteId);
  await deleteDoc(ref);
}

// ═══════════════════════════════════════════════════════════════════════════
// Recent entries
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetches all food entries from the last N days.
 */
export async function getRecentEntries(
  uid: string,
  days: number = 7,
): Promise<FoodEntry[]> {
  const today = new Date();
  const entries: FoodEntry[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayDoc = await getDayDocument(uid, dateStr);

    for (const meal of Object.values(dayDoc.meals)) {
      for (const entry of meal.entries) {
        // Deduplicate by name (case-insensitive)
        const key = entry.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          entries.push(entry);
        }
      }
    }
  }

  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

// ═══════════════════════════════════════════════════════════════════════════
// Recent Foods
// ═══════════════════════════════════════════════════════════════════════════

const MAX_RECENT_FOODS = 200;

/**
 * Creates a deterministic Firestore-safe document ID from a food name.
 */
function recentFoodId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\/\.\#\$\[\]]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 200);
}

/**
 * Upserts a food into the recent foods collection.
 * If a food with the same name exists, updates it with the latest data.
 */
export async function addRecentFood(
  uid: string,
  entry: Omit<FoodEntry, 'id' | 'createdAt'>,
): Promise<void> {
  const id = recentFoodId(entry.name);
  const recent: RecentFood = {
    id,
    name: entry.name,
    calories: entry.calories,
    carbs: entry.carbs,
    fat: entry.fat,
    protein: entry.protein,
    sodium: entry.sodium,
    sugar: entry.sugar,
    servingAmount: entry.servingAmount,
    servingUnit: entry.servingUnit,
    servings: entry.servings,
    lastUsed: Date.now(),
  };

  const ref = doc(db, 'users', uid, 'recentFoods', id);
  await setDoc(ref, recent);

  // Trim in the background — don't block the caller
  trimRecentFoods(uid).catch(() => {});
}

/**
 * Subscribes to the most recent 200 foods, ordered by lastUsed descending.
 */
export function subscribeToRecentFoods(
  uid: string,
  callback: (foods: RecentFood[]) => void,
): () => void {
  const col = collection(db, 'users', uid, 'recentFoods');
  const q = query(col, orderBy('lastUsed', 'desc'), limit(MAX_RECENT_FOODS));

  return onSnapshot(q, (snap) => {
    const foods = snap.docs.map((d) => d.data() as RecentFood);
    callback(foods);
  });
}

/**
 * Trims the recent foods collection to MAX_RECENT_FOODS.
 * Deletes the oldest entries beyond the limit.
 */
async function trimRecentFoods(uid: string): Promise<void> {
  const col = collection(db, 'users', uid, 'recentFoods');
  const q = query(col, orderBy('lastUsed', 'desc'));
  const snap = await getDocs(q);

  if (snap.size <= MAX_RECENT_FOODS) return;

  const toDelete = snap.docs.slice(MAX_RECENT_FOODS);
  for (const d of toDelete) {
    await deleteDoc(d.ref);
  }
}
