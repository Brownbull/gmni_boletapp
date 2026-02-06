/**
 * History Filters Context
 *
 * Single source of truth for history filtering state.
 * All history filter components should consume this via useHistoryFilters() hook.
 *
 * Story 9.19: History Transaction Filters
 * @see docs/sprint-artifacts/epic9/story-9.19-history-transaction-filters.md
 */

import React, { createContext, useReducer, useMemo, useEffect, useCallback } from 'react';
import { useViewModeFilterSync } from '@/hooks/useViewModeFilterSync';

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
 *
 * Story 14.13a: Extended to support multi-level drill-down filters.
 * - drillDownPath: Accumulated context from analytics drill-down navigation
 * - Allows filtering by store category AND item group simultaneously
 */
export interface CategoryFilterState {
  level: 'all' | 'category' | 'group' | 'subcategory';
  category?: string;    // Store category (e.g., "Supermarket")
  group?: string;       // Item group (e.g., "Produce")
  subcategory?: string; // Item subcategory (e.g., "Fruits")

  /**
   * Story 14.13a: Accumulated drill-down path from TrendsView navigation.
   * Contains all filter dimensions from the drill-down hierarchy.
   * When present, enables multi-dimension filtering (e.g., items in "Supermercado" + "Alimentos Frescos").
   */
  drillDownPath?: {
    storeGroup?: string;     // Store category group (e.g., "food-dining")
    storeCategory?: string;  // Store category (e.g., "Supermercado")
    itemGroup?: string;      // Item category group (e.g., "food-fresh")
    itemCategory?: string;   // Item category (e.g., "Carnes y Mariscos")
    subcategory?: string;    // Subcategory (e.g., "Res")
  };
}

/**
 * Location filter state for filtering by country/city.
 * Two-level hierarchy: Country → City
 *
 * Story 14.36: Extended to support multi-select cities from multiple countries.
 * - selectedCities: Comma-separated city codes (e.g., "santiago,mendoza,lima")
 * - When selectedCities is present, it takes priority over legacy city field
 * - country field is used for display purposes (primary country)
 */
export interface LocationFilterState {
  country?: string;   // "Chile" - Primary country for display
  city?: string;      // "Santiago" - Legacy single-city selection
  /** Story 14.36: Comma-separated city codes for multi-select */
  selectedCities?: string;
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
 * Get the current month in YYYY-MM format.
 * Used as the default temporal filter.
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get default filter state.
 * Story 14.13b: Default temporal filter is current month (not "all time").
 * Users must explicitly clear the temporal filter to see all transactions.
 */
export function getDefaultFilterState(): HistoryFilterState {
  const currentMonth = getCurrentMonth();
  return {
    temporal: {
      level: 'month',
      year: currentMonth.split('-')[0],
      month: currentMonth,
    },
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
  /**
   * Story 14.13b: Callback when filter state changes.
   * Used to sync filter state to parent (App.tsx) for persistence across navigation.
   * This allows filters to persist when viewing a transaction detail and coming back.
   */
  onStateChange?: (state: HistoryFilterState) => void;
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
  onStateChange,
}: HistoryFiltersProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(
    historyFiltersReducer,
    initialState ?? getDefaultFilterState()
  );

  // Story 14d-v2-1-10d: Clear filters when view mode changes
  // AC#3: Filters cleared when switching from Personal to Group mode
  // AC#5: Filters cleared but scroll position preserved
  const handleModeChange = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }, []);

  useViewModeFilterSync(handleModeChange);

  // Story 14.13b: Sync state changes to parent for persistence across navigation
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

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
