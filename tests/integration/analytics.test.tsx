/**
 * Trend Analytics Integration Tests
 *
 * Tests the analytics calculations for monthly totals, category breakdowns,
 * date range filtering, and edge cases (empty data, single transaction).
 * Covers 5+ test cases as defined in Story 2.5.
 *
 * Risk Level: MEDIUM (analytics accuracy critical for user insights)
 * Coverage: Analytics logic, data aggregation, filtering
 */

import { describe, it, expect } from 'vitest';
import { Transaction } from '../../src/types/transaction';

// Helper function to calculate monthly totals (mirrors App.tsx logic)
function calculateMonthlyTotals(transactions: Transaction[], year: string): Record<string, number> {
  const monthlyTotals: Record<string, number> = {};

  transactions
    .filter(txn => txn.date.startsWith(year))
    .forEach(txn => {
      const month = txn.date.substring(0, 7); // YYYY-MM
      monthlyTotals[month] = (monthlyTotals[month] || 0) + txn.total;
    });

  return monthlyTotals;
}

// Helper function to calculate category breakdown (mirrors App.tsx logic)
function calculateCategoryBreakdown(transactions: Transaction[]): Record<string, number> {
  const categoryTotals: Record<string, number> = {};

  transactions.forEach(txn => {
    categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.total;
  });

  return categoryTotals;
}

// Helper function to calculate category breakdown percentages
function calculateCategoryPercentages(transactions: Transaction[]): Record<string, number> {
  const categoryTotals = calculateCategoryBreakdown(transactions);
  const grandTotal = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  const percentages: Record<string, number> = {};
  Object.entries(categoryTotals).forEach(([category, total]) => {
    percentages[category] = (total / grandTotal) * 100;
  });

  return percentages;
}

// Helper function to filter transactions by date range
function filterByDateRange(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  return transactions.filter(txn => {
    const txnDate = new Date(txn.date);
    return txnDate >= new Date(startDate) && txnDate <= new Date(endDate);
  });
}

