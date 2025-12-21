/**
 * Analytics Reducer Unit Tests
 *
 * Tests for the analytics context reducer and state management.
 *
 * Story 7.1 - Analytics Navigation Context
 * AC #1: AnalyticsContext provider initializes navigation state with current year, "all categories", and aggregation mode
 * AC #2: State includes temporal, category, and chartMode
 * AC #3: Actions available via dispatch: SET_TEMPORAL_LEVEL, SET_CATEGORY_FILTER, TOGGLE_CHART_MODE, RESET_TO_YEAR, CLEAR_CATEGORY_FILTER
 * AC #6: Temporal and category filters work independently (dual-axis independence)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  AnalyticsProvider,
  setTemporalLevel,
  setCategoryFilter,
  toggleChartMode,
  resetToYear,
  clearCategoryFilter,
} from '../../../src/contexts/AnalyticsContext';
import { useAnalyticsNavigation } from '../../../src/hooks/useAnalyticsNavigation';
import type { AnalyticsNavigationState } from '../../../src/types/analytics';

// Helper to create a wrapper with AnalyticsProvider
function createWrapper(initialState?: AnalyticsNavigationState) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AnalyticsProvider initialState={initialState}>
        {children}
      </AnalyticsProvider>
    );
  };
}

describe('AnalyticsContext - Initial State', () => {
  it('AC #1: initializes with current year, all categories, and aggregation mode', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    const currentYear = new Date().getFullYear().toString();

    expect(result.current.state.temporal.level).toBe('year');
    expect(result.current.state.temporal.year).toBe(currentYear);
    expect(result.current.state.category.level).toBe('all');
    expect(result.current.state.chartMode).toBe('aggregation');
  });

  it('AC #2: state shape includes temporal, category, and chartMode', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state).toHaveProperty('temporal');
    expect(result.current.state).toHaveProperty('category');
    expect(result.current.state).toHaveProperty('chartMode');

    // Temporal has required properties
    expect(result.current.state.temporal).toHaveProperty('level');
    expect(result.current.state.temporal).toHaveProperty('year');

    // Category has required properties
    expect(result.current.state.category).toHaveProperty('level');
  });

  it('accepts custom initial state for testing', () => {
    const customState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'category', category: 'Food' },
      chartMode: 'comparison',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(customState),
    });

    expect(result.current.state).toEqual(customState);
  });

  /**
   * Story 10a.2: This Month Navigation
   * AC #1: Clicking "This Month" card should navigate to Analytics view at month level
   * AC #2: Analytics should be filtered to the current month
   */
  it('AC #1, #2 (Story 10a.2): initializes at month level for "This Month" navigation', () => {
    // Use fixed date for deterministic testing (avoids flakiness at year/quarter boundaries)
    const year = '2024';
    const month = '2024-12';
    const quarter = 'Q4' as const;

    // Simulate the state that App.tsx creates when user clicks "This Month" card
    const thisMonthState: AnalyticsNavigationState = {
      temporal: { level: 'month', year, quarter, month },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(thisMonthState),
    });

    // AC #1: View should be at month level
    expect(result.current.state.temporal.level).toBe('month');

    // AC #2: Should be filtered to the specified month
    expect(result.current.state.temporal.month).toBe(month);
    expect(result.current.state.temporal.year).toBe(year);
    expect(result.current.state.temporal.quarter).toBe(quarter);

    // Verify default state for other properties
    expect(result.current.state.category.level).toBe('all');
    expect(result.current.state.chartMode).toBe('aggregation');
  });
});

