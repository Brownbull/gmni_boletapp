/** useGruposViewHandlers - TD-CONSOLIDATED-2: Handler logic extracted from GruposView */

import { useCallback, useState } from 'react';
import type { User } from 'firebase/auth';
import type { Services } from '@/contexts/AuthContext';
import { APP_ID } from '@/config/constants';
import { trackEvent } from '@/services/analyticsService';
import { sanitizeInput } from '@/utils/sanitize';
import {
    deleteGroupAsOwner,
    useUpdateGroup,
    updateTransactionSharingEnabled,
    handleAcceptInvitationService,
} from '@/features/shared-groups';
import type {
    CreateGroupInput,
    LeaveMode,
    EditGroupDialogInput,
    GroupDialogsState,
    GroupDialogsActions,
    UseLeaveTransferFlowReturn,
} from '@/features/shared-groups';
import type { SharedGroup, PendingInvitation, MemberProfile } from '@/types/sharedGroup';

const OPT_IN_TOAST_KEYS: Record<string, string> = {
    yes: 'joinedGroupWithSharing',
    no: 'joinedGroupWithoutSharing',
    dismiss: 'joinedGroupDefault',
};

export interface UseGruposViewHandlersOptions {
    dialogs: GroupDialogsState;
    actions: GroupDialogsActions;
    user: User | null;
    services: Services | null;
    isOnline: boolean;
    leaveTransferHandlers: UseLeaveTransferFlowReturn;
    createGroupAsync: (input: CreateGroupInput) => Promise<SharedGroup>;
    isCreating: boolean;
    resetCreate: () => void;
    refetchGroups: () => void;
    refetchInvitations: () => void;
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    lang: 'en' | 'es';
}

