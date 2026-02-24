import { describe, it, expect } from 'vitest';
import {
    sortTransactionsWithinGroups,
    PAGE_SIZE_OPTIONS,
    DEFAULT_PAGE_SIZE,
    HISTORY_SORT_OPTIONS,
    DEFAULT_HISTORY_SORT_KEY,
    DEFAULT_HISTORY_SORT_DIRECTION,
} from '@features/history/views/historyViewConstants';
import type { Transaction } from '@/types/transaction';

// Minimal transaction factory for sort testing
function makeTx(overrides: Partial<Transaction> & { date: string; merchant: string; total: number }): Transaction {
    return {
        id: `tx-${Math.random().toString(36).slice(2, 8)}`,
        alias: '',
        time: '12:00',
        category: 'food',
        city: 'Santiago',
        country: 'CL',
        currency: 'CLP',
        items: [],
        ...overrides,
    } as Transaction;
}

describe('historyViewConstants', () => {
    describe('constants', () => {
        it('exports PAGE_SIZE_OPTIONS as [15, 30, 60]', () => {
            expect(PAGE_SIZE_OPTIONS).toEqual([15, 30, 60]);
        });

        it('exports DEFAULT_PAGE_SIZE as 15', () => {
            expect(DEFAULT_PAGE_SIZE).toBe(15);
        });

        it('exports 3 sort options with correct keys', () => {
            expect(HISTORY_SORT_OPTIONS).toHaveLength(3);
            expect(HISTORY_SORT_OPTIONS.map(o => o.key)).toEqual(['date', 'total', 'merchant']);
        });

        it('exports default sort key as date descending', () => {
            expect(DEFAULT_HISTORY_SORT_KEY).toBe('date');
            expect(DEFAULT_HISTORY_SORT_DIRECTION).toBe('desc');
        });
    });

    describe('sortTransactionsWithinGroups', () => {
        const txA = makeTx({ date: '2024-01-15', merchant: 'Alpha', total: 100 });
        const txB = makeTx({ date: '2024-01-15', merchant: 'Beta', total: 200 });
        const txC = makeTx({ date: '2024-01-10', merchant: 'Charlie', total: 50 });
        const txD = makeTx({ date: '2024-01-10', merchant: 'Delta', total: 300 });

        describe('date sort', () => {
            it('sorts all transactions by date descending', () => {
                const result = sortTransactionsWithinGroups([txC, txA, txB, txD], 'date', 'desc');
                expect(result[0].date).toBe('2024-01-15');
                expect(result[1].date).toBe('2024-01-15');
                expect(result[2].date).toBe('2024-01-10');
                expect(result[3].date).toBe('2024-01-10');
            });

            it('sorts all transactions by date ascending', () => {
                const result = sortTransactionsWithinGroups([txA, txC, txB, txD], 'date', 'asc');
                expect(result[0].date).toBe('2024-01-10');
                expect(result[1].date).toBe('2024-01-10');
                expect(result[2].date).toBe('2024-01-15');
                expect(result[3].date).toBe('2024-01-15');
            });
        });

        describe('total sort', () => {
            it('sorts within date groups by total descending', () => {
                const result = sortTransactionsWithinGroups([txA, txB, txC, txD], 'total', 'desc');
                // 2024-01-15 group first (newest), sorted by total desc
                expect(result[0].total).toBe(200); // Beta
                expect(result[1].total).toBe(100); // Alpha
                // 2024-01-10 group second, sorted by total desc
                expect(result[2].total).toBe(300); // Delta
                expect(result[3].total).toBe(50);  // Charlie
            });

            it('sorts within date groups by total ascending', () => {
                const result = sortTransactionsWithinGroups([txA, txB, txC, txD], 'total', 'asc');
                expect(result[0].total).toBe(100); // Alpha
                expect(result[1].total).toBe(200); // Beta
                expect(result[2].total).toBe(50);  // Charlie
                expect(result[3].total).toBe(300); // Delta
            });
        });

        describe('merchant sort', () => {
            it('sorts within date groups by merchant descending', () => {
                const result = sortTransactionsWithinGroups([txA, txB, txC, txD], 'merchant', 'desc');
                // 2024-01-15 group: Beta > Alpha (desc)
                expect(result[0].merchant).toBe('Beta');
                expect(result[1].merchant).toBe('Alpha');
                // 2024-01-10 group: Delta > Charlie (desc)
                expect(result[2].merchant).toBe('Delta');
                expect(result[3].merchant).toBe('Charlie');
            });

            it('sorts within date groups by merchant ascending', () => {
                const result = sortTransactionsWithinGroups([txA, txB, txC, txD], 'merchant', 'asc');
                expect(result[0].merchant).toBe('Alpha');
                expect(result[1].merchant).toBe('Beta');
                expect(result[2].merchant).toBe('Charlie');
                expect(result[3].merchant).toBe('Delta');
            });

            it('uses alias when available for merchant sort', () => {
                const txWithAlias = makeTx({ date: '2024-01-15', merchant: 'Zeta', alias: 'AAA', total: 50 });
                const result = sortTransactionsWithinGroups([txA, txWithAlias], 'merchant', 'asc');
                // AAA (alias) < Alpha (merchant)
                expect(result[0].merchant).toBe('Zeta'); // alias "AAA" sorts first
                expect(result[1].merchant).toBe('Alpha');
            });
        });

        it('handles empty array', () => {
            const result = sortTransactionsWithinGroups([], 'date', 'desc');
            expect(result).toEqual([]);
        });

        it('handles single transaction', () => {
            const result = sortTransactionsWithinGroups([txA], 'total', 'asc');
            expect(result).toHaveLength(1);
            expect(result[0]).toBe(txA);
        });

        it('does not mutate original array', () => {
            const original = [txA, txB, txC];
            const originalCopy = [...original];
            sortTransactionsWithinGroups(original, 'date', 'desc');
            expect(original).toEqual(originalCopy);
        });
    });
});
