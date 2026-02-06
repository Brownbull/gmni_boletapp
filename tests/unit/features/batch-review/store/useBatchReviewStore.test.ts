/**
 * Story 14e-12a & 14e-12b: Batch Review Zustand Store Tests
 *
 * Comprehensive tests for the batch review Zustand store covering:
 * - Initial state verification (AC7 - 14e-12a)
 * - loadBatch() transitions to reviewing (AC7 - 14e-12a)
 * - reset() returns to idle (AC7 - 14e-12a)
 * - Item actions modify state correctly (AC7 - 14e-12a)
 * - Save actions (AC1 - 14e-12b)
 * - Edit actions (AC2 - 14e-12b)
 * - Phase guards (AC3, AC4, AC5 - 14e-12b)
 * - Phase transition matrix (AC6 - 14e-12b)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useBatchReviewStore,
  initialBatchReviewState,
} from '@features/batch-review/store';
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
    transaction: createMockTransaction({ id: `tx-${i}`, merchant: `Store ${i}` }),
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

/**
 * Get state-only object for comparison (excludes action functions).
 */
function getStateOnly() {
  const state = useBatchReviewStore.getState();
  return {
    phase: state.phase,
    items: state.items,
    currentIndex: state.currentIndex,
    savedCount: state.savedCount,
    failedCount: state.failedCount,
    error: state.error,
    editingReceiptId: state.editingReceiptId,
    hadItems: state.hadItems,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('useBatchReviewStore', () => {
  beforeEach(() => {
    // Wrap in act() to prevent React act() warnings when tests use renderHook
    act(() => {
      resetStore();
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Wrap in act() to prevent React act() warnings when tests use renderHook
    act(() => {
      resetStore();
    });
  });

  // ===========================================================================
  // AC7: Initial state verification
  // ===========================================================================

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = getStateOnly();

      expect(state).toEqual({
        phase: 'idle',
        items: [],
        currentIndex: 0,
        savedCount: 0,
        failedCount: 0,
        error: null,
        editingReceiptId: null,
        hadItems: false,
      });
    });

    it('should export initialBatchReviewState matching store initial state', () => {
      expect(initialBatchReviewState).toEqual({
        phase: 'idle',
        items: [],
        currentIndex: 0,
        savedCount: 0,
        failedCount: 0,
        error: null,
        editingReceiptId: null,
        hadItems: false,
      });
    });
  });

  // ===========================================================================
  // AC7: loadBatch() transitions to reviewing
  // ===========================================================================

  describe('loadBatch action', () => {
    it('should transition from idle to reviewing when loading batch', () => {
      const receipts = createMockBatchReceipts(3);
      const { loadBatch } = useBatchReviewStore.getState();

      act(() => {
        loadBatch(receipts);
      });

      const state = getStateOnly();
      expect(state.phase).toBe('reviewing');
      expect(state.items).toHaveLength(3);
      expect(state.items[0].id).toBe('receipt-0');
      expect(state.currentIndex).toBe(0);
      expect(state.savedCount).toBe(0);
      expect(state.failedCount).toBe(0);
      expect(state.error).toBeNull();
    });

    it('should reset counters when loading batch', () => {
      // Manually set some state
      useBatchReviewStore.setState({
        savedCount: 5,
        failedCount: 2,
        error: 'Previous error',
      });

      const receipts = createMockBatchReceipts(2);
      const { loadBatch } = useBatchReviewStore.getState();

      act(() => {
        loadBatch(receipts);
      });

      const state = getStateOnly();
      expect(state.savedCount).toBe(0);
      expect(state.failedCount).toBe(0);
      expect(state.error).toBeNull();
    });

    it('should NOT allow loadBatch when not in idle phase', () => {
      // Set to reviewing phase first
      useBatchReviewStore.setState({ phase: 'reviewing', items: createMockBatchReceipts(1) });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const newReceipts = createMockBatchReceipts(5);
      const { loadBatch } = useBatchReviewStore.getState();

      act(() => {
        loadBatch(newReceipts);
      });

      const state = getStateOnly();
      // Should still have 1 item, not 5
      expect(state.items).toHaveLength(1);

      consoleWarnSpy.mockRestore();
    });

    it('should work with empty receipts array', () => {
      const { loadBatch } = useBatchReviewStore.getState();

      act(() => {
        loadBatch([]);
      });

      const state = getStateOnly();
      expect(state.phase).toBe('reviewing');
      expect(state.items).toHaveLength(0);
    });
  });

  // ===========================================================================
  // AC7: reset() returns to idle
  // ===========================================================================

  describe('reset action', () => {
    it('should return to idle state when reset', () => {
      // First load a batch
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: receipts,
        currentIndex: 2,
        savedCount: 1,
        failedCount: 1,
        error: 'Some error',
        editingReceiptId: 'receipt-1',
      });

      const { reset } = useBatchReviewStore.getState();

      act(() => {
        reset();
      });

      const state = getStateOnly();
      expect(state).toEqual(initialBatchReviewState);
    });

    it('should work from any phase', () => {
      const phases = ['loading', 'reviewing', 'editing', 'saving', 'complete', 'error'] as const;

      for (const phase of phases) {
        useBatchReviewStore.setState({
          phase,
          items: createMockBatchReceipts(2),
          currentIndex: 1,
        });

        const { reset } = useBatchReviewStore.getState();

        act(() => {
          reset();
        });

        const state = getStateOnly();
        expect(state.phase).toBe('idle');
        expect(state.items).toHaveLength(0);
      }
    });
  });

  // ===========================================================================
  // AC7: Item actions modify state correctly
  // ===========================================================================

  describe('selectItem action', () => {
    it('should update currentIndex when selecting valid item', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(5),
        currentIndex: 0,
      });

      const { selectItem } = useBatchReviewStore.getState();

      act(() => {
        selectItem(3);
      });

      expect(useBatchReviewStore.getState().currentIndex).toBe(3);
    });

    it('should NOT change currentIndex for invalid negative index', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(3),
        currentIndex: 1,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { selectItem } = useBatchReviewStore.getState();

      act(() => {
        selectItem(-1);
      });

      expect(useBatchReviewStore.getState().currentIndex).toBe(1);
      consoleWarnSpy.mockRestore();
    });

    it('should NOT change currentIndex for out of bounds index', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(3),
        currentIndex: 1,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { selectItem } = useBatchReviewStore.getState();

      act(() => {
        selectItem(5);
      });

      expect(useBatchReviewStore.getState().currentIndex).toBe(1);
      consoleWarnSpy.mockRestore();
    });

    it('should be blocked in idle phase', () => {
      useBatchReviewStore.setState({
        phase: 'idle',
        items: createMockBatchReceipts(3),
        currentIndex: 0,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { selectItem } = useBatchReviewStore.getState();

      act(() => {
        selectItem(2);
      });

      expect(useBatchReviewStore.getState().currentIndex).toBe(0);
      consoleWarnSpy.mockRestore();
    });

    it('should work in editing phase', () => {
      useBatchReviewStore.setState({
        phase: 'editing',
        items: createMockBatchReceipts(3),
        currentIndex: 0,
      });

      const { selectItem } = useBatchReviewStore.getState();

      act(() => {
        selectItem(2);
      });

      expect(useBatchReviewStore.getState().currentIndex).toBe(2);
    });
  });

  describe('updateItem action', () => {
    it('should update receipt by ID', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: receipts,
      });

      const { updateItem } = useBatchReviewStore.getState();

      act(() => {
        updateItem('receipt-1', { status: 'edited', confidence: 0.99 });
      });

      const state = useBatchReviewStore.getState();
      const updatedReceipt = state.items.find((r) => r.id === 'receipt-1');
      expect(updatedReceipt?.status).toBe('edited');
      expect(updatedReceipt?.confidence).toBe(0.99);
    });

    it('should preserve other receipt properties when updating', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: receipts,
      });

      const originalReceipt = receipts[1];
      const { updateItem } = useBatchReviewStore.getState();

      act(() => {
        updateItem('receipt-1', { status: 'edited' });
      });

      const state = useBatchReviewStore.getState();
      const updatedReceipt = state.items.find((r) => r.id === 'receipt-1');
      expect(updatedReceipt?.id).toBe(originalReceipt.id);
      expect(updatedReceipt?.index).toBe(originalReceipt.index);
      expect(updatedReceipt?.transaction).toEqual(originalReceipt.transaction);
    });

    it('should NOT update if receipt ID not found', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: receipts,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { updateItem } = useBatchReviewStore.getState();

      act(() => {
        updateItem('non-existent-id', { status: 'edited' });
      });

      const state = useBatchReviewStore.getState();
      // All items should be unchanged
      expect(state.items).toHaveLength(3);
      state.items.forEach((item, i) => {
        expect(item.id).toBe(`receipt-${i}`);
      });

      consoleWarnSpy.mockRestore();
    });

    it('should be blocked in idle phase', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'idle',
        items: receipts,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { updateItem } = useBatchReviewStore.getState();
      const originalStatus = receipts[1].status;

      act(() => {
        updateItem('receipt-1', { status: 'edited' });
      });

      const state = useBatchReviewStore.getState();
      expect(state.items[1].status).toBe(originalStatus);
      consoleWarnSpy.mockRestore();
    });

    it('should be blocked in saving phase', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'saving',
        items: receipts,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { updateItem } = useBatchReviewStore.getState();
      const originalStatus = receipts[1].status;

      act(() => {
        updateItem('receipt-1', { status: 'edited' });
      });

      const state = useBatchReviewStore.getState();
      expect(state.items[1].status).toBe(originalStatus);
      consoleWarnSpy.mockRestore();
    });

    it('should work in editing phase', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'editing',
        items: receipts,
      });

      const { updateItem } = useBatchReviewStore.getState();

      act(() => {
        updateItem('receipt-1', { status: 'edited', confidence: 0.99 });
      });

      const state = useBatchReviewStore.getState();
      const updatedReceipt = state.items.find((r) => r.id === 'receipt-1');
      expect(updatedReceipt?.status).toBe('edited');
      expect(updatedReceipt?.confidence).toBe(0.99);
    });
  });

  describe('discardItem action', () => {
    it('should remove receipt from items array', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: receipts,
        currentIndex: 0,
      });

      const { discardItem } = useBatchReviewStore.getState();

      act(() => {
        discardItem('receipt-1');
      });

      const state = useBatchReviewStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items.find((r) => r.id === 'receipt-1')).toBeUndefined();
      expect(state.items[0].id).toBe('receipt-0');
      expect(state.items[1].id).toBe('receipt-2');
    });

    it('should adjust currentIndex when discarding item before it', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: receipts,
        currentIndex: 2, // Pointing to receipt-2
      });

      const { discardItem } = useBatchReviewStore.getState();

      act(() => {
        discardItem('receipt-0'); // Discard before current
      });

      const state = useBatchReviewStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.currentIndex).toBe(1); // Adjusted from 2 to 1
    });

    it('should adjust currentIndex when discarding last item that was selected', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: receipts,
        currentIndex: 2, // Pointing to last receipt
      });

      const { discardItem } = useBatchReviewStore.getState();

      act(() => {
        discardItem('receipt-2'); // Discard selected item (last)
      });

      const state = useBatchReviewStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.currentIndex).toBe(1); // Moved to new last item
    });

    it('should set currentIndex to 0 when all items discarded', () => {
      const receipts = createMockBatchReceipts(1);
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: receipts,
        currentIndex: 0,
      });

      const { discardItem } = useBatchReviewStore.getState();

      act(() => {
        discardItem('receipt-0');
      });

      const state = useBatchReviewStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.currentIndex).toBe(0);
    });

    it('should NOT discard if receipt ID not found', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: receipts,
        currentIndex: 1,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { discardItem } = useBatchReviewStore.getState();

      act(() => {
        discardItem('non-existent-id');
      });

      const state = useBatchReviewStore.getState();
      expect(state.items).toHaveLength(3);

      consoleWarnSpy.mockRestore();
    });

    it('should be blocked in idle phase', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'idle',
        items: receipts,
        currentIndex: 0,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { discardItem } = useBatchReviewStore.getState();

      act(() => {
        discardItem('receipt-1');
      });

      const state = useBatchReviewStore.getState();
      expect(state.items).toHaveLength(3);
      consoleWarnSpy.mockRestore();
    });

    it('should be blocked in saving phase', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'saving',
        items: receipts,
        currentIndex: 0,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { discardItem } = useBatchReviewStore.getState();

      act(() => {
        discardItem('receipt-1');
      });

      const state = useBatchReviewStore.getState();
      expect(state.items).toHaveLength(3);
      consoleWarnSpy.mockRestore();
    });

    it('should work in editing phase', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'editing',
        items: receipts,
        currentIndex: 0,
      });

      const { discardItem } = useBatchReviewStore.getState();

      act(() => {
        discardItem('receipt-1');
      });

      const state = useBatchReviewStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items.find((r) => r.id === 'receipt-1')).toBeUndefined();
    });
  });

  // ===========================================================================
  // Hook Usage Tests
  // ===========================================================================

  describe('Hook Usage', () => {
    it('should work with renderHook', () => {
      const { result } = renderHook(() => useBatchReviewStore());

      expect(result.current.phase).toBe('idle');
      expect(result.current.items).toEqual([]);
      expect(typeof result.current.loadBatch).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.selectItem).toBe('function');
      expect(typeof result.current.updateItem).toBe('function');
      expect(typeof result.current.discardItem).toBe('function');
      // 14e-12b actions
      expect(typeof result.current.saveStart).toBe('function');
      expect(typeof result.current.saveItemSuccess).toBe('function');
      expect(typeof result.current.saveItemFailure).toBe('function');
      expect(typeof result.current.saveComplete).toBe('function');
      expect(typeof result.current.startEditing).toBe('function');
      expect(typeof result.current.finishEditing).toBe('function');
    });

    it('should provide stable action references', () => {
      const { result, rerender } = renderHook(() => useBatchReviewStore());

      const loadBatch1 = result.current.loadBatch;
      const reset1 = result.current.reset;
      const saveStart1 = result.current.saveStart;
      const startEditing1 = result.current.startEditing;

      rerender();

      expect(result.current.loadBatch).toBe(loadBatch1);
      expect(result.current.reset).toBe(reset1);
      expect(result.current.saveStart).toBe(saveStart1);
      expect(result.current.startEditing).toBe(startEditing1);
    });
  });

  // ===========================================================================
  // Story 14e-12b: Save Actions (AC1)
  // ===========================================================================

  describe('saveStart action', () => {
    it('should transition from reviewing to saving', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(3),
      });

      const { saveStart } = useBatchReviewStore.getState();

      act(() => {
        saveStart();
      });

      expect(useBatchReviewStore.getState().phase).toBe('saving');
    });

    it('should be blocked from idle phase (AC3)', () => {
      useBatchReviewStore.setState({ phase: 'idle' });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { saveStart } = useBatchReviewStore.getState();

      act(() => {
        saveStart();
      });

      expect(useBatchReviewStore.getState().phase).toBe('idle');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot saveStart - invalid phase: idle')
      );
      consoleWarnSpy.mockRestore();
    });

    it('should be blocked from editing phase', () => {
      useBatchReviewStore.setState({
        phase: 'editing',
        items: createMockBatchReceipts(3),
        editingReceiptId: 'receipt-1',
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { saveStart } = useBatchReviewStore.getState();

      act(() => {
        saveStart();
      });

      expect(useBatchReviewStore.getState().phase).toBe('editing');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot saveStart - invalid phase: editing')
      );
      consoleWarnSpy.mockRestore();
    });

    it('should be blocked from saving phase', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { saveStart } = useBatchReviewStore.getState();

      act(() => {
        saveStart();
      });

      expect(useBatchReviewStore.getState().phase).toBe('saving');
      consoleWarnSpy.mockRestore();
    });

    it('should be blocked from complete phase', () => {
      useBatchReviewStore.setState({ phase: 'complete' });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { saveStart } = useBatchReviewStore.getState();

      act(() => {
        saveStart();
      });

      expect(useBatchReviewStore.getState().phase).toBe('complete');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveItemSuccess action', () => {
    it('should increment savedCount', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
        savedCount: 0,
      });

      const { saveItemSuccess } = useBatchReviewStore.getState();

      act(() => {
        saveItemSuccess('receipt-0');
      });

      expect(useBatchReviewStore.getState().savedCount).toBe(1);
    });

    it('should increment savedCount multiple times', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
        savedCount: 0,
      });

      const { saveItemSuccess } = useBatchReviewStore.getState();

      act(() => {
        saveItemSuccess('receipt-0');
        saveItemSuccess('receipt-1');
        saveItemSuccess('receipt-2');
      });

      expect(useBatchReviewStore.getState().savedCount).toBe(3);
    });
  });

  describe('saveItemFailure action', () => {
    it('should increment failedCount', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
        failedCount: 0,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { saveItemFailure } = useBatchReviewStore.getState();

      act(() => {
        saveItemFailure('receipt-0', 'Network error');
      });

      expect(useBatchReviewStore.getState().failedCount).toBe(1);
      consoleWarnSpy.mockRestore();
    });

    it('should increment failedCount multiple times', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
        failedCount: 0,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { saveItemFailure } = useBatchReviewStore.getState();

      act(() => {
        saveItemFailure('receipt-0', 'Network error');
        saveItemFailure('receipt-1', 'Timeout');
      });

      expect(useBatchReviewStore.getState().failedCount).toBe(2);
      consoleWarnSpy.mockRestore();
    });

    it('should log warning in DEV mode', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
        failedCount: 0,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { saveItemFailure } = useBatchReviewStore.getState();

      act(() => {
        saveItemFailure('receipt-0', 'Network error');
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("saveItemFailure: receipt 'receipt-0' failed: Network error")
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveComplete action', () => {
    it('should transition to complete when all items saved successfully', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
        savedCount: 3,
        failedCount: 0,
      });

      const { saveComplete } = useBatchReviewStore.getState();

      act(() => {
        saveComplete();
      });

      const state = useBatchReviewStore.getState();
      expect(state.phase).toBe('complete');
      expect(state.error).toBeNull();
    });

    it('should transition to complete when some items saved (mixed success/failure)', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
        savedCount: 2,
        failedCount: 1,
      });

      const { saveComplete } = useBatchReviewStore.getState();

      act(() => {
        saveComplete();
      });

      const state = useBatchReviewStore.getState();
      expect(state.phase).toBe('complete');
      expect(state.error).toBeNull();
    });

    it('should transition to error when all items failed', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
        savedCount: 0,
        failedCount: 3,
      });

      const { saveComplete } = useBatchReviewStore.getState();

      act(() => {
        saveComplete();
      });

      const state = useBatchReviewStore.getState();
      expect(state.phase).toBe('error');
      expect(state.error).toBe('All items failed to save');
    });

    it('should transition to complete for empty batch', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: [],
        savedCount: 0,
        failedCount: 0,
      });

      const { saveComplete } = useBatchReviewStore.getState();

      act(() => {
        saveComplete();
      });

      expect(useBatchReviewStore.getState().phase).toBe('complete');
    });
  });

  // ===========================================================================
  // Story 14e-12b: Edit Actions (AC2)
  // ===========================================================================

  describe('startEditing action', () => {
    it('should transition from reviewing to editing', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(3),
        editingReceiptId: null,
      });

      const { startEditing } = useBatchReviewStore.getState();

      act(() => {
        startEditing('receipt-1');
      });

      const state = useBatchReviewStore.getState();
      expect(state.phase).toBe('editing');
      expect(state.editingReceiptId).toBe('receipt-1');
    });

    it('should be blocked from idle phase (AC4)', () => {
      useBatchReviewStore.setState({
        phase: 'idle',
        items: createMockBatchReceipts(3),
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { startEditing } = useBatchReviewStore.getState();

      act(() => {
        startEditing('receipt-1');
      });

      expect(useBatchReviewStore.getState().phase).toBe('idle');
      expect(useBatchReviewStore.getState().editingReceiptId).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot startEditing - invalid phase: idle')
      );
      consoleWarnSpy.mockRestore();
    });

    it('should be blocked from saving phase (AC4)', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
        editingReceiptId: null,
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { startEditing } = useBatchReviewStore.getState();

      act(() => {
        startEditing('receipt-1');
      });

      expect(useBatchReviewStore.getState().phase).toBe('saving');
      expect(useBatchReviewStore.getState().editingReceiptId).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    it('should be blocked if receipt not found', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(3),
        editingReceiptId: null,
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { startEditing } = useBatchReviewStore.getState();

      act(() => {
        startEditing('non-existent-id');
      });

      expect(useBatchReviewStore.getState().phase).toBe('reviewing');
      expect(useBatchReviewStore.getState().editingReceiptId).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("startEditing: receipt not found with id 'non-existent-id'")
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('finishEditing action', () => {
    it('should transition from editing to reviewing', () => {
      useBatchReviewStore.setState({
        phase: 'editing',
        items: createMockBatchReceipts(3),
        editingReceiptId: 'receipt-1',
      });

      const { finishEditing } = useBatchReviewStore.getState();

      act(() => {
        finishEditing();
      });

      const state = useBatchReviewStore.getState();
      expect(state.phase).toBe('reviewing');
      expect(state.editingReceiptId).toBeNull();
    });

    it('should be blocked from reviewing phase (AC4)', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(3),
        editingReceiptId: null,
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { finishEditing } = useBatchReviewStore.getState();

      act(() => {
        finishEditing();
      });

      expect(useBatchReviewStore.getState().phase).toBe('reviewing');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot finishEditing - invalid phase: reviewing')
      );
      consoleWarnSpy.mockRestore();
    });

    it('should be blocked from idle phase (AC4)', () => {
      useBatchReviewStore.setState({ phase: 'idle' });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { finishEditing } = useBatchReviewStore.getState();

      act(() => {
        finishEditing();
      });

      expect(useBatchReviewStore.getState().phase).toBe('idle');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot finishEditing - invalid phase: idle')
      );
      consoleWarnSpy.mockRestore();
    });

    it('should be blocked from saving phase', () => {
      useBatchReviewStore.setState({
        phase: 'saving',
        items: createMockBatchReceipts(3),
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { finishEditing } = useBatchReviewStore.getState();

      act(() => {
        finishEditing();
      });

      expect(useBatchReviewStore.getState().phase).toBe('saving');
      consoleWarnSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Story 14e-12b: Discard During Save (AC5)
  // ===========================================================================

  describe('discardItem during saving (AC5)', () => {
    it('should be blocked with specific warning when phase is saving', () => {
      const receipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'saving',
        items: receipts,
        currentIndex: 0,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { discardItem } = useBatchReviewStore.getState();

      act(() => {
        discardItem('receipt-1');
      });

      const state = useBatchReviewStore.getState();
      expect(state.items).toHaveLength(3);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[BatchReviewStore] Cannot discardItem - save in progress'
      );
      consoleWarnSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Story 14e-12b: Phase Transition Matrix (AC6)
  // ===========================================================================

  describe('Phase Transition Matrix (AC6)', () => {
    describe('from idle phase', () => {
      beforeEach(() => {
        act(() => {
          useBatchReviewStore.setState({ ...initialBatchReviewState });
        });
      });

      it('loadBatch(receipts) → reviewing', () => {
        const { loadBatch } = useBatchReviewStore.getState();

        act(() => {
          loadBatch(createMockBatchReceipts(3));
        });

        expect(useBatchReviewStore.getState().phase).toBe('reviewing');
      });

      it('saveStart() → BLOCKED', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { saveStart } = useBatchReviewStore.getState();

        act(() => {
          saveStart();
        });

        expect(useBatchReviewStore.getState().phase).toBe('idle');
        consoleWarnSpy.mockRestore();
      });

      it('startEditing(id) → BLOCKED', () => {
        useBatchReviewStore.setState({ ...initialBatchReviewState, items: createMockBatchReceipts(3) });
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { startEditing } = useBatchReviewStore.getState();

        act(() => {
          startEditing('receipt-0');
        });

        expect(useBatchReviewStore.getState().phase).toBe('idle');
        consoleWarnSpy.mockRestore();
      });

      it('reset() → idle (no-op)', () => {
        const { reset } = useBatchReviewStore.getState();

        act(() => {
          reset();
        });

        expect(useBatchReviewStore.getState().phase).toBe('idle');
      });
    });

    describe('from reviewing phase', () => {
      beforeEach(() => {
        act(() => {
          useBatchReviewStore.setState({
            ...initialBatchReviewState,
            phase: 'reviewing',
            items: createMockBatchReceipts(3),
          });
        });
      });

      it('selectItem(i) → currentIndex = i', () => {
        const { selectItem } = useBatchReviewStore.getState();

        act(() => {
          selectItem(2);
        });

        expect(useBatchReviewStore.getState().currentIndex).toBe(2);
        expect(useBatchReviewStore.getState().phase).toBe('reviewing');
      });

      it('updateItem(id, data) → item updated', () => {
        const { updateItem } = useBatchReviewStore.getState();

        act(() => {
          updateItem('receipt-1', { status: 'edited' });
        });

        expect(useBatchReviewStore.getState().items[1].status).toBe('edited');
        expect(useBatchReviewStore.getState().phase).toBe('reviewing');
      });

      it('discardItem(id) → item removed', () => {
        const { discardItem } = useBatchReviewStore.getState();

        act(() => {
          discardItem('receipt-1');
        });

        expect(useBatchReviewStore.getState().items).toHaveLength(2);
        expect(useBatchReviewStore.getState().phase).toBe('reviewing');
      });

      it('startEditing(id) → editing', () => {
        const { startEditing } = useBatchReviewStore.getState();

        act(() => {
          startEditing('receipt-1');
        });

        expect(useBatchReviewStore.getState().phase).toBe('editing');
        expect(useBatchReviewStore.getState().editingReceiptId).toBe('receipt-1');
      });

      it('saveStart() → saving', () => {
        const { saveStart } = useBatchReviewStore.getState();

        act(() => {
          saveStart();
        });

        expect(useBatchReviewStore.getState().phase).toBe('saving');
      });

      it('reset() → idle', () => {
        const { reset } = useBatchReviewStore.getState();

        act(() => {
          reset();
        });

        expect(useBatchReviewStore.getState().phase).toBe('idle');
      });
    });

    describe('from editing phase', () => {
      beforeEach(() => {
        act(() => {
          useBatchReviewStore.setState({
            ...initialBatchReviewState,
            phase: 'editing',
            items: createMockBatchReceipts(3),
            editingReceiptId: 'receipt-1',
          });
        });
      });

      it('finishEditing() → reviewing', () => {
        const { finishEditing } = useBatchReviewStore.getState();

        act(() => {
          finishEditing();
        });

        expect(useBatchReviewStore.getState().phase).toBe('reviewing');
        expect(useBatchReviewStore.getState().editingReceiptId).toBeNull();
      });

      it('updateItem(id, data) → item updated', () => {
        const { updateItem } = useBatchReviewStore.getState();

        act(() => {
          updateItem('receipt-1', { confidence: 0.99 });
        });

        expect(useBatchReviewStore.getState().items[1].confidence).toBe(0.99);
        expect(useBatchReviewStore.getState().phase).toBe('editing');
      });

      it('saveStart() → BLOCKED', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { saveStart } = useBatchReviewStore.getState();

        act(() => {
          saveStart();
        });

        expect(useBatchReviewStore.getState().phase).toBe('editing');
        consoleWarnSpy.mockRestore();
      });
    });

    describe('from saving phase', () => {
      beforeEach(() => {
        act(() => {
          useBatchReviewStore.setState({
            ...initialBatchReviewState,
            phase: 'saving',
            items: createMockBatchReceipts(3),
            savedCount: 0,
            failedCount: 0,
          });
        });
      });

      it('saveItemSuccess(id) → savedCount++', () => {
        const { saveItemSuccess } = useBatchReviewStore.getState();

        act(() => {
          saveItemSuccess('receipt-0');
        });

        expect(useBatchReviewStore.getState().savedCount).toBe(1);
        expect(useBatchReviewStore.getState().phase).toBe('saving');
      });

      it('saveItemFailure(id, err) → failedCount++', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { saveItemFailure } = useBatchReviewStore.getState();

        act(() => {
          saveItemFailure('receipt-0', 'Error');
        });

        expect(useBatchReviewStore.getState().failedCount).toBe(1);
        expect(useBatchReviewStore.getState().phase).toBe('saving');
        consoleWarnSpy.mockRestore();
      });

      it('saveComplete() → complete (all success)', () => {
        useBatchReviewStore.setState({ savedCount: 3, failedCount: 0 });
        const { saveComplete } = useBatchReviewStore.getState();

        act(() => {
          saveComplete();
        });

        expect(useBatchReviewStore.getState().phase).toBe('complete');
      });

      it('saveComplete() → error (all failed)', () => {
        useBatchReviewStore.setState({ savedCount: 0, failedCount: 3 });
        const { saveComplete } = useBatchReviewStore.getState();

        act(() => {
          saveComplete();
        });

        expect(useBatchReviewStore.getState().phase).toBe('error');
      });

      it('discardItem(id) → BLOCKED', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { discardItem } = useBatchReviewStore.getState();

        act(() => {
          discardItem('receipt-1');
        });

        expect(useBatchReviewStore.getState().items).toHaveLength(3);
        consoleWarnSpy.mockRestore();
      });
    });

    describe('from complete phase', () => {
      beforeEach(() => {
        act(() => {
          useBatchReviewStore.setState({
            ...initialBatchReviewState,
            phase: 'complete',
            items: createMockBatchReceipts(3),
            savedCount: 3,
          });
        });
      });

      it('reset() → idle', () => {
        const { reset } = useBatchReviewStore.getState();

        act(() => {
          reset();
        });

        expect(useBatchReviewStore.getState().phase).toBe('idle');
      });
    });

    describe('from error phase', () => {
      beforeEach(() => {
        act(() => {
          useBatchReviewStore.setState({
            ...initialBatchReviewState,
            phase: 'error',
            error: 'All items failed to save',
          });
        });
      });

      it('reset() → idle', () => {
        const { reset } = useBatchReviewStore.getState();

        act(() => {
          reset();
        });

        expect(useBatchReviewStore.getState().phase).toBe('idle');
        expect(useBatchReviewStore.getState().error).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Story 14e-12b: Edge Cases (AC6)
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty batch save', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: [],
      });

      const { saveStart, saveComplete } = useBatchReviewStore.getState();

      act(() => {
        saveStart();
      });

      expect(useBatchReviewStore.getState().phase).toBe('saving');

      act(() => {
        saveComplete();
      });

      expect(useBatchReviewStore.getState().phase).toBe('complete');
    });

    it('should handle single item batch with success', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(1),
      });

      const { saveStart, saveItemSuccess, saveComplete } = useBatchReviewStore.getState();

      act(() => {
        saveStart();
        saveItemSuccess('receipt-0');
        saveComplete();
      });

      const state = useBatchReviewStore.getState();
      expect(state.phase).toBe('complete');
      expect(state.savedCount).toBe(1);
      expect(state.failedCount).toBe(0);
    });

    it('should handle single item batch with failure', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(1),
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { saveStart, saveItemFailure, saveComplete } = useBatchReviewStore.getState();

      act(() => {
        saveStart();
        saveItemFailure('receipt-0', 'Network error');
        saveComplete();
      });

      const state = useBatchReviewStore.getState();
      expect(state.phase).toBe('error');
      expect(state.savedCount).toBe(0);
      expect(state.failedCount).toBe(1);
      consoleWarnSpy.mockRestore();
    });

    it('should handle rapid consecutive action calls', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(5),
      });

      const { saveStart, saveItemSuccess, saveItemFailure, saveComplete } =
        useBatchReviewStore.getState();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Simulate rapid save operations
      act(() => {
        saveStart();
        saveItemSuccess('receipt-0');
        saveItemSuccess('receipt-1');
        saveItemFailure('receipt-2', 'Error 1');
        saveItemSuccess('receipt-3');
        saveItemFailure('receipt-4', 'Error 2');
        saveComplete();
      });

      const state = useBatchReviewStore.getState();
      expect(state.phase).toBe('complete'); // 3 success, 2 fail = complete
      expect(state.savedCount).toBe(3);
      expect(state.failedCount).toBe(2);
      consoleWarnSpy.mockRestore();
    });

    it('should handle edit-save workflow', () => {
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: createMockBatchReceipts(3),
      });

      const { startEditing, updateItem, finishEditing, saveStart, saveItemSuccess, saveComplete } =
        useBatchReviewStore.getState();

      // Edit a receipt
      act(() => {
        startEditing('receipt-1');
      });
      expect(useBatchReviewStore.getState().phase).toBe('editing');

      act(() => {
        updateItem('receipt-1', { status: 'edited', confidence: 0.99 });
      });

      act(() => {
        finishEditing();
      });
      expect(useBatchReviewStore.getState().phase).toBe('reviewing');
      expect(useBatchReviewStore.getState().items[1].status).toBe('edited');

      // Now save
      act(() => {
        saveStart();
        saveItemSuccess('receipt-0');
        saveItemSuccess('receipt-1');
        saveItemSuccess('receipt-2');
        saveComplete();
      });

      expect(useBatchReviewStore.getState().phase).toBe('complete');
    });

    it('should preserve items array after editing', () => {
      const originalReceipts = createMockBatchReceipts(3);
      useBatchReviewStore.setState({
        phase: 'reviewing',
        items: originalReceipts,
      });

      const { startEditing, finishEditing } = useBatchReviewStore.getState();

      act(() => {
        startEditing('receipt-1');
      });

      act(() => {
        finishEditing();
      });

      // Items should still be the same (no mutations)
      const state = useBatchReviewStore.getState();
      expect(state.items).toHaveLength(3);
      expect(state.items.map((r: BatchReceipt) => r.id)).toEqual(['receipt-0', 'receipt-1', 'receipt-2']);
    });
  });
});
