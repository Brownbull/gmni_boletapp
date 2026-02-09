/**
 * Cooldown Core Utility Tests
 *
 * Story TD-CONSOLIDATED-4: Cooldown Core Extraction
 *
 * Tests for the shared cooldown engine used by both
 * group-level (sharingCooldown.ts) and user-level (userSharingCooldown.ts).
 */

import { describe, it, expect } from 'vitest';
import {
    CooldownReason,
    getCooldownRemainingMinutes,
    checkCooldownAllowed,
    type CooldownResult,
} from '@/utils/cooldownCore';
import { createMockTimestamp } from '../../helpers';

describe('cooldownCore', () => {
    // =========================================================================
    // CooldownReason Tests
    // =========================================================================
    describe('CooldownReason', () => {
        it('has COOLDOWN value matching string literal', () => {
            expect(CooldownReason.COOLDOWN).toBe('cooldown');
        });

        it('has DAILY_LIMIT value matching string literal', () => {
            expect(CooldownReason.DAILY_LIMIT).toBe('daily_limit');
        });
    });

    // =========================================================================
    // getCooldownRemainingMinutes Tests
    // =========================================================================
    describe('getCooldownRemainingMinutes', () => {
        it('returns 0 when lastToggleAt is null', () => {
            const result = getCooldownRemainingMinutes(null, 15);
            expect(result).toBe(0);
        });

        it('returns remaining minutes when within cooldown', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:50:00Z'); // 10 min ago

            const result = getCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                15,
                now
            );

            expect(result).toBe(5); // 15 - 10 = 5
        });

        it('returns 0 when exactly at cooldown boundary', () => {
            const now = new Date('2026-02-04T12:15:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z');

            const result = getCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                15,
                now
            );

            expect(result).toBe(0);
        });

        it('returns 0 when cooldown has expired', () => {
            const now = new Date('2026-02-04T12:16:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z');

            const result = getCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                15,
                now
            );

            expect(result).toBe(0);
        });

        it('rounds up fractional minutes', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:50:30Z'); // 9.5 min ago

            const result = getCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                15,
                now
            );

            // 15 - 9.5 = 5.5, rounds up to 6
            expect(result).toBe(6);
        });

        it('returns 0 when cooldownMinutes is zero', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:59:00Z');

            const result = getCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                0,
                now
            );

            expect(result).toBe(0);
        });

        it('returns 0 when cooldownMinutes is negative', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:59:00Z');

            const result = getCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                -5,
                now
            );

            expect(result).toBe(0);
        });

        it('handles corrupted timestamp gracefully', () => {
            const corruptedTimestamp = {
                toDate: () => {
                    throw new Error('corrupted');
                },
            } as unknown as Timestamp;

            const result = getCooldownRemainingMinutes(corruptedTimestamp, 15);
            expect(result).toBe(0);
        });
    });

    // =========================================================================
    // checkCooldownAllowed Tests
    // =========================================================================
    describe('checkCooldownAllowed', () => {
        // Simple mock shouldReset that always returns false (same day)
        const neverReset = () => false;
        // Simple mock shouldReset that always returns true (new day)
        const alwaysReset = () => true;

        it('returns allowed when no cooldown and under daily limit', () => {
            const result = checkCooldownAllowed({
                lastToggleAt: null,
                toggleCountToday: 0,
                toggleCountResetAt: null,
                cooldownMinutes: 15,
                dailyLimit: 3,
                shouldReset: neverReset,
            });

            expect(result.allowed).toBe(true);
            expect(result.reason).toBeUndefined();
            expect(result.waitMinutes).toBeUndefined();
        });

        it('blocks with cooldown reason when within cooldown period', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:50:00Z'); // 10 min ago

            const result = checkCooldownAllowed({
                lastToggleAt: createMockTimestamp(toggledAt),
                toggleCountToday: 0,
                toggleCountResetAt: null,
                cooldownMinutes: 15,
                dailyLimit: 3,
                shouldReset: neverReset,
                now,
            });

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe(CooldownReason.COOLDOWN);
            expect(result.waitMinutes).toBe(5);
        });

        it('blocks with daily_limit reason when at limit', () => {
            const now = new Date('2026-02-04T12:00:00Z');

            const result = checkCooldownAllowed({
                lastToggleAt: null,
                toggleCountToday: 3,
                toggleCountResetAt: createMockTimestamp(now),
                cooldownMinutes: 15,
                dailyLimit: 3,
                shouldReset: neverReset,
                now,
            });

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe(CooldownReason.DAILY_LIMIT);
            expect(result.waitMinutes).toBeUndefined();
        });

        it('cooldown takes priority over daily limit', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:50:00Z');

            const result = checkCooldownAllowed({
                lastToggleAt: createMockTimestamp(toggledAt),
                toggleCountToday: 5, // Over limit
                toggleCountResetAt: createMockTimestamp(now),
                cooldownMinutes: 15,
                dailyLimit: 3,
                shouldReset: neverReset,
                now,
            });

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe(CooldownReason.COOLDOWN);
            expect(result.waitMinutes).toBe(5);
        });

        it('resets daily count when shouldReset returns true', () => {
            const now = new Date('2026-02-04T12:00:00Z');

            const result = checkCooldownAllowed({
                lastToggleAt: null,
                toggleCountToday: 3, // At limit
                toggleCountResetAt: null,
                cooldownMinutes: 15,
                dailyLimit: 3,
                shouldReset: alwaysReset, // New day - resets count
                now,
            });

            expect(result.allowed).toBe(true);
        });

        it('handles all-null migration case gracefully', () => {
            const result = checkCooldownAllowed({
                lastToggleAt: null,
                toggleCountToday: 0,
                toggleCountResetAt: null,
                cooldownMinutes: 15,
                dailyLimit: 3,
                shouldReset: alwaysReset,
            });

            expect(result.allowed).toBe(true);
        });

        it('works with 5-minute cooldown (user-level config)', () => {
            const now = new Date('2026-02-04T12:02:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // 2 min ago

            const result = checkCooldownAllowed({
                lastToggleAt: createMockTimestamp(toggledAt),
                toggleCountToday: 0,
                toggleCountResetAt: null,
                cooldownMinutes: 5,
                dailyLimit: 3,
                shouldReset: neverReset,
                now,
            });

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe(CooldownReason.COOLDOWN);
            expect(result.waitMinutes).toBe(3); // 5 - 2 = 3
        });

        it('returns allowed when dailyLimit is zero (invalid config)', () => {
            const result = checkCooldownAllowed({
                lastToggleAt: null,
                toggleCountToday: 0,
                toggleCountResetAt: null,
                cooldownMinutes: 15,
                dailyLimit: 0,
                shouldReset: neverReset,
            });

            expect(result.allowed).toBe(true);
        });

        it('returns allowed when dailyLimit is negative (invalid config)', () => {
            const result = checkCooldownAllowed({
                lastToggleAt: null,
                toggleCountToday: 0,
                toggleCountResetAt: null,
                cooldownMinutes: 15,
                dailyLimit: -1,
                shouldReset: neverReset,
            });

            expect(result.allowed).toBe(true);
        });

        it('passes shouldReset the correct arguments', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const resetAt = createMockTimestamp(now);
            let receivedResetAt: Timestamp | null = null;
            let receivedNow: Date | null = null;

            const spyShouldReset = (ra: Timestamp | null, n: Date) => {
                receivedResetAt = ra;
                receivedNow = n;
                return false;
            };

            checkCooldownAllowed({
                lastToggleAt: null,
                toggleCountToday: 0,
                toggleCountResetAt: resetAt,
                cooldownMinutes: 15,
                dailyLimit: 3,
                shouldReset: spyShouldReset,
                now,
            });

            expect(receivedResetAt).toBe(resetAt);
            expect(receivedNow).toBe(now);
        });
    });

    // =========================================================================
    // CooldownResult Type Safety Tests
    // =========================================================================
    describe('CooldownResult Type Safety', () => {
        it('CooldownResult has correct shape when allowed', () => {
            const result: CooldownResult = { allowed: true };

            expect(result.allowed).toBe(true);
            expect(result.reason).toBeUndefined();
            expect(result.waitMinutes).toBeUndefined();
        });

        it('CooldownResult has correct shape when blocked by cooldown', () => {
            const result: CooldownResult = {
                allowed: false,
                reason: CooldownReason.COOLDOWN,
                waitMinutes: 5,
            };

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('cooldown');
            expect(result.waitMinutes).toBe(5);
        });

        it('CooldownResult has correct shape when blocked by daily limit', () => {
            const result: CooldownResult = {
                allowed: false,
                reason: CooldownReason.DAILY_LIMIT,
            };

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
            expect(result.waitMinutes).toBeUndefined();
        });
    });
});
