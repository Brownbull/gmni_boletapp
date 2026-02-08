/**
 * Sharing Cooldown Utility Tests
 *
 * Story 14d-v2-1-11a: Transaction Sharing Toggle - Foundation
 *
 * Tests for group-level transaction sharing toggle cooldown logic:
 * - canToggleTransactionSharing() - AC6
 * - 15-minute cooldown check - AC7
 * - Daily limit check - AC8
 * - Midnight reset with timezone - AC9
 * - Migration handling (missing fields) - AC5
 */

import { describe, it, expect } from 'vitest';
import {
    canToggleTransactionSharing,
    getCooldownRemainingMinutes,
    shouldResetDailyCount,
    type ToggleCooldownResult,
} from '../../../src/utils/sharingCooldown';
import { SHARED_GROUP_LIMITS } from '../../../src/types/sharedGroup';
import { createMockTimestamp } from '../../helpers';

describe('sharingCooldown', () => {
    // =========================================================================
    // getCooldownRemainingMinutes Tests (AC7)
    // =========================================================================
    describe('getCooldownRemainingMinutes', () => {
        it('returns 0 when lastToggleAt is null (no previous toggle)', () => {
            const result = getCooldownRemainingMinutes(null, SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES);
            expect(result).toBe(0);
        });

        it('returns remaining minutes when within cooldown (AC7)', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:50:00Z'); // 10 min ago

            const result = getCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES,
                now
            );

            expect(result).toBe(5); // 15 - 10 = 5 minutes remaining
        });

        it('returns 0 when exactly at cooldown boundary (15 min)', () => {
            const now = new Date('2026-02-04T12:15:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // exactly 15 min ago

            const result = getCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES,
                now
            );

            expect(result).toBe(0);
        });

        it('returns 0 when cooldown has expired (16 min)', () => {
            const now = new Date('2026-02-04T12:16:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // 16 min ago

            const result = getCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES,
                now
            );

            expect(result).toBe(0);
        });

        it('rounds up fractional minutes', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:50:30Z'); // 9.5 min ago

            const result = getCooldownRemainingMinutes(
                createMockTimestamp(toggledAt),
                SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES,
                now
            );

            // 15 - 9.5 = 5.5, should round up to 6
            expect(result).toBe(6);
        });

        it('handles corrupted timestamp gracefully', () => {
            const corruptedTimestamp = {
                toDate: () => {
                    throw new Error('corrupted');
                },
            } as unknown as Timestamp;

            const result = getCooldownRemainingMinutes(corruptedTimestamp, SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES);
            expect(result).toBe(0);
        });
    });

    // =========================================================================
    // shouldResetDailyCount Tests (AC9)
    // =========================================================================
    describe('shouldResetDailyCount', () => {
        it('returns true when resetAt is null (new group)', () => {
            const result = shouldResetDailyCount(null, 'America/Santiago');
            expect(result).toBe(true);
        });

        it('returns false when same day in timezone', () => {
            // Both times are on 2026-02-04 in Santiago timezone (UTC-3)
            const now = new Date('2026-02-04T23:59:00-03:00');
            const resetAt = new Date('2026-02-04T00:01:00-03:00');

            const result = shouldResetDailyCount(
                createMockTimestamp(resetAt),
                'America/Santiago',
                now
            );

            expect(result).toBe(false);
        });

        it('returns true when crossed midnight in timezone', () => {
            // Reset was yesterday in Santiago timezone
            const now = new Date('2026-02-05T00:01:00-03:00');
            const resetAt = new Date('2026-02-04T23:59:00-03:00');

            const result = shouldResetDailyCount(
                createMockTimestamp(resetAt),
                'America/Santiago',
                now
            );

            expect(result).toBe(true);
        });

        it('handles different timezones correctly', () => {
            // Test with UTC - same moment, different local dates
            const now = new Date('2026-02-05T02:00:00Z'); // Feb 5 02:00 UTC
            const resetAt = new Date('2026-02-04T23:00:00Z'); // Feb 4 23:00 UTC

            // In UTC, these are different days
            const resultUTC = shouldResetDailyCount(
                createMockTimestamp(resetAt),
                'UTC',
                now
            );
            expect(resultUTC).toBe(true);

            // In Pacific (UTC-8), Feb 5 02:00 UTC = Feb 4 18:00 Pacific
            // Feb 4 23:00 UTC = Feb 4 15:00 Pacific - same day!
            const resultPacific = shouldResetDailyCount(
                createMockTimestamp(resetAt),
                'America/Los_Angeles',
                now
            );
            expect(resultPacific).toBe(false);
        });

        it('handles invalid timezone gracefully', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const resetAt = new Date('2026-02-04T10:00:00Z');

            // Invalid timezone should return true (safe default - allow reset)
            const result = shouldResetDailyCount(
                createMockTimestamp(resetAt),
                'Invalid/Timezone',
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

            const result = shouldResetDailyCount(
                corruptedTimestamp,
                'America/Santiago'
            );
            expect(result).toBe(true);
        });
    });

    // =========================================================================
    // canToggleTransactionSharing - Daily Limit Tests (AC8)
    // =========================================================================
    describe('canToggleTransactionSharing - Daily Limit (AC8)', () => {
        const now = new Date('2026-02-04T12:00:00Z');
        const baseGroup = {
            transactionSharingLastToggleAt: null, // No cooldown
            transactionSharingToggleCountResetAt: createMockTimestamp(now),
            timezone: 'America/Santiago',
        };

        it('allows toggle when count is 0', () => {
            const group = { ...baseGroup, transactionSharingToggleCountToday: 0 };
            const result = canToggleTransactionSharing(group, now);
            expect(result.allowed).toBe(true);
        });

        it('allows toggle when count is 1', () => {
            const group = { ...baseGroup, transactionSharingToggleCountToday: 1 };
            const result = canToggleTransactionSharing(group, now);
            expect(result.allowed).toBe(true);
        });

        it('allows toggle when count is 2 (below limit)', () => {
            const group = { ...baseGroup, transactionSharingToggleCountToday: 2 };
            const result = canToggleTransactionSharing(group, now);
            expect(result.allowed).toBe(true);
        });

        it('blocks toggle when count is 3 (at limit)', () => {
            const group = { ...baseGroup, transactionSharingToggleCountToday: 3 };
            const result = canToggleTransactionSharing(group, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
            expect(result.waitMinutes).toBeUndefined();
        });

        it('blocks toggle when count exceeds limit', () => {
            const group = { ...baseGroup, transactionSharingToggleCountToday: 5 };
            const result = canToggleTransactionSharing(group, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
        });

        it('uses correct daily limit from constants', () => {
            // Verify we're using the constant, not a hardcoded value
            expect(SHARED_GROUP_LIMITS.TRANSACTION_SHARING_DAILY_LIMIT).toBe(3);
        });
    });

    // =========================================================================
    // canToggleTransactionSharing - Migration Handling Tests (AC5)
    // =========================================================================
    describe('canToggleTransactionSharing - Migration Handling (AC5)', () => {
        it('allows toggle when all fields are missing (migration case)', () => {
            const group = {
                timezone: 'America/Santiago',
            } as any;

            const result = canToggleTransactionSharing(group);
            expect(result.allowed).toBe(true);
        });

        it('handles missing timezone by defaulting to UTC', () => {
            const group = {
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
                transactionSharingToggleCountResetAt: null,
            } as any;

            const result = canToggleTransactionSharing(group);
            expect(result.allowed).toBe(true);
        });

        it('handles undefined transactionSharingToggleCountToday', () => {
            const group = {
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: undefined,
                transactionSharingToggleCountResetAt: null,
                timezone: 'America/Santiago',
            } as any;

            const result = canToggleTransactionSharing(group);
            expect(result.allowed).toBe(true);
        });

        it('handles corrupted timestamp gracefully', () => {
            const group = {
                transactionSharingLastToggleAt: {
                    toDate: () => {
                        throw new Error('corrupted');
                    },
                },
                transactionSharingToggleCountToday: 0,
                transactionSharingToggleCountResetAt: null,
                timezone: 'America/Santiago',
            } as any;

            // Should not throw, should allow (safe default for migration)
            const result = canToggleTransactionSharing(group);
            expect(result.allowed).toBe(true);
        });

        it('handles empty object gracefully', () => {
            const group = {} as any;

            const result = canToggleTransactionSharing(group);
            expect(result.allowed).toBe(true);
        });
    });

    // =========================================================================
    // canToggleTransactionSharing - Cooldown Tests (AC7)
    // =========================================================================
    describe('canToggleTransactionSharing - Cooldown (AC7)', () => {
        it('blocks toggle when within cooldown period', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:50:00Z'); // 10 min ago

            const group = {
                transactionSharingLastToggleAt: createMockTimestamp(toggledAt),
                transactionSharingToggleCountToday: 0,
                transactionSharingToggleCountResetAt: createMockTimestamp(now),
                timezone: 'America/Santiago',
            };

            const result = canToggleTransactionSharing(group, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('cooldown');
            expect(result.waitMinutes).toBe(5);
        });

        it('allows toggle when cooldown has passed', () => {
            const now = new Date('2026-02-04T12:16:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // 16 min ago

            const group = {
                transactionSharingLastToggleAt: createMockTimestamp(toggledAt),
                transactionSharingToggleCountToday: 0,
                transactionSharingToggleCountResetAt: createMockTimestamp(now),
                timezone: 'America/Santiago',
            };

            const result = canToggleTransactionSharing(group, now);

            expect(result.allowed).toBe(true);
        });

        it('uses correct cooldown from constants', () => {
            // Verify we're using the constant, not a hardcoded value
            expect(SHARED_GROUP_LIMITS.TRANSACTION_SHARING_COOLDOWN_MINUTES).toBe(15);
        });
    });

    // =========================================================================
    // canToggleTransactionSharing - Full Scenarios
    // =========================================================================
    describe('canToggleTransactionSharing - Full Scenarios', () => {
        it('cooldown takes priority over daily limit check', () => {
            const now = new Date('2026-02-04T12:00:00Z');
            const toggledAt = new Date('2026-02-04T11:50:00Z'); // 10 min ago

            const group = {
                transactionSharingLastToggleAt: createMockTimestamp(toggledAt),
                transactionSharingToggleCountToday: 5, // Over limit
                transactionSharingToggleCountResetAt: createMockTimestamp(now),
                timezone: 'America/Santiago',
            };

            const result = canToggleTransactionSharing(group, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('cooldown');
            expect(result.waitMinutes).toBe(5);
        });

        it('resets daily count at midnight and allows toggle', () => {
            // It's now Feb 5, but the reset was Feb 4
            const now = new Date('2026-02-05T08:00:00-03:00'); // Feb 5 morning in Santiago
            const resetAt = new Date('2026-02-04T12:00:00-03:00'); // Feb 4 in Santiago
            const toggledAt = new Date('2026-02-04T11:00:00-03:00'); // >15 min ago

            const group = {
                transactionSharingLastToggleAt: createMockTimestamp(toggledAt),
                transactionSharingToggleCountToday: 3, // At limit, but it's a new day
                transactionSharingToggleCountResetAt: createMockTimestamp(resetAt),
                timezone: 'America/Santiago',
            };

            const result = canToggleTransactionSharing(group, now);

            expect(result.allowed).toBe(true);
        });

        it('returns allowed=true with no reason when toggle is permitted', () => {
            const now = new Date('2026-02-04T12:00:00Z');

            const group = {
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
                transactionSharingToggleCountResetAt: createMockTimestamp(now),
                timezone: 'America/Santiago',
            };

            const result = canToggleTransactionSharing(group, now);

            expect(result.allowed).toBe(true);
            expect(result.reason).toBeUndefined();
            expect(result.waitMinutes).toBeUndefined();
        });

        it('handles scenario: first toggle ever on a new group', () => {
            const group = {
                transactionSharingLastToggleAt: null,
                transactionSharingToggleCountToday: 0,
                transactionSharingToggleCountResetAt: null,
                timezone: 'America/Santiago',
            };

            const result = canToggleTransactionSharing(group);

            expect(result.allowed).toBe(true);
        });

        it('handles scenario: exactly at daily limit with cooldown passed', () => {
            const now = new Date('2026-02-04T12:16:00Z');
            const toggledAt = new Date('2026-02-04T12:00:00Z'); // 16 min ago, cooldown passed

            const group = {
                transactionSharingLastToggleAt: createMockTimestamp(toggledAt),
                transactionSharingToggleCountToday: 3, // At limit
                transactionSharingToggleCountResetAt: createMockTimestamp(now),
                timezone: 'America/Santiago',
            };

            const result = canToggleTransactionSharing(group, now);

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
        });
    });

    // =========================================================================
    // Type Safety Tests
    // =========================================================================
    describe('Type Safety', () => {
        it('ToggleCooldownResult has correct shape when allowed', () => {
            const result: ToggleCooldownResult = { allowed: true };

            expect(result.allowed).toBe(true);
            expect(result.reason).toBeUndefined();
            expect(result.waitMinutes).toBeUndefined();
        });

        it('ToggleCooldownResult has correct shape when blocked by cooldown', () => {
            const result: ToggleCooldownResult = {
                allowed: false,
                reason: 'cooldown',
                waitMinutes: 5,
            };

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('cooldown');
            expect(result.waitMinutes).toBe(5);
        });

        it('ToggleCooldownResult has correct shape when blocked by daily limit', () => {
            const result: ToggleCooldownResult = {
                allowed: false,
                reason: 'daily_limit',
            };

            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('daily_limit');
            expect(result.waitMinutes).toBeUndefined();
        });
    });
});
