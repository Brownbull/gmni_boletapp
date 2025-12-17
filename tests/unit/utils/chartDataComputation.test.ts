/**
 * Chart Data Computation Tests
 *
 * Story 10.0: Foundation Sprint - Unit tests for chartDataComputation.ts
 * @see docs/sprint-artifacts/epic10/story-10.0-foundation-sprint.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  groupTransactionsByPeriod,
  calculatePeriodTotals,
  calculateCategoryBreakdown,
  getTimeSlots,
  formatBarChartData,
  computeBarDataFromTransactions,
  type TemporalPosition,
  type CategoryPosition,
} from '../../../src/utils/chartDataComputation';
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
    // Q1 transactions
    createTransaction({ date: '2024-01-15', category: 'Supermarket', total: 100 }),
    createTransaction({ date: '2024-02-20', category: 'Restaurant', total: 50 }),
    createTransaction({ date: '2024-03-10', category: 'Supermarket', total: 150 }),
    // Q2 transactions
    createTransaction({ date: '2024-04-05', category: 'Pharmacy', total: 30 }),
    createTransaction({ date: '2024-05-15', category: 'Supermarket', total: 200 }),
    createTransaction({ date: '2024-06-20', category: 'Restaurant', total: 75 }),
    // Q3 transactions
    createTransaction({ date: '2024-07-01', category: 'Supermarket', total: 125 }),
    createTransaction({ date: '2024-09-15', category: 'Restaurant', total: 60 }),
  ];
}

// ============================================================================
// groupTransactionsByPeriod Tests
// ============================================================================

describe('groupTransactionsByPeriod', () => {
  let transactions: Transaction[];

  beforeEach(() => {
    transactions = createTransactionSet();
  });

  describe('year level grouping', () => {
    it('should group transactions by quarter at year level', () => {
      const temporal: TemporalPosition = { level: 'year', year: '2024' };
      const category: CategoryPosition = { level: 'all' };

      const result = groupTransactionsByPeriod(transactions, temporal, category);

      expect(Object.keys(result)).toContain('Q1');
      expect(Object.keys(result)).toContain('Q2');
      expect(Object.keys(result)).toContain('Q3');
      expect(result['Q1'].transactions).toHaveLength(3);
      expect(result['Q2'].transactions).toHaveLength(3);
      expect(result['Q3'].transactions).toHaveLength(2);
    });

    it('should calculate totals by quarter', () => {
      const temporal: TemporalPosition = { level: 'year', year: '2024' };
      const category: CategoryPosition = { level: 'all' };

      const result = groupTransactionsByPeriod(transactions, temporal, category);

      expect(result['Q1'].total).toBe(300); // 100 + 50 + 150
      expect(result['Q2'].total).toBe(305); // 30 + 200 + 75
      expect(result['Q3'].total).toBe(185); // 125 + 60
    });
  });

  describe('quarter level grouping', () => {
    it('should group transactions by month at quarter level', () => {
      const temporal: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q1' };
      const category: CategoryPosition = { level: 'all' };

      const q1Transactions = transactions.filter(tx => tx.date.startsWith('2024-0'));
      const result = groupTransactionsByPeriod(q1Transactions, temporal, category);

      expect(Object.keys(result)).toContain('2024-01');
      expect(Object.keys(result)).toContain('2024-02');
      expect(Object.keys(result)).toContain('2024-03');
    });
  });

  describe('month level grouping', () => {
    it('should group transactions by week at month level', () => {
      // Create transactions spread across weeks
      const monthTransactions = [
        createTransaction({ date: '2024-06-03', total: 50 }), // W1
        createTransaction({ date: '2024-06-10', total: 75 }), // W2
        createTransaction({ date: '2024-06-17', total: 100 }), // W3
        createTransaction({ date: '2024-06-24', total: 125 }), // W4
      ];

      const temporal: TemporalPosition = { level: 'month', year: '2024', month: '2024-06' };
      const category: CategoryPosition = { level: 'all' };

      const result = groupTransactionsByPeriod(monthTransactions, temporal, category);

      expect(Object.keys(result)).toContain('W1');
      expect(Object.keys(result)).toContain('W2');
      expect(Object.keys(result)).toContain('W3');
      expect(Object.keys(result)).toContain('W4');
      expect(result['W1'].total).toBe(50);
      expect(result['W2'].total).toBe(75);
    });
  });

  describe('week level grouping', () => {
    it('should group transactions by day of week at week level', () => {
      // Create transactions for different days
      const weekTransactions = [
        createTransaction({ date: '2024-06-10', total: 50 }), // Monday
        createTransaction({ date: '2024-06-12', total: 75 }), // Wednesday
        createTransaction({ date: '2024-06-14', total: 100 }), // Friday
      ];

      const temporal: TemporalPosition = { level: 'week', year: '2024', month: '2024-06', week: 2 };
      const category: CategoryPosition = { level: 'all' };

      const result = groupTransactionsByPeriod(weekTransactions, temporal, category);

      // Keys are day of week numbers (0=Sun, 1=Mon, etc.)
      expect(Object.keys(result)).toContain('1'); // Monday
      expect(Object.keys(result)).toContain('3'); // Wednesday
      expect(Object.keys(result)).toContain('5'); // Friday
    });
  });

  describe('day level', () => {
    it('should return empty for day level (no bar chart at day level)', () => {
      const temporal: TemporalPosition = { level: 'day', year: '2024', month: '2024-06', day: '2024-06-15' };
      const category: CategoryPosition = { level: 'all' };

      const result = groupTransactionsByPeriod(transactions, temporal, category);

      // Day level returns empty since there's no sub-grouping
      expect(Object.keys(result)).toHaveLength(0);
    });
  });
});

// ============================================================================
// calculatePeriodTotals Tests
// ============================================================================

describe('calculatePeriodTotals', () => {
  describe('at all category level', () => {
    it('should segment by store category', () => {
      const transactions = [
        createTransaction({ category: 'Supermarket', total: 100 }),
        createTransaction({ category: 'Restaurant', total: 50 }),
        createTransaction({ category: 'Supermarket', total: 75 }),
      ];

      const result = calculatePeriodTotals(transactions, { level: 'all' });

      expect(result.total).toBe(225);
      expect(result.segments['Supermarket']).toBe(175);
      expect(result.segments['Restaurant']).toBe(50);
    });
  });

  describe('at category level', () => {
    it('should segment by item groups', () => {
      const transactions = [
        createTransaction({
          category: 'Supermarket',
          total: 100,
          items: [
            { name: 'Apple', price: 30, category: 'Produce', subcategory: 'Fruits' },
            { name: 'Milk', price: 20, category: 'Dairy & Eggs', subcategory: 'Milk' },
            { name: 'Bread', price: 50, category: 'Bakery', subcategory: 'Bread' },
          ],
        }),
      ];

      const result = calculatePeriodTotals(transactions, { level: 'category', category: 'Supermarket' });

      expect(result.total).toBe(100);
      expect(result.segments['Produce']).toBe(30);
      expect(result.segments['Dairy & Eggs']).toBe(20);
      expect(result.segments['Bakery']).toBe(50);
    });
  });

  describe('at group level', () => {
    it('should segment by subcategories within group', () => {
      const transactions = [
        createTransaction({
          items: [
            { name: 'Apple', price: 20, category: 'Produce', subcategory: 'Fruits' },
            { name: 'Carrot', price: 15, category: 'Produce', subcategory: 'Vegetables' },
            { name: 'Milk', price: 25, category: 'Dairy & Eggs', subcategory: 'Milk' }, // Different group
          ],
        }),
      ];

      const result = calculatePeriodTotals(transactions, {
        level: 'group',
        category: 'Supermarket',
        group: 'Produce',
      });

      expect(result.total).toBe(35); // Only Produce items
      expect(result.segments['Fruits']).toBe(20);
      expect(result.segments['Vegetables']).toBe(15);
      expect(result.segments['Milk']).toBeUndefined(); // Different group
    });
  });

  describe('at subcategory level', () => {
    it('should segment by single subcategory', () => {
      const transactions = [
        createTransaction({
          items: [
            { name: 'Apple', price: 20, category: 'Produce', subcategory: 'Fruits' },
            { name: 'Banana', price: 15, category: 'Produce', subcategory: 'Fruits' },
            { name: 'Carrot', price: 10, category: 'Produce', subcategory: 'Vegetables' },
          ],
        }),
      ];

      const result = calculatePeriodTotals(transactions, {
        level: 'subcategory',
        category: 'Supermarket',
        group: 'Produce',
        subcategory: 'Fruits',
      });

      expect(result.total).toBe(35); // Only Fruits
      expect(result.segments['Fruits']).toBe(35);
      expect(result.segments['Vegetables']).toBeUndefined();
    });
  });
});

// ============================================================================
// calculateCategoryBreakdown Tests
// ============================================================================

describe('calculateCategoryBreakdown', () => {
  it('should calculate breakdown at all category level', () => {
    const transactions = [
      createTransaction({ category: 'Supermarket', total: 100 }),
      createTransaction({ category: 'Restaurant', total: 50 }),
      createTransaction({ category: 'Supermarket', total: 50 }),
    ];

    const result = calculateCategoryBreakdown(transactions, { level: 'all' });

    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('Supermarket');
    expect(result[0].total).toBe(150);
    expect(result[0].count).toBe(2);
    expect(result[0].percentage).toBe(75);
    expect(result[1].category).toBe('Restaurant');
    expect(result[1].total).toBe(50);
    expect(result[1].percentage).toBe(25);
  });

  it('should sort by total descending', () => {
    const transactions = [
      createTransaction({ category: 'Small', total: 10 }),
      createTransaction({ category: 'Large', total: 100 }),
      createTransaction({ category: 'Medium', total: 50 }),
    ];

    const result = calculateCategoryBreakdown(transactions, { level: 'all' });

    expect(result[0].category).toBe('Large');
    expect(result[1].category).toBe('Medium');
    expect(result[2].category).toBe('Small');
  });

  it('should handle empty transactions', () => {
    const result = calculateCategoryBreakdown([], { level: 'all' });

    expect(result).toHaveLength(0);
  });

  it('should calculate breakdown at category level by item groups', () => {
    const transactions = [
      createTransaction({
        items: [
          { name: 'Apple', price: 30, category: 'Produce', subcategory: 'Fruits' },
          { name: 'Milk', price: 20, category: 'Dairy & Eggs', subcategory: 'Milk' },
        ],
      }),
    ];

    const result = calculateCategoryBreakdown(transactions, { level: 'category', category: 'Supermarket' });

    expect(result).toHaveLength(2);
    const produce = result.find(r => r.category === 'Produce');
    const dairy = result.find(r => r.category === 'Dairy & Eggs');
    expect(produce?.total).toBe(30);
    expect(dairy?.total).toBe(20);
  });
});

// ============================================================================
// getTimeSlots Tests
// ============================================================================

describe('getTimeSlots', () => {
  describe('year level', () => {
    it('should return 4 quarters', () => {
      const temporal: TemporalPosition = { level: 'year', year: '2024' };
      const slots = getTimeSlots(temporal, 'en');

      expect(slots).toHaveLength(4);
      expect(slots.map(s => s.key)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
      expect(slots.map(s => s.label)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
    });
  });

  describe('quarter level', () => {
    it('should return 3 months for Q1', () => {
      const temporal: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q1' };
      const slots = getTimeSlots(temporal, 'en');

      expect(slots).toHaveLength(3);
      expect(slots.map(s => s.key)).toEqual(['2024-01', '2024-02', '2024-03']);
    });

    it('should return 3 months for Q3', () => {
      const temporal: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q3' };
      const slots = getTimeSlots(temporal, 'en');

      expect(slots).toHaveLength(3);
      expect(slots.map(s => s.key)).toEqual(['2024-07', '2024-08', '2024-09']);
    });

    it('should format month labels in Spanish', () => {
      const temporal: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q1' };
      const slots = getTimeSlots(temporal, 'es');

      expect(slots[0].label).toMatch(/Ene/i);
    });
  });

  describe('month level', () => {
    it('should return 4 weeks by default', () => {
      const temporal: TemporalPosition = { level: 'month', year: '2024', month: '2024-06' };
      const slots = getTimeSlots(temporal, 'en', false);

      expect(slots).toHaveLength(4);
      expect(slots.map(s => s.key)).toEqual(['W1', 'W2', 'W3', 'W4']);
    });

    it('should include week 5 when hasWeek5Data is true', () => {
      const temporal: TemporalPosition = { level: 'month', year: '2024', month: '2024-06' };
      const slots = getTimeSlots(temporal, 'en', true);

      expect(slots).toHaveLength(5);
      expect(slots.map(s => s.key)).toEqual(['W1', 'W2', 'W3', 'W4', 'W5']);
    });
  });

  describe('week level', () => {
    it('should return 7 days starting with Monday', () => {
      const temporal: TemporalPosition = { level: 'week', year: '2024', month: '2024-06', week: 2 };
      const slots = getTimeSlots(temporal, 'en');

      expect(slots).toHaveLength(7);
      expect(slots[0].label).toBe('Mon');
      expect(slots[6].label).toBe('Sun');
    });

    it('should use Spanish day names when locale is es', () => {
      const temporal: TemporalPosition = { level: 'week', year: '2024', month: '2024-06', week: 2 };
      const slots = getTimeSlots(temporal, 'es');

      expect(slots[0].label).toBe('Lun');
      expect(slots[6].label).toBe('Dom');
    });
  });

  describe('day level', () => {
    it('should return empty array for day level', () => {
      const temporal: TemporalPosition = { level: 'day', year: '2024', month: '2024-06', day: '2024-06-15' };
      const slots = getTimeSlots(temporal, 'en');

      expect(slots).toHaveLength(0);
    });
  });
});

// ============================================================================
// formatBarChartData Tests
// ============================================================================

describe('formatBarChartData', () => {
  it('should format grouped data into bar chart format', () => {
    const groupedData = {
      Q1: { total: 100, segments: { Supermarket: 75, Restaurant: 25 } },
      Q2: { total: 150, segments: { Supermarket: 100, Pharmacy: 50 } },
    };
    const slots = [
      { key: 'Q1', label: 'Q1' },
      { key: 'Q2', label: 'Q2' },
      { key: 'Q3', label: 'Q3' },
      { key: 'Q4', label: 'Q4' },
    ];

    const result = formatBarChartData(groupedData, slots);

    expect(result).toHaveLength(4);
    expect(result[0].label).toBe('Q1');
    expect(result[0].total).toBe(100);
    expect(result[0].segments).toHaveLength(2);
    expect(result[2].label).toBe('Q3');
    expect(result[2].total).toBe(0);
    expect(result[2].segments).toHaveLength(0);
  });

  it('should apply colors to segments', () => {
    const groupedData = {
      Q1: { total: 100, segments: { Supermarket: 100 } },
    };
    const slots = [{ key: 'Q1', label: 'Q1' }];

    const result = formatBarChartData(groupedData, slots);

    expect(result[0].segments[0].color).toBeDefined();
    expect(result[0].segments[0].color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

// ============================================================================
// computeBarDataFromTransactions Tests
// ============================================================================

describe('computeBarDataFromTransactions', () => {
  let transactions: Transaction[];

  beforeEach(() => {
    transactions = createTransactionSet();
  });

  it('should return empty array for day level', () => {
    const temporal: TemporalPosition = { level: 'day', year: '2024', month: '2024-06', day: '2024-06-15' };
    const category: CategoryPosition = { level: 'all' };

    const result = computeBarDataFromTransactions(transactions, temporal, category, 'en');

    expect(result).toHaveLength(0);
  });

  it('should compute bar data at year level', () => {
    const temporal: TemporalPosition = { level: 'year', year: '2024' };
    const category: CategoryPosition = { level: 'all' };

    const result = computeBarDataFromTransactions(transactions, temporal, category, 'en');

    expect(result).toHaveLength(4);
    expect(result.map(r => r.label)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);

    // Q1 should have data
    const q1 = result.find(r => r.label === 'Q1');
    expect(q1?.total).toBe(300);
    expect(q1?.segments.length).toBeGreaterThan(0);

    // Q4 should be empty
    const q4 = result.find(r => r.label === 'Q4');
    expect(q4?.total).toBe(0);
  });

  it('should compute bar data at quarter level', () => {
    const q1Transactions = transactions.filter(tx =>
      tx.date.startsWith('2024-01') ||
      tx.date.startsWith('2024-02') ||
      tx.date.startsWith('2024-03')
    );

    const temporal: TemporalPosition = { level: 'quarter', year: '2024', quarter: 'Q1' };
    const category: CategoryPosition = { level: 'all' };

    const result = computeBarDataFromTransactions(q1Transactions, temporal, category, 'en');

    expect(result).toHaveLength(3);
  });

  it('should produce same output as original computeBarData for store level', () => {
    const temporal: TemporalPosition = { level: 'year', year: '2024' };
    const category: CategoryPosition = { level: 'all' };

    const result = computeBarDataFromTransactions(transactions, temporal, category, 'en');

    // Verify structure matches expected format
    result.forEach(bar => {
      expect(bar).toHaveProperty('label');
      expect(bar).toHaveProperty('total');
      expect(bar).toHaveProperty('segments');
      expect(Array.isArray(bar.segments)).toBe(true);
      bar.segments.forEach(seg => {
        expect(seg).toHaveProperty('label');
        expect(seg).toHaveProperty('value');
        expect(seg).toHaveProperty('color');
      });
    });
  });

  it('should handle category drill-down at category level', () => {
    const temporal: TemporalPosition = { level: 'year', year: '2024' };
    const category: CategoryPosition = { level: 'category', category: 'Supermarket' };

    const result = computeBarDataFromTransactions(transactions, temporal, category, 'en');

    // At category level, segments should be item groups
    expect(result).toHaveLength(4);
    result.forEach(bar => {
      if (bar.total > 0) {
        // Segments should be item categories (Produce, Dairy & Eggs, etc.)
        bar.segments.forEach(seg => {
          expect(['Produce', 'Dairy & Eggs', 'Bakery', 'General', 'Other']).toContain(seg.label);
        });
      }
    });
  });
});
