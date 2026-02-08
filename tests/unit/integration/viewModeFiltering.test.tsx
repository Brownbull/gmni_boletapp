/**
 * Story 14d-v2-1-10d: Integration Tests for View Mode Data Filtering
 *
 * Tests the full integration flow:
 * 1. View mode affects which transactions are shown
 * 2. Mode switch clears history filters
 * 3. Each view respects the current mode
 * 4. Multi-view consistency
 *
 * Architecture Reference:
 * - Story 14d-v2-1-10d: Data Filtering Integration
 * - AC#1: Personal mode shows only personal transactions
 * - AC#2: Group mode shows only group transactions
 * - AC#3: Filters cleared when switching modes
 * - AC#5: Filters cleared but scroll position preserved
 *
 * TDD Compliance:
 * - Tests written to verify existing implementation
 * - All edge cases covered
 * - Uses actual store and utility implementations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React, { type ReactNode } from 'react';

// Store under test - actual implementation
import {
    useViewModeStore,
    initialViewModeState,
} from '@/shared/stores/useViewModeStore';

// Filter utility under test - actual implementation
import { filterTransactionsByViewMode } from '@/utils/viewModeFilterUtils';

// Filter sync hook under test - actual implementation
import { useViewModeFilterSync } from '@/hooks/useViewModeFilterSync';

// HistoryFiltersContext for filter clear testing
import {
    HistoryFiltersProvider,
    HistoryFiltersContext,
    getDefaultFilterState,
    type HistoryFilterState,
} from '@/contexts/HistoryFiltersContext';

import type { Transaction } from '@/types/transaction';
import type { SharedGroup } from '@/types/sharedGroup';
import { createMockTimestamp } from '../../helpers';

// =============================================================================
// Test Data Factory
// =============================================================================

/**
 * Factory function to create test transactions with minimal required fields.
 * Only includes fields relevant to view mode filtering.
 */
function createTestTransaction(
    id: string,
    options?: {
        sharedGroupId?: string | null;
        merchant?: string;
        total?: number;
        date?: string;
    }
): Transaction {
    return {
        id,
        date: options?.date ?? '2026-01-22',
        merchant: options?.merchant ?? `Test Merchant ${id}`,
        category: 'Supermercado' as any,
        total: options?.total ?? 100.0,
        items: [],
        sharedGroupId: options?.sharedGroupId,
    };
}

/**
 * Factory function to create test shared group.
 */
function createTestGroup(
    id: string,
    name: string,
    options?: Partial<SharedGroup>
): SharedGroup {
    return {
        id,
        name,
        color: '#FF5733',
        members: ['user-1', 'user-2'],
        createdAt: createMockTimestamp(),
        createdBy: 'user-1',
        ...options,
    } as SharedGroup;
}

// =============================================================================
// Test Data
// =============================================================================

const mockTransactions = {
    // Personal transactions (no sharedGroupId)
    personal: [
        createTestTransaction('personal-1', { merchant: 'Personal Store A', sharedGroupId: null }),
        createTestTransaction('personal-2', { merchant: 'Personal Store B', sharedGroupId: undefined }),
        createTestTransaction('personal-3', { merchant: 'Personal Store C', sharedGroupId: '' }),
    ],
    // Family group transactions
    family: [
        createTestTransaction('family-1', { merchant: 'Family Store A', sharedGroupId: 'family-id' }),
        createTestTransaction('family-2', { merchant: 'Family Store B', sharedGroupId: 'family-id' }),
    ],
    // Roommate group transactions
    roommates: [
        createTestTransaction('roommate-1', { merchant: 'Roommate Store A', sharedGroupId: 'roommate-id' }),
        createTestTransaction('roommate-2', { merchant: 'Roommate Store B', sharedGroupId: 'roommate-id' }),
        createTestTransaction('roommate-3', { merchant: 'Roommate Store C', sharedGroupId: 'roommate-id' }),
    ],
};

const allTransactions = [
    ...mockTransactions.personal,
    ...mockTransactions.family,
    ...mockTransactions.roommates,
];

