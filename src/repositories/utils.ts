/**
 * Repository Layer - Shared Utilities
 *
 * Story TD-15b-27: Extracted from useTransactions/useRecentScans hooks.
 * Sanitization functions for raw Firestore data before consumption.
 */

import type { Transaction } from '@/types/transaction';
import { getSafeDate, parseStrictNumber } from '@/utils/validation';

/**
 * Sanitizes raw Firestore transaction data.
 * Ensures dates are valid and numbers are properly parsed.
 */
export function sanitizeTransactions(docs: Transaction[]): Transaction[] {
    if (!Array.isArray(docs)) return [];
    return docs.map(d => ({
        ...d,
        date: getSafeDate(d.date),
        total: parseStrictNumber(d.total),
        items: Array.isArray(d.items)
            ? d.items.map(i => ({
                ...i,
                price: parseStrictNumber(i.price)
            }))
            : []
    }));
}
