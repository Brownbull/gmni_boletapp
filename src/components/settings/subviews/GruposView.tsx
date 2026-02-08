/**
 * GruposView - Shared Groups Settings
 *
 * Story 14d-v2-1-4c-1: Core Dialog & Entry Point
 * Story 14d-v2-1-6c-1: Pending Invitations Badge & List UI
 * Story 14d-v2-1-7d: Leave/Transfer UI + View Mode Auto-Switch
 * TD-7d-1: useGroupDialogs hook integration
 * Epic 14d-v2: Shared Groups v2
 *
 * Entry point for shared groups feature in Settings.
 * Provides "Create Group" button that opens CreateGroupDialog.
 * Shows pending invitations badge and section when user has invitations.
 * Supports Leave Group and Transfer Ownership flows with appropriate dialogs:
 * - Leave button on all group cards
 * - Transfer button for owners with multiple members
 * - Owner warning dialog when owner attempts to leave
 * - Member selector dialog for transfer target selection
 * - Confirmation dialogs for leave and transfer operations
 *
 * TD-7d-1: Refactored to use useGroupDialogs hook for dialog state management
 * and useLeaveTransferFlow for Firestore operations.
 */

import React, { useCallback, useState } from 'react';
import { Users, Plus, Loader2, UserPlus, LogOut, ArrowRightLeft, Settings } from 'lucide-react';
import { APP_ID } from '@/config/constants';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/app/useOnlineStatus';
import { trackEvent } from '@/services/analyticsService';
import { sanitizeInput } from '@/utils/sanitize';
import {
    // Services & hooks
    useCreateGroup,
    useGroups,
    useCanCreateGroup,
    useGroupCount,
    SHARED_GROUP_LIMITS,
    useLeaveTransferFlow,
    deleteGroupAsOwner,
    DEFAULT_GROUP_COLOR,
    // Story 14d-v2-1-7g: Edit group hook
    useUpdateGroup,
    // Story 14d-v2-1-11c: Transaction sharing toggle service
    updateTransactionSharingEnabled,
    // TD-14d-2: Components now from @features/shared-groups
    CreateGroupDialog,
    InviteMembersDialog,
    AcceptInvitationDialog,
    PendingInvitationsSection,
    JoinGroupByCode,
    LeaveGroupDialog,
    OwnerLeaveWarningDialog,
    MemberSelectorDialog,
    TransferOwnershipDialog,
    DeleteGroupDialog,
    // Story 14d-v2-1-7g: Edit Group Dialog
    EditGroupDialog,
    // Story 14d-v2-1-13+14: Transaction Sharing Opt-In Dialog
    TransactionSharingOptInDialog,
    // Story 14d-v2-1-14-polish: Direct service call for context-specific toasts
    handleAcceptInvitationService,
} from '@/features/shared-groups';
import type { CreateGroupInput, LeaveMode, EditGroupDialogInput, MemberProfile } from '@/features/shared-groups';
import { usePendingInvitationsCount } from '@/hooks/usePendingInvitationsCount';
// TD-7d-1: useGroupDialogs hook for dialog state management
// Uses the backward-compatible re-export from @/hooks for test mock compatibility
import { useGroupDialogs } from '@/hooks/useGroupDialogs';
import type { SharedGroup, PendingInvitation } from '@/types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

// Story 14d-v2-1-14-polish: Toast key mapping for opt-in choices (hoisted for performance)
const OPT_IN_TOAST_KEYS: Record<string, string> = {
    yes: 'joinedGroupWithSharing',
    no: 'joinedGroupWithoutSharing',
    dismiss: 'joinedGroupDefault',
};

