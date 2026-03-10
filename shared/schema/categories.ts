/**
 * UNIFIED CATEGORY SCHEMA — V4 (4-Level Spanish Taxonomy)
 *
 * Single source of truth for all category definitions.
 * Used by: AI prompts, app types, analytics, filtering
 *
 * L1 = Rubro (12 groups of store types)
 * L2 = Giro (44 store categories — where you buy)
 * L3 = Familia (9 groups of item types)
 * L4 = Categoria (42 item categories — what you buy)
 *
 * IMPORTANT: When adding/changing categories:
 * 1. Update the arrays below
 * 2. Run `npm run type-check` to verify all consumers compile
 * 3. Update translations in src/utils/categoryTranslations.ts
 * 4. Update categoryColors if colors are needed
 *
 * @see docs/architecture/category-taxonomy-v2.md
 */

// ============================================================================
// STORE CATEGORIES — L2 Giros (Where you buy)
// ============================================================================

/**
 * Store categories - classifies the TYPE of establishment.
 *
 * Design principles:
 * - Mutually exclusive (one category per transaction)
 * - Common enough to be useful for budgeting
 * - Not too granular (avoid 100+ categories)
 * - Zero cross-level name overlaps with item categories
 */
export const STORE_CATEGORIES = [
  // ── Supermercados ──
  'Supermarket',      // Grocery stores, hypermarkets
  'Wholesale',        // Wholesale / Mayorista

  // ── Restaurantes ──
  'Restaurant',       // Restaurants, cafes, bars, fast food

  // ── Comercio de Barrio ──
  'Almacen',          // Corner stores, bodegas, small neighborhood shops
  'Minimarket',       // Minimarkets
  'OpenMarket',       // Open-air markets, ferias
  'Kiosk',            // Kiosks, street-level snack/newspaper shops
  'LiquorStore',      // Botillerias, liquor stores
  'Bakery',           // Bakeries, pastry shops
  'Butcher',          // Butcher shops, meat markets

  // ── Vivienda ──
  'UtilityCompany',   // Utility companies (electricity, water, gas)
  'PropertyAdmin',    // Property management, condo administration

  // ── Salud y Bienestar ──
  'Pharmacy',         // Pharmacies, drugstores
  'Medical',          // Clinics, hospitals, labs
  'Veterinary',       // Vet clinics, pet hospitals
  'HealthBeauty',     // Salons, spas, cosmetics stores

  // ── Tiendas Generales ──
  'Bazaar',           // Multi-category stores, dollar stores
  'ClothingStore',    // Apparel, footwear, accessories stores
  'ElectronicsStore', // Tech stores, phone shops, appliances
  'HomeGoods',        // Home decor, kitchenware, bedding
  'FurnitureStore',   // Furniture stores
  'Hardware',         // Ferreteria, tools, building materials
  'GardenCenter',     // Plant nurseries, garden supplies

  // ── Tiendas Especializadas ──
  'PetShop',          // Pet stores, pet supplies
  'BookStore',        // Bookstores
  'OfficeSupplies',   // Office stores, stationery
  'SportsStore',      // Sports equipment stores
  'ToyStore',         // Toy stores
  'AccessoriesOptical', // Accessories, jewelry, optical
  'OnlineStore',      // Online retail stores

  // ── Transporte y Vehiculo ──
  'AutoShop',         // Auto parts, car accessories, repairs
  'GasStation',       // Gas/petrol stations, convenience
  'Transport',        // Taxis, ride-share, public transit, parking

  // ── Servicios y Finanzas ──
  'GeneralServices',  // General services, repairs, laundry
  'BankingFinance',   // Banks, insurance, financial services
  'TravelAgency',     // Travel agencies, tour operators
  'SubscriptionService', // Digital subscriptions, streaming services
  'Government',       // Taxes, permits, fines, public services

  // ── Educacion ──
  'Education',        // Schools, courses, tutoring

  // ── Entretenimiento y Hospedaje ──
  'Lodging',          // Hotels, hostels, Airbnb
  'Entertainment',    // Movies, concerts, events, gym
  'Casino',           // Casinos, betting shops, lottery vendors

  // ── Otros ──
  'CharityDonation',  // Donations, nonprofits
  'Other',            // Anything that doesn't fit above
] as const;

export type StoreCategory = (typeof STORE_CATEGORIES)[number];

// ============================================================================
// ITEM CATEGORIES — L4 Categorias (What you buy)
// ============================================================================

