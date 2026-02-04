/**
 * PendingInvitationsView Component
 *
 * Story 14d-v2-1-6c-1: Pending Invitations Badge & List UI
 * Task 7: Invitations List UI (AC #2)
 *
 * Standalone view for displaying pending group invitations.
 * Shows:
 * - Loading state while fetching invitations
 * - Empty state when no invitations exist
 * - List of invitations with Accept/Decline buttons
 *
 * Data-testid attributes (Task 8.5):
 * - pending-invitations-view: Container element
 * - pending-invitations-loading: Loading indicator
 * - pending-invitations-empty: Empty state container
 *
 * @example
 * ```tsx
 * <PendingInvitationsView
 *   t={t}
 *   theme="light"
 *   lang="en"
 *   onShowToast={showToast}
 * />
 * ```
 */

import React from 'react';
import { Loader2, Mail, Inbox } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePendingInvitationsCount } from '@/hooks/usePendingInvitationsCount';
import { PendingInvitationsSection } from './PendingInvitationsSection';

// =============================================================================
// Types
// =============================================================================

export interface PendingInvitationsViewProps {
    /** Translation function */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Theme for styling */
    theme?: string;
    /** Language preference */
    lang?: 'en' | 'es';
    /** Toast notification callback */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
    /** Application ID */
    appId?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * PendingInvitationsView - Standalone view for pending invitations.
 *
 * Displays pending invitations sorted by date (newest first) with:
 * - Group name, inviter name, and invitation date
 * - Accept and Decline buttons for each invitation
 * - Loading and empty states
 *
 * AC #2: Multiple invitations shown sorted by date (newest first)
 */
export const PendingInvitationsView: React.FC<PendingInvitationsViewProps> = ({
    t,
    theme = 'light',
    lang = 'es',
    onShowToast,
    appId = 'boletapp',
}) => {
    // Auth state
    const { user } = useAuth();

    // Pending invitations data
    const {
        invitations,
        isLoading,
        hasInvitations,
        refetch,
    } = usePendingInvitationsCount(user);

    // Callback when invitation is handled
    const handleInvitationHandled = () => {
        refetch();
    };

    // =========================================================================
    // Loading State (Task 7.5)
    // =========================================================================

    if (isLoading) {
        return (
            <div
                className="flex flex-col items-center justify-center py-12"
                data-testid="pending-invitations-loading"
            >
                <Loader2
                    className="w-8 h-8 animate-spin mb-4"
                    style={{ color: 'var(--primary)' }}
                />
                <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {t('loading') || (lang === 'es' ? 'Cargando...' : 'Loading...')}
                </p>
            </div>
        );
    }

    // =========================================================================
    // Empty State (Task 7.4)
    // =========================================================================

    if (!hasInvitations) {
        return (
            <div
                className="flex flex-col items-center justify-center py-12 px-6 text-center"
                data-testid="pending-invitations-empty"
            >
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                    <Inbox
                        className="w-8 h-8"
                        style={{ color: 'var(--text-tertiary)' }}
                    />
                </div>
                <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {t('noPendingInvitations') || (lang === 'es'
                        ? 'No tienes invitaciones pendientes'
                        : 'No pending invitations')}
                </h3>
                <p
                    className="text-sm max-w-xs"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {t('noPendingInvitationsDesc') || (lang === 'es'
                        ? 'Cuando alguien te invite a un grupo, aparecerá aquí'
                        : "When someone invites you to a group, it will appear here")}
                </p>
            </div>
        );
    }

    // =========================================================================
    // Invitations List (Tasks 7.1-7.3)
    // =========================================================================

    return (
        <div data-testid="pending-invitations-view">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 px-4 pt-4">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--notification-amber-bg, #fef3c7)' }}
                >
                    <Mail
                        className="w-5 h-5"
                        style={{ color: 'var(--notification-amber-icon, #d97706)' }}
                    />
                </div>
                <div>
                    <h2
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {t('pendingInvitations') || (lang === 'es'
                            ? 'Invitaciones Pendientes'
                            : 'Pending Invitations')}
                    </h2>
                    <p
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('pendingInvitationsDesc') || (lang === 'es'
                            ? 'Te han invitado a unirte a estos grupos'
                            : 'You have been invited to join these groups')}
                    </p>
                </div>
            </div>

            {/* Invitations List - showHeader=false since this view has its own header */}
            {user && (
                <PendingInvitationsSection
                    invitations={invitations}
                    userId={user.uid}
                    appId={appId}
                    t={t}
                    theme={theme}
                    lang={lang}
                    onInvitationHandled={handleInvitationHandled}
                    onShowToast={onShowToast}
                    showHeader={false}
                />
            )}
        </div>
    );
};

export default PendingInvitationsView;
