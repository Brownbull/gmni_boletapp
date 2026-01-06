/**
 * Semantic Color Utilities
 *
 * Story 14.16b: Semantic Color System Application
 * Epic 14: Core Implementation
 *
 * Provides utilities for accessing theme-aware semantic colors defined as
 * CSS custom properties. These colors adapt to the current theme (Normal,
 * Professional, Mono) and mode (light/dark).
 *
 * Semantic meaning:
 * - Positive: Spending decreased (good) - green tones
 * - Negative: Spending increased (bad) - red tones
 * - Neutral: No significant change - gray tones
 * - Warning: Approaching limits - amber/ochre tones
 */

import { TrendDirection } from '../types/report';

// ============================================================================
// Types
// ============================================================================

/**
 * Semantic state types for trend indicators and status colors
 */
export type SemanticState = 'positive' | 'negative' | 'neutral' | 'warning';

/**
 * Variant types for different use cases (text, backgrounds, borders)
 */
export type SemanticVariant = 'primary' | 'secondary' | 'bg' | 'border';

// ============================================================================
// CSS Variable References
// ============================================================================

/**
 * Pre-built CSS variable references for inline styles.
 * Use these when you need static CSS variable references that adapt to themes.
 *
 * @example
 * // In a React component
 * <span style={{ color: SEMANTIC_COLORS.positive.primary }}>-15%</span>
 */
export const SEMANTIC_COLORS = {
  positive: {
    primary: 'var(--positive-primary)',
    secondary: 'var(--positive-secondary)',
    bg: 'var(--positive-bg)',
    border: 'var(--positive-border)',
  },
  negative: {
    primary: 'var(--negative-primary)',
    secondary: 'var(--negative-secondary)',
    bg: 'var(--negative-bg)',
    border: 'var(--negative-border)',
  },
  neutral: {
    primary: 'var(--neutral-primary)',
    secondary: 'var(--neutral-secondary)',
    bg: 'var(--neutral-bg)',
    border: 'var(--neutral-border)',
  },
  warning: {
    primary: 'var(--warning-semantic)',
    secondary: 'var(--warning-secondary)',
    bg: 'var(--warning-bg)',
    border: 'var(--warning-border)',
  },
} as const;

/**
 * Trend colors mapped to CSS variables.
 * Replaces hardcoded TREND_COLORS constant in types/report.ts.
 *
 * Note: In spending context, "up" (increased spending) is negative/bad,
 * and "down" (decreased spending) is positive/good.
 *
 * @example
 * const color = TREND_CSS_COLORS[trend]; // 'var(--negative-primary)' or 'var(--positive-primary)'
 */
export const TREND_CSS_COLORS = {
  up: 'var(--negative-primary)', // Spending up = bad = red tones
  down: 'var(--positive-primary)', // Spending down = good = green tones
  neutral: 'var(--neutral-primary)', // No change = gray tones
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the computed CSS variable value for a semantic color.
 * Use this when you need the actual hex color value (e.g., for canvas/SVG).
 *
 * @param state - The semantic state (positive, negative, neutral, warning)
 * @param variant - The variant (primary, secondary, bg, border)
 * @returns The computed color value as a hex string
 *
 * @example
 * const greenHex = getSemanticColor('positive', 'primary'); // '#3d8c5a'
 */
export function getSemanticColor(
  state: SemanticState,
  variant: SemanticVariant = 'primary'
): string {
  // Handle warning state which uses --warning-semantic instead of --warning-primary
  const varName = state === 'warning' && variant === 'primary'
    ? '--warning-semantic'
    : `--${state}-${variant}`;

  if (typeof document === 'undefined') {
    // SSR fallback - return CSS variable reference
    return `var(${varName})`;
  }

  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

/**
 * Gets the appropriate semantic color for a trend direction.
 * In spending context: up = bad (negative), down = good (positive).
 *
 * @param direction - The trend direction from calculateTrend()
 * @param variant - The variant (primary for text/icons, bg for backgrounds)
 * @returns CSS variable reference string
 *
 * @example
 * <span style={{ color: getTrendColor('down') }}>↓ -15%</span>
 */
export function getTrendColor(
  direction: TrendDirection,
  variant: SemanticVariant = 'primary'
): string {
  switch (direction) {
    case 'up':
      return SEMANTIC_COLORS.negative[variant];
    case 'down':
      return SEMANTIC_COLORS.positive[variant];
    case 'neutral':
    default:
      return SEMANTIC_COLORS.neutral[variant];
  }
}

/**
 * Gets the computed hex color for a trend direction.
 * Use this when you need actual color values (e.g., for canvas/SVG).
 *
 * @param direction - The trend direction
 * @returns The computed hex color value
 *
 * @example
 * ctx.fillStyle = getTrendColorComputed('up'); // '#b85c4a' (terracotta for Normal theme)
 */
export function getTrendColorComputed(direction: TrendDirection): string {
  switch (direction) {
    case 'up':
      return getSemanticColor('negative', 'primary');
    case 'down':
      return getSemanticColor('positive', 'primary');
    case 'neutral':
    default:
      return getSemanticColor('neutral', 'primary');
  }
}

/**
 * Maps a semantic state to the appropriate CSS variable reference.
 *
 * @param state - The semantic state
 * @param variant - The variant (default: 'primary')
 * @returns CSS variable reference string
 *
 * @example
 * const bgColor = getSemanticCssVar('warning', 'bg'); // 'var(--warning-bg)'
 */
export function getSemanticCssVar(
  state: SemanticState,
  variant: SemanticVariant = 'primary'
): string {
  return SEMANTIC_COLORS[state][variant];
}

/**
 * Creates a badge style object with semantic colors.
 * Useful for trend badges in reports and dashboards.
 *
 * @param state - The semantic state
 * @returns Style object with color, background, and border
 *
 * @example
 * <span style={getSemanticBadgeStyle('positive')}>-15% saved</span>
 */
export function getSemanticBadgeStyle(state: SemanticState): {
  color: string;
  backgroundColor: string;
  borderColor: string;
} {
  return {
    color: SEMANTIC_COLORS[state].primary,
    backgroundColor: SEMANTIC_COLORS[state].bg,
    borderColor: SEMANTIC_COLORS[state].border,
  };
}

/**
 * Gets badge style based on trend direction.
 *
 * @param direction - The trend direction
 * @returns Style object for a trend badge
 *
 * @example
 * <div style={getTrendBadgeStyle('down')}>↓ Bajó harto</div>
 */
export function getTrendBadgeStyle(direction: TrendDirection): {
  color: string;
  backgroundColor: string;
  borderColor: string;
} {
  switch (direction) {
    case 'up':
      return getSemanticBadgeStyle('negative');
    case 'down':
      return getSemanticBadgeStyle('positive');
    case 'neutral':
    default:
      return getSemanticBadgeStyle('neutral');
  }
}
