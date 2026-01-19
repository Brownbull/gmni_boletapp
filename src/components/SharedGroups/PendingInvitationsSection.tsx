/**
 * PendingInvitationsSection Component
 *
 * Story 14c.2: Accept/Decline Invitation
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Displays pending invitations at the top of the Groups settings view.
 * Users can accept or decline invitations to join shared groups.
 *
 * Features:
 * - Shows invitation cards with group info, inviter name, expiry time
 * - Accept and Decline buttons for each invitation
 * - Expired invitations shown grayed out with dismiss option
 * - Loading and error states
 * - Toast notifications on accept/decline
 */

import React, { useState, useCallback } from 'react';
import { Mail, Clock, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { getFirestore } from 'firebase/firestore';
import type { PendingInvitation } from '../../types/sharedGroup';
import { isInvitationExpired, getInvitationTimeRemaining } from '../../types/sharedGroup';
import { acceptInvitation, declineInvitation } from '../../services/sharedGroupService';
import { classifyError, getErrorConfig, SharedGroupErrorType } from '../../lib/sharedGroupErrors';

// ============================================================================
// Local Helper Functions (Story 14c.8: Group Consolidation)
// ============================================================================

/**
 * Extract emoji from group name (e.g., "🏠 Family" → "🏠")
 */
function extractGroupEmoji(name: string): string | null {
    if (!name) return null;
    const firstChar = name.codePointAt(0);
    if (firstChar && firstChar > 0x1F300) {
        const match = name.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
        return match ? match[0] : null;
    }
    return null;
}

/**
 * Extract label from group name (e.g., "🏠 Family" → "Family")
 */
function extractGroupLabel(name: string): string {
    if (!name) return '';
    const emoji = extractGroupEmoji(name);
    if (emoji) {
        return name.slice(emoji.length).trim();
    }
    return name;
}

export interface PendingInvitationsSectionProps {
    /** Pending invitations to display */
    invitations: PendingInvitation[];
    /** Current user ID */
    userId: string;
    /** App ID (e.g., 'boletapp') */
    appId: string;
    /** Translation function */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Theme */
    theme?: string;
    /** Language */
    lang?: 'en' | 'es';
    /** Callback when invitation is accepted/declined (to refresh list) */
    onInvitationHandled?: () => void;
    /** Toast callback */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

export const PendingInvitationsSection: React.FC<PendingInvitationsSectionProps> = ({
    invitations,
    userId,
    appId,
    t,
    theme = 'light',
    lang: _lang = 'es',
    onInvitationHandled,
    onShowToast,
}) => {
    // _lang reserved for future localization
    void _lang;
    const isDark = theme === 'dark';
    const [processingId, setProcessingId] = useState<string | null>(null);

    // AC5: Handle accept invitation
    const handleAccept = useCallback(async (invitation: PendingInvitation) => {
        if (!invitation.id) return;

        setProcessingId(invitation.id);
        try {
            const db = getFirestore();
            const { groupName } = await acceptInvitation(db, userId, appId, invitation.id);

            // Show success toast
            onShowToast?.(
                t('acceptInvitationSuccess', { groupName }),
                'success'
            );

            onInvitationHandled?.();
        } catch (error) {
            // AC8: Use classifyError for unified error handling (Story 14c.11)
            const classifiedError = classifyError(error);
            const errorConfig = getErrorConfig(classifiedError.type);

            // Get translated message from error config
            const displayMessage = t(errorConfig.messageKey);
            onShowToast?.(displayMessage, 'error');
        } finally {
            setProcessingId(null);
        }
    }, [userId, appId, t, onInvitationHandled, onShowToast]);

    // AC6: Handle decline invitation
    const handleDecline = useCallback(async (invitation: PendingInvitation) => {
        if (!invitation.id) return;

        setProcessingId(invitation.id);
        try {
            const db = getFirestore();
            await declineInvitation(db, invitation.id);

            // Show success toast
            onShowToast?.(t('declineInvitationSuccess'), 'success');

            onInvitationHandled?.();
        } catch (error) {
            // Use classifyError for unified error handling (Story 14c.11)
            const classifiedError = classifyError(error);
            const errorConfig = getErrorConfig(classifiedError.type);
            const displayMessage = t(errorConfig.messageKey);
            onShowToast?.(displayMessage, 'error');
        } finally {
            setProcessingId(null);
        }
    }, [t, onInvitationHandled, onShowToast]);

    // AC7: Handle dismiss expired invitation
    const handleDismissExpired = useCallback(async (invitation: PendingInvitation) => {
        // Declining an expired invitation just removes it from the list
        await handleDecline(invitation);
    }, [handleDecline]);

    // Format time remaining
    const formatTimeRemaining = (invitation: PendingInvitation): string => {
        const remaining = getInvitationTimeRemaining(invitation);
        if (!remaining) return t('expired');

        if (remaining.days > 0) {
            return t('expiresIn', { days: remaining.days });
        }
        return t('expiresInHours', { hours: remaining.hours });
    };

    if (invitations.length === 0) {
        return null;
    }

    return (
        <div
            className="rounded-xl p-4 mb-4"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
            }}
        >
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#fef3c7' }} // Amber-100
                >
                    <Mail className="w-5 h-5" style={{ color: '#d97706' }} />
                </div>
                <div className="flex-1">
                    <h3
                        className="font-medium"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {t('pendingInvitations')}
                    </h3>
                    <p
                        className="text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {t('pendingInvitationsDesc')}
                    </p>
                </div>
            </div>

            {/* Invitation Cards */}
            <div className="space-y-3">
                {invitations.map((invitation) => {
                    const expired = isInvitationExpired(invitation);
                    const isProcessing = processingId === invitation.id;
                    const emoji = extractGroupEmoji(invitation.groupName);
                    const label = extractGroupLabel(invitation.groupName);

                    return (
                        <div
                            key={invitation.id}
                            className={`rounded-lg p-4 transition-opacity ${expired ? 'opacity-60' : ''}`}
                            style={{
                                backgroundColor: isDark
                                    ? 'rgba(0,0,0,0.2)'
                                    : 'rgba(0,0,0,0.03)',
                                border: `1px solid ${expired
                                    ? 'var(--border-light)'
                                    : 'var(--primary)'
                                }`,
                            }}
                        >
                            {/* Group Info Row */}
                            <div className="flex items-start gap-3 mb-3">
                                {/* Group Icon */}
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                                    style={{
                                        backgroundColor: invitation.groupColor || '#10b981',
                                    }}
                                >
                                    {emoji || invitation.groupIcon || ''}
                                </div>

                                {/* Group Details */}
                                <div className="flex-1 min-w-0">
                                    <div
                                        className="font-medium truncate"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        {label}
                                    </div>
                                    <div
                                        className="text-sm"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        {t('invitedBy', { name: invitation.invitedByName })}
                                    </div>
                                    <div
                                        className="text-xs flex items-center gap-1 mt-1"
                                        style={{
                                            color: expired
                                                ? 'var(--error, #ef4444)'
                                                : 'var(--text-tertiary)',
                                        }}
                                    >
                                        <Clock className="w-3 h-3" />
                                        {formatTimeRemaining(invitation)}
                                    </div>
                                </div>
                            </div>

                            {/* AC2: Expired invitation help text (Story 14c.11) */}
                            {expired && (
                                <div
                                    className="text-xs mb-3 p-2 rounded-lg"
                                    style={{
                                        backgroundColor: isDark
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : 'rgba(239, 68, 68, 0.05)',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {t(getErrorConfig(SharedGroupErrorType.INVITATION_EXPIRED).messageKey)}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {expired ? (
                                    // AC7: Expired invitation shows dismiss button
                                    <button
                                        onClick={() => handleDismissExpired(invitation)}
                                        disabled={isProcessing}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                        style={{
                                            backgroundColor: isDark
                                                ? 'rgba(255,255,255,0.1)'
                                                : 'rgba(0,0,0,0.05)',
                                            color: 'var(--text-secondary)',
                                        }}
                                    >
                                        {isProcessing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4" />
                                                {t('dismissExpired')}
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    // AC4: Accept and Decline buttons
                                    <>
                                        <button
                                            onClick={() => handleDecline(invitation)}
                                            disabled={isProcessing}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                            style={{
                                                backgroundColor: isDark
                                                    ? 'rgba(239, 68, 68, 0.1)'
                                                    : 'rgba(239, 68, 68, 0.05)',
                                                color: '#ef4444',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                            }}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <X className="w-4 h-4" />
                                                    {t('declineInvitation')}
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleAccept(invitation)}
                                            disabled={isProcessing}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                            style={{
                                                backgroundColor: 'var(--primary)',
                                                color: 'white',
                                            }}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    {t('acceptInvitation')}
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PendingInvitationsSection;
