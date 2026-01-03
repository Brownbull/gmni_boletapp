/**
 * Tests for Temporal Navigation Utilities
 *
 * Story 14.9: Swipe Time Navigation
 * Epic 14: Core Implementation
 *
 * Tests the getNextTemporalPeriod and getPrevTemporalPeriod functions
 * that enable swipe-based time navigation.
 */

import { describe, it, expect } from 'vitest';
import {
  getNextTemporalPeriod,
  getPrevTemporalPeriod,
  getNextPeriodLabel,
  getPrevPeriodLabel,
} from '../../../src/utils/historyFilterUtils';
import type { TemporalFilterState } from '../../../src/contexts/HistoryFiltersContext';

describe('Temporal Navigation Utilities (Story 14.9)', () => {
  describe('getNextTemporalPeriod', () => {
    it('should return null for "all" level', () => {
      const current: TemporalFilterState = { level: 'all' };
      expect(getNextTemporalPeriod(current)).toBeNull();
    });

    describe('year navigation', () => {
      it('should navigate to next year', () => {
        const current: TemporalFilterState = { level: 'year', year: '2024' };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({ level: 'year', year: '2025' });
      });

      it('should handle year boundary correctly', () => {
        const current: TemporalFilterState = { level: 'year', year: '2099' };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({ level: 'year', year: '2100' });
      });
    });

    describe('quarter navigation', () => {
      it('should navigate from Q1 to Q2', () => {
        const current: TemporalFilterState = {
          level: 'quarter',
          year: '2024',
          quarter: 'Q1',
        };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({ level: 'quarter', year: '2024', quarter: 'Q2' });
      });

      it('should navigate from Q4 to Q1 of next year', () => {
        const current: TemporalFilterState = {
          level: 'quarter',
          year: '2024',
          quarter: 'Q4',
        };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({ level: 'quarter', year: '2025', quarter: 'Q1' });
      });
    });

    describe('month navigation', () => {
      it('should navigate to next month within same year', () => {
        const current: TemporalFilterState = {
          level: 'month',
          year: '2024',
          month: '2024-06',
        };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({ level: 'month', year: '2024', month: '2024-07' });
      });

      it('should navigate from December to January of next year', () => {
        const current: TemporalFilterState = {
          level: 'month',
          year: '2024',
          month: '2024-12',
        };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({ level: 'month', year: '2025', month: '2025-01' });
      });
    });

    describe('week navigation', () => {
      it('should navigate to next week within same month', () => {
        const current: TemporalFilterState = {
          level: 'week',
          year: '2024',
          month: '2024-10',
          week: 2,
        };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({
          level: 'week',
          year: '2024',
          month: '2024-10',
          week: 3,
        });
      });

      it('should navigate to first week of next month at month boundary', () => {
        // October 2024 has 5 weeks (31 days)
        const current: TemporalFilterState = {
          level: 'week',
          year: '2024',
          month: '2024-10',
          week: 5,
        };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({
          level: 'week',
          year: '2024',
          month: '2024-11',
          week: 1,
        });
      });

      it('should navigate to first week of January at year boundary', () => {
        // December 2024 has 5 weeks
        const current: TemporalFilterState = {
          level: 'week',
          year: '2024',
          month: '2024-12',
          week: 5,
        };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({
          level: 'week',
          year: '2025',
          month: '2025-01',
          week: 1,
        });
      });
    });

    describe('day navigation', () => {
      it('should navigate to next day within same week', () => {
        const current: TemporalFilterState = {
          level: 'day',
          year: '2024',
          month: '2024-10',
          week: 2,
          day: '2024-10-10',
        };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({
          level: 'day',
          year: '2024',
          month: '2024-10',
          week: 2,
          day: '2024-10-11',
        });
      });

      it('should update week when crossing week boundary', () => {
        const current: TemporalFilterState = {
          level: 'day',
          year: '2024',
          month: '2024-10',
          week: 1,
          day: '2024-10-07', // Last day of week 1
        };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({
          level: 'day',
          year: '2024',
          month: '2024-10',
          week: 2, // Now in week 2
          day: '2024-10-08',
        });
      });

      it('should navigate to first day of next month at month boundary', () => {
        const current: TemporalFilterState = {
          level: 'day',
          year: '2024',
          month: '2024-10',
          week: 5,
          day: '2024-10-31',
        };
        const next = getNextTemporalPeriod(current);
        expect(next).toEqual({
          level: 'day',
          year: '2024',
          month: '2024-11',
          week: 1,
          day: '2024-11-01',
        });
      });
    });
  });

  describe('getPrevTemporalPeriod', () => {
    it('should return null for "all" level', () => {
      const current: TemporalFilterState = { level: 'all' };
      expect(getPrevTemporalPeriod(current)).toBeNull();
    });

    describe('year navigation', () => {
      it('should navigate to previous year', () => {
        const current: TemporalFilterState = { level: 'year', year: '2024' };
        const prev = getPrevTemporalPeriod(current);
        expect(prev).toEqual({ level: 'year', year: '2023' });
      });
    });

    describe('quarter navigation', () => {
      it('should navigate from Q2 to Q1', () => {
        const current: TemporalFilterState = {
          level: 'quarter',
          year: '2024',
          quarter: 'Q2',
        };
        const prev = getPrevTemporalPeriod(current);
        expect(prev).toEqual({ level: 'quarter', year: '2024', quarter: 'Q1' });
      });

      it('should navigate from Q1 to Q4 of previous year', () => {
        const current: TemporalFilterState = {
          level: 'quarter',
          year: '2024',
          quarter: 'Q1',
        };
        const prev = getPrevTemporalPeriod(current);
        expect(prev).toEqual({ level: 'quarter', year: '2023', quarter: 'Q4' });
      });
    });

    describe('month navigation', () => {
      it('should navigate to previous month within same year', () => {
        const current: TemporalFilterState = {
          level: 'month',
          year: '2024',
          month: '2024-06',
        };
        const prev = getPrevTemporalPeriod(current);
        expect(prev).toEqual({ level: 'month', year: '2024', month: '2024-05' });
      });

      it('should navigate from January to December of previous year', () => {
        const current: TemporalFilterState = {
          level: 'month',
          year: '2024',
          month: '2024-01',
        };
        const prev = getPrevTemporalPeriod(current);
        expect(prev).toEqual({ level: 'month', year: '2023', month: '2023-12' });
      });
    });

    describe('week navigation', () => {
      it('should navigate to previous week within same month', () => {
        const current: TemporalFilterState = {
          level: 'week',
          year: '2024',
          month: '2024-10',
          week: 3,
        };
        const prev = getPrevTemporalPeriod(current);
        expect(prev).toEqual({
          level: 'week',
          year: '2024',
          month: '2024-10',
          week: 2,
        });
      });

      it('should navigate to last week of previous month at month boundary', () => {
        const current: TemporalFilterState = {
          level: 'week',
          year: '2024',
          month: '2024-10',
          week: 1,
        };
        const prev = getPrevTemporalPeriod(current);
        // September 2024 has 30 days = 5 weeks (days 1-7, 8-14, 15-21, 22-28, 29-30)
        expect(prev).toEqual({
          level: 'week',
          year: '2024',
          month: '2024-09',
          week: 5, // Last week of September
        });
      });

      it('should navigate to last week of December at year boundary', () => {
        const current: TemporalFilterState = {
          level: 'week',
          year: '2024',
          month: '2024-01',
          week: 1,
        };
        const prev = getPrevTemporalPeriod(current);
        expect(prev).toEqual({
          level: 'week',
          year: '2023',
          month: '2023-12',
          week: 5, // December 2023 has 5 weeks
        });
      });
    });

    describe('day navigation', () => {
      it('should navigate to previous day within same week', () => {
        const current: TemporalFilterState = {
          level: 'day',
          year: '2024',
          month: '2024-10',
          week: 2,
          day: '2024-10-10',
        };
        const prev = getPrevTemporalPeriod(current);
        expect(prev).toEqual({
          level: 'day',
          year: '2024',
          month: '2024-10',
          week: 2,
          day: '2024-10-09',
        });
      });

      it('should update week when crossing week boundary backwards', () => {
        const current: TemporalFilterState = {
          level: 'day',
          year: '2024',
          month: '2024-10',
          week: 2,
          day: '2024-10-08', // First day of week 2
        };
        const prev = getPrevTemporalPeriod(current);
        expect(prev).toEqual({
          level: 'day',
          year: '2024',
          month: '2024-10',
          week: 1, // Now in week 1
          day: '2024-10-07',
        });
      });

      it('should navigate to last day of previous month at month boundary', () => {
        const current: TemporalFilterState = {
          level: 'day',
          year: '2024',
          month: '2024-10',
          week: 1,
          day: '2024-10-01',
        };
        const prev = getPrevTemporalPeriod(current);
        expect(prev).toEqual({
          level: 'day',
          year: '2024',
          month: '2024-09',
          week: 5, // September 30 is in week 5
          day: '2024-09-30',
        });
      });
    });
  });

  describe('getNextPeriodLabel', () => {
    it('should return null for "all" level', () => {
      const current: TemporalFilterState = { level: 'all' };
      expect(getNextPeriodLabel(current)).toBeNull();
    });

    it('should return formatted label for next month', () => {
      const current: TemporalFilterState = {
        level: 'month',
        year: '2024',
        month: '2024-10',
      };
      const label = getNextPeriodLabel(current, 'en');
      expect(label).toBeTruthy();
      expect(label).toContain('November');
    });
  });

  describe('getPrevPeriodLabel', () => {
    it('should return null for "all" level', () => {
      const current: TemporalFilterState = { level: 'all' };
      expect(getPrevPeriodLabel(current)).toBeNull();
    });

    it('should return formatted label for previous month', () => {
      const current: TemporalFilterState = {
        level: 'month',
        year: '2024',
        month: '2024-10',
      };
      const label = getPrevPeriodLabel(current, 'en');
      expect(label).toBeTruthy();
      expect(label).toContain('September');
    });
  });
});
