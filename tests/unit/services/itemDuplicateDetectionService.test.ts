/**
 * Item Duplicate Detection Service Tests
 * Story 14.31: Items History View - Session 2
 */

import { describe, it, expect } from 'vitest';
import {
    normalizeForDuplicateDetection,
    areNamesIdentical,
    findItemDuplicates,
    getItemDuplicateIds,
    getItemDuplicateCount,
    filterToDuplicates,
    hasPotentialDuplicates,
    extractNumbers,
    haveSameNumbers,
} from '../../../src/services/itemDuplicateDetectionService';
import type { FlattenedItem } from '../../../src/types/item';

// Helper to create test items
function createItem(
    id: string,
    name: string,
    merchantName: string,
    price = 100
): FlattenedItem {
    return {
        id,
        name,
        price,
        qty: 1,
        transactionId: `tx-${id}`,
        transactionDate: '2024-01-01',
        merchantName,
    };
}

describe('itemDuplicateDetectionService', () => {
    describe('normalizeForDuplicateDetection', () => {
        it('should lowercase and trim', () => {
            expect(normalizeForDuplicateDetection('  LECHE ENTERA  ')).toBe('leche entera');
        });

        it('should collapse multiple spaces', () => {
            expect(normalizeForDuplicateDetection('ARROZ   INTEGRAL   1KG')).toBe('arroz integral 1kg');
        });

        it('should remove punctuation', () => {
            expect(normalizeForDuplicateDetection('LECHE (1L):')).toBe('leche 1l');
        });

        it('should replace hyphens with spaces', () => {
            expect(normalizeForDuplicateDetection('PAN-INTEGRAL-500G')).toBe('pan integral 500g');
        });
    });

    describe('areNamesIdentical', () => {
        it('should return true for same name with different case', () => {
            expect(areNamesIdentical('LECHE ENTERA', 'leche entera')).toBe(true);
        });

        it('should return true for same name with extra spaces', () => {
            expect(areNamesIdentical('LECHE  ENTERA', 'LECHE ENTERA')).toBe(true);
        });

        it('should return false for different names', () => {
            expect(areNamesIdentical('LECHE ENTERA', 'LECHE DESCREMADA')).toBe(false);
        });
    });

    describe('extractNumbers', () => {
        it('should extract numbers from item names', () => {
            expect(extractNumbers('WHISKY 40 700CC')).toEqual([40, 700]);
        });

        it('should return empty array for names without numbers', () => {
            expect(extractNumbers('LECHE ENTERA')).toEqual([]);
        });

        it('should extract all numbers', () => {
            expect(extractNumbers('ARROZ 1KG 2 UNIDADES')).toEqual([1, 2]);
        });
    });

    describe('haveSameNumbers', () => {
        it('should return true for same numbers', () => {
            expect(haveSameNumbers('WHISKY 40 700CC', 'Whisky 40 700cc')).toBe(true);
        });

        it('should return false for different sizes', () => {
            expect(haveSameNumbers('WHISKY 40 700CC', 'WHISKY 40 750CC')).toBe(false);
        });

        it('should return true for names without numbers', () => {
            expect(haveSameNumbers('LECHE ENTERA', 'Leche Entera')).toBe(true);
        });

        it('should return false for different number counts', () => {
            expect(haveSameNumbers('ARROZ 1KG', 'ARROZ 1KG 2 UNIDADES')).toBe(false);
        });
    });

    describe('findItemDuplicates', () => {
        it('should return empty map for empty array', () => {
            const result = findItemDuplicates([]);
            expect(result.size).toBe(0);
        });

        it('should return empty map for single item', () => {
            const items = [createItem('1', 'LECHE ENTERA', 'Supermarket')];
            const result = findItemDuplicates(items);
            expect(result.size).toBe(0);
        });

        it('should detect duplicates with same name different case in same store', () => {
            const items = [
                createItem('1', 'LECHE ENTERA 1L', 'Supermarket'),
                createItem('2', 'Leche Entera 1L', 'Supermarket'),
            ];
            const result = findItemDuplicates(items);
            expect(result.size).toBe(2);
            expect(result.get('1')).toContain('2');
            expect(result.get('2')).toContain('1');
        });

        it('should NOT detect duplicates if different stores', () => {
            const items = [
                createItem('1', 'LECHE ENTERA 1L', 'Store A'),
                createItem('2', 'Leche Entera 1L', 'Store B'),
            ];
            const result = findItemDuplicates(items);
            expect(result.size).toBe(0);
        });

        it('should detect duplicates with extra spaces', () => {
            const items = [
                createItem('1', 'ARROZ INTEGRAL 1KG', 'Supermarket'),
                createItem('2', 'ARROZ  INTEGRAL  1KG', 'Supermarket'),
            ];
            const result = findItemDuplicates(items);
            expect(result.size).toBe(2);
        });

        it('should NOT flag items with identical names (no variation)', () => {
            // If names are exactly the same after normalization AND the original names are the same,
            // they're not duplicates - they're the same product purchased multiple times
            const items = [
                createItem('1', 'LECHE ENTERA 1L', 'Supermarket'),
                createItem('2', 'LECHE ENTERA 1L', 'Supermarket'),
            ];
            const result = findItemDuplicates(items);
            // Same exact name shouldn't be flagged as duplicate (user may have bought same item twice)
            expect(result.size).toBe(0);
        });

        it('should skip very short names', () => {
            const items = [
                createItem('1', 'AB', 'Supermarket'),
                createItem('2', 'ab', 'Supermarket'),
            ];
            const result = findItemDuplicates(items);
            expect(result.size).toBe(0);
        });

        it('should NOT flag items with different sizes as duplicates', () => {
            // Real-world case: WHISKY 40 700CC vs WHISKY 40 750CC are different products
            const items = [
                createItem('1', 'WHISKY 40 700CC', 'CENCOSUD RETAIL SA'),
                createItem('2', 'WHISKY 40 750CC', 'CENCOSUD RETAIL SA'),
            ];
            const result = findItemDuplicates(items);
            expect(result.size).toBe(0);
        });

        it('should flag items with same numbers but different case as duplicates', () => {
            const items = [
                createItem('1', 'WHISKY 40 700CC', 'CENCOSUD RETAIL SA'),
                createItem('2', 'Whisky 40 700cc', 'CENCOSUD RETAIL SA'),
            ];
            const result = findItemDuplicates(items);
            expect(result.size).toBe(2);
        });
    });

    describe('getItemDuplicateIds', () => {
        it('should return set of duplicate item IDs', () => {
            const items = [
                createItem('1', 'LECHE ENTERA', 'Store'),
                createItem('2', 'Leche Entera', 'Store'),
                createItem('3', 'PAN INTEGRAL', 'Store'),
            ];
            const result = getItemDuplicateIds(items);
            expect(result.has('1')).toBe(true);
            expect(result.has('2')).toBe(true);
            expect(result.has('3')).toBe(false);
        });
    });

    describe('getItemDuplicateCount', () => {
        it('should return count of items with duplicates', () => {
            const items = [
                createItem('1', 'LECHE ENTERA', 'Store'),
                createItem('2', 'Leche Entera', 'Store'),
                createItem('3', 'PAN INTEGRAL', 'Store'),
            ];
            expect(getItemDuplicateCount(items)).toBe(2);
        });

        it('should return 0 for no duplicates', () => {
            const items = [
                createItem('1', 'LECHE ENTERA', 'Store'),
                createItem('2', 'PAN INTEGRAL', 'Store'),
            ];
            expect(getItemDuplicateCount(items)).toBe(0);
        });
    });

    describe('filterToDuplicates', () => {
        it('should return only items with duplicates', () => {
            const items = [
                createItem('1', 'LECHE ENTERA', 'Store'),
                createItem('2', 'Leche Entera', 'Store'),
                createItem('3', 'PAN INTEGRAL', 'Store'),
            ];
            const result = filterToDuplicates(items);
            expect(result.length).toBe(2);
            expect(result.map(i => i.id)).toContain('1');
            expect(result.map(i => i.id)).toContain('2');
            expect(result.map(i => i.id)).not.toContain('3');
        });
    });

    describe('hasPotentialDuplicates', () => {
        it('should return true when duplicates exist', () => {
            const items = [
                createItem('1', 'LECHE ENTERA', 'Store'),
                createItem('2', 'Leche Entera', 'Store'),
            ];
            expect(hasPotentialDuplicates(items)).toBe(true);
        });

        it('should return false when no duplicates exist', () => {
            const items = [
                createItem('1', 'LECHE ENTERA', 'Store'),
                createItem('2', 'PAN INTEGRAL', 'Store'),
            ];
            expect(hasPotentialDuplicates(items)).toBe(false);
        });
    });
});
