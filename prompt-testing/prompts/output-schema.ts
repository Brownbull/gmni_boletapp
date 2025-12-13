/**
 * Output Schema - AI Response Structure
 *
 * Defines what the AI must OUTPUT in its response:
 * - Store categories (merchant classification)
 * - Item categories (line item classification)
 * - JSON structure requirements
 *
 * These are NOT user inputs - they are constraints on the AI's output.
 *
 * IMPORTANT: Keep app's src/types/transaction.ts in sync with STORE_CATEGORIES.
 *
 * Types are derived from arrays using `as const` to prevent duplication.
 */

// ============================================================================
// Store Categories (Merchant Classification)
// ============================================================================

/**
 * Valid store categories for receipt classification.
 * Order matters - commonly used categories are listed first.
 *
 * NOTE: This is the single source of truth for prompt categories.
 * The app's src/types/transaction.ts has its own StoreCategory type
 * which should be kept in sync manually when categories change.
 *
 * Categories are designed to be:
 * - Not too granular (avoid splitting into 100+ categories)
 * - Not too generic (avoid just "Store" or "Shop")
 * - Mutually exclusive where possible
 */
export const STORE_CATEGORIES = [
  // Food & Dining
  'Supermarket',      // Grocery stores, hypermarkets
  'Restaurant',       // Restaurants, cafes, bars, fast food
  'Bakery',           // Bakeries, pastry shops
  'Butcher',          // Butcher shops, meat markets
  'StreetVendor',     // Street food, informal vendors, ferias

  // Health & Wellness
  'Pharmacy',         // Pharmacies, drugstores
  'Medical',          // Clinics, hospitals, labs
  'Veterinary',       // Vet clinics, pet hospitals
  'HealthBeauty',     // Salons, spas, cosmetics stores

  // Retail - General
  'Bazaar',           // Multi-category stores, dollar stores
  'Clothing',         // Apparel, footwear, accessories
  'Electronics',      // Tech stores, phone shops, appliances
  'HomeGoods',        // Home decor, kitchenware, bedding
  'Furniture',        // Furniture stores
  'Hardware',         // Ferretería, tools, building materials
  'GardenCenter',     // Plant nurseries, garden supplies

  // Retail - Specialty
  'PetShop',          // Pet stores, pet supplies
  'BooksMedia',       // Bookstores, music, movies
  'OfficeSupplies',   // Office stores, stationery
  'SportsOutdoors',   // Sports equipment, camping gear
  'ToysGames',        // Toy stores, game shops
  'Jewelry',          // Jewelry stores, watches
  'Optical',          // Eye care, glasses, contacts

  // Automotive & Transport
  'Automotive',       // Auto parts, car accessories, repairs
  'GasStation',       // Gas/petrol stations, convenience
  'Transport',        // Taxis, ride-share, public transit, parking

  // Services & Finance
  'Services',         // General services, repairs, laundry
  'BankingFinance',   // Banks, insurance, financial services
  'Education',        // Schools, courses, tutoring
  'TravelAgency',     // Travel agencies, tour operators

  // Hospitality & Entertainment
  'HotelLodging',     // Hotels, hostels, Airbnb
  'Entertainment',    // Movies, concerts, events, gym

  // Other
  'CharityDonation',  // Donations, nonprofits
  'Other',            // Anything that doesn't fit above
] as const;

/** Store category type derived from STORE_CATEGORIES array */
export type StoreCategory = (typeof STORE_CATEGORIES)[number];

// ============================================================================
// Item Categories (Line Item Classification)
// ============================================================================

/**
 * Valid item categories for line item classification.
 *
 * Categories are designed for grocery/retail line items.
 * Should be specific enough to be useful for budgeting,
 * but not so granular that classification becomes difficult.
 */
