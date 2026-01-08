/**
 * Unified Category Color Configuration
 * Story 14.21: Category Color Consolidation
 *
 * Single source of truth for all category colors across:
 * - 32 Store Categories (transaction-level)
 * - 32 Item Categories (line-item-level)
 * - 15 Category Groups
 * - 3 Themes: Normal (Ni No Kuni), Professional, Mono
 * - 2 Modes: Light, Dark
 *
 * Total: 64 categories × 6 variations = 384 color sets
 *
 * @see docs/uxui/mockups/00_components/category-colors.html - Visual reference
 * @see docs/sprint-artifacts/epic14/category-color-consolidation.md - Design doc
 */

import type { StoreCategory, ItemCategory } from '../types/transaction';

// ============================================================================
// TYPES
// ============================================================================

export type ThemeName = 'normal' | 'professional' | 'mono';
export type ModeName = 'light' | 'dark';

export interface CategoryColorSet {
  /** Foreground color for text/icons */
  fg: string;
  /** Background color for badges/chips */
  bg: string;
}

export interface GroupColorSet extends CategoryColorSet {
  /** Border/accent color for group headers */
  border: string;
}

type ThemeModeColors = {
  [theme in ThemeName]: {
    [mode in ModeName]: CategoryColorSet;
  };
};

type GroupThemeModeColors = {
  [theme in ThemeName]: {
    [mode in ModeName]: GroupColorSet;
  };
};

// ============================================================================
// STORE CATEGORY GROUPS
// ============================================================================

export type StoreCategoryGroup =
  | 'food-dining'
  | 'health-wellness'
  | 'retail-general'
  | 'retail-specialty'
  | 'automotive'
  | 'services'
  | 'hospitality'
  | 'other';

export const STORE_CATEGORY_GROUPS: Record<StoreCategory, StoreCategoryGroup> = {
  // Food & Dining
  Supermarket: 'food-dining',
  Restaurant: 'food-dining',
  Bakery: 'food-dining',
  Butcher: 'food-dining',
  StreetVendor: 'food-dining',
  // Health & Wellness
  Pharmacy: 'health-wellness',
  Medical: 'health-wellness',
  Veterinary: 'health-wellness',
  HealthBeauty: 'health-wellness',
  // Retail - General
  Bazaar: 'retail-general',
  Clothing: 'retail-general',
  Electronics: 'retail-general',
  HomeGoods: 'retail-general',
  Furniture: 'retail-general',
  Hardware: 'retail-general',
  GardenCenter: 'retail-general',
  // Retail - Specialty
  PetShop: 'retail-specialty',
  BooksMedia: 'retail-specialty',
  OfficeSupplies: 'retail-specialty',
  SportsOutdoors: 'retail-specialty',
  ToysGames: 'retail-specialty',
  Jewelry: 'retail-specialty',
  Optical: 'retail-specialty',
  MusicStore: 'retail-specialty',
  // Automotive & Transport
  Automotive: 'automotive',
  GasStation: 'automotive',
  Transport: 'automotive',
  // Services & Finance
  Services: 'services',
  BankingFinance: 'services',
  Education: 'services',
  TravelAgency: 'services',
  Subscription: 'services',
  // Government
  Government: 'services',
  // Hospitality & Entertainment
  HotelLodging: 'hospitality',
  Entertainment: 'hospitality',
  Gambling: 'hospitality',
  // Other
  CharityDonation: 'other',
  Other: 'other',
};

// ============================================================================
// ITEM CATEGORY GROUPS
// ============================================================================

export type ItemCategoryGroup =
  | 'food-fresh'
  | 'food-packaged'
  | 'health-personal'
  | 'household'
  | 'nonfood-retail'
  | 'services-fees'
  | 'other-item';

// Map ItemCategory to internal key (handles spaces in names)
type ItemCategoryKey =
  | 'Produce' | 'MeatSeafood' | 'ItemBakery' | 'DairyEggs'
  | 'Pantry' | 'FrozenFoods' | 'Snacks' | 'Beverages' | 'Alcohol' | 'PreparedFood'
  | 'HealthBeautyItem' | 'PersonalCare' | 'PharmacyItem' | 'Supplements' | 'BabyProducts'
  | 'CleaningSupplies' | 'Household' | 'PetSupplies'
  | 'ClothingItem' | 'ElectronicsItem' | 'HardwareItem' | 'Garden' | 'AutomotiveItem'
  | 'SportsOutdoorsItem' | 'ToysGamesItem' | 'BooksMediaItem' | 'OfficeStationery'
  | 'CraftsHobbies' | 'FurnitureItem' | 'MusicalInstruments'
  | 'Service' | 'TaxFees' | 'SubscriptionItem' | 'InsuranceItem' | 'LoanPayment' | 'TicketsEvents'
  | 'Tobacco' | 'GamblingItem'
  | 'OtherItem';

export const ITEM_CATEGORY_TO_KEY: Record<ItemCategory, ItemCategoryKey> = {
  'Produce': 'Produce',
  'Meat & Seafood': 'MeatSeafood',
  'Bakery': 'ItemBakery',
  'Dairy & Eggs': 'DairyEggs',
  'Pantry': 'Pantry',
  'Frozen Foods': 'FrozenFoods',
  'Snacks': 'Snacks',
  'Beverages': 'Beverages',
  'Alcohol': 'Alcohol',
  'Health & Beauty': 'HealthBeautyItem',
  'Personal Care': 'PersonalCare',
  'Pharmacy': 'PharmacyItem',
  'Supplements': 'Supplements',
  'Baby Products': 'BabyProducts',
  'Cleaning Supplies': 'CleaningSupplies',
  'Household': 'Household',
  'Pet Supplies': 'PetSupplies',
  'Clothing': 'ClothingItem',
  'Electronics': 'ElectronicsItem',
  'Hardware': 'HardwareItem',
  'Garden': 'Garden',
  'Automotive': 'AutomotiveItem',
  'Sports & Outdoors': 'SportsOutdoorsItem',
  'Toys & Games': 'ToysGamesItem',
  'Books & Media': 'BooksMediaItem',
  'Office & Stationery': 'OfficeStationery',
  'Crafts & Hobbies': 'CraftsHobbies',
  'Furniture': 'FurnitureItem',
  'Musical Instruments': 'MusicalInstruments',
  'Prepared Food': 'PreparedFood',
  'Service': 'Service',
  'Tax & Fees': 'TaxFees',
  'Subscription': 'SubscriptionItem',
  'Insurance': 'InsuranceItem',
  'Loan Payment': 'LoanPayment',
  'Tickets & Events': 'TicketsEvents',
  'Tobacco': 'Tobacco',
  'Gambling': 'GamblingItem',
  'Other': 'OtherItem',
};

export const ITEM_CATEGORY_GROUPS: Record<ItemCategoryKey, ItemCategoryGroup> = {
  // Food - Fresh
  Produce: 'food-fresh',
  MeatSeafood: 'food-fresh',
  ItemBakery: 'food-fresh',
  DairyEggs: 'food-fresh',
  // Food - Packaged
  Pantry: 'food-packaged',
  FrozenFoods: 'food-packaged',
  Snacks: 'food-packaged',
  Beverages: 'food-packaged',
  Alcohol: 'food-packaged',
  PreparedFood: 'food-packaged',
  // Health & Personal
  HealthBeautyItem: 'health-personal',
  PersonalCare: 'health-personal',
  PharmacyItem: 'health-personal',
  Supplements: 'health-personal',
  BabyProducts: 'health-personal',
  // Household
  CleaningSupplies: 'household',
  Household: 'household',
  PetSupplies: 'household',
  // Non-Food Retail
  ClothingItem: 'nonfood-retail',
  ElectronicsItem: 'nonfood-retail',
  HardwareItem: 'nonfood-retail',
  Garden: 'nonfood-retail',
  AutomotiveItem: 'nonfood-retail',
  SportsOutdoorsItem: 'nonfood-retail',
  ToysGamesItem: 'nonfood-retail',
  BooksMediaItem: 'nonfood-retail',
  OfficeStationery: 'nonfood-retail',
  CraftsHobbies: 'nonfood-retail',
  FurnitureItem: 'nonfood-retail',
  MusicalInstruments: 'nonfood-retail',
  // Services & Fees
  Service: 'services-fees',
  TaxFees: 'services-fees',
  SubscriptionItem: 'services-fees',
  InsuranceItem: 'services-fees',
  LoanPayment: 'services-fees',
  TicketsEvents: 'services-fees',
  // Vices
  Tobacco: 'services-fees',
  GamblingItem: 'services-fees',
  // Other
  OtherItem: 'other-item',
};

