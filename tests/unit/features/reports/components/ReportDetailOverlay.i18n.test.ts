/**
 * Tests for ReportDetailOverlay i18n coverage
 *
 * Story 15-TD-27: Verify all hardcoded Spanish strings migrated to t() calls.
 * Tests translation key completeness and value correctness for both languages.
 */
import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from '@/utils/translations';

const en = TRANSLATIONS.en;
const es = TRANSLATIONS.es;

// All translation keys added in 15-TD-27
const TD27_KEYS = [
  'reportTotalWeekly',
  'reportTotalMonthly',
  'reportTotalQuarterly',
  'reportTotalYearly',
  'reportFirstWeekly',
  'reportFirstMonthly',
  'reportFirstQuarterly',
  'reportFirstYearly',
  'reportVsPreviousPeriod',
  'reportPersonalizedInsight',
  'reportHighlightsWeekly',
  'reportHighlightsMonthly',
  'reportHighlightsQuarterly',
  'reportHighlightsYearly',
  'reportCategoryBreakdown',
  'reportPurchaseSingular',
  'reportPurchasePlural',
  'reportStoreTypeBreakdown',
  'reportProductTypeBreakdown',
  'reportDownloadPdf',
  'reportTransactionsViewHistory',
] as const;

describe('ReportDetailOverlay i18n keys (Story 15-TD-27)', () => {
  it.each(TD27_KEYS)('en.%s exists and is non-empty', (key) => {
    expect(en[key]).toBeDefined();
    expect(en[key].length).toBeGreaterThan(0);
  });

  it.each(TD27_KEYS)('es.%s exists and is non-empty', (key) => {
    expect(es[key]).toBeDefined();
    expect(es[key].length).toBeGreaterThan(0);
  });

  it('en and es have different values for all localized keys', () => {
    for (const key of TD27_KEYS) {
      expect(en[key]).not.toBe(es[key]);
    }
  });

  it('reportTransactionsViewHistory contains {count} placeholder in both languages', () => {
    expect(en.reportTransactionsViewHistory).toContain('{count}');
    expect(es.reportTransactionsViewHistory).toContain('{count}');
  });

  it('period-based keys cover all 4 period types', () => {
    // HeroCard total labels
    expect(en.reportTotalWeekly).toBeTruthy();
    expect(en.reportTotalMonthly).toBeTruthy();
    expect(en.reportTotalQuarterly).toBeTruthy();
    expect(en.reportTotalYearly).toBeTruthy();

    // HeroCard first labels
    expect(en.reportFirstWeekly).toBeTruthy();
    expect(en.reportFirstMonthly).toBeTruthy();
    expect(en.reportFirstQuarterly).toBeTruthy();
    expect(en.reportFirstYearly).toBeTruthy();

    // HighlightsCard labels
    expect(en.reportHighlightsWeekly).toBeTruthy();
    expect(en.reportHighlightsMonthly).toBeTruthy();
    expect(en.reportHighlightsQuarterly).toBeTruthy();
    expect(en.reportHighlightsYearly).toBeTruthy();
  });

  it('Spanish values match the original hardcoded strings', () => {
    // These were the exact strings in the component before migration
    expect(es.reportTotalWeekly).toBe('Total de la semana');
    expect(es.reportTotalMonthly).toBe('Total del mes');
    expect(es.reportTotalQuarterly).toBe('Total del trimestre');
    expect(es.reportTotalYearly).toBe('Total del año');
    expect(es.reportFirstWeekly).toBe('Tu primera semana');
    expect(es.reportFirstMonthly).toBe('Tu primer mes');
    expect(es.reportFirstQuarterly).toBe('Tu primer trimestre');
    expect(es.reportFirstYearly).toBe('Tu primer año completo');
    expect(es.reportVsPreviousPeriod).toBe('vs período anterior');
    expect(es.reportPersonalizedInsight).toBe('Insight personalizado');
    expect(es.reportHighlightsWeekly).toBe('Highlights de la semana');
    expect(es.reportHighlightsMonthly).toBe('Highlights del mes');
    expect(es.reportHighlightsQuarterly).toBe('Highlights del trimestre');
    expect(es.reportHighlightsYearly).toBe('Highlights del año');
    expect(es.reportCategoryBreakdown).toBe('Desglose por categoría');
    expect(es.reportPurchaseSingular).toBe('compra');
    expect(es.reportPurchasePlural).toBe('compras');
    expect(es.reportStoreTypeBreakdown).toBe('Desglose por tipo de tienda');
    expect(es.reportProductTypeBreakdown).toBe('Desglose por tipo de producto');
    expect(es.reportDownloadPdf).toBe('Descargar como PDF');
    expect(es.reportTransactionsViewHistory).toBe('{count} transacciones, ver en historial');
  });
});
