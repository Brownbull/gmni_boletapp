/**
 * Tests for TrendsView/periodNavigationHelpers.ts
 * Story 15-TD-21: Test coverage for TD-16 extracted helpers
 *
 * 4 exported functions:
 * - getPreviousPeriodState: Compute previous period from current
 * - getNextPeriodState: Compute next period (clamped to now)
 * - getCurrentDatePeriod: Get today's period values
 * - isCurrentPeriod: Check if period matches today
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { TimePeriod, CurrentPeriod } from '@features/analytics/views/TrendsView/types';

import {
  getPreviousPeriodState,
  getNextPeriodState,
  getCurrentDatePeriod,
  isCurrentPeriod,
} from '@features/analytics/views/TrendsView/periodNavigationHelpers';

afterEach(() => {
  vi.useRealTimers();
});

// ============================================================================
// getPreviousPeriodState
// ============================================================================

describe('getPreviousPeriodState', () => {
  describe('year', () => {
    it('decrements year by 1', () => {
      const prev: CurrentPeriod = { year: 2026, month: 6, quarter: 2, week: 2 };
      const result = getPreviousPeriodState(prev, 'year');
      expect(result.year).toBe(2025);
    });

    it('preserves other fields', () => {
      const prev: CurrentPeriod = { year: 2026, month: 6, quarter: 2, week: 2 };
      const result = getPreviousPeriodState(prev, 'year');
      expect(result.month).toBe(6);
      expect(result.quarter).toBe(2);
    });
  });

  describe('quarter', () => {
    it.each<[number, number, number]>([
      [2, 2026, 1],   // Q2 → Q1 same year
      [3, 2026, 2],   // Q3 → Q2
      [4, 2026, 3],   // Q4 → Q3
    ])('Q%i → Q%i of year %i', (fromQ, _year, toQ) => {
      const prev: CurrentPeriod = { year: 2026, month: 1, quarter: fromQ, week: 1 };
      const result = getPreviousPeriodState(prev, 'quarter');
      expect(result.quarter).toBe(toQ);
      expect(result.year).toBe(2026);
    });

    it('wraps Q1 to Q4 of previous year', () => {
      const prev: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
      const result = getPreviousPeriodState(prev, 'quarter');
      expect(result.quarter).toBe(4);
      expect(result.year).toBe(2025);
    });
  });

  describe('month', () => {
    it.each<[number, number, number, number]>([
      [3, 2026, 2, 1],   // Mar → Feb, Q1
      [6, 2026, 5, 2],   // Jun → May, Q2
      [12, 2026, 11, 4], // Dec → Nov, Q4
    ])('month %i → month %i (year %i), quarter %i', (fromM, _year, toM, toQ) => {
      const prev: CurrentPeriod = { year: 2026, month: fromM, quarter: Math.ceil(fromM / 3), week: 1 };
      const result = getPreviousPeriodState(prev, 'month');
      expect(result.month).toBe(toM);
      expect(result.quarter).toBe(toQ);
      expect(result.year).toBe(2026);
    });

    it('wraps January to December of previous year', () => {
      const prev: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
      const result = getPreviousPeriodState(prev, 'month');
      expect(result.month).toBe(12);
      expect(result.quarter).toBe(4);
      expect(result.year).toBe(2025);
    });
  });

  describe('week', () => {
    it('decrements week within same month', () => {
      const prev: CurrentPeriod = { year: 2026, month: 3, quarter: 1, week: 3 };
      const result = getPreviousPeriodState(prev, 'week');
      expect(result.week).toBe(2);
      expect(result.month).toBe(3);
    });

    it('wraps week 1 to week 4 of previous month', () => {
      const prev: CurrentPeriod = { year: 2026, month: 3, quarter: 1, week: 1 };
      const result = getPreviousPeriodState(prev, 'week');
      expect(result.week).toBe(4);
      expect(result.month).toBe(2);
      expect(result.quarter).toBe(1); // Math.ceil(2/3) = 1
    });

    it('wraps January week 1 to December of previous year', () => {
      const prev: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
      const result = getPreviousPeriodState(prev, 'week');
      expect(result.week).toBe(4);
      expect(result.month).toBe(12);
      expect(result.year).toBe(2025);
      expect(result.quarter).toBe(4);
    });
  });
});

// ============================================================================
// getNextPeriodState
// ============================================================================

describe('getNextPeriodState', () => {
  // Use a fixed "now" well into the future so most navigations are allowed
  const futureNow = new Date(2027, 5, 15); // June 15, 2027

  describe('year', () => {
    it('increments year by 1', () => {
      const prev: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
      const result = getNextPeriodState(prev, 'year', futureNow);
      expect(result.year).toBe(2027);
    });

    it('clamps at current year (does not go into future)', () => {
      const prev: CurrentPeriod = { year: 2027, month: 1, quarter: 1, week: 1 };
      const result = getNextPeriodState(prev, 'year', futureNow);
      expect(result.year).toBe(2027); // Already at 2027, can't go further
    });
  });

  describe('quarter', () => {
    it.each<[number, number]>([
      [1, 2],
      [2, 3],
      [3, 4],
    ])('Q%i → Q%i', (from, to) => {
      const prev: CurrentPeriod = { year: 2026, month: 1, quarter: from, week: 1 };
      const result = getNextPeriodState(prev, 'quarter', futureNow);
      expect(result.quarter).toBe(to);
    });

    it('wraps Q4 to Q1 of next year', () => {
      const prev: CurrentPeriod = { year: 2026, month: 1, quarter: 4, week: 1 };
      const result = getNextPeriodState(prev, 'quarter', futureNow);
      expect(result.quarter).toBe(1);
      expect(result.year).toBe(2027);
    });

    it('clamps when already at current quarter', () => {
      // futureNow = June 2027 = Q2
      const prev: CurrentPeriod = { year: 2027, month: 6, quarter: 2, week: 1 };
      const result = getNextPeriodState(prev, 'quarter', futureNow);
      expect(result.quarter).toBe(2); // Can't advance past current quarter
    });
  });

  describe('month', () => {
    it.each<[number, number, number]>([
      [1, 2, 1],    // Jan → Feb, Q1
      [3, 4, 2],    // Mar → Apr, Q2
      [11, 12, 4],  // Nov → Dec, Q4
    ])('month %i → month %i, quarter %i', (from, to, toQ) => {
      const prev: CurrentPeriod = { year: 2026, month: from, quarter: Math.ceil(from / 3), week: 1 };
      const result = getNextPeriodState(prev, 'month', futureNow);
      expect(result.month).toBe(to);
      expect(result.quarter).toBe(toQ);
    });

    it('wraps December to January of next year', () => {
      const prev: CurrentPeriod = { year: 2026, month: 12, quarter: 4, week: 1 };
      const result = getNextPeriodState(prev, 'month', futureNow);
      expect(result.month).toBe(1);
      expect(result.quarter).toBe(1);
      expect(result.year).toBe(2027);
    });

    it('clamps when already at current month', () => {
      // futureNow = June 2027
      const prev: CurrentPeriod = { year: 2027, month: 6, quarter: 2, week: 1 };
      const result = getNextPeriodState(prev, 'month', futureNow);
      expect(result.month).toBe(6); // Can't advance past current month
    });
  });

  describe('week', () => {
    it('increments week within same month', () => {
      const prev: CurrentPeriod = { year: 2026, month: 3, quarter: 1, week: 2 };
      const result = getNextPeriodState(prev, 'week', futureNow);
      expect(result.week).toBe(3);
    });

    it('wraps week 4+ to week 1 of next month', () => {
      const prev: CurrentPeriod = { year: 2026, month: 3, quarter: 1, week: 4 };
      const result = getNextPeriodState(prev, 'week', futureNow);
      expect(result.week).toBe(1);
      expect(result.month).toBe(4);
      expect(result.quarter).toBe(2);
    });

    it('wraps December week 4+ to January of next year', () => {
      const prev: CurrentPeriod = { year: 2026, month: 12, quarter: 4, week: 4 };
      const result = getNextPeriodState(prev, 'week', futureNow);
      expect(result.week).toBe(1);
      expect(result.month).toBe(1);
      expect(result.year).toBe(2027);
    });

    it('clamps when at current month boundary', () => {
      // futureNow = June 2027
      const prev: CurrentPeriod = { year: 2027, month: 6, quarter: 2, week: 4 };
      const result = getNextPeriodState(prev, 'week', futureNow);
      expect(result.week).toBe(4); // Can't advance past current month
    });
  });
});

// ============================================================================
// getCurrentDatePeriod
// ============================================================================

describe('getCurrentDatePeriod', () => {
  it('returns correct period for a known date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15)); // March 15, 2026

    const result = getCurrentDatePeriod();
    expect(result.year).toBe(2026);
    expect(result.month).toBe(3);
    expect(result.quarter).toBe(1); // March = Q1
    expect(result.week).toBe(3); // ceil(15/7) = 3
  });

  it('computes week correctly for first day of month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1)); // January 1

    const result = getCurrentDatePeriod();
    expect(result.week).toBe(1); // ceil(1/7) = 1
  });

  it('computes week correctly for day 7', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 7)); // January 7

    const result = getCurrentDatePeriod();
    expect(result.week).toBe(1); // ceil(7/7) = 1
  });

  it('computes week correctly for day 8', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 8)); // January 8

    const result = getCurrentDatePeriod();
    expect(result.week).toBe(2); // ceil(8/7) = 2
  });

  it('computes quarter boundaries correctly', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date(2026, 0, 1)); // January = Q1
    expect(getCurrentDatePeriod().quarter).toBe(1);

    vi.setSystemTime(new Date(2026, 3, 1)); // April = Q2
    expect(getCurrentDatePeriod().quarter).toBe(2);

    vi.setSystemTime(new Date(2026, 6, 1)); // July = Q3
    expect(getCurrentDatePeriod().quarter).toBe(3);

    vi.setSystemTime(new Date(2026, 9, 1)); // October = Q4
    expect(getCurrentDatePeriod().quarter).toBe(4);
  });
});

// ============================================================================
// isCurrentPeriod
// ============================================================================

describe('isCurrentPeriod', () => {
  // Fix time to March 15, 2026 for deterministic tests
  const fixedDate = new Date(2026, 2, 15); // March 15, 2026

  function setup() {
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
  }

  describe('year', () => {
    it('returns true for current year', () => {
      setup();
      const period: CurrentPeriod = { year: 2026, month: 1, quarter: 1, week: 1 };
      expect(isCurrentPeriod('year', period)).toBe(true);
    });

    it('returns false for different year', () => {
      setup();
      const period: CurrentPeriod = { year: 2025, month: 3, quarter: 1, week: 3 };
      expect(isCurrentPeriod('year', period)).toBe(false);
    });
  });

  describe('quarter', () => {
    it('returns true for current quarter', () => {
      setup();
      // March 2026 = Q1
      const period: CurrentPeriod = { year: 2026, month: 3, quarter: 1, week: 1 };
      expect(isCurrentPeriod('quarter', period)).toBe(true);
    });

    it('returns false for different quarter', () => {
      setup();
      const period: CurrentPeriod = { year: 2026, month: 3, quarter: 2, week: 1 };
      expect(isCurrentPeriod('quarter', period)).toBe(false);
    });

    it('returns false for different year same quarter', () => {
      setup();
      const period: CurrentPeriod = { year: 2025, month: 3, quarter: 1, week: 1 };
      expect(isCurrentPeriod('quarter', period)).toBe(false);
    });
  });

  describe('month', () => {
    it('returns true for current month', () => {
      setup();
      const period: CurrentPeriod = { year: 2026, month: 3, quarter: 1, week: 1 };
      expect(isCurrentPeriod('month', period)).toBe(true);
    });

    it('returns false for different month', () => {
      setup();
      const period: CurrentPeriod = { year: 2026, month: 2, quarter: 1, week: 1 };
      expect(isCurrentPeriod('month', period)).toBe(false);
    });
  });

  describe('week', () => {
    it('returns true for current week', () => {
      setup();
      // March 15 → week = ceil(15/7) = 3
      const period: CurrentPeriod = { year: 2026, month: 3, quarter: 1, week: 3 };
      expect(isCurrentPeriod('week', period)).toBe(true);
    });

    it('returns false for different week in same month', () => {
      setup();
      const period: CurrentPeriod = { year: 2026, month: 3, quarter: 1, week: 1 };
      expect(isCurrentPeriod('week', period)).toBe(false);
    });
  });

  describe('default', () => {
    it('returns true for unknown period type', () => {
      setup();
      const period: CurrentPeriod = { year: 1999, month: 1, quarter: 1, week: 1 };
      expect(isCurrentPeriod('unknown' as TimePeriod, period)).toBe(true);
    });
  });
});
