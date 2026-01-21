/**
 * useManualSync Hook
 *
 * Story 14c.20: Shared Group Cache Optimization
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Provides manual sync functionality for shared group transactions with:
 * - 60-second cooldown between syncs to prevent abuse
 * - Last sync time tracking in localStorage (per-group)
 * - Countdown timer for cooldown remaining
 * - Integration with React Query cache invalidation
 *
 * @example
 * ```tsx
 * const { triggerSync, isSyncing, canSync, cooldownRemaining, lastSyncTime } = useManualSync({
 *   groupId: 'group-123',
 *   onSyncComplete: () => toast('Synced!'),
 *   onSyncError: (err) => toast(err.message),
 * });
 *
 * <button onClick={triggerSync} disabled={!canSync || isSyncing}>
 *   {isSyncing ? 'Syncing...' : canSync ? 'Sync Now' : `Wait ${cooldownRemaining}s`}
 * </button>
 * ```
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../lib/queryKeys';

// ============================================================================
// Constants
// ============================================================================

/** Cooldown duration in milliseconds (60 seconds) */
export const SYNC_COOLDOWN_MS = 60 * 1000;

/** LocalStorage key prefix for sync cooldown tracking */
export const SYNC_COOLDOWN_KEY_PREFIX = 'boletapp_group_sync_';

// ============================================================================
// Types
// ============================================================================

export interface UseManualSyncOptions {
    /** The shared group ID to sync */
    groupId: string;
    /** Cooldown duration in milliseconds (default: 60000) */
    cooldownMs?: number;
    /** Callback when sync completes successfully */
    onSyncComplete?: () => void;
    /** Callback when sync fails */
    onSyncError?: (error: Error) => void;
}

export interface UseManualSyncResult {
    /** Trigger a manual sync - invalidates React Query cache */
    triggerSync: () => Promise<void>;
    /** Whether a sync is currently in progress */
    isSyncing: boolean;
    /** Whether the user can trigger a sync (cooldown expired) */
    canSync: boolean;
    /** Seconds remaining in cooldown (0 if no cooldown active) */
    cooldownRemaining: number;
    /** Last successful sync time, or null if never synced */
    lastSyncTime: Date | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Get localStorage key for a specific group's sync cooldown
 */
function getStorageKey(groupId: string): string {
    return `${SYNC_COOLDOWN_KEY_PREFIX}${groupId}`;
}

/**
 * Read last sync timestamp from localStorage
 */
function getLastSyncFromStorage(groupId: string): number | null {
    try {
        const stored = localStorage.getItem(getStorageKey(groupId));
        if (stored) {
            const timestamp = parseInt(stored, 10);
            if (!isNaN(timestamp)) {
                return timestamp;
            }
        }
    } catch {
        // localStorage might be unavailable (SSR, private browsing, etc.)
    }
    return null;
}

/**
 * Save sync timestamp to localStorage
 */
function saveLastSyncToStorage(groupId: string, timestamp: number): void {
    try {
        localStorage.setItem(getStorageKey(groupId), timestamp.toString());
    } catch {
        // localStorage might be unavailable
    }
}

/**
 * Calculate cooldown remaining in seconds
 */
function calculateCooldownRemaining(lastSync: number | null, cooldownMs: number): number {
    if (lastSync === null) return 0;

    const elapsed = Date.now() - lastSync;
    const remaining = cooldownMs - elapsed;

    if (remaining <= 0) return 0;

    return Math.ceil(remaining / 1000); // Return seconds, rounded up
}

/**
 * Hook for manual sync functionality with cooldown.
 */
export function useManualSync(options: UseManualSyncOptions): UseManualSyncResult {
    const { groupId, cooldownMs = SYNC_COOLDOWN_MS, onSyncComplete, onSyncError } = options;
    const queryClient = useQueryClient();

    // Load initial lastSyncTime from localStorage
    const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(() =>
        getLastSyncFromStorage(groupId)
    );

    // Syncing state
    const [isSyncing, setIsSyncing] = useState(false);

    // Cooldown timer state (updated every second during cooldown)
    const [cooldownRemaining, setCooldownRemaining] = useState(() =>
        calculateCooldownRemaining(lastSyncTimestamp, cooldownMs)
    );

    // Whether sync is allowed (not in cooldown and not currently syncing)
    const canSync = useMemo(() => {
        return cooldownRemaining === 0 && !isSyncing;
    }, [cooldownRemaining, isSyncing]);

    // Convert timestamp to Date for external use
    const lastSyncTime = useMemo(() => {
        if (lastSyncTimestamp === null) return null;
        return new Date(lastSyncTimestamp);
    }, [lastSyncTimestamp]);

    // Update cooldown when groupId changes (load from localStorage)
    useEffect(() => {
        const storedTimestamp = getLastSyncFromStorage(groupId);
        setLastSyncTimestamp(storedTimestamp);
        setCooldownRemaining(calculateCooldownRemaining(storedTimestamp, cooldownMs));
    }, [groupId, cooldownMs]);

    // Countdown timer effect - updates every second during cooldown
    useEffect(() => {
        if (cooldownRemaining <= 0) return;

        const timer = setInterval(() => {
            setCooldownRemaining(() => {
                const newRemaining = calculateCooldownRemaining(lastSyncTimestamp, cooldownMs);
                if (newRemaining <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return newRemaining;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [lastSyncTimestamp, cooldownMs, cooldownRemaining]);

    // Trigger manual sync
    const triggerSync = useCallback(async () => {
        // Don't sync if in cooldown or already syncing
        if (cooldownRemaining > 0 || isSyncing) {
            return;
        }

        setIsSyncing(true);

        try {
            // Invalidate React Query cache to trigger refetch
            // Story 14c.20 Bug Fix: Use refetchType: 'all' to force refetch even for inactive queries
            await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.sharedGroupTransactions(groupId),
                refetchType: 'all',
            });

            // Update last sync time
            const now = Date.now();
            setLastSyncTimestamp(now);
            saveLastSyncToStorage(groupId, now);
            setCooldownRemaining(Math.ceil(cooldownMs / 1000));

            // Call success callback
            onSyncComplete?.();
        } catch (error) {
            // Call error callback
            onSyncError?.(error instanceof Error ? error : new Error('Sync failed'));
        } finally {
            setIsSyncing(false);
        }
    }, [groupId, cooldownRemaining, isSyncing, cooldownMs, queryClient, onSyncComplete, onSyncError]);

    return {
        triggerSync,
        isSyncing,
        canSync,
        cooldownRemaining,
        lastSyncTime,
    };
}
