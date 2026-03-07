/**
 * Story 16-7: Event Bus Integration Tests
 *
 * Tests the end-to-end event flow:
 * - scan:completed -> transaction-editor receives -> state update
 * - review:saved -> batch-review receives -> finishEditing called
 *
 * AC-4: All subscriptions clean up on unmount.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { appEvents } from '@shared/events';

// =============================================================================
// Mock stores for integration testing
// =============================================================================

const mockEditorActions = vi.hoisted(() => ({
  setTransaction: vi.fn(),
  setCreditUsed: vi.fn(),
  setAnimateItems: vi.fn(),
}));

const mockBatchFinishEditing = vi.hoisted(() => vi.fn());

const mockScanState = vi.hoisted(() => ({
  results: [{ merchant: 'Integration Test Store', total: 5000, date: '2026-03-07', category: 'Other' }],
  activeResultIndex: 0,
}));

vi.mock('@features/transaction-editor/store', () => ({
  useTransactionEditorActions: () => mockEditorActions,
}));

vi.mock('@features/scan/store', () => ({
  getScanState: () => mockScanState,
}));

vi.mock('@features/batch-review', () => ({
  batchReviewActions: {
    finishEditing: mockBatchFinishEditing,
  },
}));

// Import subscription hooks after mocks
import { useScanEventSubscription } from '@features/transaction-editor/hooks/useScanEventSubscription';
import { useBatchReviewEventSubscription } from '@features/batch-review/hooks/useBatchReviewEventSubscription';

// =============================================================================
// Integration Tests
// =============================================================================

describe('Event Bus Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    appEvents.all.clear();
  });

  afterEach(() => {
    appEvents.all.clear();
  });

  describe('scan:completed -> transaction-editor', () => {
    it('should hydrate editor state when scan completes (AC-1)', () => {
      renderHook(() => useScanEventSubscription());

      act(() => {
        appEvents.emit('scan:completed', { transactionIds: [] });
      });

      expect(mockEditorActions.setTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ merchant: 'Integration Test Store', total: 5000 })
      );
      expect(mockEditorActions.setCreditUsed).toHaveBeenCalledWith(true);
      expect(mockEditorActions.setAnimateItems).toHaveBeenCalledWith(true);
    });
  });

  describe('review:saved -> batch-review', () => {
    it('should call finishEditing when editor saves during batch (AC-2)', () => {
      renderHook(() => useBatchReviewEventSubscription());

      act(() => {
        appEvents.emit('review:saved', { transactionIds: ['tx-1'] });
      });

      expect(mockBatchFinishEditing).toHaveBeenCalledTimes(1);
    });
  });

  describe('cross-subscription isolation', () => {
    it('should not cross-contaminate events between subscriptions', () => {
      renderHook(() => useScanEventSubscription());
      renderHook(() => useBatchReviewEventSubscription());

      act(() => {
        appEvents.emit('scan:completed', { transactionIds: [] });
      });

      // scan:completed should NOT trigger batch-review
      expect(mockBatchFinishEditing).not.toHaveBeenCalled();
      // scan:completed SHOULD trigger editor setup
      expect(mockEditorActions.setTransaction).toHaveBeenCalled();
    });

    it('should not cross-contaminate review:saved to editor', () => {
      renderHook(() => useScanEventSubscription());
      renderHook(() => useBatchReviewEventSubscription());

      vi.resetAllMocks();

      act(() => {
        appEvents.emit('review:saved', { transactionIds: ['tx-1'] });
      });

      // review:saved should NOT trigger editor setup
      expect(mockEditorActions.setTransaction).not.toHaveBeenCalled();
      // review:saved SHOULD trigger batch finishEditing
      expect(mockBatchFinishEditing).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup verification (AC-4)', () => {
    it('should clean up both subscriptions on unmount', () => {
      const { unmount: unmountScan } = renderHook(() => useScanEventSubscription());
      const { unmount: unmountBatch } = renderHook(() => useBatchReviewEventSubscription());

      unmountScan();
      unmountBatch();

      act(() => {
        appEvents.emit('scan:completed', { transactionIds: [] });
        appEvents.emit('review:saved', { transactionIds: [] });
      });

      expect(mockEditorActions.setTransaction).not.toHaveBeenCalled();
      expect(mockBatchFinishEditing).not.toHaveBeenCalled();
    });
  });
});