const testGroups = {
    family: createTestGroup('family-id', 'Family'),
    roommates: createTestGroup('roommate-id', 'Roommates'),
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Reset the ViewMode store to initial state.
 */
function resetViewModeStore(): void {
    useViewModeStore.setState(initialViewModeState);
}

/**
 * Set store to personal mode.
 */
function setPersonalMode(): void {
    useViewModeStore.getState().setPersonalMode();
}

/**
 * Set store to group mode with specified group.
 */
function setGroupMode(group: SharedGroup): void {
    useViewModeStore.getState().setGroupMode(group.id!, group);
}

/**
 * Get current view mode from store.
 */
function getViewMode(): { mode: 'personal' | 'group'; groupId: string | null } {
    const state = useViewModeStore.getState();
    return { mode: state.mode, groupId: state.groupId };
}

// =============================================================================
// Integration Tests
// =============================================================================

describe('View Mode Data Filtering Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetViewModeStore();
    });

    // =========================================================================
    // Scenario: User switches from Personal to Group mode
    // =========================================================================

    describe('Scenario: User switches from Personal to Group mode', () => {
        it('personal mode shows only personal transactions', () => {
            // Given: User has mixed personal and group transactions
            // When: User is in personal mode
            setPersonalMode();
            const { mode, groupId } = getViewMode();

            // Then: Only personal transactions (no sharedGroupId) are shown
            const filtered = filterTransactionsByViewMode(allTransactions, mode, groupId);

            expect(filtered).toHaveLength(3);
            expect(filtered.map((tx) => tx.id)).toEqual([
                'personal-1',
                'personal-2',
                'personal-3',
            ]);
            // Verify all returned transactions have falsy sharedGroupId
            filtered.forEach((tx) => {
                expect(!tx.sharedGroupId).toBe(true);
            });
        });

        it('group mode shows only transactions for active group', () => {
            // Given: User has transactions for multiple groups
            // When: User switches to group mode with "family" group active
            setGroupMode(testGroups.family);
            const { mode, groupId } = getViewMode();

            // Then: Only transactions with sharedGroupId === 'family-id' are shown
            const filtered = filterTransactionsByViewMode(allTransactions, mode, groupId);

            expect(filtered).toHaveLength(2);
            expect(filtered.map((tx) => tx.id)).toEqual(['family-1', 'family-2']);
            // Verify all returned transactions belong to family group
            filtered.forEach((tx) => {
                expect(tx.sharedGroupId).toBe('family-id');
            });
        });

        it('switching modes filters data appropriately in sequence', () => {
            // Given: User starts in personal mode
            setPersonalMode();
            let { mode, groupId } = getViewMode();
            let filtered = filterTransactionsByViewMode(allTransactions, mode, groupId);
            expect(filtered).toHaveLength(3); // Personal transactions

            // When: User switches to group mode (family)
            setGroupMode(testGroups.family);
            ({ mode, groupId } = getViewMode());
            filtered = filterTransactionsByViewMode(allTransactions, mode, groupId);
            expect(filtered).toHaveLength(2); // Family transactions

            // When: User switches to a different group (roommates)
            setGroupMode(testGroups.roommates);
            ({ mode, groupId } = getViewMode());
            filtered = filterTransactionsByViewMode(allTransactions, mode, groupId);
            expect(filtered).toHaveLength(3); // Roommate transactions

            // When: User switches back to personal
            setPersonalMode();
            ({ mode, groupId } = getViewMode());
            filtered = filterTransactionsByViewMode(allTransactions, mode, groupId);

            // Then: Data filters correctly at each step
            expect(filtered).toHaveLength(3); // Personal transactions again
            expect(filtered.map((tx) => tx.id)).toEqual([
                'personal-1',
                'personal-2',
                'personal-3',
            ]);
        });

        it('respects group ID exactly (no partial matches)', () => {
            // Given: Group IDs with similar prefixes
            const similarIdTransactions = [
                createTestTransaction('tx-1', { sharedGroupId: 'family' }),
                createTestTransaction('tx-2', { sharedGroupId: 'family-id' }),
                createTestTransaction('tx-3', { sharedGroupId: 'family-id-extended' }),
            ];

            // When: User views family-id group
            setGroupMode(testGroups.family);
            const { mode, groupId } = getViewMode();
            const filtered = filterTransactionsByViewMode(similarIdTransactions, mode, groupId);

            // Then: Only exact match is returned
            expect(filtered).toHaveLength(1);
            expect(filtered[0].id).toBe('tx-2');
        });
    });

    // =========================================================================
    // Scenario: Filter state is cleared on mode switch
    // =========================================================================

    describe('Scenario: Filter state is cleared on mode switch', () => {
        /**
         * Helper hook to test filter clearing behavior.
         * Tracks whether CLEAR_ALL_FILTERS has been dispatched.
         */
        function useFilterClearTracker() {
            const [clearCount, setClearCount] = React.useState(0);

            const handleModeChange = React.useCallback(() => {
                setClearCount((c) => c + 1);
            }, []);

            useViewModeFilterSync(handleModeChange);

            return { clearCount };
        }

        it('calls onModeChange callback when mode changes (personal to group)', () => {
            // Given: Hook is set up with a callback
            const onModeChange = vi.fn();

            renderHook(() => useViewModeFilterSync(onModeChange));

            // When: User switches view mode from personal to group
            act(() => {
                setGroupMode(testGroups.family);
            });

            // Then: Callback is triggered
            expect(onModeChange).toHaveBeenCalledTimes(1);
        });

        it('calls onModeChange callback when mode changes (group to personal)', () => {
            // Given: User starts in group mode
            setGroupMode(testGroups.family);
            const onModeChange = vi.fn();

            renderHook(() => useViewModeFilterSync(onModeChange));

            // When: User switches to personal mode
            act(() => {
                setPersonalMode();
            });

            // Then: Callback is triggered
            expect(onModeChange).toHaveBeenCalledTimes(1);
        });

        it('does NOT call callback when switching between groups (mode stays group)', () => {
            // Given: User is in family group mode
            setGroupMode(testGroups.family);
            const onModeChange = vi.fn();

            renderHook(() => useViewModeFilterSync(onModeChange));

            // When: User switches to a different group (still group mode)
            act(() => {
                setGroupMode(testGroups.roommates);
            });

            // Then: Callback is NOT triggered (mode didn't change, only groupId)
            expect(onModeChange).not.toHaveBeenCalled();
        });

        it('does NOT call callback on initial mount', () => {
            // Given: Fresh store state
            resetViewModeStore();
            const onModeChange = vi.fn();

            // When: Hook mounts
            renderHook(() => useViewModeFilterSync(onModeChange));

            // Then: Callback is NOT triggered
            expect(onModeChange).not.toHaveBeenCalled();
        });

        it('HistoryFiltersProvider clears filters on mode switch', async () => {
            // Given: Custom filter state with non-default values
            const customFilters: HistoryFilterState = {
                temporal: {
                    level: 'year',
                    year: '2025',
                },
                category: {
                    level: 'category',
                    category: 'Supermercado',
                },
                location: {
                    country: 'Chile',
                    city: 'Santiago',
                },
                group: {},
            };

            // Track state changes
            let currentState: HistoryFilterState | null = null;
            const TestComponent = () => {
                const context = React.useContext(HistoryFiltersContext);
                currentState = context?.state ?? null;
                return null;
            };

            // Render with initial filters
            const { rerender } = renderHook(
                () => React.useContext(HistoryFiltersContext),
                {
                    wrapper: ({ children }: { children: ReactNode }) => (
                        <HistoryFiltersProvider initialState={customFilters}>
                            <TestComponent />
                            {children}
                        </HistoryFiltersProvider>
                    ),
                }
            );

            // Verify custom filters are set
            expect(currentState?.temporal.level).toBe('year');
            expect(currentState?.category.level).toBe('category');

            // When: User switches view mode
            act(() => {
                setGroupMode(testGroups.family);
            });

            // Force re-render to allow effect to run
            rerender();

            // Wait for state update
            await waitFor(() => {
                // Then: Filters should be cleared to default
                // Note: The actual clearing happens via useViewModeFilterSync in the provider
                expect(currentState?.temporal.level).toBe('month'); // Default
                expect(currentState?.category.level).toBe('all'); // Default
                expect(currentState?.location).toEqual({}); // Default (no location filter)
            });
        });
    });

    // =========================================================================
    // Scenario: Multi-view consistency
    // =========================================================================

    describe('Scenario: Multi-view consistency', () => {
        it('filterTransactionsByViewMode produces same results for same inputs', () => {
            // Given: User has transactions in both personal and group contexts
            // When: User is in group mode
            setGroupMode(testGroups.family);
            const { mode, groupId } = getViewMode();

            // Then: Multiple calls with same inputs produce same results
            const result1 = filterTransactionsByViewMode(allTransactions, mode, groupId);
            const result2 = filterTransactionsByViewMode(allTransactions, mode, groupId);
            const result3 = filterTransactionsByViewMode(allTransactions, mode, groupId);

            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
            expect(result1.map((tx) => tx.id)).toEqual(['family-1', 'family-2']);
        });

        it('different transaction arrays with same mode produce consistent filtering', () => {
            // Given: Separate transaction arrays simulating different views
            const historyTransactions = [...allTransactions];
            const dashboardTransactions = [...allTransactions].reverse();
            const trendsTransactions = allTransactions.slice(0, 5);

            // When: User is in personal mode
            setPersonalMode();
            const { mode, groupId } = getViewMode();

            // Then: All views filter consistently
            const historyFiltered = filterTransactionsByViewMode(historyTransactions, mode, groupId);
            const dashboardFiltered = filterTransactionsByViewMode(dashboardTransactions, mode, groupId);
            const trendsFiltered = filterTransactionsByViewMode(trendsTransactions, mode, groupId);

            // All personal transactions are included
            expect(historyFiltered.every((tx) => !tx.sharedGroupId)).toBe(true);
            expect(dashboardFiltered.every((tx) => !tx.sharedGroupId)).toBe(true);
            expect(trendsFiltered.every((tx) => !tx.sharedGroupId)).toBe(true);
        });

        it('mode state is consistent across multiple store reads', () => {
            // Given: User switches to group mode
            setGroupMode(testGroups.family);

            // When: Multiple components read from the store
            const read1 = getViewMode();
            const read2 = getViewMode();
            const read3 = useViewModeStore.getState();

            // Then: All reads are consistent
            expect(read1.mode).toBe('group');
            expect(read2.mode).toBe('group');
            expect(read3.mode).toBe('group');
            expect(read1.groupId).toBe('family-id');
            expect(read2.groupId).toBe('family-id');
            expect(read3.groupId).toBe('family-id');
        });
    });

    // =========================================================================
    // Scenario: Edge cases
    // =========================================================================

    describe('Scenario: Edge cases', () => {
        it('handles user with only personal transactions in group mode', () => {
            // Given: User has no group transactions
            const onlyPersonal = [...mockTransactions.personal];

            // When: User switches to group mode
            setGroupMode(testGroups.family);
            const { mode, groupId } = getViewMode();
            const filtered = filterTransactionsByViewMode(onlyPersonal, mode, groupId);

            // Then: No transactions are shown (empty state)
            expect(filtered).toHaveLength(0);
            expect(filtered).toEqual([]);
        });

        it('handles user with only group transactions in personal mode', () => {
            // Given: User has no personal transactions
            const onlyGroup = [...mockTransactions.family, ...mockTransactions.roommates];

            // When: User is in personal mode
            setPersonalMode();
            const { mode, groupId } = getViewMode();
            const filtered = filterTransactionsByViewMode(onlyGroup, mode, groupId);

            // Then: No transactions are shown
            expect(filtered).toHaveLength(0);
            expect(filtered).toEqual([]);
        });

        it('handles switching between multiple groups', () => {
            // Given: User is in "family" group
            setGroupMode(testGroups.family);
            let { mode, groupId } = getViewMode();
            let filtered = filterTransactionsByViewMode(allTransactions, mode, groupId);
            expect(filtered.map((tx) => tx.id)).toEqual(['family-1', 'family-2']);

            // When: User switches to "roommates" group
            setGroupMode(testGroups.roommates);
            ({ mode, groupId } = getViewMode());
            filtered = filterTransactionsByViewMode(allTransactions, mode, groupId);

            // Then: Data updates to show roommates transactions
            expect(filtered.map((tx) => tx.id)).toEqual([
                'roommate-1',
                'roommate-2',
                'roommate-3',
            ]);
        });

        it('preserves mode state across render cycles', () => {
            // Given: User is in group mode
            setGroupMode(testGroups.family);

            // Create a hook that reads mode
            const { result, rerender } = renderHook(() => ({
                mode: useViewModeStore((s) => s.mode),
                groupId: useViewModeStore((s) => s.groupId),
            }));

            expect(result.current.mode).toBe('group');
            expect(result.current.groupId).toBe('family-id');

            // When: Component re-renders
            rerender();
            rerender();
            rerender();

            // Then: Mode and filtered data remain consistent
            expect(result.current.mode).toBe('group');
            expect(result.current.groupId).toBe('family-id');
        });

        it('handles empty transactions array gracefully', () => {
            // Given: Empty transactions
            const emptyTransactions: Transaction[] = [];

            // Personal mode
            setPersonalMode();
            let { mode, groupId } = getViewMode();
            expect(filterTransactionsByViewMode(emptyTransactions, mode, groupId)).toEqual([]);

            // Group mode
            setGroupMode(testGroups.family);
            ({ mode, groupId } = getViewMode());
            expect(filterTransactionsByViewMode(emptyTransactions, mode, groupId)).toEqual([]);
        });

        it('handles group mode with null groupId (edge case)', () => {
            // Given: Somehow ended up in group mode without groupId (shouldn't happen)
            // This tests the filter utility's defensive behavior
            const filtered = filterTransactionsByViewMode(allTransactions, 'group', null);

            // Then: Returns empty array (no valid group selected)
            expect(filtered).toHaveLength(0);
        });

        it('handles group mode with empty string groupId', () => {
            // Given: Empty string groupId
            const filtered = filterTransactionsByViewMode(allTransactions, 'group', '');

            // Then: Returns empty array
            expect(filtered).toHaveLength(0);
        });

        it('preserves transaction order after filtering', () => {
            // Given: Ordered transactions
            const orderedTransactions = [
                createTestTransaction('tx-a', { sharedGroupId: null }),
                createTestTransaction('tx-b', { sharedGroupId: 'family-id' }),
                createTestTransaction('tx-c', { sharedGroupId: null }),
                createTestTransaction('tx-d', { sharedGroupId: 'family-id' }),
                createTestTransaction('tx-e', { sharedGroupId: null }),
            ];

            // Personal mode
            setPersonalMode();
            let { mode, groupId } = getViewMode();
            let filtered = filterTransactionsByViewMode(orderedTransactions, mode, groupId);
            expect(filtered.map((tx) => tx.id)).toEqual(['tx-a', 'tx-c', 'tx-e']);

            // Group mode
            setGroupMode(testGroups.family);
            ({ mode, groupId } = getViewMode());
            filtered = filterTransactionsByViewMode(orderedTransactions, mode, groupId);
            expect(filtered.map((tx) => tx.id)).toEqual(['tx-b', 'tx-d']);
        });

        it('handles rapid mode switching without data corruption', () => {
            // Given: Initial state
            setPersonalMode();

            // When: Rapid mode switches
            for (let i = 0; i < 10; i++) {
                setGroupMode(testGroups.family);
                setPersonalMode();
                setGroupMode(testGroups.roommates);
                setPersonalMode();
            }

            // Then: Final state is consistent
            const { mode, groupId } = getViewMode();
            expect(mode).toBe('personal');
            expect(groupId).toBe(null);

            const filtered = filterTransactionsByViewMode(allTransactions, mode, groupId);
            expect(filtered).toHaveLength(3);
        });
    });

    // =========================================================================
    // Scenario: Store action validation
    // =========================================================================

    describe('Scenario: Store action validation', () => {
        it('setGroupMode validates groupId is non-empty', () => {
            // Given: Store in personal mode
            setPersonalMode();

            // When: Attempting to set group mode with invalid groupId
            // The store should reject this (validation in useViewModeStore)
            act(() => {
                useViewModeStore.getState().setGroupMode('', testGroups.family);
            });

            // Then: Mode should remain personal (invalid call rejected)
            expect(getViewMode().mode).toBe('personal');
        });

        it('setGroupMode validates group.id matches groupId', () => {
            // Given: Store in personal mode
            setPersonalMode();

            // When: Attempting to set group mode with mismatched IDs
            const mismatchedGroup = { ...testGroups.family, id: 'different-id' };
            act(() => {
                useViewModeStore.getState().setGroupMode('family-id', mismatchedGroup);
            });

            // Then: Mode should remain personal (invalid call rejected)
            expect(getViewMode().mode).toBe('personal');
        });

        it('setPersonalMode always works', () => {
            // Given: Store in group mode
            setGroupMode(testGroups.family);
            expect(getViewMode().mode).toBe('group');

            // When: Setting personal mode
            setPersonalMode();

            // Then: Mode switches to personal
            expect(getViewMode().mode).toBe('personal');
            expect(getViewMode().groupId).toBe(null);
        });
    });

    // =========================================================================
    // Scenario: Performance considerations
    // =========================================================================

    describe('Scenario: Performance considerations', () => {
        it('filterTransactionsByViewMode is a pure function (no side effects)', () => {
            // Given: Original transactions array
            const original = [...allTransactions];
            const originalLength = original.length;
            const originalIds = original.map((tx) => tx.id);

            // When: Filtering is applied
            setPersonalMode();
            const { mode, groupId } = getViewMode();
            filterTransactionsByViewMode(original, mode, groupId);

            // Then: Original array is unchanged
            expect(original).toHaveLength(originalLength);
            expect(original.map((tx) => tx.id)).toEqual(originalIds);
        });

        it('handles large transaction arrays', () => {
            // Given: Large array of transactions
            const largeArray: Transaction[] = [];
            for (let i = 0; i < 1000; i++) {
                const groupId = i % 3 === 0 ? null : i % 3 === 1 ? 'family-id' : 'roommate-id';
                largeArray.push(createTestTransaction(`tx-${i}`, { sharedGroupId: groupId }));
            }

            // When: Filtering (should be fast)
            setGroupMode(testGroups.family);
            const { mode, groupId } = getViewMode();
            const startTime = performance.now();
            const filtered = filterTransactionsByViewMode(largeArray, mode, groupId);
            const endTime = performance.now();

            // Then: Filtering completes quickly (< 100ms for 1000 items)
            expect(endTime - startTime).toBeLessThan(100);
            // And results are correct (every 3rd item starting at index 1)
            expect(filtered).toHaveLength(333);
            expect(filtered.every((tx) => tx.sharedGroupId === 'family-id')).toBe(true);
        });
    });
});

