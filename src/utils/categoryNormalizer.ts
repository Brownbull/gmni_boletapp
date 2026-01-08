/**
 * Category Normalizer Utility
 *
 * Story 14.15b: V3 Prompt Production Integration
 *
 * Normalizes legacy category names (V1/V2) to current V3 standard categories.
 * Also normalizes translated category names (e.g., Spanish) back to English
 * canonical keys for consistent lookups in analytics.
 *
 * Applied when reading transactions from Firestore to ensure consistent
 * category names across analytics, filtering, and display.
 *
 * LEGACY CATEGORY MAPPING:
 * - V1/V2 used different category names that need normalization
 * - V3 standardized categories in shared/schema/categories.ts
 *
 * LANGUAGE NORMALIZATION:
 * - Items may be stored with translated category names (e.g., Spanish)
 * - normalizeItemCategory() converts these to English canonical keys
 * - Example: 'Frutas y Verduras' → 'Produce'
 *
 * USAGE:
 * - Apply normalizeItemCategory() when reading item.category from Firestore
 * - Apply normalizeStoreCategory() when reading tx.category from Firestore
 * - These are read-time normalizations - no need to migrate stored data
 *
 * @see docs/sprint-artifacts/epic14/stories/story-14.15b-v3-prompt-integration.md
 * @see shared/schema/categories.ts
 */

import { normalizeItemGroupToEnglish } from './categoryTranslations';

// ============================================================================
// Legacy Item Category Mappings (V1/V2 -> V3)
// ============================================================================

/**
 * Maps legacy item category names to their V3 equivalents.
 * Keys are legacy names (V1/V2), values are V3 standard names.
 */
const LEGACY_ITEM_CATEGORY_MAP: Record<string, string> = {
  // Food category renames
  'Fresh Food': 'Produce',
  'Drinks': 'Beverages',
  'Drinks & Beverages': 'Beverages',

  // Pet category rename
  'Pets': 'Pet Supplies',

  // Apparel/Clothing normalization
  'Apparel': 'Clothing',

  // Technology -> Electronics
  'Technology': 'Electronics',
  'Tech': 'Electronics',

  // Office supplies normalization
  'Office': 'Office & Stationery',
  'Stationery': 'Office & Stationery',

  // Sports normalization
  'Sports': 'Sports & Outdoors',
  'Outdoors': 'Sports & Outdoors',

  // Books normalization
  'Books': 'Books & Media',
  'Media': 'Books & Media',

  // Toys normalization
  'Toys': 'Toys & Games',
  'Games': 'Toys & Games',

  // Crafts normalization
  'Crafts': 'Crafts & Hobbies',
  'Hobbies': 'Crafts & Hobbies',

  // Meat normalization
  'Meat': 'Meat & Seafood',
  'Seafood': 'Meat & Seafood',

  // Dairy normalization
  'Dairy': 'Dairy & Eggs',
  'Eggs': 'Dairy & Eggs',

  // Health normalization
  'Health': 'Health & Beauty',
  'Beauty': 'Health & Beauty',

  // Tickets normalization
  'Tickets': 'Tickets & Events',
  'Events': 'Tickets & Events',

  // Tax normalization
  'Tax': 'Tax & Fees',
  'Fees': 'Tax & Fees',
};

/**
 * Maps legacy store category names to their V3 equivalents.
 * Most store categories remained stable, but a few were renamed/merged.
 */
