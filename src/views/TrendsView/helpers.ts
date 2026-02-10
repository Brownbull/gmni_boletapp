/**
 * TrendsView Helper Functions
 *
 * Story 15-5b: Extracted from TrendsView.tsx
 *
 * Pure computation functions for period labels, currency formatting,
 * transaction filtering, and category data aggregation.
 */

import { normalizeItemCategory } from '../../utils/categoryNormalizer';
import {
    getCategoryPillColors,
    getItemGroupColors,
    getCurrentTheme,
    getCurrentMode,
    ALL_ITEM_CATEGORY_GROUPS,
    ITEM_CATEGORY_GROUPS,
    ITEM_CATEGORY_TO_KEY,
    type ItemCategoryGroup,
} from '../../config/categoryColors';
import { formatCurrency } from '../../utils/currency';
import { applyTreemapGrouping, buildProductKey, type MasEntryFactory } from '@/utils/categoryAggregation';
import { calculateChange } from '@features/analytics/utils/periodComparison';
import type { Transaction } from '../../types/transaction';
import type { TimePeriod, CurrentPeriod, CategoryData, TrendData } from './types';

// ============================================================================
// Constants
// ============================================================================

export const MONTH_NAMES_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MONTH_NAMES_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const CAROUSEL_TITLES_BASE = ['Distribución', 'Tendencia'] as const;

// ============================================================================
// Period & Formatting Helpers
// ============================================================================

/**
 * Format period label based on time period and locale
 */
export function getPeriodLabel(
    period: TimePeriod,
    current: CurrentPeriod,
    locale: string
): string {
    const monthNames = locale === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN;
    const monthName = monthNames[current.month - 1];
    const shortMonth = monthName.slice(0, 3);

    switch (period) {
        case 'week':
            return locale === 'es'
                ? `Semana ${current.week}, ${shortMonth} ${current.year}`
                : `Week ${current.week}, ${shortMonth} ${current.year}`;
        case 'month':
            return `${monthName} ${current.year}`;
        case 'quarter':
            return `Q${current.quarter} ${current.year}`;
        case 'year':
            return `${current.year}`;
    }
}

/**
 * Format currency in short form (e.g., $217k)
 */
export function formatShortCurrency(amount: number, currency: string): string {
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `$${Math.round(amount / 1000)}k`;
    }
    return formatCurrency(amount, currency);
}

// ============================================================================
// Transaction Filtering
// ============================================================================

/**
 * Filter transactions by period
 */
export function filterByPeriod(
    transactions: Transaction[],
    period: TimePeriod,
    current: CurrentPeriod
): Transaction[] {
    return transactions.filter(tx => {
        const txDate = new Date(tx.date);
        const txYear = txDate.getFullYear();
        const txMonth = txDate.getMonth() + 1;
        const txQuarter = Math.ceil(txMonth / 3);
        const txWeek = Math.ceil(txDate.getDate() / 7);

        if (txYear !== current.year) return false;

        switch (period) {
            case 'year':
                return true;
            case 'quarter':
                return txQuarter === current.quarter;
            case 'month':
                return txMonth === current.month;
            case 'week':
                return txMonth === current.month && txWeek === current.week;
        }
    });
}

// ============================================================================
// Category Data Computation
// ============================================================================

/**
 * Compute ALL category data from transactions (raw, unsorted by display logic)
 * Story 14.14b Session 6: Now tracks transaction IDs for accurate aggregation in groups
 */
export function computeAllCategoryData(transactions: Transaction[]): CategoryData[] {
    // Story 14.13 Session 5: Track both transaction count and item count
    // Story 14.13 Session 7: Changed to count unique products instead of raw line items
    const categoryMap: Record<string, { value: number; transactionIds: Set<string>; uniqueProducts: Set<string> }> = {};

    transactions.forEach((tx, index) => {
        const cat = tx.category || 'Otro';
        if (!categoryMap[cat]) {
            categoryMap[cat] = { value: 0, transactionIds: new Set(), uniqueProducts: new Set() };
        }
        categoryMap[cat].value += tx.total;
        // Use tx.id if available, otherwise fallback to index-based ID
        categoryMap[cat].transactionIds.add(tx.id ?? `tx-${index}`);
        // Story 14.13 Session 7: Track unique products by normalized name + merchant
        (tx.items || []).forEach(item => {
            const productKey = buildProductKey(item.name || '', tx.merchant || '');
            categoryMap[cat].uniqueProducts.add(productKey);
        });
    });

    const total = Object.values(categoryMap).reduce((sum, c) => sum + c.value, 0);

    return Object.entries(categoryMap)
        .map(([name, data]) => {
            // Story 14.21: Use getCategoryPillColors for charts (ALWAYS colorful)
            const pillColors = getCategoryPillColors(name);
            return {
                name,
                value: data.value,
                count: data.transactionIds.size,
                // Story 14.13 Session 7: Count unique products (matches Items view aggregation)
                itemCount: data.uniqueProducts.size,
                transactionIds: data.transactionIds,  // Keep for group aggregation
                color: pillColors.bg,      // Pastel bg for treemap cell backgrounds
                fgColor: pillColors.fg,    // Vibrant fg for donut segments & text
                percent: total > 0 ? Math.round((data.value / total) * 100) : 0,
            };
        })
        .sort((a, b) => b.value - a.value);
}

