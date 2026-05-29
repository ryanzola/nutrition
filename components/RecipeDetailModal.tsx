/**
 * RecipeDetailModal — full-screen modal showing recipe contents.
 *
 * Displays the recipe name, macro summary grid, ingredient list,
 * and actions (Add to Meal, Delete Recipe).
 */

import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/constants/theme';
import type { Recipe } from '@/types';

// ── Props ──────────────────────────────────────────────────────────────────

interface RecipeDetailModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** The recipe to display. */
  recipe: Recipe | null;
  /** Called when the modal is closed. */
  onClose: () => void;
  /** Called when "Add to Meal" is tapped. Only shown if provided. */
  onAddToMeal?: (recipe: Recipe) => void;
  /** Called when "Delete Recipe" is confirmed. */
  onDelete: (recipeId: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function RecipeDetailModal({
  visible,
  recipe,
  onClose,
  onAddToMeal,
  onDelete,
}: RecipeDetailModalProps) {
  if (!recipe) return null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(recipe.id);
            onClose();
          },
        },
      ],
    );
  };

  const handleAddToMeal = () => {
    if (onAddToMeal) {
      onAddToMeal(recipe);
      onClose();
    }
  };

  const { totals } = recipe;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={styles.flex} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Recipe name */}
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.ingredientCount}>
            {recipe.entries.length} ingredient{recipe.entries.length !== 1 ? 's' : ''}
          </Text>

          {/* Macro summary grid — 2 rows × 3 columns */}
          <View style={styles.macroGrid}>
            <View style={styles.macroCell}>
              <Text style={styles.macroLabel}>Calories</Text>
              <Text style={styles.macroValue}>{Math.round(totals.calories)}</Text>
            </View>
            <View style={styles.macroCell}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{parseFloat(totals.carbs.toFixed(1))}g</Text>
            </View>
            <View style={styles.macroCell}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{parseFloat(totals.fat.toFixed(1))}g</Text>
            </View>
            <View style={styles.macroCell}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{parseFloat(totals.protein.toFixed(1))}g</Text>
            </View>
            <View style={styles.macroCell}>
              <Text style={styles.macroLabel}>Sodium</Text>
              <Text style={styles.macroValue}>{Math.round(totals.sodium)}mg</Text>
            </View>
            <View style={styles.macroCell}>
              <Text style={styles.macroLabel}>Sugar</Text>
              <Text style={styles.macroValue}>{parseFloat(totals.sugar.toFixed(1))}g</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Ingredients list */}
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.ingredientCard}>
            {recipe.entries.map((entry, idx) => (
              <View key={entry.id || idx}>
                <View style={styles.ingredientRow}>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientName} numberOfLines={1}>
                      {entry.name}
                    </Text>
                    {entry.servingAmount != null && entry.servingUnit && (
                      <Text style={styles.ingredientServing}>
                        {entry.servingAmount} {entry.servingUnit}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.ingredientCal}>
                    {Math.round(entry.calories * (entry.servings ?? 1))} Cal
                  </Text>
                </View>
                {idx < recipe.entries.length - 1 && (
                  <View style={styles.ingredientSeparator} />
                )}
              </View>
            ))}
          </View>

          {/* Actions */}
          {onAddToMeal && (
            <Pressable
              onPress={handleAddToMeal}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
            >
              <Text style={styles.addButtonText}>Add to Meal</Text>
            </Pressable>
          )}

          <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete Recipe</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
  },

  recipeName: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  ingredientCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },

  // Macro grid
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  macroCell: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  macroLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },

  // Ingredients
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  ingredientCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  ingredientInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  ingredientName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  ingredientServing: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  ingredientCal: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  ingredientSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.lg,
  },

  // Actions
  addButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  deleteButton: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  deleteButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: '#FF4B6E',
  },
});
