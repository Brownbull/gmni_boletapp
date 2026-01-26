/**
 * ProcessScan Sub-Handlers Unit Tests
 *
 * Tests for modular sub-handlers extracted from processScan:
 * - validateScanResult: Total validation + dialog trigger
 * - applyAllMappings: Category + merchant + item name mappings
 * - handleCurrencyDetection: Currency check + dialog trigger
 * - handleScanSuccess: QuickSave/Trusted/EditView routing
 * - reconcileItemsTotal: Items reconciliation utility
 *
 * Story 14e-8b: Sub-handlers extraction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateScanResult,
  applyAllMappings,
  handleCurrencyDetection,
  handleScanSuccess,
  reconcileItemsTotal,
  type ValidateScanResultDeps,
  type ApplyAllMappingsDeps,
  type HandleCurrencyDetectionDeps,
  type HandleScanSuccessDeps,
} from '../../../../../../src/features/scan/handlers/processScan/subhandlers';
import type {
  Transaction,
  TransactionItem,
  MappingDependencies,
} from '../../../../../../src/features/scan/handlers/processScan/types';

// =============================================================================
// Test Factories
// =============================================================================

function createMockTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    merchant: 'Test Store',
    date: '2026-01-25',
    total: 10000,
    category: 'Supermarket',
    items: [
      { name: 'Item 1', price: 5000, qty: 1, category: 'Food' },
      { name: 'Item 2', price: 5000, qty: 1, category: 'Food' },
    ],
    ...overrides,
  };
}

function createMockScanOverlay() {
  return {
    startUpload: vi.fn(),
    setProgress: vi.fn(),
    startProcessing: vi.fn(),
    setReady: vi.fn(),
    setError: vi.fn(),
  };
}

function createMockValidateScanResultDeps(
  overrides?: Partial<ValidateScanResultDeps>
): ValidateScanResultDeps {
  return {
    showScanDialog: vi.fn(),
    setIsAnalyzing: vi.fn(),
    scanOverlay: createMockScanOverlay(),
    reconcileItemsTotal: (items, total, _lang) => ({ items, hasDiscrepancy: false, discrepancyAmount: 0 }),
    lang: 'en',
    ...overrides,
  };
}

function createMockMappingDeps(overrides?: Partial<MappingDependencies>): MappingDependencies {
  return {
    mappings: [],
    applyCategoryMappings: vi.fn((tx, _mappings) => ({ transaction: tx, appliedMappingIds: [] })),
    findMerchantMatch: vi.fn(() => null),
    applyItemNameMappings: vi.fn((tx, _merchant) => ({ transaction: tx, appliedIds: [] })),
    incrementMappingUsage: vi.fn(),
    incrementMerchantMappingUsage: vi.fn(),
    incrementItemNameMappingUsage: vi.fn(),
    ...overrides,
  };
}

function createMockHandleScanSuccessDeps(
  overrides?: Partial<HandleScanSuccessDeps>
): HandleScanSuccessDeps {
  return {
    checkTrusted: vi.fn().mockResolvedValue(false),
    showScanDialog: vi.fn(),
    setSkipScanCompleteModal: vi.fn(),
    setAnimateEditViewItems: vi.fn(),
    ...overrides,
  };
}

// =============================================================================
// validateScanResult Tests
// =============================================================================

describe('validateScanResult', () => {
  let deps: ValidateScanResultDeps;

  beforeEach(() => {
    deps = createMockValidateScanResultDeps();
  });

  it('should return valid when total matches items sum', () => {
    const transaction = createMockTransaction({ total: 10000 });
    const parsedItems: TransactionItem[] = [
      { name: 'Item 1', price: 5000, qty: 1 },
      { name: 'Item 2', price: 5000, qty: 1 },
    ];

    const result = validateScanResult(transaction, parsedItems, deps);

    expect(result.isValid).toBe(true);
    expect(result.shouldContinue).toBe(true);
    expect(deps.showScanDialog).not.toHaveBeenCalled();
  });

  it('should show dialog when discrepancy exceeds threshold (>40%)', () => {
    // Total is 10000, items sum is 5000 (50% discrepancy)
    // Transaction items must also be 5000 since validateTotal uses transaction.items
    const parsedItems: TransactionItem[] = [{ name: 'Item 1', price: 5000, qty: 1 }];
    const transaction = createMockTransaction({
      total: 10000,
      items: parsedItems, // Must match parsedItems for test to work
    });

    const result = validateScanResult(transaction, parsedItems, deps);

    expect(result.isValid).toBe(false);
    expect(result.shouldContinue).toBe(false);
    expect(deps.showScanDialog).toHaveBeenCalledWith('total_mismatch', expect.any(Object));
    expect(deps.setIsAnalyzing).toHaveBeenCalledWith(false);
    expect(deps.scanOverlay.setReady).toHaveBeenCalled();
  });

  it('should include validation result in dialog data', () => {
    const parsedItems: TransactionItem[] = [{ name: 'Item 1', price: 5000, qty: 1 }];
    const transaction = createMockTransaction({
      total: 10000,
      items: parsedItems,
    });

    validateScanResult(transaction, parsedItems, deps);

    const dialogCall = (deps.showScanDialog as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(dialogCall[0]).toBe('total_mismatch');
    expect(dialogCall[1]).toEqual({
      validationResult: expect.objectContaining({
        isValid: false,
        extractedTotal: 10000,
        itemsSum: 5000,
      }),
      pendingTransaction: transaction,
      parsedItems,
    });
  });

  it('should call reconcileItemsTotal when validation passes', () => {
    const mockReconcile = vi.fn((items, _total, _lang) => ({
      items,
      hasDiscrepancy: false,
      discrepancyAmount: 0,
    }));
    deps.reconcileItemsTotal = mockReconcile;

    const transaction = createMockTransaction({ total: 10000 });
    const parsedItems: TransactionItem[] = [
      { name: 'Item 1', price: 5000, qty: 1 },
      { name: 'Item 2', price: 5000, qty: 1 },
    ];

    const result = validateScanResult(transaction, parsedItems, deps);

    expect(mockReconcile).toHaveBeenCalledWith(parsedItems, 10000, 'en');
    expect(result.reconciledItems).toEqual(parsedItems);
    expect(result.hasDiscrepancy).toBe(false);
  });

  it('should pass through hasDiscrepancy from reconciliation', () => {
    const adjustedItems: TransactionItem[] = [
      { name: 'Item 1', price: 9000, qty: 1 },
      { name: 'Adjustment', price: 1000, qty: 1 },
    ];
    deps.reconcileItemsTotal = vi.fn((_items, _total, _lang) => ({
      items: adjustedItems,
      hasDiscrepancy: true,
      discrepancyAmount: 1000,
    }));

    const transaction = createMockTransaction({ total: 10000 });
    const parsedItems: TransactionItem[] = [{ name: 'Item 1', price: 9000, qty: 1 }];

    const result = validateScanResult(transaction, parsedItems, deps);

    expect(result.isValid).toBe(true);
    expect(result.shouldContinue).toBe(true);
    expect(result.reconciledItems).toEqual(adjustedItems);
    expect(result.hasDiscrepancy).toBe(true);
  });
});

// =============================================================================
// applyAllMappings Tests
// =============================================================================

describe('applyAllMappings', () => {
  it('should return unchanged transaction when no mappings apply', () => {
    const transaction = createMockTransaction();
    const deps: ApplyAllMappingsDeps = {
      mapping: createMockMappingDeps(),
    };

    const result = applyAllMappings(transaction, deps);

    expect(result.transaction).toEqual(transaction);
    expect(result.appliedCategoryMappingIds).toEqual([]);
    expect(result.appliedMerchantMappingId).toBeUndefined();
    expect(result.appliedItemNameMappingIds).toEqual([]);
  });

  it('should apply category mappings', () => {
    const transaction = createMockTransaction();
    const mappedTx = { ...transaction, items: [{ ...transaction.items[0], category: 'Groceries' }] };

    const deps: ApplyAllMappingsDeps = {
      mapping: createMockMappingDeps({
        applyCategoryMappings: vi.fn((_tx, _mappings) => ({
          transaction: mappedTx,
          appliedMappingIds: ['cat-mapping-1'],
        })),
      }),
      userId: 'test-user',
    };

    const result = applyAllMappings(transaction, deps);

    expect(result.appliedCategoryMappingIds).toEqual(['cat-mapping-1']);
    expect(deps.mapping.incrementMappingUsage).toHaveBeenCalledWith('cat-mapping-1');
  });

  it('should apply merchant mapping when confidence > 0.7', () => {
    const transaction = createMockTransaction({ merchant: 'WALMART' });

    const deps: ApplyAllMappingsDeps = {
      mapping: createMockMappingDeps({
        findMerchantMatch: vi.fn(() => ({
          mapping: {
            id: 'merchant-1',
            targetMerchant: 'Walmart',
            normalizedMerchant: 'walmart',
            storeCategory: 'Supermarket',
          },
          confidence: 0.9,
        })),
      }),
      userId: 'test-user',
    };

    const result = applyAllMappings(transaction, deps);

    expect(result.transaction.alias).toBe('Walmart');
    expect(result.transaction.category).toBe('Supermarket');
    expect(result.transaction.merchantSource).toBe('learned');
    expect(result.appliedMerchantMappingId).toBe('merchant-1');
    expect(result.normalizedMerchant).toBe('walmart');
    expect(deps.mapping.incrementMerchantMappingUsage).toHaveBeenCalledWith('merchant-1');
  });

  it('should not apply merchant mapping when confidence <= 0.7', () => {
    const transaction = createMockTransaction({ merchant: 'WALMART' });

    const deps: ApplyAllMappingsDeps = {
      mapping: createMockMappingDeps({
        findMerchantMatch: vi.fn(() => ({
          mapping: {
            id: 'merchant-1',
            targetMerchant: 'Walmart',
            normalizedMerchant: 'walmart',
          },
          confidence: 0.5, // Below threshold
        })),
      }),
    };

    const result = applyAllMappings(transaction, deps);

    expect(result.transaction.alias).toBeUndefined();
    expect(result.appliedMerchantMappingId).toBeUndefined();
    expect(deps.mapping.incrementMerchantMappingUsage).not.toHaveBeenCalled();
  });

  it('should apply item name mappings when merchant is matched', () => {
    const transaction = createMockTransaction({ merchant: 'WALMART' });
    const mappedTx = {
      ...transaction,
      items: [{ ...transaction.items[0], name: 'Organic Milk' }],
    };

    const deps: ApplyAllMappingsDeps = {
      mapping: createMockMappingDeps({
        findMerchantMatch: vi.fn(() => ({
          mapping: {
            id: 'merchant-1',
            targetMerchant: 'Walmart',
            normalizedMerchant: 'walmart',
          },
          confidence: 0.9,
        })),
        applyItemNameMappings: vi.fn((_tx, _merchant) => ({
          transaction: mappedTx,
          appliedIds: ['item-1', 'item-2'],
        })),
      }),
      userId: 'test-user',
    };

    const result = applyAllMappings(transaction, deps);

    expect(deps.mapping.applyItemNameMappings).toHaveBeenCalledWith(expect.any(Object), 'walmart');
    expect(result.appliedItemNameMappingIds).toEqual(['item-1', 'item-2']);
    expect(deps.mapping.incrementItemNameMappingUsage).toHaveBeenCalledTimes(2);
  });

  it('should not increment usage when no userId provided', () => {
    const transaction = createMockTransaction();

    const deps: ApplyAllMappingsDeps = {
      mapping: createMockMappingDeps({
        applyCategoryMappings: vi.fn((_tx, _mappings) => ({
          transaction,
          appliedMappingIds: ['cat-1'],
        })),
      }),
      // No userId
    };

    applyAllMappings(transaction, deps);

    expect(deps.mapping.incrementMappingUsage).not.toHaveBeenCalled();
  });
});

// =============================================================================
// handleCurrencyDetection Tests
// =============================================================================

describe('handleCurrencyDetection', () => {
  let deps: HandleCurrencyDetectionDeps;

  beforeEach(() => {
    deps = {
      showScanDialog: vi.fn(),
      setIsAnalyzing: vi.fn(),
      scanOverlay: createMockScanOverlay(),
    };
  });

  it('should continue when currencies match', () => {
    const transaction = createMockTransaction({ currency: 'CLP' });

    const result = handleCurrencyDetection('CLP', 'CLP', transaction, false, deps);

    expect(result.shouldContinue).toBe(true);
    expect(result.finalCurrency).toBe('CLP');
    expect(deps.showScanDialog).not.toHaveBeenCalled();
  });

  it('should show dialog when currencies differ', () => {
    const transaction = createMockTransaction({ currency: 'USD' });

    const result = handleCurrencyDetection('USD', 'CLP', transaction, false, deps);

    expect(result.shouldContinue).toBe(false);
    expect(result.finalCurrency).toBeUndefined();
    expect(deps.showScanDialog).toHaveBeenCalledWith('currency_mismatch', {
      detectedCurrency: 'USD',
      pendingTransaction: transaction,
      hasDiscrepancy: false,
    });
    expect(deps.setIsAnalyzing).toHaveBeenCalledWith(false);
    expect(deps.scanOverlay.setReady).toHaveBeenCalled();
  });

  it('should use default currency when none detected', () => {
    const transaction = createMockTransaction({ currency: undefined });

    const result = handleCurrencyDetection(undefined, 'CLP', transaction, false, deps);

    expect(result.shouldContinue).toBe(true);
    expect(result.finalCurrency).toBe('CLP');
    expect(deps.showScanDialog).not.toHaveBeenCalled();
  });

  it('should continue with undefined when no currencies available', () => {
    const transaction = createMockTransaction({ currency: undefined });

    const result = handleCurrencyDetection(undefined, undefined, transaction, false, deps);

    expect(result.shouldContinue).toBe(true);
    expect(result.finalCurrency).toBeUndefined();
  });

  it('should include hasDiscrepancy in dialog data', () => {
    const transaction = createMockTransaction({ currency: 'USD' });

    handleCurrencyDetection('USD', 'CLP', transaction, true, deps);

    const dialogData = (deps.showScanDialog as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(dialogData.hasDiscrepancy).toBe(true);
  });
});

// =============================================================================
// handleScanSuccess Tests
// =============================================================================

describe('handleScanSuccess', () => {
  let deps: HandleScanSuccessDeps;

  beforeEach(() => {
    deps = createMockHandleScanSuccessDeps();
  });

  it('should return trusted-autosave route for trusted merchants', async () => {
    deps.checkTrusted = vi.fn().mockResolvedValue(true);

    const transaction = createMockTransaction({
      merchant: 'Walmart',
      alias: 'Walmart',
    });

    const result = await handleScanSuccess(transaction, deps);

    expect(result.route).toBe('trusted-autosave');
    expect(result.isTrusted).toBe(true);
    expect(deps.setSkipScanCompleteModal).toHaveBeenCalledWith(true);
  });

  it('should return quicksave route for high confidence untrusted merchants', async () => {
    deps.checkTrusted = vi.fn().mockResolvedValue(false);

    // High confidence transaction (has merchant, total, date, category, items)
    const transaction = createMockTransaction({
      merchant: 'New Store',
      alias: 'New Store',
      total: 10000,
      date: '2026-01-25',
      category: 'Supermarket',
      items: [{ name: 'Item', price: 10000, qty: 1 }],
    });

    const result = await handleScanSuccess(transaction, deps);

    expect(result.route).toBe('quicksave');
    expect(result.isTrusted).toBe(false);
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    expect(deps.showScanDialog).toHaveBeenCalledWith('quicksave', expect.any(Object));
    expect(deps.setSkipScanCompleteModal).toHaveBeenCalledWith(true);
  });

  it('should return edit-view route for low confidence', async () => {
    deps.checkTrusted = vi.fn().mockResolvedValue(false);

    // Low confidence transaction (missing category)
    const transaction = createMockTransaction({
      merchant: 'Unknown Store',
      category: 'Other', // 'Other' doesn't count towards confidence
      items: [], // No items = low confidence
    });

    const result = await handleScanSuccess(transaction, deps);

    expect(result.route).toBe('edit-view');
    expect(result.isTrusted).toBe(false);
    expect(deps.setAnimateEditViewItems).toHaveBeenCalledWith(true);
    expect(deps.showScanDialog).not.toHaveBeenCalled();
  });

  it('should use alias for trusted check if available', async () => {
    deps.checkTrusted = vi.fn().mockResolvedValue(true);

    const transaction = createMockTransaction({
      merchant: 'WALMART INC',
      alias: 'Walmart',
    });

    await handleScanSuccess(transaction, deps);

    expect(deps.checkTrusted).toHaveBeenCalledWith('Walmart');
  });

  it('should fall back to merchant for trusted check if no alias', async () => {
    deps.checkTrusted = vi.fn().mockResolvedValue(false);

    const transaction = createMockTransaction({
      merchant: 'Test Store',
      alias: undefined,
    });

    await handleScanSuccess(transaction, deps);

    expect(deps.checkTrusted).toHaveBeenCalledWith('Test Store');
  });

  it('should not check trusted for empty merchant', async () => {
    deps.checkTrusted = vi.fn().mockResolvedValue(false);

    const transaction = createMockTransaction({
      merchant: '',
      alias: '',
    });

    await handleScanSuccess(transaction, deps);

    // Should still return a route, defaulting to edit-view due to low confidence
    expect(deps.checkTrusted).not.toHaveBeenCalled();
  });
});

// =============================================================================
// reconcileItemsTotal Tests
// =============================================================================

describe('reconcileItemsTotal', () => {
  it('should return unchanged items when totals match', () => {
    const items: TransactionItem[] = [
      { name: 'Item 1', price: 5000, qty: 1 },
      { name: 'Item 2', price: 5000, qty: 1 },
    ];

    const result = reconcileItemsTotal(items, 10000, 'en');

    expect(result.items).toEqual(items);
    expect(result.hasDiscrepancy).toBe(false);
    expect(result.discrepancyAmount).toBe(0);
  });

  it('should allow small discrepancies (< $1)', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 9999.5, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'en');

    expect(result.items).toEqual(items);
    expect(result.hasDiscrepancy).toBe(false);
  });

  it('should add surplus item when receipt > items', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 8000, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'en');

    expect(result.items.length).toBe(2);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.discrepancyAmount).toBe(2000);

    const adjustmentItem = result.items[1];
    expect(adjustmentItem.name).toBe('Unitemized charge');
    expect(adjustmentItem.price).toBe(2000);
  });

  it('should add discount item when items > receipt', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 12000, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'en');

    expect(result.items.length).toBe(2);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.discrepancyAmount).toBe(-2000);

    const adjustmentItem = result.items[1];
    expect(adjustmentItem.name).toBe('Discount/Adjustment');
    expect(adjustmentItem.price).toBe(-2000);
  });

  it('should use Spanish translations when lang is es', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 8000, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'es');

    const adjustmentItem = result.items[1];
    expect(adjustmentItem.name).toBe('Cargo sin detallar');
  });

  it('should use Spanish discount translation for negative discrepancy', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 12000, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'es');

    const adjustmentItem = result.items[1];
    expect(adjustmentItem.name).toBe('Descuento/Ajuste');
  });

  it('should handle empty items array', () => {
    const result = reconcileItemsTotal([], 10000, 'en');

    expect(result.items.length).toBe(1);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.items[0].name).toBe('Unitemized charge');
    expect(result.items[0].price).toBe(10000);
  });

  it('should handle zero receipt total', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 5000, qty: 1 }];

    const result = reconcileItemsTotal(items, 0, 'en');

    expect(result.items.length).toBe(2);
    expect(result.hasDiscrepancy).toBe(true);
    expect(result.discrepancyAmount).toBe(-5000);
  });

  it('should set adjustment item category to Other', () => {
    const items: TransactionItem[] = [{ name: 'Item 1', price: 8000, qty: 1 }];

    const result = reconcileItemsTotal(items, 10000, 'en');

    const adjustmentItem = result.items[1];
    expect(adjustmentItem.category).toBe('Other');
    expect(adjustmentItem.qty).toBe(1);
  });

  it('should handle floating point rounding correctly', () => {
    const items: TransactionItem[] = [
      { name: 'Item 1', price: 33.33, qty: 1 },
      { name: 'Item 2', price: 33.33, qty: 1 },
      { name: 'Item 3', price: 33.33, qty: 1 },
    ];

    // Total is 99.99, items sum is 99.99
    const result = reconcileItemsTotal(items, 99.99, 'en');

    expect(result.hasDiscrepancy).toBe(false);
  });
});
