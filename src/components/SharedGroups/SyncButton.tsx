/**
 * SyncButton Component
 *
 * Story 14c.20: Shared Group Cache Optimization
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * A button that triggers manual sync for shared group transactions.
 * Features:
 * - Shows sync status (idle, syncing, cooldown)
 * - Displays "Last synced: X ago" when available
 * - 60-second cooldown between syncs with countdown
 * - Available to all group members (not just owner)
 */

import React, { useMemo } from 'react';
import { RefreshCw, Clock, Check } from 'lucide-react';
import { useManualSync } from '../../hooks/useManualSync';

// ============================================================================
// Types
// ============================================================================

export interface SyncButtonProps {
    /** The shared group ID to sync */
    groupId: string;
    /** Language for labels */
    lang?: 'en' | 'es';
    /** Toast callback for sync feedback */
    onShowToast?: (message: string, type?: 'success' | 'error') => void;
    /** Compact mode - icon only, no text */
    compact?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format relative time (e.g., "2 min ago", "hace 5 min")
 */
function formatRelativeTime(date: Date, lang: 'en' | 'es'): string {
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) {
        return lang === 'es' ? 'hace un momento' : 'just now';
    }

    if (diffMin < 60) {
        return lang === 'es' ? `hace ${diffMin} min` : `${diffMin} min ago`;
    }

    if (diffHour < 24) {
        return lang === 'es' ? `hace ${diffHour}h` : `${diffHour}h ago`;
    }

    // More than a day - show date
    return date.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });
}

// ============================================================================
// Component
// ============================================================================

export const SyncButton: React.FC<SyncButtonProps> = ({
    groupId,
    lang = 'es',
    onShowToast,
    compact = false,
}) => {
    const {
        triggerSync,
        isSyncing,
        canSync,
        cooldownRemaining,
        lastSyncTime,
    } = useManualSync({
        groupId,
        onSyncComplete: () => {
            onShowToast?.(
                lang === 'es' ? 'Sincronizado correctamente' : 'Synced successfully',
                'success'
            );
        },
        onSyncError: (error) => {
            console.error('[SyncButton] Sync error:', error);
            onShowToast?.(
                lang === 'es' ? 'Error al sincronizar' : 'Sync failed',
                'error'
            );
        },
    });

    // Compute button text based on state
    const buttonText = useMemo(() => {
        if (isSyncing) {
            return lang === 'es' ? 'Sincronizando...' : 'Syncing...';
        }
        if (cooldownRemaining > 0) {
            return lang === 'es' ? `Espera ${cooldownRemaining}s` : `Wait ${cooldownRemaining}s`;
        }
        return lang === 'es' ? 'Sincronizar' : 'Sync Now';
    }, [isSyncing, cooldownRemaining, lang]);

    // Compute last sync text
    const lastSyncText = useMemo(() => {
        if (!lastSyncTime) return null;
        const relativeTime = formatRelativeTime(lastSyncTime, lang);
        return lang === 'es' ? `Última sync: ${relativeTime}` : `Last sync: ${relativeTime}`;
    }, [lastSyncTime, lang]);

    // Icon based on state
    const Icon = useMemo(() => {
        if (cooldownRemaining > 0) return Clock;
        return RefreshCw;
    }, [cooldownRemaining]);

    // Handle click
    const handleClick = async () => {
        if (!canSync) return;
        await triggerSync();
    };

    // Compact mode - just an icon button
    if (compact) {
        return (
            <button
                onClick={handleClick}
                disabled={!canSync}
                className="p-2 rounded-lg transition-colors flex items-center justify-center"
                style={{
                    backgroundColor: canSync ? 'var(--bg-tertiary)' : 'transparent',
                    color: canSync ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    opacity: isSyncing ? 0.6 : 1,
                    cursor: canSync ? 'pointer' : 'not-allowed',
                }}
                title={cooldownRemaining > 0 ? buttonText : (lang === 'es' ? 'Sincronizar transacciones' : 'Sync transactions')}
                aria-label={buttonText}
            >
                <Icon
                    className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                />
            </button>
        );
    }

    // Full button with text
    return (
        <div className="flex flex-col gap-1">
            <button
                onClick={handleClick}
                disabled={!canSync}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                style={{
                    backgroundColor: canSync ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    color: canSync ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    border: '1px solid var(--border-light)',
                    opacity: isSyncing ? 0.7 : 1,
                    cursor: canSync ? 'pointer' : 'not-allowed',
                }}
                data-testid="sync-button"
            >
                <Icon
                    className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                />
                {buttonText}
            </button>

            {/* Last sync time indicator */}
            {lastSyncText && (
                <span
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--text-tertiary)' }}
                    data-testid="last-sync-time"
                >
                    <Check className="w-3 h-3" />
                    {lastSyncText}
                </span>
            )}
        </div>
    );
};

export default SyncButton;