/**
 * Story 14.14b Session 4: Compute item category data from actual transaction line items.
 * This aggregates real data from tx.items instead of using mock data.
 * Story 14.14b Session 6: Now returns transactionIds for accurate group aggregation.
 */
export function computeItemCategoryData(transactions: Transaction[]): CategoryData[] {
    // Story 14.13 Session 7: Changed to count unique products (by normalized name+merchant) instead of raw line items
    const itemCategoryMap: Record<string, { value: number; transactionIds: Set<string>; uniqueProducts: Set<string> }> = {};

    transactions.forEach((tx, index) => {
        // Aggregate line items by their category
        (tx.items || []).forEach(item => {
            // Story 14.15b: Normalize legacy category names (V1/V2 -> V3)
            const cat = normalizeItemCategory(item.category || 'Other');
            if (!itemCategoryMap[cat]) {
                itemCategoryMap[cat] = { value: 0, transactionIds: new Set(), uniqueProducts: new Set() };
            }
            // Story 14.24: price is total for line item, qty is informational only
            itemCategoryMap[cat].value += item.price;
            // Track unique transaction IDs to count transactions, not items
            itemCategoryMap[cat].transactionIds.add(tx.id ?? `tx-${index}`);
            itemCategoryMap[cat].uniqueProducts.add(buildProductKey(item.name || '', tx.merchant || ''));
        });
    });

    const total = Object.values(itemCategoryMap).reduce((sum, c) => sum + c.value, 0);

    return Object.entries(itemCategoryMap)
        .map(([name, data]) => {
            const pillColors = getCategoryPillColors(name);
            return {
                name,
                value: data.value,
                count: data.transactionIds.size,
                itemCount: data.uniqueProducts.size,
                transactionIds: data.transactionIds,
                color: pillColors.bg,
                fgColor: pillColors.fg,
                percent: total > 0 ? Math.round((data.value / total) * 100) : 0,
            };
        })
        .sort((a, b) => b.value - a.value);
}

/**
 * Story 14.14b Session 4: Compute subcategory data from actual transaction line items.
 * Filters items by item category and aggregates by subcategory.
 * Count represents unique transactions, not individual items.
 * Story 14.14b Session 6: Now returns transactionIds for accurate group aggregation.
 */
export function computeSubcategoryData(
    transactions: Transaction[],
    itemCategoryFilter?: string
): CategoryData[] {
    // Story 14.13 Session 7: Changed to count unique products instead of raw line items
    const subcategoryMap: Record<string, { value: number; transactionIds: Set<string>; uniqueProducts: Set<string> }> = {};

    transactions.forEach((tx, index) => {
        (tx.items || []).forEach(item => {
            // Story 14.15b: Normalize legacy category names for comparison
            const normalizedItemCategory = normalizeItemCategory(item.category || 'Other');

            // Filter by item category if specified (compare normalized)
            if (itemCategoryFilter && normalizedItemCategory !== itemCategoryFilter) {
                return;
            }

            // Use subcategory if available, otherwise skip (we only show items with subcategories)
            const subcat = item.subcategory;
            if (!subcat) return;

            if (!subcategoryMap[subcat]) {
                subcategoryMap[subcat] = { value: 0, transactionIds: new Set(), uniqueProducts: new Set() };
            }
            // Story 14.24: price is total for line item, qty is informational only
            subcategoryMap[subcat].value += item.price;
            // Track unique transaction IDs to count transactions, not items
            subcategoryMap[subcat].transactionIds.add(tx.id ?? `tx-${index}`);
            // Story 14.13 Session 7: Track unique products by normalized name + merchant
            const productKey = buildProductKey(item.name || '', tx.merchant || '');
            subcategoryMap[subcat].uniqueProducts.add(productKey);
        });
    });

    const total = Object.values(subcategoryMap).reduce((sum, c) => sum + c.value, 0);

    return Object.entries(subcategoryMap)
        .map(([name, data]) => {
            const pillColors = getCategoryPillColors(name);
            return {
                name,
                value: data.value,
                count: data.transactionIds.size, // Count unique transactions, not items
                // Story 14.13 Session 7: Count unique products (matches Items view aggregation)
                itemCount: data.uniqueProducts.size,
                transactionIds: data.transactionIds, // Keep for group aggregation
                color: pillColors.bg,
                fgColor: pillColors.fg,
                percent: total > 0 ? Math.round((data.value / total) * 100) : 0,
            };
        })
        .sort((a, b) => b.value - a.value);
}

