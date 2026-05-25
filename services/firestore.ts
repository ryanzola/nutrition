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
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import type {
  DayDocument,
  FavoriteFood,
  FoodEntry,
  MealType,
  NutritionTotals,
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
      totals.calories += entry.calories;
      totals.carbs += entry.carbs;
      totals.fat += entry.fat;
      totals.protein += entry.protein;
      totals.sodium += entry.sodium;
      totals.sugar += entry.sugar;
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
 */
export async function saveDayDocument(uid: string, dayDoc: DayDocument): Promise<void> {
  const ref = doc(db, 'users', uid, 'days', dayDoc.date);
  await setDoc(ref, dayDoc);
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
 * Deletes a recipe by ID.
 */
export async function deleteRecipe(uid: string, recipeId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'recipes', recipeId);
  await deleteDoc(ref);
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
    const recipes = snap.docs.map((d) => d.data() as Recipe);
    callback(recipes);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Favorites
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Subscribes to real-time favorite foods list, ordered by creation date.
 *
 * @returns An unsubscribe function.
 */
export function subscribeToFavorites(
  uid: string,
  callback: (favorites: FavoriteFood[]) => void,
): () => void {
  const col = collection(db, 'users', uid, 'favorites');
  const q = query(col, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      const favorites = snap.docs.map((d) => d.data() as FavoriteFood);
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
  const favorite: FavoriteFood = {
    ...food,
    id,
    createdAt: Date.now(),
  };

  const ref = doc(db, 'users', uid, 'favorites', id);
  await setDoc(ref, favorite);
  return id;
}

/**
 * Removes a food from favorites by ID.
 */
export async function removeFavorite(uid: string, favoriteId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'favorites', favoriteId);
  await deleteDoc(ref);
}
