/**
 * Story 14d.1: Scan State Machine Hook Tests
 *
 * Comprehensive tests for the scan state machine including:
 * - All state transitions
 * - Computed values
 * - Batch mode operations
 * - Edge cases and error handling
 * - Request precedence rule enforcement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useScanStateMachine,
  scanReducer,
  initialScanState,
  createScanActions,
} from '../../../src/hooks/useScanStateMachine';
import type {
  ScanState,
  ScanAction,
  ScanPhase,
  ScanMode,
} from '../../../src/types/scanStateMachine';
import type { Transaction } from '../../../src/types/transaction';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create a mock transaction for testing.
 */
function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-tx-1',
    date: '2026-01-08',
    merchant: 'Test Merchant',
    category: 'Supermarket',
    total: 1000,
    items: [{ name: 'Test Item', price: 1000, qty: 1 }],
    currency: 'CLP',
    ...overrides,
  };
}

/**
 * Create a state in capturing phase for testing.
 */
function createCapturingState(mode: ScanMode = 'single'): ScanState {
  return {
    ...initialScanState,
    phase: 'capturing',
    mode,
    requestId: 'test-req-1',
    userId: 'test-user-1',
    startedAt: Date.now(),
    images: ['base64-image-1'],
    batchProgress:
      mode === 'batch'
        ? {
            current: 0,
            total: 1,
            completed: [],
            failed: [],
          }
        : null,
  };
}

/**
 * Create a state in scanning phase for testing.
 */
function createScanningState(mode: ScanMode = 'single'): ScanState {
  return {
    ...createCapturingState(mode),
    phase: 'scanning',
    creditStatus: 'reserved',
    creditType: mode === 'batch' ? 'super' : 'normal',
    creditsCount: 1,
  };
}

/**
 * Create a state in reviewing phase for testing.
 */
function createReviewingState(mode: ScanMode = 'single'): ScanState {
  return {
    ...createScanningState(mode),
    phase: 'reviewing',
    creditStatus: 'confirmed',
    results: [createMockTransaction()],
  };
}

// =============================================================================
// Initial State Tests
// =============================================================================

