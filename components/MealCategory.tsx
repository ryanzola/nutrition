/**
 * MealCategory — a meal section card on the dashboard.
 *
 * Renders an icon + label header with an "add" button, followed by a list
 * of FoodEntryRow items for each logged food.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/constants/theme';
import { MEAL_ICONS, MEAL_LABELS } from '@/constants/defaults';
import type { FoodEntry, MealType } from '@/types';

import FoodEntryRow from './FoodEntryRow';

// ── Props ──────────────────────────────────────────────────────────────────

interface MealCategoryProps {
  /** Which meal this card represents. */
  mealType: MealType;
  /** Food entries logged under this meal. */
  entries: FoodEntry[];
  /** Called when the user taps "+". */
  onAddPress: () => void;
  /** Called when a food row is tapped. */
  onEntryPress: (entry: FoodEntry) => void;
  /** Called when a food row is long-pressed. */
  onEntryLongPress: (entry: FoodEntry) => void;
}

// ── Icon colour per meal type ──────────────────────────────────────────────

const ICON_COLORS: Record<MealType, string> = {
  breakfast: '#FBBF24', // amber / sunny
  lunch: '#4ADE80',     // green
  dinner: '#818CF8',    // indigo
  snacks: '#FB923C',    // orange
};

// ── Component ──────────────────────────────────────────────────────────────

export default function MealCategory({
  mealType,
  entries,
  onAddPress,
  onEntryPress,
  onEntryLongPress,
}: MealCategoryProps) {
  const iconName = MEAL_ICONS[mealType] as keyof typeof Ionicons.glyphMap;
  const iconColor = ICON_COLORS[mealType];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}22` }]}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>

        <Text style={styles.label}>{MEAL_LABELS[mealType]}</Text>

        <Pressable onPress={onAddPress} hitSlop={8} style={styles.addButton}>
          <Ionicons name="add" size={22} color={theme.colors.accent} />
        </Pressable>
      </View>

      {/* Entries */}
      {entries.map((entry) => (
        <FoodEntryRow
          key={entry.id}
          entry={entry}
          onPress={() => onEntryPress(entry)}
          onLongPress={() => onEntryLongPress(entry)}
        />
      ))}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  label: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${theme.colors.accent}18`,
  },
});
