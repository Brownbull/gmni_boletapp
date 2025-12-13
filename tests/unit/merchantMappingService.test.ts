/**
 * Merchant Mapping Service Unit Tests
 *
 * Tests for the normalizeMerchantName function.
 * These are pure unit tests without Firebase dependencies.
 *
 * Story 9.4 - Merchant Mapping Infrastructure
 * AC #4: normalizeMerchantName() function normalizes merchant names for matching
 * AC #6: Unit tests for merchantMappingService
 */

import { describe, it, expect } from 'vitest'
import { normalizeMerchantName } from '../../src/services/merchantMappingService'

describe('normalizeMerchantName', () => {
    describe('basic transformations', () => {
        it('should convert to lowercase', () => {
            expect(normalizeMerchantName('UBER EATS')).toBe('uber eats')
            expect(normalizeMerchantName('Walmart')).toBe('walmart')
            expect(normalizeMerchantName('COSTCO')).toBe('costco')
        })

        it('should trim whitespace', () => {
            expect(normalizeMerchantName('  uber  ')).toBe('uber')
            expect(normalizeMerchantName('\ttaxi\n')).toBe('taxi')
            expect(normalizeMerchantName('   test   ')).toBe('test')
        })

        it('should collapse multiple spaces', () => {
            expect(normalizeMerchantName('uber   eats')).toBe('uber eats')
            expect(normalizeMerchantName('my    store   name')).toBe('my store name')
            expect(normalizeMerchantName('super    market')).toBe('super market')
        })
    })

    describe('special character handling', () => {
        it('should remove special characters', () => {
            expect(normalizeMerchantName("Café 50%")).toBe('caf 50')
            expect(normalizeMerchantName('Uber-Eats!')).toBe('ubereats')
            expect(normalizeMerchantName('#1 Store')).toBe('1 store')
            expect(normalizeMerchantName('A&B Company')).toBe('ab company')
        })

        it('should handle hyphens and underscores', () => {
            expect(normalizeMerchantName('Super-Merc #123')).toBe('supermerc 123')
            expect(normalizeMerchantName('Store_Name')).toBe('storename')
            expect(normalizeMerchantName('7-Eleven')).toBe('7eleven')
        })

        it('should handle apostrophes', () => {
            expect(normalizeMerchantName("McDonald's")).toBe('mcdonalds')
            expect(normalizeMerchantName("Trader Joe's")).toBe('trader joes')
        })

        it('should handle periods and commas', () => {
            expect(normalizeMerchantName('Co. Store')).toBe('co store')
            expect(normalizeMerchantName('Inc., Ltd.')).toBe('inc ltd')
        })
    })

    describe('unicode and international characters', () => {
        it('should handle unicode characters', () => {
            // Unicode letters get stripped, keeping only alphanumeric
            expect(normalizeMerchantName('Tienda España')).toBe('tienda espaa')
            expect(normalizeMerchantName('Café Ñoño')).toBe('caf oo')
        })

        it('should handle accented characters', () => {
            expect(normalizeMerchantName('Résumé Store')).toBe('rsum store')
            expect(normalizeMerchantName('Über Eats')).toBe('ber eats')
        })
    })

    describe('numbers', () => {
        it('should preserve numbers', () => {
            expect(normalizeMerchantName('Store 123')).toBe('store 123')
            expect(normalizeMerchantName('24 Hour Store')).toBe('24 hour store')
            expect(normalizeMerchantName('99 Cents Only')).toBe('99 cents only')
        })

        it('should handle store codes and identifiers', () => {
            expect(normalizeMerchantName('WALMART #1234')).toBe('walmart 1234')
            expect(normalizeMerchantName('TARGET STORE 5678')).toBe('target store 5678')
        })
    })

    describe('edge cases', () => {
        it('should handle empty strings', () => {
            expect(normalizeMerchantName('')).toBe('')
        })

        it('should handle whitespace-only strings', () => {
            expect(normalizeMerchantName('   ')).toBe('')
            expect(normalizeMerchantName('\t\n  ')).toBe('')
        })

        it('should handle strings with only special characters', () => {
            expect(normalizeMerchantName('!@#$%')).toBe('')
            expect(normalizeMerchantName('...')).toBe('')
        })

        it('should handle very long merchant names', () => {
            const longName = 'A'.repeat(500)
            expect(normalizeMerchantName(longName)).toBe('a'.repeat(500))
        })

        it('should handle mixed case with numbers', () => {
            expect(normalizeMerchantName('ABC123XYZ')).toBe('abc123xyz')
            expect(normalizeMerchantName('Store2Go')).toBe('store2go')
        })
    })

    describe('real-world merchant name examples', () => {
        it('should normalize common retail merchants', () => {
            expect(normalizeMerchantName('COSTCO WHOLESALE #123')).toBe('costco wholesale 123')
            expect(normalizeMerchantName('WAL-MART SUPERCENTER')).toBe('walmart supercenter')
            expect(normalizeMerchantName('TARGET T-1234')).toBe('target t1234')
        })

        it('should normalize restaurant names', () => {
            expect(normalizeMerchantName('STARBUCKS COFFEE')).toBe('starbucks coffee')
            expect(normalizeMerchantName("WENDY'S #9876")).toBe('wendys 9876')
            expect(normalizeMerchantName('TACO BELL')).toBe('taco bell')
        })

        it('should normalize gas stations', () => {
            expect(normalizeMerchantName('SHELL OIL')).toBe('shell oil')
            expect(normalizeMerchantName('CHEVRON #456')).toBe('chevron 456')
            expect(normalizeMerchantName('76 GAS STATION')).toBe('76 gas station')
        })

        it('should normalize online/tech services', () => {
            expect(normalizeMerchantName('AMAZON.COM')).toBe('amazoncom')
            expect(normalizeMerchantName('NETFLIX.COM')).toBe('netflixcom')
            expect(normalizeMerchantName('UBER *TRIP')).toBe('uber trip')
        })
    })
})
