/**
 * Analytics to History Filters Conversion Utilities
 *
 * Converts analytics navigation positions (TemporalPosition, CategoryPosition)
 * to History filter states for navigating from analytics cards to filtered History view.
 *
 * Story 9.20: Analytics Transaction Count & History Navigation
 * @see docs/sprint-artifacts/epic9/story-9.20-analytics-transaction-count-navigation.md
 */

import type { TemporalPosition, CategoryPosition } from '@/types/analytics';
import type {
  TemporalFilterState,
  CategoryFilterState,
} from '@/contexts/HistoryFiltersContext';

// ============================================================================
// Temporal Position → Filter Conversion
// ============================================================================

/**
 * Convert an analytics TemporalPosition to a HistoryFilters TemporalFilterState.
 *
 * AC #4: Maps each temporal level to appropriate filter:
 * - year → { level: 'year', year }
 * - quarter → { level: 'quarter', year, quarter } (AC #6: quarter support)
 * - month → { level: 'month', year, month }
 * - week → { level: 'week', year, month, week }
 * - day → { level: 'day', year, month, week, day }
 *
 * @param position - The analytics temporal position
 * @returns TemporalFilterState for History filtering
 */
export function temporalPositionToFilter(
  position: TemporalPosition
): TemporalFilterState {
  switch (position.level) {
    case 'year':
      return {
        level: 'year',
        year: position.year,
      };

    case 'quarter':
      // AC #6: Quarter navigation maps to quarter filter
      // HistoryFiltersContext now supports quarter level (added in Story 9.20)
      return {
        level: 'quarter',
        year: position.year,
        quarter: position.quarter,
      };

    case 'month':
      return {
        level: 'month',
        year: position.year,
        month: position.month,
      };

    case 'week':
      return {
        level: 'week',
        year: position.year,
        month: position.month,
        week: position.week,
      };

    case 'day':
      return {
        level: 'day',
        year: position.year,
        month: position.month,
        week: position.week,
        day: position.day,
      };

    default:
      return { level: 'all' };
  }
}

// ============================================================================
// Category Position → Filter Conversion
// ============================================================================

/**
 * Convert an analytics CategoryPosition to a HistoryFilters CategoryFilterState.
 *
 * AC #4: Maps each category level to appropriate filter:
 * - all → { level: 'all' }
 * - category → { level: 'category', category }
 * - group → { level: 'group', category, group }
 * - subcategory → { level: 'subcategory', category, group, subcategory }
 *
 * @param position - The analytics category position
 * @returns CategoryFilterState for History filtering
 */
export function categoryPositionToFilter(
  position: CategoryPosition
): CategoryFilterState {
  switch (position.level) {
    case 'all':
      return { level: 'all' };

    case 'category':
      return {
        level: 'category',
        category: position.category,
      };

    case 'group':
      return {
        level: 'group',
        category: position.category,
        group: position.group,
      };

    case 'subcategory':
      return {
        level: 'subcategory',
        category: position.category,
        group: position.group,
        subcategory: position.subcategory,
      };

    default:
      return { level: 'all' };
  }
}

// ============================================================================
// Navigation Payload Type
// ============================================================================

/**
 * Story 14.13a: Drill-down path structure for multi-level filter preservation.
 * Contains accumulated context from analytics drill-down navigation.
 */
export interface DrillDownPath {
  /** Store category group (e.g., "food-dining") */
  storeGroup?: string;
  /** Store category (e.g., "Supermercado") */
  storeCategory?: string;
  /** Item category group (e.g., "food-fresh") */
  itemGroup?: string;
  /** Item category (e.g., "Carnes y Mariscos") */
  itemCategory?: string;
  /** Subcategory (e.g., "Res") */
  subcategory?: string;
}

/**
 * Payload structure for navigating to History with pre-applied filters.
 * Used by DrillDownGrid to communicate filter intent to parent components.
 *
 * Story 14.13 Session 5: Extended to support item-based navigation
 * - storeGroup: Filter by store category group (e.g., "Food & Dining")
 * - itemGroup: Filter by item category group (e.g., "Fresh Food")
 * - itemCategory: Filter by item category (e.g., "Carnes y Mariscos")
 *
 * Story 14.13a: Extended to support multi-level drill-down filters
 * - drillDownPath: Accumulated context from the full drill-down hierarchy
 * - targetView: Target view ('history' for transactions, 'items' for products)
 * - sourceDistributionView: Source chart type for back navigation
 *
 * Note: This interface matches TrendsView.HistoryNavigationPayload for compatibility.
 * Both temporal and category use simpler types (string-based) for flexibility.
 */
export interface HistoryNavigationPayload {
  /** Store category filter (e.g., "Supermarket", "Restaurant", or comma-separated list) */
  category?: string;
  /** Store category group filter (e.g., "Essentials", "Entertainment") */
  storeGroup?: string;
  /** Item category group filter (e.g., "Produce", "Beverages") */
  itemGroup?: string;
  /** Item category/subcategory filter (e.g., "Fruits", "Soft Drinks") */
  itemCategory?: string;
  /** Temporal filter with level and period values */
  temporal?: {
    level: string;
    year?: string;
    month?: string;
    quarter?: string;
  };
  /**
   * Story 14.13a: Full drill-down path for multi-dimension filtering.
   * When present, allows filtering by multiple dimensions simultaneously.
   */
  drillDownPath?: DrillDownPath;
  /**
   * Story 14.13 Session 5: Target view for navigation.
   * - 'history': Navigate to Compras (transaction list)
   * - 'items': Navigate to Productos (item list)
   */
  targetView?: 'history' | 'items';
  /**
   * Story 14.13 Session 7: Source distribution view for back navigation.
   * Allows restoring drill-down position when navigating back.
   */
  sourceDistributionView?: 'donut' | 'treemap';
}

/**
 * Create a navigation payload for temporal card badge click.
 *
 * AC #5: When navigating from a temporal card, only temporal filter is applied.
 * Category filter is set to 'all'.
 *
 * @param temporalPosition - The card's temporal position
 * @returns Navigation payload with temporal filter only
 */
export function createTemporalNavigationPayload(
  temporalPosition: TemporalPosition
): HistoryNavigationPayload {
  const filter = temporalPositionToFilter(temporalPosition);
  return {
    temporal: {
      level: filter.level,
      year: filter.year,
      month: filter.month,
      quarter: filter.quarter,
    },
    // No category filter for temporal-only navigation
  };
}

/**
 * Create a navigation payload for category card badge click.
 *
 * AC #5: When navigating from a category card, both current temporal AND category
 * filter are applied. This allows viewing "Food transactions from October 2024".
 *
 * @param categoryPosition - The card's category position
 * @param currentTemporal - Current temporal context from analytics
 * @returns Navigation payload with both temporal and category filters
 */
export function createCategoryNavigationPayload(
  categoryPosition: CategoryPosition,
  currentTemporal: TemporalPosition
): HistoryNavigationPayload {
  const temporalFilter = temporalPositionToFilter(currentTemporal);
  const categoryFilter = categoryPositionToFilter(categoryPosition);

  return {
    temporal: {
      level: temporalFilter.level,
      year: temporalFilter.year,
      month: temporalFilter.month,
      quarter: temporalFilter.quarter,
    },
    // Extract category name from CategoryFilterState
    category: categoryFilter.level === 'all' ? undefined : categoryFilter.category,
  };
}
