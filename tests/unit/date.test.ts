/**
 * Date Utilities Unit Tests
 *
 * Tests for quarter and week calculation utilities.
 * Story 7.6 - Quarter & Week Date Utilities
 * AC #1-#10: Complete acceptance criteria coverage
 *
 * @see docs/sprint-artifacts/epic7/story-7.6-quarter-week-date-utilities.md
 */

import { describe, it, expect } from 'vitest';
import {
  getQuartersInYear,
  getMonthsInQuarter,
  getQuarterFromMonth,
  getWeeksInMonth,
  formatWeekLabel,
  formatDate,
} from '../../src/utils/date';
import type { Quarter, WeekRange } from '../../src/utils/date';

// ============================================================================
// AC #1: getQuartersInYear returns 4 quarter objects
// ============================================================================

describe('getQuartersInYear (AC #1)', () => {
  it('returns array of 4 quarters', () => {
    const result = getQuartersInYear(2024);

    expect(result).toHaveLength(4);
  });

  it('returns quarters with correct labels', () => {
    const result = getQuartersInYear(2024);

    expect(result[0].label).toBe('Q1');
    expect(result[1].label).toBe('Q2');
    expect(result[2].label).toBe('Q3');
    expect(result[3].label).toBe('Q4');
  });

  it('Q1 contains January, February, March', () => {
    const result = getQuartersInYear(2024);

    expect(result[0].months).toEqual(['2024-01', '2024-02', '2024-03']);
  });

  it('Q2 contains April, May, June', () => {
    const result = getQuartersInYear(2024);

    expect(result[1].months).toEqual(['2024-04', '2024-05', '2024-06']);
  });

  it('Q3 contains July, August, September', () => {
    const result = getQuartersInYear(2024);

    expect(result[2].months).toEqual(['2024-07', '2024-08', '2024-09']);
  });

  it('Q4 contains October, November, December', () => {
    const result = getQuartersInYear(2024);

    expect(result[3].months).toEqual(['2024-10', '2024-11', '2024-12']);
  });

  it('uses correct year in month strings (2025)', () => {
    const result = getQuartersInYear(2025);

    expect(result[0].months).toEqual(['2025-01', '2025-02', '2025-03']);
    expect(result[3].months).toEqual(['2025-10', '2025-11', '2025-12']);
  });

  it('handles year 2020 correctly', () => {
    const result = getQuartersInYear(2020);

    expect(result[0].months[0]).toBe('2020-01');
    expect(result[3].months[2]).toBe('2020-12');
  });
});

// ============================================================================
// AC #5: getMonthsInQuarter returns correct months
// ============================================================================

describe('getMonthsInQuarter (AC #5)', () => {
  it('Q1 returns January, February, March', () => {
    const result = getMonthsInQuarter(2024, 'Q1');

    expect(result).toEqual(['2024-01', '2024-02', '2024-03']);
  });

  it('Q2 returns April, May, June', () => {
    const result = getMonthsInQuarter(2024, 'Q2');

    expect(result).toEqual(['2024-04', '2024-05', '2024-06']);
  });

  it('Q3 returns July, August, September', () => {
    const result = getMonthsInQuarter(2024, 'Q3');

    expect(result).toEqual(['2024-07', '2024-08', '2024-09']);
  });

  it('Q4 returns October, November, December', () => {
    const result = getMonthsInQuarter(2024, 'Q4');

    expect(result).toEqual(['2024-10', '2024-11', '2024-12']);
  });

  it('handles lowercase quarter input', () => {
    const result = getMonthsInQuarter(2024, 'q4');

    expect(result).toEqual(['2024-10', '2024-11', '2024-12']);
  });

  it('uses correct year for different years', () => {
    const result2023 = getMonthsInQuarter(2023, 'Q4');
    const result2025 = getMonthsInQuarter(2025, 'Q4');

    expect(result2023).toEqual(['2023-10', '2023-11', '2023-12']);
    expect(result2025).toEqual(['2025-10', '2025-11', '2025-12']);
  });

  it('defaults to Q1 for invalid quarter', () => {
    const result = getMonthsInQuarter(2024, 'Q5');

    expect(result).toEqual(['2024-01', '2024-02', '2024-03']);
  });
});

// ============================================================================
// AC #6: getQuarterFromMonth returns correct quarter
// ============================================================================

