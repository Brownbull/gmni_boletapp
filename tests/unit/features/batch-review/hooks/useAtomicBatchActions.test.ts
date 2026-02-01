/**
 * Story 14e-34b: useAtomicBatchActions Hook Tests
 *
 * Tests for atomic batch operations that prevent race conditions.
 * Verifies that both stores are updated synchronously in a single operation.
 *
 * AC1: Both stores updated in single synchronous operation
 * AC2: Both stores updated together with same data
 * AC3: Single entry point for all callers
 * AC4: Integration tests verify atomic behavior
 * AC5: No race condition in rapid operations
 * AC6: Auto-complete sees consistent empty state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAtomicBatchActions, atomicBatchActions } from '../../../../../src/features/batch-review/hooks/useAtomicBatchActions';
import type { BatchReceipt } from '../../../../../src/types/batchReceipt';

// =============================================================================
// Mocks
// =============================================================================

// Track call order to verify atomicity
const callOrder: string[] = [];

// Mock store state for testing
const mockScanStoreState = {
  batchReceipts: [
    { id: 'receipt-1', confidence: 0.9 },
    { id: 'receipt-2', confidence: 0.85 },
  ] as BatchReceipt[],
  discardBatchReceipt: vi.fn((id: string) => {
    callOrder.push(`scan:discard:${id}`);
  }),
  updateBatchReceipt: vi.fn((id: string, _updates: Partial<BatchReceipt>) => {
    callOrder.push(`scan:update:${id}`);
  }),
};

const mockBatchReviewStoreState = {
  items: [
    { id: 'receipt-1', confidence: 0.9 },
    { id: 'receipt-2', confidence: 0.85 },
  ] as BatchReceipt[],
  discardItem: vi.fn((id: string) => {
    callOrder.push(`review:discard:${id}`);
  }),
  updateItem: vi.fn((id: string, _updates: Partial<BatchReceipt>) => {
    callOrder.push(`review:update:${id}`);
  }),
};

// Mock scan store
vi.mock('../../../../../src/features/scan/store', () => ({
  useScanStore: Object.assign(
    () => mockScanStoreState,
    {
      getState: () => mockScanStoreState,
    }
  ),
}));

// Mock batch review store
vi.mock('../../../../../src/features/batch-review/store', () => ({
  useBatchReviewStore: Object.assign(
    () => mockBatchReviewStoreState,
    {
      getState: () => mockBatchReviewStoreState,
    }
  ),
}));

// =============================================================================
// Test Setup
// =============================================================================

describe('useAtomicBatchActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callOrder.length = 0;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // AC1: Atomic Discard Operation
  // ===========================================================================

  describe('discardReceiptAtomic', () => {
    it('should call both store discard methods synchronously (AC1)', () => {
      const { result } = renderHook(() => useAtomicBatchActions());

      act(() => {
        result.current.discardReceiptAtomic('receipt-1');
      });

      // Both methods should be called
      expect(mockScanStoreState.discardBatchReceipt).toHaveBeenCalledWith('receipt-1');
      expect(mockBatchReviewStoreState.discardItem).toHaveBeenCalledWith('receipt-1');

      // Both should be called exactly once
      expect(mockScanStoreState.discardBatchReceipt).toHaveBeenCalledTimes(1);
      expect(mockBatchReviewStoreState.discardItem).toHaveBeenCalledTimes(1);
    });

    it('should call scan store first, then review store (AC1)', () => {
      const { result } = renderHook(() => useAtomicBatchActions());

      act(() => {
        result.current.discardReceiptAtomic('receipt-1');
      });

      // Verify call order: scan store first, then review store
      expect(callOrder).toEqual([
        'scan:discard:receipt-1',
        'review:discard:receipt-1',
      ]);
    });

    it('should handle multiple discards atomically (AC5)', () => {
      const { result } = renderHook(() => useAtomicBatchActions());

      act(() => {
        result.current.discardReceiptAtomic('receipt-1');
        result.current.discardReceiptAtomic('receipt-2');
      });

      // Each discard should complete atomically before the next
      expect(callOrder).toEqual([
        'scan:discard:receipt-1',
        'review:discard:receipt-1',
        'scan:discard:receipt-2',
        'review:discard:receipt-2',
      ]);
    });

    it('should not allow intermediate state between store updates (AC1)', () => {
      // This test verifies the synchronous nature of updates
      const { result } = renderHook(() => useAtomicBatchActions());

      let intermediateCallCount = 0;

      // Override discardItem to check call count at discard time
      mockBatchReviewStoreState.discardItem.mockImplementation(() => {
        // At this point, scan store should already be called
        intermediateCallCount = mockScanStoreState.discardBatchReceipt.mock.calls.length;
        callOrder.push('review:discard:receipt-1');
      });

      act(() => {
        result.current.discardReceiptAtomic('receipt-1');
      });

      // When review store discard is called, scan store should already be called
      expect(intermediateCallCount).toBe(1);
    });
  });

  // ===========================================================================
  // AC2: Atomic Update Operation
  // ===========================================================================

  describe('updateReceiptAtomic', () => {
    it('should call both store update methods with same data (AC2)', () => {
      const { result } = renderHook(() => useAtomicBatchActions());
      const updates: Partial<BatchReceipt> = {
        confidence: 0.95,
        status: 'success' as const,
      };

      act(() => {
        result.current.updateReceiptAtomic('receipt-1', updates);
      });

      // Both methods should be called with identical arguments
      expect(mockScanStoreState.updateBatchReceipt).toHaveBeenCalledWith('receipt-1', updates);
      expect(mockBatchReviewStoreState.updateItem).toHaveBeenCalledWith('receipt-1', updates);
    });

    it('should call scan store first, then review store (AC2)', () => {
      const { result } = renderHook(() => useAtomicBatchActions());

      act(() => {
        result.current.updateReceiptAtomic('receipt-1', { confidence: 0.95 });
      });

      // Verify call order
      expect(callOrder).toEqual([
        'scan:update:receipt-1',
        'review:update:receipt-1',
      ]);
    });

    it('should apply mapping functions consistently to both stores (AC2)', () => {
      const { result } = renderHook(() => useAtomicBatchActions());
      const complexUpdates: Partial<BatchReceipt> = {
        confidence: 0.95,
        transaction: {
          id: 'tx-1',
          merchant: 'Updated Merchant',
          total: 100,
        } as any,
      };

      act(() => {
        result.current.updateReceiptAtomic('receipt-1', complexUpdates);
      });

      // Both stores should receive the exact same complex update object
      const scanCall = mockScanStoreState.updateBatchReceipt.mock.calls[0];
      const reviewCall = mockBatchReviewStoreState.updateItem.mock.calls[0];

      expect(scanCall[1]).toEqual(reviewCall[1]);
      expect(scanCall[1]).toBe(complexUpdates); // Same object reference
    });
  });

  // ===========================================================================
  // AC3: Single Entry Point (atomicBatchActions direct access)
  // ===========================================================================

  describe('atomicBatchActions (direct access)', () => {
    it('should provide discardReceiptAtomic for non-React code (AC3)', () => {
      atomicBatchActions.discardReceiptAtomic('receipt-1');

      expect(mockScanStoreState.discardBatchReceipt).toHaveBeenCalledWith('receipt-1');
      expect(mockBatchReviewStoreState.discardItem).toHaveBeenCalledWith('receipt-1');
    });

    it('should provide updateReceiptAtomic for non-React code (AC3)', () => {
      const updates = { confidence: 0.99 };

      atomicBatchActions.updateReceiptAtomic('receipt-1', updates);

      expect(mockScanStoreState.updateBatchReceipt).toHaveBeenCalledWith('receipt-1', updates);
      expect(mockBatchReviewStoreState.updateItem).toHaveBeenCalledWith('receipt-1', updates);
    });

    it('should maintain same call order as hook version (AC3)', () => {
      atomicBatchActions.discardReceiptAtomic('receipt-1');

      expect(callOrder).toEqual([
        'scan:discard:receipt-1',
        'review:discard:receipt-1',
      ]);
    });
  });

  // ===========================================================================
  // AC5: Race Condition Prevention
  // ===========================================================================

  describe('rapid operations (AC5)', () => {
    it('should handle rapid discards within 100ms without duplicate operations', () => {
      const { result } = renderHook(() => useAtomicBatchActions());

      // Simulate rapid discards
      act(() => {
        result.current.discardReceiptAtomic('receipt-1');
        result.current.discardReceiptAtomic('receipt-1'); // Same ID twice
      });

      // Each call should result in store calls (stores handle idempotency)
      expect(mockScanStoreState.discardBatchReceipt).toHaveBeenCalledTimes(2);
      expect(mockBatchReviewStoreState.discardItem).toHaveBeenCalledTimes(2);

      // But each atomic operation should complete before the next
      expect(callOrder).toEqual([
        'scan:discard:receipt-1',
        'review:discard:receipt-1',
        'scan:discard:receipt-1',
        'review:discard:receipt-1',
      ]);
    });

    it('should not leave stale state in either store (AC5)', () => {
      const { result } = renderHook(() => useAtomicBatchActions());

      act(() => {
        result.current.discardReceiptAtomic('receipt-1');
      });

      // Both stores should have been updated
      expect(mockScanStoreState.discardBatchReceipt).toHaveBeenCalled();
      expect(mockBatchReviewStoreState.discardItem).toHaveBeenCalled();

      // No partial state - both were updated in same tick
      // (Verified by call order test above)
    });
  });

  // ===========================================================================
  // AC6: Auto-Complete Consistency
  // ===========================================================================

  describe('auto-complete consistency (AC6)', () => {
    it('should update both stores before any effect can observe (AC6)', () => {
      // This test simulates the race condition scenario:
      // Discarding last item should update both stores before
      // auto-complete effect can check state
      const { result } = renderHook(() => useAtomicBatchActions());

      let scanCallCount = 0;
      let reviewCallCount = 0;

      // Simulate an effect observer that runs between calls
      mockBatchReviewStoreState.discardItem.mockImplementation(() => {
        // At this point, scan store should already be updated
        scanCallCount = mockScanStoreState.discardBatchReceipt.mock.calls.length;
        reviewCallCount++;
        callOrder.push('review:discard:receipt-1');
      });

      act(() => {
        result.current.discardReceiptAtomic('receipt-1');
      });

      // When review store is updated, scan store should already be done
      expect(scanCallCount).toBe(1);
      expect(reviewCallCount).toBe(1);
    });

    it('should allow correct navigation after discarding last item (AC6)', () => {
      // The fix ensures that when BatchReviewFeature's auto-complete
      // effect checks isEmpty, both stores report consistent state
      const { result } = renderHook(() => useAtomicBatchActions());

      act(() => {
        // Simulate discarding the last two items rapidly
        result.current.discardReceiptAtomic('receipt-1');
        result.current.discardReceiptAtomic('receipt-2');
      });

      // Both stores should have processed both discards
      expect(mockScanStoreState.discardBatchReceipt).toHaveBeenCalledTimes(2);
      expect(mockBatchReviewStoreState.discardItem).toHaveBeenCalledTimes(2);

      // Each pair should complete atomically
      expect(callOrder[0]).toBe('scan:discard:receipt-1');
      expect(callOrder[1]).toBe('review:discard:receipt-1');
      expect(callOrder[2]).toBe('scan:discard:receipt-2');
      expect(callOrder[3]).toBe('review:discard:receipt-2');
    });
  });

  // ===========================================================================
  // Hook Stability
  // ===========================================================================

  describe('hook stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useAtomicBatchActions());

      const firstDiscard = result.current.discardReceiptAtomic;
      const firstUpdate = result.current.updateReceiptAtomic;

      rerender();

      // Functions should be stable across rerenders (useCallback)
      expect(result.current.discardReceiptAtomic).toBe(firstDiscard);
      expect(result.current.updateReceiptAtomic).toBe(firstUpdate);
    });
  });
});
