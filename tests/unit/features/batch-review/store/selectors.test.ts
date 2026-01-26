/**
 * Story 14e-13: Batch Review Store Selectors Tests
 *
 * Tests for the batch review Zustand store selectors covering:
 * - Phase selectors (AC1)
 * - Data selectors (AC2)
 * - Computed selectors (AC3)
 * - Action hook (AC4)
 * - Direct access functions (AC5)
 * - Module exports (AC6)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useBatchReviewStore,
  initialBatchReviewState,
  // Phase selectors
  useBatchReviewPhase,
  useIsBatchReviewing,
  useIsEditing,
  useIsSaving,
  useIsComplete,
  useHasBatchError,
  // Data selectors
  useBatchItems,
  useCurrentBatchItem,
  useCurrentBatchIndex,
  useEditingReceiptId,
  // Computed selectors
  useBatchProgress,
  useBatchTotalAmount,
  useValidBatchCount,
  useIsBatchEmpty,
  // Actions hook
  useBatchReviewActions,
  // Direct access
  getBatchReviewState,
  batchReviewActions,
} from '@features/batch-review';
import type { BatchReceipt } from '@/types/batchReceipt';
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
    date: '2026-01-26',
    merchant: 'Test Merchant',
    category: 'Supermarket',
    total: 1000,
    items: [{ name: 'Test Item', price: 1000, qty: 1 }],
    currency: 'CLP',
    ...overrides,
  };
}

/**
 * Create mock batch receipts for testing.
 */
function createMockBatchReceipts(count: number = 3): BatchReceipt[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `receipt-${i}`,
    index: i,
    transaction: createMockTransaction({
      id: `tx-${i}`,
      merchant: `Store ${i}`,
      total: (i + 1) * 1000,
    }),
    status: i === 0 ? 'ready' : i === 1 ? 'review' : 'error',
    confidence: i === 0 ? 0.95 : i === 1 ? 0.6 : 0,
    error: i === 2 ? 'Processing failed' : undefined,
  })) as BatchReceipt[];
}

/**
 * Reset store to initial state before each test.
 */
function resetStore() {
  useBatchReviewStore.setState(initialBatchReviewState);
}

// =============================================================================
// Tests
// =============================================================================