export interface GruposViewProps {
    t: (key: string, params?: Record<string, string | number>) => string;
    theme: string;
    /** User ID (for display purposes, hook gets user from context) */
    userId?: string | null;
    /** User email (for display purposes) */
    userEmail?: string | null;
    /** User display name (for display purposes) */
    userDisplayName?: string | null;
    /** User photo URL (for display purposes) */
    userPhotoURL?: string | null;
    /** Application ID */
    appId?: string;
    /** Language preference */
    lang?: 'en' | 'es';
    /** Toast notification callback */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * GruposView - Shared Groups Settings
 *
 * Shows list of user's groups with option to create new ones.
 * Full management UI (edit, delete, leave) will be added in subsequent stories.
 */
export const GruposView: React.FC<GruposViewProps> = ({
    t,
    theme = 'light',
    lang = 'es',
    onShowToast,
}) => {

    // Auth state
    const { user, services } = useAuth();

    // Story 14d-v2-1-14-polish: Offline detection (AC4)
    const { isOnline } = useOnlineStatus();

    // Story 14d-v2-1-6c-1: Pending invitations for badge display (AC #1)
    const {
        count: pendingInvitationsCount,
        hasInvitations,
        invitations: pendingInvitations,
        refetch: refetchInvitations,
    } = usePendingInvitationsCount(user);

    // TD-7d-1: Dialog state management via useGroupDialogs hook
    // Replaces 15+ individual useState calls with a single hook
    const { dialogs, actions } = useGroupDialogs();

    // Groups query (Story 14d-v2-1-7d: added refetch for leave/transfer operations)
    const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useGroups(user, services);

    // TD-7d-1: Leave/Transfer flow handlers via useLeaveTransferFlow hook
    // Uses dependency injection for Firestore (services?.db) instead of getFirestore()
    const leaveTransferHandlers = useLeaveTransferFlow({
        db: services?.db ?? null,
        user,
        onShowToast,
        t,
        lang,
        refetchGroups,
        refetchInvitations,
    });

    // BC-1 limit check (Story 14d-v2-1-4c-2: AC #1)
    const { canCreate, isLoading: limitLoading } = useCanCreateGroup(user, services);
    const { data: groupCount } = useGroupCount(user, services);

    // Create group mutation
    const {
        mutateAsync: createGroupAsync,
        isPending: isCreating,
        reset: resetCreate,
    } = useCreateGroup(user, services);

    // Handle create group
    // TD-7d-1: Updated to use actions from useGroupDialogs
    const handleCreate = useCallback(async (input: CreateGroupInput) => {
        // Clear any previous error before attempting (AC #3: retry support)
        actions.resetCreateError();

        try {
            const newGroup = await createGroupAsync({
                name: input.name,
                transactionSharingEnabled: input.transactionSharingEnabled,
            });
            actions.closeCreateDialog();
            resetCreate();
            // ECC Review: Sanitize name before display for defense-in-depth (#9)
            const safeName = sanitizeInput(newGroup.name, { maxLength: 100 });
            onShowToast?.(
                t('groupCreatedSuccess') ||
                    (lang === 'es'
                        ? `Grupo "${safeName}" creado`
                        : `Group "${safeName}" created`),
                'success'
            );
            // TODO (Story 14d-v2-1-10b): Navigate to newly created group view
            // For now, group is visible in the list. Full navigation will be
            // implemented when ViewModeSwitcher and group detail views are ready.
        } catch (err) {
            // Story 14d-v2-1-4c-2 AC #3: Preserve input for retry
            const errorMessage = err instanceof Error ? err.message : '';
            actions.setCreateError(
                errorMessage ||
                    (lang === 'es'
                        ? 'Error al crear el grupo. Intenta de nuevo.'
                        : 'Error creating group. Please try again.')
            );
            // Don't close dialog - let user retry with preserved input
        }
    }, [createGroupAsync, resetCreate, onShowToast, t, lang, actions]);

    // Handle dialog close
    // TD-7d-1: Updated to use actions from useGroupDialogs
    const handleCloseDialog = useCallback(() => {
        if (isCreating) return;
        actions.closeCreateDialog();
        resetCreate();
    }, [isCreating, resetCreate, actions]);

    // Handle error reset for retry (AC #3)
    // TD-7d-1: Updated to use actions from useGroupDialogs
    const handleResetError = useCallback(() => {
        actions.resetCreateError();
    }, [actions]);

    // =========================================================================
    // Invite Dialog Handlers (Story 14d-v2-1-5c: UI Integration - simplified)
    // TD-7d-1: Updated to use actions from useGroupDialogs
    // =========================================================================

    // Open invite dialog for a group
    const handleOpenInviteDialog = useCallback((group: SharedGroup) => {
        actions.openInviteDialog(group);
    }, [actions]);

    // Close invite dialog
    const handleCloseInviteDialog = useCallback(() => {
        actions.closeInviteDialog();
    }, [actions]);

    // =========================================================================
    // Invitation Handlers (Story 14d-v2-1-6c-1: Badge & List UI)
    // =========================================================================

    // Callback when invitation is accepted/declined
    const handleInvitationHandled = useCallback(() => {
        // Refetch invitations to update badge count
        refetchInvitations();
    }, [refetchInvitations]);

    // =========================================================================
    // Join by Code Handlers (Enhancement for manual code entry)
    // TD-7d-1: Updated to use actions from useGroupDialogs
    // =========================================================================

    // When a valid invitation is found via manual code entry,
    // show the accept invitation dialog (Story 14d-v2-1-6c-2)
    const handleInvitationFoundByCode = useCallback((invitation: PendingInvitation) => {
        actions.openAcceptDialog(invitation);
    }, [actions]);

    // =========================================================================
    // Accept Invitation Dialog Handlers (Story 14d-v2-1-6c-2)
    // TD-7d-1: Updated to use actions from useGroupDialogs and useLeaveTransferFlow
    // =========================================================================

    const handleCloseAcceptDialog = useCallback(() => {
        if (dialogs.isAccepting) return;
        actions.closeAcceptDialog();
    }, [dialogs.isAccepting, actions]);

    // Story 14d-v2-1-14-polish: Shared offline guard (AC4) - DRY extracted (#10)
    const showOfflineError = useCallback(() => {
        onShowToast?.(
            t('offlineCannotJoinGroup') ||
                (lang === 'es'
                    ? 'Estás sin conexión. Conéctate para unirte a grupos.'
                    : "You're offline. Please connect to join groups."),
            'error'
        );
    }, [onShowToast, t, lang]);

    // TD-7d-1: Accept invitation now delegates to useLeaveTransferFlow hook
    // Story 14d-v2-1-14-polish: Added offline check (AC4)
    const handleAcceptInvitation = useCallback(async (invitation: PendingInvitation) => {
        if (!isOnline) {
            showOfflineError();
            return;
        }
        actions.setIsAccepting(true);
        try {
            const success = await leaveTransferHandlers.handleAcceptInvitation(invitation);
            if (success) {
                actions.closeAcceptDialog();
            }
        } finally {
            actions.setIsAccepting(false);
        }
    }, [actions, leaveTransferHandlers, isOnline, showOfflineError]);

    // TD-7d-1: Decline invitation now delegates to useLeaveTransferFlow hook
    const handleDeclineInvitation = useCallback(async (invitation: PendingInvitation) => {
        actions.setIsAccepting(true);
        try {
            const success = await leaveTransferHandlers.handleDeclineInvitation(invitation);
            if (success) {
                actions.closeAcceptDialog();
            }
        } finally {
            actions.setIsAccepting(false);
        }
    }, [actions, leaveTransferHandlers]);

    // =========================================================================
    // Leave & Transfer Handlers (Story 14d-v2-1-7d)
    // TD-7d-1: Updated to use actions from useGroupDialogs and useLeaveTransferFlow
    // =========================================================================

    // Handle leave button click - check if owner
    // TD-7d-1: Updated to use actions from useGroupDialogs
    const handleLeaveClick = useCallback((group: SharedGroup) => {
        const isOwner = group.ownerId === user?.uid;
        if (isOwner) {
            actions.openOwnerWarning(group);
        } else {
            actions.openLeaveDialog(group);
        }
    }, [user?.uid, actions]);

    // Handle confirm leave
    // TD-7d-1: Now delegates to useLeaveTransferFlow hook which handles
    // the auto-switch view mode logic internally
    const handleConfirmLeave = useCallback(async (mode: LeaveMode) => {
        if (!dialogs.selectedGroupForAction) return;

        // Note: Mode logging is handled in useLeaveTransferFlow hook (DEV only)

        actions.setIsLeaving(true);
        try {
            const success = await leaveTransferHandlers.handleConfirmLeave(
                dialogs.selectedGroupForAction,
                mode
            );
            if (success) {
                actions.closeLeaveDialog();
            }
        } finally {
            actions.setIsLeaving(false);
        }
    }, [dialogs.selectedGroupForAction, actions, leaveTransferHandlers]);

    // Handle transfer selector open
    // TD-7d-1: Updated to use actions from useGroupDialogs
    const handleOpenTransferSelector = useCallback((group: SharedGroup) => {
        actions.openMemberSelector(group);
    }, [actions]);

    // Handle member selected for transfer
    // TD-7d-1: Updated to use actions from useGroupDialogs
    const handleMemberSelected = useCallback((memberId: string, memberName: string) => {
        actions.openTransferDialog(memberId, memberName);
    }, [actions]);

    // Handle confirm transfer
    // TD-7d-1: Now delegates to useLeaveTransferFlow hook
    const handleConfirmTransfer = useCallback(async () => {
        if (!dialogs.selectedGroupForAction || !dialogs.selectedMemberForTransfer) return;

        actions.setIsTransferring(true);
        try {
            const success = await leaveTransferHandlers.handleConfirmTransfer(
                dialogs.selectedGroupForAction,
                dialogs.selectedMemberForTransfer,
                dialogs.selectedMemberName
            );
            if (success) {
                actions.closeTransferDialog();
            }
        } finally {
            actions.setIsTransferring(false);
        }
    }, [dialogs.selectedGroupForAction, dialogs.selectedMemberForTransfer, dialogs.selectedMemberName, actions, leaveTransferHandlers]);

    // Story 14d-v2-1-7e: Delete Group Handler
    // Improvement #6: Simplified signature - no parameters
    // ECC Review #2: Added explicit null check for id
    const handleConfirmDelete = useCallback(async () => {
        if (!dialogs.selectedGroupForAction?.id || !user || !services?.db) return;

        // Capture group name before deletion for toast message
        // ECC Review: Sanitize name before display for defense-in-depth (#9)
        const groupName = sanitizeInput(dialogs.selectedGroupForAction.name, { maxLength: 100 });

        actions.setIsDeleting(true);
        try {
            await deleteGroupAsOwner(
                services.db,
                user.uid,
                dialogs.selectedGroupForAction.id,
                APP_ID
            );

            actions.closeDeleteDialog();
            refetchGroups();
            refetchInvitations();

            onShowToast?.(
                t('groupDeletedSuccess', { name: groupName }) ||
                    (lang === 'es'
                        ? `Grupo "${groupName}" eliminado`
                        : `Group "${groupName}" deleted`),
                'success'
            );
        } catch (err: unknown) {
            // Error is handled inside DeleteGroupDialog - just log
            if (import.meta.env.DEV) {
                console.error('[GruposView] Delete group failed:', err);
            }
            // Don't close dialog - let user retry. Re-throw for DeleteGroupDialog to display error
            throw err;
        } finally {
            actions.setIsDeleting(false);
        }
    }, [dialogs.selectedGroupForAction, user, services?.db, actions, refetchGroups, refetchInvitations, onShowToast, t, lang]);

    // ECC Review #2: Extracted inline onClose to named callback for consistency
    const handleCloseDeleteDialog = useCallback(() => {
        if (dialogs.isDeleting) return;
        actions.closeDeleteDialog();
    }, [dialogs.isDeleting, actions]);

    // ECC Review #3: Extracted inline onClose to named callback for consistency
    const handleCloseLeaveDialog = useCallback(() => {
        if (dialogs.isLeaving) return;
        actions.closeLeaveDialog();
    }, [dialogs.isLeaving, actions]);

    // Close handlers for owner warning
    // TD-7d-1: Updated to use actions from useGroupDialogs
    const handleOwnerWarningManageMembers = useCallback(() => {
        actions.closeOwnerWarning();
        if (dialogs.selectedGroupForAction) {
            handleOpenTransferSelector(dialogs.selectedGroupForAction);
        }
    }, [dialogs.selectedGroupForAction, actions, handleOpenTransferSelector]);

    // Story 14d-v2-1-7e: Updated to open delete dialog
    const handleOwnerWarningDeleteGroup = useCallback(() => {
        actions.closeOwnerWarning();
        // Story 14d-v2-1-7e: Open delete dialog with the group from owner warning
        if (dialogs.selectedGroupForAction) {
            actions.openDeleteDialog(dialogs.selectedGroupForAction);
        }
    }, [actions, dialogs.selectedGroupForAction]);

    // =========================================================================
    // Story 14d-v2-1-7g: Edit Group Handlers
    // =========================================================================

    // Edit group mutation
    const {
        mutateAsync: updateGroupAsync,
        isPending: isUpdatingGroup,
    } = useUpdateGroup(user, services);

    // Handle edit group save
    const handleEditSave = useCallback(async (input: EditGroupDialogInput) => {
        if (!dialogs.editingGroup?.id) return;

        try {
            await updateGroupAsync({
                groupId: dialogs.editingGroup.id,
                name: input.name,
                icon: input.icon,
                color: input.color,
            });
            actions.closeEditDialog();
            onShowToast?.(
                t('groupUpdatedSuccess') ||
                    (lang === 'es'
                        ? 'Grupo actualizado'
                        : 'Group updated'),
                'success'
            );
        } catch (err) {
            // ECC Review Fix (M3): Show error toast for user feedback
            if (import.meta.env.DEV) {
                console.error('[GruposView] Update group failed:', err);
            }
            onShowToast?.(
                t('groupUpdateError') ||
                    (lang === 'es'
                        ? 'Error al actualizar el grupo'
                        : 'Error updating group'),
                'error'
            );
            // Don't close dialog - let user retry
        }
    }, [dialogs.editingGroup?.id, updateGroupAsync, actions, onShowToast, t, lang]);

    // Handle edit dialog close
    const handleCloseEditDialog = useCallback(() => {
        if (isUpdatingGroup) return;
        actions.closeEditDialog();
    }, [isUpdatingGroup, actions]);

    // =========================================================================
    // Story 14d-v2-1-11c: Transaction Sharing Toggle Handlers
    // =========================================================================

    // Toggle pending state
    const [isTogglePending, setIsTogglePending] = useState(false);

    // Handle transaction sharing toggle
    const handleToggleTransactionSharing = useCallback(async (enabled: boolean) => {
        if (!dialogs.editingGroup?.id || !user?.uid || !services?.db) return;

        setIsTogglePending(true);
        try {
            await updateTransactionSharingEnabled(
                services.db,
                dialogs.editingGroup.id,
                user.uid,
                enabled
            );
            // Refetch groups to update cached data
            refetchGroups();
            onShowToast?.(
                enabled
                    ? (t('transactionSharingEnabled') || (lang === 'es' ? 'Compartir transacciones habilitado' : 'Transaction sharing enabled'))
                    : (t('transactionSharingDisabled') || (lang === 'es' ? 'Compartir transacciones deshabilitado' : 'Transaction sharing disabled')),
                'success'
            );
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('[GruposView] Toggle transaction sharing failed:', err);
            }
            onShowToast?.(
                t('transactionSharingError') ||
                    (lang === 'es'
                        ? 'Error al actualizar configuración. Intenta de nuevo.'
                        : 'Failed to update setting. Please try again.'),
                'error'
            );
            // Re-throw to trigger optimistic rollback in TransactionSharingToggle
            throw err;
        } finally {
            setIsTogglePending(false);
        }
    }, [dialogs.editingGroup?.id, user?.uid, services?.db, refetchGroups, onShowToast, t, lang]);

