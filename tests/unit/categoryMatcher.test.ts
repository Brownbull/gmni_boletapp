/**
 * Category Matcher Unit Tests
 *
 * Tests for the categoryMatcher.ts functions.
 * These are pure unit tests for the fuzzy matching logic.
 *
 * Story 6.2 - Fuzzy Matching Engine
 * AC #6: Unit tests cover all matching scenarios (exact, fuzzy, no match)
 */

import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
    normalizeItemName,
    createMatcher,
    findCategoryMatch,
    applyCategoryMappings,
} from '../../src/utils/categoryMatcher';
import type { CategoryMapping } from '../../src/types/categoryMapping';
import type { Transaction } from '../../src/types/transaction';

// Helper to create mock CategoryMapping objects
function createMockMapping(
    normalizedItem: string,
    targetCategory: string,
    options?: Partial<CategoryMapping>
): CategoryMapping {
    return {
        id: options?.id ?? `mapping-${normalizedItem}`,
        originalItem: options?.originalItem ?? normalizedItem.toUpperCase(),
        normalizedItem,
        targetCategory: targetCategory as CategoryMapping['targetCategory'],
        confidence: options?.confidence ?? 1.0,
        source: options?.source ?? 'user',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        usageCount: options?.usageCount ?? 0,
        merchantPattern: options?.merchantPattern,
    };
}

// Helper to create mock Transaction objects
function createMockTransaction(
    merchant: string,
    category: string,
    items: Array<{ name: string; price: number; category?: string }>
): Transaction {
    return {
        id: 'txn-123',
        date: '2025-01-15',
        merchant,
        category: category as Transaction['category'],
        total: items.reduce((sum, item) => sum + item.price, 0),
        items: items.map((item) => ({
            name: item.name,
            price: item.price,
            qty: 1,
            category: item.category,
        })),
    };
}

describe('normalizeItemName', () => {
    it('should convert to lowercase', () => {
        expect(normalizeItemName('UBER EATS')).toBe('uber eats');
        expect(normalizeItemName('Walmart')).toBe('walmart');
        expect(normalizeItemName('McDonald\'s')).toBe('mcdonalds');
    });

    it('should trim whitespace', () => {
        expect(normalizeItemName('  uber  ')).toBe('uber');
        expect(normalizeItemName('\ttaxi\n')).toBe('taxi');
        expect(normalizeItemName('   test   ')).toBe('test');
    });

    it('should remove special characters', () => {
        expect(normalizeItemName('Café 50%')).toBe('caf 50');
        expect(normalizeItemName('Uber-Eats!')).toBe('ubereats');
        expect(normalizeItemName('#1 Store')).toBe('1 store');
        expect(normalizeItemName('A&B Company')).toBe('ab company');
    });

    it('should collapse multiple spaces', () => {
        expect(normalizeItemName('uber   eats')).toBe('uber eats');
        expect(normalizeItemName('my    store   name')).toBe('my store name');
    });

    it('should handle empty strings', () => {
        expect(normalizeItemName('')).toBe('');
        expect(normalizeItemName('   ')).toBe('');
    });

    it('should handle unicode characters', () => {
        // Unicode letters get stripped, keeping only alphanumeric
        expect(normalizeItemName('Tienda España')).toBe('tienda espaa');
        expect(normalizeItemName('Café Ñoño')).toBe('caf oo');
    });

    it('should handle numbers', () => {
        expect(normalizeItemName('Store 123')).toBe('store 123');
        expect(normalizeItemName('7-Eleven')).toBe('7eleven');
    });
});

describe('createMatcher', () => {
    it('should create a Fuse instance from mappings', () => {
        const mappings = [
            createMockMapping('uber', 'Transport'),
            createMockMapping('walmart', 'Supermarket'),
        ];

        const matcher = createMatcher(mappings);

        // Verify it's a Fuse instance by checking it has search method
        expect(matcher).toBeDefined();
        expect(typeof matcher.search).toBe('function');
    });

    it('should handle empty mappings array', () => {
        const matcher = createMatcher([]);

        expect(matcher).toBeDefined();
        const results = matcher.search('uber');
        expect(results).toHaveLength(0);
    });
});

