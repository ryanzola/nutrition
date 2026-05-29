/**
 * Dashboard — main screen.
 *
 * Shows the calorie ring, macro bars, sodium/sugar bars,
 * and daily meal categories with logged food entries.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActionSheetIOS,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useApp, getDateString } from '@/context/AppContext';
import { useDay } from '@/hooks/useDay';
import { useFavorites } from '@/hooks/useFavorites';
import { theme } from '@/constants/theme';
import { MEAL_TYPES, MEAL_LABELS } from '@/constants/defaults';
import type { MealType, FoodEntry } from '@/types';

import CalorieRing from '@/components/CalorieRing';
import MacroBar from '@/components/MacroBar';
import MealCategory from '@/components/MealCategory';
import CalendarBottomSheet from '@/components/CalendarBottomSheet';
import FoodOptionSheet from '@/components/FoodOptionSheet';
import QuickAddModal from '@/components/QuickAddModal';

export default function DashboardScreen() {
  const { uid, selectedDate, setSelectedDate, settings } = useApp();
  const { dayData, addEntry, updateEntry, deleteEntry, moveEntry } = useDay(
    uid,
    selectedDate,
  );
  const { isFavorited, toggleFavorite } = useFavorites(uid);

  // ── Modal / sheet state ────────────────────────────────────────────────
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [foodOptionVisible, setFoodOptionVisible] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast');
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null);
  const [editMealType, setEditMealType] = useState<MealType>('breakfast');

  // ── Derived values ─────────────────────────────────────────────────────
  const totals = dayData?.totals ?? {
    calories: 0,
    carbs: 0,
    fat: 0,
    protein: 0,
    sodium: 0,
    sugar: 0,
  };

  const isToday = selectedDate === getDateString();

  const formattedDate = React.useMemo(() => {
    if (isToday) return 'Today';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate, isToday]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleAddPress = useCallback((mealType: MealType) => {
    setActiveMealType(mealType);
    setFoodOptionVisible(true);
  }, []);

  const handleSearchPress = useCallback(() => {
    setFoodOptionVisible(false);
    router.push(`/meal/${activeMealType}`);
  }, [activeMealType]);

  const handleEntryPress = useCallback(
    (entry: FoodEntry, mealType: MealType) => {
      setEditEntry(entry);
      setEditMealType(mealType);
      setQuickAddVisible(true);
    },
    [],
  );

  const handleEntryLongPress = useCallback(
    (entry: FoodEntry, mealType: MealType) => {
      const otherMeals = MEAL_TYPES.filter((m) => m !== mealType);
      const moveLabels = otherMeals.map(
        (m) => `Move to ${m.charAt(0).toUpperCase() + m.slice(1)}`,
      );

      const isFav = isFavorited(entry.name);
      const favLabel = isFav ? 'Remove from Favorites' : 'Add to Favorites';
      const options = ['Edit', 'Delete', favLabel, ...moveLabels, 'Cancel'];
      const cancelIndex = options.length - 1;
      const destructiveIndex = 1;

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
          (idx) => {
            if (idx === 0) {
              // Edit
              setEditEntry(entry);
              setEditMealType(mealType);
              setQuickAddVisible(true);
            } else if (idx === 1) {
              // Delete
              deleteEntry(mealType, entry.id);
            } else if (idx === 2) {
              // Toggle favorite
              toggleFavorite({
                name: entry.name,
                servingAmount: entry.servingAmount,
                servingUnit: entry.servingUnit,
                calories: entry.calories,
                carbs: entry.carbs,
                fat: entry.fat,
                protein: entry.protein,
                sodium: entry.sodium,
                sugar: entry.sugar,
              });
            } else if (idx < cancelIndex) {
              // Move
              const targetMeal = otherMeals[idx - 3];
              moveEntry(mealType, targetMeal, entry.id);
            }
          },
        );
      } else {
        // Android fallback
        Alert.alert('Options', `What would you like to do with "${entry.name}"?`, [
          {
            text: 'Edit',
            onPress: () => {
              setEditEntry(entry);
              setEditMealType(mealType);
              setQuickAddVisible(true);
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteEntry(mealType, entry.id),
          },
          {
            text: favLabel,
            onPress: () => toggleFavorite({
              name: entry.name,
              servingAmount: entry.servingAmount,
              servingUnit: entry.servingUnit,
              calories: entry.calories,
              carbs: entry.carbs,
              fat: entry.fat,
              protein: entry.protein,
              sodium: entry.sodium,
              sugar: entry.sugar,
            }),
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    },
    [deleteEntry, moveEntry, isFavorited, toggleFavorite],
  );

  const handleQuickAdd = useCallback(
    async (entry: Omit<FoodEntry, 'id' | 'createdAt'>) => {
      if (editEntry) {
        // Editing existing entry
        await updateEntry(editMealType, editEntry.id, entry);
        setEditEntry(null);
      } else {
        // Adding new — shouldn't happen from dashboard directly,
        // but handle gracefully
        await addEntry(activeMealType, entry);
      }
      setQuickAddVisible(false);
    },
    [editEntry, editMealType, activeMealType, updateEntry, addEntry],
  );

  const handleQuickAddClose = useCallback(() => {
    setQuickAddVisible(false);
    setEditEntry(null);
  }, []);

  const handleCopyDay = useCallback(async () => {
    const round1 = (n: number) => parseFloat(n.toFixed(1));
    const dateLabel = isToday ? `Today (${selectedDate})` : formattedDate + ` (${selectedDate})`;

    let text = `${dateLabel}\n\n`;

    // Per-meal breakdown
    for (const mt of MEAL_TYPES) {
      const entries = dayData?.meals[mt]?.entries ?? [];
      if (entries.length === 0) continue;

      const mealCals = entries.reduce((s, e) => s + e.calories * (e.servings ?? 1), 0);
      text += `${MEAL_LABELS[mt]} (${Math.round(mealCals)} Cal)\n`;

      for (const e of entries) {
        const s = e.servings ?? 1;
        const servingsLabel = s !== 1 ? ` (x${s})` : '';
        text += `  ${e.name}${servingsLabel} -- ${Math.round(e.calories * s)} Cal | ${round1(e.carbs * s)}g C | ${round1(e.fat * s)}g F | ${round1(e.protein * s)}g P\n`;
      }
      text += '\n';
    }

    // Daily totals with targets
    text += `Daily Totals:\n`;
    text += `  Calories: ${Math.round(totals.calories)} / ${settings.calorieGoal}\n`;
    text += `  Carbs: ${round1(totals.carbs)}g / ${settings.carbsGoal}g\n`;
    text += `  Fat: ${round1(totals.fat)}g / ${settings.fatGoal}g\n`;
    text += `  Protein: ${round1(totals.protein)}g / ${settings.proteinGoal}g\n`;
    text += `  Sodium: ${Math.round(totals.sodium)}mg / ${settings.sodiumGoal}mg\n`;
    text += `  Sugar: ${round1(totals.sugar)}g / ${settings.sugarGoal}g\n`;

    // Macro calorie composition
    const proteinCal = totals.protein * 4;
    const carbsCal = totals.carbs * 4;
    const fatCal = totals.fat * 9;
    const totalMacroCal = proteinCal + carbsCal + fatCal;
    const pct = (v: number) => totalMacroCal > 0 ? Math.round((v / totalMacroCal) * 100) : 0;

    text += `\nMacro Calories:\n`;
    text += `  Protein: ${Math.round(proteinCal)} cal (${pct(proteinCal)}%)\n`;
    text += `  Carbs: ${Math.round(carbsCal)} cal (${pct(carbsCal)}%)\n`;
    text += `  Fat: ${Math.round(fatCal)} cal (${pct(fatCal)}%)\n`;

    await Share.share({ message: text });
  }, [dayData, totals, settings, selectedDate, isToday, formattedDate]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Calorie Tracker</Text>
          {!isToday && (
            <>
              <Pressable onPress={() => setCalendarVisible(true)}>
                <Text style={styles.headerSubtitle}>
                  {formattedDate}
                </Text>
              </Pressable>
              <Pressable onPress={() => setSelectedDate(getDateString())} hitSlop={8}>
                <Text style={styles.todayLink}>↻ Today</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.headerRight}>
          <Pressable onPress={() => setCalendarVisible(true)} hitSlop={12}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push('/info')}
            hitSlop={12}
            style={{ marginLeft: theme.spacing.lg }}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Calorie ring + macros card ─────────────────────────────── */}
        <View style={styles.card}>
          {/* Copy day button */}
          <Pressable
            onPress={handleCopyDay}
            hitSlop={10}
            style={styles.copyButton}
          >
            <Ionicons
              name="copy-outline"
              size={18}
              color={theme.colors.textSecondary}
            />
          </Pressable>

          <CalorieRing
            consumed={totals.calories}
            goal={settings.calorieGoal}
            onEditPress={() => router.push('/calorie-settings')}
          />

          {/* Macro bars */}
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <MacroBar
                label="Carbs"
                current={totals.carbs}
                goal={settings.carbsGoal}
                color={theme.colors.carbs}
                unit="g"
              />
            </View>
            <View style={styles.macroItem}>
              <MacroBar
                label="Fat"
                current={totals.fat}
                goal={settings.fatGoal}
                color={theme.colors.fat}
                unit="g"
              />
            </View>
            <View style={styles.macroItem}>
              <MacroBar
                label="Protein"
                current={totals.protein}
                goal={settings.proteinGoal}
                color={theme.colors.protein}
                unit="g"
                exceededColor={theme.colors.accent}
              />
            </View>
          </View>

          {/* Sodium & Sugar bars */}
          <View style={styles.microRow}>
            <View style={styles.microItem}>
              <MacroBar
                label="Sodium"
                current={totals.sodium}
                goal={settings.sodiumGoal}
                color={theme.colors.sodium}
                unit="mg"
                warningColor={theme.colors.warning}
              />
            </View>
            <View style={styles.microItem}>
              <MacroBar
                label="Sugar"
                current={totals.sugar}
                goal={settings.sugarGoal}
                color={theme.colors.sugar}
                unit="g"
                warningColor={theme.colors.warning}
                warningThreshold={1.25}
              />
            </View>
          </View>
        </View>

        {/* ── Daily meals ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Daily meals</Text>

        {MEAL_TYPES.map((mealType) => (
          <MealCategory
            key={mealType}
            mealType={mealType}
            entries={dayData?.meals[mealType]?.entries ?? []}
            onAddPress={() => handleAddPress(mealType)}
            onEntryPress={(entry) => handleEntryPress(entry, mealType)}
            onEntryLongPress={(entry) => handleEntryLongPress(entry, mealType)}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modals / Sheets ──────────────────────────────────────────── */}
      <CalendarBottomSheet
        visible={calendarVisible}
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          setSelectedDate(date);
          setCalendarVisible(false);
        }}
        onClose={() => setCalendarVisible(false)}
      />

      <FoodOptionSheet
        visible={foodOptionVisible}
        onClose={() => setFoodOptionVisible(false)}
        onSearchPress={handleSearchPress}
      />

      <QuickAddModal
        visible={quickAddVisible}
        onClose={handleQuickAddClose}
        onAdd={handleQuickAdd}
        initialValues={editEntry ?? undefined}
        isFavorited={editEntry ? isFavorited(editEntry.name) : false}
        onToggleFavorite={editEntry ? () => toggleFavorite({
          name: editEntry.name,
          servingAmount: editEntry.servingAmount,
          servingUnit: editEntry.servingUnit,
          calories: editEntry.calories,
          carbs: editEntry.carbs,
          fat: editEntry.fat,
          protein: editEntry.protein,
          sodium: editEntry.sodium,
          sugar: editEntry.sugar,
        }) : undefined}
      />
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
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
  headerLeft: {
    width: 44,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
    marginTop: 2,
  },
  todayLink: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accent,
    marginTop: 2,
  },
  headerRight: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    position: 'relative',
  },
  copyButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1,
    padding: theme.spacing.xs,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  macroItem: {
    flex: 1,
  },
  microRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  microItem: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
});
