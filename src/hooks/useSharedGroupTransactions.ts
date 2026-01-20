/**
 * useSharedGroupTransactions Hook
 *
 * Story 14c.5: Shared Group Transactions View
 * Story 14c.16: Cache Architecture Fix
 * Story 14c.20: Cache Optimization (staleTime, gcTime, refetchOnMount, refetchOnWindowFocus)
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * React Query integration for shared group transactions with IndexedDB caching.
 * Implements cache-first loading strategy with background delta sync.
 *
 * Story 14c.16 Architecture Fix:
 * - Fetch ALL transactions once on initial load (no date filter)
 * - Apply date filtering CLIENT-SIDE via useMemo
 * - Query key no longer includes date range (shared cache across date selections)
 * - Available years computed from FULL cached data (not filtered subset)
 *
 * Story 14c.20 Cache Optimization:
 * - staleTime: 1 hour (safety net, delta sync is primary freshness mechanism)
 * - gcTime: 24 hours (survive long personal mode sessions and view switches)
 * - refetchOnMount: false (use cached data on view mode switch)
 * - refetchOnWindowFocus: false (delta sync handles freshness, not tab focus)
 * - Manual sync available via Settings > Grupos for user-initiated refresh
 *
 * @example
 * ```tsx
 * const {
 *   transactions,
 *   isLoading,
 *   total,
 *   availableYears,
 *   dateRange,
 *   setDateRange,
 * } = useSharedGroupTransactions({
 *   groupId: 'group123',
 *   members: ['user1', 'user2'],
 * });
 * ```
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
} from '../services/sharedGroupTransactionService';
import {
    openSharedGroupDB,
    readFromCache,
    writeToCache,
    writeToCacheWithRetry,
    removeFromCache,
    getSyncMetadata,
    updateSyncMetadata,
    isIndexedDBAvailable,
    type SyncMetadata,
} from '../lib/sharedGroupCache';
// Story 14c.15: Re-export from consolidated types for backwards compatibility
export type { NotificationClickData } from '../types/notification';

// ============================================================================
// Notification Delta Fetch Hook
// ============================================================================

/**
 * Hook to listen for notification clicks and trigger delta fetch.
 * Story 14c.13: Option C - fetch delta on notification tap.
 *
 * @param db - Firestore instance
 * @param appId - Application ID
 * @param groups - Array of user's shared groups
 * @param queryClient - React Query client
 * @param onNavigateToGroup - Optional callback to navigate to a group view
 */
export function useNotificationDeltaFetch(
    db: Firestore | null,
    appId: string,
    groups: SharedGroup[],
    queryClient: ReturnType<typeof useQueryClient>,
    onNavigateToGroup?: (group: SharedGroup) => void
): void {
    // Keep refs to avoid stale closures
    const groupsRef = useRef<SharedGroup[]>(groups);
    groupsRef.current = groups;

    const onNavigateRef = useRef(onNavigateToGroup);
    onNavigateRef.current = onNavigateToGroup;

    useEffect(() => {
        if (!db || !appId || !navigator.serviceWorker) return;

        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type !== 'NOTIFICATION_CLICK') return;

            const data = event.data.data || {};
            const groupId = data.groupId;

            if (!groupId) {
                console.log('[useNotificationDeltaFetch] No groupId in notification click');
                return;
            }

            // Find the group in user's groups
            const group = groupsRef.current.find(g => g.id === groupId);
            if (!group) {
                console.log(`[useNotificationDeltaFetch] Group ${groupId} not found in user groups`);
                return;
            }

            console.log(`[useNotificationDeltaFetch] Triggering delta fetch for group ${groupId}`);

            try {
                // First navigate to the group
                if (onNavigateRef.current) {
                    onNavigateRef.current(group);
                }

                // Then fetch delta updates
                const result = await triggerNotificationDeltaFetch(db, appId, group, queryClient);
                console.log(`[useNotificationDeltaFetch] Delta fetch complete:`, result);
            } catch (err) {
                console.error(`[useNotificationDeltaFetch] Error:`, err);
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);
        return () => {
            navigator.serviceWorker.removeEventListener('message', handleMessage);
        };
    }, [db, appId, queryClient]);
}

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
    /** Transactions filtered by date range and member */
    transactions: SharedGroupTransaction[];
    /** ALL transactions for the group (unfiltered by date, respects member filter) */
    allTransactions: SharedGroupTransaction[];
    /** Raw transactions from cache (no filters applied) */
    rawTransactions: SharedGroupTransaction[];
    /** Whether initial load is in progress */
    isLoading: boolean;
    /** Whether a background refresh is in progress */
    isRefreshing: boolean;
    /** Any error that occurred */
    error: Error | null;
    /** Total spending (respects date range and member filters) */
    total: number;
    /** Spending breakdown by member (respects date range filter) */
    spendingByMember: Map<string, number>;
    /** Current date range filter (display only, not used for fetching) */
    dateRange: { startDate: Date; endDate: Date };
    /** Set the date range filter (client-side filtering only) */
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
    /** Available years computed from ALL cached transactions (Story 14c.16 AC5) */
    availableYears: number[];
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Extract date string (YYYY-MM-DD) from a transaction
 */
