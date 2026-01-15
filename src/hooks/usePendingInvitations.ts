/**
 * usePendingInvitations Hook
 *
 * Story 14c.2: Accept/Decline Invitation
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Subscribes to real-time updates of pending invitations for the current user.
 * Queries pendingInvitations collection where invitedEmail matches user email.
 * Uses React Query caching for optimal performance.
 *
 * @example
 * ```tsx
 * const { pendingInvitations, pendingCount, loading, error } = usePendingInvitations(userEmail);
 *
 * return (
 *   <div>
 *     {pendingInvitations.map(invite => (
 *       <InvitationCard key={invite.id} invitation={invite} />
 *     ))}
 *   </div>
 * );
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Unsubscribe,
} from 'firebase/firestore';
import { useFirestoreSubscription } from './useFirestoreSubscription';
import type { PendingInvitation } from '../types/sharedGroup';
import { isInvitationExpired } from '../types/sharedGroup';

/** Collection path for pending invitations */
const PENDING_INVITATIONS_COLLECTION = 'pendingInvitations';

/** Maximum invitations to fetch */
const MAX_INVITATIONS = 20;

export interface UsePendingInvitationsReturn {
    /** Array of pending invitations for the user */
    pendingInvitations: PendingInvitation[];
    /** Count of pending (non-expired) invitations - for badge display */
    pendingCount: number;
    /** Whether the subscription is loading */
    loading: boolean;
    /** Error message if subscription failed */
    error: string | null;
}

/**
 * Subscribe to pending invitations for a user by email.
 *
 * @param userEmail - The authenticated user's email
 * @param onUpdate - Callback when invitations change
 * @param onError - Optional error callback
 * @returns Unsubscribe function
 */
export function subscribeToPendingInvitations(
    userEmail: string,
    onUpdate: (invitations: PendingInvitation[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const db = getFirestore();
    const collectionRef = collection(db, PENDING_INVITATIONS_COLLECTION);

    // Query invitations where email matches and status is pending
    // AC1: Query pendingInvitations where invitedEmail == user.email and status == 'pending'
    const q = query(
        collectionRef,
        where('invitedEmail', '==', userEmail.toLowerCase()),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(MAX_INVITATIONS)
    );

    return onSnapshot(
        q,
        (snapshot) => {
            const invitations = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as PendingInvitation[];

            // Dev-mode logging
            if (import.meta.env.DEV && snapshot.size > 0) {
                console.log('[usePendingInvitations] Received invitations:', snapshot.size);
            }

            onUpdate(invitations);
        },
        (error) => {
            console.error('[usePendingInvitations] Subscription error:', error);
            onError?.(error);
        }
    );
}

/**
 * Hook for subscribing to pending invitations for the current user.
 *
 * @param userEmail - The authenticated user's email address
 * @returns Pending invitation data and loading/error states
 */
export function usePendingInvitations(userEmail: string | null | undefined): UsePendingInvitationsReturn {
    const [error, setError] = useState<string | null>(null);
    const enabled = !!userEmail;

    // Create the query key
    const queryKey = useMemo(
        () => enabled
            ? ['pendingInvitations', userEmail!.toLowerCase()]
            : ['pendingInvitations', ''],
        [enabled, userEmail]
    );

    // Create a stable subscribe function reference
    const subscribeFn = useCallback(
        (callback: (data: PendingInvitation[]) => void) => {
            return subscribeToPendingInvitations(
                userEmail!,
                callback,
                (err) => {
                    console.error('[usePendingInvitations] Error:', err);
                    setError(err.message);
                }
            );
        },
        [userEmail]
    );

    // Subscribe to pending invitations with React Query caching
    const { data: pendingInvitations = [], isLoading } = useFirestoreSubscription<PendingInvitation[]>(
        queryKey,
        subscribeFn,
        { enabled }
    );

    // Count of non-expired pending invitations for badge display
    // AC7: Expired invitations are still included for display (shown grayed out)
    // but not counted in the badge
    const pendingCount = useMemo(() => {
        return pendingInvitations.filter((inv) => !isInvitationExpired(inv)).length;
    }, [pendingInvitations]);

    return {
        pendingInvitations,
        pendingCount,
        loading: isLoading,
        error,
    };
}

export default usePendingInvitations;
