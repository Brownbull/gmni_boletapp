/**
 * Category Translation Utilities
 *
 * Story 9.12: UI Content Translation
 * Provides translation mappings for categories, item groups, and subcategories.
 * Data is stored in English (canonical form) and translated on display only.
 *
 * @see docs/sprint-artifacts/epic9/story-9.12-ui-content-translation.md
 */

import type { Language } from './translations';

// ============================================================================
// Store Category Translations (AC #1)
// ============================================================================

/**
 * Translations for store categories (transaction.category).
 * Keys match StoreCategory type values.
 */
const STORE_CATEGORY_TRANSLATIONS: Record<string, Record<Language, string>> = {
    // Food & Dining
    'Supermarket': { en: 'Supermarket', es: 'Supermercado' },
    'Restaurant': { en: 'Restaurant', es: 'Restaurante' },
    'Bakery': { en: 'Bakery', es: 'Panaderia' },
    'Butcher': { en: 'Butcher', es: 'Carniceria' },
    'StreetVendor': { en: 'Street Vendor', es: 'Vendedor Ambulante' },
    // Health & Wellness
    'Pharmacy': { en: 'Pharmacy', es: 'Farmacia' },
    'Medical': { en: 'Medical', es: 'Medico' },
    'Veterinary': { en: 'Veterinary', es: 'Veterinario' },
    'HealthBeauty': { en: 'Health & Beauty', es: 'Salud y Belleza' },
    // Retail - General
    'Bazaar': { en: 'Bazaar', es: 'Bazar' },
    'Clothing': { en: 'Clothing', es: 'Ropa' },
    'Electronics': { en: 'Electronics', es: 'Electronica' },
    'HomeGoods': { en: 'Home Goods', es: 'Articulos del Hogar' },
    'Furniture': { en: 'Furniture', es: 'Muebles' },
    'Hardware': { en: 'Hardware', es: 'Ferreteria' },
    'GardenCenter': { en: 'Garden Center', es: 'Jardineria' },
    // Retail - Specialty
    'PetShop': { en: 'Pet Shop', es: 'Tienda de Mascotas' },
    'BooksMedia': { en: 'Books & Media', es: 'Libros y Medios' },
    'OfficeSupplies': { en: 'Office Supplies', es: 'Articulos de Oficina' },
    'SportsOutdoors': { en: 'Sports & Outdoors', es: 'Deportes y Exterior' },
    'ToysGames': { en: 'Toys & Games', es: 'Juguetes y Juegos' },
    'Jewelry': { en: 'Jewelry', es: 'Joyeria' },
    'Optical': { en: 'Optical', es: 'Optica' },
    // Automotive & Transport
    'Automotive': { en: 'Automotive', es: 'Automotriz' },
    'GasStation': { en: 'Gas Station', es: 'Bencinera' },
    'Transport': { en: 'Transport', es: 'Transporte' },
    // Services & Finance
    'Services': { en: 'Services', es: 'Servicios' },
    'BankingFinance': { en: 'Banking & Finance', es: 'Banca y Finanzas' },
    'Education': { en: 'Education', es: 'Educacion' },
    'TravelAgency': { en: 'Travel Agency', es: 'Agencia de Viajes' },
    // Hospitality & Entertainment
    'HotelLodging': { en: 'Hotel & Lodging', es: 'Hotel y Alojamiento' },
    'Entertainment': { en: 'Entertainment', es: 'Entretenimiento' },
    // Other
    'CharityDonation': { en: 'Charity & Donation', es: 'Caridad y Donacion' },
    'Other': { en: 'Other', es: 'Otro' },
    // Legacy values (for backward compatibility)
    'Parking': { en: 'Parking', es: 'Estacionamiento' },
    'Gas Station': { en: 'Gas Station', es: 'Bencinera' },
};

// ============================================================================
// Item Group/Category Translations (AC #2)
// ============================================================================

/**
 * Translations for item categories/groups (item.category).
 * Keys match ItemCategory type values.
 */
