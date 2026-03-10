/**
 * Shared test fixture: Transaction factory
 * Story 15-TD-25: Extracted from 4 TD-21 test files
 *
 * Used by: periodComparisonHelpers, drillDownHelpers, categoryDataHelpers, chartDataHelpers
 */
import type { Transaction } from '@/types/transaction';

export function makeTx(overrides: Partial<Transaction> & { date: string; total: number }): Transaction {
  return {
    merchant: 'TestMerchant',
    category: 'Supermarket' as Transaction['category'],
    items: [],
    ...overrides,
  };
}
