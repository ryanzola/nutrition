/**
 * Dark theme tokens for the NutritionTracker app.
 *
 * Every colour, spacing value, border-radius, font-size, and font-weight used
 * across the UI is defined here so the design stays consistent and easy to
 * tweak in one place.
 */

export const theme = {
  // ── Colours ───────────────────────────────────────────────────────────
  colors: {
    /** Near-black app background */
    background: '#0D0D0F',
    /** Card / section backgrounds */
    surface: '#1A1A1E',
    /** Elevated cards, modals, sheets */
    surfaceElevated: '#242428',
    /** Subtle dividers & borders */
    border: '#2A2A2E',

    /** Primary text (white-ish) */
    textPrimary: '#F5F5F7',
    /** Secondary / muted text */
    textSecondary: '#8E8E93',
    /** Tertiary / dimmest text */
    textTertiary: '#636366',

    /** Calories — green ring fill */
    calories: '#4ADE80',
    /** Carbs — blue */
    carbs: '#60A5FA',
    /** Fat — orange */
    fat: '#FB923C',
    /** Protein — purple */
    protein: '#A78BFA',
    /** Sodium — pink */
    sodium: '#F472B6',
    /** Sugar — amber */
    sugar: '#FBBF24',

    /** Primary accent (green) */
    accent: '#4ADE80',
    /** Warning / caution (yellow) */
    warning: '#FACC15',
    /** Destructive / delete actions */
    danger: '#EF4444',
  },

  // ── Spacing ───────────────────────────────────────────────────────────
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },

  // ── Border Radius ─────────────────────────────────────────────────────
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },

  // ── Font Size ─────────────────────────────────────────────────────────
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    hero: 48,
  },

  // ── Font Weight ───────────────────────────────────────────────────────
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export type Theme = typeof theme;
