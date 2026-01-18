/**
 * GruposView - Shared Groups Settings Sub-View
 *
 * Story 14c.1: Create Shared Group
 * Story 14c.2: Accept/Decline Invitation
 * Story 14c.3: Leave/Manage Group
 * Story 14c.8: Group Consolidation - shared groups only
 *
 * Displays shared groups the user owns or is a member of.
 *
 * Features:
 * - List shared groups user owns with share code management
 * - List shared groups user is a member of
 * - Share code display for owned shared groups
 * - Pending invitations section (Story 14c.2)
 * - Group management (leave, transfer, remove members) (Story 14c.3)
 * - Join groups by share code
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Users, Share2, ChevronRight, Loader2, UserPlus, Plus, Pencil, Check, Trash2, X } from 'lucide-react';
import { getFirestore } from 'firebase/firestore';
import type { SharedGroup } from '../../../types/sharedGroup';
import { ShareCodeDisplay } from '../../SharedGroups/ShareCodeDisplay';
import { PendingInvitationsSection } from '../../SharedGroups/PendingInvitationsSection';
import { GroupMembersManager } from '../../SharedGroups/GroupMembersManager';
import { DeleteGroupDialog } from '../../SharedGroups/DeleteGroupDialog';
import { EmojiPicker } from '../../SharedGroups/EmojiPicker';
import { ColorPicker } from '../../SharedGroups/ColorPicker';
import type { LeaveMode } from '../../SharedGroups/LeaveGroupDialog';
import {
    regenerateShareCode,
    getShareLink,
    isShareCodeExpired,
    leaveGroupSoft,
    leaveGroupHard,
    transferOwnership,
    removeMember,
    deleteSharedGroupWithCleanup,
    joinByShareCode,
    createSharedGroup,
    updateSharedGroup,
} from '../../../services/sharedGroupService';
import { useSharedGroups } from '../../../hooks/useSharedGroups';
import { usePendingInvitations } from '../../../hooks/usePendingInvitations';

// Predefined group colors for selection
const GROUP_COLORS = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
];

// Default emoji for new groups when none is selected
const DEFAULT_GROUP_EMOJI = '😀';

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
    /** App ID for Firestore */
    appId?: string;
    /** Language */
    lang?: 'en' | 'es';
    /** Toast callback */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

/**
 * Helper to extract emoji from group name (e.g., "🏠 Family" → "🏠")
 */
function extractGroupEmoji(name: string): string | null {
    if (!name) return null;
    // Check if first character is an emoji (rough check for emoji range)
    const firstChar = name.codePointAt(0);
    if (firstChar && firstChar > 0x1F300) {
        // Extract emoji (may be multi-codepoint)
        const match = name.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
        return match ? match[0] : null;
    }
    return null;
}

/**
 * Helper to extract label from group name (e.g., "🏠 Family" → "Family")
 */
function extractGroupLabel(name: string): string {
    if (!name) return '';
    const emoji = extractGroupEmoji(name);
    if (emoji) {
        return name.slice(emoji.length).trim();
    }
    return name;
}

