/**
 * useAnalyticsNavigation Hook
 *
 * Custom hook for accessing analytics navigation state and dispatch.
 * This is the ONLY way components should access AnalyticsContext.
 *
 * @see docs/architecture-epic7.md - Pattern 1: Context Consumer Pattern
 */

import { useContext, useMemo } from 'react';
import { AnalyticsContext } from '@/contexts/AnalyticsContext';
import type {
  AnalyticsNavigationState,
  NavigationAction,
  TemporalPosition,
  CategoryPosition,
  ChartMode,
  DrillDownMode,
  TemporalLevel,
  CategoryLevel,
} from '@/types/analytics';

/**
 * Return type for useAnalyticsNavigation hook.
 * Provides typed access to state, dispatch, and convenience selectors.
 */
export interface UseAnalyticsNavigationReturn {
  /** Complete navigation state */
  state: AnalyticsNavigationState;
  /** Dispatch function for navigation actions */
  dispatch: React.Dispatch<NavigationAction>;

  // Convenience selectors (memoized)
  /** Current temporal position */
  temporal: TemporalPosition;
  /** Current category filter */
  category: CategoryPosition;
  /** Current chart mode */
  chartMode: ChartMode;
  /** Current drill-down mode (Story 7.16) */
  drillDownMode: DrillDownMode;

  // Level accessors
  /** Current temporal level (year, quarter, month, week, day) */
  temporalLevel: TemporalLevel;
  /** Current category level (all, category, group, subcategory) */
  categoryLevel: CategoryLevel;

  // Boolean helpers
  /** True if at year level (no temporal drill-down) */
  isYearLevel: boolean;
  /** True if category filter is active (not 'all') */
  hasCategoryFilter: boolean;
  /** True if in comparison chart mode */
  isComparisonMode: boolean;
}

/**
 * Hook for accessing analytics navigation context.
 *
 * IMPORTANT: Must be used within an AnalyticsProvider.
 * Throws a helpful error if used outside the provider.
 *
 * @example
 * function MyComponent() {
 *   const { temporal, dispatch, isYearLevel } = useAnalyticsNavigation();
 *
 *   const handleDrillDown = () => {
 *     dispatch({ type: 'SET_TEMPORAL_LEVEL', payload: { level: 'quarter', year: '2024', quarter: 'Q4' } });
 *   };
 *
 *   return <div>Current year: {temporal.year}</div>;
 * }
 *
 * @throws Error if used outside AnalyticsProvider
 */
export function useAnalyticsNavigation(): UseAnalyticsNavigationReturn {
  const context = useContext(AnalyticsContext);

  if (context === null) {
    throw new Error(
      'useAnalyticsNavigation must be used within an AnalyticsProvider. ' +
        'Wrap your component tree with <AnalyticsProvider> from src/contexts/AnalyticsContext.tsx'
    );
  }

  const { state, dispatch } = context;

  // Memoized selectors to prevent unnecessary recalculations
  const selectors = useMemo(
    () => ({
      temporal: state.temporal,
      category: state.category,
      chartMode: state.chartMode,
      drillDownMode: state.drillDownMode, // Story 7.16
      temporalLevel: state.temporal.level,
      categoryLevel: state.category.level,
      isYearLevel: state.temporal.level === 'year',
      hasCategoryFilter: state.category.level !== 'all',
      isComparisonMode: state.chartMode === 'comparison',
    }),
    [state]
  );

  return {
    state,
    dispatch,
    ...selectors,
  };
}

/**
 * Type guard to check if a temporal level allows comparison mode.
 * Day level does not support comparison (no children to compare).
 */
export function supportsComparisonMode(level: TemporalLevel): boolean {
  return level !== 'day';
}

/**
 * Get the parent temporal level for breadcrumb navigation.
 * Returns null if already at year level.
 */
export function getParentTemporalLevel(level: TemporalLevel): TemporalLevel | null {
  switch (level) {
    case 'day':
      return 'week';
    case 'week':
      return 'month';
    case 'month':
      return 'quarter';
    case 'quarter':
      return 'year';
    case 'year':
      return null;
    default:
      return null;
  }
}

/**
 * Get the child temporal level for drill-down navigation.
 * Returns null if already at day level.
 */
export function getChildTemporalLevel(level: TemporalLevel): TemporalLevel | null {
  switch (level) {
    case 'year':
      return 'quarter';
    case 'quarter':
      return 'month';
    case 'month':
      return 'week';
    case 'week':
      return 'day';
    case 'day':
      return null;
    default:
      return null;
  }
}

/**
 * Get the parent category level for breadcrumb navigation.
 * Returns null if already at 'all' level.
 */
export function getParentCategoryLevel(level: CategoryLevel): CategoryLevel | null {
  switch (level) {
    case 'subcategory':
      return 'group';
    case 'group':
      return 'category';
    case 'category':
      return 'all';
    case 'all':
      return null;
    default:
      return null;
  }
}

/**
 * Get the child category level for drill-down navigation.
 * Returns null if already at subcategory level.
 */
export function getChildCategoryLevel(level: CategoryLevel): CategoryLevel | null {
  switch (level) {
    case 'all':
      return 'category';
    case 'category':
      return 'group';
    case 'group':
      return 'subcategory';
    case 'subcategory':
      return null;
    default:
      return null;
  }
}
