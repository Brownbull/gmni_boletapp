/**
 * Tests for applyItemNameMappings utility
 *
 * Story 14e-42: Extract applyItemNameMappings
 *
 * @module tests/unit/features/categories/utils/itemNameMappings
 */

import { describe, it, expect, vi } from 'vitest';
import { applyItemNameMappings, type FindItemNameMatchFn } from '@/features/categories/utils/itemNameMappings';
import type { Transaction } from '@/types';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Creates a mock transaction for testing
 */
function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    date: '2026-01-30',
    merchant: 'TEST STORE',
    category: 'groceries',
    total: 100,
    items: [
      { name: 'ITEM A', price: 50, category: 'food' },
      { name: 'ITEM B', price: 30, category: 'beverages' },
      { name: 'ITEM C', price: 20, category: 'snacks' },
    ],
    ...overrides,
  };
}

/**
 * Creates a mock findItemNameMatch function
 */
function createMockFindItemNameMatch(
  mockResponses: Record<string, { targetItemName: string; targetCategory?: string; confidence: number; id?: string } | null>
): FindItemNameMatchFn {
  return vi.fn((normalizedMerchant: string, itemName: string) => {
    const response = mockResponses[itemName];
    if (!response) return null;
    return {
      mapping: {
        id: response.id,
        targetItemName: response.targetItemName,
        targetCategory: response.targetCategory,
      },
      confidence: response.confidence,
    };
  });
}

// =============================================================================
// Tests: No Mappings (AC4 - Test: no mappings returns unchanged)
// =============================================================================

