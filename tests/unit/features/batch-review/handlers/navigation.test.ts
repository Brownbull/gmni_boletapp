/**
 * Story 14e-14a: Batch Navigation Handlers Tests
 *
 * Tests for navigateToPreviousReceipt and navigateToNextReceipt handlers.
 * Covers:
 * - AC3: Navigation handlers extracted with bounds checking
 * - AC4: Unit tests for bounds checking and transaction updates
 *
 * Source: App.tsx lines 1637-1665 (handleBatchPrevious, handleBatchNext)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  navigateToPreviousReceipt,
  navigateToNextReceipt,
} from '@features/batch-review/handlers';
import type { BatchNavigationContext } from '@features/batch-review/handlers';
import type { ScanState } from '@/types/scanStateMachine';
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
    status: 'ready' as const,
    confidence: 0.9,
    imageUrl: i === 1 ? 'https://example.com/image1.jpg' : undefined,
  })) as BatchReceipt[];
}

/**
 * Create a minimal scan state for testing.
 */
function createMockScanState(
  overrides: Partial<ScanState> = {}
): ScanState {
  return {
    phase: 'reviewing',
    mode: 'batch',
    requestId: 'test-request',
    userId: 'test-user',
    startedAt: Date.now(),
    images: [],
    results: [],
    activeResultIndex: 0,
    creditStatus: 'confirmed',
    creditType: 'super',
    creditsCount: 3,
    activeDialog: null,
    error: null,
    batchProgress: null,
    batchReceipts: null,
    batchEditingIndex: null,
    storeType: null,
    currency: null,
    ...overrides,
  };
}

/**
 * Create a mock navigation context for testing.
 */
function createMockContext(
  scanStateOverrides: Partial<ScanState> = {},
  currentTransaction: Transaction | null = null
): {
  context: BatchNavigationContext;
  mocks: {
    setBatchEditingIndexContext: ReturnType<typeof vi.fn>;
    setCurrentTransaction: ReturnType<typeof vi.fn>;
  };
} {
  const mocks = {
    setBatchEditingIndexContext: vi.fn(),
    setCurrentTransaction: vi.fn(),
  };

  return {
    context: {
      scanState: createMockScanState(scanStateOverrides),
      setBatchEditingIndexContext: mocks.setBatchEditingIndexContext,
      currentTransaction,
      setCurrentTransaction: mocks.setCurrentTransaction,
    },
    mocks,
  };
}

// =============================================================================
// Tests: navigateToPreviousReceipt
// =============================================================================