describe('Batch Review Selectors', () => {
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
  // AC1: Phase Selectors
  // ===========================================================================

  describe('Phase Selectors (AC1)', () => {
    describe('useBatchReviewPhase', () => {
      it('should return idle phase for initial state', () => {
        const { result } = renderHook(() => useBatchReviewPhase());
        expect(result.current).toBe('idle');
      });

      it('should return reviewing phase after loadBatch', () => {
        act(() => {
          useBatchReviewStore.getState().loadBatch(createMockBatchReceipts(3));
        });

        const { result } = renderHook(() => useBatchReviewPhase());
        expect(result.current).toBe('reviewing');
      });

      it('should update when phase changes', () => {
        const { result, rerender } = renderHook(() => useBatchReviewPhase());

        expect(result.current).toBe('idle');

        act(() => {
          useBatchReviewStore.setState({ phase: 'saving' });
        });

        rerender();
        expect(result.current).toBe('saving');
      });
    });

    describe('useIsBatchReviewing', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useIsBatchReviewing());
        expect(result.current).toBe(false);
      });

      it('should return true when phase is reviewing', () => {
        act(() => {
          useBatchReviewStore.setState({ phase: 'reviewing' });
        });

        const { result } = renderHook(() => useIsBatchReviewing());
        expect(result.current).toBe(true);
      });

      it('should return false for other phases', () => {
        const phases = ['idle', 'editing', 'saving', 'complete', 'error'] as const;

        for (const phase of phases) {
          act(() => {
            useBatchReviewStore.setState({ phase });
          });

          const { result } = renderHook(() => useIsBatchReviewing());
          expect(result.current).toBe(false);
        }
      });
    });

    describe('useIsEditing', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useIsEditing());
        expect(result.current).toBe(false);
      });

      it('should return true when phase is editing', () => {
        act(() => {
          useBatchReviewStore.setState({ phase: 'editing' });
        });

        const { result } = renderHook(() => useIsEditing());
        expect(result.current).toBe(true);
      });
    });

    describe('useIsSaving', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useIsSaving());
        expect(result.current).toBe(false);
      });

      it('should return true when phase is saving', () => {
        act(() => {
          useBatchReviewStore.setState({ phase: 'saving' });
        });

        const { result } = renderHook(() => useIsSaving());
        expect(result.current).toBe(true);
      });
    });

    describe('useIsComplete', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useIsComplete());
        expect(result.current).toBe(false);
      });

      it('should return true when phase is complete', () => {
        act(() => {
          useBatchReviewStore.setState({ phase: 'complete' });
        });

        const { result } = renderHook(() => useIsComplete());
        expect(result.current).toBe(true);
      });
    });

    describe('useHasBatchError', () => {
      it('should return false for initial state', () => {
        const { result } = renderHook(() => useHasBatchError());
        expect(result.current).toBe(false);
      });

      it('should return true when phase is error', () => {
        act(() => {
          useBatchReviewStore.setState({ phase: 'error' });
        });

        const { result } = renderHook(() => useHasBatchError());
        expect(result.current).toBe(true);
      });
    });
  });

  // ===========================================================================
  // AC2: Data Selectors
  // ===========================================================================

  describe('Data Selectors (AC2)', () => {
    describe('useBatchItems', () => {
      it('should return empty array for initial state', () => {
        const { result } = renderHook(() => useBatchItems());
        expect(result.current).toEqual([]);
      });

      it('should return items after loadBatch', () => {
        const receipts = createMockBatchReceipts(3);
        act(() => {
          useBatchReviewStore.getState().loadBatch(receipts);
        });

        const { result } = renderHook(() => useBatchItems());
        expect(result.current).toHaveLength(3);
        expect(result.current[0].id).toBe('receipt-0');
      });
    });

    describe('useCurrentBatchIndex', () => {
      it('should return 0 for initial state', () => {
        const { result } = renderHook(() => useCurrentBatchIndex());
        expect(result.current).toBe(0);
      });

      it('should update when selectItem is called', () => {
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: createMockBatchReceipts(5),
          });
        });

        const { result, rerender } = renderHook(() => useCurrentBatchIndex());
        expect(result.current).toBe(0);

        act(() => {
          useBatchReviewStore.getState().selectItem(3);
        });

        rerender();
        expect(result.current).toBe(3);
      });
    });

    describe('useEditingReceiptId', () => {
      it('should return null for initial state', () => {
        const { result } = renderHook(() => useEditingReceiptId());
        expect(result.current).toBeNull();
      });

      it('should return receipt ID when editing', () => {
        act(() => {
          useBatchReviewStore.setState({
            phase: 'editing',
            editingReceiptId: 'receipt-1',
          });
        });

        const { result } = renderHook(() => useEditingReceiptId());
        expect(result.current).toBe('receipt-1');
      });
    });

    describe('useCurrentBatchItem', () => {
      it('should return undefined when items array is empty', () => {
        const { result } = renderHook(() => useCurrentBatchItem());
        expect(result.current).toBeUndefined();
      });

      it('should return current item based on currentIndex', () => {
        const receipts = createMockBatchReceipts(3);
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: receipts,
            currentIndex: 1,
          });
        });

        const { result } = renderHook(() => useCurrentBatchItem());
        expect(result.current?.id).toBe('receipt-1');
      });

      it('should update when currentIndex changes', () => {
        const receipts = createMockBatchReceipts(3);
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: receipts,
            currentIndex: 0,
          });
        });

        const { result, rerender } = renderHook(() => useCurrentBatchItem());
        expect(result.current?.id).toBe('receipt-0');

        act(() => {
          useBatchReviewStore.getState().selectItem(2);
        });

        rerender();
        expect(result.current?.id).toBe('receipt-2');
      });
    });
  });

  // ===========================================================================
  // AC3: Computed Selectors
  // ===========================================================================

  describe('Computed Selectors (AC3)', () => {
    describe('useBatchProgress', () => {
      it('should return zero values for initial state', () => {
        const { result } = renderHook(() => useBatchProgress());
        expect(result.current).toEqual({
          current: 0,
          total: 0,
          saved: 0,
          failed: 0,
        });
      });

      it('should return correct progress values', () => {
        act(() => {
          useBatchReviewStore.setState({
            phase: 'saving',
            items: createMockBatchReceipts(5),
            currentIndex: 2,
            savedCount: 3,
            failedCount: 1,
          });
        });

        const { result } = renderHook(() => useBatchProgress());
        expect(result.current).toEqual({
          current: 2,
          total: 5,
          saved: 3,
          failed: 1,
        });
      });
    });

    describe('useBatchTotalAmount', () => {
      it('should return 0 for empty items', () => {
        const { result } = renderHook(() => useBatchTotalAmount());
        expect(result.current).toBe(0);
      });

      it('should sum totals of non-error receipts only', () => {
        // receipts: receipt-0 (ready, total=1000), receipt-1 (review, total=2000), receipt-2 (error, total=3000)
        const receipts = createMockBatchReceipts(3);
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: receipts,
          });
        });

        const { result } = renderHook(() => useBatchTotalAmount());
        // Only receipt-0 (1000) + receipt-1 (2000) = 3000 (error receipts excluded)
        expect(result.current).toBe(3000);
      });

      it('should handle receipts with undefined totals', () => {
        const receipts: BatchReceipt[] = [
          {
            id: 'receipt-0',
            index: 0,
            transaction: createMockTransaction({ total: undefined as unknown as number }),
            status: 'ready',
            confidence: 0.9,
          },
          {
            id: 'receipt-1',
            index: 1,
            transaction: createMockTransaction({ total: 500 }),
            status: 'ready',
            confidence: 0.9,
          },
        ];
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: receipts,
          });
        });

        const { result } = renderHook(() => useBatchTotalAmount());
        expect(result.current).toBe(500);
      });
    });

    describe('useValidBatchCount', () => {
      it('should return 0 for empty items', () => {
        const { result } = renderHook(() => useValidBatchCount());
        expect(result.current).toBe(0);
      });

      it('should count non-error receipts only', () => {
        const receipts = createMockBatchReceipts(3);
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: receipts,
          });
        });

        const { result } = renderHook(() => useValidBatchCount());
        // receipt-0 (ready) + receipt-1 (review) = 2 valid (receipt-2 is error)
        expect(result.current).toBe(2);
      });
    });

    describe('useIsBatchEmpty', () => {
      it('should return true for initial state', () => {
        const { result } = renderHook(() => useIsBatchEmpty());
        expect(result.current).toBe(true);
      });

      it('should return false when items exist', () => {
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: createMockBatchReceipts(1),
          });
        });

        const { result } = renderHook(() => useIsBatchEmpty());
        expect(result.current).toBe(false);
      });

      it('should return true after all items discarded', () => {
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: createMockBatchReceipts(1),
          });
        });

        const { result, rerender } = renderHook(() => useIsBatchEmpty());
        expect(result.current).toBe(false);

        act(() => {
          useBatchReviewStore.getState().discardItem('receipt-0');
        });

        rerender();
        expect(result.current).toBe(true);
      });
    });
  });

  // ===========================================================================
  // AC4: useBatchReviewActions Hook
  // ===========================================================================

  describe('useBatchReviewActions Hook (AC4)', () => {
    it('should return all action functions', () => {
      const { result } = renderHook(() => useBatchReviewActions());

      // Lifecycle actions
      expect(typeof result.current.loadBatch).toBe('function');
      expect(typeof result.current.reset).toBe('function');

      // Item actions
      expect(typeof result.current.selectItem).toBe('function');
      expect(typeof result.current.updateItem).toBe('function');
      expect(typeof result.current.discardItem).toBe('function');

      // Edit actions
      expect(typeof result.current.startEditing).toBe('function');
      expect(typeof result.current.finishEditing).toBe('function');

      // Save actions
      expect(typeof result.current.saveStart).toBe('function');
      expect(typeof result.current.saveItemSuccess).toBe('function');
      expect(typeof result.current.saveItemFailure).toBe('function');
      expect(typeof result.current.saveComplete).toBe('function');
    });

    it('should provide stable action references for all 11 actions', () => {
      const { result, rerender } = renderHook(() => useBatchReviewActions());

      // Capture all 11 action references
      const refs = {
        // Lifecycle actions
        loadBatch: result.current.loadBatch,
        reset: result.current.reset,
        // Item actions
        selectItem: result.current.selectItem,
        updateItem: result.current.updateItem,
        discardItem: result.current.discardItem,
        // Edit actions
        startEditing: result.current.startEditing,
        finishEditing: result.current.finishEditing,
        // Save actions
        saveStart: result.current.saveStart,
        saveItemSuccess: result.current.saveItemSuccess,
        saveItemFailure: result.current.saveItemFailure,
        saveComplete: result.current.saveComplete,
      };

      // Trigger state change
      act(() => {
        useBatchReviewStore.setState({ phase: 'reviewing' });
      });

      rerender();

      // All 11 actions should still be the same reference
      expect(result.current.loadBatch).toBe(refs.loadBatch);
      expect(result.current.reset).toBe(refs.reset);
      expect(result.current.selectItem).toBe(refs.selectItem);
      expect(result.current.updateItem).toBe(refs.updateItem);
      expect(result.current.discardItem).toBe(refs.discardItem);
      expect(result.current.startEditing).toBe(refs.startEditing);
      expect(result.current.finishEditing).toBe(refs.finishEditing);
      expect(result.current.saveStart).toBe(refs.saveStart);
      expect(result.current.saveItemSuccess).toBe(refs.saveItemSuccess);
      expect(result.current.saveItemFailure).toBe(refs.saveItemFailure);
      expect(result.current.saveComplete).toBe(refs.saveComplete);
    });

    it('should execute actions correctly', () => {
      const { result } = renderHook(() => useBatchReviewActions());
      const receipts = createMockBatchReceipts(3);

      act(() => {
        result.current.loadBatch(receipts);
      });

      expect(useBatchReviewStore.getState().phase).toBe('reviewing');
      expect(useBatchReviewStore.getState().items).toHaveLength(3);

      act(() => {
        result.current.selectItem(2);
      });

      expect(useBatchReviewStore.getState().currentIndex).toBe(2);
    });
  });

  // ===========================================================================
  // AC5: Direct Access Functions
  // ===========================================================================

  describe('Direct Access Functions (AC5)', () => {
    describe('getBatchReviewState', () => {
      it('should return current state snapshot', () => {
        const state = getBatchReviewState();

        expect(state.phase).toBe('idle');
        expect(state.items).toEqual([]);
        expect(state.currentIndex).toBe(0);
      });

      it('should reflect state changes', () => {
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: createMockBatchReceipts(2),
            currentIndex: 1,
          });
        });

        const state = getBatchReviewState();
        expect(state.phase).toBe('reviewing');
        expect(state.items).toHaveLength(2);
        expect(state.currentIndex).toBe(1);
      });
    });

    describe('batchReviewActions', () => {
      it('should have all action functions', () => {
        // Lifecycle
        expect(typeof batchReviewActions.loadBatch).toBe('function');
        expect(typeof batchReviewActions.reset).toBe('function');

        // Item
        expect(typeof batchReviewActions.selectItem).toBe('function');
        expect(typeof batchReviewActions.updateItem).toBe('function');
        expect(typeof batchReviewActions.discardItem).toBe('function');

        // Edit
        expect(typeof batchReviewActions.startEditing).toBe('function');
        expect(typeof batchReviewActions.finishEditing).toBe('function');

        // Save
        expect(typeof batchReviewActions.saveStart).toBe('function');
        expect(typeof batchReviewActions.saveItemSuccess).toBe('function');
        expect(typeof batchReviewActions.saveItemFailure).toBe('function');
        expect(typeof batchReviewActions.saveComplete).toBe('function');
      });

      it('loadBatch should work outside React', () => {
        const receipts = createMockBatchReceipts(3);

        batchReviewActions.loadBatch(receipts);

        expect(getBatchReviewState().phase).toBe('reviewing');
        expect(getBatchReviewState().items).toHaveLength(3);
      });

      it('reset should work outside React', () => {
        // First set some state
        batchReviewActions.loadBatch(createMockBatchReceipts(3));
        expect(getBatchReviewState().phase).toBe('reviewing');

        batchReviewActions.reset();

        expect(getBatchReviewState().phase).toBe('idle');
        expect(getBatchReviewState().items).toHaveLength(0);
      });

      it('selectItem should work outside React', () => {
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: createMockBatchReceipts(5),
          });
        });

        batchReviewActions.selectItem(3);

        expect(getBatchReviewState().currentIndex).toBe(3);
      });

      it('save workflow should work outside React', () => {
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: createMockBatchReceipts(3),
          });
        });

        // Spy on console warnings to verify expected DEV warnings are logged
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        batchReviewActions.saveStart();
        expect(getBatchReviewState().phase).toBe('saving');

        batchReviewActions.saveItemSuccess('receipt-0');
        batchReviewActions.saveItemSuccess('receipt-1');
        batchReviewActions.saveItemFailure('receipt-2', 'Error');
        batchReviewActions.saveComplete();

        expect(getBatchReviewState().phase).toBe('complete');
        expect(getBatchReviewState().savedCount).toBe(2);
        expect(getBatchReviewState().failedCount).toBe(1);

        // Verify expected DEV warning was logged for saveItemFailure
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[BatchReviewStore] saveItemFailure')
        );

        consoleWarnSpy.mockRestore();
      });

      it('edit workflow should work outside React', () => {
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: createMockBatchReceipts(3),
          });
        });

        batchReviewActions.startEditing('receipt-1');
        expect(getBatchReviewState().phase).toBe('editing');
        expect(getBatchReviewState().editingReceiptId).toBe('receipt-1');

        batchReviewActions.updateItem('receipt-1', { status: 'edited' });
        expect(getBatchReviewState().items[1].status).toBe('edited');

        batchReviewActions.finishEditing();
        expect(getBatchReviewState().phase).toBe('reviewing');
        expect(getBatchReviewState().editingReceiptId).toBeNull();
      });

      it('discardItem should work outside React', () => {
        act(() => {
          useBatchReviewStore.setState({
            phase: 'reviewing',
            items: createMockBatchReceipts(3),
          });
        });

        batchReviewActions.discardItem('receipt-1');

        expect(getBatchReviewState().items).toHaveLength(2);
        expect(getBatchReviewState().items.find((r: BatchReceipt) => r.id === 'receipt-1')).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // AC6: Module Exports
  // ===========================================================================

  describe('Module Exports (AC6)', () => {
    it('should export all phase selectors from @features/batch-review', () => {
      expect(useBatchReviewPhase).toBeDefined();
      expect(useIsBatchReviewing).toBeDefined();
      expect(useIsEditing).toBeDefined();
      expect(useIsSaving).toBeDefined();
      expect(useIsComplete).toBeDefined();
      expect(useHasBatchError).toBeDefined();
    });

    it('should export all data selectors from @features/batch-review', () => {
      expect(useBatchItems).toBeDefined();
      expect(useCurrentBatchItem).toBeDefined();
      expect(useCurrentBatchIndex).toBeDefined();
      expect(useEditingReceiptId).toBeDefined();
    });

    it('should export all computed selectors from @features/batch-review', () => {
      expect(useBatchProgress).toBeDefined();
      expect(useBatchTotalAmount).toBeDefined();
      expect(useValidBatchCount).toBeDefined();
      expect(useIsBatchEmpty).toBeDefined();
    });

    it('should export useBatchReviewActions from @features/batch-review', () => {
      expect(useBatchReviewActions).toBeDefined();
    });

    it('should export getBatchReviewState from @features/batch-review', () => {
      expect(getBatchReviewState).toBeDefined();
    });

    it('should export batchReviewActions from @features/batch-review', () => {
      expect(batchReviewActions).toBeDefined();
    });

    it('should export useBatchReviewStore from @features/batch-review', () => {
      expect(useBatchReviewStore).toBeDefined();
    });

    it('should export initialBatchReviewState from @features/batch-review', () => {
      expect(initialBatchReviewState).toBeDefined();
    });
  });

  // ===========================================================================
  // AC7: Selector Stability
  // ===========================================================================

  describe('Selector Stability (AC7)', () => {
    it('phase selectors should only re-render when phase changes', () => {
      const { result: phaseResult, rerender: rerenderPhase } = renderHook(() => useBatchReviewPhase());
      const initialPhase = phaseResult.current;

      // Change non-phase state
      act(() => {
        useBatchReviewStore.setState({ currentIndex: 5 });
      });

      rerenderPhase();
      expect(phaseResult.current).toBe(initialPhase); // Same value
    });

    it('data selectors should track their specific values', () => {
      act(() => {
        useBatchReviewStore.setState({
          phase: 'reviewing',
          items: createMockBatchReceipts(3),
          currentIndex: 0,
        });
      });

      const { result: indexResult, rerender: rerenderIndex } = renderHook(() => useCurrentBatchIndex());

      expect(indexResult.current).toBe(0);

      // Change phase (not index)
      act(() => {
        useBatchReviewStore.setState({ phase: 'editing' });
      });

      rerenderIndex();
      expect(indexResult.current).toBe(0); // Index unchanged
    });

    it('computed selectors should update when dependencies change', () => {
      act(() => {
        useBatchReviewStore.setState({
          phase: 'saving',
          items: createMockBatchReceipts(3),
          savedCount: 0,
          failedCount: 0,
        });
      });

      const { result, rerender } = renderHook(() => useBatchProgress());

      expect(result.current.saved).toBe(0);

      // Increment savedCount
      act(() => {
        useBatchReviewStore.setState({ savedCount: 2 });
      });

      rerender();
      expect(result.current.saved).toBe(2);
    });
  });
});
