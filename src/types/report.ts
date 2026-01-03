/**
 * Report types for weekly/monthly/quarterly/yearly spending summaries.
 *
 * Story 14.16: Weekly Report Story Format
 * Epic 14: Core Implementation
 *
 * Provides type definitions for Instagram-style swipeable report cards
 * that display spending summaries in a Rosa-friendly format.
 */

import { StoreCategory } from './transaction';

/**
 * Type of report card for styling and content
 */
export type ReportCardType = 'summary' | 'category' | 'trend' | 'milestone';

/**
 * Time period type for reports
 */
export type ReportPeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/**
 * Trend direction for comparison indicators
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Configuration for a single report card
 */
export interface ReportCard {
  /** Unique identifier for the card */
  id: string;
  /** Type of card (summary, category, etc.) */
  type: ReportCardType;
  /** Card title (e.g., "Esta Semana") */
  title: string;
  /** Primary value to display (e.g., "$45.200") */
  primaryValue: string;
  /** Secondary value (optional, e.g., "vs $42.000 la semana pasada") */
  secondaryValue?: string;
  /** Trend direction for comparison arrow */
  trend?: TrendDirection;
  /** Trend percentage (e.g., 8 for +8%) */
  trendPercent?: number;
  /** Background color or gradient */
  color?: string;
  /** Category for category breakdown cards */
  category?: StoreCategory;
  /** Category emoji icon */
  categoryIcon?: string;
  /** Rosa-friendly description */
  description?: string;
}

/**
 * Category breakdown for a spending period
 */
export interface CategoryBreakdown {
  /** Store category */
  category: StoreCategory;
  /** Category emoji icon */
  icon: string;
  /** Total amount spent */
  amount: number;
  /** Percentage of total spending */
  percent: number;
  /** Number of transactions */
  transactionCount: number;
  /** Trend vs previous period */
  trend?: TrendDirection;
  /** Trend percentage */
  trendPercent?: number;
}

/**
 * Weekly spending summary data
 */
export interface WeeklySummary {
  /** Total spent this week */
  totalSpent: number;
  /** Total spent previous week */
  previousWeekSpent: number;
  /** Trend percentage change */
  trendPercent: number;
  /** Trend direction */
  trendDirection: TrendDirection;
  /** Top spending categories */
  topCategories: CategoryBreakdown[];
  /** Date range for the week */
  dateRange: {
    start: Date;
    end: Date;
  };
  /** Week number in the year */
  weekNumber: number;
  /** Whether this is the user's first week */
  isFirstWeek: boolean;
}

/**
 * Trend arrow color configuration
 * Up (spending increased) = Red (bad)
 * Down (spending decreased) = Green (good)
 * Neutral = Gray
 */
export const TREND_COLORS = {
  up: '#ef4444', // Red - spending increased (bad)
  down: '#22c55e', // Green - spending decreased (good)
  neutral: '#6b7280', // Gray - no change
} as const;

/**
 * Rosa-friendly trend descriptions (Chilean Spanish)
 */
export const TREND_DESCRIPTIONS = {
  up: {
    high: 'Subió harto', // > 20%
    medium: 'Subió un poco', // 10-20%
    low: 'Subió apenas', // < 10%
  },
  down: {
    high: 'Bajó harto', // > 20%
    medium: 'Bajó un poco', // 10-20%
    low: 'Bajó apenas', // < 10%
  },
  neutral: 'Igual que antes',
} as const;

/**
 * Get Rosa-friendly trend description based on direction and percentage
 * @param direction Trend direction
 * @param percent Absolute percentage change
 * @returns Rosa-friendly description string
 */
export function getTrendDescription(
  direction: TrendDirection,
  percent: number
): string {
  if (direction === 'neutral') {
    return TREND_DESCRIPTIONS.neutral;
  }

  const absPercent = Math.abs(percent);
  const magnitude = absPercent > 20 ? 'high' : absPercent >= 10 ? 'medium' : 'low';

  return TREND_DESCRIPTIONS[direction][magnitude];
}

/**
 * Calculate trend direction from percentage change
 * @param currentValue Current period value
 * @param previousValue Previous period value
 * @param neutralThreshold Threshold below which change is considered neutral (default: 2%)
 * @returns Trend direction and percentage
 */
export function calculateTrend(
  currentValue: number,
  previousValue: number,
  neutralThreshold: number = 2
): { direction: TrendDirection; percent: number } {
  if (previousValue === 0) {
    return { direction: 'neutral', percent: 0 };
  }

  const percentChange = ((currentValue - previousValue) / previousValue) * 100;
  const absChange = Math.abs(percentChange);

  if (absChange < neutralThreshold) {
    return { direction: 'neutral', percent: Math.round(percentChange) };
  }

  return {
    direction: percentChange > 0 ? 'up' : 'down',
    percent: Math.round(percentChange),
  };
}

/**
 * Format currency for display (Chilean Pesos)
 * @param amount Amount in pesos
 * @returns Formatted string (e.g., "$45.200")
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`;
}

/**
 * Format date range for display
 * @param start Start date
 * @param end End date
 * @returns Formatted date range string
 */
export function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  };
  const startStr = start.toLocaleDateString('es-CL', options);
  const endStr = end.toLocaleDateString('es-CL', options);
  return `${startStr} - ${endStr}`;
}