describe('navigateToPreviousReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bounds checking', () => {
    it('should return early if batchReceipts is null', () => {
      const { context, mocks } = createMockContext({
        batchReceipts: null,
        batchEditingIndex: 1,
      });

      navigateToPreviousReceipt(context);

      expect(mocks.setBatchEditingIndexContext).not.toHaveBeenCalled();
      expect(mocks.setCurrentTransaction).not.toHaveBeenCalled();
    });

    it('should return early if batchEditingIndex is null', () => {
      const { context, mocks } = createMockContext({
        batchReceipts: createMockBatchReceipts(3),
        batchEditingIndex: null,
      });

      navigateToPreviousReceipt(context);

      expect(mocks.setBatchEditingIndexContext).not.toHaveBeenCalled();
      expect(mocks.setCurrentTransaction).not.toHaveBeenCalled();
    });

    it('should return early if at first receipt (index 0)', () => {
      const { context, mocks } = createMockContext({
        batchReceipts: createMockBatchReceipts(3),
        batchEditingIndex: 0,
      });

      navigateToPreviousReceipt(context);

      expect(mocks.setBatchEditingIndexContext).not.toHaveBeenCalled();
      expect(mocks.setCurrentTransaction).not.toHaveBeenCalled();
    });

    it('should return early if batchReceipts is empty array', () => {
      const { context, mocks } = createMockContext({
        batchReceipts: [],
        batchEditingIndex: 0,
      });

      navigateToPreviousReceipt(context);

      expect(mocks.setBatchEditingIndexContext).not.toHaveBeenCalled();
      expect(mocks.setCurrentTransaction).not.toHaveBeenCalled();
    });
  });

  describe('happy path navigation', () => {
    it('should navigate from index 1 to index 0', () => {
      const batchReceipts = createMockBatchReceipts(3);
      const { context, mocks } = createMockContext({
        batchReceipts,
        batchEditingIndex: 1,
      });

      navigateToPreviousReceipt(context);

      expect(mocks.setBatchEditingIndexContext).toHaveBeenCalledWith(0);
      expect(mocks.setCurrentTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tx-0',
          merchant: 'Store 0',
        })
      );
    });

    it('should navigate from index 2 to index 1', () => {
      const batchReceipts = createMockBatchReceipts(3);
      const { context, mocks } = createMockContext({
        batchReceipts,
        batchEditingIndex: 2,
      });

      navigateToPreviousReceipt(context);

      expect(mocks.setBatchEditingIndexContext).toHaveBeenCalledWith(1);
      expect(mocks.setCurrentTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tx-1',
          merchant: 'Store 1',
        })
      );
    });
  });

  describe('thumbnail handling', () => {
    it('should add thumbnailUrl when receipt has imageUrl', () => {
      const batchReceipts = createMockBatchReceipts(3);
      // Receipt at index 1 has imageUrl
      const { context, mocks } = createMockContext({
        batchReceipts,
        batchEditingIndex: 2,
      });

      navigateToPreviousReceipt(context);

      expect(mocks.setCurrentTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnailUrl: 'https://example.com/image1.jpg',
        })
      );
    });

    it('should not add thumbnailUrl when receipt has no imageUrl', () => {
      const batchReceipts = createMockBatchReceipts(3);
      // Receipt at index 0 has no imageUrl
      const { context, mocks } = createMockContext({
        batchReceipts,
        batchEditingIndex: 1,
      });

      navigateToPreviousReceipt(context);

      const calledTransaction = mocks.setCurrentTransaction.mock.calls[0][0];
      expect(calledTransaction.thumbnailUrl).toBeUndefined();
    });
  });
});

// =============================================================================
// Tests: navigateToNextReceipt
// =============================================================================

