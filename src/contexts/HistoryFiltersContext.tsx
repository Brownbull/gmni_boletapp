/**
 * History Filters Context
 *
 * Single source of truth for history filtering state.
 * All history filter components should consume this via useHistoryFilters() hook.
 *
 * Story 9.19: History Transaction Filters
 * @see docs/sprint-artifacts/epic9/story-9.19-history-transaction-filters.md
 */

import React, { createContext, useReducer, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Temporal filter state for filtering by time period.
 * Hierarchical: All → Year → Quarter → Month → Week → Day
 * Story 9.19: Initial implementation (Year → Month → Week → Day)
 * Story 9.20: Added quarter level for analytics navigation
 */
export interface TemporalFilterState {
  level: 'all' | 'year' | 'quarter' | 'month' | 'week' | 'day';
  year?: string;      // "2024"
  quarter?: string;   // "Q1", "Q2", "Q3", "Q4" (Story 9.20)
  month?: string;     // "2024-12"
  week?: number;      // 1-5 (week within month)
  day?: string;       // "2024-12-15"
  /** Story 14.16: Date range for ISO week filtering (used by Reports navigation) */
  dateRange?: { start: string; end: string }; // "2024-12-30" format
}

/**
 * Category filter state for filtering by spending category.
 * Hierarchical: All → Store Category → Item Group → Subcategory
 */
export interface CategoryFilterState {
  level: 'all' | 'category' | 'group' | 'subcategory';
  category?: string;    // Store category (e.g., "Supermarket")
  group?: string;       // Item group (e.g., "Produce")
  subcategory?: string; // Item subcategory (e.g., "Fruits")
}

/**
 * Location filter state for filtering by country/city.
 * Two-level hierarchy: Country → City
 */
export interface LocationFilterState {
  country?: string;   // "Chile"
  city?: string;      // "Santiago"
}

/**
 * Group filter state for filtering by custom transaction groups.
 * Story 14.15b: Transaction Selection Mode & Groups
 * Supports multi-select (comma-separated group IDs like category filter)
 */
export interface GroupFilterState {
  /** Comma-separated group IDs to filter by, or undefined for no filter */
  groupIds?: string;
}

/**
 * Complete history filter state.
 */
export interface HistoryFilterState {
  temporal: TemporalFilterState;
  category: CategoryFilterState;
  location: LocationFilterState;
  /** Story 14.15b: Group filter for custom transaction groups */
  group: GroupFilterState;
}

/**
 * Filter actions for the history reducer.
 */
export type HistoryFilterAction =
  | { type: 'SET_TEMPORAL_FILTER'; payload: TemporalFilterState }
  | { type: 'SET_CATEGORY_FILTER'; payload: CategoryFilterState }
  | { type: 'SET_LOCATION_FILTER'; payload: LocationFilterState }
  | { type: 'SET_GROUP_FILTER'; payload: GroupFilterState }
  | { type: 'CLEAR_TEMPORAL' }
  | { type: 'CLEAR_CATEGORY' }
  | { type: 'CLEAR_LOCATION' }
  | { type: 'CLEAR_GROUP' }
  | { type: 'CLEAR_ALL_FILTERS' };

/**
 * Context value provided by HistoryFiltersProvider.
 */
export interface HistoryFiltersContextValue {
  state: HistoryFilterState;
  dispatch: React.Dispatch<HistoryFilterAction>;
}

// ============================================================================
// Context Creation
// ============================================================================

/**
 * History Filters Context - provides filter state and dispatch.
 * Do not use useContext(HistoryFiltersContext) directly.
 * Use the useHistoryFilters() hook instead.
 */
export const HistoryFiltersContext = createContext<HistoryFiltersContextValue | null>(null);

// ============================================================================
// Initial State
// ============================================================================

/**
 * Get default filter state - all filters cleared.
 */
export function getDefaultFilterState(): HistoryFilterState {
  return {
    temporal: { level: 'all' },
    category: { level: 'all' },
    location: {},
    group: {},
  };
}

// ============================================================================
// Reducer Logic
// ============================================================================

/**
 * History filters reducer.
 * CRITICAL: Filters are independent - changing one doesn't reset others (AC #5).
 */
function historyFiltersReducer(
  state: HistoryFilterState,
  action: HistoryFilterAction
): HistoryFilterState {
  switch (action.type) {
    case 'SET_TEMPORAL_FILTER':
      // Update temporal while PRESERVING other filters (filter independence)
      return {
        ...state,
        temporal: action.payload,
      };

    case 'SET_CATEGORY_FILTER':
      // Update category while PRESERVING other filters (filter independence)
      return {
        ...state,
        category: action.payload,
      };

    case 'SET_LOCATION_FILTER':
      // Update location while PRESERVING other filters (filter independence)
      return {
        ...state,
        location: action.payload,
      };

    case 'CLEAR_TEMPORAL':
      return {
        ...state,
        temporal: { level: 'all' },
      };

    case 'CLEAR_CATEGORY':
      return {
        ...state,
        category: { level: 'all' },
      };

    case 'CLEAR_LOCATION':
      return {
        ...state,
        location: {},
      };

    case 'SET_GROUP_FILTER':
      // Story 14.15b: Update group while PRESERVING other filters
      return {
        ...state,
        group: action.payload,
      };

    case 'CLEAR_GROUP':
      return {
        ...state,
        group: {},
      };

    case 'CLEAR_ALL_FILTERS':
      return getDefaultFilterState();

    default:
      return state;
  }
}

// ============================================================================
// Provider Component
// ============================================================================

interface HistoryFiltersProviderProps {
  children: React.ReactNode;
  /**
   * Optional initial state for testing purposes.
   */
  initialState?: HistoryFilterState;
}

/**
 * History Filters Provider Component
 *
 * Wraps the HistoryView to provide filter state.
 *
 * @example
 * <HistoryFiltersProvider>
 *   <HistoryView />
 * </HistoryFiltersProvider>
 */
export function HistoryFiltersProvider({
  children,
  initialState,
}: HistoryFiltersProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(
    historyFiltersReducer,
    initialState ?? getDefaultFilterState()
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<HistoryFiltersContextValue>(
    () => ({ state, dispatch }),
    [state]
  );

  return (
    <HistoryFiltersContext.Provider value={contextValue}>
      {children}
    </HistoryFiltersContext.Provider>
  );
}

// ============================================================================
// Action Creators
// ============================================================================

/**
 * Creates a SET_TEMPORAL_FILTER action.
 */
export function setTemporalFilter(payload: TemporalFilterState): HistoryFilterAction {
  return { type: 'SET_TEMPORAL_FILTER', payload };
}

/**
 * Creates a SET_CATEGORY_FILTER action.
 */
export function setCategoryFilter(payload: CategoryFilterState): HistoryFilterAction {
  return { type: 'SET_CATEGORY_FILTER', payload };
}

/**
 * Creates a SET_LOCATION_FILTER action.
 */
export function setLocationFilter(payload: LocationFilterState): HistoryFilterAction {
  return { type: 'SET_LOCATION_FILTER', payload };
}

/**
 * Creates a SET_GROUP_FILTER action.
 * Story 14.15b: Transaction Selection Mode & Groups
 */
export function setGroupFilter(payload: GroupFilterState): HistoryFilterAction {
  return { type: 'SET_GROUP_FILTER', payload };
}

/**
 * Creates a CLEAR_ALL_FILTERS action.
 */
export function clearAllFilters(): HistoryFilterAction {
  return { type: 'CLEAR_ALL_FILTERS' };
}
