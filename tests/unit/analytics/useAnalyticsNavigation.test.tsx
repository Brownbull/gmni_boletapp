/**
 * useAnalyticsNavigation Hook Unit Tests
 *
 * Tests for the custom hook that provides access to analytics store state.
 * Migrated from AnalyticsContext to Zustand store (Story 15b-3f).
 *
 * Story 7.1 - Analytics Navigation Context
 * AC #5: useAnalyticsNavigation() hook provides typed access to context state and dispatch
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalyticsStore } from '@features/analytics/stores/useAnalyticsStore';
import {
  useAnalyticsNavigation,
  supportsComparisonMode,
  getParentTemporalLevel,
  getChildTemporalLevel,
  getParentCategoryLevel,
  getChildCategoryLevel,
} from '@features/analytics/hooks/useAnalyticsNavigation';
import { getDefaultNavigationState } from '@features/analytics/utils/analyticsHelpers';
import type { AnalyticsNavigationState } from '../../../src/types/analytics';

beforeEach(() => {
  useAnalyticsStore.setState(getDefaultNavigationState('2024'));
});

describe('useAnalyticsNavigation - Basic Functionality', () => {
  it('AC #5: provides typed access to state', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    // State should be accessible
    expect(result.current.state).toBeDefined();
    expect(result.current.state.temporal).toBeDefined();
    expect(result.current.state.category).toBeDefined();
    expect(result.current.state.chartMode).toBeDefined();
  });

  it('AC #5: provides dispatch function', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.dispatch).toBeDefined();
    expect(typeof result.current.dispatch).toBe('function');
  });

  // Story 15b-3f: Zustand stores are always available - no Provider required
  // "throws outside Provider" test removed (Zustand stores don't throw)
});

describe('useAnalyticsNavigation - Convenience Selectors', () => {
  it('provides temporal selector', () => {
    const customState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    };

    useAnalyticsStore.setState(customState);

    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.temporal).toEqual(customState.temporal);
  });

  it('provides category selector', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'year', year: '2024' },
      category: { level: 'category', category: 'Food' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.category).toEqual({ level: 'category', category: 'Food' });
  });

  it('provides chartMode selector', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'comparison',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.chartMode).toBe('comparison');
  });

  it('provides temporalLevel selector', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 2 },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.temporalLevel).toBe('week');
  });

  it('provides categoryLevel selector', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'year', year: '2024' },
      category: { level: 'group', category: 'Food', group: 'Groceries' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.categoryLevel).toBe('group');
  });
});

describe('useAnalyticsNavigation - Boolean Helpers', () => {
  it('isYearLevel is true when at year level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.isYearLevel).toBe(true);
  });

  it('isYearLevel is false when drilled down', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'quarter', year: '2024', quarter: 'Q4' },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.isYearLevel).toBe(false);
  });

  it('hasCategoryFilter is false when at "all" level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.hasCategoryFilter).toBe(false);
  });

  it('hasCategoryFilter is true when filtered', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'year', year: '2024' },
      category: { level: 'category', category: 'Food' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.hasCategoryFilter).toBe(true);
  });

  it('isComparisonMode is false in aggregation mode', () => {
    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.isComparisonMode).toBe(false);
  });

  it('isComparisonMode is true in comparison mode', () => {
    useAnalyticsStore.setState({
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'comparison',
      drillDownMode: 'temporal',
    });

    const { result } = renderHook(() => useAnalyticsNavigation());

    expect(result.current.isComparisonMode).toBe(true);
  });
});

describe('supportsComparisonMode', () => {
  it('returns true for year level', () => {
    expect(supportsComparisonMode('year')).toBe(true);
  });

  it('returns true for quarter level', () => {
    expect(supportsComparisonMode('quarter')).toBe(true);
  });

  it('returns true for month level', () => {
    expect(supportsComparisonMode('month')).toBe(true);
  });

  it('returns true for week level', () => {
    expect(supportsComparisonMode('week')).toBe(true);
  });

  it('returns false for day level (no children to compare)', () => {
    expect(supportsComparisonMode('day')).toBe(false);
  });
});

describe('getParentTemporalLevel', () => {
  it('returns week for day', () => {
    expect(getParentTemporalLevel('day')).toBe('week');
  });

  it('returns month for week', () => {
    expect(getParentTemporalLevel('week')).toBe('month');
  });

  it('returns quarter for month', () => {
    expect(getParentTemporalLevel('month')).toBe('quarter');
  });

  it('returns year for quarter', () => {
    expect(getParentTemporalLevel('quarter')).toBe('year');
  });

  it('returns null for year (no parent)', () => {
    expect(getParentTemporalLevel('year')).toBeNull();
  });
});

describe('getChildTemporalLevel', () => {
  it('returns quarter for year', () => {
    expect(getChildTemporalLevel('year')).toBe('quarter');
  });

  it('returns month for quarter', () => {
    expect(getChildTemporalLevel('quarter')).toBe('month');
  });

  it('returns week for month', () => {
    expect(getChildTemporalLevel('month')).toBe('week');
  });

  it('returns day for week', () => {
    expect(getChildTemporalLevel('week')).toBe('day');
  });

  it('returns null for day (no children)', () => {
    expect(getChildTemporalLevel('day')).toBeNull();
  });
});

describe('getParentCategoryLevel', () => {
  it('returns group for subcategory', () => {
    expect(getParentCategoryLevel('subcategory')).toBe('group');
  });

  it('returns category for group', () => {
    expect(getParentCategoryLevel('group')).toBe('category');
  });

  it('returns all for category', () => {
    expect(getParentCategoryLevel('category')).toBe('all');
  });

  it('returns null for all (no parent)', () => {
    expect(getParentCategoryLevel('all')).toBeNull();
  });
});

describe('getChildCategoryLevel', () => {
  it('returns category for all', () => {
    expect(getChildCategoryLevel('all')).toBe('category');
  });

  it('returns group for category', () => {
    expect(getChildCategoryLevel('category')).toBe('group');
  });

  it('returns subcategory for group', () => {
    expect(getChildCategoryLevel('group')).toBe('subcategory');
  });

  it('returns null for subcategory (no children)', () => {
    expect(getChildCategoryLevel('subcategory')).toBeNull();
  });
});
