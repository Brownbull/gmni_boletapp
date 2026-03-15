/**
 * Tests for Report i18n — Locale coverage gaps
 *
 * Story TD-17-7: formatWeekDateRange (AC-1), getAvailableReportsForYear monthly (AC-2),
 * groupItemsByItemCategory undefined category fallback (AC-3).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Language } from '@/utils/translations';
import type { Transaction } from '@/types/transaction';

let mockLang: Language = 'es';
vi.mock('@shared/stores/useSettingsStore', () => ({
  getSettingsState: () => ({ lang: mockLang }),
  useSettingsStore: { getState: () => ({ lang: mockLang }) },
}));

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    date: '2024-06-15',
    merchant: 'Test',
    category: 'Supermarket',
    total: 10000,
    items: [],
    ...overrides,
  };
}

// ============================================================================
// AC-1: formatWeekDateRange — en/es locale month abbreviations
// ============================================================================

describe('formatWeekDateRange — locale month abbreviations (TD-17-7, AC-1)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('returns English month abbreviation for same-month range when lang=en', async () => {
    mockLang = 'en';
    const { formatWeekDateRange } = await import(
      '@features/reports/utils/reportInsights'
    );

    // April 7-13 (same month)
    const start = new Date(2025, 3, 7); // April 7
    const end = new Date(2025, 3, 13); // April 13

    const result = formatWeekDateRange(start, end);
    // English: "Apr" not "Abr"
    expect(result).toContain('Apr');
    expect(result).not.toMatch(/Abr/i);
    expect(result).toMatch(/^7-13 Apr$/);
  });

  it('returns Spanish month abbreviation for same-month range when lang=es', async () => {
    mockLang = 'es';
    const { formatWeekDateRange } = await import(
      '@features/reports/utils/reportInsights'
    );

    // April 7-13 (same month)
    const start = new Date(2025, 3, 7);
    const end = new Date(2025, 3, 13);

    const result = formatWeekDateRange(start, end);
    // Spanish: "Abr" not "Apr"
    expect(result).toMatch(/Abr/i);
    expect(result).not.toContain('Apr');
    expect(result).toMatch(/^7-13 Abr$/);
  });

  it('returns English month abbreviations for cross-month range when lang=en', async () => {
    mockLang = 'en';
    const { formatWeekDateRange } = await import(
      '@features/reports/utils/reportInsights'
    );

    // March 31 - April 6 (cross-month)
    const start = new Date(2025, 2, 31); // March 31
    const end = new Date(2025, 3, 6); // April 6

    const result = formatWeekDateRange(start, end);
    expect(result).toContain('Mar');
    expect(result).toContain('Apr');
    expect(result).not.toMatch(/Abr/i);
  });

  it('returns Spanish month abbreviations for cross-month range when lang=es', async () => {
    mockLang = 'es';
    const { formatWeekDateRange } = await import(
      '@features/reports/utils/reportInsights'
    );

    // March 31 - April 6 (cross-month)
    const start = new Date(2025, 2, 31);
    const end = new Date(2025, 3, 6);

    const result = formatWeekDateRange(start, end);
    expect(result).toMatch(/Abr/i);
    expect(result).not.toContain('Apr');
  });
});

// ============================================================================
// AC-2: getAvailableReportsForYear('monthly') — locale title + comparisonLabel
// ============================================================================

describe('getAvailableReportsForYear monthly — locale titles (TD-17-7, AC-2)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('returns English month name in report.title when lang=en', async () => {
    mockLang = 'en';
    const { getAvailableReportsForYear } = await import(
      '@features/reports/utils/reportYearGeneration'
    );

    // February + March 2024 data (need 2+ months, past year so not skipped)
    const transactions = [
      makeTx({ id: 'tx-feb', date: '2024-02-15', total: 5000 }),
      makeTx({ id: 'tx-mar', date: '2024-03-15', total: 6000 }),
    ];

    const reports = getAvailableReportsForYear(transactions, 'monthly', 2024);
    const febReport = reports.find((r) => r.id === 'monthly-2024-1');

    expect(febReport).toBeDefined();
    // English: "February", not "Febrero"
    expect(febReport!.title).toBe('February');
    expect(febReport!.title).not.toMatch(/Febrero/i);
  });

  it('returns Spanish month name in report.title when lang=es', async () => {
    mockLang = 'es';
    const { getAvailableReportsForYear } = await import(
      '@features/reports/utils/reportYearGeneration'
    );

    const transactions = [
      makeTx({ id: 'tx-feb', date: '2024-02-15', total: 5000 }),
      makeTx({ id: 'tx-mar', date: '2024-03-15', total: 6000 }),
    ];

    const reports = getAvailableReportsForYear(transactions, 'monthly', 2024);
    const febReport = reports.find((r) => r.id === 'monthly-2024-1');

    expect(febReport).toBeDefined();
    // Spanish: "Febrero", not "February"
    expect(febReport!.title).toMatch(/Febrero/i);
    expect(febReport!.title).not.toContain('February');
  });

  it('uses English month abbreviation in comparisonLabel when lang=en', async () => {
    mockLang = 'en';
    const { getAvailableReportsForYear } = await import(
      '@features/reports/utils/reportYearGeneration'
    );

    const transactions = [
      makeTx({ id: 'tx-feb', date: '2024-02-15', total: 5000 }),
      makeTx({ id: 'tx-mar', date: '2024-03-15', total: 6000 }),
    ];

    const reports = getAvailableReportsForYear(transactions, 'monthly', 2024);
    const marReport = reports.find((r) => r.id === 'monthly-2024-2');

    expect(marReport).toBeDefined();
    // comparisonLabel references previous month abbreviation in English
    expect(marReport!.comparisonLabel).toContain('Feb');
  });

  it('uses Spanish month abbreviation in comparisonLabel when lang=es', async () => {
    mockLang = 'es';
    const { getAvailableReportsForYear } = await import(
      '@features/reports/utils/reportYearGeneration'
    );

    const transactions = [
      makeTx({ id: 'tx-feb', date: '2024-02-15', total: 5000 }),
      makeTx({ id: 'tx-mar', date: '2024-03-15', total: 6000 }),
    ];

    const reports = getAvailableReportsForYear(transactions, 'monthly', 2024);
    const marReport = reports.find((r) => r.id === 'monthly-2024-2');

    expect(marReport).toBeDefined();
    // comparisonLabel references previous month abbreviation in Spanish
    expect(marReport!.comparisonLabel).toMatch(/Feb/i);
    expect(marReport!.comparisonLabel).not.toContain('February');
  });
});

// ============================================================================
// AC-3: groupItemsByItemCategory — undefined category fallback
// ============================================================================

describe('groupItemsByItemCategory — undefined category fallback (TD-17-7, AC-3)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockLang = 'es';
  });

  it('buckets items with undefined category under Other group', async () => {
    mockLang = 'es';
    const { groupItemsByItemCategory } = await import(
      '@features/reports/utils/reportCategoryGrouping'
    );

    const txs: Transaction[] = [
      makeTx({
        items: [
          { name: 'Mystery Item', category: undefined as unknown as string, totalPrice: 1500, qty: 1 },
          { name: 'Apple', category: 'Produce', totalPrice: 500, qty: 2 },
        ],
      }),
    ];

    const groups = groupItemsByItemCategory(txs);

    // Flatten all item keys across all groups
    const allItemKeys = groups.flatMap((g) => g.items.map((i) => i.key));
    // 'Other' should be present (from the undefined-category item)
    expect(allItemKeys).toContain('Other');

    // The item should NOT be silently dropped — total groups should have both items
    const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
    expect(totalItems).toBe(2); // 'Other' + 'Produce'
  });

  it('does not silently drop items with undefined category', async () => {
    mockLang = 'en';
    const { groupItemsByItemCategory } = await import(
      '@features/reports/utils/reportCategoryGrouping'
    );

    const txs: Transaction[] = [
      makeTx({
        items: [
          { name: 'No Category Item', category: undefined as unknown as string, totalPrice: 2000, qty: 1 },
        ],
      }),
    ];

    const groups = groupItemsByItemCategory(txs);

    // Should produce exactly 1 group with 1 item
    expect(groups.length).toBe(1);
    expect(groups[0].items.length).toBe(1);
    expect(groups[0].items[0].key).toBe('Other');
    // Amount should be preserved
    expect(groups[0].items[0].rawAmount).toBe(2000);
  });
});
