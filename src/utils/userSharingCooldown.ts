/**
 * User Sharing Cooldown Utilities
 *
 * Story 14d-v2-1-12a: User Transaction Sharing Preference - Foundation
 *
 * Provides cooldown and rate-limiting logic for user-level
 * transaction sharing preference toggle. Implements:
 * - 5-minute cooldown between toggle changes (FR-21)
 * - 3x daily limit (FR-21)
 * - Midnight reset using device's local timezone
 *
 * Key differences from group-level (`sharingCooldown.ts`):
 * - 5-minute cooldown (not 15-minute)
 * - Device local timezone (not group timezone)
 * - Uses `UserGroupPreference` (not `SharedGroup`)
 *
 * @see sharingCooldown.ts for group-level cooldown logic
 */

import type { Timestamp } from 'firebase/firestore';
import type { UserGroupPreference } from '@/types/sharedGroup';
import { SHARED_GROUP_LIMITS } from '@/types/sharedGroup';

/**
 * Result of user toggle cooldown check.
 *
 * The result indicates whether a user can toggle their sharing preference
 * and provides context when blocked.
 *
 * @example
 * ```typescript
 * const result = canToggleUserSharingPreference(preference);
 *
 * if (result.allowed) {
 *   // Proceed with toggle
 * } else if (result.reason === 'cooldown') {
 *   showError(`Please wait ${result.waitMinutes} minutes`);
 * } else {
 *   showError('Daily limit reached. Try again tomorrow.');
 * }
 * ```
 *
 * @see ToggleCooldownResult for the group-level equivalent in sharingCooldown.ts
 */
export interface UserToggleCooldownResult {
    /** Whether toggling is allowed */
    allowed: boolean;
    /**
     * Minutes to wait if cooldown active (only when allowed=false and reason='cooldown').
     * Value is always rounded up (e.g., 2.5 min remaining → 3).
     */
    waitMinutes?: number;
    /**
     * Reason if not allowed:
     * - 'cooldown': User toggled within the last 5 minutes
     * - 'daily_limit': User has toggled 3 times today
     */
    reason?: 'cooldown' | 'daily_limit';
}

/**
 * Calculates remaining cooldown minutes for user sharing preference.
 *
 * @param lastToggleAt - Last toggle timestamp (may be null)
 * @param cooldownMinutes - Cooldown period in minutes
 * @param now - Current time (for testing)
 * @returns Minutes remaining in cooldown, or 0 if cooldown expired
 */
export function getUserCooldownRemainingMinutes(
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
 * Checks if the daily toggle count should be reset for user preferences.
 * Reset happens at midnight in the device's local timezone.
 *
 * **Date Comparison Method:**
 * Uses `toDateString()` which returns a locale-independent date string
 * (e.g., "Wed Feb 05 2026") based on the device's local timezone.
 * This differs from group-level `shouldResetDailyCount()` which uses
 * `toLocaleDateString('en-CA', { timeZone })` to compare in a specific IANA timezone.
 *
 * **Design Decision (Story 14d-v2-1-12a):**
 * User preferences use device local timezone because:
 * 1. Users expect "tomorrow" to mean their local tomorrow
 * 2. Simpler - no need to store/retrieve user's timezone preference
 * 3. Consistent with how other user-level features behave
 *
 * @param resetAt - Last reset timestamp (may be null for new/migrated preferences)
 * @param now - Current time (for testing)
 * @returns true if a new day has started since resetAt
 *
 * @see shouldResetDailyCount in sharingCooldown.ts for group-level (IANA timezone)
 */
export function shouldResetUserDailyCount(
    resetAt: Timestamp | null,
    now: Date = new Date()
): boolean {
    // If never reset, treat as needing reset
    if (!resetAt) return true;

    try {
        const resetDate = resetAt.toDate();

        // Compare local dates using device timezone.
        // toDateString() returns format: "Wed Feb 05 2026" (locale-independent)
        // This format is consistent across all locales because it uses
        // the implementation-dependent string representation, which is
        // always in English. It does NOT use the system's locale settings.
        //
        // Example:
        //   new Date('2026-02-05T00:00:00').toDateString() → "Thu Feb 05 2026"
        //   (same output regardless of system locale)
        const resetDateStr = resetDate.toDateString();
        const nowDateStr = now.toDateString();

        // Different date strings means midnight crossed in device timezone
        return nowDateStr !== resetDateStr;
    } catch {
        // Invalid timestamp - treat as needs reset (safe default)
        return true;
    }
}

/**
 * Checks if user sharing preference can be toggled.
 *
 * Implements rate limiting per FR-21:
 * - 5-minute cooldown between toggles
 * - 3x daily limit
 * - Midnight reset in device's local timezone
 *
 * Migration handling:
 * - Missing fields default to allowed (no cooldown, count = 0)
 *
 * @param preference - UserGroupPreference to check (partial allowed for migration)
 * @param now - Current time (for testing)
 * @returns UserToggleCooldownResult with allowed status and reason if blocked
 */
export function canToggleUserSharingPreference(
    preference: Partial<Pick<
        UserGroupPreference,
        | 'lastToggleAt'
        | 'toggleCountToday'
        | 'toggleCountResetAt'
    >>,
    now: Date = new Date()
): UserToggleCooldownResult {
    // Extract fields with migration defaults
    const lastToggleAt = preference.lastToggleAt ?? null;
    const toggleCountToday = preference.toggleCountToday ?? 0;
    const resetAt = preference.toggleCountResetAt ?? null;

    // Check 1: 5-minute cooldown
    const waitMinutes = getUserCooldownRemainingMinutes(
        lastToggleAt,
        SHARED_GROUP_LIMITS.USER_SHARING_COOLDOWN_MINUTES,
        now
    );

    if (waitMinutes > 0) {
        return { allowed: false, waitMinutes, reason: 'cooldown' };
    }

    // Check 2: Daily limit (considering midnight reset)
    const needsReset = shouldResetUserDailyCount(resetAt, now);
    const effectiveCount = needsReset ? 0 : toggleCountToday;

    if (effectiveCount >= SHARED_GROUP_LIMITS.USER_SHARING_DAILY_LIMIT) {
        return { allowed: false, reason: 'daily_limit' };
    }

    return { allowed: true };
}
