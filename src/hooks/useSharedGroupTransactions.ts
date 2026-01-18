/**
 * useSharedGroupTransactions Hook
 *
 * Story 14c.5: Shared Group Transactions View
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * React Query integration for shared group transactions with IndexedDB caching.
 * Implements cache-first loading strategy with background Firestore sync.
 *
 * AC5: React Query Integration
 * - Cache-first: IndexedDB → display → Firestore fetch
 * - staleTime: 5 minutes, gcTime: 30 minutes
 * - Shows cached data immediately while fetching fresh
 *
 * @example
 * ```tsx
 * const {
 *   transactions,
 *   isLoading,
 *   total,
 *   filterByMember,
 *   dateRange,
 *   setDateRange,
 * } = useSharedGroupTransactions({
 *   groupId: 'group123',
 *   members: ['user1', 'user2'],
 * });
 * ```
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Firestore } from 'firebase/firestore';
import type { SharedGroup } from '../types/sharedGroup';
import type { Services } from './useAuth';
import { QUERY_KEYS } from '../lib/queryKeys';
import {
    fetchSharedGroupTransactions,
    fetchDeltaUpdates,
    getChangedMembers,
    calculateTotalSpending,
    calculateSpendingByMember,
    getDefaultDateRange,
    enforceMaxDateRange,
    type SharedGroupTransaction,
    type FetchSharedGroupTransactionsOptions,
} from '../services/sharedGroupTransactionService';
import {
    openSharedGroupDB,
    readFromCache,
    writeToCache,
    removeFromCache,
    getSyncMetadata,
    updateSyncMetadata,
    isIndexedDBAvailable,
    type SyncMetadata,
} from '../lib/sharedGroupCache';

// ============================================================================
// Types
// ============================================================================

export interface UseSharedGroupTransactionsOptions {
    /** Firebase services (db, appId) */
    services: Services | null;
    /** The shared group to load transactions for */
    group: SharedGroup | null;
    /** Whether to enable the query (default: true when group exists) */
    enabled?: boolean;
}

