/**
 * GruposView - Shared Groups Settings (Epic 14d-v2)
 * TD-CONSOLIDATED-2: Handlers → useGruposViewHandlers, dialogs → GruposViewDialogs
 */

import React from 'react';
import { Users, Plus, Loader2, UserPlus, LogOut, ArrowRightLeft, Settings } from 'lucide-react';
import { APP_ID } from '@/config/constants';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/app/useOnlineStatus';
import {
    useCreateGroup,
    useGroups,
    useCanCreateGroup,
    useGroupCount,
    useLeaveTransferFlow,
    PendingInvitationsSection,
    JoinGroupByCode,
} from '@/features/shared-groups';
import { usePendingInvitationsCount } from '@/hooks/usePendingInvitationsCount';
// TD-7d-1: useGroupDialogs hook for dialog state management
// Uses the backward-compatible re-export from @/hooks for test mock compatibility
import { useGroupDialogs } from '@/hooks/useGroupDialogs';
import { useGruposViewHandlers } from './useGruposViewHandlers';
import { GruposViewDialogs } from './GruposViewDialogs';
import { safeCSSColor } from '@/utils/validationUtils';

export interface GruposViewProps {
    t: (key: string, params?: Record<string, string | number>) => string;
    theme: string;
    /** Language preference */
    lang?: 'en' | 'es';
    /** Toast notification callback */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

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
    const { dialogs, actions } = useGroupDialogs();

    // Groups query (Story 14d-v2-1-7d: added refetch for leave/transfer operations)
    const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useGroups(user, services);

    // TD-7d-1: Leave/Transfer flow handlers via useLeaveTransferFlow hook
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

    // TD-CONSOLIDATED-2: All handler logic extracted to useGruposViewHandlers
    const handlers = useGruposViewHandlers({
        dialogs,
        actions,
        user,
        services,
        isOnline,
        leaveTransferHandlers,
        createGroupAsync,
        isCreating,
        resetCreate,
        refetchGroups,
        refetchInvitations,
        onShowToast,
        t,
        lang,
    });

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
                    onInvitationHandled={handlers.handleInvitationHandled}
                    onShowToast={onShowToast}
                />
            )}

            {/* Join by Code - Manual share code entry */}
            <JoinGroupByCode
                t={t}
                lang={lang}
                onInvitationFound={handlers.handleInvitationFoundByCode}
                onShowToast={onShowToast}
            />

            {/* Content */}
            {hasGroups ? (
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
                                            backgroundColor: safeCSSColor(group.color, 'var(--primary)'),
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
                                                onClick={() => handlers.handleOpenInviteDialog(group)}
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
                                                onClick={() => handlers.handleOpenTransferSelector(group)}
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
                                            onClick={() => handlers.handleLeaveClick(group)}
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

            {/* TD-CONSOLIDATED-2: All 10 dialogs extracted to GruposViewDialogs */}
            <GruposViewDialogs
                dialogs={dialogs}
                handlers={handlers}
                actions={actions}
                user={user}
                isCreating={isCreating}
                limitLoading={limitLoading}
                canCreate={canCreate}
                groupCount={groupCount ?? 0}
                onShowToast={onShowToast}
                t={t}
                lang={lang}
            />
        </div>
    );
};

export default GruposView;
