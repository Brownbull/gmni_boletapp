/**
 * useSharedGroups Hook
 *
 * Story 14c.1: Create Shared Group
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Subscribes to real-time updates of shared groups the user is a member of.
 * Uses React Query caching for optimal performance.
 *
 * @example
 * ```tsx
 * const { sharedGroups, loading, error } = useSharedGroups(userId);
 *
 * return (
 *   <div>
 *     {sharedGroups.map(group => (
 *       <div key={group.id}>{group.name} - {group.members.length} members</div>
 *     ))}
 *   </div>
 * );
 * ```
 */

import { useState, useMemo } from 'react';
import { getFirestore } from 'firebase/firestore';
import { useFirestoreSubscription } from './useFirestoreSubscription';
import { subscribeToSharedGroups } from '../services/sharedGroupService';
import type { SharedGroup } from '../types/sharedGroup';

export interface UseSharedGroupsReturn {
    /** Array of shared groups the user is a member of */
    sharedGroups: SharedGroup[];
    /** Whether the subscription is loading */
    loading: boolean;
    /** Error message if subscription failed */
    error: string | null;
}

/**
 * Hook for subscribing to shared groups the user is a member of.
 *
 * @param userId - The authenticated user's ID
 * @returns Shared group data and loading/error states
 */
export function useSharedGroups(userId: string | null): UseSharedGroupsReturn {
    const [error, setError] = useState<string | null>(null);
    const enabled = !!userId;

    // Create the query key
    const queryKey = useMemo(
        () => enabled
            ? ['sharedGroups', userId!]
            : ['sharedGroups', ''],
        [enabled, userId]
    );

    // Subscribe to shared groups with React Query caching
    const { data: sharedGroups = [], isLoading } = useFirestoreSubscription<SharedGroup[]>(
        queryKey,
        (callback) => {
            const db = getFirestore();
            return subscribeToSharedGroups(
                db,
                userId!,
                callback,
                (err) => {
                    console.error('[useSharedGroups] Subscription error:', err);
                    setError(err.message);
                }
            );
        },
        { enabled }
    );

    return {
        sharedGroups,
        loading: isLoading,
        error,
    };
}

export default useSharedGroups;
