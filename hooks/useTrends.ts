/**
 * hooks/useTrends.ts
 *
 * Real-time aggregation of logged days over the current calendar week
 * (Monday-start) and calendar month, for intake-vs-maintenance tracking.
 */

import { useEffect, useMemo, useState } from 'react';

import { subscribeToDaysInRange } from '@/services/firestore';
import { getDateString } from '@/context/AppContext';
import type { DayDocument } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────

/** Aggregated intake for one calendar period (week or month). */
export interface PeriodSummary {
  /** Period start in YYYY-MM-DD (inclusive). */
  startDate: string;
  /** Period end in YYYY-MM-DD (inclusive). */
  endDate: string;
  /** Total days in the full period (7 for a week, 28–31 for a month). */
  daysInPeriod: number;
  /** Days elapsed so far, including today. */
  daysElapsed: number;
  /** Days with at least one logged calorie. */
  daysLogged: number;
  /** Total calories consumed in the period so far. */
  calories: number;
  /** Per-day calories for logged days, sorted by date ascending. */
  days: { date: string; calories: number }[];
}

interface UseTrendsResult {
  week: PeriodSummary;
  month: PeriodSummary;
}

// ── Date helpers ───────────────────────────────────────────────────────────

/** Parse a YYYY-MM-DD string into a local-time Date. */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days between two YYYY-MM-DD strings, inclusive of both ends. */
function daysBetweenInclusive(startStr: string, endStr: string): number {
  const ms = parseDate(endStr).getTime() - parseDate(startStr).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** Monday-start week range containing the given date. */
export function getWeekRange(todayStr: string): { start: string; end: string } {
  const today = parseDate(todayStr);
  const mondayOffset = (today.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: getDateString(monday), end: getDateString(sunday) };
}

/** Calendar-month range containing the given date. */
export function getMonthRange(todayStr: string): { start: string; end: string } {
  const today = parseDate(todayStr);
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: getDateString(first), end: getDateString(last) };
}

// ── Aggregation ────────────────────────────────────────────────────────────

function summarize(
  days: DayDocument[],
  start: string,
  end: string,
  todayStr: string,
): PeriodSummary {
  return {
    startDate: start,
    endDate: end,
    daysInPeriod: daysBetweenInclusive(start, end),
    daysElapsed: daysBetweenInclusive(start, todayStr < end ? todayStr : end),
    daysLogged: days.filter((d) => d.totals.calories > 0).length,
    calories: days.reduce((sum, d) => sum + d.totals.calories, 0),
    days: days
      .map((d) => ({ date: d.date, calories: d.totals.calories }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useTrends(uid: string | null): UseTrendsResult {
  // Captured once per mount; the screen remounts on each visit so this
  // stays current without a midnight-rollover timer.
  const todayStr = useMemo(() => getDateString(), []);
  const weekRange = useMemo(() => getWeekRange(todayStr), [todayStr]);
  const monthRange = useMemo(() => getMonthRange(todayStr), [todayStr]);

  const [weekDays, setWeekDays] = useState<DayDocument[]>([]);
  const [monthDays, setMonthDays] = useState<DayDocument[]>([]);

  useEffect(() => {
    if (!uid) {
      setWeekDays([]);
      return;
    }
    return subscribeToDaysInRange(uid, weekRange.start, weekRange.end, setWeekDays);
  }, [uid, weekRange]);

  useEffect(() => {
    if (!uid) {
      setMonthDays([]);
      return;
    }
    return subscribeToDaysInRange(uid, monthRange.start, monthRange.end, setMonthDays);
  }, [uid, monthRange]);

  const week = useMemo(
    () => summarize(weekDays, weekRange.start, weekRange.end, todayStr),
    [weekDays, weekRange, todayStr],
  );
  const month = useMemo(
    () => summarize(monthDays, monthRange.start, monthRange.end, todayStr),
    [monthDays, monthRange, todayStr],
  );

  return { week, month };
}