/**
 * Item categories - classifies individual LINE ITEMS on a receipt.
 *
 * Design principles:
 * - Useful for budgeting and spending analysis
 * - Works across different store types
 * - Granular enough to be actionable
 * - All PascalCase keys (no spaces) — V4 standard
 * - Zero cross-level name overlaps with store categories
 */
export const ITEM_CATEGORIES = [
  // ── Alimentos Frescos ──
  'Produce',          // Fruits, vegetables, fresh herbs
  'MeatSeafood',      // Fresh/frozen meat, fish, poultry
  'BreadPastry',      // Bread, pastries, baked goods
  'DairyEggs',        // Milk, cheese, yogurt, eggs

  // ── Alimentos Envasados ──
  'Pantry',           // Canned goods, pasta, rice, cooking ingredients
  'FrozenFoods',      // Frozen meals, ice cream, frozen vegetables
  'Snacks',           // Chips, cookies, candy, crackers
  'Beverages',        // Soft drinks, juice, water, coffee, tea

  // ── Comida Preparada ──
  'PreparedFood',     // Restaurant meals, takeout, ready-to-eat

  // ── Salud y Cuidado Personal ──
  'BeautyCosmetics',  // Cosmetics, skincare, haircare
  'PersonalCare',     // Toiletries, hygiene products
  'Medications',      // Medications, first aid
  'Supplements',      // Vitamins, health supplements
  'BabyProducts',     // Diapers, formula, baby food

  // ── Hogar ──
  'CleaningSupplies', // Detergent, cleaning products
  'HomeEssentials',   // Paper goods, trash bags, storage
  'PetSupplies',      // Pet accessories
  'PetFood',          // Pet food
  'Furnishings',      // Furniture, home decor

  // ── Productos Generales ──
  'Apparel',          // Clothing, footwear, accessories
  'Technology',       // Gadgets, cables, batteries, instruments
  'Tools',            // Tools, home repair supplies
  'Garden',           // Plants, garden tools, soil
  'CarAccessories',   // Car supplies, car care
  'SportsOutdoors',   // Sports equipment, outdoor gear
  'ToysGames',        // Toys, games, puzzles
  'BooksMedia',       // Books, magazines, DVDs
  'OfficeStationery', // Office supplies, paper, pens
  'Crafts',           // Art supplies, craft materials

  // ── Servicios y Cargos ──
  'ServiceCharge',    // Service charges, labor, delivery
  'TaxFees',          // Taxes, tips, fees
  'Subscription',     // Monthly/annual subscriptions
  'Insurance',        // Insurance premiums
  'LoanPayment',      // Mortgage, credit card, debt payments
  'TicketsEvents',    // Theater, concerts, movies, sports events
  'HouseholdBills',   // Electricity, water, gas bills
  'CondoFees',        // Condo/common expense fees
  'EducationFees',    // School tuition, course fees

  // ── Vicios ──
  'Alcohol',          // Beer, wine, spirits
  'Tobacco',          // Cigarettes, tobacco products
  'GamesOfChance',    // Lottery tickets, casino chips, betting

  // ── Otros ──
  'OtherItem',        // Anything that doesn't fit above
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

// ============================================================================
// SOURCE TRACKING TYPES
// ============================================================================

/**
 * Source of the category assignment for an item.
 * - 'scan': Category came from Gemini AI scan
 * - 'learned': Category was auto-applied from a learned mapping
 * - 'user': Category was manually set by the user
 */
export type CategorySource = 'scan' | 'learned' | 'user';

/**
 * Source of the merchant name assignment.
 * - 'scan': Merchant name came from Gemini AI scan
 * - 'learned': Merchant name was auto-corrected from a learned mapping
 * - 'user': Merchant name was manually set by the user
 */
export type MerchantSource = 'scan' | 'learned' | 'user';

// ============================================================================
// FORMATTED LISTS FOR PROMPTS
// ============================================================================

export const STORE_CATEGORY_LIST = STORE_CATEGORIES.join(', ');
export const ITEM_CATEGORY_LIST = ITEM_CATEGORIES.join(', ');

// ============================================================================
// CATEGORY COUNTS (for documentation)
// ============================================================================

export const STORE_CATEGORY_COUNT = STORE_CATEGORIES.length;  // 44
export const ITEM_CATEGORY_COUNT = ITEM_CATEGORIES.length;    // 42
