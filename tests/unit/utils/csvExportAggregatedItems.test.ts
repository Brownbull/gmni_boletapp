/**
 * CSV Export - Aggregated Items Category Translation Tests
 *
 * Story 17-4: Verify that downloadAggregatedItemsCSV uses centralized
 * translation functions (translateItemGroup, translateSubcategory) from
 * categoryTranslations.ts instead of the inline ITEM_CATEGORY_TRANSLATIONS_ES map.
 *
 * Tests V4 keys (PascalCase) that were missing from the old inline map,
 * V3 legacy keys (backward compat), and subcategory translation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadAggregatedItemsCSV } from '@/utils/csvExport';
import type { AggregatedItem } from '@/types/item';

// ============================================================================
// Helpers
// ============================================================================

/** Captures the CSV content from the Blob created by downloadCSV */
function captureCSVContent(fn: () => void): string {
  let capturedContent = '';
  const originalBlob = globalThis.Blob;
  globalThis.Blob = class extends originalBlob {
    constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
      super(parts, options);
      if (parts && parts[0]) {
        capturedContent = parts[0] as string;
      }
    }
  } as typeof Blob;

  fn();

  globalThis.Blob = originalBlob;
  return capturedContent;
}

function makeAggregatedItem(overrides: Partial<AggregatedItem> = {}): AggregatedItem {
  return {
    id: 'item-1',
    normalizedName: 'test-item',
    displayName: 'Test Item',
    merchantName: 'Store',
    category: 'Produce',
    subcategory: 'Fruits',
    totalAmount: 5000,
    purchaseCount: 2,
    transactionCount: 2,
    transactionIds: ['tx-1', 'tx-2'],
    lastPurchaseDate: '2026-01-15',
    averagePrice: 2500,
    sourceItems: [],
    ...overrides,
  };
}

describe('downloadAggregatedItemsCSV - V4 category translations', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // V4 PascalCase keys (NEW — previously fell through to English)
  // --------------------------------------------------------------------------

  it('should translate V4 key BreadPastry to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'BreadPastry' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Pan y Reposter\u00eda');
  });

  it('should translate V4 key MeatSeafood to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'MeatSeafood' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Carnes y Mariscos');
  });

  it('should translate V4 key DairyEggs to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'DairyEggs' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('L\u00e1cteos y Huevos');
  });

  it('should translate V4 key FrozenFoods to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'FrozenFoods' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Congelados');
  });

  it('should translate V4 key PreparedFood to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'PreparedFood' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Comida Preparada');
  });

  it('should translate V4 key BeautyCosmetics to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'BeautyCosmetics' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Belleza y Cosm\u00e9tica');
  });

  it('should translate V4 key CleaningSupplies to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'CleaningSupplies' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Productos de Limpieza');
  });

  it('should translate V4 key Medications to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'Medications' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Medicamentos');
  });

  // --------------------------------------------------------------------------
  // V3 legacy keys (backward compatibility — must still work)
  // --------------------------------------------------------------------------

  it('should still translate V3 key Produce to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'Produce' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Frutas y Verduras');
  });

  it('should still translate V3 key "Meat & Seafood" to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'Meat & Seafood' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Carnes y Mariscos');
  });

  it('should still translate V3 key Pantry to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'Pantry' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Despensa');
  });

  it('should still translate V3 key Bakery to Spanish', () => {
    const items = [makeAggregatedItem({ category: 'Bakery' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    // V3 Bakery maps to 'Panaderia' in categoryTranslations
    expect(csv).toContain('Panader\u00eda');
  });

  // --------------------------------------------------------------------------
  // Subcategory translation (uses translateSubcategory now, not translateItemCategory)
  // --------------------------------------------------------------------------

  it('should translate subcategory Fruits to Frutas in Spanish', () => {
    const items = [makeAggregatedItem({ subcategory: 'Fruits' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Frutas');
  });

  it('should translate subcategory Cheese to Queso in Spanish', () => {
    const items = [makeAggregatedItem({ subcategory: 'Cheese' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('Queso');
  });

  it('should fall back to original key for unknown subcategory', () => {
    const items = [makeAggregatedItem({ subcategory: 'UnknownSubcat' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('UnknownSubcat');
  });

  // --------------------------------------------------------------------------
  // English language passthrough
  // --------------------------------------------------------------------------

  it('should return English names when lang is en', () => {
    const items = [makeAggregatedItem({ category: 'BreadPastry', subcategory: 'Bread' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'en'));
    expect(csv).toContain('Bread & Pastries');
    expect(csv).toContain('Bread');
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------

  it('should handle empty category gracefully', () => {
    const items = [makeAggregatedItem({ category: undefined })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    // No crash, category column should be empty
    const lines = csv.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('should handle empty subcategory gracefully', () => {
    const items = [makeAggregatedItem({ subcategory: undefined })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    const lines = csv.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  it('should fall back to original key for unknown category', () => {
    const items = [makeAggregatedItem({ category: 'TotallyNewCategory' })];
    const csv = captureCSVContent(() => downloadAggregatedItemsCSV(items, 'es'));
    expect(csv).toContain('TotallyNewCategory');
  });
});
