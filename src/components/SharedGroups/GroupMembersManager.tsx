/**
 * GroupMembersManager Component
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * List view of group members with management actions:
 * - Transfer ownership (owner only)
 * - Remove member (owner only)
 * - Leave group (non-owners)
 *
 * AC4: Owner cannot leave without transferring ownership or deleting group
 * AC5: Transfer ownership to another member
 * AC6: Owner can remove members
 * AC7: All destructive actions show confirmation dialogs
 */

import React, { useState, useCallback } from 'react';
import { User, Crown, LogOut, Trash2, ArrowRightLeft } from 'lucide-react';
import type { SharedGroup } from '../../types/sharedGroup';
import { LeaveGroupDialog, LeaveMode } from './LeaveGroupDialog';
import { TransferOwnershipDialog } from './TransferOwnershipDialog';
import { RemoveMemberDialog } from './RemoveMemberDialog';
import { OwnerLeaveWarningDialog } from './OwnerLeaveWarningDialog';
import { DeleteGroupDialog } from './DeleteGroupDialog';

export interface GroupMembersManagerProps {
    /** The shared group being managed */
    group: SharedGroup;
    /** Current user's ID */
    currentUserId: string;
    /** App ID */
    appId: string;
    /** Callback to leave group (soft/hard) */
    onLeaveGroup: (groupId: string, mode: LeaveMode) => Promise<void>;
    /** Callback to transfer ownership */
    onTransferOwnership: (groupId: string, newOwnerId: string) => Promise<void>;
    /** Callback to remove a member */
    onRemoveMember: (groupId: string, memberId: string) => Promise<void>;
    /** Callback to delete the group */
    onDeleteGroup: (groupId: string, removeTransactionTags: boolean) => Promise<void>;
    /** Optional: Member display names (userId -> displayName) */
    memberNames?: Record<string, string>;
    /** Optional: Member emails (userId -> email) */
    memberEmails?: Record<string, string>;
    /** Optional: Member profile photos (userId -> photoURL) */
    memberPhotos?: Record<string, string>;
    /** Translation function */
    t: (key: string) => string;
    /** Language */
    lang?: 'en' | 'es';
    /** Hide the header (when parent provides its own) */
    hideHeader?: boolean;
}

/**
 * Group members list with management actions.
 */