describe('AnalyticsContext - SET_TEMPORAL_LEVEL Action', () => {
  it('AC #3: updates temporal position', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch(
        setTemporalLevel({ level: 'quarter', year: '2024', quarter: 'Q4' })
      );
    });

    expect(result.current.state.temporal.level).toBe('quarter');
    expect(result.current.state.temporal.year).toBe('2024');
    expect(result.current.state.temporal.quarter).toBe('Q4');
  });

  it('AC #6: changing temporal PRESERVES category filter (dual-axis independence)', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'category', category: 'Food' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    // Change temporal to quarter
    act(() => {
      result.current.dispatch(
        setTemporalLevel({ level: 'quarter', year: '2024', quarter: 'Q4' })
      );
    });

    // Category should be preserved
    expect(result.current.state.category.level).toBe('category');
    expect(result.current.state.category.category).toBe('Food');
  });

  it('can drill down to month level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch(
        setTemporalLevel({
          level: 'month',
          year: '2024',
          quarter: 'Q4',
          month: '2024-10',
        })
      );
    });

    expect(result.current.state.temporal.level).toBe('month');
    expect(result.current.state.temporal.month).toBe('2024-10');
  });

  it('can drill down to week level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch(
        setTemporalLevel({
          level: 'week',
          year: '2024',
          quarter: 'Q4',
          month: '2024-10',
          week: 2,
        })
      );
    });

    expect(result.current.state.temporal.level).toBe('week');
    expect(result.current.state.temporal.week).toBe(2);
  });

  it('can drill down to day level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch(
        setTemporalLevel({
          level: 'day',
          year: '2024',
          quarter: 'Q4',
          month: '2024-10',
          week: 2,
          day: '2024-10-15',
        })
      );
    });

    expect(result.current.state.temporal.level).toBe('day');
    expect(result.current.state.temporal.day).toBe('2024-10-15');
  });
});

describe('AnalyticsContext - SET_CATEGORY_FILTER Action', () => {
  it('AC #3: updates category filter', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch(
        setCategoryFilter({ level: 'category', category: 'Food' })
      );
    });

    expect(result.current.state.category.level).toBe('category');
    expect(result.current.state.category.category).toBe('Food');
  });

  it('AC #6: changing category PRESERVES temporal position (dual-axis independence)', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    // Change category filter
    act(() => {
      result.current.dispatch(
        setCategoryFilter({ level: 'category', category: 'Food' })
      );
    });

    // Temporal should be preserved
    expect(result.current.state.temporal.level).toBe('month');
    expect(result.current.state.temporal.month).toBe('2024-10');
  });

  it('can filter to group level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch(
        setCategoryFilter({
          level: 'group',
          category: 'Food',
          group: 'Groceries',
        })
      );
    });

    expect(result.current.state.category.level).toBe('group');
    expect(result.current.state.category.group).toBe('Groceries');
  });

  it('can filter to subcategory level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch(
        setCategoryFilter({
          level: 'subcategory',
          category: 'Food',
          group: 'Groceries',
          subcategory: 'Meats',
        })
      );
    });

    expect(result.current.state.category.level).toBe('subcategory');
    expect(result.current.state.category.subcategory).toBe('Meats');
  });
});

describe('AnalyticsContext - TOGGLE_CHART_MODE Action', () => {
  it('AC #3: toggles from aggregation to comparison', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    expect(result.current.state.chartMode).toBe('aggregation');

    act(() => {
      result.current.dispatch(toggleChartMode());
    });

    expect(result.current.state.chartMode).toBe('comparison');
  });

  it('AC #3: toggles from comparison to aggregation', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'comparison',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    act(() => {
      result.current.dispatch(toggleChartMode());
    });

    expect(result.current.state.chartMode).toBe('aggregation');
  });

  it('toggling chart mode preserves temporal and category', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'category', category: 'Food' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    act(() => {
      result.current.dispatch(toggleChartMode());
    });

    // Both axes should be preserved
    expect(result.current.state.temporal.month).toBe('2024-10');
    expect(result.current.state.category.category).toBe('Food');
  });
});

describe('AnalyticsContext - RESET_TO_YEAR Action', () => {
  it('AC #3: resets temporal to year level', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    act(() => {
      result.current.dispatch(resetToYear('2024'));
    });

    expect(result.current.state.temporal.level).toBe('year');
    expect(result.current.state.temporal.year).toBe('2024');
    expect(result.current.state.temporal.quarter).toBeUndefined();
    expect(result.current.state.temporal.month).toBeUndefined();
  });

  it('AC #6: RESET_TO_YEAR preserves category filter (dual-axis independence)', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 2 },
      category: { level: 'group', category: 'Food', group: 'Groceries' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    act(() => {
      result.current.dispatch(resetToYear('2024'));
    });

    // Temporal reset
    expect(result.current.state.temporal.level).toBe('year');

    // Category preserved
    expect(result.current.state.category.level).toBe('group');
    expect(result.current.state.category.group).toBe('Groceries');
  });

  it('can reset to a different year', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.dispatch(resetToYear('2023'));
    });

    expect(result.current.state.temporal.year).toBe('2023');
  });
});

