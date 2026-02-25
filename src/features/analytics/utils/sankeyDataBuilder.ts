/**
 * Sankey Data Builder — Builds Sankey diagram data from transactions.
 * Supports 2/3/4-level modes with threshold filtering and "Más" aggregation.
 */

import type { Transaction } from '@/types/transaction';
import { getCategoryColor, getCurrentTheme, getCurrentMode, type ThemeName, type ModeName } from '@/config/categoryColors';
import { type FlowAggregates, aggregateTransactions } from './sankeyAggregation';
import { type CategoryAggregate, type SankeyExpansionState, applyThreshold, DEFAULT_EXPANSION } from './sankeyThreshold';
export type { SankeyExpansionState } from './sankeyThreshold';
export { getDefaultExpansion } from './sankeyThreshold';

// ============================================================================
// TYPES
// ============================================================================

export interface SankeyNode {
    /** Unique node name with level prefix (e.g., "L1_food-dining") */
    name: string;
    /** Node styling */
    itemStyle: { color: string };
    /** Custom properties for our use */
    level: number;
    /** Original category name without prefix */
    originalName: string;
    /** Total value (spending amount) */
    value: number;
    /** Transaction/item count */
    count: number;
    /** For "Más" nodes: number of aggregated categories */
    categoryCount?: number;
    /** Whether this is an aggregated "Más" node */
    isMas?: boolean;
}

export interface SankeyLink {
    /** Source node name */
    source: string;
    /** Target node name */
    target: string;
    /** Flow value (spending amount) */
    value: number;
}

export interface SankeyData {
    nodes: SankeyNode[];
    links: SankeyLink[];
}

/**
 * Sankey diagram hierarchy modes:
 * - '2-level': Store Categories → Item Categories (simplest)
 * - '3-level-groups': Store Groups → Store Categories → Item Groups
 * - '3-level-categories': Store Categories → Item Groups → Item Categories
 * - '4-level': Store Groups → Store Categories → Item Groups → Item Categories (full)
 */
export type SankeyMode = '2-level' | '3-level-groups' | '3-level-categories' | '4-level';

// ============================================================================
// HELPERS
// ============================================================================

/** Creates a unique node name with level prefix to prevent collisions. */
export function nodeName(level: number, name: string): string {
    return `L${level}_${name}`;
}

/** Strips the level prefix from a node name to get the original category. */
export function stripNodePrefix(name: string): string {
    return name.replace(/^L\d_/, '');
}

