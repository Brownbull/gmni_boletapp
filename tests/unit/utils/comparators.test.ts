/**
 * Tests for reusable sort comparators
 *
 * Story 15-2e: Typed sort comparators
 */

import { describe, it, expect } from 'vitest';
import {
    byNumberDesc,
    byNumberAsc,
    byStringAsc,
    byStringDesc,
    numericAsc,
    numericDesc,
    stringAsc,
    stringDesc,
    byAbsDesc,
    compose,
} from '../../../src/utils/comparators';

interface Item {
    name: string;
    amount: number;
    date: string;
    priority: number;
}

const items: Item[] = [
    { name: 'Banana', amount: 200, date: '2024-01-15', priority: 1 },
    { name: 'Apple', amount: 500, date: '2024-01-10', priority: 3 },
    { name: 'Cherry', amount: 200, date: '2024-01-20', priority: 2 },
];

describe('byNumberDesc', () => {
    it('should sort by numeric field descending', () => {
        const sorted = [...items].sort(byNumberDesc('amount'));
        expect(sorted.map((i) => i.amount)).toEqual([500, 200, 200]);
        expect(sorted[0].name).toBe('Apple');
    });

    it('should handle equal values (stable sort)', () => {
        const sorted = [...items].sort(byNumberDesc('amount'));
        const ties = sorted.filter((i) => i.amount === 200);
        expect(ties).toHaveLength(2);
    });
});

describe('byNumberAsc', () => {
    it('should sort by numeric field ascending', () => {
        const sorted = [...items].sort(byNumberAsc('amount'));
        expect(sorted.map((i) => i.amount)).toEqual([200, 200, 500]);
    });

    it('should sort by priority ascending', () => {
        const sorted = [...items].sort(byNumberAsc('priority'));
        expect(sorted.map((i) => i.priority)).toEqual([1, 2, 3]);
    });
});

describe('byStringAsc', () => {
    it('should sort by string field ascending', () => {
        const sorted = [...items].sort(byStringAsc('name'));
        expect(sorted.map((i) => i.name)).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('should sort dates ascending', () => {
        const sorted = [...items].sort(byStringAsc('date'));
        expect(sorted.map((i) => i.date)).toEqual(['2024-01-10', '2024-01-15', '2024-01-20']);
    });

    it('should support locale parameter', () => {
        const spanishItems = [
            { name: 'ñandú', amount: 0, date: '', priority: 0 },
            { name: 'nido', amount: 0, date: '', priority: 0 },
            { name: 'obra', amount: 0, date: '', priority: 0 },
        ];
        const sorted = spanishItems.sort(byStringAsc('name', 'es'));
        expect(sorted[0].name).toBe('nido');
    });
});

describe('byStringDesc', () => {
    it('should sort by string field descending', () => {
        const sorted = [...items].sort(byStringDesc('name'));
        expect(sorted.map((i) => i.name)).toEqual(['Cherry', 'Banana', 'Apple']);
    });

    it('should sort dates descending', () => {
        const sorted = [...items].sort(byStringDesc('date'));
        expect(sorted.map((i) => i.date)).toEqual(['2024-01-20', '2024-01-15', '2024-01-10']);
    });
});

describe('numericAsc / numericDesc', () => {
    it('should sort number arrays ascending', () => {
        expect([3, 1, 2].sort(numericAsc)).toEqual([1, 2, 3]);
    });

    it('should sort number arrays descending', () => {
        expect([3, 1, 2].sort(numericDesc)).toEqual([3, 2, 1]);
    });

    it('should handle negative numbers', () => {
        expect([-1, 5, -3, 2].sort(numericAsc)).toEqual([-3, -1, 2, 5]);
    });
});

describe('stringAsc / stringDesc', () => {
    it('should sort string arrays ascending', () => {
        expect(['c', 'a', 'b'].sort(stringAsc())).toEqual(['a', 'b', 'c']);
    });

    it('should sort string arrays descending', () => {
        expect(['c', 'a', 'b'].sort(stringDesc())).toEqual(['c', 'b', 'a']);
    });

    it('should support locale', () => {
        const sorted = ['ñ', 'n', 'o'].sort(stringAsc('es'));
        expect(sorted[0]).toBe('n');
    });
});

describe('byAbsDesc', () => {
    it('should sort by absolute value descending', () => {
        const changes = [
            { name: 'A', change: -50, amount: 0, date: '', priority: 0 },
            { name: 'B', change: 30, amount: 0, date: '', priority: 0 },
            { name: 'C', change: -80, amount: 0, date: '', priority: 0 },
        ];
        const sorted = changes.sort(byAbsDesc('change'));
        expect(sorted.map((c) => c.change)).toEqual([-80, -50, 30]);
    });
});

describe('compose', () => {
    it('should sort by primary then secondary key', () => {
        const sorted = [...items].sort(
            compose(byNumberDesc('amount'), byStringAsc('name'))
        );
        // Apple (500) first, then Banana/Cherry (200) alphabetically
        expect(sorted.map((i) => i.name)).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('should handle single comparator', () => {
        const sorted = [...items].sort(compose(byStringAsc('name')));
        expect(sorted.map((i) => i.name)).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('should handle three comparators', () => {
        const data = [
            { name: 'A', amount: 100, date: '2024-01', priority: 2 },
            { name: 'B', amount: 100, date: '2024-01', priority: 1 },
            { name: 'C', amount: 100, date: '2024-02', priority: 1 },
        ];
        const sorted = data.sort(
            compose(
                byNumberDesc('amount'),
                byStringDesc('date'),
                byNumberAsc('priority')
            )
        );
        // All same amount, then by date desc (C first), then by priority asc
        expect(sorted.map((d) => d.name)).toEqual(['C', 'B', 'A']);
    });

    it('should return 0 when all comparators return equal', () => {
        const data = [
            { name: 'A', amount: 100, date: '', priority: 0 },
            { name: 'A', amount: 100, date: '', priority: 0 },
        ];
        const cmp = compose(byNumberDesc('amount'), byStringAsc('name'));
        expect(cmp(data[0], data[1])).toBe(0);
    });
});
