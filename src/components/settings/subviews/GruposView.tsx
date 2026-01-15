/**
 * GruposView - Custom Groups Settings Sub-View
 *
 * Story 14c.1: Create Shared Group
 * Story 14c.2: Accept/Decline Invitation
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
 */

import React, { useState, useCallback } from 'react';
import { Users, Share2, Plus, FolderOpen, ChevronRight, Loader2 } from 'lucide-react';
import { getFirestore } from 'firebase/firestore';
import type { TransactionGroup } from '../../../types/transactionGroup';
import type { SharedGroup } from '../../../types/sharedGroup';
import { extractGroupEmoji, extractGroupLabel } from '../../../types/transactionGroup';
import { MakeShareableDialog } from '../../SharedGroups/MakeShareableDialog';
import { ShareCodeDisplay } from '../../SharedGroups/ShareCodeDisplay';
import { PendingInvitationsSection } from '../../SharedGroups/PendingInvitationsSection';
import {
    createSharedGroup,
    regenerateShareCode,
    getShareLink,
    isShareCodeExpired,
} from '../../../services/sharedGroupService';
import { useGroups } from '../../../hooks/useGroups';
import { useSharedGroups } from '../../../hooks/useSharedGroups';
import { usePendingInvitations } from '../../../hooks/usePendingInvitations';

export interface GruposViewProps {
    t: (key: string, params?: Record<string, string | number>) => string;
    theme: string;
    /** Current user ID - required for data fetching */
    userId?: string | null;
    /** User email - required for pending invitations */
    userEmail?: string | null;
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
    appId = 'boletapp',
    onCreateGroup,
    lang = 'es',
    onShowToast,
}) => {
    const isDark = theme === 'dark';
    const [selectedGroup, setSelectedGroup] = useState<TransactionGroup | null>(null);
    const [showMakeShareableDialog, setShowMakeShareableDialog] = useState(false);
    const [expandedSharedGroupId, setExpandedSharedGroupId] = useState<string | null>(null);

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
        return createSharedGroup(db, userId, appId, {
            name: group.name,
            color: group.color,
            icon: extractGroupEmoji(group.name) || undefined,
        });
    }, [userId, appId]);

    // Handle regenerate share code
    const handleRegenerateShareCode = useCallback(async (groupId: string) => {
        const db = getFirestore();
        await regenerateShareCode(db, groupId);
    }, []);

    // Open make shareable dialog
    const openMakeShareableDialog = (group: TransactionGroup) => {
        setSelectedGroup(group);
        setShowMakeShareableDialog(true);
    };

    // Get owned shared groups (where user is owner)
    const ownedSharedGroups = sharedGroups.filter(g => g.ownerId === userId);
    const memberSharedGroups = sharedGroups.filter(g => g.ownerId !== userId);

    // Check if a group is already shared
    const isGroupShared = (groupId: string | undefined): boolean => {
        if (!groupId) return false;
        return sharedGroups.some(sg => sg.name === groups.find(g => g.id === groupId)?.name);
    };

    return (
        <div className="space-y-4 pb-4">
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

            {/* Custom Groups Section */}
            <div
                className="rounded-xl p-4"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                }}
            >
                <div className="flex items-center gap-3 mb-4">
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
                    <div className="flex items-center justify-center py-8">
                        <Loader2
                            className="w-6 h-6 animate-spin"
                            style={{ color: 'var(--primary)' }}
                        />
                    </div>
                )}

                {/* Empty State - No groups yet */}
                {!groupsLoading && groups.length === 0 && (
                    <div
                        className="rounded-lg p-6 text-center"
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
                    <div className="space-y-2">
                        {groups.map((group) => {
                            const emoji = extractGroupEmoji(group.name);
                            const label = extractGroupLabel(group.name);
                            const isShared = isGroupShared(group.id);

                            return (
                                <div
                                    key={group.id}
                                    className="rounded-lg p-3 flex items-center gap-3"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                        border: '1px solid var(--border-light)',
                                    }}
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
                                    <div className="flex-1 min-w-0">
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

                                    {/* Make Shareable Button */}
                                    {!isShared ? (
                                        <button
                                            onClick={() => openMakeShareableDialog(group)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                                            style={{
                                                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                                color: '#a855f7',
                                                border: '1px solid rgba(168, 85, 247, 0.2)',
                                            }}
                                            disabled={!userId || !appId}
                                        >
                                            <Share2 className="w-3.5 h-3.5" />
                                            <span>
                                                {lang === 'es' ? 'Compartir' : 'Share'}
                                            </span>
                                        </button>
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
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Shared Groups Section (Groups user owns and has shared) */}
            {!sharedGroupsLoading && ownedSharedGroups.length > 0 && (
                <div
                    className="rounded-xl p-4"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                    }}
                >
                    <div className="flex items-center gap-3 mb-4">
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

                    <div className="space-y-2">
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

                                    {/* Expanded Share Code */}
                                    {isExpanded && (
                                        <div className="mt-2 ml-2 mr-2">
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
                    className="rounded-xl p-4"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                    }}
                >
                    <div className="flex items-center gap-3 mb-4">
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

                    <div className="space-y-2">
                        {memberSharedGroups.map((group) => {
                            const emoji = extractGroupEmoji(group.name);
                            const label = extractGroupLabel(group.name);

                            return (
                                <div
                                    key={group.id}
                                    className="rounded-lg p-3 flex items-center gap-3"
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
                                    <div className="flex-1 min-w-0">
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
        </div>
    );
};

export default GruposView;
