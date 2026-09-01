/**
 * WeightChart — time-scaled SVG line chart of weigh-ins.
 *
 * Points are positioned by date (not index) so gaps between weigh-ins
 * occupy proportional horizontal space. The y-domain is padded around
 * the data's min/max so small fluctuations stay readable.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { theme } from '@/constants/theme';
import type { WeightEntry } from '@/types';

interface WeightChartProps {
  /** Weigh-ins sorted by date ascending. */
  data: WeightEntry[];
  height?: number;
}

const PADDING = { top: 16, right: 12, bottom: 24, left: 40 };
/** Show per-point dots only when the chart isn't crowded. */
const MAX_DOTS = 45;

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatAxisDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function WeightChart({ data, height = 220 }: WeightChartProps) {
  const [width, setWidth] = useState(0);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>No weigh-ins in this window</Text>
      </View>
    );
  }

  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;

  // ── Scales ─────────────────────────────────────────────────────────────
  const times = data.map((d) => parseDate(d.date).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tSpan = Math.max(tMax - tMin, 1);

  const values = data.map((d) => d.weight);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  // Pad the domain; enforce a minimum span so a flat line sits mid-chart.
  const pad = Math.max((vMax - vMin) * 0.15, 1);
  const yMin = vMin - pad;
  const yMax = vMax + pad;

  const x = (t: number) =>
    data.length === 1
      ? PADDING.left + plotW / 2
      : PADDING.left + ((t - tMin) / tSpan) * plotW;
  const y = (v: number) => PADDING.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const points = data
    .map((d, i) => `${x(times[i])},${y(d.weight)}`)
    .join(' ');

  // ── Gridlines: top / mid / bottom ──────────────────────────────────────
  const gridValues = [yMax, (yMax + yMin) / 2, yMin];

  const last = data[data.length - 1];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {gridValues.map((v) => (
            <React.Fragment key={v}>
              <Line
                x1={PADDING.left}
                y1={y(v)}
                x2={width - PADDING.right}
                y2={y(v)}
                stroke={theme.colors.border}
                strokeWidth={StyleSheet.hairlineWidth}
              />
              <SvgText
                x={PADDING.left - 6}
                y={y(v) + 3.5}
                fontSize={theme.fontSize.xs}
                fill={theme.colors.textTertiary}
                textAnchor="end"
              >
                {(Math.round(v * 10) / 10).toFixed(1)}
              </SvgText>
            </React.Fragment>
          ))}

          {data.length > 1 && (
            <Polyline
              points={points}
              fill="none"
              stroke={theme.colors.accent}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {data.length <= MAX_DOTS &&
            data.map((d, i) => (
              <Circle
                key={d.date}
                cx={x(times[i])}
                cy={y(d.weight)}
                r={3}
                fill={theme.colors.accent}
              />
            ))}

          {/* Highlight the most recent weigh-in */}
          <Circle
            cx={x(times[times.length - 1])}
            cy={y(last.weight)}
            r={5}
            fill={theme.colors.background}
            stroke={theme.colors.accent}
            strokeWidth={2}
          />

          {/* X-axis: start and end dates */}
          <SvgText
            x={PADDING.left}
            y={height - 6}
            fontSize={theme.fontSize.xs}
            fill={theme.colors.textTertiary}
            textAnchor="start"
          >
            {formatAxisDate(data[0].date)}
          </SvgText>
          {data.length > 1 && (
            <SvgText
              x={width - PADDING.right}
              y={height - 6}
              fontSize={theme.fontSize.xs}
              fill={theme.colors.textTertiary}
              textAnchor="end"
            >
              {formatAxisDate(last.date)}
            </SvgText>
          )}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
  },
});
