import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatTemporalRange } from '@/shared/utils/temporalFormatters';
import type { TemporalFilterState } from '@/types/historyFilters';

describe('formatTemporalRange', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('level=all', () => {
    it('returns English label for en locale', () => {
      const temporal: TemporalFilterState = { level: 'all' };
      expect(formatTemporalRange(temporal, 'en')).toBe('All time');
    });

    it('returns Spanish label for es locale', () => {
      const temporal: TemporalFilterState = { level: 'all' };
      expect(formatTemporalRange(temporal, 'es')).toBe('Todo el tiempo');
    });

    it('defaults to en locale when none specified', () => {
      const temporal: TemporalFilterState = { level: 'all' };
      expect(formatTemporalRange(temporal)).toBe('All time');
    });
  });

  describe('level=year', () => {
    it('returns year string for en', () => {
      const temporal: TemporalFilterState = { level: 'year', year: '2024' };
      expect(formatTemporalRange(temporal, 'en')).toBe('2024');
    });

    it('returns year string for es', () => {
      const temporal: TemporalFilterState = { level: 'year', year: '2025' };
      expect(formatTemporalRange(temporal, 'es')).toBe('2025');
    });
  });

  describe('level=quarter', () => {
    it('returns year > quarter for en', () => {
      const temporal: TemporalFilterState = { level: 'quarter', year: '2024', quarter: 'Q2' };
      expect(formatTemporalRange(temporal, 'en')).toBe('2024 > Q2');
    });

    it('returns year > trimestre for es', () => {
      const temporal: TemporalFilterState = { level: 'quarter', year: '2024', quarter: 'Q3' };
      expect(formatTemporalRange(temporal, 'es')).toBe('2024 > T3');
    });
  });

  describe('level=month', () => {
    it('returns year > month name for en', () => {
      const temporal: TemporalFilterState = {
        level: 'month', year: '2024', quarter: 'Q4', month: '2024-12',
      };
      const result = formatTemporalRange(temporal, 'en');
      expect(result).toContain('2024');
      expect(result).toContain('Q4');
      expect(result).toContain('December');
    });

    it('returns year > month name for es', () => {
      const temporal: TemporalFilterState = {
        level: 'month', year: '2024', quarter: 'Q1', month: '2024-03',
      };
      const result = formatTemporalRange(temporal, 'es');
      expect(result).toContain('2024');
      expect(result).toContain('T1');
      expect(result).toContain('marzo');
    });
  });

  describe('level=week', () => {
    it('returns year > quarter > month > week for en', () => {
      const temporal: TemporalFilterState = {
        level: 'week', year: '2024', quarter: 'Q2', month: '2024-06', week: 3,
      };
      const result = formatTemporalRange(temporal, 'en');
      expect(result).toContain('2024');
      expect(result).toContain('Q2');
      expect(result).toContain('W3');
    });

    it('returns year > trimestre > month > semana for es', () => {
      const temporal: TemporalFilterState = {
        level: 'week', year: '2024', quarter: 'Q1', month: '2024-02', week: 2,
      };
      const result = formatTemporalRange(temporal, 'es');
      expect(result).toContain('2024');
      expect(result).toContain('T1');
      expect(result).toContain('Sem 2');
    });
  });

  describe('level=day', () => {
    it('returns full breadcrumb for en', () => {
      const temporal: TemporalFilterState = {
        level: 'day', year: '2024', quarter: 'Q4', month: '2024-12', week: 2, day: '2024-12-15',
      };
      const result = formatTemporalRange(temporal, 'en');
      expect(result).toBe('2024 > Q4 > December > W2 > 15');
    });

    it('returns full breadcrumb for es', () => {
      const temporal: TemporalFilterState = {
        level: 'day', year: '2024', quarter: 'Q3', month: '2024-07', week: 1, day: '2024-07-05',
      };
      const result = formatTemporalRange(temporal, 'es');
      expect(result).toBe('2024 > T3 > julio > Sem 1 > 5');
    });
  });

  describe('edge cases', () => {
    it('handles missing optional fields gracefully', () => {
      const temporal: TemporalFilterState = { level: 'month', year: '2024', month: '2024-06' };
      const result = formatTemporalRange(temporal, 'en');
      expect(result).toContain('2024');
      // Quarter field not set in fixture, so no Q label in output
      expect(result).not.toContain('Q');
    });

    it('handles undefined week at week level', () => {
      const temporal: TemporalFilterState = {
        level: 'week', year: '2024', quarter: 'Q1', month: '2024-01',
      };
      const result = formatTemporalRange(temporal, 'en');
      expect(result).toContain('2024');
      expect(result).toContain('Q1');
      // week is undefined, so no W label should appear
      expect(result).not.toContain('W');
    });

    it('handles year-only at day level (minimal fields)', () => {
      const temporal: TemporalFilterState = {
        level: 'day', year: '2024', day: '2024-01-15',
      };
      const result = formatTemporalRange(temporal, 'en');
      expect(result).toContain('2024');
      expect(result).toContain('15');
    });
  });
});
