/**
 * useManualSync Hook - STUB
 *
 * Story 14c-refactor.12: Transaction Service Simplification
 *
 * STUB: This hook is stubbed pending Epic 14d redesign.
 * The shared groups feature is temporarily unavailable.
 *
 * Original purpose: Provided manual sync functionality for shared group
 * transactions with cooldown tracking and React Query cache invalidation.
 *
 * @example
 * ```tsx
 * // This hook now returns no-op functions
 * const { triggerSync, isSyncing, canSync } = useManualSync({ groupId: 'group-123' });
 * // triggerSync is a no-op, canSync is always false
 * ```
 */

import { useCallback, useMemo } from 'react';

// ============================================================================
// Constants (preserved for backwards compatibility)
// ============================================================================

/** Cooldown duration in milliseconds (60 seconds) - preserved for reference */
export const SYNC_COOLDOWN_MS = 60 * 1000;

/** LocalStorage key prefix for sync cooldown tracking - preserved for reference */
export const SYNC_COOLDOWN_KEY_PREFIX = 'boletapp_group_sync_';

// ============================================================================
// Types (preserved for backwards compatibility)
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
    /** Trigger a manual sync - STUB: no-op function */
    triggerSync: () => Promise<void>;
    /** Whether a sync is currently in progress - STUB: always false */
    isSyncing: boolean;
    /** Whether the user can trigger a sync - STUB: always false */
    canSync: boolean;
    /** Seconds remaining in cooldown - STUB: always 0 */
    cooldownRemaining: number;
    /** Last successful sync time - STUB: always null */
    lastSyncTime: Date | null;
}

// ============================================================================
// Stub Implementation
// ============================================================================

/**
 * STUB: Hook for manual sync functionality.
 *
 * Returns no-op functions and disabled state while shared groups feature
 * is unavailable pending Epic 14d redesign.
 */
export function useManualSync(_options: UseManualSyncOptions): UseManualSyncResult {
    // No-op trigger sync function
    const triggerSync = useCallback(async () => {
        // STUB: Feature unavailable
    }, []);

    return useMemo(() => ({
        triggerSync,
        isSyncing: false,
        canSync: false,
        cooldownRemaining: 0,
        lastSyncTime: null,
    }), [triggerSync]);
}
