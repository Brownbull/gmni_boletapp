/**
 * History Filter Utils - Group Filter Tests
 *
 * Story 14.15b: Transaction Selection Mode & Groups (AC #7)
 * Group consolidation: Updated to use sharedGroupIds array instead of groupId string
 * Tests for group-based transaction filtering.
 */

import { describe, it, expect } from 'vitest';
import { filterTransactionsByHistoryFilters } from '../../../src/utils/historyFilterUtils';
import type { HistoryFilterState } from '../../../src/contexts/HistoryFiltersContext';
import type { Transaction } from '../../../src/types/transaction';

// ============================================================================
// Test Fixtures
// ============================================================================

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    date: '2024-12-28',
    merchant: 'Test Store',
    category: 'Supermarket' as any,
    total: 1000,
    items: [],
    ...overrides,
  };
}

function createDefaultFilters(): HistoryFilterState {
  return {
    temporal: { level: 'all' },
    category: { level: 'all' },
    location: {},
    group: {},
  };
}

// ============================================================================
// Group Filter Tests
// ============================================================================

describe('filterTransactionsByHistoryFilters - Group Filter', () => {
  describe('Basic Filtering', () => {
    it('includes all transactions when no group filter is applied', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-2', sharedGroupIds: ['group-2'] }),
        createTransaction({ id: 'tx-3' }), // No group
      ];

      const filters = createDefaultFilters();

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(3);
    });

    it('filters to only transactions in specified group', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-2', sharedGroupIds: ['group-2'] }),
        createTransaction({ id: 'tx-3', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-4' }), // No group
      ];

      const filters: HistoryFilterState = {
        ...createDefaultFilters(),
        group: { groupIds: 'group-1' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toEqual(['tx-1', 'tx-3']);
    });

    it('excludes transactions without a group when filtering by group', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-2' }), // No group
        createTransaction({ id: 'tx-3', sharedGroupIds: undefined }), // Explicitly undefined
      ];

      const filters: HistoryFilterState = {
        ...createDefaultFilters(),
        group: { groupIds: 'group-1' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-1');
    });

    it('returns empty array when no transactions match group filter', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-2', sharedGroupIds: ['group-2'] }),
      ];

      const filters: HistoryFilterState = {
        ...createDefaultFilters(),
        group: { groupIds: 'group-nonexistent' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(0);
    });

    it('supports multi-select - filters to transactions in any of selected groups', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-2', sharedGroupIds: ['group-2'] }),
        createTransaction({ id: 'tx-3', sharedGroupIds: ['group-3'] }),
        createTransaction({ id: 'tx-4' }), // No group
      ];

      const filters: HistoryFilterState = {
        ...createDefaultFilters(),
        group: { groupIds: 'group-1,group-2' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toContain('tx-1');
      expect(result.map(t => t.id)).toContain('tx-2');
    });

    it('matches transactions that have multiple sharedGroupIds', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', sharedGroupIds: ['group-1', 'group-2'] }),
        createTransaction({ id: 'tx-2', sharedGroupIds: ['group-3'] }),
      ];

      const filters: HistoryFilterState = {
        ...createDefaultFilters(),
        group: { groupIds: 'group-1' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-1'); // Has group-1 in its sharedGroupIds array
    });
  });

  describe('Combined Filters', () => {
    it('combines group filter with temporal filter', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', date: '2024-12-28', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-2', date: '2024-11-15', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-3', date: '2024-12-28', sharedGroupIds: ['group-2'] }),
      ];

      const filters: HistoryFilterState = {
        temporal: { level: 'month', year: '2024', month: '2024-12' },
        category: { level: 'all' },
        location: {},
        group: { groupIds: 'group-1' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-1'); // December + group-1
    });

    it('combines group filter with category filter', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', category: 'Supermarket' as any, sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-2', category: 'Restaurant' as any, sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-3', category: 'Supermarket' as any, sharedGroupIds: ['group-2'] }),
      ];

      const filters: HistoryFilterState = {
        temporal: { level: 'all' },
        category: { level: 'category', category: 'Supermarket' },
        location: {},
        group: { groupIds: 'group-1' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-1'); // Supermarket + group-1
    });

    it('combines group filter with location filter', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', country: 'Chile', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-2', country: 'Argentina', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-3', country: 'Chile', sharedGroupIds: ['group-2'] }),
      ];

      const filters: HistoryFilterState = {
        temporal: { level: 'all' },
        category: { level: 'all' },
        location: { country: 'Chile' },
        group: { groupIds: 'group-1' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-1'); // Chile + group-1
    });

    it('applies all filters together', () => {
      const transactions = [
        createTransaction({
          id: 'tx-1',
          date: '2024-12-28',
          category: 'Supermarket' as any,
          country: 'Chile',
          sharedGroupIds: ['group-1'],
        }),
        createTransaction({
          id: 'tx-2',
          date: '2024-12-28',
          category: 'Supermarket' as any,
          country: 'Chile',
          sharedGroupIds: ['group-2'], // Wrong group
        }),
        createTransaction({
          id: 'tx-3',
          date: '2024-11-28', // Wrong month
          category: 'Supermarket' as any,
          country: 'Chile',
          sharedGroupIds: ['group-1'],
        }),
        createTransaction({
          id: 'tx-4',
          date: '2024-12-28',
          category: 'Restaurant' as any, // Wrong category
          country: 'Chile',
          sharedGroupIds: ['group-1'],
        }),
        createTransaction({
          id: 'tx-5',
          date: '2024-12-28',
          category: 'Supermarket' as any,
          country: 'Argentina', // Wrong country
          sharedGroupIds: ['group-1'],
        }),
      ];

      const filters: HistoryFilterState = {
        temporal: { level: 'month', year: '2024', month: '2024-12' },
        category: { level: 'category', category: 'Supermarket' },
        location: { country: 'Chile' },
        group: { groupIds: 'group-1' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-1'); // Only one matches all filters
    });
  });

  describe('Edge Cases', () => {
    it('handles empty transactions array', () => {
      const filters: HistoryFilterState = {
        ...createDefaultFilters(),
        group: { groupIds: 'group-1' },
      };

      const result = filterTransactionsByHistoryFilters([], filters);

      expect(result).toHaveLength(0);
    });

    it('handles transactions with empty sharedGroupIds array', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', sharedGroupIds: [] }),
        createTransaction({ id: 'tx-2', sharedGroupIds: ['group-1'] }),
      ];

      const filters: HistoryFilterState = {
        ...createDefaultFilters(),
        group: { groupIds: 'group-1' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-2');
    });

    it('handles empty groupIds in filter (no filter applied)', () => {
      const transactions = [
        createTransaction({ id: 'tx-1', sharedGroupIds: ['group-1'] }),
        createTransaction({ id: 'tx-2', sharedGroupIds: ['group-2'] }),
        createTransaction({ id: 'tx-3' }),
      ];

      const filters: HistoryFilterState = {
        ...createDefaultFilters(),
        group: { groupIds: '' },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      // Empty string should be treated as "no filter"
      expect(result).toHaveLength(3);
    });
  });
});