// =============================================================================
// Integration: useViewModeFilterSync with actual filters
// =============================================================================

describe('useViewModeFilterSync Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetViewModeStore();
    });

    it('triggers filter clear callback exactly once per mode change', () => {
        const onModeChange = vi.fn();

        renderHook(() => useViewModeFilterSync(onModeChange));

        // Initial mount - no call
        expect(onModeChange).not.toHaveBeenCalled();

        // First mode change
        act(() => {
            setGroupMode(testGroups.family);
        });
        expect(onModeChange).toHaveBeenCalledTimes(1);

        // Group to group (same mode) - no call
        act(() => {
            setGroupMode(testGroups.roommates);
        });
        expect(onModeChange).toHaveBeenCalledTimes(1);

        // Group to personal - one call
        act(() => {
            setPersonalMode();
        });
        expect(onModeChange).toHaveBeenCalledTimes(2);

        // Personal to personal (same mode) - no call
        act(() => {
            setPersonalMode();
        });
        expect(onModeChange).toHaveBeenCalledTimes(2);

        // Personal to group - one call
        act(() => {
            setGroupMode(testGroups.family);
        });
        expect(onModeChange).toHaveBeenCalledTimes(3);
    });

    it('handles unmount/remount correctly', () => {
        const onModeChange1 = vi.fn();
        const onModeChange2 = vi.fn();

        // First instance
        const { unmount } = renderHook(() => useViewModeFilterSync(onModeChange1));

        act(() => {
            setGroupMode(testGroups.family);
        });
        expect(onModeChange1).toHaveBeenCalledTimes(1);

        // Unmount
        unmount();

        // Mode change after unmount - should not call original callback
        act(() => {
            setPersonalMode();
        });
        expect(onModeChange1).toHaveBeenCalledTimes(1);

        // New instance
        renderHook(() => useViewModeFilterSync(onModeChange2));

        // Mode change with new instance
        act(() => {
            setGroupMode(testGroups.roommates);
        });
        expect(onModeChange2).toHaveBeenCalledTimes(1);
        expect(onModeChange1).toHaveBeenCalledTimes(1); // Still 1
    });
});
