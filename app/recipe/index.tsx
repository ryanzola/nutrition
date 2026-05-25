/**
 * Recipe list screen.
 *
 * Route: /recipe
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '@/context/AppContext';
import { useRecipes } from '@/hooks/useRecipes';
import { theme } from '@/constants/theme';

export default function RecipeListScreen() {
  const { uid } = useApp();
  const { recipes, deleteRecipe } = useRecipes(uid);

  const handleLongPress = (recipeId: string, recipeName: string) => {
    Alert.alert('Delete Recipe', `Are you sure you want to delete "${recipeName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteRecipe(recipeId),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Recipes</Text>
        <Pressable onPress={() => router.push('/recipe/create')} hitSlop={12}>
          <Ionicons name="add" size={24} color={theme.colors.accent} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {recipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="book-outline"
              size={56}
              color={theme.colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>No recipes yet</Text>
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
              style={styles.recipeCard}
              onLongPress={() => handleLongPress(recipe.id, recipe.name)}
            >
              <View style={styles.recipeIcon}>
                <Ionicons
                  name="restaurant"
                  size={20}
                  color={theme.colors.accent}
                />
              </View>
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.recipeMeta}>
                  {recipe.totals.calories} Cal · {recipe.entries.length} ingredient
                  {recipe.entries.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.textTertiary}
              />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    maxWidth: 260,
  },
  createButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xxxl,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xxl,
  },
  createButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.background,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  recipeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  recipeMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