export const GruposView: React.FC<GruposViewProps> = ({
    t,
    theme,
    userId = null,
    userEmail = null,
    userDisplayName = null,
    userPhotoURL = null,
    appId = 'boletapp',
    lang = 'es',
    onShowToast,
}) => {
    const isDark = theme === 'dark';
    const [expandedSharedGroupId, setExpandedSharedGroupId] = useState<string | null>(null);
    // Join with code state
    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);
    // Create group state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);
    const [newGroupEmoji, setNewGroupEmoji] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    // Edit group state
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupColor, setEditGroupColor] = useState('');
    const [editGroupEmoji, setEditGroupEmoji] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    // Share modal state (which group's share modal is open)
    const [shareModalGroupId, setShareModalGroupId] = useState<string | null>(null);
    // Delete group dialog state
    const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

    // Fetch shared groups using hook
    const { sharedGroups, loading: sharedGroupsLoading } = useSharedGroups(userId);

    // Story 14c.2: Fetch pending invitations using hook
    const { pendingInvitations, loading: invitationsLoading } = usePendingInvitations(userEmail);

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

    // Handle join with share code
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

    // Handle start editing a group
    const handleStartEdit = useCallback((group: SharedGroup) => {
        const emoji = extractGroupEmoji(group.name);
        const label = extractGroupLabel(group.name);
        setEditingGroupId(group.id!);
        setEditGroupName(label);
        setEditGroupColor(group.color);
        setEditGroupEmoji(emoji || group.icon || '');
    }, []);

    // Handle cancel editing
    const handleCancelEdit = useCallback(() => {
        setEditingGroupId(null);
        setEditGroupName('');
        setEditGroupColor('');
        setEditGroupEmoji('');
    }, []);

    // Handle save group edit
    const handleSaveEdit = useCallback(async (groupId: string) => {
        if (!editGroupName.trim()) return;

        setIsSavingEdit(true);
        const db = getFirestore();
        try {
            const newName = editGroupEmoji
                ? `${editGroupEmoji} ${editGroupName.trim()}`
                : editGroupName.trim();

            await updateSharedGroup(db, groupId, {
                name: newName,
                color: editGroupColor,
                icon: editGroupEmoji || undefined,
            });

            handleCancelEdit();
            onShowToast?.(
                lang === 'es' ? 'Grupo actualizado' : 'Group updated',
                'success'
            );
        } catch (error) {
            console.error('[GruposView] Update group error:', error);
            onShowToast?.(
                lang === 'es' ? 'Error al actualizar el grupo' : 'Error updating group',
                'error'
            );
        } finally {
            setIsSavingEdit(false);
        }
    }, [editGroupName, editGroupColor, editGroupEmoji, handleCancelEdit, lang, onShowToast]);

    // Handle create new group
    const handleCreateGroup = useCallback(async () => {
        if (!userId || !newGroupName.trim()) return;

        setIsCreating(true);

        const db = getFirestore();
        try {
            // Use selected emoji or default if none selected
            const effectiveEmoji = newGroupEmoji || DEFAULT_GROUP_EMOJI;
            const groupName = `${effectiveEmoji} ${newGroupName.trim()}`;

            await createSharedGroup(
                db,
                userId,
                appId,
                {
                    name: groupName,
                    color: newGroupColor,
                    icon: effectiveEmoji,
                },
                {
                    displayName: userDisplayName || undefined,
                    email: userEmail || undefined,
                    photoURL: userPhotoURL || undefined,
                }
            );

            // Reset form
            setNewGroupName('');
            setNewGroupEmoji('');
            setNewGroupColor(GROUP_COLORS[0]);
            setShowCreateForm(false);

            onShowToast?.(
                lang === 'es' ? 'Grupo creado exitosamente' : 'Group created successfully',
                'success'
            );
        } catch (error) {
            console.error('[GruposView] Create group error:', error);
            onShowToast?.(
                lang === 'es' ? 'Error al crear el grupo' : 'Error creating group',
                'error'
            );
        } finally {
            setIsCreating(false);
        }
    }, [userId, appId, newGroupName, newGroupColor, newGroupEmoji, lang, onShowToast, userDisplayName, userEmail, userPhotoURL]);

    // Get owned shared groups (where user is owner)
    const ownedSharedGroups = sharedGroups.filter(g => g.ownerId === userId);
    const memberSharedGroups = sharedGroups.filter(g => g.ownerId !== userId);

    // Get group being deleted (for dialog)
    const groupToDelete = deleteGroupId ? sharedGroups.find(g => g.id === deleteGroupId) : null;

    // Get group for share modal
    const shareModalGroup = shareModalGroupId ? sharedGroups.find(g => g.id === shareModalGroupId) : null;

    // Handle direct delete group (for owners)
    const handleDirectDeleteGroup = useCallback(async (groupId: string, removeTransactionTags: boolean) => {
        if (!userId) return;
        const db = getFirestore();

        // Debug: Log what we're sending
        if (import.meta.env.DEV) {
            const group = sharedGroups.find(g => g.id === groupId);
            console.log('[GruposView] Attempting to delete group:', {
                groupId,
                groupName: group?.name,
                currentUserId: userId,
                groupOwnerId: group?.ownerId,
                isOwner: group?.ownerId === userId,
            });
        }

        try {
            await deleteSharedGroupWithCleanup(db, userId, appId, groupId, removeTransactionTags);
            setDeleteGroupId(null);
            setExpandedSharedGroupId(null);
            onShowToast?.(lang === 'es' ? 'Grupo eliminado' : 'Group deleted', 'success');
        } catch (error) {
            console.error('[GruposView] Delete group error:', error);
            onShowToast?.(lang === 'es' ? 'Error al eliminar grupo' : 'Error deleting group', 'error');
            throw error;
        }
    }, [userId, appId, lang, onShowToast, sharedGroups]);

    // Helper: Extract member names/emails/photos from group.memberProfiles
    const getMemberNames = (group: SharedGroup): Record<string, string> => {
        if (!group.memberProfiles) return {};
        const result: Record<string, string> = {};
        for (const [memberId, profile] of Object.entries(group.memberProfiles)) {
            if (profile?.displayName) {
                result[memberId] = profile.displayName;
            }
        }
        return result;
    };

    const getMemberEmails = (group: SharedGroup): Record<string, string> => {
        if (!group.memberProfiles) return {};
        const result: Record<string, string> = {};
        for (const [memberId, profile] of Object.entries(group.memberProfiles)) {
            if (profile?.email) {
                result[memberId] = profile.email;
            }
        }
        return result;
    };

    const getMemberPhotos = (group: SharedGroup): Record<string, string> => {
        if (!group.memberProfiles) return {};
        const result: Record<string, string> = {};
        for (const [memberId, profile] of Object.entries(group.memberProfiles)) {
            if (profile?.photoURL) {
                result[memberId] = profile.photoURL;
            }
        }
        return result;
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

            {/* Join with Code Section */}
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

            {/* Create New Group Section */}
            {userId && (
                <div
                    className="rounded-xl p-3"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                    }}
                >
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="w-full flex items-center gap-3"
                    >
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#dbeafe' }}
                        >
                            <Plus className="w-5 h-5" style={{ color: '#3b82f6' }} />
                        </div>
                        <div className="flex-1 text-left">
                            <h3
                                className="font-medium"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {lang === 'es' ? 'Crear Nuevo Grupo' : 'Create New Group'}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {lang === 'es'
                                    ? 'Crea un grupo para compartir gastos'
                                    : 'Create a group to share expenses'
                                }
                            </p>
                        </div>
                        <ChevronRight
                            className={`w-5 h-5 transition-transform ${showCreateForm ? 'rotate-90' : ''}`}
                            style={{ color: 'var(--text-tertiary)' }}
                        />
                    </button>

                    {/* Create Form (expanded) */}
                    {showCreateForm && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                            {/* Single Row: Icon, Color, and Name */}
                            <div className="mb-3">
                                <div className="flex justify-between items-center mb-1">
                                    <label
                                        className="text-xs font-medium"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        {lang === 'es' ? 'Nombre del grupo' : 'Group name'}
                                    </label>
                                    <span
                                        className="text-xs"
                                        style={{ color: newGroupName.length >= 30 ? 'var(--error)' : 'var(--text-tertiary)' }}
                                    >
                                        {newGroupName.length}/30
                                    </span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <EmojiPicker
                                        value={newGroupEmoji}
                                        onChange={setNewGroupEmoji}
                                        disabled={isCreating}
                                        lang={lang}
                                        size="sm"
                                    />
                                    <ColorPicker
                                        value={newGroupColor}
                                        onChange={setNewGroupColor}
                                        disabled={isCreating}
                                        lang={lang}
                                        size="sm"
                                    />
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value.slice(0, 30))}
                                        placeholder={lang === 'es' ? 'Ej: Casa, Viaje, Oficina' : 'E.g., Home, Trip, Office'}
                                        className="flex-1 px-3 py-2 rounded-lg text-sm"
                                        style={{
                                            backgroundColor: 'var(--bg-tertiary)',
                                            border: '1px solid var(--border-light)',
                                            color: 'var(--text-primary)',
                                        }}
                                        maxLength={30}
                                        disabled={isCreating}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newGroupName.trim()) {
                                                handleCreateGroup();
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={handleCreateGroup}
                                disabled={isCreating || !newGroupName.trim()}
                                className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: newGroupName.trim() ? 'var(--primary)' : 'var(--bg-tertiary)',
                                    color: newGroupName.trim() ? 'white' : 'var(--text-tertiary)',
                                    opacity: isCreating ? 0.6 : 1,
                                }}
                            >
                                {isCreating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                {lang === 'es' ? 'Crear Grupo' : 'Create Group'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {sharedGroupsLoading && (
                <div className="flex items-center justify-center py-8 px-3">
                    <Loader2
                        className="w-6 h-6 animate-spin"
                        style={{ color: 'var(--primary)' }}
                    />
                </div>
            )}

            {/* Shared Groups Section (Groups user owns) */}
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
                            const isEditing = editingGroupId === group.id;

                            return (
                                <div key={group.id}>
                                    {/* Edit Mode */}
                                    {isEditing ? (
                                        <div
                                            className="rounded-lg p-3"
                                            style={{
                                                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                                border: '2px solid var(--primary)',
                                            }}
                                        >
                                            {/* Single Row: Icon, Color, Name */}
                                            <div className="flex gap-2 items-center mb-3">
                                                <EmojiPicker
                                                    value={editGroupEmoji}
                                                    onChange={setEditGroupEmoji}
                                                    disabled={isSavingEdit}
                                                    lang={lang}
                                                    size="sm"
                                                />
                                                <ColorPicker
                                                    value={editGroupColor}
                                                    onChange={setEditGroupColor}
                                                    disabled={isSavingEdit}
                                                    lang={lang}
                                                    size="sm"
                                                />
                                                <div className="flex-1 relative">
                                                    <input
                                                        type="text"
                                                        value={editGroupName}
                                                        onChange={(e) => setEditGroupName(e.target.value.slice(0, 30))}
                                                        className="w-full px-3 py-2 rounded-lg text-sm pr-12"
                                                        style={{
                                                            backgroundColor: 'var(--bg-tertiary)',
                                                            border: '1px solid var(--border-light)',
                                                            color: 'var(--text-primary)',
                                                        }}
                                                        maxLength={30}
                                                        disabled={isSavingEdit}
                                                        autoFocus
                                                    />
                                                    <span
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                                                        style={{ color: editGroupName.length >= 30 ? 'var(--error)' : 'var(--text-tertiary)' }}
                                                    >
                                                        {editGroupName.length}/30
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Action Buttons */}
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={isSavingEdit}
                                                    className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                                                    style={{
                                                        backgroundColor: 'var(--bg-tertiary)',
                                                        color: 'var(--text-secondary)',
                                                    }}
                                                    aria-label={lang === 'es' ? 'Cancelar' : 'Cancel'}
                                                >
                                                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                                                </button>
                                                <button
                                                    onClick={() => handleSaveEdit(group.id!)}
                                                    disabled={isSavingEdit || !editGroupName.trim()}
                                                    className="px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                                                    style={{
                                                        backgroundColor: editGroupName.trim() ? 'var(--primary)' : 'var(--bg-tertiary)',
                                                        color: editGroupName.trim() ? 'white' : 'var(--text-tertiary)',
                                                        opacity: isSavingEdit ? 0.6 : 1,
                                                    }}
                                                    aria-label={lang === 'es' ? 'Guardar' : 'Save'}
                                                >
                                                    {isSavingEdit ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                    {lang === 'es' ? 'Guardar' : 'Save'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode - Card contains all content */
                                        <div
                                            className="w-full rounded-lg overflow-hidden transition-colors"
                                            style={{
                                                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                                border: '1px solid var(--border-light)',
                                            }}
                                        >
                                            {/* Header row */}
                                            <div className="p-3 flex items-center gap-3">
                                                {/* Group Icon - clickable to edit */}
                                                <button
                                                    onClick={() => handleStartEdit(group)}
                                                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 hover:ring-2 hover:ring-primary"
                                                    style={{
                                                        backgroundColor: group.color,
                                                        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif',
                                                        fontSize: '1.25rem',
                                                        lineHeight: 1,
                                                    }}
                                                    aria-label={lang === 'es' ? 'Editar icono y color' : 'Edit icon and color'}
                                                >
                                                    {emoji || group.icon || ''}
                                                </button>

                                                {/* Group Info - clickable to expand */}
                                                <button
                                                    onClick={() => setExpandedSharedGroupId(isExpanded ? null : group.id!)}
                                                    className="flex-1 min-w-0 text-left"
                                                >
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
                                                </button>

                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleStartEdit(group)}
                                                    className="p-2 rounded-lg transition-colors hover:bg-black/10"
                                                    style={{ color: 'var(--text-tertiary)' }}
                                                    aria-label={lang === 'es' ? 'Editar grupo' : 'Edit group'}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>

                                                {/* Expand Arrow */}
                                                <button
                                                    onClick={() => setExpandedSharedGroupId(isExpanded ? null : group.id!)}
                                                    className="p-1"
                                                >
                                                    <ChevronRight
                                                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                        style={{ color: 'var(--text-tertiary)' }}
                                                    />
                                                </button>
                                            </div>

                                            {/* Expanded Content: Members Manager */}
                                            {isExpanded && (
                                                <div
                                                    className="px-3 pb-3 space-y-3"
                                                    style={{ borderTop: '1px solid var(--border-light)' }}
                                                >
                                                    {/* Members Header with Share Button */}
                                                    <div className="pt-3 flex items-center justify-between">
                                                        <h3
                                                            className="font-semibold text-sm"
                                                            style={{ color: 'var(--text-primary)' }}
                                                        >
                                                            {lang === 'es' ? 'Miembros' : 'Members'} ({group.members.length})
                                                        </h3>
                                                        <button
                                                            onClick={() => setShareModalGroupId(group.id!)}
                                                            className="p-2 rounded-lg transition-colors flex items-center gap-1.5"
                                                            style={{
                                                                backgroundColor: 'var(--bg-tertiary)',
                                                                color: 'var(--text-secondary)',
                                                            }}
                                                            aria-label={lang === 'es' ? 'Compartir grupo' : 'Share group'}
                                                        >
                                                            <Share2 size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Story 14c.3: Group Members Manager (without header, we provide it above) */}
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
                                                            hideHeader={true}
                                                        />
                                                    )}

                                                    {/* Delete Group Button (owner only) */}
                                                    {userId && group.ownerId === userId && (
                                                        <button
                                                            onClick={() => setDeleteGroupId(group.id!)}
                                                            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                            style={{
                                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                                color: '#ef4444',
                                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                            {lang === 'es' ? 'Eliminar grupo' : 'Delete Group'}
                                                        </button>
                                                    )}
                                                </div>
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
                                <div
                                    key={group.id}
                                    className="rounded-lg overflow-hidden"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                        border: '1px solid var(--border-light)',
                                    }}
                                >
                                    {/* Header row */}
                                    <button
                                        onClick={() => setExpandedSharedGroupId(isExpanded ? null : group.id!)}
                                        className="w-full p-3 flex items-center gap-3 transition-colors"
                                    >
                                        {/* Group Icon */}
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{
                                                backgroundColor: group.color,
                                                fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif',
                                                fontSize: '1.25rem',
                                                lineHeight: 1,
                                            }}
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
                                        <div
                                            className="px-3 pb-3"
                                            style={{ borderTop: '1px solid var(--border-light)' }}
                                        >
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

            {/* Delete Group Dialog */}
            {groupToDelete && (
                <DeleteGroupDialog
                    isOpen={!!deleteGroupId}
                    groupName={groupToDelete.name}
                    groupColor={groupToDelete.color}
                    groupIcon={groupToDelete.icon}
                    memberCount={groupToDelete.members.length}
                    onConfirm={(removeTransactionTags) => handleDirectDeleteGroup(deleteGroupId!, removeTransactionTags)}
                    onClose={() => setDeleteGroupId(null)}
                    t={t}
                    lang={lang}
                />
            )}

            {/* Share Modal */}
            {shareModalGroup && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    onClick={() => setShareModalGroupId(null)}
                >
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

                    {/* Modal Panel */}
                    <div
                        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
                        style={{ backgroundColor: 'var(--surface)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-4 py-3 border-b"
                            style={{ borderColor: 'var(--border-light)' }}
                        >
                            <h3
                                className="text-lg font-semibold"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {lang === 'es' ? 'Compartir Grupo' : 'Share Group'}
                            </h3>
                            <button
                                onClick={() => setShareModalGroupId(null)}
                                className="p-2 rounded-full transition-colors"
                                style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                                aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <ShareCodeDisplay
                                shareCode={shareModalGroup.shareCode}
                                shareLink={getShareLink(shareModalGroup.shareCode)}
                                expiresAt={shareModalGroup.shareCodeExpiresAt?.toDate() || null}
                                groupName={shareModalGroup.name}
                                isExpired={isShareCodeExpired(shareModalGroup.shareCodeExpiresAt)}
                                onRegenerate={() => handleRegenerateShareCode(shareModalGroup.id!)}
                                t={t}
                                lang={lang}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default GruposView;
