/**
 * QuickAddModal — full-screen modal for quick-adding (or editing) a food entry.
 *
 * Presents a form with name + numeric macro fields, validates that name is
 * non-empty, and returns a partial FoodEntry (without id/createdAt) via
 * the `onAdd` callback.
 */

import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  View,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/constants/theme';
import type { FoodEntry } from '@/types';

// ── Props ──────────────────────────────────────────────────────────────────

interface QuickAddModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** Called when "Cancel" is tapped. */
  onClose: () => void;
  /** Called when "Add" is tapped with the filled-in entry data. */
  onAdd: (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => void;
  /** Pre-fill values for edit mode. */
  initialValues?: Partial<FoodEntry>;
  /** Whether the current food is favorited. */
  isFavorited?: boolean;
  /** Called when the heart icon is tapped. */
  onToggleFavorite?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parse a string to a non-negative number, defaulting to 0. */
function toNum(value: string): number {
  const n = parseFloat(value);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

// ── Field config ───────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  suffix: string;
  numeric: boolean;
}

const FIELDS: FieldDef[] = [
  { key: 'name',           label: 'Name',           placeholder: 'E.g. Apple', suffix: '',    numeric: false },
  { key: 'servingAmount',  label: 'Serving Size',   placeholder: '0',          suffix: '',    numeric: true },
  { key: 'servings',       label: 'Servings',       placeholder: '1',          suffix: '×',   numeric: true },
  { key: 'calories',       label: 'Calories',       placeholder: 'E.g. 500',   suffix: 'Cal', numeric: true },
  { key: 'carbs',          label: 'Carbs',          placeholder: '0',          suffix: 'g',   numeric: true },
  { key: 'fat',            label: 'Fat',            placeholder: '0',          suffix: 'g',   numeric: true },
  { key: 'protein',        label: 'Protein',        placeholder: '0',          suffix: 'g',   numeric: true },
  { key: 'sodium',         label: 'Sodium',         placeholder: '0',          suffix: 'mg',  numeric: true },
  { key: 'sugar',          label: 'Sugar',          placeholder: '0',          suffix: 'g',   numeric: true },
];

const SERVING_UNITS = [
  'g', 'mg', 'oz', 'fl oz', 'ml', 'L',
  'cup', 'tbsp', 'tsp', 'can',
  'piece', 'slice', 'scoop', 'bar',
];

// ── Component ──────────────────────────────────────────────────────────────

export default function QuickAddModal({
  visible,
  onClose,
  onAdd,
  initialValues,
  isFavorited = false,
  onToggleFavorite,
}: QuickAddModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});

  // Reset / pre-fill form when visibility or initialValues change
  useEffect(() => {
    if (visible) {
      setForm({
        name:          initialValues?.name ?? '',
        servingAmount: initialValues?.servingAmount != null ? String(initialValues.servingAmount) : '',
        servingUnit:   initialValues?.servingUnit ?? '',
        servings:      String(initialValues?.servings ?? 1),
        calories:      initialValues?.calories != null ? String(initialValues.calories) : '',
        carbs:         initialValues?.carbs != null ? String(initialValues.carbs) : '',
        fat:           initialValues?.fat != null ? String(initialValues.fat) : '',
        protein:       initialValues?.protein != null ? String(initialValues.protein) : '',
        sodium:        initialValues?.sodium != null ? String(initialValues.sodium) : '',
        sugar:         initialValues?.sugar != null ? String(initialValues.sugar) : '',
      });
    }
  }, [visible, initialValues]);

  const canSubmit = (form.name ?? '').trim().length > 0;

  // When pre-filled from search/favorites/recents, lock everything except servings
  const isPreFilled = !!initialValues?.name;
  const LOCKED_KEYS = new Set(['name', 'servingAmount', 'calories', 'carbs', 'fat', 'protein', 'sodium', 'sugar']);
  const isLocked = (key: string) => isPreFilled && LOCKED_KEYS.has(key);

  // Current servings multiplier for real-time display
  const currentServings = Math.max(toNum(form.servings) || 1, 0.01);

  const handleAdd = () => {
    if (!canSubmit) return;
    const servings = Math.max(toNum(form.servings) || 1, 0.01);
    const servingAmt = toNum(form.servingAmount);
    const servingUnit = form.servingUnit?.trim() || undefined;
    onAdd({
      name:          form.name.trim(),
      servingAmount: servingAmt > 0 ? servingAmt : undefined,
      servingUnit:   servingAmt > 0 ? servingUnit : undefined,
      servings,
      calories:      toNum(form.calories),
      carbs:         toNum(form.carbs),
      fat:           toNum(form.fat),
      protein:       toNum(form.protein),
      sodium:        toNum(form.sodium),
      sugar:         toNum(form.sugar),
    });
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const showUnitPicker = () => {
    const options = [...SERVING_UNITS, 'Cancel'];
    const cancelIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, title: 'Select Unit' },
        (idx) => {
          if (idx !== cancelIndex) {
            updateField('servingUnit', SERVING_UNITS[idx]);
          }
        },
      );
    } else {
      Alert.alert('Select Unit', undefined,
        SERVING_UNITS.map((u) => ({
          text: u,
          onPress: () => updateField('servingUnit', u),
        })).concat({ text: 'Cancel', onPress: () => {}, style: 'cancel' } as any),
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Text style={styles.headerTitle}>Quick-add Food</Text>

            <View style={styles.headerRight}>
              {onToggleFavorite && (
                <Pressable onPress={onToggleFavorite} hitSlop={8} style={styles.heartButton}>
                  <Ionicons
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isFavorited ? '#FF4B6E' : theme.colors.textSecondary}
                  />
                </Pressable>
              )}
              <Pressable onPress={handleAdd} hitSlop={8} disabled={!canSubmit}>
                <Text
                  style={[
                    styles.addText,
                    !canSubmit && styles.addTextDisabled,
                  ]}
                >
                  Add
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              {FIELDS.map((field, index) => (
                <View key={field.key}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>

                    {field.key === 'servingAmount' ? (
                      /* Serving Size: numeric input + tappable unit picker */
                      <View style={styles.inputWrapper}>
                        {isPreFilled ? (
                          <Text style={[styles.input, styles.lockedText]}>
                            {form.servingAmount || '—'}
                          </Text>
                        ) : (
                          <TextInput
                            style={styles.input}
                            value={form.servingAmount ?? ''}
                            onChangeText={(v) => updateField('servingAmount', v)}
                            placeholder="0"
                            placeholderTextColor={theme.colors.textTertiary}
                            keyboardType="numeric"
                            returnKeyType="next"
                          />
                        )}
                        {isPreFilled ? (
                          <Text style={styles.suffix}>
                            {form.servingUnit || ''}
                          </Text>
                        ) : (
                          <Pressable onPress={showUnitPicker} hitSlop={8}>
                            <Text style={[
                              styles.suffix,
                              { color: form.servingUnit ? theme.colors.textSecondary : theme.colors.accent },
                            ]}>
                              {form.servingUnit || 'unit ▾'}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    ) : isLocked(field.key) ? (
                      /* Locked field — display scaled value */
                      <View style={styles.inputWrapper}>
                        <Text style={[styles.input, styles.lockedText]}>
                          {field.key === 'name'
                            ? form[field.key]
                            : field.numeric
                              ? Math.round(toNum(form[field.key]) * currentServings * 10) / 10
                              : form[field.key]}
                        </Text>
                        {field.suffix !== '' && (
                          <Text style={styles.suffix}>{field.suffix}</Text>
                        )}
                      </View>
                    ) : (
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          value={form[field.key] ?? ''}
                          onChangeText={(v) => updateField(field.key, v)}
                          placeholder={field.placeholder}
                          placeholderTextColor={theme.colors.textTertiary}
                          keyboardType={field.numeric ? 'numeric' : 'default'}
                          returnKeyType={
                            index < FIELDS.length - 1 ? 'next' : 'done'
                          }
                        />
                        {field.suffix !== '' && (
                          <Text style={styles.suffix}>{field.suffix}</Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Computed total after Servings row */}
                  {field.key === 'servings' &&
                    toNum(form.servingAmount) > 0 &&
                    (form.servingUnit ?? '').trim().length > 0 && (
                      <View style={styles.computedRow}>
                        <Text style={styles.computedText}>
                          = {Math.round(
                              toNum(form.servingAmount) *
                              Math.max(toNum(form.servings) || 1, 0.01) *
                              100,
                            ) / 100}{' '}
                          {form.servingUnit?.trim()}
                        </Text>
                      </View>
                    )}

                  {index < FIELDS.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  cancelText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.accent,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  addText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accent,
  },
  addTextDisabled: {
    opacity: 0.35,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  heartButton: {
    padding: 2,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  fieldLabel: {
    width: 80,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textPrimary,
    textAlign: 'right',
    paddingVertical: 0,
  },
  suffix: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.lg,
  },
  computedRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  computedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    textAlign: 'right',
  },
  lockedText: {
    color: theme.colors.textSecondary,
  },
});
