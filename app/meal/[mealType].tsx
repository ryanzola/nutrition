/**
 * Meal food screen — add food to a specific meal.
 *
 * Route: /meal/[mealType]
 * Matches reference screenshot 5 (dark mode).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '@/context/AppContext';
import { useDay } from '@/hooks/useDay';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import { theme } from '@/constants/theme';
import type { MealType, FoodEntry, FavoriteFood, Recipe } from '@/types';

import QuickAddModal from '@/components/QuickAddModal';

export default function MealScreen() {
  const { mealType: mealTypeParam } = useLocalSearchParams<{ mealType: string }>();
  const mealType = (mealTypeParam ?? 'breakfast') as MealType;
  const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);

  const { uid, selectedDate } = useApp();
  const { dayData, addEntry } = useDay(uid, selectedDate);
  const { recipes } = useRecipes(uid);
  const { favorites, isFavorited, toggleFavorite } = useFavorites(uid);

  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState<FavoriteFood | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'recipes'>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  // Recent entries from today's data across all meals
  const recentEntries = React.useMemo(() => {
    if (!dayData) return [];
    const all: FoodEntry[] = [];
    for (const m of Object.values(dayData.meals)) {
      all.push(...m.entries);
    }
    return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  }, [dayData]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleQuickAdd = useCallback(
    async (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => {
      await addEntry(mealType, entry);
      setQuickAddVisible(false);
      setSelectedFavorite(null);
      router.back();
    },
    [addEntry, mealType],
  );

  const handleAddRecipeToMeal = useCallback(
    async (recipe: Recipe) => {
      // Add the recipe as a single food entry with combined nutrition
      await addEntry(mealType, {
        name: recipe.name,
        calories: recipe.totals.calories,
        carbs: recipe.totals.carbs,
        fat: recipe.totals.fat,
        protein: recipe.totals.protein,
        sodium: recipe.totals.sodium,
        sugar: recipe.totals.sugar,
        recipeId: recipe.id,
      });
      router.back();
    },
    [addEntry, mealType],
  );

  const handleReAddEntry = useCallback(
    async (entry: FoodEntry) => {
      await addEntry(mealType, {
        name: entry.name,
        calories: entry.calories,
        carbs: entry.carbs,
        fat: entry.fat,
        protein: entry.protein,
        sodium: entry.sodium,
        sugar: entry.sugar,
        recipeId: entry.recipeId,
      });
      router.back();
    },
    [addEntry, mealType],
  );

  const handleAddFavoriteToMeal = useCallback(
    (favorite: FavoriteFood) => {
      // Open QuickAddModal pre-filled so user can adjust servings
      setSelectedFavorite(favorite);
      setQuickAddVisible(true);
    },
    [],
  );

  // Filter items by search query
  const filterBySearch = useCallback(
    <T extends { name: string }>(items: T[]): T[] => {
      if (!searchQuery.trim()) return items;
      const q = searchQuery.toLowerCase();
      return items.filter((item) => item.name.toLowerCase().includes(q));
    },
    [searchQuery],
  );

  const filteredRecent = filterBySearch(recentEntries);
  const filteredFavorites = filterBySearch(favorites);
  const filteredRecipes = filterBySearch(recipes);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{mealLabel}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={theme.colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a food"
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {/* Scan With AI — disabled */}
        <View style={[styles.actionButton, styles.actionDisabled]}>
          <Ionicons name="camera-outline" size={22} color={theme.colors.textTertiary} />
          <Text style={[styles.actionLabel, { color: theme.colors.textTertiary }]}>
            Scan With AI
          </Text>
        </View>

        {/* Quick Add */}
        <Pressable
          style={styles.actionButton}
          onPress={() => setQuickAddVisible(true)}
        >
          <Ionicons name="flash-outline" size={22} color={theme.colors.accent} />
          <Text style={styles.actionLabel}>Quick Add</Text>
        </Pressable>

        {/* Create Recipe */}
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/recipe/create')}
        >
          <Ionicons name="restaurant-outline" size={22} color={theme.colors.accent} />
          <Text style={styles.actionLabel}>Create Recipe</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Text
            style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}
          >
            Recent
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text
            style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}
          >
            Favorites
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'recipes' && styles.tabActive]}
          onPress={() => setActiveTab('recipes')}
        >
          <Text
            style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}
          >
            Recipes
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'recent' ? (
          filteredRecent.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="time-outline"
                size={48}
                color={theme.colors.textTertiary}
              />
              <Text style={styles.emptyText}>No recent foods</Text>
              <Text style={styles.emptySubtext}>
                Foods you log will appear here for quick re-adding
              </Text>
            </View>
          ) : (
            filteredRecent.map((entry) => (
              <Pressable
                key={entry.id}
                style={styles.foodRow}
                onPress={() => handleReAddEntry(entry)}
              >
                <View style={styles.foodRowLeft}>
                  <Text style={styles.foodName}>{entry.name}</Text>
                  <Text style={styles.foodMeta}>
                    {entry.calories} Cal · {entry.protein}g P · {entry.carbs}g C ·{' '}
                    {entry.fat}g F
                  </Text>
                </View>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={theme.colors.accent}
                />
              </Pressable>
            ))
          )
        ) : activeTab === 'favorites' ? (
          filteredFavorites.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="heart-outline"
                size={48}
                color={theme.colors.textTertiary}
              />
              <Text style={styles.emptyText}>No favorites yet</Text>
              <Text style={styles.emptySubtext}>
                Long-press a food entry or tap the heart icon to save favorites
              </Text>
            </View>
          ) : (
            filteredFavorites.map((fav) => (
              <Pressable
                key={fav.id}
                style={styles.foodRow}
                onPress={() => handleAddFavoriteToMeal(fav)}
              >
                <View style={styles.foodRowLeft}>
                  <Text style={styles.foodName}>{fav.name}</Text>
                  <Text style={styles.foodMeta}>
                    {fav.calories} Cal · {fav.protein}g P · {fav.carbs}g C ·{' '}
                    {fav.fat}g F
                  </Text>
                </View>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={theme.colors.accent}
                />
              </Pressable>
            ))
          )
        ) : filteredRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="book-outline"
              size={48}
              color={theme.colors.textTertiary}
            />
            <Text style={styles.emptyText}>No recipes yet</Text>
            <Text style={styles.emptySubtext}>
              Create compound foods to log multiple items at once
            </Text>
            <Pressable
              style={styles.createButton}
              onPress={() => router.push('/recipe/create')}
            >
              <Text style={styles.createButtonText}>Create Recipe</Text>
            </Pressable>
          </View>
        ) : (
          recipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              style={styles.foodRow}
              onPress={() => handleAddRecipeToMeal(recipe)}
            >
              <View style={styles.foodRowLeft}>
                <Text style={styles.foodName}>{recipe.name}</Text>
                <Text style={styles.foodMeta}>
                  {recipe.totals.calories} Cal · {recipe.entries.length} ingredient
                  {recipe.entries.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={theme.colors.accent}
              />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Quick Add Modal */}
      <QuickAddModal
        visible={quickAddVisible}
        onClose={() => {
          setQuickAddVisible(false);
          setSelectedFavorite(null);
        }}
        onAdd={handleQuickAdd}
        initialValues={selectedFavorite ?? undefined}
        isFavorited={selectedFavorite ? isFavorited(selectedFavorite.name) : false}
        onToggleFavorite={selectedFavorite ? () => toggleFavorite({
          name: selectedFavorite.name,
          servingAmount: selectedFavorite.servingAmount,
          servingUnit: selectedFavorite.servingUnit,
          calories: selectedFavorite.calories,
          carbs: selectedFavorite.carbs,
          fat: selectedFavorite.fat,
          protein: selectedFavorite.protein,
          sodium: selectedFavorite.sodium,
          sugar: selectedFavorite.sugar,
        }) : undefined}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginTop: 2,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textTertiary,
  },
  tabTextActive: {
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.huge,
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    maxWidth: 240,
  },
  createButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  createButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  foodRowLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  foodName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  foodMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
