/**
 * Tests for Report Generation Utilities
 *
 * Story 14.16: Weekly Report Story Format
 * Epic 14: Core Implementation
 *
 * AC #3: Weekly summary card generation
 * AC #4: Category breakdown cards
 * AC #6: Rosa-friendly format
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Transaction } from '@/types/transaction';
import {
  getWeekStart,
  getWeekEnd,
  getISOWeekNumber,
  parseDate,
  isDateInWeek,
  getWeekRange,
  filterTransactionsByWeek,
  calculateTotal,
  getCategoryBreakdown,
  generateWeeklySummary,
  generateReportCards,
  generateEmptyStateCard,
} from '@features/reports/utils/reportUtils';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create mock transaction for testing
 */
function createMockTransaction(
  overrides: Partial<Transaction> = {}
): Transaction {
  return {
    id: 'test-1',
    date: '2025-01-06', // Monday of the current test week
    merchant: 'Test Store',
    category: 'Supermarket',
    total: 10000,
    items: [],
    ...overrides,
  };
}

/**
 * Create set of mock transactions for a week
 */
function createWeekTransactions(weekStart: string): Transaction[] {
  const [year, month, startDay] = weekStart.split('-').map(Number);

  return [
    createMockTransaction({
      id: 'tx-1',
      date: `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
      merchant: 'Jumbo',
      category: 'Supermarket',
      total: 45000,
    }),
    createMockTransaction({
      id: 'tx-2',
      date: `${year}-${String(month).padStart(2, '0')}-${String(startDay + 1).padStart(2, '0')}`,
      merchant: 'Restaurant',
      category: 'Restaurant',
      total: 25000,
    }),
    createMockTransaction({
      id: 'tx-3',
      date: `${year}-${String(month).padStart(2, '0')}-${String(startDay + 2).padStart(2, '0')}`,
      merchant: 'Lider',
      category: 'Supermarket',
      total: 30000,
    }),
    createMockTransaction({
      id: 'tx-4',
      date: `${year}-${String(month).padStart(2, '0')}-${String(startDay + 3).padStart(2, '0')}`,
      merchant: 'Copec',
      category: 'GasStation',
      total: 35000,
    }),
  ];
}

// ============================================================================
// Date Utility Tests
// ============================================================================

describe('Date Utilities', () => {
  describe('getWeekStart', () => {
    it('should return Monday for a Wednesday date', () => {
      // Wednesday, Jan 8, 2025
      const wednesday = new Date(2025, 0, 8);
      const monday = getWeekStart(wednesday);

      expect(monday.getDay()).toBe(1); // Monday
      expect(monday.getDate()).toBe(6); // Jan 6, 2025
    });

    it('should return Monday when given Monday', () => {
      // Monday, Jan 6, 2025
      const monday = new Date(2025, 0, 6);
      const result = getWeekStart(monday);

      expect(result.getDay()).toBe(1);
      expect(result.getDate()).toBe(6);
    });

    it('should return previous Monday for Sunday', () => {
      // Sunday, Jan 12, 2025
      const sunday = new Date(2025, 0, 12);
      const monday = getWeekStart(sunday);

      expect(monday.getDay()).toBe(1);
      expect(monday.getDate()).toBe(6);
    });
  });

  describe('getWeekEnd', () => {
    it('should return Sunday for a Wednesday date', () => {
      const wednesday = new Date(2025, 0, 8);
      const sunday = getWeekEnd(wednesday);

      expect(sunday.getDay()).toBe(0); // Sunday
      expect(sunday.getDate()).toBe(12);
    });
  });

  describe('getISOWeekNumber', () => {
    it('should return correct week number for January', () => {
      const jan6 = new Date(2025, 0, 6);
      expect(getISOWeekNumber(jan6)).toBe(2);
    });

    it('should return week 1 for first week of year', () => {
      const jan1 = new Date(2025, 0, 1);
      // Jan 1 2025 is Wednesday, week 1
      expect(getISOWeekNumber(jan1)).toBe(1);
    });
  });

  describe('parseDate', () => {
    it('should parse YYYY-MM-DD format', () => {
      const date = parseDate('2025-01-15');

      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(15);
    });
  });

  describe('isDateInWeek', () => {
    it('should return true for date within week range', () => {
      const weekStart = new Date(2025, 0, 6); // Monday
      const weekEnd = new Date(2025, 0, 12); // Sunday

      expect(isDateInWeek('2025-01-08', weekStart, weekEnd)).toBe(true);
    });

    it('should return false for date outside week range', () => {
      const weekStart = new Date(2025, 0, 6);
      const weekEnd = new Date(2025, 0, 12);

      expect(isDateInWeek('2025-01-13', weekStart, weekEnd)).toBe(false);
    });

    it('should return true for date on week boundary', () => {
      const weekStart = new Date(2025, 0, 6);
      const weekEnd = new Date(2025, 0, 12);

      expect(isDateInWeek('2025-01-06', weekStart, weekEnd)).toBe(true);
      expect(isDateInWeek('2025-01-12', weekStart, weekEnd)).toBe(true);
    });
  });

  describe('getWeekRange', () => {
    beforeEach(() => {
      // Mock Date to return Jan 8, 2025 (Wednesday)
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 8, 12, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return current week range for weeksAgo=0', () => {
      const range = getWeekRange(0);

      expect(range.start.getDate()).toBe(6); // Monday
      expect(range.end.getDate()).toBe(12); // Sunday
    });

    it('should return previous week for weeksAgo=1', () => {
      const range = getWeekRange(1);

      expect(range.start.getMonth()).toBe(11); // December
      expect(range.start.getDate()).toBe(30); // Dec 30, 2024
    });
  });
});

// ============================================================================
// Transaction Filtering Tests
// ============================================================================

describe('Transaction Filtering', () => {
  describe('filterTransactionsByWeek', () => {
    it('should filter transactions to specified week', () => {
      const weekStart = new Date(2025, 0, 6);
      const weekEnd = new Date(2025, 0, 12);

      const transactions = [
        createMockTransaction({ id: '1', date: '2025-01-06' }), // In week
        createMockTransaction({ id: '2', date: '2025-01-08' }), // In week
        createMockTransaction({ id: '3', date: '2025-01-13' }), // Out of week
        createMockTransaction({ id: '4', date: '2025-01-05' }), // Out of week
      ];

      const filtered = filterTransactionsByWeek(transactions, weekStart, weekEnd);

      expect(filtered).toHaveLength(2);
      expect(filtered.map((t) => t.id)).toEqual(['1', '2']);
    });

    it('should return empty array for no matching transactions', () => {
      const weekStart = new Date(2025, 0, 6);
      const weekEnd = new Date(2025, 0, 12);

      const transactions = [
        createMockTransaction({ date: '2024-12-01' }),
        createMockTransaction({ date: '2025-02-01' }),
      ];

      const filtered = filterTransactionsByWeek(transactions, weekStart, weekEnd);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('calculateTotal', () => {
    it('should sum all transaction totals', () => {
      const transactions = [
        createMockTransaction({ total: 10000 }),
        createMockTransaction({ total: 25000 }),
        createMockTransaction({ total: 15000 }),
      ];

      expect(calculateTotal(transactions)).toBe(50000);
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotal([])).toBe(0);
    });
  });
});

// ============================================================================
// Category Breakdown Tests (AC #4)
// ============================================================================

describe('Category Breakdown (AC #4)', () => {
  describe('getCategoryBreakdown', () => {
    it('should group transactions by category', () => {
      const transactions = [
        createMockTransaction({ category: 'Supermarket', total: 45000 }),
        createMockTransaction({ category: 'Supermarket', total: 30000 }),
        createMockTransaction({ category: 'Restaurant', total: 25000 }),
      ];

      const breakdown = getCategoryBreakdown(transactions);

      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].category).toBe('Supermarket'); // Highest amount first
      expect(breakdown[0].amount).toBe(75000);
      expect(breakdown[0].transactionCount).toBe(2);
    });

    it('should calculate percentages correctly', () => {
      const transactions = [
        createMockTransaction({ category: 'Supermarket', total: 50000 }),
        createMockTransaction({ category: 'Restaurant', total: 50000 }),
      ];

      const breakdown = getCategoryBreakdown(transactions);

      expect(breakdown[0].percent).toBe(50);
      expect(breakdown[1].percent).toBe(50);
    });

    it('should include category emoji', () => {
      const transactions = [
        createMockTransaction({ category: 'Supermarket', total: 10000 }),
      ];

      const breakdown = getCategoryBreakdown(transactions);

      expect(breakdown[0].icon).toBe('🛒');
    });

    it('should sort by amount descending', () => {
      const transactions = [
        createMockTransaction({ category: 'Restaurant', total: 20000 }),
        createMockTransaction({ category: 'Supermarket', total: 50000 }),
        createMockTransaction({ category: 'GasStation', total: 30000 }),
      ];

      const breakdown = getCategoryBreakdown(transactions);

      expect(breakdown[0].category).toBe('Supermarket');
      expect(breakdown[1].category).toBe('GasStation');
      expect(breakdown[2].category).toBe('Restaurant');
    });

    it('should calculate trend when previous data provided', () => {
      const current = [
        createMockTransaction({ category: 'Supermarket', total: 50000 }),
      ];
      const previous = [
        createMockTransaction({ category: 'Supermarket', total: 40000 }),
      ];

      const breakdown = getCategoryBreakdown(current, previous);

      expect(breakdown[0].trend).toBe('up');
      expect(breakdown[0].trendPercent).toBe(25);
    });
  });
});

// ============================================================================
// Weekly Summary Tests (AC #3)
// ============================================================================

describe('Weekly Summary Generation (AC #3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 8, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateWeeklySummary', () => {
    it('should generate summary for current week', () => {
      const transactions = createWeekTransactions('2025-01-06');

      const summary = generateWeeklySummary(transactions, 0);

      expect(summary).not.toBeNull();
      expect(summary!.totalSpent).toBe(135000); // 45k + 25k + 30k + 35k
    });

    it('should return null for insufficient data', () => {
      const summary = generateWeeklySummary([], 0);

      expect(summary).toBeNull();
    });

    it('should calculate trend vs previous week', () => {
      const currentWeek = createWeekTransactions('2025-01-06');
      const previousWeek = createWeekTransactions('2024-12-30');
      // Modify previous week to have different total
      previousWeek.forEach((t) => (t.total = t.total * 0.8)); // 20% less

      const allTransactions = [...currentWeek, ...previousWeek];
      const summary = generateWeeklySummary(allTransactions, 0);

      expect(summary!.trendDirection).toBe('up');
      expect(summary!.trendPercent).toBeGreaterThan(0);
    });

    it('should mark first week correctly', () => {
      // Only current week transactions
      const transactions = createWeekTransactions('2025-01-06');

      const summary = generateWeeklySummary(transactions, 0);

      expect(summary!.isFirstWeek).toBe(true);
    });

    it('should include top 3 categories', () => {
      const transactions = [
        createMockTransaction({ date: '2025-01-06', category: 'Supermarket', total: 50000 }),
        createMockTransaction({ date: '2025-01-06', category: 'Restaurant', total: 40000 }),
        createMockTransaction({ date: '2025-01-06', category: 'GasStation', total: 30000 }),
        createMockTransaction({ date: '2025-01-06', category: 'Pharmacy', total: 20000 }),
        createMockTransaction({ date: '2025-01-06', category: 'Entertainment', total: 10000 }),
      ];

      const summary = generateWeeklySummary(transactions, 0);

      expect(summary!.topCategories).toHaveLength(3);
      expect(summary!.topCategories[0].category).toBe('Supermarket');
      expect(summary!.topCategories[1].category).toBe('Restaurant');
      expect(summary!.topCategories[2].category).toBe('GasStation');
    });

    it('should include date range', () => {
      const transactions = createWeekTransactions('2025-01-06');

      const summary = generateWeeklySummary(transactions, 0);

      expect(summary!.dateRange.start).toBeInstanceOf(Date);
      expect(summary!.dateRange.end).toBeInstanceOf(Date);
    });
  });
});

// ============================================================================
// Report Card Generation Tests
// ============================================================================

describe('Report Card Generation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 8, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateReportCards', () => {
    it('should generate summary card as first card', () => {
      const transactions = createWeekTransactions('2025-01-06');
      const summary = generateWeeklySummary(transactions, 0)!;
      const cards = generateReportCards(summary);

      expect(cards[0].id).toBe('summary');
      expect(cards[0].type).toBe('summary');
      expect(cards[0].title).toBe('Esta Semana');
    });

    it('should format currency in Chilean Peso format', () => {
      const transactions = createWeekTransactions('2025-01-06');
      const summary = generateWeeklySummary(transactions, 0)!;
      const cards = generateReportCards(summary);

      // Should be formatted as $135.000 (Chilean format)
      expect(cards[0].primaryValue).toMatch(/\$[\d.]+/);
    });

    it('should generate category cards', () => {
      const transactions = createWeekTransactions('2025-01-06');
      const summary = generateWeeklySummary(transactions, 0)!;
      const cards = generateReportCards(summary);

      const categoryCards = cards.filter((c) => c.type === 'category');

      expect(categoryCards.length).toBeGreaterThan(0);
      expect(categoryCards.length).toBeLessThanOrEqual(5);
    });

    it('should include category icons on category cards', () => {
      const transactions = createWeekTransactions('2025-01-06');
      const summary = generateWeeklySummary(transactions, 0)!;
      const cards = generateReportCards(summary);

      const categoryCard = cards.find((c) => c.type === 'category');

      expect(categoryCard?.categoryIcon).toBeDefined();
    });

    it('should show "Tu primera semana" for first week', () => {
      const transactions = createWeekTransactions('2025-01-06');
      const summary = generateWeeklySummary(transactions, 0)!;
      const cards = generateReportCards(summary);

      expect(cards[0].secondaryValue).toContain('Tu primera semana');
    });

    it('should include trend indicator when not first week', () => {
      const currentWeek = createWeekTransactions('2025-01-06');
      const previousWeek = createWeekTransactions('2024-12-30');
      previousWeek.forEach((t) => (t.total = t.total * 0.8));

      const allTransactions = [...currentWeek, ...previousWeek];
      const summary = generateWeeklySummary(allTransactions, 0)!;
      const cards = generateReportCards(summary);

      expect(cards[0].trend).toBeDefined();
      expect(cards[0].trendPercent).toBeDefined();
    });
  });

  describe('generateEmptyStateCard', () => {
    it('should return empty state card', () => {
      const card = generateEmptyStateCard();

      expect(card.id).toBe('empty');
      expect(card.primaryValue).toBe('$0');
      expect(card.secondaryValue).toContain('Sin transacciones');
    });
  });
});

// ============================================================================
// Rosa-Friendly Format Tests (AC #6)
// ============================================================================

describe('Rosa-Friendly Format (AC #6)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 8, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use Spanish category names', () => {
    const transactions = [
      createMockTransaction({ date: '2025-01-06', category: 'Supermarket', total: 50000 }),
    ];
    const summary = generateWeeklySummary(transactions, 0)!;
    const cards = generateReportCards(summary);

    const categoryCard = cards.find((c) => c.type === 'category');

    expect(categoryCard?.title).toBe('Supermercado');
  });

  it('should use simple transaction count labels', () => {
    const transactions = [
      createMockTransaction({ date: '2025-01-06', category: 'Supermarket', total: 50000 }),
    ];
    const summary = generateWeeklySummary(transactions, 0)!;
    const cards = generateReportCards(summary);

    const categoryCard = cards.find((c) => c.type === 'category');

    expect(categoryCard?.secondaryValue).toContain('compra');
  });

  it('should pluralize "compras" correctly', () => {
    const transactions = [
      createMockTransaction({ date: '2025-01-06', category: 'Supermarket', total: 25000 }),
      createMockTransaction({ date: '2025-01-07', category: 'Supermarket', total: 25000 }),
    ];
    const summary = generateWeeklySummary(transactions, 0)!;
    const cards = generateReportCards(summary);

    const categoryCard = cards.find((c) => c.type === 'category');

    expect(categoryCard?.secondaryValue).toContain('compras');
  });

  it('should include Rosa-friendly trend descriptions', () => {
    const currentWeek = [
      createMockTransaction({ date: '2025-01-06', category: 'Supermarket', total: 70000 }),
    ];
    const previousWeek = [
      createMockTransaction({ date: '2024-12-30', category: 'Supermarket', total: 50000 }),
    ];

    const allTransactions = [...currentWeek, ...previousWeek];
    const summary = generateWeeklySummary(allTransactions, 0)!;
    const cards = generateReportCards(summary);

    // Should have a description like "Subió harto" for > 20% increase
    expect(cards[0].description).toMatch(/Subió|Bajó|Igual/);
  });
});