/**
 * Story 14.13 Session 7: Compute item groups dynamically from a store category's transactions.
 * Only returns item groups that have actual items in the filtered transactions.
 * This enables dynamic drill-down: Store Category → Item Groups (only groups with items in that store)
 */
export function computeItemGroupsForStore(
    transactions: Transaction[],
    storeCategoryName: string
): CategoryData[] {
    const theme = getCurrentTheme();
    const mode = getCurrentMode();
    // Filter transactions to only those matching the store category
    const filteredTx = transactions.filter(tx => tx.category === storeCategoryName);

    // Compute item categories from filtered transactions
    const itemCategories = computeItemCategoryData(filteredTx);

    // Aggregate into item groups
    const groupTotals: Record<ItemCategoryGroup, { value: number; transactionIds: Set<string>; itemCount: number }> = {
        'food-fresh': { value: 0, transactionIds: new Set(), itemCount: 0 },
        'food-packaged': { value: 0, transactionIds: new Set(), itemCount: 0 },
        'health-personal': { value: 0, transactionIds: new Set(), itemCount: 0 },
        'household': { value: 0, transactionIds: new Set(), itemCount: 0 },
        'nonfood-retail': { value: 0, transactionIds: new Set(), itemCount: 0 },
        'services-fees': { value: 0, transactionIds: new Set(), itemCount: 0 },
        'other-item': { value: 0, transactionIds: new Set(), itemCount: 0 },
    };

    // Aggregate item categories into groups
    for (const item of itemCategories) {
        const itemKey = ITEM_CATEGORY_TO_KEY[item.name as keyof typeof ITEM_CATEGORY_TO_KEY];
        const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
        groupTotals[group].value += item.value;
        if (item.transactionIds) {
            item.transactionIds.forEach(id => groupTotals[group].transactionIds.add(id));
        }
        groupTotals[group].itemCount += item.itemCount || 0;
    }

    const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

    return ALL_ITEM_CATEGORY_GROUPS
        .map(groupKey => {
            const data = groupTotals[groupKey];
            const colors = getItemGroupColors(groupKey, theme, mode);
            return {
                name: groupKey,
                value: data.value,
                count: data.transactionIds.size,
                itemCount: data.itemCount,
                transactionIds: data.transactionIds,
                color: colors.bg,
                fgColor: colors.fg,
                percent: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
            };
        })
        .filter(g => g.value > 0)
        .sort((a, b) => b.value - a.value);
}

/**
 * Story 14.13 Session 7: Compute item categories within a specific item group,
 * optionally filtered by store category.
 * Returns only item categories that belong to the group AND have actual data.
 * This enables dynamic drill-down: Item Group → Item Categories (only categories with items in that group)
 */
export function computeItemCategoriesInGroup(
    transactions: Transaction[],
    itemGroupKey: string,
    storeCategoryName?: string
): CategoryData[] {
    // Optionally filter by store category first
    const filteredTx = storeCategoryName
        ? transactions.filter(tx => tx.category === storeCategoryName)
        : transactions;

    // Compute all item categories from filtered transactions
    const allItemCategories = computeItemCategoryData(filteredTx);

    // Filter to only item categories that belong to the specified group
    return allItemCategories.filter(item => {
        const itemKey = ITEM_CATEGORY_TO_KEY[item.name as keyof typeof ITEM_CATEGORY_TO_KEY];
        const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
        return group === itemGroupKey;
    });
}

// ============================================================================
// Treemap & Trend Grouping
// ============================================================================

/**
 * Apply treemap display logic to category data:
 * 1. All categories >10%
 * 2. First category ≤10% (highest below threshold)
 * 3. "Otro" aggregating all remaining categories
 *
 * @param allCategories - All category data sorted by value descending
 * @param expandedCount - Number of additional categories to show from "Otro" (0 = collapsed)
 */
export function computeTreemapCategories(
    allCategories: CategoryData[],
    expandedCount: number
): { displayCategories: CategoryData[]; otroCategories: CategoryData[]; canExpand: boolean; canCollapse: boolean } {
    // Map CategoryData (value) to MasGroupable (amount) for shared utility
    const mapped = allCategories.map(c => ({ ...c, amount: c.value }));
    const masColors = getCategoryPillColors('Otro');

    const createMas: MasEntryFactory<CategoryData & { amount: number }> = (stats) => ({
        name: 'Más',
        value: stats.amount,
        amount: stats.amount,
        count: stats.count,
        itemCount: stats.itemCount,
        color: masColors.bg,
        fgColor: masColors.fg,
        percent: stats.percent,
        categoryCount: stats.categoryCount,
        transactionIds: stats.transactionIds,
    });

    const result = applyTreemapGrouping(mapped, expandedCount, createMas);

    // Strip the temporary `amount` field from results
    return {
        displayCategories: result.displayCategories.map(({ amount: _, ...rest }) => rest),
        otroCategories: result.otroCategories.map(({ amount: _, ...rest }) => rest),
        canExpand: result.canExpand,
        canCollapse: result.canCollapse,
    };
}