describe('getQuarterFromMonth (AC #6)', () => {
  it('returns Q1 for January', () => {
    expect(getQuarterFromMonth('2024-01')).toBe('Q1');
  });

  it('returns Q1 for February', () => {
    expect(getQuarterFromMonth('2024-02')).toBe('Q1');
  });

  it('returns Q1 for March', () => {
    expect(getQuarterFromMonth('2024-03')).toBe('Q1');
  });

  it('returns Q2 for April', () => {
    expect(getQuarterFromMonth('2024-04')).toBe('Q2');
  });

  it('returns Q2 for May', () => {
    expect(getQuarterFromMonth('2024-05')).toBe('Q2');
  });

  it('returns Q2 for June', () => {
    expect(getQuarterFromMonth('2024-06')).toBe('Q2');
  });

  it('returns Q3 for July', () => {
    expect(getQuarterFromMonth('2024-07')).toBe('Q3');
  });

  it('returns Q3 for August', () => {
    expect(getQuarterFromMonth('2024-08')).toBe('Q3');
  });

  it('returns Q3 for September', () => {
    expect(getQuarterFromMonth('2024-09')).toBe('Q3');
  });

  it('returns Q4 for October', () => {
    expect(getQuarterFromMonth('2024-10')).toBe('Q4');
  });

  it('returns Q4 for November', () => {
    expect(getQuarterFromMonth('2024-11')).toBe('Q4');
  });

  it('returns Q4 for December', () => {
    expect(getQuarterFromMonth('2024-12')).toBe('Q4');
  });

  it('handles different years correctly', () => {
    expect(getQuarterFromMonth('2023-10')).toBe('Q4');
    expect(getQuarterFromMonth('2025-01')).toBe('Q1');
  });
});

// ============================================================================
// AC #2, #3: getWeeksInMonth returns month-aligned week chunks
// ============================================================================

describe('getWeeksInMonth (AC #2, #3)', () => {
  it('October 2024 (31 days) returns 5 weeks', () => {
    const result = getWeeksInMonth('2024-10', 'en');

    expect(result).toHaveLength(5);
  });

  it('October 2024 first week is Oct 1-7', () => {
    const result = getWeeksInMonth('2024-10', 'en');

    expect(result[0].label).toBe('Oct 1-7');
    expect(result[0].start).toBe('2024-10-01');
    expect(result[0].end).toBe('2024-10-07');
    expect(result[0].weekNumber).toBe(1);
  });

  it('October 2024 last week is Oct 29-31 (partial week - AC #3)', () => {
    const result = getWeeksInMonth('2024-10', 'en');

    expect(result[4].label).toBe('Oct 29-31');
    expect(result[4].start).toBe('2024-10-29');
    expect(result[4].end).toBe('2024-10-31');
    expect(result[4].weekNumber).toBe(5);
  });

  it('October 2024 has all 5 weeks with correct ranges', () => {
    const result = getWeeksInMonth('2024-10', 'en');

    expect(result[0].label).toBe('Oct 1-7');
    expect(result[1].label).toBe('Oct 8-14');
    expect(result[2].label).toBe('Oct 15-21');
    expect(result[3].label).toBe('Oct 22-28');
    expect(result[4].label).toBe('Oct 29-31');
  });

  it('November 2024 (30 days) returns 5 weeks', () => {
    const result = getWeeksInMonth('2024-11', 'en');

    expect(result).toHaveLength(5);
    expect(result[4].label).toBe('Nov 29-30');
    expect(result[4].end).toBe('2024-11-30');
  });

  it('April 2024 (30 days) has correct week boundaries', () => {
    const result = getWeeksInMonth('2024-04', 'en');

    expect(result).toHaveLength(5);
    expect(result[0].label).toBe('Apr 1-7');
    expect(result[4].label).toBe('Apr 29-30');
  });
});

// ============================================================================
// AC #4: February leap year handling
// ============================================================================

describe('getWeeksInMonth - February edge cases (AC #4)', () => {
  it('February 2024 (leap year) ends on Feb 29', () => {
    const result = getWeeksInMonth('2024-02', 'en');

    expect(result).toHaveLength(5);
    // Last week is Feb 29-29 (single day)
    expect(result[4].end).toBe('2024-02-29');
    expect(result[4].label).toBe('Feb 29-29');
  });

  it('February 2025 (non-leap year) ends on Feb 28', () => {
    const result = getWeeksInMonth('2025-02', 'en');

    expect(result).toHaveLength(4);
    expect(result[3].end).toBe('2025-02-28');
    expect(result[3].label).toBe('Feb 22-28');
  });

  it('February 2020 (leap year) ends on Feb 29', () => {
    const result = getWeeksInMonth('2020-02', 'en');

    expect(result).toHaveLength(5);
    expect(result[4].end).toBe('2020-02-29');
  });

  it('February 2023 (non-leap year) ends on Feb 28', () => {
    const result = getWeeksInMonth('2023-02', 'en');

    expect(result).toHaveLength(4);
    expect(result[3].end).toBe('2023-02-28');
  });
});