describe('navigateToNextReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bounds checking', () => {
    it('should return early if batchReceipts is null', () => {
      const { context, mocks } = createMockContext({
        batchReceipts: null,
        batchEditingIndex: 0,
      });

      navigateToNextReceipt(context);

      expect(mocks.setBatchEditingIndexContext).not.toHaveBeenCalled();
      expect(mocks.setCurrentTransaction).not.toHaveBeenCalled();
    });

    it('should return early if batchEditingIndex is null', () => {
      const { context, mocks } = createMockContext({
        batchReceipts: createMockBatchReceipts(3),
        batchEditingIndex: null,
      });

      navigateToNextReceipt(context);

      expect(mocks.setBatchEditingIndexContext).not.toHaveBeenCalled();
      expect(mocks.setCurrentTransaction).not.toHaveBeenCalled();
    });

    it('should return early if at last receipt', () => {
      const { context, mocks } = createMockContext({
        batchReceipts: createMockBatchReceipts(3),
        batchEditingIndex: 2, // Last index for 3 receipts
      });

      navigateToNextReceipt(context);

      expect(mocks.setBatchEditingIndexContext).not.toHaveBeenCalled();
      expect(mocks.setCurrentTransaction).not.toHaveBeenCalled();
    });

    it('should return early if batchReceipts is empty array', () => {
      const { context, mocks } = createMockContext({
        batchReceipts: [],
        batchEditingIndex: 0,
      });

      navigateToNextReceipt(context);

      expect(mocks.setBatchEditingIndexContext).not.toHaveBeenCalled();
      expect(mocks.setCurrentTransaction).not.toHaveBeenCalled();
    });
  });

  describe('happy path navigation', () => {
    it('should navigate from index 0 to index 1', () => {
      const batchReceipts = createMockBatchReceipts(3);
      const { context, mocks } = createMockContext({
        batchReceipts,
        batchEditingIndex: 0,
      });

      navigateToNextReceipt(context);

      expect(mocks.setBatchEditingIndexContext).toHaveBeenCalledWith(1);
      expect(mocks.setCurrentTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tx-1',
          merchant: 'Store 1',
        })
      );
    });

    it('should navigate from index 1 to index 2', () => {
      const batchReceipts = createMockBatchReceipts(3);
      const { context, mocks } = createMockContext({
        batchReceipts,
        batchEditingIndex: 1,
      });

      navigateToNextReceipt(context);

      expect(mocks.setBatchEditingIndexContext).toHaveBeenCalledWith(2);
      expect(mocks.setCurrentTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tx-2',
          merchant: 'Store 2',
        })
      );
    });
  });

  describe('thumbnail handling', () => {
    it('should add thumbnailUrl when receipt has imageUrl', () => {
      const batchReceipts = createMockBatchReceipts(3);
      // Receipt at index 1 has imageUrl
      const { context, mocks } = createMockContext({
        batchReceipts,
        batchEditingIndex: 0,
      });

      navigateToNextReceipt(context);

      expect(mocks.setCurrentTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnailUrl: 'https://example.com/image1.jpg',
        })
      );
    });

    it('should not add thumbnailUrl when receipt has no imageUrl', () => {
      const batchReceipts = createMockBatchReceipts(3);
      // Receipt at index 2 has no imageUrl
      const { context, mocks } = createMockContext({
        batchReceipts,
        batchEditingIndex: 1,
      });

      navigateToNextReceipt(context);

      const calledTransaction = mocks.setCurrentTransaction.mock.calls[0][0];
      expect(calledTransaction.thumbnailUrl).toBeUndefined();
    });
  });

  describe('single-item batch edge case', () => {
    it('should not navigate when batch has only one receipt', () => {
      const batchReceipts = createMockBatchReceipts(1);
      const { context, mocks } = createMockContext({
        batchReceipts,
        batchEditingIndex: 0,
      });

      navigateToNextReceipt(context);

      expect(mocks.setBatchEditingIndexContext).not.toHaveBeenCalled();
      expect(mocks.setCurrentTransaction).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Tests: Integration scenarios
// =============================================================================

describe('Navigation handlers integration', () => {
  it('should allow navigating back and forth', () => {
    const batchReceipts = createMockBatchReceipts(3);

    // Start at index 0, go next
    const { context: ctx1, mocks: mocks1 } = createMockContext({
      batchReceipts,
      batchEditingIndex: 0,
    });
    navigateToNextReceipt(ctx1);
    expect(mocks1.setBatchEditingIndexContext).toHaveBeenCalledWith(1);

    // Now at index 1, go previous
    const { context: ctx2, mocks: mocks2 } = createMockContext({
      batchReceipts,
      batchEditingIndex: 1,
    });
    navigateToPreviousReceipt(ctx2);
    expect(mocks2.setBatchEditingIndexContext).toHaveBeenCalledWith(0);
  });

  it('should preserve transaction properties when adding thumbnailUrl', () => {
    const batchReceipts = createMockBatchReceipts(3);
    // Receipt at index 1 has imageUrl
    const { context, mocks } = createMockContext({
      batchReceipts,
      batchEditingIndex: 0,
    });

    navigateToNextReceipt(context);

    const calledTransaction = mocks.setCurrentTransaction.mock.calls[0][0];
    // Should have original properties
    expect(calledTransaction.id).toBe('tx-1');
    expect(calledTransaction.merchant).toBe('Store 1');
    expect(calledTransaction.total).toBe(2000);
    expect(calledTransaction.category).toBe('Supermarket');
    // Plus the thumbnail
    expect(calledTransaction.thumbnailUrl).toBe('https://example.com/image1.jpg');
  });
});
