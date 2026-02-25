/**
 * Unit Tests for sankeyThreshold
 * Story 15b-2f: Tests for extracted threshold module
 */

import { describe, it, expect } from 'vitest';
import {
    applyThreshold,
    getDefaultExpansion,
    THRESHOLD_PERCENT,
    MIN_VISIBLE_CATEGORIES,
    type CategoryAggregate,
} from '@features/analytics/utils/sankeyThreshold';

// ============================================================================
// HELPERS
// ============================================================================

function makeCat(name: string, value: number, count = 1): CategoryAggregate {
    return { name, value, count, percent: 0 };
}

// ============================================================================
// TESTS: CONSTANTS
// ============================================================================

describe('sankeyThreshold constants', () => {
    it('THRESHOLD_PERCENT is 10', () => {
        expect(THRESHOLD_PERCENT).toBe(10);
    });

    it('MIN_VISIBLE_CATEGORIES is 2', () => {
        expect(MIN_VISIBLE_CATEGORIES).toBe(2);
    });
});

// ============================================================================
// TESTS: getDefaultExpansion
// ============================================================================

describe('getDefaultExpansion', () => {
    it('returns all levels at 0', () => {
        const result = getDefaultExpansion();
        expect(result).toEqual({ level1: 0, level2: 0, level3: 0, level4: 0 });
    });

    it('returns a new object each call (mutation isolation)', () => {
        const a = getDefaultExpansion();
        const b = getDefaultExpansion();
        expect(a).not.toBe(b);
        a.level1 = 99;
        expect(b.level1).toBe(0);
    });
});

// ============================================================================
// TESTS: applyThreshold
// ============================================================================

describe('applyThreshold', () => {
    it('returns empty result for empty categories', () => {
        const result = applyThreshold([], 1000, 0);
        expect(result.visible).toEqual([]);
        expect(result.hidden).toEqual([]);
        expect(result.masNode).toBeNull();
    });

    it('returns empty result when total is 0', () => {
        const cats = [makeCat('A', 500)];
        const result = applyThreshold(cats, 0, 0);
        expect(result.visible).toEqual([]);
        expect(result.hidden).toEqual([]);
        expect(result.masNode).toBeNull();
    });

    it('shows all categories when all are above threshold', () => {
        // Each is 33% of total — all above 10%
        const cats = [makeCat('A', 3000), makeCat('B', 3000), makeCat('C', 4000)];
        const result = applyThreshold(cats, 10000, 0);

        expect(result.visible).toHaveLength(3);
        expect(result.hidden).toHaveLength(0);
        expect(result.masNode).toBeNull();
    });

    it('filters categories below threshold with Más node', () => {
        // A=60%, B=30%, C=5%, D=3%, E=2% of total
        const cats = [
            makeCat('A', 6000), makeCat('B', 3000), makeCat('C', 500),
            makeCat('D', 300), makeCat('E', 200),
        ];
        const total = 10000;
        const result = applyThreshold(cats, total, 0);

        // A and B are above threshold (>=10%)
        // C is the first below-threshold shown (highest below 10%)
        // D and E are hidden
        const visibleNames = result.visible.map(c => c.name);
        expect(visibleNames).toContain('A');
        expect(visibleNames).toContain('B');
        expect(visibleNames).toContain('C');
        expect(result.hidden).toHaveLength(2);
        expect(result.masNode).not.toBeNull();
        expect(result.masNode!.name).toBe('Más');
        expect(result.masNode!.value).toBe(500); // D + E
        expect(result.masNode!.count).toBe(2);
    });

    it('calculates masNode percent correctly', () => {
        const cats = [
            makeCat('A', 8000), makeCat('B', 500), makeCat('C', 300),
            makeCat('D', 200),
        ];
        const total = 9000;
        const result = applyThreshold(cats, total, 0);

        // A above threshold, B first below threshold (visible), C+D hidden → masNode
        // masNode covers C+D = 500
        expect(result.masNode).not.toBeNull();
        expect(result.masNode!.value).toBe(500);
        expect(result.masNode!.percent).toBeCloseTo((500 / 9000) * 100, 1);
    });

    it('expansion reveals more hidden categories', () => {
        const cats = [
            makeCat('A', 8000), makeCat('B', 800), makeCat('C', 600),
            makeCat('D', 400), makeCat('E', 200),
        ];
        const total = 10000;

        // expansionCount=0: A visible (above 10%), B first below shown, C+D+E hidden
        const r0 = applyThreshold(cats, total, 0);
        const visibleNames0 = r0.visible.map(c => c.name);
        expect(visibleNames0).toContain('A');
        expect(visibleNames0).toContain('B');

        // expansionCount=2: shows 1+2=3 below threshold
        const r2 = applyThreshold(cats, total, 2);
        expect(r2.visible.length).toBeGreaterThan(r0.visible.length);
    });

    it('guarantees MIN_VISIBLE_CATEGORIES when none above threshold', () => {
        // All categories are below 10%: 4%, 3%, 2%, 1%
        const cats = [
            makeCat('A', 400), makeCat('B', 300),
            makeCat('C', 200), makeCat('D', 100),
        ];
        const total = 10000;
        const result = applyThreshold(cats, total, 0);

        // Should show at least MIN_VISIBLE_CATEGORIES (2) even though none are >=10%
        expect(result.visible.length).toBeGreaterThanOrEqual(MIN_VISIBLE_CATEGORIES);
    });

    it('sorts by value descending', () => {
        const cats = [makeCat('Small', 1000), makeCat('Large', 5000), makeCat('Medium', 3000)];
        const result = applyThreshold(cats, 10000, 0);

        // All above threshold so all visible, should be sorted desc
        const values = result.visible.map(c => c.value);
        for (let i = 1; i < values.length; i++) {
            expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
        }
    });

    it('sets percent field on visible categories', () => {
        const cats = [makeCat('A', 7000), makeCat('B', 3000)];
        const result = applyThreshold(cats, 10000, 0);

        const catA = result.visible.find(c => c.name === 'A');
        expect(catA?.percent).toBeCloseTo(70, 1);
        const catB = result.visible.find(c => c.name === 'B');
        expect(catB?.percent).toBeCloseTo(30, 1);
    });
});
