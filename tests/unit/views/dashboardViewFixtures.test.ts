/**
 * Tests for dashboardViewFixtures normalization logic.
 * TD-15b-34 review fix: covers the 4-branch allTransactions/transactions sync.
 */

import { describe, it, expect } from 'vitest';
import { normalizeTransactionOverrides } from './dashboardViewFixtures';

describe('normalizeTransactionOverrides', () => {
  const txList = [{ id: '1', merchant: 'A', date: '2026-01-15', total: 10, category: 'Otro' }];

  it('copies allTransactions to transactions when only allTransactions provided', () => {
    const result = normalizeTransactionOverrides({ allTransactions: txList as any });
    expect(result.transactions).toBe(txList);
    expect(result.allTransactions).toBe(txList);
  });

  it('copies transactions to allTransactions when only transactions provided', () => {
    const result = normalizeTransactionOverrides({ transactions: txList as any });
    expect(result.allTransactions).toBe(txList);
    expect(result.transactions).toBe(txList);
  });

  it('leaves both unchanged when both provided', () => {
    const other = [{ id: '2', merchant: 'B', date: '2026-01-14', total: 20, category: 'Otro' }];
    const result = normalizeTransactionOverrides({
      allTransactions: txList as any,
      transactions: other as any,
    });
    expect(result.allTransactions).toBe(txList);
    expect(result.transactions).toBe(other);
  });

  it('returns empty overrides unchanged when neither provided', () => {
    const result = normalizeTransactionOverrides({});
    expect(result.allTransactions).toBeUndefined();
    expect(result.transactions).toBeUndefined();
  });
});
