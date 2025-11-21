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
    createdAt?: any;
    updatedAt?: any;
}
