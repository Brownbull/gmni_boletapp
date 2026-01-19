/**
 * Story 14c.4: View Mode Switcher - useUserSharedGroups Hook
 *
 * Custom hook that subscribes to shared groups the current user is a member of.
 * Used by the ViewModeSwitcher component to display available groups.
 *
 * Features:
 * - Real-time subscription to user's shared groups
 * - Loading and error states
 * - Helper functions for group lookup
 * - Automatic cleanup on unmount
 *
 * @example
 * ```tsx
 * function GroupSelector() {
 *   const db = useFirestore();
 *   const { groups, isLoading, hasGroups, getGroupById } = useUserSharedGroups(db, userId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!hasGroups) return <EmptyState />;
 *
 *   return (
 *     <ul>
 *       {groups.map(group => (
 *         <li key={group.id}>{group.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Firestore } from 'firebase/firestore';
import { subscribeToSharedGroups } from '../services/sharedGroupService';
import type { SharedGroup } from '../types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

/**
 * Return type of useUserSharedGroups hook
 */
export interface UseUserSharedGroupsResult {
  /** Array of shared groups the user is a member of */
  groups: SharedGroup[];
  /** True while loading initial data */
  isLoading: boolean;
  /** Error if subscription failed */
  error: Error | undefined;
  /** Number of groups */
  groupCount: number;
  /** True if user has at least one shared group */
  hasGroups: boolean;
  /** Helper to find a specific group by ID */
  getGroupById: (groupId: string) => SharedGroup | undefined;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Subscribe to shared groups the current user is a member of.
 *
 * @param db - Firestore instance
 * @param userId - Current user's ID (undefined if not authenticated)
 * @returns Object with groups array, loading/error states, and helpers
 */
export function useUserSharedGroups(
  db: Firestore,
  userId: string | undefined
): UseUserSharedGroupsResult {
  const [groups, setGroups] = useState<SharedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Subscribe to shared groups when userId is available
  useEffect(() => {
    // Skip subscription if no userId
    if (!userId) {
      setGroups([]);
      setIsLoading(false);
      setError(undefined);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSharedGroups(
      db,
      userId,
      (updatedGroups) => {
        setGroups(updatedGroups);
        setIsLoading(false);
        setError(undefined);
      },
      (subscriptionError) => {
        setError(subscriptionError);
        setIsLoading(false);
        setGroups([]);
      }
    );

    // Cleanup on unmount or userId change
    return () => {
      unsubscribe();
    };
  }, [db, userId]);

  // Helper to find a group by ID
  const getGroupById = useCallback(
    (groupId: string): SharedGroup | undefined => {
      return groups.find((g) => g.id === groupId);
    },
    [groups]
  );

  // Computed values
  const groupCount = groups.length;
  const hasGroups = groupCount > 0;

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      groups,
      isLoading,
      error,
      groupCount,
      hasGroups,
      getGroupById,
    }),
    [groups, isLoading, error, groupCount, hasGroups, getGroupById]
  );
}

// =============================================================================
// Re-exports
// =============================================================================

export type { SharedGroup } from '../types/sharedGroup';
