/**
 * SharedGroupError Component
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Unified error display component for shared group operations.
 * Shows error icon, title, message, and action buttons based on error type.
 *
 * Error Categories:
 * 1. Recoverable - Shows "Try Again" button
 * 2. Non-recoverable - Shows contextual guidance
 * 3. Temporary (network) - Shows "Retry" with connection status
 * 4. Degraded (storage) - Shown as toast, not this component
 */

import React from 'react';
import { RefreshCw, Home, X } from 'lucide-react';
import {
    SharedGroupErrorType,
    getErrorConfig,
    isNetworkRelated,
    type SharedGroupError as SharedGroupErrorData,
} from '@/lib/sharedGroupErrors';

export interface SharedGroupErrorProps {
    /** The error data to display */
    error: SharedGroupErrorData;
    /** Translation function */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Theme */
    theme?: string;
    /** Callback when retry button is clicked */
    onRetry?: () => void;
    /** Callback when dismiss button is clicked */
    onDismiss?: () => void;
    /** Callback to navigate home */
    onNavigateHome?: () => void;
    /** Whether the component is in a loading/retrying state */
    isRetrying?: boolean;
    /** Compact mode for inline display */
    compact?: boolean;
}

/**
 * Get the translated title for an error type
 */
function getErrorTitle(
    type: SharedGroupErrorType,
    t: (key: string, params?: Record<string, string | number>) => string
): string {
    const config = getErrorConfig(type);
    return t(config.titleKey);
}

/**
 * Get the translated message for an error
 */
function getErrorMessage(
    error: SharedGroupErrorData,
    t: (key: string, params?: Record<string, string | number>) => string
): string {
    // If message is a translation key, translate it
    const config = getErrorConfig(error.type);
    return t(config.messageKey);
}

export const SharedGroupError: React.FC<SharedGroupErrorProps> = ({
    error,
    t,
    theme = 'light',
    onRetry,
    onDismiss,
    onNavigateHome,
    isRetrying = false,
    compact = false,
}) => {
    const isDark = theme === 'dark';
    const config = getErrorConfig(error.type);
    const isNetwork = isNetworkRelated(error.type);

    // Determine which buttons to show
    const showRetry = error.recoverable && onRetry;
    const showDismiss = onDismiss;
    const showHome = onNavigateHome && !error.recoverable;

    if (compact) {
        // Compact inline error display
        return (
            <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${config.colorClass}`}
                role="alert"
                aria-live="polite"
            >
                <span className="text-xl flex-shrink-0">{config.icon}</span>
                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {getErrorTitle(error.type, t)}
                    </p>
                    <p
                        className="text-xs truncate"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {getErrorMessage(error, t)}
                    </p>
                </div>
                {showRetry && (
                    <button
                        onClick={onRetry}
                        disabled={isRetrying}
                        className="flex-shrink-0 p-2 rounded-lg transition-colors"
                        style={{
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.05)',
                        }}
                        aria-label={t('tryAgain')}
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
                            style={{ color: 'var(--primary)' }}
                        />
                    </button>
                )}
                {showDismiss && (
                    <button
                        onClick={onDismiss}
                        className="flex-shrink-0 p-2 rounded-lg transition-colors"
                        style={{
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.05)',
                        }}
                        aria-label={t('dismiss')}
                    >
                        <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                )}
            </div>
        );
    }

    // Full error card display
    return (
        <div
            className={`p-6 rounded-xl border text-center ${config.colorClass}`}
            role="alert"
            aria-live="polite"
        >
            {/* Icon */}
            <div className="text-5xl mb-4">{config.icon}</div>

            {/* Title */}
            <h2
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
            >
                {getErrorTitle(error.type, t)}
            </h2>

            {/* Message */}
            <p
                className="text-sm mb-4"
                style={{ color: 'var(--text-secondary)' }}
            >
                {getErrorMessage(error, t)}
            </p>

            {/* Network status indicator */}
            {isNetwork && (
                <div
                    className="flex items-center justify-center gap-2 text-xs mb-4"
                    style={{ color: 'var(--text-tertiary)' }}
                >
                    <span
                        className={`w-2 h-2 rounded-full ${
                            navigator.onLine ? 'bg-green-500' : 'bg-red-500'
                        }`}
                    />
                    {navigator.onLine ? t('connectionRestored') : t('offline')}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
                {showRetry && (
                    <button
                        onClick={onRetry}
                        disabled={isRetrying}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            opacity: isRetrying ? 0.7 : 1,
                        }}
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
                        />
                        {isRetrying ? t('retrying') : t('tryAgain')}
                    </button>
                )}

                {showHome && (
                    <button
                        onClick={onNavigateHome}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.05)',
                            color: 'var(--text-primary)',
                        }}
                    >
                        <Home className="w-4 h-4" />
                        {t('returnToHome')}
                    </button>
                )}

                {showDismiss && !showHome && (
                    <button
                        onClick={onDismiss}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{
                            backgroundColor: isDark
                                ? 'rgba(255,255,255,0.1)'
                                : 'rgba(0,0,0,0.05)',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        {t('dismiss')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SharedGroupError;
