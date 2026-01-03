/**
 * Tests for Report Service
 *
 * Story 14.16: Weekly Report Story Format
 * Epic 14: Core Implementation
 *
 * AC #3: Weekly summary card showing total spent, vs last week, top categories
 * AC #4: Category breakdown cards - one card per major spending category
 */

import { describe, it, expect } from 'vitest';
import {
  generateWeeklySummary,
  generateReportCards,
  getCategoryEmoji,
  CATEGORY_EMOJIS,
} from '../../../src/services/reportService';
import type { Transaction } from '../../../src/types/transaction';

// Helper to create test transactions
function createTransaction(
  overrides: Partial<Transaction> = {}
): Transaction {
  return {
    id: 'tx-1',
    date: '2025-01-01',
    merchant: 'Test Store',
    category: 'Supermarket',
    total: 10000,
    items: [],
    ...overrides,
  };
}

// Generate transactions for a specific week
function generateWeekTransactions(
  weekStartDate: Date,
  categoryTotals: Record<string, number>
): Transaction[] {
  const transactions: Transaction[] = [];
  let id = 1;

  for (const [category, total] of Object.entries(categoryTotals)) {
    transactions.push(
      createTransaction({
        id: `tx-${id++}`,
        date: weekStartDate.toISOString().split('T')[0],
        category: category as Transaction['category'],
        total,
        merchant: `${category} Store`,
      })
    );
  }

  return transactions;
}

