/**
 * useHistoryFilters Hook
 *
 * Custom hook for accessing history filter state and dispatch.
 * This is the ONLY way components should access HistoryFiltersContext.
 *
 * Story 9.19: History Transaction Filters
 * @see docs/sprint-artifacts/epic9/story-9.19-history-transaction-filters.md
 */

import { useContext, useMemo, useCallback } from 'react';
import {
  HistoryFiltersContext,
  type HistoryFilterState,
  type HistoryFilterAction,
  type TemporalFilterState,
  type CategoryFilterState,
  type LocationFilterState,
} from '../contexts/HistoryFiltersContext';
import {
  getNextTemporalPeriod,
  getPrevTemporalPeriod,
} from '../utils/historyFilterUtils';

/**
 * Return type for useHistoryFilters hook.
 */
export interface UseHistoryFiltersReturn {
  /** Complete filter state */
  state: HistoryFilterState;
  /** Dispatch function for filter actions */
  dispatch: React.Dispatch<HistoryFilterAction>;

  // Convenience selectors (memoized)
  /** Current temporal filter */
  temporal: TemporalFilterState;
  /** Current category filter */
  category: CategoryFilterState;
  /** Current location filter */
  location: LocationFilterState;

  // Boolean helpers
  /** True if any filter is active */
  hasActiveFilters: boolean;
  /** Count of active filters (0-3) */
  activeFilterCount: number;
  /** True if temporal filter is active */
  hasTemporalFilter: boolean;
  /** True if category filter is active */
  hasCategoryFilter: boolean;
  /** True if location filter is active */
  hasLocationFilter: boolean;

  // Time navigation helpers (Story 14.9)
  /** Navigate to next time period at current granularity level */
  goNextPeriod: () => void;
  /** Navigate to previous time period at current granularity level */
  goPrevPeriod: () => void;
  /** True if can navigate to next period */
  canGoNext: boolean;
  /** True if can navigate to previous period */
  canGoPrev: boolean;
}

/**
 * Hook for accessing history filters context.
 *
 * IMPORTANT: Must be used within a HistoryFiltersProvider.
 *
 * @example
 * function MyComponent() {
 *   const { temporal, hasActiveFilters, dispatch } = useHistoryFilters();
 *
 *   const handleClear = () => {
 *     dispatch({ type: 'CLEAR_ALL_FILTERS' });
 *   };
 *
 *   return <div>Filters active: {hasActiveFilters ? 'Yes' : 'No'}</div>;
 * }
 *
 * @throws Error if used outside HistoryFiltersProvider
 */
export function useHistoryFilters(): UseHistoryFiltersReturn {
  const context = useContext(HistoryFiltersContext);

  if (context === null) {
    throw new Error(
      'useHistoryFilters must be used within a HistoryFiltersProvider. ' +
        'Wrap your component tree with <HistoryFiltersProvider> from src/contexts/HistoryFiltersContext.tsx'
    );
  }

  const { state, dispatch } = context;

  // Memoized selectors to prevent unnecessary recalculations (AC #7)
  const selectors = useMemo(() => {
    const hasTemporalFilter = state.temporal.level !== 'all';
    const hasCategoryFilter = state.category.level !== 'all';
    const hasLocationFilter = Boolean(state.location.country);

    let activeFilterCount = 0;
    if (hasTemporalFilter) activeFilterCount++;
    if (hasCategoryFilter) activeFilterCount++;
    if (hasLocationFilter) activeFilterCount++;

    // Story 14.9: Calculate if navigation is possible
    const canGoNext = getNextTemporalPeriod(state.temporal) !== null;
    const canGoPrev = getPrevTemporalPeriod(state.temporal) !== null;

    return {
      temporal: state.temporal,
      category: state.category,
      location: state.location,
      hasTemporalFilter,
      hasCategoryFilter,
      hasLocationFilter,
      hasActiveFilters: activeFilterCount > 0,
      activeFilterCount,
      canGoNext,
      canGoPrev,
    };
  }, [state]);

  // Story 14.9: Time period navigation helpers
  const goNextPeriod = useCallback(() => {
    const nextPeriod = getNextTemporalPeriod(state.temporal);
    if (nextPeriod) {
      dispatch({ type: 'SET_TEMPORAL_FILTER', payload: nextPeriod });
    }
  }, [state.temporal, dispatch]);

  const goPrevPeriod = useCallback(() => {
    const prevPeriod = getPrevTemporalPeriod(state.temporal);
    if (prevPeriod) {
      dispatch({ type: 'SET_TEMPORAL_FILTER', payload: prevPeriod });
    }
  }, [state.temporal, dispatch]);

  return {
    state,
    dispatch,
    ...selectors,
    goNextPeriod,
    goPrevPeriod,
  };
}

/**
 * Get formatted label for temporal filter display.
 * @param temporal - Current temporal filter state
 * @param locale - Locale for date formatting ('en' | 'es')
 * @returns Human-readable label for the filter
 */
export function getTemporalFilterLabel(
  temporal: TemporalFilterState,
  locale: string = 'en'
): string {
  if (temporal.level === 'all') {
    return locale === 'es' ? 'Todo el tiempo' : 'All time';
  }

  const parts: string[] = [];

  if (temporal.year) {
    parts.push(temporal.year);
  }

  if (temporal.month) {
    const [, monthNum] = temporal.month.split('-');
    const date = new Date(2024, parseInt(monthNum, 10) - 1, 1);
    const monthName = date.toLocaleDateString(
      locale === 'es' ? 'es-ES' : 'en-US',
      { month: 'short' }
    );
    parts.push(monthName);
  }

  if (temporal.week !== undefined) {
    parts.push(`W${temporal.week}`);
  }

  if (temporal.day) {
    const dayNum = temporal.day.split('-')[2];
    parts.push(dayNum);
  }

  return parts.join(' > ');
}

/**
 * Get formatted label for category filter display.
 * @param category - Current category filter state
 * @param t - Translation function
 * @returns Human-readable label for the filter
 */
export function getCategoryFilterLabel(
  category: CategoryFilterState,
  t: (key: string) => string
): string {
  if (category.level === 'all') {
    return t('allCategories');
  }

  const parts: string[] = [];

  if (category.category) {
    parts.push(category.category);
  }

  if (category.group) {
    parts.push(category.group);
  }

  if (category.subcategory) {
    parts.push(category.subcategory);
  }

  return parts.join(' > ');
}

/**
 * Get formatted label for location filter display.
 * @param location - Current location filter state
 * @param t - Translation function
 * @returns Human-readable label for the filter
 */
export function getLocationFilterLabel(
  location: LocationFilterState,
  t: (key: string) => string
): string {
  if (!location.country) {
    return t('allLocations');
  }

  if (location.city) {
    return `${location.country} > ${location.city}`;
  }

  return location.country;
}
