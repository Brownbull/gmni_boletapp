/**
 * GruposView - Custom Groups Settings Sub-View
 *
 * Story 14c.1: Create Shared Group
 * Story 14c.2: Accept/Decline Invitation
 * Story 14c.3: Leave/Manage Group
 * Story 14.22: Custom groups management
 *
 * Displays user-created custom groups and allows making them shareable.
 * Shows list of personal groups and shared groups the user is part of.
 *
 * Features:
 * - List personal custom groups
 * - "Make Shareable" action for each group
 * - List shared groups user is a member of
 * - Share code display for owned shared groups
 * - Pending invitations section (Story 14c.2)
 * - Group management (leave, transfer, remove members) (Story 14c.3)
 */

import React, { useState, useCallback } from 'react';
import { Users, Share2, Plus, FolderOpen, ChevronRight, Loader2, Trash2, Pencil, UserPlus } from 'lucide-react';
import { getFirestore } from 'firebase/firestore';
import type { TransactionGroup } from '../../../types/transactionGroup';
import type { SharedGroup } from '../../../types/sharedGroup';
import { extractGroupEmoji, extractGroupLabel } from '../../../types/transactionGroup';
import { MakeShareableDialog } from '../../SharedGroups/MakeShareableDialog';
import { ShareCodeDisplay } from '../../SharedGroups/ShareCodeDisplay';
import { PendingInvitationsSection } from '../../SharedGroups/PendingInvitationsSection';
import { GroupMembersManager } from '../../SharedGroups/GroupMembersManager';
import type { LeaveMode } from '../../SharedGroups/LeaveGroupDialog';
import {
    createSharedGroup,
    regenerateShareCode,
    getShareLink,
    isShareCodeExpired,
    leaveGroupSoft,
    leaveGroupHard,
    transferOwnership,
    removeMember,
    deleteSharedGroupWithCleanup,
    joinByShareCode,
} from '../../../services/sharedGroupService';
import { useGroups } from '../../../hooks/useGroups';
import { useSharedGroups } from '../../../hooks/useSharedGroups';
import { usePendingInvitations } from '../../../hooks/usePendingInvitations';
import { deleteGroup, updateGroup } from '../../../services/groupService';
import { DeleteGroupDialog } from '../../SharedGroups/DeleteGroupDialog';
import { EditGroupModal } from '../../history/EditGroupModal';

