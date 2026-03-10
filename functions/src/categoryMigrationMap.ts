/**
 * Category Migration Map -- Server-Side
 *
 * Story 17-5: Build and Execute Category Batch Migration
 *
 * Server-side copy of legacy->V4 category mappings. Cloud Functions cannot
 * import from src/utils/ (different TypeScript project), so mappings are
 * self-contained here.
 *
 * Sources:
 * - src/utils/categoryNormalizer.ts (LEGACY_*_CATEGORY_MAP)
 * - src/utils/categoryTranslations.ts (Spanish reverse mappings)
 *
 * @see shared/schema/categories.ts for V4 canonical category arrays
 */

import { STORE_CATEGORIES, ITEM_CATEGORIES } from './shared/schema/categories';

// ============================================================================
// Store Category Migration Map (Legacy English + Spanish -> V4)
// ============================================================================

/**
 * Maps legacy and translated store category names to V4 canonical keys.
 * Covers: V1/V2 English, V3 English, Spanish translations.
 */
export const STORE_CATEGORY_MIGRATION_MAP: Record<string, string> = {
    // -- V1/V2 -> V4 --
    'Beauty': 'HealthBeauty',
    'Salon': 'HealthBeauty',
    'Spa': 'HealthBeauty',
    'Pet Store': 'PetShop',
    'Pets': 'PetShop',
    'Parking': 'Transport',
    'Taxi': 'Transport',
    'Ride Share': 'Transport',
    'Public Transit': 'Transport',
    'Bus': 'Transport',
    'Metro': 'Transport',
    'Bookstore': 'BookStore',
    'Books': 'BookStore',
    'Home': 'HomeGoods',
    'Home Decor': 'HomeGoods',
    'Kitchenware': 'HomeGoods',
    'Garden': 'GardenCenter',
    'Plant Nursery': 'GardenCenter',
    'Office': 'OfficeSupplies',
    'Sports': 'SportsStore',
    'Outdoors': 'SportsStore',
    'Toy Store': 'ToyStore',
    'Game Shop': 'ToyStore',
    'Travel': 'TravelAgency',
    'Tour Operator': 'TravelAgency',
    'Hotel': 'Lodging',
    'Hostel': 'Lodging',
    'Bank': 'BankingFinance',
    'Finance': 'BankingFinance',
    'Insurance': 'BankingFinance',
    'Charity': 'CharityDonation',
    'Donation': 'CharityDonation',
    'Nonprofit': 'CharityDonation',

    // -- V3 -> V4 (renamed giros) --
    'Clothing': 'ClothingStore',
    'Electronics': 'ElectronicsStore',
    'Furniture': 'FurnitureStore',
    'Automotive': 'AutoShop',
    'HotelLodging': 'Lodging',
    'Gambling': 'Casino',
    'Services': 'GeneralServices',
    'BooksMedia': 'BookStore',
    'SportsOutdoors': 'SportsStore',
    'ToysGames': 'ToyStore',
    'Subscription': 'SubscriptionService',

    // -- V3 -> V4 (removed giros mapped to closest V4) --
    'StreetVendor': 'OpenMarket',
    'MusicStore': 'Entertainment',
    'Jewelry': 'AccessoriesOptical',
    'Optical': 'AccessoriesOptical',

    // -- Spanish -> V4 (reverse of store category translations) --
    'Supermercado': 'Supermarket',
    'Mayorista': 'Wholesale',
    'Restaurante': 'Restaurant',
    'Almac\u00e9n': 'Almacen',
    'Feria': 'OpenMarket',
    'Kiosko': 'Kiosk',
    'Botiller\u00eda': 'LiquorStore',
    'Panader\u00eda': 'Bakery',
    'Carnicer\u00eda': 'Butcher',
    'Servicios B\u00e1sicos': 'UtilityCompany',
    'Administraci\u00f3n': 'PropertyAdmin',
    'Farmacia': 'Pharmacy',
    'M\u00e9dico': 'Medical',
    'Veterinario': 'Veterinary',
    'Salud y Belleza': 'HealthBeauty',
    'Bazar': 'Bazaar',
    'Tienda de Ropa': 'ClothingStore',
    'Tienda de Electr\u00f3nica': 'ElectronicsStore',
    'Art\u00edculos del Hogar': 'HomeGoods',
    'Muebler\u00eda': 'FurnitureStore',
    'Ferreter\u00eda': 'Hardware',
    'Jardiner\u00eda': 'GardenCenter',
    'Tienda de Mascotas': 'PetShop',
    'Librer\u00eda': 'BookStore',
    'Art\u00edculos de Oficina': 'OfficeSupplies',
    'Tienda de Deportes': 'SportsStore',
    'Jugueter\u00eda': 'ToyStore',
    'Accesorios y \u00d3ptica': 'AccessoriesOptical',
    'Tienda Online': 'OnlineStore',
    'Taller Automotriz': 'AutoShop',
    'Bencinera': 'GasStation',
    'Transporte': 'Transport',
    'Servicios Generales': 'GeneralServices',
    'Banca y Finanzas': 'BankingFinance',
    'Agencia de Viajes': 'TravelAgency',
    'Servicio de Suscripci\u00f3n': 'SubscriptionService',
    'Gobierno': 'Government',
    'Educaci\u00f3n': 'Education',
    'Hospedaje': 'Lodging',
    'Entretenimiento': 'Entertainment',
    'Casino / Apuestas': 'Casino',
    'Caridad y Donaci\u00f3n': 'CharityDonation',
    'Otro': 'Other',

    // -- Legacy Spanish (maps through to V4) --
    'Estacionamiento': 'Transport',
    'Vendedor Ambulante': 'OpenMarket',
    'Joyer\u00eda': 'AccessoriesOptical',
    '\u00d3ptica': 'AccessoriesOptical',
    'Tienda de M\u00fasica': 'Entertainment',
    'Ropa': 'ClothingStore',
    'Electr\u00f3nica': 'ElectronicsStore',
    'Muebles': 'FurnitureStore',
    'Automotriz': 'AutoShop',
    'Hotel y Alojamiento': 'Lodging',
    'Apuestas': 'Casino',
    'Servicios': 'GeneralServices',
    'Libros y Medios': 'BookStore',
    'Deportes y Exterior': 'SportsStore',
    'Juguetes y Juegos': 'ToyStore',
    'Suscripci\u00f3n': 'SubscriptionService',
};

