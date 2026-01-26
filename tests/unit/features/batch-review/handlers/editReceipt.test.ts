/**
 * Story 14e-14b: Batch Edit Receipt Handler Tests
 *
 * Tests for editBatchReceipt handler.
 * Covers:
 * - AC2: Edit handler extracts batch editing index correctly
 * - AC4: Unit tests for index conversion and navigation
 *
 * Source: App.tsx lines 1626-1635 (handleBatchEditReceipt)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { editBatchReceipt } from '@features/batch-review/handlers';
import type { BatchEditContext } from '@features/batch-review/handlers';
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
 * Create a mock batch receipt for testing.
 */
function createMockBatchReceipt(overrides: Partial<BatchReceipt> = {}): BatchReceipt {
  return {
    id: 'receipt-1',
    index: 0,
    transaction: createMockTransaction(),
    status: 'ready',
    confidence: 0.9,
    ...overrides,
  } as BatchReceipt;
}

/**
 * Create a mock edit context with mocked functions.
 */
function createMockEditContext(): {
  context: BatchEditContext;
  mocks: {
    setBatchEditingIndexContext: ReturnType<typeof vi.fn>;
    setCurrentTransaction: ReturnType<typeof vi.fn>;
    setTransactionEditorMode: ReturnType<typeof vi.fn>;
    navigateToView: ReturnType<typeof vi.fn>;
  };
} {
  const mocks = {
    setBatchEditingIndexContext: vi.fn(),
    setCurrentTransaction: vi.fn(),
    setTransactionEditorMode: vi.fn(),
    navigateToView: vi.fn(),
  };

  return {
    context: {
      setBatchEditingIndexContext: mocks.setBatchEditingIndexContext,
      setCurrentTransaction: mocks.setCurrentTransaction,
      setTransactionEditorMode: mocks.setTransactionEditorMode,
      navigateToView: mocks.navigateToView,
    },
    mocks,
  };
}

// =============================================================================
// Tests: editBatchReceipt
// =============================================================================

describe('editBatchReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('index conversion', () => {
    it('should convert 1-based UI index to 0-based index for first receipt', () => {
      const receipt = createMockBatchReceipt();
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 1, context); // 1-based index

      expect(mocks.setBatchEditingIndexContext).toHaveBeenCalledWith(0); // 0-based
    });

    it('should convert 1-based UI index to 0-based index for third receipt', () => {
      const receipt = createMockBatchReceipt({ id: 'receipt-3', index: 2 });
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 3, context); // 1-based index

      expect(mocks.setBatchEditingIndexContext).toHaveBeenCalledWith(2); // 0-based
    });

    it('should handle index 1 (first item in UI)', () => {
      const receipt = createMockBatchReceipt();
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 1, context);

      expect(mocks.setBatchEditingIndexContext).toHaveBeenCalledWith(0);
    });
  });

  describe('transaction handling', () => {
    it('should set transaction without thumbnail when receipt has no imageUrl', () => {
      const transaction = createMockTransaction({ id: 'tx-no-image' });
      const receipt = createMockBatchReceipt({
        transaction,
        imageUrl: undefined,
      });
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 1, context);

      expect(mocks.setCurrentTransaction).toHaveBeenCalledWith(transaction);
      const calledTransaction = mocks.setCurrentTransaction.mock.calls[0][0];
      expect(calledTransaction.thumbnailUrl).toBeUndefined();
    });

    it('should set transaction with thumbnail when receipt has imageUrl', () => {
      const imageUrl = 'https://example.com/receipt-image.jpg';
      const transaction = createMockTransaction({ id: 'tx-with-image' });
      const receipt = createMockBatchReceipt({
        transaction,
        imageUrl,
      });
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 1, context);

      const calledTransaction = mocks.setCurrentTransaction.mock.calls[0][0];
      expect(calledTransaction.thumbnailUrl).toBe(imageUrl);
      expect(calledTransaction.id).toBe('tx-with-image');
    });

    it('should preserve all transaction properties when adding thumbnail', () => {
      const transaction = createMockTransaction({
        id: 'tx-full',
        merchant: 'Full Store',
        total: 5000,
        category: 'Restaurant',
      });
      const receipt = createMockBatchReceipt({
        transaction,
        imageUrl: 'https://example.com/image.jpg',
      });
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 1, context);

      const calledTransaction = mocks.setCurrentTransaction.mock.calls[0][0];
      expect(calledTransaction.id).toBe('tx-full');
      expect(calledTransaction.merchant).toBe('Full Store');
      expect(calledTransaction.total).toBe(5000);
      expect(calledTransaction.category).toBe('Restaurant');
      expect(calledTransaction.thumbnailUrl).toBe('https://example.com/image.jpg');
    });
  });

  describe('editor mode', () => {
    it('should set transaction editor mode to existing', () => {
      const receipt = createMockBatchReceipt();
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 1, context);

      expect(mocks.setTransactionEditorMode).toHaveBeenCalledWith('existing');
    });
  });

  describe('navigation', () => {
    it('should navigate to transaction-editor view', () => {
      const receipt = createMockBatchReceipt();
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 1, context);

      expect(mocks.navigateToView).toHaveBeenCalledWith('transaction-editor');
    });

    it('should call functions in correct order', () => {
      const receipt = createMockBatchReceipt();
      const { context, mocks } = createMockEditContext();
      const callOrder: string[] = [];

      mocks.setBatchEditingIndexContext.mockImplementation(() =>
        callOrder.push('setBatchEditingIndexContext')
      );
      mocks.setCurrentTransaction.mockImplementation(() =>
        callOrder.push('setCurrentTransaction')
      );
      mocks.setTransactionEditorMode.mockImplementation(() =>
        callOrder.push('setTransactionEditorMode')
      );
      mocks.navigateToView.mockImplementation(() => callOrder.push('navigateToView'));

      editBatchReceipt(receipt, 1, context);

      expect(callOrder).toEqual([
        'setBatchEditingIndexContext',
        'setCurrentTransaction',
        'setTransactionEditorMode',
        'navigateToView',
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle receipt with error status', () => {
      const receipt = createMockBatchReceipt({
        status: 'error',
        error: 'OCR failed',
      });
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 1, context);

      // Should still work - editing an error receipt is valid
      expect(mocks.setBatchEditingIndexContext).toHaveBeenCalledWith(0);
      expect(mocks.navigateToView).toHaveBeenCalledWith('transaction-editor');
    });

    it('should handle receipt with low confidence', () => {
      const receipt = createMockBatchReceipt({
        status: 'review',
        confidence: 0.3,
      });
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 1, context);

      expect(mocks.setBatchEditingIndexContext).toHaveBeenCalledWith(0);
      expect(mocks.navigateToView).toHaveBeenCalledWith('transaction-editor');
    });

    it('should handle large batch index', () => {
      const receipt = createMockBatchReceipt({ index: 99 });
      const { context, mocks } = createMockEditContext();

      editBatchReceipt(receipt, 100, context); // 1-based

      expect(mocks.setBatchEditingIndexContext).toHaveBeenCalledWith(99); // 0-based
    });
  });
});
