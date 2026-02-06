/**
 * Story 14d-v2-1-10d: HistoryFiltersContext View Mode Sync Tests
 *
 * Tests for the integration between HistoryFiltersContext and view mode changes.
 * When view mode changes (personal <-> group), filters should be automatically cleared.
 *
 * Acceptance Criteria:
 * AC#3: Given I am viewing History with filters applied, When I switch from Personal to Group mode,
 *       Then my filters are cleared and I see the group's unfiltered transactions.
 * AC#5: Given I switch view modes, When the mode changes, Then filters are cleared
 *       but scroll position is preserved.
 *
 * Architecture Reference:
 * - Story 14d-v2-1-10d: History Filters and View Mode Integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  HistoryFiltersProvider,
  HistoryFiltersContext,
  getDefaultFilterState,
} from '@/contexts/HistoryFiltersContext';
import { useHistoryFilters } from '@/hooks/useHistoryFilters';
import {
  useViewModeStore,
  initialViewModeState,
} from '@shared/stores/useViewModeStore';

// =============================================================================
// Test Setup
// =============================================================================

/**
 * Reset view mode store to initial state before each test.
 */
function resetViewModeStore() {
  useViewModeStore.setState(initialViewModeState);
}

/**
 * Create a wrapper component with HistoryFiltersProvider.
 */
function createWrapper(initialState?: Parameters<typeof HistoryFiltersProvider>[0]['initialState']) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HistoryFiltersProvider initialState={initialState}>
        {children}
      </HistoryFiltersProvider>
    );
  };
}

/**
 * Create a filter state with applied filters for testing.
 * This simulates a user who has applied various filters.
 */