const LEGACY_STORE_CATEGORY_MAP: Record<string, string> = {
  // Health/Beauty store normalization
  'Beauty': 'HealthBeauty',
  'Salon': 'HealthBeauty',
  'Spa': 'HealthBeauty',

  // Pet store normalization
  'Pet Store': 'PetShop',
  'Pets': 'PetShop',

  // Transport normalization
  'Parking': 'Transport',
  'Taxi': 'Transport',
  'Ride Share': 'Transport',
  'Public Transit': 'Transport',
  'Bus': 'Transport',
  'Metro': 'Transport',

  // Books normalization
  'Bookstore': 'BooksMedia',
  'Books': 'BooksMedia',

  // Home normalization
  'Home': 'HomeGoods',
  'Home Decor': 'HomeGoods',
  'Kitchenware': 'HomeGoods',

  // Garden normalization
  'Garden': 'GardenCenter',
  'Plant Nursery': 'GardenCenter',

  // Office normalization
  'Office': 'OfficeSupplies',

  // Sports normalization
  'Sports': 'SportsOutdoors',
  'Outdoors': 'SportsOutdoors',

  // Toys normalization
  'Toy Store': 'ToysGames',
  'Game Shop': 'ToysGames',

  // Travel normalization
  'Travel': 'TravelAgency',
  'Tour Operator': 'TravelAgency',

  // Hotel normalization
  'Hotel': 'HotelLodging',
  'Hostel': 'HotelLodging',
  'Lodging': 'HotelLodging',

  // Banking normalization
  'Bank': 'BankingFinance',
  'Finance': 'BankingFinance',
  'Insurance': 'BankingFinance',

  // Charity normalization
  'Charity': 'CharityDonation',
  'Donation': 'CharityDonation',
  'Nonprofit': 'CharityDonation',
};

// ============================================================================
// Normalizer Functions
// ============================================================================

/**
 * Normalize an item category name from legacy (V1/V2) or translated to V3 standard English.
 *
 * This function handles two types of normalization:
 * 1. Legacy V1/V2 names → V3 standard (e.g., 'Fresh Food' → 'Produce')
 * 2. Translated names → English canonical (e.g., 'Frutas y Verduras' → 'Produce')
 *
 * @param category - The item category name from Firestore (may be legacy or translated)
 * @returns The normalized V3 English category name, or the original if no mapping exists
 *
 * @example
 * normalizeItemCategory('Fresh Food')         // Returns 'Produce' (legacy V1/V2)
 * normalizeItemCategory('Frutas y Verduras')  // Returns 'Produce' (Spanish translation)
 * normalizeItemCategory('Produce')            // Returns 'Produce' (already V3 English)
 * normalizeItemCategory('Unknown')            // Returns 'Unknown' (no mapping)
 */
export function normalizeItemCategory(category: string): string {
  if (!category) return category;

  // First, try legacy V1/V2 mapping
  if (LEGACY_ITEM_CATEGORY_MAP[category]) {
    return LEGACY_ITEM_CATEGORY_MAP[category];
  }

  // Then, try language normalization (Spanish → English)
  const englishKey = normalizeItemGroupToEnglish(category);

  // If language normalization found a match, return it
  if (englishKey !== category) {
    return englishKey;
  }

  // Return original if no mapping found
  return category;
}

/**
 * Normalize a store category name from legacy (V1/V2) to V3 standard.
 *
 * @param category - The store category name from Firestore
 * @returns The normalized V3 category name, or the original if no mapping exists
 *
 * @example
 * normalizeStoreCategory('Pet Store')  // Returns 'PetShop'
 * normalizeStoreCategory('PetShop')    // Returns 'PetShop' (already V3)
 * normalizeStoreCategory('Unknown')    // Returns 'Unknown' (no mapping)
 */
export function normalizeStoreCategory(category: string): string {
  if (!category) return category;
  return LEGACY_STORE_CATEGORY_MAP[category] || category;
}

/**
 * Check if a category name is a legacy (pre-V3) name that needs normalization.
 *
 * @param category - The category name to check
 * @param type - 'item' or 'store' to specify which mapping to check
 * @returns True if the category is a legacy name, false otherwise
 */
export function isLegacyCategory(category: string, type: 'item' | 'store'): boolean {
  if (!category) return false;
  const map = type === 'item' ? LEGACY_ITEM_CATEGORY_MAP : LEGACY_STORE_CATEGORY_MAP;
  return category in map;
}

/**
 * Get all legacy category mappings for reference/debugging.
 *
 * @returns Object containing both item and store legacy mappings
 */
export function getLegacyMappings(): {
  itemCategories: Record<string, string>;
  storeCategories: Record<string, string>;
} {
  return {
    itemCategories: { ...LEGACY_ITEM_CATEGORY_MAP },
    storeCategories: { ...LEGACY_STORE_CATEGORY_MAP },
  };
}
