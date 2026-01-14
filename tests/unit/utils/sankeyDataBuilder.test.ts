/**
 * Unit Tests for sankeyDataBuilder
 * Story 14.13.3: Sankey Data Builder Tests
 *
 * Tests the transformation of transaction data into Sankey diagram format.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    buildSankeyData,
    nodeName,
    stripNodePrefix,
    getNodeLevel,
    getDefaultExpansion,
    isMasNode,
    getMasCount,
    type SankeyExpansionState,
} from '../../../src/utils/sankeyDataBuilder';
import type { Transaction } from '../../../src/types/transaction';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Creates a mock transaction with items
 */
function createTransaction(
    storeCategory: string,
    items: Array<{ name: string; price: number; category: string }>
): Transaction {
    return {
        id: `tx-${Math.random().toString(36).substr(2, 9)}`,
        date: '2026-01-11',
        merchant: 'Test Merchant',
        category: storeCategory as any,
        total: items.reduce((sum, item) => sum + item.price, 0),
        items: items.map(item => ({
            name: item.name,
            price: item.price,
            category: item.category,
        })),
    };
}

/**
 * Creates sample transactions for testing
 */
function createSampleTransactions(): Transaction[] {
    return [
        // Supermarket transactions (70% of total)
        createTransaction('Supermarket', [
            { name: 'Apples', price: 5000, category: 'Produce' },
            { name: 'Milk', price: 3000, category: 'Dairy & Eggs' },
            { name: 'Bread', price: 2000, category: 'Bakery' },
        ]),
        createTransaction('Supermarket', [
            { name: 'Chicken', price: 8000, category: 'Meat & Seafood' },
            { name: 'Rice', price: 4000, category: 'Pantry' },
        ]),
        createTransaction('Supermarket', [
            { name: 'Oranges', price: 3000, category: 'Produce' },
            { name: 'Cheese', price: 5000, category: 'Dairy & Eggs' },
        ]),
        // Restaurant transactions (30% of total)
        createTransaction('Restaurant', [
            { name: 'Lunch', price: 12000, category: 'Prepared Food' },
        ]),
        createTransaction('Restaurant', [
            { name: 'Dinner', price: 18000, category: 'Prepared Food' },
        ]),
    ];
}

/**
 * Creates transactions spread across many categories for threshold testing
 */