describe('reportService', () => {
  describe('generateWeeklySummary', () => {
    it('should calculate total spent for current week', () => {
      const transactions = [
        createTransaction({ total: 20000 }),
        createTransaction({ total: 15000 }),
        createTransaction({ total: 10000 }),
      ];

      const summary = generateWeeklySummary(
        transactions,
        [], // No previous week
        new Date('2025-01-01')
      );

      expect(summary.totalSpent).toBe(45000);
    });

    it('should calculate trend vs previous week', () => {
      const currentWeek = [
        createTransaction({ total: 50000 }),
      ];
      const previousWeek = [
        createTransaction({ total: 40000 }),
      ];

      const summary = generateWeeklySummary(
        currentWeek,
        previousWeek,
        new Date('2025-01-08')
      );

      expect(summary.previousWeekSpent).toBe(40000);
      expect(summary.trendPercent).toBe(25); // +25%
      expect(summary.trendDirection).toBe('up');
    });

    it('should identify trend as down when spending decreased', () => {
      const currentWeek = [createTransaction({ total: 30000 })];
      const previousWeek = [createTransaction({ total: 40000 })];

      const summary = generateWeeklySummary(
        currentWeek,
        previousWeek,
        new Date('2025-01-08')
      );

      expect(summary.trendDirection).toBe('down');
      expect(summary.trendPercent).toBe(-25);
    });

    it('should identify trend as neutral for small changes', () => {
      const currentWeek = [createTransaction({ total: 40500 })];
      const previousWeek = [createTransaction({ total: 40000 })];

      const summary = generateWeeklySummary(
        currentWeek,
        previousWeek,
        new Date('2025-01-08')
      );

      expect(summary.trendDirection).toBe('neutral');
    });

    it('should return top 3 categories by spending', () => {
      const transactions = [
        createTransaction({ category: 'Supermarket', total: 30000 }),
        createTransaction({ category: 'Restaurant', total: 20000 }),
        createTransaction({ category: 'Transport', total: 15000 }),
        createTransaction({ category: 'Pharmacy', total: 5000 }),
      ];

      const summary = generateWeeklySummary(
        transactions,
        [],
        new Date('2025-01-01')
      );

      expect(summary.topCategories).toHaveLength(3);
      expect(summary.topCategories[0].category).toBe('Supermarket');
      expect(summary.topCategories[1].category).toBe('Restaurant');
      expect(summary.topCategories[2].category).toBe('Transport');
    });

    it('should calculate percentage of total for each category', () => {
      const transactions = [
        createTransaction({ category: 'Supermarket', total: 50000 }),
        createTransaction({ category: 'Restaurant', total: 50000 }),
      ];

      const summary = generateWeeklySummary(
        transactions,
        [],
        new Date('2025-01-01')
      );

      expect(summary.topCategories[0].percent).toBe(50);
      expect(summary.topCategories[1].percent).toBe(50);
    });

    it('should set isFirstWeek when no previous week data', () => {
      const summary = generateWeeklySummary(
        [createTransaction({ total: 10000 })],
        [], // Empty previous week
        new Date('2025-01-01')
      );

      expect(summary.isFirstWeek).toBe(true);
    });

    it('should not set isFirstWeek when previous week has data', () => {
      const summary = generateWeeklySummary(
        [createTransaction({ total: 10000 })],
        [createTransaction({ total: 8000 })],
        new Date('2025-01-08')
      );

      expect(summary.isFirstWeek).toBe(false);
    });

    it('should include date range for the week', () => {
      const summary = generateWeeklySummary(
        [createTransaction({ total: 10000 })],
        [],
        new Date('2025-01-08') // Wednesday
      );

      expect(summary.dateRange.start).toBeInstanceOf(Date);
      expect(summary.dateRange.end).toBeInstanceOf(Date);
    });

    it('should include week number', () => {
      const summary = generateWeeklySummary(
        [createTransaction({ total: 10000 })],
        [],
        new Date('2025-01-08')
      );

      expect(summary.weekNumber).toBeGreaterThan(0);
    });
  });

  describe('generateReportCards', () => {
    it('should generate summary card as first card', () => {
      const summary = generateWeeklySummary(
        [createTransaction({ total: 45200 })],
        [createTransaction({ total: 42000 })],
        new Date('2025-01-08')
      );

      const cards = generateReportCards(summary);

      expect(cards[0].type).toBe('summary');
      expect(cards[0].title).toBe('Esta Semana');
      expect(cards[0].primaryValue).toBe('$45.200');
    });

    it('should generate category breakdown cards', () => {
      const transactions = [
        createTransaction({ category: 'Supermarket', total: 22500 }),
        createTransaction({ category: 'Restaurant', total: 12800 }),
        createTransaction({ category: 'Transport', total: 9900 }),
      ];

      const summary = generateWeeklySummary(
        transactions,
        [],
        new Date('2025-01-08')
      );

      const cards = generateReportCards(summary);

      // First card is summary, rest are categories
      expect(cards.length).toBeGreaterThan(1);

      const categoryCards = cards.filter((c) => c.type === 'category');
      expect(categoryCards.length).toBe(3);
      expect(categoryCards[0].title).toBe('Supermercado');
      expect(categoryCards[0].categoryIcon).toBe('🛒');
    });

    it('should include trend for summary card', () => {
      const summary = generateWeeklySummary(
        [createTransaction({ total: 45000 })],
        [createTransaction({ total: 40000 })],
        new Date('2025-01-08')
      );

      const cards = generateReportCards(summary);

      expect(cards[0].trend).toBe('up');
      expect(cards[0].trendPercent).toBe(13); // ~12.5% rounded
    });

    it('should include Rosa-friendly description for first week', () => {
      const summary = generateWeeklySummary(
        [createTransaction({ total: 45000 })],
        [], // First week
        new Date('2025-01-01')
      );

      const cards = generateReportCards(summary);

      expect(cards[0].description).toBe('Tu primera semana');
    });

    it('should format currency correctly for Chilean pesos', () => {
      const summary = generateWeeklySummary(
        [createTransaction({ total: 1234567 })],
        [],
        new Date('2025-01-01')
      );

      const cards = generateReportCards(summary);

      // Should have thousand separators
      expect(cards[0].primaryValue).toMatch(/\$[\d.,]+/);
    });
  });

  describe('getCategoryEmoji', () => {
    it('should return correct emoji for known categories', () => {
      expect(getCategoryEmoji('Supermarket')).toBe('🛒');
      expect(getCategoryEmoji('Restaurant')).toBe('🍔');
      expect(getCategoryEmoji('Transport')).toBe('🚗');
      expect(getCategoryEmoji('Pharmacy')).toBe('💊');
    });

    it('should return default emoji for unknown categories', () => {
      expect(getCategoryEmoji('UnknownCategory' as any)).toBe('📦');
    });
  });

  describe('CATEGORY_EMOJIS', () => {
    it('should have emojis for all common store categories', () => {
      const commonCategories = [
        'Supermarket',
        'Restaurant',
        'GasStation',
        'Pharmacy',
        'Transport',
        'Entertainment',
        'Clothing',
      ];

      for (const category of commonCategories) {
        expect(CATEGORY_EMOJIS[category]).toBeDefined();
      }
    });
  });
});
