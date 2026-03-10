/**
 * Tests for Report i18n — Quarterly/Yearly English locale output
 *
 * Story TD-17-4: AC-3 (generateQuarterlyHighlights),
 * AC-4 (generateQuarterlyPersonaInsight), AC-5 (generateYearlyPersonaInsight).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CategoryBreakdown } from '@/types/report';
import type { Language } from '@/utils/translations';

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
    icon: 'cart',
    amount: 10000,
    percent: 50,
    transactionCount: 5,
    ...overrides,
  };
}

describe('generateQuarterlyHighlights — i18n (TD-17-4, AC-3)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('uses English highlight labels when lang=en', async () => {
    mockLang = 'en';
    const { generateQuarterlyHighlights } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [
      makeCategoryBreakdown({ amount: 20000, percent: 60 }),
      makeCategoryBreakdown({ category: 'Restaurant', amount: 10000, percent: 30, transactionCount: 8 }),
    ];
    const prevQuarterCategories = [
      makeCategoryBreakdown({ amount: 15000, percent: 50 }),
    ];

    // Need transactions spread across 2+ months for highest/lowest month highlights
    const transactions = [
      { date: '2025-04-10', total: 15000, merchant: 'Store A' },
      { date: '2025-05-10', total: 10000, merchant: 'Store B' },
      { date: '2025-06-10', total: 5000, merchant: 'Store C' },
    ] as import('@/types/transaction').Transaction[];

    const result = generateQuarterlyHighlights(transactions, categories, 2025, 2, prevQuarterCategories);

    // Verify English labels
    const highMonth = result.find((h) => h.label === 'Highest month');
    expect(highMonth).toBeDefined();

    const leader = result.find((h) => h.label === 'Leading category');
    expect(leader).toBeDefined();
    expect(leader!.value).toContain('Supermarket');

    // Verify Spanish labels NOT present
    expect(result.find((h) => h.label === 'Mes más alto')).toBeUndefined();
    expect(result.find((h) => h.label === 'Categoría líder')).toBeUndefined();
  });

  it('uses Spanish highlight labels when lang=es', async () => {
    mockLang = 'es';
    const { generateQuarterlyHighlights } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [makeCategoryBreakdown()];
    const transactions = [
      { date: '2025-04-10', total: 15000, merchant: 'Store A' },
      { date: '2025-05-10', total: 10000, merchant: 'Store B' },
    ] as import('@/types/transaction').Transaction[];

    const result = generateQuarterlyHighlights(transactions, categories, 2025, 2);

    const highMonth = result.find((h) => h.label === 'Mes más alto');
    expect(highMonth).toBeDefined();

    const leader = result.find((h) => h.label === 'Categoría líder');
    expect(leader).toBeDefined();
  });
});

describe('generateQuarterlyPersonaInsight — i18n (TD-17-4, AC-4)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('returns English first-quarter insight when lang=en and isFirst=true', async () => {
    mockLang = 'en';
    const { generateQuarterlyPersonaInsight } = await import(
      '@features/reports/utils/reportInsights'
    );

    const result = generateQuarterlyPersonaInsight([], true, 1);
    expect(result).toBe('Your financial story starts here.');
  });

  it('returns English star category insight when lang=en', async () => {
    mockLang = 'en';
    const { generateQuarterlyPersonaInsight } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [makeCategoryBreakdown({ percent: 45 })];
    const result = generateQuarterlyPersonaInsight(categories, false, 2);

    expect(result).toContain('Supermarket');
    expect(result).toContain('star category');
    expect(result).not.toContain('categoría estrella');
  });

  it('returns English seasonal Q4 insight when lang=en and change > 20%', async () => {
    mockLang = 'en';
    const { generateQuarterlyPersonaInsight } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [makeCategoryBreakdown({ amount: 15000, percent: 55 })];
    const prevCategories = [makeCategoryBreakdown({ amount: 10000, percent: 50 })];

    const result = generateQuarterlyPersonaInsight(categories, false, 4, prevCategories);

    expect(result).toContain('Year-end holidays');
    expect(result).not.toContain('fiestas de fin de año');
  });
});

describe('generateQuarterlyHighlights — dynamic locale month names (TD-17-5, AC-1)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('returns English month names when lang=en', async () => {
    mockLang = 'en';
    const { generateQuarterlyHighlights } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [makeCategoryBreakdown({ amount: 20000, percent: 60 })];
    // Transactions spread across April, May, June (Q2) — 2+ months needed for highlights
    const transactions = [
      { date: '2025-04-10', total: 15000, merchant: 'Store A' },
      { date: '2025-05-10', total: 10000, merchant: 'Store B' },
      { date: '2025-06-10', total: 5000, merchant: 'Store C' },
    ] as import('@/types/transaction').Transaction[];

    const result = generateQuarterlyHighlights(transactions, categories, 2025, 2);
    const highMonth = result.find((h) => h.label === 'Highest month');

    expect(highMonth).toBeDefined();
    // English month name "April", not Spanish "Abril"
    expect(highMonth!.value).toContain('April');
    expect(highMonth!.value).not.toContain('Abril');
  });

  it('returns Spanish month names when lang=es', async () => {
    mockLang = 'es';
    const { generateQuarterlyHighlights } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [makeCategoryBreakdown({ amount: 20000, percent: 60 })];
    const transactions = [
      { date: '2025-04-10', total: 15000, merchant: 'Store A' },
      { date: '2025-05-10', total: 10000, merchant: 'Store B' },
      { date: '2025-06-10', total: 5000, merchant: 'Store C' },
    ] as import('@/types/transaction').Transaction[];

    const result = generateQuarterlyHighlights(transactions, categories, 2025, 2);
    const highMonth = result.find((h) => h.label === 'Mes más alto');

    expect(highMonth).toBeDefined();
    expect(highMonth!.value).toContain('Abril');
  });
});

describe('generateYearlyHighlights — dynamic locale month names (TD-17-5, AC-1)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('returns English month names when lang=en', async () => {
    mockLang = 'en';
    const { generateYearlyHighlights } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [makeCategoryBreakdown({ amount: 30000, percent: 60 })];
    const transactions = [
      { date: '2025-04-10', total: 15000, merchant: 'Store A' },
      { date: '2025-05-10', total: 10000, merchant: 'Store B' },
      { date: '2025-06-10', total: 5000, merchant: 'Store C' },
    ] as import('@/types/transaction').Transaction[];

    const result = generateYearlyHighlights(transactions, categories, 2025);
    const highMonth = result.find((h) => h.label === 'Highest month');

    expect(highMonth).toBeDefined();
    expect(highMonth!.value).toContain('April');
    expect(highMonth!.value).not.toContain('Abril');
  });

  it('returns Spanish month names when lang=es', async () => {
    mockLang = 'es';
    const { generateYearlyHighlights } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [makeCategoryBreakdown({ amount: 30000, percent: 60 })];
    const transactions = [
      { date: '2025-04-10', total: 15000, merchant: 'Store A' },
      { date: '2025-05-10', total: 10000, merchant: 'Store B' },
      { date: '2025-06-10', total: 5000, merchant: 'Store C' },
    ] as import('@/types/transaction').Transaction[];

    const result = generateYearlyHighlights(transactions, categories, 2025);
    const highMonth = result.find((h) => h.label === 'Mes más alto');

    expect(highMonth).toBeDefined();
    expect(highMonth!.value).toContain('Abril');
  });
});

describe('generateYearlyPersonaInsight — i18n (TD-17-4, AC-5)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('returns English first-year insight when lang=en and isFirst=true', async () => {
    mockLang = 'en';
    const { generateYearlyPersonaInsight } = await import(
      '@features/reports/utils/reportInsights'
    );

    const result = generateYearlyPersonaInsight([], true);
    expect(result).toBe('Your first full year of smart decisions.');
  });

  it('returns English two-category insight when lang=en and second category >= 20%', async () => {
    mockLang = 'en';
    const { generateYearlyPersonaInsight } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [
      makeCategoryBreakdown({ category: 'Supermarket', percent: 45 }),
      makeCategoryBreakdown({ category: 'Restaurant', percent: 25 }),
    ];

    const result = generateYearlyPersonaInsight(categories, false);

    expect(result).toContain('supermarket');
    expect(result).toContain('restaurant');
    expect(result).toContain('smart decisions');
    expect(result).not.toContain('decisiones inteligentes');
    expect(result).not.toContain('supermercado');
  });

  it('returns English single-category insight when lang=en and only one significant category', async () => {
    mockLang = 'en';
    const { generateYearlyPersonaInsight } = await import(
      '@features/reports/utils/reportInsights'
    );

    const categories = [
      makeCategoryBreakdown({ category: 'Supermarket', percent: 60 }),
      makeCategoryBreakdown({ category: 'Restaurant', percent: 15 }),
    ];

    const result = generateYearlyPersonaInsight(categories, false);

    expect(result).toContain('supermarket');
    expect(result).toContain('financial tracking');
    expect(result).not.toContain('seguimiento financiero');
  });
});

// ============================================================================
// TD-17-6: Remaining hardcoded locale strings in reportYearGeneration
// ============================================================================

describe('Weekly comparisonLabel — locale-aware week prefix (TD-17-6, AC-1)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('uses "W" prefix when lang=en for mid-year week', async () => {
    mockLang = 'en';
    const { getAvailableReportsForYear } = await import(
      '@features/reports/utils/reportYearGeneration'
    );

    // Need at least 2 consecutive weeks of data so one has a comparison label
    const transactions = [
      { date: '2025-03-03', total: 5000, merchant: 'A' }, // Week 10
      { date: '2025-03-10', total: 6000, merchant: 'B' }, // Week 11
    ] as import('@/types/transaction').Transaction[];

    const reports = getAvailableReportsForYear(transactions, 'weekly', 2025);
    // Find a report that compares to a previous week (not week 1)
    const midYearReport = reports.find((r) => r.comparisonLabel?.startsWith('vs W'));
    expect(midYearReport).toBeDefined();
    expect(midYearReport!.comparisonLabel).not.toMatch(/vs S\d/);
  });

  it('uses "S" prefix when lang=es for mid-year week', async () => {
    mockLang = 'es';
    const { getAvailableReportsForYear } = await import(
      '@features/reports/utils/reportYearGeneration'
    );

    const transactions = [
      { date: '2025-03-03', total: 5000, merchant: 'A' }, // Week 10
      { date: '2025-03-10', total: 6000, merchant: 'B' }, // Week 11
    ] as import('@/types/transaction').Transaction[];

    const reports = getAvailableReportsForYear(transactions, 'weekly', 2025);
    const midYearReport = reports.find((r) => r.comparisonLabel?.startsWith('vs S'));
    expect(midYearReport).toBeDefined();
  });

  it('uses locale-aware prefix for cross-year week 1 comparison', async () => {
    mockLang = 'en';
    const { getAvailableReportsForYear } = await import(
      '@features/reports/utils/reportYearGeneration'
    );

    // Week 1 of 2025 and Week 52 of 2024
    const transactions = [
      { date: '2024-12-23', total: 5000, merchant: 'A' }, // Week 52 of 2024
      { date: '2025-01-06', total: 6000, merchant: 'B' }, // Week 2 of 2025
    ] as import('@/types/transaction').Transaction[];

    const reports = getAvailableReportsForYear(transactions, 'weekly', 2025);
    const week2Report = reports.find((r) => r.id === 'weekly-2025-2');
    if (week2Report) {
      expect(week2Report.comparisonLabel).toMatch(/^vs W\d/);
      expect(week2Report.comparisonLabel).not.toMatch(/^vs S\d/);
    }
  });
});

describe('Monthly comparisonLabel — locale-aware December abbreviation (TD-17-6, AC-2)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('uses locale-derived December abbreviation for January comparison when lang=en', async () => {
    mockLang = 'en';
    const { getAvailableReportsForYear } = await import(
      '@features/reports/utils/reportYearGeneration'
    );

    // January 2025 + December 2024 data
    const transactions = [
      { date: '2024-12-15', total: 5000, merchant: 'A' },
      { date: '2025-01-15', total: 6000, merchant: 'B' },
      { date: '2025-02-15', total: 7000, merchant: 'C' },
    ] as import('@/types/transaction').Transaction[];

    const reports = getAvailableReportsForYear(transactions, 'monthly', 2025);
    const janReport = reports.find((r) => r.id === 'monthly-2025-0');
    expect(janReport).toBeDefined();
    // English: "vs Dec 2024", not "vs Dic 2024"
    expect(janReport!.comparisonLabel).toContain('Dec');
    expect(janReport!.comparisonLabel).not.toContain('Dic');
  });

  it('uses locale-derived December abbreviation for January comparison when lang=es', async () => {
    mockLang = 'es';
    const { getAvailableReportsForYear } = await import(
      '@features/reports/utils/reportYearGeneration'
    );

    const transactions = [
      { date: '2024-12-15', total: 5000, merchant: 'A' },
      { date: '2025-01-15', total: 6000, merchant: 'B' },
      { date: '2025-02-15', total: 7000, merchant: 'C' },
    ] as import('@/types/transaction').Transaction[];

    const reports = getAvailableReportsForYear(transactions, 'monthly', 2025);
    const janReport = reports.find((r) => r.id === 'monthly-2025-0');
    expect(janReport).toBeDefined();
    // Spanish: "vs Dic. 2024" or "vs dic. 2024" (locale-derived)
    expect(janReport!.comparisonLabel).toMatch(/dic/i);
  });
});