    // Check if current user is owner of the editing group
    const isOwnerOfEditingGroup = dialogs.editingGroup?.ownerId === user?.uid;

    // =========================================================================
    // Story 14d-v2-1-13+14: Transaction Sharing Opt-In Flow
    // When accepting an invitation to a group with transactionSharingEnabled,
    // the opt-in dialog appears BEFORE completing the join.
    // =========================================================================

    const [optInInvitation, setOptInInvitation] = useState<PendingInvitation | null>(null);
    const [optInGroup, setOptInGroup] = useState<SharedGroup | null>(null);
    const [isOptInDialogOpen, setIsOptInDialogOpen] = useState(false);

    // Called by AcceptInvitationDialog.onOpenOptIn when group has transactionSharingEnabled
    // Story 14d-v2-1-14-polish: Added offline check (AC4) and analytics tracking (AC5)
    const handleOpenOptIn = useCallback((invitation: PendingInvitation, group: SharedGroup) => {
        if (!isOnline) {
            showOfflineError();
            return;
        }
        actions.closeAcceptDialog();
        setOptInInvitation(invitation);
        setOptInGroup(group);
        setIsOptInDialogOpen(true);
        // AC5: Track opt-in dialog impression
        trackEvent('group_join_optin_shown', {
            groupId: group.id || '',
            transactionSharingEnabled: true,
        });
    }, [actions, isOnline, showOfflineError]);

