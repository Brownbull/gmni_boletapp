/**
 * Unit Tests for Analytics to History Filters Conversion
 *
 * Tests the utility functions that convert analytics positions to history filter states.
 *
 * Story 9.20: Analytics Transaction Count & History Navigation
 */

import { describe, it, expect } from 'vitest';
import {
  temporalPositionToFilter,
  categoryPositionToFilter,
  createTemporalNavigationPayload,
  createCategoryNavigationPayload,
} from '../../../src/utils/analyticsToHistoryFilters';
import type { TemporalPosition, CategoryPosition } from '../../../src/types/analytics';

// ============================================================================
// temporalPositionToFilter Tests
// ============================================================================

describe('temporalPositionToFilter', () => {
  it('converts year level position', () => {
    const position: TemporalPosition = { level: 'year', year: '2024' };
    const filter = temporalPositionToFilter(position);

    expect(filter).toEqual({
      level: 'year',
      year: '2024',
    });
  });

  it('converts quarter level position', () => {
    const position: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q3' };
    const filter = temporalPositionToFilter(position);

    expect(filter).toEqual({
      level: 'quarter',
      year: '2024',
      quarter: 'Q3',
    });
  });

  it('converts month level position', () => {
    const position: TemporalPosition = {
      level: 'month',
      year: '2024',
      quarter: 'Q4',
      month: '2024-10',
    };
    const filter = temporalPositionToFilter(position);

    expect(filter).toEqual({
      level: 'month',
      year: '2024',
      month: '2024-10',
    });
  });

  it('converts week level position', () => {
    const position: TemporalPosition = {
      level: 'week',
      year: '2024',
      quarter: 'Q4',
      month: '2024-10',
      week: 2,
    };
    const filter = temporalPositionToFilter(position);

    expect(filter).toEqual({
      level: 'week',
      year: '2024',
      month: '2024-10',
      week: 2,
    });
  });

  it('converts day level position', () => {
    const position: TemporalPosition = {
      level: 'day',
      year: '2024',
      quarter: 'Q4',
      month: '2024-10',
      week: 2,
      day: '2024-10-15',
    };
    const filter = temporalPositionToFilter(position);

    expect(filter).toEqual({
      level: 'day',
      year: '2024',
      month: '2024-10',
      week: 2,
      day: '2024-10-15',
    });
  });
});

// ============================================================================
// categoryPositionToFilter Tests
// ============================================================================

describe('categoryPositionToFilter', () => {
  it('converts all level position', () => {
    const position: CategoryPosition = { level: 'all' };
    const filter = categoryPositionToFilter(position);

    expect(filter).toEqual({
      level: 'all',
    });
  });

  it('converts category level position', () => {
    const position: CategoryPosition = { level: 'category', category: 'Supermarket' };
    const filter = categoryPositionToFilter(position);

    expect(filter).toEqual({
      level: 'category',
      category: 'Supermarket',
    });
  });

  it('converts group level position', () => {
    const position: CategoryPosition = {
      level: 'group',
      category: 'Supermarket',
      group: 'Produce',
    };
    const filter = categoryPositionToFilter(position);

    expect(filter).toEqual({
      level: 'group',
      category: 'Supermarket',
      group: 'Produce',
    });
  });

  it('converts subcategory level position', () => {
    const position: CategoryPosition = {
      level: 'subcategory',
      category: 'Supermarket',
      group: 'Produce',
      subcategory: 'Fruits',
    };
    const filter = categoryPositionToFilter(position);

    expect(filter).toEqual({
      level: 'subcategory',
      category: 'Supermarket',
      group: 'Produce',
      subcategory: 'Fruits',
    });
  });
});

// ============================================================================
// createTemporalNavigationPayload Tests
// ============================================================================

describe('createTemporalNavigationPayload', () => {
  it('creates payload with temporal filter only (no category)', () => {
    const position: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q4' };
    const payload = createTemporalNavigationPayload(position);

    expect(payload.temporal).toEqual({
      level: 'quarter',
      year: '2024',
      quarter: 'Q4',
      month: undefined,
    });
    // No category filter for temporal-only navigation
    expect(payload.category).toBeUndefined();
  });

  it('creates correct payload for year position', () => {
    const position: TemporalPosition = { level: 'year', year: '2024' };
    const payload = createTemporalNavigationPayload(position);

    expect(payload.temporal).toEqual({
      level: 'year',
      year: '2024',
      quarter: undefined,
      month: undefined,
    });
  });

  it('creates correct payload for day position', () => {
    const position: TemporalPosition = {
      level: 'day',
      year: '2024',
      quarter: 'Q4',
      month: '2024-12',
      week: 3,
      day: '2024-12-15',
    };
    const payload = createTemporalNavigationPayload(position);

    // Note: The implementation doesn't include week/day in the payload
    // as HistoryNavigationPayload.temporal only has level, year, month, quarter
    expect(payload.temporal?.level).toBe('day');
    expect(payload.temporal?.year).toBe('2024');
    expect(payload.temporal?.month).toBe('2024-12');
  });
});

// ============================================================================
// createCategoryNavigationPayload Tests
// ============================================================================

describe('createCategoryNavigationPayload', () => {
  it('creates payload with temporal and category string', () => {
    const categoryPosition: CategoryPosition = {
      level: 'category',
      category: 'Supermarket',
    };
    const temporalPosition: TemporalPosition = {
      level: 'month',
      year: '2024',
      quarter: 'Q4',
      month: '2024-10',
    };

    const payload = createCategoryNavigationPayload(categoryPosition, temporalPosition);

    // Note: temporalPositionToFilter for 'month' level doesn't include quarter
    // because TemporalFilterState for month only has level, year, month
    expect(payload.temporal?.level).toBe('month');
    expect(payload.temporal?.year).toBe('2024');
    expect(payload.temporal?.month).toBe('2024-10');
    // Category is now a string, not an object
    expect(payload.category).toBe('Supermarket');
  });

  it('extracts category name for subcategory level', () => {
    const categoryPosition: CategoryPosition = {
      level: 'subcategory',
      category: 'Supermarket',
      group: 'Produce',
      subcategory: 'Fruits',
    };
    const temporalPosition: TemporalPosition = {
      level: 'quarter',
      year: '2024',
      quarter: 'Q3',
    };

    const payload = createCategoryNavigationPayload(categoryPosition, temporalPosition);

    // Category is extracted as string from the CategoryFilterState
    expect(payload.category).toBe('Supermarket');
    expect(payload.temporal?.quarter).toBe('Q3');
  });

  it('works with year-level temporal context', () => {
    const categoryPosition: CategoryPosition = {
      level: 'group',
      category: 'Restaurant',
      group: 'Main Course',
    };
    const temporalPosition: TemporalPosition = {
      level: 'year',
      year: '2024',
    };

    const payload = createCategoryNavigationPayload(categoryPosition, temporalPosition);

    expect(payload.temporal?.level).toBe('year');
    expect(payload.temporal?.year).toBe('2024');
    expect(payload.category).toBe('Restaurant');
  });
});
