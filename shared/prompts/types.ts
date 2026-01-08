/**
 * Shared Prompts Library - Type Definitions
 *
 * CANONICAL SOURCE OF TRUTH for category types.
 * All other files (src/types/transaction.ts, functions/src/prompts/*)
 * should import from here or stay in sync.
 *
 * Story 14.14b: Category Standardization
 * - Database stores English values only
 * - Translation happens at UI layer via categoryTranslations.ts
 */

/**
 * Configuration for a versioned prompt.
 * Each prompt version is stored with metadata for tracking and A/B testing.
 */
export interface PromptConfig {
  /** Unique identifier, e.g., "v1-original" */
  id: string;

  /** Human-readable name, e.g., "Original Chilean" */
  name: string;

  /** Description of this prompt version */
  description: string;

  /** Semantic version string, e.g., "1.0.0" */
  version: string;

  /** ISO date when this prompt was created, e.g., "2025-12-11" */
  createdAt: string;

  /** The actual prompt text sent to Gemini API */
  prompt: string;

  /** Optional few-shot examples to append to the prompt */
  fewShotExamples?: string[];
}

/**
 * Store categories used in prompts for receipt analysis.
 * These are the valid values for the top-level transaction.category field.
 *
 * IMPORTANT: Keep in sync with src/types/transaction.ts StoreCategory
 */
export type StoreCategory =
  // Food & Dining
  | 'Supermarket'
  | 'Restaurant'
  | 'Bakery'
  | 'Butcher'
  | 'StreetVendor'
  // Health & Wellness
  | 'Pharmacy'
  | 'Medical'
  | 'Veterinary'
  | 'HealthBeauty'
  // Retail - General
  | 'Bazaar'
  | 'Clothing'
  | 'Electronics'
  | 'HomeGoods'
  | 'Furniture'
  | 'Hardware'
  | 'GardenCenter'
  // Retail - Specialty
  | 'PetShop'
  | 'BooksMedia'
  | 'OfficeSupplies'
  | 'SportsOutdoors'
  | 'ToysGames'
  | 'Jewelry'
  | 'Optical'
  // Automotive & Transport
  | 'Automotive'
  | 'GasStation'
  | 'Transport'
  // Services & Finance
  | 'Services'
  | 'BankingFinance'
  | 'Education'
  | 'TravelAgency'
  // Hospitality & Entertainment
  | 'HotelLodging'
  | 'Entertainment'
  // Other
  | 'CharityDonation'
  | 'Other';

/**
 * Item categories used in prompts for line item categorization.
 * These are the valid values for item.category field.
 *
 * IMPORTANT: Keep in sync with src/types/transaction.ts ItemCategory
 */
export type ItemCategory =
  // Food - Fresh
  | 'Produce'
  | 'Meat & Seafood'
  | 'Bakery'
  | 'Dairy & Eggs'
  // Food - Packaged
  | 'Pantry'
  | 'Frozen Foods'
  | 'Snacks'
  | 'Beverages'
  | 'Alcohol'
  // Health & Personal
  | 'Health & Beauty'
  | 'Personal Care'
  | 'Pharmacy'
  | 'Supplements'
  | 'Baby Products'
  // Household
  | 'Cleaning Supplies'
  | 'Household'
  | 'Pet Supplies'
  // Non-Food Retail
  | 'Clothing'
  | 'Electronics'
  | 'Hardware'
  | 'Garden'
  | 'Automotive'
  | 'Sports & Outdoors'
  | 'Toys & Games'
  | 'Books & Media'
  | 'Office & Stationery'
  | 'Crafts & Hobbies'
  | 'Furniture'
  // Services & Fees
  | 'Service'
  | 'Tax & Fees'
  | 'Tobacco'
  // Catch-all
  | 'Other';

/**
 * Legacy item categories from earlier prompt versions.
 * Used for migration/normalization of existing data.
 */
export type LegacyItemCategory =
  | 'Fresh Food'  // → Produce (most common mapping)
  | 'Drinks'      // → Beverages
  | 'Pets'        // → Pet Supplies
  | 'Apparel';    // → Clothing

/**
 * Legacy store categories from earlier prompt versions.
 */
export type LegacyStoreCategory =
  | 'Technology'; // → Electronics
