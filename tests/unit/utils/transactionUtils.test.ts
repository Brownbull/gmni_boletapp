/**
 * Tests for transactionUtils - normalizeTransaction and helpers
 *
 * Story 14d-v2-1-2b: Default Value Handling
 * AC #4, #5, #6: Legacy transactions handled gracefully with sensible defaults
 */

import { describe, it, expect } from 'vitest';
import {
    ensureTransactionDefaults,
    ensureTransactionsDefaults,
} from '../../../src/utils/transactionUtils';
import type { Transaction } from '../../../src/types/transaction';

describe('ensureTransactionDefaults', () => {
    // Minimal valid transaction for testing
    const baseTransaction: Partial<Transaction> = {
        id: 'tx-123',
        merchant: 'Test Store',
        date: '2026-01-22',
        category: 'Supermercado' as any,
        total: 100.00,
        items: [],
    };

    describe('default values for missing fields', () => {
        it('should compute periods from date when missing', () => {
            const result = ensureTransactionDefaults(baseTransaction);

            expect(result.periods).toBeDefined();
            expect(result.periods?.day).toBe('2026-01-22');
            expect(result.periods?.month).toBe('2026-01');
            expect(result.periods?.quarter).toBe('2026-Q1');
            expect(result.periods?.year).toBe('2026');
        });

        it('should use createdAt as fallback for updatedAt', () => {
            const txWithCreatedAt = {
                ...baseTransaction,
                createdAt: '2026-01-15T10:00:00Z',
            };

            const result = ensureTransactionDefaults(txWithCreatedAt);
            expect(result.updatedAt).toBe('2026-01-15T10:00:00Z');
        });
    });

    describe('preserve existing values', () => {
        it('should preserve existing periods when present', () => {
            const existingPeriods = {
                day: '2025-12-31',
                week: '2025-W53',
                month: '2025-12',
                quarter: '2025-Q4',
                year: '2025',
            };
            const tx = { ...baseTransaction, periods: existingPeriods };

            const result = ensureTransactionDefaults(tx);
            expect(result.periods).toEqual(existingPeriods);
        });

        it('should preserve existing updatedAt when present', () => {
            const tx = {
                ...baseTransaction,
                updatedAt: '2026-01-20T12:00:00Z',
                createdAt: '2026-01-15T10:00:00Z',
            };

            const result = ensureTransactionDefaults(tx);
            expect(result.updatedAt).toBe('2026-01-20T12:00:00Z');
        });
    });

    describe('edge cases', () => {
        it('should handle transaction without date (no periods)', () => {
            const txNoDate = { ...baseTransaction, date: '' };
            const result = ensureTransactionDefaults(txNoDate);

            // Empty date should not cause error, periods will be fallback
            expect(result).toBeDefined();
        });

        it('should handle completely empty transaction', () => {
            const result = ensureTransactionDefaults({});

            // Just verify it doesn't throw and returns an object
            expect(result).toBeDefined();
        });

        it('should preserve all original fields', () => {
            const fullTx: Partial<Transaction> = {
                ...baseTransaction,
                alias: 'My Store',
                currency: 'USD',
                country: 'United States',
                city: 'New York',
                time: '14:30',
                imageUrls: ['url1', 'url2'],
            };

            const result = ensureTransactionDefaults(fullTx);

            expect(result.alias).toBe('My Store');
            expect(result.currency).toBe('USD');
            expect(result.country).toBe('United States');
            expect(result.city).toBe('New York');
            expect(result.time).toBe('14:30');
            expect(result.imageUrls).toEqual(['url1', 'url2']);
        });
    });
});

describe('ensureTransactionsDefaults', () => {
    it('should normalize an array of transactions', () => {
        const transactions: Partial<Transaction>[] = [
            { id: '1', merchant: 'A', date: '2026-01-01', category: 'Supermercado' as any, total: 10, items: [] },
            { id: '2', merchant: 'B', date: '2026-01-02', category: 'Restaurante' as any, total: 20, items: [] },
        ];

        const results = ensureTransactionsDefaults(transactions);

        expect(results).toHaveLength(2);
        expect(results[0].periods).toBeDefined();
        expect(results[1].periods).toBeDefined();
    });

    it('should handle empty array', () => {
        const results = ensureTransactionsDefaults([]);
        expect(results).toEqual([]);
    });
});