export const GroupMembersManager: React.FC<GroupMembersManagerProps> = ({
    group,
    currentUserId,
    appId: _appId, // Used by parent component for callbacks
    onLeaveGroup,
    onTransferOwnership,
    onRemoveMember,
    onDeleteGroup,
    memberNames = {},
    memberEmails = {},
    memberPhotos = {},
    t,
    lang = 'es',
    hideHeader = false,
}) => {
    void _appId; // Silence unused warning - appId passed through parent callbacks
    const isOwner = group.ownerId === currentUserId;

    // Dialog states
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [showOwnerWarning, setShowOwnerWarning] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    // Handle leave button click
    const handleLeaveClick = useCallback(() => {
        if (isOwner) {
            // Owner cannot leave - show warning
            setShowOwnerWarning(true);
        } else {
            // Non-owner can leave directly
            setShowLeaveDialog(true);
        }
    }, [isOwner]);

    // Handle transfer ownership click
    const handleTransferClick = useCallback((memberId: string) => {
        setSelectedMemberId(memberId);
        setShowTransferDialog(true);
    }, []);

    // Handle remove member click
    const handleRemoveClick = useCallback((memberId: string) => {
        setSelectedMemberId(memberId);
        setShowRemoveDialog(true);
    }, []);

    // Handle delete group from owner warning
    const handleDeleteFromWarning = useCallback(() => {
        setShowOwnerWarning(false);
        setShowDeleteDialog(true);
    }, []);

    // Handle manage members from owner warning
    const handleManageFromWarning = useCallback(() => {
        setShowOwnerWarning(false);
        // Just close the dialog - user is already on the members page
    }, []);

    // Confirm leave group
    const handleConfirmLeave = useCallback(async (mode: LeaveMode) => {
        await onLeaveGroup(group.id!, mode);
        setShowLeaveDialog(false);
    }, [onLeaveGroup, group.id]);

    // Confirm transfer ownership
    const handleConfirmTransfer = useCallback(async () => {
        if (selectedMemberId) {
            await onTransferOwnership(group.id!, selectedMemberId);
            setShowTransferDialog(false);
            setSelectedMemberId(null);
        }
    }, [onTransferOwnership, group.id, selectedMemberId]);

    // Confirm remove member
    const handleConfirmRemove = useCallback(async () => {
        if (selectedMemberId) {
            await onRemoveMember(group.id!, selectedMemberId);
            setShowRemoveDialog(false);
            setSelectedMemberId(null);
        }
    }, [onRemoveMember, group.id, selectedMemberId]);

    // Confirm delete group
    const handleConfirmDelete = useCallback(async (removeTransactionTags: boolean) => {
        await onDeleteGroup(group.id!, removeTransactionTags);
        setShowDeleteDialog(false);
    }, [onDeleteGroup, group.id]);

    // Get display name for a member
    const getMemberName = (memberId: string): string => {
        return memberNames[memberId] || (lang === 'es' ? 'Usuario' : 'User');
    };

    // Get email for a member
    const getMemberEmail = (memberId: string): string | undefined => {
        return memberEmails[memberId];
    };

    // Get photo URL for a member
    const getMemberPhoto = (memberId: string): string | undefined => {
        return memberPhotos[memberId];
    };

    // Texts
    const texts = {
        members: t('groupMembers') || (lang === 'es' ? 'Miembros' : 'Members'),
        owner: t('groupOwner') || (lang === 'es' ? 'Dueño' : 'Owner'),
        you: t('you') || (lang === 'es' ? 'Tú' : 'You'),
        transferOwnership: t('transferOwnership') || (lang === 'es' ? 'Transferir propiedad' : 'Transfer ownership'),
        remove: t('remove') || (lang === 'es' ? 'Remover' : 'Remove'),
        leaveGroup: t('leaveGroup') || (lang === 'es' ? 'Dejar grupo' : 'Leave Group'),
    };

    return (
        <div className="space-y-4" data-testid="group-members-manager">
            {/* Header (optional) */}
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <h3
                        className="font-semibold text-sm"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {texts.members} ({group.members.length})
                    </h3>
                </div>
            )}

            {/* Members List */}
            <div className="space-y-2">
                {group.members.map((memberId) => {
                    const isCurrentUser = memberId === currentUserId;
                    const isMemberOwner = memberId === group.ownerId;
                    const photoUrl = getMemberPhoto(memberId);
                    const displayName = getMemberName(memberId);

                    return (
                        <div
                            key={memberId}
                            className="flex items-center gap-3 p-3 rounded-xl"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-light)',
                            }}
                            data-testid={`member-row-${memberId}`}
                        >
                            {/* Avatar */}
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                                style={{
                                    backgroundColor: isMemberOwner ? group.color : 'var(--bg-secondary)',
                                }}
                            >
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt={displayName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User
                                        size={20}
                                        style={{ color: isMemberOwner ? 'white' : 'var(--text-secondary)' }}
                                    />
                                )}
                            </div>

                            {/* Member Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="font-medium truncate text-sm"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {displayName}
                                    </span>
                                    {isCurrentUser && (
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                                            style={{
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                color: '#3b82f6',
                                            }}
                                        >
                                            {texts.you}
                                        </span>
                                    )}
                                </div>
                                {/* Email */}
                                {getMemberEmail(memberId) && (
                                    <div
                                        className="text-xs truncate mt-0.5"
                                        style={{ color: 'var(--text-tertiary)' }}
                                    >
                                        {getMemberEmail(memberId)}
                                    </div>
                                )}
                                {isMemberOwner && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Crown size={12} style={{ color: '#f59e0b' }} />
                                        <span
                                            className="text-xs"
                                            style={{ color: '#f59e0b' }}
                                        >
                                            {texts.owner}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {/* Owner can transfer/remove other members */}
                                {isOwner && !isCurrentUser && (
                                    <>
                                        <button
                                            onClick={() => handleTransferClick(memberId)}
                                            className="p-2 rounded-lg transition-colors"
                                            style={{
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                color: '#3b82f6',
                                            }}
                                            title={texts.transferOwnership}
                                            aria-label={`${texts.transferOwnership} ${displayName}`}
                                            data-testid={`transfer-btn-${memberId}`}
                                        >
                                            <ArrowRightLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveClick(memberId)}
                                            className="p-2 rounded-lg transition-colors"
                                            style={{
                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                            }}
                                            title={texts.remove}
                                            aria-label={`${texts.remove} ${displayName}`}
                                            data-testid={`remove-btn-${memberId}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Leave Group Button */}
            <button
                onClick={handleLeaveClick}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
                data-testid="leave-group-btn"
            >
                <LogOut size={16} />
                {texts.leaveGroup}
            </button>

            {/* Dialogs */}
            <LeaveGroupDialog
                isOpen={showLeaveDialog}
                groupName={group.name}
                groupColor={group.color}
                groupIcon={group.icon}
                onConfirm={handleConfirmLeave}
                onClose={() => setShowLeaveDialog(false)}
                t={t}
                lang={lang}
            />

            <OwnerLeaveWarningDialog
                isOpen={showOwnerWarning}
                groupName={group.name}
                groupColor={group.color}
                groupIcon={group.icon}
                onManageMembers={handleManageFromWarning}
                onDeleteGroup={handleDeleteFromWarning}
                onClose={() => setShowOwnerWarning(false)}
                t={t}
                lang={lang}
            />

            <TransferOwnershipDialog
                isOpen={showTransferDialog}
                groupName={group.name}
                memberName={selectedMemberId ? getMemberName(selectedMemberId) : ''}
                onConfirm={handleConfirmTransfer}
                onClose={() => {
                    setShowTransferDialog(false);
                    setSelectedMemberId(null);
                }}
                t={t}
                lang={lang}
            />

            <RemoveMemberDialog
                isOpen={showRemoveDialog}
                groupName={group.name}
                memberName={selectedMemberId ? getMemberName(selectedMemberId) : ''}
                onConfirm={handleConfirmRemove}
                onClose={() => {
                    setShowRemoveDialog(false);
                    setSelectedMemberId(null);
                }}
                t={t}
                lang={lang}
            />

            <DeleteGroupDialog
                isOpen={showDeleteDialog}
                groupName={group.name}
                groupColor={group.color}
                groupIcon={group.icon}
                memberCount={group.members.length}
                onConfirm={handleConfirmDelete}
                onClose={() => setShowDeleteDialog(false)}
                t={t}
                lang={lang}
            />
        </div>
    );
};

export default GroupMembersManager;
