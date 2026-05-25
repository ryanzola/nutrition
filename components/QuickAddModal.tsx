/**
 * QuickAddModal — full-screen modal for quick-adding (or editing) a food entry.
 *
 * Presents a form with name + numeric macro fields, validates that name is
 * non-empty, and returns a partial FoodEntry (without id/createdAt) via
 * the `onAdd` callback.
 */

import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
  { key: 'name',     label: 'Name',     placeholder: 'E.g. Apple', suffix: '',   numeric: false },
  { key: 'calories', label: 'Calories', placeholder: 'E.g. 500',   suffix: 'Cal', numeric: true },
  { key: 'carbs',    label: 'Carbs',    placeholder: '0',           suffix: 'g',  numeric: true },
  { key: 'fat',      label: 'Fat',      placeholder: '0',           suffix: 'g',  numeric: true },
  { key: 'protein',  label: 'Protein',  placeholder: '0',           suffix: 'g',  numeric: true },
  { key: 'sodium',   label: 'Sodium',   placeholder: '0',           suffix: 'mg', numeric: true },
  { key: 'sugar',    label: 'Sugar',    placeholder: '0',           suffix: 'g',  numeric: true },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function QuickAddModal({
  visible,
  onClose,
  onAdd,
  initialValues,
}: QuickAddModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});

  // Reset / pre-fill form when visibility or initialValues change
  useEffect(() => {
    if (visible) {
      setForm({
        name:     initialValues?.name ?? '',
        calories: initialValues?.calories != null ? String(initialValues.calories) : '',
        carbs:    initialValues?.carbs != null ? String(initialValues.carbs) : '',
        fat:      initialValues?.fat != null ? String(initialValues.fat) : '',
        protein:  initialValues?.protein != null ? String(initialValues.protein) : '',
        sodium:   initialValues?.sodium != null ? String(initialValues.sodium) : '',
        sugar:    initialValues?.sugar != null ? String(initialValues.sugar) : '',
      });
    }
  }, [visible, initialValues]);

  const canSubmit = (form.name ?? '').trim().length > 0;

  const handleAdd = () => {
    if (!canSubmit) return;
    onAdd({
      name:     form.name.trim(),
      calories: toNum(form.calories),
      carbs:    toNum(form.carbs),
      fat:      toNum(form.fat),
      protein:  toNum(form.protein),
      sodium:   toNum(form.sodium),
      sugar:    toNum(form.sugar),
    });
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
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
                  </View>

                  {index < FIELDS.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
    paddingTop: theme.spacing.huge,
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
});
