/**
 * useSharedGroups Hook - STUB
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
 * const { sharedGroups, loading, error } = useSharedGroups(userId);
 * // Returns: { sharedGroups: [], loading: false, error: null }
 * ```
 */

import { useMemo } from 'react';
import type { SharedGroup } from '../types/sharedGroup';

export interface UseSharedGroupsReturn {
    /** Array of shared groups the user is a member of (always empty in stub) */
    sharedGroups: SharedGroup[];
    /** Whether the subscription is loading (always false in stub) */
    loading: boolean;
    /** Error message if subscription failed (always null in stub) */
    error: string | null;
}

// Module-level constant for stable reference (Atlas pattern: avoid default array params)
const EMPTY_GROUPS: SharedGroup[] = [];

/**
 * STUB: Hook for subscribing to shared groups the user is a member of.
 * Returns empty state - shared groups feature is temporarily disabled.
 *
 * @param _userId - The authenticated user's ID (unused in stub)
 * @returns Empty shared group data with loading=false, error=null
 */
export function useSharedGroups(_userId: string | null): UseSharedGroupsReturn {
    return useMemo(
        () => ({
            sharedGroups: EMPTY_GROUPS,
            loading: false,
            error: null,
        }),
        []
    );
}

export default useSharedGroups;
