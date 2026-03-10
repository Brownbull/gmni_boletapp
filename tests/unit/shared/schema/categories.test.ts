/**
 * Hardening tests for category schema integrity.
 * Story 17-2: Verify no category name appears in more than one level.
 *
 * The 4-level taxonomy must have zero cross-level name overlaps:
 *   L1 = StoreCategoryGroup (12 rubros)
 *   L2 = StoreCategory (44 giros)
 *   L3 = ItemCategoryGroup (9 familias)
 *   L4 = ItemCategory (42 categorias)
 */

import { describe, it, expect } from 'vitest';
import { STORE_CATEGORIES, ITEM_CATEGORIES } from '../../../../shared/schema/categories';
import {
  ALL_STORE_CATEGORY_GROUPS,
  ALL_ITEM_CATEGORY_GROUPS,
  STORE_CATEGORY_GROUPS,
  ITEM_CATEGORY_GROUPS,
} from '../../../../src/config/categoryColors';

describe('Category Schema Integrity', () => {
  const storeGroupNames = ALL_STORE_CATEGORY_GROUPS as readonly string[];
  const storeCategoryNames = STORE_CATEGORIES as readonly string[];
  const itemGroupNames = ALL_ITEM_CATEGORY_GROUPS as readonly string[];
  const itemCategoryNames = ITEM_CATEGORIES as readonly string[];

  const allLevels = [
    { name: 'L1 StoreCategoryGroup', values: storeGroupNames },
    { name: 'L2 StoreCategory', values: storeCategoryNames },
    { name: 'L3 ItemCategoryGroup', values: itemGroupNames },
    { name: 'L4 ItemCategory', values: itemCategoryNames },
  ];

  describe('cross-level name uniqueness', () => {
    it('should have zero category names appearing in more than one level', () => {
      const overlaps: string[] = [];

      for (let i = 0; i < allLevels.length; i++) {
        for (let j = i + 1; j < allLevels.length; j++) {
          const setA = new Set(allLevels[i].values);
          for (const value of allLevels[j].values) {
            if (setA.has(value)) {
              overlaps.push(
                `"${value}" appears in both ${allLevels[i].name} and ${allLevels[j].name}`
              );
            }
          }
        }
      }

      expect(overlaps).toEqual([]);
    });
  });

  describe('within-level uniqueness', () => {
    it.each(allLevels)('$name should have no duplicate values', ({ values }) => {
      const seen = new Set<string>();
      const duplicates: string[] = [];
      for (const v of values) {
        if (seen.has(v)) duplicates.push(v);
        seen.add(v);
      }
      expect(duplicates).toEqual([]);
    });
  });

  describe('group-to-category coverage', () => {
    it('every StoreCategory should belong to exactly one StoreCategoryGroup', () => {
      const mapped = Object.keys(STORE_CATEGORY_GROUPS) as string[];
      const expected = [...STORE_CATEGORIES];
      expect(mapped.sort()).toEqual([...expected].sort());
    });

    it('every ItemCategory should belong to exactly one ItemCategoryGroup', () => {
      const mapped = Object.keys(ITEM_CATEGORY_GROUPS) as string[];
      const expected = [...ITEM_CATEGORIES];
      expect(mapped.sort()).toEqual([...expected].sort());
    });
  });

  describe('expected counts', () => {
    it('should have 12 store category groups (L1)', () => {
      expect(storeGroupNames).toHaveLength(12);
    });

    it('should have 44 store categories (L2)', () => {
      expect(storeCategoryNames).toHaveLength(44);
    });

    it('should have 9 item category groups (L3)', () => {
      expect(itemGroupNames).toHaveLength(9);
    });

    it('should have 42 item categories (L4)', () => {
      expect(itemCategoryNames).toHaveLength(42);
    });
  });
});
