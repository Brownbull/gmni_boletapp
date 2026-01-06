/**
 * Unit tests for categoryColors.ts
 * Story 14.21: Category Color Consolidation
 *
 * Tests the unified category color configuration system across:
 * - 32 Store Categories
 * - 32 Item Categories
 * - 3 Themes: normal, professional, mono
 * - 2 Modes: light, dark
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  type ThemeName,
  type ModeName,
  type CategoryColorSet,
  type GroupColorSet,
  type StoreCategoryGroup,
  type ItemCategoryGroup,
  // Store category functions
  getStoreCategoryColors,
  getStoreCategoryColor,
  getStoreCategoryBackground,
  getStoreCategoryGroup,
  // Item category functions
  getItemCategoryColors,
  getItemCategoryColor,
  getItemCategoryBackground,
  getItemCategoryGroup,
  // Universal functions
  getCategoryColors,
  getCategoryColor,
  getCategoryBackground,
  // Group functions
  getStoreGroupColors,
  getItemGroupColors,
  // Constants
  STORE_CATEGORY_GROUPS,
  ITEM_CATEGORY_GROUPS,
  // Story 14.15c: Group helper functions
  ALL_STORE_CATEGORY_GROUPS,
  expandStoreCategoryGroup,
  detectStoreCategoryGroup,
  getStoreCategoryGroupPrimaryCategory,
} from '../../../src/config/categoryColors';
import type { StoreCategory, ItemCategory } from '../../../src/types/transaction';

// ============================================================================
// Test data
// ============================================================================

const THEMES: ThemeName[] = ['normal', 'professional', 'mono'];
const MODES: ModeName[] = ['light', 'dark'];

// Sample store categories for testing
const SAMPLE_STORE_CATEGORIES: StoreCategory[] = [
  'Supermarket',
  'Restaurant',
  'Pharmacy',
  'Technology',
  'GasStation',
  'Other',
];

// Sample item categories for testing (matches actual ItemCategory type from transaction.ts)
const SAMPLE_ITEM_CATEGORIES: ItemCategory[] = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Beverages',
  'Electronics',
  'Other',
];

// ============================================================================
// Store Category Tests
// ============================================================================

describe('categoryColors - Store Categories', () => {
  describe('getStoreCategoryColors', () => {
    it('returns fg and bg colors for all theme/mode combinations', () => {
      for (const category of SAMPLE_STORE_CATEGORIES) {
        for (const theme of THEMES) {
          for (const mode of MODES) {
            const colors = getStoreCategoryColors(category, theme, mode);

            expect(colors).toHaveProperty('fg');
            expect(colors).toHaveProperty('bg');
            expect(colors.fg).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(colors.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
          }
        }
      }
    });

    it('returns different colors for different themes', () => {
      const normalColors = getStoreCategoryColors('Supermarket', 'normal', 'light');
      const proColors = getStoreCategoryColors('Supermarket', 'professional', 'light');
      const monoColors = getStoreCategoryColors('Supermarket', 'mono', 'light');

      // At least one theme should differ (professional is usually more vibrant)
      expect(
        normalColors.bg !== proColors.bg ||
        normalColors.bg !== monoColors.bg ||
        proColors.bg !== monoColors.bg
      ).toBe(true);
    });

    it('returns different colors for light vs dark mode', () => {
      const lightColors = getStoreCategoryColors('Supermarket', 'normal', 'light');
      const darkColors = getStoreCategoryColors('Supermarket', 'normal', 'dark');

      // Dark mode should have different colors (usually inverted fg/bg pattern)
      expect(lightColors.bg).not.toBe(darkColors.bg);
    });

    it('defaults to normal theme and light mode when not specified', () => {
      const defaultColors = getStoreCategoryColors('Supermarket');
      const explicitColors = getStoreCategoryColors('Supermarket', 'normal', 'light');

      expect(defaultColors.fg).toBe(explicitColors.fg);
      expect(defaultColors.bg).toBe(explicitColors.bg);
    });
  });

  describe('getStoreCategoryColor and getStoreCategoryBackground', () => {
    it('returns individual fg color', () => {
      const colors = getStoreCategoryColors('Restaurant', 'professional', 'light');
      const fg = getStoreCategoryColor('Restaurant', 'professional', 'light');

      expect(fg).toBe(colors.fg);
    });

    it('returns individual bg color', () => {
      const colors = getStoreCategoryColors('Restaurant', 'professional', 'light');
      const bg = getStoreCategoryBackground('Restaurant', 'professional', 'light');

      expect(bg).toBe(colors.bg);
    });
  });

  describe('getStoreCategoryGroup', () => {
    it('returns correct group for food & dining categories', () => {
      expect(getStoreCategoryGroup('Supermarket')).toBe('food-dining');
      expect(getStoreCategoryGroup('Restaurant')).toBe('food-dining');
      expect(getStoreCategoryGroup('Bakery')).toBe('food-dining');
    });

    it('returns correct group for health & wellness categories', () => {
      expect(getStoreCategoryGroup('Pharmacy')).toBe('health-wellness');
      expect(getStoreCategoryGroup('Medical')).toBe('health-wellness');
      expect(getStoreCategoryGroup('HealthBeauty')).toBe('health-wellness');
    });

    it('returns correct group for automotive categories', () => {
      expect(getStoreCategoryGroup('GasStation')).toBe('automotive');
      expect(getStoreCategoryGroup('Automotive')).toBe('automotive');
      expect(getStoreCategoryGroup('Transport')).toBe('automotive');
    });

    it('returns "other" for Other category', () => {
      expect(getStoreCategoryGroup('Other')).toBe('other');
    });
  });
});

// ============================================================================
// Item Category Tests
// ============================================================================

describe('categoryColors - Item Categories', () => {
  describe('getItemCategoryColors', () => {
    it('returns fg and bg colors for all theme/mode combinations', () => {
      for (const category of SAMPLE_ITEM_CATEGORIES) {
        for (const theme of THEMES) {
          for (const mode of MODES) {
            const colors = getItemCategoryColors(category, theme, mode);

            expect(colors).toHaveProperty('fg');
            expect(colors).toHaveProperty('bg');
            expect(colors.fg).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(colors.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
          }
        }
      }
    });

    it('handles item categories with spaces in names', () => {
      const colors = getItemCategoryColors('Meat & Seafood', 'normal', 'light');

      expect(colors.fg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('returns fallback colors for unknown categories', () => {
      const colors = getItemCategoryColors('Unknown Category', 'normal', 'light');

      // Should still return valid colors (fallback)
      expect(colors.fg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('getItemCategoryColor and getItemCategoryBackground', () => {
    it('returns individual fg color', () => {
      const colors = getItemCategoryColors('Produce', 'normal', 'light');
      const fg = getItemCategoryColor('Produce', 'normal', 'light');

      expect(fg).toBe(colors.fg);
    });

    it('returns individual bg color', () => {
      const colors = getItemCategoryColors('Produce', 'normal', 'light');
      const bg = getItemCategoryBackground('Produce', 'normal', 'light');

      expect(bg).toBe(colors.bg);
    });
  });

  describe('getItemCategoryGroup', () => {
    it('returns correct group for food fresh categories', () => {
      expect(getItemCategoryGroup('Produce')).toBe('food-fresh');
      expect(getItemCategoryGroup('Meat & Seafood')).toBe('food-fresh');
      expect(getItemCategoryGroup('Dairy & Eggs')).toBe('food-fresh');
    });

    it('returns correct group for food packaged categories', () => {
      expect(getItemCategoryGroup('Pantry')).toBe('food-packaged');
      expect(getItemCategoryGroup('Snacks')).toBe('food-packaged');
      expect(getItemCategoryGroup('Frozen Foods')).toBe('food-packaged');
    });

    it('returns "other-item" for unknown categories', () => {
      expect(getItemCategoryGroup('Unknown')).toBe('other-item');
    });
  });
});

// ============================================================================
// Universal Category Functions Tests
// ============================================================================

describe('categoryColors - Universal Functions', () => {
  describe('getCategoryColors', () => {
    it('finds store categories first', () => {
      const storeColors = getStoreCategoryColors('Supermarket', 'normal', 'light');
      const universalColors = getCategoryColors('Supermarket', 'normal', 'light');

      expect(universalColors.fg).toBe(storeColors.fg);
      expect(universalColors.bg).toBe(storeColors.bg);
    });

    it('falls back to item categories', () => {
      const itemColors = getItemCategoryColors('Produce', 'normal', 'light');
      const universalColors = getCategoryColors('Produce', 'normal', 'light');

      expect(universalColors.fg).toBe(itemColors.fg);
      expect(universalColors.bg).toBe(itemColors.bg);
    });

    it('returns fallback for completely unknown categories', () => {
      const colors = getCategoryColors('CompletelyUnknown', 'normal', 'light');

      expect(colors.fg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('getCategoryColor and getCategoryBackground', () => {
    it('getCategoryColor returns fg', () => {
      const colors = getCategoryColors('Restaurant', 'professional', 'dark');
      const fg = getCategoryColor('Restaurant', 'professional', 'dark');

      expect(fg).toBe(colors.fg);
    });

    it('getCategoryBackground returns bg', () => {
      const colors = getCategoryColors('Restaurant', 'professional', 'dark');
      const bg = getCategoryBackground('Restaurant', 'professional', 'dark');

      expect(bg).toBe(colors.bg);
    });
  });
});

// ============================================================================
// Group Color Tests
// ============================================================================

describe('categoryColors - Group Colors', () => {
  const STORE_GROUPS: StoreCategoryGroup[] = [
    'food-dining',
    'health-wellness',
    'retail-general',
    'retail-specialty',
    'automotive',
    'services',
    'hospitality',
    'other',
  ];

  const ITEM_GROUPS: ItemCategoryGroup[] = [
    'food-fresh',
    'food-packaged',
    'health-personal',
    'household',
    'nonfood-retail',
    'services-fees',
    'other-item',
  ];

  describe('getStoreGroupColors', () => {
    it('returns fg, bg, and border colors for all groups', () => {
      for (const group of STORE_GROUPS) {
        for (const theme of THEMES) {
          for (const mode of MODES) {
            const colors = getStoreGroupColors(group, theme, mode);

            expect(colors).toHaveProperty('fg');
            expect(colors).toHaveProperty('bg');
            expect(colors).toHaveProperty('border');
            expect(colors.fg).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(colors.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(colors.border).toMatch(/^#[0-9a-fA-F]{6}$/);
          }
        }
      }
    });
  });

  describe('getItemGroupColors', () => {
    it('returns fg, bg, and border colors for all groups', () => {
      for (const group of ITEM_GROUPS) {
        for (const theme of THEMES) {
          for (const mode of MODES) {
            const colors = getItemGroupColors(group, theme, mode);

            expect(colors).toHaveProperty('fg');
            expect(colors).toHaveProperty('bg');
            expect(colors).toHaveProperty('border');
            expect(colors.fg).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(colors.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
            expect(colors.border).toMatch(/^#[0-9a-fA-F]{6}$/);
          }
        }
      }
    });
  });
});

// ============================================================================
// All 32 Store Categories Coverage Test
// ============================================================================

describe('categoryColors - Full Store Category Coverage', () => {
  const ALL_STORE_CATEGORIES: StoreCategory[] = [
    'Supermarket',
    'Restaurant',
    'Bakery',
    'Butcher',
    'StreetVendor',
    'Pharmacy',
    'Medical',
    'Veterinary',
    'HealthBeauty',
    'Bazaar',
    'Clothing',
    'Electronics',
    'HomeGoods',
    'Furniture',
    'Hardware',
    'GardenCenter',
    'PetShop',
    'BooksMedia',
    'OfficeSupplies',
    'SportsOutdoors',
    'ToysGames',
    'Jewelry',
    'Optical',
    'Automotive',
    'GasStation',
    'Transport',
    'Services',
    'BankingFinance',
    'Education',
    'Entertainment',
    'TravelAgency',
    'HotelLodging',
    'CharityDonation',
    'Other',
  ];

  it('has colors defined for all 32 store categories', () => {
    for (const category of ALL_STORE_CATEGORIES) {
      const colors = getStoreCategoryColors(category, 'normal', 'light');

      expect(colors.fg, `Missing fg for ${category}`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.bg, `Missing bg for ${category}`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('has group mapping for all 32 store categories', () => {
    for (const category of ALL_STORE_CATEGORIES) {
      const group = getStoreCategoryGroup(category);

      expect(
        ['food-dining', 'health-wellness', 'retail-general', 'retail-specialty', 'automotive', 'services', 'hospitality', 'other']
      ).toContain(group);
    }
  });
});

// ============================================================================
// All 32 Item Categories Coverage Test
// ============================================================================

describe('categoryColors - Full Item Category Coverage', () => {
  // Matches actual ItemCategory type from transaction.ts
  const ALL_ITEM_CATEGORIES: ItemCategory[] = [
    // Food - Fresh
    'Produce',
    'Meat & Seafood',
    'Bakery',
    'Dairy & Eggs',
    // Food - Packaged
    'Pantry',
    'Frozen Foods',
    'Snacks',
    'Beverages',
    'Alcohol',
    // Health & Personal
    'Health & Beauty',
    'Personal Care',
    'Pharmacy',
    'Supplements',
    'Baby Products',
    // Household
    'Cleaning Supplies',
    'Household',
    'Pet Supplies',
    // Non-Food Retail
    'Clothing',
    'Electronics',
    'Hardware',
    'Garden',
    'Automotive',
    'Sports & Outdoors',
    'Toys & Games',
    'Books & Media',
    'Office & Stationery',
    'Crafts & Hobbies',
    'Furniture',
    // Services & Fees
    'Service',
    'Tax & Fees',
    'Tobacco',
    // Catch-all
    'Other',
  ];

  it('has colors defined for all 32 item categories', () => {
    for (const category of ALL_ITEM_CATEGORIES) {
      const colors = getItemCategoryColors(category, 'normal', 'light');

      expect(colors.fg, `Missing fg for ${category}`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.bg, `Missing bg for ${category}`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('has group mapping for all item categories', () => {
    for (const category of ALL_ITEM_CATEGORIES) {
      const group = getItemCategoryGroup(category);

      expect(
        ['food-fresh', 'food-packaged', 'health-personal', 'household', 'nonfood-retail', 'services-fees', 'other-item']
      ).toContain(group);
    }
  });
});

// ============================================================================
// All 6 Theme/Mode Combinations Test
// ============================================================================

describe('categoryColors - Theme/Mode Combinations', () => {
  it('all 6 combinations return distinct color sets', () => {
    const allColors: string[] = [];

    for (const theme of THEMES) {
      for (const mode of MODES) {
        const colors = getStoreCategoryColors('Supermarket', theme, mode);
        allColors.push(`${colors.fg}-${colors.bg}`);
      }
    }

    // We expect some uniqueness (not all 6 need to be unique, but not all the same)
    const uniqueColors = new Set(allColors);
    expect(uniqueColors.size).toBeGreaterThan(1);
  });

  it('dark mode has appropriately inverted colors', () => {
    // In dark mode, backgrounds are typically darker and foregrounds lighter
    // This is a basic sanity check
    const lightColors = getStoreCategoryColors('Technology', 'professional', 'light');
    const darkColors = getStoreCategoryColors('Technology', 'professional', 'dark');

    // The colors should be different between light and dark
    expect(lightColors.bg).not.toBe(darkColors.bg);
    expect(lightColors.fg).not.toBe(darkColors.fg);
  });
});

// ============================================================================
// Story 14.15c: Category Group Filter Helpers
// ============================================================================

describe('categoryColors - Story 14.15c Group Helpers', () => {
  describe('ALL_STORE_CATEGORY_GROUPS', () => {
    it('contains all 8 store category groups', () => {
      expect(ALL_STORE_CATEGORY_GROUPS).toHaveLength(8);
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('food-dining');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('health-wellness');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('retail-general');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('retail-specialty');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('automotive');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('services');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('hospitality');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('other');
    });
  });

  describe('expandStoreCategoryGroup', () => {
    it('expands food-dining group to correct categories', () => {
      const categories = expandStoreCategoryGroup('food-dining');

      expect(categories).toContain('Supermarket');
      expect(categories).toContain('Restaurant');
      expect(categories).toContain('Bakery');
      expect(categories).toContain('Butcher');
      expect(categories).toContain('StreetVendor');
      expect(categories.length).toBeGreaterThanOrEqual(5);
    });

    it('expands health-wellness group to correct categories', () => {
      const categories = expandStoreCategoryGroup('health-wellness');

      expect(categories).toContain('Pharmacy');
      expect(categories).toContain('Medical');
      expect(categories).toContain('Veterinary');
      expect(categories).toContain('HealthBeauty');
    });

    it('expands automotive group to correct categories', () => {
      const categories = expandStoreCategoryGroup('automotive');

      expect(categories).toContain('Automotive');
      expect(categories).toContain('GasStation');
      expect(categories).toContain('Transport');
    });

    it('expands other group to just "Other"', () => {
      const categories = expandStoreCategoryGroup('other');

      expect(categories).toContain('Other');
    });

    it('all groups expand to at least one category', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        const categories = expandStoreCategoryGroup(group);
        expect(categories.length).toBeGreaterThan(0);
      }
    });
  });

  describe('detectStoreCategoryGroup', () => {
    it('detects food-dining group from exact category list', () => {
      const foodCategories = expandStoreCategoryGroup('food-dining');
      const detected = detectStoreCategoryGroup(foodCategories);

      expect(detected).toBe('food-dining');
    });

    it('detects health-wellness group from exact category list', () => {
      const healthCategories = expandStoreCategoryGroup('health-wellness');
      const detected = detectStoreCategoryGroup(healthCategories);

      expect(detected).toBe('health-wellness');
    });

    it('detects automotive group from exact category list', () => {
      const autoCategories = expandStoreCategoryGroup('automotive');
      const detected = detectStoreCategoryGroup(autoCategories);

      expect(detected).toBe('automotive');
    });

    it('returns null for partial group selection', () => {
      // Only Supermarket and Restaurant (partial food-dining)
      const partialCategories = ['Supermarket', 'Restaurant'];
      const detected = detectStoreCategoryGroup(partialCategories);

      expect(detected).toBeNull();
    });

    it('returns null for mixed categories from different groups', () => {
      const mixedCategories = ['Supermarket', 'Pharmacy', 'GasStation'];
      const detected = detectStoreCategoryGroup(mixedCategories);

      expect(detected).toBeNull();
    });

    it('returns null for empty array', () => {
      const detected = detectStoreCategoryGroup([]);
      expect(detected).toBeNull();
    });

    it('detects group regardless of category order', () => {
      const foodCategories = expandStoreCategoryGroup('food-dining');
      // Shuffle the array
      const shuffled = [...foodCategories].reverse();
      const detected = detectStoreCategoryGroup(shuffled);

      expect(detected).toBe('food-dining');
    });
  });

  describe('getStoreCategoryGroupPrimaryCategory', () => {
    it('returns first category for food-dining group', () => {
      const primary = getStoreCategoryGroupPrimaryCategory('food-dining');
      const categories = expandStoreCategoryGroup('food-dining');

      expect(primary).toBe(categories[0]);
    });

    it('returns first category for each group', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        const primary = getStoreCategoryGroupPrimaryCategory(group);
        const categories = expandStoreCategoryGroup(group);

        expect(primary).toBe(categories[0]);
      }
    });
  });

  describe('group detection roundtrip', () => {
    it('expand -> detect roundtrips correctly for all groups', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        const expanded = expandStoreCategoryGroup(group);
        const detected = detectStoreCategoryGroup(expanded);

        expect(detected).toBe(group);
      }
    });
  });
});