function createFilteredState() {
  return {
    temporal: {
      level: 'month' as const,
      year: '2024',
      month: '2024-06',
    },
    category: {
      level: 'category' as const,
      category: 'Supermarket',
    },
    location: {
      country: 'Chile',
      city: 'Santiago',
    },
    group: {
      groupIds: 'group-1,group-2',
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetViewModeStore();
});

// =============================================================================
// Tests
// =============================================================================

describe('HistoryFiltersProvider view mode sync', () => {
  describe('filter clearing on mode change', () => {
    it('clears all filters when mode changes from personal to group', async () => {
      // Start with filters applied
      const filteredState = createFilteredState();

      const { result } = renderHook(() => useHistoryFilters(), {
        wrapper: createWrapper(filteredState),
      });

      // Verify initial filtered state
      expect(result.current.state.category.level).toBe('category');
      expect(result.current.state.category.category).toBe('Supermarket');
      expect(result.current.state.location.city).toBe('Santiago');
      expect(result.current.state.group.groupIds).toBe('group-1,group-2');

      // Change from personal to group mode
      act(() => {
        useViewModeStore.getState().setGroupMode('new-group-123');
      });

      // Filters should be cleared to defaults
      const defaultState = getDefaultFilterState();
      expect(result.current.state.category.level).toBe('all');
      expect(result.current.state.category.category).toBeUndefined();
      expect(result.current.state.location.city).toBeUndefined();
      expect(result.current.state.group.groupIds).toBeUndefined();
      // Temporal should be reset to default (current month)
      expect(result.current.state.temporal.level).toBe(defaultState.temporal.level);
    });

    it('clears all filters when mode changes from group to personal', async () => {
      // Start in group mode with filters applied
      useViewModeStore.setState({ mode: 'group', groupId: 'existing-group' });

      const filteredState = createFilteredState();

      const { result } = renderHook(() => useHistoryFilters(), {
        wrapper: createWrapper(filteredState),
      });

      // Verify initial filtered state
      expect(result.current.state.category.level).toBe('category');
      expect(result.current.state.location.city).toBe('Santiago');

      // Change from group to personal mode
      act(() => {
        useViewModeStore.getState().setPersonalMode();
      });

      // Filters should be cleared to defaults
      expect(result.current.state.category.level).toBe('all');
      expect(result.current.state.location.city).toBeUndefined();
    });

    it('does NOT clear filters on initial mount', () => {
      // Start with filters applied
      const filteredState = createFilteredState();

      const { result } = renderHook(() => useHistoryFilters(), {
        wrapper: createWrapper(filteredState),
      });

      // Filters should remain as initially set (not cleared on mount)
      expect(result.current.state.category.level).toBe('category');
      expect(result.current.state.category.category).toBe('Supermarket');
      expect(result.current.state.location.city).toBe('Santiago');
    });

    it('does NOT clear filters on initial mount in group mode', () => {
      // Set up group mode BEFORE mounting
      useViewModeStore.setState({ mode: 'group', groupId: 'test-group' });

      const filteredState = createFilteredState();

      const { result } = renderHook(() => useHistoryFilters(), {
        wrapper: createWrapper(filteredState),
      });

      // Filters should remain as initially set
      expect(result.current.state.category.level).toBe('category');
      expect(result.current.state.category.category).toBe('Supermarket');
    });
  });

  describe('filter clearing preserves default behavior', () => {
    it('clears to default filter state (current month)', () => {
      const filteredState = createFilteredState();

      const { result } = renderHook(() => useHistoryFilters(), {
        wrapper: createWrapper(filteredState),
      });

      // Change mode
      act(() => {
        useViewModeStore.getState().setGroupMode('group-1');
      });

      // Should reset to getDefaultFilterState() which has current month
      const defaultState = getDefaultFilterState();
      expect(result.current.state.temporal.level).toBe(defaultState.temporal.level);
      expect(result.current.state.temporal.year).toBe(defaultState.temporal.year);
      expect(result.current.state.temporal.month).toBe(defaultState.temporal.month);
    });
  });

  describe('multiple mode changes', () => {
    it('clears filters on each mode change', () => {
      const { result } = renderHook(() => useHistoryFilters(), {
        wrapper: createWrapper(),
      });

      // Apply some filters
      act(() => {
        result.current.dispatch({
          type: 'SET_CATEGORY_FILTER',
          payload: { level: 'category', category: 'Restaurant' },
        });
      });

      expect(result.current.state.category.category).toBe('Restaurant');

      // Change to group mode - should clear
      act(() => {
        useViewModeStore.getState().setGroupMode('group-1');
      });

      expect(result.current.state.category.level).toBe('all');
      expect(result.current.state.category.category).toBeUndefined();

      // Apply filters again in group mode
      act(() => {
        result.current.dispatch({
          type: 'SET_CATEGORY_FILTER',
          payload: { level: 'category', category: 'Pharmacy' },
        });
      });

      expect(result.current.state.category.category).toBe('Pharmacy');

      // Change back to personal mode - should clear again
      act(() => {
        useViewModeStore.getState().setPersonalMode();
      });

      expect(result.current.state.category.level).toBe('all');
      expect(result.current.state.category.category).toBeUndefined();
    });
  });

  describe('group-to-group navigation (no mode change)', () => {
    it('does NOT clear filters when switching between groups', () => {
      // Start in group mode
      useViewModeStore.setState({ mode: 'group', groupId: 'group-1' });

      const { result } = renderHook(() => useHistoryFilters(), {
        wrapper: createWrapper(),
      });

      // Apply some filters
      act(() => {
        result.current.dispatch({
          type: 'SET_CATEGORY_FILTER',
          payload: { level: 'category', category: 'Restaurant' },
        });
      });

      expect(result.current.state.category.category).toBe('Restaurant');

      // Switch to another group (still group mode)
      act(() => {
        useViewModeStore.getState().setGroupMode('group-2');
      });

      // Filters should NOT be cleared (mode is still 'group')
      expect(result.current.state.category.category).toBe('Restaurant');
    });
  });

  describe('onStateChange callback', () => {
    it('calls onStateChange when filters are cleared by mode change', () => {
      const onStateChange = vi.fn();

      function WrapperWithCallback({ children }: { children: React.ReactNode }) {
        return (
          <HistoryFiltersProvider
            initialState={createFilteredState()}
            onStateChange={onStateChange}
          >
            {children}
          </HistoryFiltersProvider>
        );
      }

      renderHook(() => useHistoryFilters(), {
        wrapper: WrapperWithCallback,
      });

      // Reset mock to ignore initial mount call
      onStateChange.mockClear();

      // Change mode
      act(() => {
        useViewModeStore.getState().setGroupMode('group-1');
      });

      // onStateChange should be called with cleared state
      expect(onStateChange).toHaveBeenCalled();
      const lastCallArg = onStateChange.mock.calls[onStateChange.mock.calls.length - 1][0];
      expect(lastCallArg.category.level).toBe('all');
    });
  });
});
