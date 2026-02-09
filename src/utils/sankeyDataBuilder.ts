/**
 * Sankey Data Builder
 * Story 14.13.3: Builds Sankey diagram data from transactions
 *
 * Transforms transaction data into nodes and links for ECharts Sankey visualization.
 * Supports 2-level mode (Store Categories → Item Categories) and 4-level mode (full hierarchy).
 *
 * Key features:
 * - 10% threshold filtering with "Más" aggregation
 * - Unique node naming to avoid collisions (L1_, L2_, etc.)
 * - Expand/collapse state per level
 * - Category color integration
 */

import type { Transaction } from '../types/transaction';
import { byNumberDesc } from '@/utils/comparators';
import {
    STORE_CATEGORY_GROUPS,
    ITEM_CATEGORY_GROUPS,
    ITEM_CATEGORY_TO_KEY,
    getCategoryColor,
    getCurrentTheme,
    getCurrentMode,
    type StoreCategoryGroup,
    type ItemCategoryGroup,
    type ThemeName,
    type ModeName,
} from '../config/categoryColors';
import type { StoreCategory, ItemCategory } from '../types/transaction';

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

export interface SankeyExpansionState {
    /** Number of categories to show at each level (beyond 10% threshold) */
    level1: number;
    level2: number;
    level3: number;
    level4: number;
}

