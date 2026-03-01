/**
 * Category Emoji Mapping
 *
 * Story 11.2: Quick Save Card Component (AC #8)
 * Maps store categories to representative emojis for visual display.
 */

import type { StoreCategory } from '../../shared/schema/categories';

/**
 * Emoji mapping for store categories.
 * Each category is mapped to a representative emoji.
 */
const CATEGORY_EMOJI_MAP: Record<StoreCategory, string> = {
  // Food & Dining
  Supermarket: '🛒',
  Almacen: '🏪',
  Restaurant: '🍽️',
  Bakery: '🥐',
  Butcher: '🥩',
  StreetVendor: '🌮',

  // Health & Wellness
  Pharmacy: '💊',
  Medical: '🏥',
  Veterinary: '🐾',
  HealthBeauty: '💄',

  // Retail - General
  Bazaar: '🏪',
  Clothing: '👕',
  Electronics: '📱',
  HomeGoods: '🏠',
  Furniture: '🛋️',
  Hardware: '🔧',
  GardenCenter: '🌱',

  // Retail - Specialty
  PetShop: '🐕',
  BooksMedia: '📚',
  OfficeSupplies: '📎',
  SportsOutdoors: '⚽',
  ToysGames: '🎮',
  Jewelry: '💎',
  Optical: '👓',
  MusicStore: '🎸',

  // Automotive & Transport
  Automotive: '🚗',
  GasStation: '⛽',
  Transport: '🚌',

  // Services & Finance
  Services: '🔧',
  BankingFinance: '🏦',
  Education: '📖',
  TravelAgency: '✈️',
  Subscription: '📺',

  // Hospitality & Entertainment
  HotelLodging: '🏨',
  Entertainment: '🎬',
  Gambling: '🎰',

  // Government & Legal
  Government: '🏛️',

  // Other
  CharityDonation: '❤️',
  Other: '📦',
};

/**
 * Get the emoji for a store category.
 *
 * @param category - The store category
 * @returns The emoji representing the category, or a default box emoji for unknown categories
 *
 * @example
 * getCategoryEmoji('Supermarket') // Returns '🛒'
 * getCategoryEmoji('Restaurant')  // Returns '🍽️'
 * getCategoryEmoji('Unknown')     // Returns '📦' (default)
 */
export function getCategoryEmoji(category: StoreCategory | string): string {
  // Check if it's a valid StoreCategory
  if (category in CATEGORY_EMOJI_MAP) {
    return CATEGORY_EMOJI_MAP[category as StoreCategory];
  }

  // Default fallback for unknown categories
  return '📦';
}

/**
 * Get all category-emoji pairs.
 * Useful for rendering category pickers or legend displays.
 *
 * @returns Array of objects with category and emoji
 */
export function getAllCategoryEmojis(): Array<{ category: StoreCategory; emoji: string }> {
  return Object.entries(CATEGORY_EMOJI_MAP).map(([category, emoji]) => ({
    category: category as StoreCategory,
    emoji,
  }));
}

export default getCategoryEmoji;