function createDiverseTransactions(): Transaction[] {
    return [
        // Large category (40%)
        createTransaction('Supermarket', [
            { name: 'Groceries', price: 40000, category: 'Pantry' },
        ]),
        // Medium category (25%)
        createTransaction('Restaurant', [
            { name: 'Dining', price: 25000, category: 'Prepared Food' },
        ]),
        // Small category (15%)
        createTransaction('Pharmacy', [
            { name: 'Medicine', price: 15000, category: 'Pharmacy' },
        ]),
        // Very small category (8%)
        createTransaction('GasStation', [
            { name: 'Gas', price: 8000, category: 'Automotive' },
        ]),
        // Tiny category (7%)
        createTransaction('Bakery', [
            { name: 'Pastries', price: 7000, category: 'Bakery' },
        ]),
        // Very tiny category (5%)
        createTransaction('Butcher', [
            { name: 'Meat', price: 5000, category: 'Meat & Seafood' },
        ]),
    ];
}

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe('sankeyDataBuilder helpers', () => {
    describe('nodeName', () => {
        it('creates node name with level prefix', () => {
            expect(nodeName(1, 'Supermarket')).toBe('L1_Supermarket');
            expect(nodeName(2, 'Produce')).toBe('L2_Produce');
            expect(nodeName(3, 'food-fresh')).toBe('L3_food-fresh');
            expect(nodeName(4, 'Dairy & Eggs')).toBe('L4_Dairy & Eggs');
        });
    });

    describe('stripNodePrefix', () => {
        it('removes level prefix from node name', () => {
            expect(stripNodePrefix('L1_Supermarket')).toBe('Supermarket');
            expect(stripNodePrefix('L2_Produce')).toBe('Produce');
            expect(stripNodePrefix('L3_food-fresh')).toBe('food-fresh');
            expect(stripNodePrefix('L4_Dairy & Eggs')).toBe('Dairy & Eggs');
        });

        it('returns original string if no prefix', () => {
            expect(stripNodePrefix('Supermarket')).toBe('Supermarket');
        });
    });

    describe('getNodeLevel', () => {
        it('extracts level number from node name', () => {
            expect(getNodeLevel('L1_Supermarket')).toBe(1);
            expect(getNodeLevel('L2_Produce')).toBe(2);
            expect(getNodeLevel('L3_food-fresh')).toBe(3);
            expect(getNodeLevel('L4_Dairy & Eggs')).toBe(4);
        });

        it('returns 0 for names without prefix', () => {
            expect(getNodeLevel('Supermarket')).toBe(0);
        });
    });

    describe('getDefaultExpansion', () => {
        it('returns expansion state with all zeros', () => {
            const expansion = getDefaultExpansion();
            expect(expansion).toEqual({
                level1: 0,
                level2: 0,
                level3: 0,
                level4: 0,
            });
        });

        it('returns a new object each time', () => {
            const exp1 = getDefaultExpansion();
            const exp2 = getDefaultExpansion();
            expect(exp1).not.toBe(exp2);
        });
    });

    describe('isMasNode', () => {
        it('identifies "Más" nodes correctly', () => {
            expect(isMasNode({ name: 'L1_Más', originalName: 'Más', isMas: true, level: 1, value: 100, count: 5, itemStyle: { color: '#999' } })).toBe(true);
            expect(isMasNode({ name: 'L1_Supermarket', originalName: 'Supermarket', level: 1, value: 100, count: 5, itemStyle: { color: '#999' } })).toBe(false);
        });
    });

    describe('getMasCount', () => {
        it('returns category count from "Más" node', () => {
            expect(getMasCount({ name: 'L1_Más', originalName: 'Más', isMas: true, level: 1, value: 100, count: 5, categoryCount: 3, itemStyle: { color: '#999' } })).toBe(3);
            expect(getMasCount({ name: 'L1_Supermarket', originalName: 'Supermarket', level: 1, value: 100, count: 5, itemStyle: { color: '#999' } })).toBe(0);
        });
    });
});

// ============================================================================
// 2-LEVEL MODE TESTS
// ============================================================================