function getTransactionDateString(date: unknown): string {
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString().slice(0, 10);
    if (typeof date === 'object' && date && 'toDate' in date) {
        return (date as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
    }
    return '';
}

/**
 * Check if a transaction falls within a date range
 */
function isInDateRange(
    txn: SharedGroupTransaction,
    startDate: Date,
    endDate: Date
): boolean {
    const dateStr = getTransactionDateString(txn.date);
    if (!dateStr) return false;

    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Extract unique years from transactions
 * Story 14c.16 AC5: Compute available years from ALL cached data
 */
function extractAvailableYears(transactions: SharedGroupTransaction[]): number[] {
    const yearsSet = new Set<number>();

    for (const txn of transactions) {
        const dateStr = getTransactionDateString(txn.date);
        if (dateStr) {
            const year = parseInt(dateStr.slice(0, 4), 10);
            if (!isNaN(year)) {
                yearsSet.add(year);
            }
        }
    }

    // Return sorted descending (most recent first)
    return Array.from(yearsSet).sort((a, b) => b - a);
}

export function useSharedGroupTransactions(
    options: UseSharedGroupTransactionsOptions
): UseSharedGroupTransactionsResult {
    const { services, group, enabled = !!group } = options;
    const db = services?.db || null;
    const appId = services?.appId || '';
    const queryClient = useQueryClient();

    // Date range state (used for CLIENT-SIDE filtering only - Story 14c.16)
    // Default is current month, but this is just for display filtering
    const [dateRange, setDateRangeState] = useState(() => getDefaultDateRange());

    // Member filter state (AC7: filter by member)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    // IndexedDB availability state (AC8: storage strategy fallback)
    const [usingIndexedDB, setUsingIndexedDB] = useState(() => isIndexedDBAvailable());

    // Date range setter with max range enforcement
    // Story 14c.16: This only affects client-side filtering, NOT Firestore fetch
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
    // Story 14c.16: Query key NO LONGER includes date range
    // This creates a single cache entry per group, shared across all date selections
    const {
        data: rawTransactions = [],
        isLoading,
        isFetching: isRefreshing,
        error,
        refetch,
    } = useQuery({
        // Story 14c.16 AC4: Query key without date range
        queryKey: QUERY_KEYS.sharedGroupTransactions(group?.id || ''),
        queryFn: async () => {
            if (!db || !group?.id || !group.members?.length) {
                return [];
            }

            // Story 14c.16 AC1: Fetch ALL transactions (no date filter)
            // The service layer will apply a 2-year lookback for performance guard

            // Step 1: Try to load from IndexedDB first (cache-first strategy)
            let cachedData: SharedGroupTransaction[] = [];
            let syncMetadata: SyncMetadata | null = null;

            if (usingIndexedDB) {
                try {
                    const idb = await openSharedGroupDB();
                    // Story 14c.16 AC2: Read ALL cached transactions (no date filter)
                    cachedData = await readFromCache(idb, group.id);
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
                                    queryClient
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

            // Step 2: Fetch from Firestore (no date filter - Story 14c.16 AC1)
            const transactions = await fetchSharedGroupTransactions(
                db,
                appId,
                group.id,
                group.members
                // No options = no date filter, service uses 2-year lookback
            );

            // Step 3: Update IndexedDB cache
            if (usingIndexedDB && transactions.length > 0) {
                try {
                    const idb = await openSharedGroupDB();
                    // Story 14c.16 AC2: Store ALL transactions in IndexedDB
                    // Story 14c.11 AC5: Use writeToCacheWithRetry for quota handling
                    await writeToCacheWithRetry(idb, group.id, transactions);
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
        // Story 14c.20: Cache Optimization - Extended times to reduce Firestore costs
        // Delta sync mechanism handles freshness, these are safety nets
        staleTime: 60 * 60 * 1000, // 1 hour (was 5 min) - delta sync handles updates
        gcTime: 24 * 60 * 60 * 1000, // 24 hours (was 30 min) - survive view mode switches
        refetchOnWindowFocus: false, // Delta sync handles freshness, not tab focus
        refetchOnMount: false, // Use cached data on view mode switch, delta syncs in background
    });

    // Story 14c.16 AC5: Available years computed from ALL raw transactions
    const availableYears = useMemo(
        () => extractAvailableYears(rawTransactions),
        [rawTransactions]
    );

    // Story 14c.16 AC3: Apply date filtering CLIENT-SIDE
    const dateFilteredTransactions = useMemo(() => {
        return rawTransactions.filter(txn =>
            isInDateRange(txn, dateRange.startDate, dateRange.endDate)
        );
    }, [rawTransactions, dateRange.startDate, dateRange.endDate]);

    // Filter by selected members (AC7)
    const transactions = useMemo(() => {
        if (selectedMembers.length === 0) {
            return dateFilteredTransactions;
        }
        return dateFilteredTransactions.filter(txn => selectedMembers.includes(txn._ownerId));
    }, [dateFilteredTransactions, selectedMembers]);

    // allTransactions = member-filtered but NOT date-filtered (for spending breakdown)
    const allTransactions = useMemo(() => {
        if (selectedMembers.length === 0) {
            return rawTransactions;
        }
        return rawTransactions.filter(txn => selectedMembers.includes(txn._ownerId));
    }, [rawTransactions, selectedMembers]);

    // Calculate totals (AC6) - based on date+member filtered transactions
    const total = useMemo(() => calculateTotalSpending(transactions), [transactions]);

    // Spending by member - based on date-filtered transactions (for display consistency)
    const spendingByMember = useMemo(
        () => calculateSpendingByMember(dateFilteredTransactions),
        [dateFilteredTransactions]
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
        rawTransactions,
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
        availableYears,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch delta updates and merge into cache.
 * Runs in background after initial cache hit.
 * Story 14c.16: No longer uses date range for invalidation
 */
async function fetchDeltaAndUpdateCache(
    db: Firestore,
    appId: string,
    groupId: string,
    changedMembers: string[],
    since: Date,
    queryClient: ReturnType<typeof useQueryClient>
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

        // Story 14c.16 AC4: Invalidate using simplified query key (no date range)
        // Story 14c.20 Bug Fix: Use refetchType: 'all' to force refetch even for inactive queries
        queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.sharedGroupTransactions(groupId),
            refetchType: 'all',
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
// Notification-Triggered Delta Fetch
// ============================================================================

/**
 * Trigger delta fetch for a specific group when a notification is clicked.
 * This allows updating only the changed transactions instead of invalidating
 * the entire cache (Option C from cost analysis).
 *
 * Story 14c.13: Optimize notification-triggered updates
 *
 * @param db - Firestore instance
 * @param appId - Application ID
 * @param group - The shared group to fetch updates for
 * @param queryClient - React Query client for cache invalidation
 * @returns Promise that resolves when delta fetch is complete
 */
export async function triggerNotificationDeltaFetch(
    db: Firestore,
    appId: string,
    group: SharedGroup,
    queryClient: ReturnType<typeof useQueryClient>
): Promise<{ updated: number; deleted: number }> {
    if (!group.id || !group.members?.length) {
        console.warn('[triggerNotificationDeltaFetch] Invalid group data');
        return { updated: 0, deleted: 0 };
    }

    try {
        // Get last sync timestamp from IndexedDB
        let lastSyncTimestamp = Date.now() - 60 * 1000; // Default: last 1 minute

        if (isIndexedDBAvailable()) {
            try {
                const idb = await openSharedGroupDB();
                const syncMetadata = await getSyncMetadata(idb, group.id);
                if (syncMetadata?.lastSyncTimestamp) {
                    lastSyncTimestamp = syncMetadata.lastSyncTimestamp;
                }
            } catch (err) {
                console.warn('[triggerNotificationDeltaFetch] IndexedDB error:', err);
            }
        }

        const since = new Date(lastSyncTimestamp);

        // Fetch delta for ALL members (notification could be from any member)
        const { transactions: deltaTransactions, deletedIds } = await fetchDeltaUpdates(
            db,
            appId,
            group.id,
            { since, changedMembers: group.members }
        );

        if (deltaTransactions.length === 0 && deletedIds.length === 0) {
            console.log('[triggerNotificationDeltaFetch] No changes found');
            return { updated: 0, deleted: 0 };
        }

        // Update IndexedDB cache
        if (isIndexedDBAvailable()) {
            try {
                const idb = await openSharedGroupDB();

                if (deltaTransactions.length > 0) {
                    await writeToCache(idb, group.id, deltaTransactions);
                }

                if (deletedIds.length > 0) {
                    await removeFromCache(idb, group.id, deletedIds);
                }

                // Update sync metadata
                await updateSyncMetadata(idb, {
                    groupId: group.id,
                    lastSyncTimestamp: Date.now(),
                    memberSyncTimestamps: group.members.reduce((acc, m) => {
                        acc[m] = Date.now();
                        return acc;
                    }, {} as Record<string, number>),
                });
            } catch (err) {
                console.warn('[triggerNotificationDeltaFetch] Cache update error:', err);
            }
        }

        // Story 14c.16 AC4: Invalidate using simplified query key (no date range)
        // Story 14c.20 Bug Fix: Use refetchType: 'all' to force refetch even for inactive queries
        queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.sharedGroupTransactions(group.id),
            refetchType: 'all',
        });

        console.log('[triggerNotificationDeltaFetch] Delta sync complete:', {
            updated: deltaTransactions.length,
            deleted: deletedIds.length,
        });

        return { updated: deltaTransactions.length, deleted: deletedIds.length };
    } catch (err) {
        console.error('[triggerNotificationDeltaFetch] Error:', err);
        return { updated: 0, deleted: 0 };
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
