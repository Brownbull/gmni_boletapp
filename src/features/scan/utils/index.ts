/**
 * Story 14e-40: Scan Feature Utilities
 *
 * Utility functions extracted from App.tsx for reuse and testability.
 *
 * @module scan/utils
 */

export {
    hasActiveTransactionConflict,
    type ConflictResult,
    type ConflictingTransaction,
    type ConflictReason,
} from './conflictDetection';
