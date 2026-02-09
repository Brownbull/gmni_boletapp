/**
 * Types Barrel Export
 *
 * Central export point for TypeScript types used in the application.
 * Import types from this file for convenience:
 *
 * @example
 * ```typescript
 * import type { Transaction } from '@/types';
 * ```
 */

// ============================================================================
// Transaction types
// ============================================================================
export type {
    Transaction,
    TransactionItem,
    TransactionPeriods,
    CategorySource,
    MerchantSource,
} from './transaction';

export {
    hasTransactionImages,
    hasTransactionThumbnail,
} from './transaction';
