/**
 * Unit tests for useTransactionDataOrchestrator
 *
 * Story TD-15b-35: Orchestrator Cleanup
 *
 * Verifies return shape and merge logic for paginatedTransactions + recentScans.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTransactionDataOrchestrator } from '../../../../src/app/hooks/useTransactionDataOrchestrator';
import type { Transaction } from '../../../../src/types/transaction';

const mockTransaction = (id: string, merchant: string): Transaction => ({
    id,
    merchant,
    date: '2026-01-01',
    total: 1000,
    category: 'Supermarket',
    items: [],
    country: 'Chile',
    city: 'Santiago',
    currency: 'CLP',
});

vi.mock('../../../../src/hooks/useTransactions', () => ({
    useTransactions: vi.fn(() => [mockTransaction('tx-1', 'Store A')]),
}));

vi.mock('../../../../src/hooks/useRecentScans', () => ({
    useRecentScans: vi.fn(() => [mockTransaction('scan-1', 'Store B')]),
}));

vi.mock('../../../../src/hooks/usePaginatedTransactions', () => ({
    usePaginatedTransactions: vi.fn(() => ({
        transactions: [mockTransaction('tx-1', 'Store A')],
    })),
}));

describe('useTransactionDataOrchestrator', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('returns all expected keys', () => {
        const { result } = renderHook(() =>
            useTransactionDataOrchestrator(null, null),
        );

        const expectedKeys = [
            'transactions',
            'recentScans',
            'paginatedTransactions',
            'transactionsWithRecentScans',
        ];

        for (const key of expectedKeys) {
            expect(result.current).toHaveProperty(key);
        }
    });

    it('merges recentScans into paginatedTransactions without duplicates', () => {
        const { result } = renderHook(() =>
            useTransactionDataOrchestrator(null, null),
        );

        const merged = result.current.transactionsWithRecentScans;
        const ids = merged.map((tx) => tx.id);

        // tx-1 from paginated, scan-1 from recentScans (no duplicates)
        expect(ids).toContain('tx-1');
        expect(ids).toContain('scan-1');
        expect(ids.length).toBe(2);
    });

    it('does not duplicate transactions already in paginated set', async () => {
        const { useRecentScans } = vi.mocked(
            await import('../../../../src/hooks/useRecentScans')
        );
        // Return the same id as paginated — should not duplicate
        (useRecentScans as ReturnType<typeof vi.fn>).mockReturnValue([
            mockTransaction('tx-1', 'Store A from scan'),
        ]);

        const { result } = renderHook(() =>
            useTransactionDataOrchestrator(null, null),
        );

        const merged = result.current.transactionsWithRecentScans;
        expect(merged.filter((tx) => tx.id === 'tx-1').length).toBe(1);
    });
});
