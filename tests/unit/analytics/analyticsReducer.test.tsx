/**
 * Analytics Store Unit Tests
 *
 * Tests for the analytics Zustand store actions and state management.
 * Migrated from AnalyticsContext reducer tests to Zustand store tests (Story 15b-3f).
 *
 * Story 7.1 - Analytics Navigation Context
 * AC #1: Store initializes navigation state with current year, "all categories", and aggregation mode
 * AC #2: State includes temporal, category, and chartMode
 * AC #3: Actions available: setTemporalLevel, setCategoryFilter, toggleChartMode, resetToYear, clearCategoryFilter
 * AC #6: Temporal and category filters work independently (dual-axis independence)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalyticsStore } from '@features/analytics/stores/useAnalyticsStore';
import { useAnalyticsNavigation } from '@features/analytics/hooks/useAnalyticsNavigation';
import { getDefaultNavigationState } from '@features/analytics/utils/analyticsHelpers';
import type { AnalyticsNavigationState } from '../../../src/types/analytics';

beforeEach(() => {
  useAnalyticsStore.setState(getDefaultNavigationState('2024'));
});

describe('Analytics Store - Initial State', () => {
  it('AC #1: initializes with current year, all categories, and aggregation mode', () => {
    // Reset to current year for this test
    const currentYear = new Date().getFullYear().toString();
    useAnalyticsStore.setState(getDefaultNavigationState(currentYear));

    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.state.temporal.level).toBe('year');
    expect(result.current.state.temporal.year).toBe(currentYear);
    expect(result.current.state.category.level).toBe('all');
    expect(result.current.state.chartMode).toBe('aggregation');
  });

  it('AC #2: state shape includes temporal, category, and chartMode', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.state).toHaveProperty('temporal');
    expect(result.current.state).toHaveProperty('category');
    expect(result.current.state).toHaveProperty('chartMode');

    // Temporal has required properties
    expect(result.current.state.temporal).toHaveProperty('level');
    expect(result.current.state.temporal).toHaveProperty('year');

    // Category has required properties
    expect(result.current.state.category).toHaveProperty('level');
  });

  it('accepts custom initial state via setState', () => {
    const customState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'category', category: 'Food' },
      chartMode: 'comparison',
      drillDownMode: 'temporal',
    };

    useAnalyticsStore.setState(customState);

    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.state.temporal).toEqual(customState.temporal);
    expect(result.current.state.category).toEqual(customState.category);
    expect(result.current.state.chartMode).toBe(customState.chartMode);
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

    useAnalyticsStore.setState(thisMonthState);

    const { result } = renderHook(() => useAnalyticsNavigation());

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

describe('Analytics Store - SET_TEMPORAL_LEVEL Action', () => {
  it('AC #3: updates temporal position', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch(
        { type: 'SET_TEMPORAL_LEVEL', payload: { level: 'quarter', year: '2024', quarter: 'Q4' } }
      );
    });

    expect(result.current.state.temporal.level).toBe('quarter');
    expect(result.current.state.temporal.year).toBe('2024');
    expect(result.current.state.temporal.quarter).toBe('Q4');
  });

  it('AC #6: changing temporal PRESERVES category filter (dual-axis independence)', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'year', year: '2024' },
      category: { level: 'category', category: 'Food' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    // Change temporal to quarter
    act(() => {
      result.current.dispatch(
        { type: 'SET_TEMPORAL_LEVEL', payload: { level: 'quarter', year: '2024', quarter: 'Q4' } }
      );
    });

    // Category should be preserved
    expect(result.current.state.category.level).toBe('category');
    expect(result.current.state.category.category).toBe('Food');
  });

  it('can drill down to month level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch(
        { type: 'SET_TEMPORAL_LEVEL', payload: {
          level: 'month',
          year: '2024',
          quarter: 'Q4',
          month: '2024-10',
        } }
      );
    });

    expect(result.current.state.temporal.level).toBe('month');
    expect(result.current.state.temporal.month).toBe('2024-10');
  });

  it('can drill down to week level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch(
        { type: 'SET_TEMPORAL_LEVEL', payload: {
          level: 'week',
          year: '2024',
          quarter: 'Q4',
          month: '2024-10',
          week: 2,
        } }
      );
    });

    expect(result.current.state.temporal.level).toBe('week');
    expect(result.current.state.temporal.week).toBe(2);
  });

  it('can drill down to day level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch(
        { type: 'SET_TEMPORAL_LEVEL', payload: {
          level: 'day',
          year: '2024',
          quarter: 'Q4',
          month: '2024-10',
          week: 2,
          day: '2024-10-15',
        } }
      );
    });

    expect(result.current.state.temporal.level).toBe('day');
    expect(result.current.state.temporal.day).toBe('2024-10-15');
  });
});

describe('Analytics Store - SET_CATEGORY_FILTER Action', () => {
  it('AC #3: updates category filter', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch(
        { type: 'SET_CATEGORY_FILTER', payload: { level: 'category', category: 'Food' } }
      );
    });

    expect(result.current.state.category.level).toBe('category');
    expect(result.current.state.category.category).toBe('Food');
  });

  it('AC #6: changing category PRESERVES temporal position (dual-axis independence)', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    // Change category filter
    act(() => {
      result.current.dispatch(
        { type: 'SET_CATEGORY_FILTER', payload: { level: 'category', category: 'Food' } }
      );
    });

    // Temporal should be preserved
    expect(result.current.state.temporal.level).toBe('month');
    expect(result.current.state.temporal.month).toBe('2024-10');
  });

  it('can filter to group level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch(
        { type: 'SET_CATEGORY_FILTER', payload: {
          level: 'group',
          category: 'Food',
          group: 'Groceries',
        } }
      );
    });

    expect(result.current.state.category.level).toBe('group');
    expect(result.current.state.category.group).toBe('Groceries');
  });

  it('can filter to subcategory level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch(
        { type: 'SET_CATEGORY_FILTER', payload: {
          level: 'subcategory',
          category: 'Food',
          group: 'Groceries',
          subcategory: 'Meats',
        } }
      );
    });

    expect(result.current.state.category.level).toBe('subcategory');
    expect(result.current.state.category.subcategory).toBe('Meats');
  });
});

describe('Analytics Store - TOGGLE_CHART_MODE Action', () => {
  it('AC #3: toggles from aggregation to comparison', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.state.chartMode).toBe('aggregation');

    act(() => {
      result.current.dispatch({ type: 'TOGGLE_CHART_MODE' });
    });

    expect(result.current.state.chartMode).toBe('comparison');
  });

  it('AC #3: toggles from comparison to aggregation', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'comparison',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch({ type: 'TOGGLE_CHART_MODE' });
    });

    expect(result.current.state.chartMode).toBe('aggregation');
  });

  it('toggling chart mode preserves temporal and category', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'category', category: 'Food' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch({ type: 'TOGGLE_CHART_MODE' });
    });

    // Both axes should be preserved
    expect(result.current.state.temporal.month).toBe('2024-10');
    expect(result.current.state.category.category).toBe('Food');
  });
});

describe('Analytics Store - RESET_TO_YEAR Action', () => {
  it('AC #3: resets temporal to year level', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch({ type: 'RESET_TO_YEAR', payload: { year: '2024' } });
    });

    expect(result.current.state.temporal.level).toBe('year');
    expect(result.current.state.temporal.year).toBe('2024');
    expect(result.current.state.temporal.quarter).toBeUndefined();
    expect(result.current.state.temporal.month).toBeUndefined();
  });

  it('AC #6: RESET_TO_YEAR preserves category filter (dual-axis independence)', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 2 },
      category: { level: 'group', category: 'Food', group: 'Groceries' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch({ type: 'RESET_TO_YEAR', payload: { year: '2024' } });
    });

    // Temporal reset
    expect(result.current.state.temporal.level).toBe('year');

    // Category preserved
    expect(result.current.state.category.level).toBe('group');
    expect(result.current.state.category.group).toBe('Groceries');
  });

  it('can reset to a different year', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch({ type: 'RESET_TO_YEAR', payload: { year: '2023' } });
    });

    expect(result.current.state.temporal.year).toBe('2023');
  });
});

describe('Analytics Store - CLEAR_CATEGORY_FILTER Action', () => {
  it('AC #3: clears category filter to "all"', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'year', year: '2024' },
      category: { level: 'subcategory', category: 'Food', group: 'Groceries', subcategory: 'Meats' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch({ type: 'CLEAR_CATEGORY_FILTER' });
    });

    expect(result.current.state.category.level).toBe('all');
    expect(result.current.state.category.category).toBeUndefined();
    expect(result.current.state.category.group).toBeUndefined();
    expect(result.current.state.category.subcategory).toBeUndefined();
  });

  it('AC #6: CLEAR_CATEGORY_FILTER preserves temporal position (dual-axis independence)', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 2 },
      category: { level: 'category', category: 'Food' },
      chartMode: 'comparison',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    act(() => {
      result.current.dispatch({ type: 'CLEAR_CATEGORY_FILTER' });
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

describe('Analytics Store - Dual-Axis Independence Complex Scenarios', () => {
  it('changing temporal then category maintains independence', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    // Drill into quarter
    act(() => {
      result.current.dispatch(
        { type: 'SET_TEMPORAL_LEVEL', payload: { level: 'quarter', year: '2024', quarter: 'Q4' } }
      );
    });

    // Add category filter
    act(() => {
      result.current.dispatch(
        { type: 'SET_CATEGORY_FILTER', payload: { level: 'category', category: 'Food' } }
      );
    });

    // Drill further into month
    act(() => {
      result.current.dispatch(
        { type: 'SET_TEMPORAL_LEVEL', payload: {
          level: 'month',
          year: '2024',
          quarter: 'Q4',
          month: '2024-10',
        } }
      );
    });

    // Verify both are at expected positions
    expect(result.current.state.temporal.level).toBe('month');
    expect(result.current.state.temporal.month).toBe('2024-10');
    expect(result.current.state.category.level).toBe('category');
    expect(result.current.state.category.category).toBe('Food');
  });

  it('multiple category changes preserve temporal', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    // Filter to Food
    act(() => {
      result.current.dispatch(
        { type: 'SET_CATEGORY_FILTER', payload: { level: 'category', category: 'Food' } }
      );
    });

    // Drill to Groceries
    act(() => {
      result.current.dispatch(
        { type: 'SET_CATEGORY_FILTER', payload: {
          level: 'group',
          category: 'Food',
          group: 'Groceries',
        } }
      );
    });

    // Change to different category entirely
    act(() => {
      result.current.dispatch(
        { type: 'SET_CATEGORY_FILTER', payload: { level: 'category', category: 'Transport' } }
      );
    });

    // Temporal should still be October
    expect(result.current.state.temporal.level).toBe('month');
    expect(result.current.state.temporal.month).toBe('2024-10');
    expect(result.current.state.category.category).toBe('Transport');
  });
});

describe('Analytics Store - Direct Store Actions', () => {
  it('setTemporalLevel updates temporal via store action', () => {
    useAnalyticsStore.getState().setTemporalLevel({ level: 'quarter', year: '2024', quarter: 'Q4' });

    const state = useAnalyticsStore.getState();
    expect(state.temporal.level).toBe('quarter');
    expect(state.temporal.quarter).toBe('Q4');
  });

  it('setCategoryFilter updates category via store action', () => {
    useAnalyticsStore.getState().setCategoryFilter({ level: 'category', category: 'Food' });

    const state = useAnalyticsStore.getState();
    expect(state.category.level).toBe('category');
    expect(state.category.category).toBe('Food');
  });

  it('toggleChartMode toggles via store action', () => {
    expect(useAnalyticsStore.getState().chartMode).toBe('aggregation');

    useAnalyticsStore.getState().toggleChartMode();

    expect(useAnalyticsStore.getState().chartMode).toBe('comparison');
  });

  it('resetToYear resets temporal via store action', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
    });

    useAnalyticsStore.getState().resetToYear('2024');

    const state = useAnalyticsStore.getState();
    expect(state.temporal.level).toBe('year');
    expect(state.temporal.year).toBe('2024');
  });

  it('clearCategoryFilter clears via store action', () => {
    useAnalyticsStore.setState({
      category: { level: 'category', category: 'Food' },
    });

    useAnalyticsStore.getState().clearCategoryFilter();

    expect(useAnalyticsStore.getState().category.level).toBe('all');
  });
});
