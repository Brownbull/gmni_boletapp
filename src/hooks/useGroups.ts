/**
 * useGroups Hook
 *
 * Story 14.29: React Query Migration
 * Story 14.15: Transaction Selection Mode & Groups
 * Epic 14: Core Implementation
 *
 * Subscribes to real-time updates of user's transaction groups with React Query caching.
 * Provides a list of groups, loading state, and error handling.
 *
 * Migration benefits:
 * - Group selector shows instantly (cached data)
 * - No loading spinner on return visits
 * - Shared cache across components
 *
 * @example
 * ```tsx
 * const { groups, loading, error } = useGroups(userId, appId);
 *
 * return (
 *   <select>
 *     {groups.map(group => (
 *       <option key={group.id} value={group.id}>
 *         {group.name}
 *       </option>
 *     ))}
 *   </select>
 * );
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import { getFirestore } from 'firebase/firestore';
import { useFirestoreSubscription } from './useFirestoreSubscription';
import { QUERY_KEYS } from '../lib/queryKeys';
import {
    subscribeToGroups,
    createGroup,
    recalculateAllGroupCounts,
} from '../services/groupService';
import type { TransactionGroup, CreateTransactionGroupInput } from '../types/transactionGroup';

export interface UseGroupsReturn {
    /** Array of user's transaction groups */
    groups: TransactionGroup[];
    /** Whether the subscription is loading */
    loading: boolean;
    /** Error message if subscription failed */
    error: string | null;
    /** Create a new group and return its ID */
    addGroup: (input: CreateTransactionGroupInput) => Promise<string>;
    /** Recalculate all group counts from actual transactions (fixes corrupted counts) */
    recalculateCounts: (transactions: Array<{ id: string; groupId?: string | null; total: number }>) => Promise<void>;
}

/**
 * Hook for subscribing to user's transaction groups.
 *
 * @param userId - The authenticated user's ID
 * @param appId - The app ID for Firestore path
 * @returns Group data and loading/error states
 */
export function useGroups(userId: string | null, appId: string): UseGroupsReturn {
    const [error, setError] = useState<string | null>(null);
    const enabled = !!userId;

    // Create the query key
    const queryKey = useMemo(
        () => enabled
            ? QUERY_KEYS.groups(userId!, appId)
            : ['groups', '', ''],
        [enabled, userId, appId]
    );

    // Subscribe to groups with React Query caching
    const { data: groups = [], isLoading } = useFirestoreSubscription<TransactionGroup[]>(
        queryKey,
        (callback) => {
            const db = getFirestore();
            return subscribeToGroups(
                db,
                userId!,
                appId,
                callback,
                (err) => {
                    console.error('[useGroups] Subscription error:', err);
                    setError(err.message);
                }
            );
        },
        { enabled }
    );

    /**
     * Create a new group.
     *
     * @param input - Group creation data (name, optional currency)
     * @returns The created group's document ID
     */
    const addGroup = useCallback(
        async (input: CreateTransactionGroupInput): Promise<string> => {
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const db = getFirestore();
            return createGroup(db, userId, appId, input);
        },
        [userId, appId]
    );

    /**
     * Recalculate all group counts from actual transactions.
     * Fixes corrupted counts from bugs like double-counting.
     *
     * @param transactions - All user transactions to scan
     */
    const recalculateCounts = useCallback(
        async (transactions: Array<{ id: string; groupId?: string | null; total: number }>): Promise<void> => {
            if (!userId || groups.length === 0) {
                return;
            }

            const db = getFirestore();
            await recalculateAllGroupCounts(db, userId, appId, groups, transactions);
        },
        [userId, appId, groups]
    );

    return {
        groups,
        loading: isLoading,
        error,
        addGroup,
        recalculateCounts,
    };
}

export default useGroups;