export const ITEM_CATEGORIES = [
  // Food - Fresh
  'Produce',            // Fruits, vegetables, fresh herbs
  'Meat & Seafood',     // Fresh/frozen meat, fish, poultry
  'Bakery',             // Bread, pastries, baked goods
  'Dairy & Eggs',       // Milk, cheese, yogurt, eggs

  // Food - Packaged
  'Pantry',             // Canned goods, pasta, rice, cooking ingredients
  'Frozen Foods',       // Frozen meals, ice cream, frozen vegetables
  'Snacks',             // Chips, cookies, candy, crackers
  'Beverages',          // Soft drinks, juice, water, coffee, tea
  'Alcohol',            // Beer, wine, spirits

  // Health & Personal
  'Health & Beauty',    // Cosmetics, skincare, haircare
  'Personal Care',      // Toiletries, hygiene products
  'Pharmacy',           // Medications, first aid
  'Supplements',        // Vitamins, health supplements
  'Baby Products',      // Diapers, formula, baby food

  // Household
  'Cleaning Supplies',  // Detergent, cleaning products
  'Household',          // Paper goods, trash bags, storage
  'Pet Supplies',       // Pet food, pet accessories

  // Non-Food Retail
  'Clothing',           // Apparel, footwear, accessories
  'Electronics',        // Gadgets, cables, batteries
  'Hardware',           // Tools, home repair supplies
  'Garden',             // Plants, garden tools, soil
  'Automotive',         // Car supplies, car care
  'Sports & Outdoors',  // Sports equipment, outdoor gear
  'Toys & Games',       // Toys, games, puzzles
  'Books & Media',      // Books, magazines, DVDs
  'Office & Stationery',// Office supplies, paper, pens
  'Crafts & Hobbies',   // Art supplies, craft materials
  'Furniture',          // Furniture, home decor

  // Services & Fees
  'Service',            // Service charges, labor, delivery
  'Tax & Fees',         // Taxes, tips, fees
  'Tobacco',            // Cigarettes, tobacco products

  // Catch-all
  'Other',              // Anything that doesn't fit above
] as const;

/** Item category type derived from ITEM_CATEGORIES array */
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

// ============================================================================
// Formatted Lists for Prompt Inclusion
// ============================================================================

/**
 * Store category list formatted for prompt inclusion.
 */
export const STORE_CATEGORY_LIST = STORE_CATEGORIES.join(', ');

/**
 * Item category list formatted for prompt inclusion.
 */
export const ITEM_CATEGORY_LIST = ITEM_CATEGORIES.join(', ');

// ============================================================================
// JSON Output Format Instructions
// ============================================================================

/**
 * JSON format instructions for Gemini output.
 */
export const JSON_FORMAT_INSTRUCTIONS = `Strict JSON output. Return 'total' and 'price' as INTEGERS (no dots/commas).`;

/**
 * Expected JSON structure for Gemini output.
 */
export const JSON_STRUCTURE = `{
  "merchant": "store name",
  "date": "YYYY-MM-DD",
  "total": 12345,
  "category": "one of: ${STORE_CATEGORY_LIST}",
  "items": [
    {
      "name": "item name",
      "price": 1234,
      "category": "one of: ${ITEM_CATEGORY_LIST}",
      "subcategory": "optional subcategory"
    }
  ]
}`;

/**
 * Date handling instructions.
 */
export const DATE_INSTRUCTIONS = `If multiple dates, choose closest to today.`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Builds a basic prompt with variable placeholders.
 * Use this to create new prompt versions with consistent structure.
 *
 * @param options - Prompt configuration options
 * @returns Prompt string with {{currency}} and {{date}} placeholders
 */
export function buildBasePrompt(options: {
  additionalInstructions?: string;
  includeStructure?: boolean;
}): string {
  const { additionalInstructions = '', includeStructure = false } = options;

  let prompt = `Analyze receipt. Context: {{currency}}. Today: {{date}}. ${JSON_FORMAT_INSTRUCTIONS}`;

  if (includeStructure) {
    prompt += `\n\nExpected output format:\n${JSON_STRUCTURE}`;
  }

  prompt += `\n\nExtract: merchant (store name), date (YYYY-MM-DD), total, category (one of: ${STORE_CATEGORY_LIST}). Items: name, price, category (${ITEM_CATEGORY_LIST}), subcategory. ${DATE_INSTRUCTIONS}`;

  if (additionalInstructions) {
    prompt += `\n\n${additionalInstructions}`;
  }

  return prompt;
}
