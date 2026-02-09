/**
 * Query Keys Tests
 *
 * Story 14.27: Transaction Pagination & Lazy Loading
 * Story 14.29: React Query Migration
 *
 * Tests the hierarchical query key factory functions for React Query
 * cache invalidation.
 */

import { describe, it, expect } from 'vitest';
import { QUERY_KEYS } from '../../../src/lib/queryKeys';

describe('QUERY_KEYS', () => {
    const userId = 'test-user-123';
    const appId = 'test-app';

    describe('transactions', () => {
        it('generates correct key structure', () => {
            const key = QUERY_KEYS.transactions(userId, appId);

            expect(key).toEqual(['transactions', userId, appId]);
        });

        it('returns readonly tuple', () => {
            const key = QUERY_KEYS.transactions(userId, appId);

            // TypeScript readonly tuple - check array properties
            expect(Array.isArray(key)).toBe(true);
            expect(key.length).toBe(3);
        });
    });

    describe('transactionsPaginated', () => {
        it('generates correct key structure with paginated segment', () => {
            const key = QUERY_KEYS.transactionsPaginated(userId, appId);

            expect(key).toEqual(['transactions', 'paginated', userId, appId]);
        });

        it('is distinct from regular transactions key', () => {
            const regularKey = QUERY_KEYS.transactions(userId, appId);
            const paginatedKey = QUERY_KEYS.transactionsPaginated(userId, appId);

            expect(regularKey).not.toEqual(paginatedKey);
            expect(paginatedKey[1]).toBe('paginated');
        });

        it('shares prefix with transactions for partial invalidation', () => {
            const regularKey = QUERY_KEYS.transactions(userId, appId);
            const paginatedKey = QUERY_KEYS.transactionsPaginated(userId, appId);

            // Both start with 'transactions'
            expect(regularKey[0]).toBe('transactions');
            expect(paginatedKey[0]).toBe('transactions');
        });
    });

    describe('mappings', () => {
        it('generates all mappings key', () => {
            const key = QUERY_KEYS.mappings.all(userId, appId);

            expect(key).toEqual(['mappings', userId, appId]);
        });

        it('generates category mappings key', () => {
            const key = QUERY_KEYS.mappings.category(userId, appId);

            expect(key).toEqual(['mappings', 'category', userId, appId]);
        });

        it('generates merchant mappings key', () => {
            const key = QUERY_KEYS.mappings.merchant(userId, appId);

            expect(key).toEqual(['mappings', 'merchant', userId, appId]);
        });

        it('generates subcategory mappings key', () => {
            const key = QUERY_KEYS.mappings.subcategory(userId, appId);

            expect(key).toEqual(['mappings', 'subcategory', userId, appId]);
        });
    });

    describe('trustedMerchants', () => {
        it('generates correct key structure', () => {
            const key = QUERY_KEYS.trustedMerchants(userId, appId);

            expect(key).toEqual(['trustedMerchants', userId, appId]);
        });
    });

    describe('userPreferences', () => {
        it('generates correct key structure', () => {
            const key = QUERY_KEYS.userPreferences(userId, appId);

            expect(key).toEqual(['userPreferences', userId, appId]);
        });
    });

    // Skipped: household feature not implemented yet
    describe.skip('household (future)', () => {
        const householdId = 'household-123';

        it('generates all household data key', () => {
            const key = (QUERY_KEYS as any).household.all(householdId);

            expect(key).toEqual(['household', householdId]);
        });

        it('generates household transactions key', () => {
            const key = (QUERY_KEYS as any).household.transactions(householdId);

            expect(key).toEqual(['household', householdId, 'transactions']);
        });

        it('generates household members key', () => {
            const key = (QUERY_KEYS as any).household.members(householdId);

            expect(key).toEqual(['household', householdId, 'members']);
        });
    });

    describe('key uniqueness', () => {
        it('generates unique keys for different users', () => {
            const user1Key = QUERY_KEYS.transactions('user1', appId);
            const user2Key = QUERY_KEYS.transactions('user2', appId);

            expect(user1Key).not.toEqual(user2Key);
        });

        it('generates unique keys for different apps', () => {
            const app1Key = QUERY_KEYS.transactions(userId, 'app1');
            const app2Key = QUERY_KEYS.transactions(userId, 'app2');

            expect(app1Key).not.toEqual(app2Key);
        });
    });

    describe('hierarchical invalidation', () => {
        it('allows invalidating all transactions with prefix', () => {
            const regularKey = QUERY_KEYS.transactions(userId, appId);
            const paginatedKey = QUERY_KEYS.transactionsPaginated(userId, appId);

            // For React Query: queryClient.invalidateQueries({ queryKey: ['transactions'] })
            // would match both keys since they share prefix
            const prefix = 'transactions';
            expect(regularKey[0]).toBe(prefix);
            expect(paginatedKey[0]).toBe(prefix);
        });

        it('allows invalidating all mappings with prefix', () => {
            const allKey = QUERY_KEYS.mappings.all(userId, appId);
            const categoryKey = QUERY_KEYS.mappings.category(userId, appId);
            const merchantKey = QUERY_KEYS.mappings.merchant(userId, appId);

            const prefix = 'mappings';
            expect(allKey[0]).toBe(prefix);
            expect(categoryKey[0]).toBe(prefix);
            expect(merchantKey[0]).toBe(prefix);
        });
    });
});
