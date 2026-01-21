/**
 *
 * Custom hook that provides all user groups (shared groups only after consolidation).
 * Used by TransactionGroupSelector and IconFilterBar for group selection/filtering.
 *
 * Features:
 * - Fetches shared groups (top-level collection)
 * - Provides unified GroupWithMeta interface
 * - Loading and error states
 *
 * @example
 * ```tsx
 * function TransactionGroupSelector() {
 *   const db = useFirestore();
 *   const { groups, isLoading, error } = useAllUserGroups(db, userId);
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <ul>
 *       {groups.map(group => (
 *         <li key={group.id}>
 *           {group.name}
 *           <Users /> {group.memberCount} members
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';
import { useSharedGroups } from './useSharedGroups';
import type { SharedGroup } from '../types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

/**
 * Unified group representation for TransactionGroupSelector and IconFilterBar.
 * All groups are shared groups.
 */
export interface GroupWithMeta {
  /** Firestore document ID */
  id: string;
  /** Group display name (may include emoji prefix) */
  name: string;
  /** Group color (hex code, e.g., "#10b981") */
  color: string;
  /** Optional emoji icon */
  icon?: string;
  /** Always true after consolidation (kept for backward compatibility) */
  isShared: boolean;
  /** Number of members (only for shared groups) */
  memberCount?: number;
}

/**
 * Return type of useAllUserGroups hook
 */
export interface UseAllUserGroupsResult {
  /** Array of all groups (sorted by name) */
  groups: GroupWithMeta[];
  /** True while loading initial data */
  isLoading: boolean;
  /** Error if subscription failed */
  error: Error | undefined;
  /** True if user has at least one group */
  hasGroups: boolean;
  /** Count of groups */
  groupCount: number;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Provides all user groups (shared groups only after consolidation).
 *
 * @param userId - Current user's ID (null/undefined if not authenticated)
 * @returns Object with groups array, loading/error states, and helpers
 */
export function useAllUserGroups(
  userId: string | null | undefined
): UseAllUserGroupsResult {
  // Fetch shared groups using existing hook (handles getFirestore internally)
  const {
    sharedGroups,
    loading: isLoading,
    error: errorMessage,
  } = useSharedGroups(userId ?? null);

  // Convert error message to Error object if present
  const error = errorMessage ? new Error(errorMessage) : undefined;

  // Transform shared groups to GroupWithMeta format
  const groups = useMemo(() => {
    const transformed: GroupWithMeta[] = sharedGroups.map((group: SharedGroup) => ({
      id: group.id || '',
      name: group.name,
      color: group.color,
      icon: group.icon,
      isShared: true,
      memberCount: group.members?.length || 0,
    }));

    // Sort by name
    return transformed.sort((a, b) => a.name.localeCompare(b.name));
  }, [sharedGroups]);

  // Computed values
  const hasGroups = groups.length > 0;
  const groupCount = groups.length;

  return useMemo(
    () => ({
      groups,
      isLoading,
      error,
      hasGroups,
      groupCount,
    }),
    [groups, isLoading, error, hasGroups, groupCount]
  );
}
