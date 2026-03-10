// Tests for categoryNormalizer.ts — Story TD-17-1
// All 58 item + 48 store legacy mappings, edge cases, reverse-lookup, utilities
import { describe, it, expect } from 'vitest';
import {
  normalizeItemCategory,
  normalizeStoreCategory,
  isLegacyCategory,
  getLegacyMappings,
} from '@/utils/categoryNormalizer';
import { normalizeItemGroupToEnglish } from '@/utils/categoryTranslations';

describe('normalizeItemCategory', () => {
  // V1/V2 -> V4
  const v1v2ItemMappings: [string, string][] = [
    ['Fresh Food', 'Produce'],
    ['Drinks', 'Beverages'],
    ['Drinks & Beverages', 'Beverages'],
    ['Pets', 'PetSupplies'],
    ['Tech', 'Technology'],
    ['Office', 'OfficeStationery'],
    ['Stationery', 'OfficeStationery'],
    ['Sports', 'SportsOutdoors'],
    ['Outdoors', 'SportsOutdoors'],
    ['Books', 'BooksMedia'],
    ['Media', 'BooksMedia'],
    ['Toys', 'ToysGames'],
    ['Games', 'ToysGames'],
    ['Hobbies', 'Crafts'],
    ['Meat', 'MeatSeafood'],
    ['Seafood', 'MeatSeafood'],
    ['Dairy', 'DairyEggs'],
    ['Eggs', 'DairyEggs'],
    ['Health', 'BeautyCosmetics'],
    ['Beauty', 'BeautyCosmetics'],
    ['Tickets', 'TicketsEvents'],
    ['Events', 'TicketsEvents'],
    ['Tax', 'TaxFees'],
    ['Fees', 'TaxFees'],
  ];

  // V3 -> V4
  const v3ItemMappings: [string, string][] = [
    ['Bakery', 'BreadPastry'],
    ['Meat & Seafood', 'MeatSeafood'],
    ['Dairy & Eggs', 'DairyEggs'],
    ['Frozen Foods', 'FrozenFoods'],
    ['Health & Beauty', 'BeautyCosmetics'],
    ['Personal Care', 'PersonalCare'],
    ['Pharmacy', 'Medications'],
    ['Baby Products', 'BabyProducts'],
    ['Cleaning Supplies', 'CleaningSupplies'],
    ['Household', 'HomeEssentials'],
    ['Pet Supplies', 'PetSupplies'],
    ['Clothing', 'Apparel'],
    ['Electronics', 'Technology'],
    ['Hardware', 'Tools'],
    ['Automotive', 'CarAccessories'],
    ['Sports & Outdoors', 'SportsOutdoors'],
    ['Toys & Games', 'ToysGames'],
    ['Books & Media', 'BooksMedia'],
    ['Office & Stationery', 'OfficeStationery'],
    ['Crafts & Hobbies', 'Crafts'],
    ['Furniture', 'Furnishings'],
    ['Musical Instruments', 'Technology'],
    ['Prepared Food', 'PreparedFood'],
    ['Service', 'ServiceCharge'],
    ['Tax & Fees', 'TaxFees'],
    ['Subscription', 'Subscription'],
    ['Insurance', 'Insurance'],
    ['Loan Payment', 'LoanPayment'],
    ['Tickets & Events', 'TicketsEvents'],
    ['Tobacco', 'Tobacco'],
    ['Gambling', 'GamesOfChance'],
    ['Education', 'EducationFees'],
    ['Other', 'OtherItem'],
  ];

  // Identity mapping
  const identityItemMappings: [string, string][] = [
    ['Apparel', 'Apparel'],
  ];

  it.each([...v1v2ItemMappings, ...v3ItemMappings, ...identityItemMappings])(
    'maps item "%s" -> "%s"',
    (input, expected) => {
      expect(normalizeItemCategory(input)).toBe(expected);
    },
  );

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(normalizeItemCategory('')).toBe('');
    });

    it('returns undefined for undefined input', () => {
      expect(normalizeItemCategory(undefined as unknown as string)).toBe(undefined);
    });

    it('passes through V4 key not in legacy map', () => {
      expect(normalizeItemCategory('Produce')).toBe('Produce');
    });

    it('passes through unknown category', () => {
      expect(normalizeItemCategory('TotallyUnknown')).toBe('TotallyUnknown');
    });
  });
});