describe('AnalyticsContext - CLEAR_CATEGORY_FILTER Action', () => {
  it('AC #3: clears category filter to "all"', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'subcategory', category: 'Food', group: 'Groceries', subcategory: 'Meats' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    act(() => {
      result.current.dispatch(clearCategoryFilter());
    });

    expect(result.current.state.category.level).toBe('all');
    expect(result.current.state.category.category).toBeUndefined();
    expect(result.current.state.category.group).toBeUndefined();
    expect(result.current.state.category.subcategory).toBeUndefined();
  });

  it('AC #6: CLEAR_CATEGORY_FILTER preserves temporal position (dual-axis independence)', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 2 },
      category: { level: 'category', category: 'Food' },
      chartMode: 'comparison',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    act(() => {
      result.current.dispatch(clearCategoryFilter());
    });

    // Category cleared
    expect(result.current.state.category.level).toBe('all');

    // Temporal preserved
    expect(result.current.state.temporal.level).toBe('week');
    expect(result.current.state.temporal.week).toBe(2);

    // Chart mode also preserved
    expect(result.current.state.chartMode).toBe('comparison');
  });
});

describe('AnalyticsContext - Dual-Axis Independence Complex Scenarios', () => {
  it('changing temporal then category maintains independence', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    // Drill into quarter
    act(() => {
      result.current.dispatch(
        setTemporalLevel({ level: 'quarter', year: '2024', quarter: 'Q4' })
      );
    });

    // Add category filter
    act(() => {
      result.current.dispatch(
        setCategoryFilter({ level: 'category', category: 'Food' })
      );
    });

    // Drill further into month
    act(() => {
      result.current.dispatch(
        setTemporalLevel({
          level: 'month',
          year: '2024',
          quarter: 'Q4',
          month: '2024-10',
        })
      );
    });

    // Verify both are at expected positions
    expect(result.current.state.temporal.level).toBe('month');
    expect(result.current.state.temporal.month).toBe('2024-10');
    expect(result.current.state.category.level).toBe('category');
    expect(result.current.state.category.category).toBe('Food');
  });

  it('multiple category changes preserve temporal', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    // Filter to Food
    act(() => {
      result.current.dispatch(
        setCategoryFilter({ level: 'category', category: 'Food' })
      );
    });

    // Drill to Groceries
    act(() => {
      result.current.dispatch(
        setCategoryFilter({
          level: 'group',
          category: 'Food',
          group: 'Groceries',
        })
      );
    });

    // Change to different category entirely
    act(() => {
      result.current.dispatch(
        setCategoryFilter({ level: 'category', category: 'Transport' })
      );
    });

    // Temporal should still be October
    expect(result.current.state.temporal.level).toBe('month');
    expect(result.current.state.temporal.month).toBe('2024-10');
    expect(result.current.state.category.category).toBe('Transport');
  });
});

describe('AnalyticsContext - Action Creators', () => {
  it('setTemporalLevel creates correct action', () => {
    const action = setTemporalLevel({ level: 'quarter', year: '2024', quarter: 'Q4' });
    expect(action).toEqual({
      type: 'SET_TEMPORAL_LEVEL',
      payload: { level: 'quarter', year: '2024', quarter: 'Q4' },
    });
  });

  it('setCategoryFilter creates correct action', () => {
    const action = setCategoryFilter({ level: 'category', category: 'Food' });
    expect(action).toEqual({
      type: 'SET_CATEGORY_FILTER',
      payload: { level: 'category', category: 'Food' },
    });
  });

  it('toggleChartMode creates correct action', () => {
    const action = toggleChartMode();
    expect(action).toEqual({ type: 'TOGGLE_CHART_MODE' });
  });

  it('resetToYear creates correct action', () => {
    const action = resetToYear('2024');
    expect(action).toEqual({
      type: 'RESET_TO_YEAR',
      payload: { year: '2024' },
    });
  });

  it('clearCategoryFilter creates correct action', () => {
    const action = clearCategoryFilter();
    expect(action).toEqual({ type: 'CLEAR_CATEGORY_FILTER' });
  });
});
