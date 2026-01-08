/**
 * UNIFIED CATEGORY SCHEMA
 *
 * Single source of truth for all category definitions.
 * Used by: AI prompts, app types, analytics, filtering
 *
 * IMPORTANT: When adding/changing categories:
 * 1. Update the arrays below
 * 2. Run `npm run type-check` to verify all consumers compile
 * 3. Update translations in src/utils/translations.ts
 * 4. Update categoryColors.ts if colors are needed
 */

// ============================================================================
// STORE CATEGORIES (Where you buy)
// ============================================================================

/**
 * Store categories - classifies the TYPE of establishment.
 *
 * Design principles:
 * - Mutually exclusive (one category per transaction)
 * - Common enough to be useful for budgeting
 * - Not too granular (avoid 100+ categories)
 */
export const STORE_CATEGORIES = [
  // ── Food & Dining ──
  'Supermarket',      // Grocery stores, hypermarkets
  'Almacen',          // Corner stores, bodegas, small neighborhood shops
  'Restaurant',       // Restaurants, cafes, bars, fast food
  'Bakery',           // Bakeries, pastry shops
  'Butcher',          // Butcher shops, meat markets
  'StreetVendor',     // Street food, informal vendors, ferias

  // ── Health & Wellness ──
  'Pharmacy',         // Pharmacies, drugstores
  'Medical',          // Clinics, hospitals, labs
  'Veterinary',       // Vet clinics, pet hospitals
  'HealthBeauty',     // Salons, spas, cosmetics stores

  // ── Retail - General ──
  'Bazaar',           // Multi-category stores, dollar stores
  'Clothing',         // Apparel, footwear, accessories
  'Electronics',      // Tech stores, phone shops, appliances
  'HomeGoods',        // Home decor, kitchenware, bedding
  'Furniture',        // Furniture stores
  'Hardware',         // Ferretería, tools, building materials
  'GardenCenter',     // Plant nurseries, garden supplies

  // ── Retail - Specialty ──
  'PetShop',          // Pet stores, pet supplies
  'BooksMedia',       // Bookstores, music, movies
  'OfficeSupplies',   // Office stores, stationery
  'SportsOutdoors',   // Sports equipment, camping gear
  'ToysGames',        // Toy stores, game shops
  'Jewelry',          // Jewelry stores, watches
  'Optical',          // Eye care, glasses, contacts
  'MusicStore',       // Musical instruments, audio equipment

  // ── Automotive & Transport ──
  'Automotive',       // Auto parts, car accessories, repairs
  'GasStation',       // Gas/petrol stations, convenience
  'Transport',        // Taxis, ride-share, public transit, parking

  // ── Services & Finance ──
  'Services',         // General services, repairs, laundry
  'BankingFinance',   // Banks, insurance, financial services
  'Education',        // Schools, courses, tutoring
  'TravelAgency',     // Travel agencies, tour operators
  'Subscription',     // Digital subscriptions, streaming services

  // ── Hospitality & Entertainment ──
  'HotelLodging',     // Hotels, hostels, Airbnb
  'Entertainment',    // Movies, concerts, events, gym
  'Gambling',         // Casinos, betting shops, lottery vendors

  // ── Government & Legal ──
  'Government',       // Taxes, permits, fines, public services

  // ── Other ──
  'CharityDonation',  // Donations, nonprofits
  'Other',            // Anything that doesn't fit above
] as const;

export type StoreCategory = (typeof STORE_CATEGORIES)[number];

// ============================================================================
// ITEM CATEGORIES (What you buy)
// ============================================================================

/**
 * Item categories - classifies individual LINE ITEMS on a receipt.
 *
 * Design principles:
 * - Useful for budgeting and spending analysis
 * - Works across different store types
 * - Granular enough to be actionable
 */
export const ITEM_CATEGORIES = [
  // ── Food - Fresh ──
  'Produce',            // Fruits, vegetables, fresh herbs
  'Meat & Seafood',     // Fresh/frozen meat, fish, poultry
  'Bakery',             // Bread, pastries, baked goods
  'Dairy & Eggs',       // Milk, cheese, yogurt, eggs

  // ── Food - Packaged ──
  'Pantry',             // Canned goods, pasta, rice, cooking ingredients
  'Frozen Foods',       // Frozen meals, ice cream, frozen vegetables
  'Snacks',             // Chips, cookies, candy, crackers
  'Beverages',          // Soft drinks, juice, water, coffee, tea
  'Alcohol',            // Beer, wine, spirits

  // ── Food - Prepared ──
  'Prepared Food',      // Restaurant meals, takeout, ready-to-eat

  // ── Health & Personal ──
  'Health & Beauty',    // Cosmetics, skincare, haircare
  'Personal Care',      // Toiletries, hygiene products
  'Pharmacy',           // Medications, first aid
  'Supplements',        // Vitamins, health supplements
  'Baby Products',      // Diapers, formula, baby food

  // ── Household ──
  'Cleaning Supplies',  // Detergent, cleaning products
  'Household',          // Paper goods, trash bags, storage
  'Pet Supplies',       // Pet food, pet accessories

  // ── Non-Food Retail ──
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
  'Musical Instruments',// Guitars, pianos, audio equipment

  // ── Services & Fees ──
  'Service',            // Service charges, labor, delivery
  'Tax & Fees',         // Taxes, tips, fees
  'Subscription',       // Monthly/annual subscriptions
  'Insurance',          // Insurance premiums
  'Loan Payment',       // Mortgage, credit card, debt payments
  'Tickets & Events',   // Theater, concerts, movies, sports events

  // ── Vices ──
  'Tobacco',            // Cigarettes, tobacco products
  'Gambling',           // Lottery tickets, casino chips, betting

  // ── Catch-all ──
  'Other',              // Anything that doesn't fit above
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

// ============================================================================
// FORMATTED LISTS FOR PROMPTS
// ============================================================================

export const STORE_CATEGORY_LIST = STORE_CATEGORIES.join(', ');
export const ITEM_CATEGORY_LIST = ITEM_CATEGORIES.join(', ');

// ============================================================================
// CATEGORY COUNTS (for documentation)
// ============================================================================

export const STORE_CATEGORY_COUNT = STORE_CATEGORIES.length;  // 36
export const ITEM_CATEGORY_COUNT = ITEM_CATEGORIES.length;    // 39
