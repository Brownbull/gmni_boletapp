/**
 * Invitation Handler Services
 *
 * Story 14d-v2-1-7d: Tech Debt - Services pattern extraction
 *
 * Pure service functions for handling invitations.
 * These functions abstract the logic for accepting/declining invitations,
 * handling both real invitations (from pendingInvitations collection) and
 * synthetic invitations (created client-side from group share codes).
 *
 * @example
 * ```typescript
 * // Accept a real invitation
 * await handleAcceptInvitationService(db, invitation, userId, userProfile);
 *
 * // Decline a synthetic invitation (no-op for Firestore)
 * await handleDeclineInvitationService(db, syntheticInvitation);
 * ```
 */

import type { Firestore } from 'firebase/firestore';
import type { MemberProfile, PendingInvitation } from '@/types/sharedGroup';
import { acceptInvitation, declineInvitation } from '@/services/invitationService';
import { joinGroupDirectly } from './groupMemberService';

// =============================================================================
// Constants
// =============================================================================

/**
 * Prefix for synthetic invitation IDs.
 * Synthetic invitations are created client-side when a user joins via group share code.
 */
const SYNTHETIC_INVITATION_PREFIX = 'group-';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if an invitation is synthetic (created client-side from group share code).
 *
 * @param invitation - The invitation to check
 * @returns true if the invitation is synthetic, false if it's a real invitation
 */
export function isSyntheticInvitation(invitation: PendingInvitation): boolean {
    return invitation.id?.startsWith(SYNTHETIC_INVITATION_PREFIX) ?? false;
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Accept an invitation (handles both real and synthetic invitations).
 *
 * For real invitations (from pendingInvitations collection):
 * - Calls acceptInvitation to mark the invitation as accepted and add user to group
 *
 * For synthetic invitations (from group share code):
 * - Calls joinGroupDirectly to add user to the group (no invitation document to update)
 *
 * @param db - Firestore instance
 * @param invitation - The invitation to accept
 * @param userId - The user ID accepting the invitation
 * @param userProfile - Optional user profile info for memberProfiles
 *
 * @throws Error if invitation.id is missing
 * @throws Error if Firestore operations fail
 *
 * @example
 * ```typescript
 * await handleAcceptInvitationService(db, invitation, userId, {
 *   displayName: 'Juan Garcia',
 *   email: 'juan@example.com',
 * });
 * ```
 */
export async function handleAcceptInvitationService(
    db: Firestore,
    invitation: PendingInvitation,
    userId: string,
    userProfile?: MemberProfile,
    appId?: string,
    shareMyTransactions?: boolean
): Promise<void> {
    if (isSyntheticInvitation(invitation)) {
        // Synthetic invitation - join the group directly
        await joinGroupDirectly(db, invitation.groupId, userId, userProfile, appId, shareMyTransactions);
    } else {
        // Real invitation - accept through the invitation service
        await acceptInvitation(db, invitation.id!, userId, userProfile, appId, shareMyTransactions);
    }
}

/**
 * Decline an invitation (handles both real and synthetic invitations).
 *
 * For real invitations (from pendingInvitations collection):
 * - Calls declineInvitation to mark the invitation as declined
 *
 * For synthetic invitations (from group share code):
 * - No-op (nothing to update in Firestore)
 *
 * @param db - Firestore instance
 * @param invitation - The invitation to decline
 *
 * @throws Error if Firestore operations fail (for real invitations)
 *
 * @example
 * ```typescript
 * // Decline a real invitation
 * await handleDeclineInvitationService(db, realInvitation);
 *
 * // Decline a synthetic invitation (no-op)
 * await handleDeclineInvitationService(db, syntheticInvitation);
 * ```
 */
export async function handleDeclineInvitationService(
    db: Firestore,
    invitation: PendingInvitation
): Promise<void> {
    if (!isSyntheticInvitation(invitation)) {
        // Real invitation - decline through the invitation service
        await declineInvitation(db, invitation.id!);
    }
    // Synthetic invitation - no-op (nothing in Firestore to update)
}