describe('applyItemNameMappings', () => {
  describe('when no mappings exist', () => {
    it('returns unchanged transaction with empty appliedIds', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({});

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction).toEqual(transaction);
      expect(result.appliedIds).toEqual([]);
    });

    it('calls findItemNameMatch for each item', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({});

      applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(findItemNameMatch).toHaveBeenCalledTimes(3);
      expect(findItemNameMatch).toHaveBeenCalledWith('TEST STORE', 'ITEM A');
      expect(findItemNameMatch).toHaveBeenCalledWith('TEST STORE', 'ITEM B');
      expect(findItemNameMatch).toHaveBeenCalledWith('TEST STORE', 'ITEM C');
    });
  });

  // =============================================================================
  // Tests: Single Item Match (AC4 - Test: single item match)
  // =============================================================================

  describe('when single item matches', () => {
    it('applies mapping to matched item only', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': { targetItemName: 'Better Name A', confidence: 0.9, id: 'mapping-1' },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction.items[0].name).toBe('Better Name A');
      expect(result.transaction.items[1].name).toBe('ITEM B'); // unchanged
      expect(result.transaction.items[2].name).toBe('ITEM C'); // unchanged
      expect(result.appliedIds).toEqual(['mapping-1']);
    });
  });

  // =============================================================================
  // Tests: Multiple Items Partial Match (AC4 - Test: partial item matches)
  // =============================================================================

  describe('when multiple items have partial match', () => {
    it('applies mappings only to matched items', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': { targetItemName: 'Product A', confidence: 0.85, id: 'mapping-1' },
        'ITEM C': { targetItemName: 'Product C', confidence: 0.9, id: 'mapping-3' },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction.items[0].name).toBe('Product A');
      expect(result.transaction.items[1].name).toBe('ITEM B'); // unchanged
      expect(result.transaction.items[2].name).toBe('Product C');
      expect(result.appliedIds).toEqual(['mapping-1', 'mapping-3']);
    });
  });

  // =============================================================================
  // Tests: Confidence Threshold (AC4 - Test: confidence at 0.7 threshold)
  // =============================================================================

  describe('confidence threshold boundary', () => {
    it('does NOT apply mapping when confidence equals 0.7 (threshold)', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': { targetItemName: 'Better Name', confidence: 0.7, id: 'mapping-1' },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      // Confidence must be > 0.7, not >= 0.7
      expect(result.transaction.items[0].name).toBe('ITEM A'); // unchanged
      expect(result.appliedIds).toEqual([]);
    });

    it('applies mapping when confidence is 0.71 (just above threshold)', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': { targetItemName: 'Better Name', confidence: 0.71, id: 'mapping-1' },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction.items[0].name).toBe('Better Name');
      expect(result.appliedIds).toEqual(['mapping-1']);
    });

    it('does NOT apply mapping when confidence is below threshold (0.5)', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': { targetItemName: 'Better Name', confidence: 0.5, id: 'mapping-1' },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction.items[0].name).toBe('ITEM A'); // unchanged
      expect(result.appliedIds).toEqual([]);
    });
  });

  // =============================================================================
  // Tests: Learned Category (AC4 - Test: learned category applied alongside name)
  // =============================================================================

  describe('when mapping includes target category', () => {
    it('applies both name and category from mapping', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': {
          targetItemName: 'Coca-Cola 2L',
          targetCategory: 'soft_drinks',
          confidence: 0.9,
          id: 'mapping-1',
        },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction.items[0].name).toBe('Coca-Cola 2L');
      expect(result.transaction.items[0].category).toBe('soft_drinks');
      expect(result.transaction.items[0].categorySource).toBe('learned');
    });

    it('preserves original category if mapping has no targetCategory', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': {
          targetItemName: 'Coca-Cola 2L',
          confidence: 0.9,
          id: 'mapping-1',
        },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction.items[0].name).toBe('Coca-Cola 2L');
      expect(result.transaction.items[0].category).toBe('food'); // original preserved
      expect(result.transaction.items[0].categorySource).toBeUndefined(); // original preserved
    });
  });

  // =============================================================================
  // Tests: appliedIds Return Value (AC4 - Test: appliedIds returned correctly)
  // =============================================================================

  describe('appliedIds tracking', () => {
    it('returns all applied mapping IDs in order', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': { targetItemName: 'Product A', confidence: 0.9, id: 'id-1' },
        'ITEM B': { targetItemName: 'Product B', confidence: 0.8, id: 'id-2' },
        'ITEM C': { targetItemName: 'Product C', confidence: 0.85, id: 'id-3' },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.appliedIds).toEqual(['id-1', 'id-2', 'id-3']);
    });

    it('excludes mappings without id from appliedIds', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': { targetItemName: 'Product A', confidence: 0.9 }, // no id
        'ITEM B': { targetItemName: 'Product B', confidence: 0.8, id: 'id-2' },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction.items[0].name).toBe('Product A'); // still applied
      expect(result.appliedIds).toEqual(['id-2']); // only id-2 tracked
    });
  });

  // =============================================================================
  // Tests: Pure Function (AC1 - No side effects)
  // =============================================================================

  describe('pure function behavior', () => {
    it('does not mutate the original transaction', () => {
      const transaction = createMockTransaction();
      const originalItems = JSON.stringify(transaction.items);
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': { targetItemName: 'Changed Name', confidence: 0.9, id: 'mapping-1' },
      });

      applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(JSON.stringify(transaction.items)).toBe(originalItems);
    });

    it('returns a new transaction object', () => {
      const transaction = createMockTransaction();
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': { targetItemName: 'Changed Name', confidence: 0.9, id: 'mapping-1' },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction).not.toBe(transaction);
      expect(result.transaction.items).not.toBe(transaction.items);
    });
  });

  // =============================================================================
  // Tests: Edge Cases
  // =============================================================================

  describe('edge cases', () => {
    it('handles empty items array', () => {
      const transaction = createMockTransaction({ items: [] });
      const findItemNameMatch = createMockFindItemNameMatch({});

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction.items).toEqual([]);
      expect(result.appliedIds).toEqual([]);
    });

    it('handles transaction with single item', () => {
      const transaction = createMockTransaction({
        items: [{ name: 'SINGLE ITEM', price: 100, category: 'food' }],
      });
      const findItemNameMatch = createMockFindItemNameMatch({
        'SINGLE ITEM': { targetItemName: 'Renamed Item', confidence: 0.9, id: 'mapping-1' },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      expect(result.transaction.items[0].name).toBe('Renamed Item');
      expect(result.appliedIds).toEqual(['mapping-1']);
    });

    it('preserves all other item properties', () => {
      const transaction = createMockTransaction({
        items: [
          {
            name: 'ITEM A',
            price: 50,
            qty: 3,
            category: 'food',
            subcategory: 'canned',
            categorySource: 'scan',
            subcategorySource: 'user',
          },
        ],
      });
      const findItemNameMatch = createMockFindItemNameMatch({
        'ITEM A': { targetItemName: 'New Name', confidence: 0.9, id: 'mapping-1' },
      });

      const result = applyItemNameMappings(transaction, 'TEST STORE', findItemNameMatch);

      const updatedItem = result.transaction.items[0];
      expect(updatedItem.name).toBe('New Name');
      expect(updatedItem.price).toBe(50);
      expect(updatedItem.qty).toBe(3);
      expect(updatedItem.category).toBe('food');
      expect(updatedItem.subcategory).toBe('canned');
      expect(updatedItem.subcategorySource).toBe('user');
    });
  });
});
