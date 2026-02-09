import { describe, it, expect } from 'vitest';
import { mergeTransactionsWithRecentScans } from '@/utils/transactionMerge';
import type { Transaction } from '@/types/transaction';

function createTx(id: string, merchant = 'Test'): Transaction {
    return { id, merchant, date: '2026-01-01', total: 100, category: 'Test', items: [] } as Transaction;
}

describe('mergeTransactionsWithRecentScans', () => {
    it('returns paginated unchanged when recentScans is null', () => {
        const paginated = [createTx('1'), createTx('2')];
        const result = mergeTransactionsWithRecentScans(paginated, null);
        expect(result).toBe(paginated);
    });

    it('returns paginated unchanged when recentScans is undefined', () => {
        const paginated = [createTx('1')];
        const result = mergeTransactionsWithRecentScans(paginated, undefined);
        expect(result).toBe(paginated);
    });

    it('returns paginated unchanged when recentScans is empty', () => {
        const paginated = [createTx('1')];
        const result = mergeTransactionsWithRecentScans(paginated, []);
        expect(result).toBe(paginated);
    });

    it('merges with no duplicates — recent scans first', () => {
        const paginated = [createTx('1'), createTx('2')];
        const recent = [createTx('3'), createTx('4')];
        const result = mergeTransactionsWithRecentScans(paginated, recent);
        expect(result.map(t => t.id)).toEqual(['3', '4', '1', '2']);
    });

    it('deduplicates — removes paginated entries matching recent scan IDs', () => {
        const paginated = [createTx('1'), createTx('2'), createTx('3')];
        const recent = [createTx('2', 'Recent version')];
        const result = mergeTransactionsWithRecentScans(paginated, recent);
        expect(result.map(t => t.id)).toEqual(['2', '1', '3']);
        expect(result[0].merchant).toBe('Recent version');
    });

    it('handles recent scans without id gracefully', () => {
        const paginated = [createTx('1')];
        const noIdTx = { merchant: 'NoId', date: '2026-01-01', total: 50, category: 'Test', items: [] } as Transaction;
        const recent = [noIdTx, createTx('2')];
        const result = mergeTransactionsWithRecentScans(paginated, recent);
        expect(result).toHaveLength(3);
        expect(result[0]).toBe(noIdTx);
    });

    it('filters out paginated transactions without id when checking duplicates', () => {
        const noIdPaginated = { merchant: 'NoId', date: '2026-01-01', total: 50, category: 'Test', items: [] } as Transaction;
        const paginated = [noIdPaginated, createTx('1')];
        const recent = [createTx('2')];
        const result = mergeTransactionsWithRecentScans(paginated, recent);
        // noIdPaginated is filtered out because tx.id is falsy
        expect(result.map(t => t.id)).toEqual(['2', '1']);
    });

    it('returns only recent scans when all paginated are duplicates', () => {
        const paginated = [createTx('1'), createTx('2')];
        const recent = [createTx('1'), createTx('2')];
        const result = mergeTransactionsWithRecentScans(paginated, recent);
        expect(result).toHaveLength(2);
        expect(result.map(t => t.id)).toEqual(['1', '2']);
    });

    it('handles empty paginated with recent scans', () => {
        const recent = [createTx('1')];
        const result = mergeTransactionsWithRecentScans([], recent);
        expect(result.map(t => t.id)).toEqual(['1']);
    });
});
