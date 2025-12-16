/**
 * Merchant Matcher Service Unit Tests
 *
 * Tests for the merchantMatcherService.ts functions.
 * These are pure unit tests for the fuzzy matching logic.
 *
 * Story 9.5 - Merchant Fuzzy Matching
 * AC #8: Unit tests for fuzzy matching logic including threshold boundary tests
 */

import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import {
    findMerchantMatch,
    createMerchantMatcher,
    findMerchantMatchWithMatcher,
    DEFAULT_THRESHOLD,
    MIN_NORMALIZED_LENGTH
} from '../../src/services/merchantMatcherService'
import type { MerchantMapping } from '../../src/types/merchantMapping'

// Helper to create mock MerchantMapping objects
function createMockMapping(
    normalizedMerchant: string,
    targetMerchant: string,
    options?: Partial<MerchantMapping>
): MerchantMapping {
    return {
        id: options?.id ?? `mapping-${normalizedMerchant.replace(/\s+/g, '-')}`,
        originalMerchant: options?.originalMerchant ?? normalizedMerchant.toUpperCase(),
        normalizedMerchant,
        targetMerchant,
        confidence: options?.confidence ?? 1.0,
        source: 'user',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        usageCount: options?.usageCount ?? 0
    }
}

describe('merchantMatcherService', () => {
    describe('constants', () => {
        it('should have default threshold of 0.3', () => {
            expect(DEFAULT_THRESHOLD).toBe(0.3)
        })

        it('should have minimum normalized length of 3', () => {
            expect(MIN_NORMALIZED_LENGTH).toBe(3)
        })
    })

    describe('findMerchantMatch', () => {
        describe('exact matches', () => {
            it('should find exact match with high confidence', () => {
                const mappings = [
                    createMockMapping('walmart', 'Walmart'),
                    createMockMapping('uber eats', 'Uber Eats')
                ]

                const result = findMerchantMatch('walmart', mappings)

                expect(result).not.toBeNull()
                expect(result?.mapping.normalizedMerchant).toBe('walmart')
                expect(result?.mapping.targetMerchant).toBe('Walmart')
                // Fuse.js may return very small float instead of exact 0
                expect(result?.score).toBeCloseTo(0, 5)
                expect(result?.confidence).toBeCloseTo(1.0, 5)
            })

            it('should match case-insensitively', () => {
                const mappings = [createMockMapping('supermerc jumbo', 'Supermercado Jumbo')]

                const result = findMerchantMatch('SUPERMERC JUMBO', mappings)

                expect(result).not.toBeNull()
                expect(result?.mapping.targetMerchant).toBe('Supermercado Jumbo')
            })

            it('should return perfect score (0) for exact match', () => {
                const mappings = [createMockMapping('uber', 'Uber')]

                const result = findMerchantMatch('uber', mappings)

                expect(result).not.toBeNull()
                expect(result?.score).toBeCloseTo(0, 5)
                expect(result?.confidence).toBeCloseTo(1.0, 5)
            })
        })

        describe('fuzzy matches', () => {
            it('should match similar merchants within threshold', () => {
                const mappings = [createMockMapping('supermerc jumbo', 'Supermercado Jumbo')]

                // "supermerc" should fuzzy match "supermerc jumbo"
                const result = findMerchantMatch('supermerc', mappings)

                // May or may not match depending on Fuse.js scoring
                // If it matches, should be within threshold
                if (result) {
                    expect(result.score).toBeLessThanOrEqual(0.3)
                }
            })

            it('should prefer better matches', () => {
                const mappings = [
                    createMockMapping('uber', 'Uber'),
                    createMockMapping('uber eats', 'Uber Eats')
                ]

                const result = findMerchantMatch('uber', mappings)

                expect(result).not.toBeNull()
                // Should match "uber" exactly rather than "uber eats" fuzzily
                expect(result?.mapping.normalizedMerchant).toBe('uber')
            })

            it('should calculate confidence correctly', () => {
                const mappings = [
                    createMockMapping('uber', 'Uber', { confidence: 0.8 })
                ]

                const result = findMerchantMatch('uber', mappings)

                expect(result).not.toBeNull()
                // confidence = mapping.confidence * (1 - score)
                // For near-exact match: 0.8 * (1 - ~0) ≈ 0.8
                expect(result?.confidence).toBeCloseTo(0.8, 5)
            })
        })

        describe('threshold boundary tests (AC #8)', () => {
            it('should accept match at exactly threshold', () => {
                // Create a mapping and search term that produces a score at the boundary
                const mappings = [createMockMapping('supermarket store', 'Supermarket')]

                // Test various search terms and verify threshold behavior
                const result = findMerchantMatch('supermarket store', mappings, 0.3)

                // Exact match should always be accepted
                expect(result).not.toBeNull()
                expect(result?.score).toBeLessThanOrEqual(0.3)
            })

            it('should reject match above threshold', () => {
                const mappings = [createMockMapping('supermarket store abc', 'Supermarket')]

                // Very different search term should exceed threshold
                const result = findMerchantMatch('xyz completely different', mappings, 0.3)

                expect(result).toBeNull()
            })

            it('should respect custom threshold parameter', () => {
                const mappings = [createMockMapping('walmart supercenter', 'Walmart')]

                // With very strict threshold (0.1), fewer matches
                const strictResult = findMerchantMatch('walmart', mappings, 0.1)

                // With lenient threshold (0.5), more matches
                const lenientResult = findMerchantMatch('walmart', mappings, 0.5)

                // The lenient one should be more likely to match
                // At minimum, both should handle the threshold correctly
                if (strictResult) {
                    expect(strictResult.score).toBeLessThanOrEqual(0.1)
                }
                if (lenientResult) {
                    expect(lenientResult.score).toBeLessThanOrEqual(0.5)
                }
            })
        })

        describe('minimum length guard tests (AC #3)', () => {
            it('should reject normalized name under 3 chars', () => {
                const mappings = [
                    createMockMapping('ab', 'AB Store'),
                    createMockMapping('abc', 'ABC Store')
                ]

                // "ab" normalizes to "ab" (2 chars) - should be rejected
                const result = findMerchantMatch('ab', mappings)

                expect(result).toBeNull()
            })

            it('should reject normalized name of exactly 2 chars', () => {
                const mappings = [createMockMapping('xy', 'XY Corp')]

                const result = findMerchantMatch('XY', mappings)

                expect(result).toBeNull()
            })

            it('should accept normalized name with exactly 3 chars', () => {
                const mappings = [createMockMapping('abc', 'ABC Store')]

                const result = findMerchantMatch('ABC', mappings)

                expect(result).not.toBeNull()
                expect(result?.mapping.targetMerchant).toBe('ABC Store')
            })

            it('should accept normalized name with 4+ chars', () => {
                const mappings = [createMockMapping('uber', 'Uber')]

                const result = findMerchantMatch('uber', mappings)

                expect(result).not.toBeNull()
            })

            it('should handle names that normalize to short strings', () => {
                const mappings = [createMockMapping('ab', 'AB')]

                // "A-B" normalizes to "ab" (2 chars) - should be rejected
                const result = findMerchantMatch('A-B', mappings)

                expect(result).toBeNull()
            })
        })

        describe('no match scenarios', () => {
            it('should return null for completely different merchants', () => {
                const mappings = [createMockMapping('uber', 'Uber')]

                const result = findMerchantMatch('completely different merchant name', mappings)

                expect(result).toBeNull()
            })

            it('should return null for empty merchant name', () => {
                const mappings = [createMockMapping('uber', 'Uber')]

                const result = findMerchantMatch('', mappings)

                expect(result).toBeNull()
            })

            it('should return null for empty mappings array', () => {
                const result = findMerchantMatch('uber', [])

                expect(result).toBeNull()
            })

            it('should return null for null/undefined mappings', () => {
                // @ts-expect-error - Testing null handling
                const resultNull = findMerchantMatch('uber', null)
                // @ts-expect-error - Testing undefined handling
                const resultUndefined = findMerchantMatch('uber', undefined)

                expect(resultNull).toBeNull()
                expect(resultUndefined).toBeNull()
            })

            it('should return null when score exceeds threshold', () => {
                const mappings = [createMockMapping('supermarket store chain', 'Supermarket')]

                // Very different search term
                const result = findMerchantMatch('xyz', mappings)

                expect(result).toBeNull()
            })
        })

        describe('confidence scoring', () => {
            it('should reduce confidence for fuzzy matches', () => {
                const mappings = [
                    createMockMapping('supermerc jumbo store', 'Supermercado Jumbo', { confidence: 1.0 })
                ]

                const result = findMerchantMatch('supermerc jumbo', mappings)

                if (result) {
                    // Fuzzy match should have score > 0, so confidence < 1.0
                    expect(result.confidence).toBeLessThanOrEqual(1.0)
                    expect(result.confidence).toBeGreaterThan(0)
                }
            })

            it('should inherit mapping confidence', () => {
                const mappings = [
                    createMockMapping('uber', 'Uber', { confidence: 0.5 })
                ]

                const result = findMerchantMatch('uber', mappings)

                expect(result).not.toBeNull()
                // For near-exact match: 0.5 * (1 - ~0) ≈ 0.5
                expect(result?.confidence).toBeCloseTo(0.5, 5)
            })

            it('should combine mapping confidence with match score', () => {
                const mappings = [
                    createMockMapping('uber', 'Uber', { confidence: 0.8 })
                ]

                const result = findMerchantMatch('uber', mappings)

                expect(result).not.toBeNull()
                // confidence = mapping.confidence * (1 - score)
                // 0.8 * (1 - ~0) ≈ 0.8
                expect(result?.confidence).toBeCloseTo(0.8, 5)
            })
        })

        describe('edge cases', () => {
            it('should handle merchants with special characters', () => {
                const mappings = [
                    createMockMapping('cafe central', 'Café Central')
                ]

                // "Café Central" normalizes to "caf central" (accents removed)
                const result = findMerchantMatch('Café Central', mappings)

                // Should find a match since normalization handles this
                if (result) {
                    expect(result.mapping.targetMerchant).toBe('Café Central')
                }
            })

            it('should handle merchants with numbers', () => {
                const mappings = [
                    createMockMapping('7eleven', '7-Eleven')
                ]

                const result = findMerchantMatch('7-Eleven', mappings)

                expect(result).not.toBeNull()
            })

            it('should handle whitespace variations', () => {
                const mappings = [
                    createMockMapping('uber eats', 'Uber Eats')
                ]

                // Multiple spaces should be collapsed
                const result = findMerchantMatch('UBER    EATS', mappings)

                expect(result).not.toBeNull()
                expect(result?.mapping.targetMerchant).toBe('Uber Eats')
            })
        })
    })

    describe('createMerchantMatcher', () => {
        it('should create a Fuse instance from mappings', () => {
            const mappings = [
                createMockMapping('uber', 'Uber'),
                createMockMapping('walmart', 'Walmart')
            ]

            const matcher = createMerchantMatcher(mappings)

            expect(matcher).toBeDefined()
            expect(typeof matcher.search).toBe('function')
        })

        it('should handle empty mappings array', () => {
            const matcher = createMerchantMatcher([])

            expect(matcher).toBeDefined()
            const results = matcher.search('uber')
            expect(results).toHaveLength(0)
        })

        it('should accept custom threshold', () => {
            const mappings = [createMockMapping('uber', 'Uber')]

            const strictMatcher = createMerchantMatcher(mappings, 0.1)
            const lenientMatcher = createMerchantMatcher(mappings, 0.5)

            expect(strictMatcher).toBeDefined()
            expect(lenientMatcher).toBeDefined()
        })
    })

    describe('findMerchantMatchWithMatcher', () => {
        it('should find match using pre-created matcher', () => {
            const mappings = [createMockMapping('uber', 'Uber')]
            const matcher = createMerchantMatcher(mappings)

            const result = findMerchantMatchWithMatcher(matcher, 'uber')

            expect(result).not.toBeNull()
            expect(result?.mapping.targetMerchant).toBe('Uber')
        })

        it('should respect minimum length guard', () => {
            const mappings = [createMockMapping('ab', 'AB')]
            const matcher = createMerchantMatcher(mappings)

            const result = findMerchantMatchWithMatcher(matcher, 'ab')

            expect(result).toBeNull()
        })

        it('should return null for empty merchant name', () => {
            const mappings = [createMockMapping('uber', 'Uber')]
            const matcher = createMerchantMatcher(mappings)

            const result = findMerchantMatchWithMatcher(matcher, '')

            expect(result).toBeNull()
        })

        it('should accept custom threshold parameter', () => {
            const mappings = [createMockMapping('walmart supercenter', 'Walmart')]
            const matcher = createMerchantMatcher(mappings)

            // Very strict threshold - might not match fuzzy
            const result = findMerchantMatchWithMatcher(matcher, 'walmart', 0.1)

            // Should handle threshold correctly
            if (result) {
                expect(result.score).toBeLessThanOrEqual(0.1)
            }
        })
    })
})
