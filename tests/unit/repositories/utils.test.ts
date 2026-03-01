/**
 * Unit tests for repository utilities
 *
 * Story TD-15b-27: Tests for shared sanitizeTransactions extracted from hooks.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeTransactions } from '../../../src/repositories/utils';
import type { Transaction } from '../../../src/types/transaction';

describe('sanitizeTransactions', () => {
    const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
        id: 'tx-1',
        merchant: 'Test Store',
        date: '2026-01-15',
        total: 1500,
        category: 'Supermarket',
        items: [{ name: 'Item 1', price: 500 }],
        country: 'Chile',
        city: 'Santiago',
        currency: 'CLP',
        ...overrides,
    });

    it('returns empty array for empty input', () => {
        expect(sanitizeTransactions([])).toEqual([]);
    });

    it('preserves valid transaction data', () => {
        const tx = makeTransaction();
        const [result] = sanitizeTransactions([tx]);

        expect(result.merchant).toBe('Test Store');
        expect(result.category).toBe('Supermarket');
        expect(result.currency).toBe('CLP');
    });

    it('sanitizes date via getSafeDate', () => {
        const tx = makeTransaction({ date: null as unknown as string });
        const [result] = sanitizeTransactions([tx]);

        // getSafeDate returns a valid date string for null input
        expect(result.date).toBeDefined();
        expect(typeof result.date).toBe('string');
    });

    it('parses total via parseStrictNumber', () => {
        const tx = makeTransaction({ total: '1500' as unknown as number });
        const [result] = sanitizeTransactions([tx]);

        expect(result.total).toBe(1500);
        expect(typeof result.total).toBe('number');
    });

    it('parses item prices via parseStrictNumber', () => {
        const tx = makeTransaction({
            items: [{ name: 'Item 1', price: '300' as unknown as number }],
        });
        const [result] = sanitizeTransactions([tx]);

        expect(result.items[0].price).toBe(300);
        expect(typeof result.items[0].price).toBe('number');
    });

    it('handles non-array items by returning empty array', () => {
        const tx = makeTransaction({ items: null as unknown as Transaction['items'] });
        const [result] = sanitizeTransactions([tx]);

        expect(result.items).toEqual([]);
    });

    it('handles undefined items by returning empty array', () => {
        const tx = makeTransaction({ items: undefined as unknown as Transaction['items'] });
        const [result] = sanitizeTransactions([tx]);

        expect(result.items).toEqual([]);
    });

    it('sanitizes multiple transactions', () => {
        const txs = [
            makeTransaction({ id: 'tx-1', total: 100 }),
            makeTransaction({ id: 'tx-2', total: 200 }),
            makeTransaction({ id: 'tx-3', total: 300 }),
        ];
        const results = sanitizeTransactions(txs);

        expect(results).toHaveLength(3);
        expect(results[0].total).toBe(100);
        expect(results[1].total).toBe(200);
        expect(results[2].total).toBe(300);
    });
});
