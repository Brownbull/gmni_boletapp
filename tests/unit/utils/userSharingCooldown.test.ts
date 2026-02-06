/**
 * User Sharing Cooldown Utility Tests
 *
 * Story 14d-v2-1-12a: User Transaction Sharing Preference - Foundation
 *
 * Tests for user-level transaction sharing toggle cooldown logic:
 * - AC4: canToggleUserSharingPreference() with 5-minute cooldown
 * - AC5: Daily limit check (3x per day)
 * - AC6: Midnight reset in device local timezone
 * - AC7: Migration handling (missing fields default to 0/null)
 */

import { describe, it, expect } from 'vitest';
import type { Timestamp } from 'firebase/firestore';
import {
    canToggleUserSharingPreference,
    getUserCooldownRemainingMinutes,
    shouldResetUserDailyCount,
    type UserToggleCooldownResult,
} from '@/utils/userSharingCooldown';
import { SHARED_GROUP_LIMITS, type UserGroupPreference } from '@/types/sharedGroup';

// Test helper: Create mock Timestamp
function createMockTimestamp(date: Date): Timestamp {
    return {
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
    } as unknown as Timestamp;
}

describe('userSharingCooldown', () => {
    // =========================================================================
    // getUserCooldownRemainingMinutes Tests
    // =========================================================================
    describe('getUserCooldownRemainingMinutes', () => {
        it('returns 0 when lastToggleAt is null (no previous toggle)', () => {
            const result = getUserCooldownRemainingMinutes(null, 5);
            expect(result).toBe(0);
        });

        it('returns remaining minutes when within cooldown', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:57:00Z'); // 3 min ago

            const result = getUserCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                5,
                now
            );

            expect(result).toBe(2); // 5 - 3 = 2 minutes remaining
        });

        it('returns 0 when exactly at cooldown boundary (5 min)', () => {
            const now = new Date('2026-02-04T12:05:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // exactly 5 min ago

            const result = getUserCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                5,
                now
            );

            expect(result).toBe(0);
        });

        it('returns 0 when cooldown has expired (6 min)', () => {
            const now = new Date('2026-02-04T12:06:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // 6 min ago

            const result = getUserCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                5,
                now
            );

            expect(result).toBe(0);
        });

        it('rounds up fractional minutes', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:57:30Z'); // 2.5 min ago

            const result = getUserCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                5,
                now
            );

            // 5 - 2.5 = 2.5, should round up to 3
            expect(result).toBe(3);
        });

        it('handles corrupted timestamp gracefully', () => {
            const corruptedTimestamp = {
                toDate: () => {
                    throw new Error('corrupted');
                },
            } as unknown as Timestamp;

            const result = getUserCooldownRemainingMinutes(corruptedTimestamp, 5);
            expect(result).toBe(0);
        });
    });

    // =========================================================================
    // shouldResetUserDailyCount Tests (AC6)
    // =========================================================================
    describe('shouldResetUserDailyCount', () => {
        it('returns true when resetAt is null (new preference)', () => {
            const result = shouldResetUserDailyCount(null);
            expect(result).toBe(true);
        });

        it('returns false when same day in device local timezone', () => {
            // Simulate same day scenario
            const now = new Date('2026-02-04T23:59:00');
            const resetAt = new Date('2026-02-04T00:01:00');

            const result = shouldResetUserDailyCount(
                createMockTimestamp(resetAt),
                now
            );

            expect(result).toBe(false);
        });

        it('returns true when crossed midnight (different day)', () => {
            // Reset was yesterday
            const now = new Date('2026-02-05T00:01:00');
            const resetAt = new Date('2026-02-04T23:59:00');

            const result = shouldResetUserDailyCount(
                createMockTimestamp(resetAt),
                now
            );

            expect(result).toBe(true);
        });

        it('handles corrupted timestamp gracefully', () => {
            const corruptedTimestamp = {
                toDate: () => {
                    throw new Error('corrupted');
                },
            } as unknown as Timestamp;

            const result = shouldResetUserDailyCount(corruptedTimestamp);
            expect(result).toBe(true);
        });
    });

    // =========================================================================
    // canToggleUserSharingPreference - Cooldown Tests (AC4)
    // =========================================================================
    describe('canToggleUserSharingPreference - Cooldown (AC4)', () => {
        it('blocks toggle when within 5-minute cooldown (4:59 - blocked)', () => {
            const now = new Date('2026-02-04T12:04:59Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // 4:59 ago

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: createMockTimestamp(toggledAt),
                toggleCountToday: 0,
                toggleCountResetAt: createMockTimestamp(now),
            };

            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('cooldown');
            expect(result.waitMinutes).toBeGreaterThan(0);
        });

        it('allows toggle at exactly 5-minute boundary (5:00 - allowed)', () => {
            const now = new Date('2026-02-04T12:05:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // exactly 5 min ago

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: createMockTimestamp(toggledAt),
                toggleCountToday: 0,
                toggleCountResetAt: createMockTimestamp(now),
            };

            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(true);
        });

        it('allows toggle when cooldown has passed (5:01 - allowed)', () => {
            const now = new Date('2026-02-04T12:05:01Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // 5:01 ago

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: createMockTimestamp(toggledAt),
                toggleCountToday: 0,
                toggleCountResetAt: createMockTimestamp(now),
            };

            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(true);
        });

        it('returns correct waitMinutes when blocked by cooldown', () => {
            const now = new Date('2026-02-04T12:02:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // 2 min ago

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: createMockTimestamp(toggledAt),
                toggleCountToday: 0,
                toggleCountResetAt: createMockTimestamp(now),
            };

            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('cooldown');
            expect(result.waitMinutes).toBe(3); // 5 - 2 = 3
        });

        it('uses 5-minute cooldown (not 15-minute group cooldown)', () => {
            // Verify user-level cooldown is 5 minutes from constants
            expect(SHARED_GROUP_LIMITS.USER_SHARING_COOLDOWN_MINUTES).toBe(5);
        });
    });

    // =========================================================================
    // canToggleUserSharingPreference - Daily Limit Tests (AC5)
    // =========================================================================
    describe('canToggleUserSharingPreference - Daily Limit (AC5)', () => {
        const now = new Date('2026-02-04T12:00:00Z');
        const basePreference = {
            shareMyTransactions: true,
            lastToggleAt: null, // No cooldown
            toggleCountResetAt: createMockTimestamp(now),
        };

        it('allows toggle when count is 0', () => {
            const preference = { ...basePreference, toggleCountToday: 0 };
            const result = canToggleUserSharingPreference(preference, now);
            expect(result.allowed).toBe(true);
        });

        it('allows toggle when count is 1', () => {
            const preference = { ...basePreference, toggleCountToday: 1 };
            const result = canToggleUserSharingPreference(preference, now);
            expect(result.allowed).toBe(true);
        });

        it('allows toggle when count is 2 (below limit)', () => {
            const preference = { ...basePreference, toggleCountToday: 2 };
            const result = canToggleUserSharingPreference(preference, now);
            expect(result.allowed).toBe(true);
        });

        it('blocks toggle when count is 3 (at limit)', () => {
            const preference = { ...basePreference, toggleCountToday: 3 };
            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
            expect(result.waitMinutes).toBeUndefined();
        });

        it('blocks toggle when count exceeds limit (4)', () => {
            const preference = { ...basePreference, toggleCountToday: 4 };
            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
        });

        it('uses correct daily limit from constants (3)', () => {
            expect(SHARED_GROUP_LIMITS.USER_SHARING_DAILY_LIMIT).toBe(3);
        });
    });

    // =========================================================================
    // canToggleUserSharingPreference - Midnight Reset Tests (AC6)
    // =========================================================================
    describe('canToggleUserSharingPreference - Midnight Reset (AC6)', () => {
        it('resets daily count at midnight and allows toggle', () => {
            // It's now Feb 5, but the reset was Feb 4
            const now = new Date('2026-02-05T08:00:00');
            const resetAt = new Date('2026-02-04T12:00:00');
            const toggledAt = new Date('2026-02-04T11:00:00'); // >5 min ago

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: createMockTimestamp(toggledAt),
                toggleCountToday: 3, // At limit, but it's a new day
                toggleCountResetAt: createMockTimestamp(resetAt),
            };

            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(true);
        });

        it('does not reset count if same day', () => {
            // Same day - count should NOT reset
            const now = new Date('2026-02-04T23:00:00');
            const resetAt = new Date('2026-02-04T08:00:00');

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountToday: 3, // At limit
                toggleCountResetAt: createMockTimestamp(resetAt),
            };

            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
        });

        it('uses device local timezone for midnight detection', () => {
            // This test documents that we use local timezone, not UTC
            // The implementation should use local date comparison
            const now = new Date('2026-02-05T00:01:00'); // Just past midnight local time
            const resetAt = new Date('2026-02-04T23:59:00'); // Just before midnight

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountToday: 3,
                toggleCountResetAt: createMockTimestamp(resetAt),
            };

            const result = canToggleUserSharingPreference(preference, now);

            // New day - count resets
            expect(result.allowed).toBe(true);
        });
    });

    // =========================================================================
    // canToggleUserSharingPreference - Migration Handling Tests (AC7)
    // =========================================================================
    describe('canToggleUserSharingPreference - Migration Handling (AC7)', () => {
        // Migration tests use Partial<UserGroupPreference> to simulate
        // documents with missing fields from older schema versions

        it('allows toggle when all fields are missing (migration case)', () => {
            const preference: Partial<UserGroupPreference> = {};

            const result = canToggleUserSharingPreference(preference);
            expect(result.allowed).toBe(true);
        });

        it('handles missing lastToggleAt (defaults to null - no cooldown)', () => {
            const preference: Partial<UserGroupPreference> = {
                shareMyTransactions: true,
                toggleCountToday: 0,
                toggleCountResetAt: null,
            };

            const result = canToggleUserSharingPreference(preference);
            expect(result.allowed).toBe(true);
        });

        it('handles missing toggleCountToday (defaults to 0)', () => {
            const preference: Partial<UserGroupPreference> = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountResetAt: null,
            };

            const result = canToggleUserSharingPreference(preference);
            expect(result.allowed).toBe(true);
        });

        it('handles missing toggleCountResetAt (defaults to null - needs reset)', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const preference: Partial<UserGroupPreference> = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountToday: 3, // At limit, but no resetAt means new day
            };

            const result = canToggleUserSharingPreference(preference, now);
            expect(result.allowed).toBe(true); // Count resets because no resetAt
        });

        it('handles corrupted lastToggleAt timestamp gracefully', () => {
            // Corrupted timestamps can occur from data corruption or
            // incompatible serialization. We simulate with a throwing toDate().
            const corruptedTimestamp = {
                toDate: () => {
                    throw new Error('corrupted');
                },
            } as unknown as Timestamp;

            const preference: Partial<UserGroupPreference> = {
                shareMyTransactions: true,
                lastToggleAt: corruptedTimestamp,
                toggleCountToday: 0,
                toggleCountResetAt: null,
            };

            // Should not throw, should allow (safe default for migration)
            const result = canToggleUserSharingPreference(preference);
            expect(result.allowed).toBe(true);
        });

        it('handles corrupted toggleCountResetAt timestamp gracefully', () => {
            const corruptedTimestamp = {
                toDate: () => {
                    throw new Error('corrupted');
                },
            } as unknown as Timestamp;

            const preference: Partial<UserGroupPreference> = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountToday: 3,
                toggleCountResetAt: corruptedTimestamp,
            };

            // Corrupted resetAt = needs reset = count resets to 0
            const result = canToggleUserSharingPreference(preference);
            expect(result.allowed).toBe(true);
        });

        it('handles empty object gracefully', () => {
            const preference: Partial<UserGroupPreference> = {};

            const result = canToggleUserSharingPreference(preference);
            expect(result.allowed).toBe(true);
        });
    });

    // =========================================================================
    // canToggleUserSharingPreference - Full Scenarios
    // =========================================================================
    describe('canToggleUserSharingPreference - Full Scenarios', () => {
        it('cooldown takes priority over daily limit check', () => {
            const now = new Date('2026-02-04T12:02:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // 2 min ago

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: createMockTimestamp(toggledAt),
                toggleCountToday: 5, // Over limit
                toggleCountResetAt: createMockTimestamp(now),
            };

            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('cooldown');
            expect(result.waitMinutes).toBe(3);
        });

        it('returns allowed=true with no reason when toggle is permitted', () => {
            const now = new Date('2026-02-04T12:00:00Z');

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountToday: 0,
                toggleCountResetAt: createMockTimestamp(now),
            };

            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(true);
            expect(result.reason).toBeUndefined();
            expect(result.waitMinutes).toBeUndefined();
        });

        it('handles scenario: first toggle ever on a new preference', () => {
            const preference = {
                shareMyTransactions: false,
                lastToggleAt: null,
                toggleCountToday: 0,
                toggleCountResetAt: null,
            };

            const result = canToggleUserSharingPreference(preference);

            expect(result.allowed).toBe(true);
        });

        it('handles scenario: exactly at daily limit with cooldown passed', () => {
            const now = new Date('2026-02-04T12:06:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // 6 min ago, cooldown passed

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: createMockTimestamp(toggledAt),
                toggleCountToday: 3, // At limit
                toggleCountResetAt: createMockTimestamp(now),
            };

            const result = canToggleUserSharingPreference(preference, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
        });

        it('handles shareMyTransactions value in preference (does not affect cooldown)', () => {
            const now = new Date('2026-02-04T12:00:00Z');

            const prefFalse = {
                shareMyTransactions: false,
                lastToggleAt: null,
                toggleCountToday: 0,
                toggleCountResetAt: createMockTimestamp(now),
            };

            const prefTrue = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountToday: 0,
                toggleCountResetAt: createMockTimestamp(now),
            };

            // Both should be allowed - shareMyTransactions value doesn't affect cooldown
            expect(canToggleUserSharingPreference(prefFalse, now).allowed).toBe(true);
            expect(canToggleUserSharingPreference(prefTrue, now).allowed).toBe(true);
        });
    });

    // =========================================================================
    // Type Safety Tests
    // =========================================================================
    describe('Type Safety', () => {
        it('UserToggleCooldownResult has correct shape when allowed', () => {
            const result: UserToggleCooldownResult = { allowed: true };

            expect(result.allowed).toBe(true);
            expect(result.reason).toBeUndefined();
            expect(result.waitMinutes).toBeUndefined();
        });

        it('UserToggleCooldownResult has correct shape when blocked by cooldown', () => {
            const result: UserToggleCooldownResult = {
                allowed: false,
                reason: 'cooldown',
                waitMinutes: 3,
            };

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('cooldown');
            expect(result.waitMinutes).toBe(3);
        });

        it('UserToggleCooldownResult has correct shape when blocked by daily limit', () => {
            const result: UserToggleCooldownResult = {
                allowed: false,
                reason: 'daily_limit',
            };

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
            expect(result.waitMinutes).toBeUndefined();
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================
    describe('Edge Cases', () => {
        it('handles negative toggleCountToday gracefully', () => {
            const preference = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountToday: -1, // Invalid, but should not crash
                toggleCountResetAt: null,
            };

            const result = canToggleUserSharingPreference(preference);
            expect(result.allowed).toBe(true);
        });

        it('handles very large toggleCountToday', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const preference = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountToday: 999999,
                toggleCountResetAt: createMockTimestamp(now),
            };

            const result = canToggleUserSharingPreference(preference, now);
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
        });

        it('handles toggle at exactly midnight', () => {
            const now = new Date('2026-02-05T00:00:00'); // Exactly midnight
            const resetAt = new Date('2026-02-04T12:00:00');

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountToday: 3,
                toggleCountResetAt: createMockTimestamp(resetAt),
            };

            const result = canToggleUserSharingPreference(preference, now);
            expect(result.allowed).toBe(true); // New day
        });

        it('handles year boundary crossing', () => {
            const now = new Date('2027-01-01T00:00:00'); // New Year
            const resetAt = new Date('2026-12-31T23:59:00');

            const preference = {
                shareMyTransactions: true,
                lastToggleAt: null,
                toggleCountToday: 3,
                toggleCountResetAt: createMockTimestamp(resetAt),
            };

            const result = canToggleUserSharingPreference(preference, now);
            expect(result.allowed).toBe(true); // New day (new year)
        });
    });
});
