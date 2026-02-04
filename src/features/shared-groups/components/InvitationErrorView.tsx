/**
 * InvitationErrorView Component
 *
 * Story 14d-v2-1-6d: Transaction Sharing Opt-In & Error UI
 * Epic 14d-v2: Shared Groups v2
 *
 * Display component for invitation-related errors.
 * Shows appropriate error message based on error type (FR-26).
 *
 * Error Types (per FR-26):
 * - INVALID_FORMAT: Invalid or malformed share code
 * - NOT_FOUND: Invitation doesn't exist
 * - EXPIRED: Invitation has expired (>7 days)
 * - ALREADY_PROCESSED: Invitation was already accepted/declined
 *
 * Features:
 * - Clear error messaging
 * - "Back to Home" navigation
 * - Accessible design
 *
 * @example
 * ```tsx
 * <InvitationErrorView
 *   errorType="expired"
 *   onBackToHome={() => navigate('/')}
 *   t={t}
 * />
 * ```
 */

import React from 'react';
import { AlertTriangle, Home, Link2Off, Clock, CheckCircle2 } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

/**
 * Types of invitation errors (per FR-26)
 */
export type InvitationErrorType =
    | 'INVALID_FORMAT'
    | 'NOT_FOUND'
    | 'EXPIRED'
    | 'ALREADY_PROCESSED'
    | 'ALREADY_MEMBER'
    | 'GROUP_FULL'
    | 'NETWORK_ERROR'
    | 'UNKNOWN';

