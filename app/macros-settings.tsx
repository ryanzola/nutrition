/**
 * app/macros-settings.tsx
 *
 * Allows the user to edit their macro split (carbs, fat, protein)
 * as both percentages and gram values. Changing one side
 * recalculates the other.
 */

import React, { useState, useEffect } from 'react';
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

// Calories per gram for each macro
const CALS_PER_GRAM = { carbs: 4, fat: 9, protein: 4 } as const;

interface MacroRow {
  key: 'carbs' | 'fat' | 'protein';
  label: string;
  color: string;
}

const MACRO_ROWS: MacroRow[] = [
  { key: 'carbs', label: 'Carbs', color: theme.colors.carbs },
  { key: 'fat', label: 'Fat', color: theme.colors.fat },
  { key: 'protein', label: 'Protein', color: theme.colors.protein },
];

export default function MacrosSettingsScreen() {
  const { settings, updateSettings, resetSettings } = useApp();

  const [carbsPercent, setCarbsPercent] = useState(String(settings.carbsPercent));
  const [fatPercent, setFatPercent] = useState(String(settings.fatPercent));
  const [proteinPercent, setProteinPercent] = useState(String(settings.proteinPercent));

  const [carbsGrams, setCarbsGrams] = useState(String(settings.carbsGoal));
  const [fatGrams, setFatGrams] = useState(String(settings.fatGoal));
  const [proteinGrams, setProteinGrams] = useState(String(settings.proteinGoal));

  // Helper to recalculate grams from percent
  const gramsFromPercent = (percent: number, macro: 'carbs' | 'fat' | 'protein') =>
    Math.round((settings.calorieGoal * percent) / 100 / CALS_PER_GRAM[macro]);

  // Helper to recalculate percent from grams
  const percentFromGrams = (grams: number, macro: 'carbs' | 'fat' | 'protein') =>
    Math.round((grams * CALS_PER_GRAM[macro] * 100) / settings.calorieGoal);

  const handlePercentChange = (value: string, macro: 'carbs' | 'fat' | 'protein') => {
    const setPercent = macro === 'carbs' ? setCarbsPercent : macro === 'fat' ? setFatPercent : setProteinPercent;
    const setGrams = macro === 'carbs' ? setCarbsGrams : macro === 'fat' ? setFatGrams : setProteinGrams;
    setPercent(value);

    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setGrams(String(gramsFromPercent(parsed, macro)));
    }
  };

  const handleGramsChange = (value: string, macro: 'carbs' | 'fat' | 'protein') => {
    const setGrams = macro === 'carbs' ? setCarbsGrams : macro === 'fat' ? setFatGrams : setProteinGrams;
    const setPercent = macro === 'carbs' ? setCarbsPercent : macro === 'fat' ? setFatPercent : setProteinPercent;
    setGrams(value);

    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setPercent(String(percentFromGrams(parsed, macro)));
    }
  };

  const totalPercent =
    (parseInt(carbsPercent, 10) || 0) +
    (parseInt(fatPercent, 10) || 0) +
    (parseInt(proteinPercent, 10) || 0);

  const getPercentState = (macro: 'carbs' | 'fat' | 'protein') => {
    if (macro === 'carbs') return { percent: carbsPercent, grams: carbsGrams };
    if (macro === 'fat') return { percent: fatPercent, grams: fatGrams };
    return { percent: proteinPercent, grams: proteinGrams };
  };

  const handleSave = async () => {
    if (totalPercent !== 100) {
      Alert.alert('Invalid split', `Percentages must sum to 100%. Currently: ${totalPercent}%`);
      return;
    }

    const cp = parseInt(carbsPercent, 10);
    const fp = parseInt(fatPercent, 10);
    const pp = parseInt(proteinPercent, 10);

    await updateSettings({
      carbsPercent: cp,
      fatPercent: fp,
      proteinPercent: pp,
      carbsGoal: gramsFromPercent(cp, 'carbs'),
      fatGoal: gramsFromPercent(fp, 'fat'),
      proteinGoal: gramsFromPercent(pp, 'protein'),
    });

    router.back();
  };

  const handleRestore = async () => {
    await resetSettings();
    setCarbsPercent(String(DEFAULT_SETTINGS.carbsPercent));
    setFatPercent(String(DEFAULT_SETTINGS.fatPercent));
    setProteinPercent(String(DEFAULT_SETTINGS.proteinPercent));
    setCarbsGrams(String(DEFAULT_SETTINGS.carbsGoal));
    setFatGrams(String(DEFAULT_SETTINGS.fatGoal));
    setProteinGrams(String(DEFAULT_SETTINGS.proteinGoal));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Macros Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Warning if percentages don't sum to 100 */}
        {totalPercent !== 100 && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={16} color={theme.colors.danger} />
            <Text style={styles.warningText}>
              Percentages must add up to 100% (currently {totalPercent}%)
            </Text>
          </View>
        )}

        {/* Card */}
        <View style={styles.card}>
          {MACRO_ROWS.map((row, index) => {
            const state = getPercentState(row.key);
            return (
              <View
                key={row.key}
                style={[
                  styles.row,
                  index < MACRO_ROWS.length - 1 && styles.rowBorder,
                ]}
              >
                <View style={styles.rowLabelContainer}>
                  <View style={[styles.colorDot, { backgroundColor: row.color }]} />
                  <Text style={styles.rowLabel}>{row.label}</Text>
                </View>
                <View style={styles.rowInputs}>
                  <TextInput
                    style={[styles.rowInput, { color: row.color }]}
                    value={state.percent}
                    onChangeText={(v) => handlePercentChange(v, row.key)}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    selectTextOnFocus
                  />
                  <Text style={styles.rowUnit}>%</Text>
                  <Text style={styles.rowDivider}>/</Text>
                  <TextInput
                    style={[styles.rowInput, { color: row.color }]}
                    value={state.grams}
                    onChangeText={(v) => handleGramsChange(v, row.key)}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    selectTextOnFocus
                  />
                  <Text style={styles.rowUnit}>g</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.saveButton, totalPercent !== 100 && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={totalPercent !== 100}
          >
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  warningText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.danger,
    flex: 1,
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
  rowLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  rowInput: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'right',
    minWidth: 36,
    padding: 0,
  },
  rowUnit: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textTertiary,
  },
  rowDivider: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textTertiary,
    marginHorizontal: theme.spacing.xs,
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
  saveButtonDisabled: {
    opacity: 0.4,
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
