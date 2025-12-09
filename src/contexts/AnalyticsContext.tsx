/**
 * Analytics Context
 *
 * Single source of truth for analytics navigation state.
 * All analytics components should consume this via useAnalyticsNavigation() hook.
 *
 * @see docs/architecture-epic7.md - ADR-010: React Context for Analytics State Management
 */

import React, { createContext, useReducer, useMemo } from 'react';
import type {
  AnalyticsNavigationState,
  AnalyticsContextValue,
  NavigationAction,
  TemporalPosition,
  CategoryPosition,
} from '../types/analytics';
import {
  validateNavigationState,
  getDefaultNavigationState,
  getCurrentYear,
} from '../utils/analyticsHelpers';

// ============================================================================
// Context Creation
// ============================================================================

/**
 * Analytics Context - provides navigation state and dispatch.
 *
 * IMPORTANT: Do not use useContext(AnalyticsContext) directly.
 * Use the useAnalyticsNavigation() hook instead for proper error handling.
 */
export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

// ============================================================================
// Reducer Logic
// ============================================================================

/**
 * Analytics navigation reducer.
 *
 * CRITICAL: Implements dual-axis independence:
 * - Temporal changes preserve category filter
 * - Category changes preserve temporal position
 */
function analyticsReducer(
  state: AnalyticsNavigationState,
  action: NavigationAction
): AnalyticsNavigationState {
  let newState: AnalyticsNavigationState;

  switch (action.type) {
    case 'SET_TEMPORAL_LEVEL':
      // Update temporal while PRESERVING category (dual-axis independence)
      newState = {
        ...state,
        temporal: action.payload,
      };
      break;

    case 'SET_CATEGORY_FILTER':
      // Update category while PRESERVING temporal (dual-axis independence)
      newState = {
        ...state,
        category: action.payload,
      };
      break;

    case 'TOGGLE_CHART_MODE':
      // Toggle between aggregation and comparison modes
      newState = {
        ...state,
        chartMode: state.chartMode === 'aggregation' ? 'comparison' : 'aggregation',
      };
      break;

    case 'RESET_TO_YEAR':
      // Reset temporal to year level while PRESERVING category (dual-axis independence)
      newState = {
        ...state,
        temporal: {
          level: 'year',
          year: action.payload.year,
        },
      };
      break;

    case 'CLEAR_CATEGORY_FILTER':
      // Clear category filter while PRESERVING temporal (dual-axis independence)
      newState = {
        ...state,
        category: { level: 'all' },
      };
      break;

    case 'TOGGLE_DRILLDOWN_MODE':
      // Story 7.16: Toggle between temporal and category drill-down cards
      // Independent from chart mode (AC #7)
      newState = {
        ...state,
        drillDownMode: state.drillDownMode === 'temporal' ? 'category' : 'temporal',
      };
      break;

    default:
      // TypeScript exhaustiveness check
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
  }

  // Validate state after every action to catch impossible states
  return validateNavigationState(newState);
}

/**
 * Get initial state for the analytics context.
 * Initializes to current year, 'all' categories, and aggregation mode.
 */
function getInitialState(): AnalyticsNavigationState {
  return getDefaultNavigationState(getCurrentYear());
}

// ============================================================================
// Provider Component
// ============================================================================

interface AnalyticsProviderProps {
  children: React.ReactNode;
  /**
   * Optional initial state for testing purposes.
   * If not provided, defaults to current year with no filters.
   */
  initialState?: AnalyticsNavigationState;
}

/**
 * Analytics Provider Component
 *
 * Wraps the application (or analytics section) to provide navigation state.
 *
 * @example
 * // In App.tsx
 * <AnalyticsProvider>
 *   <TrendsView />
 * </AnalyticsProvider>
 *
 * @example
 * // In tests with custom initial state
 * <AnalyticsProvider initialState={{ temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' }, category: { level: 'all' }, chartMode: 'aggregation' }}>
 *   <ComponentUnderTest />
 * </AnalyticsProvider>
 */
export function AnalyticsProvider({
  children,
  initialState,
}: AnalyticsProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(
    analyticsReducer,
    initialState ?? getInitialState()
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AnalyticsContextValue>(
    () => ({ state, dispatch }),
    [state]
  );

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ============================================================================
// Action Creators (optional convenience functions)
// ============================================================================

/**
 * Creates a SET_TEMPORAL_LEVEL action.
 *
 * @example
 * dispatch(setTemporalLevel({ level: 'quarter', year: '2024', quarter: 'Q4' }));
 */
export function setTemporalLevel(payload: TemporalPosition): NavigationAction {
  return { type: 'SET_TEMPORAL_LEVEL', payload };
}

/**
 * Creates a SET_CATEGORY_FILTER action.
 *
 * @example
 * dispatch(setCategoryFilter({ level: 'category', category: 'Food' }));
 */
export function setCategoryFilter(payload: CategoryPosition): NavigationAction {
  return { type: 'SET_CATEGORY_FILTER', payload };
}

/**
 * Creates a TOGGLE_CHART_MODE action.
 *
 * @example
 * dispatch(toggleChartMode());
 */
export function toggleChartMode(): NavigationAction {
  return { type: 'TOGGLE_CHART_MODE' };
}

/**
 * Creates a RESET_TO_YEAR action.
 *
 * @example
 * dispatch(resetToYear('2024'));
 */
export function resetToYear(year: string): NavigationAction {
  return { type: 'RESET_TO_YEAR', payload: { year } };
}

/**
 * Creates a CLEAR_CATEGORY_FILTER action.
 *
 * @example
 * dispatch(clearCategoryFilter());
 */
export function clearCategoryFilter(): NavigationAction {
  return { type: 'CLEAR_CATEGORY_FILTER' };
}

/**
 * Creates a TOGGLE_DRILLDOWN_MODE action.
 * Story 7.16: Toggle between temporal and category drill-down cards.
 *
 * @example
 * dispatch(toggleDrillDownMode());
 */
export function toggleDrillDownMode(): NavigationAction {
  return { type: 'TOGGLE_DRILLDOWN_MODE' };
}