describe('normalizeStoreCategory', () => {
  // V1/V2 -> V4
  const v1v2StoreMappings: [string, string][] = [
    ['Beauty', 'HealthBeauty'],
    ['Salon', 'HealthBeauty'],
    ['Spa', 'HealthBeauty'],
    ['Pet Store', 'PetShop'],
    ['Pets', 'PetShop'],
    ['Parking', 'Transport'],
    ['Taxi', 'Transport'],
    ['Ride Share', 'Transport'],
    ['Public Transit', 'Transport'],
    ['Bus', 'Transport'],
    ['Metro', 'Transport'],
    ['Bookstore', 'BookStore'],
    ['Books', 'BookStore'],
    ['Home', 'HomeGoods'],
    ['Home Decor', 'HomeGoods'],
    ['Kitchenware', 'HomeGoods'],
    ['Garden', 'GardenCenter'],
    ['Plant Nursery', 'GardenCenter'],
    ['Office', 'OfficeSupplies'],
    ['Sports', 'SportsStore'],
    ['Outdoors', 'SportsStore'],
    ['Toy Store', 'ToyStore'],
    ['Game Shop', 'ToyStore'],
    ['Travel', 'TravelAgency'],
    ['Tour Operator', 'TravelAgency'],
    ['Hotel', 'Lodging'],
    ['Hostel', 'Lodging'],
    ['Bank', 'BankingFinance'],
    ['Finance', 'BankingFinance'],
    ['Insurance', 'BankingFinance'],
    ['Charity', 'CharityDonation'],
    ['Donation', 'CharityDonation'],
    ['Nonprofit', 'CharityDonation'],
  ];

  // V3 -> V4
  const v3StoreMappings: [string, string][] = [
    ['Clothing', 'ClothingStore'],
    ['Electronics', 'ElectronicsStore'],
    ['Furniture', 'FurnitureStore'],
    ['Automotive', 'AutoShop'],
    ['HotelLodging', 'Lodging'],
    ['Gambling', 'Casino'],
    ['Services', 'GeneralServices'],
    ['BooksMedia', 'BookStore'],
    ['SportsOutdoors', 'SportsStore'],
    ['ToysGames', 'ToyStore'],
    ['Subscription', 'SubscriptionService'],
  ];

  // V3 removed giros
  const removedStoreMappings: [string, string][] = [
    ['StreetVendor', 'OpenMarket'],
    ['MusicStore', 'Entertainment'],
    ['Jewelry', 'AccessoriesOptical'],
    ['Optical', 'AccessoriesOptical'],
  ];

  it.each([...v1v2StoreMappings, ...v3StoreMappings, ...removedStoreMappings])(
    'maps store "%s" -> "%s"',
    (input, expected) => {
      expect(normalizeStoreCategory(input)).toBe(expected);
    },
  );

  describe('edge cases', () => {
    it('returns undefined for undefined input', () => {
      expect(normalizeStoreCategory(undefined as unknown as string)).toBe(undefined);
    });

    it('returns empty string for empty input', () => {
      expect(normalizeStoreCategory('')).toBe('');
    });

    it('passes through V4 key not in legacy map', () => {
      expect(normalizeStoreCategory('Supermarket')).toBe('Supermarket');
    });

    it('passes through unknown category', () => {
      expect(normalizeStoreCategory('RandomStore')).toBe('RandomStore');
    });
  });
});

describe('normalizeItemGroupToEnglish', () => {
  it.each([
    ['Frutas y Verduras', 'Produce'],
    ['Carnes y Mariscos', 'MeatSeafood'],
    ['Otro Producto', 'OtherItem'],
    ['Bebidas', 'Beverages'],
    ['Despensa', 'Pantry'],
    ['Lácteos y Huevos', 'DairyEggs'],
    ['Pan y Repostería', 'BreadPastry'],
  ])('translates Spanish "%s" -> English "%s"', (input, expected) => {
    expect(normalizeItemGroupToEnglish(input)).toBe(expected);
  });

  it('passes through already-English key', () => {
    expect(normalizeItemGroupToEnglish('Produce')).toBe('Produce');
    expect(normalizeItemGroupToEnglish('Snacks')).toBe('Snacks');
  });

  it('passes through unknown string', () => {
    expect(normalizeItemGroupToEnglish('SomethingRandom')).toBe('SomethingRandom');
  });

  it('returns empty for empty input', () => {
    expect(normalizeItemGroupToEnglish('')).toBe('');
  });

  it('integration: normalizeItemCategory uses translation fallback', () => {
    // 'Frutas y Verduras' is not in LEGACY_ITEM_CATEGORY_MAP,
    // but normalizeItemGroupToEnglish maps it to 'Produce'
    expect(normalizeItemCategory('Frutas y Verduras')).toBe('Produce');
  });
});

describe('isLegacyCategory', () => {
  it('returns true for known legacy item key', () => {
    expect(isLegacyCategory('Bakery', 'item')).toBe(true);
    expect(isLegacyCategory('Fresh Food', 'item')).toBe(true);
  });

  it('returns true for known legacy store key', () => {
    expect(isLegacyCategory('Pet Store', 'store')).toBe(true);
    expect(isLegacyCategory('Clothing', 'store')).toBe(true);
  });

  it('returns false for V4 key not in legacy map', () => {
    expect(isLegacyCategory('Produce', 'item')).toBe(false);
    expect(isLegacyCategory('Supermarket', 'store')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isLegacyCategory('', 'item')).toBe(false);
    expect(isLegacyCategory('', 'store')).toBe(false);
  });

  it('returns false for cross-type check', () => {
    // 'Bakery' is in item map but not store map
    expect(isLegacyCategory('Bakery', 'store')).toBe(false);
    // 'Pet Store' is in store map but not item map
    expect(isLegacyCategory('Pet Store', 'item')).toBe(false);
  });

  it('is prototype-safe (__proto__, constructor, toString)', () => {
    expect(isLegacyCategory('__proto__', 'item')).toBe(false);
    expect(isLegacyCategory('constructor', 'item')).toBe(false);
    expect(isLegacyCategory('toString', 'store')).toBe(false);
    expect(isLegacyCategory('hasOwnProperty', 'store')).toBe(false);
  });
});

describe('getLegacyMappings', () => {
  it('returns object with itemCategories and storeCategories', () => {
    const mappings = getLegacyMappings();
    expect(mappings).toHaveProperty('itemCategories');
    expect(mappings).toHaveProperty('storeCategories');
  });

  it('contains expected entries', () => {
    const mappings = getLegacyMappings();
    expect(mappings.itemCategories['Bakery']).toBe('BreadPastry');
    expect(mappings.storeCategories['Pet Store']).toBe('PetShop');
  });

  it('returns defensive copies (mutation does not affect source)', () => {
    const first = getLegacyMappings();
    first.itemCategories['Bakery'] = 'MUTATED';
    first.storeCategories['Pet Store'] = 'MUTATED';

    const second = getLegacyMappings();
    expect(second.itemCategories['Bakery']).toBe('BreadPastry');
    expect(second.storeCategories['Pet Store']).toBe('PetShop');
  });
});
