/**
 * Tests for useAnalyticsTransactions Hook
 *
 * Story 14c.9: Shared Group Analytics
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests the unified analytics data source that switches between
 * personal and shared group transactions based on useViewModeStore.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import {
    useAnalyticsTransactions,
    calculateMemberContributions,
    aggregateCategoriesWithMembers,
    type UseAnalyticsTransactionsOptions,
    type MemberContribution,
} from '../../../src/hooks/useAnalyticsTransactions';
import type { Transaction } from '../../../src/types/transaction';
import type { SharedGroup } from '../../../src/types/sharedGroup';
import type { AnalyticsMember } from '../../../src/hooks/useAnalyticsTransactions';

// ============================================================================
// Mocks
// ============================================================================

// Mock ViewModeStore (Story 14d-v2-0: Migrated from ViewModeContext to Zustand store)
const mockViewModeStore = {
    mode: 'personal' as 'personal' | 'group',
    groupId: null as string | null,
    group: null as SharedGroup | null,
    isGroupMode: false,
    setPersonalMode: vi.fn(),
    setGroupMode: vi.fn(),
    updateGroupData: vi.fn(),
};

vi.mock('@/shared/stores/useViewModeStore', () => ({
    useViewMode: () => mockViewModeStore,
}));

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

const createMockMember = (overrides: Partial<AnalyticsMember> = {}): AnalyticsMember => ({
    uid: `user-${Math.random().toString(36).slice(2, 9)}`,
    email: 'member@test.com',
    displayName: 'Test Member',
    avatarColor: '#FF5722',
    joinedAt: Date.now(),
    ...overrides,
});

const createMockGroup = (overrides: Partial<SharedGroup> = {}): SharedGroup => ({
    id: 'group-123',
    name: 'Test Family',
    icon: '👨‍👩‍👧',
    color: '#3B82F6',
    ownerId: 'user-1',
    appId: 'boletapp',
    shareCode: 'abc123',
    shareCodeExpiresAt: { toDate: () => new Date() } as any,
    members: ['user-1', 'user-2'], // string[] of user IDs
    memberUpdates: {},
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
    ...overrides,
});

// ============================================================================
// Hook Tests
// ============================================================================

describe('useAnalyticsTransactions', () => {
    beforeEach(() => {
        // Reset to personal mode
        mockViewModeStore.mode = 'personal';
        mockViewModeStore.isGroupMode = false;
        mockViewModeStore.groupId = null;
        mockViewModeStore.group = null;
    });

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

    describe('Group Mode', () => {
        const mockGroup = createMockGroup();

        beforeEach(() => {
            mockViewModeStore.mode = 'group';
            mockViewModeStore.isGroupMode = true;
            mockViewModeStore.groupId = 'group-123';
            mockViewModeStore.group = mockGroup;
        });

        it('should return group transactions when in group mode', () => {
            const groupTx = [
                createMockTransaction({ id: 'group-1', total: 150, _ownerId: 'user-1' }),
                createMockTransaction({ id: 'group-2', total: 250, _ownerId: 'user-2' }),
            ];

            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [],
                    groupTransactions: groupTx,
                })
            );

            expect(result.current.transactions).toHaveLength(2);
            expect(result.current.transactions[0].id).toBe('group-1');
            expect(result.current.isGroupMode).toBe(true);
        });

        it('should include group metadata', () => {
            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [],
                    groupTransactions: [],
                })
            );

            expect(result.current.groupName).toBe('Test Family');
            expect(result.current.groupId).toBe('group-123');
            expect(result.current.groupIcon).toBe('👨‍👩‍👧');
            expect(result.current.groupColor).toBe('#3B82F6');
        });

        it('should include group members', () => {
            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [],
                    groupTransactions: [],
                })
            );

            expect(result.current.memberIds).toHaveLength(2);
            // memberIds is just string[] (user IDs), not full member objects
            expect(result.current.memberIds![0]).toBe('user-1');
            expect(result.current.memberIds![1]).toBe('user-2');
        });

        it('should include spending by member data', () => {
            const spendingByMember = new Map([
                ['user-1', 500],
                ['user-2', 300],
            ]);

            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [],
                    groupTransactions: [],
                    spendingByMember,
                })
            );

            expect(result.current.spendingByMember).toBe(spendingByMember);
            expect(result.current.spendingByMember?.get('user-1')).toBe(500);
        });

        it('should reflect loading state in group mode', () => {
            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [],
                    groupTransactions: [],
                    isGroupLoading: true,
                })
            );

            expect(result.current.isLoading).toBe(true);
        });

        it('should use group name as context label', () => {
            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [],
                    groupTransactions: [],
                })
            );

            expect(result.current.contextLabel).toBe('Test Family');
        });

        it('should fallback to "Shared Group" if no group name', () => {
            mockViewModeStore.group = { ...mockGroup, name: undefined as unknown as string };

            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [],
                    groupTransactions: [],
                })
            );

            expect(result.current.contextLabel).toBe('Shared Group');
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

        it('should handle undefined group in group mode gracefully', () => {
            mockViewModeStore.mode = 'group';
            mockViewModeStore.isGroupMode = true;
            mockViewModeStore.groupId = 'group-123';
            mockViewModeStore.group = undefined;

            const { result } = renderHook(() =>
                useAnalyticsTransactions({
                    personalTransactions: [],
                    groupTransactions: [],
                })
            );

            expect(result.current.isGroupMode).toBe(true);
            expect(result.current.groupName).toBeUndefined();
            expect(result.current.memberIds).toEqual([]);
        });
    });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('calculateMemberContributions', () => {
    const members: AnalyticsMember[] = [
        createMockMember({ uid: 'user-1', displayName: 'Alice', avatarColor: '#FF5722' }),
        createMockMember({ uid: 'user-2', displayName: 'Bob', avatarColor: '#4CAF50' }),
        createMockMember({ uid: 'user-3', displayName: 'Charlie', avatarColor: '#2196F3' }),
    ];

    it('should calculate contributions correctly', () => {
        const transactions: Transaction[] = [
            createMockTransaction({ total: 100, _ownerId: 'user-1' }),
            createMockTransaction({ total: 200, _ownerId: 'user-1' }),
            createMockTransaction({ total: 150, _ownerId: 'user-2' }),
            createMockTransaction({ total: 50, _ownerId: 'user-3' }),
        ];

        const contributions = calculateMemberContributions(transactions, members);

        expect(contributions).toHaveLength(3);

        // Sorted by total (highest first)
        expect(contributions[0].memberId).toBe('user-1');
        expect(contributions[0].total).toBe(300);
        expect(contributions[0].transactionCount).toBe(2);

        expect(contributions[1].memberId).toBe('user-2');
        expect(contributions[1].total).toBe(150);
        expect(contributions[1].transactionCount).toBe(1);

        expect(contributions[2].memberId).toBe('user-3');
        expect(contributions[2].total).toBe(50);
        expect(contributions[2].transactionCount).toBe(1);
    });

    it('should calculate percentages correctly', () => {
        const transactions: Transaction[] = [
            createMockTransaction({ total: 500, _ownerId: 'user-1' }), // 50%
            createMockTransaction({ total: 300, _ownerId: 'user-2' }), // 30%
            createMockTransaction({ total: 200, _ownerId: 'user-3' }), // 20%
        ];

        const contributions = calculateMemberContributions(transactions, members);

        expect(contributions[0].percentage).toBe(50);
        expect(contributions[1].percentage).toBe(30);
        expect(contributions[2].percentage).toBe(20);
    });

    it('should handle members with no transactions', () => {
        const transactions: Transaction[] = [
            createMockTransaction({ total: 100, _ownerId: 'user-1' }),
        ];

        const contributions = calculateMemberContributions(transactions, members);

        // User-1 has 100, others have 0
        const user1 = contributions.find(c => c.memberId === 'user-1');
        const user2 = contributions.find(c => c.memberId === 'user-2');
        const user3 = contributions.find(c => c.memberId === 'user-3');

        expect(user1?.total).toBe(100);
        expect(user1?.percentage).toBe(100);
        expect(user2?.total).toBe(0);
        expect(user2?.percentage).toBe(0);
        expect(user3?.total).toBe(0);
    });

    it('should handle empty transactions', () => {
        const contributions = calculateMemberContributions([], members);

        expect(contributions).toHaveLength(3);
        expect(contributions[0].total).toBe(0);
        expect(contributions[0].percentage).toBe(0);
    });

    it('should handle transactions with no _ownerId', () => {
        const transactions: Transaction[] = [
            createMockTransaction({ total: 100 }), // No _ownerId
        ];

        // The transaction won't match any member
        const contributions = calculateMemberContributions(transactions, members);

        // All members should have 0 (transaction assigned to 'unknown')
        expect(contributions.every(c => c.total === 0)).toBe(true);
    });

    it('should use email prefix if no displayName', () => {
        const membersNoName: AnalyticsMember[] = [
            createMockMember({
                uid: 'user-1',
                displayName: undefined as unknown as string,
                email: 'alice@example.com',
            }),
        ];

        const contributions = calculateMemberContributions([], membersNoName);

        expect(contributions[0].memberName).toBe('alice');
    });
});

describe('aggregateCategoriesWithMembers', () => {
    it('should aggregate categories with member breakdown', () => {
        const transactions: Transaction[] = [
            createMockTransaction({ category: 'Supermercado', total: 100, _ownerId: 'user-1' }),
            createMockTransaction({ category: 'Supermercado', total: 200, _ownerId: 'user-2' }),
            createMockTransaction({ category: 'Restaurante', total: 150, _ownerId: 'user-1' }),
        ];

        const result = aggregateCategoriesWithMembers(transactions);

        expect(result.size).toBe(2);

        const supermarket = result.get('Supermercado');
        expect(supermarket).toBeDefined();
        expect(supermarket!.total).toBe(300);
        expect(supermarket!.count).toBe(2);
        expect(supermarket!.byMember.get('user-1')?.total).toBe(100);
        expect(supermarket!.byMember.get('user-2')?.total).toBe(200);

        const restaurant = result.get('Restaurante');
        expect(restaurant).toBeDefined();
        expect(restaurant!.total).toBe(150);
        expect(restaurant!.count).toBe(1);
    });

    it('should handle transactions with no category', () => {
        const transactions: Transaction[] = [
            createMockTransaction({ category: undefined as unknown as string, total: 100 }),
        ];

        const result = aggregateCategoriesWithMembers(transactions);

        expect(result.has('Other')).toBe(true);
        expect(result.get('Other')!.total).toBe(100);
    });

    it('should handle empty transactions', () => {
        const result = aggregateCategoriesWithMembers([]);
        expect(result.size).toBe(0);
    });

    it('should track transaction counts per member', () => {
        const transactions: Transaction[] = [
            createMockTransaction({ category: 'Supermercado', total: 50, _ownerId: 'user-1' }),
            createMockTransaction({ category: 'Supermercado', total: 75, _ownerId: 'user-1' }),
            createMockTransaction({ category: 'Supermercado', total: 100, _ownerId: 'user-1' }),
        ];

        const result = aggregateCategoriesWithMembers(transactions);
        const supermarket = result.get('Supermercado');

        expect(supermarket!.byMember.get('user-1')?.count).toBe(3);
        expect(supermarket!.byMember.get('user-1')?.total).toBe(225);
    });
});