    // Called when user confirms join in opt-in dialog (with sharing preference)
    // Story 14d-v2-1-14-polish: Calls service directly to show context-specific toasts (AC1, AC2)
    // and tracks analytics (AC6). Bypasses hook's generic "Joined!" toast.
    // Note: Parallel code path to leaveTransferHandlers.handleAcceptInvitation — keep in sync.
    const handleOptInJoin = useCallback(async (shareMyTransactions: boolean, explicitChoice?: 'yes' | 'no' | 'dismiss') => {
        const choice = explicitChoice ?? (shareMyTransactions ? 'yes' : 'no');
        if (!optInInvitation || !user || !services?.db) return;
        actions.setIsAccepting(true);
        try {
            const userProfile: MemberProfile = {
                displayName: user.displayName || undefined,
                email: user.email || undefined,
                photoURL: user.photoURL || undefined,
            };
            await handleAcceptInvitationService(
                services.db,
                optInInvitation,
                user.uid,
                userProfile,
                APP_ID,
                shareMyTransactions
            );

            // Security review H-1: Re-sanitize groupName before toast interpolation
            const rawGroupName = optInGroup?.name || optInInvitation.groupName;
            const groupName = sanitizeInput(rawGroupName, { maxLength: 100 });

            // AC6: Track user choice
            trackEvent('group_join_optin_choice', {
                groupId: optInGroup?.id || '',
                choice,
            });

            setIsOptInDialogOpen(false);
            setOptInInvitation(null);
            setOptInGroup(null);

            refetchGroups();
            refetchInvitations();

            // AC1/AC2/AC3: Context-specific toast based on choice
            const toastKey = OPT_IN_TOAST_KEYS[choice];
            const toastMessage = t(toastKey, { groupName });
            if (toastMessage) {
                onShowToast?.(toastMessage, 'success');
            }
        } catch (err: unknown) {
            if (import.meta.env.DEV) {
                console.error('[GruposView] Opt-in join failed:', err);
            }
            onShowToast?.(
                t('errorAcceptingInvitation') ||
                    (lang === 'es'
                        ? 'Error al aceptar la invitación'
                        : 'Error accepting invitation'),
                'error'
            );
        } finally {
            actions.setIsAccepting(false);
        }
    }, [optInInvitation, optInGroup, user, services?.db, actions, refetchGroups, refetchInvitations, onShowToast, t, lang]);