// ============================================================================
// AC #9: Edge cases - year transitions, short months, month boundaries
// ============================================================================

describe('getWeeksInMonth - Edge cases (AC #9)', () => {
  it('December 2024 weeks do not extend to January', () => {
    const result = getWeeksInMonth('2024-12', 'en');

    expect(result).toHaveLength(5);
    expect(result[0].label).toBe('Dec 1-7');
    expect(result[4].label).toBe('Dec 29-31');
    expect(result[4].end).toBe('2024-12-31');
    // Ensure no dates in January
    result.forEach((week) => {
      expect(week.start).toMatch(/^2024-12/);
      expect(week.end).toMatch(/^2024-12/);
    });
  });

  it('January 2024 has correct week boundaries', () => {
    const result = getWeeksInMonth('2024-01', 'en');

    expect(result).toHaveLength(5);
    expect(result[0].label).toBe('Jan 1-7');
    expect(result[4].label).toBe('Jan 29-31');
  });

  it('June 2024 (30 days) has correct boundaries', () => {
    const result = getWeeksInMonth('2024-06', 'en');

    expect(result).toHaveLength(5);
    expect(result[4].label).toBe('Jun 29-30');
    expect(result[4].end).toBe('2024-06-30');
  });

  it('September 2024 (30 days) has correct boundaries', () => {
    const result = getWeeksInMonth('2024-09', 'en');

    expect(result).toHaveLength(5);
    expect(result[4].label).toBe('Sep 29-30');
  });
});

// ============================================================================
// AC #7: formatWeekLabel with English locale
// ============================================================================

describe('formatWeekLabel - English locale (AC #7)', () => {
  it('formats "Oct 1-7" for October dates', () => {
    const result = formatWeekLabel('2024-10-01', '2024-10-07', 'en');

    expect(result).toBe('Oct 1-7');
  });

  it('formats partial week correctly', () => {
    const result = formatWeekLabel('2024-10-29', '2024-10-31', 'en');

    expect(result).toBe('Oct 29-31');
  });

  it('formats single day week correctly', () => {
    const result = formatWeekLabel('2024-02-29', '2024-02-29', 'en');

    expect(result).toBe('Feb 29-29');
  });

  it('formats November correctly', () => {
    const result = formatWeekLabel('2024-11-01', '2024-11-07', 'en');

    expect(result).toBe('Nov 1-7');
  });

  it('formats December correctly', () => {
    const result = formatWeekLabel('2024-12-22', '2024-12-28', 'en');

    expect(result).toBe('Dec 22-28');
  });

  it('uses English by default', () => {
    const result = formatWeekLabel('2024-10-01', '2024-10-07');

    expect(result).toBe('Oct 1-7');
  });
});

// ============================================================================
// AC #8: formatWeekLabel with Spanish locale
// ============================================================================

describe('formatWeekLabel - Spanish locale (AC #8)', () => {
  it('uses Spanish month abbreviation for October', () => {
    const result = formatWeekLabel('2024-10-01', '2024-10-07', 'es');

    // Spanish October is "octubre", abbreviated "oct"
    expect(result).toMatch(/oct/i);
    expect(result).toMatch(/1-7/);
  });

  it('uses Spanish month abbreviation for November', () => {
    const result = formatWeekLabel('2024-11-01', '2024-11-07', 'es');

    // Spanish November is "noviembre", abbreviated "nov"
    expect(result).toMatch(/nov/i);
  });

  it('uses Spanish month abbreviation for February', () => {
    const result = formatWeekLabel('2024-02-01', '2024-02-07', 'es');

    // Spanish February is "febrero", abbreviated "feb"
    expect(result).toMatch(/feb/i);
  });

  it('formats date range correctly in Spanish', () => {
    const result = formatWeekLabel('2024-10-29', '2024-10-31', 'es');

    expect(result).toMatch(/29-31/);
  });
});

// ============================================================================
// AC #10: Uses native JavaScript (no external date libraries)
// Verified by the implementation - no imports of moment, date-fns, etc.
// These tests verify Intl.DateTimeFormat behavior
// ============================================================================

