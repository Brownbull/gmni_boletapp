/**
 * Store category type for transactions.
 * IMPORTANT: Keep in sync with prompt-testing/prompts/output-schema.ts STORE_CATEGORIES
 */
export type StoreCategory =
    // Food & Dining
    | 'Supermarket' | 'Restaurant' | 'Bakery' | 'Butcher' | 'StreetVendor'
    // Health & Wellness
    | 'Pharmacy' | 'Medical' | 'Veterinary' | 'HealthBeauty'
    // Retail - General
    | 'Bazaar' | 'Clothing' | 'Electronics' | 'HomeGoods' | 'Furniture' | 'Hardware' | 'GardenCenter'
    // Retail - Specialty
    | 'PetShop' | 'BooksMedia' | 'OfficeSupplies' | 'SportsOutdoors' | 'ToysGames' | 'Jewelry' | 'Optical'
    // Automotive & Transport
    | 'Automotive' | 'GasStation' | 'Transport'
    // Services & Finance
    | 'Services' | 'BankingFinance' | 'Education' | 'TravelAgency'
    // Hospitality & Entertainment
    | 'HotelLodging' | 'Entertainment'
    // Other
    | 'CharityDonation' | 'Other';

/**
 * Source of the category assignment for an item.
 * - 'scan': Category came from Gemini AI scan
 * - 'learned': Category was auto-applied from a learned mapping
 * - 'user': Category was manually set by the user
 */
export type CategorySource = 'scan' | 'learned' | 'user';

export interface TransactionItem {
    name: string;
    qty?: number;
    price: number;
    category?: string;
    subcategory?: string;
    /** Source of the category assignment (scan, learned, or user) */
    categorySource?: CategorySource;
}

export interface Transaction {
    id?: string;
    date: string;
    merchant: string;
    alias?: string;
    category: StoreCategory;
    total: number;
    items: TransactionItem[];
    imageUrls?: string[];
    thumbnailUrl?: string;
    createdAt?: any;
    updatedAt?: any;
}

/**
 * Type guard to check if a transaction has images
 */
export function hasTransactionImages(transaction: Transaction): boolean {
    return Boolean(transaction.imageUrls && transaction.imageUrls.length > 0)
}

/**
 * Type guard to check if a transaction has a thumbnail
 */
export function hasTransactionThumbnail(transaction: Transaction): boolean {
    return Boolean(transaction.thumbnailUrl)
}