/**
 * Story 14.13.2: Compute trend categories with "Más" grouping for sparklines section
 * Similar to computeTreemapCategories but works with TrendData and preserves sparkline data
 *
 * @param allTrends - All trend data sorted by value descending
 * @param expandedCount - Number of additional categories to show from "Más" (0 = collapsed)
 */
export function computeTrendCategories(
    allTrends: TrendData[],
    expandedCount: number
): { displayTrends: TrendData[]; otroTrends: TrendData[]; canExpand: boolean; canCollapse: boolean } {
    if (allTrends.length === 0) {
        return { displayTrends: [], otroTrends: [], canExpand: false, canCollapse: false };
    }

    // Helper to check if category is aggregated "Más" group (not the real "Otro" category)
    const isAggregatedGroup = (name: string) => name === 'Más' || name === 'More';

    // Separate categories by threshold (excluding aggregated "Más" group from previous computations)
    const aboveThreshold = allTrends.filter(t => t.percent > 10 && !isAggregatedGroup(t.name));
    const belowThreshold = allTrends.filter(t => t.percent <= 10 && !isAggregatedGroup(t.name));

    // Start with all categories above 10%
    const displayTrends: TrendData[] = [...aboveThreshold];

    // Add first category below 10% if exists
    if (belowThreshold.length > 0) {
        displayTrends.push(belowThreshold[0]);
    }

    // Add expanded categories from "Más"
    const expandedTrends = belowThreshold.slice(1, 1 + expandedCount);
    displayTrends.push(...expandedTrends);

    // Remaining categories go into "Más"
    const otroTrends = belowThreshold.slice(1 + expandedCount);

    // If exactly 1 category would go into "Más", show it directly instead
    if (otroTrends.length === 1) {
        displayTrends.push(otroTrends[0]);
    } else if (otroTrends.length > 1) {
        // Multiple categories: aggregate into "Más"
        const masValue = otroTrends.reduce((sum, t) => sum + t.value, 0);
        const totalValue = allTrends.reduce((sum, t) => sum + t.value, 0);
        const masPercent = totalValue > 0 ? Math.round((masValue / totalValue) * 100) : 0;

        // Calculate unique transaction count by merging transaction ID sets
        const masTransactionIds = new Set<string>();
        otroTrends.forEach(t => {
            if (t.transactionIds) {
                t.transactionIds.forEach(id => masTransactionIds.add(id));
            } else {
                for (let i = 0; i < t.count; i++) {
                    masTransactionIds.add(`${t.name}-${i}`);
                }
            }
        });
        const masCount = masTransactionIds.size;

        // Sum item counts for "Más" group
        const masItemCount = otroTrends.reduce((sum, t) => sum + (t.itemCount || 0), 0);

        // Calculate aggregate previous value and change
        const masPreviousValue = otroTrends.reduce((sum, t) => sum + (t.previousValue || 0), 0);
        const changeResult = calculateChange(masValue, masPreviousValue);

        // Aggregate sparkline data by summing values for each point (sparkline is number[])
        const aggregatedSparkline: number[] = [];
        if (otroTrends.length > 0 && otroTrends[0].sparkline?.length) {
            const sparklineLength = otroTrends[0].sparkline.length;
            for (let i = 0; i < sparklineLength; i++) {
                let valueSum = 0;
                otroTrends.forEach(t => {
                    if (t.sparkline?.[i] !== undefined) {
                        valueSum += t.sparkline[i];
                    }
                });
                aggregatedSparkline.push(valueSum);
            }
        }

        // Use gray color for aggregated "Más" group
        const masColors = getCategoryPillColors('Otro');
        displayTrends.push({
            name: 'Más',
            value: masValue,
            count: masCount,
            itemCount: masItemCount,
            color: masColors.bg,
            fgColor: masColors.fg,
            percent: masPercent,
            categoryCount: otroTrends.length,
            transactionIds: masTransactionIds,
            sparkline: aggregatedSparkline,
            change: changeResult.percent,
            previousValue: masPreviousValue,
            changeDirection: changeResult.direction,
        });
    }

    // Determine expand/collapse state (only if 2+ categories would go to Más)
    const canExpand = otroTrends.length > 1;
    const canCollapse = expandedCount > 0;

    return { displayTrends, otroTrends, canExpand, canCollapse };
}
