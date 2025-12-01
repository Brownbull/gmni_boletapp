export type StoreCategory =
    | 'Supermarket' | 'Restaurant' | 'Bakery' | 'Butcher' | 'Bazaar'
    | 'Veterinary' | 'PetShop' | 'Medical' | 'Pharmacy' | 'Technology'
    | 'StreetVendor' | 'Transport' | 'Services' | 'Other';

export interface TransactionItem {
    name: string;
    qty?: number;
    price: number;
    category?: string;
    subcategory?: string;
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
