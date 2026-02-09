/**
 * usePendingInvitationsCount Hook
 *
 * Story 14d-v2-1-6c-1: Pending Invitations Badge & List UI
 * Task 6.1: Create usePendingInvitationsCount() hook
 * Task 6.2: Query count of pending invitations for current user
 *
 * Provides pending invitation count for badge display and invitation list.
 * Uses React Query for caching and automatic refetching.
 *
 * @example
 * ```tsx
 * const { count, hasInvitations, invitations, isLoading, error } = usePendingInvitationsCount(user);
 *
 * // Display badge
 * {hasInvitations && (
 *   <span className="badge">{count}</span>
 * )}
 * ```
 */

import { useQuery } from '@tanstack/react-query';
import { getFirestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getPendingInvitationsForUser } from '@/services/invitationService';
import type { PendingInvitation } from '@/types/sharedGroup';
import { QUERY_KEYS } from '@/lib/queryKeys';

// =============================================================================
// Types
// =============================================================================

/**
 * Return type for usePendingInvitationsCount hook.
 */
export interface UsePendingInvitationsCountReturn {
    /** Number of pending invitations */
    count: number;
    /** Whether user has any pending invitations */
    hasInvitations: boolean;
    /** Array of pending invitations (sorted by date, newest first) */
    invitations: PendingInvitation[];
    /** Whether the query is loading */
    isLoading: boolean;
    /** Error object if query failed */
    error: Error | null;
    /** Refetch function to manually trigger refresh */
    refetch: () => void;
}

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query key for pending invitations.
 * @deprecated Use QUERY_KEYS.pendingInvitations.byEmail() instead
 */
export const pendingInvitationsQueryKey = (email: string) =>
    ['pendingInvitations', email] as const;

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook to get pending invitations count for badge display.
 *
 * Story 14d-v2-1-6c-1: AC #1 - Badge indicating pending invitations
 * Story 14d-v2-1-6c-1: AC #2 - Invitations sorted by date (newest first)
 *
 * @param user - Firebase Auth user (or null if not logged in)
 * @returns Pending invitations count, list, and loading/error states
 *
 * @example
 * ```tsx
 * const { count, hasInvitations, isLoading } = usePendingInvitationsCount(user);
 *
 * if (isLoading) return <Spinner />;
 *
 * return (
 *   <Badge count={count} visible={hasInvitations} />
 * );
 * ```
 */
export function usePendingInvitationsCount(
    user: User | null | undefined
): UsePendingInvitationsCountReturn {
    const email = user?.email ?? null;

    const {
        data: invitations = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: QUERY_KEYS.pendingInvitations.byEmail(email ?? ''),
        queryFn: async () => {
            if (!email) return [];

            const db = getFirestore();
            // Service returns invitations sorted by createdAt desc (newest first)
            // per Story 14d-v2-1-6a implementation
            return getPendingInvitationsForUser(db, email);
        },
        // Only fetch if user has an email
        enabled: !!email,
        // Cache for 5 minutes (invitations don't change frequently)
        staleTime: 5 * 60 * 1000,
        // Keep in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Refetch on window focus (user may have accepted invitation in another tab)
        refetchOnWindowFocus: true,
    });

    return {
        count: invitations.length,
        hasInvitations: invitations.length > 0,
        invitations,
        isLoading: email ? isLoading : false,
        error: error as Error | null,
        refetch,
    };
}

export default usePendingInvitationsCount;