describe('Native JavaScript Date handling (AC #10)', () => {
  it('correctly calculates days in month for 31-day months', () => {
    const octResult = getWeeksInMonth('2024-10', 'en');
    const janResult = getWeeksInMonth('2024-01', 'en');

    expect(octResult[4].end).toBe('2024-10-31');
    expect(janResult[4].end).toBe('2024-01-31');
  });

  it('correctly calculates days in month for 30-day months', () => {
    const aprResult = getWeeksInMonth('2024-04', 'en');
    const junResult = getWeeksInMonth('2024-06', 'en');
    const sepResult = getWeeksInMonth('2024-09', 'en');
    const novResult = getWeeksInMonth('2024-11', 'en');

    expect(aprResult[4].end).toBe('2024-04-30');
    expect(junResult[4].end).toBe('2024-06-30');
    expect(sepResult[4].end).toBe('2024-09-30');
    expect(novResult[4].end).toBe('2024-11-30');
  });

  it('correctly handles leap year calculation', () => {
    // 2024 is a leap year (divisible by 4, not by 100 except if by 400)
    const leap2024 = getWeeksInMonth('2024-02', 'en');
    expect(leap2024[4].end).toBe('2024-02-29');

    // 2000 was a leap year (divisible by 400)
    const leap2000 = getWeeksInMonth('2000-02', 'en');
    expect(leap2000[4].end).toBe('2000-02-29');

    // 1900 was NOT a leap year (divisible by 100 but not 400)
    const nonLeap1900 = getWeeksInMonth('1900-02', 'en');
    expect(nonLeap1900[3].end).toBe('1900-02-28');
  });
});

// ============================================================================
// Type validation tests
// ============================================================================

describe('Type definitions', () => {
  it('Quarter interface has correct shape', () => {
    const quarters = getQuartersInYear(2024);
    const q1: Quarter = quarters[0];

    expect(q1.label).toBe('Q1');
    expect(q1.months).toHaveLength(3);
    expect(typeof q1.months[0]).toBe('string');
  });

  it('WeekRange interface has correct shape', () => {
    const weeks = getWeeksInMonth('2024-10', 'en');
    const week1: WeekRange = weeks[0];

    expect(typeof week1.label).toBe('string');
    expect(typeof week1.start).toBe('string');
    expect(typeof week1.end).toBe('string');
    expect(typeof week1.weekNumber).toBe('number');
  });

  it('WeekRange dates are in YYYY-MM-DD format', () => {
    const weeks = getWeeksInMonth('2024-10', 'en');

    weeks.forEach((week) => {
      expect(week.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(week.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('WeekRange weekNumbers are sequential 1-5', () => {
    const weeks = getWeeksInMonth('2024-10', 'en');

    expect(weeks[0].weekNumber).toBe(1);
    expect(weeks[1].weekNumber).toBe(2);
    expect(weeks[2].weekNumber).toBe(3);
    expect(weeks[3].weekNumber).toBe(4);
    expect(weeks[4].weekNumber).toBe(5);
  });
});

// ============================================================================
// Legacy formatDate tests (maintain existing functionality)
// ============================================================================

describe('formatDate (legacy)', () => {
  it('formats date in LatAm format (DD/MM/YYYY)', () => {
    expect(formatDate('2024-10-15', 'LatAm')).toBe('15/10/2024');
  });

  it('formats date in US format (MM/DD/YYYY)', () => {
    expect(formatDate('2024-10-15', 'US')).toBe('10/15/2024');
  });

  it('returns original string if invalid format', () => {
    expect(formatDate('invalid-date', 'LatAm')).toBe('invalid-date');
    expect(formatDate('2024-10', 'LatAm')).toBe('2024-10');
  });
});

// ============================================================================
// Integration tests with getWeeksInMonth
// ============================================================================

describe('getWeeksInMonth integration', () => {
  it('all weeks in month have weekNumber 1-5', () => {
    const result = getWeeksInMonth('2024-10', 'en');

    result.forEach((week, index) => {
      expect(week.weekNumber).toBe(index + 1);
    });
  });

  it('week dates are contiguous (no gaps)', () => {
    const result = getWeeksInMonth('2024-10', 'en');

    for (let i = 1; i < result.length; i++) {
      const prevEnd = parseInt(result[i - 1].end.split('-')[2], 10);
      const currStart = parseInt(result[i].start.split('-')[2], 10);
      expect(currStart).toBe(prevEnd + 1);
    }
  });

  it('first week always starts on day 1', () => {
    const months = ['2024-01', '2024-02', '2024-10', '2024-12'];

    months.forEach((month) => {
      const result = getWeeksInMonth(month, 'en');
      expect(result[0].start).toMatch(/-01$/);
    });
  });
});
