/**
 * FoodEntryRow — a single food item row inside a MealCategory card.
 *
 * Shows the food name on the left, calories + chevron on the right, and
 * supports both press and long-press interactions.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/constants/theme';
import type { FoodEntry } from '@/types';

// ── Props ──────────────────────────────────────────────────────────────────

interface FoodEntryRowProps {
  /** The food entry to display. */
  entry: FoodEntry;
  /** Called on a normal tap. */
  onPress: () => void;
  /** Called on a long press (e.g. delete). */
  onLongPress: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function FoodEntryRow({
  entry,
  onPress,
  onLongPress,
}: FoodEntryRowProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
    >
      <Text style={styles.name} numberOfLines={1}>
        {entry.name}
      </Text>

      <View style={styles.right}>
        <Text style={styles.calories}>{entry.calories} Cal</Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.colors.textTertiary}
        />
      </View>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  name: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.sm,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  calories: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textSecondary,
  },
});
