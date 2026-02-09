/**
 * useLeaveTransferFlow Hook
 *
 * Story 14d-v2-1-7d: Tech Debt - Extract Firestore operations
 * Story TD-CONSOLIDATED-12: React Query Cache Staleness
 *
 * Provides handlers for leave/transfer/invitation flows using injected mutation functions.
 * Mutation hooks (useLeaveGroup, useTransferOwnership, etc.) are called at the component
 * level and their mutateAsync functions are passed in for proper React Query cache management.
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
 * const { mutateAsync: leaveGroupAsync } = useLeaveGroup(user, services);
 * const { handleConfirmLeave, handleConfirmTransfer } =
 *   useLeaveTransferFlow({
 *     user,
 *     onShowToast,
 *     t,
 *     lang,
 *     leaveGroupAsync,
 *     transferOwnershipAsync,
 *     acceptInvitationAsync,
 *     declineInvitationAsync,
 *   });
 * ```
 */

import { useCallback } from 'react';
import type { User } from 'firebase/auth';
import type { SharedGroup, PendingInvitation } from '@/types/sharedGroup';
import { useViewMode } from '@/shared/stores/useViewModeStore';
import { sanitizeInput } from '@/utils/sanitize';
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
    /** Current authenticated user (null if not logged in) */
    user: User | null;
    /** Toast notification callback */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
    /** Translation function */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Language preference */
    lang: 'en' | 'es';
    /** Mutation: leave group (from useLeaveGroup hook) */
    leaveGroupAsync: (input: { groupId: string }) => Promise<void>;
    /** Mutation: transfer ownership (from useTransferOwnership hook) */
    transferOwnershipAsync: (input: { groupId: string; newOwnerId: string }) => Promise<void>;
    /** Mutation: accept invitation (from useAcceptInvitation hook) */
    acceptInvitationAsync: (input: { invitation: PendingInvitation; shareMyTransactions?: boolean }) => Promise<void>;
    /** Mutation: decline invitation (from useDeclineInvitation hook) */
    declineInvitationAsync: (input: { invitation: PendingInvitation }) => Promise<void>;
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
     * @param shareMyTransactions - Whether user opts in to sharing transactions (default: false)
     * @returns true if successful, false otherwise
     */
    handleAcceptInvitation: (invitation: PendingInvitation, shareMyTransactions?: boolean) => Promise<boolean>;

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
        user,
        onShowToast,
        t,
        lang,
        leaveGroupAsync,
        transferOwnershipAsync,
        acceptInvitationAsync,
        declineInvitationAsync,
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
                const safeName = sanitizeInput(leftGroupName, { maxLength: 100 });
                onShowToast?.(
                    t('leftGroupSwitchedToPersonal', { groupName: safeName }) ||
                        (lang === 'es'
                            ? `Saliste de "${safeName}". Viendo datos personales.`
                            : `You left "${safeName}". Viewing personal data.`),
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
            if (!user || !groupId) {
                return false;
            }

            // Log mode selection for debugging (can be removed when hard leave is implemented)
            if (import.meta.env.DEV) {
                console.log('[useLeaveTransferFlow] Leave mode selected:', mode);
            }

            try {
                // TODO (Story 14d-v2-1-7c): Pass mode to Cloud Function for hard leave support
                await leaveGroupAsync({ groupId });

                // Check and switch view mode if needed (returns true if auto-switch toast was shown)
                const didAutoSwitch = handleAutoSwitchViewMode(groupId, group.name);

                // Only show regular "left group" toast if we didn't show the auto-switch toast
                if (!didAutoSwitch) {
                    const safeName = sanitizeInput(group.name, { maxLength: 100 });
                    onShowToast?.(
                        t('leftGroup', { groupName: safeName }) ||
                            (lang === 'es'
                                ? `Saliste de "${safeName}"`
                                : `Left "${safeName}"`),
                        'success'
                    );
                }

                return true;
            } catch (err) {
                if (import.meta.env.DEV) console.error('[useLeaveTransferFlow] Error leaving group:', err);
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
        [user, onShowToast, t, lang, leaveGroupAsync, handleAutoSwitchViewMode]
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
            if (!user || !groupId) {
                return false;
            }

            try {
                await transferOwnershipAsync({ groupId, newOwnerId: memberId });

                const safeMemberName = sanitizeInput(memberName, { maxLength: 100 });
                onShowToast?.(
                    t('ownershipTransferred', { name: safeMemberName }) ||
                        (lang === 'es'
                            ? `Propiedad transferida a ${safeMemberName}`
                            : `Ownership transferred to ${safeMemberName}`),
                    'success'
                );

                return true;
            } catch (err) {
                if (import.meta.env.DEV) console.error('[useLeaveTransferFlow] Error transferring ownership:', err);
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
        [user, onShowToast, t, lang, transferOwnershipAsync]
    );

    // =========================================================================
    // handleAcceptInvitation
    // =========================================================================

    const handleAcceptInvitation = useCallback(
        async (invitation: PendingInvitation, shareMyTransactions?: boolean): Promise<boolean> => {
            if (!user || !invitation.id) {
                return false;
            }

            try {
                await acceptInvitationAsync({ invitation, shareMyTransactions });

                // ECC Review #2: Sanitize group name before toast display (defense-in-depth)
                const safeName = sanitizeInput(invitation.groupName, { maxLength: 100 });
                onShowToast?.(
                    t('acceptInvitationSuccess', { groupName: safeName }) ||
                        (lang === 'es'
                            ? `Te uniste a "${safeName}"!`
                            : `Joined "${safeName}"!`),
                    'success'
                );

                return true;
            } catch (err) {
                if (import.meta.env.DEV) console.error('[useLeaveTransferFlow] Error accepting invitation:', err);
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
        [user, onShowToast, t, lang, acceptInvitationAsync]
    );

    // =========================================================================
    // handleDeclineInvitation
    // =========================================================================

    const handleDeclineInvitation = useCallback(
        async (invitation: PendingInvitation): Promise<boolean> => {
            // Note: user check added for consistency with other handlers
            // and future-proofing for audit logging
            if (!user || !invitation.id) {
                return false;
            }

            try {
                await declineInvitationAsync({ invitation });

                onShowToast?.(
                    t('declineInvitationSuccess') ||
                        (lang === 'es'
                            ? 'Invitacion rechazada'
                            : 'Invitation declined'),
                    'success'
                );

                return true;
            } catch (err) {
                if (import.meta.env.DEV) console.error('[useLeaveTransferFlow] Error declining invitation:', err);
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
        [user, onShowToast, t, lang, declineInvitationAsync]
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
