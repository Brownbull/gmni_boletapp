/**
 * useUserSharedGroups Hook - STUB
 *
 * Story 14c-refactor.3: Stub hooks for shared groups feature cleanup
 * Epic 14c-refactor: Codebase cleanup before Shared Groups v2
 *
 * This stub replaces the full implementation while the shared groups feature
 * is temporarily disabled. Returns empty state without subscribing to any
 * real-time data or making network calls.
 *
 * @example
 * ```tsx
 * function GroupSelector() {
 *   const db = useFirestore();
 *   const { groups, isLoading, hasGroups, getGroupById } = useUserSharedGroups(db, userId);
 *   // Returns: { groups: [], isLoading: false, hasGroups: false, ... }
 * }
 * ```
 */

import { useCallback, useMemo } from 'react';
import type { Firestore } from 'firebase/firestore';
import type { SharedGroup } from '../types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

/**
 * Return type of useUserSharedGroups hook
 */
export interface UseUserSharedGroupsResult {
    /** Array of shared groups the user is a member of (always empty in stub) */
    groups: SharedGroup[];
    /** True while loading initial data (always false in stub) */
    isLoading: boolean;
    /** Error if subscription failed (always undefined in stub) */
    error: Error | undefined;
    /** Number of groups (always 0 in stub) */
    groupCount: number;
    /** True if user has at least one shared group (always false in stub) */
    hasGroups: boolean;
    /** Helper to find a specific group by ID (always returns undefined in stub) */
    getGroupById: (groupId: string) => SharedGroup | undefined;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * STUB: Subscribe to shared groups the current user is a member of.
 * Returns empty state - shared groups feature is temporarily disabled.
 *
 * @param _db - Firestore instance (unused in stub)
 * @param _userId - Current user's ID (unused in stub)
 * @returns Object with empty groups array, loading/error states, and helpers
 */
export function useUserSharedGroups(
    _db: Firestore,
    _userId: string | undefined
): UseUserSharedGroupsResult {
    const getGroupById = useCallback(
        (_groupId: string): SharedGroup | undefined => undefined,
        []
    );

    return useMemo(
        () => ({
            groups: [],
            isLoading: false,
            error: undefined,
            groupCount: 0,
            hasGroups: false,
            getGroupById,
        }),
        [getGroupById]
    );
}

// =============================================================================
// Re-exports
// =============================================================================

export type { SharedGroup } from '../types/sharedGroup';
