/**
 * useOfflineRecoveryDetection Hook
 *
 * Story 14d-v2-1-9: Firestore TTL & Offline Persistence
 * Epic 14d-v2: Shared Groups v2
 *
 * Detects when a user has been offline longer than the changelog TTL (30 days)
 * and needs a full sync to recover their group data.
 *
 * Architecture Decisions:
 * - AD-9: 30-day TTL on changelog entries (auto-cleanup)
 * - Uses CHANGELOG_TTL_MS as the recovery threshold
 *
 * @example
 * ```tsx
 * const { needsRecovery, daysSinceLastSync } = useOfflineRecoveryDetection({
 *   lastSyncTime: group.lastSyncTime,
 * });
 *
 * if (needsRecovery) {
 *   // Show RecoverySyncPrompt dialog
 * }
 * ```
 */

import { useMemo } from 'react';
import { CHANGELOG_TTL_MS, CHANGELOG_TTL_DAYS } from '@/types/changelog';

/**
 * Recovery threshold in milliseconds.
 * Equal to CHANGELOG_TTL_MS (30 days).
 */
export const RECOVERY_THRESHOLD_MS = CHANGELOG_TTL_MS;

/**
 * Recovery threshold in days.
 * Equal to CHANGELOG_TTL_DAYS (30 days).
 */
export const RECOVERY_THRESHOLD_DAYS = CHANGELOG_TTL_DAYS;

/**
 * Options for useOfflineRecoveryDetection hook.
 */
export interface UseOfflineRecoveryDetectionOptions {
    /**
     * The last time the group was successfully synced.
     * If null, the group is considered fresh (just joined).
     */
    lastSyncTime: Date | null;

    /**
     * Optional: Override the current time for testing.
     * If not provided, uses Date.now().
     */
    currentTime?: Date;
}

/**
 * Result from useOfflineRecoveryDetection hook.
 */
export interface UseOfflineRecoveryDetectionResult {
    /**
     * Whether the user needs to perform a full sync.
     * True if offline longer than RECOVERY_THRESHOLD_MS (30 days).
     */
    needsRecovery: boolean;

    /**
     * Number of days since the last sync.
     * null if lastSyncTime is null (fresh group).
     */
    daysSinceLastSync: number | null;
}

/**
 * Hook to detect if a user has been offline too long and needs recovery sync.
 *
 * AC10: Returns needsRecovery: true when offline > 30 days
 * AC11: Returns needsRecovery: false for fresh groups (null lastSyncTime)
 *
 * @param options - Hook options
 * @returns Recovery detection result
 */
export function useOfflineRecoveryDetection(
    options: UseOfflineRecoveryDetectionOptions
): UseOfflineRecoveryDetectionResult {
    const { lastSyncTime, currentTime } = options;

    return useMemo(() => {
        // AC11: Fresh group (null lastSyncTime) doesn't need recovery
        if (lastSyncTime === null) {
            return {
                needsRecovery: false,
                daysSinceLastSync: null,
            };
        }

        // Calculate time difference
        const now = currentTime ?? new Date();
        const timeSinceLastSyncMs = now.getTime() - lastSyncTime.getTime();

        // Calculate days (floor to round down fractional days)
        const daysSinceLastSync = Math.floor(timeSinceLastSyncMs / (24 * 60 * 60 * 1000));

        // AC10: Need recovery if offline > 30 days (strictly greater than)
        const needsRecovery = timeSinceLastSyncMs > RECOVERY_THRESHOLD_MS;

        return {
            needsRecovery,
            daysSinceLastSync,
        };
    }, [lastSyncTime, currentTime]);
}
