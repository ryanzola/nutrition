/**
 * CalendarBottomSheet — a slide-up calendar for date selection.
 *
 * Built with React Native's built-in `Modal` (no @gorhom/bottom-sheet).
 * Shows a month grid with navigation arrows, highlights today and the
 * currently selected date, and dims future dates.
 */

import React, { useMemo, useState } from 'react';
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

interface CalendarBottomSheetProps {
  /** Whether the sheet is visible. */
  visible: boolean;
  /** Currently selected date in YYYY-MM-DD format. */
  selectedDate: string;
  /** Called when the user taps a date. */
  onDateSelect: (date: string) => void;
  /** Called when the backdrop is tapped or the sheet is dismissed. */
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Returns YYYY-MM-DD for a Date object. */
function getDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns today's YYYY-MM-DD string. */
function getTodayString(): string {
  return getDateString(new Date());
}

/** Build a 6×7 grid of day numbers (0 = empty cell). */
function buildCalendarGrid(year: number, month: number): number[][] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid: number[][] = [];
  let day = 1;

  for (let row = 0; row < 6; row++) {
    const week: number[] = [];
    for (let col = 0; col < 7; col++) {
      if (row === 0 && col < firstDay) {
        week.push(0);
      } else if (day > daysInMonth) {
        week.push(0);
      } else {
        week.push(day);
        day++;
      }
    }
    grid.push(week);
    if (day > daysInMonth) break;
  }
  return grid;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CalendarBottomSheet({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
}: CalendarBottomSheetProps) {
  // Parse the selected date to initialise month view
  const [selYear, selMonth] = selectedDate.split('-').map(Number);
  const [viewYear, setViewYear] = useState(selYear || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(
    selMonth != null ? selMonth - 1 : new Date().getMonth(),
  );

  // Reset view when the sheet opens with a new selected date
  React.useEffect(() => {
    if (visible) {
      const [y, m] = selectedDate.split('-').map(Number);
      if (y) setViewYear(y);
      if (m) setViewMonth(m - 1);
    }
  }, [visible, selectedDate]);

  const todayStr = getTodayString();

  const grid = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayPress = (day: number) => {
    if (day === 0) return;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateStr = `${viewYear}-${m}-${d}`;
    onDateSelect(dateStr);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet content */}
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Month / Year header */}
        <View style={styles.monthHeader}>
          <Pressable onPress={goToPrevMonth} hitSlop={12}>
            <Ionicons
              name="chevron-back"
              size={22}
              color={theme.colors.textPrimary}
            />
          </Pressable>

          <Text style={styles.monthTitle}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>

          <Pressable onPress={goToNextMonth} hitSlop={12}>
            <Ionicons
              name="chevron-forward"
              size={22}
              color={theme.colors.textPrimary}
            />
          </Pressable>
        </View>

        {/* Day-of-week headers */}
        <View style={styles.weekRow}>
          {DAY_HEADERS.map((d, i) => (
            <Text key={i} style={styles.dayHeader}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        {grid.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              if (day === 0) {
                return <View key={di} style={styles.dayCell} />;
              }

              const m = String(viewMonth + 1).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              const dateStr = `${viewYear}-${m}-${d}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isFuture = dateStr > todayStr;

              return (
                <Pressable
                  key={di}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                    isSelected && !isToday && styles.selectedCell,
                  ]}
                  onPress={() => handleDayPress(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.todayText,
                      isSelected && !isToday && styles.selectedText,
                      isFuture && styles.futureText,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const CELL_SIZE = 40;

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
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  monthTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xs,
  },
  dayHeader: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xs,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textPrimary,
  },
  todayCell: {
    backgroundColor: theme.colors.accent,
  },
  todayText: {
    color: theme.colors.background,
    fontWeight: theme.fontWeight.bold,
  },
  selectedCell: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  selectedText: {
    color: theme.colors.accent,
    fontWeight: theme.fontWeight.semibold,
  },
  futureText: {
    color: theme.colors.textTertiary,
  },
});
