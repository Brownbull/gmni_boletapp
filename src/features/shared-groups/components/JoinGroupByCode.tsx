/**
 * JoinGroupByCode Component
 *
 * Story 14d-v2-1-6c-1: Enhancement - Manual Share Code Entry
 * Epic 14d-v2: Shared Groups v2
 *
 * Allows users to manually enter a share code to join a group.
 * Alternative to clicking a deep link.
 *
 * Features:
 * - Input field for share code
 * - Validation (16 alphanumeric chars)
 * - Lookup invitation by code
 * - Error handling for invalid/expired/not-found codes
 *
 * @example
 * ```tsx
 * <JoinGroupByCode
 *   t={t}
 *   lang="en"
 *   onInvitationFound={(invitation) => showAcceptDialog(invitation)}
 *   onShowToast={showToast}
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import { KeyRound, Search, Loader2, AlertCircle } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFirestore, Timestamp } from 'firebase/firestore';
import { isValidShareCode } from '@/utils/shareCodeUtils';
import { getInvitationByShareCode } from '@/services/invitationService';
import { getGroupByShareCode } from '@/features/shared-groups';
import type { PendingInvitation, SharedGroup } from '@/types/sharedGroup';
import { isShareCodeExpired } from '@/features/shared-groups';
import { safeCSSColor } from '@/utils/validationUtils';

// =============================================================================
// Types
// =============================================================================

export interface JoinGroupByCodeProps {
    /** Translation function */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
    /** Callback when valid invitation is found */
    onInvitationFound: (invitation: PendingInvitation) => void;
    /** Toast notification callback */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * JoinGroupByCode - Manual share code entry component.
 *
 * Provides an input field for users to enter a share code they received
 * (via text, email, etc.) to join a shared group.
 */
export const JoinGroupByCode: React.FC<JoinGroupByCodeProps> = ({
    t,
    lang = 'es',
    onInvitationFound,
    onShowToast,
}) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Translations
    const texts = {
        title: t('joinByCode') || (lang === 'es' ? 'Unirse con Código' : 'Join by Code'),
        placeholder: t('enterShareCode') || (lang === 'es' ? 'Ingresa el código de invitación' : 'Enter invitation code'),
        joinButton: t('joinGroup') || (lang === 'es' ? 'Unirse' : 'Join'),
        searching: t('searching') || (lang === 'es' ? 'Buscando...' : 'Searching...'),
        invalidCode: t('invalidShareCode') || (lang === 'es'
            ? 'Código inválido. Debe tener 16 caracteres alfanuméricos.'
            : 'Invalid code. Must be 16 alphanumeric characters.'),
        notFound: t('invitationNotFound') || (lang === 'es'
            ? 'No se encontró ninguna invitación con este código.'
            : 'No invitation found with this code.'),
        expired: t('invitationExpired') || (lang === 'es'
            ? 'Esta invitación ha expirado.'
            : 'This invitation has expired.'),
        networkError: t('networkError') || (lang === 'es'
            ? 'Error de conexión. Intenta de nuevo.'
            : 'Connection error. Please try again.'),
    };

    // Handle code input change
    const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow alphanumeric, dash, underscore (nanoid URL-safe alphabet)
        const value = e.target.value.replace(/[^A-Za-z0-9_-]/g, '');
        setCode(value);
        setError(null);
    }, []);

    /**
     * Create a synthetic PendingInvitation from a SharedGroup.
     * Used when the share code matches a group directly (not an email invitation).
     */
    const createInvitationFromGroup = useCallback((group: SharedGroup): PendingInvitation => {
        const now = new Date();
        const expiresAt = group.shareCodeExpiresAt?.toDate?.() || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const groupId = group.id ?? '';

        return {
            id: `group-${groupId}`, // Synthetic ID to indicate it's from a group
            groupId,
            groupName: group.name,
            groupColor: safeCSSColor(group.color),
            groupIcon: group.icon,
            shareCode: group.shareCode,
            invitedEmail: '', // No email for direct share code join
            invitedByUserId: group.ownerId,
            invitedByName: group.memberProfiles?.[group.ownerId]?.displayName || '',
            createdAt: group.createdAt || Timestamp.now(),
            expiresAt: Timestamp.fromDate(expiresAt),
            status: 'pending',
        };
    }, []);

    // Handle form submit
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate code format
        if (!isValidShareCode(code)) {
            setError(texts.invalidCode);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const db = getFirestore();

            // TD-CONSOLIDATED-5: Pass user email to comply with security rules
            const userEmail = getAuth().currentUser?.email ?? null;

            // First, try to find a pending invitation with this share code
            const invitation = await getInvitationByShareCode(db, code, userEmail);

            if (invitation) {
                // Found an invitation - check if expired
                const now = new Date();
                const expiresAt = invitation.expiresAt?.toDate?.();
                if (expiresAt && now > expiresAt) {
                    setError(texts.expired);
                    setIsLoading(false);
                    return;
                }

                // Success - clear input and call callback
                setCode('');
                setIsLoading(false);
                onInvitationFound(invitation);
                return;
            }

            // No invitation found - try to find a group with this share code
            const group = await getGroupByShareCode(db, code);

            if (group) {
                // Check if share code is expired
                if (isShareCodeExpired(group)) {
                    setError(texts.expired);
                    setIsLoading(false);
                    return;
                }

                // Create a synthetic invitation from the group
                const syntheticInvitation = createInvitationFromGroup(group);

                // Success - clear input and call callback
                setCode('');
                setIsLoading(false);
                onInvitationFound(syntheticInvitation);
                return;
            }

            // Neither invitation nor group found
            setError(texts.notFound);
            setIsLoading(false);

        } catch (err) {
            if (import.meta.env.DEV) {
                console.error('[JoinGroupByCode] Error fetching invitation:', err);
            }
            setError(texts.networkError);
            setIsLoading(false);
            onShowToast?.(texts.networkError, 'error');
        }
    }, [code, texts, onInvitationFound, onShowToast, createInvitationFromGroup]);

    return (
        <div
            className="rounded-xl p-4 mb-4"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
            }}
            data-testid="join-group-by-code"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                    <KeyRound className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                    <h3
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {texts.title}
                    </h3>
                </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={code}
                        onChange={handleCodeChange}
                        placeholder={texts.placeholder}
                        maxLength={16}
                        disabled={isLoading}
                        className="w-full px-3 py-2.5 rounded-lg text-sm font-mono tracking-wide"
                        style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: error ? '1px solid #ef4444' : '1px solid var(--border-light)',
                        }}
                        data-testid="share-code-input"
                        aria-label={texts.placeholder}
                        aria-invalid={!!error}
                        aria-describedby={error ? 'share-code-error' : undefined}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading || code.length === 0}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    style={{
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                    }}
                    data-testid="join-by-code-btn"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                        {isLoading ? texts.searching : texts.joinButton}
                    </span>
                </button>
            </form>

            {/* Error Message */}
            {error && (
                <div
                    id="share-code-error"
                    className="flex items-center gap-2 mt-2 text-xs"
                    style={{ color: '#ef4444' }}
                    role="alert"
                    data-testid="share-code-error"
                >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default JoinGroupByCode;
