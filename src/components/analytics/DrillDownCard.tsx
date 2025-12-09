/**
 * DrillDownCard Component
 *
 * Pure/presentational card component for drill-down options in analytics.
 * Displays a period or category with its total and percentage, and is tappable
 * to navigate deeper into the data.
 *
 * @see docs/architecture-epic7.md - Pattern 4: Drill-Down Card Pattern
 * @see docs/sprint-artifacts/epic7/story-7.5-drill-down-cards-grid.md
 */

import React, { memo } from 'react';
import { getColor } from '../../utils/colors';

// ============================================================================
// Types
// ============================================================================

export interface DrillDownCardProps {
  /** Label for the card (e.g., "Q4", "October", "Food") */
  label: string;
  /** Total amount in the currency's main unit (CLP has no decimals) */
  value: number;
  /** Percentage of current view total (0-100), optional */
  percentage?: number;
  /** Click handler for navigation */
  onClick: () => void;
  /** Key for color lookup (category name or index-based key) */
  colorKey?: string;
  /** Whether this period/category has no transactions */
  isEmpty?: boolean;
  /** Custom message for empty state */
  emptyMessage?: string;
  /** Theme for styling */
  theme?: 'light' | 'dark';
  /** Locale for currency formatting */
  locale?: string;
  /** Currency code for formatting */
  currency?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats a currency value.
 * Note: CLP (Chilean Peso) has no decimal places - values are stored as-is.
 * Do NOT divide by 100 - the value is already in the main unit.
 */
function formatCurrency(value: number, locale: string = 'en', currency: string = 'CLP'): string {
  try {
    return new Intl.NumberFormat(locale === 'es' ? 'es-CL' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // Fallback if currency code is invalid
    return `$${value.toLocaleString()}`;
  }
}

/**
 * Formats a percentage value.
 */
function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

// ============================================================================
// Component
// ============================================================================

/**
 * DrillDownCard Component
 *
 * A single tappable card displaying a period or category with its total.
 * Used in DrillDownGrid to show drill-down options.
 *
 * Features:
 * - Pure/presentational (no context access)
 * - React.memo for performance optimization
 * - 44px minimum touch target
 * - Hover/tap feedback with accent border highlight
 * - Colored dot indicator matching chart segments (Story 7.10)
 * - Empty state with grayed styling
 *
 * @example
 * <DrillDownCard
 *   label="Q4"
 *   value={125000}
 *   percentage={32.5}
 *   onClick={() => drillToQuarter('Q4')}
 *   colorKey="Q4"
 *   theme="light"
 * />
 */
export const DrillDownCard = memo(function DrillDownCard({
  label,
  value,
  percentage,
  onClick,
  colorKey,
  isEmpty = false,
  emptyMessage,
  theme = 'light',
  locale = 'en',
  currency = 'CLP',
}: DrillDownCardProps): React.ReactElement {
  const isDark = theme === 'dark';
  const color = colorKey ? getColor(colorKey) : '#94a3b8'; // Default to slate-400

  // Base button classes - Story 7.10: Updated to use colored dot pattern
  // UX Spec: transparent border by default, accent color on hover
  const buttonClasses = [
    // Layout - flex with justify-between for left/right alignment
    'w-full flex items-center justify-between p-4 rounded-xl',
    // Touch target (min 44px)
    'min-h-11',
    // Transitions for hover/tap
    'transition-all duration-150',
    // Interactive states
    'cursor-pointer',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    isDark ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white',
    // Background - surface color per UX spec
    isEmpty
      ? (isDark ? 'bg-slate-800/50' : 'bg-slate-50')
      : (isDark ? 'bg-slate-800' : 'bg-white'),
    // Border - transparent by default, accent on hover (Story 7.10 AC #3)
    'border',
    isEmpty && 'opacity-60',
    // Active/tap state - slight scale
    'active:scale-[0.98]',
  ].filter(Boolean).join(' ');

  // Text classes - increased font sizes to match mockup
  const labelClasses = [
    'font-medium text-base',  // Increased from text-sm to text-base (16px)
    isEmpty
      ? (isDark ? 'text-slate-500' : 'text-slate-400')
      : (isDark ? 'text-slate-200' : 'text-slate-800'),
  ].join(' ');

  const valueClasses = [
    'font-semibold text-lg',  // Added text-lg (18px) for better visibility
    isEmpty
      ? (isDark ? 'text-slate-600' : 'text-slate-400')
      : (isDark ? 'text-slate-100' : 'text-slate-900'),
  ].join(' ');

  const percentageClasses = [
    'text-sm',  // Increased from text-xs to text-sm (14px)
    isDark ? 'text-slate-400' : 'text-slate-500',
  ].join(' ');

  const emptyMessageClasses = [
    'text-sm italic',
    isDark ? 'text-slate-500' : 'text-slate-400',
  ].join(' ');

  // Dynamic border color - transparent by default, accent on hover (AC #3)
  const borderColor = isEmpty ? (isDark ? '#334155' : '#e2e8f0') : 'transparent';
  const accentColor = '#3b82f6'; // blue-500

  return (
    <button
      onClick={onClick}
      role="button"
      aria-label={
        isEmpty
          ? `${label}: ${emptyMessage || 'No transactions'}`
          : `View ${label}: ${formatCurrency(value, locale, currency)}${percentage !== undefined ? ` (${formatPercentage(percentage)})` : ''}`
      }
      className={buttonClasses}
      style={{ borderColor }}
      onMouseEnter={(e) => { if (!isEmpty) e.currentTarget.style.borderColor = accentColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; }}
    >
      {/* Left side: Label + Progress Bar (Story 7.18) */}
      <div className="flex flex-col gap-1 flex-1 min-w-0 items-start">
        {/* Label - left aligned */}
        <span className={labelClasses}>{label}</span>
        {/* Progress Bar (Story 7.18 - AC #1, #2, #3, #4, #7, #8) */}
        {/* Bar track is fixed at 50% of container, fill represents percentage within that */}
        {percentage !== undefined && !isEmpty && (
          <div
            className={`h-1 w-1/2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percentage.toFixed(1)}% of total`}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </div>
        )}
      </div>

      {/* Right side: Amount + Percentage (AC #4) */}
      <div className="text-right">
        {isEmpty ? (
          <span className={emptyMessageClasses}>
            {emptyMessage || 'No transactions'}
          </span>
        ) : (
          <>
            <div className={valueClasses}>
              {formatCurrency(value, locale, currency)}
            </div>
            {percentage !== undefined && (
              <div className={percentageClasses}>
                {formatPercentage(percentage)}
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
});

export default DrillDownCard;
