/**
 * Shared test helpers for scan store tests.
 * Avoids duplication of mock factories across test files.
 */

import type { Transaction } from '@/types/transaction';
import type { BatchReceipt } from '@/types/batchReceipt';
import { initialScanState, getScanState } from '../index';

export function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'test-tx-1',
    date: '2026-01-25',
    merchant: 'Test Merchant',
    category: 'Supermarket',
    total: 1000,
    items: [{ name: 'Test Item', price: 1000, qty: 1 }],
    currency: 'CLP',
    ...overrides,
  };
}

export function createMockBatchReceipts(count: number = 3): BatchReceipt[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `receipt-${i}`,
    index: i,
    transaction: createMockTransaction({ id: `tx-${i}`, merchant: `Store ${i}` }),
    status: i === 0 ? 'ready' : i === 1 ? 'review' : 'error',
    confidence: i === 0 ? 0.95 : i === 1 ? 0.6 : 0,
    error: i === 2 ? 'Processing failed' : undefined,
  })) as BatchReceipt[];
}

export function getStateOnly(): typeof initialScanState {
  const fullState = getScanState();
  return {
    phase: fullState.phase,
    mode: fullState.mode,
    requestId: fullState.requestId,
    userId: fullState.userId,
    startedAt: fullState.startedAt,
    images: fullState.images,
    results: fullState.results,
    activeResultIndex: fullState.activeResultIndex,
    creditStatus: fullState.creditStatus,
    creditType: fullState.creditType,
    creditsCount: fullState.creditsCount,
    activeDialog: fullState.activeDialog,
    error: fullState.error,
    batchProgress: fullState.batchProgress,
    batchReceipts: fullState.batchReceipts,
    batchEditingIndex: fullState.batchEditingIndex,
    storeType: fullState.storeType,
    currency: fullState.currency,
    skipScanCompleteModal: fullState.skipScanCompleteModal,
    isRescanning: fullState.isRescanning,
  };
}
