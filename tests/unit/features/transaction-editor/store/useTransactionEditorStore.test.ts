/**
 * Story 14e-36b: Transaction Editor Store Tests
 *
 * Tests for the transaction editor Zustand store covering:
 * - Initial state (AC5.1)
 * - Actions (AC5.2)
 * - Individual selectors (AC1)
 * - Computed selectors (AC2)
 * - Actions hook (AC3)
 * - Direct access functions (AC4)
 * - Module exports (AC5.5)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useTransactionEditorStore,
  initialTransactionEditorState,
  // Individual selectors (AC1)
  useCurrentTransaction,
  useEditorMode,
  useIsReadOnly,
  useIsSaving,
  useAnimateItems,
  useCreditUsedInSession,
  useNavigationList,
  // Computed selectors (AC2)
  useIsEditing,
  useCanNavigate,
  useHasUnsavedChanges,
  // Actions hook (AC3)
  useTransactionEditorActions,
  // Direct access (AC4)
  getTransactionEditorState,
  transactionEditorActions,
} from '@features/transaction-editor';
import type { Transaction } from '@/types/transaction';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock transaction for testing.
 */
function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-tx-1',
    date: '2026-01-29',
    merchant: 'Test Merchant',
    category: 'Supermarket',
    total: 15000,
    items: [{ name: 'Test Item', price: 15000, qty: 1 }],
    currency: 'CLP',
    ...overrides,
  };
}

/**
 * Reset store to initial state before each test.
 */
function resetStore() {
  useTransactionEditorStore.setState(initialTransactionEditorState);
}

// =============================================================================
// Tests
// =============================================================================

