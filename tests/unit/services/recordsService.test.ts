/**
 * RecordsService Tests
 *
 * Story 14.19: Personal Records Detection
 * Epic 14: Core Implementation
 *
 * Tests for personal records detection, storage, and cooldown logic.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    detectLowestCategoryWeek,
    getWeeklyTotalsForCategory,
    getCurrentWeekId,
    getWeeksInRange,
    canShowRecord,
    getRecordCooldowns,
    setRecordCooldowns,
    updateRecordCooldowns,
    getDefaultCooldowns,
    generateRecordMessage,
} from '../../../src/services/recordsService';
import type { Transaction } from '../../../src/types/transaction';
import type { RecordCooldowns, PersonalRecordType } from '../../../src/types/personalRecord';
import { RECORD_COOLDOWNS_KEY, RECORD_TYPE_COOLDOWN_MS } from '../../../src/types/personalRecord';

// ============================================================================
// Mock Setup
// ============================================================================

describe('recordsService', () => {
    let mockStorage: Record<string, string>;
    let mockLocalStorage: Storage;

    beforeEach(() => {
        mockStorage = {};
        mockLocalStorage = {
            getItem: vi.fn((key: string) => mockStorage[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                mockStorage[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStorage[key];
            }),
            clear: vi.fn(() => {
                mockStorage = {};
            }),
            length: 0,
            key: vi.fn(() => null),
        };
        vi.stubGlobal('localStorage', mockLocalStorage);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    // ============================================================================
    // Week Calculation Tests
    // ============================================================================

    describe('getCurrentWeekId', () => {
        it('returns ISO week format for a given date', () => {
            // Monday, January 6, 2025 - Week 2 of 2025
            // Use explicit date components to avoid timezone issues
            const date = new Date(2025, 0, 6, 12, 0, 0); // Jan 6, 2025 at noon local
            expect(getCurrentWeekId(date)).toBe('2025-W02');
        });

        it('handles year boundary correctly', () => {
            // December 30, 2024 - Week 1 of 2025 (ISO week)
            const date = new Date(2024, 11, 30, 12, 0, 0); // Dec 30, 2024 at noon
            expect(getCurrentWeekId(date)).toBe('2025-W01');
        });

        it('handles week 52/53 correctly', () => {
            // December 23, 2024 - Week 52 of 2024
            const date = new Date(2024, 11, 23, 12, 0, 0); // Dec 23, 2024 at noon
            expect(getCurrentWeekId(date)).toBe('2024-W52');
        });
    });

    describe('getWeeksInRange', () => {
        it('returns correct number of weeks for 3 months', () => {
            const endDate = new Date('2025-01-15');
            const weeks = getWeeksInRange(endDate, 3);

            // 3 months ~= 13 weeks
            expect(weeks.length).toBeGreaterThanOrEqual(12);
            expect(weeks.length).toBeLessThanOrEqual(14);
        });

        it('returns weeks in chronological order', () => {
            const endDate = new Date('2025-01-15');
            const weeks = getWeeksInRange(endDate, 1);

            for (let i = 1; i < weeks.length; i++) {
                expect(weeks[i].weekStart.getTime()).toBeGreaterThan(weeks[i - 1].weekStart.getTime());
            }
        });
    });

    // ============================================================================
    // Weekly Totals Tests
    // ============================================================================

    describe('getWeeklyTotalsForCategory', () => {
        it('calculates weekly totals correctly', () => {
            // Set current time so getWeeksInRange works predictably
            vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0)); // Jan 15, 2025

            const transactions: Transaction[] = [
                createTransaction('2025-01-06', 'Restaurant', 1000),
                createTransaction('2025-01-07', 'Restaurant', 2000),
                createTransaction('2025-01-13', 'Restaurant', 1500), // Different week
            ];

            const totals = getWeeklyTotalsForCategory(transactions, 'Restaurant', 1);

            expect(totals.length).toBeGreaterThanOrEqual(1);
            // Week of Jan 6-12 (Week 2) should have 3000
            const week2 = totals.find((w) => w.weekId === '2025-W02');
            expect(week2?.total).toBe(3000);
        });

        it('filters by category', () => {
            vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));

            const transactions: Transaction[] = [
                createTransaction('2025-01-06', 'Restaurant', 1000),
                createTransaction('2025-01-06', 'Supermarket', 5000),
            ];

            const restaurantTotals = getWeeklyTotalsForCategory(transactions, 'Restaurant', 1);
            const supermarketTotals = getWeeklyTotalsForCategory(transactions, 'Supermarket', 1);

            const restaurantWeek = restaurantTotals.find((w) => w.weekId === '2025-W02');
            const supermarketWeek = supermarketTotals.find((w) => w.weekId === '2025-W02');

            expect(restaurantWeek?.total).toBe(1000);
            expect(supermarketWeek?.total).toBe(5000);
        });

        it('returns empty array for no transactions in category', () => {
            vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));

            const transactions: Transaction[] = [
                createTransaction('2025-01-06', 'Restaurant', 1000),
            ];

            const totals = getWeeklyTotalsForCategory(transactions, 'Supermarket', 1);

            // Should still return weeks but with 0 totals, or empty
            const totalSum = totals.reduce((sum, w) => sum + w.total, 0);
            expect(totalSum).toBe(0);
        });
    });

    // ============================================================================
    // Record Detection Tests
    // ============================================================================

    describe('detectLowestCategoryWeek', () => {
        it('detects a new record when current week is lowest', () => {
            // Set current time to Jan 12, 2025 (Week 2)
            vi.setSystemTime(new Date(2025, 0, 12, 12, 0, 0));

            // Historical weeks: 5000, 4000, 3500
            // Current week: 2000 (new record!)
            const transactions: Transaction[] = [
                // Week 51 of 2024: 5000
                createTransaction('2024-12-16', 'Restaurant', 5000),
                // Week 52 of 2024: 4000
                createTransaction('2024-12-23', 'Restaurant', 4000),
                // Week 1 of 2025: 3500
                createTransaction('2024-12-30', 'Restaurant', 3500),
                // Current week (Week 2 of 2025): 2000
                createTransaction('2025-01-06', 'Restaurant', 2000),
            ];

            const record = detectLowestCategoryWeek(transactions, 'Restaurant', 2000, 3);

            expect(record).not.toBeNull();
            expect(record?.type).toBe('lowest_category_week');
            expect(record?.category).toBe('Restaurant');
            expect(record?.value).toBe(2000);
            expect(record?.previousBest).toBe(3500);
        });

        it('returns null when not enough historical data', () => {
            vi.setSystemTime(new Date(2025, 0, 12, 12, 0, 0));

            const transactions: Transaction[] = [
                createTransaction('2025-01-06', 'Restaurant', 2000),
            ];

            const record = detectLowestCategoryWeek(transactions, 'Restaurant', 2000, 3);

            expect(record).toBeNull();
        });

        it('returns null when current week is not a record', () => {
            vi.setSystemTime(new Date(2025, 0, 12, 12, 0, 0));

            const transactions: Transaction[] = [
                // Week 1 of 2025: 1500 (previous best)
                createTransaction('2024-12-30', 'Restaurant', 1500),
                // Current week (Week 2): 2000 (not a record)
                createTransaction('2025-01-06', 'Restaurant', 2000),
            ];

            const record = detectLowestCategoryWeek(transactions, 'Restaurant', 2000, 3);

            expect(record).toBeNull();
        });

        it('handles zero spending week as valid record', () => {
            vi.setSystemTime(new Date(2025, 0, 12, 12, 0, 0));

            const transactions: Transaction[] = [
                // Week 52 of 2024: 2000
                createTransaction('2024-12-23', 'Restaurant', 2000),
                // Week 1 of 2025: 1500
                createTransaction('2024-12-30', 'Restaurant', 1500),
            ];

            // Current week (Week 2) with 0 spending should be a record
            const record = detectLowestCategoryWeek(transactions, 'Restaurant', 0, 3);

            expect(record).not.toBeNull();
            expect(record?.value).toBe(0);
            expect(record?.previousBest).toBe(1500);
        });
    });

    // ============================================================================
    // Message Generation Tests
    // ============================================================================

    describe('generateRecordMessage', () => {
        it('generates Spanish message for lowest category week', () => {
            const message = generateRecordMessage('lowest_category_week', 'Restaurante', 3);
            expect(message).toContain('Restaurante');
            expect(message).toContain('3 meses');
        });

        it('generates message for lowest total week', () => {
            const message = generateRecordMessage('lowest_total_week', undefined, 2);
            expect(message).toContain('2 meses');
            expect(message).not.toContain('undefined');
        });
    });

    // ============================================================================
    // Cooldown Tests
    // ============================================================================

    describe('canShowRecord', () => {
        it('allows record when no cooldowns set', () => {
            const cooldowns = getDefaultCooldowns();
            const result = canShowRecord('lowest_category_week', cooldowns);
            expect(result).toBe(true);
        });

        it('blocks record when same session celebration exists', () => {
            const cooldowns: RecordCooldowns = {
                lastSessionCelebration: new Date().toISOString(),
                recordTypeCooldowns: {},
            };

            const result = canShowRecord('lowest_category_week', cooldowns);
            expect(result).toBe(false);
        });

        it('blocks record when same type was shown within 24h', () => {
            const now = new Date();
            const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);

            const cooldowns: RecordCooldowns = {
                lastSessionCelebration: null,
                recordTypeCooldowns: {
                    lowest_category_week: twentyThreeHoursAgo.toISOString(),
                },
            };

            vi.setSystemTime(now);
            const result = canShowRecord('lowest_category_week', cooldowns);
            expect(result).toBe(false);
        });

        it('allows record when same type was shown more than 24h ago', () => {
            const now = new Date();
            const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

            const cooldowns: RecordCooldowns = {
                lastSessionCelebration: null,
                recordTypeCooldowns: {
                    lowest_category_week: twentyFiveHoursAgo.toISOString(),
                },
            };

            vi.setSystemTime(now);
            const result = canShowRecord('lowest_category_week', cooldowns);
            expect(result).toBe(true);
        });

        it('allows different record type even with session cooldown from previous session', () => {
            const now = new Date();
            // Previous session was yesterday
            const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000);

            const cooldowns: RecordCooldowns = {
                lastSessionCelebration: yesterday.toISOString(),
                recordTypeCooldowns: {
                    lowest_category_week: yesterday.toISOString(),
                },
            };

            vi.setSystemTime(now);
            // Different record type should be allowed
            const result = canShowRecord('lowest_total_week', cooldowns);
            expect(result).toBe(true);
        });
    });

    describe('getRecordCooldowns', () => {
        it('returns default cooldowns when localStorage is empty', () => {
            const cooldowns = getRecordCooldowns();

            expect(cooldowns.lastSessionCelebration).toBeNull();
            expect(cooldowns.recordTypeCooldowns).toEqual({});
        });

        it('parses stored cooldowns from localStorage', () => {
            const stored: RecordCooldowns = {
                lastSessionCelebration: '2025-01-10T10:00:00.000Z',
                recordTypeCooldowns: {
                    lowest_category_week: '2025-01-09T10:00:00.000Z',
                },
            };
            mockStorage[RECORD_COOLDOWNS_KEY] = JSON.stringify(stored);

            const cooldowns = getRecordCooldowns();

            expect(cooldowns.lastSessionCelebration).toBe('2025-01-10T10:00:00.000Z');
            expect(cooldowns.recordTypeCooldowns.lowest_category_week).toBe(
                '2025-01-09T10:00:00.000Z'
            );
        });

        it('returns default cooldowns when localStorage is corrupted', () => {
            mockStorage[RECORD_COOLDOWNS_KEY] = 'not valid json';

            const cooldowns = getRecordCooldowns();

            expect(cooldowns.lastSessionCelebration).toBeNull();
            expect(cooldowns.recordTypeCooldowns).toEqual({});
        });
    });

    describe('setRecordCooldowns', () => {
        it('saves cooldowns to localStorage', () => {
            const cooldowns: RecordCooldowns = {
                lastSessionCelebration: '2025-01-10T10:00:00.000Z',
                recordTypeCooldowns: {
                    lowest_category_week: '2025-01-09T10:00:00.000Z',
                },
            };

            setRecordCooldowns(cooldowns);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                RECORD_COOLDOWNS_KEY,
                JSON.stringify(cooldowns)
            );
        });
    });

    describe('updateRecordCooldowns', () => {
        it('updates session and type cooldowns', () => {
            const now = new Date('2025-01-10T12:00:00.000Z');
            vi.setSystemTime(now);

            const updated = updateRecordCooldowns(
                getDefaultCooldowns(),
                'lowest_category_week'
            );

            expect(updated.lastSessionCelebration).toBe(now.toISOString());
            expect(updated.recordTypeCooldowns.lowest_category_week).toBe(now.toISOString());
        });

        it('preserves other record type cooldowns', () => {
            const existing: RecordCooldowns = {
                lastSessionCelebration: null,
                recordTypeCooldowns: {
                    lowest_total_week: '2025-01-09T10:00:00.000Z',
                },
            };

            const now = new Date('2025-01-10T12:00:00.000Z');
            vi.setSystemTime(now);

            const updated = updateRecordCooldowns(existing, 'lowest_category_week');

            expect(updated.recordTypeCooldowns.lowest_total_week).toBe(
                '2025-01-09T10:00:00.000Z'
            );
            expect(updated.recordTypeCooldowns.lowest_category_week).toBe(
                now.toISOString()
            );
        });
    });
});

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a transaction with proper date handling.
 * Uses YYYY-MM-DD format and creates Date at noon local time to avoid timezone issues.
 */
function createTransaction(
    date: string,
    category: string,
    total: number
): Transaction {
    // Parse date string (YYYY-MM-DD) and create local date at noon
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0);

    return {
        id: `tx-${date}-${category}-${total}`,
        merchant: `Test ${category}`,
        total,
        currency: 'CLP',
        date,
        category,
        createdAt: localDate,
        items: [],
    };
}
