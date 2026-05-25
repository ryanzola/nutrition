/**
 * app/info.tsx
 *
 * Info / Settings hub screen.
 * Provides educational content about calories and macros,
 * plus navigation rows to individual settings screens.
 */

import React from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';

// ── Setting row data ──────────────────────────────────────────────────────

const SETTINGS_ROWS = [
  { label: 'Calorie Settings', route: '/calorie-settings' as const },
  { label: 'Macros Settings', route: '/macros-settings' as const },
  { label: 'Micros Settings', route: '/micros-settings' as const },
];

// ── Component ─────────────────────────────────────────────────────────────

export default function InfoScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Info</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Educational: Calories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to determine daily calories?</Text>
          <Text style={styles.sectionBody}>
            Your daily calorie goal depends on factors like age, sex, weight, height, and activity
            level. A common starting point is to calculate your Basal Metabolic Rate (BMR) using the
            Mifflin-St Jeor equation, then multiply by an activity factor. Consult a healthcare
            professional for a personalised recommendation.
          </Text>
        </View>

        {/* Educational: Macros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are macros?</Text>
          <Text style={styles.sectionBody}>
            Macronutrients — carbohydrates, fats, and proteins — are the three categories of
            nutrients your body needs in large amounts. Carbs provide quick energy, fats support
            hormone production and nutrient absorption, and protein builds and repairs muscle tissue.
            Balancing your macros helps you optimise performance, recovery, and overall health.
          </Text>
        </View>

        {/* Settings rows */}
        <View style={styles.settingsContainer}>
          {SETTINGS_ROWS.map((row, index) => (
            <Pressable
              key={row.route}
              style={[
                styles.settingsRow,
                index < SETTINGS_ROWS.length - 1 && styles.settingsRowBorder,
              ]}
              onPress={() => router.push(row.route)}
            >
              <Text style={styles.settingsLabel}>{row.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.huge,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  sectionBody: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  settingsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  settingsRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  settingsLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
});
