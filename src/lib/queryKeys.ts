/**
 * React Query Key Constants
 *
 * Story 14.29: React Query Migration
 * Epic 14: Core Implementation
 *
 * Hierarchical query keys for smart cache invalidation.
 * Pattern: [resource, ...identifiers]
 *
 * Using array factories allows:
 * - Type-safe key generation
 * - Partial invalidation (e.g., invalidate all mappings)
 * - Consistent key structure across the app
 */

export const QUERY_KEYS = {
    /**
     * Transaction queries - real-time listener (limited to 100)
     * Key: ['transactions', userId, appId]
     */
    transactions: (userId: string, appId: string) =>
        ['transactions', userId, appId] as const,

    /**
     * Story 14.27: Paginated transactions for infinite scroll
     * Key: ['transactions', 'paginated', userId, appId]
     * Used with useInfiniteQuery for loading older transactions beyond listener limit
     */
    transactionsPaginated: (userId: string, appId: string) =>
        ['transactions', 'paginated', userId, appId] as const,

    /**
     * Mapping queries - hierarchical for partial invalidation
     * All mappings: ['mappings', userId, appId]
     * Specific type: ['mappings', type, userId, appId]
     */
    mappings: {
        /** All mappings for a user (for bulk invalidation) */
        all: (userId: string, appId: string) =>
            ['mappings', userId, appId] as const,
        /** Category mappings */
        category: (userId: string, appId: string) =>
            ['mappings', 'category', userId, appId] as const,
        /** Merchant mappings */
        merchant: (userId: string, appId: string) =>
            ['mappings', 'merchant', userId, appId] as const,
        /** Subcategory mappings */
        subcategory: (userId: string, appId: string) =>
            ['mappings', 'subcategory', userId, appId] as const,
    },

    /**
     * Groups queries
     * Key: ['groups', userId, appId]
     */
    groups: (userId: string, appId: string) =>
        ['groups', userId, appId] as const,

    /**
     * Trusted merchants queries
     * Key: ['trustedMerchants', userId, appId]
     */
    trustedMerchants: (userId: string, appId: string) =>
        ['trustedMerchants', userId, appId] as const,

    /**
     * User preferences query
     * Story 14.28: App-level preferences caching
     * Key: ['userPreferences', userId, appId]
     * Uses one-time fetch (not subscription) since preferences rarely change
     */
    userPreferences: (userId: string, appId: string) =>
        ['userPreferences', userId, appId] as const,

    /**
     * Future: Household sharing (Epic 14c)
     * Structured for multi-user real-time sync
     */
    household: {
        /** All household data */
        all: (householdId: string) =>
            ['household', householdId] as const,
        /** Household transactions */
        transactions: (householdId: string) =>
            ['household', householdId, 'transactions'] as const,
        /** Household members */
        members: (householdId: string) =>
            ['household', householdId, 'members'] as const,
    },
} as const;

/**
 * Type helper for extracting query key types
 */
export type QueryKeyFactory<T extends (...args: never[]) => readonly unknown[]> = ReturnType<T>;
