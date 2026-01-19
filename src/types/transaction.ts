/**
 * Transaction Types
 *
 * Category types are imported from the unified schema (single source of truth).
 * See: shared/schema/categories.ts
 *
 * DO NOT define StoreCategory or ItemCategory here - import from unified schema.
 */

// Re-export types from unified schema for convenience
export type { StoreCategory, ItemCategory } from '../../shared/schema/categories';

// Import for use in this file
import type { StoreCategory, ItemCategory } from '../../shared/schema/categories';

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
     * Uses ItemCategory type from unified schema.
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

    // v2.6.0 prompt fields (all optional for backward compatibility)
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

    // Source tracking for transparency
    /** Source of the merchant name (scan, learned, or user) */
    merchantSource?: MerchantSource;

    // Story 14c.1: Shared Groups (consolidated from Story 14.15)
    /** Array of shared group IDs this transaction belongs to (max 5) */
    sharedGroupIds?: string[];
    /** Soft delete timestamp for shared group sync (null = not deleted) */
    deletedAt?: any; // Firestore Timestamp

    // Story 14c.6: Transaction Ownership (client-side only)
    /**
     * Owner's user ID - set client-side when merging transactions from multiple members.
     * Not stored in Firestore (derived from transaction's document path).
     * Used to determine if current user can edit (own) or only view (other's).
     */
    _ownerId?: string;
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

/**
 * Story 14c.6: Check if a transaction belongs to the current user.
 *
 * A transaction is considered "owned" by the user if:
 * - No _ownerId is set (personal mode - all transactions are user's own)
 * - _ownerId matches the current user's ID
 *
 * @param transaction Transaction to check
 * @param currentUserId Current user's ID
 * @returns true if the user owns this transaction
 */
export function isOwnTransaction(transaction: Transaction, currentUserId: string): boolean {
    // If _ownerId is not set, the transaction is the user's own (personal mode)
    if (!transaction._ownerId) return true;
    // In shared group mode, compare owner ID with current user
    return transaction._ownerId === currentUserId;
}