interface CategoryAggregate {
    name: string;
    value: number;
    count: number;
    percent: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum percentage threshold to show a category (10%) */
const THRESHOLD_PERCENT = 10;

/** Minimum categories to always show (top N + one below threshold) */
const MIN_VISIBLE_CATEGORIES = 2;

/** Default expansion state - show only threshold-qualified categories */
const DEFAULT_EXPANSION: SankeyExpansionState = {
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Creates a unique node name with level prefix.
 * This prevents collisions when the same category name appears at different levels.
 */
export function nodeName(level: number, name: string): string {
    return `L${level}_${name}`;
}

/**
 * Strips the level prefix from a node name to get the original category.
 */
export function stripNodePrefix(name: string): string {
    return name.replace(/^L\d_/, '');
}

/**
 * Gets the level number from a node name.
 */
export function getNodeLevel(name: string): number {
    const match = name.match(/^L(\d)_/);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Applies 10% threshold filtering and creates "Más" aggregation.
 *
 * Rules:
 * 1. Show all categories with >= 10% of total
 * 2. Show one additional category with highest % below 10%
 * 3. Aggregate remaining into "Más" group
 * 4. Expansion state can reveal more hidden categories
 *
 * @param categories - Aggregated categories with values
 * @param total - Total value for percentage calculation
 * @param expansionCount - Number of additional categories to reveal beyond threshold
 * @returns Filtered categories with optional "Más" node
 */
function applyThreshold(
    categories: CategoryAggregate[],
    total: number,
    expansionCount: number
): { visible: CategoryAggregate[]; hidden: CategoryAggregate[]; masNode: CategoryAggregate | null } {
    if (categories.length === 0 || total === 0) {
        return { visible: [], hidden: [], masNode: null };
    }

    // Sort by value descending
    const sorted = [...categories].sort(byNumberDesc('value'));

    // Calculate percentages
    sorted.forEach(cat => {
        cat.percent = (cat.value / total) * 100;
    });

    // Find categories above threshold
    const aboveThreshold = sorted.filter(cat => cat.percent >= THRESHOLD_PERCENT);

    // Find categories below threshold
    const belowThreshold = sorted.filter(cat => cat.percent < THRESHOLD_PERCENT);

    // Determine how many below-threshold to show
    // Always show at least one below threshold (if exists) + expansion count
    const belowToShow = Math.min(
        1 + expansionCount,
        belowThreshold.length
    );

    // Ensure we have at least MIN_VISIBLE_CATEGORIES total
    const minAdditional = Math.max(0, MIN_VISIBLE_CATEGORIES - aboveThreshold.length);
    const actualBelowToShow = Math.max(belowToShow, minAdditional);

    const visibleBelow = belowThreshold.slice(0, actualBelowToShow);
    const hidden = belowThreshold.slice(actualBelowToShow);

    const visible = [...aboveThreshold, ...visibleBelow];

    // Create "Más" node if there are hidden categories
    let masNode: CategoryAggregate | null = null;
    if (hidden.length > 0) {
        const masValue = hidden.reduce((sum, cat) => sum + cat.value, 0);
        const masCount = hidden.reduce((sum, cat) => sum + cat.count, 0);
        masNode = {
            name: 'Más',
            value: masValue,
            count: masCount,
            percent: (masValue / total) * 100,
        };
    }

    return { visible, hidden, masNode };
}

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

interface FlowAggregates {
    storeGroups: Map<StoreCategoryGroup, { value: number; count: number }>;
    storeCategories: Map<StoreCategory, { value: number; count: number }>;
    itemGroups: Map<ItemCategoryGroup, { value: number; count: number }>;
    itemCategories: Map<ItemCategory, { value: number; count: number }>;
    // Flow links
    storeGroupToStoreCategory: Map<string, number>;
    storeCategoryToItemGroup: Map<string, number>;
    itemGroupToItemCategory: Map<string, number>;
    storeCategoryToItemCategory: Map<string, number>; // For 2-level mode
}

/**
 * Aggregates transaction data into flow values for all hierarchy levels.
 */
function aggregateTransactions(transactions: Transaction[]): FlowAggregates {
    const agg: FlowAggregates = {
        storeGroups: new Map(),
        storeCategories: new Map(),
        itemGroups: new Map(),
        itemCategories: new Map(),
        storeGroupToStoreCategory: new Map(),
        storeCategoryToItemGroup: new Map(),
        itemGroupToItemCategory: new Map(),
        storeCategoryToItemCategory: new Map(),
    };

    for (const tx of transactions) {
        // Skip transactions without items (required for Sankey flow)
        if (!tx.items || tx.items.length === 0) continue;

        // Transaction.category is the store category
        const storeCategory = tx.category as StoreCategory;
        if (!storeCategory) continue;

        const storeGroup = STORE_CATEGORY_GROUPS[storeCategory];
        if (!storeGroup) continue;

        // Process each item
        for (const item of tx.items) {
            const itemCategory = item.category as ItemCategory;
            if (!itemCategory) continue;

            const itemCategoryKey = ITEM_CATEGORY_TO_KEY[itemCategory];
            if (!itemCategoryKey) continue;

            const itemGroup = ITEM_CATEGORY_GROUPS[itemCategoryKey];
            if (!itemGroup) continue;

            // TransactionItem uses price, not total
            const amount = item.price || 0;
            if (amount <= 0) continue;

            // Aggregate store groups
            const sgAgg = agg.storeGroups.get(storeGroup) || { value: 0, count: 0 };
            sgAgg.value += amount;
            sgAgg.count += 1;
            agg.storeGroups.set(storeGroup, sgAgg);

            // Aggregate store categories
            const scAgg = agg.storeCategories.get(storeCategory) || { value: 0, count: 0 };
            scAgg.value += amount;
            scAgg.count += 1;
            agg.storeCategories.set(storeCategory, scAgg);

            // Aggregate item groups
            const igAgg = agg.itemGroups.get(itemGroup) || { value: 0, count: 0 };
            igAgg.value += amount;
            igAgg.count += 1;
            agg.itemGroups.set(itemGroup, igAgg);

            // Aggregate item categories
            const icAgg = agg.itemCategories.get(itemCategory) || { value: 0, count: 0 };
            icAgg.value += amount;
            icAgg.count += 1;
            agg.itemCategories.set(itemCategory, icAgg);

            // Flow links (4-level)
            const sgToScKey = `${storeGroup}→${storeCategory}`;
            agg.storeGroupToStoreCategory.set(
                sgToScKey,
                (agg.storeGroupToStoreCategory.get(sgToScKey) || 0) + amount
            );

            const scToIgKey = `${storeCategory}→${itemGroup}`;
            agg.storeCategoryToItemGroup.set(
                scToIgKey,
                (agg.storeCategoryToItemGroup.get(scToIgKey) || 0) + amount
            );

            const igToIcKey = `${itemGroup}→${itemCategory}`;
            agg.itemGroupToItemCategory.set(
                igToIcKey,
                (agg.itemGroupToItemCategory.get(igToIcKey) || 0) + amount
            );

            // Flow link (2-level)
            const scToIcKey = `${storeCategory}→${itemCategory}`;
            agg.storeCategoryToItemCategory.set(
                scToIcKey,
                (agg.storeCategoryToItemCategory.get(scToIcKey) || 0) + amount
            );
        }
    }

    return agg;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Builds Sankey diagram data from transactions.
 *
 * @param transactions - Array of transactions with items
 * @param mode - '2-level' (Store Categories → Item Categories) or '4-level' (full hierarchy)
 * @param expansion - Expansion state for each level
 * @param theme - Color theme
 * @param colorMode - Light or dark mode
 * @returns SankeyData with nodes and links
 */
export function buildSankeyData(
    transactions: Transaction[],
    mode: SankeyMode = '2-level',
    expansion: SankeyExpansionState = DEFAULT_EXPANSION,
    theme: ThemeName = getCurrentTheme(),
    colorMode: ModeName = getCurrentMode()
): SankeyData {
    const agg = aggregateTransactions(transactions);

    // Calculate totals
    let totalValue = 0;
    agg.storeCategories.forEach(({ value }) => {
        totalValue += value;
    });

    if (totalValue === 0) {
        return { nodes: [], links: [] };
    }

    switch (mode) {
        case '2-level':
            // 2-Level Mode: Store Categories → Item Categories
            return build2LevelSankey(agg, totalValue, expansion, theme, colorMode);
        case '3-level-groups':
            // 3-Level Groups Mode: Store Groups → Store Categories → Item Groups
            return build3LevelGroupsSankey(agg, totalValue, expansion, theme, colorMode);
        case '3-level-categories':
            // 3-Level Categories Mode: Store Categories → Item Groups → Item Categories
            return build3LevelCategoriesSankey(agg, totalValue, expansion, theme, colorMode);
        case '4-level':
        default:
            // 4-Level Mode: Store Groups → Store Categories → Item Groups → Item Categories
            return build4LevelSankey(agg, totalValue, expansion, theme, colorMode);
    }
}

/**
 * Builds 2-level Sankey: Store Categories → Item Categories
 */
function build2LevelSankey(
    agg: FlowAggregates,
    totalValue: number,
    expansion: SankeyExpansionState,
    theme: ThemeName,
    colorMode: ModeName
): SankeyData {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Level 1: Store Categories
    const storeCategories: CategoryAggregate[] = [];
    agg.storeCategories.forEach(({ value, count }, name) => {
        storeCategories.push({ name, value, count, percent: 0 });
    });

    const storeCatFiltered = applyThreshold(storeCategories, totalValue, expansion.level1);

    // Add store category nodes
    const visibleStoreCategories = new Set<string>();
    for (const cat of storeCatFiltered.visible) {
        visibleStoreCategories.add(cat.name);
        nodes.push({
            name: nodeName(1, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 1,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    // Add "Más" node for store categories if needed
    if (storeCatFiltered.masNode) {
        nodes.push({
            name: nodeName(1, 'Más'),
            itemStyle: { color: '#9ca3af' }, // Gray for aggregated
            level: 1,
            originalName: 'Más',
            value: storeCatFiltered.masNode.value,
            count: storeCatFiltered.masNode.count,
            categoryCount: storeCatFiltered.hidden.length,
            isMas: true,
        });
    }

    // Level 2: Item Categories
    const itemCategories: CategoryAggregate[] = [];
    agg.itemCategories.forEach(({ value, count }, name) => {
        itemCategories.push({ name, value, count, percent: 0 });
    });

    const itemCatFiltered = applyThreshold(itemCategories, totalValue, expansion.level2);

    // Add item category nodes
    const visibleItemCategories = new Set<string>();
    for (const cat of itemCatFiltered.visible) {
        visibleItemCategories.add(cat.name);
        nodes.push({
            name: nodeName(2, cat.name),
            itemStyle: { color: getCategoryColor(cat.name, theme, colorMode) },
            level: 2,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    // Add "Más" node for item categories if needed
    if (itemCatFiltered.masNode) {
        nodes.push({
            name: nodeName(2, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 2,
            originalName: 'Más',
            value: itemCatFiltered.masNode.value,
            count: itemCatFiltered.masNode.count,
            categoryCount: itemCatFiltered.hidden.length,
            isMas: true,
        });
    }

    // Create links
    agg.storeCategoryToItemCategory.forEach((value, key) => {
        const [storeCat, itemCat] = key.split('→');

        // Determine source node
        let sourceNode: string;
        if (visibleStoreCategories.has(storeCat)) {
            sourceNode = nodeName(1, storeCat);
        } else if (storeCatFiltered.masNode) {
            sourceNode = nodeName(1, 'Más');
        } else {
            return; // Skip if no valid source
        }

        // Determine target node
        let targetNode: string;
        if (visibleItemCategories.has(itemCat)) {
            targetNode = nodeName(2, itemCat);
        } else if (itemCatFiltered.masNode) {
            targetNode = nodeName(2, 'Más');
        } else {
            return; // Skip if no valid target
        }

        // Check if link already exists and merge
        const existingLink = links.find(l => l.source === sourceNode && l.target === targetNode);
        if (existingLink) {
            existingLink.value += value;
        } else {
            links.push({
                source: sourceNode,
                target: targetNode,
                value,
            });
        }
    });

    return { nodes, links };
}

/**
 * Builds 3-level Groups Sankey: Store Groups → Store Categories → Item Groups
 * Story 14.13.3 Phase 5: First view mode for Sankey with icon nodes
 */
function build3LevelGroupsSankey(
    agg: FlowAggregates,
    totalValue: number,
    expansion: SankeyExpansionState,
    theme: ThemeName,
    colorMode: ModeName
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
            level: 1,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    if (storeGroupFiltered.masNode) {
        nodes.push({
            name: nodeName(1, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 1,
            originalName: 'Más',
            value: storeGroupFiltered.masNode.value,
            count: storeGroupFiltered.masNode.count,
            categoryCount: storeGroupFiltered.hidden.length,
            isMas: true,
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
            level: 2,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    if (storeCatFiltered.masNode) {
        nodes.push({
            name: nodeName(2, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 2,
            originalName: 'Más',
            value: storeCatFiltered.masNode.value,
            count: storeCatFiltered.masNode.count,
            categoryCount: storeCatFiltered.hidden.length,
            isMas: true,
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
            level: 3,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    if (itemGroupFiltered.masNode) {
        nodes.push({
            name: nodeName(3, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 3,
            originalName: 'Más',
            value: itemGroupFiltered.masNode.value,
            count: itemGroupFiltered.masNode.count,
            categoryCount: itemGroupFiltered.hidden.length,
            isMas: true,
        });
    }

    // Helper to add or merge links
    const addLink = (source: string, target: string, value: number) => {
        const existing = links.find(l => l.source === source && l.target === target);
        if (existing) {
            existing.value += value;
        } else {
            links.push({ source, target, value });
        }
    };

    // Links: Store Groups → Store Categories
    agg.storeGroupToStoreCategory.forEach((value, key) => {
        const [storeGroup, storeCat] = key.split('→');
        const sourceNode = visibleStoreGroups.has(storeGroup)
            ? nodeName(1, storeGroup)
            : storeGroupFiltered.masNode ? nodeName(1, 'Más') : null;
        const targetNode = visibleStoreCategories.has(storeCat)
            ? nodeName(2, storeCat)
            : storeCatFiltered.masNode ? nodeName(2, 'Más') : null;

        if (sourceNode && targetNode) {
            addLink(sourceNode, targetNode, value);
        }
    });

    // Links: Store Categories → Item Groups
    agg.storeCategoryToItemGroup.forEach((value, key) => {
        const [storeCat, itemGroup] = key.split('→');
        const sourceNode = visibleStoreCategories.has(storeCat)
            ? nodeName(2, storeCat)
            : storeCatFiltered.masNode ? nodeName(2, 'Más') : null;
        const targetNode = visibleItemGroups.has(itemGroup)
            ? nodeName(3, itemGroup)
            : itemGroupFiltered.masNode ? nodeName(3, 'Más') : null;

        if (sourceNode && targetNode) {
            addLink(sourceNode, targetNode, value);
        }
    });

    return { nodes, links };
}

/**
 * Builds 3-level Categories Sankey: Store Categories → Item Groups → Item Categories
 * Story 14.13.3 Phase 5: Second view mode for Sankey with icon nodes
 */
function build3LevelCategoriesSankey(
    agg: FlowAggregates,
    totalValue: number,
    expansion: SankeyExpansionState,
    theme: ThemeName,
    colorMode: ModeName
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
            level: 1,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    if (storeCatFiltered.masNode) {
        nodes.push({
            name: nodeName(1, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 1,
            originalName: 'Más',
            value: storeCatFiltered.masNode.value,
            count: storeCatFiltered.masNode.count,
            categoryCount: storeCatFiltered.hidden.length,
            isMas: true,
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
            level: 2,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    if (itemGroupFiltered.masNode) {
        nodes.push({
            name: nodeName(2, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 2,
            originalName: 'Más',
            value: itemGroupFiltered.masNode.value,
            count: itemGroupFiltered.masNode.count,
            categoryCount: itemGroupFiltered.hidden.length,
            isMas: true,
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
            level: 3,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    if (itemCatFiltered.masNode) {
        nodes.push({
            name: nodeName(3, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 3,
            originalName: 'Más',
            value: itemCatFiltered.masNode.value,
            count: itemCatFiltered.masNode.count,
            categoryCount: itemCatFiltered.hidden.length,
            isMas: true,
        });
    }

    // Helper to add or merge links
    const addLink = (source: string, target: string, value: number) => {
        const existing = links.find(l => l.source === source && l.target === target);
        if (existing) {
            existing.value += value;
        } else {
            links.push({ source, target, value });
        }
    };

    // Links: Store Categories → Item Groups
    agg.storeCategoryToItemGroup.forEach((value, key) => {
        const [storeCat, itemGroup] = key.split('→');
        const sourceNode = visibleStoreCategories.has(storeCat)
            ? nodeName(1, storeCat)
            : storeCatFiltered.masNode ? nodeName(1, 'Más') : null;
        const targetNode = visibleItemGroups.has(itemGroup)
            ? nodeName(2, itemGroup)
            : itemGroupFiltered.masNode ? nodeName(2, 'Más') : null;

        if (sourceNode && targetNode) {
            addLink(sourceNode, targetNode, value);
        }
    });

    // Links: Item Groups → Item Categories
    agg.itemGroupToItemCategory.forEach((value, key) => {
        const [itemGroup, itemCat] = key.split('→');
        const sourceNode = visibleItemGroups.has(itemGroup)
            ? nodeName(2, itemGroup)
            : itemGroupFiltered.masNode ? nodeName(2, 'Más') : null;
        const targetNode = visibleItemCategories.has(itemCat)
            ? nodeName(3, itemCat)
            : itemCatFiltered.masNode ? nodeName(3, 'Más') : null;

        if (sourceNode && targetNode) {
            addLink(sourceNode, targetNode, value);
        }
    });

    return { nodes, links };
}

/**
 * Builds 4-level Sankey: Store Groups → Store Categories → Item Groups → Item Categories
 */
function build4LevelSankey(
    agg: FlowAggregates,
    totalValue: number,
    expansion: SankeyExpansionState,
    theme: ThemeName,
    colorMode: ModeName
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
            level: 1,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    if (storeGroupFiltered.masNode) {
        nodes.push({
            name: nodeName(1, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 1,
            originalName: 'Más',
            value: storeGroupFiltered.masNode.value,
            count: storeGroupFiltered.masNode.count,
            categoryCount: storeGroupFiltered.hidden.length,
            isMas: true,
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
            level: 2,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    if (storeCatFiltered.masNode) {
        nodes.push({
            name: nodeName(2, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 2,
            originalName: 'Más',
            value: storeCatFiltered.masNode.value,
            count: storeCatFiltered.masNode.count,
            categoryCount: storeCatFiltered.hidden.length,
            isMas: true,
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
            level: 3,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    if (itemGroupFiltered.masNode) {
        nodes.push({
            name: nodeName(3, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 3,
            originalName: 'Más',
            value: itemGroupFiltered.masNode.value,
            count: itemGroupFiltered.masNode.count,
            categoryCount: itemGroupFiltered.hidden.length,
            isMas: true,
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
            level: 4,
            originalName: cat.name,
            value: cat.value,
            count: cat.count,
        });
    }

    if (itemCatFiltered.masNode) {
        nodes.push({
            name: nodeName(4, 'Más'),
            itemStyle: { color: '#9ca3af' },
            level: 4,
            originalName: 'Más',
            value: itemCatFiltered.masNode.value,
            count: itemCatFiltered.masNode.count,
            categoryCount: itemCatFiltered.hidden.length,
            isMas: true,
        });
    }

    // Helper to add or merge links
    const addLink = (source: string, target: string, value: number) => {
        const existing = links.find(l => l.source === source && l.target === target);
        if (existing) {
            existing.value += value;
        } else {
            links.push({ source, target, value });
        }
    };

    // Links: Store Groups → Store Categories
    agg.storeGroupToStoreCategory.forEach((value, key) => {
        const [storeGroup, storeCat] = key.split('→');
        const sourceNode = visibleStoreGroups.has(storeGroup)
            ? nodeName(1, storeGroup)
            : storeGroupFiltered.masNode ? nodeName(1, 'Más') : null;
        const targetNode = visibleStoreCategories.has(storeCat)
            ? nodeName(2, storeCat)
            : storeCatFiltered.masNode ? nodeName(2, 'Más') : null;

        if (sourceNode && targetNode) {
            addLink(sourceNode, targetNode, value);
        }
    });

    // Links: Store Categories → Item Groups
    agg.storeCategoryToItemGroup.forEach((value, key) => {
        const [storeCat, itemGroup] = key.split('→');
        const sourceNode = visibleStoreCategories.has(storeCat)
            ? nodeName(2, storeCat)
            : storeCatFiltered.masNode ? nodeName(2, 'Más') : null;
        const targetNode = visibleItemGroups.has(itemGroup)
            ? nodeName(3, itemGroup)
            : itemGroupFiltered.masNode ? nodeName(3, 'Más') : null;

        if (sourceNode && targetNode) {
            addLink(sourceNode, targetNode, value);
        }
    });

    // Links: Item Groups → Item Categories
    agg.itemGroupToItemCategory.forEach((value, key) => {
        const [itemGroup, itemCat] = key.split('→');
        const sourceNode = visibleItemGroups.has(itemGroup)
            ? nodeName(3, itemGroup)
            : itemGroupFiltered.masNode ? nodeName(3, 'Más') : null;
        const targetNode = visibleItemCategories.has(itemCat)
            ? nodeName(4, itemCat)
            : itemCatFiltered.masNode ? nodeName(4, 'Más') : null;

        if (sourceNode && targetNode) {
            addLink(sourceNode, targetNode, value);
        }
    });

    return { nodes, links };
}

/**
 * Gets the default expansion state.
 */
export function getDefaultExpansion(): SankeyExpansionState {
    return { ...DEFAULT_EXPANSION };
}

/**
 * Checks if a node is a "Más" (aggregated) node.
 */
export function isMasNode(node: SankeyNode): boolean {
    return node.isMas === true || node.originalName === 'Más';
}

/**
 * Gets the count of hidden categories in a "Más" node.
 */
export function getMasCount(node: SankeyNode): number {
    return node.categoryCount || 0;
}
