/**
 * Tests for transaction validation predicates
 *
 * Story 15-2d: Shared validation predicates
 *
 * Test coverage:
 * - isValidItem: name + price validation
 * - hasItemWithPrice: at least one item with price > 0
 * - hasValidItems: at least one fully valid item (name + price)
 * - Edge cases: empty arrays, undefined, whitespace names, zero prices
 */

import { describe, it, expect } from 'vitest';
import {
    isValidItem,
    hasItemWithPrice,
    hasValidItems,
} from '../../../src/utils/transactionValidation';
import type { TransactionItem } from '../../../src/types/transaction';

// Helper to create minimal TransactionItem
function makeItem(overrides: Partial<TransactionItem> = {}): TransactionItem {
    return {
        name: 'Test Item',
        price: 100,
        originalName: 'Test Item',
        confidence: 0.9,
        ...overrides,
    } as TransactionItem;
}

describe('isValidItem', () => {
    it('should return true for item with name and positive price', () => {
        expect(isValidItem(makeItem({ name: 'Coffee', price: 2500 }))).toBe(true);
    });

    it('should return true for item with price of 0', () => {
        expect(isValidItem(makeItem({ name: 'Free sample', price: 0 }))).toBe(true);
    });

    it('should return false for item with empty name', () => {
        expect(isValidItem(makeItem({ name: '' }))).toBe(false);
    });

    it('should return false for item with whitespace-only name', () => {
        expect(isValidItem(makeItem({ name: '   ' }))).toBe(false);
    });

    it('should return false for item with negative price', () => {
        expect(isValidItem(makeItem({ name: 'Item', price: -1 }))).toBe(false);
    });

    it('should return false for item with NaN price', () => {
        expect(isValidItem(makeItem({ name: 'Item', price: NaN }))).toBe(false);
    });

    it('should return false for item with string price', () => {
        expect(isValidItem(makeItem({ name: 'Item', price: '100' as unknown as number }))).toBe(false);
    });

    it('should return false for item with undefined price', () => {
        expect(isValidItem(makeItem({ name: 'Item', price: undefined as unknown as number }))).toBe(false);
    });

    it('should accept item with very large price', () => {
        expect(isValidItem(makeItem({ name: 'Expensive', price: 999999999 }))).toBe(true);
    });

    it('should accept item with decimal price', () => {
        expect(isValidItem(makeItem({ name: 'Precise', price: 1234.56 }))).toBe(true);
    });
});

describe('hasItemWithPrice', () => {
    it('should return true when at least one item has price > 0', () => {
        const items = [
            makeItem({ name: '', price: 0 }),
            makeItem({ name: 'Coffee', price: 2500 }),
        ];
        expect(hasItemWithPrice(items)).toBe(true);
    });

    it('should return false when all items have price 0', () => {
        const items = [
            makeItem({ price: 0 }),
            makeItem({ price: 0 }),
        ];
        expect(hasItemWithPrice(items)).toBe(false);
    });

    it('should return false for empty array', () => {
        expect(hasItemWithPrice([])).toBe(false);
    });

    it('should return false for undefined', () => {
        expect(hasItemWithPrice(undefined)).toBe(false);
    });

    it('should return true for single item with price > 0', () => {
        expect(hasItemWithPrice([makeItem({ price: 1 })])).toBe(true);
    });

    it('should ignore name validity — only checks price', () => {
        const items = [makeItem({ name: '', price: 100 })];
        expect(hasItemWithPrice(items)).toBe(true);
    });

    it('should return false when items have negative prices only', () => {
        const items = [makeItem({ price: -100 })];
        expect(hasItemWithPrice(items)).toBe(false);
    });
});

describe('hasValidItems', () => {
    it('should return true when at least one item is fully valid', () => {
        const items = [
            makeItem({ name: '', price: 0 }),     // invalid (no name)
            makeItem({ name: 'Coffee', price: 0 }), // valid (name + price >= 0)
        ];
        expect(hasValidItems(items)).toBe(true);
    });

    it('should return false when no items are valid', () => {
        const items = [
            makeItem({ name: '', price: 100 }),    // invalid (no name)
            makeItem({ name: '  ', price: 100 }),  // invalid (whitespace name)
        ];
        expect(hasValidItems(items)).toBe(false);
    });

    it('should return false for empty array', () => {
        expect(hasValidItems([])).toBe(false);
    });

    it('should return false for undefined', () => {
        expect(hasValidItems(undefined)).toBe(false);
    });

    it('should return false for non-array value', () => {
        expect(hasValidItems('not-array' as unknown as TransactionItem[])).toBe(false);
    });

    it('should return true when all items are valid', () => {
        const items = [
            makeItem({ name: 'A', price: 100 }),
            makeItem({ name: 'B', price: 200 }),
        ];
        expect(hasValidItems(items)).toBe(true);
    });

    it('should use strict validation (requires both name and price)', () => {
        // Has price but no name — not valid for hasValidItems
        const items = [makeItem({ name: '', price: 500 })];
        expect(hasValidItems(items)).toBe(false);

        // Has name but negative price — not valid
        const items2 = [makeItem({ name: 'Item', price: -1 })];
        expect(hasValidItems(items2)).toBe(false);
    });
});
