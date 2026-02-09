/**
 * User Sharing Cooldown Utilities - User Level
 *
 * Story 14d-v2-1-12a: User Transaction Sharing Preference - Foundation
 * Refactored in TD-CONSOLIDATED-4: Delegates to cooldownCore.ts
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
 * @see cooldownCore.ts for shared cooldown engine
 */

import type { Timestamp } from 'firebase/firestore';
import type { UserGroupPreference } from '@/types/sharedGroup';
import { SHARED_GROUP_LIMITS } from '@/types/sharedGroup';
import {
    checkCooldownAllowed,
    type CooldownResult,
} from './cooldownCore';

// Backwards-compatible re-exports
/** @deprecated Import getCooldownRemainingMinutes from './cooldownCore' instead */
export { getCooldownRemainingMinutes as getUserCooldownRemainingMinutes } from './cooldownCore';
/** @deprecated Import CooldownResult from './cooldownCore' instead */
export type UserToggleCooldownResult = CooldownResult;

/**
 * Checks if the daily toggle count should be reset for user preferences.
 * Reset happens at midnight in the device's local timezone.
 *
 * Uses `toDateString()` which returns a locale-independent date string
 * (e.g., "Wed Feb 05 2026") based on the device's local timezone.
 *
 * @param resetAt - Last reset timestamp (may be null for new/migrated preferences)
 * @param now - Current time (for testing)
 * @returns true if a new day has started since resetAt
 */
export function shouldResetUserDailyCount(
    resetAt: Timestamp | null,
    now: Date = new Date()
): boolean {
    // If never reset, treat as needing reset
    if (!resetAt) return true;

    try {
        const resetDate = resetAt.toDate();

        // Compare local dates using device timezone
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

    return checkCooldownAllowed({
        lastToggleAt,
        toggleCountToday,
        toggleCountResetAt: resetAt,
        cooldownMinutes: SHARED_GROUP_LIMITS.USER_SHARING_COOLDOWN_MINUTES,
        dailyLimit: SHARED_GROUP_LIMITS.USER_SHARING_DAILY_LIMIT,
        shouldReset: shouldResetUserDailyCount,
        now,
    });
}
