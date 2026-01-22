/**
 * usePendingInvitations Hook
 *
 * **STUB** - Epic 14c-refactor: Shared groups disabled until Epic 14d
 *
 * This hook previously subscribed to real-time updates of pending invitations.
 * Now returns empty state to prevent Firestore listener errors since security
 * rules deny all access to pendingInvitations collection.
 *
 * @see Story 14c-refactor.14 - Firebase Indexes Audit
 * @see firestore.rules - pendingInvitations: allow read, write: if false
 */

import { useMemo } from 'react';
import type { PendingInvitation } from '../types/sharedGroup';

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
 * STUB: Subscribe to pending invitations for a user by email.
 *
 * Returns no-op unsubscribe and calls callback with empty array immediately.
 * Feature disabled until Epic 14d.
 */
export function subscribeToPendingInvitations(
    _userEmail: string,
    onUpdate: (invitations: PendingInvitation[]) => void,
    _onError?: (error: Error) => void
): () => void {
    // Immediately call with empty array - no Firestore listener
    onUpdate([]);
    // Return no-op unsubscribe
    return () => {};
}

/**
 * STUB: Hook for subscribing to pending invitations for the current user.
 *
 * Returns empty state - feature disabled until Epic 14d.
 * Security rules deny all access to pendingInvitations collection.
 *
 * @param _userEmail - Ignored (feature disabled)
 * @returns Empty pending invitation state
 */
export function usePendingInvitations(_userEmail: string | null | undefined): UsePendingInvitationsReturn {
    // Return stable empty state
    return useMemo(() => ({
        pendingInvitations: [],
        pendingCount: 0,
        loading: false,
        error: null,
    }), []);
}

export default usePendingInvitations;
