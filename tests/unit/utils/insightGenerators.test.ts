/**
 * Unit tests for Insight Generators
 *
 * Story 10.3: Transaction-Intrinsic Insights
 * Tests all 7 cold-start generators and the generateAllCandidates helper.
 */

import { describe, it, expect } from 'vitest';
import {
  INSIGHT_GENERATORS,
  generateAllCandidates,
  getGenerator,
  getGeneratorsByCategory,
} from '../../../src/utils/insightGenerators';
import { Transaction, TransactionItem } from '../../../src/types/transaction';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Creates a test transaction with sensible defaults.
 */
const createTransaction = (
  overrides: Partial<Transaction> = {}
): Transaction => ({
  id: 'tx-123',
  date: '2025-12-17', // Wednesday
  merchant: 'Jumbo',
  category: 'Supermarket',
  total: 25000,
  items: [
    { name: 'Leche', price: 1500, category: 'Dairy & Eggs' },
    { name: 'Pan', price: 2000, category: 'Bakery' },
  ],
  ...overrides,
});

/**
 * Creates a test transaction item.
 */
const createItem = (
  overrides: Partial<TransactionItem> = {}
): TransactionItem => ({
  name: 'Test Item',
  price: 1000,
  ...overrides,
});

// ============================================================================
// GENERATOR REGISTRY TESTS
// ============================================================================

describe('Generator Registry', () => {
  it('has exactly 12 generators (7 intrinsic + 5 pattern)', () => {
    const generatorIds = Object.keys(INSIGHT_GENERATORS);
    expect(generatorIds).toHaveLength(12);
  });

  it('has all 7 transaction-intrinsic generators', () => {
    expect(INSIGHT_GENERATORS.biggest_item).toBeDefined();
    expect(INSIGHT_GENERATORS.item_count).toBeDefined();
    expect(INSIGHT_GENERATORS.unusual_hour).toBeDefined();
    expect(INSIGHT_GENERATORS.weekend_warrior).toBeDefined();
    expect(INSIGHT_GENERATORS.new_merchant).toBeDefined();
    expect(INSIGHT_GENERATORS.new_city).toBeDefined();
    expect(INSIGHT_GENERATORS.category_variety).toBeDefined();
  });

  it('has all 5 pattern detection generators', () => {
    expect(INSIGHT_GENERATORS.merchant_frequency).toBeDefined();
    expect(INSIGHT_GENERATORS.category_trend).toBeDefined();
    expect(INSIGHT_GENERATORS.day_pattern).toBeDefined();
    expect(INSIGHT_GENERATORS.spending_velocity).toBeDefined();
    expect(INSIGHT_GENERATORS.time_pattern).toBeDefined();
  });

  it('getGenerator returns correct generator', () => {
    const gen = getGenerator('biggest_item');
    expect(gen).toBeDefined();
    expect(gen?.id).toBe('biggest_item');
  });

  it('getGenerator returns undefined for unknown id', () => {
    const gen = getGenerator('unknown_generator');
    expect(gen).toBeUndefined();
  });

  it('getGeneratorsByCategory returns correct generators', () => {
    const quirkyGenerators = getGeneratorsByCategory('QUIRKY_FIRST');
    expect(quirkyGenerators.length).toBeGreaterThan(0);
    expect(quirkyGenerators.every((g) => g.category === 'QUIRKY_FIRST')).toBe(
      true
    );

    const celebratoryGenerators = getGeneratorsByCategory('CELEBRATORY');
    expect(celebratoryGenerators.length).toBeGreaterThan(0);
    expect(
      celebratoryGenerators.every((g) => g.category === 'CELEBRATORY')
    ).toBe(true);
  });
});

// ============================================================================
// TRANSACTION-INTRINSIC GENERATOR TESTS
// ============================================================================

