/**
 * Tests for Period Comparison Utilities
 *
 * Story 14.13.2: Period-over-period comparison calculations for Tendencia slide
 */

import { describe, it, expect } from 'vitest';
import {
    getPreviousPeriod,
    calculateChange,
    isDateInPeriod,
    getISOWeekNumber,
    getWeeksInYear,
    getWeeksInMonth,
    getWeekOfMonth,
    calculatePeriodComparison,
    type PeriodIdentifier,
    type TimePeriod,
} from '../../../src/utils/periodComparison';

describe('periodComparison utilities', () => {
    // ========================================================================
    // getPreviousPeriod tests
    // ========================================================================
    describe('getPreviousPeriod', () => {
        describe('week period (week-of-month)', () => {
            it('should return previous week in same month', () => {
                const current: PeriodIdentifier = { year: 2026, month: 1, week: 3 };
                const result = getPreviousPeriod(current, 'week');
                expect(result).toEqual({ year: 2026, month: 1, week: 2 });
            });

            it('should handle month boundary (week 1 -> last week of previous month)', () => {
                // Week 1 of Jan 2026 -> last week of Dec 2025
                const current: PeriodIdentifier = { year: 2026, month: 1, week: 1 };
                const result = getPreviousPeriod(current, 'week');
                // December 2025 has 31 days -> ceil(31/7) = 5 weeks
                expect(result).toEqual({ year: 2025, month: 12, week: 5 });
            });

            it('should handle month with 4 weeks', () => {
                // Week 1 of March 2026 -> last week of Feb 2026
                // Feb 2026 has 28 days -> ceil(28/7) = 4 weeks
                const current: PeriodIdentifier = { year: 2026, month: 3, week: 1 };
                const result = getPreviousPeriod(current, 'week');
                expect(result).toEqual({ year: 2026, month: 2, week: 4 });
            });

            it('should throw error if week or month not provided', () => {
                const current: PeriodIdentifier = { year: 2026 };
                expect(() => getPreviousPeriod(current, 'week'))
                    .toThrow('Week and month numbers required');
            });
        });

        describe('month period', () => {
            it('should return previous month in same year', () => {
                const current: PeriodIdentifier = { year: 2026, month: 6 };
                const result = getPreviousPeriod(current, 'month');
                expect(result).toEqual({ year: 2026, month: 5 });
            });

            it('should handle year boundary (January -> December)', () => {
                const current: PeriodIdentifier = { year: 2026, month: 1 };
                const result = getPreviousPeriod(current, 'month');
                expect(result).toEqual({ year: 2025, month: 12 });
            });

            it('should throw error if month not provided', () => {
                const current: PeriodIdentifier = { year: 2026 };
                expect(() => getPreviousPeriod(current, 'month'))
                    .toThrow('Month number required');
            });
        });

        describe('quarter period', () => {
            it('should return previous quarter in same year', () => {
                const current: PeriodIdentifier = { year: 2026, quarter: 3 };
                const result = getPreviousPeriod(current, 'quarter');
                expect(result).toEqual({ year: 2026, quarter: 2 });
            });

            it('should handle year boundary (Q1 -> Q4)', () => {
                const current: PeriodIdentifier = { year: 2026, quarter: 1 };
                const result = getPreviousPeriod(current, 'quarter');
                expect(result).toEqual({ year: 2025, quarter: 4 });
            });

            it('should throw error if quarter not provided', () => {
                const current: PeriodIdentifier = { year: 2026 };
                expect(() => getPreviousPeriod(current, 'quarter'))
                    .toThrow('Quarter number required');
            });
        });

        describe('year period', () => {
            it('should return previous year', () => {
                const current: PeriodIdentifier = { year: 2026 };
                const result = getPreviousPeriod(current, 'year');
                expect(result).toEqual({ year: 2025 });
            });
        });
    });

    // ========================================================================
    // calculateChange tests
    // ========================================================================
    describe('calculateChange', () => {
        it('should return "new" direction when previous is 0 and current > 0', () => {
            const result = calculateChange(100, 0);
            expect(result.direction).toBe('new');
            expect(result.percent).toBe(0);
        });

        it('should return "same" when both values are 0', () => {
            const result = calculateChange(0, 0);
            expect(result.direction).toBe('same');
            expect(result.percent).toBe(0);
        });

        it('should return "same" for very small changes (< 0.5%)', () => {
            const result = calculateChange(100.4, 100);
            expect(result.direction).toBe('same');
            expect(result.percent).toBe(0);
        });

        it('should return "up" for positive change', () => {
            const result = calculateChange(120, 100);
            expect(result.direction).toBe('up');
            expect(result.percent).toBe(20);
        });

        it('should return "down" for negative change', () => {
            const result = calculateChange(80, 100);
            expect(result.direction).toBe('down');
            expect(result.percent).toBe(-20);
        });

        it('should round percentage to nearest integer', () => {
            const result = calculateChange(115.7, 100);
            expect(result.percent).toBe(16); // 15.7% rounds to 16%
        });

        it('should handle large increases', () => {
            const result = calculateChange(500, 100);
            expect(result.direction).toBe('up');
            expect(result.percent).toBe(400);
        });

        it('should handle large decreases', () => {
            const result = calculateChange(10, 100);
            expect(result.direction).toBe('down');
            expect(result.percent).toBe(-90);
        });
    });

    // ========================================================================
    // getISOWeekNumber tests
    // ========================================================================
    describe('getISOWeekNumber', () => {
        it('should return week 1 for January 4th (always in week 1)', () => {
            const date = new Date(2026, 0, 4); // Jan 4, 2026
            expect(getISOWeekNumber(date)).toBe(1);
        });

        it('should handle year boundary correctly', () => {
            // December 31, 2025 is in week 1 of 2026 (Wednesday)
            const dec31_2025 = new Date(2025, 11, 31);
            // Dec 31, 2025 is a Wednesday in week 1 of 2026
            expect(getISOWeekNumber(dec31_2025)).toBe(1);
        });

        it('should return correct week in middle of year', () => {
            // July 15, 2026 is a Wednesday
            const date = new Date(2026, 6, 15);
            expect(getISOWeekNumber(date)).toBe(29);
        });
    });

    // ========================================================================
    // getWeeksInYear tests
    // ========================================================================
    describe('getWeeksInYear', () => {
        it('should return 52 for normal years', () => {
            expect(getWeeksInYear(2025)).toBe(52);
            expect(getWeeksInYear(2026)).toBe(53); // 2026 actually has 53 weeks
        });

        it('should return 53 for long years', () => {
            // Years with 53 weeks: years starting on Thursday or leap years starting on Wednesday
            expect(getWeeksInYear(2020)).toBe(53);
        });
    });

    // ========================================================================
    // getWeeksInMonth tests
    // ========================================================================
    describe('getWeeksInMonth', () => {
        it('should return 5 for 31-day months', () => {
            // January has 31 days -> ceil(31/7) = 5
            expect(getWeeksInMonth(2026, 1)).toBe(5);
            // March has 31 days
            expect(getWeeksInMonth(2026, 3)).toBe(5);
        });

        it('should return 5 for 30-day months', () => {
            // April has 30 days -> ceil(30/7) = 5
            expect(getWeeksInMonth(2026, 4)).toBe(5);
        });

        it('should return 4 for February (non-leap year)', () => {
            // Feb 2026 has 28 days -> ceil(28/7) = 4
            expect(getWeeksInMonth(2026, 2)).toBe(4);
        });

        it('should return 5 for February (leap year)', () => {
            // Feb 2024 has 29 days -> ceil(29/7) = 5
            expect(getWeeksInMonth(2024, 2)).toBe(5);
        });
    });

    // ========================================================================
    // getWeekOfMonth tests
    // ========================================================================
    describe('getWeekOfMonth', () => {
        it('should return 1 for days 1-7', () => {
            expect(getWeekOfMonth(new Date(2026, 0, 1))).toBe(1);
            expect(getWeekOfMonth(new Date(2026, 0, 7))).toBe(1);
        });

        it('should return 2 for days 8-14', () => {
            expect(getWeekOfMonth(new Date(2026, 0, 8))).toBe(2);
            expect(getWeekOfMonth(new Date(2026, 0, 14))).toBe(2);
        });

        it('should return 5 for days 29-31', () => {
            expect(getWeekOfMonth(new Date(2026, 0, 29))).toBe(5);
            expect(getWeekOfMonth(new Date(2026, 0, 31))).toBe(5);
        });
    });

    // ========================================================================
    // isDateInPeriod tests
    // ========================================================================
    describe('isDateInPeriod', () => {
        describe('year period', () => {
            it('should match dates in the same year', () => {
                const date = new Date(2026, 5, 15);
                expect(isDateInPeriod(date, { year: 2026 }, 'year')).toBe(true);
                expect(isDateInPeriod(date, { year: 2025 }, 'year')).toBe(false);
            });
        });

        describe('quarter period', () => {
            it('should match Q1 dates (Jan-Mar)', () => {
                expect(isDateInPeriod(new Date(2026, 0, 15), { year: 2026, quarter: 1 }, 'quarter')).toBe(true);
                expect(isDateInPeriod(new Date(2026, 1, 15), { year: 2026, quarter: 1 }, 'quarter')).toBe(true);
                expect(isDateInPeriod(new Date(2026, 2, 15), { year: 2026, quarter: 1 }, 'quarter')).toBe(true);
            });

            it('should not match Q1 for Q2 dates', () => {
                expect(isDateInPeriod(new Date(2026, 3, 15), { year: 2026, quarter: 1 }, 'quarter')).toBe(false);
            });

            it('should match Q4 dates (Oct-Dec)', () => {
                expect(isDateInPeriod(new Date(2026, 9, 15), { year: 2026, quarter: 4 }, 'quarter')).toBe(true);
                expect(isDateInPeriod(new Date(2026, 10, 15), { year: 2026, quarter: 4 }, 'quarter')).toBe(true);
                expect(isDateInPeriod(new Date(2026, 11, 15), { year: 2026, quarter: 4 }, 'quarter')).toBe(true);
            });
        });

        describe('month period', () => {
            it('should match dates in the same month', () => {
                const date = new Date(2026, 5, 15); // June 15
                expect(isDateInPeriod(date, { year: 2026, month: 6 }, 'month')).toBe(true);
                expect(isDateInPeriod(date, { year: 2026, month: 5 }, 'month')).toBe(false);
            });
        });

        describe('week period (week-of-month)', () => {
            it('should match dates in the same week of month', () => {
                // Week 2 of Jan 2026 = days 8-14
                const day8 = new Date(2026, 0, 8);
                const day14 = new Date(2026, 0, 14);
                expect(isDateInPeriod(day8, { year: 2026, month: 1, week: 2 }, 'week')).toBe(true);
                expect(isDateInPeriod(day14, { year: 2026, month: 1, week: 2 }, 'week')).toBe(true);
            });

            it('should not match dates in different weeks of month', () => {
                // Day 15 is in week 3 (days 15-21)
                const date = new Date(2026, 0, 15);
                expect(isDateInPeriod(date, { year: 2026, month: 1, week: 2 }, 'week')).toBe(false);
                expect(isDateInPeriod(date, { year: 2026, month: 1, week: 3 }, 'week')).toBe(true);
            });

            it('should not match dates in different months', () => {
                // Same day of month but different month
                const janDay8 = new Date(2026, 0, 8);
                const febDay8 = new Date(2026, 1, 8);
                expect(isDateInPeriod(janDay8, { year: 2026, month: 1, week: 2 }, 'week')).toBe(true);
                expect(isDateInPeriod(febDay8, { year: 2026, month: 1, week: 2 }, 'week')).toBe(false);
            });

            it('should handle week 5 (days 29-31)', () => {
                const day29 = new Date(2026, 0, 29);
                const day31 = new Date(2026, 0, 31);
                expect(isDateInPeriod(day29, { year: 2026, month: 1, week: 5 }, 'week')).toBe(true);
                expect(isDateInPeriod(day31, { year: 2026, month: 1, week: 5 }, 'week')).toBe(true);
            });
        });
    });

    // ========================================================================
    // calculatePeriodComparison tests
    // ========================================================================
    describe('calculatePeriodComparison', () => {
        // Helper to create mock transactions
        const createTransaction = (
            date: Date,
            category: string,
            total: number
        ) => ({ date, category, total });

        it('should calculate trend data with period comparison', () => {
            const transactions = [
                // Current month (January 2026)
                createTransaction(new Date(2026, 0, 15), 'Supermercado', 100),
                createTransaction(new Date(2026, 0, 20), 'Supermercado', 150),
                createTransaction(new Date(2026, 0, 10), 'Restaurante', 50),
                // Previous month (December 2025)
                createTransaction(new Date(2025, 11, 15), 'Supermercado', 200),
                createTransaction(new Date(2025, 11, 20), 'Restaurante', 80),
            ];

            const result = calculatePeriodComparison({
                transactions,
                currentPeriod: { year: 2026, month: 1 },
                timePeriod: 'month',
                getDateFn: tx => tx.date,
                getCategoryFn: tx => tx.category,
                getValueFn: tx => tx.total,
                getColorFn: () => '#000',
            });

            // Should have 2 categories
            expect(result.trendData).toHaveLength(2);

            // Sorted by value descending
            expect(result.trendData[0].name).toBe('Supermercado');
            expect(result.trendData[0].currentValue).toBe(250);
            expect(result.trendData[0].previousValue).toBe(200);
            expect(result.trendData[0].changeDirection).toBe('up');
            expect(result.trendData[0].changePercent).toBe(25);

            expect(result.trendData[1].name).toBe('Restaurante');
            expect(result.trendData[1].currentValue).toBe(50);
            expect(result.trendData[1].previousValue).toBe(80);
            expect(result.trendData[1].changeDirection).toBe('down');
            expect(result.trendData[1].changePercent).toBe(-37); // (50-80)/80 = -37.5% rounds to -37

            // Totals
            expect(result.currentTotal).toBe(300);
            expect(result.previousTotal).toBe(280);
        });

        it('should mark new categories correctly', () => {
            const transactions = [
                // Current month only
                createTransaction(new Date(2026, 0, 15), 'Farmacia', 75),
                // Previous month
                createTransaction(new Date(2025, 11, 15), 'Supermercado', 200),
            ];

            const result = calculatePeriodComparison({
                transactions,
                currentPeriod: { year: 2026, month: 1 },
                timePeriod: 'month',
                getDateFn: tx => tx.date,
                getCategoryFn: tx => tx.category,
                getValueFn: tx => tx.total,
                getColorFn: () => '#000',
            });

            expect(result.trendData).toHaveLength(1);
            expect(result.trendData[0].name).toBe('Farmacia');
            expect(result.trendData[0].changeDirection).toBe('new');
            expect(result.trendData[0].changePercent).toBeNull();
        });

        it('should not include categories that only exist in previous period', () => {
            const transactions = [
                // Current month
                createTransaction(new Date(2026, 0, 15), 'Supermercado', 100),
                // Previous month only
                createTransaction(new Date(2025, 11, 15), 'Cine', 50),
            ];

            const result = calculatePeriodComparison({
                transactions,
                currentPeriod: { year: 2026, month: 1 },
                timePeriod: 'month',
                getDateFn: tx => tx.date,
                getCategoryFn: tx => tx.category,
                getValueFn: tx => tx.total,
                getColorFn: () => '#000',
            });

            expect(result.trendData).toHaveLength(1);
            expect(result.trendData[0].name).toBe('Supermercado');
            // Cine should not appear
            expect(result.trendData.find(t => t.name === 'Cine')).toBeUndefined();
        });

        it('should count transactions correctly', () => {
            const transactions = [
                createTransaction(new Date(2026, 0, 5), 'Supermercado', 50),
                createTransaction(new Date(2026, 0, 10), 'Supermercado', 75),
                createTransaction(new Date(2026, 0, 15), 'Supermercado', 100),
            ];

            const result = calculatePeriodComparison({
                transactions,
                currentPeriod: { year: 2026, month: 1 },
                timePeriod: 'month',
                getDateFn: tx => tx.date,
                getCategoryFn: tx => tx.category,
                getValueFn: tx => tx.total,
                getColorFn: () => '#000',
            });

            expect(result.trendData[0].count).toBe(3);
        });

        it('should work with quarter period', () => {
            const transactions = [
                // Q1 2026
                createTransaction(new Date(2026, 1, 15), 'Supermercado', 100),
                // Q4 2025
                createTransaction(new Date(2025, 10, 15), 'Supermercado', 80),
            ];

            const result = calculatePeriodComparison({
                transactions,
                currentPeriod: { year: 2026, quarter: 1 },
                timePeriod: 'quarter',
                getDateFn: tx => tx.date,
                getCategoryFn: tx => tx.category,
                getValueFn: tx => tx.total,
                getColorFn: () => '#000',
            });

            expect(result.previousPeriod).toEqual({ year: 2025, quarter: 4 });
            expect(result.trendData[0].currentValue).toBe(100);
            expect(result.trendData[0].previousValue).toBe(80);
        });

        it('should work with year period', () => {
            const transactions = [
                // 2026
                createTransaction(new Date(2026, 5, 15), 'Supermercado', 1000),
                // 2025
                createTransaction(new Date(2025, 5, 15), 'Supermercado', 1200),
            ];

            const result = calculatePeriodComparison({
                transactions,
                currentPeriod: { year: 2026 },
                timePeriod: 'year',
                getDateFn: tx => tx.date,
                getCategoryFn: tx => tx.category,
                getValueFn: tx => tx.total,
                getColorFn: () => '#000',
            });

            expect(result.previousPeriod).toEqual({ year: 2025 });
            expect(result.trendData[0].changeDirection).toBe('down');
        });

        it('should handle empty transactions', () => {
            const result = calculatePeriodComparison({
                transactions: [],
                currentPeriod: { year: 2026, month: 1 },
                timePeriod: 'month',
                getDateFn: tx => tx.date,
                getCategoryFn: tx => tx.category,
                getValueFn: tx => tx.total,
                getColorFn: () => '#000',
            });

            expect(result.trendData).toHaveLength(0);
            expect(result.currentTotal).toBe(0);
            expect(result.previousTotal).toBe(0);
        });
    });
});
