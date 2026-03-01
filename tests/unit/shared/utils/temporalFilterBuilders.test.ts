import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildCascadingTemporalFilter,
  buildYearFilter,
  buildQuarterFilter,
  buildMonthFilter,
  buildWeekFilter,
  buildDayFilter,
} from '@/shared/utils/temporalFilterBuilders';

describe('buildCascadingTemporalFilter', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('level=year', () => {
    it('returns year-only filter', () => {
      expect(buildCascadingTemporalFilter('year', '2024')).toEqual({
        level: 'year',
        year: '2024',
      });
    });
  });

  describe('level=quarter', () => {
    it('returns year + quarter filter', () => {
      expect(buildCascadingTemporalFilter('quarter', '2024', 'Q3')).toEqual({
        level: 'quarter',
        year: '2024',
        quarter: 'Q3',
      });
    });

    it('defaults quarter to Q1 when not provided', () => {
      expect(buildCascadingTemporalFilter('quarter', '2024')).toEqual({
        level: 'quarter',
        year: '2024',
        quarter: 'Q1',
      });
    });
  });

  describe('level=month', () => {
    it('returns year + quarter + month filter with explicit values', () => {
      expect(buildCascadingTemporalFilter('month', '2024', 'Q2', '2024-04')).toEqual({
        level: 'month',
        year: '2024',
        quarter: 'Q2',
        month: '2024-04',
      });
    });

    it('cascades month from quarter when month not provided', () => {
      const result = buildCascadingTemporalFilter('month', '2024', 'Q3');
      expect(result).toEqual({
        level: 'month',
        year: '2024',
        quarter: 'Q3',
        month: '2024-07',
      });
    });

    it('derives quarter from month when quarter not provided', () => {
      const result = buildCascadingTemporalFilter('month', '2024', undefined, '2024-11');
      expect(result).toEqual({
        level: 'month',
        year: '2024',
        quarter: 'Q4',
        month: '2024-11',
      });
    });

    it('defaults to Q1 + January when neither quarter nor month provided', () => {
      const result = buildCascadingTemporalFilter('month', '2024');
      expect(result).toEqual({
        level: 'month',
        year: '2024',
        quarter: 'Q1',
        month: '2024-01',
      });
    });

    it('corrects month to first month of quarter when month is outside quarter', () => {
      const result = buildCascadingTemporalFilter('month', '2024', 'Q2', '2024-01');
      expect(result).toEqual({
        level: 'month',
        year: '2024',
        quarter: 'Q2',
        month: '2024-04',
      });
    });
  });

  describe('level=week', () => {
    it('returns full week filter with explicit values', () => {
      expect(buildCascadingTemporalFilter('week', '2024', 'Q1', '2024-02', 3)).toEqual({
        level: 'week',
        year: '2024',
        quarter: 'Q1',
        month: '2024-02',
        week: 3,
      });
    });

    it('defaults week to 1 when not provided', () => {
      const result = buildCascadingTemporalFilter('week', '2024', 'Q1', '2024-01');
      expect(result).toEqual({
        level: 'week',
        year: '2024',
        quarter: 'Q1',
        month: '2024-01',
        week: 1,
      });
    });

    it('cascades all defaults from year only', () => {
      const result = buildCascadingTemporalFilter('week', '2024');
      expect(result).toEqual({
        level: 'week',
        year: '2024',
        quarter: 'Q1',
        month: '2024-01',
        week: 1,
      });
    });

    it('corrects month to first month of quarter when month is outside quarter', () => {
      const result = buildCascadingTemporalFilter('week', '2024', 'Q2', '2024-01', 2);
      expect(result).toEqual({
        level: 'week',
        year: '2024',
        quarter: 'Q2',
        month: '2024-04',
        week: 2,
      });
    });
  });

  describe('level=day', () => {
    it('returns full day filter with explicit values', () => {
      expect(buildCascadingTemporalFilter('day', '2024', 'Q4', '2024-12', 2, '2024-12-10')).toEqual({
        level: 'day',
        year: '2024',
        quarter: 'Q4',
        month: '2024-12',
        week: 2,
        day: '2024-12-10',
      });
    });

    it('cascades day from week when not provided', () => {
      const result = buildCascadingTemporalFilter('day', '2024', 'Q1', '2024-01', 2);
      expect(result).toEqual({
        level: 'day',
        year: '2024',
        quarter: 'Q1',
        month: '2024-01',
        week: 2,
        day: '2024-01-08',
      });
    });

    it('cascades all defaults from year only', () => {
      const result = buildCascadingTemporalFilter('day', '2024');
      expect(result).toEqual({
        level: 'day',
        year: '2024',
        quarter: 'Q1',
        month: '2024-01',
        week: 1,
        day: '2024-01-01',
      });
    });

    it('corrects month to first month of quarter when month is outside quarter', () => {
      const result = buildCascadingTemporalFilter('day', '2024', 'Q3', '2024-01', 1);
      expect(result).toEqual({
        level: 'day',
        year: '2024',
        quarter: 'Q3',
        month: '2024-07',
        week: 1,
        day: '2024-07-01',
      });
    });
  });

  describe('fallback branch', () => {
    it('returns all-time filter for invalid level', () => {
      const result = buildCascadingTemporalFilter('invalid' as 'year', '2024');
      expect(result).toEqual({ level: 'all' });
    });
  });
});

describe('convenience wrappers', () => {
  describe('buildYearFilter', () => {
    it('builds year-level filter', () => {
      expect(buildYearFilter('2025')).toEqual({
        level: 'year',
        year: '2025',
      });
    });
  });

  describe('buildQuarterFilter', () => {
    it('builds quarter-level filter', () => {
      expect(buildQuarterFilter('2024', 'Q4')).toEqual({
        level: 'quarter',
        year: '2024',
        quarter: 'Q4',
      });
    });
  });

  describe('buildMonthFilter', () => {
    it('builds month-level filter with auto-derived quarter', () => {
      expect(buildMonthFilter('2024', '2024-08')).toEqual({
        level: 'month',
        year: '2024',
        quarter: 'Q3',
        month: '2024-08',
      });
    });

    it('derives Q1 for January', () => {
      expect(buildMonthFilter('2024', '2024-01').quarter).toBe('Q1');
    });

    it('derives Q2 for April', () => {
      expect(buildMonthFilter('2024', '2024-04').quarter).toBe('Q2');
    });

    it('derives Q3 for September', () => {
      expect(buildMonthFilter('2024', '2024-09').quarter).toBe('Q3');
    });

    it('derives Q4 for December', () => {
      expect(buildMonthFilter('2024', '2024-12').quarter).toBe('Q4');
    });
  });

  describe('buildWeekFilter', () => {
    it('builds week-level filter with auto-derived quarter', () => {
      expect(buildWeekFilter('2024', '2024-06', 4)).toEqual({
        level: 'week',
        year: '2024',
        quarter: 'Q2',
        month: '2024-06',
        week: 4,
      });
    });

    it('derives Q4 for October', () => {
      expect(buildWeekFilter('2024', '2024-10', 1).quarter).toBe('Q4');
    });
  });

  describe('buildDayFilter', () => {
    it('builds day-level filter with all fields', () => {
      expect(buildDayFilter('2024', '2024-03', 2, '2024-03-10')).toEqual({
        level: 'day',
        year: '2024',
        quarter: 'Q1',
        month: '2024-03',
        week: 2,
        day: '2024-03-10',
      });
    });
  });
});
