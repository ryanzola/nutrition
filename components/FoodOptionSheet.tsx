/**
 * FoodOptionSheet — bottom sheet for choosing a food-logging method.
 *
 * Offers two options:
 *  1. "Snap a meal or barcode" — disabled, with a "Coming soon" badge.
 *  2. "Search food" — calls `onSearchPress`.
 *
 * Uses React Native's built-in Modal (no @gorhom/bottom-sheet).
 */

import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@/constants/theme';

// ── Props ──────────────────────────────────────────────────────────────────

interface FoodOptionSheetProps {
  /** Whether the sheet is visible. */
  visible: boolean;
  /** Called when the backdrop is tapped or the sheet is dismissed. */
  onClose: () => void;
  /** Called when "Search food" is tapped. */
  onSearchPress: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function FoodOptionSheet({
  visible,
  onClose,
  onSearchPress,
}: FoodOptionSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <Text style={styles.title}>Pick a food logging option</Text>

        {/* Option 1 — Camera (disabled) */}
        <View style={[styles.optionCard, styles.optionDisabled]}>
          <View style={styles.optionIconCircle}>
            <Ionicons name="camera-outline" size={24} color={theme.colors.textPrimary} />
          </View>
          <View style={styles.optionContent}>
            <View style={styles.optionTitleRow}>
              <Text style={styles.optionTitle}>Snap a meal or barcode</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Coming soon</Text>
              </View>
            </View>
            <Text style={styles.optionSubtitle}>
              Log food in seconds with AI camera.
            </Text>
          </View>
        </View>

        {/* Option 2 — Search */}
        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            pressed && styles.optionPressed,
          ]}
          onPress={() => {
            onClose();
            onSearchPress();
          }}
        >
          <View style={styles.optionIconCircle}>
            <Ionicons name="search-outline" size={24} color={theme.colors.textPrimary} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Search food</Text>
            <Text style={styles.optionSubtitle}>
              Add food from our database.
            </Text>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: theme.colors.surfaceElevated,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    paddingBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.textTertiary,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },

  // ── Option cards ───────────────────────────────────────────────────────
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  optionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  optionSubtitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  // ── Badge ──────────────────────────────────────────────────────────────
  badge: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.background,
  },
});
