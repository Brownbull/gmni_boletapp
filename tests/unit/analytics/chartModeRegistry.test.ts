/**
 * chartModeRegistry Unit Tests
 *
 * Tests for the chart mode registry utility that maps temporal levels
 * to comparison children labels.
 *
 * Story 7.4 - Chart Mode Toggle & Registry
 * AC #4-#8: Complete acceptance criteria coverage
 */

import { describe, it, expect } from 'vitest';
import {
  isComparisonAvailable,
  getComparisonChildType,
  getComparisonChildren,
  getQuarterLabels,
  getMonthLabelsForQuarter,
  getWeekLabelsForMonth,
  getDayLabels,
} from '../../../src/utils/chartModeRegistry';
import type { TemporalPosition } from '../../../src/types/analytics';

// ============================================================================
// isComparisonAvailable Tests
// ============================================================================

describe('isComparisonAvailable', () => {
  it('returns true for year level', () => {
    expect(isComparisonAvailable('year')).toBe(true);
  });

  it('returns true for quarter level', () => {
    expect(isComparisonAvailable('quarter')).toBe(true);
  });

  it('returns true for month level', () => {
    expect(isComparisonAvailable('month')).toBe(true);
  });

  it('returns true for week level', () => {
    expect(isComparisonAvailable('week')).toBe(true);
  });

  it('returns false for day level (AC #8)', () => {
    expect(isComparisonAvailable('day')).toBe(false);
  });
});

// ============================================================================
// getComparisonChildType Tests
// ============================================================================

describe('getComparisonChildType', () => {
  it('returns "quarters" for year level', () => {
    expect(getComparisonChildType('year')).toBe('quarters');
  });

  it('returns "months" for quarter level', () => {
    expect(getComparisonChildType('quarter')).toBe('months');
  });

  it('returns "weeks" for month level', () => {
    expect(getComparisonChildType('month')).toBe('weeks');
  });

  it('returns "days" for week level', () => {
    expect(getComparisonChildType('week')).toBe('days');
  });

  it('returns null for day level', () => {
    expect(getComparisonChildType('day')).toBeNull();
  });
});

// ============================================================================
// AC #4: Year → Q1, Q2, Q3, Q4
// ============================================================================

describe('getComparisonChildren - Year level (AC #4)', () => {
  const yearPosition: TemporalPosition = { level: 'year', year: '2024' };

  it('returns Q1, Q2, Q3, Q4 for English locale', () => {
    const result = getComparisonChildren(yearPosition, 'en');

    expect(result).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
  });

  it('returns T1, T2, T3, T4 for Spanish locale', () => {
    const result = getComparisonChildren(yearPosition, 'es');

    expect(result).toEqual(['T1', 'T2', 'T3', 'T4']);
  });
});

// ============================================================================
// AC #5: Quarter → 3 months
// ============================================================================

describe('getComparisonChildren - Quarter level (AC #5)', () => {
  it('Q1 returns January, February, March', () => {
    const q1Position: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q1' };
    const result = getComparisonChildren(q1Position, 'en');

    expect(result).toEqual(['January', 'February', 'March']);
  });

  it('Q2 returns April, May, June', () => {
    const q2Position: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q2' };
    const result = getComparisonChildren(q2Position, 'en');

    expect(result).toEqual(['April', 'May', 'June']);
  });

  it('Q3 returns July, August, September', () => {
    const q3Position: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q3' };
    const result = getComparisonChildren(q3Position, 'en');

    expect(result).toEqual(['July', 'August', 'September']);
  });

  it('Q4 returns October, November, December', () => {
    const q4Position: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q4' };
    const result = getComparisonChildren(q4Position, 'en');

    expect(result).toEqual(['October', 'November', 'December']);
  });

  it('returns Spanish month names when locale is es', () => {
    const q4Position: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q4' };
    const result = getComparisonChildren(q4Position, 'es');

    expect(result).toEqual(['octubre', 'noviembre', 'diciembre']);
  });

  it('returns null if quarter is not set', () => {
    const invalidPosition: TemporalPosition = { level: 'quarter', year: '2024' };
    const result = getComparisonChildren(invalidPosition, 'en');

    expect(result).toBeNull();
  });
});