// ============================================================================
// STORE CATEGORY COLORS
// ============================================================================

export const STORE_CATEGORY_COLORS: Record<StoreCategory, ThemeModeColors> = {
  // --- FOOD & DINING ---
  Supermarket: {
    normal: { light: { fg: '#15803d', bg: '#dcfce7' }, dark: { fg: '#86efac', bg: '#14532d' } },
    professional: { light: { fg: '#16a34a', bg: '#dcfce7' }, dark: { fg: '#4ade80', bg: '#166534' } },
    mono: { light: { fg: '#2d8c50', bg: '#e0f2e8' }, dark: { fg: '#6dc792', bg: '#1e4a30' } },
  },
  Restaurant: {
    normal: { light: { fg: '#c2410c', bg: '#ffedd5' }, dark: { fg: '#fdba74', bg: '#7c2d12' } },
    professional: { light: { fg: '#ea580c', bg: '#ffedd5' }, dark: { fg: '#fb923c', bg: '#9a3412' } },
    mono: { light: { fg: '#b86830', bg: '#f8e8d8' }, dark: { fg: '#d9a070', bg: '#4a2810' } },
  },
  Bakery: {
    normal: { light: { fg: '#b45309', bg: '#fef3c7' }, dark: { fg: '#fcd34d', bg: '#78350f' } },
    professional: { light: { fg: '#d97706', bg: '#fef3c7' }, dark: { fg: '#fbbf24', bg: '#92400e' } },
    mono: { light: { fg: '#a88020', bg: '#f8f0d8' }, dark: { fg: '#d4b860', bg: '#4a3810' } },
  },
  Butcher: {
    normal: { light: { fg: '#b91c1c', bg: '#fee2e2' }, dark: { fg: '#fca5a5', bg: '#7f1d1d' } },
    professional: { light: { fg: '#dc2626', bg: '#fee2e2' }, dark: { fg: '#f87171', bg: '#991b1b' } },
    mono: { light: { fg: '#a83838', bg: '#f8e0e0' }, dark: { fg: '#d47070', bg: '#4a1818' } },
  },
  StreetVendor: {
    normal: { light: { fg: '#ea580c', bg: '#fff7ed' }, dark: { fg: '#fb923c', bg: '#7c2d12' } },
    professional: { light: { fg: '#f97316', bg: '#fff7ed' }, dark: { fg: '#fdba74', bg: '#9a3412' } },
    mono: { light: { fg: '#b85020', bg: '#f8e8d8' }, dark: { fg: '#d98858', bg: '#4a2010' } },
  },

  // --- HEALTH & WELLNESS ---
  Pharmacy: {
    normal: { light: { fg: '#be185d', bg: '#fce7f3' }, dark: { fg: '#f9a8d4', bg: '#831843' } },
    professional: { light: { fg: '#db2777', bg: '#fce7f3' }, dark: { fg: '#f472b6', bg: '#9d174d' } },
    mono: { light: { fg: '#a83868', bg: '#f8e0ec' }, dark: { fg: '#d47098', bg: '#4a1830' } },
  },
  Medical: {
    normal: { light: { fg: '#9f1239', bg: '#ffe4e6' }, dark: { fg: '#fda4af', bg: '#881337' } },
    professional: { light: { fg: '#e11d48', bg: '#ffe4e6' }, dark: { fg: '#fb7185', bg: '#9f1239' } },
    mono: { light: { fg: '#b82840', bg: '#f8d8e0' }, dark: { fg: '#d46878', bg: '#4a1018' } },
  },
  Veterinary: {
    normal: { light: { fg: '#166534', bg: '#dcfce7' }, dark: { fg: '#86efac', bg: '#14532d' } },
    professional: { light: { fg: '#22c55e', bg: '#dcfce7' }, dark: { fg: '#4ade80', bg: '#166534' } },
    mono: { light: { fg: '#288c50', bg: '#d8f2e0' }, dark: { fg: '#68c790', bg: '#104a28' } },
  },
  HealthBeauty: {
    normal: { light: { fg: '#a21caf', bg: '#fae8ff' }, dark: { fg: '#e879f9', bg: '#701a75' } },
    professional: { light: { fg: '#c026d3', bg: '#fae8ff' }, dark: { fg: '#e879f9', bg: '#86198f' } },
    mono: { light: { fg: '#9838a8', bg: '#f0e0f8' }, dark: { fg: '#c070d4', bg: '#3a1848' } },
  },

  // --- RETAIL - GENERAL ---
  Bazaar: {
    normal: { light: { fg: '#6d28d9', bg: '#ede9fe' }, dark: { fg: '#c4b5fd', bg: '#4c1d95' } },
    professional: { light: { fg: '#7c3aed', bg: '#ede9fe' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#6838a8', bg: '#e8e0f8' }, dark: { fg: '#a070d4', bg: '#2a1848' } },
  },
  Clothing: {
    normal: { light: { fg: '#be185d', bg: '#fdf2f8' }, dark: { fg: '#f9a8d4', bg: '#831843' } },
    professional: { light: { fg: '#ec4899', bg: '#fdf2f8' }, dark: { fg: '#f472b6', bg: '#9d174d' } },
    mono: { light: { fg: '#a83868', bg: '#f8e0ec' }, dark: { fg: '#d47098', bg: '#4a1830' } },
  },
  Electronics: {
    normal: { light: { fg: '#1e40af', bg: '#dbeafe' }, dark: { fg: '#93c5fd', bg: '#1e3a8a' } },
    professional: { light: { fg: '#2563eb', bg: '#dbeafe' }, dark: { fg: '#60a5fa', bg: '#1e40af' } },
    mono: { light: { fg: '#3850a8', bg: '#e0e8f8' }, dark: { fg: '#7090d4', bg: '#182848' } },
  },
  HomeGoods: {
    normal: { light: { fg: '#0f766e', bg: '#ccfbf1' }, dark: { fg: '#5eead4', bg: '#134e4a' } },
    professional: { light: { fg: '#14b8a6', bg: '#ccfbf1' }, dark: { fg: '#2dd4bf', bg: '#115e59' } },
    mono: { light: { fg: '#288c8c', bg: '#d8f2f2' }, dark: { fg: '#60c8c8', bg: '#104848' } },
  },
  Furniture: {
    normal: { light: { fg: '#115e59', bg: '#ccfbf1' }, dark: { fg: '#5eead4', bg: '#134e4a' } },
    professional: { light: { fg: '#0d9488', bg: '#ccfbf1' }, dark: { fg: '#2dd4bf', bg: '#115e59' } },
    mono: { light: { fg: '#30708c', bg: '#d8e8f0' }, dark: { fg: '#68a8c0', bg: '#103848' } },
  },
  Hardware: {
    normal: { light: { fg: '#374151', bg: '#f3f4f6' }, dark: { fg: '#d1d5db', bg: '#1f2937' } },
    professional: { light: { fg: '#4b5563', bg: '#f3f4f6' }, dark: { fg: '#9ca3af', bg: '#374151' } },
    mono: { light: { fg: '#506878', bg: '#e8ecf0' }, dark: { fg: '#90a8b8', bg: '#283038' } },
  },
  GardenCenter: {
    normal: { light: { fg: '#166534', bg: '#d1fae5' }, dark: { fg: '#6ee7b7', bg: '#064e3b' } },
    professional: { light: { fg: '#22c55e', bg: '#d1fae5' }, dark: { fg: '#4ade80', bg: '#166534' } },
    mono: { light: { fg: '#28a050', bg: '#d8f8e0' }, dark: { fg: '#60d488', bg: '#104820' } },
  },

  // --- RETAIL - SPECIALTY ---
  PetShop: {
    normal: { light: { fg: '#a21caf', bg: '#fdf4ff' }, dark: { fg: '#f0abfc', bg: '#701a75' } },
    professional: { light: { fg: '#d946ef', bg: '#fdf4ff' }, dark: { fg: '#e879f9', bg: '#86198f' } },
    mono: { light: { fg: '#a03890', bg: '#f8e0f4' }, dark: { fg: '#d068c0', bg: '#481838' } },
  },
  BooksMedia: {
    normal: { light: { fg: '#1d4ed8', bg: '#dbeafe' }, dark: { fg: '#93c5fd', bg: '#1e3a8a' } },
    professional: { light: { fg: '#3b82f6', bg: '#dbeafe' }, dark: { fg: '#60a5fa', bg: '#1e40af' } },
    mono: { light: { fg: '#3068a8', bg: '#d8e8f8' }, dark: { fg: '#68a0d4', bg: '#103048' } },
  },
  OfficeSupplies: {
    normal: { light: { fg: '#475569', bg: '#f1f5f9' }, dark: { fg: '#cbd5e1', bg: '#334155' } },
    professional: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#94a3b8', bg: '#475569' } },
    mono: { light: { fg: '#5878a0', bg: '#e8f0f8' }, dark: { fg: '#90b0d0', bg: '#283848' } },
  },
  SportsOutdoors: {
    normal: { light: { fg: '#047857', bg: '#d1fae5' }, dark: { fg: '#6ee7b7', bg: '#064e3b' } },
    professional: { light: { fg: '#10b981', bg: '#d1fae5' }, dark: { fg: '#34d399', bg: '#065f46' } },
    mono: { light: { fg: '#289070', bg: '#d8f2ec' }, dark: { fg: '#60c8a8', bg: '#104838' } },
  },
  ToysGames: {
    normal: { light: { fg: '#7c3aed', bg: '#ede9fe' }, dark: { fg: '#c4b5fd', bg: '#5b21b6' } },
    professional: { light: { fg: '#8b5cf6', bg: '#ede9fe' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#7838a0', bg: '#ece0f8' }, dark: { fg: '#a868d0', bg: '#301840' } },
  },
  Jewelry: {
    normal: { light: { fg: '#6d28d9', bg: '#f5f3ff' }, dark: { fg: '#c4b5fd', bg: '#4c1d95' } },
    professional: { light: { fg: '#7c3aed', bg: '#f5f3ff' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#6838a0', bg: '#e8e0f4' }, dark: { fg: '#9868c8', bg: '#281838' } },
  },
  Optical: {
    normal: { light: { fg: '#0369a1', bg: '#e0f2fe' }, dark: { fg: '#7dd3fc', bg: '#0c4a6e' } },
    professional: { light: { fg: '#0ea5e9', bg: '#e0f2fe' }, dark: { fg: '#38bdf8', bg: '#0369a1' } },
    mono: { light: { fg: '#2878a0', bg: '#d8ecf8' }, dark: { fg: '#60b0d0', bg: '#103848' } },
  },
  MusicStore: {
    normal: { light: { fg: '#7c3aed', bg: '#f5f3ff' }, dark: { fg: '#c4b5fd', bg: '#5b21b6' } },
    professional: { light: { fg: '#8b5cf6', bg: '#f5f3ff' }, dark: { fg: '#a78bfa', bg: '#6d28d9' } },
    mono: { light: { fg: '#6840a0', bg: '#ece0f8' }, dark: { fg: '#9878c8', bg: '#281840' } },
  },

  // --- AUTOMOTIVE & TRANSPORT ---
  Automotive: {
    normal: { light: { fg: '#374151', bg: '#f3f4f6' }, dark: { fg: '#d1d5db', bg: '#1f2937' } },
    professional: { light: { fg: '#4b5563', bg: '#f3f4f6' }, dark: { fg: '#9ca3af', bg: '#374151' } },
    mono: { light: { fg: '#507080', bg: '#e8ecf0' }, dark: { fg: '#90a8b8', bg: '#283438' } },
  },
  GasStation: {
    normal: { light: { fg: '#92400e', bg: '#fef3c7' }, dark: { fg: '#fcd34d', bg: '#78350f' } },
    professional: { light: { fg: '#d97706', bg: '#fef3c7' }, dark: { fg: '#fbbf24', bg: '#92400e' } },
    mono: { light: { fg: '#a88020', bg: '#f8f0d8' }, dark: { fg: '#d4b860', bg: '#483810' } },
  },
  Transport: {
    normal: { light: { fg: '#1e40af', bg: '#dbeafe' }, dark: { fg: '#93c5fd', bg: '#1e3a8a' } },
    professional: { light: { fg: '#2563eb', bg: '#dbeafe' }, dark: { fg: '#60a5fa', bg: '#1e40af' } },
    mono: { light: { fg: '#3858a8', bg: '#e0e8f8' }, dark: { fg: '#7098d4', bg: '#182848' } },
  },

  // --- SERVICES & FINANCE ---
  Services: {
    normal: { light: { fg: '#1e40af', bg: '#dbeafe' }, dark: { fg: '#93c5fd', bg: '#1e3a8a' } },
    professional: { light: { fg: '#2563eb', bg: '#dbeafe' }, dark: { fg: '#60a5fa', bg: '#1e40af' } },
    mono: { light: { fg: '#385898', bg: '#e0e8f4' }, dark: { fg: '#7098c8', bg: '#182840' } },
  },
  BankingFinance: {
    normal: { light: { fg: '#1e3a8a', bg: '#dbeafe' }, dark: { fg: '#93c5fd', bg: '#1e3a8a' } },
    professional: { light: { fg: '#1d4ed8', bg: '#dbeafe' }, dark: { fg: '#60a5fa', bg: '#1e40af' } },
    mono: { light: { fg: '#284880', bg: '#dce4f0' }, dark: { fg: '#6088b8', bg: '#102038' } },
  },
  Education: {
    normal: { light: { fg: '#2563eb', bg: '#dbeafe' }, dark: { fg: '#93c5fd', bg: '#1e40af' } },
    professional: { light: { fg: '#3b82f6', bg: '#dbeafe' }, dark: { fg: '#60a5fa', bg: '#1e40af' } },
    mono: { light: { fg: '#3068a0', bg: '#d8e8f8' }, dark: { fg: '#68a0d0', bg: '#103040' } },
  },
  TravelAgency: {
    normal: { light: { fg: '#0284c7', bg: '#e0f2fe' }, dark: { fg: '#7dd3fc', bg: '#075985' } },
    professional: { light: { fg: '#0ea5e9', bg: '#e0f2fe' }, dark: { fg: '#38bdf8', bg: '#0369a1' } },
    mono: { light: { fg: '#2888a0', bg: '#d8f0f8' }, dark: { fg: '#60c0d0', bg: '#104048' } },
  },
  Subscription: {
    normal: { light: { fg: '#7c3aed', bg: '#f5f3ff' }, dark: { fg: '#c4b5fd', bg: '#5b21b6' } },
    professional: { light: { fg: '#8b5cf6', bg: '#f5f3ff' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#7838a0', bg: '#ece0f4' }, dark: { fg: '#a868c8', bg: '#301838' } },
  },
  Government: {
    normal: { light: { fg: '#475569', bg: '#f1f5f9' }, dark: { fg: '#94a3b8', bg: '#334155' } },
    professional: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#cbd5e1', bg: '#475569' } },
    mono: { light: { fg: '#506070', bg: '#e8ecf0' }, dark: { fg: '#90a0b0', bg: '#283038' } },
  },

  // --- HOSPITALITY & ENTERTAINMENT ---
  HotelLodging: {
    normal: { light: { fg: '#44403c', bg: '#f5f5f4' }, dark: { fg: '#d6d3d1', bg: '#292524' } },
    professional: { light: { fg: '#57534e', bg: '#f5f5f4' }, dark: { fg: '#a8a29e', bg: '#44403c' } },
    mono: { light: { fg: '#786858', bg: '#f4f0e8' }, dark: { fg: '#b8a890', bg: '#383020' } },
  },
  Entertainment: {
    normal: { light: { fg: '#7c3aed', bg: '#f5f3ff' }, dark: { fg: '#c4b5fd', bg: '#5b21b6' } },
    professional: { light: { fg: '#8b5cf6', bg: '#f5f3ff' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#7838a0', bg: '#ece0f4' }, dark: { fg: '#a868c8', bg: '#301838' } },
  },
  Gambling: {
    normal: { light: { fg: '#be123c', bg: '#ffe4e6' }, dark: { fg: '#fda4af', bg: '#9f1239' } },
    professional: { light: { fg: '#e11d48', bg: '#ffe4e6' }, dark: { fg: '#fb7185', bg: '#be123c' } },
    mono: { light: { fg: '#b83050', bg: '#f8e0e4' }, dark: { fg: '#e07890', bg: '#501028' } },
  },

  // --- OTHER ---
  CharityDonation: {
    normal: { light: { fg: '#047857', bg: '#d1fae5' }, dark: { fg: '#6ee7b7', bg: '#064e3b' } },
    professional: { light: { fg: '#10b981', bg: '#d1fae5' }, dark: { fg: '#34d399', bg: '#065f46' } },
    mono: { light: { fg: '#289068', bg: '#d8f2e8' }, dark: { fg: '#60c8a0', bg: '#104838' } },
  },
  Other: {
    normal: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#cbd5e1', bg: '#334155' } },
    professional: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#94a3b8', bg: '#475569' } },
    mono: { light: { fg: '#607080', bg: '#e8ecf0' }, dark: { fg: '#98a8b8', bg: '#303840' } },
  },
};

// ============================================================================
// ITEM CATEGORY COLORS
// ============================================================================

export const ITEM_CATEGORY_COLORS: Record<ItemCategoryKey, ThemeModeColors> = {
  // --- FOOD - FRESH ---
  Produce: {
    normal: { light: { fg: '#15803d', bg: '#dcfce7' }, dark: { fg: '#86efac', bg: '#14532d' } },
    professional: { light: { fg: '#16a34a', bg: '#dcfce7' }, dark: { fg: '#4ade80', bg: '#166534' } },
    mono: { light: { fg: '#2d8c50', bg: '#e0f2e8' }, dark: { fg: '#6dc792', bg: '#1e4a30' } },
  },
  MeatSeafood: {
    normal: { light: { fg: '#b91c1c', bg: '#fee2e2' }, dark: { fg: '#fca5a5', bg: '#7f1d1d' } },
    professional: { light: { fg: '#dc2626', bg: '#fee2e2' }, dark: { fg: '#f87171', bg: '#991b1b' } },
    mono: { light: { fg: '#a83838', bg: '#f8e0e0' }, dark: { fg: '#d47070', bg: '#4a1818' } },
  },
  ItemBakery: {
    normal: { light: { fg: '#b45309', bg: '#fef3c7' }, dark: { fg: '#fcd34d', bg: '#78350f' } },
    professional: { light: { fg: '#d97706', bg: '#fef3c7' }, dark: { fg: '#fbbf24', bg: '#92400e' } },
    mono: { light: { fg: '#a88020', bg: '#f8f0d8' }, dark: { fg: '#d4b860', bg: '#4a3810' } },
  },
  DairyEggs: {
    normal: { light: { fg: '#166534', bg: '#dcfce7' }, dark: { fg: '#86efac', bg: '#14532d' } },
    professional: { light: { fg: '#22c55e', bg: '#dcfce7' }, dark: { fg: '#4ade80', bg: '#166534' } },
    mono: { light: { fg: '#288c50', bg: '#d8f2e0' }, dark: { fg: '#68c790', bg: '#104a28' } },
  },

  // --- FOOD - PACKAGED ---
  Pantry: {
    normal: { light: { fg: '#92400e', bg: '#fef3c7' }, dark: { fg: '#fcd34d', bg: '#78350f' } },
    professional: { light: { fg: '#d97706', bg: '#fef3c7' }, dark: { fg: '#fbbf24', bg: '#92400e' } },
    mono: { light: { fg: '#a88020', bg: '#f8f0d8' }, dark: { fg: '#d4b860', bg: '#4a3810' } },
  },
  FrozenFoods: {
    normal: { light: { fg: '#0369a1', bg: '#e0f2fe' }, dark: { fg: '#7dd3fc', bg: '#0c4a6e' } },
    professional: { light: { fg: '#0ea5e9', bg: '#e0f2fe' }, dark: { fg: '#38bdf8', bg: '#0369a1' } },
    mono: { light: { fg: '#2080a8', bg: '#d8ecf8' }, dark: { fg: '#58b8d8', bg: '#104050' } },
  },
  Snacks: {
    normal: { light: { fg: '#ea580c', bg: '#fff7ed' }, dark: { fg: '#fb923c', bg: '#7c2d12' } },
    professional: { light: { fg: '#f97316', bg: '#fff7ed' }, dark: { fg: '#fdba74', bg: '#9a3412' } },
    mono: { light: { fg: '#b86830', bg: '#f8e8d8' }, dark: { fg: '#d9a070', bg: '#4a2810' } },
  },
  Beverages: {
    normal: { light: { fg: '#0284c7', bg: '#e0f2fe' }, dark: { fg: '#7dd3fc', bg: '#075985' } },
    professional: { light: { fg: '#0ea5e9', bg: '#e0f2fe' }, dark: { fg: '#38bdf8', bg: '#0369a1' } },
    mono: { light: { fg: '#2088a8', bg: '#d8f0f8' }, dark: { fg: '#58c0d8', bg: '#104050' } },
  },
  Alcohol: {
    normal: { light: { fg: '#6d28d9', bg: '#ede9fe' }, dark: { fg: '#c4b5fd', bg: '#4c1d95' } },
    professional: { light: { fg: '#7c3aed', bg: '#ede9fe' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#6838a8', bg: '#e8e0f8' }, dark: { fg: '#a070d4', bg: '#2a1848' } },
  },
  PreparedFood: {
    normal: { light: { fg: '#c2410c', bg: '#ffedd5' }, dark: { fg: '#fdba74', bg: '#7c2d12' } },
    professional: { light: { fg: '#ea580c', bg: '#ffedd5' }, dark: { fg: '#fb923c', bg: '#9a3412' } },
    mono: { light: { fg: '#b86830', bg: '#f8e8d8' }, dark: { fg: '#d9a070', bg: '#4a2810' } },
  },

  // --- HEALTH & PERSONAL ---
  HealthBeautyItem: {
    normal: { light: { fg: '#a21caf', bg: '#fae8ff' }, dark: { fg: '#e879f9', bg: '#701a75' } },
    professional: { light: { fg: '#c026d3', bg: '#fae8ff' }, dark: { fg: '#e879f9', bg: '#86198f' } },
    mono: { light: { fg: '#9838a8', bg: '#f0e0f8' }, dark: { fg: '#c070d4', bg: '#3a1848' } },
  },
  PersonalCare: {
    normal: { light: { fg: '#be185d', bg: '#fce7f3' }, dark: { fg: '#f9a8d4', bg: '#831843' } },
    professional: { light: { fg: '#db2777', bg: '#fce7f3' }, dark: { fg: '#f472b6', bg: '#9d174d' } },
    mono: { light: { fg: '#a83868', bg: '#f8e0ec' }, dark: { fg: '#d47098', bg: '#4a1830' } },
  },
  PharmacyItem: {
    normal: { light: { fg: '#be185d', bg: '#fce7f3' }, dark: { fg: '#f9a8d4', bg: '#831843' } },
    professional: { light: { fg: '#db2777', bg: '#fce7f3' }, dark: { fg: '#f472b6', bg: '#9d174d' } },
    mono: { light: { fg: '#a83868', bg: '#f8e0ec' }, dark: { fg: '#d47098', bg: '#4a1830' } },
  },
  Supplements: {
    normal: { light: { fg: '#a21caf', bg: '#fdf4ff' }, dark: { fg: '#f0abfc', bg: '#701a75' } },
    professional: { light: { fg: '#d946ef', bg: '#fdf4ff' }, dark: { fg: '#e879f9', bg: '#86198f' } },
    mono: { light: { fg: '#a03890', bg: '#f8e0f4' }, dark: { fg: '#d068c0', bg: '#481838' } },
  },
  BabyProducts: {
    normal: { light: { fg: '#be185d', bg: '#fdf2f8' }, dark: { fg: '#f9a8d4', bg: '#831843' } },
    professional: { light: { fg: '#ec4899', bg: '#fdf2f8' }, dark: { fg: '#f472b6', bg: '#9d174d' } },
    mono: { light: { fg: '#b04878', bg: '#f8e0f0' }, dark: { fg: '#d880a8', bg: '#481828' } },
  },

  // --- HOUSEHOLD ---
  CleaningSupplies: {
    normal: { light: { fg: '#0f766e', bg: '#ccfbf1' }, dark: { fg: '#5eead4', bg: '#134e4a' } },
    professional: { light: { fg: '#14b8a6', bg: '#ccfbf1' }, dark: { fg: '#2dd4bf', bg: '#115e59' } },
    mono: { light: { fg: '#288c8c', bg: '#d8f2f2' }, dark: { fg: '#60c8c8', bg: '#104848' } },
  },
  Household: {
    normal: { light: { fg: '#0f766e', bg: '#ccfbf1' }, dark: { fg: '#5eead4', bg: '#134e4a' } },
    professional: { light: { fg: '#14b8a6', bg: '#ccfbf1' }, dark: { fg: '#2dd4bf', bg: '#115e59' } },
    mono: { light: { fg: '#288c8c', bg: '#d8f2f2' }, dark: { fg: '#60c8c8', bg: '#104848' } },
  },
  PetSupplies: {
    normal: { light: { fg: '#a21caf', bg: '#fdf4ff' }, dark: { fg: '#f0abfc', bg: '#701a75' } },
    professional: { light: { fg: '#d946ef', bg: '#fdf4ff' }, dark: { fg: '#e879f9', bg: '#86198f' } },
    mono: { light: { fg: '#a03890', bg: '#f8e0f4' }, dark: { fg: '#d068c0', bg: '#481838' } },
  },

  // --- NON-FOOD RETAIL ---
  ClothingItem: {
    normal: { light: { fg: '#be185d', bg: '#fdf2f8' }, dark: { fg: '#f9a8d4', bg: '#831843' } },
    professional: { light: { fg: '#ec4899', bg: '#fdf2f8' }, dark: { fg: '#f472b6', bg: '#9d174d' } },
    mono: { light: { fg: '#a83868', bg: '#f8e0ec' }, dark: { fg: '#d47098', bg: '#4a1830' } },
  },
  ElectronicsItem: {
    normal: { light: { fg: '#1e40af', bg: '#dbeafe' }, dark: { fg: '#93c5fd', bg: '#1e3a8a' } },
    professional: { light: { fg: '#2563eb', bg: '#dbeafe' }, dark: { fg: '#60a5fa', bg: '#1e40af' } },
    mono: { light: { fg: '#3850a8', bg: '#e0e8f8' }, dark: { fg: '#7090d4', bg: '#182848' } },
  },
  HardwareItem: {
    normal: { light: { fg: '#374151', bg: '#f3f4f6' }, dark: { fg: '#d1d5db', bg: '#1f2937' } },
    professional: { light: { fg: '#4b5563', bg: '#f3f4f6' }, dark: { fg: '#9ca3af', bg: '#374151' } },
    mono: { light: { fg: '#506878', bg: '#e8ecf0' }, dark: { fg: '#90a8b8', bg: '#283038' } },
  },
  Garden: {
    normal: { light: { fg: '#166534', bg: '#d1fae5' }, dark: { fg: '#6ee7b7', bg: '#064e3b' } },
    professional: { light: { fg: '#22c55e', bg: '#d1fae5' }, dark: { fg: '#4ade80', bg: '#166534' } },
    mono: { light: { fg: '#28a050', bg: '#d8f8e0' }, dark: { fg: '#60d488', bg: '#104820' } },
  },
  AutomotiveItem: {
    normal: { light: { fg: '#374151', bg: '#f3f4f6' }, dark: { fg: '#d1d5db', bg: '#1f2937' } },
    professional: { light: { fg: '#4b5563', bg: '#f3f4f6' }, dark: { fg: '#9ca3af', bg: '#374151' } },
    mono: { light: { fg: '#507080', bg: '#e8ecf0' }, dark: { fg: '#90a8b8', bg: '#283438' } },
  },
  SportsOutdoorsItem: {
    normal: { light: { fg: '#047857', bg: '#d1fae5' }, dark: { fg: '#6ee7b7', bg: '#064e3b' } },
    professional: { light: { fg: '#10b981', bg: '#d1fae5' }, dark: { fg: '#34d399', bg: '#065f46' } },
    mono: { light: { fg: '#289070', bg: '#d8f2ec' }, dark: { fg: '#60c8a8', bg: '#104838' } },
  },
  ToysGamesItem: {
    normal: { light: { fg: '#7c3aed', bg: '#ede9fe' }, dark: { fg: '#c4b5fd', bg: '#5b21b6' } },
    professional: { light: { fg: '#8b5cf6', bg: '#ede9fe' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#7838a0', bg: '#ece0f8' }, dark: { fg: '#a868d0', bg: '#301840' } },
  },
  BooksMediaItem: {
    normal: { light: { fg: '#1d4ed8', bg: '#dbeafe' }, dark: { fg: '#93c5fd', bg: '#1e3a8a' } },
    professional: { light: { fg: '#3b82f6', bg: '#dbeafe' }, dark: { fg: '#60a5fa', bg: '#1e40af' } },
    mono: { light: { fg: '#3068a8', bg: '#d8e8f8' }, dark: { fg: '#68a0d4', bg: '#103048' } },
  },
  OfficeStationery: {
    normal: { light: { fg: '#475569', bg: '#f1f5f9' }, dark: { fg: '#cbd5e1', bg: '#334155' } },
    professional: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#94a3b8', bg: '#475569' } },
    mono: { light: { fg: '#5878a0', bg: '#e8f0f8' }, dark: { fg: '#90b0d0', bg: '#283848' } },
  },
  CraftsHobbies: {
    normal: { light: { fg: '#7c3aed', bg: '#f5f3ff' }, dark: { fg: '#c4b5fd', bg: '#5b21b6' } },
    professional: { light: { fg: '#8b5cf6', bg: '#f5f3ff' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#7838a0', bg: '#ece0f8' }, dark: { fg: '#a868d0', bg: '#301840' } },
  },
  FurnitureItem: {
    normal: { light: { fg: '#115e59', bg: '#ccfbf1' }, dark: { fg: '#5eead4', bg: '#134e4a' } },
    professional: { light: { fg: '#0d9488', bg: '#ccfbf1' }, dark: { fg: '#2dd4bf', bg: '#115e59' } },
    mono: { light: { fg: '#30708c', bg: '#d8e8f0' }, dark: { fg: '#68a8c0', bg: '#103848' } },
  },
  MusicalInstruments: {
    normal: { light: { fg: '#7c3aed', bg: '#ede9fe' }, dark: { fg: '#c4b5fd', bg: '#5b21b6' } },
    professional: { light: { fg: '#8b5cf6', bg: '#ede9fe' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#7838a0', bg: '#ece0f8' }, dark: { fg: '#a868d0', bg: '#301840' } },
  },

  // --- SERVICES & FEES ---
  Service: {
    normal: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#cbd5e1', bg: '#334155' } },
    professional: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#94a3b8', bg: '#475569' } },
    mono: { light: { fg: '#385898', bg: '#e0e8f4' }, dark: { fg: '#7098c8', bg: '#182840' } },
  },
  TaxFees: {
    normal: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#cbd5e1', bg: '#334155' } },
    professional: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#94a3b8', bg: '#475569' } },
    mono: { light: { fg: '#607080', bg: '#e8ecf0' }, dark: { fg: '#98a8b8', bg: '#303840' } },
  },
  SubscriptionItem: {
    normal: { light: { fg: '#7c3aed', bg: '#f5f3ff' }, dark: { fg: '#c4b5fd', bg: '#5b21b6' } },
    professional: { light: { fg: '#8b5cf6', bg: '#f5f3ff' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#7838a0', bg: '#ece0f4' }, dark: { fg: '#a868c8', bg: '#301838' } },
  },
  InsuranceItem: {
    normal: { light: { fg: '#1e3a8a', bg: '#dbeafe' }, dark: { fg: '#93c5fd', bg: '#1e3a8a' } },
    professional: { light: { fg: '#1d4ed8', bg: '#dbeafe' }, dark: { fg: '#60a5fa', bg: '#1e40af' } },
    mono: { light: { fg: '#284880', bg: '#dce4f0' }, dark: { fg: '#6088b8', bg: '#102038' } },
  },
  LoanPayment: {
    normal: { light: { fg: '#1e3a8a', bg: '#dbeafe' }, dark: { fg: '#93c5fd', bg: '#1e3a8a' } },
    professional: { light: { fg: '#1d4ed8', bg: '#dbeafe' }, dark: { fg: '#60a5fa', bg: '#1e40af' } },
    mono: { light: { fg: '#284880', bg: '#dce4f0' }, dark: { fg: '#6088b8', bg: '#102038' } },
  },
  TicketsEvents: {
    normal: { light: { fg: '#7c3aed', bg: '#f5f3ff' }, dark: { fg: '#c4b5fd', bg: '#5b21b6' } },
    professional: { light: { fg: '#8b5cf6', bg: '#f5f3ff' }, dark: { fg: '#a78bfa', bg: '#5b21b6' } },
    mono: { light: { fg: '#7040a0', bg: '#ece0f8' }, dark: { fg: '#a070d0', bg: '#301840' } },
  },

  // --- VICES ---
  Tobacco: {
    normal: { light: { fg: '#374151', bg: '#f3f4f6' }, dark: { fg: '#d1d5db', bg: '#1f2937' } },
    professional: { light: { fg: '#4b5563', bg: '#f3f4f6' }, dark: { fg: '#9ca3af', bg: '#374151' } },
    mono: { light: { fg: '#686050', bg: '#f0ece8' }, dark: { fg: '#a89888', bg: '#383020' } },
  },
  GamblingItem: {
    normal: { light: { fg: '#be123c', bg: '#ffe4e6' }, dark: { fg: '#fda4af', bg: '#9f1239' } },
    professional: { light: { fg: '#e11d48', bg: '#ffe4e6' }, dark: { fg: '#fb7185', bg: '#be123c' } },
    mono: { light: { fg: '#b83050', bg: '#f8e0e4' }, dark: { fg: '#e07890', bg: '#501028' } },
  },

  // --- OTHER ---
  OtherItem: {
    normal: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#cbd5e1', bg: '#334155' } },
    professional: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#94a3b8', bg: '#475569' } },
    mono: { light: { fg: '#607080', bg: '#e8ecf0' }, dark: { fg: '#98a8b8', bg: '#303840' } },
  },
};

// ============================================================================
// GROUP COLORS
// ============================================================================

export const STORE_GROUP_COLORS: Record<StoreCategoryGroup, GroupThemeModeColors> = {
  'food-dining': {
    normal: { light: { fg: '#b45309', bg: '#fef3c7', border: '#fcd34d' }, dark: { fg: '#fcd34d', bg: '#78350f', border: '#92400e' } },
    professional: { light: { fg: '#d97706', bg: '#fef3c7', border: '#fbbf24' }, dark: { fg: '#fbbf24', bg: '#92400e', border: '#b45309' } },
    mono: { light: { fg: '#a88020', bg: '#f8f0d8', border: '#d4b860' }, dark: { fg: '#d4b860', bg: '#4a3810', border: '#6a5020' } },
  },
  'health-wellness': {
    normal: { light: { fg: '#be185d', bg: '#fce7f3', border: '#f9a8d4' }, dark: { fg: '#f9a8d4', bg: '#831843', border: '#9d174d' } },
    professional: { light: { fg: '#db2777', bg: '#fce7f3', border: '#f472b6' }, dark: { fg: '#f472b6', bg: '#9d174d', border: '#be185d' } },
    mono: { light: { fg: '#a83868', bg: '#f8e0ec', border: '#d47098' }, dark: { fg: '#d47098', bg: '#4a1830', border: '#6a2848' } },
  },
  'retail-general': {
    normal: { light: { fg: '#0f766e', bg: '#ccfbf1', border: '#5eead4' }, dark: { fg: '#5eead4', bg: '#134e4a', border: '#14b8a6' } },
    professional: { light: { fg: '#14b8a6', bg: '#ccfbf1', border: '#2dd4bf' }, dark: { fg: '#2dd4bf', bg: '#115e59', border: '#0d9488' } },
    mono: { light: { fg: '#288c8c', bg: '#d8f2f2', border: '#60c8c8' }, dark: { fg: '#60c8c8', bg: '#104848', border: '#286868' } },
  },
  'retail-specialty': {
    normal: { light: { fg: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' }, dark: { fg: '#c4b5fd', bg: '#5b21b6', border: '#7c3aed' } },
    professional: { light: { fg: '#8b5cf6', bg: '#ede9fe', border: '#a78bfa' }, dark: { fg: '#a78bfa', bg: '#5b21b6', border: '#7c3aed' } },
    mono: { light: { fg: '#7838a0', bg: '#ece0f8', border: '#a868d0' }, dark: { fg: '#a868d0', bg: '#301840', border: '#502860' } },
  },
  'automotive': {
    normal: { light: { fg: '#374151', bg: '#f3f4f6', border: '#d1d5db' }, dark: { fg: '#d1d5db', bg: '#1f2937', border: '#4b5563' } },
    professional: { light: { fg: '#4b5563', bg: '#f3f4f6', border: '#9ca3af' }, dark: { fg: '#9ca3af', bg: '#374151', border: '#6b7280' } },
    mono: { light: { fg: '#507080', bg: '#e8ecf0', border: '#90a8b8' }, dark: { fg: '#90a8b8', bg: '#283438', border: '#405058' } },
  },
  'services': {
    normal: { light: { fg: '#1e40af', bg: '#dbeafe', border: '#93c5fd' }, dark: { fg: '#93c5fd', bg: '#1e3a8a', border: '#2563eb' } },
    professional: { light: { fg: '#2563eb', bg: '#dbeafe', border: '#60a5fa' }, dark: { fg: '#60a5fa', bg: '#1e40af', border: '#3b82f6' } },
    mono: { light: { fg: '#385898', bg: '#e0e8f4', border: '#7098c8' }, dark: { fg: '#7098c8', bg: '#182840', border: '#304060' } },
  },
  'hospitality': {
    normal: { light: { fg: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' }, dark: { fg: '#c4b5fd', bg: '#5b21b6', border: '#7c3aed' } },
    professional: { light: { fg: '#8b5cf6', bg: '#f5f3ff', border: '#a78bfa' }, dark: { fg: '#a78bfa', bg: '#5b21b6', border: '#7c3aed' } },
    mono: { light: { fg: '#7838a0', bg: '#ece0f4', border: '#a868c8' }, dark: { fg: '#a868c8', bg: '#301838', border: '#502858' } },
  },
  'other': {
    normal: { light: { fg: '#047857', bg: '#d1fae5', border: '#6ee7b7' }, dark: { fg: '#6ee7b7', bg: '#064e3b', border: '#10b981' } },
    professional: { light: { fg: '#10b981', bg: '#d1fae5', border: '#34d399' }, dark: { fg: '#34d399', bg: '#065f46', border: '#059669' } },
    mono: { light: { fg: '#289068', bg: '#d8f2e8', border: '#60c8a0' }, dark: { fg: '#60c8a0', bg: '#104838', border: '#286850' } },
  },
};

export const ITEM_GROUP_COLORS: Record<ItemCategoryGroup, GroupThemeModeColors> = {
  'food-fresh': {
    normal: { light: { fg: '#15803d', bg: '#dcfce7', border: '#86efac' }, dark: { fg: '#86efac', bg: '#14532d', border: '#22c55e' } },
    professional: { light: { fg: '#16a34a', bg: '#dcfce7', border: '#4ade80' }, dark: { fg: '#4ade80', bg: '#166534', border: '#22c55e' } },
    mono: { light: { fg: '#2d8c50', bg: '#e0f2e8', border: '#6dc792' }, dark: { fg: '#6dc792', bg: '#1e4a30', border: '#3a6a48' } },
  },
  'food-packaged': {
    normal: { light: { fg: '#92400e', bg: '#fef3c7', border: '#fcd34d' }, dark: { fg: '#fcd34d', bg: '#78350f', border: '#d97706' } },
    professional: { light: { fg: '#d97706', bg: '#fef3c7', border: '#fbbf24' }, dark: { fg: '#fbbf24', bg: '#92400e', border: '#b45309' } },
    mono: { light: { fg: '#a88020', bg: '#f8f0d8', border: '#d4b860' }, dark: { fg: '#d4b860', bg: '#4a3810', border: '#6a5020' } },
  },
  'health-personal': {
    normal: { light: { fg: '#a21caf', bg: '#fae8ff', border: '#e879f9' }, dark: { fg: '#e879f9', bg: '#701a75', border: '#a855f7' } },
    professional: { light: { fg: '#c026d3', bg: '#fae8ff', border: '#e879f9' }, dark: { fg: '#e879f9', bg: '#86198f', border: '#a855f7' } },
    mono: { light: { fg: '#9838a8', bg: '#f0e0f8', border: '#c070d4' }, dark: { fg: '#c070d4', bg: '#3a1848', border: '#582868' } },
  },
  'household': {
    normal: { light: { fg: '#0f766e', bg: '#ccfbf1', border: '#5eead4' }, dark: { fg: '#5eead4', bg: '#134e4a', border: '#14b8a6' } },
    professional: { light: { fg: '#14b8a6', bg: '#ccfbf1', border: '#2dd4bf' }, dark: { fg: '#2dd4bf', bg: '#115e59', border: '#0d9488' } },
    mono: { light: { fg: '#288c8c', bg: '#d8f2f2', border: '#60c8c8' }, dark: { fg: '#60c8c8', bg: '#104848', border: '#286868' } },
  },
  'nonfood-retail': {
    normal: { light: { fg: '#1e40af', bg: '#dbeafe', border: '#93c5fd' }, dark: { fg: '#93c5fd', bg: '#1e3a8a', border: '#2563eb' } },
    professional: { light: { fg: '#2563eb', bg: '#dbeafe', border: '#60a5fa' }, dark: { fg: '#60a5fa', bg: '#1e40af', border: '#3b82f6' } },
    mono: { light: { fg: '#3850a8', bg: '#e0e8f8', border: '#7090d4' }, dark: { fg: '#7090d4', bg: '#182848', border: '#304068' } },
  },
  'services-fees': {
    normal: { light: { fg: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' }, dark: { fg: '#cbd5e1', bg: '#334155', border: '#64748b' } },
    professional: { light: { fg: '#64748b', bg: '#f1f5f9', border: '#94a3b8' }, dark: { fg: '#94a3b8', bg: '#475569', border: '#64748b' } },
    mono: { light: { fg: '#607080', bg: '#e8ecf0', border: '#98a8b8' }, dark: { fg: '#98a8b8', bg: '#303840', border: '#485058' } },
  },
  'other-item': {
    normal: { light: { fg: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' }, dark: { fg: '#cbd5e1', bg: '#334155', border: '#64748b' } },
    professional: { light: { fg: '#64748b', bg: '#f1f5f9', border: '#94a3b8' }, dark: { fg: '#94a3b8', bg: '#475569', border: '#64748b' } },
    mono: { light: { fg: '#607080', bg: '#e8ecf0', border: '#98a8b8' }, dark: { fg: '#98a8b8', bg: '#303840', border: '#485058' } },
  },
};

// ============================================================================
// FALLBACK COLORS
// ============================================================================

const FALLBACK_COLORS: ThemeModeColors = {
  normal: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#cbd5e1', bg: '#334155' } },
  professional: { light: { fg: '#64748b', bg: '#f1f5f9' }, dark: { fg: '#94a3b8', bg: '#475569' } },
  mono: { light: { fg: '#607080', bg: '#e8ecf0' }, dark: { fg: '#98a8b8', bg: '#303840' } },
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get the color set for a store category.
 */
export function getStoreCategoryColors(
  category: StoreCategory,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): CategoryColorSet {
  const colors = STORE_CATEGORY_COLORS[category];
  if (!colors) {
    return FALLBACK_COLORS[theme][mode];
  }
  return colors[theme][mode];
}

/**
 * Get the foreground color for a store category.
 */
export function getStoreCategoryColor(
  category: StoreCategory,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): string {
  return getStoreCategoryColors(category, theme, mode).fg;
}

/**
 * Get the background color for a store category.
 */
export function getStoreCategoryBackground(
  category: StoreCategory,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): string {
  return getStoreCategoryColors(category, theme, mode).bg;
}

/**
 * Get the color set for an item category.
 */
export function getItemCategoryColors(
  category: ItemCategory | string,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): CategoryColorSet {
  const key = ITEM_CATEGORY_TO_KEY[category as ItemCategory];
  if (!key) {
    return FALLBACK_COLORS[theme][mode];
  }
  const colors = ITEM_CATEGORY_COLORS[key];
  if (!colors) {
    return FALLBACK_COLORS[theme][mode];
  }
  return colors[theme][mode];
}

/**
 * Get the foreground color for an item category.
 */
export function getItemCategoryColor(
  category: ItemCategory | string,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): string {
  return getItemCategoryColors(category, theme, mode).fg;
}

/**
 * Get the background color for an item category.
 */
export function getItemCategoryBackground(
  category: ItemCategory | string,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): string {
  return getItemCategoryColors(category, theme, mode).bg;
}

/**
 * Get the color set for a store category group.
 */
export function getStoreGroupColors(
  group: StoreCategoryGroup,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): GroupColorSet {
  return STORE_GROUP_COLORS[group][theme][mode];
}

/**
 * Get the color set for an item category group.
 */
export function getItemGroupColors(
  group: ItemCategoryGroup,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): GroupColorSet {
  return ITEM_GROUP_COLORS[group][theme][mode];
}

/**
 * Get the group for a store category.
 */
export function getStoreCategoryGroup(category: StoreCategory): StoreCategoryGroup {
  return STORE_CATEGORY_GROUPS[category] || 'other';
}

/**
 * Get the group for an item category.
 */
export function getItemCategoryGroup(category: ItemCategory | string): ItemCategoryGroup {
  const key = ITEM_CATEGORY_TO_KEY[category as ItemCategory];
  if (!key) {
    return 'other-item';
  }
  return ITEM_CATEGORY_GROUPS[key] || 'other-item';
}

/**
 * Universal function to get colors for any category (store or item).
 * First tries store categories, then item categories.
 */
export function getCategoryColors(
  category: string,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): CategoryColorSet {
  // Try store category first
  if (category in STORE_CATEGORY_COLORS) {
    return getStoreCategoryColors(category as StoreCategory, theme, mode);
  }
  // Try item category
  return getItemCategoryColors(category, theme, mode);
}

/**
 * Universal function to get foreground color for any category.
 */
export function getCategoryColor(
  category: string,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): string {
  return getCategoryColors(category, theme, mode).fg;
}

/**
 * Universal function to get background color for any category.
 */
export function getCategoryBackground(
  category: string,
  theme: ThemeName = 'normal',
  mode: ModeName = 'light'
): string {
  return getCategoryColors(category, theme, mode).bg;
}

// ============================================================================
// DOM-AWARE HELPERS (for components without theme props)
// ============================================================================

/**
 * Detect current theme from DOM (data-theme attribute on html element).
 * Falls back to 'normal' if not set or SSR.
 */
export function getCurrentTheme(): ThemeName {
  if (typeof document === 'undefined') return 'normal';
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'professional' || theme === 'mono') return theme;
  return 'normal';
}

/**
 * Detect current mode from DOM (dark class on html element).
 * Falls back to 'light' if not set or SSR.
 */
export function getCurrentMode(): ModeName {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Story 14.21: Get font color mode from localStorage.
 * 'colorful' = use category fg colors
 * 'plain' = use standard black/white text colors
 */
export function getFontColorMode(): 'colorful' | 'plain' {
  if (typeof window === 'undefined') return 'colorful';
  try {
    const mode = localStorage.getItem('fontColorMode');
    if (mode === 'plain') return 'plain';
  } catch {
    // localStorage may not be available (e.g., tests, SSR)
  }
  return 'colorful';
}

/**
 * Story 14.21: Plain text colors based on light/dark mode.
 * Used when fontColorMode is 'plain'.
 */
const PLAIN_TEXT_COLORS = {
  light: '#1f2937', // gray-800 - near black
  dark: '#f9fafb',  // gray-50 - near white
};

/**
 * Get category colors using current theme/mode from DOM.
 * Use this when colorTheme/mode props are not available.
 *
 * Story 14.21: Respects fontColorMode setting.
 * - 'colorful': Returns the category's fg color (default)
 * - 'plain': Returns black (light mode) or white (dark mode)
 *
 * @param category - The category name (store or item)
 * @returns ColorSet with fg and bg colors for current theme/mode
 */
export function getCategoryColorsAuto(category: string): CategoryColorSet {
  const colors = getCategoryColors(category, getCurrentTheme(), getCurrentMode());

  // Story 14.21: When fontColorMode is 'plain', override fg with plain text color
  if (getFontColorMode() === 'plain') {
    const mode = getCurrentMode();
    return {
      fg: PLAIN_TEXT_COLORS[mode],
      bg: colors.bg,
    };
  }

  return colors;
}

/**
 * Get category background color using current theme/mode from DOM.
 * Convenience function for chart colors where only bg is needed.
 *
 * @param category - The category name (store or item)
 * @returns Background color hex string for current theme/mode
 */
export function getCategoryBackgroundAuto(category: string): string {
  return getCategoryColors(category, getCurrentTheme(), getCurrentMode()).bg;
}

/**
 * Story 14.21: Get category colors for pills/badges/legends.
 * ALWAYS returns colorful fg colors regardless of fontColorMode setting.
 * Use this for category pills, badges, and legend items where the text
 * should always be colored to match the category.
 *
 * @param category - The category name (store or item)
 * @returns ColorSet with fg (always colorful) and bg colors for current theme/mode
 */
export function getCategoryPillColors(category: string): CategoryColorSet {
  return getCategoryColors(category, getCurrentTheme(), getCurrentMode());
}

/**
 * Story 14.21: Get category foreground color for pills/badges.
 * ALWAYS returns the colorful fg color regardless of fontColorMode.
 *
 * @param category - The category name (store or item)
 * @returns Foreground color hex string (always colorful)
 */
export function getCategoryPillFgAuto(category: string): string {
  return getCategoryColors(category, getCurrentTheme(), getCurrentMode()).fg;
}

// ============================================================================
// CATEGORY GROUP HELPERS (Story 14.15c)
// ============================================================================

/**
 * All store category group keys in display order.
 */
export const ALL_STORE_CATEGORY_GROUPS: StoreCategoryGroup[] = [
  'food-dining',
  'health-wellness',
  'retail-general',
  'retail-specialty',
  'automotive',
  'services',
  'hospitality',
  'other',
];

/**
 * Expands a store category group to all its member categories.
 *
 * @param group - The group key (e.g., 'food-dining')
 * @returns Array of StoreCategory values in that group
 *
 * @example
 * expandStoreCategoryGroup('food-dining')
 * // Returns: ['Supermarket', 'Restaurant', 'Bakery', 'Butcher', 'StreetVendor']
 */
export function expandStoreCategoryGroup(group: StoreCategoryGroup): StoreCategory[] {
  const categories: StoreCategory[] = [];
  for (const [category, categoryGroup] of Object.entries(STORE_CATEGORY_GROUPS)) {
    if (categoryGroup === group) {
      categories.push(category as StoreCategory);
    }
  }
  return categories;
}

/**
 * Detects if a set of selected categories exactly matches a known store category group.
 *
 * @param selectedCategories - Array of selected StoreCategory values
 * @returns The matching group key, or null if no exact match
 *
 * @example
 * detectStoreCategoryGroup(['Supermarket', 'Restaurant', 'Bakery', 'Butcher', 'StreetVendor'])
 * // Returns: 'food-dining'
 *
 * detectStoreCategoryGroup(['Supermarket', 'Restaurant'])
 * // Returns: null (partial match)
 */
export function detectStoreCategoryGroup(selectedCategories: string[]): StoreCategoryGroup | null {
  if (selectedCategories.length === 0) return null;

  // Check each group for exact match
  for (const group of ALL_STORE_CATEGORY_GROUPS) {
    const groupCategories = expandStoreCategoryGroup(group);
    if (groupCategories.length !== selectedCategories.length) continue;

    // Sort both arrays and compare
    const sortedSelected = [...selectedCategories].sort();
    const sortedGroup = [...groupCategories].sort();

    let isMatch = true;
    for (let i = 0; i < sortedSelected.length; i++) {
      if (sortedSelected[i] !== sortedGroup[i]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) return group;
  }

  return null;
}

/**
 * Gets the primary (first) category in a store category group.
 * Used to determine the representative emoji for the group.
 *
 * @param group - The group key
 * @returns The first StoreCategory in that group
 */
export function getStoreCategoryGroupPrimaryCategory(group: StoreCategoryGroup): StoreCategory {
  const categories = expandStoreCategoryGroup(group);
  return categories[0] || 'Other';
}

// ============================================================================
// ITEM CATEGORY GROUP HELPERS (Story 14.15c)
// ============================================================================

/**
 * All item category group keys in display order.
 */
export const ALL_ITEM_CATEGORY_GROUPS: ItemCategoryGroup[] = [
  'food-fresh',
  'food-packaged',
  'health-personal',
  'household',
  'nonfood-retail',
  'services-fees',
  'other-item',
];

/**
 * Expands an item category group to all its member categories.
 *
 * @param group - The group key (e.g., 'food-fresh')
 * @returns Array of ItemCategory values in that group
 */
export function expandItemCategoryGroup(group: ItemCategoryGroup): ItemCategory[] {
  const categories: ItemCategory[] = [];
  for (const [category, categoryKey] of Object.entries(ITEM_CATEGORY_TO_KEY)) {
    const categoryGroup = ITEM_CATEGORY_GROUPS[categoryKey as keyof typeof ITEM_CATEGORY_GROUPS];
    if (categoryGroup === group) {
      categories.push(category as ItemCategory);
    }
  }
  return categories;
}

/**
 * Detects if a set of selected categories exactly matches a known item category group.
 *
 * @param selectedCategories - Array of selected ItemCategory values
 * @returns The matching group key, or null if no exact match
 */
export function detectItemCategoryGroup(selectedCategories: string[]): ItemCategoryGroup | null {
  if (selectedCategories.length === 0) return null;

  // Check each group for exact match
  for (const group of ALL_ITEM_CATEGORY_GROUPS) {
    const groupCategories = expandItemCategoryGroup(group);
    if (groupCategories.length !== selectedCategories.length) continue;

    // Sort both arrays and compare
    const sortedSelected = [...selectedCategories].sort();
    const sortedGroup = [...groupCategories].sort();

    let isMatch = true;
    for (let i = 0; i < sortedSelected.length; i++) {
      if (sortedSelected[i] !== sortedGroup[i]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) return group;
  }

  return null;
}

// ============================================================================
// GROUP DISPLAY INFO - Story 14.16
// Provides display names and emojis for transaction/item groups in reports
// ============================================================================

/**
 * Display information for store category groups.
 * Used in weekly reports for grouped category breakdown.
 */
export interface GroupDisplayInfo {
  /** Group key */
  key: StoreCategoryGroup | ItemCategoryGroup;
  /** Display name in Spanish */
  name: string;
  /** Representative emoji for the group */
  emoji: string;
  /** CSS class for styling (matches mockup) */
  cssClass: string;
}

/**
 * Store category group display information.
 * Maps group keys to display names and emojis for report rendering.
 *
 * @example
 * const info = STORE_GROUP_INFO['food-dining'];
 * // { key: 'food-dining', name: 'Alimentación', emoji: '🍽️', cssClass: 'food-dining' }
 */
export const STORE_GROUP_INFO: Record<StoreCategoryGroup, GroupDisplayInfo> = {
  'food-dining': {
    key: 'food-dining',
    name: 'Alimentación',
    emoji: '🍽️',
    cssClass: 'food-dining',
  },
  'health-wellness': {
    key: 'health-wellness',
    name: 'Salud y Bienestar',
    emoji: '💊',
    cssClass: 'health-wellness',
  },
  'retail-general': {
    key: 'retail-general',
    name: 'Tiendas General',
    emoji: '🛒',
    cssClass: 'retail-general',
  },
  'retail-specialty': {
    key: 'retail-specialty',
    name: 'Tiendas Especializadas',
    emoji: '🎁',
    cssClass: 'retail-specialty',
  },
  'automotive': {
    key: 'automotive',
    name: 'Automotriz',
    emoji: '⛽',
    cssClass: 'automotive',
  },
  'services': {
    key: 'services',
    name: 'Servicios',
    emoji: '🏢',
    cssClass: 'services',
  },
  'hospitality': {
    key: 'hospitality',
    name: 'Hospitalidad',
    emoji: '🏨',
    cssClass: 'hospitality',
  },
  'other': {
    key: 'other',
    name: 'Otros',
    emoji: '📦',
    cssClass: 'other-store',
  },
};

/**
 * Item category group display information.
 * Maps group keys to display names and emojis for report rendering (monthly+).
 */
export const ITEM_GROUP_INFO: Record<ItemCategoryGroup, GroupDisplayInfo> = {
  'food-fresh': {
    key: 'food-fresh',
    name: 'Alimentos Frescos',
    emoji: '🥬',
    cssClass: 'food-fresh',
  },
  'food-packaged': {
    key: 'food-packaged',
    name: 'Alimentos Envasados',
    emoji: '🥫',
    cssClass: 'food-packaged',
  },
  'health-personal': {
    key: 'health-personal',
    name: 'Salud y Personal',
    emoji: '💄',
    cssClass: 'health-personal',
  },
  'household': {
    key: 'household',
    name: 'Hogar',
    emoji: '🏠',
    cssClass: 'household',
  },
  'nonfood-retail': {
    key: 'nonfood-retail',
    name: 'Retail No Alimentario',
    emoji: '🛍️',
    cssClass: 'nonfood-retail',
  },
  'services-fees': {
    key: 'services-fees',
    name: 'Servicios y Cargos',
    emoji: '📋',
    cssClass: 'services-fees',
  },
  'other-item': {
    key: 'other-item',
    name: 'Otros',
    emoji: '📦',
    cssClass: 'other-item',
  },
};
