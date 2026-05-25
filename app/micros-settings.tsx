/**
 * app/micros-settings.tsx
 *
 * Settings screen for micronutrients: sodium and sugar goals.
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

export default function MicrosSettingsScreen() {
  const { settings, updateSettings, resetSettings } = useApp();

  const [sodiumText, setSodiumText] = useState(String(settings.sodiumGoal));
  const [sugarText, setSugarText] = useState(String(settings.sugarGoal));

  const handleSave = async () => {
    const sodium = parseInt(sodiumText, 10);
    const sugar = parseInt(sugarText, 10);

    if (isNaN(sodium) || sodium <= 0 || isNaN(sugar) || sugar <= 0) {
      Alert.alert('Invalid values', 'Please enter positive numbers for both fields.');
      return;
    }

    await updateSettings({ sodiumGoal: sodium, sugarGoal: sugar });
    router.back();
  };

  const handleRestore = async () => {
    await resetSettings();
    setSodiumText(String(DEFAULT_SETTINGS.sodiumGoal));
    setSugarText(String(DEFAULT_SETTINGS.sugarGoal));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Micros Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Card */}
        <View style={styles.card}>
          {/* Sodium row */}
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowLabelContainer}>
              <View style={[styles.colorDot, { backgroundColor: theme.colors.sodium }]} />
              <Text style={styles.rowLabel}>Sodium</Text>
            </View>
            <View style={styles.rowInputContainer}>
              <TextInput
                style={[styles.rowInput, { color: theme.colors.sodium }]}
                value={sodiumText}
                onChangeText={setSodiumText}
                keyboardType="number-pad"
                returnKeyType="done"
                selectTextOnFocus
              />
              <Text style={styles.rowUnit}>mg</Text>
            </View>
          </View>

          {/* Sugar row */}
          <View style={styles.row}>
            <View style={styles.rowLabelContainer}>
              <View style={[styles.colorDot, { backgroundColor: theme.colors.sugar }]} />
              <Text style={styles.rowLabel}>Sugar</Text>
            </View>
            <View style={styles.rowInputContainer}>
              <TextInput
                style={[styles.rowInput, { color: theme.colors.sugar }]}
                value={sugarText}
                onChangeText={setSugarText}
                keyboardType="number-pad"
                returnKeyType="done"
                selectTextOnFocus
              />
              <Text style={styles.rowUnit}>g</Text>
            </View>
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
  rowInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  rowInput: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'right',
    minWidth: 60,
    padding: 0,
  },
  rowUnit: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textTertiary,
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
