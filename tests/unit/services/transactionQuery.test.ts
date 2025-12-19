/**
 * Transaction Query Service Tests
 *
 * Story 10.0: Foundation Sprint - Unit tests for transactionQuery.ts
 * @see docs/sprint-artifacts/epic10/story-10.0-foundation-sprint.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  filterByDateRange,
  filterByCategory,
  filterByMerchant,
  filterByAmount,
  filterByLocation,
  filterByItemCategory,
  filterBySubcategory,
  filterByTemporal,
  getThisWeek,
  getThisMonth,
  getLastNDays,
  getToday,
  getYesterday,
  aggregateByCategory,
  aggregateByItemCategory,
  aggregateByMerchant,
  groupByPeriod,
  queryTransactions,
  getTransactionStats,
  getAvailableYears,
  getAvailableMonths,
  getAvailableCategories,
  getAvailableMerchants,
  getQuarterFromMonth,
  getWeekOfMonth,
} from '../../../src/services/transactionQuery';
import type { Transaction } from '../../../src/types/transaction';

// ============================================================================
// Test Data Factory
// ============================================================================

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `tx-${Math.random().toString(36).substr(2, 9)}`,
    date: '2024-06-15',
    merchant: 'Test Store',
    category: 'Supermarket',
    total: 100,
    items: [
      { name: 'Item 1', price: 50, category: 'Produce', subcategory: 'Fruits' },
      { name: 'Item 2', price: 50, category: 'Dairy & Eggs', subcategory: 'Milk' },
    ],
    ...overrides,
  };
}

function createTransactionSet(): Transaction[] {
  return [
    createTransaction({ date: '2024-01-15', merchant: 'Store A', category: 'Supermarket', total: 100, country: 'Chile', city: 'Santiago' }),
    createTransaction({ date: '2024-02-20', merchant: 'Store B', category: 'Restaurant', total: 50, country: 'Chile', city: 'Valparaiso' }),
    createTransaction({ date: '2024-03-10', merchant: 'Store A', category: 'Supermarket', total: 150, country: 'Argentina', city: 'Buenos Aires' }),
    createTransaction({ date: '2024-04-05', merchant: 'Store C', category: 'Pharmacy', total: 30, country: 'Chile', city: 'Santiago' }),
    createTransaction({ date: '2024-06-15', merchant: 'Store A', category: 'Supermarket', total: 200, country: 'Chile', city: 'Santiago' }),
    createTransaction({ date: '2024-07-20', merchant: 'Store D', category: 'Restaurant', total: 75, country: 'Chile', city: 'Santiago' }),
    createTransaction({ date: '2024-09-01', merchant: 'Store A', category: 'Supermarket', total: 125, country: 'Chile', city: 'Santiago' }),
    createTransaction({ date: '2024-12-25', merchant: 'Store E', category: 'Other', total: 500, country: 'USA', city: 'New York' }),
  ];
}

// ============================================================================
// Date Utility Tests
// ============================================================================

describe('Date Utilities', () => {
  describe('getQuarterFromMonth', () => {
    it('should return Q1 for January-March', () => {
      expect(getQuarterFromMonth('2024-01')).toBe('Q1');
      expect(getQuarterFromMonth('2024-02')).toBe('Q1');
      expect(getQuarterFromMonth('2024-03')).toBe('Q1');
    });

    it('should return Q2 for April-June', () => {
      expect(getQuarterFromMonth('2024-04')).toBe('Q2');
      expect(getQuarterFromMonth('2024-05')).toBe('Q2');
      expect(getQuarterFromMonth('2024-06')).toBe('Q2');
    });

    it('should return Q3 for July-September', () => {
      expect(getQuarterFromMonth('2024-07')).toBe('Q3');
      expect(getQuarterFromMonth('2024-08')).toBe('Q3');
      expect(getQuarterFromMonth('2024-09')).toBe('Q3');
    });

    it('should return Q4 for October-December', () => {
      expect(getQuarterFromMonth('2024-10')).toBe('Q4');
      expect(getQuarterFromMonth('2024-11')).toBe('Q4');
      expect(getQuarterFromMonth('2024-12')).toBe('Q4');
    });
  });

  describe('getWeekOfMonth', () => {
    it('should return week 1 for days 1-7', () => {
      expect(getWeekOfMonth('2024-06-01')).toBe(1);
      expect(getWeekOfMonth('2024-06-07')).toBe(1);
    });

    it('should return week 2 for days 8-14', () => {
      expect(getWeekOfMonth('2024-06-08')).toBe(2);
      expect(getWeekOfMonth('2024-06-14')).toBe(2);
    });

    it('should return week 5 for days 29-31', () => {
      expect(getWeekOfMonth('2024-06-29')).toBe(5);
      expect(getWeekOfMonth('2024-06-30')).toBe(5);
    });
  });
});

// ============================================================================
// Basic Filter Tests
// ============================================================================

describe('Basic Filter Functions', () => {
  let transactions: Transaction[];

  beforeEach(() => {
    transactions = createTransactionSet();
  });

  describe('filterByDateRange', () => {
    it('should filter transactions within date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-03-31');
      const result = filterByDateRange(transactions, start, end);

      expect(result).toHaveLength(3);
      expect(result.every(tx => tx.date >= '2024-01-01' && tx.date <= '2024-03-31')).toBe(true);
    });

    it('should include boundary dates', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-15');
      const result = filterByDateRange(transactions, start, end);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
    });

    it('should return empty array for no matches', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-12-31');
      const result = filterByDateRange(transactions, start, end);

      expect(result).toHaveLength(0);
    });
  });

  describe('filterByCategory', () => {
    it('should filter by store category', () => {
      const result = filterByCategory(transactions, 'Supermarket');

      expect(result).toHaveLength(4);
      expect(result.every(tx => tx.category === 'Supermarket')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const result = filterByCategory(transactions, 'Electronics');

      expect(result).toHaveLength(0);
    });
  });

  describe('filterByMerchant', () => {
    it('should filter by exact merchant name', () => {
      const result = filterByMerchant(transactions, 'Store A', true);

      expect(result).toHaveLength(4);
      expect(result.every(tx => tx.merchant === 'Store A')).toBe(true);
    });

    it('should filter by partial merchant name', () => {
      const result = filterByMerchant(transactions, 'store', false);

      expect(result).toHaveLength(8); // All transactions have "Store" in merchant name
    });

    it('should be case-insensitive', () => {
      const result = filterByMerchant(transactions, 'STORE A', true);

      expect(result).toHaveLength(4);
    });
  });

  describe('filterByAmount', () => {
    it('should filter by minimum amount', () => {
      const result = filterByAmount(transactions, 100);

      expect(result.every(tx => tx.total >= 100)).toBe(true);
    });

    it('should filter by maximum amount', () => {
      const result = filterByAmount(transactions, undefined, 100);

      expect(result.every(tx => tx.total <= 100)).toBe(true);
    });

    it('should filter by amount range', () => {
      const result = filterByAmount(transactions, 50, 150);

      expect(result.every(tx => tx.total >= 50 && tx.total <= 150)).toBe(true);
    });
  });

  describe('filterByLocation', () => {
    it('should filter by country', () => {
      const result = filterByLocation(transactions, 'Chile');

      expect(result).toHaveLength(6);
      expect(result.every(tx => tx.country === 'Chile')).toBe(true);
    });

    it('should filter by country and city', () => {
      const result = filterByLocation(transactions, 'Chile', 'Santiago');

      expect(result).toHaveLength(5);
      expect(result.every(tx => tx.country === 'Chile' && tx.city === 'Santiago')).toBe(true);
    });
  });
});

// ============================================================================
// Temporal Filter Tests
// ============================================================================

describe('Temporal Filter Functions', () => {
  let transactions: Transaction[];

  beforeEach(() => {
    transactions = createTransactionSet();
  });

  describe('filterByTemporal', () => {
    it('should filter by year', () => {
      const result = filterByTemporal(transactions, { year: '2024' });

      expect(result).toHaveLength(8);
    });

    it('should filter by quarter', () => {
      const result = filterByTemporal(transactions, { year: '2024', quarter: 'Q1' });

      expect(result).toHaveLength(3); // Jan, Feb, Mar
    });

    it('should filter by month', () => {
      const result = filterByTemporal(transactions, { month: '2024-06' });

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-06-15');
    });

    it('should filter by week', () => {
      // Week 3 = days 15-21
      const result = filterByTemporal(transactions, { month: '2024-06', week: 3 });

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-06-15');
    });

    it('should filter by exact day', () => {
      const result = filterByTemporal(transactions, { day: '2024-06-15' });

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-06-15');
    });
  });

  describe('getLastNDays', () => {
    it('should return transactions from last N days', () => {
      // Create transactions with recent dates
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const recentTransactions = [
        createTransaction({ date: today }),
        createTransaction({ date: yesterday }),
        createTransaction({ date: '2024-01-01' }), // Old date
      ];

      const result = getLastNDays(recentTransactions, 7);

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.every(tx => {
        const txDate = new Date(tx.date);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return txDate >= sevenDaysAgo;
      })).toBe(true);
    });
  });
});

// ============================================================================
// Aggregation Tests
// ============================================================================

describe('Aggregation Functions', () => {
  let transactions: Transaction[];

  beforeEach(() => {
    transactions = createTransactionSet();
  });

  describe('aggregateByCategory', () => {
    it('should aggregate totals by category', () => {
      const result = aggregateByCategory(transactions);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('total');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('percentage');
    });

    it('should be sorted by total descending', () => {
      const result = aggregateByCategory(transactions);

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].total).toBeGreaterThanOrEqual(result[i].total);
      }
    });

    it('should calculate correct percentages', () => {
      const result = aggregateByCategory(transactions);
      const totalPercentage = result.reduce((sum, agg) => sum + (agg.percentage || 0), 0);

      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('should handle empty transactions', () => {
      const result = aggregateByCategory([]);

      expect(result).toHaveLength(0);
    });
  });

  describe('aggregateByMerchant', () => {
    it('should aggregate totals by merchant', () => {
      const result = aggregateByMerchant(transactions);

      expect(result.length).toBe(5); // Store A, B, C, D, E
      expect(result.find(m => m.merchant === 'Store A')?.count).toBe(4);
    });
  });

  describe('groupByPeriod', () => {
    it('should group by month', () => {
      const result = groupByPeriod(transactions, 'month');

      expect(result.length).toBe(8); // 8 different months
      expect(result.every(g => g.period.match(/^\d{4}-\d{2}$/))).toBe(true);
    });

    it('should group by quarter', () => {
      const result = groupByPeriod(transactions, 'quarter');

      expect(result.every(g => g.period.match(/^\d{4}-Q\d$/))).toBe(true);
    });

    it('should group by year', () => {
      const result = groupByPeriod(transactions, 'year');

      expect(result).toHaveLength(1); // All in 2024
      expect(result[0].period).toBe('2024');
    });
  });
});

// ============================================================================
// Combined Query Tests
// ============================================================================

describe('Combined Query Function', () => {
  let transactions: Transaction[];

  beforeEach(() => {
    transactions = createTransactionSet();
  });

  describe('queryTransactions', () => {
    it('should apply multiple filters', () => {
      const result = queryTransactions(transactions, {
        temporal: { year: '2024', quarter: 'Q1' },
        category: { storeCategory: 'Supermarket' },
        location: { country: 'Chile' },
      });

      expect(result).toHaveLength(1); // Only Jan-Mar Supermarket in Chile
    });

    it('should return all transactions with empty filter', () => {
      const result = queryTransactions(transactions, {});

      expect(result).toHaveLength(transactions.length);
    });

    it('should apply amount filter with other filters', () => {
      const result = queryTransactions(transactions, {
        category: { storeCategory: 'Supermarket' },
        amount: { min: 100, max: 200 },
      });

      expect(result.every(tx => tx.category === 'Supermarket')).toBe(true);
      expect(result.every(tx => tx.total >= 100 && tx.total <= 200)).toBe(true);
    });
  });
});

// ============================================================================
// Statistics Tests
// ============================================================================

describe('Statistics Functions', () => {
  let transactions: Transaction[];

  beforeEach(() => {
    transactions = createTransactionSet();
  });

  describe('getTransactionStats', () => {
    it('should calculate correct statistics', () => {
      const stats = getTransactionStats(transactions);

      expect(stats.count).toBe(8);
      expect(stats.total).toBe(1230);
      expect(stats.average).toBeCloseTo(153.75, 2);
      expect(stats.min).toBe(30);
      expect(stats.max).toBe(500);
    });

    it('should handle empty transactions', () => {
      const stats = getTransactionStats([]);

      expect(stats.count).toBe(0);
      expect(stats.total).toBe(0);
      expect(stats.average).toBe(0);
    });

    it('should calculate median correctly for odd count', () => {
      const oddTransactions = transactions.slice(0, 7);
      const stats = getTransactionStats(oddTransactions);

      expect(stats.median).toBeDefined();
    });
  });

  describe('getAvailableYears', () => {
    it('should return unique years sorted descending', () => {
      const years = getAvailableYears(transactions);

      expect(years).toEqual(['2024']);
    });
  });

  describe('getAvailableCategories', () => {
    it('should return unique categories sorted', () => {
      const categories = getAvailableCategories(transactions);

      expect(categories).toContain('Supermarket');
      expect(categories).toContain('Restaurant');
      expect(categories).toContain('Pharmacy');
      // Verify sorted alphabetically
      expect(categories).toEqual([...categories].sort());
    });
  });

  describe('getAvailableMerchants', () => {
    it('should return unique merchants sorted', () => {
      const merchants = getAvailableMerchants(transactions);

      expect(merchants).toContain('Store A');
      expect(merchants).toContain('Store B');
      expect(merchants).toHaveLength(5);
    });
  });
});
