/**
 * Story 14e-37: Insight Store Tests
 *
 * Tests for the insight Zustand store covering:
 * - Initial state (AC1)
 * - Actions (AC2)
 * - Individual selectors (AC3)
 * - Combined selectors (AC3)
 * - Actions hook (AC3)
 * - Direct access functions (AC3)
 * - Module exports (AC3)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useInsightStore,
  defaultInsightState,
  // Individual selectors (AC3)
  useCurrentInsight,
  useShowInsightCard,
  useShowSessionComplete,
  useSessionContext,
  useShowBatchSummary,
  // Combined selectors (AC3)
  useInsightCardState,
  useSessionCompleteState,
  // Actions hook (AC3)
  useInsightActions,
  // Direct access (AC3)
  getInsightState,
  insightActions,
  type InsightState,
  type InsightActions,
} from '@/shared/stores';
import type { Insight } from '@/types/insight';
import type { SessionContext } from '@/components/session';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock insight for testing.
 */
function createMockInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'test-insight-1',
    type: 'weekly_balance',
    title: 'Test Insight',
    message: 'This is a test insight message.',
    priority: 1,
    icon: 'Sparkles',
    generatedAt: '2026-01-29T10:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock session context for testing.
 */
function createMockSessionContext(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    transactionsSaved: 1,
    consecutiveDays: 3,
    isFirstOfWeek: false,
    isPersonalRecord: false,
    totalAmount: 15000,
    currency: 'CLP',
    categoriesTouched: ['Supermarket'],
    ...overrides,
  };
}

/**
 * Reset store to initial state before each test.
 */
function resetStore() {
  useInsightStore.setState(defaultInsightState);
}

// =============================================================================
// Tests
// =============================================================================

