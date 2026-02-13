/**
 * duplicateGrouping Tests
 *
 * Story 15-TD-3: Tests for Union-Find grouping and filter-and-group pipeline.
 */

import { describe, it, expect } from 'vitest';
import { buildDuplicateGroups, filterAndGroupDuplicates } from '../../../src/utils/duplicateGrouping';

describe('buildDuplicateGroups', () => {
    it('returns empty array for empty map', () => {
        const result = buildDuplicateGroups(new Map());
        expect(result).toEqual([]);
    });

    it('creates a single group for one entity with duplicates', () => {
        const map = new Map([['a', ['b', 'c']]]);
        const groups = buildDuplicateGroups(map);

        expect(groups).toHaveLength(1);
        expect(groups[0]).toEqual(new Set(['a', 'b', 'c']));
    });

    it('creates separate groups for unrelated entities', () => {
        const map = new Map([
            ['a', ['b']],
            ['c', ['d']],
        ]);
        const groups = buildDuplicateGroups(map);

        expect(groups).toHaveLength(2);
        const allIds = groups.flatMap(g => Array.from(g));
        expect(allIds).toHaveLength(4);
        expect(new Set(allIds)).toEqual(new Set(['a', 'b', 'c', 'd']));
    });

    it('merges transitive duplicates into one group', () => {
        // a->b, b->c means a, b, c are all in one group
        const map = new Map([
            ['a', ['b']],
            ['b', ['c']],
        ]);
        const groups = buildDuplicateGroups(map);

        expect(groups).toHaveLength(1);
        expect(groups[0]).toEqual(new Set(['a', 'b', 'c']));
    });

    it('merges groups when a new entry bridges two existing groups', () => {
        // a->b and c->d are separate, then e->b,d bridges them
        const map = new Map([
            ['a', ['b']],
            ['c', ['d']],
            ['e', ['b', 'd']],
        ]);
        const groups = buildDuplicateGroups(map);

        expect(groups).toHaveLength(1);
        expect(groups[0]).toEqual(new Set(['a', 'b', 'c', 'd', 'e']));
    });

    it('handles self-referencing duplicate (entity is its own duplicate)', () => {
        const map = new Map([['a', ['a']]]);
        const groups = buildDuplicateGroups(map);

        expect(groups).toHaveLength(1);
        expect(groups[0]).toEqual(new Set(['a']));
    });

    it('handles entity with empty duplicates array', () => {
        const map = new Map([['a', []]]);
        const groups = buildDuplicateGroups(map);

        expect(groups).toHaveLength(1);
        expect(groups[0]).toEqual(new Set(['a']));
    });
});

describe('filterAndGroupDuplicates', () => {
    interface TestItem {
        id: string;
        name: string;
        date: number;
    }

    const getId = (item: TestItem) => item.id;
    const sortGroups = (a: TestItem | undefined, b: TestItem | undefined) =>
        (a?.date ?? 0) - (b?.date ?? 0);
    const sortWithin = (a: TestItem, b: TestItem) => a.date - b.date;

    it('returns empty array when duplicateMap is empty', () => {
        const items: TestItem[] = [{ id: '1', name: 'A', date: 100 }];
        const result = filterAndGroupDuplicates(items, new Map(), getId, sortGroups, sortWithin);
        expect(result).toEqual([]);
    });

    it('returns only items that appear in duplicate groups', () => {
        const items: TestItem[] = [
            { id: '1', name: 'A', date: 100 },
            { id: '2', name: 'B', date: 200 },
            { id: '3', name: 'C', date: 300 },
        ];
        const dupeMap = new Map([['1', ['2']]]);

        const result = filterAndGroupDuplicates(items, dupeMap, getId, sortGroups, sortWithin);

        const resultIds = result.map(r => r.id);
        expect(resultIds).toContain('1');
        expect(resultIds).toContain('2');
        expect(resultIds).not.toContain('3');
    });

    it('groups duplicates together in sorted order', () => {
        const items: TestItem[] = [
            { id: '1', name: 'A', date: 300 },
            { id: '2', name: 'B', date: 100 },
            { id: '3', name: 'C', date: 200 },
        ];
        const dupeMap = new Map([['1', ['2', '3']]]);

        const result = filterAndGroupDuplicates(items, dupeMap, getId, sortGroups, sortWithin);

        // All three are in one group, sorted by date within group
        expect(result.map(r => r.id)).toEqual(['2', '3', '1']);
    });

    it('handles items in duplicateMap that are not in items array', () => {
        const items: TestItem[] = [{ id: '1', name: 'A', date: 100 }];
        const dupeMap = new Map([['1', ['missing-id']]]);

        const result = filterAndGroupDuplicates(items, dupeMap, getId, sortGroups, sortWithin);

        // Only item '1' is present
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    it('does not duplicate items across groups', () => {
        const items: TestItem[] = [
            { id: '1', name: 'A', date: 100 },
            { id: '2', name: 'B', date: 200 },
        ];
        // Both entries reference each other
        const dupeMap = new Map([
            ['1', ['2']],
            ['2', ['1']],
        ]);

        const result = filterAndGroupDuplicates(items, dupeMap, getId, sortGroups, sortWithin);

        expect(result).toHaveLength(2);
        const ids = result.map(r => r.id);
        expect(new Set(ids).size).toBe(2); // no duplicates
    });
});