    // Called when user cancels opt-in dialog via Cancel button (returns to accept dialog)
    const handleOptInCancel = useCallback(() => {
        setIsOptInDialogOpen(false);
        if (optInInvitation) {
            actions.openAcceptDialog(optInInvitation);
        }
        setOptInInvitation(null);
        setOptInGroup(null);
    }, [optInInvitation, actions]);

    // Story 14d-v2-1-14-polish AC3: Dismiss (backdrop/close/escape) joins with defaults
    const handleOptInDismiss = useCallback(() => {
        handleOptInJoin(false, 'dismiss');
    }, [handleOptInJoin]);

    // Translations
    const texts = {
        title: t('sharedGroups') || (lang === 'es' ? 'Grupos Compartidos' : 'Shared Groups'),
        description: t('sharedGroupsDescription') || (lang === 'es'
            ? 'Comparte gastos con familia o compañeros de cuarto'
            : 'Share expenses with family or roommates'),
        createGroup: t('createGroup') || (lang === 'es' ? 'Crear Grupo' : 'Create Group'),
        noGroups: t('noGroupsYet') || (lang === 'es'
            ? 'Aún no tienes grupos'
            : 'No groups yet'),
        noGroupsDescription: t('noGroupsDescription') || (lang === 'es'
            ? 'Crea tu primer grupo para empezar a compartir gastos'
            : 'Create your first group to start sharing expenses'),
        loading: t('loading') || (lang === 'es' ? 'Cargando...' : 'Loading...'),
    };

