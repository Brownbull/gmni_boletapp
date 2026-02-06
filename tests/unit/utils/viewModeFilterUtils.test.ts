/**
 * Tests for viewModeFilterUtils
 *
 * Story 14d-v2-1-10d: View Mode Filtering Utilities
 *
 * TDD Phase 1: RED - All tests written before implementation.
 * These tests verify the filterTransactionsByViewMode function
 * which filters transactions based on view mode (personal vs group).
 */

import { describe, it, expect } from 'vitest';
import {
    filterTransactionsByViewMode,
    type ViewMode,
} from '../../../src/utils/viewModeFilterUtils';
import type { Transaction } from '../../../src/types/transaction';

/**
 * Factory function to create test transactions with minimal required fields.
 * Only includes fields relevant to view mode filtering.
 */
function createTestTransaction(
    id: string,
    sharedGroupId?: string | null
): Transaction {
    return {
        id,
        date: '2026-01-22',
        merchant: `Test Merchant ${id}`,
        category: 'Supermercado' as any,
        total: 100.00,
        items: [],
        sharedGroupId,
    };
}

describe('filterTransactionsByViewMode', () => {
    describe('Personal mode', () => {
        const mode: ViewMode = 'personal';

        it('returns transactions without sharedGroupId', () => {
            const transactions = [
                createTestTransaction('tx-1'),
                createTestTransaction('tx-2'),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, null);

            expect(result).toHaveLength(2);
            expect(result.map(tx => tx.id)).toEqual(['tx-1', 'tx-2']);
        });

        it('excludes transactions with sharedGroupId', () => {
            const transactions = [
                createTestTransaction('tx-1'),
                createTestTransaction('tx-2', 'group-abc'),
                createTestTransaction('tx-3'),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, null);

            expect(result).toHaveLength(2);
            expect(result.map(tx => tx.id)).toEqual(['tx-1', 'tx-3']);
        });

        it('includes transactions with null sharedGroupId', () => {
            const transactions = [
                createTestTransaction('tx-1', null),
                createTestTransaction('tx-2', null),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, null);

            expect(result).toHaveLength(2);
            expect(result[0].sharedGroupId).toBe(null);
            expect(result[1].sharedGroupId).toBe(null);
        });

        it('includes transactions with undefined sharedGroupId', () => {
            const transactions = [
                createTestTransaction('tx-1', undefined),
                createTestTransaction('tx-2', undefined),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, null);

            expect(result).toHaveLength(2);
            expect(result[0].sharedGroupId).toBeUndefined();
            expect(result[1].sharedGroupId).toBeUndefined();
        });

        it('includes transactions with empty string sharedGroupId', () => {
            const transactions = [
                createTestTransaction('tx-1', ''),
                createTestTransaction('tx-2', ''),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, null);

            expect(result).toHaveLength(2);
            expect(result[0].sharedGroupId).toBe('');
            expect(result[1].sharedGroupId).toBe('');
        });

        it('returns empty array when all transactions have sharedGroupId', () => {
            const transactions = [
                createTestTransaction('tx-1', 'group-abc'),
                createTestTransaction('tx-2', 'group-def'),
                createTestTransaction('tx-3', 'group-ghi'),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, null);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });
    });

    describe('Group mode', () => {
        const mode: ViewMode = 'group';
        const targetGroupId = 'group-abc';

        it('returns only transactions matching groupId', () => {
            const transactions = [
                createTestTransaction('tx-1', 'group-abc'),
                createTestTransaction('tx-2', 'group-abc'),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, targetGroupId);

            expect(result).toHaveLength(2);
            expect(result.map(tx => tx.id)).toEqual(['tx-1', 'tx-2']);
        });

        it('excludes transactions with different groupId', () => {
            const transactions = [
                createTestTransaction('tx-1', 'group-abc'),
                createTestTransaction('tx-2', 'group-xyz'),
                createTestTransaction('tx-3', 'group-abc'),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, targetGroupId);

            expect(result).toHaveLength(2);
            expect(result.map(tx => tx.id)).toEqual(['tx-1', 'tx-3']);
        });

        it('excludes transactions without sharedGroupId', () => {
            const transactions = [
                createTestTransaction('tx-1', 'group-abc'),
                createTestTransaction('tx-2'), // undefined
                createTestTransaction('tx-3', null),
                createTestTransaction('tx-4', ''),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, targetGroupId);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('tx-1');
        });

        it('returns empty array when no transactions match', () => {
            const transactions = [
                createTestTransaction('tx-1', 'group-xyz'),
                createTestTransaction('tx-2', 'group-def'),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, targetGroupId);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it('returns empty array when groupId is null', () => {
            const transactions = [
                createTestTransaction('tx-1', 'group-abc'),
                createTestTransaction('tx-2', 'group-abc'),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, null);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it('returns empty array when groupId is empty string', () => {
            const transactions = [
                createTestTransaction('tx-1', 'group-abc'),
                createTestTransaction('tx-2', 'group-abc'),
            ];

            const result = filterTransactionsByViewMode(transactions, mode, '');

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });
    });

    describe('Edge cases', () => {
        it('returns empty array for empty transactions input', () => {
            const result = filterTransactionsByViewMode([], 'personal', null);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it('returns empty array for empty transactions in group mode', () => {
            const result = filterTransactionsByViewMode([], 'group', 'group-abc');

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it('handles mixed personal and group transactions', () => {
            const transactions = [
                createTestTransaction('tx-1'), // personal (undefined)
                createTestTransaction('tx-2', 'group-abc'), // group
                createTestTransaction('tx-3', null), // personal
                createTestTransaction('tx-4', 'group-xyz'), // different group
                createTestTransaction('tx-5', ''), // personal (empty string)
            ];

            // Personal mode: should get tx-1, tx-3, tx-5
            const personalResult = filterTransactionsByViewMode(transactions, 'personal', null);
            expect(personalResult).toHaveLength(3);
            expect(personalResult.map(tx => tx.id)).toEqual(['tx-1', 'tx-3', 'tx-5']);

            // Group mode for 'group-abc': should get tx-2
            const groupResult = filterTransactionsByViewMode(transactions, 'group', 'group-abc');
            expect(groupResult).toHaveLength(1);
            expect(groupResult[0].id).toBe('tx-2');
        });

        it('preserves transaction order', () => {
            const transactions = [
                createTestTransaction('tx-1'),
                createTestTransaction('tx-2'),
                createTestTransaction('tx-3'),
                createTestTransaction('tx-4'),
                createTestTransaction('tx-5'),
            ];

            const result = filterTransactionsByViewMode(transactions, 'personal', null);

            expect(result.map(tx => tx.id)).toEqual(['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5']);
        });

        it('preserves transaction order in group mode', () => {
            const transactions = [
                createTestTransaction('tx-1', 'group-abc'),
                createTestTransaction('tx-2', 'group-abc'),
                createTestTransaction('tx-3', 'group-abc'),
            ];

            const result = filterTransactionsByViewMode(transactions, 'group', 'group-abc');

            expect(result.map(tx => tx.id)).toEqual(['tx-1', 'tx-2', 'tx-3']);
        });
    });
});
