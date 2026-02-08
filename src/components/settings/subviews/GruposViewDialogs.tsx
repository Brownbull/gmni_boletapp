/**
 * GruposViewDialogs - Dialog rendering extracted from GruposView
 *
 * TD-CONSOLIDATED-2: Pure presentational component for all 10 group dialogs.
 * No hooks, no state, no side effects — just JSX wiring.
 */

import React from 'react';
import type { User } from 'firebase/auth';
import {
    CreateGroupDialog,
    InviteMembersDialog,
    AcceptInvitationDialog,
    LeaveGroupDialog,
    OwnerLeaveWarningDialog,
    MemberSelectorDialog,
    TransferOwnershipDialog,
    DeleteGroupDialog,
    EditGroupDialog,
    TransactionSharingOptInDialog,
    SHARED_GROUP_LIMITS,
} from '@/features/shared-groups';
import type { GroupDialogsState, GroupDialogsActions } from '@/features/shared-groups';
import type { useGruposViewHandlers } from './useGruposViewHandlers';

// =============================================================================
// Types
// =============================================================================

export interface GruposViewDialogsProps {
    dialogs: GroupDialogsState;
    handlers: ReturnType<typeof useGruposViewHandlers>;
    actions: GroupDialogsActions;
    user: User | null;
    isCreating: boolean;
    limitLoading: boolean;
    canCreate: boolean;
    groupCount: number;
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    lang: 'en' | 'es';
}

// =============================================================================
// Component
// =============================================================================

export const GruposViewDialogs: React.FC<GruposViewDialogsProps> = ({
    dialogs,
    handlers,
    actions,
    user,
    isCreating,
    limitLoading,
    canCreate,
    groupCount,
    onShowToast,
    t,
    lang,
}) => {
    return (
        <>
            {/* Create Group Dialog */}
            <CreateGroupDialog
                open={dialogs.isCreateDialogOpen}
                onClose={handlers.handleCloseDialog}
                onCreate={handlers.handleCreate}
                isPending={isCreating || limitLoading}
                t={t}
                lang={lang}
                canCreate={canCreate}
                groupCount={groupCount}
                maxGroups={SHARED_GROUP_LIMITS.MAX_MEMBER_OF_GROUPS}
                hasError={!!dialogs.createError}
                errorMessage={dialogs.createError ?? undefined}
                onResetError={handlers.handleResetError}
            />

            {/* Invite Members Dialog (Story 14d-v2-1-5c) */}
            {dialogs.selectedGroup && (
                <InviteMembersDialog
                    open={dialogs.isInviteDialogOpen}
                    onClose={handlers.handleCloseInviteDialog}
                    shareCode={dialogs.selectedGroup.shareCode}
                    groupName={dialogs.selectedGroup.name}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Accept Invitation Dialog (Story 14d-v2-1-6c-2) */}
            {/* Story 14d-v2-1-13+14: Added onOpenOptIn for transaction sharing opt-in flow */}
            <AcceptInvitationDialog
                open={dialogs.isAcceptDialogOpen}
                invitation={dialogs.selectedInvitation}
                onClose={handlers.handleCloseAcceptDialog}
                onAccept={handlers.handleAcceptInvitation}
                onDecline={handlers.handleDeclineInvitation}
                onOpenOptIn={handlers.handleOpenOptIn}
                isPending={dialogs.isAccepting}
                t={t}
                lang={lang}
            />

            {/* Story 14d-v2-1-13+14: Transaction Sharing Opt-In Dialog */}
            {/* Story 14d-v2-1-14-polish: Added onDismiss for AC3 (dismiss = join with defaults) */}
            <TransactionSharingOptInDialog
                open={handlers.isOptInDialogOpen}
                groupName={handlers.optInGroup?.name || ''}
                groupColor={handlers.optInGroup?.color ?? ''}
                groupIcon={handlers.optInGroup?.icon}
                onJoin={handlers.handleOptInJoin}
                onCancel={handlers.handleOptInCancel}
                onDismiss={handlers.handleOptInDismiss}
                isPending={dialogs.isAccepting}
                t={t}
                lang={lang}
            />

            {/* Story 14d-v2-1-7d: Leave Group Dialog */}
            {dialogs.selectedGroupForAction && (
                <LeaveGroupDialog
                    isOpen={dialogs.isLeaveDialogOpen}
                    groupName={dialogs.selectedGroupForAction.name}
                    groupColor={dialogs.selectedGroupForAction.color}
                    groupIcon={dialogs.selectedGroupForAction.icon}
                    onConfirm={handlers.handleConfirmLeave}
                    onClose={handlers.handleCloseLeaveDialog}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Story 14d-v2-1-7d: Owner Leave Warning Dialog */}
            {dialogs.selectedGroupForAction && (
                <OwnerLeaveWarningDialog
                    isOpen={dialogs.isOwnerWarningOpen}
                    groupName={dialogs.selectedGroupForAction.name}
                    groupColor={dialogs.selectedGroupForAction.color}
                    groupIcon={dialogs.selectedGroupForAction.icon}
                    onManageMembers={handlers.handleOwnerWarningManageMembers}
                    onDeleteGroup={handlers.handleOwnerWarningDeleteGroup}
                    onClose={actions.closeOwnerWarning}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Story 14d-v2-1-7d: Member Selector Dialog (for transfer) */}
            {dialogs.selectedGroupForAction && user && (
                <MemberSelectorDialog
                    isOpen={dialogs.isMemberSelectorOpen}
                    group={dialogs.selectedGroupForAction}
                    currentUserId={user.uid}
                    onSelectMember={handlers.handleMemberSelected}
                    onClose={() => {
                        actions.closeMemberSelector();
                        actions.closeTransferDialog();
                    }}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Story 14d-v2-1-7d: Transfer Ownership Dialog */}
            {dialogs.selectedGroupForAction && dialogs.selectedMemberForTransfer && (
                <TransferOwnershipDialog
                    isOpen={dialogs.isTransferDialogOpen}
                    groupName={dialogs.selectedGroupForAction.name}
                    memberName={dialogs.selectedMemberName}
                    onConfirm={handlers.handleConfirmTransfer}
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
            {dialogs.selectedGroupForAction && (
                <DeleteGroupDialog
                    isOpen={dialogs.isDeleteDialogOpen}
                    groupName={dialogs.selectedGroupForAction.name}
                    groupColor={dialogs.selectedGroupForAction.color}
                    groupIcon={dialogs.selectedGroupForAction.icon}
                    memberCount={dialogs.selectedGroupForAction.members?.length || 1}
                    onConfirm={handlers.handleConfirmDelete}
                    onClose={handlers.handleCloseDeleteDialog}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Story 14d-v2-1-7g: Edit Group Dialog */}
            {/* Story 14d-v2-1-11c: Added transaction sharing toggle props */}
            <EditGroupDialog
                open={dialogs.isEditDialogOpen}
                group={dialogs.editingGroup}
                onClose={handlers.handleCloseEditDialog}
                onSave={handlers.handleEditSave}
                isPending={handlers.isUpdatingGroup}
                t={t}
                lang={lang}
                isOwner={handlers.isOwnerOfEditingGroup}
                onToggleTransactionSharing={handlers.handleToggleTransactionSharing}
                isTogglePending={handlers.isTogglePending}
                onShowToast={onShowToast}
            />
        </>
    );
};