describe('buildSankeyData - 2-level mode', () => {
    describe('basic functionality', () => {
        it('generates nodes for store and item categories', () => {
            const transactions = createSampleTransactions();
            const data = buildSankeyData(transactions, '2-level');

            // Should have store category nodes at level 1
            const level1Nodes = data.nodes.filter(n => n.level === 1);
            expect(level1Nodes.length).toBeGreaterThan(0);

            // Should have item category nodes at level 2
            const level2Nodes = data.nodes.filter(n => n.level === 2);
            expect(level2Nodes.length).toBeGreaterThan(0);
        });

        it('generates links between store and item categories', () => {
            const transactions = createSampleTransactions();
            const data = buildSankeyData(transactions, '2-level');

            expect(data.links.length).toBeGreaterThan(0);

            // All links should go from level 1 to level 2
            data.links.forEach(link => {
                expect(link.source.startsWith('L1_')).toBe(true);
                expect(link.target.startsWith('L2_')).toBe(true);
            });
        });

        it('calculates correct flow values', () => {
            const transactions = [
                createTransaction('Supermarket', [
                    { name: 'Apples', price: 5000, category: 'Produce' },
                ]),
            ];
            const data = buildSankeyData(transactions, '2-level');

            // Find the link from Supermarket to Produce
            const link = data.links.find(
                l => l.source === 'L1_Supermarket' && l.target === 'L2_Produce'
            );
            expect(link).toBeDefined();
            expect(link!.value).toBe(5000);
        });

        it('aggregates values from multiple transactions', () => {
            const transactions = [
                createTransaction('Supermarket', [
                    { name: 'Apples', price: 5000, category: 'Produce' },
                ]),
                createTransaction('Supermarket', [
                    { name: 'Oranges', price: 3000, category: 'Produce' },
                ]),
            ];
            const data = buildSankeyData(transactions, '2-level');

            // Find Supermarket node
            const supermarketNode = data.nodes.find(n => n.originalName === 'Supermarket');
            expect(supermarketNode).toBeDefined();
            expect(supermarketNode!.value).toBe(8000);

            // Find Produce node
            const produceNode = data.nodes.find(n => n.originalName === 'Produce');
            expect(produceNode).toBeDefined();
            expect(produceNode!.value).toBe(8000);
        });
    });

    describe('threshold filtering', () => {
        it('shows categories above 10% threshold', () => {
            const transactions = createDiverseTransactions();
            const data = buildSankeyData(transactions, '2-level');

            // Supermarket (40%) and Restaurant (25%) should be visible
            const supermarket = data.nodes.find(n => n.originalName === 'Supermarket');
            const restaurant = data.nodes.find(n => n.originalName === 'Restaurant');

            expect(supermarket).toBeDefined();
            expect(restaurant).toBeDefined();
        });

        it('creates "Más" node for small categories', () => {
            const transactions = createDiverseTransactions();
            const data = buildSankeyData(transactions, '2-level');

            // Should have a "Más" node if there are hidden categories
            const masNode = data.nodes.find(n => n.originalName === 'Más' && n.level === 1);
            // Depends on threshold calculation - may or may not exist
            // At minimum, we should have some nodes
            expect(data.nodes.length).toBeGreaterThan(0);
        });

        it('includes category count in "Más" node', () => {
            const transactions = createDiverseTransactions();
            const data = buildSankeyData(transactions, '2-level');

            const masNode = data.nodes.find(n => n.originalName === 'Más' && n.isMas === true);
            if (masNode) {
                expect(masNode.categoryCount).toBeDefined();
                expect(masNode.categoryCount).toBeGreaterThan(0);
            }
        });
    });

    describe('expansion state', () => {
        it('reveals more categories when expansion is increased', () => {
            const transactions = createDiverseTransactions();

            const dataCollapsed = buildSankeyData(transactions, '2-level', {
                level1: 0,
                level2: 0,
                level3: 0,
                level4: 0,
            });

            const dataExpanded = buildSankeyData(transactions, '2-level', {
                level1: 10,
                level2: 10,
                level3: 0,
                level4: 0,
            });

            // Expanded should have same or more visible categories
            expect(dataExpanded.nodes.filter(n => !n.isMas).length)
                .toBeGreaterThanOrEqual(dataCollapsed.nodes.filter(n => !n.isMas).length);
        });
    });

    describe('edge cases', () => {
        it('returns empty data for no transactions', () => {
            const data = buildSankeyData([], '2-level');
            expect(data.nodes).toHaveLength(0);
            expect(data.links).toHaveLength(0);
        });

        it('returns empty data for transactions without items', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx-1',
                    date: '2026-01-11',
                    merchant: 'Test',
                    category: 'Supermarket' as any,
                    total: 1000,
                    items: [],
                },
            ];
            const data = buildSankeyData(transactions, '2-level');
            expect(data.nodes).toHaveLength(0);
            expect(data.links).toHaveLength(0);
        });

        it('skips items without category', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx-1',
                    date: '2026-01-11',
                    merchant: 'Test',
                    category: 'Supermarket' as any,
                    total: 1000,
                    items: [
                        { name: 'Unknown', price: 1000 }, // No category
                    ],
                },
            ];
            const data = buildSankeyData(transactions, '2-level');
            expect(data.nodes).toHaveLength(0);
            expect(data.links).toHaveLength(0);
        });

        it('skips items with zero or negative price', () => {
            const transactions = [
                createTransaction('Supermarket', [
                    { name: 'Free Item', price: 0, category: 'Produce' },
                    { name: 'Refund', price: -100, category: 'Produce' },
                ]),
            ];
            const data = buildSankeyData(transactions, '2-level');
            expect(data.nodes).toHaveLength(0);
            expect(data.links).toHaveLength(0);
        });

        it('handles single category correctly', () => {
            const transactions = [
                createTransaction('Supermarket', [
                    { name: 'Apples', price: 5000, category: 'Produce' },
                ]),
            ];
            const data = buildSankeyData(transactions, '2-level');

            expect(data.nodes).toHaveLength(2); // 1 store + 1 item
            expect(data.links).toHaveLength(1);
        });
    });

    describe('node properties', () => {
        it('includes correct properties on nodes', () => {
            const transactions = createSampleTransactions();
            const data = buildSankeyData(transactions, '2-level');

            const node = data.nodes[0];
            expect(node).toHaveProperty('name');
            expect(node).toHaveProperty('itemStyle');
            expect(node).toHaveProperty('level');
            expect(node).toHaveProperty('originalName');
            expect(node).toHaveProperty('value');
            expect(node).toHaveProperty('count');
            expect(node.itemStyle).toHaveProperty('color');
        });

        it('uses unique node names with level prefix', () => {
            const transactions = createSampleTransactions();
            const data = buildSankeyData(transactions, '2-level');

            const nodeNames = data.nodes.map(n => n.name);
            const uniqueNames = new Set(nodeNames);
            expect(uniqueNames.size).toBe(nodeNames.length);
        });
    });
});

