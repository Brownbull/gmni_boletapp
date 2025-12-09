/**
 * useAnalyticsNavigation Hook Unit Tests
 *
 * Tests for the custom hook that provides access to analytics context.
 *
 * Story 7.1 - Analytics Navigation Context
 * AC #5: useAnalyticsNavigation() hook provides typed access to context state and dispatch
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { AnalyticsProvider } from '../../../src/contexts/AnalyticsContext';
import {
  useAnalyticsNavigation,
  supportsComparisonMode,
  getParentTemporalLevel,
  getChildTemporalLevel,
  getParentCategoryLevel,
  getChildCategoryLevel,
} from '../../../src/hooks/useAnalyticsNavigation';
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

describe('useAnalyticsNavigation - Basic Functionality', () => {
  it('AC #5: provides typed access to state', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    // State should be accessible
    expect(result.current.state).toBeDefined();
    expect(result.current.state.temporal).toBeDefined();
    expect(result.current.state.category).toBeDefined();
    expect(result.current.state.chartMode).toBeDefined();
  });

  it('AC #5: provides dispatch function', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    expect(result.current.dispatch).toBeDefined();
    expect(typeof result.current.dispatch).toBe('function');
  });

  it('AC #5: throws error when used outside AnalyticsProvider', () => {
    // Suppress console.error for this test since React will log the error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAnalyticsNavigation());
    }).toThrow(
      'useAnalyticsNavigation must be used within an AnalyticsProvider'
    );

    consoleSpy.mockRestore();
  });

  it('error message includes guidance about AnalyticsProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderHook(() => useAnalyticsNavigation());
    } catch (error) {
      expect((error as Error).message).toContain('AnalyticsProvider');
      expect((error as Error).message).toContain(
        'src/contexts/AnalyticsContext.tsx'
      );
    }

    consoleSpy.mockRestore();
  });
});

describe('useAnalyticsNavigation - Convenience Selectors', () => {
  it('provides temporal selector', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    expect(result.current.temporal).toEqual(initialState.temporal);
  });

  it('provides category selector', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'category', category: 'Food' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    expect(result.current.category).toEqual(initialState.category);
  });

  it('provides chartMode selector', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'comparison',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    expect(result.current.chartMode).toBe('comparison');
  });

  it('provides temporalLevel selector', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'week', year: '2024', quarter: 'Q4', month: '2024-10', week: 2 },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    expect(result.current.temporalLevel).toBe('week');
  });

  it('provides categoryLevel selector', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'group', category: 'Food', group: 'Groceries' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    expect(result.current.categoryLevel).toBe('group');
  });
});

describe('useAnalyticsNavigation - Boolean Helpers', () => {
  it('isYearLevel is true when at year level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isYearLevel).toBe(true);
  });

  it('isYearLevel is false when drilled down', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'quarter', year: '2024', quarter: 'Q4' },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    expect(result.current.isYearLevel).toBe(false);
  });

  it('hasCategoryFilter is false when at "all" level', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    expect(result.current.hasCategoryFilter).toBe(false);
  });

  it('hasCategoryFilter is true when filtered', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'category', category: 'Food' },
      chartMode: 'aggregation',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

    expect(result.current.hasCategoryFilter).toBe(true);
  });

  it('isComparisonMode is false in aggregation mode', () => {
    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isComparisonMode).toBe(false);
  });

  it('isComparisonMode is true in comparison mode', () => {
    const initialState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'comparison',
    };

    const { result } = renderHook(() => useAnalyticsNavigation(), {
      wrapper: createWrapper(initialState),
    });

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
