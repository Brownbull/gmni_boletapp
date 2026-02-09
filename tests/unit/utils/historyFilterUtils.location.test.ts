/**
 * historyFilterUtils - Location Filter Tests
 *
 * Story 14.36: Location Filter Hierarchy with Multi-Select
 * Tests for the multi-select location filtering functionality.
 */

import { describe, it, expect } from 'vitest';
import { filterTransactionsByHistoryFilters } from '../../../src/utils/historyFilterUtils';
import type { Transaction } from '../../../src/types/transaction';
import type { HistoryFilterState } from '../../../src/contexts/HistoryFiltersContext';

// ============================================================================
// Test Data
// ============================================================================

const createTransaction = (
  id: string,
  country?: string,
  city?: string
): Transaction => ({
  id,
  date: '2024-12-15',
  merchant: 'Test Store',
  total: 100,
  currency: 'CLP',
  category: 'Supermercado',
  country,
  city,
  items: [],
});

const baseFilterState: HistoryFilterState = {
  temporal: { level: 'all' },
  category: { level: 'all' },
  location: {},
};

// Sample transactions with various locations
const transactions: Transaction[] = [
  createTransaction('tx1', 'Chile', 'Santiago'),
  createTransaction('tx2', 'Chile', 'Valparaiso'),
  createTransaction('tx3', 'Chile', 'Concepcion'),
  createTransaction('tx4', 'Argentina', 'Buenos Aires'),
  createTransaction('tx5', 'Argentina', 'Mendoza'),
  createTransaction('tx6', 'Peru', 'Lima'),
  createTransaction('tx7'), // No location data
];

// ============================================================================
// Tests
// ============================================================================

describe('filterTransactionsByHistoryFilters - Location Filter (Story 14.36)', () => {
  describe('Multi-Select City Filter (selectedCities)', () => {
    it('filters to single city when selectedCities has one city', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          selectedCities: 'Santiago',
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('Santiago');
    });

    it('filters to multiple cities from same country', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          selectedCities: 'Santiago,Valparaiso',
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(2);
      expect(result.map(tx => tx.city).sort()).toEqual(['Santiago', 'Valparaiso']);
    });

    it('filters to cities from multiple countries', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          selectedCities: 'Santiago,Buenos Aires,Lima',
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(3);
      expect(result.map(tx => tx.city).sort()).toEqual(['Buenos Aires', 'Lima', 'Santiago']);
    });

    it('matches cities case-insensitively', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          selectedCities: 'santiago,BUENOS AIRES',
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(2);
    });

    it('excludes transactions without city when filtering by selectedCities', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          selectedCities: 'Santiago,Lima',
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      // tx7 has no city, should be excluded
      expect(result.every(tx => tx.city !== undefined)).toBe(true);
    });

    it('handles whitespace in comma-separated cities', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          selectedCities: ' Santiago , Mendoza , Lima ',
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(3);
    });

    it('returns all transactions when selectedCities is empty string', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          selectedCities: '',
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(transactions.length);
    });
  });

  describe('Legacy Location Filter (country/city)', () => {
    it('filters by country only', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          country: 'Chile',
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(3);
      expect(result.every(tx => tx.country === 'Chile')).toBe(true);
    });

    it('filters by country and city', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          country: 'Chile',
          city: 'Santiago',
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('Santiago');
    });

    it('excludes transactions without location when country filter is applied', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          country: 'Chile',
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      // tx7 has no country, should be excluded
      expect(result.every(tx => tx.country === 'Chile')).toBe(true);
    });
  });

  describe('selectedCities priority over legacy', () => {
    it('selectedCities takes priority over legacy country/city fields', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {
          country: 'Chile', // Legacy: would filter to Chile only
          city: 'Santiago', // Legacy: would filter to Santiago only
          selectedCities: 'Buenos Aires,Lima', // Should take priority
        },
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      // Should use selectedCities, not legacy fields
      expect(result).toHaveLength(2);
      expect(result.map(tx => tx.city).sort()).toEqual(['Buenos Aires', 'Lima']);
    });
  });

  describe('No location filter', () => {
    it('includes all transactions when no location filter is applied', () => {
      const filters: HistoryFilterState = {
        ...baseFilterState,
        location: {},
      };

      const result = filterTransactionsByHistoryFilters(transactions, filters);

      expect(result).toHaveLength(transactions.length);
    });
  });

  describe('Combined with other filters', () => {
    it('combines location filter with category filter', () => {
      const mixedTransactions: Transaction[] = [
        { ...createTransaction('tx1', 'Chile', 'Santiago'), category: 'Supermercado' },
        { ...createTransaction('tx2', 'Chile', 'Santiago'), category: 'Restaurant' },
        { ...createTransaction('tx3', 'Argentina', 'Buenos Aires'), category: 'Supermercado' },
      ];

      const filters: HistoryFilterState = {
        ...baseFilterState,
        category: { level: 'category', category: 'Supermercado' },
        location: {
          selectedCities: 'Santiago',
        },
      };

      const result = filterTransactionsByHistoryFilters(mixedTransactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('Santiago');
      expect(result[0].category).toBe('Supermercado');
    });

    it('combines location filter with temporal filter', () => {
      const datedTransactions: Transaction[] = [
        { ...createTransaction('tx1', 'Chile', 'Santiago'), date: '2024-12-15' },
        { ...createTransaction('tx2', 'Chile', 'Santiago'), date: '2024-11-15' },
        { ...createTransaction('tx3', 'Argentina', 'Buenos Aires'), date: '2024-12-15' },
      ];

      const filters: HistoryFilterState = {
        ...baseFilterState,
        temporal: { level: 'month', year: '2024', month: '2024-12' },
        location: {
          selectedCities: 'Santiago',
        },
      };

      const result = filterTransactionsByHistoryFilters(datedTransactions, filters);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-12-15');
      expect(result[0].city).toBe('Santiago');
    });
  });
});