const ITEM_GROUP_TRANSLATIONS: Record<string, Record<Language, string>> = {
    // Food - Fresh
    'Produce': { en: 'Produce', es: 'Frutas y Verduras' },
    'Meat & Seafood': { en: 'Meat & Seafood', es: 'Carnes y Mariscos' },
    'Bakery': { en: 'Bakery', es: 'Panaderia' },
    'Dairy & Eggs': { en: 'Dairy & Eggs', es: 'Lacteos y Huevos' },
    // Food - Packaged
    'Pantry': { en: 'Pantry', es: 'Despensa' },
    'Frozen Foods': { en: 'Frozen Foods', es: 'Congelados' },
    'Snacks': { en: 'Snacks', es: 'Snacks' },
    'Beverages': { en: 'Beverages', es: 'Bebidas' },
    'Alcohol': { en: 'Alcohol', es: 'Alcohol' },
    // Health & Personal
    'Health & Beauty': { en: 'Health & Beauty', es: 'Salud y Belleza' },
    'Personal Care': { en: 'Personal Care', es: 'Cuidado Personal' },
    'Pharmacy': { en: 'Pharmacy', es: 'Farmacia' },
    'Supplements': { en: 'Supplements', es: 'Suplementos' },
    'Baby Products': { en: 'Baby Products', es: 'Productos para Bebe' },
    // Household
    'Cleaning Supplies': { en: 'Cleaning Supplies', es: 'Productos de Limpieza' },
    'Household': { en: 'Household', es: 'Hogar' },
    'Pet Supplies': { en: 'Pet Supplies', es: 'Productos para Mascotas' },
    // Non-Food Retail
    'Clothing': { en: 'Clothing', es: 'Ropa' },
    'Electronics': { en: 'Electronics', es: 'Electronica' },
    'Hardware': { en: 'Hardware', es: 'Ferreteria' },
    'Garden': { en: 'Garden', es: 'Jardin' },
    'Automotive': { en: 'Automotive', es: 'Automotriz' },
    'Sports & Outdoors': { en: 'Sports & Outdoors', es: 'Deportes y Exterior' },
    'Toys & Games': { en: 'Toys & Games', es: 'Juguetes y Juegos' },
    'Books & Media': { en: 'Books & Media', es: 'Libros y Medios' },
    'Office & Stationery': { en: 'Office & Stationery', es: 'Oficina y Papeleria' },
    'Crafts & Hobbies': { en: 'Crafts & Hobbies', es: 'Manualidades y Pasatiempos' },
    'Furniture': { en: 'Furniture', es: 'Muebles' },
    // Services & Fees
    'Service': { en: 'Service', es: 'Servicio' },
    'Tax & Fees': { en: 'Tax & Fees', es: 'Impuestos y Cargos' },
    'Tobacco': { en: 'Tobacco', es: 'Tabaco' },
    // Catch-all
    'Other': { en: 'Other', es: 'Otro' },
    // Legacy variations
    'Condiments': { en: 'Condiments', es: 'Condimentos' },
};

// ============================================================================
// Common Subcategory Translations (AC #3)
// ============================================================================

/**
 * Translations for common subcategories (item.subcategory).
 * Best-effort translation - unknown subcategories fall back to original.
 */
const SUBCATEGORY_TRANSLATIONS: Record<string, Record<Language, string>> = {
    // Produce subcategories
    'Fruits': { en: 'Fruits', es: 'Frutas' },
    'Vegetables': { en: 'Vegetables', es: 'Verduras' },
    'Fresh Herbs': { en: 'Fresh Herbs', es: 'Hierbas Frescas' },
    'Organic': { en: 'Organic', es: 'Organico' },
    // Dairy subcategories
    'Milk': { en: 'Milk', es: 'Leche' },
    'Cheese': { en: 'Cheese', es: 'Queso' },
    'Yogurt': { en: 'Yogurt', es: 'Yogurt' },
    'Butter': { en: 'Butter', es: 'Mantequilla' },
    'Eggs': { en: 'Eggs', es: 'Huevos' },
    // Meat subcategories
    'Beef': { en: 'Beef', es: 'Carne de Res' },
    'Chicken': { en: 'Chicken', es: 'Pollo' },
    'Pork': { en: 'Pork', es: 'Cerdo' },
    'Fish': { en: 'Fish', es: 'Pescado' },
    'Seafood': { en: 'Seafood', es: 'Mariscos' },
    'Deli': { en: 'Deli', es: 'Fiambreria' },
    // Beverage subcategories
    'Water': { en: 'Water', es: 'Agua' },
    'Soft Drinks': { en: 'Soft Drinks', es: 'Bebidas Gaseosas' },
    'Juice': { en: 'Juice', es: 'Jugo' },
    'Coffee': { en: 'Coffee', es: 'Cafe' },
    'Tea': { en: 'Tea', es: 'Te' },
    'Beer': { en: 'Beer', es: 'Cerveza' },
    'Wine': { en: 'Wine', es: 'Vino' },
    // Bakery subcategories
    'Bread': { en: 'Bread', es: 'Pan' },
    'Pastries': { en: 'Pastries', es: 'Pasteleria' },
    'Cakes': { en: 'Cakes', es: 'Tortas' },
    // Personal Care subcategories
    'Shampoo': { en: 'Shampoo', es: 'Shampoo' },
    'Soap': { en: 'Soap', es: 'Jabon' },
    'Toothpaste': { en: 'Toothpaste', es: 'Pasta de Dientes' },
    'Deodorant': { en: 'Deodorant', es: 'Desodorante' },
    // Cleaning subcategories
    'Laundry': { en: 'Laundry', es: 'Lavanderia' },
    'Dish Soap': { en: 'Dish Soap', es: 'Lavalozas' },
    'Paper Products': { en: 'Paper Products', es: 'Productos de Papel' },
    // General
    'Sale': { en: 'Sale', es: 'Oferta' },
    'Discount': { en: 'Discount', es: 'Descuento' },
};