describe('findCategoryMatch', () => {
    describe('exact matches', () => {
        it('should find exact match with high confidence', () => {
            const mappings = [
                createMockMapping('uber', 'Transport'),
                createMockMapping('walmart', 'Supermarket'),
            ];
            const matcher = createMatcher(mappings);

            const result = findCategoryMatch(matcher, 'uber');

            expect(result).not.toBeNull();
            expect(result?.mapping.normalizedItem).toBe('uber');
            expect(result?.mapping.targetCategory).toBe('Transport');
            // Fuse.js may return very small float instead of exact 0
            expect(result?.score).toBeCloseTo(0, 5); // Perfect match
            expect(result?.confidence).toBeCloseTo(1.0, 5); // 1.0 * (1 - ~0) ≈ 1.0
        });

        it('should match case-insensitively', () => {
            const mappings = [createMockMapping('uber eats', 'Restaurant')];
            const matcher = createMatcher(mappings);

            const result = findCategoryMatch(matcher, 'UBER EATS');

            expect(result).not.toBeNull();
            expect(result?.mapping.targetCategory).toBe('Restaurant');
        });
    });

    describe('fuzzy matches', () => {
        it('should match similar items within threshold', () => {
            const mappings = [createMockMapping('uber eats', 'Restaurant')];
            const matcher = createMatcher(mappings);

            // "uber" should fuzzy match "uber eats"
            const result = findCategoryMatch(matcher, 'uber');

            expect(result).not.toBeNull();
            expect(result?.mapping.normalizedItem).toBe('uber eats');
            expect(result?.score).toBeGreaterThan(0);
            expect(result?.score).toBeLessThanOrEqual(0.3);
        });

        it('should prefer better matches', () => {
            const mappings = [
                createMockMapping('uber', 'Transport'),
                createMockMapping('uber eats', 'Restaurant'),
            ];
            const matcher = createMatcher(mappings);

            const result = findCategoryMatch(matcher, 'uber');

            expect(result).not.toBeNull();
            // Should match "uber" exactly rather than "uber eats" fuzzily
            expect(result?.mapping.normalizedItem).toBe('uber');
        });

        it('should calculate confidence correctly', () => {
            const mappings = [
                createMockMapping('uber', 'Transport', { confidence: 0.8 }),
            ];
            const matcher = createMatcher(mappings);

            const result = findCategoryMatch(matcher, 'uber');

            expect(result).not.toBeNull();
            // confidence = mapping.confidence * (1 - score)
            // For near-exact match: 0.8 * (1 - ~0) ≈ 0.8
            expect(result?.confidence).toBeCloseTo(0.8, 5);
        });
    });

    describe('no match scenarios', () => {
        it('should return null for completely different items', () => {
            const mappings = [createMockMapping('uber', 'Transport')];
            const matcher = createMatcher(mappings);

            const result = findCategoryMatch(matcher, 'completely different item');

            expect(result).toBeNull();
        });

        it('should return null for empty item name', () => {
            const mappings = [createMockMapping('uber', 'Transport')];
            const matcher = createMatcher(mappings);

            const result = findCategoryMatch(matcher, '');

            expect(result).toBeNull();
        });

        it('should return null when score exceeds threshold', () => {
            const mappings = [createMockMapping('uber eats delivery service', 'Restaurant')];
            const matcher = createMatcher(mappings);

            // Very different search term should exceed threshold
            const result = findCategoryMatch(matcher, 'xyz');

            expect(result).toBeNull();
        });

        it('should return null for empty mappings', () => {
            const matcher = createMatcher([]);

            const result = findCategoryMatch(matcher, 'uber');

            expect(result).toBeNull();
        });
    });

    describe('confidence scoring', () => {
        it('should reduce confidence for fuzzy matches', () => {
            const mappings = [
                createMockMapping('uber eats delivery', 'Restaurant', { confidence: 1.0 }),
            ];
            const matcher = createMatcher(mappings);

            const result = findCategoryMatch(matcher, 'uber eats');

            expect(result).not.toBeNull();
            // Fuzzy match should have score > 0, so confidence < 1.0
            expect(result?.confidence).toBeLessThan(1.0);
            expect(result?.confidence).toBeGreaterThan(0);
        });

        it('should inherit mapping confidence', () => {
            const mappings = [
                createMockMapping('uber', 'Transport', { confidence: 0.5 }),
            ];
            const matcher = createMatcher(mappings);

            const result = findCategoryMatch(matcher, 'uber');

            expect(result).not.toBeNull();
            // For near-exact match: 0.5 * (1 - ~0) ≈ 0.5
            expect(result?.confidence).toBeCloseTo(0.5, 5);
        });
    });
});

