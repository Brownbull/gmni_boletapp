/**
 * Tests for Report i18n — English locale output
 *
 * Story TD-17-3: Verify formatCategoryName passes lang in generation + insights functions.
 * Validates AC-1 through AC-5.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CategoryBreakdown } from '@/types/report';
import type { Language } from '@/utils/translations';

// Mock getSettingsState for locale-aware tests
let mockLang: Language = 'es';
vi.mock('@shared/stores/useSettingsStore', () => ({
  getSettingsState: () => ({ lang: mockLang }),
  useSettingsStore: { getState: () => ({ lang: mockLang }) },
}));

function makeCategoryBreakdown(
  overrides: Partial<CategoryBreakdown> = {}
): CategoryBreakdown {
  return {
    category: 'Supermarket',
    icon: '🛒',
    amount: 10000,
    percent: 50,
    transactionCount: 5,
    ...overrides,
  };
}

describe('generateMonthlyPersonaInsight — i18n (TD-17-3)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('uses Spanish category name when lang=es and category has >25% change', async () => {
    const { generateMonthlyPersonaInsight } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [makeCategoryBreakdown({ amount: 15000, percent: 60 })];
    const prevCategories = [makeCategoryBreakdown({ amount: 10000, percent: 50 })];

    const result = generateMonthlyPersonaInsight(
      categories,
      'up',
      50,
      false,
      5, // June
      prevCategories
    );

    expect(result).toContain('Supermercado');
    expect(result).not.toContain('Supermarket');
  });

  it('uses English category name when lang=en and category has >25% change', async () => {
    mockLang = 'en';
    const { generateMonthlyPersonaInsight } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [makeCategoryBreakdown({ amount: 15000, percent: 60 })];
    const prevCategories = [makeCategoryBreakdown({ amount: 10000, percent: 50 })];

    const result = generateMonthlyPersonaInsight(
      categories,
      'up',
      50,
      false,
      5, // June
      prevCategories
    );

    expect(result).toContain('Supermarket');
    expect(result).not.toContain('Supermercado');
  });

  it('uses English category name in dominant-category insight when lang=en', async () => {
    mockLang = 'en';
    const { generateMonthlyPersonaInsight } = await import(
      '@features/reports/utils/reportInsights'
    );

    // No prev categories → falls through to dominant category check
    const categories = [makeCategoryBreakdown({ percent: 50 })];

    const result = generateMonthlyPersonaInsight(
      categories,
      'neutral',
      2,
      false,
      5,
      undefined
    );

    expect(result).toContain('Supermarket');
    expect(result).not.toContain('Supermercado');
  });
});

describe('generateMonthlyHighlights — i18n (TD-17-3)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('uses "compras" in Spanish for most-visits highlight', async () => {
    const { generateMonthlyHighlights } = await import(
      '@features/reports/utils/reportInsights'
    );

    const topSpend = makeCategoryBreakdown({
      category: 'Supermarket',
      amount: 20000,
      percent: 60,
      transactionCount: 3,
    });
    const mostVisits = makeCategoryBreakdown({
      category: 'Restaurant',
      amount: 10000,
      percent: 30,
      transactionCount: 10,
    });

    // Need transactions with dates for weekly breakdown
    const transactions = [
      { date: '2025-06-10', total: 5000, merchant: 'Store' },
      { date: '2025-06-17', total: 5000, merchant: 'Store' },
    ] as import('@/types/transaction').Transaction[];

    const result = generateMonthlyHighlights(
      [topSpend, mostVisits],
      transactions,
      2025,
      5
    );

    const visitHighlight = result.find((h) => h.label === 'Más visitas');
    expect(visitHighlight).toBeDefined();
    expect(visitHighlight!.value).toContain('compras');
  });

  it('uses "purchases" in English for most-visits highlight (AC-4)', async () => {
    mockLang = 'en';
    const { generateMonthlyHighlights } = await import(
      '@features/reports/utils/reportInsights'
    );

    const topSpend = makeCategoryBreakdown({
      category: 'Supermarket',
      amount: 20000,
      percent: 60,
      transactionCount: 3,
    });
    const mostVisits = makeCategoryBreakdown({
      category: 'Restaurant',
      amount: 10000,
      percent: 30,
      transactionCount: 10,
    });

    const transactions = [
      { date: '2025-06-10', total: 5000, merchant: 'Store' },
      { date: '2025-06-17', total: 5000, merchant: 'Store' },
    ] as import('@/types/transaction').Transaction[];

    const result = generateMonthlyHighlights(
      [topSpend, mostVisits],
      transactions,
      2025,
      5
    );

    const visitHighlight = result.find((h) => h.label === 'Más visitas');
    expect(visitHighlight).toBeDefined();
    expect(visitHighlight!.value).toContain('purchases');
    expect(visitHighlight!.value).not.toContain('compras');
  });

  it('uses English category name in leader highlight when lang=en', async () => {
    mockLang = 'en';
    const { generateMonthlyHighlights } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [makeCategoryBreakdown({ percent: 70 })];
    const transactions = [
      { date: '2025-06-10', total: 10000, merchant: 'Store' },
      { date: '2025-06-17', total: 5000, merchant: 'Store' },
    ] as import('@/types/transaction').Transaction[];

    const result = generateMonthlyHighlights(categories, transactions, 2025, 5);

    const leaderHighlight = result.find((h) => h.label === 'Categoría líder');
    expect(leaderHighlight).toBeDefined();
    expect(leaderHighlight!.value).toContain('Supermarket');
    expect(leaderHighlight!.value).not.toContain('Supermercado');
  });
});

describe('generateYearlySummary — i18n (TD-17-3)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10)); // March 10, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses English category name in yearly persona insight when lang=en', async () => {
    mockLang = 'en';
    const { generateYearlySummary } = await import(
      '@features/reports/utils/reportGeneration'
    );

    // Need transactions in BOTH 2025 (current year) and 2024 (previous year)
    // so isFirst=false triggers the formatCategoryName path
    const currentYearTxs = Array.from({ length: 5 }, (_, i) => ({
      date: `2025-04-${String(i + 1).padStart(2, '0')}`,
      total: 5000 + i * 1000,
      merchant: `Store ${i}`,
      category: 'Supermarket',
      items: [],
    }));
    const prevYearTxs = Array.from({ length: 3 }, (_, i) => ({
      date: `2024-04-${String(i + 1).padStart(2, '0')}`,
      total: 3000 + i * 500,
      merchant: `Store ${i}`,
      category: 'Supermarket',
      items: [],
    }));
    const transactions = [...currentYearTxs, ...prevYearTxs] as import('@/types/transaction').Transaction[];

    // yearsAgo=1 targets 2025 (fake time is 2026-03-10); yearsAgo=0 would target current year and return null
    const result = generateYearlySummary(transactions, 1);

    expect(result).not.toBeNull();
    expect(result!.personaInsight).toContain('supermarket');
    expect(result!.personaInsight).not.toContain('supermercado');
  });
});

describe('reportGeneration + reportYearGeneration — i18n (TD-17-3)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generateReportCards uses English category + purchase label when lang=en (AC-1, AC-4)', async () => {
    mockLang = 'en';
    const { generateReportCards } = await import('@features/reports/utils/reportGeneration');
    const summary = {
      totalSpent: 50000, previousWeekSpent: 40000, trendPercent: 25,
      trendDirection: 'up' as const, topCategories: [makeCategoryBreakdown({ transactionCount: 1 })],
      dateRange: { start: new Date(2025, 5, 2), end: new Date(2025, 5, 8) },
      weekNumber: 23, isFirstWeek: false, transactionCount: 5,
    };
    const cards = generateReportCards(summary as import('@/types/report').WeeklySummary);
    const cat = cards.find((c) => c.type === 'category');
    expect(cat!.title).toBe('Supermarket');
    expect(cat!.secondaryValue).toContain('purchase');
  });

  it('getAvailableReportsForYear weekly uses English category when lang=en (AC-3)', async () => {
    mockLang = 'en';
    const { getAvailableReportsForYear } = await import('@features/reports/utils/reportYearGeneration');
    const txs = Array.from({ length: 5 }, (_, i) => ({
      date: `2025-03-${String(10 + i).padStart(2, '0')}`, total: 5000 + i * 1000,
      merchant: `Store ${i}`, category: 'Supermarket', items: [],
    })) as import('@/types/transaction').Transaction[];
    const reports = getAvailableReportsForYear(txs, 'weekly', 2025);
    expect(reports.length).toBeGreaterThan(0);
    expect(reports.find((r) => r.personaInsight?.includes('Supermarket'))).toBeDefined();
  });
});
