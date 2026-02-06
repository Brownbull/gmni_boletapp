/**
 * AcceptInvitationDialog Component
 *
 * Story 14d-v2-1-6c-2: Accept Invitation Dialog
 * Epic 14d-v2: Shared Groups v2
 *
 * Modal dialog for accepting or declining group invitations.
 * Features:
 * - Shows invitation details (group name, inviter, member count)
 * - Transaction sharing notice when enabled
 * - Accept/Decline/Cancel buttons
 * - Loading state during accept/decline
 * - Opt-in flow trigger when transactionSharingEnabled
 * - Success toast on accept
 * - Navigation to new group after accept
 * - Accessible (keyboard navigation, ARIA)
 *
 * @example
 * ```tsx
 * <AcceptInvitationDialog
 *   open={isOpen}
 *   invitation={selectedInvitation}
 *   onClose={() => setSelectedInvitation(null)}
 *   onAccept={handleAccept}
 *   onDecline={handleDecline}
 *   onOpenOptIn={handleOpenOptIn}
 *   isPending={isPending}
 *   t={t}
 * />
 * ```
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Users, Check, Loader2, Share2, XCircle, ArrowLeft } from 'lucide-react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '@/shared/hooks';
import { Z_INDEX } from '@/constants';
import type { PendingInvitation, SharedGroup } from '@/types/sharedGroup';
import { extractGroupEmoji, extractGroupLabel } from '@/types/sharedGroup';

// =============================================================================
// Types
// =============================================================================

export interface AcceptInvitationDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** The invitation to display */
    invitation: PendingInvitation | null;
    /** Callback when dialog should close */
    onClose: () => void;
    /** Callback when user accepts the invitation */
    onAccept: (invitation: PendingInvitation) => void;
    /** Callback when user declines the invitation */
    onDecline: (invitation: PendingInvitation) => void;
    /**
     * Callback to open opt-in flow when group has transactionSharingEnabled.
     * Story 14d-v2-1-6d will handle this flow.
     */
    onOpenOptIn?: (invitation: PendingInvitation, group: SharedGroup) => void;
    /** Whether accept/decline is in progress */
    isPending: boolean;
    /** Translation function */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

// =============================================================================
// Component
// =============================================================================

