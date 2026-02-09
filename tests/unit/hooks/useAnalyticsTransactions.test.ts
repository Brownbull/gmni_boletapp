/**
 * Tests for useAnalyticsTransactions Hook
 *
 * Tests the unified analytics data source that returns
 * personal transactions for analytics views.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
    useAnalyticsTransactions,
} from '@features/analytics/hooks/useAnalyticsTransactions';
import type { Transaction } from '../../../src/types/transaction';

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: `tx-${Math.random().toString(36).slice(2, 9)}`,
    date: '2026-01-15',
    merchant: 'Test Store',
    category: 'Supermercado',
    total: 100,
    items: [{ name: 'Test Item', price: 100 }],
    ...overrides,
});


// ============================================================================
// Hook Tests
// ============================================================================

describe('useAnalyticsTransactions', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Personal Mode', () => {
        it('should return personal transactions when in personal mode', () => {
            const personalTx = [
                createMockTransaction({ id: 'personal-1', total: 100 }),
                createMockTransaction({ id: 'personal-2', total: 200 }),
            ];

            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: personalTx,
                    groupTransactions: [],
                })
            );

            expect(result.current.transactions).toHaveLength(2);
            expect(result.current.transactions[0].id).toBe('personal-1');
            expect(result.current.isGroupMode).toBe(false);
            expect(result.current.groupName).toBeUndefined();
            expect(result.current.memberIds).toBeUndefined();
        });

        it('should not be loading in personal mode', () => {
            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [createMockTransaction()],
                    groupTransactions: [],
                    isGroupLoading: true, // Should be ignored in personal mode
                })
            );

            expect(result.current.isLoading).toBe(false);
        });

        it('should return "personal" as context label', () => {
            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [],
                    groupTransactions: [],
                })
            );

            expect(result.current.contextLabel).toBe('personal');
        });
    });

    describe('Edge Cases', () => {
        it('should return empty array when no transactions', () => {
            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [],
                    groupTransactions: [],
                })
            );

            expect(result.current.transactions).toEqual([]);
        });

    });
});
