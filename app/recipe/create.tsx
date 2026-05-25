/**
 * Create Recipe screen.
 *
 * Route: /recipe/create
 * Build a compound food from individual ingredients.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '@/context/AppContext';
import { useRecipes } from '@/hooks/useRecipes';
import { useFavorites } from '@/hooks/useFavorites';
import { theme } from '@/constants/theme';
import type { FoodEntry, FavoriteFood, NutritionTotals } from '@/types';

import QuickAddModal from '@/components/QuickAddModal';

export default function CreateRecipeScreen() {
  const { uid } = useApp();
  const { createRecipe } = useRecipes(uid);
  const { favorites } = useFavorites(uid);

  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<Omit<FoodEntry, 'id' | 'createdAt'>[]>(
    [],
  );
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [favPickerVisible, setFavPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Computed totals ────────────────────────────────────────────────────
  const totals: NutritionTotals = useMemo(() => {
    return ingredients.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        protein: acc.protein + item.protein,
        sodium: acc.sodium + item.sodium,
        sugar: acc.sugar + item.sugar,
      }),
      { calories: 0, carbs: 0, fat: 0, protein: 0, sodium: 0, sugar: 0 },
    );
  }, [ingredients]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleAddIngredient = useCallback(
    (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => {
      setIngredients((prev) => [...prev, entry]);
      setQuickAddVisible(false);
    },
    [],
  );

  const handleAddFavoriteAsIngredient = useCallback(
    (fav: FavoriteFood) => {
      setIngredients((prev) => [
        ...prev,
        {
          name: fav.name,
          servingAmount: fav.servingAmount,
          servingUnit: fav.servingUnit,
          calories: fav.calories,
          carbs: fav.carbs,
          fat: fav.fat,
          protein: fav.protein,
          sodium: fav.sodium,
          sugar: fav.sugar,
        },
      ]);
      setFavPickerVisible(false);
    },
    [],
  );

  const handleAddPress = useCallback(() => {
    if (favorites.length === 0) {
      // No favorites — go straight to quick add
      setQuickAddVisible(true);
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['From Favorites', 'New Ingredient', 'Cancel'],
          cancelButtonIndex: 2,
        },
        (idx) => {
          if (idx === 0) setFavPickerVisible(true);
          else if (idx === 1) setQuickAddVisible(true);
        },
      );
    } else {
      Alert.alert('Add Ingredient', 'Choose a source', [
        { text: 'From Favorites', onPress: () => setFavPickerVisible(true) },
        { text: 'New Ingredient', onPress: () => setQuickAddVisible(true) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [favorites.length]);

  const handleRemoveIngredient = useCallback((index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please give your recipe a name.');
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert('No Ingredients', 'Add at least one ingredient to your recipe.');
      return;
    }

    setSaving(true);
    try {
      // Build FoodEntry array with temporary IDs for storage
      const entries: FoodEntry[] = ingredients.map((item, idx) => ({
        ...item,
        id: `ingredient-${idx}-${Date.now()}`,
        createdAt: Date.now(),
      }));

      await createRecipe({
        name: name.trim(),
        entries,
        totals,
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [name, ingredients, totals, createRecipe]);

  const canSave = name.trim().length > 0 && ingredients.length > 0 && !saving;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create Recipe</Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={12}>
          <Text
            style={[styles.saveText, !canSave && { opacity: 0.4 }]}
          >
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe name */}
        <View style={styles.nameCard}>
          <Text style={styles.label}>Recipe Name</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="E.g. Protein Shake"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Ingredients ({ingredients.length})
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={handleAddPress}
            >
              <Ionicons name="add" size={18} color={theme.colors.background} />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          {ingredients.length === 0 ? (
            <View style={styles.emptyIngredients}>
              <Text style={styles.emptyText}>
                Tap "Add" to add ingredients to your recipe
              </Text>
            </View>
          ) : (
            ingredients.map((item, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  <Text style={styles.ingredientMeta}>{item.calories} Cal</Text>
                </View>
                <Pressable
                  onPress={() => handleRemoveIngredient(index)}
                  hitSlop={12}
                >
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color={theme.colors.danger}
                  />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Totals */}
        {ingredients.length > 0 && (
          <View style={styles.totalsCard}>
            <Text style={styles.totalsTitle}>Nutrition Totals</Text>
            <View style={styles.totalsGrid}>
              <TotalItem label="Calories" value={`${totals.calories}`} unit="Cal" />
              <TotalItem label="Carbs" value={`${totals.carbs}`} unit="g" />
              <TotalItem label="Fat" value={`${totals.fat}`} unit="g" />
              <TotalItem label="Protein" value={`${totals.protein}`} unit="g" />
              <TotalItem label="Sodium" value={`${totals.sodium}`} unit="mg" />
              <TotalItem label="Sugar" value={`${totals.sugar}`} unit="g" />
            </View>
          </View>
        )}
      </ScrollView>

      <QuickAddModal
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onAdd={handleAddIngredient}
      />

      {/* Favorites Picker Modal */}
      {favPickerVisible && (
        <View style={styles.favOverlay}>
          <SafeAreaView style={styles.favContainer} edges={['top']}>
            <View style={styles.favHeader}>
              <Pressable onPress={() => setFavPickerVisible(false)} hitSlop={8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Pick a Favorite</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentInner}
            >
              {favorites.map((fav) => (
                <Pressable
                  key={fav.id}
                  style={styles.ingredientRow}
                  onPress={() => handleAddFavoriteAsIngredient(fav)}
                >
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName}>{fav.name}</Text>
                    <Text style={styles.ingredientMeta}>
                      {fav.calories} Cal · {fav.protein}g P · {fav.carbs}g C · {fav.fat}g F
                    </Text>
                  </View>
                  <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color={theme.colors.accent}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Small helper component ───────────────────────────────────────────────────
function TotalItem({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View style={styles.totalItem}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>
        {value} <Text style={styles.totalUnit}>{unit}</Text>
      </Text>
    </View>
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
  cancelText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  saveText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accent,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
  },
  nameCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  nameInput: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  addButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background,
  },
  emptyIngredients: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  ingredientMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  totalsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  totalsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  totalItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  totalUnit: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textSecondary,
  },
  favOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.background,
    zIndex: 10,
  },
  favContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  favHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
});