export function useGruposViewHandlers(options: UseGruposViewHandlersOptions) {
    const {
        dialogs, actions, user, services, isOnline,
        leaveTransferHandlers, createGroupAsync, isCreating,
        resetCreate, refetchGroups, refetchInvitations,
        onShowToast, t, lang,
    } = options;

    // Edit Group (Story 14d-v2-1-7g)
    const { mutateAsync: updateGroupAsync, isPending: isUpdatingGroup } = useUpdateGroup(user, services);

    // Transaction Sharing Toggle (Story 14d-v2-1-11c)
    const [isTogglePending, setIsTogglePending] = useState(false);

    // Transaction Sharing Opt-In State (Story 14d-v2-1-13+14)
    const [optInInvitation, setOptInInvitation] = useState<PendingInvitation | null>(null);
    const [optInGroup, setOptInGroup] = useState<SharedGroup | null>(null);
    const [isOptInDialogOpen, setIsOptInDialogOpen] = useState(false);

    const isOwnerOfEditingGroup = dialogs.editingGroup?.ownerId === user?.uid;

    // Create Group Handlers
    const handleCreate = useCallback(async (input: CreateGroupInput) => {
        actions.resetCreateError();
        try {
            const newGroup = await createGroupAsync({
                name: input.name,
                transactionSharingEnabled: input.transactionSharingEnabled,
            });
            actions.closeCreateDialog();
            resetCreate();
            const safeName = sanitizeInput(newGroup.name, { maxLength: 100 });
            onShowToast?.(
                t('groupCreatedSuccess') ||
                    (lang === 'es' ? `Grupo "${safeName}" creado` : `Group "${safeName}" created`),
                'success'
            );
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '';
            actions.setCreateError(
                errorMessage ||
                    (lang === 'es'
                        ? 'Error al crear el grupo. Intenta de nuevo.'
                        : 'Error creating group. Please try again.')
            );
        }
    }, [createGroupAsync, resetCreate, onShowToast, t, lang, actions]);

    const handleCloseDialog = useCallback(() => {
        if (isCreating) return;
        actions.closeCreateDialog();
        resetCreate();
    }, [isCreating, resetCreate, actions]);

    const handleResetError = useCallback(() => actions.resetCreateError(), [actions]);

    // Invite Dialog Handlers (Story 14d-v2-1-5c)
    const handleOpenInviteDialog = useCallback(
        (group: SharedGroup) => actions.openInviteDialog(group), [actions]
    );
    const handleCloseInviteDialog = useCallback(() => actions.closeInviteDialog(), [actions]);

    // Invitation Handlers (Story 14d-v2-1-6c-1)
    const handleInvitationHandled = useCallback(() => refetchInvitations(), [refetchInvitations]);
    const handleInvitationFoundByCode = useCallback(
        (invitation: PendingInvitation) => actions.openAcceptDialog(invitation), [actions]
    );

    // Accept Invitation Dialog Handlers (Story 14d-v2-1-6c-2)
    const handleCloseAcceptDialog = useCallback(() => {
        if (dialogs.isAccepting) return;
        actions.closeAcceptDialog();
    }, [dialogs.isAccepting, actions]);

    const showOfflineError = useCallback(() => {
        onShowToast?.(
            t('offlineCannotJoinGroup') ||
                (lang === 'es'
                    ? 'Estás sin conexión. Conéctate para unirte a grupos.'
                    : "You're offline. Please connect to join groups."),
            'error'
        );
    }, [onShowToast, t, lang]);

    const handleAcceptInvitation = useCallback(async (invitation: PendingInvitation) => {
        if (!isOnline) { showOfflineError(); return; }
        actions.setIsAccepting(true);
        try {
            const success = await leaveTransferHandlers.handleAcceptInvitation(invitation);
            if (success) actions.closeAcceptDialog();
        } finally {
            actions.setIsAccepting(false);
        }
    }, [actions, leaveTransferHandlers, isOnline, showOfflineError]);

    const handleDeclineInvitation = useCallback(async (invitation: PendingInvitation) => {
        actions.setIsAccepting(true);
        try {
            const success = await leaveTransferHandlers.handleDeclineInvitation(invitation);
            if (success) actions.closeAcceptDialog();
        } finally {
            actions.setIsAccepting(false);
        }
    }, [actions, leaveTransferHandlers]);

    // Leave & Transfer Handlers (Story 14d-v2-1-7d)
    const handleLeaveClick = useCallback((group: SharedGroup) => {
        if (group.ownerId === user?.uid) actions.openOwnerWarning(group);
        else actions.openLeaveDialog(group);
    }, [user?.uid, actions]);

    const handleConfirmLeave = useCallback(async (mode: LeaveMode) => {
        if (!dialogs.selectedGroupForAction) return;
        actions.setIsLeaving(true);
        try {
            const success = await leaveTransferHandlers.handleConfirmLeave(
                dialogs.selectedGroupForAction, mode
            );
            if (success) actions.closeLeaveDialog();
        } finally {
            actions.setIsLeaving(false);
        }
    }, [dialogs.selectedGroupForAction, actions, leaveTransferHandlers]);

    const handleOpenTransferSelector = useCallback(
        (group: SharedGroup) => actions.openMemberSelector(group), [actions]
    );
    const handleMemberSelected = useCallback(
        (memberId: string, memberName: string) => actions.openTransferDialog(memberId, memberName), [actions]
    );

    const handleConfirmTransfer = useCallback(async () => {
        if (!dialogs.selectedGroupForAction || !dialogs.selectedMemberForTransfer) return;
        actions.setIsTransferring(true);
        try {
            const success = await leaveTransferHandlers.handleConfirmTransfer(
                dialogs.selectedGroupForAction,
                dialogs.selectedMemberForTransfer,
                dialogs.selectedMemberName
            );
            if (success) actions.closeTransferDialog();
        } finally {
            actions.setIsTransferring(false);
        }
    }, [dialogs.selectedGroupForAction, dialogs.selectedMemberForTransfer, dialogs.selectedMemberName, actions, leaveTransferHandlers]);

    // Delete Group Handler (Story 14d-v2-1-7e)
    const handleConfirmDelete = useCallback(async () => {
        if (!dialogs.selectedGroupForAction?.id || !user || !services?.db) return;
        const groupName = sanitizeInput(dialogs.selectedGroupForAction.name, { maxLength: 100 });
        actions.setIsDeleting(true);
        try {
            await deleteGroupAsOwner(services.db, user.uid, dialogs.selectedGroupForAction.id, APP_ID);
            actions.closeDeleteDialog();
            refetchGroups();
            refetchInvitations();
            onShowToast?.(
                t('groupDeletedSuccess', { name: groupName }) ||
                    (lang === 'es' ? `Grupo "${groupName}" eliminado` : `Group "${groupName}" deleted`),
                'success'
            );
        } catch (err: unknown) {
            if (import.meta.env.DEV) console.error('[GruposView] Delete group failed:', err);
            throw err;
        } finally {
            actions.setIsDeleting(false);
        }
    }, [dialogs.selectedGroupForAction, user, services?.db, actions, refetchGroups, refetchInvitations, onShowToast, t, lang]);

    const handleCloseDeleteDialog = useCallback(() => {
        if (dialogs.isDeleting) return;
        actions.closeDeleteDialog();
    }, [dialogs.isDeleting, actions]);

    const handleCloseLeaveDialog = useCallback(() => {
        if (dialogs.isLeaving) return;
        actions.closeLeaveDialog();
    }, [dialogs.isLeaving, actions]);

    const handleOwnerWarningManageMembers = useCallback(() => {
        actions.closeOwnerWarning();
        if (dialogs.selectedGroupForAction) handleOpenTransferSelector(dialogs.selectedGroupForAction);
    }, [dialogs.selectedGroupForAction, actions, handleOpenTransferSelector]);

    const handleOwnerWarningDeleteGroup = useCallback(() => {
        actions.closeOwnerWarning();
        if (dialogs.selectedGroupForAction) actions.openDeleteDialog(dialogs.selectedGroupForAction);
    }, [actions, dialogs.selectedGroupForAction]);

    // Edit Group Handlers (Story 14d-v2-1-7g)
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
                t('groupUpdatedSuccess') || (lang === 'es' ? 'Grupo actualizado' : 'Group updated'),
                'success'
            );
        } catch (err) {
            if (import.meta.env.DEV) console.error('[GruposView] Update group failed:', err);
            onShowToast?.(
                t('groupUpdateError') ||
                    (lang === 'es' ? 'Error al actualizar el grupo' : 'Error updating group'),
                'error'
            );
        }
    }, [dialogs.editingGroup?.id, updateGroupAsync, actions, onShowToast, t, lang]);

    const handleCloseEditDialog = useCallback(() => {
        if (isUpdatingGroup) return;
        actions.closeEditDialog();
    }, [isUpdatingGroup, actions]);

    // Transaction Sharing Toggle (Story 14d-v2-1-11c)
    const handleToggleTransactionSharing = useCallback(async (enabled: boolean) => {
        if (!dialogs.editingGroup?.id || !user?.uid || !services?.db) return;
        setIsTogglePending(true);
        try {
            await updateTransactionSharingEnabled(services.db, dialogs.editingGroup.id, user.uid, enabled);
            refetchGroups();
            onShowToast?.(
                enabled
                    ? (t('transactionSharingEnabled') || (lang === 'es' ? 'Compartir transacciones habilitado' : 'Transaction sharing enabled'))
                    : (t('transactionSharingDisabled') || (lang === 'es' ? 'Compartir transacciones deshabilitado' : 'Transaction sharing disabled')),
                'success'
            );
        } catch (err) {
            if (import.meta.env.DEV) console.error('[GruposView] Toggle transaction sharing failed:', err);
            onShowToast?.(
                t('transactionSharingError') ||
                    (lang === 'es'
                        ? 'Error al actualizar configuración. Intenta de nuevo.'
                        : 'Failed to update setting. Please try again.'),
                'error'
            );
            throw err;
        } finally {
            setIsTogglePending(false);
        }
    }, [dialogs.editingGroup?.id, user?.uid, services?.db, refetchGroups, onShowToast, t, lang]);

    // Transaction Sharing Opt-In Flow (Story 14d-v2-1-13+14)
    // Note: handleAcceptInvitation and handleOptInJoin are intentionally separate code paths
    // (generic toast vs context-specific toast per story 14d-v2-1-14-polish AC1/AC2/AC3).
    const handleOpenOptIn = useCallback((invitation: PendingInvitation, group: SharedGroup) => {
        if (!isOnline) { showOfflineError(); return; }
        actions.closeAcceptDialog();
        setOptInInvitation(invitation);
        setOptInGroup(group);
        setIsOptInDialogOpen(true);
        trackEvent('group_join_optin_shown', { groupId: group.id || '', transactionSharingEnabled: true });
    }, [actions, isOnline, showOfflineError]);

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
                services.db, optInInvitation, user.uid, userProfile, APP_ID, shareMyTransactions
            );
            const rawGroupName = optInGroup?.name || optInInvitation.groupName;
            const groupName = sanitizeInput(rawGroupName, { maxLength: 100 });
            trackEvent('group_join_optin_choice', { groupId: optInGroup?.id || '', choice });
            setIsOptInDialogOpen(false);
            setOptInInvitation(null);
            setOptInGroup(null);
            refetchGroups();
            refetchInvitations();
            const toastMessage = t(OPT_IN_TOAST_KEYS[choice], { groupName });
            if (toastMessage) onShowToast?.(toastMessage, 'success');
        } catch (err: unknown) {
            if (import.meta.env.DEV) console.error('[GruposView] Opt-in join failed:', err);
            onShowToast?.(
                t('errorAcceptingInvitation') ||
                    (lang === 'es' ? 'Error al aceptar la invitación' : 'Error accepting invitation'),
                'error'
            );
        } finally {
            actions.setIsAccepting(false);
        }
    }, [optInInvitation, optInGroup, user, services?.db, actions, refetchGroups, refetchInvitations, onShowToast, t, lang]);

    const handleOptInCancel = useCallback(() => {
        setIsOptInDialogOpen(false);
        if (optInInvitation) actions.openAcceptDialog(optInInvitation);
        setOptInInvitation(null);
        setOptInGroup(null);
    }, [optInInvitation, actions]);

    const handleOptInDismiss = useCallback(() => handleOptInJoin(false, 'dismiss'), [handleOptInJoin]);

    return {
        handleCreate, handleCloseDialog, handleResetError,
        handleOpenInviteDialog, handleCloseInviteDialog,
        handleInvitationHandled, handleInvitationFoundByCode,
        handleCloseAcceptDialog, handleAcceptInvitation, handleDeclineInvitation,
        handleLeaveClick, handleConfirmLeave,
        handleOpenTransferSelector, handleMemberSelected, handleConfirmTransfer,
        handleConfirmDelete, handleCloseDeleteDialog, handleCloseLeaveDialog,
        handleOwnerWarningManageMembers, handleOwnerWarningDeleteGroup,
        handleEditSave, handleCloseEditDialog, isUpdatingGroup,
        handleToggleTransactionSharing, isTogglePending, isOwnerOfEditingGroup,
        handleOpenOptIn, handleOptInJoin, handleOptInCancel, handleOptInDismiss,
        isOptInDialogOpen, optInGroup,
    };
}