/** Gets the level number from a node name. */
export function getNodeLevel(name: string): number {
    const match = name.match(/^L(\d)_/);
    return match ? parseInt(match[1], 10) : 0;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Builds Sankey diagram data from transactions.
 *
 * @param transactions - Array of transactions with items
 * @param mode - Hierarchy mode ('2-level', '3-level-groups', '3-level-categories', '4-level')
 * @param expansion - Expansion state for each level
 * @param theme - Color theme
 * @param colorMode - Light or dark mode
 */
export function buildSankeyData(
    transactions: Transaction[],
    mode: SankeyMode = '2-level',
    expansion: SankeyExpansionState = DEFAULT_EXPANSION,
    theme: ThemeName = getCurrentTheme(),
    colorMode: ModeName = getCurrentMode()
): SankeyData {
    const agg = aggregateTransactions(transactions);

    let totalValue = 0;
    agg.storeCategories.forEach(({ value }) => { totalValue += value; });

    if (totalValue === 0) {
        return { nodes: [], links: [] };
    }

    switch (mode) {
        case '2-level':
            return build2LevelSankey(agg, totalValue, expansion, theme, colorMode);
        case '3-level-groups':
            return build3LevelGroupsSankey(agg, totalValue, expansion, theme, colorMode);
        case '3-level-categories':
            return build3LevelCategoriesSankey(agg, totalValue, expansion, theme, colorMode);
        case '4-level':
        default:
            return build4LevelSankey(agg, totalValue, expansion, theme, colorMode);
    }
}

function build2LevelSankey(
    agg: FlowAggregates, totalValue: number, expansion: SankeyExpansionState,
    theme: ThemeName, colorMode: ModeName
): SankeyData {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Level 1: Store Categories
    const storeCategories: CategoryAggregate[] = [];
    agg.storeCategories.forEach(({ value, count }, name) => {
        storeCategories.push({ name, value, count, percent: 0 });
    });

    const storeCatFiltered = applyThreshold(storeCategories, totalValue, expansion.level1);

    const visibleStoreCategories = new Set<string>();
    for (const cat of storeCatFiltered.visible) {
        visibleStoreCategories.add(cat.name);
        nodes.push({
            name: nodeName(1, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 1, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }

    if (storeCatFiltered.masNode) {
        nodes.push({
            name: nodeName(1, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 1, originalName: 'Más',
            value: storeCatFiltered.masNode.value, count: storeCatFiltered.masNode.count,
            categoryCount: storeCatFiltered.hidden.length, isMas: true,
        });
    }

    // Level 2: Item Categories
    const itemCategories: CategoryAggregate[] = [];
    agg.itemCategories.forEach(({ value, count }, name) => {
        itemCategories.push({ name, value, count, percent: 0 });
    });

    const itemCatFiltered = applyThreshold(itemCategories, totalValue, expansion.level2);

    const visibleItemCategories = new Set<string>();
    for (const cat of itemCatFiltered.visible) {
        visibleItemCategories.add(cat.name);
        nodes.push({
            name: nodeName(2, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 2, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }

    if (itemCatFiltered.masNode) {
        nodes.push({
            name: nodeName(2, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 2, originalName: 'Más',
            value: itemCatFiltered.masNode.value, count: itemCatFiltered.masNode.count,
            categoryCount: itemCatFiltered.hidden.length, isMas: true,
        });
    }

    // Create links
    agg.storeCategoryToItemCategory.forEach((value, key) => {
        const [storeCat, itemCat] = key.split('→');

        let sourceNode: string;
        if (visibleStoreCategories.has(storeCat)) {
            sourceNode = nodeName(1, storeCat);
        } else if (storeCatFiltered.masNode) {
            sourceNode = nodeName(1, 'Más');
        } else {
            return;
        }

        let targetNode: string;
        if (visibleItemCategories.has(itemCat)) {
            targetNode = nodeName(2, itemCat);
        } else if (itemCatFiltered.masNode) {
            targetNode = nodeName(2, 'Más');
        } else {
            return;
        }

        const existingLink = links.find(l => l.source === sourceNode && l.target === targetNode);
        if (existingLink) {
            existingLink.value += value;
        } else {
            links.push({ source: sourceNode, target: targetNode, value });
        }
    });

    return { nodes, links };
}

function build3LevelGroupsSankey(
    agg: FlowAggregates, totalValue: number, expansion: SankeyExpansionState,
    theme: ThemeName, colorMode: ModeName
): SankeyData {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Level 1: Store Groups
    const storeGroups: CategoryAggregate[] = [];
    agg.storeGroups.forEach(({ value, count }, name) => {
        storeGroups.push({ name, value, count, percent: 0 });
    });

    const storeGroupFiltered = applyThreshold(storeGroups, totalValue, expansion.level1);
    const visibleStoreGroups = new Set<string>();
    for (const cat of storeGroupFiltered.visible) {
        visibleStoreGroups.add(cat.name);
        nodes.push({
            name: nodeName(1, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 1, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }
    if (storeGroupFiltered.masNode) {
        nodes.push({
            name: nodeName(1, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 1, originalName: 'Más',
            value: storeGroupFiltered.masNode.value, count: storeGroupFiltered.masNode.count,
            categoryCount: storeGroupFiltered.hidden.length, isMas: true,
        });
    }

    // Level 2: Store Categories
    const storeCategories: CategoryAggregate[] = [];
    agg.storeCategories.forEach(({ value, count }, name) => {
        storeCategories.push({ name, value, count, percent: 0 });
    });

    const storeCatFiltered = applyThreshold(storeCategories, totalValue, expansion.level2);
    const visibleStoreCategories = new Set<string>();
    for (const cat of storeCatFiltered.visible) {
        visibleStoreCategories.add(cat.name);
        nodes.push({
            name: nodeName(2, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 2, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }
    if (storeCatFiltered.masNode) {
        nodes.push({
            name: nodeName(2, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 2, originalName: 'Más',
            value: storeCatFiltered.masNode.value, count: storeCatFiltered.masNode.count,
            categoryCount: storeCatFiltered.hidden.length, isMas: true,
        });
    }

    // Level 3: Item Groups
    const itemGroups: CategoryAggregate[] = [];
    agg.itemGroups.forEach(({ value, count }, name) => {
        itemGroups.push({ name, value, count, percent: 0 });
    });

    const itemGroupFiltered = applyThreshold(itemGroups, totalValue, expansion.level3);
    const visibleItemGroups = new Set<string>();
    for (const cat of itemGroupFiltered.visible) {
        visibleItemGroups.add(cat.name);
        nodes.push({
            name: nodeName(3, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 3, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }
    if (itemGroupFiltered.masNode) {
        nodes.push({
            name: nodeName(3, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 3, originalName: 'Más',
            value: itemGroupFiltered.masNode.value, count: itemGroupFiltered.masNode.count,
            categoryCount: itemGroupFiltered.hidden.length, isMas: true,
        });
    }

    const addLink = (source: string, target: string, value: number) => {
        const existing = links.find(l => l.source === source && l.target === target);
        if (existing) { existing.value += value; }
        else { links.push({ source, target, value }); }
    };

    agg.storeGroupToStoreCategory.forEach((value, key) => {
        const [storeGroup, storeCat] = key.split('→');
        const sourceNode = visibleStoreGroups.has(storeGroup)
            ? nodeName(1, storeGroup) : storeGroupFiltered.masNode ? nodeName(1, 'Más') : null;
        const targetNode = visibleStoreCategories.has(storeCat)
            ? nodeName(2, storeCat) : storeCatFiltered.masNode ? nodeName(2, 'Más') : null;
        if (sourceNode && targetNode) { addLink(sourceNode, targetNode, value); }
    });

    agg.storeCategoryToItemGroup.forEach((value, key) => {
        const [storeCat, itemGroup] = key.split('→');
        const sourceNode = visibleStoreCategories.has(storeCat)
            ? nodeName(2, storeCat) : storeCatFiltered.masNode ? nodeName(2, 'Más') : null;
        const targetNode = visibleItemGroups.has(itemGroup)
            ? nodeName(3, itemGroup) : itemGroupFiltered.masNode ? nodeName(3, 'Más') : null;
        if (sourceNode && targetNode) { addLink(sourceNode, targetNode, value); }
    });

    return { nodes, links };
}

function build3LevelCategoriesSankey(
    agg: FlowAggregates, totalValue: number, expansion: SankeyExpansionState,
    theme: ThemeName, colorMode: ModeName
): SankeyData {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Level 1: Store Categories
    const storeCategories: CategoryAggregate[] = [];
    agg.storeCategories.forEach(({ value, count }, name) => {
        storeCategories.push({ name, value, count, percent: 0 });
    });

    const storeCatFiltered = applyThreshold(storeCategories, totalValue, expansion.level1);
    const visibleStoreCategories = new Set<string>();
    for (const cat of storeCatFiltered.visible) {
        visibleStoreCategories.add(cat.name);
        nodes.push({
            name: nodeName(1, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 1, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }
    if (storeCatFiltered.masNode) {
        nodes.push({
            name: nodeName(1, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 1, originalName: 'Más',
            value: storeCatFiltered.masNode.value, count: storeCatFiltered.masNode.count,
            categoryCount: storeCatFiltered.hidden.length, isMas: true,
        });
    }

    // Level 2: Item Groups
    const itemGroups: CategoryAggregate[] = [];
    agg.itemGroups.forEach(({ value, count }, name) => {
        itemGroups.push({ name, value, count, percent: 0 });
    });

    const itemGroupFiltered = applyThreshold(itemGroups, totalValue, expansion.level2);
    const visibleItemGroups = new Set<string>();
    for (const cat of itemGroupFiltered.visible) {
        visibleItemGroups.add(cat.name);
        nodes.push({
            name: nodeName(2, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 2, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }
    if (itemGroupFiltered.masNode) {
        nodes.push({
            name: nodeName(2, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 2, originalName: 'Más',
            value: itemGroupFiltered.masNode.value, count: itemGroupFiltered.masNode.count,
            categoryCount: itemGroupFiltered.hidden.length, isMas: true,
        });
    }

    // Level 3: Item Categories
    const itemCategories: CategoryAggregate[] = [];
    agg.itemCategories.forEach(({ value, count }, name) => {
        itemCategories.push({ name, value, count, percent: 0 });
    });

    const itemCatFiltered = applyThreshold(itemCategories, totalValue, expansion.level3);
    const visibleItemCategories = new Set<string>();
    for (const cat of itemCatFiltered.visible) {
        visibleItemCategories.add(cat.name);
        nodes.push({
            name: nodeName(3, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 3, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }
    if (itemCatFiltered.masNode) {
        nodes.push({
            name: nodeName(3, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 3, originalName: 'Más',
            value: itemCatFiltered.masNode.value, count: itemCatFiltered.masNode.count,
            categoryCount: itemCatFiltered.hidden.length, isMas: true,
        });
    }

    const addLink = (source: string, target: string, value: number) => {
        const existing = links.find(l => l.source === source && l.target === target);
        if (existing) { existing.value += value; }
        else { links.push({ source, target, value }); }
    };

    agg.storeCategoryToItemGroup.forEach((value, key) => {
        const [storeCat, itemGroup] = key.split('→');
        const sourceNode = visibleStoreCategories.has(storeCat)
            ? nodeName(1, storeCat) : storeCatFiltered.masNode ? nodeName(1, 'Más') : null;
        const targetNode = visibleItemGroups.has(itemGroup)
            ? nodeName(2, itemGroup) : itemGroupFiltered.masNode ? nodeName(2, 'Más') : null;
        if (sourceNode && targetNode) { addLink(sourceNode, targetNode, value); }
    });

    agg.itemGroupToItemCategory.forEach((value, key) => {
        const [itemGroup, itemCat] = key.split('→');
        const sourceNode = visibleItemGroups.has(itemGroup)
            ? nodeName(2, itemGroup) : itemGroupFiltered.masNode ? nodeName(2, 'Más') : null;
        const targetNode = visibleItemCategories.has(itemCat)
            ? nodeName(3, itemCat) : itemCatFiltered.masNode ? nodeName(3, 'Más') : null;
        if (sourceNode && targetNode) { addLink(sourceNode, targetNode, value); }
    });

    return { nodes, links };
}

function build4LevelSankey(
    agg: FlowAggregates, totalValue: number, expansion: SankeyExpansionState,
    theme: ThemeName, colorMode: ModeName
): SankeyData {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Level 1: Store Groups
    const storeGroups: CategoryAggregate[] = [];
    agg.storeGroups.forEach(({ value, count }, name) => {
        storeGroups.push({ name, value, count, percent: 0 });
    });

    const storeGroupFiltered = applyThreshold(storeGroups, totalValue, expansion.level1);
    const visibleStoreGroups = new Set<string>();
    for (const cat of storeGroupFiltered.visible) {
        visibleStoreGroups.add(cat.name);
        nodes.push({
            name: nodeName(1, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 1, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }
    if (storeGroupFiltered.masNode) {
        nodes.push({
            name: nodeName(1, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 1, originalName: 'Más',
            value: storeGroupFiltered.masNode.value, count: storeGroupFiltered.masNode.count,
            categoryCount: storeGroupFiltered.hidden.length, isMas: true,
        });
    }

    // Level 2: Store Categories
    const storeCategories: CategoryAggregate[] = [];
    agg.storeCategories.forEach(({ value, count }, name) => {
        storeCategories.push({ name, value, count, percent: 0 });
    });

    const storeCatFiltered = applyThreshold(storeCategories, totalValue, expansion.level2);
    const visibleStoreCategories = new Set<string>();
    for (const cat of storeCatFiltered.visible) {
        visibleStoreCategories.add(cat.name);
        nodes.push({
            name: nodeName(2, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 2, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }
    if (storeCatFiltered.masNode) {
        nodes.push({
            name: nodeName(2, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 2, originalName: 'Más',
            value: storeCatFiltered.masNode.value, count: storeCatFiltered.masNode.count,
            categoryCount: storeCatFiltered.hidden.length, isMas: true,
        });
    }

    // Level 3: Item Groups
    const itemGroups: CategoryAggregate[] = [];
    agg.itemGroups.forEach(({ value, count }, name) => {
        itemGroups.push({ name, value, count, percent: 0 });
    });

    const itemGroupFiltered = applyThreshold(itemGroups, totalValue, expansion.level3);
    const visibleItemGroups = new Set<string>();
    for (const cat of itemGroupFiltered.visible) {
        visibleItemGroups.add(cat.name);
        nodes.push({
            name: nodeName(3, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 3, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }
    if (itemGroupFiltered.masNode) {
        nodes.push({
            name: nodeName(3, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 3, originalName: 'Más',
            value: itemGroupFiltered.masNode.value, count: itemGroupFiltered.masNode.count,
            categoryCount: itemGroupFiltered.hidden.length, isMas: true,
        });
    }

    // Level 4: Item Categories
    const itemCategories: CategoryAggregate[] = [];
    agg.itemCategories.forEach(({ value, count }, name) => {
        itemCategories.push({ name, value, count, percent: 0 });
    });

    const itemCatFiltered = applyThreshold(itemCategories, totalValue, expansion.level4);
    const visibleItemCategories = new Set<string>();
    for (const cat of itemCatFiltered.visible) {
        visibleItemCategories.add(cat.name);
        nodes.push({
            name: nodeName(4, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 4, originalName: cat.name, value: cat.value, count: cat.count,
        });
    }
    if (itemCatFiltered.masNode) {
        nodes.push({
            name: nodeName(4, 'Más'), itemStyle: { color: '#9ca3af' },
            level: 4, originalName: 'Más',
            value: itemCatFiltered.masNode.value, count: itemCatFiltered.masNode.count,
            categoryCount: itemCatFiltered.hidden.length, isMas: true,
        });
    }

    const addLink = (source: string, target: string, value: number) => {
        const existing = links.find(l => l.source === source && l.target === target);
        if (existing) { existing.value += value; }
        else { links.push({ source, target, value }); }
    };

    agg.storeGroupToStoreCategory.forEach((value, key) => {
        const [storeGroup, storeCat] = key.split('→');
        const sourceNode = visibleStoreGroups.has(storeGroup)
            ? nodeName(1, storeGroup) : storeGroupFiltered.masNode ? nodeName(1, 'Más') : null;
        const targetNode = visibleStoreCategories.has(storeCat)
            ? nodeName(2, storeCat) : storeCatFiltered.masNode ? nodeName(2, 'Más') : null;
        if (sourceNode && targetNode) { addLink(sourceNode, targetNode, value); }
    });

    agg.storeCategoryToItemGroup.forEach((value, key) => {
        const [storeCat, itemGroup] = key.split('→');
        const sourceNode = visibleStoreCategories.has(storeCat)
            ? nodeName(2, storeCat) : storeCatFiltered.masNode ? nodeName(2, 'Más') : null;
        const targetNode = visibleItemGroups.has(itemGroup)
            ? nodeName(3, itemGroup) : itemGroupFiltered.masNode ? nodeName(3, 'Más') : null;
        if (sourceNode && targetNode) { addLink(sourceNode, targetNode, value); }
    });

    agg.itemGroupToItemCategory.forEach((value, key) => {
        const [itemGroup, itemCat] = key.split('→');
        const sourceNode = visibleItemGroups.has(itemGroup)
            ? nodeName(3, itemGroup) : itemGroupFiltered.masNode ? nodeName(3, 'Más') : null;
        const targetNode = visibleItemCategories.has(itemCat)
            ? nodeName(4, itemCat) : itemCatFiltered.masNode ? nodeName(4, 'Más') : null;
        if (sourceNode && targetNode) { addLink(sourceNode, targetNode, value); }
    });

    return { nodes, links };
}

/** Checks if a node is a "Más" (aggregated) node. */
export function isMasNode(node: SankeyNode): boolean {
    return node.isMas === true || node.originalName === 'Más';
}

/** Gets the count of hidden categories in a "Más" node. */
export function getMasCount(node: SankeyNode): number {
    return node.categoryCount || 0;
}
