/**
 * Transaction Entity Types
 *
 * Re-exports from the canonical source at src/types/transaction.ts
 * to provide a clean public API through the entity module.
 *
 * Story 14e-19: Transaction Entity Foundation
 * Per Feature-Sliced Design (FSD), entities re-export from shared types.
 */

// Re-export all types and type guards from the canonical source
// Note: StoreCategory and ItemCategory are already re-exported by src/types/transaction.ts
export {
    // Types
    type CategorySource,
    type MerchantSource,
    type Transaction,
    type TransactionItem,
    type StoreCategory,
    type ItemCategory,
    // Type guards
    hasTransactionImages,
    hasTransactionThumbnail,
    isOwnTransaction,
} from '../../types/transaction';