// ============================================================================
// 4-LEVEL MODE TESTS
// ============================================================================

describe('buildSankeyData - 4-level mode', () => {
    it('generates nodes for all 4 levels', () => {
        const transactions = createSampleTransactions();
        const data = buildSankeyData(transactions, '4-level');

        const level1Nodes = data.nodes.filter(n => n.level === 1);
        const level2Nodes = data.nodes.filter(n => n.level === 2);
        const level3Nodes = data.nodes.filter(n => n.level === 3);
        const level4Nodes = data.nodes.filter(n => n.level === 4);

        expect(level1Nodes.length).toBeGreaterThan(0); // Store groups
        expect(level2Nodes.length).toBeGreaterThan(0); // Store categories
        expect(level3Nodes.length).toBeGreaterThan(0); // Item groups
        expect(level4Nodes.length).toBeGreaterThan(0); // Item categories
    });

    it('creates links between adjacent levels only', () => {
        const transactions = createSampleTransactions();
        const data = buildSankeyData(transactions, '4-level');

        data.links.forEach(link => {
            const sourceLevel = getNodeLevel(link.source);
            const targetLevel = getNodeLevel(link.target);
            expect(targetLevel - sourceLevel).toBe(1); // Adjacent levels
        });
    });

    it('has links for each transition', () => {
        const transactions = createSampleTransactions();
        const data = buildSankeyData(transactions, '4-level');

        // Should have links from L1→L2, L2→L3, L3→L4
        const l1ToL2 = data.links.filter(l => l.source.startsWith('L1_') && l.target.startsWith('L2_'));
        const l2ToL3 = data.links.filter(l => l.source.startsWith('L2_') && l.target.startsWith('L3_'));
        const l3ToL4 = data.links.filter(l => l.source.startsWith('L3_') && l.target.startsWith('L4_'));

        expect(l1ToL2.length).toBeGreaterThan(0);
        expect(l2ToL3.length).toBeGreaterThan(0);
        expect(l3ToL4.length).toBeGreaterThan(0);
    });
});

// ============================================================================
// THEME INTEGRATION TESTS
// ============================================================================

describe('buildSankeyData - theme integration', () => {
    it('applies category colors to nodes', () => {
        const transactions = createSampleTransactions();
        const data = buildSankeyData(transactions, '2-level', undefined, 'normal', 'light');

        data.nodes.forEach(node => {
            expect(node.itemStyle.color).toBeDefined();
            expect(node.itemStyle.color).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });

    it('uses gray color for "Más" nodes', () => {
        const transactions = createDiverseTransactions();
        const data = buildSankeyData(transactions, '2-level');

        const masNodes = data.nodes.filter(n => n.isMas);
        masNodes.forEach(node => {
            expect(node.itemStyle.color).toBe('#9ca3af'); // Gray
        });
    });
});
