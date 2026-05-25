/**
 * CalorieRing — circular progress ring showing consumed vs goal calories.
 *
 * Uses react-native-svg for the ring and animates the stroke-dashoffset
 * on mount / when consumed changes.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { theme } from '@/constants/theme';

// ── Animated circle wrapper ────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Props ──────────────────────────────────────────────────────────────────

interface CalorieRingProps {
  /** Calories consumed so far today. */
  consumed: number;
  /** Daily calorie goal. */
  goal: number;
  /** Called when the user taps "Edit". */
  onEditPress: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const RADIUS = 100;
const STROKE_WIDTH = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE_WIDTH) * 2;
const CENTER = SIZE / 2;

// ── Component ──────────────────────────────────────────────────────────────

export default function CalorieRing({
  consumed,
  goal,
  onEditPress,
}: CalorieRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const ratio = goal > 0 ? Math.min(consumed / goal, 1) : 0;

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: ratio,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [ratio]);

  // Animated stroke-dashoffset: full circumference → offset based on ratio
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background track */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={theme.colors.border}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />

        {/* Foreground arc – rotated so it starts at the top */}
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={theme.colors.calories}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${CENTER}, ${CENTER}`}
        />
      </Svg>

      {/* Center content overlaid on top of the SVG */}
      <View style={styles.centerContent}>
        <Text style={styles.consumedText}>{consumed}</Text>
        <Text style={styles.goalText}>of {goal} Cal</Text>
        <Pressable onPress={onEditPress} hitSlop={8}>
          <Text style={styles.editText}>Edit</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumedText: {
    fontSize: theme.fontSize.hero,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  goalText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.regular,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  editText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.accent,
    marginTop: theme.spacing.sm,
  },
});
