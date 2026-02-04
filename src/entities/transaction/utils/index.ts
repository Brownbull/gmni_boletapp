/**
 * Transaction Entity Utilities
 *
 * Re-exports transaction-related utility functions to provide a clean public API.
 *
 * Story 14e-19: Transaction Entity Foundation
 *
 * Public API utilities:
 * - normalizeTransaction: Fill missing fields with defaults
 * - normalizeTransactions: Batch normalization
 * - DEFAULT_TIME: Sentinel value for missing time
 *
 * Internal utilities (kept in src/utils/, not exported here):
 * - sanitizeTransactions (internal to useTransactions hook)
 * - sortByDateDescending (internal to useTransactions hook)
 */

export {
    // Functions - Display normalization (time, city, country from user settings)
    normalizeTransaction,
    normalizeTransactions,
    // Constants
    DEFAULT_TIME,
    // Types
    type UserDefaults,
} from '../../../utils/transactionNormalizer';

// Story 14d-v2-1-2b: Epic 14d-v2 field defaults (sharedGroupId, version, periods, etc.)
export {
    ensureTransactionDefaults,
    ensureTransactionsDefaults,
    isDeleted,
    isSharedTransaction,
} from '../../../utils/transactionUtils';

// Story 14e-41: Transaction reconciliation utility
export { reconcileItemsTotal, type ReconcileResult } from './reconciliation';