    // Show loading state
    if (groupsLoading) {
        return (
            <div
                className="min-h-[40vh] flex flex-col items-center justify-center p-6"
                data-testid="grupos-view-loading"
            >
                <Loader2
                    className="w-8 h-8 animate-spin mb-4"
                    style={{ color: 'var(--primary)' }}
                />
                <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {texts.loading}
                </p>
            </div>
        );
    }

    // Show empty state with create button
    const hasGroups = groups && groups.length > 0;

    return (
        <div className="p-4" data-testid="grupos-view">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {/* Story 14d-v2-1-6c-1: Icon with badge (AC #1) */}
                    <div className="relative">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            <Users
                                className="w-5 h-5"
                                style={{ color: 'var(--primary)' }}
                            />
                        </div>
                        {/* Pending invitations badge */}
                        {hasInvitations && (
                            <span
                                className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
                                style={{ backgroundColor: 'var(--notification-amber-badge, #f59e0b)' }}
                                data-testid="pending-invitations-badge"
                            >
                                {pendingInvitationsCount > 9 ? '9+' : pendingInvitationsCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2
                            className="text-lg font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {texts.title}
                        </h2>
                        <p
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {texts.description}
                        </p>
                    </div>
                </div>

                {/* Create button - circular with bold plus */}
                {/* TD-7d-1: Updated to use actions from useGroupDialogs */}
                <button
                    onClick={actions.openCreateDialog}
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: 'var(--primary)', aspectRatio: '1 / 1' }}
                    data-testid="create-group-btn"
                    title={texts.createGroup}
                    aria-label={texts.createGroup}
                >
                    <Plus size={20} strokeWidth={3} />
                </button>
            </div>

            {/* Story 14d-v2-1-6c-1: Pending Invitations Section (AC #2) */}
            {hasInvitations && user && (
                <PendingInvitationsSection
                    invitations={pendingInvitations}
                    userId={user.uid}
                    appId={APP_ID}
                    t={t}
                    theme={theme}
                    lang={lang}
                    onInvitationHandled={handleInvitationHandled}
                    onShowToast={onShowToast}
                />
            )}

            {/* Join by Code - Manual share code entry */}
            <JoinGroupByCode
                t={t}
                lang={lang}
                onInvitationFound={handleInvitationFoundByCode}
                onShowToast={onShowToast}
            />

            {/* Content */}
            {hasGroups ? (
                // Groups list - will be fully implemented in Story 14d-v2-1-10b
                <div
                    className="space-y-3"
                    data-testid="grupos-list"
                >
                    {groups.map((group) => {
                        const isOwner = group.ownerId === user?.uid;
                        return (
                            <div
                                key={group.id}
                                className="p-4 rounded-xl border"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderColor: 'var(--border-light)',
                                }}
                                data-testid={`group-card-${group.id}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                                        style={{
                                            backgroundColor: group.color || 'var(--primary)',
                                            fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                                        }}
                                    >
                                        {group.icon || '👥'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="font-medium truncate"
                                            style={{ color: 'var(--text-primary)' }}
                                            data-testid={`group-name-${group.id}`}
                                        >
                                            {group.name}
                                        </p>
                                        <p
                                            className="text-xs"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            {group.members?.length || 1} {lang === 'es' ? 'miembros' : 'members'}
                                        </p>
                                    </div>
                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1">
                                        {/* Invite button - only visible to owner */}
                                        {isOwner && (
                                            <button
                                                onClick={() => handleOpenInviteDialog(group)}
                                                className="p-2.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
                                                style={{ backgroundColor: 'var(--primary)' }}
                                                title={t('inviteMembers') || (lang === 'es' ? 'Invitar Miembros' : 'Invite Members')}
                                                aria-label={`${t('inviteMembers') || 'Invite members'} to ${group.name}`}
                                                data-testid={`invite-btn-${group.id}`}
                                            >
                                                <UserPlus size={18} />
                                            </button>
                                        )}

                                        {/* Transfer button - only for owners with >1 members */}
                                        {isOwner && (group.members?.length || 1) > 1 && (
                                            <button
                                                onClick={() => handleOpenTransferSelector(group)}
                                                className="p-2.5 rounded-xl transition-all hover:bg-opacity-20 active:scale-95"
                                                style={{ backgroundColor: 'var(--info-bg, rgba(59, 130, 246, 0.1))', color: 'var(--info, #3b82f6)' }}
                                                title={t('transferOwnership') || (lang === 'es' ? 'Transferir propiedad' : 'Transfer ownership')}
                                                aria-label={`${t('transferOwnership') || 'Transfer ownership'} for ${group.name}`}
                                                data-testid={`transfer-btn-${group.id}`}
                                            >
                                                <ArrowRightLeft size={18} />
                                            </button>
                                        )}

                                        {/* Story 14d-v2-1-7g: Edit button - only for owners */}
                                        {isOwner && (
                                            <button
                                                onClick={() => actions.openEditDialog(group)}
                                                className="p-2.5 rounded-xl transition-all hover:bg-opacity-20 active:scale-95"
                                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                                                title={t('editGroup') || (lang === 'es' ? 'Editar grupo' : 'Edit group')}
                                                aria-label={`${t('editGroup') || 'Edit group'} ${group.name}`}
                                                data-testid={`edit-btn-${group.id}`}
                                            >
                                                <Settings size={18} />
                                            </button>
                                        )}

                                        {/* Leave button - always visible */}
                                        <button
                                            onClick={() => handleLeaveClick(group)}
                                            className="p-2.5 rounded-xl transition-all hover:bg-opacity-20 active:scale-95"
                                            style={{ backgroundColor: 'var(--error-bg, rgba(239, 68, 68, 0.1))', color: 'var(--error, #ef4444)' }}
                                            title={t('leaveGroup') || (lang === 'es' ? 'Salir del grupo' : 'Leave group')}
                                            aria-label={`${t('leaveGroup') || 'Leave group'} ${group.name}`}
                                            data-testid={`leave-btn-${group.id}`}
                                        >
                                            <LogOut size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Empty state
                <div
                    className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border border-dashed"
                    style={{ borderColor: 'var(--border-light)' }}
                    data-testid="grupos-empty-state"
                >
                    <div
                        className="text-5xl mb-4"
                        aria-hidden="true"
                    >
                        🏠
                    </div>
                    <h3
                        className="text-lg font-semibold mb-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {texts.noGroups}
                    </h3>
                    <p
                        className="text-sm max-w-xs mb-6"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {texts.noGroupsDescription}
                    </p>
                    {/* TD-7d-1: Updated to use actions from useGroupDialogs */}
                    <button
                        onClick={actions.openCreateDialog}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium shadow-md transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: 'var(--primary)' }}
                        data-testid="create-group-btn-empty"
                    >
                        <Plus size={18} />
                        {texts.createGroup}
                    </button>
                </div>
            )}

            {/* FAB long-press future enhancement note:
             * Story 14d-v2-1-4c-1 Task 2.3: Consider FAB long-press option for quick group creation
             * This would allow users to long-press the FAB on any screen to quickly create a group.
             * Deferred to a future enhancement - current entry point is via Settings > Grupos.
             */}

            {/* Create Group Dialog */}
            {/* TD-7d-1: Updated to use dialogs state from useGroupDialogs */}
            <CreateGroupDialog
                open={dialogs.isCreateDialogOpen}
                onClose={handleCloseDialog}
                onCreate={handleCreate}
                isPending={isCreating || limitLoading}
                t={t}
                lang={lang}
                // Story 14d-v2-1-4c-2: BC-1 Limit Enforcement (AC #1)
                canCreate={canCreate}
                groupCount={groupCount ?? 0}
                maxGroups={SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS}
                // Story 14d-v2-1-4c-2: Error Handling (AC #3)
                hasError={!!dialogs.createError}
                errorMessage={dialogs.createError ?? undefined}
                onResetError={handleResetError}
            />

            {/* Invite Members Dialog (Story 14d-v2-1-5c) - Share link/code only */}
            {/* TD-7d-1: Updated to use dialogs state from useGroupDialogs */}
            {dialogs.selectedGroup && (
                <InviteMembersDialog
                    open={dialogs.isInviteDialogOpen}
                    onClose={handleCloseInviteDialog}
                    shareCode={dialogs.selectedGroup.shareCode}
                    groupName={dialogs.selectedGroup.name}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Accept Invitation Dialog (Story 14d-v2-1-6c-2) */}
            {/* TD-7d-1: Updated to use dialogs state from useGroupDialogs */}
            {/* Story 14d-v2-1-13+14: Added onOpenOptIn for transaction sharing opt-in flow */}
            <AcceptInvitationDialog
                open={dialogs.isAcceptDialogOpen}
                invitation={dialogs.selectedInvitation}
                onClose={handleCloseAcceptDialog}
                onAccept={handleAcceptInvitation}
                onDecline={handleDeclineInvitation}
                onOpenOptIn={handleOpenOptIn}
                isPending={dialogs.isAccepting}
                t={t}
                lang={lang}
            />

            {/* Story 14d-v2-1-13+14: Transaction Sharing Opt-In Dialog */}
            {/* Story 14d-v2-1-14-polish: Added onDismiss for AC3 (dismiss = join with defaults) */}
            <TransactionSharingOptInDialog
                open={isOptInDialogOpen}
                groupName={optInGroup?.name || ''}
                groupColor={optInGroup?.color || DEFAULT_GROUP_COLOR}
                groupIcon={optInGroup?.icon}
                onJoin={handleOptInJoin}
                onCancel={handleOptInCancel}
                onDismiss={handleOptInDismiss}
                isPending={dialogs.isAccepting}
                t={t}
                lang={lang}
            />

            {/* Story 14d-v2-1-7d: Leave Group Dialog */}
            {/* TD-7d-1: Updated to use dialogs state from useGroupDialogs */}
            {dialogs.selectedGroupForAction && (
                <LeaveGroupDialog
                    isOpen={dialogs.isLeaveDialogOpen}
                    groupName={dialogs.selectedGroupForAction.name}
                    groupColor={dialogs.selectedGroupForAction.color || DEFAULT_GROUP_COLOR}
                    groupIcon={dialogs.selectedGroupForAction.icon}
                    onConfirm={handleConfirmLeave}
                    onClose={handleCloseLeaveDialog}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Story 14d-v2-1-7d: Owner Leave Warning Dialog */}
            {/* TD-7d-1: Updated to use dialogs state from useGroupDialogs */}
            {dialogs.selectedGroupForAction && (
                <OwnerLeaveWarningDialog
                    isOpen={dialogs.isOwnerWarningOpen}
                    groupName={dialogs.selectedGroupForAction.name}
                    groupColor={dialogs.selectedGroupForAction.color || DEFAULT_GROUP_COLOR}
                    groupIcon={dialogs.selectedGroupForAction.icon}
                    onManageMembers={handleOwnerWarningManageMembers}
                    onDeleteGroup={handleOwnerWarningDeleteGroup}
                    onClose={actions.closeOwnerWarning}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Story 14d-v2-1-7d: Member Selector Dialog (for transfer) */}
            {/* ECC Review Session 3: Proper null check for user before rendering */}
            {/* TD-7d-1: Updated to use dialogs state from useGroupDialogs */}
            {dialogs.selectedGroupForAction && user && (
                <MemberSelectorDialog
                    isOpen={dialogs.isMemberSelectorOpen}
                    group={dialogs.selectedGroupForAction}
                    currentUserId={user.uid}
                    onSelectMember={handleMemberSelected}
                    onClose={() => {
                        actions.closeMemberSelector();
                        // Note: closeMemberSelector keeps selectedGroupForAction for the transfer flow
                        // We need to also reset it when closing via the X button
                        actions.closeTransferDialog();
                    }}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Story 14d-v2-1-7d: Transfer Ownership Dialog */}
            {/* TD-7d-1: Updated to use dialogs state from useGroupDialogs */}
            {dialogs.selectedGroupForAction && dialogs.selectedMemberForTransfer && (
                <TransferOwnershipDialog
                    isOpen={dialogs.isTransferDialogOpen}
                    groupName={dialogs.selectedGroupForAction.name}
                    memberName={dialogs.selectedMemberName}
                    onConfirm={handleConfirmTransfer}
                    onClose={() => {
                        if (!dialogs.isTransferring) {
                            actions.closeTransferDialog();
                        }
                    }}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Story 14d-v2-1-7e: Delete Group Dialog */}
            {/* ECC Review #2: Updated to use named handler for consistency */}
            {dialogs.selectedGroupForAction && (
                <DeleteGroupDialog
                    isOpen={dialogs.isDeleteDialogOpen}
                    groupName={dialogs.selectedGroupForAction.name}
                    groupColor={dialogs.selectedGroupForAction.color || DEFAULT_GROUP_COLOR}
                    groupIcon={dialogs.selectedGroupForAction.icon}
                    memberCount={dialogs.selectedGroupForAction.members?.length || 1}
                    onConfirm={handleConfirmDelete}
                    onClose={handleCloseDeleteDialog}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Story 14d-v2-1-7g: Edit Group Dialog */}
            {/* Story 14d-v2-1-11c: Added transaction sharing toggle props */}
            <EditGroupDialog
                open={dialogs.isEditDialogOpen}
                group={dialogs.editingGroup}
                onClose={handleCloseEditDialog}
                onSave={handleEditSave}
                isPending={isUpdatingGroup}
                t={t}
                lang={lang}
                isOwner={isOwnerOfEditingGroup}
                onToggleTransactionSharing={handleToggleTransactionSharing}
                isTogglePending={isTogglePending}
                onShowToast={onShowToast}
            />
        </div>
    );
};

export default GruposView;