describe('Transaction Editor Store', () => {
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
  // AC5.1: Initial State Tests
  // ===========================================================================

  describe('Initial State (AC5.1)', () => {
    it('should have null currentTransaction', () => {
      const state = getTransactionEditorState();
      expect(state.currentTransaction).toBeNull();
    });

    it('should have null navigationList', () => {
      const state = getTransactionEditorState();
      expect(state.navigationList).toBeNull();
    });

    it('should have "new" mode', () => {
      const state = getTransactionEditorState();
      expect(state.mode).toBe('new');
    });

    it('should have false isReadOnly', () => {
      const state = getTransactionEditorState();
      expect(state.isReadOnly).toBe(false);
    });

    it('should have false creditUsedInSession', () => {
      const state = getTransactionEditorState();
      expect(state.creditUsedInSession).toBe(false);
    });

    it('should have false animateItems', () => {
      const state = getTransactionEditorState();
      expect(state.animateItems).toBe(false);
    });

    it('should have false isSaving', () => {
      const state = getTransactionEditorState();
      expect(state.isSaving).toBe(false);
    });
  });

  // ===========================================================================
  // AC5.2: Actions Tests (9 actions)
  // ===========================================================================

  describe('Actions (AC5.2)', () => {
    describe('setTransaction', () => {
      it('should set currentTransaction', () => {
        const tx = createMockTransaction();
        act(() => {
          useTransactionEditorStore.getState().setTransaction(tx);
        });
        expect(getTransactionEditorState().currentTransaction).toEqual(tx);
      });

      it('should allow setting to null', () => {
        const tx = createMockTransaction();
        act(() => {
          useTransactionEditorStore.getState().setTransaction(tx);
          useTransactionEditorStore.getState().setTransaction(null);
        });
        expect(getTransactionEditorState().currentTransaction).toBeNull();
      });
    });

    describe('clearTransaction', () => {
      it('should set currentTransaction to null', () => {
        const tx = createMockTransaction();
        act(() => {
          useTransactionEditorStore.getState().setTransaction(tx);
          useTransactionEditorStore.getState().clearTransaction();
        });
        expect(getTransactionEditorState().currentTransaction).toBeNull();
      });
    });

    describe('setMode', () => {
      it('should set mode to "existing"', () => {
        act(() => {
          useTransactionEditorStore.getState().setMode('existing');
        });
        expect(getTransactionEditorState().mode).toBe('existing');
      });

      it('should set mode to "new"', () => {
        act(() => {
          useTransactionEditorStore.getState().setMode('existing');
          useTransactionEditorStore.getState().setMode('new');
        });
        expect(getTransactionEditorState().mode).toBe('new');
      });
    });

    describe('setReadOnly', () => {
      it('should set isReadOnly to true', () => {
        act(() => {
          useTransactionEditorStore.getState().setReadOnly(true);
        });
        expect(getTransactionEditorState().isReadOnly).toBe(true);
      });

      it('should set isReadOnly to false', () => {
        act(() => {
          useTransactionEditorStore.getState().setReadOnly(true);
          useTransactionEditorStore.getState().setReadOnly(false);
        });
        expect(getTransactionEditorState().isReadOnly).toBe(false);
      });
    });

    describe('setCreditUsed', () => {
      it('should set creditUsedInSession to true', () => {
        act(() => {
          useTransactionEditorStore.getState().setCreditUsed(true);
        });
        expect(getTransactionEditorState().creditUsedInSession).toBe(true);
      });

      it('should set creditUsedInSession to false', () => {
        act(() => {
          useTransactionEditorStore.getState().setCreditUsed(true);
          useTransactionEditorStore.getState().setCreditUsed(false);
        });
        expect(getTransactionEditorState().creditUsedInSession).toBe(false);
      });
    });

    describe('setAnimateItems', () => {
      it('should set animateItems to true', () => {
        act(() => {
          useTransactionEditorStore.getState().setAnimateItems(true);
        });
        expect(getTransactionEditorState().animateItems).toBe(true);
      });

      it('should set animateItems to false', () => {
        act(() => {
          useTransactionEditorStore.getState().setAnimateItems(true);
          useTransactionEditorStore.getState().setAnimateItems(false);
        });
        expect(getTransactionEditorState().animateItems).toBe(false);
      });
    });

    describe('setNavigationList', () => {
      it('should set navigationList to array of IDs', () => {
        const ids = ['tx-1', 'tx-2', 'tx-3'];
        act(() => {
          useTransactionEditorStore.getState().setNavigationList(ids);
        });
        expect(getTransactionEditorState().navigationList).toEqual(ids);
      });

      it('should set navigationList to null', () => {
        const ids = ['tx-1', 'tx-2'];
        act(() => {
          useTransactionEditorStore.getState().setNavigationList(ids);
          useTransactionEditorStore.getState().setNavigationList(null);
        });
        expect(getTransactionEditorState().navigationList).toBeNull();
      });

      it('should handle empty array', () => {
        act(() => {
          useTransactionEditorStore.getState().setNavigationList([]);
        });
        expect(getTransactionEditorState().navigationList).toEqual([]);
      });
    });

    describe('setSaving', () => {
      it('should set isSaving to true', () => {
        act(() => {
          useTransactionEditorStore.getState().setSaving(true);
        });
        expect(getTransactionEditorState().isSaving).toBe(true);
      });

      it('should set isSaving to false', () => {
        act(() => {
          useTransactionEditorStore.getState().setSaving(true);
          useTransactionEditorStore.getState().setSaving(false);
        });
        expect(getTransactionEditorState().isSaving).toBe(false);
      });
    });

    describe('reset', () => {
      it('should reset all state to initial values', () => {
        // Set various state values
        act(() => {
          useTransactionEditorStore.getState().setTransaction(createMockTransaction());
          useTransactionEditorStore.getState().setNavigationList(['tx-1', 'tx-2']);
          useTransactionEditorStore.getState().setMode('existing');
          useTransactionEditorStore.getState().setReadOnly(true);
          useTransactionEditorStore.getState().setCreditUsed(true);
          useTransactionEditorStore.getState().setAnimateItems(true);
          useTransactionEditorStore.getState().setSaving(true);
        });

        // Verify state was changed
        expect(getTransactionEditorState().currentTransaction).not.toBeNull();
        expect(getTransactionEditorState().mode).toBe('existing');

        // Reset
        act(() => {
          useTransactionEditorStore.getState().reset();
        });

        // Verify all state reset
        const state = getTransactionEditorState();
        expect(state.currentTransaction).toBeNull();
        expect(state.navigationList).toBeNull();
        expect(state.mode).toBe('new');
        expect(state.isReadOnly).toBe(false);
        expect(state.creditUsedInSession).toBe(false);
        expect(state.animateItems).toBe(false);
        expect(state.isSaving).toBe(false);
      });
    });
  });

  // ===========================================================================
  // AC1: Individual Selectors Tests
  // ===========================================================================

  describe('Individual Selectors (AC1)', () => {
    describe('useCurrentTransaction', () => {
      it('should return null for initial state', () => {
        const { result } = renderHook(() => useCurrentTransaction());
        expect(result.current).toBeNull();
      });

      it('should return transaction after setTransaction', () => {
        const tx = createMockTransaction();
        act(() => {
          useTransactionEditorStore.getState().setTransaction(tx);
        });

        const { result } = renderHook(() => useCurrentTransaction());
        expect(result.current).toEqual(tx);
      });

      it('should update when transaction changes', () => {
        const { result, rerender } = renderHook(() => useCurrentTransaction());
        expect(result.current).toBeNull();

        act(() => {
          useTransactionEditorStore.getState().setTransaction(createMockTransaction({ id: 'new-tx' }));
        });

        rerender();
        expect(result.current?.id).toBe('new-tx');
      });
    });

    describe('useEditorMode', () => {
      it('should return "new" for initial state', () => {
        const { result } = renderHook(() => useEditorMode());
        expect(result.current).toBe('new');
      });

      it('should return "existing" after setMode', () => {
        act(() => {
          useTransactionEditorStore.getState().setMode('existing');
        });

        const { result } = renderHook(() => useEditorMode());
        expect(result.current).toBe('existing');
      });
    });

    describe('useIsReadOnly', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useIsReadOnly());
        expect(result.current).toBe(false);
      });

      it('should return true after setReadOnly(true)', () => {
        act(() => {
          useTransactionEditorStore.getState().setReadOnly(true);
        });

        const { result } = renderHook(() => useIsReadOnly());
        expect(result.current).toBe(true);
      });
    });

    describe('useIsSaving', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useIsSaving());
        expect(result.current).toBe(false);
      });

      it('should return true after setSaving(true)', () => {
        act(() => {
          useTransactionEditorStore.getState().setSaving(true);
        });

        const { result } = renderHook(() => useIsSaving());
        expect(result.current).toBe(true);
      });
    });

    describe('useAnimateItems', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useAnimateItems());
        expect(result.current).toBe(false);
      });

      it('should return true after setAnimateItems(true)', () => {
        act(() => {
          useTransactionEditorStore.getState().setAnimateItems(true);
        });

        const { result } = renderHook(() => useAnimateItems());
        expect(result.current).toBe(true);
      });
    });

    describe('useCreditUsedInSession', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useCreditUsedInSession());
        expect(result.current).toBe(false);
      });

      it('should return true after setCreditUsed(true)', () => {
        act(() => {
          useTransactionEditorStore.getState().setCreditUsed(true);
        });

        const { result } = renderHook(() => useCreditUsedInSession());
        expect(result.current).toBe(true);
      });
    });

    describe('useNavigationList', () => {
      it('should return null for initial state', () => {
        const { result } = renderHook(() => useNavigationList());
        expect(result.current).toBeNull();
      });

      it('should return array after setNavigationList', () => {
        const ids = ['tx-1', 'tx-2', 'tx-3'];
        act(() => {
          useTransactionEditorStore.getState().setNavigationList(ids);
        });

        const { result } = renderHook(() => useNavigationList());
        expect(result.current).toEqual(ids);
      });
    });
  });

  // ===========================================================================
  // AC2: Computed Selectors Tests
  // ===========================================================================

  describe('Computed Selectors (AC2)', () => {
    describe('useIsEditing', () => {
      it('should return false when currentTransaction is null', () => {
        const { result } = renderHook(() => useIsEditing());
        expect(result.current).toBe(false);
      });

      it('should return true when currentTransaction is set', () => {
        act(() => {
          useTransactionEditorStore.getState().setTransaction(createMockTransaction());
        });

        const { result } = renderHook(() => useIsEditing());
        expect(result.current).toBe(true);
      });

      it('should update when transaction changes', () => {
        const { result, rerender } = renderHook(() => useIsEditing());
        expect(result.current).toBe(false);

        act(() => {
          useTransactionEditorStore.getState().setTransaction(createMockTransaction());
        });

        rerender();
        expect(result.current).toBe(true);

        act(() => {
          useTransactionEditorStore.getState().clearTransaction();
        });

        rerender();
        expect(result.current).toBe(false);
      });
    });

    describe('useCanNavigate', () => {
      it('should return false when navigationList is null', () => {
        const { result } = renderHook(() => useCanNavigate());
        expect(result.current).toBe(false);
      });

      it('should return false when navigationList is empty', () => {
        act(() => {
          useTransactionEditorStore.getState().setNavigationList([]);
        });

        const { result } = renderHook(() => useCanNavigate());
        expect(result.current).toBe(false);
      });

      it('should return false when navigationList has only one item', () => {
        act(() => {
          useTransactionEditorStore.getState().setNavigationList(['tx-1']);
        });

        const { result } = renderHook(() => useCanNavigate());
        expect(result.current).toBe(false);
      });

      it('should return true when navigationList has more than one item', () => {
        act(() => {
          useTransactionEditorStore.getState().setNavigationList(['tx-1', 'tx-2']);
        });

        const { result } = renderHook(() => useCanNavigate());
        expect(result.current).toBe(true);
      });

      it('should return true when navigationList has many items', () => {
        act(() => {
          useTransactionEditorStore.getState().setNavigationList(['tx-1', 'tx-2', 'tx-3', 'tx-4']);
        });

        const { result } = renderHook(() => useCanNavigate());
        expect(result.current).toBe(true);
      });
    });

    describe('useHasUnsavedChanges', () => {
      it('should return false when currentTransaction is null', () => {
        const { result } = renderHook(() => useHasUnsavedChanges());
        expect(result.current).toBe(false);
      });

      it('should return true when currentTransaction is set and not saving', () => {
        act(() => {
          useTransactionEditorStore.getState().setTransaction(createMockTransaction());
        });

        const { result } = renderHook(() => useHasUnsavedChanges());
        expect(result.current).toBe(true);
      });

      it('should return false when currentTransaction is set but saving', () => {
        act(() => {
          useTransactionEditorStore.getState().setTransaction(createMockTransaction());
          useTransactionEditorStore.getState().setSaving(true);
        });

        const { result } = renderHook(() => useHasUnsavedChanges());
        expect(result.current).toBe(false);
      });

      it('should return false when currentTransaction is null even if saving', () => {
        act(() => {
          useTransactionEditorStore.getState().setSaving(true);
        });

        const { result } = renderHook(() => useHasUnsavedChanges());
        expect(result.current).toBe(false);
      });
    });
  });

  // ===========================================================================
  // AC3: useTransactionEditorActions Hook Tests
  // ===========================================================================

  describe('useTransactionEditorActions Hook (AC3)', () => {
    it('should return all 9 action functions', () => {
      const { result } = renderHook(() => useTransactionEditorActions());

      expect(typeof result.current.setTransaction).toBe('function');
      expect(typeof result.current.clearTransaction).toBe('function');
      expect(typeof result.current.setMode).toBe('function');
      expect(typeof result.current.setReadOnly).toBe('function');
      expect(typeof result.current.setCreditUsed).toBe('function');
      expect(typeof result.current.setAnimateItems).toBe('function');
      expect(typeof result.current.setNavigationList).toBe('function');
      expect(typeof result.current.setSaving).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should provide stable action references', () => {
      const { result, rerender } = renderHook(() => useTransactionEditorActions());

      // Capture initial references
      const refs = {
        setTransaction: result.current.setTransaction,
        clearTransaction: result.current.clearTransaction,
        setMode: result.current.setMode,
        setReadOnly: result.current.setReadOnly,
        setCreditUsed: result.current.setCreditUsed,
        setAnimateItems: result.current.setAnimateItems,
        setNavigationList: result.current.setNavigationList,
        setSaving: result.current.setSaving,
        reset: result.current.reset,
      };

      // Trigger state change
      act(() => {
        useTransactionEditorStore.setState({ mode: 'existing' });
      });

      rerender();

      // All 9 actions should still be the same reference
      expect(result.current.setTransaction).toBe(refs.setTransaction);
      expect(result.current.clearTransaction).toBe(refs.clearTransaction);
      expect(result.current.setMode).toBe(refs.setMode);
      expect(result.current.setReadOnly).toBe(refs.setReadOnly);
      expect(result.current.setCreditUsed).toBe(refs.setCreditUsed);
      expect(result.current.setAnimateItems).toBe(refs.setAnimateItems);
      expect(result.current.setNavigationList).toBe(refs.setNavigationList);
      expect(result.current.setSaving).toBe(refs.setSaving);
      expect(result.current.reset).toBe(refs.reset);
    });

    it('should execute actions correctly', () => {
      const { result } = renderHook(() => useTransactionEditorActions());
      const tx = createMockTransaction();

      act(() => {
        result.current.setTransaction(tx);
      });
      expect(getTransactionEditorState().currentTransaction).toEqual(tx);

      act(() => {
        result.current.setMode('existing');
      });
      expect(getTransactionEditorState().mode).toBe('existing');

      act(() => {
        result.current.setSaving(true);
      });
      expect(getTransactionEditorState().isSaving).toBe(true);

      act(() => {
        result.current.reset();
      });
      expect(getTransactionEditorState().currentTransaction).toBeNull();
      expect(getTransactionEditorState().mode).toBe('new');
      expect(getTransactionEditorState().isSaving).toBe(false);
    });
  });

  // ===========================================================================
  // AC4: Direct Access Functions Tests
  // ===========================================================================

  describe('Direct Access Functions (AC4)', () => {
    describe('getTransactionEditorState', () => {
      it('should return current state snapshot', () => {
        const state = getTransactionEditorState();

        expect(state.currentTransaction).toBeNull();
        expect(state.navigationList).toBeNull();
        expect(state.mode).toBe('new');
        expect(state.isReadOnly).toBe(false);
      });

      it('should reflect state changes', () => {
        const tx = createMockTransaction();
        act(() => {
          useTransactionEditorStore.setState({
            currentTransaction: tx,
            mode: 'existing',
            isReadOnly: true,
          });
        });

        const state = getTransactionEditorState();
        expect(state.currentTransaction).toEqual(tx);
        expect(state.mode).toBe('existing');
        expect(state.isReadOnly).toBe(true);
      });
    });

    describe('transactionEditorActions', () => {
      it('should have all 9 action functions', () => {
        expect(typeof transactionEditorActions.setTransaction).toBe('function');
        expect(typeof transactionEditorActions.clearTransaction).toBe('function');
        expect(typeof transactionEditorActions.setMode).toBe('function');
        expect(typeof transactionEditorActions.setReadOnly).toBe('function');
        expect(typeof transactionEditorActions.setCreditUsed).toBe('function');
        expect(typeof transactionEditorActions.setAnimateItems).toBe('function');
        expect(typeof transactionEditorActions.setNavigationList).toBe('function');
        expect(typeof transactionEditorActions.setSaving).toBe('function');
        expect(typeof transactionEditorActions.reset).toBe('function');
      });

      it('setTransaction should work outside React', () => {
        const tx = createMockTransaction();
        transactionEditorActions.setTransaction(tx);
        expect(getTransactionEditorState().currentTransaction).toEqual(tx);
      });

      it('clearTransaction should work outside React', () => {
        transactionEditorActions.setTransaction(createMockTransaction());
        expect(getTransactionEditorState().currentTransaction).not.toBeNull();

        transactionEditorActions.clearTransaction();
        expect(getTransactionEditorState().currentTransaction).toBeNull();
      });

      it('setMode should work outside React', () => {
        transactionEditorActions.setMode('existing');
        expect(getTransactionEditorState().mode).toBe('existing');
      });

      it('setReadOnly should work outside React', () => {
        transactionEditorActions.setReadOnly(true);
        expect(getTransactionEditorState().isReadOnly).toBe(true);
      });

      it('setCreditUsed should work outside React', () => {
        transactionEditorActions.setCreditUsed(true);
        expect(getTransactionEditorState().creditUsedInSession).toBe(true);
      });

      it('setAnimateItems should work outside React', () => {
        transactionEditorActions.setAnimateItems(true);
        expect(getTransactionEditorState().animateItems).toBe(true);
      });

      it('setNavigationList should work outside React', () => {
        const ids = ['tx-1', 'tx-2'];
        transactionEditorActions.setNavigationList(ids);
        expect(getTransactionEditorState().navigationList).toEqual(ids);
      });

      it('setSaving should work outside React', () => {
        transactionEditorActions.setSaving(true);
        expect(getTransactionEditorState().isSaving).toBe(true);
      });

      it('reset should work outside React', () => {
        // Set some state
        transactionEditorActions.setTransaction(createMockTransaction());
        transactionEditorActions.setMode('existing');
        transactionEditorActions.setSaving(true);

        transactionEditorActions.reset();

        expect(getTransactionEditorState().currentTransaction).toBeNull();
        expect(getTransactionEditorState().mode).toBe('new');
        expect(getTransactionEditorState().isSaving).toBe(false);
      });

      it('should support complete editing workflow outside React', () => {
        // Simulate editing workflow
        const tx = createMockTransaction();

        // Start editing
        transactionEditorActions.setTransaction(tx);
        transactionEditorActions.setMode('existing');
        transactionEditorActions.setNavigationList(['tx-1', 'tx-2', 'tx-3']);
        transactionEditorActions.setAnimateItems(true);

        expect(getTransactionEditorState().currentTransaction).toEqual(tx);
        expect(getTransactionEditorState().mode).toBe('existing');
        expect(getTransactionEditorState().navigationList).toHaveLength(3);

        // Start saving
        transactionEditorActions.setSaving(true);
        expect(getTransactionEditorState().isSaving).toBe(true);

        // Complete save
        transactionEditorActions.setSaving(false);
        transactionEditorActions.reset();

        expect(getTransactionEditorState().currentTransaction).toBeNull();
        expect(getTransactionEditorState().mode).toBe('new');
      });
    });
  });

  // ===========================================================================
  // AC5.3: Selector Stability Tests
  // ===========================================================================

  describe('Selector Stability', () => {
    it('individual selectors should only re-render when their value changes', () => {
      const { result: modeResult, rerender: rerenderMode } = renderHook(() => useEditorMode());
      const initialMode = modeResult.current;

      // Change a different state value
      act(() => {
        useTransactionEditorStore.setState({ isSaving: true });
      });

      rerenderMode();
      expect(modeResult.current).toBe(initialMode);
    });

    it('computed selectors should update when dependencies change', () => {
      const { result, rerender } = renderHook(() => useIsEditing());

      expect(result.current).toBe(false);

      act(() => {
        useTransactionEditorStore.setState({ currentTransaction: createMockTransaction() });
      });

      rerender();
      expect(result.current).toBe(true);
    });
  });

  // ===========================================================================
  // AC5.4: Edge Case Tests
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle rapid state updates', () => {
      act(() => {
        for (let i = 0; i < 100; i++) {
          useTransactionEditorStore.getState().setSaving(i % 2 === 0);
        }
      });

      // After 100 updates (i=0 to 99), last call is i=99 which is odd,
      // so isSaving should be false (99 % 2 !== 0)
      expect(getTransactionEditorState().isSaving).toBe(false);
    });

    it('should handle setting same value multiple times', () => {
      const tx = createMockTransaction();
      act(() => {
        useTransactionEditorStore.getState().setTransaction(tx);
        useTransactionEditorStore.getState().setTransaction(tx);
        useTransactionEditorStore.getState().setTransaction(tx);
      });

      expect(getTransactionEditorState().currentTransaction).toEqual(tx);
    });

    it('should handle multiple resets', () => {
      act(() => {
        useTransactionEditorStore.getState().setTransaction(createMockTransaction());
        useTransactionEditorStore.getState().reset();
        useTransactionEditorStore.getState().reset();
        useTransactionEditorStore.getState().reset();
      });

      expect(getTransactionEditorState().currentTransaction).toBeNull();
    });
  });

  // ===========================================================================
  // AC5.5: Module Exports Tests
  // ===========================================================================

  describe('Module Exports (AC5.5)', () => {
    it('should export useTransactionEditorStore from @features/transaction-editor', () => {
      expect(useTransactionEditorStore).toBeDefined();
    });

    it('should export initialTransactionEditorState from @features/transaction-editor', () => {
      expect(initialTransactionEditorState).toBeDefined();
    });

    it('should export all 7 individual selectors from @features/transaction-editor', () => {
      expect(useCurrentTransaction).toBeDefined();
      expect(useEditorMode).toBeDefined();
      expect(useIsReadOnly).toBeDefined();
      expect(useIsSaving).toBeDefined();
      expect(useAnimateItems).toBeDefined();
      expect(useCreditUsedInSession).toBeDefined();
      expect(useNavigationList).toBeDefined();
    });

    it('should export all 3 computed selectors from @features/transaction-editor', () => {
      expect(useIsEditing).toBeDefined();
      expect(useCanNavigate).toBeDefined();
      expect(useHasUnsavedChanges).toBeDefined();
    });

    it('should export useTransactionEditorActions from @features/transaction-editor', () => {
      expect(useTransactionEditorActions).toBeDefined();
    });

    it('should export getTransactionEditorState from @features/transaction-editor', () => {
      expect(getTransactionEditorState).toBeDefined();
    });

    it('should export transactionEditorActions from @features/transaction-editor', () => {
      expect(transactionEditorActions).toBeDefined();
    });
  });
});
