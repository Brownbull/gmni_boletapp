/**
 * useTransactions Hook
 *
 * Story 14.29: React Query Migration
 * Epic 14: Core Implementation
 *
 * Real-time subscription to user's transactions with React Query caching.
 *
 * Migration from direct onSnapshot to React Query benefits:
 * - Instant data on navigation (from cache)
 * - No loading spinner when returning to a view
 * - Automatic background refresh
 * - Shared cache across components
 *
 * @example
 * ```tsx
 * const transactions = useTransactions(user, services);
 * ```
 */

import { useMemo } from 'react';
import { User } from 'firebase/auth';
import { Services } from './useAuth';
import { useFirestoreSubscription } from './useFirestoreSubscription';
import { QUERY_KEYS } from '../lib/queryKeys';
import { subscribeToTransactions } from '../services/firestore';
import { Transaction } from '../types/transaction';
import { getSafeDate, parseStrictNumber } from '../utils/validation';

/**
 * Sanitizes raw Firestore transaction data.
 * Ensures dates are valid and numbers are properly parsed.
 */
function sanitizeTransactions(docs: Transaction[]): Transaction[] {
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

/**
 * Sorts transactions by date descending (newest first).
 */
function sortByDateDesc(transactions: Transaction[]): Transaction[] {
    return [...transactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

/**
 * Hook for subscribing to user's transactions with React Query caching.
 *
 * @param user - Authenticated Firebase user
 * @param services - Firebase services (db, appId)
 * @returns Array of transactions (empty if not authenticated)
 */
export function useTransactions(user: User | null, services: Services | null): Transaction[] {
    const enabled = !!user && !!services;

    // Create the query key (stable reference when deps don't change)
    const queryKey = useMemo(
        () => enabled ? QUERY_KEYS.transactions(user!.uid, services!.appId) : ['transactions', '', ''],
        [enabled, user?.uid, services?.appId]
    );

    // Subscribe to transactions with React Query caching
    const { data } = useFirestoreSubscription<Transaction[]>(
        queryKey,
        (callback) => subscribeToTransactions(
            services!.db,
            user!.uid,
            services!.appId,
            (docs) => {
                // Sanitize and sort before passing to cache
                const sanitized = sanitizeTransactions(docs);
                const sorted = sortByDateDesc(sanitized);
                callback(sorted);
            }
        ),
        { enabled }
    );

    // Return empty array if no data (maintains backward compatibility)
    return data ?? [];
}