describe('useScanStateMachine', () => {
  describe('initial state', () => {
    it('should start in idle phase', () => {
      const { result } = renderHook(() => useScanStateMachine());
      expect(result.current.state.phase).toBe('idle');
    });

    it('should have single mode by default', () => {
      const { result } = renderHook(() => useScanStateMachine());
      expect(result.current.state.mode).toBe('single');
    });

    it('should have no images initially', () => {
      const { result } = renderHook(() => useScanStateMachine());
      expect(result.current.state.images).toHaveLength(0);
    });

    it('should have no active request initially', () => {
      const { result } = renderHook(() => useScanStateMachine());
      expect(result.current.hasActiveRequest).toBe(false);
    });

    it('should be idle initially', () => {
      const { result } = renderHook(() => useScanStateMachine());
      expect(result.current.isIdle).toBe(true);
    });

    it('should have creditStatus as none initially', () => {
      const { result } = renderHook(() => useScanStateMachine());
      expect(result.current.state.creditStatus).toBe('none');
    });
  });

  // ===========================================================================
  // Start Actions Tests
  // ===========================================================================

  describe('START_SINGLE action', () => {
    it('should transition from idle to capturing', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
      });

      expect(result.current.state.phase).toBe('capturing');
      expect(result.current.state.mode).toBe('single');
      expect(result.current.state.userId).toBe('user-1');
    });

    it('should generate a request ID', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
      });

      expect(result.current.state.requestId).toMatch(/^req-\d+-[a-z0-9]+$/);
    });

    it('should set startedAt timestamp', () => {
      const { result } = renderHook(() => useScanStateMachine());
      const before = Date.now();

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
      });

      const after = Date.now();
      expect(result.current.state.startedAt).toBeGreaterThanOrEqual(before);
      expect(result.current.state.startedAt).toBeLessThanOrEqual(after);
    });

    it('should NOT start if already in capturing phase (Request Precedence)', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
      });

      const firstRequestId = result.current.state.requestId;

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-2' } });
      });

      // Should still have the first request
      expect(result.current.state.requestId).toBe(firstRequestId);
      expect(result.current.state.userId).toBe('user-1');
    });

    it('should update hasActiveRequest to true', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
      });

      expect(result.current.hasActiveRequest).toBe(true);
    });
  });

  describe('START_BATCH action', () => {
    it('should transition from idle to capturing with batch mode', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_BATCH', payload: { userId: 'user-1' } });
      });

      expect(result.current.state.phase).toBe('capturing');
      expect(result.current.state.mode).toBe('batch');
    });

    it('should initialize batch progress', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_BATCH', payload: { userId: 'user-1' } });
      });

      expect(result.current.state.batchProgress).toEqual({
        current: 0,
        total: 0,
        completed: [],
        failed: [],
      });
    });
  });

  describe('START_STATEMENT action', () => {
    it('should transition from idle to capturing with statement mode', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_STATEMENT', payload: { userId: 'user-1' } });
      });

      expect(result.current.state.phase).toBe('capturing');
      expect(result.current.state.mode).toBe('statement');
    });
  });

  // ===========================================================================
  // Image Actions Tests
  // ===========================================================================

  describe('ADD_IMAGE action', () => {
    it('should add image to array in capturing phase', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
      });

      act(() => {
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'base64-image-1' } });
      });

      expect(result.current.state.images).toContain('base64-image-1');
      expect(result.current.imageCount).toBe(1);
    });

    it('should NOT add image if not in capturing phase', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'base64-image-1' } });
      });

      expect(result.current.state.images).toHaveLength(0);
    });

    it('should update batch progress total in batch mode', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_BATCH', payload: { userId: 'user-1' } });
      });

      act(() => {
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'base64-image-1' } });
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'base64-image-2' } });
      });

      expect(result.current.state.batchProgress?.total).toBe(2);
    });
  });

  describe('REMOVE_IMAGE action', () => {
    it('should remove image by index', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-2' } });
      });

      act(() => {
        result.current.dispatch({ type: 'REMOVE_IMAGE', payload: { index: 0 } });
      });

      expect(result.current.state.images).toEqual(['image-2']);
    });
  });

  describe('SET_IMAGES action', () => {
    it('should replace all images', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'old-image' } });
      });

      act(() => {
        result.current.dispatch({
          type: 'SET_IMAGES',
          payload: { images: ['new-1', 'new-2', 'new-3'] },
        });
      });

      expect(result.current.state.images).toEqual(['new-1', 'new-2', 'new-3']);
    });
  });

  // ===========================================================================
  // Pre-scan Options Tests
  // ===========================================================================

  describe('SET_STORE_TYPE action', () => {
    it('should set store type in capturing phase', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        result.current.dispatch({ type: 'SET_STORE_TYPE', payload: { storeType: 'Grocery' } });
      });

      expect(result.current.state.storeType).toBe('Grocery');
    });
  });

  describe('SET_CURRENCY action', () => {
    it('should set currency in capturing phase', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        result.current.dispatch({ type: 'SET_CURRENCY', payload: { currency: 'USD' } });
      });

      expect(result.current.state.currency).toBe('USD');
    });
  });

  // ===========================================================================
  // Process Actions Tests
  // ===========================================================================

  describe('PROCESS_START action', () => {
    it('should transition from capturing to scanning', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
      });

      act(() => {
        result.current.dispatch({
          type: 'PROCESS_START',
          payload: { creditType: 'normal', creditsCount: 1 },
        });
      });

      expect(result.current.state.phase).toBe('scanning');
      expect(result.current.state.creditStatus).toBe('reserved');
      expect(result.current.state.creditType).toBe('normal');
      expect(result.current.state.creditsCount).toBe(1);
    });

    it('should NOT start if no images', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
      });

      act(() => {
        result.current.dispatch({
          type: 'PROCESS_START',
          payload: { creditType: 'normal', creditsCount: 1 },
        });
      });

      // Should still be in capturing
      expect(result.current.state.phase).toBe('capturing');
    });

    it('should set isProcessing to true', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
        result.current.dispatch({
          type: 'PROCESS_START',
          payload: { creditType: 'normal', creditsCount: 1 },
        });
      });

      expect(result.current.isProcessing).toBe(true);
    });
  });

  describe('PROCESS_SUCCESS action', () => {
    it('should transition from scanning to reviewing', () => {
      const state = createScanningState();
      const mockTx = createMockTransaction();

      const newState = scanReducer(state, {
        type: 'PROCESS_SUCCESS',
        payload: { results: [mockTx] },
      });

      expect(newState.phase).toBe('reviewing');
      expect(newState.creditStatus).toBe('confirmed');
      expect(newState.results).toHaveLength(1);
    });

    it('should set creditSpent computed value to true', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
        result.current.dispatch({
          type: 'PROCESS_START',
          payload: { creditType: 'normal', creditsCount: 1 },
        });
        result.current.dispatch({
          type: 'PROCESS_SUCCESS',
          payload: { results: [createMockTransaction()] },
        });
      });

      expect(result.current.creditSpent).toBe(true);
    });
  });

  describe('PROCESS_ERROR action', () => {
    it('should transition from scanning to error', () => {
      const state = createScanningState();

      const newState = scanReducer(state, {
        type: 'PROCESS_ERROR',
        payload: { error: 'Network error' },
      });

      expect(newState.phase).toBe('error');
      expect(newState.error).toBe('Network error');
    });

    it('should refund credit on error', () => {
      const state = createScanningState();

      const newState = scanReducer(state, {
        type: 'PROCESS_ERROR',
        payload: { error: 'API failure' },
      });

      expect(newState.creditStatus).toBe('refunded');
    });

    it('should set hasError to true', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
        result.current.dispatch({
          type: 'PROCESS_START',
          payload: { creditType: 'normal', creditsCount: 1 },
        });
        result.current.dispatch({
          type: 'PROCESS_ERROR',
          payload: { error: 'Test error' },
        });
      });

      expect(result.current.hasError).toBe(true);
    });
  });

  // ===========================================================================
  // Dialog Actions Tests
  // ===========================================================================

  describe('SHOW_DIALOG action', () => {
    it('should set active dialog', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({
          type: 'SHOW_DIALOG',
          payload: { type: 'currency_mismatch', data: { detected: 'USD', expected: 'CLP' } },
        });
      });

      expect(result.current.state.activeDialog).toEqual({
        type: 'currency_mismatch',
        data: { detected: 'USD', expected: 'CLP' },
      });
      expect(result.current.hasDialog).toBe(true);
    });
  });

  describe('RESOLVE_DIALOG action', () => {
    it('should clear dialog when type matches', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({
          type: 'SHOW_DIALOG',
          payload: { type: 'currency_mismatch', data: {} },
        });
      });

      act(() => {
        result.current.dispatch({
          type: 'RESOLVE_DIALOG',
          payload: { type: 'currency_mismatch', result: { accepted: true } },
        });
      });

      expect(result.current.state.activeDialog).toBeNull();
      expect(result.current.hasDialog).toBe(false);
    });

    it('should NOT clear dialog when type does not match', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({
          type: 'SHOW_DIALOG',
          payload: { type: 'currency_mismatch', data: {} },
        });
      });

      act(() => {
        result.current.dispatch({
          type: 'RESOLVE_DIALOG',
          payload: { type: 'total_mismatch', result: {} },
        });
      });

      expect(result.current.state.activeDialog?.type).toBe('currency_mismatch');
    });
  });

  describe('DISMISS_DIALOG action', () => {
    it('should clear any active dialog', () => {
      const { result } = renderHook(() => useScanStateMachine());

      act(() => {
        result.current.dispatch({
          type: 'SHOW_DIALOG',
          payload: { type: 'quicksave', data: {} },
        });
      });

      act(() => {
        result.current.dispatch({ type: 'DISMISS_DIALOG' });
      });

      expect(result.current.state.activeDialog).toBeNull();
    });
  });

  // ===========================================================================
  // Result Actions Tests
  // ===========================================================================

  describe('UPDATE_RESULT action', () => {
    it('should update result at index', () => {
      const state = createReviewingState();

      const newState = scanReducer(state, {
        type: 'UPDATE_RESULT',
        payload: { index: 0, updates: { merchant: 'Updated Merchant' } },
      });

      expect(newState.results[0].merchant).toBe('Updated Merchant');
    });

    it('should NOT update if not in reviewing phase', () => {
      const state = createCapturingState();

      const newState = scanReducer(state, {
        type: 'UPDATE_RESULT',
        payload: { index: 0, updates: { merchant: 'Updated' } },
      });

      expect(newState).toBe(state);
    });

    it('should NOT update invalid index', () => {
      const state = createReviewingState();

      const newState = scanReducer(state, {
        type: 'UPDATE_RESULT',
        payload: { index: 99, updates: { merchant: 'Updated' } },
      });

      expect(newState).toBe(state);
    });
  });

  describe('SET_ACTIVE_RESULT action', () => {
    it('should set active result index', () => {
      const state: ScanState = {
        ...createReviewingState('batch'),
        results: [createMockTransaction(), createMockTransaction({ id: 'tx-2' })],
      };

      const newState = scanReducer(state, {
        type: 'SET_ACTIVE_RESULT',
        payload: { index: 1 },
      });

      expect(newState.activeResultIndex).toBe(1);
    });
  });

  // ===========================================================================
  // Save Actions Tests
  // ===========================================================================

  describe('SAVE_START action', () => {
    it('should transition from reviewing to saving', () => {
      const state = createReviewingState();

      const newState = scanReducer(state, { type: 'SAVE_START' });

      expect(newState.phase).toBe('saving');
    });

    it('should NOT save if not in reviewing phase', () => {
      const state = createCapturingState();

      const newState = scanReducer(state, { type: 'SAVE_START' });

      expect(newState.phase).toBe('capturing');
    });
  });

  describe('SAVE_SUCCESS action', () => {
    it('should reset to initial state', () => {
      const state: ScanState = {
        ...createReviewingState(),
        phase: 'saving',
      };

      const newState = scanReducer(state, { type: 'SAVE_SUCCESS' });

      expect(newState).toEqual(initialScanState);
    });
  });

  describe('SAVE_ERROR action', () => {
    it('should return to reviewing with error', () => {
      const state: ScanState = {
        ...createReviewingState(),
        phase: 'saving',
      };

      const newState = scanReducer(state, {
        type: 'SAVE_ERROR',
        payload: { error: 'Save failed' },
      });

      expect(newState.phase).toBe('reviewing');
      expect(newState.error).toBe('Save failed');
    });
  });

  // ===========================================================================
  // Batch Actions Tests
  // ===========================================================================

  describe('batch mode actions', () => {
    it('BATCH_ITEM_START should update current index', () => {
      const state = createScanningState('batch');

      const newState = scanReducer(state, {
        type: 'BATCH_ITEM_START',
        payload: { index: 2 },
      });

      expect(newState.batchProgress?.current).toBe(2);
    });

    it('BATCH_ITEM_SUCCESS should add to completed', () => {
      const state = createScanningState('batch');
      const mockTx = createMockTransaction();

      const newState = scanReducer(state, {
        type: 'BATCH_ITEM_SUCCESS',
        payload: { index: 0, result: mockTx },
      });

      expect(newState.batchProgress?.completed).toContain(mockTx);
    });

    it('BATCH_ITEM_ERROR should add to failed', () => {
      const state = createScanningState('batch');

      const newState = scanReducer(state, {
        type: 'BATCH_ITEM_ERROR',
        payload: { index: 1, error: 'Failed to process' },
      });

      expect(newState.batchProgress?.failed).toContainEqual({
        index: 1,
        error: 'Failed to process',
      });
    });

    it('BATCH_COMPLETE should transition to reviewing with completed results', () => {
      const mockTx1 = createMockTransaction({ id: 'tx-1' });
      const mockTx2 = createMockTransaction({ id: 'tx-2' });
      const state: ScanState = {
        ...createScanningState('batch'),
        batchProgress: {
          current: 2,
          total: 2,
          completed: [mockTx1, mockTx2],
          failed: [],
        },
      };

      const newState = scanReducer(state, { type: 'BATCH_COMPLETE' });

      expect(newState.phase).toBe('reviewing');
      expect(newState.creditStatus).toBe('confirmed');
      expect(newState.results).toEqual([mockTx1, mockTx2]);
    });

    // Story 14d.5: Test atomic batchReceipts setting with BATCH_COMPLETE
    it('BATCH_COMPLETE should set batchReceipts atomically when provided in payload', () => {
      const mockTx1 = createMockTransaction({ id: 'tx-1' });
      const mockTx2 = createMockTransaction({ id: 'tx-2' });
      const mockReceipts: import('../../../src/types/batchReceipt').BatchReceipt[] = [
        {
          id: 'receipt-1',
          index: 0,
          transaction: mockTx1,
          status: 'ready',
          confidence: 0.95,
        },
        {
          id: 'receipt-2',
          index: 1,
          transaction: mockTx2,
          status: 'review',
          confidence: 0.65,
        },
      ];
      const state: ScanState = {
        ...createScanningState('batch'),
        batchProgress: {
          current: 2,
          total: 2,
          completed: [mockTx1, mockTx2],
          failed: [],
        },
      };

      const newState = scanReducer(state, {
        type: 'BATCH_COMPLETE',
        payload: { batchReceipts: mockReceipts },
      });

      expect(newState.phase).toBe('reviewing');
      expect(newState.creditStatus).toBe('confirmed');
      expect(newState.results).toEqual([mockTx1, mockTx2]);
      // The key assertion: batchReceipts should be set atomically
      expect(newState.batchReceipts).toEqual(mockReceipts);
    });

    // Story 14d.5: Ensure backward compatibility - BATCH_COMPLETE without payload preserves existing batchReceipts
    it('BATCH_COMPLETE without payload should preserve existing batchReceipts', () => {
      const mockTx1 = createMockTransaction({ id: 'tx-1' });
      const existingReceipts: import('../../../src/types/batchReceipt').BatchReceipt[] = [
        {
          id: 'existing-1',
          index: 0,
          transaction: mockTx1,
          status: 'ready',
          confidence: 0.9,
        },
      ];
      const state: ScanState = {
        ...createScanningState('batch'),
        batchProgress: {
          current: 1,
          total: 1,
          completed: [mockTx1],
          failed: [],
        },
        batchReceipts: existingReceipts, // Pre-existing receipts
      };

      const newState = scanReducer(state, { type: 'BATCH_COMPLETE' });

      expect(newState.phase).toBe('reviewing');
      // Existing receipts should be preserved when no payload provided
      expect(newState.batchReceipts).toEqual(existingReceipts);
    });
  });

  // ===========================================================================
  // Story 14d.5c: Batch Receipt Actions Tests
  // ===========================================================================

  describe('batch receipt actions (Story 14d.5c)', () => {
    /**
     * Helper to create a batch reviewing state with receipts.
     */
    function createBatchReviewingStateWithReceipts(): ScanState {
      return {
        ...createReviewingState('batch'),
        batchReceipts: [
          {
            id: 'receipt-1',
            index: 0,
            transaction: createMockTransaction({ id: 'tx-1', merchant: 'Store A' }),
            status: 'ready',
            confidence: 0.95,
          },
          {
            id: 'receipt-2',
            index: 1,
            transaction: createMockTransaction({ id: 'tx-2', merchant: 'Store B' }),
            status: 'review',
            confidence: 0.6,
          },
          {
            id: 'receipt-3',
            index: 2,
            transaction: createMockTransaction({ id: 'tx-3', merchant: 'Store C' }),
            status: 'error',
            confidence: 0,
            error: 'Failed to process',
          },
        ],
      };
    }

    describe('SET_BATCH_RECEIPTS', () => {
      it('should set batch receipts when in batch reviewing phase', () => {
        const state = createReviewingState('batch');
        const receipts = [
          {
            id: 'new-receipt-1',
            index: 0,
            transaction: createMockTransaction(),
            status: 'ready' as const,
            confidence: 0.9,
          },
        ];

        const newState = scanReducer(state, {
          type: 'SET_BATCH_RECEIPTS',
          payload: { receipts },
        });

        expect(newState.batchReceipts).toEqual(receipts);
        expect(newState.batchReceipts).toHaveLength(1);
      });

      it('should NOT set batch receipts when in single mode', () => {
        const state = createReviewingState('single');

        const newState = scanReducer(state, {
          type: 'SET_BATCH_RECEIPTS',
          payload: { receipts: [] },
        });

        expect(newState.batchReceipts).toBeNull();
      });

      it('should NOT set batch receipts when not in reviewing phase', () => {
        const state = createCapturingState('batch');

        const newState = scanReducer(state, {
          type: 'SET_BATCH_RECEIPTS',
          payload: { receipts: [] },
        });

        expect(newState.batchReceipts).toBeNull();
      });
    });

    describe('UPDATE_BATCH_RECEIPT', () => {
      it('should update a specific receipt by ID', () => {
        const state = createBatchReviewingStateWithReceipts();

        const newState = scanReducer(state, {
          type: 'UPDATE_BATCH_RECEIPT',
          payload: {
            id: 'receipt-2',
            updates: {
              status: 'edited',
              transaction: createMockTransaction({ id: 'tx-2', merchant: 'Store B Updated', total: 5000 }),
            },
          },
        });

        expect(newState.batchReceipts).toHaveLength(3);
        const updatedReceipt = newState.batchReceipts?.find((r) => r.id === 'receipt-2');
        expect(updatedReceipt?.status).toBe('edited');
        expect(updatedReceipt?.transaction.merchant).toBe('Store B Updated');
        expect(updatedReceipt?.transaction.total).toBe(5000);
      });

      it('should NOT modify other receipts', () => {
        const state = createBatchReviewingStateWithReceipts();

        const newState = scanReducer(state, {
          type: 'UPDATE_BATCH_RECEIPT',
          payload: {
            id: 'receipt-2',
            updates: { status: 'edited' },
          },
        });

        const receipt1 = newState.batchReceipts?.find((r) => r.id === 'receipt-1');
        const receipt3 = newState.batchReceipts?.find((r) => r.id === 'receipt-3');
        expect(receipt1?.status).toBe('ready');
        expect(receipt3?.status).toBe('error');
      });

      it('should return unchanged state if receipt not found', () => {
        const state = createBatchReviewingStateWithReceipts();

        const newState = scanReducer(state, {
          type: 'UPDATE_BATCH_RECEIPT',
          payload: {
            id: 'non-existent',
            updates: { status: 'edited' },
          },
        });

        expect(newState).toEqual(state);
      });

      it('should return unchanged state when batchReceipts is null', () => {
        const state = createReviewingState('batch'); // No batchReceipts

        const newState = scanReducer(state, {
          type: 'UPDATE_BATCH_RECEIPT',
          payload: {
            id: 'receipt-1',
            updates: { status: 'edited' },
          },
        });

        expect(newState).toEqual(state);
      });

      it('should NOT update when not in batch reviewing phase', () => {
        const state: ScanState = {
          ...createCapturingState('batch'),
          batchReceipts: [
            {
              id: 'receipt-1',
              index: 0,
              transaction: createMockTransaction(),
              status: 'ready',
              confidence: 0.9,
            },
          ],
        };

        const newState = scanReducer(state, {
          type: 'UPDATE_BATCH_RECEIPT',
          payload: {
            id: 'receipt-1',
            updates: { status: 'edited' },
          },
        });

        expect(newState.batchReceipts?.[0].status).toBe('ready');
      });
    });

    describe('DISCARD_BATCH_RECEIPT', () => {
      it('should remove a receipt by ID', () => {
        const state = createBatchReviewingStateWithReceipts();

        const newState = scanReducer(state, {
          type: 'DISCARD_BATCH_RECEIPT',
          payload: { id: 'receipt-2' },
        });

        expect(newState.batchReceipts).toHaveLength(2);
        expect(newState.batchReceipts?.find((r) => r.id === 'receipt-2')).toBeUndefined();
        expect(newState.batchReceipts?.find((r) => r.id === 'receipt-1')).toBeDefined();
        expect(newState.batchReceipts?.find((r) => r.id === 'receipt-3')).toBeDefined();
      });

      it('should handle discarding non-existent receipt gracefully', () => {
        const state = createBatchReviewingStateWithReceipts();

        const newState = scanReducer(state, {
          type: 'DISCARD_BATCH_RECEIPT',
          payload: { id: 'non-existent' },
        });

        expect(newState.batchReceipts).toHaveLength(3);
      });

      it('should return unchanged state when batchReceipts is null', () => {
        const state = createReviewingState('batch');

        const newState = scanReducer(state, {
          type: 'DISCARD_BATCH_RECEIPT',
          payload: { id: 'receipt-1' },
        });

        expect(newState).toEqual(state);
      });

      it('should NOT discard when not in batch reviewing phase', () => {
        const state: ScanState = {
          ...createCapturingState('batch'),
          batchReceipts: [
            {
              id: 'receipt-1',
              index: 0,
              transaction: createMockTransaction(),
              status: 'ready',
              confidence: 0.9,
            },
          ],
        };

        const newState = scanReducer(state, {
          type: 'DISCARD_BATCH_RECEIPT',
          payload: { id: 'receipt-1' },
        });

        expect(newState.batchReceipts).toHaveLength(1);
      });
    });

    describe('CLEAR_BATCH_RECEIPTS', () => {
      it('should set batchReceipts to null', () => {
        const state = createBatchReviewingStateWithReceipts();

        const newState = scanReducer(state, { type: 'CLEAR_BATCH_RECEIPTS' });

        expect(newState.batchReceipts).toBeNull();
      });

      it('should work even when already null', () => {
        const state = createReviewingState('batch');

        const newState = scanReducer(state, { type: 'CLEAR_BATCH_RECEIPTS' });

        expect(newState.batchReceipts).toBeNull();
      });

      it('should work from any phase (cleanup action)', () => {
        const state: ScanState = {
          ...initialScanState,
          batchReceipts: [
            {
              id: 'receipt-1',
              index: 0,
              transaction: createMockTransaction(),
              status: 'ready',
              confidence: 0.9,
            },
          ],
        };

        const newState = scanReducer(state, { type: 'CLEAR_BATCH_RECEIPTS' });

        expect(newState.batchReceipts).toBeNull();
      });
    });

    describe('action creators (createScanActions)', () => {
      it('setBatchReceipts should dispatch SET_BATCH_RECEIPTS', () => {
        const dispatch = vi.fn();
        const actions = createScanActions(dispatch);
        const receipts = [
          {
            id: 'r-1',
            index: 0,
            transaction: createMockTransaction(),
            status: 'ready' as const,
            confidence: 0.9,
          },
        ];

        actions.setBatchReceipts(receipts);

        expect(dispatch).toHaveBeenCalledWith({
          type: 'SET_BATCH_RECEIPTS',
          payload: { receipts },
        });
      });

      it('updateBatchReceipt should dispatch UPDATE_BATCH_RECEIPT', () => {
        const dispatch = vi.fn();
        const actions = createScanActions(dispatch);

        actions.updateBatchReceipt('receipt-1', { status: 'edited' });

        expect(dispatch).toHaveBeenCalledWith({
          type: 'UPDATE_BATCH_RECEIPT',
          payload: { id: 'receipt-1', updates: { status: 'edited' } },
        });
      });

      it('discardBatchReceipt should dispatch DISCARD_BATCH_RECEIPT', () => {
        const dispatch = vi.fn();
        const actions = createScanActions(dispatch);

        actions.discardBatchReceipt('receipt-1');

        expect(dispatch).toHaveBeenCalledWith({
          type: 'DISCARD_BATCH_RECEIPT',
          payload: { id: 'receipt-1' },
        });
      });

      it('clearBatchReceipts should dispatch CLEAR_BATCH_RECEIPTS', () => {
        const dispatch = vi.fn();
        const actions = createScanActions(dispatch);

        actions.clearBatchReceipts();

        expect(dispatch).toHaveBeenCalledWith({ type: 'CLEAR_BATCH_RECEIPTS' });
      });

      it('setBatchEditingIndex should dispatch SET_BATCH_EDITING_INDEX', () => {
        const dispatch = vi.fn();
        const actions = createScanActions(dispatch);

        actions.setBatchEditingIndex(2);

        expect(dispatch).toHaveBeenCalledWith({
          type: 'SET_BATCH_EDITING_INDEX',
          payload: { index: 2 },
        });
      });

      it('setBatchEditingIndex should dispatch with null to clear', () => {
        const dispatch = vi.fn();
        const actions = createScanActions(dispatch);

        actions.setBatchEditingIndex(null);

        expect(dispatch).toHaveBeenCalledWith({
          type: 'SET_BATCH_EDITING_INDEX',
          payload: { index: null },
        });
      });
    });

    // Story 14d.5d: Batch Editing Index Actions Tests
    describe('SET_BATCH_EDITING_INDEX (Story 14d.5d)', () => {
      it('should set batchEditingIndex in batch reviewing phase', () => {
        const state = createBatchReviewingStateWithReceipts();

        const newState = scanReducer(state, {
          type: 'SET_BATCH_EDITING_INDEX',
          payload: { index: 1 },
        });

        expect(newState.batchEditingIndex).toBe(1);
      });

      it('should allow setting to null to clear editing state', () => {
        const state: ScanState = {
          ...createBatchReviewingStateWithReceipts(),
          batchEditingIndex: 2,
        };

        const newState = scanReducer(state, {
          type: 'SET_BATCH_EDITING_INDEX',
          payload: { index: null },
        });

        expect(newState.batchEditingIndex).toBeNull();
      });

      it('should allow clearing from any phase (not just reviewing)', () => {
        // Clearing (setting to null) should work from any phase
        const state: ScanState = {
          ...initialScanState,
          batchEditingIndex: 1,
        };

        const newState = scanReducer(state, {
          type: 'SET_BATCH_EDITING_INDEX',
          payload: { index: null },
        });

        expect(newState.batchEditingIndex).toBeNull();
      });

      it('should NOT set non-null index when not in batch reviewing phase', () => {
        const state = createCapturingState('batch');

        const newState = scanReducer(state, {
          type: 'SET_BATCH_EDITING_INDEX',
          payload: { index: 0 },
        });

        expect(newState.batchEditingIndex).toBeNull();
      });

      it('should NOT set non-null index when in single mode', () => {
        const state = createReviewingState('single');

        const newState = scanReducer(state, {
          type: 'SET_BATCH_EDITING_INDEX',
          payload: { index: 0 },
        });

        expect(newState.batchEditingIndex).toBeNull();
      });

      it('should NOT set index out of bounds', () => {
        const state = createBatchReviewingStateWithReceipts(); // Has 3 receipts

        const newState = scanReducer(state, {
          type: 'SET_BATCH_EDITING_INDEX',
          payload: { index: 10 }, // Out of bounds
        });

        expect(newState.batchEditingIndex).toBeNull();
      });

      it('should NOT set negative index', () => {
        const state = createBatchReviewingStateWithReceipts();

        const newState = scanReducer(state, {
          type: 'SET_BATCH_EDITING_INDEX',
          payload: { index: -1 },
        });

        expect(newState.batchEditingIndex).toBeNull();
      });

      it('should NOT set index when batchReceipts is null', () => {
        const state = createReviewingState('batch'); // No batchReceipts

        const newState = scanReducer(state, {
          type: 'SET_BATCH_EDITING_INDEX',
          payload: { index: 0 },
        });

        expect(newState.batchEditingIndex).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Control Actions Tests
  // ===========================================================================

  describe('CANCEL action', () => {
    it('should reset to initial state from capturing', () => {
      const state = createCapturingState();

      const newState = scanReducer(state, { type: 'CANCEL' });

      expect(newState).toEqual(initialScanState);
    });

    it('should reset to initial state from reviewing', () => {
      const state = createReviewingState();

      const newState = scanReducer(state, { type: 'CANCEL' });

      expect(newState).toEqual(initialScanState);
    });

    it('should NOT cancel from saving phase', () => {
      const state: ScanState = {
        ...createReviewingState(),
        phase: 'saving',
      };

      const newState = scanReducer(state, { type: 'CANCEL' });

      expect(newState.phase).toBe('saving');
    });
  });

  describe('RESET action', () => {
    it('should reset to initial state from any phase', () => {
      const state = createReviewingState();

      const newState = scanReducer(state, { type: 'RESET' });

      expect(newState).toEqual(initialScanState);
    });
  });

  // ===========================================================================
  // Recovery Actions Tests
  // ===========================================================================

  describe('RESTORE_STATE action', () => {
    it('should restore state from persistence', () => {
      const { result } = renderHook(() => useScanStateMachine());
      const savedState: Partial<ScanState> = {
        phase: 'capturing',
        mode: 'single',
        images: ['saved-image'],
        requestId: 'saved-req',
        userId: 'saved-user',
      };

      act(() => {
        result.current.dispatch({
          type: 'RESTORE_STATE',
          payload: { state: savedState },
        });
      });

      expect(result.current.state.phase).toBe('capturing');
      expect(result.current.state.images).toContain('saved-image');
    });

    it('should transition interrupted scanning state to error', () => {
      const { result } = renderHook(() => useScanStateMachine());
      const savedState: Partial<ScanState> = {
        phase: 'scanning',
        creditStatus: 'reserved',
      };

      act(() => {
        result.current.dispatch({
          type: 'RESTORE_STATE',
          payload: { state: savedState },
        });
      });

      expect(result.current.state.phase).toBe('error');
      expect(result.current.state.creditStatus).toBe('refunded');
      expect(result.current.state.error).toContain('interrumpido');
    });
  });

  describe('REFUND_CREDIT action', () => {
    it('should change creditStatus from reserved to refunded', () => {
      const state = createScanningState();

      const newState = scanReducer(state, { type: 'REFUND_CREDIT' });

      expect(newState.creditStatus).toBe('refunded');
    });

    it('should NOT change if creditStatus is not reserved', () => {
      const state = createReviewingState(); // creditStatus is 'confirmed'

      const newState = scanReducer(state, { type: 'REFUND_CREDIT' });

      expect(newState.creditStatus).toBe('confirmed');
    });
  });

  // ===========================================================================
  // Computed Values Tests
  // ===========================================================================

  describe('computed values', () => {
    describe('hasActiveRequest', () => {
      it('should be false when idle', () => {
        const { result } = renderHook(() => useScanStateMachine());
        expect(result.current.hasActiveRequest).toBe(false);
      });

      it('should be true when capturing', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        });

        expect(result.current.hasActiveRequest).toBe(true);
      });
    });

    describe('isBlocking', () => {
      it('should be false when idle', () => {
        const { result } = renderHook(() => useScanStateMachine());
        expect(result.current.isBlocking).toBe(false);
      });

      it('should be false when capturing without dialog', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        });

        expect(result.current.isBlocking).toBe(false);
      });

      it('should be true when active request AND dialog showing (AC6)', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
          result.current.dispatch({
            type: 'SHOW_DIALOG',
            payload: { type: 'currency_mismatch', data: {} },
          });
        });

        expect(result.current.isBlocking).toBe(true);
      });

      it('should be false when dialog shown from idle state', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({
            type: 'SHOW_DIALOG',
            payload: { type: 'currency_mismatch', data: {} },
          });
        });

        // No active request, so not blocking even with dialog
        expect(result.current.isBlocking).toBe(false);
      });
    });

    describe('canNavigateFreely', () => {
      it('should be true when idle', () => {
        const { result } = renderHook(() => useScanStateMachine());
        expect(result.current.canNavigateFreely).toBe(true);
      });

      it('should be true when capturing without dialog', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        });

        expect(result.current.canNavigateFreely).toBe(true);
      });

      it('should be false when dialog is active', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
          result.current.dispatch({
            type: 'SHOW_DIALOG',
            payload: { type: 'currency_mismatch', data: {} },
          });
        });

        expect(result.current.canNavigateFreely).toBe(false);
      });

      it('should be false when processing', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
          result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
          result.current.dispatch({
            type: 'PROCESS_START',
            payload: { creditType: 'normal', creditsCount: 1 },
          });
        });

        expect(result.current.canNavigateFreely).toBe(false);
      });
    });

    describe('canSave', () => {
      it('should be false when not in reviewing phase', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        });

        expect(result.current.canSave).toBe(false);
      });

      it('should be true when in reviewing with valid result', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
          result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
          result.current.dispatch({
            type: 'PROCESS_START',
            payload: { creditType: 'normal', creditsCount: 1 },
          });
          result.current.dispatch({
            type: 'PROCESS_SUCCESS',
            payload: { results: [createMockTransaction()] },
          });
        });

        expect(result.current.canSave).toBe(true);
      });

      it('should be false when result has zero total', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
          result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
          result.current.dispatch({
            type: 'PROCESS_START',
            payload: { creditType: 'normal', creditsCount: 1 },
          });
          result.current.dispatch({
            type: 'PROCESS_SUCCESS',
            payload: { results: [createMockTransaction({ total: 0 })] },
          });
        });

        expect(result.current.canSave).toBe(false);
      });
    });

    describe('currentView', () => {
      it('should return "none" when idle', () => {
        const { result } = renderHook(() => useScanStateMachine());
        expect(result.current.currentView).toBe('none');
      });

      it('should return "single-capture" for single mode capturing', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
        });

        expect(result.current.currentView).toBe('single-capture');
      });

      it('should return "batch-capture" for batch mode capturing', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_BATCH', payload: { userId: 'user-1' } });
        });

        expect(result.current.currentView).toBe('batch-capture');
      });

      it('should return "processing" when scanning', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
          result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
          result.current.dispatch({
            type: 'PROCESS_START',
            payload: { creditType: 'normal', creditsCount: 1 },
          });
        });

        expect(result.current.currentView).toBe('processing');
      });

      it('should return "single-review" for single mode reviewing', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
          result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
          result.current.dispatch({
            type: 'PROCESS_START',
            payload: { creditType: 'normal', creditsCount: 1 },
          });
          result.current.dispatch({
            type: 'PROCESS_SUCCESS',
            payload: { results: [createMockTransaction()] },
          });
        });

        expect(result.current.currentView).toBe('single-review');
      });

      it('should return "batch-review" for batch mode reviewing', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_BATCH', payload: { userId: 'user-1' } });
          result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
          result.current.dispatch({
            type: 'PROCESS_START',
            payload: { creditType: 'super', creditsCount: 1 },
          });
          result.current.dispatch({
            type: 'PROCESS_SUCCESS',
            payload: { results: [createMockTransaction()] },
          });
        });

        expect(result.current.currentView).toBe('batch-review');
      });

      it('should return "error" when in error phase', () => {
        const { result } = renderHook(() => useScanStateMachine());

        act(() => {
          result.current.dispatch({ type: 'START_SINGLE', payload: { userId: 'user-1' } });
          result.current.dispatch({ type: 'ADD_IMAGE', payload: { image: 'image-1' } });
          result.current.dispatch({
            type: 'PROCESS_START',
            payload: { creditType: 'normal', creditsCount: 1 },
          });
          result.current.dispatch({
            type: 'PROCESS_ERROR',
            payload: { error: 'Test error' },
          });
        });

        expect(result.current.currentView).toBe('error');
      });
    });
  });

  // ===========================================================================
  // Action Creators Tests
  // ===========================================================================

  describe('createScanActions', () => {
    it('should create action creators that dispatch correct actions', () => {
      const mockDispatch = vi.fn();
      const actions = createScanActions(mockDispatch);

      actions.startSingle('user-1');
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'START_SINGLE',
        payload: { userId: 'user-1' },
      });

      mockDispatch.mockClear();
      actions.addImage('base64-data');
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_IMAGE',
        payload: { image: 'base64-data' },
      });

      mockDispatch.mockClear();
      actions.processStart('normal', 1);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'PROCESS_START',
        payload: { creditType: 'normal', creditsCount: 1 },
      });

      mockDispatch.mockClear();
      actions.cancel();
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CANCEL' });
    });
  });
});
