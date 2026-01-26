/**
 * Story 14e-14d: Utils Tests
 *
 * Tests for shared batch review handler utilities.
 */

import { describe, it, expect } from 'vitest';
import { buildTransactionWithThumbnail } from '@features/batch-review/handlers/utils';
import type { BatchReceipt } from '@/types/batchReceipt';
import type { Transaction } from '@/types/transaction';

describe('buildTransactionWithThumbnail', () => {
  const mockTransaction: Transaction = {
    id: 'tx-1',
    merchant: 'Test Store',
    total: 100,
    currency: 'USD',
    date: '2026-01-26',
    items: [],
    storeCategory: 'grocery',
  };

  it('should add thumbnailUrl when receipt has imageUrl', () => {
    const receipt: BatchReceipt = {
      id: 'receipt-1',
      transaction: mockTransaction,
      imageUrl: 'https://example.com/image.jpg',
    };

    const result = buildTransactionWithThumbnail(receipt);

    expect(result.thumbnailUrl).toBe('https://example.com/image.jpg');
    expect(result.merchant).toBe('Test Store');
    expect(result.total).toBe(100);
  });

  it('should return transaction without thumbnailUrl when receipt has no imageUrl', () => {
    const receipt: BatchReceipt = {
      id: 'receipt-2',
      transaction: mockTransaction,
      imageUrl: undefined,
    };

    const result = buildTransactionWithThumbnail(receipt);

    expect(result.thumbnailUrl).toBeUndefined();
    expect(result.merchant).toBe('Test Store');
  });

  it('should return transaction without thumbnailUrl when imageUrl is empty string', () => {
    const receipt: BatchReceipt = {
      id: 'receipt-3',
      transaction: mockTransaction,
      imageUrl: '',
    };

    const result = buildTransactionWithThumbnail(receipt);

    expect(result.thumbnailUrl).toBeUndefined();
    expect(result.merchant).toBe('Test Store');
  });

  it('should not mutate the original transaction', () => {
    const receipt: BatchReceipt = {
      id: 'receipt-4',
      transaction: mockTransaction,
      imageUrl: 'https://example.com/image.jpg',
    };

    const result = buildTransactionWithThumbnail(receipt);

    expect(result).not.toBe(receipt.transaction);
    expect(mockTransaction.thumbnailUrl).toBeUndefined();
  });
});
