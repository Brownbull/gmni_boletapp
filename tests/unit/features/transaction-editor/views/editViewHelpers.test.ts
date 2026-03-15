/**
 * Story 15b-2a: Tests for editViewHelpers pure functions.
 * Tests findAllChangedItemGroups, findAllChangedSubcategories, hasMerchantAliasChanged.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  findAllChangedItemGroups,
  findAllChangedSubcategories,
  hasMerchantAliasChanged,
} from '@features/transaction-editor/views/editViewHelpers';
import type { TransactionItem } from '@features/transaction-editor/views/editViewHelpers';

describe('editViewHelpers', () => {
  beforeEach(() => {
    // No mocks needed for pure functions, but keeping pattern for consistency
  });

  describe('findAllChangedItemGroups', () => {
    it('returns empty array when no items have changed groups', () => {
      const originalItems = [
        { name: 'Apple', category: 'Produce', subcategory: 'Fruits' },
        { name: 'Bread', category: 'Bakery', subcategory: 'Loaves' },
      ];
      const currentItems: TransactionItem[] = [
        { name: 'Apple', totalPrice: 100, category: 'Produce', subcategory: 'Fruits' },
        { name: 'Bread', totalPrice: 200, category: 'Bakery', subcategory: 'Loaves' },
      ];

      const result = findAllChangedItemGroups(originalItems, currentItems);
      expect(result).toEqual([]);
    });

    it('returns changed items when one item has a new group', () => {
      const originalItems = [
        { name: 'Apple', category: 'Produce', subcategory: 'Fruits' },
        { name: 'Bread', category: 'Bakery', subcategory: 'Loaves' },
      ];
      const currentItems: TransactionItem[] = [
        { name: 'Apple', totalPrice: 100, category: 'Snacks', subcategory: 'Fruits' },
        { name: 'Bread', totalPrice: 200, category: 'Bakery', subcategory: 'Loaves' },
      ];

      const result = findAllChangedItemGroups(originalItems, currentItems);
      expect(result).toEqual([{ itemName: 'Apple', newGroup: 'Snacks' }]);
    });

    it('returns multiple changed items when several groups changed', () => {
      const originalItems = [
        { name: 'Apple', category: 'Produce', subcategory: '' },
        { name: 'Bread', category: 'Bakery', subcategory: '' },
      ];
      const currentItems: TransactionItem[] = [
        { name: 'Apple', totalPrice: 100, category: 'Snacks' },
        { name: 'Bread', totalPrice: 200, category: 'Dairy' },
      ];

      const result = findAllChangedItemGroups(originalItems, currentItems);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ itemName: 'Apple', newGroup: 'Snacks' });
      expect(result).toContainEqual({ itemName: 'Bread', newGroup: 'Dairy' });
    });

    it('skips new items that have no original to compare', () => {
      const originalItems = [
        { name: 'Apple', category: 'Produce', subcategory: '' },
      ];
      const currentItems: TransactionItem[] = [
        { name: 'Apple', totalPrice: 100, category: 'Produce' },
        { name: 'NewItem', totalPrice: 50, category: 'Snacks' },
      ];

      const result = findAllChangedItemGroups(originalItems, currentItems);
      expect(result).toEqual([]);
    });

    it('skips items with empty name', () => {
      const originalItems = [
        { name: '', category: 'Produce', subcategory: '' },
      ];
      const currentItems: TransactionItem[] = [
        { name: '', totalPrice: 100, category: 'Snacks' },
      ];

      const result = findAllChangedItemGroups(originalItems, currentItems);
      expect(result).toEqual([]);
    });

    it('skips items whose new group is empty', () => {
      const originalItems = [
        { name: 'Apple', category: 'Produce', subcategory: '' },
      ];
      const currentItems: TransactionItem[] = [
        { name: 'Apple', totalPrice: 100, category: '' },
      ];

      const result = findAllChangedItemGroups(originalItems, currentItems);
      expect(result).toEqual([]);
    });

    it('handles empty arrays', () => {
      const result = findAllChangedItemGroups([], []);
      expect(result).toEqual([]);
    });
  });

  describe('findAllChangedSubcategories', () => {
    it('returns empty array when no subcategories have changed', () => {
      const originalItems = [
        { name: 'Apple', category: 'Produce', subcategory: 'Fruits' },
        { name: 'Bread', category: 'Bakery', subcategory: 'Loaves' },
      ];
      const currentItems: TransactionItem[] = [
        { name: 'Apple', totalPrice: 100, category: 'Produce', subcategory: 'Fruits' },
        { name: 'Bread', totalPrice: 200, category: 'Bakery', subcategory: 'Loaves' },
      ];

      const result = findAllChangedSubcategories(originalItems, currentItems);
      expect(result).toEqual([]);
    });

    it('returns changed items when one subcategory changed', () => {
      const originalItems = [
        { name: 'Apple', category: 'Produce', subcategory: 'Fruits' },
        { name: 'Bread', category: 'Bakery', subcategory: 'Loaves' },
      ];
      const currentItems: TransactionItem[] = [
        { name: 'Apple', totalPrice: 100, category: 'Produce', subcategory: 'Organic' },
        { name: 'Bread', totalPrice: 200, category: 'Bakery', subcategory: 'Loaves' },
      ];

      const result = findAllChangedSubcategories(originalItems, currentItems);
      expect(result).toEqual([{ itemName: 'Apple', newSubcategory: 'Organic' }]);
    });

    it('skips new items that have no original to compare', () => {
      const originalItems = [
        { name: 'Apple', category: 'Produce', subcategory: 'Fruits' },
      ];
      const currentItems: TransactionItem[] = [
        { name: 'Apple', totalPrice: 100, category: 'Produce', subcategory: 'Fruits' },
        { name: 'NewItem', totalPrice: 50, category: 'Snacks', subcategory: 'Chips' },
      ];

      const result = findAllChangedSubcategories(originalItems, currentItems);
      expect(result).toEqual([]);
    });

    it('skips items with empty name', () => {
      const originalItems = [
        { name: '', category: 'Produce', subcategory: 'Fruits' },
      ];
      const currentItems: TransactionItem[] = [
        { name: '', totalPrice: 100, category: 'Produce', subcategory: 'Organic' },
      ];

      const result = findAllChangedSubcategories(originalItems, currentItems);
      expect(result).toEqual([]);
    });

    it('skips items whose new subcategory is empty', () => {
      const originalItems = [
        { name: 'Apple', category: 'Produce', subcategory: 'Fruits' },
      ];
      const currentItems: TransactionItem[] = [
        { name: 'Apple', totalPrice: 100, category: 'Produce', subcategory: '' },
      ];

      const result = findAllChangedSubcategories(originalItems, currentItems);
      expect(result).toEqual([]);
    });

    it('handles empty arrays', () => {
      const result = findAllChangedSubcategories([], []);
      expect(result).toEqual([]);
    });
  });

  describe('hasMerchantAliasChanged', () => {
    it('returns false when merchant is empty', () => {
      const result = hasMerchantAliasChanged('', 'NewAlias', 'OldAlias');
      expect(result).toBe(false);
    });

    it('returns true when alias changed to a non-empty value', () => {
      const result = hasMerchantAliasChanged('Merchant', 'NewAlias', 'OldAlias');
      expect(result).toBe(true);
    });

    it('returns false when alias has not changed', () => {
      const result = hasMerchantAliasChanged('Merchant', 'SameAlias', 'SameAlias');
      expect(result).toBe(false);
    });

    it('returns false when new alias is empty', () => {
      const result = hasMerchantAliasChanged('Merchant', '', 'OldAlias');
      expect(result).toBe(false);
    });

    it('returns true when alias was empty and now has a value', () => {
      const result = hasMerchantAliasChanged('Merchant', 'NewAlias', '');
      expect(result).toBe(true);
    });

    it('returns false when both aliases are empty', () => {
      const result = hasMerchantAliasChanged('Merchant', '', '');
      expect(result).toBe(false);
    });
  });
});