export interface UseSharedGroupTransactionsResult {
    /** All transactions for the group (filtered by date range and member) */
    transactions: SharedGroupTransaction[];
    /** Raw transactions before member filter */
    allTransactions: SharedGroupTransaction[];
    /** Whether initial load is in progress */
    isLoading: boolean;
    /** Whether a background refresh is in progress */
    isRefreshing: boolean;
    /** Any error that occurred */
    error: Error | null;
    /** Total spending (respects member filter) */
    total: number;
    /** Spending breakdown by member */
    spendingByMember: Map<string, number>;
    /** Current date range filter */
    dateRange: { startDate: Date; endDate: Date };
    /** Set the date range filter */
    setDateRange: (startDate: Date, endDate: Date) => void;
    /** Currently selected member IDs (empty = all) */
    selectedMembers: string[];
    /** Toggle member selection for filtering */
    toggleMember: (memberId: string) => void;
    /** Select all members (clear filter) */
    selectAllMembers: () => void;
    /** Manually trigger a refresh */
    refresh: () => void;
    /** Whether IndexedDB is being used (false = in-memory only) */
    usingIndexedDB: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Helper to format date for query key (YYYY-MM-DD)
 */
function formatDateForKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function useSharedGroupTransactions(
    options: UseSharedGroupTransactionsOptions
): UseSharedGroupTransactionsResult {
    const { services, group, enabled = !!group } = options;
    const db = services?.db || null;
    const appId = services?.appId || '';
    const queryClient = useQueryClient();

    // Date range state (AC8: default is current month)
    const [dateRange, setDateRangeState] = useState(() => getDefaultDateRange());

    // Member filter state (AC7: filter by member)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    // IndexedDB availability state (AC8: storage strategy fallback)
    const [usingIndexedDB, setUsingIndexedDB] = useState(() => isIndexedDBAvailable());

    // Date range setter with max range enforcement
    const setDateRange = useCallback((startDate: Date, endDate: Date) => {
        const { startDate: adjustedStart, endDate: adjustedEnd } = enforceMaxDateRange(startDate, endDate);
        setDateRangeState({ startDate: adjustedStart, endDate: adjustedEnd });
    }, []);

    // Member filter functions
    const toggleMember = useCallback((memberId: string) => {
        setSelectedMembers(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId);
            }
            return [...prev, memberId];
        });
    }, []);

    const selectAllMembers = useCallback(() => {
        setSelectedMembers([]);
    }, []);

    // Main query for transactions
    const {
        data: allTransactions = [],
        isLoading,
        isFetching: isRefreshing,
        error,
        refetch,
    } = useQuery({
        queryKey: QUERY_KEYS.sharedGroupTransactions(
            group?.id || '',
            formatDateForKey(dateRange.startDate),
            formatDateForKey(dateRange.endDate)
        ),
        queryFn: async () => {
            if (!db || !group?.id || !group.members?.length) {
                return [];
            }

            const fetchOptions: FetchSharedGroupTransactionsOptions = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            };

            // Step 1: Try to load from IndexedDB first (cache-first strategy)
            let cachedData: SharedGroupTransaction[] = [];
            let syncMetadata: SyncMetadata | null = null;

            if (usingIndexedDB) {
                try {
                    const idb = await openSharedGroupDB();
                    cachedData = await readFromCache(idb, group.id, {
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate,
                    });
                    syncMetadata = await getSyncMetadata(idb, group.id);

                    // If we have cached data, return it immediately
                    // The background refetch will update if needed
                    if (cachedData.length > 0) {
                        // Check if any members have updates since last sync
                        if (syncMetadata) {
                            const lastSyncDate = new Date(syncMetadata.lastSyncTimestamp);
                            const changedMembers = getChangedMembers(
                                group.memberUpdates || {},
                                lastSyncDate
                            );

                            if (changedMembers.length > 0) {
                                // Fetch delta updates in background
                                fetchDeltaAndUpdateCache(
                                    db,
                                    appId,
                                    group.id,
                                    changedMembers,
                                    lastSyncDate,
                                    queryClient,
                                    dateRange
                                ).catch(console.error);
                            }
                        }

                        return cachedData;
                    }
                } catch (err) {
                    console.warn('[useSharedGroupTransactions] IndexedDB error, falling back:', err);
                    setUsingIndexedDB(false);
                }
            }

            // Step 2: Fetch from Firestore
            const transactions = await fetchSharedGroupTransactions(
                db,
                appId,
                group.id,
                group.members,
                fetchOptions
            );

            // Step 3: Update IndexedDB cache
            if (usingIndexedDB && transactions.length > 0) {
                try {
                    const idb = await openSharedGroupDB();
                    await writeToCache(idb, group.id, transactions);
                    await updateSyncMetadata(idb, {
                        groupId: group.id,
                        lastSyncTimestamp: Date.now(),
                        memberSyncTimestamps: group.members.reduce((acc, m) => {
                            acc[m] = Date.now();
                            return acc;
                        }, {} as Record<string, number>),
                    });
                } catch (err) {
                    console.warn('[useSharedGroupTransactions] Cache write error:', err);
                }
            }

            return transactions;
        },
        enabled: enabled && !!db && !!appId && !!group?.id && (group?.members?.length ?? 0) > 0,
        staleTime: 5 * 60 * 1000, // AC5: 5 minutes
        gcTime: 30 * 60 * 1000, // AC5: 30 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true, // Always check for updates on mount
    });

    // Filter transactions by selected members (AC7)
    const transactions = useMemo(() => {
        if (selectedMembers.length === 0) {
            return allTransactions;
        }
        return allTransactions.filter(txn => selectedMembers.includes(txn._ownerId));
    }, [allTransactions, selectedMembers]);

    // Calculate totals (AC6)
    const total = useMemo(() => calculateTotalSpending(transactions), [transactions]);

    const spendingByMember = useMemo(
        () => calculateSpendingByMember(allTransactions),
        [allTransactions]
    );

    // Refresh function
    const refresh = useCallback(() => {
        refetch();
    }, [refetch]);

    // Clear member selection when group changes
    useEffect(() => {
        setSelectedMembers([]);
    }, [group?.id]);

    return {
        transactions,
        allTransactions,
        isLoading,
        isRefreshing,
        error: error as Error | null,
        total,
        spendingByMember,
        dateRange,
        setDateRange,
        selectedMembers,
        toggleMember,
        selectAllMembers,
        refresh,
        usingIndexedDB,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch delta updates and merge into cache.
 * Runs in background after initial cache hit.
 */
async function fetchDeltaAndUpdateCache(
    db: Firestore,
    appId: string,
    groupId: string,
    changedMembers: string[],
    since: Date,
    queryClient: ReturnType<typeof useQueryClient>,
    dateRange: { startDate: Date; endDate: Date }
): Promise<void> {
    try {
        const { transactions: deltaTransactions, deletedIds } = await fetchDeltaUpdates(
            db,
            appId,
            groupId,
            { since, changedMembers }
        );

        if (deltaTransactions.length === 0 && deletedIds.length === 0) {
            return; // No changes
        }

        // Update IndexedDB
        const idb = await openSharedGroupDB();

        if (deltaTransactions.length > 0) {
            await writeToCache(idb, groupId, deltaTransactions);
        }

        if (deletedIds.length > 0) {
            await removeFromCache(idb, groupId, deletedIds);
        }

        // Update sync metadata
        await updateSyncMetadata(idb, {
            groupId,
            lastSyncTimestamp: Date.now(),
            memberSyncTimestamps: changedMembers.reduce((acc, m) => {
                acc[m] = Date.now();
                return acc;
            }, {} as Record<string, number>),
        });

        // Invalidate React Query cache to trigger re-render
        queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.sharedGroupTransactions(
                groupId,
                dateRange.startDate.toISOString().slice(0, 10),
                dateRange.endDate.toISOString().slice(0, 10)
            ),
        });

        if (import.meta.env.DEV) {
            console.log('[useSharedGroupTransactions] Delta sync complete:', {
                updated: deltaTransactions.length,
                deleted: deletedIds.length,
            });
        }
    } catch (err) {
        console.error('[useSharedGroupTransactions] Delta sync error:', err);
    }
}

// ============================================================================
// Storage Strategy Hook
// ============================================================================

/**
 * Hook to detect storage strategy and provide fallback notification.
 *
 * AC8: Storage Strategy Fallback
 * - Detect IndexedDB support
 * - Fall back to React Query in-memory if unavailable
 * - Provide warning for degraded offline support
 */
export function useStorageStrategy(): {
    usingIndexedDB: boolean;
    isChecking: boolean;
    showOfflineWarning: boolean;
} {
    const [state, setState] = useState({
        usingIndexedDB: true,
        isChecking: true,
        showOfflineWarning: false,
    });

    useEffect(() => {
        const checkStorage = async () => {
            const available = isIndexedDBAvailable();

            if (!available) {
                setState({
                    usingIndexedDB: false,
                    isChecking: false,
                    showOfflineWarning: true,
                });
                return;
            }

            // Try to actually open the database to confirm it works
            try {
                await openSharedGroupDB();
                setState({
                    usingIndexedDB: true,
                    isChecking: false,
                    showOfflineWarning: false,
                });
            } catch {
                setState({
                    usingIndexedDB: false,
                    isChecking: false,
                    showOfflineWarning: true,
                });
            }
        };

        checkStorage();
    }, []);

    return state;
}