export interface InvitationErrorViewProps {
    /** The type of error to display */
    errorType: InvitationErrorType;
    /** Optional custom error message to display */
    customMessage?: string;
    /** Callback when user clicks "Back to Home" */
    onBackToHome: () => void;
    /** Translation function */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Language for fallback text */
    lang?: 'en' | 'es';
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the appropriate icon for an error type
 */
function getErrorIcon(errorType: InvitationErrorType): React.ReactNode {
    switch (errorType) {
        case 'INVALID_FORMAT':
        case 'NOT_FOUND':
            return <Link2Off size={48} style={{ color: '#ef4444' }} />;
        case 'EXPIRED':
            return <Clock size={48} style={{ color: '#ef4444' }} />;
        case 'ALREADY_PROCESSED':
            return <CheckCircle2 size={48} style={{ color: 'var(--text-secondary)' }} />;
        case 'ALREADY_MEMBER':
            return <CheckCircle2 size={48} style={{ color: 'var(--primary)' }} />;
        case 'GROUP_FULL':
            return <AlertTriangle size={48} style={{ color: '#f59e0b' }} />;
        default:
            return <AlertTriangle size={48} style={{ color: '#ef4444' }} />;
    }
}

// =============================================================================
// Component
// =============================================================================

export const InvitationErrorView: React.FC<InvitationErrorViewProps> = ({
    errorType,
    customMessage,
    onBackToHome,
    t,
    lang = 'es',
}) => {
    // Translations with fallbacks
    const getTexts = () => {
        const baseTexts = {
            backToHome: t('backToHome') || (lang === 'es' ? 'Volver al Inicio' : 'Back to Home'),
        };

        // Error-specific texts based on type (per FR-26)
        switch (errorType) {
            case 'INVALID_FORMAT':
            case 'NOT_FOUND':
                return {
                    ...baseTexts,
                    title: t('invalidInvitation') || (lang === 'es'
                        ? 'Invitación Inválida'
                        : 'Invalid Invitation'),
                    message: customMessage || t('invalidInviteLinkMessage') || (lang === 'es'
                        ? 'Este enlace de invitación es inválido o ha expirado.'
                        : 'This invite link is invalid or expired.'),
                    hint: t('askForNewInvite') || (lang === 'es'
                        ? 'Por favor, solicita un nuevo enlace de invitación al dueño del grupo.'
                        : 'Please ask the group owner for a new invitation link.'),
                };

            case 'EXPIRED':
                return {
                    ...baseTexts,
                    title: t('invitationExpiredTitle') || (lang === 'es'
                        ? 'Invitación Expirada'
                        : 'Invitation Expired'),
                    message: customMessage || t('invitationExpiredMessage') || (lang === 'es'
                        ? 'Esta invitación ha expirado.'
                        : 'This invitation has expired.'),
                    hint: t('askForNewInvite') || (lang === 'es'
                        ? 'Por favor, solicita un nuevo enlace de invitación.'
                        : 'Please ask for a new invite.'),
                };

            case 'ALREADY_PROCESSED':
                return {
                    ...baseTexts,
                    title: t('invitationAlreadyUsed') || (lang === 'es'
                        ? 'Invitación Ya Usada'
                        : 'Invitation Already Used'),
                    message: customMessage || t('invitationAlreadyUsedMessage') || (lang === 'es'
                        ? 'Esta invitación ya fue procesada.'
                        : 'This invitation was already used.'),
                    hint: t('checkYourGroups') || (lang === 'es'
                        ? 'Revisa tus grupos para ver si ya eres miembro.'
                        : 'Check your groups to see if you\'re already a member.'),
                };

            case 'ALREADY_MEMBER':
                return {
                    ...baseTexts,
                    title: t('alreadyMemberTitle') || (lang === 'es'
                        ? 'Ya eres Miembro'
                        : 'Already a Member'),
                    message: customMessage || t('alreadyMemberMessage') || (lang === 'es'
                        ? 'Ya eres miembro de este grupo.'
                        : 'You are already a member of this group.'),
                    hint: t('viewGroupInSettings') || (lang === 'es'
                        ? 'Puedes ver el grupo en la configuración de Grupos.'
                        : 'You can view the group in Groups settings.'),
                };

            case 'GROUP_FULL':
                return {
                    ...baseTexts,
                    title: t('groupFullTitle') || (lang === 'es'
                        ? 'Grupo Lleno'
                        : 'Group Full'),
                    message: customMessage || t('groupFullMessage') || (lang === 'es'
                        ? 'Este grupo ha alcanzado el número máximo de miembros.'
                        : 'This group has reached the maximum number of members.'),
                    hint: t('contactGroupOwner') || (lang === 'es'
                        ? 'Contacta al dueño del grupo para más información.'
                        : 'Contact the group owner for more information.'),
                };

            case 'NETWORK_ERROR':
                return {
                    ...baseTexts,
                    title: t('invitationNetworkError') || (lang === 'es'
                        ? 'Error de Conexión'
                        : 'Connection Error'),
                    message: customMessage || t('networkErrorMessage') || (lang === 'es'
                        ? 'No se pudo verificar la invitación. Verifica tu conexión a internet.'
                        : 'Could not verify the invitation. Check your internet connection.'),
                    hint: t('tryAgainLater') || (lang === 'es'
                        ? 'Intenta de nuevo más tarde.'
                        : 'Please try again later.'),
                };

            default:
                return {
                    ...baseTexts,
                    title: t('errorOccurred') || (lang === 'es'
                        ? 'Ocurrió un Error'
                        : 'An Error Occurred'),
                    message: customMessage || t('unknownErrorMessage') || (lang === 'es'
                        ? 'Algo salió mal al procesar la invitación.'
                        : 'Something went wrong processing the invitation.'),
                    hint: t('tryAgainLater') || (lang === 'es'
                        ? 'Intenta de nuevo más tarde.'
                        : 'Please try again later.'),
                };
        }
    };

    const texts = getTexts();

    return (
        <div
            className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center"
            data-testid="error-view"
        >
            {/* Error Icon */}
            <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                data-testid="error-icon"
            >
                {getErrorIcon(errorType)}
            </div>

            {/* Error Title */}
            <h1
                className="text-xl font-bold mb-3"
                style={{ color: 'var(--text-primary)' }}
                data-testid="error-title"
            >
                {texts.title}
            </h1>

            {/* Error Message */}
            <p
                className="text-sm mb-2 max-w-xs"
                style={{ color: 'var(--text-primary)' }}
                data-testid="error-message"
            >
                {texts.message}
            </p>

            {/* Hint */}
            <p
                className="text-xs mb-8 max-w-xs"
                style={{ color: 'var(--text-secondary)' }}
                data-testid="error-hint"
            >
                {texts.hint}
            </p>

            {/* Back to Home Button */}
            <button
                onClick={onBackToHome}
                className="py-3 px-6 rounded-xl text-white text-sm font-medium shadow-md transition-all flex items-center gap-2"
                style={{ backgroundColor: 'var(--primary)' }}
                data-testid="back-home-btn"
            >
                <Home size={18} />
                {texts.backToHome}
            </button>
        </div>
    );
};

export default InvitationErrorView;
