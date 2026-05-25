/**
 * MacroBar — horizontal progress bar for a single macro nutrient.
 *
 * Shows a label, a slim coloured progress bar, and a "current / goal unit"
 * readout below.
 */

import React from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { theme } from '@/constants/theme';

// ── Props ──────────────────────────────────────────────────────────────────

interface MacroBarProps {
  /** Display label (e.g. "Carbs"). */
  label: string;
  /** Current intake value. */
  current: number;
  /** Target goal value. */
  goal: number;
  /** Bar fill colour. */
  color: string;
  /** Unit suffix (defaults to "g"). */
  unit?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function MacroBar({
  label,
  current,
  goal,
  color,
  unit = 'g',
}: MacroBarProps) {
  const ratio = goal > 0 ? Math.min(current / goal, 1) : 0;
  const percentage = `${(ratio * 100).toFixed(0)}%`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Track */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${(ratio * 100).toFixed(0)}%` as DimensionValue, backgroundColor: color },
          ]}
        />
      </View>

      <Text style={styles.values}>
        {current} / {goal} {unit}
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 5,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  values: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
