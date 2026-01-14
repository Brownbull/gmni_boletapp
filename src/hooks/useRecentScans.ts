/**
 * useRecentScans Hook
 *
 * v9.7.0 Bugfix: Separate query for "Últimos Escaneados" carousel.
 *
 * Real-time subscription to user's most recently SCANNED transactions
 * (ordered by createdAt, not transaction date).
 *
 * Problem solved:
 * The main useTransactions hook orders by transaction date (date field),
 * which excludes recently scanned receipts with old transaction dates
 * (e.g., scanning a May 2025 receipt in January 2026).
 *
 * This hook orders by createdAt (scan timestamp) to ensure newly scanned
 * receipts appear immediately in the "Últimos Escaneados" section.
 *
 * @example
 * ```tsx
 * const recentScans = useRecentScans(user, services);
 * ```
 */

import { useMemo } from 'react';
import { User } from 'firebase/auth';
import { Services } from './useAuth';
import { useFirestoreSubscription } from './useFirestoreSubscription';
import { QUERY_KEYS } from '../lib/queryKeys';
import { subscribeToRecentScans } from '../services/firestore';
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
 * Hook for subscribing to user's most recently scanned transactions.
 *
 * @param user - Authenticated Firebase user
 * @param services - Firebase services (db, appId)
 * @returns Array of recent scans (empty if not authenticated)
 */
export function useRecentScans(user: User | null, services: Services | null): Transaction[] {
    const enabled = !!user && !!services;

    // Create the query key (stable reference when deps don't change)
    const queryKey = useMemo(
        () => enabled ? QUERY_KEYS.recentScans(user!.uid, services!.appId) : ['transactions', 'recentScans', '', ''],
        [enabled, user?.uid, services?.appId]
    );

    // Subscribe to recent scans with React Query caching
    const { data } = useFirestoreSubscription<Transaction[]>(
        queryKey,
        (callback) => subscribeToRecentScans(
            services!.db,
            user!.uid,
            services!.appId,
            (docs) => {
                // Sanitize before passing to cache
                // Note: Already ordered by createdAt desc from Firestore query
                const sanitized = sanitizeTransactions(docs);
                callback(sanitized);
            }
        ),
        { enabled }
    );

    // Return empty array if no data (maintains backward compatibility)
    return data ?? [];
}