describe('applyCategoryMappings', () => {
    describe('empty mappings', () => {
        it('should return transaction unchanged when mappings is empty', () => {
            const transaction = createMockTransaction('Some Store', 'Other', [
                { name: 'Item 1', price: 10 },
            ]);

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(transaction, []);

            expect(result).toEqual(transaction);
            expect(appliedMappingIds).toHaveLength(0);
        });

        it('should return transaction unchanged when mappings is null/undefined', () => {
            const transaction = createMockTransaction('Some Store', 'Other', [
                { name: 'Item 1', price: 10 },
            ]);

            // @ts-expect-error - Testing null handling
            const { transaction: result, appliedMappingIds } = applyCategoryMappings(transaction, null);

            expect(result).toEqual(transaction);
            expect(appliedMappingIds).toHaveLength(0);
        });
    });

    describe('merchant matching', () => {
        it('should update store category from merchant match', () => {
            const transaction = createMockTransaction('Uber', 'Other', [
                { name: 'Ride to downtown', price: 15 },
            ]);
            const mappings = [createMockMapping('uber', 'Transport')];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(transaction, mappings);

            expect(result.category).toBe('Transport');
            expect(appliedMappingIds).toContain('mapping-uber');
        });

        it('should not update category for low confidence matches', () => {
            const transaction = createMockTransaction('Uber', 'Other', [
                { name: 'Ride', price: 15 },
            ]);
            // Low confidence mapping
            const mappings = [
                createMockMapping('uber', 'Transport', { confidence: 0.3 }),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(transaction, mappings);

            // Confidence 0.3 * (1 - 0) = 0.3 < 0.7 threshold
            expect(result.category).toBe('Other');
            expect(appliedMappingIds).toHaveLength(0);
        });
    });

    describe('item matching', () => {
        it('should update individual item categories', () => {
            const transaction = createMockTransaction('Some Store', 'Other', [
                { name: 'Milk', price: 5 },
                { name: 'Bread', price: 3 },
            ]);
            const mappings = [
                createMockMapping('milk', 'Supermarket'),
                createMockMapping('bread', 'Bakery'),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(transaction, mappings);

            expect(result.items[0].category).toBe('Supermarket');
            expect(result.items[1].category).toBe('Bakery');
            expect(appliedMappingIds).toContain('mapping-milk');
            expect(appliedMappingIds).toContain('mapping-bread');
        });

        it('should not mutate original transaction', () => {
            const transaction = createMockTransaction('Uber', 'Other', [
                { name: 'Ride', price: 15 },
            ]);
            const mappings = [createMockMapping('uber', 'Transport')];

            const { transaction: result } = applyCategoryMappings(transaction, mappings);

            expect(result).not.toBe(transaction);
            expect(transaction.category).toBe('Other'); // Original unchanged
            expect(result.category).toBe('Transport');
        });

        it('should preserve unmatched items', () => {
            const transaction = createMockTransaction('Some Store', 'Other', [
                { name: 'Milk', price: 5 },
                { name: 'Random Unknown Item', price: 100 },
            ]);
            const mappings = [createMockMapping('milk', 'Supermarket')];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(transaction, mappings);

            expect(result.items[0].category).toBe('Supermarket');
            expect(result.items[1].category).toBeUndefined(); // No match, unchanged
            expect(appliedMappingIds).toEqual(['mapping-milk']);
        });
    });

    describe('combined matching', () => {
        it('should apply both merchant and item mappings', () => {
            const transaction = createMockTransaction('Walmart', 'Other', [
                { name: 'Milk', price: 5 },
                { name: 'Bread', price: 3 },
            ]);
            const mappings = [
                createMockMapping('walmart', 'Supermarket'),
                createMockMapping('milk', 'Bakery'), // Item-level override
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(transaction, mappings);

            expect(result.category).toBe('Supermarket'); // Merchant match
            expect(result.items[0].category).toBe('Bakery'); // Item match
            expect(appliedMappingIds).toContain('mapping-walmart');
            expect(appliedMappingIds).toContain('mapping-milk');
        });
    });

    describe('edge cases', () => {
        it('should handle transaction with no items', () => {
            const transaction: Transaction = {
                id: 'txn-empty',
                date: '2025-01-15',
                merchant: 'Uber',
                category: 'Other',
                total: 15,
                items: [],
            };
            const mappings = [createMockMapping('uber', 'Transport')];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(transaction, mappings);

            expect(result.category).toBe('Transport');
            expect(result.items).toHaveLength(0);
            expect(appliedMappingIds).toEqual(['mapping-uber']);
        });

        it('should handle items with special characters', () => {
            const transaction = createMockTransaction('Café Central', 'Other', [
                { name: 'Café con Leche', price: 5 },
            ]);
            const mappings = [
                createMockMapping('caf con leche', 'Restaurant'),
            ];

            const { transaction: result } = applyCategoryMappings(transaction, mappings);

            // "Café con Leche" normalizes to "caf con leche"
            expect(result.items[0].category).toBe('Restaurant');
        });

        it('should not duplicate mapping IDs for multiple item matches', () => {
            const transaction = createMockTransaction('Some Store', 'Other', [
                { name: 'Milk', price: 5 },
                { name: 'milk', price: 8 },  // Same item, different case
            ]);
            // Both items should match the same mapping
            const mappings = [createMockMapping('milk', 'Supermarket')];

            const { appliedMappingIds } = applyCategoryMappings(transaction, mappings);

            // Should only include the mapping ID once even though it matched twice
            expect(appliedMappingIds).toEqual(['mapping-milk']);
        });
    });
});
