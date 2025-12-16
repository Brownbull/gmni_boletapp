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
 * Item category type for line item classification.
 * Story 9.2: Proper typing for TransactionItem category field.
 * IMPORTANT: Keep in sync with prompt-testing/prompts/output-schema.ts ITEM_CATEGORIES
 */
export type ItemCategory =
    // Food - Fresh
    | 'Produce' | 'Meat & Seafood' | 'Bakery' | 'Dairy & Eggs'
    // Food - Packaged
    | 'Pantry' | 'Frozen Foods' | 'Snacks' | 'Beverages' | 'Alcohol'
    // Health & Personal
    | 'Health & Beauty' | 'Personal Care' | 'Pharmacy' | 'Supplements' | 'Baby Products'
    // Household
    | 'Cleaning Supplies' | 'Household' | 'Pet Supplies'
    // Non-Food Retail
    | 'Clothing' | 'Electronics' | 'Hardware' | 'Garden' | 'Automotive'
    | 'Sports & Outdoors' | 'Toys & Games' | 'Books & Media' | 'Office & Stationery'
    | 'Crafts & Hobbies' | 'Furniture'
    // Services & Fees
    | 'Service' | 'Tax & Fees' | 'Tobacco'
    // Catch-all
    | 'Other';

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

export interface TransactionItem {
    name: string;
    qty?: number;
    price: number;
    /**
     * Item category from AI extraction or user edit.
     * Story 9.2: Uses ItemCategory type for proper typing.
     * Also accepts string for backward compatibility with existing data.
     */
    category?: ItemCategory | string;
    /** Optional subcategory for more specific classification (free-form text) */
    subcategory?: string;
    /** Source of the category assignment (scan, learned, or user) */
    categorySource?: CategorySource;
    /** Source of the subcategory assignment (scan, learned, or user) */
    subcategorySource?: CategorySource;
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

    // NEW: v2.6.0 prompt fields (all optional for backward compatibility)
    /** Purchase time in HH:mm format (e.g., "15:01") */
    time?: string;
    /** Country name from receipt (e.g., "United Kingdom") */
    country?: string;
    /** City name from receipt (e.g., "London") */
    city?: string;
    /** ISO 4217 currency code (e.g., "GBP", "CLP") */
    currency?: string;
    /** Document type: "receipt" | "invoice" | "ticket" */
    receiptType?: string;
    /** Version of prompt used for AI extraction (e.g., "2.6.0") */
    promptVersion?: string;

    // NEW: Source tracking for transparency
    /** Source of the merchant name (scan, learned, or user) */
    merchantSource?: MerchantSource;
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
