/**
 * Tests for periodUtils - computePeriods utility
 *
 * Story 14d-v2-1-2a: Transaction Type & Period Utility
 * AC #3: computePeriods correctly computes day, week, month, quarter, and year strings
 *
 * Test coverage includes:
 * - Basic period computation
 * - ISO week numbering (Monday start, Thursday rule)
 * - Edge cases: year boundaries, week 53, leap years
 * - Quarter boundaries
 * - Invalid date handling
 */

import { describe, it, expect } from 'vitest';
import { computePeriods } from '../../../src/utils/periodUtils';
import type { TransactionPeriods } from '../../../src/types/transaction';

describe('computePeriods', () => {
    describe('basic period computation', () => {
        it('should compute all periods for a standard date', () => {
            const result = computePeriods('2026-01-22');

            expect(result).toEqual<TransactionPeriods>({
                day: '2026-01-22',
                week: '2026-W04',
                month: '2026-01',
                quarter: '2026-Q1',
                year: '2026',
            });
        });

        it('should handle dates in Q2', () => {
            const result = computePeriods('2026-05-15');

            expect(result.day).toBe('2026-05-15');
            expect(result.month).toBe('2026-05');
            expect(result.quarter).toBe('2026-Q2');
            expect(result.year).toBe('2026');
        });

        it('should handle dates in Q3', () => {
            const result = computePeriods('2026-08-20');

            expect(result.day).toBe('2026-08-20');
            expect(result.month).toBe('2026-08');
            expect(result.quarter).toBe('2026-Q3');
            expect(result.year).toBe('2026');
        });

        it('should handle dates in Q4', () => {
            const result = computePeriods('2026-11-30');

            expect(result.day).toBe('2026-11-30');
            expect(result.month).toBe('2026-11');
            expect(result.quarter).toBe('2026-Q4');
            expect(result.year).toBe('2026');
        });
    });

    describe('ISO week numbering', () => {
        it('should compute correct ISO week for mid-month date', () => {
            // 2026-01-22 is a Thursday in week 4
            const result = computePeriods('2026-01-22');
            expect(result.week).toBe('2026-W04');
        });

        it('should compute correct week for Monday (week start)', () => {
            // 2026-01-19 is a Monday, start of week 4
            const result = computePeriods('2026-01-19');
            expect(result.week).toBe('2026-W04');
        });

        it('should compute correct week for Sunday (week end)', () => {
            // 2026-01-25 is a Sunday, end of week 4
            const result = computePeriods('2026-01-25');
            expect(result.week).toBe('2026-W04');
        });

        it('should handle first week of year', () => {
            // 2026-01-01 is a Thursday, which is in week 1 of 2026
            const result = computePeriods('2026-01-01');
            expect(result.week).toBe('2026-W01');
        });

        it('should handle week 53 when it exists', () => {
            // 2020-12-31 is a Thursday in week 53 of 2020
            // (2020 has 53 weeks because Jan 1 was Wednesday)
            const result = computePeriods('2020-12-31');
            expect(result.week).toBe('2020-W53');
        });
    });

    describe('year boundary edge cases', () => {
        it('should assign Dec 31 to correct ISO week year when it belongs to next year', () => {
            // 2025-12-31 is a Wednesday
            // Since Thursday of that week (2026-01-01) is in 2026, this is week 1 of 2026
            const result = computePeriods('2025-12-31');
            expect(result.week).toBe('2026-W01');
            expect(result.year).toBe('2025'); // Calendar year stays 2025
        });

        it('should assign Jan 1 to correct ISO week year when it belongs to previous year', () => {
            // 2022-01-01 is a Saturday
            // The Thursday of that week is Dec 30, 2021, so this is week 52 of 2021
            const result = computePeriods('2022-01-01');
            expect(result.week).toBe('2021-W52');
            expect(result.year).toBe('2022'); // Calendar year stays 2022
        });

        it('should handle Jan 1 when it falls on Monday (start of week 1)', () => {
            // 2024-01-01 is a Monday - start of week 1
            const result = computePeriods('2024-01-01');
            expect(result.week).toBe('2024-W01');
        });

        it('should handle Dec 31 that is definitely in current year week', () => {
            // 2026-12-31 is a Thursday
            // The Thursday of that week IS Dec 31, so this is week 53 of 2026
            const result = computePeriods('2026-12-31');
            expect(result.week).toBe('2026-W53');
        });
    });

    describe('leap year handling', () => {
        it('should handle Feb 29 in leap year', () => {
            const result = computePeriods('2024-02-29');

            expect(result.day).toBe('2024-02-29');
            expect(result.month).toBe('2024-02');
            expect(result.quarter).toBe('2024-Q1');
            expect(result.year).toBe('2024');
        });

        it('should handle dates after Feb 29 in leap year', () => {
            const result = computePeriods('2024-03-01');

            expect(result.day).toBe('2024-03-01');
            expect(result.month).toBe('2024-03');
            expect(result.quarter).toBe('2024-Q1');
        });
    });

    describe('quarter boundaries', () => {
        it('should correctly identify Q1/Q2 boundary (March 31 vs April 1)', () => {
            const march31 = computePeriods('2026-03-31');
            const april1 = computePeriods('2026-04-01');

            expect(march31.quarter).toBe('2026-Q1');
            expect(april1.quarter).toBe('2026-Q2');
        });

        it('should correctly identify Q2/Q3 boundary (June 30 vs July 1)', () => {
            const june30 = computePeriods('2026-06-30');
            const july1 = computePeriods('2026-07-01');

            expect(june30.quarter).toBe('2026-Q2');
            expect(july1.quarter).toBe('2026-Q3');
        });

        it('should correctly identify Q3/Q4 boundary (September 30 vs October 1)', () => {
            const sept30 = computePeriods('2026-09-30');
            const oct1 = computePeriods('2026-10-01');

            expect(sept30.quarter).toBe('2026-Q3');
            expect(oct1.quarter).toBe('2026-Q4');
        });
    });

    describe('error handling', () => {
        it('should return fallback periods for invalid date string', () => {
            // Invalid date should return fallback structure with invalid markers
            const result = computePeriods('invalid-date');

            expect(result).toEqual<TransactionPeriods>({
                day: 'invalid-date',
                week: '0000-W00',      // W00 is intentionally invalid (weeks are 1-53)
                month: '0000-00',
                quarter: '0000-Q0',    // Q0 is intentionally invalid (quarters are 1-4)
                year: '0000',
            });
        });

        it('should extract year from partial date string', () => {
            // Should extract year even from malformed dates
            const result = computePeriods('2026-invalid');

            expect(result.year).toBe('2026');
            expect(result.week).toBe('2026-W00');
            expect(result.quarter).toBe('2026-Q0');
        });

        it('should handle empty string with fallback values', () => {
            const result = computePeriods('');

            expect(result).toEqual<TransactionPeriods>({
                day: '0000-00-00',
                week: '0000-W00',
                month: '0000-00',
                quarter: '0000-Q0',
                year: '0000',
            });
        });
    });

    describe('format validation', () => {
        it('should return day in YYYY-MM-DD format', () => {
            const result = computePeriods('2026-07-15');
            expect(result.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should return week in YYYY-Www format', () => {
            const result = computePeriods('2026-07-15');
            expect(result.week).toMatch(/^\d{4}-W\d{2}$/);
        });

        it('should return month in YYYY-MM format', () => {
            const result = computePeriods('2026-07-15');
            expect(result.month).toMatch(/^\d{4}-\d{2}$/);
        });

        it('should return quarter in YYYY-Qn format', () => {
            const result = computePeriods('2026-07-15');
            expect(result.quarter).toMatch(/^\d{4}-Q[1-4]$/);
        });

        it('should return year in YYYY format', () => {
            const result = computePeriods('2026-07-15');
            expect(result.year).toMatch(/^\d{4}$/);
        });
    });
});