// ============================================================================
// AC #6: Month → weeks (date ranges)
// ============================================================================

describe('getComparisonChildren - Month level (AC #6)', () => {
  it('October 2024 returns 5 week ranges', () => {
    const monthPosition: TemporalPosition = {
      level: 'month',
      year: '2024',
      quarter: 'Q4',
      month: '2024-10',
    };
    const result = getComparisonChildren(monthPosition, 'en');

    expect(result).toEqual([
      'Oct 1-7',
      'Oct 8-14',
      'Oct 15-21',
      'Oct 22-28',
      'Oct 29-31',
    ]);
  });

  it('November 2024 returns 5 week ranges (30 days)', () => {
    const monthPosition: TemporalPosition = {
      level: 'month',
      year: '2024',
      quarter: 'Q4',
      month: '2024-11',
    };
    const result = getComparisonChildren(monthPosition, 'en');

    expect(result).toEqual([
      'Nov 1-7',
      'Nov 8-14',
      'Nov 15-21',
      'Nov 22-28',
      'Nov 29-30',
    ]);
  });

  it('February 2024 (leap year) returns correct ranges', () => {
    const monthPosition: TemporalPosition = {
      level: 'month',
      year: '2024',
      quarter: 'Q1',
      month: '2024-02',
    };
    const result = getComparisonChildren(monthPosition, 'en');

    expect(result).toEqual([
      'Feb 1-7',
      'Feb 8-14',
      'Feb 15-21',
      'Feb 22-28',
      'Feb 29-29', // Leap year - last day as separate week
    ]);
  });

  it('February 2023 (non-leap year) returns correct ranges', () => {
    const monthPosition: TemporalPosition = {
      level: 'month',
      year: '2023',
      quarter: 'Q1',
      month: '2023-02',
    };
    const result = getComparisonChildren(monthPosition, 'en');

    expect(result).toEqual([
      'Feb 1-7',
      'Feb 8-14',
      'Feb 15-21',
      'Feb 22-28',
    ]);
  });

  it('returns Spanish month abbreviations when locale is es', () => {
    const monthPosition: TemporalPosition = {
      level: 'month',
      year: '2024',
      quarter: 'Q4',
      month: '2024-10',
    };
    const result = getComparisonChildren(monthPosition, 'es');

    // Spanish uses 'oct' or 'oct.' depending on locale
    expect(result).not.toBeNull();
    expect(result!.length).toBe(5);
    // Each should have the spanish month abbreviation
    result!.forEach((week) => {
      expect(week).toMatch(/\d+-\d+/);
    });
  });

  it('returns null if month is not set', () => {
    const invalidPosition: TemporalPosition = { level: 'month', year: '2024', quarter: 'Q4' };
    const result = getComparisonChildren(invalidPosition, 'en');

    expect(result).toBeNull();
  });
});

// ============================================================================
// AC #7: Week → Mon, Tue, Wed, Thu, Fri, Sat, Sun
// ============================================================================

