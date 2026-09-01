/**
 * app/weight.tsx
 *
 * Daily weigh-in logging and weight trend chart with rolling
 * week / month / year windows, plus an AI-digestible clipboard export.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { theme } from '@/constants/theme';
import { getDateString, useApp } from '@/context/AppContext';
import { useWeights } from '@/hooks/useWeights';
import { useScrollToTopOnFocus } from '@/hooks/useScrollToTopOnFocus';
import WeightChart from '@/components/WeightChart';
import CalendarBottomSheet from '@/components/CalendarBottomSheet';

// ── Windows ────────────────────────────────────────────────────────────────

type ChartWindow = 'week' | 'month' | 'year';

const WINDOWS: { key: ChartWindow; label: string; days: number }[] = [
  { key: 'week', label: 'Week', days: 7 },
  { key: 'month', label: 'Month', days: 30 },
  { key: 'year', label: 'Year', days: 365 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function weekdayName(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long' });
}

const fmtWeight = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

// ── Screen ─────────────────────────────────────────────────────────────────

export default function WeightScreen() {
  const { uid } = useApp();
  const { weights, logWeight } = useWeights(uid);
  const scrollRef = useScrollToTopOnFocus();

  const [input, setInput] = useState('');
  const [window, setWindow] = useState<ChartWindow>('week');
  const [copied, setCopied] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayStr = getDateString();
  const [logDate, setLogDate] = useState(todayStr);
  const logEntry = weights.find((w) => w.date === logDate);

  const logDateLabel = useMemo(() => {
    if (logDate === todayStr) return 'Today';
    const [y, m, d] = logDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [logDate, todayStr]);

  // ── Windowed data ──────────────────────────────────────────────────────
  const windowDays = WINDOWS.find((w) => w.key === window)!.days;
  const windowed = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - (windowDays - 1));
    const startStr = getDateString(start);
    return weights.filter((w) => w.date >= startStr);
  }, [weights, windowDays]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const latest = weights.length > 0 ? weights[weights.length - 1] : null;
  const change =
    windowed.length >= 2
      ? windowed[windowed.length - 1].weight - windowed[0].weight
      : null;
  const average =
    windowed.length > 0
      ? windowed.reduce((s, w) => s + w.weight, 0) / windowed.length
      : null;

  // ── Handlers ───────────────────────────────────────────────────────────
  const parsed = parseFloat(input);
  const canLog = !Number.isNaN(parsed) && parsed > 0 && parsed < 1000;

  const handleLog = useCallback(async () => {
    if (!canLog) return;
    Keyboard.dismiss();
    setInput('');
    // Default back to today after logging a backdated weigh-in
    setLogDate(todayStr);
    await logWeight(Math.round(parsed * 10) / 10, logDate);
  }, [canLog, parsed, logWeight, logDate, todayStr]);

  const handleCopyReport = useCallback(async () => {
    const windowLabel = WINDOWS.find((w) => w.key === window)!.label.toLowerCase();
    let text = `Weight log — past ${windowLabel} (lb)\n`;
    for (const w of windowed) {
      text += `weigh in for ${weekdayName(w.date)} (${w.date}): ${fmtWeight(w.weight)} lb\n`;
    }
    if (windowed.length === 0) {
      text += 'No weigh-ins recorded in this window.\n';
    }

    await Clipboard.setStringAsync(text);

    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [window, windowed]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 22 }} />
        <Text style={styles.headerTitle}>Weight</Text>
        <Pressable onPress={handleCopyReport} hitSlop={12}>
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={22}
            color={copied ? theme.colors.accent : theme.colors.textPrimary}
          />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Log card ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Weigh-In</Text>
            <Pressable
              style={styles.dateChip}
              onPress={() => setCalendarVisible(true)}
              hitSlop={8}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={theme.colors.accent}
              />
              <Text style={styles.dateChipText}>{logDateLabel}</Text>
            </Pressable>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={logEntry ? fmtWeight(logEntry.weight) : '0.0'}
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleLog}
            />
            <Text style={styles.inputUnit}>lb</Text>
            <Pressable
              onPress={handleLog}
              disabled={!canLog}
              style={({ pressed }) => [
                styles.logButton,
                !canLog && styles.logButtonDisabled,
                pressed && canLog && styles.logButtonPressed,
              ]}
            >
              <Text style={styles.logButtonText}>
                {logEntry ? 'Update' : 'Log'}
              </Text>
            </Pressable>
          </View>
          {logEntry && (
            <Text style={styles.loggedNote}>
              Logged {fmtWeight(logEntry.weight)} lb{' '}
              {logDate === todayStr ? 'today' : `on ${logDateLabel}`} — enter a
              new value to update.
            </Text>
          )}
        </View>

        {/* ── Chart card ────────────────────────────────────────────── */}
        <View style={styles.card}>
          {/* Window tabs */}
          <View style={styles.tabs}>
            {WINDOWS.map((w) => (
              <Pressable
                key={w.key}
                style={[styles.tab, window === w.key && styles.tabActive]}
                onPress={() => setWindow(w.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    window === w.key && styles.tabTextActive,
                  ]}
                >
                  {w.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <WeightChart data={windowed} />

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValue}>
                {latest ? `${fmtWeight(latest.weight)}` : '—'}
              </Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Change</Text>
              <Text
                style={[
                  styles.statValue,
                  change != null && change < 0 && { color: theme.colors.accent },
                  change != null && change > 0 && { color: theme.colors.fat },
                ]}
              >
                {change != null
                  ? `${change > 0 ? '+' : ''}${fmtWeight(change)}`
                  : '—'}
              </Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>
                {average != null ? fmtWeight(average) : '—'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <CalendarBottomSheet
        visible={calendarVisible}
        selectedDate={logDate}
        onDateSelect={(date) => {
          setLogDate(date);
          setCalendarVisible(false);
        }}
        onClose={() => setCalendarVisible(false)}
      />
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
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
  },
  dateChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.accent,
  },

  // ── Log card ───────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  inputUnit: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.md,
  },
  logButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  logButtonDisabled: {
    opacity: 0.35,
  },
  logButtonPressed: {
    opacity: 0.8,
  },
  logButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: '#FFFFFF',
  },
  loggedNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.md,
  },

  // ── Window tabs ────────────────────────────────────────────────────────
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    padding: 3,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm - 3,
  },
  tabActive: {
    backgroundColor: theme.colors.surface,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.textPrimary,
  },

  // ── Stats ──────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
});
