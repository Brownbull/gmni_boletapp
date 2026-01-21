/**
 * Story 14c-refactor.5: GruposView - STUBBED (Feature Disabled)
 *
 * STUB: Shared Groups feature is temporarily unavailable.
 *
 * This view shows a "Coming soon" placeholder instead of the full groups management UI.
 * Original functionality will be restored in Epic 14d (Shared Groups v2).
 */

import React from 'react';
import { Users } from 'lucide-react';

export interface GruposViewProps {
    t: (key: string, params?: Record<string, string | number>) => string;
    theme: string;
    /** @deprecated - IGNORED (feature disabled) */
    userId?: string | null;
    /** @deprecated - IGNORED (feature disabled) */
    userEmail?: string | null;
    /** @deprecated - IGNORED (feature disabled) */
    userDisplayName?: string | null;
    /** @deprecated - IGNORED (feature disabled) */
    userPhotoURL?: string | null;
    /** @deprecated - IGNORED (feature disabled) */
    appId?: string;
    /** @deprecated - IGNORED (feature disabled) */
    lang?: 'en' | 'es';
    /** @deprecated - IGNORED (feature disabled) */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

/**
 * STUB: GruposView - Shared Groups Settings
 *
 * Shared Groups feature is temporarily disabled.
 * Shows a "Coming soon" placeholder message.
 */
export const GruposView: React.FC<GruposViewProps> = ({
    t,
    theme,
}) => {
    const isDark = theme === 'dark';

    // Translations with fallbacks
    const title = t('featureComingSoon') || 'Próximamente';
    const description = t('featureComingSoonDescription') || 'Esta función está siendo rediseñada para una mejor experiencia. ¡Mantente atento!';

    return (
        <div
            className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"
            data-testid="grupos-view-coming-soon"
        >
            {/* Icon container */}
            <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{
                    backgroundColor: isDark
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(59, 130, 246, 0.1)',
                }}
            >
                <Users
                    className="w-12 h-12"
                    style={{ color: '#3b82f6' }}
                />
            </div>

            {/* House emoji */}
            <div
                className="text-5xl mb-4"
                aria-hidden="true"
            >
                🏠
            </div>

            {/* Title */}
            <h2
                className="text-xl font-bold mb-3"
                style={{ color: 'var(--text-primary, #0f172a)' }}
            >
                {title}
            </h2>

            {/* Description */}
            <p
                className="text-sm max-w-sm"
                style={{ color: 'var(--text-secondary, #64748b)' }}
            >
                {description}
            </p>

            {/* Additional info */}
            <p
                className="text-xs mt-6"
                style={{ color: 'var(--text-tertiary, #94a3b8)' }}
            >
                {t('sharedGroupsComingSoon') || 'Grupos Compartidos'}
            </p>
        </div>
    );
};

export default GruposView;
