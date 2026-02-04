/**
 * useLeaveTransferFlow Hook
 *
 * Story 14d-v2-1-7d: Tech Debt - Extract Firestore operations
 *
 * Provides handlers for leave/transfer/invitation flows using dependency injection.
 * This hook extracts Firestore operations from GruposView, eliminating direct
 * getFirestore() calls in favor of injected Firestore instance.
 *
 * Features:
 * - Leave group with auto-switch view mode when leaving current viewed group
 * - Transfer ownership to another member
 * - Accept invitations (real and synthetic)
 * - Decline invitations (real and synthetic)
 *
 * Note: The hook does NOT manage loading states internally - GruposView
 * controls those via its dialog state hook.
 *
 * @example
 * ```typescript
 * const { handleConfirmLeave, handleConfirmTransfer, handleAcceptInvitation } =
 *   useLeaveTransferFlow({
 *     db: services.db,
 *     user,
 *     onShowToast,
 *     t,
 *     lang,
 *     refetchGroups,
 *     refetchInvitations,
 *   });
 *
 * // Use in dialog handlers
 * const success = await handleConfirmLeave(group, 'soft');
 * ```
 */

import { useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { SharedGroup, PendingInvitation, MemberProfile } from '@/types/sharedGroup';
import { leaveGroup, transferOwnership } from '../services/groupService';
import {
    handleAcceptInvitationService,
    handleDeclineInvitationService,
} from '../services/invitationHandlers';
import { useViewMode } from '@/shared/stores/useViewModeStore';
import type { LeaveMode } from '../types';

// Re-export LeaveMode for convenience (consumers can import from hooks index)
export type { LeaveMode } from '../types';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for useLeaveTransferFlow hook.
 */
export interface UseLeaveTransferFlowOptions {
    /** Firestore instance (injected for testability, null when services not ready) */
    db: Firestore | null;
    /** Current authenticated user (null if not logged in) */
    user: User | null;
    /** Toast notification callback */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
    /** Translation function */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Language preference */
    lang: 'en' | 'es';
    /** Callback to refetch groups list after mutations */
    refetchGroups: () => void;
    /** Callback to refetch invitations list after mutations (optional) */
    refetchInvitations?: () => void;
}

/**
 * Return type for useLeaveTransferFlow hook.
 */
export interface UseLeaveTransferFlowReturn {
    /**
     * Handle confirming leave group action.
     * @param group - The group to leave
     * @param mode - Leave mode ('soft' or 'hard')
     * @returns true if successful, false otherwise
     */
    handleConfirmLeave: (group: SharedGroup, mode: LeaveMode) => Promise<boolean>;

    /**
     * Handle confirming ownership transfer.
     * @param group - The group to transfer ownership of
     * @param memberId - The new owner's user ID
     * @param memberName - The new owner's display name (for toast)
     * @returns true if successful, false otherwise
     */
    handleConfirmTransfer: (
        group: SharedGroup,
        memberId: string,
        memberName: string
    ) => Promise<boolean>;

    /**
     * Handle accepting an invitation.
     * Handles both real invitations (from pendingInvitations) and
     * synthetic invitations (from group share code).
     * @param invitation - The invitation to accept
     * @returns true if successful, false otherwise
     */
    handleAcceptInvitation: (invitation: PendingInvitation) => Promise<boolean>;

    /**
     * Handle declining an invitation.
     * Handles both real invitations (from pendingInvitations) and
     * synthetic invitations (from group share code - no-op).
     * @param invitation - The invitation to decline
     * @returns true if successful, false otherwise
     */
    handleDeclineInvitation: (invitation: PendingInvitation) => Promise<boolean>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for leave/transfer/invitation flows.
 *
 * Extracts Firestore operations from GruposView handlers into a reusable hook.
 * Uses dependency injection for Firestore instance to enable testing.
 */
export function useLeaveTransferFlow(
    options: UseLeaveTransferFlowOptions
): UseLeaveTransferFlowReturn {
    const {
        db,
        user,
        onShowToast,
        t,
        lang,
        refetchGroups,
        refetchInvitations,
    } = options;

    // Get view mode state for auto-switch on leave
    const { mode: viewMode, groupId: viewModeGroupId, setPersonalMode } = useViewMode();

    // =========================================================================
    // Helper: Auto-switch view mode when leaving current viewed group
    // =========================================================================

    /**
     * Check if we need to auto-switch to personal mode after leaving a group.
     * Returns true if the auto-switch toast was shown.
     */
    const handleAutoSwitchViewMode = useCallback(
        (leftGroupId: string, leftGroupName: string): boolean => {
            // If user was viewing the group they just left, switch to Personal mode
            if (viewMode === 'group' && viewModeGroupId === leftGroupId) {
                setPersonalMode();
                onShowToast?.(
                    t('leftGroupSwitchedToPersonal', { groupName: leftGroupName }) ||
                        (lang === 'es'
                            ? `Saliste de "${leftGroupName}". Viendo datos personales.`
                            : `You left "${leftGroupName}". Viewing personal data.`),
                    'success'
                );
                return true; // Indicates auto-switch toast was shown
            }
            return false; // No auto-switch needed
        },
        [viewMode, viewModeGroupId, setPersonalMode, onShowToast, t, lang]
    );

    // =========================================================================
    // handleConfirmLeave
    // =========================================================================

    const handleConfirmLeave = useCallback(
        async (group: SharedGroup, mode: LeaveMode): Promise<boolean> => {
            const groupId = group.id;
            if (!db || !user || !groupId) {
                return false;
            }

            // Log mode selection for debugging (can be removed when hard leave is implemented)
            if (import.meta.env.DEV) {
                console.log('[useLeaveTransferFlow] Leave mode selected:', mode);
            }

            try {
                // TODO (Story 14d-v2-1-7c): Pass mode to Cloud Function for hard leave support
                await leaveGroup(db, user.uid, groupId);

                // Check and switch view mode if needed (returns true if auto-switch toast was shown)
                const didAutoSwitch = handleAutoSwitchViewMode(groupId, group.name);

                // Only show regular "left group" toast if we didn't show the auto-switch toast
                if (!didAutoSwitch) {
                    onShowToast?.(
                        t('leftGroup', { groupName: group.name }) ||
                            (lang === 'es'
                                ? `Saliste de "${group.name}"`
                                : `Left "${group.name}"`),
                        'success'
                    );
                }

                refetchGroups();
                return true;
            } catch (err) {
                console.error('[useLeaveTransferFlow] Error leaving group:', err);
                onShowToast?.(
                    t('errorLeavingGroup') ||
                        (lang === 'es'
                            ? 'Error al salir del grupo'
                            : 'Error leaving group'),
                    'error'
                );
                return false;
            }
        },
        [db, user, onShowToast, t, lang, refetchGroups, handleAutoSwitchViewMode]
    );

    // =========================================================================
    // handleConfirmTransfer
    // =========================================================================

    const handleConfirmTransfer = useCallback(
        async (
            group: SharedGroup,
            memberId: string,
            memberName: string
        ): Promise<boolean> => {
            const groupId = group.id;
            if (!db || !user || !groupId) {
                return false;
            }

            try {
                await transferOwnership(db, user.uid, memberId, groupId);

                onShowToast?.(
                    t('ownershipTransferred', { name: memberName }) ||
                        (lang === 'es'
                            ? `Propiedad transferida a ${memberName}`
                            : `Ownership transferred to ${memberName}`),
                    'success'
                );

                refetchGroups();
                return true;
            } catch (err) {
                console.error('[useLeaveTransferFlow] Error transferring ownership:', err);
                onShowToast?.(
                    t('errorTransferringOwnership') ||
                        (lang === 'es'
                            ? 'Error al transferir propiedad'
                            : 'Error transferring ownership'),
                    'error'
                );
                return false;
            }
        },
        [db, user, onShowToast, t, lang, refetchGroups]
    );

    // =========================================================================
    // handleAcceptInvitation
    // =========================================================================

    const handleAcceptInvitation = useCallback(
        async (invitation: PendingInvitation): Promise<boolean> => {
            if (!db || !user || !invitation.id) {
                return false;
            }

            try {
                const userProfile: MemberProfile = {
                    displayName: user.displayName || undefined,
                    email: user.email || undefined,
                    photoURL: user.photoURL || undefined,
                };

                await handleAcceptInvitationService(db, invitation, user.uid, userProfile);

                onShowToast?.(
                    t('acceptInvitationSuccess', { groupName: invitation.groupName }) ||
                        (lang === 'es'
                            ? `Te uniste a "${invitation.groupName}"!`
                            : `Joined "${invitation.groupName}"!`),
                    'success'
                );

                refetchGroups();
                refetchInvitations?.();
                return true;
            } catch (err) {
                console.error('[useLeaveTransferFlow] Error accepting invitation:', err);
                onShowToast?.(
                    t('errorAcceptingInvitation') ||
                        (lang === 'es'
                            ? 'Error al aceptar la invitacion'
                            : 'Error accepting invitation'),
                    'error'
                );
                return false;
            }
        },
        [db, user, onShowToast, t, lang, refetchGroups, refetchInvitations]
    );

    // =========================================================================
    // handleDeclineInvitation
    // =========================================================================

    const handleDeclineInvitation = useCallback(
        async (invitation: PendingInvitation): Promise<boolean> => {
            // Note: user check added for consistency with other handlers
            // and future-proofing for audit logging
            if (!db || !user || !invitation.id) {
                return false;
            }

            try {
                await handleDeclineInvitationService(db, invitation);

                onShowToast?.(
                    t('declineInvitationSuccess') ||
                        (lang === 'es'
                            ? 'Invitacion rechazada'
                            : 'Invitation declined'),
                    'success'
                );

                refetchInvitations?.();
                return true;
            } catch (err) {
                console.error('[useLeaveTransferFlow] Error declining invitation:', err);
                onShowToast?.(
                    t('errorDecliningInvitation') ||
                        (lang === 'es'
                            ? 'Error al rechazar la invitacion'
                            : 'Error declining invitation'),
                    'error'
                );
                return false;
            }
        },
        [db, user, onShowToast, t, lang, refetchInvitations]
    );

    // =========================================================================
    // Return Hook API
    // =========================================================================

    return {
        handleConfirmLeave,
        handleConfirmTransfer,
        handleAcceptInvitation,
        handleDeclineInvitation,
    };
}
