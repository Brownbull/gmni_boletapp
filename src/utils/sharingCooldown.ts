/**
 * Sharing Cooldown Utilities
 *
 * Story 14d-v2-1-11a: Transaction Sharing Toggle - Foundation
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

/**
 * Result of toggle cooldown check.
 */
export interface ToggleCooldownResult {
    /** Whether toggling is allowed */
    allowed: boolean;
    /** Minutes to wait if cooldown active (only when allowed=false) */
    waitMinutes?: number;
    /** Reason if not allowed: 'cooldown' or 'daily_limit' */
    reason?: 'cooldown' | 'daily_limit';
}

/**
 * Calculates remaining cooldown minutes.
 *
 * @param lastToggleAt - Last toggle timestamp (may be null)
 * @param cooldownMinutes - Cooldown period in minutes
 * @param now - Current time (for testing)
 * @returns Minutes remaining in cooldown, or 0 if cooldown expired
 */
export function getCooldownRemainingMinutes(
    lastToggleAt: Timestamp | null,
    cooldownMinutes: number,
    now: Date = new Date()
): number {
    if (!lastToggleAt) return 0;

    try {
        const toggleTime = lastToggleAt.toDate();
        const elapsedMs = now.getTime() - toggleTime.getTime();
        const elapsedMinutes = elapsedMs / (1000 * 60);
        const remaining = cooldownMinutes - elapsedMinutes;

        return remaining > 0 ? Math.ceil(remaining) : 0;
    } catch {
        // Invalid timestamp - no cooldown (safe default for migration)
        return 0;
    }
}

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

    // Check 1: 15-minute cooldown
    const waitMinutes = getCooldownRemainingMinutes(
        lastToggleAt,
        SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES,
        now
    );

    if (waitMinutes > 0) {
        return { allowed: false, waitMinutes, reason: 'cooldown' };
    }

    // Check 2: Daily limit (considering midnight reset)
    const needsReset = shouldResetDailyCount(resetAt, timezone, now);
    const effectiveCount = needsReset ? 0 : toggleCountToday;

    if (effectiveCount >= SHARED_GROUP_LIMITS.TRANSACTION_SHARING_DAILY_LIMIT) {
        return { allowed: false, reason: 'daily_limit' };
    }

    return { allowed: true };
}
