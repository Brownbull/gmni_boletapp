/**
 * Validate Navigation State Unit Tests
 *
 * Tests for the state validation function in analyticsHelpers.ts.
 *
 * Story 7.1 - Analytics Navigation Context
 * AC #4: validateNavigationState() catches impossible states and auto-corrects to safe defaults
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateNavigationState,
  getQuarterFromMonth,
  getDefaultNavigationState,
  getCurrentYear,
} from '@features/analytics/utils/analyticsHelpers';
import type { AnalyticsNavigationState } from '../../../src/types/analytics';

describe('getQuarterFromMonth', () => {
  it('returns Q1 for January-March', () => {
    expect(getQuarterFromMonth('2024-01')).toBe('Q1');
    expect(getQuarterFromMonth('2024-02')).toBe('Q1');
    expect(getQuarterFromMonth('2024-03')).toBe('Q1');
  });

  it('returns Q2 for April-June', () => {
    expect(getQuarterFromMonth('2024-04')).toBe('Q2');
    expect(getQuarterFromMonth('2024-05')).toBe('Q2');
    expect(getQuarterFromMonth('2024-06')).toBe('Q2');
  });

  it('returns Q3 for July-September', () => {
    expect(getQuarterFromMonth('2024-07')).toBe('Q3');
    expect(getQuarterFromMonth('2024-08')).toBe('Q3');
    expect(getQuarterFromMonth('2024-09')).toBe('Q3');
  });

  it('returns Q4 for October-December', () => {
    expect(getQuarterFromMonth('2024-10')).toBe('Q4');
    expect(getQuarterFromMonth('2024-11')).toBe('Q4');
    expect(getQuarterFromMonth('2024-12')).toBe('Q4');
  });
});

describe('getDefaultNavigationState', () => {
  it('creates default state at year level', () => {
    const state = getDefaultNavigationState('2024');

    expect(state.temporal.level).toBe('year');
    expect(state.temporal.year).toBe('2024');
    expect(state.category.level).toBe('all');
    expect(state.chartMode).toBe('aggregation');
  });

  it('has no optional temporal properties', () => {
    const state = getDefaultNavigationState('2024');

    expect(state.temporal.quarter).toBeUndefined();
    expect(state.temporal.month).toBeUndefined();
    expect(state.temporal.week).toBeUndefined();
    expect(state.temporal.day).toBeUndefined();
  });
});

describe('getCurrentYear', () => {
  it('returns current year as string', () => {
    const year = getCurrentYear();
    const expected = new Date().getFullYear().toString();

    expect(year).toBe(expected);
  });
});

describe('validateNavigationState - Temporal Validation', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('AC #4: corrects day without month to year view', () => {
    const invalidState: AnalyticsNavigationState = {
      temporal: { level: 'day', year: '2024', day: '2024-10-15' },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(invalidState);

    expect(corrected.temporal.level).toBe('year');
    expect(corrected.temporal.year).toBe('2024');
    expect(corrected.temporal.day).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid state: day without month, resetting to year'
    );
  });

  it('AC #4: corrects week without month to year view', () => {
    const invalidState: AnalyticsNavigationState = {
      temporal: { level: 'week', year: '2024', week: 2 },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(invalidState);

    expect(corrected.temporal.level).toBe('year');
    expect(corrected.temporal.week).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid state: week without month, resetting to year'
    );
  });

  it('AC #4: auto-derives quarter from month if missing', () => {
    const stateWithoutQuarter: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(stateWithoutQuarter);

    expect(corrected.temporal.quarter).toBe('Q4');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Auto-deriving quarter from month: Q4'
    );
  });

  it('AC #4: corrects quarter level without quarter value', () => {
    const invalidState: AnalyticsNavigationState = {
      temporal: { level: 'quarter', year: '2024' },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(invalidState);

    expect(corrected.temporal.level).toBe('year');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid state: quarter level without quarter value, resetting to year'
    );
  });

  it('AC #4: auto-derives quarter for week level if missing', () => {
    const stateWithoutQuarter: AnalyticsNavigationState = {
      temporal: { level: 'week', year: '2024', month: '2024-07', week: 2 },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(stateWithoutQuarter);

    expect(corrected.temporal.quarter).toBe('Q3');
  });

  it('AC #4: auto-derives quarter for day level if missing', () => {
    const stateWithoutQuarter: AnalyticsNavigationState = {
      temporal: {
        level: 'day',
        year: '2024',
        month: '2024-03',
        week: 1,
        day: '2024-03-05',
      },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(stateWithoutQuarter);

    expect(corrected.temporal.quarter).toBe('Q1');
  });

  it('AC #4: clamps invalid week index to valid range', () => {
    const invalidState: AnalyticsNavigationState = {
      temporal: {
        level: 'week',
        year: '2024',
        quarter: 'Q4',
        month: '2024-10',
        week: 10,
      },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(invalidState);

    expect(corrected.temporal.week).toBe(5);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid week index')
    );
  });

  it('AC #4: clamps negative week index', () => {
    const invalidState: AnalyticsNavigationState = {
      temporal: {
        level: 'week',
        year: '2024',
        quarter: 'Q4',
        month: '2024-10',
        week: 0,
      },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(invalidState);

    expect(corrected.temporal.week).toBe(1);
  });

  it('passes through valid temporal state unchanged', () => {
    const validState: AnalyticsNavigationState = {
      temporal: {
        level: 'month',
        year: '2024',
        quarter: 'Q4',
        month: '2024-10',
      },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const result = validateNavigationState(validState);

    expect(result.temporal).toEqual(validState.temporal);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

describe('validateNavigationState - Category Validation', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('AC #4: corrects subcategory without group', () => {
    const invalidState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'subcategory', category: 'Food', subcategory: 'Meats' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(invalidState);

    expect(corrected.category.level).toBe('all');
    expect(corrected.category.category).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid state: subcategory without group, clearing filter'
    );
  });

  it('AC #4: corrects group without category', () => {
    const invalidState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'group', group: 'Groceries' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(invalidState);

    expect(corrected.category.level).toBe('all');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid state: group without category, clearing filter'
    );
  });

  it('AC #4: corrects category level without category value', () => {
    const invalidState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'category' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(invalidState);

    expect(corrected.category.level).toBe('all');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid state: category level without category value, clearing filter'
    );
  });

  it('AC #4: corrects subcategory without category', () => {
    const invalidState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'subcategory', group: 'Groceries', subcategory: 'Meats' },
      chartMode: 'aggregation',
    };

    const corrected = validateNavigationState(invalidState);

    expect(corrected.category.level).toBe('all');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Invalid state: subcategory without category, clearing filter'
    );
  });

  it('passes through valid category state unchanged', () => {
    const validState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: {
        level: 'subcategory',
        category: 'Food',
        group: 'Groceries',
        subcategory: 'Meats',
      },
      chartMode: 'aggregation',
    };

    const result = validateNavigationState(validState);

    expect(result.category).toEqual(validState.category);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('passes through all level unchanged', () => {
    const validState: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const result = validateNavigationState(validState);

    expect(result.category).toEqual({ level: 'all' });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

describe('validateNavigationState - Combined Validation', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('corrects both invalid temporal and category', () => {
    const invalidState: AnalyticsNavigationState = {
      temporal: { level: 'week', year: '2024', week: 2 }, // Missing month
      category: { level: 'group', group: 'Groceries' }, // Missing category
      chartMode: 'comparison',
    };

    const corrected = validateNavigationState(invalidState);

    expect(corrected.temporal.level).toBe('year');
    expect(corrected.category.level).toBe('all');
    expect(corrected.chartMode).toBe('comparison'); // Preserved
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
  });

  it('preserves chartMode during validation', () => {
    const state: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', month: '2024-10' },
      category: { level: 'all' },
      chartMode: 'comparison',
    };

    const result = validateNavigationState(state);

    expect(result.chartMode).toBe('comparison');
  });
});

describe('validateNavigationState - Edge Cases', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('handles year boundary (December to January)', () => {
    const decemberState: AnalyticsNavigationState = {
      temporal: { level: 'month', year: '2024', quarter: 'Q4', month: '2024-12' },
      category: { level: 'all' },
      chartMode: 'aggregation',
    };

    const result = validateNavigationState(decemberState);

    expect(result.temporal.quarter).toBe('Q4');
    expect(result.temporal.month).toBe('2024-12');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('handles valid full category hierarchy', () => {
    const fullHierarchy: AnalyticsNavigationState = {
      temporal: { level: 'year', year: '2024' },
      category: {
        level: 'subcategory',
        category: 'Food',
        group: 'Groceries',
        subcategory: 'Meats',
      },
      chartMode: 'aggregation',
      drillDownMode: 'temporal', // Story 7.16
    };

    const result = validateNavigationState(fullHierarchy);

    expect(result).toEqual(fullHierarchy);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('handles valid full temporal hierarchy', () => {
    const fullHierarchy: AnalyticsNavigationState = {
      temporal: {
        level: 'day',
        year: '2024',
        quarter: 'Q4',
        month: '2024-10',
        week: 2,
        day: '2024-10-15',
      },
      category: { level: 'all' },
      chartMode: 'aggregation',
      drillDownMode: 'temporal', // Story 7.16
    };

    const result = validateNavigationState(fullHierarchy);

    expect(result).toEqual(fullHierarchy);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
