/**
 * app/calorie-settings.tsx
 *
 * Allows the user to edit their daily calorie goal.
 * When the calorie goal changes, macro gram values are
 * automatically recalculated based on the current percentages.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { DEFAULT_SETTINGS } from '@/constants/defaults';
import { useApp } from '@/context/AppContext';

export default function CalorieSettingsScreen() {
  const { settings, updateSettings, resetSettings } = useApp();
  const [goalText, setGoalText] = useState(String(settings.calorieGoal));

  const handleSave = async () => {
    const newGoal = parseInt(goalText, 10);
    if (isNaN(newGoal) || newGoal <= 0) {
      Alert.alert('Invalid value', 'Please enter a positive number for your calorie goal.');
      return;
    }

    // Recalculate macro grams based on current percentages
    const carbsGoal = Math.round((newGoal * settings.carbsPercent) / 100 / 4);
    const fatGoal = Math.round((newGoal * settings.fatPercent) / 100 / 9);
    const proteinGoal = Math.round((newGoal * settings.proteinPercent) / 100 / 4);

    await updateSettings({
      calorieGoal: newGoal,
      carbsGoal,
      fatGoal,
      proteinGoal,
    });

    router.back();
  };

  const handleRestore = async () => {
    await resetSettings();
    setGoalText(String(DEFAULT_SETTINGS.calorieGoal));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Calorie Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Section label */}
        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>DAILY CALORIES</Text>
          <Ionicons name="information-circle-outline" size={18} color={theme.colors.textTertiary} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Goal row */}
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Goal</Text>
            <TextInput
              style={styles.rowInput}
              value={goalText}
              onChangeText={setGoalText}
              keyboardType="number-pad"
              returnKeyType="done"
              selectTextOnFocus
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          {/* Unit row */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Unit</Text>
            <Text style={styles.rowValue}>Cal</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>SAVE</Text>
          </Pressable>

          <Pressable style={styles.restoreButton} onPress={handleRestore}>
            <Text style={styles.restoreButtonText}>RESTORE DEFAULTS</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

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
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textTertiary,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  rowInput: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.accent,
    textAlign: 'right',
    minWidth: 80,
    padding: 0,
  },
  rowValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  actions: {
    gap: theme.spacing.md,
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.background,
    letterSpacing: 1,
  },
  restoreButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
});