describe('Insight Store', () => {
  beforeEach(() => {
    act(() => {
      resetStore();
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      resetStore();
    });
  });

  // ===========================================================================
  // AC1: Initial State Tests
  // ===========================================================================

  describe('Initial State (AC1)', () => {
    it('should have null currentInsight', () => {
      const state = getInsightState();
      expect(state.currentInsight).toBeNull();
    });

    it('should have false showInsightCard', () => {
      const state = getInsightState();
      expect(state.showInsightCard).toBe(false);
    });

    it('should have false showSessionComplete', () => {
      const state = getInsightState();
      expect(state.showSessionComplete).toBe(false);
    });

    it('should have null sessionContext', () => {
      const state = getInsightState();
      expect(state.sessionContext).toBeNull();
    });

    it('should have false showBatchSummary', () => {
      const state = getInsightState();
      expect(state.showBatchSummary).toBe(false);
    });

    it('should match defaultInsightState', () => {
      const state = getInsightState();
      expect(state.currentInsight).toBe(defaultInsightState.currentInsight);
      expect(state.showInsightCard).toBe(defaultInsightState.showInsightCard);
      expect(state.showSessionComplete).toBe(defaultInsightState.showSessionComplete);
      expect(state.sessionContext).toBe(defaultInsightState.sessionContext);
      expect(state.showBatchSummary).toBe(defaultInsightState.showBatchSummary);
    });
  });

  // ===========================================================================
  // AC2: Actions Tests (7 actions)
  // ===========================================================================

  describe('Actions (AC2)', () => {
    describe('showInsight', () => {
      it('should set currentInsight and showInsightCard to true', () => {
        const insight = createMockInsight();
        act(() => {
          useInsightStore.getState().showInsight(insight);
        });

        const state = getInsightState();
        expect(state.currentInsight).toEqual(insight);
        expect(state.showInsightCard).toBe(true);
      });

      it('should replace existing insight', () => {
        const insight1 = createMockInsight({ id: 'insight-1' });
        const insight2 = createMockInsight({ id: 'insight-2' });

        act(() => {
          useInsightStore.getState().showInsight(insight1);
          useInsightStore.getState().showInsight(insight2);
        });

        expect(getInsightState().currentInsight?.id).toBe('insight-2');
      });
    });

    describe('hideInsight', () => {
      it('should set currentInsight to null and showInsightCard to false', () => {
        const insight = createMockInsight();
        act(() => {
          useInsightStore.getState().showInsight(insight);
          useInsightStore.getState().hideInsight();
        });

        const state = getInsightState();
        expect(state.currentInsight).toBeNull();
        expect(state.showInsightCard).toBe(false);
      });

      it('should be safe to call when already hidden', () => {
        act(() => {
          useInsightStore.getState().hideInsight();
        });

        const state = getInsightState();
        expect(state.currentInsight).toBeNull();
        expect(state.showInsightCard).toBe(false);
      });
    });

    describe('showSessionCompleteOverlay', () => {
      it('should set sessionContext and showSessionComplete to true', () => {
        const context = createMockSessionContext();
        act(() => {
          useInsightStore.getState().showSessionCompleteOverlay(context);
        });

        const state = getInsightState();
        expect(state.sessionContext).toEqual(context);
        expect(state.showSessionComplete).toBe(true);
      });

      it('should replace existing session context', () => {
        const context1 = createMockSessionContext({ transactionsSaved: 1 });
        const context2 = createMockSessionContext({ transactionsSaved: 5 });

        act(() => {
          useInsightStore.getState().showSessionCompleteOverlay(context1);
          useInsightStore.getState().showSessionCompleteOverlay(context2);
        });

        expect(getInsightState().sessionContext?.transactionsSaved).toBe(5);
      });
    });

    describe('hideSessionCompleteOverlay', () => {
      it('should set sessionContext to null and showSessionComplete to false', () => {
        const context = createMockSessionContext();
        act(() => {
          useInsightStore.getState().showSessionCompleteOverlay(context);
          useInsightStore.getState().hideSessionCompleteOverlay();
        });

        const state = getInsightState();
        expect(state.sessionContext).toBeNull();
        expect(state.showSessionComplete).toBe(false);
      });

      it('should be safe to call when already hidden', () => {
        act(() => {
          useInsightStore.getState().hideSessionCompleteOverlay();
        });

        const state = getInsightState();
        expect(state.sessionContext).toBeNull();
        expect(state.showSessionComplete).toBe(false);
      });
    });

    describe('showBatchSummaryOverlay', () => {
      it('should set showBatchSummary to true', () => {
        act(() => {
          useInsightStore.getState().showBatchSummaryOverlay();
        });

        expect(getInsightState().showBatchSummary).toBe(true);
      });
    });

    describe('hideBatchSummaryOverlay', () => {
      it('should set showBatchSummary to false', () => {
        act(() => {
          useInsightStore.getState().showBatchSummaryOverlay();
          useInsightStore.getState().hideBatchSummaryOverlay();
        });

        expect(getInsightState().showBatchSummary).toBe(false);
      });

      it('should be safe to call when already hidden', () => {
        act(() => {
          useInsightStore.getState().hideBatchSummaryOverlay();
        });

        expect(getInsightState().showBatchSummary).toBe(false);
      });
    });

    describe('reset', () => {
      it('should reset all state to initial values', () => {
        // Set various state values
        act(() => {
          useInsightStore.getState().showInsight(createMockInsight());
          useInsightStore.getState().showSessionCompleteOverlay(createMockSessionContext());
          useInsightStore.getState().showBatchSummaryOverlay();
        });

        // Verify state was changed
        expect(getInsightState().currentInsight).not.toBeNull();
        expect(getInsightState().showInsightCard).toBe(true);
        expect(getInsightState().showSessionComplete).toBe(true);
        expect(getInsightState().sessionContext).not.toBeNull();
        expect(getInsightState().showBatchSummary).toBe(true);

        // Reset
        act(() => {
          useInsightStore.getState().reset();
        });

        // Verify all state reset
        const state = getInsightState();
        expect(state.currentInsight).toBeNull();
        expect(state.showInsightCard).toBe(false);
        expect(state.showSessionComplete).toBe(false);
        expect(state.sessionContext).toBeNull();
        expect(state.showBatchSummary).toBe(false);
      });

      it('should be safe to call multiple times', () => {
        act(() => {
          useInsightStore.getState().reset();
          useInsightStore.getState().reset();
          useInsightStore.getState().reset();
        });

        expect(getInsightState().currentInsight).toBeNull();
      });
    });
  });

  // ===========================================================================
  // AC3: Individual Selectors Tests
  // ===========================================================================

  describe('Individual Selectors (AC3)', () => {
    describe('useCurrentInsight', () => {
      it('should return null for initial state', () => {
        const { result } = renderHook(() => useCurrentInsight());
        expect(result.current).toBeNull();
      });

      it('should return insight after showInsight', () => {
        const insight = createMockInsight();
        act(() => {
          useInsightStore.getState().showInsight(insight);
        });

        const { result } = renderHook(() => useCurrentInsight());
        expect(result.current).toEqual(insight);
      });

      it('should update when insight changes', () => {
        const { result, rerender } = renderHook(() => useCurrentInsight());
        expect(result.current).toBeNull();

        act(() => {
          useInsightStore.getState().showInsight(createMockInsight({ id: 'new-insight' }));
        });

        rerender();
        expect(result.current?.id).toBe('new-insight');
      });
    });

    describe('useShowInsightCard', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useShowInsightCard());
        expect(result.current).toBe(false);
      });

      it('should return true after showInsight', () => {
        act(() => {
          useInsightStore.getState().showInsight(createMockInsight());
        });

        const { result } = renderHook(() => useShowInsightCard());
        expect(result.current).toBe(true);
      });

      it('should return false after hideInsight', () => {
        act(() => {
          useInsightStore.getState().showInsight(createMockInsight());
          useInsightStore.getState().hideInsight();
        });

        const { result } = renderHook(() => useShowInsightCard());
        expect(result.current).toBe(false);
      });
    });

    describe('useShowSessionComplete', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useShowSessionComplete());
        expect(result.current).toBe(false);
      });

      it('should return true after showSessionCompleteOverlay', () => {
        act(() => {
          useInsightStore.getState().showSessionCompleteOverlay(createMockSessionContext());
        });

        const { result } = renderHook(() => useShowSessionComplete());
        expect(result.current).toBe(true);
      });

      it('should return false after hideSessionCompleteOverlay', () => {
        act(() => {
          useInsightStore.getState().showSessionCompleteOverlay(createMockSessionContext());
          useInsightStore.getState().hideSessionCompleteOverlay();
        });

        const { result } = renderHook(() => useShowSessionComplete());
        expect(result.current).toBe(false);
      });
    });

    describe('useSessionContext', () => {
      it('should return null for initial state', () => {
        const { result } = renderHook(() => useSessionContext());
        expect(result.current).toBeNull();
      });

      it('should return context after showSessionCompleteOverlay', () => {
        const context = createMockSessionContext();
        act(() => {
          useInsightStore.getState().showSessionCompleteOverlay(context);
        });

        const { result } = renderHook(() => useSessionContext());
        expect(result.current).toEqual(context);
      });

      it('should return null after hideSessionCompleteOverlay', () => {
        act(() => {
          useInsightStore.getState().showSessionCompleteOverlay(createMockSessionContext());
          useInsightStore.getState().hideSessionCompleteOverlay();
        });

        const { result } = renderHook(() => useSessionContext());
        expect(result.current).toBeNull();
      });
    });

    describe('useShowBatchSummary', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useShowBatchSummary());
        expect(result.current).toBe(false);
      });

      it('should return true after showBatchSummaryOverlay', () => {
        act(() => {
          useInsightStore.getState().showBatchSummaryOverlay();
        });

        const { result } = renderHook(() => useShowBatchSummary());
        expect(result.current).toBe(true);
      });

      it('should return false after hideBatchSummaryOverlay', () => {
        act(() => {
          useInsightStore.getState().showBatchSummaryOverlay();
          useInsightStore.getState().hideBatchSummaryOverlay();
        });

        const { result } = renderHook(() => useShowBatchSummary());
        expect(result.current).toBe(false);
      });
    });
  });

  // ===========================================================================
  // AC3: Combined Selectors Tests
  // ===========================================================================

  describe('Combined Selectors (AC3)', () => {
    describe('useInsightCardState', () => {
      it('should return combined insight card state', () => {
        const { result } = renderHook(() => useInsightCardState());

        expect(result.current.currentInsight).toBeNull();
        expect(result.current.showInsightCard).toBe(false);
      });

      it('should update when insight is shown', () => {
        const insight = createMockInsight();
        const { result, rerender } = renderHook(() => useInsightCardState());

        act(() => {
          useInsightStore.getState().showInsight(insight);
        });

        rerender();

        expect(result.current.currentInsight).toEqual(insight);
        expect(result.current.showInsightCard).toBe(true);
      });
    });

    describe('useSessionCompleteState', () => {
      it('should return combined session complete state', () => {
        const { result } = renderHook(() => useSessionCompleteState());

        expect(result.current.sessionContext).toBeNull();
        expect(result.current.showSessionComplete).toBe(false);
      });

      it('should update when session complete is shown', () => {
        const context = createMockSessionContext();
        const { result, rerender } = renderHook(() => useSessionCompleteState());

        act(() => {
          useInsightStore.getState().showSessionCompleteOverlay(context);
        });

        rerender();

        expect(result.current.sessionContext).toEqual(context);
        expect(result.current.showSessionComplete).toBe(true);
      });
    });
  });

  // ===========================================================================
  // AC3: useInsightActions Hook Tests
  // ===========================================================================

  describe('useInsightActions Hook (AC3)', () => {
    it('should return all 7 action functions', () => {
      const { result } = renderHook(() => useInsightActions());

      expect(typeof result.current.showInsight).toBe('function');
      expect(typeof result.current.hideInsight).toBe('function');
      expect(typeof result.current.showSessionCompleteOverlay).toBe('function');
      expect(typeof result.current.hideSessionCompleteOverlay).toBe('function');
      expect(typeof result.current.showBatchSummaryOverlay).toBe('function');
      expect(typeof result.current.hideBatchSummaryOverlay).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should provide stable action references', () => {
      const { result, rerender } = renderHook(() => useInsightActions());

      // Capture initial references
      const refs = {
        showInsight: result.current.showInsight,
        hideInsight: result.current.hideInsight,
        showSessionCompleteOverlay: result.current.showSessionCompleteOverlay,
        hideSessionCompleteOverlay: result.current.hideSessionCompleteOverlay,
        showBatchSummaryOverlay: result.current.showBatchSummaryOverlay,
        hideBatchSummaryOverlay: result.current.hideBatchSummaryOverlay,
        reset: result.current.reset,
      };

      // Trigger state change
      act(() => {
        useInsightStore.setState({ showBatchSummary: true });
      });

      rerender();

      // All 7 actions should still be the same reference
      expect(result.current.showInsight).toBe(refs.showInsight);
      expect(result.current.hideInsight).toBe(refs.hideInsight);
      expect(result.current.showSessionCompleteOverlay).toBe(refs.showSessionCompleteOverlay);
      expect(result.current.hideSessionCompleteOverlay).toBe(refs.hideSessionCompleteOverlay);
      expect(result.current.showBatchSummaryOverlay).toBe(refs.showBatchSummaryOverlay);
      expect(result.current.hideBatchSummaryOverlay).toBe(refs.hideBatchSummaryOverlay);
      expect(result.current.reset).toBe(refs.reset);
    });

    it('should execute actions correctly', () => {
      const { result } = renderHook(() => useInsightActions());
      const insight = createMockInsight();
      const context = createMockSessionContext();

      // Show insight
      act(() => {
        result.current.showInsight(insight);
      });
      expect(getInsightState().currentInsight).toEqual(insight);
      expect(getInsightState().showInsightCard).toBe(true);

      // Hide insight
      act(() => {
        result.current.hideInsight();
      });
      expect(getInsightState().currentInsight).toBeNull();
      expect(getInsightState().showInsightCard).toBe(false);

      // Show session complete
      act(() => {
        result.current.showSessionCompleteOverlay(context);
      });
      expect(getInsightState().sessionContext).toEqual(context);
      expect(getInsightState().showSessionComplete).toBe(true);

      // Show batch summary
      act(() => {
        result.current.showBatchSummaryOverlay();
      });
      expect(getInsightState().showBatchSummary).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });
      expect(getInsightState().currentInsight).toBeNull();
      expect(getInsightState().showInsightCard).toBe(false);
      expect(getInsightState().showSessionComplete).toBe(false);
      expect(getInsightState().sessionContext).toBeNull();
      expect(getInsightState().showBatchSummary).toBe(false);
    });
  });

  // ===========================================================================
  // AC3: Direct Access Functions Tests
  // ===========================================================================

  describe('Direct Access Functions (AC3)', () => {
    describe('getInsightState', () => {
      it('should return current state snapshot', () => {
        const state = getInsightState();

        expect(state.currentInsight).toBeNull();
        expect(state.showInsightCard).toBe(false);
        expect(state.showSessionComplete).toBe(false);
        expect(state.sessionContext).toBeNull();
        expect(state.showBatchSummary).toBe(false);
      });

      it('should reflect state changes', () => {
        const insight = createMockInsight();
        act(() => {
          useInsightStore.setState({
            currentInsight: insight,
            showInsightCard: true,
            showBatchSummary: true,
          });
        });

        const state = getInsightState();
        expect(state.currentInsight).toEqual(insight);
        expect(state.showInsightCard).toBe(true);
        expect(state.showBatchSummary).toBe(true);
      });
    });

    describe('insightActions', () => {
      it('should have all 7 action functions', () => {
        expect(typeof insightActions.showInsight).toBe('function');
        expect(typeof insightActions.hideInsight).toBe('function');
        expect(typeof insightActions.showSessionCompleteOverlay).toBe('function');
        expect(typeof insightActions.hideSessionCompleteOverlay).toBe('function');
        expect(typeof insightActions.showBatchSummaryOverlay).toBe('function');
        expect(typeof insightActions.hideBatchSummaryOverlay).toBe('function');
        expect(typeof insightActions.reset).toBe('function');
      });

      it('showInsight should work outside React', () => {
        const insight = createMockInsight();
        insightActions.showInsight(insight);

        expect(getInsightState().currentInsight).toEqual(insight);
        expect(getInsightState().showInsightCard).toBe(true);
      });

      it('hideInsight should work outside React', () => {
        insightActions.showInsight(createMockInsight());
        expect(getInsightState().showInsightCard).toBe(true);

        insightActions.hideInsight();
        expect(getInsightState().currentInsight).toBeNull();
        expect(getInsightState().showInsightCard).toBe(false);
      });

      it('showSessionCompleteOverlay should work outside React', () => {
        const context = createMockSessionContext();
        insightActions.showSessionCompleteOverlay(context);

        expect(getInsightState().sessionContext).toEqual(context);
        expect(getInsightState().showSessionComplete).toBe(true);
      });

      it('hideSessionCompleteOverlay should work outside React', () => {
        insightActions.showSessionCompleteOverlay(createMockSessionContext());
        insightActions.hideSessionCompleteOverlay();

        expect(getInsightState().sessionContext).toBeNull();
        expect(getInsightState().showSessionComplete).toBe(false);
      });

      it('showBatchSummaryOverlay should work outside React', () => {
        insightActions.showBatchSummaryOverlay();
        expect(getInsightState().showBatchSummary).toBe(true);
      });

      it('hideBatchSummaryOverlay should work outside React', () => {
        insightActions.showBatchSummaryOverlay();
        insightActions.hideBatchSummaryOverlay();
        expect(getInsightState().showBatchSummary).toBe(false);
      });

      it('reset should work outside React', () => {
        // Set some state
        insightActions.showInsight(createMockInsight());
        insightActions.showSessionCompleteOverlay(createMockSessionContext());
        insightActions.showBatchSummaryOverlay();

        insightActions.reset();

        expect(getInsightState().currentInsight).toBeNull();
        expect(getInsightState().showInsightCard).toBe(false);
        expect(getInsightState().showSessionComplete).toBe(false);
        expect(getInsightState().sessionContext).toBeNull();
        expect(getInsightState().showBatchSummary).toBe(false);
      });

      it('should support complete workflow outside React', () => {
        const insight = createMockInsight();
        const context = createMockSessionContext({ transactionsSaved: 3 });

        // Simulate insight workflow
        insightActions.showInsight(insight);
        expect(getInsightState().showInsightCard).toBe(true);

        insightActions.hideInsight();
        expect(getInsightState().showInsightCard).toBe(false);

        // Show session complete
        insightActions.showSessionCompleteOverlay(context);
        expect(getInsightState().showSessionComplete).toBe(true);
        expect(getInsightState().sessionContext?.transactionsSaved).toBe(3);

        // Dismiss and show batch summary
        insightActions.hideSessionCompleteOverlay();
        insightActions.showBatchSummaryOverlay();
        expect(getInsightState().showBatchSummary).toBe(true);

        // Complete workflow
        insightActions.reset();
        expect(getInsightState().showBatchSummary).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Selector Stability Tests
  // ===========================================================================

  describe('Selector Stability', () => {
    it('individual selectors should only re-render when their value changes', () => {
      const { result: insightResult, rerender: rerenderInsight } = renderHook(() => useShowInsightCard());
      const initialValue = insightResult.current;

      // Change a different state value
      act(() => {
        useInsightStore.setState({ showBatchSummary: true });
      });

      rerenderInsight();
      expect(insightResult.current).toBe(initialValue);
    });

    it('combined selectors should update when any part changes', () => {
      const { result, rerender } = renderHook(() => useInsightCardState());

      expect(result.current.showInsightCard).toBe(false);

      act(() => {
        useInsightStore.setState({ showInsightCard: true, currentInsight: createMockInsight() });
      });

      rerender();
      expect(result.current.showInsightCard).toBe(true);
    });
  });

  // ===========================================================================
  // Edge Case Tests
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle rapid state updates', () => {
      act(() => {
        for (let i = 0; i < 100; i++) {
          useInsightStore.getState().showBatchSummaryOverlay();
          useInsightStore.getState().hideBatchSummaryOverlay();
        }
      });

      // After toggling 100 times, should be hidden (last call was hide)
      expect(getInsightState().showBatchSummary).toBe(false);
    });

    it('should handle setting same insight multiple times', () => {
      const insight = createMockInsight();
      act(() => {
        useInsightStore.getState().showInsight(insight);
        useInsightStore.getState().showInsight(insight);
        useInsightStore.getState().showInsight(insight);
      });

      expect(getInsightState().currentInsight).toEqual(insight);
    });

    it('should handle multiple resets', () => {
      act(() => {
        useInsightStore.getState().showInsight(createMockInsight());
        useInsightStore.getState().reset();
        useInsightStore.getState().reset();
        useInsightStore.getState().reset();
      });

      expect(getInsightState().currentInsight).toBeNull();
    });

    it('should handle interleaved show/hide operations', () => {
      const insight1 = createMockInsight({ id: 'insight-1' });
      const insight2 = createMockInsight({ id: 'insight-2' });

      act(() => {
        useInsightStore.getState().showInsight(insight1);
        useInsightStore.getState().showInsight(insight2);
        useInsightStore.getState().hideInsight();
      });

      expect(getInsightState().currentInsight).toBeNull();
      expect(getInsightState().showInsightCard).toBe(false);
    });

    it('should handle concurrent overlay visibility', () => {
      act(() => {
        useInsightStore.getState().showInsight(createMockInsight());
        useInsightStore.getState().showSessionCompleteOverlay(createMockSessionContext());
        useInsightStore.getState().showBatchSummaryOverlay();
      });

      // All three overlays can be visible simultaneously
      expect(getInsightState().showInsightCard).toBe(true);
      expect(getInsightState().showSessionComplete).toBe(true);
      expect(getInsightState().showBatchSummary).toBe(true);
    });
  });

  // ===========================================================================
  // Module Exports Tests
  // ===========================================================================

  describe('Module Exports', () => {
    it('should export useInsightStore from @/shared/stores', () => {
      expect(useInsightStore).toBeDefined();
    });

    it('should export defaultInsightState from @/shared/stores', () => {
      expect(defaultInsightState).toBeDefined();
    });

    it('should export all 5 individual selectors from @/shared/stores', () => {
      expect(useCurrentInsight).toBeDefined();
      expect(useShowInsightCard).toBeDefined();
      expect(useShowSessionComplete).toBeDefined();
      expect(useSessionContext).toBeDefined();
      expect(useShowBatchSummary).toBeDefined();
    });

    it('should export all 2 combined selectors from @/shared/stores', () => {
      expect(useInsightCardState).toBeDefined();
      expect(useSessionCompleteState).toBeDefined();
    });

    it('should export useInsightActions from @/shared/stores', () => {
      expect(useInsightActions).toBeDefined();
    });

    it('should export getInsightState from @/shared/stores', () => {
      expect(getInsightState).toBeDefined();
    });

    it('should export insightActions from @/shared/stores', () => {
      expect(insightActions).toBeDefined();
    });

    it('should export InsightState type', () => {
      // TypeScript will verify this at compile time
      // We can't directly test type exports at runtime, but we can verify usage
      const state: InsightState = getInsightState();
      expect(state).toBeDefined();
    });

    it('should export InsightActions type', () => {
      // TypeScript will verify this at compile time
      const actions: InsightActions = useInsightStore.getState();
      expect(actions.showInsight).toBeDefined();
    });
  });
});