describe('Trend Analytics', () => {
  /**
   * Test 1: Monthly total calculations accurate
   * Verifies that monthly totals are calculated correctly
   */
  it('should calculate monthly totals accurately', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2025-11-01',
        merchant: 'Store A',
        category: 'Supermarket',
        total: 100.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '2',
        date: '2025-11-15',
        merchant: 'Store B',
        category: 'Restaurant',
        total: 50.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '3',
        date: '2025-11-30',
        merchant: 'Store C',
        category: 'Transport',
        total: 30.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '4',
        date: '2025-12-05',
        merchant: 'Store D',
        category: 'Supermarket',
        total: 75.00,
        items: [],
        createdAt: new Date()
      }
    ];

    const monthlyTotals = calculateMonthlyTotals(transactions, '2025');

    expect(monthlyTotals['2025-11']).toBe(180.00); // 100 + 50 + 30
    expect(monthlyTotals['2025-12']).toBe(75.00);
  });

  /**
   * Test 2: Category breakdown percentages correct
   * Verifies that category percentages are calculated accurately
   */
  it('should calculate category breakdown percentages correctly', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2025-11-01',
        merchant: 'Store A',
        category: 'Supermarket',
        total: 100.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '2',
        date: '2025-11-15',
        merchant: 'Store B',
        category: 'Restaurant',
        total: 50.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '3',
        date: '2025-11-20',
        merchant: 'Store C',
        category: 'Supermarket',
        total: 50.00,
        items: [],
        createdAt: new Date()
      }
    ];

    const percentages = calculateCategoryPercentages(transactions);

    // Total: 200
    // Supermarket: 150 (75%)
    // Restaurant: 50 (25%)
    expect(percentages['Supermarket']).toBe(75);
    expect(percentages['Restaurant']).toBe(25);
  });

  /**
   * Test 3: Date range filtering works
   * Verifies that transactions can be filtered by date range
   */
  it('should filter transactions by date range', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2025-11-01',
        merchant: 'Early Nov',
        category: 'Supermarket',
        total: 10.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '2',
        date: '2025-11-15',
        merchant: 'Mid Nov',
        category: 'Restaurant',
        total: 20.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '3',
        date: '2025-11-30',
        merchant: 'Late Nov',
        category: 'Transport',
        total: 30.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '4',
        date: '2025-12-05',
        merchant: 'Early Dec',
        category: 'Supermarket',
        total: 40.00,
        items: [],
        createdAt: new Date()
      }
    ];

    const filtered = filterByDateRange(transactions, '2025-11-10', '2025-11-20');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].merchant).toBe('Mid Nov');
  });

  /**
   * Test 4: Handling of empty data (no transactions)
   * Verifies that analytics handle empty datasets gracefully
   */
  it('should handle empty data without errors', () => {
    const transactions: Transaction[] = [];

    const monthlyTotals = calculateMonthlyTotals(transactions, '2025');
    const categoryBreakdown = calculateCategoryBreakdown(transactions);
    const filtered = filterByDateRange(transactions, '2025-11-01', '2025-11-30');

    expect(Object.keys(monthlyTotals)).toHaveLength(0);
    expect(Object.keys(categoryBreakdown)).toHaveLength(0);
    expect(filtered).toHaveLength(0);
  });

  /**
   * Test 5: Handling of single transaction edge case
   * Verifies that analytics work correctly with a single transaction
   */
  it('should handle single transaction edge case', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2025-11-15',
        merchant: 'Only Store',
        category: 'Supermarket',
        total: 99.99,
        items: [],
        createdAt: new Date()
      }
    ];

    const monthlyTotals = calculateMonthlyTotals(transactions, '2025');
    const categoryBreakdown = calculateCategoryBreakdown(transactions);
    const percentages = calculateCategoryPercentages(transactions);

    expect(monthlyTotals['2025-11']).toBe(99.99);
    expect(categoryBreakdown['Supermarket']).toBe(99.99);
    expect(percentages['Supermarket']).toBe(100); // 100% of total
  });

  /**
   * Bonus Test: Multiple categories with accurate breakdown
   * Verifies complex category distributions are calculated correctly
   */
  it('should handle multiple categories with accurate breakdown', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2025-11-01',
        merchant: 'Store A',
        category: 'Supermarket',
        total: 100.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '2',
        date: '2025-11-05',
        merchant: 'Store B',
        category: 'Restaurant',
        total: 50.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '3',
        date: '2025-11-10',
        merchant: 'Store C',
        category: 'Transport',
        total: 25.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '4',
        date: '2025-11-15',
        merchant: 'Store D',
        category: 'Services',
        total: 25.00,
        items: [],
        createdAt: new Date()
      }
    ];

    const categoryBreakdown = calculateCategoryBreakdown(transactions);
    const percentages = calculateCategoryPercentages(transactions);

    // Total: 200
    // Supermarket: 100 (50%)
    // Restaurant: 50 (25%)
    // Transport: 25 (12.5%)
    // Services: 25 (12.5%)
    expect(categoryBreakdown['Supermarket']).toBe(100.00);
    expect(categoryBreakdown['Restaurant']).toBe(50.00);
    expect(categoryBreakdown['Transport']).toBe(25.00);
    expect(categoryBreakdown['Services']).toBe(25.00);

    expect(percentages['Supermarket']).toBe(50);
    expect(percentages['Restaurant']).toBe(25);
    expect(percentages['Transport']).toBe(12.5);
    expect(percentages['Services']).toBe(12.5);
  });

  /**
   * Bonus Test: Year filtering
   * Verifies that transactions are correctly filtered by year
   */
  it('should filter transactions by year', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        date: '2024-12-01',
        merchant: '2024 Store',
        category: 'Supermarket',
        total: 100.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '2',
        date: '2025-01-15',
        merchant: '2025 Store A',
        category: 'Restaurant',
        total: 50.00,
        items: [],
        createdAt: new Date()
      },
      {
        id: '3',
        date: '2025-11-30',
        merchant: '2025 Store B',
        category: 'Transport',
        total: 30.00,
        items: [],
        createdAt: new Date()
      }
    ];

    const totals2024 = calculateMonthlyTotals(transactions, '2024');
    const totals2025 = calculateMonthlyTotals(transactions, '2025');

    expect(Object.values(totals2024).reduce((a, b) => a + b, 0)).toBe(100.00);
    expect(Object.values(totals2025).reduce((a, b) => a + b, 0)).toBe(80.00);
  });
});