export const AcceptInvitationDialog: React.FC<AcceptInvitationDialogProps> = ({
    open,
    invitation,
    onClose,
    onAccept,
    onDecline,
    onOpenOptIn,
    isPending,
    t,
    lang = 'es',
}) => {
    // Refs
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // State for group data (fetched on open)
    const [group, setGroup] = useState<SharedGroup | null>(null);
    const [isLoadingGroup, setIsLoadingGroup] = useState(false);
    const [groupError, setGroupError] = useState<string | null>(null);

    // Fetch group data when dialog opens to get member count and sharing status
    useEffect(() => {
        if (!open || !invitation?.groupId) {
            setGroup(null);
            setGroupError(null);
            return;
        }

        const fetchGroup = async () => {
            setIsLoadingGroup(true);
            setGroupError(null);

            try {
                const db = getFirestore();
                const groupRef = doc(db, 'sharedGroups', invitation.groupId);
                const groupSnap = await getDoc(groupRef);

                if (groupSnap.exists()) {
                    setGroup({
                        id: groupSnap.id,
                        ...groupSnap.data(),
                    } as SharedGroup);
                } else {
                    setGroupError(lang === 'es'
                        ? 'El grupo ya no existe'
                        : 'Group no longer exists');
                }
            } catch {
                setGroupError(lang === 'es'
                    ? 'Error al cargar el grupo'
                    : 'Error loading group');
            } finally {
                setIsLoadingGroup(false);
            }
        };

        fetchGroup();
    }, [open, invitation?.groupId, lang]);

    // Focus close button when dialog opens
    useEffect(() => {
        if (open) {
            setTimeout(() => closeButtonRef.current?.focus(), 0);
        }
    }, [open]);

    // TD-7d-2: Shared dialog hooks for accessibility
    useEscapeKey(onClose, open, isPending);
    useFocusTrap(modalRef, open);
    useBodyScrollLock(open);

    // Handle accept - check if opt-in flow is needed
    const handleAccept = useCallback(() => {
        if (!invitation || isPending) return;

        // If group has transaction sharing enabled, trigger opt-in flow
        // Story 14d-v2-1-6d handles the opt-in dialog
        if (group?.transactionSharingEnabled && onOpenOptIn) {
            onOpenOptIn(invitation, group);
            return;
        }

        // No sharing enabled, accept directly
        onAccept(invitation);
    }, [invitation, group, isPending, onAccept, onOpenOptIn]);

    // Handle decline
    const handleDecline = useCallback(() => {
        if (!invitation || isPending) return;
        onDecline(invitation);
    }, [invitation, isPending, onDecline]);

    // Don't render if closed or no invitation
    if (!open || !invitation) return null;

    // Extract group info from invitation
    const emoji = extractGroupEmoji(invitation.groupName);
    const groupLabel = extractGroupLabel(invitation.groupName);
    const memberCount = group?.members?.length ?? 0;
    const hasTransactionSharing = group?.transactionSharingEnabled ?? false;

    // Translations with fallbacks
    const texts = {
        title: t('joinGroupTitle') || (lang === 'es' ? '¿Unirte al grupo?' : 'Join group?'),
        // Note: t() doesn't support interpolation, so we handle it manually
        invitedByMessage: (t('invitedToJoinMessage') || (lang === 'es'
            ? '{name} te invitó a unirte a este grupo.'
            : '{name} invited you to join this group.')).replace('{name}', invitation.invitedByName || (lang === 'es' ? 'El dueño del grupo' : 'Group Owner')),
        members: t('members') || (lang === 'es' ? 'miembros' : 'members'),
        member: t('member') || (lang === 'es' ? 'miembro' : 'member'),
        transactionSharing: t('transactionSharingLabel') || (lang === 'es'
            ? 'Compartir Transacciones'
            : 'Transaction Sharing'),
        enabled: t('enabled') || (lang === 'es' ? 'Habilitado' : 'Enabled'),
        cancel: t('cancel') || (lang === 'es' ? 'Cancelar' : 'Cancel'),
        decline: t('declineInvitation') || (lang === 'es' ? 'Rechazar' : 'Decline'),
        join: t('joinGroup') || (lang === 'es' ? 'Unirse' : 'Join'),
        reviewAndJoin: t('reviewAndJoin') || (lang === 'es' ? 'Revisar y Unirse' : 'Review & Join'),
        joining: t('joining') || (lang === 'es' ? 'Uniendo...' : 'Joining...'),
        close: t('close') || (lang === 'es' ? 'Cerrar' : 'Close'),
        loadingGroup: t('loadingGroup') || (lang === 'es' ? 'Cargando grupo...' : 'Loading group...'),
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: Z_INDEX.MODAL }}
            role="presentation"
            data-testid="accept-invitation-dialog-backdrop"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
                onClick={isPending ? undefined : onClose}
                data-testid="backdrop-overlay"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="accept-invitation-title"
                className="relative z-10 w-full max-w-sm mx-4 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
                onClick={(e) => e.stopPropagation()}
                data-testid="accept-invitation-dialog"
            >
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    onClick={onClose}
                    disabled={isPending}
                    className="absolute right-4 top-4 p-2 rounded-full transition-colors disabled:opacity-50"
                    style={{ color: 'var(--secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    aria-label={texts.close}
                    data-testid="close-btn"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    {/* Header with Group Icon */}
                    <div className="flex items-center gap-4 mb-5">
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{
                                backgroundColor: invitation.groupColor || '#10b981',
                            }}
                            data-testid="group-icon"
                        >
                            {emoji || invitation.groupIcon || <Users className="w-7 h-7 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2
                                id="accept-invitation-title"
                                className="text-lg font-bold truncate"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {texts.title}
                            </h2>
                            <p
                                className="text-sm truncate font-medium"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {groupLabel}
                            </p>
                        </div>
                    </div>

                    {/* Group Info Section */}
                    <div
                        className="p-4 rounded-xl mb-5"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-light)',
                        }}
                        data-testid="group-info"
                    >
                        {/* Invitation Message */}
                        <p
                            className="text-sm mb-3"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {texts.invitedByMessage}
                        </p>

                        {/* Member Count */}
                        {isLoadingGroup ? (
                            <div
                                className="flex items-center gap-2 text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {texts.loadingGroup}
                            </div>
                        ) : groupError ? (
                            <p
                                className="text-sm"
                                style={{ color: '#ef4444' }}
                            >
                                {groupError}
                            </p>
                        ) : (
                            <>
                                <div
                                    className="flex items-center gap-2 text-sm"
                                    style={{ color: 'var(--text-secondary)' }}
                                    data-testid="member-count"
                                >
                                    <Users className="w-4 h-4" />
                                    <span>{memberCount} {memberCount === 1 ? texts.member : texts.members}</span>
                                </div>

                                {/* Transaction Sharing Notice */}
                                {hasTransactionSharing && (
                                    <div
                                        className="flex items-center gap-2 text-sm mt-2 pt-2"
                                        style={{
                                            color: 'var(--text-secondary)',
                                            borderTop: '1px solid var(--border-light)',
                                        }}
                                        data-testid="sharing-notice"
                                    >
                                        <Share2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                                        <span>{texts.transactionSharing}: <strong style={{ color: 'var(--primary)' }}>{texts.enabled}</strong></span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        {/* Accept/Join Button */}
                        <button
                            onClick={handleAccept}
                            disabled={isPending || isLoadingGroup || !!groupError}
                            className="w-full py-3 px-4 rounded-xl text-white text-sm font-medium shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ backgroundColor: 'var(--primary)' }}
                            data-testid="accept-btn"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} data-testid="loading-spinner" />
                                    {texts.joining}
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    {hasTransactionSharing ? texts.reviewAndJoin : texts.join}
                                </>
                            )}
                        </button>

                        {/* Decline Button */}
                        <button
                            onClick={handleDecline}
                            disabled={isPending}
                            className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                            }}
                            data-testid="decline-btn"
                        >
                            <XCircle size={16} />
                            {texts.decline}
                        </button>

                        {/* Cancel Button */}
                        <button
                            onClick={onClose}
                            disabled={isPending}
                            className="w-full py-3 px-4 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{
                                borderColor: 'var(--border-light)',
                                color: 'var(--text-primary)',
                                backgroundColor: 'var(--bg-secondary)',
                            }}
                            data-testid="cancel-btn"
                        >
                            <ArrowLeft size={16} />
                            {texts.cancel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcceptInvitationDialog;