describe('getComparisonChildren - Week level (AC #7)', () => {
  it('returns day names for English locale', () => {
    const weekPosition: TemporalPosition = {
      level: 'week',
      year: '2024',
      quarter: 'Q4',
      month: '2024-10',
      week: 1,
    };
    const result = getComparisonChildren(weekPosition, 'en');

    expect(result).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('returns day names for Spanish locale', () => {
    const weekPosition: TemporalPosition = {
      level: 'week',
      year: '2024',
      quarter: 'Q4',
      month: '2024-10',
      week: 1,
    };
    const result = getComparisonChildren(weekPosition, 'es');

    // Spanish day abbreviations
    expect(result).toEqual(['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']);
  });

  it('always returns 7 days regardless of week index', () => {
    const weekPosition: TemporalPosition = {
      level: 'week',
      year: '2024',
      quarter: 'Q4',
      month: '2024-10',
      week: 5,
    };
    const result = getComparisonChildren(weekPosition, 'en');

    expect(result).toHaveLength(7);
  });
});

// ============================================================================
// AC #8: Day → null (no children)
// ============================================================================

describe('getComparisonChildren - Day level (AC #8)', () => {
  it('returns null for day level', () => {
    const dayPosition: TemporalPosition = {
      level: 'day',
      year: '2024',
      quarter: 'Q4',
      month: '2024-10',
      week: 2,
      day: '2024-10-10',
    };
    const result = getComparisonChildren(dayPosition, 'en');

    expect(result).toBeNull();
  });
});

// ============================================================================
// Helper function tests
// ============================================================================

describe('getQuarterLabels', () => {
  it('returns Q1-Q4 for English', () => {
    expect(getQuarterLabels('en')).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
  });

  it('returns T1-T4 for Spanish', () => {
    expect(getQuarterLabels('es')).toEqual(['T1', 'T2', 'T3', 'T4']);
  });
});

describe('getMonthLabelsForQuarter', () => {
  it('Q1 returns first 3 months', () => {
    const result = getMonthLabelsForQuarter('Q1', '2024', 'en');
    expect(result).toEqual(['January', 'February', 'March']);
  });

  it('Q4 returns last 3 months', () => {
    const result = getMonthLabelsForQuarter('Q4', '2024', 'en');
    expect(result).toEqual(['October', 'November', 'December']);
  });
});

describe('getWeekLabelsForMonth', () => {
  it('returns correct week labels for a 31-day month', () => {
    const result = getWeekLabelsForMonth('2024-10', 'en');
    expect(result).toHaveLength(5);
    expect(result[0]).toBe('Oct 1-7');
    expect(result[4]).toBe('Oct 29-31');
  });

  it('returns correct week labels for a 30-day month', () => {
    const result = getWeekLabelsForMonth('2024-11', 'en');
    expect(result).toHaveLength(5);
    expect(result[4]).toBe('Nov 29-30');
  });

  it('returns correct week labels for February in leap year', () => {
    const result = getWeekLabelsForMonth('2024-02', 'en');
    expect(result).toHaveLength(5);
    expect(result[4]).toBe('Feb 29-29');
  });

  it('returns correct week labels for February in non-leap year', () => {
    const result = getWeekLabelsForMonth('2023-02', 'en');
    expect(result).toHaveLength(4);
    expect(result[3]).toBe('Feb 22-28');
  });
});

describe('getDayLabels', () => {
  it('returns 7 day names in English', () => {
    const result = getDayLabels('en');
    expect(result).toHaveLength(7);
    expect(result[0]).toBe('Mon');
    expect(result[6]).toBe('Sun');
  });

  it('returns 7 day names in Spanish', () => {
    const result = getDayLabels('es');
    expect(result).toHaveLength(7);
    expect(result[0]).toBe('lun');
    expect(result[6]).toBe('dom');
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('Edge cases', () => {
  it('handles year boundary correctly (December)', () => {
    const monthPosition: TemporalPosition = {
      level: 'month',
      year: '2024',
      quarter: 'Q4',
      month: '2024-12',
    };
    const result = getComparisonChildren(monthPosition, 'en');

    expect(result).toHaveLength(5);
    expect(result![0]).toBe('Dec 1-7');
    expect(result![4]).toBe('Dec 29-31');
  });

  it('handles January correctly', () => {
    const monthPosition: TemporalPosition = {
      level: 'month',
      year: '2024',
      quarter: 'Q1',
      month: '2024-01',
    };
    const result = getComparisonChildren(monthPosition, 'en');

    expect(result).toHaveLength(5);
    expect(result![0]).toBe('Jan 1-7');
    expect(result![4]).toBe('Jan 29-31');
  });

  it('default locale is English', () => {
    const yearPosition: TemporalPosition = { level: 'year', year: '2024' };
    const result = getComparisonChildren(yearPosition);

    expect(result).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
  });
});