export interface GruposViewProps {
    t: (key: string, params?: Record<string, string | number>) => string;
    theme: string;
    /** Current user ID - required for data fetching */
    userId?: string | null;
    /** User email - required for pending invitations */
    userEmail?: string | null;
    /** User display name - for member profiles */
    userDisplayName?: string | null;
    /** User photo URL - for member profiles */
    userPhotoURL?: string | null;
    /** App ID for Firestore - required for personal groups */
    appId?: string;
    /** Callback to create a new group (navigates to History view) */
    onCreateGroup?: () => void;
    /** Language */
    lang?: 'en' | 'es';
    /** Toast callback */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

export const GruposView: React.FC<GruposViewProps> = ({
    t,
    theme,
    userId = null,
    userEmail = null,
    userDisplayName = null,
    userPhotoURL = null,
    appId = 'boletapp',
    onCreateGroup,
    lang = 'es',
    onShowToast,
}) => {
    const isDark = theme === 'dark';
    const [selectedGroup, setSelectedGroup] = useState<TransactionGroup | null>(null);
    const [showMakeShareableDialog, setShowMakeShareableDialog] = useState(false);
    const [expandedSharedGroupId, setExpandedSharedGroupId] = useState<string | null>(null);
    // Story 14c.4: Personal group management
    const [expandedPersonalGroupId, setExpandedPersonalGroupId] = useState<string | null>(null);
    const [showDeletePersonalGroupDialog, setShowDeletePersonalGroupDialog] = useState(false);
    const [selectedPersonalGroup, setSelectedPersonalGroup] = useState<TransactionGroup | null>(null);
    const [showEditPersonalGroupModal, setShowEditPersonalGroupModal] = useState(false);
    const [editingPersonalGroup, setEditingPersonalGroup] = useState<TransactionGroup | null>(null);
    // Story 14c.4: Join with code
    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    // Fetch personal groups using hook
    const { groups, loading: groupsLoading } = useGroups(userId, appId);

    // Fetch shared groups using hook
    const { sharedGroups, loading: sharedGroupsLoading } = useSharedGroups(userId);

    // Story 14c.2: Fetch pending invitations using hook
    const { pendingInvitations, loading: invitationsLoading } = usePendingInvitations(userEmail);

    // Handle make shareable
    const handleMakeShareable = useCallback(async (group: TransactionGroup): Promise<SharedGroup> => {
        if (!userId || !appId) {
            throw new Error('User not authenticated');
        }

        const db = getFirestore();
        // Pass owner profile so member names/emails are stored
        const ownerProfile = {
            displayName: userDisplayName || undefined,
            email: userEmail || undefined,
            photoURL: userPhotoURL || undefined,
        };
        return createSharedGroup(db, userId, appId, {
            name: group.name,
            color: group.color,
            icon: extractGroupEmoji(group.name) || undefined,
        }, ownerProfile);
    }, [userId, appId, userDisplayName, userEmail, userPhotoURL]);

    // Handle regenerate share code
    const handleRegenerateShareCode = useCallback(async (groupId: string) => {
        const db = getFirestore();
        await regenerateShareCode(db, groupId);
    }, []);

    // Story 14c.3: Handle leave group
    const handleLeaveGroup = useCallback(async (groupId: string, mode: LeaveMode) => {
        if (!userId) return;
        const db = getFirestore();
        try {
            if (mode === 'soft') {
                await leaveGroupSoft(db, userId, appId, groupId);
            } else {
                await leaveGroupHard(db, userId, appId, groupId);
            }
            setExpandedSharedGroupId(null);
            onShowToast?.(lang === 'es' ? 'Has dejado el grupo' : 'You left the group', 'success');
        } catch (error) {
            console.error('[GruposView] Leave group error:', error);
            onShowToast?.(lang === 'es' ? 'Error al salir del grupo' : 'Error leaving group', 'error');
            throw error;
        }
    }, [userId, appId, lang, onShowToast]);

    // Story 14c.3: Handle transfer ownership
    const handleTransferOwnership = useCallback(async (groupId: string, newOwnerId: string) => {
        if (!userId) return;
        const db = getFirestore();
        try {
            await transferOwnership(db, userId, newOwnerId, groupId);
            onShowToast?.(lang === 'es' ? 'Propiedad transferida' : 'Ownership transferred', 'success');
        } catch (error) {
            console.error('[GruposView] Transfer ownership error:', error);
            onShowToast?.(lang === 'es' ? 'Error al transferir propiedad' : 'Error transferring ownership', 'error');
            throw error;
        }
    }, [userId, lang, onShowToast]);

    // Story 14c.3: Handle remove member
    const handleRemoveMember = useCallback(async (groupId: string, memberId: string) => {
        if (!userId) return;
        const db = getFirestore();
        try {
            await removeMember(db, userId, memberId, appId, groupId);
            onShowToast?.(lang === 'es' ? 'Miembro removido' : 'Member removed', 'success');
        } catch (error) {
            console.error('[GruposView] Remove member error:', error);
            onShowToast?.(lang === 'es' ? 'Error al remover miembro' : 'Error removing member', 'error');
            throw error;
        }
    }, [userId, appId, lang, onShowToast]);

    // Story 14c.3: Handle delete group
    const handleDeleteGroup = useCallback(async (groupId: string, removeTransactionTags: boolean) => {
        if (!userId) return;
        const db = getFirestore();
        try {
            await deleteSharedGroupWithCleanup(db, userId, appId, groupId, removeTransactionTags);
            setExpandedSharedGroupId(null);
            onShowToast?.(lang === 'es' ? 'Grupo eliminado' : 'Group deleted', 'success');
        } catch (error) {
            console.error('[GruposView] Delete group error:', error);
            onShowToast?.(lang === 'es' ? 'Error al eliminar grupo' : 'Error deleting group', 'error');
            throw error;
        }
    }, [userId, appId, lang, onShowToast]);

    // Open make shareable dialog
    const openMakeShareableDialog = (group: TransactionGroup) => {
        setSelectedGroup(group);
        setShowMakeShareableDialog(true);
    };

    // Story 14c.4: Handle delete personal group
    const handleDeletePersonalGroup = useCallback(async (_removeTransactionTags: boolean) => {
        if (!userId || !selectedPersonalGroup?.id) return;
        const db = getFirestore();
        try {
            await deleteGroup(db, userId, appId, selectedPersonalGroup.id);
            setExpandedPersonalGroupId(null);
            setShowDeletePersonalGroupDialog(false);
            setSelectedPersonalGroup(null);
            onShowToast?.(lang === 'es' ? 'Grupo eliminado' : 'Group deleted', 'success');
        } catch (error) {
            console.error('[GruposView] Delete personal group error:', error);
            onShowToast?.(lang === 'es' ? 'Error al eliminar grupo' : 'Error deleting group', 'error');
            throw error;
        }
    }, [userId, appId, selectedPersonalGroup, lang, onShowToast]);

    // Open delete personal group dialog
    const openDeletePersonalGroupDialog = (group: TransactionGroup) => {
        setSelectedPersonalGroup(group);
        setShowDeletePersonalGroupDialog(true);
    };

    // Story 14c.4: Handle edit personal group
    const handleEditPersonalGroup = useCallback(async (groupId: string, name: string, color: string) => {
        if (!userId) return;
        const db = getFirestore();
        try {
            await updateGroup(db, userId, appId, groupId, { name, color });
            setShowEditPersonalGroupModal(false);
            setEditingPersonalGroup(null);
            onShowToast?.(lang === 'es' ? 'Grupo actualizado' : 'Group updated', 'success');
        } catch (error) {
            console.error('[GruposView] Edit personal group error:', error);
            onShowToast?.(lang === 'es' ? 'Error al actualizar grupo' : 'Error updating group', 'error');
            throw error;
        }
    }, [userId, appId, lang, onShowToast]);

    // Open edit personal group modal
    const openEditPersonalGroupModal = (group: TransactionGroup) => {
        setEditingPersonalGroup(group);
        setShowEditPersonalGroupModal(true);
    };

    // Story 14c.4: Handle join with share code
    const handleJoinWithCode = useCallback(async () => {
        if (!userId || !joinCode.trim()) return;

        setIsJoining(true);
        setJoinError(null);

        const db = getFirestore();
        try {
            // Pass user profile so member names/emails are stored
            const userProfile = {
                displayName: userDisplayName || undefined,
                email: userEmail || undefined,
                photoURL: userPhotoURL || undefined,
            };
            const result = await joinByShareCode(db, userId, appId, joinCode.trim(), userProfile);
            setJoinCode('');
            onShowToast?.(
                lang === 'es'
                    ? `Te uniste a "${result.groupName}"`
                    : `Joined "${result.groupName}"`,
                'success'
            );
        } catch (error) {
            console.error('[GruposView] Join with code error:', error);
            const errorMessage = (error as Error).message;
            let userMessage: string;

            switch (errorMessage) {
                case 'CODE_NOT_FOUND':
                    userMessage = lang === 'es' ? 'Código no encontrado' : 'Code not found';
                    break;
                case 'CODE_EXPIRED':
                    userMessage = lang === 'es' ? 'Código expirado' : 'Code expired';
                    break;
                case 'ALREADY_MEMBER':
                    userMessage = lang === 'es' ? 'Ya eres miembro de este grupo' : 'Already a member of this group';
                    break;
                case 'GROUP_FULL':
                    userMessage = lang === 'es' ? 'Grupo lleno' : 'Group is full';
                    break;
                default:
                    userMessage = lang === 'es' ? 'Error al unirse' : 'Error joining';
            }

            setJoinError(userMessage);
            onShowToast?.(userMessage, 'error');
        } finally {
            setIsJoining(false);
        }
    }, [userId, appId, joinCode, lang, onShowToast, userDisplayName, userEmail, userPhotoURL]);

    // Get owned shared groups (where user is owner)
    const ownedSharedGroups = sharedGroups.filter(g => g.ownerId === userId);
    const memberSharedGroups = sharedGroups.filter(g => g.ownerId !== userId);

    // Helper: Extract member names/emails/photos from group.memberProfiles
    const getMemberNames = (group: SharedGroup): Record<string, string> => {
        if (!group.memberProfiles) return {};
        const result: Record<string, string> = {};
        for (const [userId, profile] of Object.entries(group.memberProfiles)) {
            if (profile?.displayName) {
                result[userId] = profile.displayName;
            }
        }
        return result;
    };

    const getMemberEmails = (group: SharedGroup): Record<string, string> => {
        if (!group.memberProfiles) return {};
        const result: Record<string, string> = {};
        for (const [userId, profile] of Object.entries(group.memberProfiles)) {
            if (profile?.email) {
                result[userId] = profile.email;
            }
        }
        return result;
    };

    const getMemberPhotos = (group: SharedGroup): Record<string, string> => {
        if (!group.memberProfiles) return {};
        const result: Record<string, string> = {};
        for (const [userId, profile] of Object.entries(group.memberProfiles)) {
            if (profile?.photoURL) {
                result[userId] = profile.photoURL;
            }
        }
        return result;
    };

    // Check if a group is already shared
    const isGroupShared = (groupId: string | undefined): boolean => {
        if (!groupId) return false;
        return sharedGroups.some(sg => sg.name === groups.find(g => g.id === groupId)?.name);
    };

    return (
        <div className="space-y-3 pb-4">
            {/* Story 14c.2: Pending Invitations Section - AC4: Show at top */}
            {!invitationsLoading && pendingInvitations.length > 0 && userId && (
                <PendingInvitationsSection
                    invitations={pendingInvitations}
                    userId={userId}
                    appId={appId}
                    t={t}
                    theme={theme}
                    lang={lang}
                    onShowToast={onShowToast}
                />
            )}

            {/* Story 14c.4: Join with Code Section */}
            {userId && (
                <div
                    className="rounded-xl p-3"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                    }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#dcfce7' }}
                        >
                            <UserPlus className="w-5 h-5" style={{ color: '#16a34a' }} />
                        </div>
                        <div className="flex-1">
                            <h3
                                className="font-medium"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {lang === 'es' ? 'Unirse con Código' : 'Join with Code'}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {lang === 'es'
                                    ? 'Ingresa un código de invitación'
                                    : 'Enter an invitation code'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => {
                                setJoinCode(e.target.value);
                                setJoinError(null);
                            }}
                            placeholder={lang === 'es' ? 'Ej: kUANS-mZHP6feZrL' : 'E.g., kUANS-mZHP6feZrL'}
                            className="flex-1 px-3 py-2.5 rounded-lg text-sm font-mono"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                border: `1px solid ${joinError ? 'var(--error)' : 'var(--border-light)'}`,
                                color: 'var(--text-primary)',
                            }}
                            disabled={isJoining}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && joinCode.trim()) {
                                    handleJoinWithCode();
                                }
                            }}
                        />
                        <button
                            onClick={handleJoinWithCode}
                            disabled={isJoining || !joinCode.trim()}
                            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            style={{
                                backgroundColor: joinCode.trim() ? 'var(--primary)' : 'var(--bg-tertiary)',
                                color: joinCode.trim() ? 'white' : 'var(--text-tertiary)',
                                opacity: isJoining ? 0.6 : 1,
                            }}
                        >
                            {isJoining ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            {lang === 'es' ? 'Unirse' : 'Join'}
                        </button>
                    </div>

                    {joinError && (
                        <p
                            className="text-xs mt-2"
                            style={{ color: 'var(--error)' }}
                        >
                            {joinError}
                        </p>
                    )}
                </div>
            )}

            {/* Custom Groups Section */}
            <div
                className="rounded-xl overflow-hidden"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                }}
            >
                <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#dbeafe' }}
                    >
                        <FolderOpen className="w-5 h-5" style={{ color: '#3b82f6' }} />
                    </div>
                    <div className="flex-1">
                        <h3
                            className="font-medium"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {t('settingsGruposTitle')}
                        </h3>
                        <p
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {t('settingsGruposSubtitle')}
                        </p>
                    </div>
                </div>

                {/* Loading State */}
                {groupsLoading && (
                    <div className="flex items-center justify-center py-8 px-3">
                        <Loader2
                            className="w-6 h-6 animate-spin"
                            style={{ color: 'var(--primary)' }}
                        />
                    </div>
                )}

                {/* Empty State - No groups yet */}
                {!groupsLoading && groups.length === 0 && (
                    <div
                        className="rounded-lg p-6 text-center mx-3 mb-3"
                        style={{
                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                            border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                    >
                        <Users
                            className="w-12 h-12 mx-auto mb-3"
                            style={{ color: 'var(--text-tertiary)' }}
                        />
                        <p
                            className="text-sm mb-3"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {t('settingsGruposEmpty')}
                        </p>
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                            }}
                            onClick={onCreateGroup}
                            disabled={!onCreateGroup}
                        >
                            <Plus className="w-4 h-4" />
                            {t('settingsGruposCreate')}
                        </button>
                        <p
                            className="text-xs mt-2"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            {lang === 'es'
                                ? 'Crea grupos desde el historial de transacciones'
                                : 'Create groups from transaction history'
                            }
                        </p>
                    </div>
                )}

                {/* Groups List */}
                {!groupsLoading && groups.length > 0 && (
                    <div className="space-y-1 px-1.5 pb-1.5">
                        {groups.map((group) => {
                            const emoji = extractGroupEmoji(group.name);
                            const label = extractGroupLabel(group.name);
                            const isShared = isGroupShared(group.id);
                            const isExpanded = expandedPersonalGroupId === group.id;

                            return (
                                <div
                                    key={group.id}
                                    className="rounded-lg overflow-hidden"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                        border: '1px solid var(--border-light)',
                                    }}
                                >
                                    <button
                                        onClick={() => setExpandedPersonalGroupId(isExpanded ? null : group.id!)}
                                        className="w-full p-3 flex items-center gap-3 transition-colors"
                                    >
                                        {/* Group Icon */}
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                                            style={{
                                                backgroundColor: group.color || '#10b981',
                                            }}
                                        >
                                            {emoji || ''}
                                        </div>

                                        {/* Group Info */}
                                        <div className="flex-1 min-w-0 text-left">
                                            <div
                                                className="font-medium truncate"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {label}
                                            </div>
                                            <div
                                                className="text-xs"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                {group.transactionCount}{' '}
                                                {lang === 'es'
                                                    ? (group.transactionCount === 1 ? 'transaccion' : 'transacciones')
                                                    : (group.transactionCount === 1 ? 'transaction' : 'transactions')
                                                }
                                            </div>
                                        </div>

                                        {/* Make Shareable Button - stop propagation to prevent expand */}
                                        {!isShared ? (
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openMakeShareableDialog(group);
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                                style={{
                                                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                                    color: '#a855f7',
                                                    border: '1px solid rgba(168, 85, 247, 0.2)',
                                                }}
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                                <span>
                                                    {lang === 'es' ? 'Compartir' : 'Share'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span
                                                className="flex items-center gap-1 px-2 py-1 text-xs rounded-full"
                                                style={{
                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#10b981',
                                                }}
                                            >
                                                <Users className="w-3 h-3" />
                                                {lang === 'es' ? 'Compartido' : 'Shared'}
                                            </span>
                                        )}

                                        {/* Expand Arrow */}
                                        <ChevronRight
                                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                            style={{ color: 'var(--text-tertiary)' }}
                                        />
                                    </button>

                                    {/* Expanded Content: Edit and Delete options */}
                                    {isExpanded && (
                                        <div
                                            className="px-3 pb-3 pt-1 flex gap-2"
                                            style={{
                                                borderTop: '1px solid var(--border-light)',
                                            }}
                                        >
                                            {/* Edit button */}
                                            <button
                                                onClick={() => openEditPersonalGroupModal(group)}
                                                className="flex-1 py-2.5 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                                                style={{
                                                    backgroundColor: 'var(--bg-tertiary)',
                                                    color: 'var(--primary)',
                                                }}
                                            >
                                                <Pencil size={16} />
                                                {lang === 'es' ? 'Editar' : 'Edit'}
                                            </button>
                                            {/* Delete button */}
                                            <button
                                                onClick={() => openDeletePersonalGroupDialog(group)}
                                                className="flex-1 py-2.5 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                                                style={{
                                                    backgroundColor: 'var(--bg-tertiary)',
                                                    color: 'var(--error)',
                                                }}
                                            >
                                                <Trash2 size={16} />
                                                {lang === 'es' ? 'Eliminar' : 'Delete'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Shared Groups Section (Groups user owns and has shared) */}
            {!sharedGroupsLoading && ownedSharedGroups.length > 0 && (
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                    }}
                >
                    <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#f3e8ff' }}
                        >
                            <Share2 className="w-5 h-5" style={{ color: '#a855f7' }} />
                        </div>
                        <div>
                            <h3
                                className="font-medium"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {lang === 'es' ? 'Mis Grupos Compartidos' : 'My Shared Groups'}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {lang === 'es'
                                    ? 'Grupos que has compartido con otros'
                                    : 'Groups you have shared with others'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1 px-1.5 pb-1.5">
                        {ownedSharedGroups.map((group) => {
                            const emoji = extractGroupEmoji(group.name);
                            const label = extractGroupLabel(group.name);
                            const isExpanded = expandedSharedGroupId === group.id;
                            const expired = isShareCodeExpired(group.shareCodeExpiresAt);

                            return (
                                <div key={group.id}>
                                    <button
                                        onClick={() => setExpandedSharedGroupId(isExpanded ? null : group.id!)}
                                        className="w-full rounded-lg p-3 flex items-center gap-3 transition-colors"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                            border: '1px solid var(--border-light)',
                                        }}
                                    >
                                        {/* Group Icon */}
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                                            style={{ backgroundColor: group.color }}
                                        >
                                            {emoji || group.icon || ''}
                                        </div>

                                        {/* Group Info */}
                                        <div className="flex-1 min-w-0 text-left">
                                            <div
                                                className="font-medium truncate"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {label}
                                            </div>
                                            <div
                                                className="text-xs flex items-center gap-2"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                <Users className="w-3 h-3" />
                                                {group.members.length}{' '}
                                                {lang === 'es'
                                                    ? (group.members.length === 1 ? 'miembro' : 'miembros')
                                                    : (group.members.length === 1 ? 'member' : 'members')
                                                }
                                            </div>
                                        </div>

                                        {/* Expand Arrow */}
                                        <ChevronRight
                                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                            style={{ color: 'var(--text-tertiary)' }}
                                        />
                                    </button>

                                    {/* Expanded Content: Share Code + Members Manager */}
                                    {isExpanded && (
                                        <div className="mt-2 ml-2 mr-2 space-y-4">
                                            <ShareCodeDisplay
                                                shareCode={group.shareCode}
                                                shareLink={getShareLink(group.shareCode)}
                                                expiresAt={group.shareCodeExpiresAt?.toDate() || null}
                                                groupName={group.name}
                                                isExpired={expired}
                                                onRegenerate={() => handleRegenerateShareCode(group.id!)}
                                                t={t}
                                                lang={lang}
                                            />
                                            {/* Story 14c.3: Group Members Manager */}
                                            {userId && (
                                                <GroupMembersManager
                                                    group={group}
                                                    currentUserId={userId}
                                                    appId={appId}
                                                    onLeaveGroup={handleLeaveGroup}
                                                    onTransferOwnership={handleTransferOwnership}
                                                    onRemoveMember={handleRemoveMember}
                                                    onDeleteGroup={handleDeleteGroup}
                                                    memberNames={getMemberNames(group)}
                                                    memberEmails={getMemberEmails(group)}
                                                    memberPhotos={getMemberPhotos(group)}
                                                    t={t}
                                                    lang={lang}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Groups user is a member of (not owner) */}
            {!sharedGroupsLoading && memberSharedGroups.length > 0 && (
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                    }}
                >
                    <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#dbeafe' }}
                        >
                            <Users className="w-5 h-5" style={{ color: '#3b82f6' }} />
                        </div>
                        <div>
                            <h3
                                className="font-medium"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {lang === 'es' ? 'Grupos a los que pertenezco' : 'Groups I belong to'}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {lang === 'es'
                                    ? 'Grupos compartidos por otros usuarios'
                                    : 'Groups shared by other users'
                                }
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1 px-1.5 pb-1.5">
                        {memberSharedGroups.map((group) => {
                            const emoji = extractGroupEmoji(group.name);
                            const label = extractGroupLabel(group.name);
                            const isExpanded = expandedSharedGroupId === group.id;

                            return (
                                <div key={group.id}>
                                    <button
                                        onClick={() => setExpandedSharedGroupId(isExpanded ? null : group.id!)}
                                        className="w-full rounded-lg p-3 flex items-center gap-3 transition-colors"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                            border: '1px solid var(--border-light)',
                                        }}
                                    >
                                        {/* Group Icon */}
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                                            style={{ backgroundColor: group.color }}
                                        >
                                            {emoji || group.icon || ''}
                                        </div>

                                        {/* Group Info */}
                                        <div className="flex-1 min-w-0 text-left">
                                            <div
                                                className="font-medium truncate"
                                                style={{ color: 'var(--text-primary)' }}
                                            >
                                                {label}
                                            </div>
                                            <div
                                                className="text-xs flex items-center gap-2"
                                                style={{ color: 'var(--text-secondary)' }}
                                            >
                                                <Users className="w-3 h-3" />
                                                {group.members.length}{' '}
                                                {lang === 'es'
                                                    ? (group.members.length === 1 ? 'miembro' : 'miembros')
                                                    : (group.members.length === 1 ? 'member' : 'members')
                                                }
                                            </div>
                                        </div>

                                        {/* Expand Arrow */}
                                        <ChevronRight
                                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                            style={{ color: 'var(--text-tertiary)' }}
                                        />
                                    </button>

                                    {/* Expanded: Group Members Manager (non-owner can leave) */}
                                    {isExpanded && userId && (
                                        <div className="mt-2 ml-2 mr-2">
                                            <GroupMembersManager
                                                group={group}
                                                currentUserId={userId}
                                                appId={appId}
                                                onLeaveGroup={handleLeaveGroup}
                                                onTransferOwnership={handleTransferOwnership}
                                                onRemoveMember={handleRemoveMember}
                                                onDeleteGroup={handleDeleteGroup}
                                                memberNames={getMemberNames(group)}
                                                memberEmails={getMemberEmails(group)}
                                                memberPhotos={getMemberPhotos(group)}
                                                t={t}
                                                lang={lang}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Feature Preview Card - only show when no shared groups exist */}
            {!sharedGroupsLoading && ownedSharedGroups.length === 0 && memberSharedGroups.length === 0 && (
                <div
                    className="rounded-xl p-4"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                    }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#f3e8ff' }}
                        >
                            <Share2 className="w-5 h-5" style={{ color: '#a855f7' }} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3
                                    className="font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {t('settingsGruposShare')}
                                </h3>
                            </div>
                            <p
                                className="text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {t('settingsGruposShareDesc')}
                            </p>
                        </div>
                    </div>

                    {/* Feature Preview */}
                    <div
                        className="rounded-lg p-4"
                        style={{
                            backgroundColor: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)',
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                        }}
                    >
                        <p
                            className="text-sm mb-3"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {lang === 'es'
                                ? 'Comparte grupos con familia o amigos:'
                                : 'Share groups with family or friends:'
                            }
                        </p>
                        <ul className="space-y-2">
                            {[
                                lang === 'es' ? 'Asigna transacciones a grupos compartidos' : 'Assign transactions to shared groups',
                                lang === 'es' ? 'Invita a familia o amigos' : 'Invite family or friends',
                                lang === 'es' ? 'Rastreen gastos compartidos' : 'Track shared expenses',
                            ].map((feature, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-2 text-sm"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: '#a855f7' }}
                                    />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Make Shareable Dialog */}
            <MakeShareableDialog
                isOpen={showMakeShareableDialog}
                group={selectedGroup}
                onClose={() => {
                    setShowMakeShareableDialog(false);
                    setSelectedGroup(null);
                }}
                onMakeShareable={handleMakeShareable}
                t={t}
                lang={lang}
            />

            {/* Story 14c.4: Delete Personal Group Dialog */}
            <DeleteGroupDialog
                isOpen={showDeletePersonalGroupDialog}
                groupName={selectedPersonalGroup?.name ? extractGroupLabel(selectedPersonalGroup.name) : ''}
                groupColor={selectedPersonalGroup?.color || '#10b981'}
                groupIcon={selectedPersonalGroup?.name ? extractGroupEmoji(selectedPersonalGroup.name) || undefined : undefined}
                memberCount={0}
                onConfirm={handleDeletePersonalGroup}
                onClose={() => {
                    setShowDeletePersonalGroupDialog(false);
                    setSelectedPersonalGroup(null);
                }}
                t={t}
                lang={lang}
            />

            {/* Story 14c.4: Edit Personal Group Modal */}
            <EditGroupModal
                isOpen={showEditPersonalGroupModal}
                group={editingPersonalGroup}
                onClose={() => {
                    setShowEditPersonalGroupModal(false);
                    setEditingPersonalGroup(null);
                }}
                onSave={handleEditPersonalGroup}
                t={t}
                lang={lang}
            />
        </div>
    );
};

export default GruposView;
