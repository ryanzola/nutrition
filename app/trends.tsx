/**
 * app/trends.tsx
 *
 * Weekly and monthly intake vs maintenance.
 * Maintenance is the daily calorie goal scaled to the period, so the
 * headline number is the running deficit (or surplus) for the period.
 */

import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { theme } from '@/constants/theme';
import { getDateString, useApp } from '@/context/AppContext';
import { useTrends, type PeriodSummary } from '@/hooks/useTrends';

// ── Helpers ────────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatMonthName(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/**
 * Builds a plain-text report of a period, structured for pasting
 * into an AI assistant.
 */
function periodReport(
  label: string,
  summary: PeriodSummary,
  dailyGoal: number,
): string {
  const maintenanceFull = dailyGoal * summary.daysInPeriod;
  const maintenanceToDate = dailyGoal * summary.daysElapsed;
  const delta = maintenanceToDate - summary.calories;
  const avgPerDay = summary.calories / Math.max(summary.daysElapsed, 1);

  let text = `${label} (${summary.startDate} to ${summary.endDate})\n`;
  text += `- Days elapsed: ${summary.daysElapsed} of ${summary.daysInPeriod} (${summary.daysLogged} logged)\n`;
  text += `- Intake so far: ${Math.round(summary.calories)} Cal\n`;
  text += `- Maintenance to date: ${Math.round(maintenanceToDate)} Cal (full period: ${Math.round(maintenanceFull)} Cal)\n`;
  text += `- Running balance: ${Math.round(Math.abs(delta))} Cal ${delta >= 0 ? 'deficit' : 'surplus'}\n`;
  text += `- Average per day: ${Math.round(avgPerDay)} Cal\n`;

  if (summary.days.length > 0) {
    text += `- Daily log:\n`;
    for (const day of summary.days) {
      text += `  - ${day.date}: ${Math.round(day.calories)} Cal\n`;
    }
  }

  return text;
}

// ── Period card ────────────────────────────────────────────────────────────

interface PeriodCardProps {
  title: string;
  subtitle: string;
  summary: PeriodSummary;
  dailyGoal: number;
}

function PeriodCard({ title, subtitle, summary, dailyGoal }: PeriodCardProps) {
  const maintenanceFull = dailyGoal * summary.daysInPeriod;
  const maintenanceToDate = dailyGoal * summary.daysElapsed;
  const delta = maintenanceToDate - summary.calories;
  const isDeficit = delta >= 0;
  const avgPerDay = summary.calories / Math.max(summary.daysElapsed, 1);
  const progress = maintenanceFull > 0
    ? Math.min(summary.calories / maintenanceFull, 1)
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>

      {/* Headline: running deficit / surplus */}
      <View style={styles.headline}>
        <Text
          style={[
            styles.headlineValue,
            { color: isDeficit ? theme.colors.accent : theme.colors.fat },
          ]}
        >
          {fmt(Math.abs(delta))}
        </Text>
        <Text style={styles.headlineLabel}>
          Cal {isDeficit ? 'deficit' : 'surplus'} · {summary.daysElapsed}{' '}
          {summary.daysElapsed === 1 ? 'day' : 'days'} in
        </Text>
      </View>

      {/* Progress toward full-period maintenance */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.progressLabels}>
        <Text style={styles.progressText}>{fmt(summary.calories)} Cal eaten</Text>
        <Text style={styles.progressText}>{fmt(maintenanceFull)} Cal maintenance</Text>
      </View>

      {/* Detail rows */}
      <View style={styles.rows}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Maintenance to date</Text>
          <Text style={styles.rowValue}>{fmt(maintenanceToDate)} Cal</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Average per day</Text>
          <Text style={styles.rowValue}>{fmt(avgPerDay)} Cal</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Days logged</Text>
          <Text style={styles.rowValue}>
            {summary.daysLogged} of {summary.daysElapsed}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function TrendsScreen() {
  const { uid, settings } = useApp();
  const { week, month } = useTrends(uid);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyReport = useCallback(async () => {
    let text = `Nutrition trends report — generated ${getDateString()}\n`;
    text += `Daily maintenance goal: ${Math.round(settings.calorieGoal)} Cal\n\n`;
    text += periodReport('THIS WEEK', week, settings.calorieGoal);
    text += '\n';
    text += periodReport('THIS MONTH', month, settings.calorieGoal);

    await Clipboard.setStringAsync(text);

    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [week, month, settings.calorieGoal]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Trends</Text>
        <Pressable onPress={handleCopyReport} hitSlop={12}>
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={22}
            color={copied ? theme.colors.accent : theme.colors.textPrimary}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PeriodCard
          title="This Week"
          subtitle={`${formatShortDate(week.startDate)} – ${formatShortDate(week.endDate)}`}
          summary={week}
          dailyGoal={settings.calorieGoal}
        />

        <PeriodCard
          title="This Month"
          subtitle={formatMonthName(month.startDate)}
          summary={month}
          dailyGoal={settings.calorieGoal}
        />

        <Text style={styles.footnote}>
          Maintenance is your daily calorie goal ({fmt(settings.calorieGoal)} Cal)
          scaled to the period. Deficit and surplus compare intake against
          maintenance for the days elapsed so far.
        </Text>
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
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  // ── Card ───────────────────────────────────────────────────────────────
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  headline: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headlineValue: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
  },
  headlineLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  progressTrack: {
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  progressText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },

  rows: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  rowLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  rowValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
  },

  footnote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    lineHeight: 16,
    paddingHorizontal: theme.spacing.xs,
  },
});
