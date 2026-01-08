/**
 * Tests for Squarified Treemap Layout Algorithm
 * Story 14.13: Analytics Explorer Redesign
 */

import { describe, it, expect } from 'vitest';
import { calculateTreemapLayout, categoryDataToTreemapItems, type TreemapItem } from '../../../src/utils/treemapLayout';

describe('treemapLayout', () => {
    describe('calculateTreemapLayout', () => {
        it('returns empty array for empty input', () => {
            const result = calculateTreemapLayout([]);
            expect(result).toEqual([]);
        });

        it('returns single rectangle filling entire space for one item', () => {
            const items: TreemapItem[] = [{ id: 'A', value: 100 }];
            const result = calculateTreemapLayout(items);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('A');
            expect(result[0].x).toBe(0);
            expect(result[0].y).toBe(0);
            expect(result[0].width).toBe(100);
            expect(result[0].height).toBe(100);
        });

        it('filters out items with zero or negative values', () => {
            const items: TreemapItem[] = [
                { id: 'A', value: 100 },
                { id: 'B', value: 0 },
                { id: 'C', value: -10 },
            ];
            const result = calculateTreemapLayout(items);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('A');
        });

        it('creates layout for two items with proportional areas', () => {
            const items: TreemapItem[] = [
                { id: 'A', value: 70 },
                { id: 'B', value: 30 },
            ];
            const result = calculateTreemapLayout(items);

            expect(result).toHaveLength(2);

            // Total area should approximately match value proportions
            const areaA = result.find(r => r.id === 'A')!.width * result.find(r => r.id === 'A')!.height;
            const areaB = result.find(r => r.id === 'B')!.width * result.find(r => r.id === 'B')!.height;
            const totalArea = areaA + areaB;

            // A should be ~70% of total area
            expect(areaA / totalArea).toBeCloseTo(0.7, 1);
            // B should be ~30% of total area
            expect(areaB / totalArea).toBeCloseTo(0.3, 1);
        });

        it('creates layout for multiple items maintaining proportions', () => {
            const items: TreemapItem[] = [
                { id: 'A', value: 30 },
                { id: 'B', value: 26 },
                { id: 'C', value: 21 },
                { id: 'D', value: 16 },
                { id: 'E', value: 8 },
            ];
            const result = calculateTreemapLayout(items);

            expect(result).toHaveLength(5);

            // All rectangles should be within bounds
            result.forEach(rect => {
                expect(rect.x).toBeGreaterThanOrEqual(0);
                expect(rect.y).toBeGreaterThanOrEqual(0);
                expect(rect.x + rect.width).toBeLessThanOrEqual(100.01); // Small tolerance for floating point
                expect(rect.y + rect.height).toBeLessThanOrEqual(100.01);
                expect(rect.width).toBeGreaterThan(0);
                expect(rect.height).toBeGreaterThan(0);
            });

            // Rectangles should not overlap significantly
            for (let i = 0; i < result.length; i++) {
                for (let j = i + 1; j < result.length; j++) {
                    const r1 = result[i];
                    const r2 = result[j];
                    const overlap = !(
                        r1.x + r1.width <= r2.x + 0.01 ||
                        r2.x + r2.width <= r1.x + 0.01 ||
                        r1.y + r1.height <= r2.y + 0.01 ||
                        r2.y + r2.height <= r1.y + 0.01
                    );
                    expect(overlap).toBe(false);
                }
            }
        });

        it('produces squarish rectangles (aspect ratio close to 1)', () => {
            const items: TreemapItem[] = [
                { id: 'A', value: 25 },
                { id: 'B', value: 25 },
                { id: 'C', value: 25 },
                { id: 'D', value: 25 },
            ];
            const result = calculateTreemapLayout(items);

            // For equal values, aspect ratios should be reasonably close to 1
            result.forEach(rect => {
                const aspectRatio = Math.max(rect.width / rect.height, rect.height / rect.width);
                // Squarified algorithm should produce aspect ratios < 3 for balanced data
                expect(aspectRatio).toBeLessThan(3);
            });
        });

        it('preserves original item data in result', () => {
            const items: TreemapItem[] = [
                { id: 'A', value: 50, name: 'Category A', color: '#ff0000' },
                { id: 'B', value: 50, name: 'Category B', color: '#00ff00' },
            ];
            const result = calculateTreemapLayout(items);

            const itemA = result.find(r => r.id === 'A')!;
            expect(itemA.originalItem.name).toBe('Category A');
            expect(itemA.originalItem.color).toBe('#ff0000');
        });

        it('works with custom container dimensions', () => {
            const items: TreemapItem[] = [{ id: 'A', value: 100 }];
            const result = calculateTreemapLayout(items, 200, 100);

            expect(result[0].width).toBe(200);
            expect(result[0].height).toBe(100);
        });
    });

    describe('categoryDataToTreemapItems', () => {
        it('converts category data to treemap items', () => {
            const categories = [
                { name: 'Food', value: 100, color: '#ff0000' },
                { name: 'Transport', value: 50, color: '#00ff00' },
            ];
            const result = categoryDataToTreemapItems(categories);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('Food');
            expect(result[0].value).toBe(100);
            expect(result[0].name).toBe('Food');
            expect(result[0].color).toBe('#ff0000');
        });
    });
});