// ============================================================================
// Item Category Migration Map (Legacy English + Spanish -> V4)
// ============================================================================

/**
 * Maps legacy and translated item category names to V4 canonical keys.
 * Covers: V1/V2 English, V3 English, Spanish translations.
 */
export const ITEM_CATEGORY_MIGRATION_MAP: Record<string, string> = {
    // -- V1/V2 -> V4 --
    'Fresh Food': 'Produce',
    'Drinks': 'Beverages',
    'Drinks & Beverages': 'Beverages',
    'Pets': 'PetSupplies',
    'Tech': 'Technology',
    'Office': 'OfficeStationery',
    'Stationery': 'OfficeStationery',
    'Sports': 'SportsOutdoors',
    'Outdoors': 'SportsOutdoors',
    'Books': 'BooksMedia',
    'Media': 'BooksMedia',
    'Toys': 'ToysGames',
    'Games': 'ToysGames',
    'Hobbies': 'Crafts',
    'Meat': 'MeatSeafood',
    'Seafood': 'MeatSeafood',
    'Dairy': 'DairyEggs',
    'Eggs': 'DairyEggs',
    'Health': 'BeautyCosmetics',
    'Beauty': 'BeautyCosmetics',
    'Tickets': 'TicketsEvents',
    'Events': 'TicketsEvents',
    'Tax': 'TaxFees',
    'Fees': 'TaxFees',

    // -- V3 -> V4 (space-separated keys -> PascalCase) --
    'Bakery': 'BreadPastry',
    'Meat & Seafood': 'MeatSeafood',
    'Dairy & Eggs': 'DairyEggs',
    'Frozen Foods': 'FrozenFoods',
    'Health & Beauty': 'BeautyCosmetics',
    'Personal Care': 'PersonalCare',
    'Pharmacy': 'Medications',
    'Baby Products': 'BabyProducts',
    'Cleaning Supplies': 'CleaningSupplies',
    'Household': 'HomeEssentials',
    'Pet Supplies': 'PetSupplies',
    'Clothing': 'Apparel',
    'Electronics': 'Technology',
    'Hardware': 'Tools',
    'Automotive': 'CarAccessories',
    'Sports & Outdoors': 'SportsOutdoors',
    'Toys & Games': 'ToysGames',
    'Books & Media': 'BooksMedia',
    'Office & Stationery': 'OfficeStationery',
    'Crafts & Hobbies': 'Crafts',
    'Furniture': 'Furnishings',
    'Musical Instruments': 'Technology',
    'Prepared Food': 'PreparedFood',
    'Service': 'ServiceCharge',
    'Tax & Fees': 'TaxFees',
    'Subscription': 'Subscription',
    'Insurance': 'Insurance',
    'Loan Payment': 'LoanPayment',
    'Tickets & Events': 'TicketsEvents',
    'Tobacco': 'Tobacco',
    'Gambling': 'GamesOfChance',
    'Education': 'EducationFees',
    'Other': 'OtherItem',
    'Apparel': 'Apparel',

    // -- Spanish -> V4 (reverse of item category translations) --
    'Frutas y Verduras': 'Produce',
    'Carnes y Mariscos': 'MeatSeafood',
    'Pan y Reposter\u00eda': 'BreadPastry',
    'L\u00e1cteos y Huevos': 'DairyEggs',
    'Despensa': 'Pantry',
    'Congelados': 'FrozenFoods',
    'Snacks y Golosinas': 'Snacks',
    'Bebidas': 'Beverages',
    'Comida Preparada': 'PreparedFood',
    'Belleza y Cosm\u00e9tica': 'BeautyCosmetics',
    'Cuidado Personal': 'PersonalCare',
    'Medicamentos': 'Medications',
    'Suplementos': 'Supplements',
    'Productos para Beb\u00e9': 'BabyProducts',
    'Productos de Limpieza': 'CleaningSupplies',
    'Art\u00edculos del Hogar': 'HomeEssentials',
    'Productos para Mascotas': 'PetSupplies',
    'Comida para Mascotas': 'PetFood',
    'Mobiliario y Hogar': 'Furnishings',
    'Vestuario': 'Apparel',
    'Tecnolog\u00eda': 'Technology',
    'Herramientas': 'Tools',
    'Jard\u00edn': 'Garden',
    'Accesorios de Auto': 'CarAccessories',
    'Deportes y Exterior': 'SportsOutdoors',
    'Juguetes y Juegos': 'ToysGames',
    'Libros y Medios': 'BooksMedia',
    'Oficina y Papeler\u00eda': 'OfficeStationery',
    'Manualidades': 'Crafts',
    'Cargo por Servicio': 'ServiceCharge',
    'Impuestos y Cargos': 'TaxFees',
    'Suscripci\u00f3n': 'Subscription',
    'Seguros': 'Insurance',
    'Pago de Pr\u00e9stamo': 'LoanPayment',
    'Entradas y Eventos': 'TicketsEvents',
    'Cuentas del Hogar': 'HouseholdBills',
    'Gastos Comunes': 'CondoFees',
    'Gastos de Educaci\u00f3n': 'EducationFees',
    'Tabaco': 'Tobacco',
    'Juegos de Azar': 'GamesOfChance',
    'Otro Producto': 'OtherItem',

    // -- Legacy Spanish variations --
    'Alimentos Frescos': 'Produce',
    'Condimentos': 'Pantry',
    'Auto': 'CarAccessories',
    'Hogar': 'HomeEssentials',
    'Manualidades y Pasatiempos': 'Crafts',
    'Instrumentos Musicales': 'Technology',
    'Servicio': 'ServiceCharge',
    'Panader\u00eda': 'BreadPastry',
    'Electr\u00f3nica': 'Technology',
    'Ferreter\u00eda': 'Tools',
    'Automotriz': 'CarAccessories',
    'Muebles': 'Furnishings',
    'Ropa': 'Apparel',
    'Farmacia': 'Medications',
    'Salud y Belleza': 'BeautyCosmetics',
};

// ============================================================================
// V4 Canonical Sets (for idempotency checks)
// ============================================================================

const STORE_CATEGORY_SET = new Set<string>(STORE_CATEGORIES);
const ITEM_CATEGORY_SET = new Set<string>(ITEM_CATEGORIES);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Migrate a store category value to V4 canonical form.
 * Returns the mapped value if legacy/translated, or the original if already V4.
 */
export function migrateStoreCategory(category: string): string {
    if (!category) return category;
    return STORE_CATEGORY_MIGRATION_MAP[category] || category;
}

/**
 * Migrate an item category value to V4 canonical form.
 * Returns the mapped value if legacy/translated, or the original if already V4.
 */
export function migrateItemCategory(category: string): string {
    if (!category) return category;
    return ITEM_CATEGORY_MIGRATION_MAP[category] || category;
}

/**
 * Check if a store category is already a valid V4 canonical value.
 */
export function isCanonicalStoreCategory(category: string): boolean {
    return STORE_CATEGORY_SET.has(category);
}

/**
 * Check if an item category is already a valid V4 canonical value.
 */
export function isCanonicalItemCategory(category: string): boolean {
    return ITEM_CATEGORY_SET.has(category);
}