// ============================================================================
// Translation Function (AC #8 - Fallback behavior)
// ============================================================================

/**
 * Translates a category, group, or subcategory key to the user's language.
 *
 * Priority:
 * 1. Store categories (transaction.category)
 * 2. Item groups (item.category)
 * 3. Subcategories (item.subcategory)
 * 4. Fallback to original key if no translation exists (AC #8)
 *
 * @param key - The English category/group/subcategory key
 * @param lang - The target language ('en' | 'es')
 * @returns The translated string or the original key if no translation exists
 *
 * @example
 * translateCategory('Supermarket', 'es') // 'Supermercado'
 * translateCategory('Dairy & Eggs', 'es') // 'Lacteos y Huevos'
 * translateCategory('Unknown', 'es') // 'Unknown' (fallback)
 */
export function translateCategory(key: string, lang: Language): string {
    // Handle empty/null keys
    if (!key) return key;

    // Try store category first
    if (STORE_CATEGORY_TRANSLATIONS[key]) {
        return STORE_CATEGORY_TRANSLATIONS[key][lang] || key;
    }

    // Try item group
    if (ITEM_GROUP_TRANSLATIONS[key]) {
        return ITEM_GROUP_TRANSLATIONS[key][lang] || key;
    }

    // Try subcategory
    if (SUBCATEGORY_TRANSLATIONS[key]) {
        return SUBCATEGORY_TRANSLATIONS[key][lang] || key;
    }

    // Fallback to original key (AC #8)
    return key;
}

/**
 * Translates a store category specifically.
 * Use when you know the value is a StoreCategory.
 *
 * @param category - The StoreCategory value
 * @param lang - The target language
 * @returns The translated category name
 */
export function translateStoreCategory(category: string, lang: Language): string {
    if (!category) return category;
    return STORE_CATEGORY_TRANSLATIONS[category]?.[lang] || category;
}

/**
 * Translates an item group/category specifically.
 * Use when you know the value is an ItemCategory.
 *
 * @param group - The ItemCategory value
 * @param lang - The target language
 * @returns The translated group name
 */
export function translateItemGroup(group: string, lang: Language): string {
    if (!group) return group;
    return ITEM_GROUP_TRANSLATIONS[group]?.[lang] || group;
}

/**
 * Translates a subcategory.
 * Best-effort - returns original if no translation exists.
 *
 * @param subcategory - The subcategory value
 * @param lang - The target language
 * @returns The translated subcategory or original
 */
export function translateSubcategory(subcategory: string, lang: Language): string {
    if (!subcategory) return subcategory;
    return SUBCATEGORY_TRANSLATIONS[subcategory]?.[lang] || subcategory;
}

/**
 * Gets all store category options with translations for dropdowns (AC #6).
 * Returns array of { value, label } for use in select elements.
 * Value is English (canonical), label is translated.
 *
 * @param categories - Array of StoreCategory values
 * @param lang - The target language
 * @returns Array of { value: string, label: string }
 */
export function getTranslatedStoreCategoryOptions(
    categories: readonly string[],
    lang: Language
): Array<{ value: string; label: string }> {
    return categories.map(cat => ({
        value: cat, // Store in English (AC #7)
        label: translateStoreCategory(cat, lang),
    }));
}

// Export translation maps for testing
export {
    STORE_CATEGORY_TRANSLATIONS,
    ITEM_GROUP_TRANSLATIONS,
    SUBCATEGORY_TRANSLATIONS,
};
