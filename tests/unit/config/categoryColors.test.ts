/**
 * Unit tests for categoryColors.ts
 * Story 14.21: Category Color Consolidation
 * Updated for V4 taxonomy (Story 17-2)
 *
 * Tests the unified category color configuration system across:
 * - 44 Store Categories (L2 giros)
 * - 42 Item Categories (L4 categorias)
 * - 3 Themes: normal, professional, mono
 * - 2 Modes: light, dark
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  type ThemeName,
  type ModeName,
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
  // Group helper functions
  ALL_STORE_CATEGORY_GROUPS,
  ALL_ITEM_CATEGORY_GROUPS,
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

// Sample store categories for testing (V4)
const SAMPLE_STORE_CATEGORIES: StoreCategory[] = [
  'Supermarket',
  'Restaurant',
  'Pharmacy',
  'ElectronicsStore',
  'GasStation',
  'Other',
];

// Sample item categories for testing (V4 PascalCase)
const SAMPLE_ITEM_CATEGORIES: ItemCategory[] = [
  'Produce',
  'MeatSeafood',
  'DairyEggs',
  'Beverages',
  'Technology',
  'OtherItem',
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
    it('returns correct group for supermercados categories', () => {
      expect(getStoreCategoryGroup('Supermarket')).toBe('supermercados');
      expect(getStoreCategoryGroup('Wholesale')).toBe('supermercados');
    });

    it('returns correct group for comercio-barrio categories', () => {
      expect(getStoreCategoryGroup('Bakery')).toBe('comercio-barrio');
      expect(getStoreCategoryGroup('Butcher')).toBe('comercio-barrio');
      expect(getStoreCategoryGroup('Almacen')).toBe('comercio-barrio');
    });

    it('returns correct group for salud-bienestar categories', () => {
      expect(getStoreCategoryGroup('Pharmacy')).toBe('salud-bienestar');
      expect(getStoreCategoryGroup('Medical')).toBe('salud-bienestar');
      expect(getStoreCategoryGroup('HealthBeauty')).toBe('salud-bienestar');
    });

    it('returns correct group for transporte-vehiculo categories', () => {
      expect(getStoreCategoryGroup('GasStation')).toBe('transporte-vehiculo');
      expect(getStoreCategoryGroup('AutoShop')).toBe('transporte-vehiculo');
      expect(getStoreCategoryGroup('Transport')).toBe('transporte-vehiculo');
    });

    it('returns "otros" for Other category', () => {
      expect(getStoreCategoryGroup('Other')).toBe('otros');
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

    it('handles V4 PascalCase item categories', () => {
      const colors = getItemCategoryColors('MeatSeafood', 'normal', 'light');

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
      expect(getItemCategoryGroup('MeatSeafood')).toBe('food-fresh');
      expect(getItemCategoryGroup('DairyEggs')).toBe('food-fresh');
    });

    it('returns correct group for food packaged categories', () => {
      expect(getItemCategoryGroup('Pantry')).toBe('food-packaged');
      expect(getItemCategoryGroup('Snacks')).toBe('food-packaged');
      expect(getItemCategoryGroup('FrozenFoods')).toBe('food-packaged');
    });

    it('returns correct group for vicios categories', () => {
      expect(getItemCategoryGroup('Alcohol')).toBe('vicios');
      expect(getItemCategoryGroup('Tobacco')).toBe('vicios');
      expect(getItemCategoryGroup('GamesOfChance')).toBe('vicios');
    });

    it('returns "otros-item" for unknown categories', () => {
      expect(getItemCategoryGroup('Unknown')).toBe('otros-item');
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
// Group Color Tests — V4
// ============================================================================

describe('categoryColors - Group Colors', () => {
  const STORE_GROUPS: StoreCategoryGroup[] = [
    'supermercados',
    'restaurantes',
    'comercio-barrio',
    'vivienda',
    'salud-bienestar',
    'tiendas-generales',
    'tiendas-especializadas',
    'transporte-vehiculo',
    'educacion',
    'servicios-finanzas',
    'entretenimiento-hospedaje',
    'otros',
  ];

  const ITEM_GROUPS: ItemCategoryGroup[] = [
    'food-fresh',
    'food-packaged',
    'food-prepared',
    'salud-cuidado',
    'hogar',
    'productos-generales',
    'servicios-cargos',
    'vicios',
    'otros-item',
  ];

  describe('getStoreGroupColors', () => {
    it('returns fg, bg, and border colors for all 12 groups', () => {
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
    it('returns fg, bg, and border colors for all 9 groups', () => {
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
// All 44 Store Categories Coverage Test
// ============================================================================

describe('categoryColors - Full Store Category Coverage', () => {
  const ALL_STORE_CATEGORIES: StoreCategory[] = [
    'Supermarket', 'Wholesale',
    'Restaurant',
    'Almacen', 'Minimarket', 'OpenMarket', 'Kiosk', 'LiquorStore', 'Bakery', 'Butcher',
    'UtilityCompany', 'PropertyAdmin',
    'Pharmacy', 'Medical', 'Veterinary', 'HealthBeauty',
    'Bazaar', 'ClothingStore', 'ElectronicsStore', 'HomeGoods', 'FurnitureStore', 'Hardware', 'GardenCenter',
    'PetShop', 'BookStore', 'OfficeSupplies', 'SportsStore', 'ToyStore', 'AccessoriesOptical', 'OnlineStore',
    'AutoShop', 'GasStation', 'Transport',
    'GeneralServices', 'BankingFinance', 'TravelAgency', 'SubscriptionService', 'Government',
    'Education',
    'Lodging', 'Entertainment', 'Casino',
    'CharityDonation', 'Other',
  ];

  it('has colors defined for all 44 store categories', () => {
    for (const category of ALL_STORE_CATEGORIES) {
      const colors = getStoreCategoryColors(category, 'normal', 'light');

      expect(colors.fg, `Missing fg for ${category}`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.bg, `Missing bg for ${category}`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('has group mapping for all 44 store categories', () => {
    const V4_STORE_GROUPS = [
      'supermercados', 'restaurantes', 'comercio-barrio', 'vivienda',
      'salud-bienestar', 'tiendas-generales', 'tiendas-especializadas',
      'transporte-vehiculo', 'educacion', 'servicios-finanzas',
      'entretenimiento-hospedaje', 'otros',
    ];
    for (const category of ALL_STORE_CATEGORIES) {
      const group = getStoreCategoryGroup(category);
      expect(V4_STORE_GROUPS).toContain(group);
    }
  });
});

// ============================================================================
// All 42 Item Categories Coverage Test
// ============================================================================

describe('categoryColors - Full Item Category Coverage', () => {
  const ALL_ITEM_CATEGORIES: ItemCategory[] = [
    'Produce', 'MeatSeafood', 'BreadPastry', 'DairyEggs',
    'Pantry', 'FrozenFoods', 'Snacks', 'Beverages',
    'PreparedFood',
    'BeautyCosmetics', 'PersonalCare', 'Medications', 'Supplements', 'BabyProducts',
    'CleaningSupplies', 'HomeEssentials', 'PetSupplies', 'PetFood', 'Furnishings',
    'Apparel', 'Technology', 'Tools', 'Garden', 'CarAccessories', 'SportsOutdoors', 'ToysGames', 'BooksMedia', 'OfficeStationery', 'Crafts',
    'ServiceCharge', 'TaxFees', 'Subscription', 'Insurance', 'LoanPayment', 'TicketsEvents', 'HouseholdBills', 'CondoFees', 'EducationFees',
    'Alcohol', 'Tobacco', 'GamesOfChance',
    'OtherItem',
  ];

  it('has colors defined for all 42 item categories', () => {
    for (const category of ALL_ITEM_CATEGORIES) {
      const colors = getItemCategoryColors(category, 'normal', 'light');

      expect(colors.fg, `Missing fg for ${category}`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.bg, `Missing bg for ${category}`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('has group mapping for all item categories', () => {
    const V4_ITEM_GROUPS = [
      'food-fresh', 'food-packaged', 'food-prepared',
      'salud-cuidado', 'hogar', 'productos-generales',
      'servicios-cargos', 'vicios', 'otros-item',
    ];
    for (const category of ALL_ITEM_CATEGORIES) {
      const group = getItemCategoryGroup(category);
      expect(V4_ITEM_GROUPS).toContain(group);
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

    const uniqueColors = new Set(allColors);
    expect(uniqueColors.size).toBeGreaterThan(1);
  });

  it('dark mode has appropriately inverted colors', () => {
    const lightColors = getStoreCategoryColors('ElectronicsStore', 'professional', 'light');
    const darkColors = getStoreCategoryColors('ElectronicsStore', 'professional', 'dark');

    expect(lightColors.bg).not.toBe(darkColors.bg);
    expect(lightColors.fg).not.toBe(darkColors.fg);
  });
});

// ============================================================================
// V4 Category Group Filter Helpers
// ============================================================================

describe('categoryColors - V4 Group Helpers', () => {
  describe('ALL_STORE_CATEGORY_GROUPS', () => {
    it('contains all 12 store category groups', () => {
      expect(ALL_STORE_CATEGORY_GROUPS).toHaveLength(12);
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('supermercados');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('restaurantes');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('comercio-barrio');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('vivienda');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('salud-bienestar');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('tiendas-generales');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('tiendas-especializadas');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('transporte-vehiculo');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('educacion');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('servicios-finanzas');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('entretenimiento-hospedaje');
      expect(ALL_STORE_CATEGORY_GROUPS).toContain('otros');
    });
  });

  describe('ALL_ITEM_CATEGORY_GROUPS', () => {
    it('contains all 9 item category groups', () => {
      expect(ALL_ITEM_CATEGORY_GROUPS).toHaveLength(9);
      expect(ALL_ITEM_CATEGORY_GROUPS).toContain('food-fresh');
      expect(ALL_ITEM_CATEGORY_GROUPS).toContain('food-packaged');
      expect(ALL_ITEM_CATEGORY_GROUPS).toContain('food-prepared');
      expect(ALL_ITEM_CATEGORY_GROUPS).toContain('salud-cuidado');
      expect(ALL_ITEM_CATEGORY_GROUPS).toContain('hogar');
      expect(ALL_ITEM_CATEGORY_GROUPS).toContain('productos-generales');
      expect(ALL_ITEM_CATEGORY_GROUPS).toContain('servicios-cargos');
      expect(ALL_ITEM_CATEGORY_GROUPS).toContain('vicios');
      expect(ALL_ITEM_CATEGORY_GROUPS).toContain('otros-item');
    });
  });

  describe('expandStoreCategoryGroup', () => {
    it('expands supermercados group to correct categories', () => {
      const categories = expandStoreCategoryGroup('supermercados');

      expect(categories).toContain('Supermarket');
      expect(categories).toContain('Wholesale');
      expect(categories).toHaveLength(2);
    });

    it('expands comercio-barrio group to correct categories', () => {
      const categories = expandStoreCategoryGroup('comercio-barrio');

      expect(categories).toContain('Almacen');
      expect(categories).toContain('Minimarket');
      expect(categories).toContain('OpenMarket');
      expect(categories).toContain('Kiosk');
      expect(categories).toContain('LiquorStore');
      expect(categories).toContain('Bakery');
      expect(categories).toContain('Butcher');
      expect(categories).toHaveLength(7);
    });

    it('expands salud-bienestar group to correct categories', () => {
      const categories = expandStoreCategoryGroup('salud-bienestar');

      expect(categories).toContain('Pharmacy');
      expect(categories).toContain('Medical');
      expect(categories).toContain('Veterinary');
      expect(categories).toContain('HealthBeauty');
    });

    it('expands transporte-vehiculo group to correct categories', () => {
      const categories = expandStoreCategoryGroup('transporte-vehiculo');

      expect(categories).toContain('AutoShop');
      expect(categories).toContain('GasStation');
      expect(categories).toContain('Transport');
    });

    it('expands otros group', () => {
      const categories = expandStoreCategoryGroup('otros');

      expect(categories).toContain('Other');
      expect(categories).toContain('CharityDonation');
    });

    it('all groups expand to at least one category', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        const categories = expandStoreCategoryGroup(group);
        expect(categories.length).toBeGreaterThan(0);
      }
    });
  });

  describe('detectStoreCategoryGroup', () => {
    it('detects supermercados group from exact category list', () => {
      const categories = expandStoreCategoryGroup('supermercados');
      const detected = detectStoreCategoryGroup(categories);

      expect(detected).toBe('supermercados');
    });

    it('detects salud-bienestar group from exact category list', () => {
      const healthCategories = expandStoreCategoryGroup('salud-bienestar');
      const detected = detectStoreCategoryGroup(healthCategories);

      expect(detected).toBe('salud-bienestar');
    });

    it('detects transporte-vehiculo group from exact category list', () => {
      const autoCategories = expandStoreCategoryGroup('transporte-vehiculo');
      const detected = detectStoreCategoryGroup(autoCategories);

      expect(detected).toBe('transporte-vehiculo');
    });

    it('returns null for partial group selection', () => {
      const partialCategories = ['Supermarket'];
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
      const categories = expandStoreCategoryGroup('supermercados');
      const shuffled = [...categories].reverse();
      const detected = detectStoreCategoryGroup(shuffled);

      expect(detected).toBe('supermercados');
    });
  });

  describe('getStoreCategoryGroupPrimaryCategory', () => {
    it('returns first category for supermercados group', () => {
      const primary = getStoreCategoryGroupPrimaryCategory('supermercados');
      const categories = expandStoreCategoryGroup('supermercados');

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
