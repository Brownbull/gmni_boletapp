/**
 * Cooldown Core Engine
 *
 * Story TD-CONSOLIDATED-4: Shared cooldown logic extracted from
 * sharingCooldown.ts (group-level) and userSharingCooldown.ts (user-level).
 *
 * Provides the common cooldown state machine:
 * - Time-based cooldown check
 * - Daily limit with configurable reset strategy
 * - CooldownReason enum (replaces inline string unions, TD-14d-36)
 *
 * Rate limiting is enforced client-side as a UX guardrail. Firestore rules
 * handle authorization (owner-only writes). See ADR-022 for trade-off analysis.
 *
 * @see docs/architecture/decisions/ADR-022-client-side-rate-limiting.md
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Reason a cooldown check was blocked.
 * Uses const object pattern for string-literal compatibility with
 * existing `'cooldown' | 'daily_limit'` consumers.
 */
export const CooldownReason = {
    COOLDOWN: 'cooldown',
    DAILY_LIMIT: 'daily_limit',
} as const;

export type CooldownReason = (typeof CooldownReason)[keyof typeof CooldownReason];

/**
 * Result of a cooldown check.
 * Unified type replacing ToggleCooldownResult and UserToggleCooldownResult.
 */
export interface CooldownResult {
    /** Whether the action is allowed */
    allowed: boolean;
    /** Minutes to wait if cooldown active (only when allowed=false and reason='cooldown') */
    waitMinutes?: number;
    /** Reason if not allowed */
    reason?: CooldownReason;
}

/**
 * Calculates remaining cooldown minutes.
 *
 * @param lastToggleAt - Last action timestamp (may be null)
 * @param cooldownMinutes - Cooldown period in minutes
 * @param now - Current time (for testing)
 * @returns Minutes remaining in cooldown, or 0 if expired
 */
export function getCooldownRemainingMinutes(
    lastToggleAt: Timestamp | null,
    cooldownMinutes: number,
    now: Date = new Date()
): number {
    if (!lastToggleAt || cooldownMinutes <= 0) return 0;

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
 * Generic cooldown check composing time-based cooldown + daily limit.
 *
 * The `shouldReset` callback abstracts timezone strategy:
 * - Group-level: IANA timezone via toLocaleDateString
 * - User-level: device local timezone via toDateString
 */
export function checkCooldownAllowed(params: {
    lastToggleAt: Timestamp | null;
    toggleCountToday: number;
    toggleCountResetAt: Timestamp | null;
    cooldownMinutes: number;
    dailyLimit: number;
    shouldReset: (resetAt: Timestamp | null, now: Date) => boolean;
    now?: Date;
}): CooldownResult {
    const now = params.now ?? new Date();

    // Guard: invalid config defaults to allowed
    if (params.dailyLimit <= 0) {
        return { allowed: true };
    }

    // Check 1: Time-based cooldown
    const waitMinutes = getCooldownRemainingMinutes(
        params.lastToggleAt,
        params.cooldownMinutes,
        now
    );

    if (waitMinutes > 0) {
        return { allowed: false, waitMinutes, reason: CooldownReason.COOLDOWN };
    }

    // Check 2: Daily limit (considering reset)
    const needsReset = params.shouldReset(params.toggleCountResetAt, now);
    const effectiveCount = needsReset ? 0 : params.toggleCountToday;

    if (effectiveCount >= params.dailyLimit) {
        return { allowed: false, reason: CooldownReason.DAILY_LIMIT };
    }

    return { allowed: true };
}
