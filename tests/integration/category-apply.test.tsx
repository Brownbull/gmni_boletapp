/**
 * Category Auto-Apply Integration Tests
 *
 * Tests for Story 6.4: Auto-Apply on Receipt Scan
 * Covers: Category mapping application after Gemini receipt analysis,
 * merchant matching, item matching, confidence threshold, and usage tracking.
 *
 * Risk Level: MEDIUM (automatic category assignment feature)
 * Coverage: applyCategoryMappings integration, processScan flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { applyCategoryMappings, AUTO_APPLY_CONFIDENCE_THRESHOLD } from '../../src/utils/categoryMatcher';
import type { CategoryMapping } from '../../src/types/categoryMapping';
import type { Transaction } from '../../src/types/transaction';

// Helper to create mock CategoryMapping objects
function createMockMapping(
    normalizedItem: string,
    targetCategory: string,
    options?: Partial<CategoryMapping>
): CategoryMapping {
    return {
        id: options?.id ?? `mapping-${normalizedItem.replace(/\s+/g, '-')}`,
        originalItem: options?.originalItem ?? normalizedItem.toUpperCase(),
        normalizedItem,
        targetCategory: targetCategory as CategoryMapping['targetCategory'],
        confidence: options?.confidence ?? 1.0, // Default high confidence for auto-apply
        source: options?.source ?? 'user',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        usageCount: options?.usageCount ?? 0,
        merchantPattern: options?.merchantPattern,
    };
}

// Helper to create mock Transaction objects (simulating Gemini response)
function createMockGeminiTransaction(
    merchant: string,
    category: string,
    items: Array<{ name: string; price: number; category?: string }>
): Transaction {
    return {
        date: '2025-12-03',
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

describe('Category Auto-Apply Integration - Story 6.4', () => {
    describe('AC#1: After Gemini analyzes receipt, learned categories are applied', () => {
        it('should apply category mappings to transaction from Gemini', () => {
            // Simulate Gemini response
            const geminiTransaction = createMockGeminiTransaction('UBER', 'Other', [
                { name: 'Ride to airport', price: 50 },
            ]);

            // User's learned mappings
            const userMappings = [
                createMockMapping('uber', 'Transport'),
            ];

            // Apply mappings (simulating what processScan does)
            const { transaction: result } = applyCategoryMappings(geminiTransaction, userMappings);

            expect(result.category).toBe('Transport');
        });

        it('should return original transaction when no mappings exist', () => {
            const geminiTransaction = createMockGeminiTransaction('WALMART', 'Other', [
                { name: 'Groceries', price: 100 },
            ]);

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(
                geminiTransaction,
                []
            );

            expect(result.category).toBe('Other');
            expect(appliedMappingIds).toHaveLength(0);
        });

        it('should return original transaction when no matches found', () => {
            const geminiTransaction = createMockGeminiTransaction('UNKNOWN STORE', 'Other', [
                { name: 'Random Item', price: 25 },
            ]);

            const userMappings = [
                createMockMapping('uber', 'Transport'),
                createMockMapping('walmart', 'Supermarket'),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(
                geminiTransaction,
                userMappings
            );

            expect(result.category).toBe('Other');
            expect(appliedMappingIds).toHaveLength(0);
        });
    });

    describe('AC#2: Merchant name is matched for store-level category override', () => {
        it('should match merchant name exactly', () => {
            const geminiTransaction = createMockGeminiTransaction('Walmart', 'Other', [
                { name: 'Groceries', price: 100 },
            ]);

            const userMappings = [
                createMockMapping('walmart', 'Supermarket'),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(
                geminiTransaction,
                userMappings
            );

            expect(result.category).toBe('Supermarket');
            expect(appliedMappingIds).toContain('mapping-walmart');
        });

        it('should match merchant name case-insensitively', () => {
            const geminiTransaction = createMockGeminiTransaction('UBER EATS', 'Restaurant', [
                { name: 'Food delivery', price: 30 },
            ]);

            const userMappings = [
                createMockMapping('uber eats', 'Transport'),
            ];

            const { transaction: result } = applyCategoryMappings(geminiTransaction, userMappings);

            expect(result.category).toBe('Transport');
        });

        it('should fuzzy match merchant names within threshold', () => {
            const geminiTransaction = createMockGeminiTransaction('UBER', 'Other', [
                { name: 'Trip', price: 25 },
            ]);

            // "uber" should fuzzy match "uber eats" within threshold
            const userMappings = [
                createMockMapping('uber eats', 'Transport'),
            ];

            const { transaction: result } = applyCategoryMappings(geminiTransaction, userMappings);

            // Should match due to fuzzy matching
            expect(result.category).toBe('Transport');
        });
    });

    describe('AC#3: Individual items are matched for item-level category override', () => {
        it('should apply category to matching items', () => {
            const geminiTransaction = createMockGeminiTransaction('Some Store', 'Other', [
                { name: 'Milk', price: 5 },
                { name: 'Bread', price: 3 },
                { name: 'Unknown Item', price: 10 },
            ]);

            const userMappings = [
                createMockMapping('milk', 'Supermarket'),
                createMockMapping('bread', 'Bakery'),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(
                geminiTransaction,
                userMappings
            );

            expect(result.items[0].category).toBe('Supermarket');
            expect(result.items[1].category).toBe('Bakery');
            expect(result.items[2].category).toBeUndefined();
            expect(appliedMappingIds).toContain('mapping-milk');
            expect(appliedMappingIds).toContain('mapping-bread');
        });

        it('should preserve existing item categories when no match found', () => {
            const geminiTransaction = createMockGeminiTransaction('Store', 'Other', [
                { name: 'Special Item', price: 50, category: 'Electronics' },
            ]);

            const userMappings = [
                createMockMapping('groceries', 'Supermarket'),
            ];

            const { transaction: result } = applyCategoryMappings(geminiTransaction, userMappings);

            expect(result.items[0].category).toBe('Electronics');
        });

        it('should match item names case-insensitively', () => {
            const geminiTransaction = createMockGeminiTransaction('Store', 'Other', [
                { name: 'LECHE DESCREMADA', price: 5 },
            ]);

            const userMappings = [
                createMockMapping('leche descremada', 'Supermarket'),
            ];

            const { transaction: result } = applyCategoryMappings(geminiTransaction, userMappings);

            expect(result.items[0].category).toBe('Supermarket');
        });
    });

    describe('AC#4: Only matches with confidence > 0.7 are applied', () => {
        it('should verify AUTO_APPLY_CONFIDENCE_THRESHOLD is 0.7', () => {
            expect(AUTO_APPLY_CONFIDENCE_THRESHOLD).toBe(0.7);
        });

        it('should apply mapping with confidence exactly at threshold', () => {
            // User mapping with confidence that results in > 0.7 after fuzzy matching
            const geminiTransaction = createMockGeminiTransaction('Uber', 'Other', [
                { name: 'Ride', price: 25 },
            ]);

            // High confidence mapping (1.0 * (1 - ~0) > 0.7)
            const userMappings = [
                createMockMapping('uber', 'Transport', { confidence: 1.0 }),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(
                geminiTransaction,
                userMappings
            );

            expect(result.category).toBe('Transport');
            expect(appliedMappingIds.length).toBeGreaterThan(0);
        });

        it('should NOT apply mapping with low confidence', () => {
            const geminiTransaction = createMockGeminiTransaction('Uber', 'Other', [
                { name: 'Ride', price: 25 },
            ]);

            // Low confidence mapping (0.3 * (1 - 0) = 0.3 < 0.7)
            const userMappings = [
                createMockMapping('uber', 'Transport', { confidence: 0.3 }),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(
                geminiTransaction,
                userMappings
            );

            expect(result.category).toBe('Other'); // Original category preserved
            expect(appliedMappingIds).toHaveLength(0);
        });

        it('should NOT apply mapping when fuzzy match degrades confidence below threshold', () => {
            const geminiTransaction = createMockGeminiTransaction('Store', 'Other', [
                { name: 'xyz', price: 10 },
            ]);

            // Even high confidence mapping won't apply if fuzzy match score is poor
            const userMappings = [
                createMockMapping('completely different text', 'Supermarket', { confidence: 1.0 }),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(
                geminiTransaction,
                userMappings
            );

            expect(result.items[0].category).toBeUndefined();
            expect(appliedMappingIds).toHaveLength(0);
        });

        it('should apply both merchant and item mappings with sufficient confidence', () => {
            const geminiTransaction = createMockGeminiTransaction('Walmart', 'Other', [
                { name: 'Milk', price: 5 },
            ]);

            const userMappings = [
                createMockMapping('walmart', 'Supermarket', { confidence: 0.9 }),
                createMockMapping('milk', 'Bakery', { confidence: 0.85 }),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(
                geminiTransaction,
                userMappings
            );

            expect(result.category).toBe('Supermarket');
            expect(result.items[0].category).toBe('Bakery');
            expect(appliedMappingIds).toHaveLength(2);
        });
    });

    describe('AC#5: Mapping usage count is incremented when mapping is applied', () => {
        it('should return applied mapping IDs for usage tracking', () => {
            const geminiTransaction = createMockGeminiTransaction('Uber', 'Other', [
                { name: 'Ride', price: 25 },
            ]);

            const userMappings = [
                createMockMapping('uber', 'Transport', { id: 'mapping-uber-123' }),
            ];

            const { appliedMappingIds } = applyCategoryMappings(geminiTransaction, userMappings);

            expect(appliedMappingIds).toEqual(['mapping-uber-123']);
        });

        it('should return multiple mapping IDs when multiple mappings applied', () => {
            const geminiTransaction = createMockGeminiTransaction('Walmart', 'Other', [
                { name: 'Milk', price: 5 },
                { name: 'Bread', price: 3 },
            ]);

            const userMappings = [
                createMockMapping('walmart', 'Supermarket', { id: 'mapping-1' }),
                createMockMapping('milk', 'Bakery', { id: 'mapping-2' }),
                createMockMapping('bread', 'Bakery', { id: 'mapping-3' }),
            ];

            const { appliedMappingIds } = applyCategoryMappings(geminiTransaction, userMappings);

            expect(appliedMappingIds).toContain('mapping-1');
            expect(appliedMappingIds).toContain('mapping-2');
            expect(appliedMappingIds).toContain('mapping-3');
            expect(appliedMappingIds).toHaveLength(3);
        });

        it('should not duplicate mapping IDs when same mapping applies multiple times', () => {
            const geminiTransaction = createMockGeminiTransaction('Store', 'Other', [
                { name: 'Milk', price: 5 },
                { name: 'milk', price: 8 },  // Same item, different case
            ]);

            // Same mapping should match both items
            const userMappings = [
                createMockMapping('milk', 'Supermarket', { id: 'mapping-milk' }),
            ];

            const { appliedMappingIds } = applyCategoryMappings(geminiTransaction, userMappings);

            // Should only include once even though it matched twice
            expect(appliedMappingIds).toEqual(['mapping-milk']);
        });

        it('should return empty array when no mappings applied', () => {
            const geminiTransaction = createMockGeminiTransaction('Unknown', 'Other', [
                { name: 'Unknown Item', price: 10 },
            ]);

            const userMappings = [
                createMockMapping('uber', 'Transport'),
            ];

            const { appliedMappingIds } = applyCategoryMappings(geminiTransaction, userMappings);

            expect(appliedMappingIds).toEqual([]);
        });

        it('should handle mappings without IDs gracefully', () => {
            const geminiTransaction = createMockGeminiTransaction('Uber', 'Other', [
                { name: 'Ride', price: 25 },
            ]);

            // Create mapping manually without ID (edge case)
            const mappingWithoutId: CategoryMapping = {
                // id is explicitly omitted
                originalItem: 'UBER',
                normalizedItem: 'uber',
                targetCategory: 'Transport',
                confidence: 1.0,
                source: 'user',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                usageCount: 0,
            };

            const { appliedMappingIds, transaction } = applyCategoryMappings(
                geminiTransaction,
                [mappingWithoutId]
            );

            // Category should still be applied
            expect(transaction.category).toBe('Transport');
            // But no ID to track since mapping has no id
            expect(appliedMappingIds).toEqual([]);
        });
    });

    describe('Integration Flow Simulation', () => {
        it('should simulate complete processScan flow with category application', () => {
            // Step 1: Simulate Gemini response (from analyzeReceipt)
            const geminiResult = {
                merchant: 'UBER',
                date: '2025-12-03',
                total: 75,
                category: 'Other', // Gemini's default/guess
                items: [
                    { name: 'Trip to downtown', price: 25 },
                    { name: 'Trip to airport', price: 50 },
                ],
            };

            // Step 2: Build initial transaction (like processScan does)
            const initialTransaction: Transaction = {
                merchant: geminiResult.merchant,
                date: geminiResult.date,
                total: geminiResult.total,
                category: geminiResult.category as Transaction['category'],
                alias: geminiResult.merchant,
                items: geminiResult.items.map((i) => ({
                    name: i.name,
                    price: i.price,
                    qty: 1,
                })),
            };

            // Step 3: User's learned mappings (from useCategoryMappings hook)
            const userMappings = [
                createMockMapping('uber', 'Transport', { id: 'map-uber' }),
            ];

            // Step 4: Apply category mappings
            const { transaction: categorizedTransaction, appliedMappingIds } =
                applyCategoryMappings(initialTransaction, userMappings);

            // Step 5: Verify results
            expect(categorizedTransaction.category).toBe('Transport');
            expect(categorizedTransaction.merchant).toBe('UBER');
            expect(categorizedTransaction.items).toHaveLength(2);
            expect(appliedMappingIds).toEqual(['map-uber']);

            // Step 6: Would call incrementMappingUsage for each appliedMappingId
            // (mocked in actual tests, just verify we have the IDs)
            expect(appliedMappingIds.length).toBeGreaterThan(0);
        });

        it('should simulate flow with mixed matching (merchant + some items)', () => {
            const geminiResult = {
                merchant: 'COSTCO',
                date: '2025-12-03',
                total: 150,
                category: 'Other',
                items: [
                    { name: 'Milk', price: 10 },
                    { name: 'Rotisserie Chicken', price: 15 },
                    { name: 'Electronics Cable', price: 25 },
                    { name: 'Random Thing', price: 100 },
                ],
            };

            const initialTransaction: Transaction = {
                merchant: geminiResult.merchant,
                date: geminiResult.date,
                total: geminiResult.total,
                category: geminiResult.category as Transaction['category'],
                alias: geminiResult.merchant,
                items: geminiResult.items.map((i) => ({
                    name: i.name,
                    price: i.price,
                    qty: 1,
                })),
            };

            const userMappings = [
                createMockMapping('costco', 'Supermarket', { id: 'map-costco' }),
                createMockMapping('milk', 'Bakery', { id: 'map-milk' }),
                createMockMapping('rotisserie chicken', 'Restaurant', { id: 'map-chicken' }),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(
                initialTransaction,
                userMappings
            );

            // Store-level category from merchant
            expect(result.category).toBe('Supermarket');

            // Item-level categories
            expect(result.items[0].category).toBe('Bakery'); // Milk
            expect(result.items[1].category).toBe('Restaurant'); // Chicken
            expect(result.items[2].category).toBeUndefined(); // Electronics - no match
            expect(result.items[3].category).toBeUndefined(); // Random - no match

            // Applied mapping IDs for usage tracking
            expect(appliedMappingIds).toContain('map-costco');
            expect(appliedMappingIds).toContain('map-milk');
            expect(appliedMappingIds).toContain('map-chicken');
            expect(appliedMappingIds).toHaveLength(3);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty items array', () => {
            const geminiTransaction = createMockGeminiTransaction('UBER', 'Other', []);

            const userMappings = [
                createMockMapping('uber', 'Transport'),
            ];

            const { transaction: result, appliedMappingIds } = applyCategoryMappings(
                geminiTransaction,
                userMappings
            );

            expect(result.category).toBe('Transport');
            expect(result.items).toHaveLength(0);
            expect(appliedMappingIds).toHaveLength(1);
        });

        it('should handle special characters in merchant/item names', () => {
            const geminiTransaction = createMockGeminiTransaction('Café & Bar #1', 'Other', [
                { name: "McDonald's Big Mac®", price: 15 },
            ]);

            const userMappings = [
                createMockMapping('caf bar 1', 'Restaurant'),
                createMockMapping('mcdonalds big mac', 'Restaurant'),
            ];

            const { transaction: result } = applyCategoryMappings(geminiTransaction, userMappings);

            expect(result.category).toBe('Restaurant');
            expect(result.items[0].category).toBe('Restaurant');
        });

        it('should not mutate original transaction', () => {
            const originalTransaction = createMockGeminiTransaction('UBER', 'Other', [
                { name: 'Ride', price: 25 },
            ]);
            const originalCategory = originalTransaction.category;

            const userMappings = [
                createMockMapping('uber', 'Transport'),
            ];

            const { transaction: result } = applyCategoryMappings(originalTransaction, userMappings);

            // Original should be unchanged
            expect(originalTransaction.category).toBe(originalCategory);
            expect(originalTransaction.category).toBe('Other');

            // Result should be different
            expect(result.category).toBe('Transport');
            expect(result).not.toBe(originalTransaction);
        });

        it('should handle null/undefined mappings gracefully', () => {
            const geminiTransaction = createMockGeminiTransaction('Store', 'Other', [
                { name: 'Item', price: 10 },
            ]);

            // @ts-expect-error - Testing null handling
            const result1 = applyCategoryMappings(geminiTransaction, null);
            expect(result1.transaction.category).toBe('Other');

            // @ts-expect-error - Testing undefined handling
            const result2 = applyCategoryMappings(geminiTransaction, undefined);
            expect(result2.transaction.category).toBe('Other');
        });
    });
});