describe('Transaction-Intrinsic Generators', () => {
  // --------------------------------------------------------------------------
  // biggest_item
  // --------------------------------------------------------------------------
  describe('biggest_item', () => {
    const gen = INSIGHT_GENERATORS.biggest_item;

    it('can generate when items exist', () => {
      const tx = createTransaction();
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('cannot generate when no items', () => {
      const tx = createTransaction({ items: [] });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('generates insight with most expensive item', () => {
      const tx = createTransaction({
        items: [
          createItem({ name: 'Cheap', price: 100 }),
          createItem({ name: 'Expensive', price: 5000 }),
          createItem({ name: 'Medium', price: 1000 }),
        ],
      });
      const insight = gen.generate(tx, []);
      expect(insight.id).toBe('biggest_item');
      expect(insight.category).toBe('QUIRKY_FIRST');
      expect(insight.message).toContain('Expensive');
      expect(insight.message).toContain('5.000'); // Chilean locale
      expect(insight.icon).toBe('Star');
    });

    it('handles single item', () => {
      const tx = createTransaction({
        items: [createItem({ name: 'Solo', price: 2500 })],
      });
      const insight = gen.generate(tx, []);
      expect(insight.message).toContain('Solo');
    });

    it('picks first item when prices are equal', () => {
      const tx = createTransaction({
        items: [
          createItem({ name: 'First', price: 1000 }),
          createItem({ name: 'Second', price: 1000 }),
        ],
      });
      const insight = gen.generate(tx, []);
      expect(insight.message).toContain('First');
    });

    it('has Spanish message format', () => {
      const tx = createTransaction();
      const insight = gen.generate(tx, []);
      expect(insight.title).toBe('Compra destacada');
      expect(insight.message).toContain('fue lo más caro');
    });
  });

  // --------------------------------------------------------------------------
  // item_count
  // --------------------------------------------------------------------------
  describe('item_count', () => {
    const gen = INSIGHT_GENERATORS.item_count;

    it('triggers when items > 5', () => {
      const tx = createTransaction({
        items: Array(6).fill(createItem()),
      });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('does not trigger when items = 5', () => {
      const tx = createTransaction({
        items: Array(5).fill(createItem()),
      });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger when items < 5', () => {
      const tx = createTransaction({
        items: Array(3).fill(createItem()),
      });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('generates insight with correct count', () => {
      const tx = createTransaction({
        items: Array(8).fill(createItem()),
      });
      const insight = gen.generate(tx, []);
      expect(insight.id).toBe('item_count');
      expect(insight.category).toBe('QUIRKY_FIRST');
      expect(insight.title).toBe('Carrito lleno');
      expect(insight.message).toContain('8');
      expect(insight.icon).toBe('ShoppingCart');
    });
  });

  // --------------------------------------------------------------------------
  // unusual_hour
  // --------------------------------------------------------------------------
  describe('unusual_hour', () => {
    const gen = INSIGHT_GENERATORS.unusual_hour;

    it('triggers for late night (after 10pm)', () => {
      const tx = createTransaction({ time: '23:30' });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('triggers for exactly 10pm', () => {
      const tx = createTransaction({ time: '22:00' });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('triggers for early morning (before 6am)', () => {
      const tx = createTransaction({ time: '05:30' });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('triggers for midnight', () => {
      const tx = createTransaction({ time: '00:15' });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('does not trigger for normal daytime hours', () => {
      const tx = createTransaction({ time: '14:00' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger for 6am exactly (boundary)', () => {
      const tx = createTransaction({ time: '06:00' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger for 9:59pm (just before boundary)', () => {
      const tx = createTransaction({ time: '21:59' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger when no time', () => {
      const tx = createTransaction({ time: undefined });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger when time is malformed (no colon)', () => {
      const tx = createTransaction({ time: '2300' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger when time is empty string', () => {
      const tx = createTransaction({ time: '' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger when time has invalid hour', () => {
      const tx = createTransaction({ time: '25:00' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger for default sentinel time (04:04)', () => {
      // DEFAULT_TIME is "04:04" - a sentinel value meaning "time not available"
      const tx = createTransaction({ time: '04:04' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('generates late night insight', () => {
      const tx = createTransaction({ time: '23:45' });
      const insight = gen.generate(tx, []);
      expect(insight.id).toBe('unusual_hour');
      expect(insight.title).toBe('Compra nocturna');
      expect(insight.message).toContain('23:45');
      expect(insight.message).toContain('noctámbulo');
      expect(insight.icon).toBe('Moon');
    });

    it('generates early morning insight', () => {
      const tx = createTransaction({ time: '04:30' });
      const insight = gen.generate(tx, []);
      expect(insight.title).toBe('Madrugador');
      expect(insight.message).toContain('04:30');
      expect(insight.message).toContain('tempranero');
    });
  });

  // --------------------------------------------------------------------------
  // weekend_warrior
  // --------------------------------------------------------------------------
  describe('weekend_warrior', () => {
    const gen = INSIGHT_GENERATORS.weekend_warrior;

    it('triggers on Saturday', () => {
      // 2025-12-20 is a Saturday
      const tx = createTransaction({ date: '2025-12-20' });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('triggers on Sunday', () => {
      // 2025-12-21 is a Sunday
      const tx = createTransaction({ date: '2025-12-21' });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('does not trigger on Monday', () => {
      // 2025-12-22 is a Monday
      const tx = createTransaction({ date: '2025-12-22' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger on Wednesday', () => {
      // 2025-12-17 is a Wednesday
      const tx = createTransaction({ date: '2025-12-17' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger on Friday', () => {
      // 2025-12-19 is a Friday
      const tx = createTransaction({ date: '2025-12-19' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('generates insight with correct message', () => {
      const tx = createTransaction({ date: '2025-12-20' });
      const insight = gen.generate(tx, []);
      expect(insight.id).toBe('weekend_warrior');
      expect(insight.category).toBe('QUIRKY_FIRST');
      expect(insight.title).toBe('Compra de fin de semana');
      expect(insight.message).toContain('finde');
      expect(insight.icon).toBe('Calendar');
    });
  });

  // --------------------------------------------------------------------------
  // new_merchant
  // --------------------------------------------------------------------------
  describe('new_merchant', () => {
    const gen = INSIGHT_GENERATORS.new_merchant;

    it('triggers when merchant not in history', () => {
      const tx = createTransaction({ merchant: 'New Store' });
      const history = [createTransaction({ merchant: 'Old Store' })];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });

    it('does not trigger when merchant in history', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      const history = [createTransaction({ merchant: 'Jumbo' })];
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('triggers on first transaction (empty history)', () => {
      const tx = createTransaction({ merchant: 'First Store' });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('is case-sensitive for merchant names', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      const history = [createTransaction({ merchant: 'jumbo' })];
      expect(gen.canGenerate(tx, history)).toBe(true); // Different case = new merchant
    });

    it('generates insight with merchant name', () => {
      const tx = createTransaction({ merchant: 'Lider Express' });
      const insight = gen.generate(tx, []);
      expect(insight.id).toBe('new_merchant');
      expect(insight.category).toBe('CELEBRATORY');
      expect(insight.title).toBe('Nuevo lugar');
      expect(insight.message).toBe('Primera vez en Lider Express');
      expect(insight.icon).toBe('MapPin');
    });
  });

  // --------------------------------------------------------------------------
  // new_city
  // --------------------------------------------------------------------------
  describe('new_city', () => {
    const gen = INSIGHT_GENERATORS.new_city;

    it('triggers when city not in history', () => {
      const tx = createTransaction({ city: 'Valparaíso' });
      const history = [createTransaction({ city: 'Santiago' })];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });

    it('does not trigger when city in history', () => {
      const tx = createTransaction({ city: 'Santiago' });
      const history = [createTransaction({ city: 'Santiago' })];
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('does not trigger when no city on transaction', () => {
      const tx = createTransaction({ city: undefined });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('triggers on first transaction with city (empty history)', () => {
      const tx = createTransaction({ city: 'Concepción' });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('handles history with undefined cities', () => {
      const tx = createTransaction({ city: 'Santiago' });
      const history = [
        createTransaction({ city: undefined }),
        createTransaction({ city: undefined }),
      ];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });

    it('generates insight with city name', () => {
      const tx = createTransaction({ city: 'Viña del Mar' });
      const insight = gen.generate(tx, []);
      expect(insight.id).toBe('new_city');
      expect(insight.category).toBe('CELEBRATORY');
      expect(insight.title).toBe('Nueva ciudad');
      expect(insight.message).toBe('Primera compra en Viña del Mar');
      expect(insight.icon).toBe('Globe');
    });
  });

  // --------------------------------------------------------------------------
  // category_variety
  // --------------------------------------------------------------------------
  describe('category_variety', () => {
    const gen = INSIGHT_GENERATORS.category_variety;

    it('triggers when 3+ unique categories', () => {
      const tx = createTransaction({
        items: [
          createItem({ category: 'Dairy & Eggs' }),
          createItem({ category: 'Bakery' }),
          createItem({ category: 'Produce' }),
        ],
      });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('triggers with more than 3 categories', () => {
      const tx = createTransaction({
        items: [
          createItem({ category: 'Dairy & Eggs' }),
          createItem({ category: 'Bakery' }),
          createItem({ category: 'Produce' }),
          createItem({ category: 'Snacks' }),
          createItem({ category: 'Beverages' }),
        ],
      });
      expect(gen.canGenerate(tx, [])).toBe(true);
    });

    it('does not trigger when < 3 unique categories', () => {
      const tx = createTransaction({
        items: [
          createItem({ category: 'Dairy & Eggs' }),
          createItem({ category: 'Dairy & Eggs' }), // Duplicate
        ],
      });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger with exactly 2 categories', () => {
      const tx = createTransaction({
        items: [
          createItem({ category: 'Dairy & Eggs' }),
          createItem({ category: 'Bakery' }),
        ],
      });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('ignores items without category', () => {
      const tx = createTransaction({
        items: [
          createItem({ category: 'Dairy & Eggs' }),
          createItem({ category: 'Bakery' }),
          createItem({ category: undefined }), // No category
        ],
      });
      expect(gen.canGenerate(tx, [])).toBe(false); // Only 2 categories
    });

    it('handles empty items array', () => {
      const tx = createTransaction({ items: [] });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('generates insight with correct count', () => {
      const tx = createTransaction({
        items: [
          createItem({ category: 'Dairy & Eggs' }),
          createItem({ category: 'Bakery' }),
          createItem({ category: 'Produce' }),
          createItem({ category: 'Snacks' }),
        ],
      });
      const insight = gen.generate(tx, []);
      expect(insight.id).toBe('category_variety');
      expect(insight.category).toBe('QUIRKY_FIRST');
      expect(insight.title).toBe('Compra variada');
      expect(insight.message).toBe('4 categorías diferentes en una boleta');
      expect(insight.icon).toBe('Layers');
    });
  });
});

// ============================================================================
// generateAllCandidates TESTS
// ============================================================================

describe('generateAllCandidates', () => {
  it('returns all applicable insights', () => {
    const tx = createTransaction({
      time: '23:30', // unusual_hour
      date: '2025-12-20', // Saturday (weekend_warrior)
      items: Array(6).fill(createItem({ category: 'Snacks' })), // item_count, biggest_item
    });

    const candidates = generateAllCandidates(tx, []);

    // Should have: biggest_item, item_count, unusual_hour, weekend_warrior, new_merchant
    expect(candidates.length).toBeGreaterThanOrEqual(5);
    expect(candidates.some((c) => c.id === 'biggest_item')).toBe(true);
    expect(candidates.some((c) => c.id === 'item_count')).toBe(true);
    expect(candidates.some((c) => c.id === 'unusual_hour')).toBe(true);
    expect(candidates.some((c) => c.id === 'weekend_warrior')).toBe(true);
    expect(candidates.some((c) => c.id === 'new_merchant')).toBe(true);
  });

  it('returns empty array when no generators apply', () => {
    const tx = createTransaction({
      items: [], // No items - biggest_item won't trigger
      time: '14:00', // Normal hour
      date: '2025-12-17', // Wednesday
    });
    const history = [
      createTransaction({ merchant: 'Jumbo' }), // Same merchant
    ];

    const candidates = generateAllCandidates(tx, history);

    // Only new_city could trigger if city differs, but we're using default (no city)
    expect(candidates.length).toBe(0);
  });

  it('includes transaction ID in all insights', () => {
    const tx = createTransaction({ id: 'unique-tx-id' });
    const candidates = generateAllCandidates(tx, []);

    candidates.forEach((insight) => {
      expect(insight.transactionId).toBe('unique-tx-id');
    });
  });

  it('all insights have required fields', () => {
    const tx = createTransaction({
      time: '23:30',
      date: '2025-12-20',
      city: 'Santiago',
      items: [
        createItem({ category: 'Dairy & Eggs' }),
        createItem({ category: 'Bakery' }),
        createItem({ category: 'Produce' }),
      ],
    });

    const candidates = generateAllCandidates(tx, []);

    candidates.forEach((insight) => {
      expect(insight.id).toBeDefined();
      expect(insight.category).toBeDefined();
      expect(insight.title).toBeDefined();
      expect(insight.message).toBeDefined();
      expect(typeof insight.priority).toBe('number');
    });
  });

  it('respects history for new_merchant and new_city', () => {
    const tx = createTransaction({
      merchant: 'Jumbo',
      city: 'Santiago',
    });
    const history = [
      createTransaction({ merchant: 'Jumbo', city: 'Santiago' }),
    ];

    const candidates = generateAllCandidates(tx, history);

    // Should NOT include new_merchant or new_city since they're in history
    expect(candidates.some((c) => c.id === 'new_merchant')).toBe(false);
    expect(candidates.some((c) => c.id === 'new_city')).toBe(false);
  });
});

// ============================================================================
// PATTERN DETECTION GENERATOR TESTS (Story 10.4)
// ============================================================================

describe('Pattern Detection Generators', () => {
  // --------------------------------------------------------------------------
  // merchant_frequency
  // --------------------------------------------------------------------------
  describe('merchant_frequency', () => {
    const gen = INSIGHT_GENERATORS.merchant_frequency;

    it('triggers when 2+ previous visits to same merchant', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      const history = [
        createTransaction({ merchant: 'Jumbo' }),
        createTransaction({ merchant: 'Jumbo' }),
      ];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });

    it('does not trigger on first visit', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('does not trigger on second visit (only 1 in history)', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      const history = [createTransaction({ merchant: 'Jumbo' })];
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('generates correct ordinal message for 3rd visit', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      const history = [
        createTransaction({ merchant: 'Jumbo' }),
        createTransaction({ merchant: 'Jumbo' }),
      ];
      const insight = gen.generate(tx, history);
      expect(insight.id).toBe('merchant_frequency');
      expect(insight.category).toBe('ACTIONABLE');
      expect(insight.message).toContain('3ra vez');
      expect(insight.message).toContain('Jumbo');
      expect(insight.icon).toBe('Repeat');
    });

    it('generates correct ordinal for 5th visit', () => {
      const tx = createTransaction({ merchant: 'Lider' });
      const history = Array(4)
        .fill(null)
        .map(() => createTransaction({ merchant: 'Lider' }));
      const insight = gen.generate(tx, history);
      expect(insight.message).toContain('5ta vez');
    });

    it('uses fallback ordinal for visits > 10', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      const history = Array(11)
        .fill(null)
        .map(() => createTransaction({ merchant: 'Jumbo' }));
      const insight = gen.generate(tx, history);
      expect(insight.message).toContain('12ª vez');
    });

    it('has priority capped at 8', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      const history = Array(20)
        .fill(null)
        .map(() => createTransaction({ merchant: 'Jumbo' }));
      const insight = gen.generate(tx, history);
      expect(insight.priority).toBeLessThanOrEqual(8);
    });

    it('has Spanish message format', () => {
      const tx = createTransaction({ merchant: 'Jumbo' });
      const history = [
        createTransaction({ merchant: 'Jumbo' }),
        createTransaction({ merchant: 'Jumbo' }),
      ];
      const insight = gen.generate(tx, history);
      expect(insight.title).toBe('Visita frecuente');
      expect(insight.message).toContain('vez en Jumbo');
    });
  });

  // --------------------------------------------------------------------------
  // category_trend
  // --------------------------------------------------------------------------
  describe('category_trend', () => {
    const gen = INSIGHT_GENERATORS.category_trend;

    it('requires 5+ transactions in same category', () => {
      const tx = createTransaction({ category: 'Supermarket' });
      const history4 = Array(4)
        .fill(null)
        .map(() => createTransaction({ category: 'Supermarket' }));
      expect(gen.canGenerate(tx, history4)).toBe(false);

      const history5 = Array(5)
        .fill(null)
        .map(() => createTransaction({ category: 'Supermarket' }));
      expect(gen.canGenerate(tx, history5)).toBe(true);
    });

    it('does not count transactions from different categories', () => {
      const tx = createTransaction({ category: 'Supermarket' });
      const history = [
        createTransaction({ category: 'Supermarket' }),
        createTransaction({ category: 'Supermarket' }),
        createTransaction({ category: 'Restaurant' }),
        createTransaction({ category: 'Restaurant' }),
        createTransaction({ category: 'Gas Station' }),
      ];
      expect(gen.canGenerate(tx, history)).toBe(false); // Only 2 Supermarket
    });

    it('generates "new category" message when no last month data', () => {
      const tx = createTransaction({ category: 'Supermarket', total: 10000 });
      // All history is this month (uses current date as default)
      const history = Array(5)
        .fill(null)
        .map(() => createTransaction({ category: 'Supermarket', total: 5000 }));
      const insight = gen.generate(tx, history);
      expect(insight.title).toBe('Nueva categoría');
      expect(insight.message).toContain('Primer mes');
    });

    it('has Spanish message format', () => {
      const tx = createTransaction({ category: 'Supermercado' });
      const history = Array(5)
        .fill(null)
        .map(() => createTransaction({ category: 'Supermercado' }));
      const insight = gen.generate(tx, history);
      expect(['Nueva categoría', '¡Ahorrando!', 'Tendencia']).toContain(
        insight.title
      );
    });

    it('follows InsightGenerator interface', () => {
      expect(gen.id).toBe('category_trend');
      expect(gen.category).toBe('ACTIONABLE');
      expect(typeof gen.canGenerate).toBe('function');
      expect(typeof gen.generate).toBe('function');
    });
  });

  // --------------------------------------------------------------------------
  // day_pattern
  // --------------------------------------------------------------------------
  describe('day_pattern', () => {
    const gen = INSIGHT_GENERATORS.day_pattern;

    it('triggers when 3+ same weekday in history', () => {
      // 2025-12-17 is a Wednesday
      const tx = createTransaction({ date: '2025-12-17' });
      const history = [
        createTransaction({ date: '2025-12-10' }), // Previous Wednesday
        createTransaction({ date: '2025-12-03' }), // Wednesday before
        createTransaction({ date: '2025-11-26' }), // Wednesday before
      ];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });

    it('does not trigger with < 3 same weekday', () => {
      const tx = createTransaction({ date: '2025-12-17' }); // Wednesday
      const history = [
        createTransaction({ date: '2025-12-10' }), // Wednesday
        createTransaction({ date: '2025-12-03' }), // Wednesday
      ];
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('does not count different weekdays', () => {
      const tx = createTransaction({ date: '2025-12-17' }); // Wednesday
      const history = [
        createTransaction({ date: '2025-12-16' }), // Tuesday
        createTransaction({ date: '2025-12-15' }), // Monday
        createTransaction({ date: '2025-12-14' }), // Sunday
      ];
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('generates insight with correct day name', () => {
      const tx = createTransaction({ date: '2025-12-17' }); // Wednesday
      const history = [
        createTransaction({ date: '2025-12-10' }),
        createTransaction({ date: '2025-12-03' }),
        createTransaction({ date: '2025-11-26' }),
      ];
      const insight = gen.generate(tx, history);
      expect(insight.id).toBe('day_pattern');
      expect(insight.category).toBe('QUIRKY_FIRST');
      expect(insight.title).toBe('Día favorito');
      expect(insight.message).toContain('miércoles');
      expect(insight.message).toContain('4 compras');
      expect(insight.icon).toBe('Calendar');
    });

    it('correctly identifies Sunday', () => {
      const tx = createTransaction({ date: '2025-12-21' }); // Sunday
      const history = [
        createTransaction({ date: '2025-12-14' }), // Sunday
        createTransaction({ date: '2025-12-07' }), // Sunday
        createTransaction({ date: '2025-11-30' }), // Sunday
      ];
      const insight = gen.generate(tx, history);
      expect(insight.message).toContain('domingo');
    });

    it('correctly identifies Saturday', () => {
      const tx = createTransaction({ date: '2025-12-20' }); // Saturday
      const history = [
        createTransaction({ date: '2025-12-13' }), // Saturday
        createTransaction({ date: '2025-12-06' }), // Saturday
        createTransaction({ date: '2025-11-29' }), // Saturday
      ];
      const insight = gen.generate(tx, history);
      expect(insight.message).toContain('sábado');
    });

    it('correctly identifies all weekdays', () => {
      // Test Monday through Friday
      const days = [
        { date: '2025-12-22', name: 'lunes' }, // Monday
        { date: '2025-12-23', name: 'martes' }, // Tuesday
        { date: '2025-12-17', name: 'miércoles' }, // Wednesday
        { date: '2025-12-18', name: 'jueves' }, // Thursday
        { date: '2025-12-19', name: 'viernes' }, // Friday
      ];

      days.forEach(({ date, name }) => {
        const tx = createTransaction({ date });
        // Create history with 3 same-day transactions
        const baseDate = new Date(date);
        const history = [1, 2, 3].map((weeksAgo) => {
          const d = new Date(baseDate);
          d.setDate(d.getDate() - weeksAgo * 7);
          return createTransaction({
            date: d.toISOString().split('T')[0],
          });
        });
        const insight = gen.generate(tx, history);
        expect(insight.message).toContain(name);
      });
    });
  });

  // --------------------------------------------------------------------------
  // spending_velocity
  // --------------------------------------------------------------------------
  describe('spending_velocity', () => {
    const gen = INSIGHT_GENERATORS.spending_velocity;

    it('requires at least 1 week of data', () => {
      const tx = createTransaction({ date: '2025-12-18' });
      // All transactions are recent
      const recentHistory = [
        createTransaction({ date: '2025-12-17' }),
        createTransaction({ date: '2025-12-16' }),
      ];
      expect(gen.canGenerate(tx, recentHistory)).toBe(false);
    });

    it('triggers when history has transactions older than 7 days', () => {
      const tx = createTransaction({ date: '2025-12-18' });
      const olderHistory = [
        createTransaction({ date: '2025-12-05' }), // More than 7 days ago
      ];
      expect(gen.canGenerate(tx, olderHistory)).toBe(true);
    });

    it('generates weekly total when no last week data', () => {
      const tx = createTransaction({ date: '2025-12-18', total: 25000 });
      const history = [
        createTransaction({ date: '2025-12-01', total: 10000 }), // Old enough to trigger
      ];
      const insight = gen.generate(tx, history);
      expect(insight.title).toBe('Esta semana');
      expect(insight.message).toContain('Llevas');
      expect(insight.message).toContain('esta semana');
      expect(insight.icon).toBe('Gauge');
    });

    it('has Spanish message format', () => {
      const tx = createTransaction({ total: 50000 });
      const history = [createTransaction({ date: '2025-12-01', total: 10000 })];
      const insight = gen.generate(tx, history);
      expect(['Esta semana', '¡Buen ritmo!', 'Ritmo semanal']).toContain(
        insight.title
      );
    });

    it('follows InsightGenerator interface', () => {
      expect(gen.id).toBe('spending_velocity');
      expect(gen.category).toBe('ACTIONABLE');
      expect(typeof gen.canGenerate).toBe('function');
      expect(typeof gen.generate).toBe('function');
    });
  });

  // --------------------------------------------------------------------------
  // time_pattern
  // --------------------------------------------------------------------------
  describe('time_pattern', () => {
    const gen = INSIGHT_GENERATORS.time_pattern;

    it('triggers when 3+ transactions within same hour range', () => {
      const tx = createTransaction({ time: '14:30' });
      const history = [
        createTransaction({ time: '14:00' }),
        createTransaction({ time: '15:00' }),
        createTransaction({ time: '14:45' }),
      ];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });

    it('does not trigger with < 3 in same hour range', () => {
      const tx = createTransaction({ time: '14:30' });
      const history = [
        createTransaction({ time: '14:00' }),
        createTransaction({ time: '15:00' }),
      ];
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('does not trigger without time', () => {
      const tx = createTransaction({ time: undefined });
      expect(gen.canGenerate(tx, [])).toBe(false);
    });

    it('counts transactions within 1 hour range', () => {
      const tx = createTransaction({ time: '14:00' });
      const history = [
        createTransaction({ time: '13:00' }), // Within range (1 hour before)
        createTransaction({ time: '15:00' }), // Within range (1 hour after)
        createTransaction({ time: '14:30' }), // Within range
      ];
      expect(gen.canGenerate(tx, history)).toBe(true);
    });

    it('does not count transactions outside 1 hour range', () => {
      const tx = createTransaction({ time: '14:00' });
      const history = [
        createTransaction({ time: '10:00' }), // Too early
        createTransaction({ time: '18:00' }), // Too late
        createTransaction({ time: '16:30' }), // Outside range
      ];
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('generates insight with correct time of day - morning', () => {
      const tx = createTransaction({ time: '09:00' });
      const history = [
        createTransaction({ time: '08:30' }),
        createTransaction({ time: '09:30' }),
        createTransaction({ time: '10:00' }),
      ];
      const insight = gen.generate(tx, history);
      expect(insight.id).toBe('time_pattern');
      expect(insight.category).toBe('QUIRKY_FIRST');
      expect(insight.title).toBe('Tu hora favorita');
      expect(insight.message).toContain('mañana');
      expect(insight.icon).toBe('Clock');
    });

    it('generates insight with correct time of day - afternoon', () => {
      const tx = createTransaction({ time: '15:00' });
      const history = [
        createTransaction({ time: '14:30' }),
        createTransaction({ time: '15:30' }),
        createTransaction({ time: '16:00' }),
      ];
      const insight = gen.generate(tx, history);
      expect(insight.message).toContain('tarde');
    });

    it('generates insight with correct time of day - evening', () => {
      const tx = createTransaction({ time: '20:00' });
      const history = [
        createTransaction({ time: '19:30' }),
        createTransaction({ time: '20:30' }),
        createTransaction({ time: '21:00' }),
      ];
      const insight = gen.generate(tx, history);
      expect(insight.message).toContain('noche');
    });

    it('generates insight with correct time of day - early morning', () => {
      // Using 03:00 instead of 04:04 to avoid default sentinel time
      const tx = createTransaction({ time: '03:00' });
      const history = [
        createTransaction({ time: '02:30' }),
        createTransaction({ time: '03:30' }),
        createTransaction({ time: '04:00' }),
      ];
      const insight = gen.generate(tx, history);
      expect(insight.message).toContain('madrugada');
    });

    it('generates insight with correct time of day - midday', () => {
      const tx = createTransaction({ time: '12:30' });
      const history = [
        createTransaction({ time: '12:00' }),
        createTransaction({ time: '13:00' }),
        createTransaction({ time: '13:30' }),
      ];
      const insight = gen.generate(tx, history);
      expect(insight.message).toContain('mediodía');
    });

    it('ignores history transactions without time', () => {
      const tx = createTransaction({ time: '14:00' });
      const history = [
        createTransaction({ time: undefined }),
        createTransaction({ time: undefined }),
        createTransaction({ time: undefined }),
      ];
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('does not trigger for default sentinel time (04:04)', () => {
      // DEFAULT_TIME is "04:04" - a sentinel value meaning "time not available"
      const tx = createTransaction({ time: '04:04' });
      const history = [
        createTransaction({ time: '04:00' }),
        createTransaction({ time: '05:00' }),
        createTransaction({ time: '03:30' }),
      ];
      // Even though history has valid times in similar range, current tx has default time
      expect(gen.canGenerate(tx, history)).toBe(false);
    });

    it('ignores history transactions with default sentinel time', () => {
      const tx = createTransaction({ time: '04:00' });
      const history = [
        createTransaction({ time: '04:04' }), // Default sentinel - should be ignored
        createTransaction({ time: '04:04' }), // Default sentinel - should be ignored
        createTransaction({ time: '04:04' }), // Default sentinel - should be ignored
      ];
      // Default times in history should not count toward pattern detection
      expect(gen.canGenerate(tx, history)).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // All pattern generators follow InsightGenerator interface
  // --------------------------------------------------------------------------
  describe('All generators follow InsightGenerator interface', () => {
    const patternGenerators = [
      INSIGHT_GENERATORS.merchant_frequency,
      INSIGHT_GENERATORS.category_trend,
      INSIGHT_GENERATORS.day_pattern,
      INSIGHT_GENERATORS.spending_velocity,
      INSIGHT_GENERATORS.time_pattern,
    ];

    patternGenerators.forEach((gen) => {
      it(`${gen.id} has required interface properties`, () => {
        expect(gen.id).toBeDefined();
        expect(typeof gen.id).toBe('string');
        expect(gen.category).toBeDefined();
        expect(['QUIRKY_FIRST', 'CELEBRATORY', 'ACTIONABLE']).toContain(
          gen.category
        );
        expect(typeof gen.canGenerate).toBe('function');
        expect(typeof gen.generate).toBe('function');
      });
    });
  });
});

// ============================================================================
// SPANISH MESSAGE FORMAT TESTS
// ============================================================================

describe('Spanish Message Format (Chilean Locale)', () => {
  it('all transaction-intrinsic titles are in Spanish', () => {
    const expectedTitles = [
      'Compra destacada',
      'Carrito lleno',
      'Compra nocturna',
      'Madrugador',
      'Compra de fin de semana',
      'Nuevo lugar',
      'Nueva ciudad',
      'Compra variada',
    ];

    const tx = createTransaction({
      time: '05:00',
      date: '2025-12-20',
      city: 'Valparaíso',
      items: [
        createItem({ category: 'Dairy & Eggs', price: 5000 }),
        createItem({ category: 'Bakery', price: 1000 }),
        createItem({ category: 'Produce', price: 2000 }),
        createItem({ price: 100 }),
        createItem({ price: 100 }),
        createItem({ price: 100 }),
      ],
    });

    const candidates = generateAllCandidates(tx, []);
    // Filter to only transaction-intrinsic (exclude pattern detection)
    const patternIds = [
      'merchant_frequency',
      'category_trend',
      'day_pattern',
      'spending_velocity',
      'time_pattern',
    ];
    const intrinsicCandidates = candidates.filter(
      (c) => !patternIds.includes(c.id)
    );
    intrinsicCandidates.forEach((insight) => {
      expect(expectedTitles).toContain(insight.title);
    });
  });

  it('pattern detection generators have Spanish titles', () => {
    const expectedTitles = [
      'Visita frecuente',
      'Nueva categoría',
      '¡Ahorrando!',
      'Tendencia',
      'Día favorito',
      'Esta semana',
      '¡Buen ritmo!',
      'Ritmo semanal',
      'Tu hora favorita',
    ];

    // Test each pattern generator
    const merchantGen = INSIGHT_GENERATORS.merchant_frequency;
    const categoryGen = INSIGHT_GENERATORS.category_trend;
    const dayGen = INSIGHT_GENERATORS.day_pattern;
    const velocityGen = INSIGHT_GENERATORS.spending_velocity;
    const timeGen = INSIGHT_GENERATORS.time_pattern;

    // Create sample insights
    const tx = createTransaction();
    const history = Array(5)
      .fill(null)
      .map(() => createTransaction());

    const merchantInsight = merchantGen.generate(tx, history);
    const categoryInsight = categoryGen.generate(tx, history);
    const dayInsight = dayGen.generate(tx, history);
    const velocityInsight = velocityGen.generate(tx, history);
    const timeInsight = timeGen.generate(tx, history);

    expect(expectedTitles).toContain(merchantInsight.title);
    expect(expectedTitles).toContain(categoryInsight.title);
    expect(expectedTitles).toContain(dayInsight.title);
    expect(expectedTitles).toContain(velocityInsight.title);
    expect(expectedTitles).toContain(timeInsight.title);
  });

  it('uses Chilean number formatting', () => {
    const tx = createTransaction({
      items: [createItem({ name: 'Producto', price: 15000 })],
    });
    const insight = INSIGHT_GENERATORS.biggest_item.generate(tx, []);

    // Chilean format uses dot as thousands separator
    expect(insight.message).toContain('15.000');
  });

  it('spending_velocity uses Chilean number formatting', () => {
    const tx = createTransaction({ total: 150000 });
    const history = [createTransaction({ date: '2025-12-01', total: 10000 })];
    const insight = INSIGHT_GENERATORS.spending_velocity.generate(tx, history);

    // Should contain Chilean formatted number (with dot separator)
    expect(insight.message).toMatch(/\d{1,3}\.\d{3}/);
  });
});
