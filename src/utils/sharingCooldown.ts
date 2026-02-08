/**
 * Sharing Cooldown Utilities - Group Level
 *
 * Story 14d-v2-1-11a: Transaction Sharing Toggle - Foundation
 * Refactored in TD-CONSOLIDATED-4: Delegates to cooldownCore.ts
 *
 * Provides cooldown and rate-limiting logic for group-level
 * transaction sharing toggle. Implements:
 * - 15-minute cooldown between toggle changes (FR-21)
 * - 3x daily limit (FR-21)
 * - Midnight reset using group's timezone (IANA format)
 */

import type { Timestamp } from 'firebase/firestore';
import type { SharedGroup } from '@/types/sharedGroup';
import { SHARED_GROUP_LIMITS } from '@/types/sharedGroup';
import {
    getCooldownRemainingMinutes,
    checkCooldownAllowed,
    type CooldownResult,
} from './cooldownCore';

// Backwards-compatible re-exports
export { getCooldownRemainingMinutes };
/** @deprecated Import CooldownResult from './cooldownCore' instead */
export type ToggleCooldownResult = CooldownResult;

/**
 * Checks if the daily toggle count should be reset.
 * Reset happens at midnight in the group's timezone.
 *
 * @param resetAt - Last reset timestamp (may be null for new/migrated groups)
 * @param timezone - IANA timezone string (e.g., "America/Santiago")
 * @param now - Current time (for testing)
 * @returns true if a new day has started since resetAt
 */
export function shouldResetDailyCount(
    resetAt: Timestamp | null,
    timezone: string,
    now: Date = new Date()
): boolean {
    // If never reset, treat as needing reset
    if (!resetAt) return true;

    try {
        const resetDate = resetAt.toDate();

        // Get date strings in the group's timezone
        // en-CA gives YYYY-MM-DD format for reliable comparison
        const resetDateStr = resetDate.toLocaleDateString('en-CA', { timeZone: timezone });
        const nowDateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });

        // Compare dates - different dates means midnight crossed
        return nowDateStr !== resetDateStr;
    } catch {
        // Invalid timezone or timestamp - treat as needs reset (safe default)
        return true;
    }
}

/**
 * Checks if transaction sharing can be toggled for a group.
 *
 * Implements rate limiting per FR-21:
 * - 15-minute cooldown between toggles
 * - 3x daily limit
 * - Midnight reset in group's timezone
 *
 * Migration handling:
 * - Missing fields default to allowed (no cooldown, count = 0)
 *
 * @param group - SharedGroup to check (partial allowed for migration)
 * @param now - Current time (for testing)
 * @returns ToggleCooldownResult with allowed status and reason if blocked
 */
export function canToggleTransactionSharing(
    group: Pick<
        SharedGroup,
        | 'transactionSharingLastToggleAt'
        | 'transactionSharingToggleCountToday'
        | 'transactionSharingToggleCountResetAt'
        | 'timezone'
    >,
    now: Date = new Date()
): ToggleCooldownResult {
    // Extract fields with migration defaults
    const lastToggleAt = group.transactionSharingLastToggleAt ?? null;
    const toggleCountToday = group.transactionSharingToggleCountToday ?? 0;
    const resetAt = group.transactionSharingToggleCountResetAt ?? null;
    const timezone = group.timezone || 'UTC';

    return checkCooldownAllowed({
        lastToggleAt,
        toggleCountToday,
        toggleCountResetAt: resetAt,
        cooldownMinutes: SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES,
        dailyLimit: SHARED_GROUP_LIMITS.TRANSACTION_SHARING_DAILY_LIMIT,
        shouldReset: (ra, n) => shouldResetDailyCount(ra, timezone, n),
        now,
    });
}
