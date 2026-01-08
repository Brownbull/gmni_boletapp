/**
 * React Query Client Configuration
 *
 * Story 14.29: React Query Migration
 * Epic 14: Core Implementation
 *
 * Configures the QueryClient with optimal defaults for Firestore.
 * Key features:
 * - 5 minute stale time (data considered fresh)
 * - 30 minute cache time (data kept after last use)
 * - Single retry on failure
 * - Refetch on window focus (catch updates while away)
 * - No refetch on mount if data is fresh (reduces reads)
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data considered fresh for 5 minutes
            // During this time, cache is used without background refetch
            staleTime: 5 * 60 * 1000,

            // Cache kept for 30 minutes after last use
            // Allows instant navigation back to previously visited data
            gcTime: 30 * 60 * 1000,

            // Retry once on failure (Firestore has good retry logic internally)
            retry: 1,

            // Refetch when window regains focus (catch updates while away)
            refetchOnWindowFocus: true,

            // Don't refetch on component mount if data is fresh
            // This is key for reducing Firestore reads
            refetchOnMount: false,

            // Don't refetch on reconnect (Firestore handles this)
            refetchOnReconnect: false,
        },
        mutations: {
            // Retry mutations once
            retry: 1,
        },
    },
});
