/**
 * TrendsView - "Explora" Analytics View
 *
 * Story 14.13: Analytics Explorer Redesign
 * Epic 14: Core Implementation
 *
 * Redesigned analytics view matching analytics-polygon.html mockup:
 * - "Explora" header with filter icons
 * - Time period pills (Semana/Mes/Trimestre/Año)
 * - Period navigator (< Diciembre 2025 >)
 * - Analytics carousel with Distribution and Tendencia slides
 * - Treemap grid with category breakdown
 * - Trend list with sparklines
 *
 * @see docs/sprint-artifacts/epic14/stories/story-14.13-analytics-polygon-integration.md
 * @see docs/uxui/mockups/01_views/analytics-polygon.html
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, PieChart, LayoutGrid, Plus, Minus, Receipt, Package, GitBranch, List } from 'lucide-react';
// Story 14.13: Animation components
import { PageTransition } from '../components/animation/PageTransition';
import { TransitionChild } from '../components/animation/TransitionChild';
// Story 14.40: Category statistics popup
import { CategoryStatisticsPopup } from '../components/analytics/CategoryStatisticsPopup';
import { useCategoryStatistics, type CategoryFilterType } from '../hooks/useCategoryStatistics';
// Story 14.14b: Profile dropdown for consistent header
import { ProfileDropdown, ProfileAvatar, getInitials } from '../components/ProfileDropdown';
// Story 14.14b: IconFilterBar for consistent filter dropdowns
import { IconFilterBar } from '../components/history/IconFilterBar';
import { useHistoryFilters } from '../hooks/useHistoryFilters';
import {
    extractAvailableFilters,
    buildYearFilter,
    buildQuarterFilter,
    buildMonthFilter,
    buildWeekFilter,
    filterTransactionsByHistoryFilters,
} from '../utils/historyFilterUtils';
import type { HistoryFilterState } from '../contexts/HistoryFiltersContext';
import { useAllUserGroups } from '../hooks/useAllUserGroups';
import { MemberContributionChart } from '@/features/shared-groups';
import { calculateMemberContributions, type AnalyticsMember } from '../hooks/useAnalyticsTransactions';
// Story 14.13: Hooks
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useCountUp } from '../hooks/useCountUp';
// Utilities
// Story 14.21: Use getCategoryColorsAuto for treemap text - respects fontColorMode setting
// Story 14.21: Use getCategoryPillColors for charts/legends - ALWAYS colorful
// Story 14.14b: Category group helpers for donut view mode data transformation
// Story 14.15b: Category normalization for legacy data compatibility
import { normalizeItemCategory } from '../utils/categoryNormalizer';
import {
    getCategoryColorsAuto,
    getCategoryPillColors,
    getContrastTextColor,
    ALL_STORE_CATEGORY_GROUPS,
    ALL_ITEM_CATEGORY_GROUPS,
    STORE_CATEGORY_GROUPS,
    ITEM_CATEGORY_GROUPS,
    ITEM_CATEGORY_TO_KEY,
    getStoreGroupColors,
    getItemGroupColors,
    getCurrentTheme,
    getCurrentMode,
    expandStoreCategoryGroup,
    expandItemCategoryGroup,
    type StoreCategoryGroup,
    type ItemCategoryGroup,
} from '../config/categoryColors';
import { formatCurrency } from '../utils/currency';
import { getCategoryEmoji } from '../utils/categoryEmoji';
import { calculateTreemapLayout, categoryDataToTreemapItems } from '../utils/treemapLayout';
import {
    translateCategory,
    translateStoreCategoryGroup,
    translateItemCategoryGroup,
    getStoreCategoryGroupEmoji,
    getItemCategoryGroupEmoji,
    getItemCategoryEmoji,
} from '../utils/categoryTranslations';
import type { Transaction } from '../types/transaction';
// Story 14.13.3: Sankey chart for flow visualization
import { SankeyChart, type SankeySelectionData } from '../components/analytics/SankeyChart';
import type { SankeyMode } from '../utils/sankeyDataBuilder';
// Story 14e-25b.1: ColorTheme now comes from TrendsViewData type
// Story 14.13.2: Period comparison utilities
import {
    getPreviousPeriod,
    calculateChange,
    isDateInPeriod,
    type PeriodIdentifier,
} from '../utils/periodComparison';
// Story 14e-25d: Direct navigation from store and shared hooks (ViewHandlersContext deleted)
import { useNavigationActions } from '@/shared/stores';
import { useHistoryNavigation } from '@/shared/hooks';
// Story 14c-refactor.31a: View type for proper type assertion
import type { View } from '../components/App/types';
// Story 14e-25b.1: Internal data hook for view-owned data pattern
import { useTrendsViewData, type TrendsViewData } from './TrendsView/useTrendsViewData';

// ============================================================================
// Types
// ============================================================================

/** Time period granularity for pills */
type TimePeriod = 'week' | 'month' | 'quarter' | 'year';

// Note: ActiveDropdown and CategoryFilter types moved to IconFilterBar

/** Current period state */
interface CurrentPeriod {
    year: number;
    month: number;
    quarter: number;
    week: number;
}

/** Carousel slide index */
// 0 = Distribution, 1 = Tendencia, 2 = Contribuciones (group mode only)
type CarouselSlide = 0 | 1 | 2;

/** View toggle state per slide */
type DistributionView = 'treemap' | 'donut';
type TendenciaView = 'list' | 'sankey';

/**
 * Story 14.14b: Donut chart view mode - controls what data level is displayed
 * - 'store-groups': Transaction category groups (Essential, Lifestyle, etc.)
 * - 'store-categories': Transaction categories (Supermercado, Restaurante, etc.) - DEFAULT
 * - 'item-groups': Item category groups (Fresh Food, Packaged Food, etc.)
 * - 'item-categories': Item categories (Carnes y Mariscos, Lácteos, etc.)
 */
type DonutViewMode = 'store-groups' | 'store-categories' | 'item-groups' | 'item-categories';

/** Category data for treemap/charts */
interface CategoryData {
    name: string;
    value: number;
    count: number;  // Transaction count
    itemCount: number;  // Story 14.13 Session 5: Item/product count for count mode toggle
    color: string;
    fgColor: string;  // Story 14.21: Foreground color for text contrast
    percent: number;
    categoryCount?: number;  // Number of categories aggregated (only for "Más" group)
    transactionIds?: Set<string>;  // Story 14.14b Session 6: Track unique transactions for accurate aggregation
}

/** Trend data with sparkline */
interface TrendData extends CategoryData {
    sparkline: number[];
    change: number;
    /** Story 14.13.2: Period comparison fields */
    previousValue?: number;
    changeDirection?: 'up' | 'down' | 'same' | 'new';
}

/**
 * Story 14.13a: Drill-down path for multi-level filter tracking.
 * Re-exported from analyticsToHistoryFilters for convenience.
 */
export interface DrillDownPath {
    /** Store category group (e.g., "food-dining") */
    storeGroup?: string;
    /** Store category (e.g., "Supermercado") */
    storeCategory?: string;
    /** Item category group (e.g., "food-fresh") */
    itemGroup?: string;
    /** Item category (e.g., "Carnes y Mariscos") */
    itemCategory?: string;
    /** Subcategory (e.g., "Res") */
    subcategory?: string;
}

/** Navigation payload for History/Items view */
export interface HistoryNavigationPayload {
    /** Story 14.13 Session 5: Target view - 'history' for Compras, 'items' for Productos */
    targetView?: 'history' | 'items';
    /** Store category filter (e.g., "Supermarket", "Restaurant") */
    category?: string;
    /** Store category group filter (e.g., "Essentials", "Entertainment") */
    storeGroup?: string;
    /** Item category group filter (e.g., "Produce", "Beverages") */
    itemGroup?: string;
    /** Item category/subcategory filter (e.g., "Fruits", "Soft Drinks") */
    itemCategory?: string;
    temporal?: {
        level: string;
        year?: string;
        month?: string;
        quarter?: string;
    };
    /** Story 14.13 Session 7: Source distribution view for back navigation */
    sourceDistributionView?: 'treemap' | 'donut';
    /**
     * Story 14.13a: Full drill-down path for multi-dimension filtering.
     * When present, allows filtering by multiple dimensions simultaneously.
     */
    drillDownPath?: DrillDownPath;
}

/**
 * Story 14e-25b.1: TrendsView props interface.
 *
 * The view now owns its data via useTrendsViewData() hook internally.
 * Props are ONLY used for test data injection via __testData.
 * In production, App.tsx renders <TrendsView /> with no props.
 */
export interface TrendsViewProps {
    /**
     * Story 14e-25b.1: Test data override for testing.
     * When provided, these values override the hook data.
     * Production code should NOT pass this prop.
     */
    __testData?: Partial<TrendsViewData>;
}

// ============================================================================
// Constants
// ============================================================================

const MONTH_NAMES_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_NAMES_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Base carousel titles - Contribuciones (slide 2) only shown in group mode
const CAROUSEL_TITLES_BASE = ['Distribución', 'Tendencia'] as const;
const CAROUSEL_TITLES_GROUP = ['Distribución', 'Tendencia', 'Contribuciones'] as const;

// Note: ALL_FILTER_CATEGORIES and ALL_FILTER_GROUPS moved to IconFilterBar

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format period label based on time period and locale
 */
function getPeriodLabel(
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
function formatShortCurrency(amount: number, currency: string): string {
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `$${Math.round(amount / 1000)}k`;
    }
    return formatCurrency(amount, currency);
}

/**
 * Filter transactions by period
 */
function filterByPeriod(
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

/**
 * Compute ALL category data from transactions (raw, unsorted by display logic)
 * Story 14.14b Session 6: Now tracks transaction IDs for accurate aggregation in groups
 */
function computeAllCategoryData(transactions: Transaction[]): CategoryData[] {
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
            const normalizedName = (item.name || 'Unknown').toLowerCase().trim().replace(/\s+/g, ' ');
            const normalizedMerchant = (tx.merchant || 'unknown').toLowerCase().trim().replace(/\s+/g, ' ');
            const productKey = `${normalizedName}::${normalizedMerchant}`;
            categoryMap[cat].uniqueProducts.add(productKey);
        });
    });

    const total = Object.values(categoryMap).reduce((sum, c) => sum + c.value, 0);

    return Object.entries(categoryMap)
        .map(([name, data]) => {
            // Story 14.21: Use getCategoryPillColors for charts (ALWAYS colorful)
            // This ensures donut/treemap segments have vibrant, distinct colors
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
function computeItemCategoryData(transactions: Transaction[]): CategoryData[] {
    // Story 14.13 Session 5: Track value, transaction IDs, AND item count per category
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
            // Story 14.13 Session 7: Track unique products by normalized name + merchant
            // This matches how Items view aggregates products
            const normalizedName = (item.name || 'Unknown').toLowerCase().trim().replace(/\s+/g, ' ');
            const normalizedMerchant = (tx.merchant || 'unknown').toLowerCase().trim().replace(/\s+/g, ' ');
            const productKey = `${normalizedName}::${normalizedMerchant}`;
            itemCategoryMap[cat].uniqueProducts.add(productKey);
        });
    });

    const total = Object.values(itemCategoryMap).reduce((sum, c) => sum + c.value, 0);

    return Object.entries(itemCategoryMap)
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
 * Story 14.14b Session 4: Compute subcategory data from actual transaction line items.
 * Filters items by item category and aggregates by subcategory.
 * Count represents unique transactions, not individual items.
 * Story 14.14b Session 6: Now returns transactionIds for accurate group aggregation.
 */
function computeSubcategoryData(
    transactions: Transaction[],
    itemCategoryFilter?: string
): CategoryData[] {
    // Story 14.13 Session 5: Track item count along with value and transaction IDs
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
            const normalizedName = (item.name || 'Unknown').toLowerCase().trim().replace(/\s+/g, ' ');
            const normalizedMerchant = (tx.merchant || 'unknown').toLowerCase().trim().replace(/\s+/g, ' ');
            const productKey = `${normalizedName}::${normalizedMerchant}`;
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
function computeItemGroupsForStore(
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
function computeItemCategoriesInGroup(
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

/**
 * Apply treemap display logic to category data:
 * 1. All categories >10%
 * 2. First category ≤10% (highest below threshold)
 * 3. "Otro" aggregating all remaining categories
 *
 * @param allCategories - All category data sorted by value descending
 * @param expandedCount - Number of additional categories to show from "Otro" (0 = collapsed)
 */
function computeTreemapCategories(
    allCategories: CategoryData[],
    expandedCount: number
): { displayCategories: CategoryData[]; otroCategories: CategoryData[]; canExpand: boolean; canCollapse: boolean } {
    if (allCategories.length === 0) {
        return { displayCategories: [], otroCategories: [], canExpand: false, canCollapse: false };
    }

    // Helper to check if category is aggregated "Más" group (not the real "Otro" category)
    // "Más" = aggregated small categories, "Otro"/"Other" = real transaction category
    const isAggregatedGroup = (name: string) => name === 'Más' || name === 'More';

    // Separate categories by threshold (excluding aggregated "Más" group from previous computations)
    const aboveThreshold = allCategories.filter(c => c.percent > 10 && !isAggregatedGroup(c.name));
    const belowThreshold = allCategories.filter(c => c.percent <= 10 && !isAggregatedGroup(c.name));

    // Start with all categories above 10%
    const displayCategories: CategoryData[] = [...aboveThreshold];

    // Add first category below 10% if exists
    if (belowThreshold.length > 0) {
        displayCategories.push(belowThreshold[0]);
    }

    // Add expanded categories from "Otro"
    const expandedCategories = belowThreshold.slice(1, 1 + expandedCount);
    displayCategories.push(...expandedCategories);

    // Remaining categories go into "Otro"
    const otroCategories = belowThreshold.slice(1 + expandedCount);

    // If exactly 1 category would go into "Más", show it directly instead
    if (otroCategories.length === 1) {
        displayCategories.push(otroCategories[0]);
    } else if (otroCategories.length > 1) {
        // Multiple categories: aggregate into "Más" (not "Otro" to avoid conflict with real "Otro" category)
        const masValue = otroCategories.reduce((sum, c) => sum + c.value, 0);
        const totalValue = allCategories.reduce((sum, c) => sum + c.value, 0);
        const masPercent = totalValue > 0 ? Math.round((masValue / totalValue) * 100) : 0;

        // Story 14.14b Session 6: Calculate unique transaction count by merging transaction ID sets
        // This prevents double-counting when a transaction has items in multiple categories within "Más"
        const masTransactionIds = new Set<string>();
        otroCategories.forEach(c => {
            if (c.transactionIds) {
                c.transactionIds.forEach(id => masTransactionIds.add(id));
            } else {
                // Fallback for categories without transactionIds (e.g., store categories counted by count)
                // In this case, count is already accurate (one tx per category)
                for (let i = 0; i < c.count; i++) {
                    masTransactionIds.add(`${c.name}-${i}`);
                }
            }
        });
        const masCount = masTransactionIds.size;

        // Story 14.13 Session 5: Sum item counts for "Más" group
        const masItemCount = otroCategories.reduce((sum, c) => sum + (c.itemCount || 0), 0);

        // Use gray color for aggregated "Más" group
        const masColors = getCategoryPillColors('Otro'); // Reuse Otro colors (gray)
        displayCategories.push({
            name: 'Más',
            value: masValue,
            count: masCount,
            itemCount: masItemCount,  // Story 14.13 Session 5
            color: masColors.bg,
            fgColor: masColors.fg,
            percent: masPercent,
            categoryCount: otroCategories.length,  // Number of categories inside "Más"
            transactionIds: masTransactionIds,  // Keep for further aggregation if needed
        });
    }

    // Determine expand/collapse state (only if 2+ categories would go to Más)
    const canExpand = otroCategories.length > 1;
    const canCollapse = expandedCount > 0;

    return { displayCategories, otroCategories, canExpand, canCollapse };
}

/**
 * Story 14.13.2: Compute trend categories with "Más" grouping for sparklines section
 * Similar to computeTreemapCategories but works with TrendData and preserves sparkline data
 *
 * @param allTrends - All trend data sorted by value descending
 * @param expandedCount - Number of additional categories to show from "Más" (0 = collapsed)
 */
function computeTrendCategories(
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
// ============================================================================
// Sub-Components
// ============================================================================

/** Circular progress badge for percentage display with animated value (matches Dashboard) */
const CircularProgress: React.FC<{
    animatedPercent: number;
    size: number;
    strokeWidth: number;
    fgColor?: string;  // Story 14.21: Foreground color for text/stroke contrast
    fontSize?: number; // Optional override for percentage text size
}> = ({ animatedPercent, size, strokeWidth, fgColor = 'white', fontSize }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (animatedPercent / 100) * circumference;
    // Use provided fontSize or calculate based on size
    const textSize = fontSize ?? (size <= 24 ? 8 : 10);

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle - Story 14.21: Use fgColor with transparency */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={fgColor}
                    strokeOpacity={0.3}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle - Story 14.21: Use fgColor for stroke */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={fgColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.05s ease-out' }}
                />
            </svg>
            {/* Percentage text - Story 14.21: Use fgColor for text */}
            <span
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${textSize}px`,
                    fontWeight: 600,
                    color: fgColor,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }}
            >
                {animatedPercent}%
            </span>
        </div>
    );
};

/** Animated treemap cell component with count-up effect (matches Dashboard design) */
const AnimatedTreemapCell: React.FC<{
    data: CategoryData;
    isMainCell: boolean;
    onClick: () => void;
    currency: string;
    gridRow?: string;
    gridColumn?: string;
    animationKey: number;
    locale?: string;
    t?: (key: string) => string;
    viewMode?: DonutViewMode; // Story 14.14b Session 5: View mode for correct translation
    onTransactionCountClick?: (categoryName: string) => void; // Story 14.22: Navigate to transactions
    onIconClick?: (categoryName: string, emoji: string, color: string) => void; // Story 14.40: Open statistics popup
    style?: React.CSSProperties; // Story 14.13: Support squarified treemap absolute positioning
    cellWidthPercent?: number; // Story 14.13: Cell width % for compact layout detection
    cellHeightPercent?: number; // Story 14.13: Cell height % for compact layout detection
    iconType?: 'receipt' | 'package'; // Story 14.13 Session 5: Receipt for transactions, Package for items
    index?: number; // Story 14.13.3: Cell index for staggered entrance animation
}> = ({ data, isMainCell, onClick, gridRow, gridColumn, animationKey, locale = 'es', t, viewMode = 'store-categories', onTransactionCountClick, onIconClick, style, cellWidthPercent = 100, cellHeightPercent = 100, iconType = 'receipt', index = 0 }) => {
    // Story 14.13.3: Entrance animation state - cells animate from top-left to final position
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Staggered entrance: each cell delays based on its index (50ms per cell)
        const timer = setTimeout(() => setIsVisible(true), index * 50);
        return () => clearTimeout(timer);
    }, [index, animationKey]);

    // Animated values using useCountUp hook
    const animatedAmount = useCountUp(Math.round(data.value / 1000), { duration: 1200, startValue: 0, key: animationKey });
    const animatedPercent = useCountUp(Math.round(data.percent), { duration: 1200, startValue: 0, key: animationKey });
    // Story 14.13 Session 5: Use itemCount when in item mode, otherwise use transaction count
    const displayCount = iconType === 'package' ? (data.itemCount || 0) : data.count;
    const animatedCount = useCountUp(displayCount, { duration: 800, startValue: 0, key: animationKey });

    // Story 14.13: Get text color respecting fontColorMode setting (plain vs colorful)
    // getCategoryColorsAuto returns plain text (black/white) when fontColorMode is 'plain'
    // and category-specific colors when fontColorMode is 'colorful'
    const textColors = getCategoryColorsAuto(data.name);
    const textColor = textColors.fg;

    // Story 14.13: Detect compact layout needed for small cells
    // Compact layout stacks all info vertically - works well for narrow cells
    // Tiny layout shows only emoji + count badge for the very smallest cells
    const cellArea = cellWidthPercent * cellHeightPercent;
    // Only use tiny layout for very small cells (area < 100 or width < 10%)
    // This ensures cells like "Comida" and the pet icon get the compact layout with all info
    const isTinyCell = cellArea < 100 || cellWidthPercent < 10 || cellHeightPercent < 8;
    // Use compact (vertical stack) for any non-main cell that isn't tiny
    // This ensures consistent layout for medium-sized cells like "Hogar", "Productos para Mascotas"
    const isCompactCell = !isTinyCell && !isMainCell && (cellArea < 2000 || cellWidthPercent < 45);

    // Circle sizes - responsive: smaller on narrow screens
    // Main cell: 36px, Small cells: 28px (increased from 24px for better readability)
    const circleSize = isMainCell ? 36 : 28;
    const strokeWidth = isMainCell ? 3 : 2;
    // Override font size for small cells to improve readability (default 0.38 multiplier is too small)
    const circleFontSize = isMainCell ? undefined : 11;

    // Story 14.14b Session 5: Get emoji based on view mode
    // Story 14.13: Use getItemCategoryEmoji for item-categories view mode
    const emoji = useMemo(() => {
        // "Más" = aggregated small categories group (expandable)
        if (data.name === 'Más' || data.name === 'More') {
            return '📁'; // Folder emoji for aggregated "Más" group
        }
        switch (viewMode) {
            case 'store-groups':
                return getStoreCategoryGroupEmoji(data.name as StoreCategoryGroup);
            case 'item-groups':
                return getItemCategoryGroupEmoji(data.name as ItemCategoryGroup);
            case 'item-categories':
                return getItemCategoryEmoji(data.name);
            case 'store-categories':
            default:
                return getCategoryEmoji(data.name);
        }
    }, [data.name, viewMode]);

    // Story 14.14b Session 5: Translate name based on view mode
    const displayName = useMemo(() => {
        // "Más" = aggregated small categories group (expandable)
        if (data.name === 'Más' || data.name === 'More') {
            return locale === 'es' ? 'Más' : 'More';
        }
        switch (viewMode) {
            case 'store-groups':
                return translateStoreCategoryGroup(data.name as StoreCategoryGroup, locale as 'en' | 'es');
            case 'item-groups':
                return translateItemCategoryGroup(data.name as ItemCategoryGroup, locale as 'en' | 'es');
            case 'store-categories':
            case 'item-categories':
            default:
                return translateCategory(data.name, locale as 'en' | 'es');
        }
    }, [data.name, viewMode, locale, t]);

    // Story 14.13.3: Entrance animation styles - cells slide from top-left to final position
    const entranceAnimationStyle: React.CSSProperties = {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0, 0) scale(1)' : 'translate(-20px, -20px) scale(0.8)',
        transition: 'opacity 300ms ease-out, transform 300ms ease-out',
    };

    // Story 14.13: Tiny cells show only emoji + transaction count in a centered layout
    if (isTinyCell) {
        return (
            <div
                key={`${data.name}-${animationKey}`}
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                }}
                role="button"
                tabIndex={0}
                className="rounded-md flex items-center justify-center gap-0.5 overflow-hidden transition-transform hover:scale-[0.98] active:scale-95 cursor-pointer"
                style={{
                    backgroundColor: data.color,
                    padding: '2px',
                    ...style,
                    ...entranceAnimationStyle,
                }}
                aria-label={`${displayName}: $${animatedAmount}k, ${data.count} ${locale === 'es' ? 'transacciones' : 'transactions'}`}
                data-testid={`treemap-cell-${data.name.toLowerCase()}`}
            >
                {/* Story 14.40: Emoji is clickable to show statistics popup */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onIconClick?.(data.name, emoji, data.fgColor || data.color);
                    }}
                    className="cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                    style={{ fontSize: '12px', lineHeight: 1, background: 'none', border: 'none', padding: 0 }}
                    aria-label={`${displayName} ${locale === 'es' ? 'estadísticas' : 'statistics'}`}
                >
                    {emoji}
                </button>
                {/* Show count badge only if there's enough width */}
                {cellWidthPercent >= 12 && (
                    <span
                        className="inline-flex items-center justify-center rounded-full"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            color: textColor,
                            fontSize: '8px',
                            fontWeight: 600,
                            minWidth: '14px',
                            height: '14px',
                            padding: '0 2px',
                        }}
                    >
                        {animatedCount}
                    </span>
                )}
            </div>
        );
    }

    // Story 14.13: Compact cells show all info stacked vertically in a single column
    // Layout: Emoji+Name (top), Percentage circle, Transaction count, Amount (bottom)
    if (isCompactCell) {
        return (
            <div
                key={`${data.name}-${animationKey}`}
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                }}
                role="button"
                tabIndex={0}
                className="rounded-lg flex flex-col justify-between overflow-hidden text-left transition-transform hover:scale-[0.98] active:scale-95 cursor-pointer"
                style={{
                    backgroundColor: data.color,
                    padding: '6px',
                    ...style,
                    ...entranceAnimationStyle,
                }}
                aria-label={`${displayName}: $${animatedAmount}k`}
                data-testid={`treemap-cell-${data.name.toLowerCase()}`}
            >
                {/* Top: Emoji + truncated name - Story 14.37: category name scales with font size setting */}
                <div className="flex items-center gap-1.5 min-w-0">
                    {/* Story 14.40: Emoji is clickable to show statistics popup */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onIconClick?.(data.name, emoji, data.fgColor || data.color);
                        }}
                        className="cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                        style={{ fontSize: '14px', lineHeight: 1, background: 'none', border: 'none', padding: 0 }}
                        aria-label={`${displayName} ${locale === 'es' ? 'estadísticas' : 'statistics'}`}
                    >
                        {emoji}
                    </button>
                    <span
                        className="font-bold truncate"
                        style={{
                            fontSize: 'var(--font-size-sm)',
                            color: textColor,
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                    >
                        {displayName}
                    </span>
                </div>
                {/* Bottom section: Percentage, Count, Amount stacked vertically */}
                <div className="flex flex-col gap-0.5 items-start">
                    {/* Percentage circle - smaller for compact */}
                    <CircularProgress
                        animatedPercent={animatedPercent}
                        size={24}
                        strokeWidth={2}
                        fgColor={textColor}
                        fontSize={10}
                    />
                    {/* Count pill - Receipt for transactions, Package for items */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTransactionCountClick?.(data.name);
                        }}
                        className="inline-flex items-center gap-[2px] px-[5px] py-[1px] rounded-full transition-opacity hover:opacity-80 active:opacity-60"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.85)',
                            color: textColor,
                            fontSize: '10px',
                        }}
                        aria-label={`${locale === 'es' ? 'Ver' : 'View'} ${data.count} ${iconType === 'package' ? (locale === 'es' ? 'productos' : 'items') : (locale === 'es' ? 'transacciones' : 'transactions')}`}
                    >
                        {iconType === 'package' ? <Package size={10} strokeWidth={2} /> : <Receipt size={10} strokeWidth={2} />}
                        {animatedCount}
                    </button>
                    {/* Amount */}
                    <div
                        className="font-bold"
                        style={{
                            fontSize: '14px',
                            color: textColor,
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                    >
                        ${animatedAmount}k
                    </div>
                </div>
            </div>
        );
    }

    // Standard cell layout (full content)
    return (
        <div
            key={`${data.name}-${animationKey}`}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            role="button"
            tabIndex={0}
            className="rounded-lg flex flex-col justify-between overflow-hidden text-left transition-transform hover:scale-[0.98] active:scale-95 cursor-pointer"
            style={{
                backgroundColor: data.color,
                gridRow: gridRow,
                gridColumn: gridColumn,
                padding: isMainCell ? '8px 8px' : '6px 6px',
                // Ensure minimum height when in flex container (scrollable mode)
                minHeight: isMainCell ? undefined : '60px',
                flexShrink: 0,
                // Story 14.13: Merge with passed style for squarified treemap positioning
                ...style,
                // Story 14.13.3: Entrance animation
                ...entranceAnimationStyle,
            }}
            aria-label={`${displayName}: $${animatedAmount}k`}
            data-testid={`treemap-cell-${data.name.toLowerCase()}`}
        >
            {/* Top row: Emoji + Category name */}
            <div className="flex items-center gap-1.5 min-w-0">
                {/* Story 14.40: Emoji is clickable to show statistics popup */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onIconClick?.(data.name, emoji, data.fgColor || data.color);
                    }}
                    className="cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                    style={{ fontSize: '16px', lineHeight: 1, background: 'none', border: 'none', padding: 0 }}
                    aria-label={`${displayName} ${locale === 'es' ? 'estadísticas' : 'statistics'}`}
                >
                    {emoji}
                </button>
                {/* Category name - Story 14.37: scales with font size setting */}
                <div
                    className="font-bold truncate flex items-center gap-1"
                    style={{
                        fontSize: 'var(--font-size-sm)',
                        color: textColor,
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                >
                    {displayName}
                    {/* Badge showing count of categories inside "Más" group */}
                    {data.categoryCount && (
                        <span
                            className="inline-flex items-center justify-center rounded-full"
                            style={{
                                backgroundColor: 'transparent',
                                border: `1.5px solid ${textColor}`,
                                color: textColor,
                                fontSize: '10px',
                                fontWeight: 600,
                                minWidth: '18px',
                                height: '18px',
                                padding: '0 4px',
                            }}
                        >
                            {data.categoryCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Bottom section: Count + Amount (left), Percentage circle (bottom right) */}
            {/* Story 14.13: Unified layout for squarified treemap cells */}
            {/* Story 14.13 Session 5: Receipt icon for transactions, Package icon for items */}
            <div className="flex items-end justify-between">
                {/* Left side: count above amount */}
                <div className="flex flex-col gap-0.5">
                    {/* Count pill - Story 14.22: Clickable to navigate to transactions/items */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTransactionCountClick?.(data.name);
                        }}
                        className="inline-flex items-center gap-[2px] px-[5px] py-[1px] rounded-full transition-opacity hover:opacity-80 active:opacity-60 self-start"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.85)',
                            color: textColor,
                            fontSize: isMainCell ? '11px' : '10px',
                        }}
                        aria-label={`${locale === 'es' ? 'Ver' : 'View'} ${data.count} ${iconType === 'package' ? (locale === 'es' ? 'productos' : 'items') : (locale === 'es' ? 'transacciones' : 'transactions')}`}
                    >
                        {iconType === 'package' ? <Package size={isMainCell ? 11 : 10} strokeWidth={2} /> : <Receipt size={isMainCell ? 11 : 10} strokeWidth={2} />}
                        {animatedCount}
                    </button>
                    {/* Amount - left aligned below count */}
                    <div
                        className="font-bold"
                        style={{
                            fontSize: isMainCell ? '22px' : '16px',
                            color: textColor,
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                    >
                        ${animatedAmount}k
                    </div>
                </div>
                {/* Right side: Percentage circle - bottom right */}
                <CircularProgress
                    animatedPercent={animatedPercent}
                    size={circleSize}
                    strokeWidth={strokeWidth}
                    fgColor={textColor}
                    fontSize={circleFontSize}
                />
            </div>
        </div>
    );
};

/** Drill-down data for Level 2 (item groups within a category) */
interface DrillDownGroupData {
    name: string;
    value: number;
    count: number;
    color: string;
    fgColor: string;  // Story 14.21: Foreground color for text contrast
    percent: number;
}

/**
 * Story 14.13.3: Animated amount with percentage bar component
 * Provides count-up animation for amount value with inline percentage bar
 */
const AnimatedAmountBar: React.FC<{
    value: number;
    percent: number;
    animationKey: number;
    currency: string;
    legendTextColor: string;
    isDark: boolean;
    maxPercent: number;
    fgColor: string;
}> = ({ value, percent, animationKey, currency, legendTextColor, isDark, maxPercent, fgColor }) => {
    const animatedValue = useCountUp(value, { duration: 800, startValue: 0, key: animationKey });
    const animatedPercent = useCountUp(percent, { duration: 600, startValue: 0, key: animationKey });

    return (
        <span
            className="text-xs flex items-center gap-2"
            style={{ color: legendTextColor, opacity: 0.7 }}
        >
            {formatCurrency(animatedValue, currency)}
            <span
                className="rounded-full overflow-hidden inline-block"
                style={{
                    width: '70px',
                    height: '3px',
                    backgroundColor: isDark ? 'rgba(100, 116, 139, 0.3)' : 'rgba(226, 232, 240, 0.8)',
                }}
                aria-label={`${animatedPercent}% of spending`}
            >
                <span
                    className="block h-full rounded-full transition-all duration-300"
                    style={{
                        width: `${(animatedPercent / maxPercent) * 100}%`,
                        backgroundColor: fgColor,
                    }}
                />
            </span>
        </span>
    );
};

/**
 * Story 14.13.3: Animated count pill component
 */
const AnimatedCountPill: React.FC<{
    count: number;
    itemCount: number;
    animationKey: number;
    countMode: 'transactions' | 'items';
    isDark: boolean;
    locale: string;
    onCountClick: () => void;
    categoryName: string;
}> = ({ count, itemCount, animationKey, countMode, isDark, locale, onCountClick, categoryName }) => {
    const animatedCount = useCountUp(countMode === 'items' ? itemCount : count, { duration: 600, startValue: 0, key: animationKey });

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onCountClick();
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                isDark
                    ? 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            aria-label={`${locale === 'es' ? 'Ver' : 'View'} ${animatedCount} ${
                countMode === 'items'
                    ? (locale === 'es' ? 'productos' : 'items')
                    : (locale === 'es' ? 'transacciones' : 'transactions')
            }`}
            data-testid={`transaction-count-pill-${categoryName.toLowerCase().replace(/\s+/g, '-')}`}
        >
            {countMode === 'items' ? <Package size={12} /> : <Receipt size={12} />}
            <span>{animatedCount}</span>
        </button>
    );
};

/**
 * Story 14.13.3: Animated percentage component
 */
const AnimatedPercent: React.FC<{
    percent: number;
    animationKey: number;
    legendTextColor: string;
}> = ({ percent, animationKey, legendTextColor }) => {
    const animatedPercent = useCountUp(percent, { duration: 600, startValue: 0, key: animationKey });

    return (
        <span
            className="text-sm font-semibold"
            style={{ color: legendTextColor }}
        >
            {animatedPercent}%
        </span>
    );
};

/** Donut Chart component with header, interactive segments, and legend */
const DonutChart: React.FC<{
    categoryData: CategoryData[];
    /** Story 14.14b Session 5: All store categories (before treemap processing) for accurate group aggregation */
    allCategoryData: CategoryData[];
    total: number;
    periodLabel: string;
    currency: string;
    locale: string;
    isDark: boolean;
    animationKey: number;
    onCategoryClick: (category: string) => void;
    canExpand: boolean;
    canCollapse: boolean;
    otroCount: number;
    /** Story 14.14b Session 7: Categories inside "Más" group for navigation expansion */
    otroCategories: CategoryData[];
    expandedCount: number;
    onExpand: () => void;
    onCollapse: () => void;
    /** Story 14.14b Session 4: Transactions for real item/subcategory aggregation */
    transactions: Transaction[];
    /** Story 14.14b Session 4: Navigation handler for transaction count pill */
    onNavigateToHistory?: (payload: HistoryNavigationPayload) => void;
    /** Story 14.14b Session 4: View mode controlled from parent */
    viewMode: DonutViewMode;
    /** Story 14.14b Session 4: Callback when view mode needs reset (drill-down changes) */
    onViewModeReset?: () => void;
    /** Story 14.22: Time period for navigation filter */
    timePeriod?: TimePeriod;
    /** Story 14.22: Current period for navigation filter */
    currentPeriod?: CurrentPeriod;
    /** Story 14.13 Session 7: Count mode for legend display (transactions vs items) */
    countMode?: 'transactions' | 'items';
    /** Story 14.40: Open statistics popup on icon click */
    onIconClick?: (categoryName: string, emoji: string, color: string) => void;
}> = ({
    categoryData,
    allCategoryData,
    total,
    periodLabel: _periodLabel,  // Story 14.14b: No longer used
    currency,
    locale,
    isDark,
    animationKey: _animationKey,
    onCategoryClick: _onCategoryClick,
    canExpand: parentCanExpand,
    canCollapse: parentCanCollapse,
    otroCount: parentOtroCount,
    otroCategories: parentOtroCategories,
    expandedCount: parentExpandedCount,
    onExpand: parentOnExpand,
    onCollapse: parentOnCollapse,
    transactions,
    onNavigateToHistory,
    viewMode,
    onViewModeReset: _onViewModeReset,
    timePeriod = 'month',
    currentPeriod,
    countMode = 'transactions',  // Story 14.13 Session 7: Default to transactions
    onIconClick,  // Story 14.40: Open statistics popup
}) => {
    // State for selected segment
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Story 14.13.3: Animation state for donut chart
    // Tracks animation key to trigger re-animation on drill-down
    const [donutAnimationKey, setDonutAnimationKey] = useState(0);
    // Tracks which segments have animated in (for clockwise reveal)
    const [visibleSegments, setVisibleSegments] = useState<Set<number>>(new Set());

    // Story 14.14b: Enhanced drill-down state to support all view modes
    // Drill-down path tracks: [storeGroup?, storeCategory?, itemCategory?]
    // Level 0: Show base view (based on viewMode)
    // Level 1: First drill-down (group->categories OR category->items)
    // Story 14.13 Session 7: Updated drill-down levels to support item groups as intermediate level
    // Level 0: Top level (groups or categories based on viewMode)
    // Level 1: First drill-down
    // Level 2: Second drill-down
    // Level 3: Third drill-down
    // Level 4: Fourth drill-down (only from store-groups: group -> store cat -> item group -> item cat -> subcat)
    const [drillDownLevel, setDrillDownLevel] = useState<0 | 1 | 2 | 3 | 4>(0);
    const [drillDownPath, setDrillDownPath] = useState<string[]>([]); // Stores names at each drill level

    // Internal expand state for drill-down levels
    const [drillDownExpandedCount, setDrillDownExpandedCount] = useState(0);

    // Story 14.14b Session 4: Reset drill-down when viewMode changes from parent
    useEffect(() => {
        setDrillDownLevel(0);
        setDrillDownPath([]);
        setSelectedCategory(null);
        setDrillDownExpandedCount(0);
        // Story 14.13.3: Reset animation when viewMode changes
        setDonutAnimationKey(prev => prev + 1);
        setVisibleSegments(new Set());
    }, [viewMode]);

    // Story 14.13.3: Effect to animate segments appearing clockwise
    useEffect(() => {
        // Get number of segments from displayData length
        // We'll animate each segment with staggered timing
        const segmentCount = 10; // Max segments we might have
        const delays: ReturnType<typeof setTimeout>[] = [];

        for (let i = 0; i < segmentCount; i++) {
            const timer = setTimeout(() => {
                setVisibleSegments(prev => new Set([...prev, i]));
            }, i * 80); // 80ms stagger between segments
            delays.push(timer);
        }

        return () => delays.forEach(clearTimeout);
    }, [donutAnimationKey]);

    // Story 14.14b Session 5: Aggregate allCategoryData (not treemap-processed categoryData) by store category groups
    // This ensures all store categories are included, not just those above the treemap threshold
    // Story 14.13 Session 5: Now also aggregates itemCount for count mode toggle
    const storeGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<StoreCategoryGroup, { value: number; count: number; itemCount: number }> = {
            'food-dining': { value: 0, count: 0, itemCount: 0 },
            'health-wellness': { value: 0, count: 0, itemCount: 0 },
            'retail-general': { value: 0, count: 0, itemCount: 0 },
            'retail-specialty': { value: 0, count: 0, itemCount: 0 },
            'automotive': { value: 0, count: 0, itemCount: 0 },
            'services': { value: 0, count: 0, itemCount: 0 },
            'hospitality': { value: 0, count: 0, itemCount: 0 },
            'other': { value: 0, count: 0, itemCount: 0 },
        };

        // Aggregate allCategoryData into groups (use all categories, not treemap-filtered)
        for (const cat of allCategoryData) {
            // Map category name to its group
            const group = STORE_CATEGORY_GROUPS[cat.name as keyof typeof STORE_CATEGORY_GROUPS] || 'other';
            groupTotals[group].value += cat.value;
            groupTotals[group].count += cat.count;
            groupTotals[group].itemCount += cat.itemCount || 0;
        }

        const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

        // Convert to CategoryData array
        return ALL_STORE_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getStoreGroupColors(groupKey, theme, mode);
                return {
                    name: groupKey,
                    value: data.value,
                    count: data.count,
                    itemCount: data.itemCount,
                    color: colors.bg,
                    fgColor: colors.fg,
                    percent: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
                };
            })
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [allCategoryData]);

    // Story 14.14b Session 4: Real item categories data from transaction line items
    const itemCategoriesData = useMemo((): CategoryData[] => {
        return computeItemCategoryData(transactions);
    }, [transactions]);

    // Story 14.14b: Aggregate item categories by item groups
    // Story 14.14b Session 6: Use transactionIds for accurate counting (prevents double-counting)
    // Story 14.13 Session 5: Now also aggregates itemCount for count mode toggle
    // Story 14.13 Session 7: Compute unique products directly from transactions to avoid double-counting
    const itemGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<ItemCategoryGroup, { value: number; transactionIds: Set<string>; uniqueProducts: Set<string> }> = {
            'food-fresh': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'food-packaged': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'health-personal': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'household': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'nonfood-retail': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'services-fees': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'other-item': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
        };

        // Story 14.13 Session 7: Compute directly from transactions to properly count unique products per group
        transactions.forEach((tx, index) => {
            (tx.items || []).forEach(item => {
                const cat = normalizeItemCategory(item.category || 'Other');
                const itemKey = ITEM_CATEGORY_TO_KEY[cat as keyof typeof ITEM_CATEGORY_TO_KEY];
                const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';

                groupTotals[group].value += item.price;
                groupTotals[group].transactionIds.add(tx.id ?? `tx-${index}`);

                // Track unique products by normalized name + merchant
                const normalizedName = (item.name || 'Unknown').toLowerCase().trim().replace(/\s+/g, ' ');
                const normalizedMerchant = (tx.merchant || 'unknown').toLowerCase().trim().replace(/\s+/g, ' ');
                const productKey = `${normalizedName}::${normalizedMerchant}`;
                groupTotals[group].uniqueProducts.add(productKey);
            });
        });

        const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

        return ALL_ITEM_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getItemGroupColors(groupKey, theme, mode);
                return {
                    name: groupKey,
                    value: data.value,
                    count: data.transactionIds.size,  // Unique transaction count
                    itemCount: data.uniqueProducts.size,  // Story 14.13 Session 7: Unique products count
                    transactionIds: data.transactionIds,  // Keep for further aggregation
                    color: colors.bg,
                    fgColor: colors.fg,
                    percent: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
                };
            })
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    // Story 14.14b Session 4: Get real subcategories from transaction line items
    const getItemSubcategories = useCallback((itemCategoryName: string): DrillDownGroupData[] => {
        const subcategoryData = computeSubcategoryData(transactions, itemCategoryName);
        // If no subcategories found in real data, return empty array
        if (subcategoryData.length === 0) {
            return [];
        }
        return subcategoryData;
    }, [transactions]);

    // Story 14.14b Session 4: Check if an item category has subcategories in real data
    const hasSubcategories = useCallback((itemCategoryName: string): boolean => {
        const subcategoryData = computeSubcategoryData(transactions, itemCategoryName);
        return subcategoryData.length > 0;
    }, [transactions]);

    // Story 14.14b: Get store categories within a store group
    // Story 14.13 Session 6: Use allCategoryData (raw store categories) instead of categoryData
    // When in store-groups mode, categoryData contains groups (food-dining), not categories (Supermarket)
    const getStoreCategoriesInGroup = useCallback((groupKey: string): CategoryData[] => {
        // Filter allCategoryData to only include categories in this group
        return allCategoryData.filter(cat => {
            const catGroup = STORE_CATEGORY_GROUPS[cat.name as keyof typeof STORE_CATEGORY_GROUPS];
            return catGroup === groupKey;
        });
    }, [allCategoryData]);

    // Story 14.13 Session 7: Get item groups dynamically for a specific store category
    // Only returns item groups that have items in transactions of that store category
    const getItemGroupsForStore = useCallback((storeCategoryName: string): CategoryData[] => {
        return computeItemGroupsForStore(transactions, storeCategoryName);
    }, [transactions]);

    // Story 14.13 Session 7: Get item categories within an item group, filtered by store category
    // This is the DYNAMIC version that shows only item categories found in both the group AND store
    const getItemCategoriesInGroupForStore = useCallback((itemGroupKey: string, storeCategoryName?: string): CategoryData[] => {
        return computeItemCategoriesInGroup(transactions, itemGroupKey, storeCategoryName);
    }, [transactions]);

    // Story 14.14b: Get drill-down data based on viewMode and current path
    // Story 14.13 Session 7: Updated to use dynamic drill-down with item groups as intermediate level
    const rawDrillDownData = useMemo((): CategoryData[] => {
        if (drillDownLevel === 0) return [];

        const path = drillDownPath;

        // Store Groups: group -> store categories -> item groups -> item categories -> subcategories
        // Story 14.13 Session 7: Added item groups as level 2
        if (viewMode === 'store-groups') {
            if (drillDownLevel === 1 && path[0]) {
                // Level 1: Store categories in this store group (STATIC)
                return getStoreCategoriesInGroup(path[0]);
            } else if (drillDownLevel === 2 && path[1]) {
                // Level 2: Item groups found in this store category (DYNAMIC)
                return getItemGroupsForStore(path[1]);
            } else if (drillDownLevel === 3 && path[2] && path[1]) {
                // Level 3: Item categories in this item group, filtered by store category (DYNAMIC)
                return getItemCategoriesInGroupForStore(path[2], path[1]);
            } else if (drillDownLevel === 4 && path[3]) {
                // Level 4: Subcategories
                return getItemSubcategories(path[3]) as CategoryData[];
            }
        }

        // Store Categories: store category -> item groups -> item categories -> subcategories
        // Story 14.13 Session 7: Added item groups as level 1
        if (viewMode === 'store-categories') {
            if (drillDownLevel === 1 && path[0]) {
                // Level 1: Item groups found in this store category (DYNAMIC)
                return getItemGroupsForStore(path[0]);
            } else if (drillDownLevel === 2 && path[1] && path[0]) {
                // Level 2: Item categories in this item group, filtered by store category (DYNAMIC)
                return getItemCategoriesInGroupForStore(path[1], path[0]);
            } else if (drillDownLevel === 3 && path[2]) {
                // Level 3: Subcategories
                return getItemSubcategories(path[2]) as CategoryData[];
            }
        }

        // Item Groups: item group -> item categories -> subcategories
        // Story 14.13 Session 7: Uses dynamic function (no store filter since we're already in item-groups mode)
        if (viewMode === 'item-groups') {
            if (drillDownLevel === 1 && path[0]) {
                // Level 1: Item categories in this item group (DYNAMIC - from all transactions)
                return getItemCategoriesInGroupForStore(path[0]);
            } else if (drillDownLevel === 2 && path[1]) {
                // Level 2: Subcategories
                return getItemSubcategories(path[1]) as CategoryData[];
            }
        }

        // Item Categories: item category -> subcategories
        if (viewMode === 'item-categories') {
            if (drillDownLevel === 1 && path[0]) {
                return getItemSubcategories(path[0]) as CategoryData[];
            }
        }

        return [];
    }, [drillDownLevel, drillDownPath, viewMode, getStoreCategoriesInGroup, getItemGroupsForStore, getItemCategoriesInGroupForStore, getItemSubcategories]);

    // Story 14.14b: Get base data based on viewMode (must be defined before drillDownCategorized)
    const viewModeBaseData = useMemo((): CategoryData[] => {
        switch (viewMode) {
            case 'store-groups':
                return storeGroupsData;
            case 'store-categories':
                return categoryData;
            case 'item-groups':
                return itemGroupsData;
            case 'item-categories':
                return itemCategoriesData;
            default:
                return categoryData;
        }
    }, [viewMode, categoryData, storeGroupsData, itemGroupsData, itemCategoriesData]);

    // Apply the same categorization logic to drill-down data (≥10% + one below + Otro)
    // Story 14.13 Session 6: Recalculate percentages relative to drill-down total (100% chart)
    const drillDownCategorized = useMemo(() => {
        if (drillDownLevel === 0) {
            return { displayCategories: viewModeBaseData, otroCategories: [] as CategoryData[], canExpand: false, canCollapse: false };
        }
        // Recalculate percentages relative to drill-down total so donut shows 100%
        const drillDownTotal = rawDrillDownData.reduce((sum, d) => sum + d.value, 0);
        const recalculatedData = rawDrillDownData.map(cat => ({
            ...cat,
            percent: drillDownTotal > 0 ? Math.round((cat.value / drillDownTotal) * 100) : 0,
        }));
        return computeTreemapCategories(recalculatedData, drillDownExpandedCount);
    }, [drillDownLevel, rawDrillDownData, drillDownExpandedCount, viewModeBaseData]);

    // Current display data - use categoryData prop at level 0 (already processed through computeTreemapCategories),
    // categorized drill-down data otherwise
    // Story 14.14b Session 5: Use categoryData prop (not internal viewModeBaseData) to match treemap display
    const displayData = useMemo(() => {
        if (drillDownLevel === 0) {
            return categoryData;  // Use the prop, which is already treemap-processed
        }
        return drillDownCategorized.displayCategories;
    }, [drillDownLevel, categoryData, drillDownCategorized]);

    // Story 14.13 Session 20: Calculate max percentage for relative bar scaling
    // The category with highest percentage gets 100% bar width, others scale proportionally
    const maxPercent = useMemo(() => {
        if (displayData.length === 0) return 1;
        return Math.max(...displayData.map(d => d.percent));
    }, [displayData]);

    // Current total based on drill-down level
    const displayTotal = useMemo(() => {
        if (drillDownLevel === 0) {
            return total;
        }
        // For drill-down levels, sum up the raw data
        if (rawDrillDownData.length > 0) {
            return rawDrillDownData.reduce((sum, d) => sum + d.value, 0);
        }
        return total;
    }, [drillDownLevel, rawDrillDownData, total]);

    // Story 14.13.3: Animated total for count-up effect in center
    const animatedTotal = useCountUp(displayTotal, {
        duration: 800,
        startValue: 0,
        key: donutAnimationKey,
    });

    // Determine expand/collapse state based on drill-down level
    const canExpand = drillDownLevel === 0 ? parentCanExpand : drillDownCategorized.canExpand;
    const canCollapse = drillDownLevel === 0 ? parentCanCollapse : drillDownCategorized.canCollapse;
    const otroCount = drillDownLevel === 0 ? parentOtroCount : drillDownCategorized.otroCategories.length;
    const expandedCount = drillDownLevel === 0 ? parentExpandedCount : drillDownExpandedCount;

    const handleExpand = () => {
        if (drillDownLevel === 0) {
            parentOnExpand();
        } else {
            setDrillDownExpandedCount(prev => prev + 1);
        }
    };

    const handleCollapse = () => {
        if (drillDownLevel === 0) {
            parentOnCollapse();
        } else {
            setDrillDownExpandedCount(prev => Math.max(0, prev - 1));
        }
    };

    // Find selected category data
    const selectedData = selectedCategory
        ? displayData.find(c => c.name === selectedCategory)
        : null;

    // Note: centerValue calculation removed - was unused after animation removal
    // Note: contextLabel removed - replaced by viewMode dropdown in Story 14.14b

    // Handle segment click
    const handleSegmentClick = (categoryName: string) => {
        setSelectedCategory(prev => prev === categoryName ? null : categoryName);
    };

    // Story 14.14b: Get max drill-down level based on viewMode
    // Story 14.13 Session 7: Updated drill-down paths to include item groups as intermediate level
    const getMaxDrillDownLevel = useCallback((): number => {
        switch (viewMode) {
            case 'store-groups': return 4; // group -> store cat -> item group -> item cat -> subcategory
            case 'store-categories': return 3; // store cat -> item group -> item cat -> subcategory
            case 'item-groups': return 2; // item group -> item cat -> subcategory
            case 'item-categories': return 1; // item cat -> subcategory
            default: return 2;
        }
    }, [viewMode]);

    // Handle drill-down into a category/group
    // Story 14.13 Session 7: Updated to support level 4 for store-groups mode
    const handleDrillDown = (name: string) => {
        setSelectedCategory(null); // Clear selection
        setDrillDownExpandedCount(0); // Reset expanded count when drilling down

        const maxLevel = getMaxDrillDownLevel();
        if (drillDownLevel < maxLevel) {
            // Story 14.13.3: Trigger animation reset for new data
            setDonutAnimationKey(prev => prev + 1);
            setVisibleSegments(new Set());
            // Add name to path and increment level
            setDrillDownPath(prev => [...prev, name]);
            setDrillDownLevel(prev => Math.min(prev + 1, 4) as 0 | 1 | 2 | 3 | 4);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        setSelectedCategory(null);
        setDrillDownExpandedCount(0); // Reset expanded count when going back

        if (drillDownLevel > 0) {
            // Story 14.13.3: Trigger animation reset when going back
            setDonutAnimationKey(prev => prev + 1);
            setVisibleSegments(new Set());
            // Remove last item from path and decrement level
            setDrillDownPath(prev => prev.slice(0, -1));
            setDrillDownLevel(prev => Math.max(prev - 1, 0) as 0 | 1 | 2 | 3 | 4);
        }
    };

    /**
     * Story 14.13a: Build semantic DrillDownPath from current state.
     * Converts the string array path and drill-down level into a structured object
     * with semantic meaning based on the current viewMode.
     *
     * @param currentCategoryName - The category being clicked (added to path)
     * @returns DrillDownPath with all accumulated filter dimensions
     */
    const buildSemanticDrillDownPath = useCallback((currentCategoryName?: string): DrillDownPath => {
        const path: DrillDownPath = {};

        // Map drillDownPath positions to semantic fields based on viewMode
        // The interpretation depends on which viewMode we're in
        switch (viewMode) {
            case 'store-groups':
                // Path order: storeGroup -> storeCategory -> itemGroup -> itemCategory -> subcategory
                if (drillDownPath[0]) path.storeGroup = drillDownPath[0];
                if (drillDownPath[1]) path.storeCategory = drillDownPath[1];
                if (drillDownPath[2]) path.itemGroup = drillDownPath[2];
                if (drillDownPath[3]) path.itemCategory = drillDownPath[3];
                // If we're clicking at level 4, add subcategory
                if (drillDownLevel === 4 && currentCategoryName) {
                    path.subcategory = currentCategoryName;
                } else if (drillDownLevel === 3 && currentCategoryName) {
                    path.itemCategory = currentCategoryName;
                } else if (drillDownLevel === 2 && currentCategoryName) {
                    path.itemGroup = currentCategoryName;
                } else if (drillDownLevel === 1 && currentCategoryName) {
                    path.storeCategory = currentCategoryName;
                } else if (drillDownLevel === 0 && currentCategoryName) {
                    path.storeGroup = currentCategoryName;
                }
                break;

            case 'store-categories':
                // Path order: storeCategory -> itemGroup -> itemCategory -> subcategory
                if (drillDownPath[0]) path.storeCategory = drillDownPath[0];
                if (drillDownPath[1]) path.itemGroup = drillDownPath[1];
                if (drillDownPath[2]) path.itemCategory = drillDownPath[2];
                // If we're clicking at level 3, add subcategory
                if (drillDownLevel === 3 && currentCategoryName) {
                    path.subcategory = currentCategoryName;
                } else if (drillDownLevel === 2 && currentCategoryName) {
                    path.itemCategory = currentCategoryName;
                } else if (drillDownLevel === 1 && currentCategoryName) {
                    path.itemGroup = currentCategoryName;
                } else if (drillDownLevel === 0 && currentCategoryName) {
                    path.storeCategory = currentCategoryName;
                }
                break;

            case 'item-groups':
                // Path order: itemGroup -> itemCategory -> subcategory
                if (drillDownPath[0]) path.itemGroup = drillDownPath[0];
                if (drillDownPath[1]) path.itemCategory = drillDownPath[1];
                // If we're clicking at level 2, add subcategory
                if (drillDownLevel === 2 && currentCategoryName) {
                    path.subcategory = currentCategoryName;
                } else if (drillDownLevel === 1 && currentCategoryName) {
                    path.itemCategory = currentCategoryName;
                } else if (drillDownLevel === 0 && currentCategoryName) {
                    path.itemGroup = currentCategoryName;
                }
                break;

            case 'item-categories':
                // Path order: itemCategory -> subcategory
                if (drillDownPath[0]) path.itemCategory = drillDownPath[0];
                // If we're clicking at level 1, add subcategory
                if (drillDownLevel === 1 && currentCategoryName) {
                    path.subcategory = currentCategoryName;
                } else if (drillDownLevel === 0 && currentCategoryName) {
                    path.itemCategory = currentCategoryName;
                }
                break;
        }

        return path;
    }, [viewMode, drillDownPath, drillDownLevel]);

    // Story 14.14b Session 4+5: Handle transaction count pill click - navigate to HistoryView with filters
    // Story 14.22: Full support for all view modes and drill-down levels
    // Story 14.14b Session 7: Handle "Más" aggregated group by expanding to constituent categories
    // Story 14.13 Session 7: Respect countMode for navigation target (items vs history)
    const handleTransactionCountClick = useCallback((categoryName: string) => {
        if (!onNavigateToHistory) return;

        // Build the navigation payload based on viewMode and drill-down state
        // Story 14.13 Session 7: Target view based on countMode toggle
        // Story 14.13 Session 7: Track source view for back navigation
        const payload: HistoryNavigationPayload = {
            targetView: countMode === 'items' ? 'items' : 'history',
            sourceDistributionView: 'donut',
        };

        // Check if this is the "Más" aggregated group - expand to constituent categories
        const isAggregatedGroup = categoryName === 'Más' || categoryName === 'More';
        // Use parent's otroCategories at level 0, otherwise use drill-down's otroCategories
        const currentOtroCategories = drillDownLevel === 0 ? parentOtroCategories : drillDownCategorized.otroCategories;

        // Set the appropriate filter based on view mode and drill-down level
        if (viewMode === 'store-categories') {
            if (drillDownLevel === 0) {
                if (isAggregatedGroup && currentOtroCategories.length > 0) {
                    // "Más" contains multiple store categories - join them with comma
                    payload.category = currentOtroCategories.map(c => c.name).join(',');
                } else {
                    // At store categories level - filter by store category
                    payload.category = categoryName;
                }
            } else {
                // Drilled down - filter by parent store category
                payload.category = drillDownPath[0] || categoryName;
            }
        } else if (viewMode === 'store-groups') {
            if (drillDownLevel === 0) {
                if (isAggregatedGroup && currentOtroCategories.length > 0) {
                    // "Más" contains multiple store groups - expand each group and combine
                    const allCategories = currentOtroCategories.flatMap(c =>
                        expandStoreCategoryGroup(c.name as StoreCategoryGroup)
                    );
                    payload.category = allCategories.join(',');
                } else {
                    // At store groups level - filter by store group
                    payload.storeGroup = categoryName;
                }
            } else if (drillDownLevel === 1) {
                if (isAggregatedGroup && currentOtroCategories.length > 0) {
                    // "Más" contains multiple store categories - join them with comma
                    payload.category = currentOtroCategories.map(c => c.name).join(',');
                } else {
                    // Viewing store categories within a group - filter by store category
                    payload.category = categoryName;
                }
            } else {
                // Deeper drill-down - filter by store category from path
                payload.category = drillDownPath[1] || categoryName;
            }
        } else if (viewMode === 'item-groups') {
            if (drillDownLevel === 0) {
                if (isAggregatedGroup && currentOtroCategories.length > 0) {
                    // "Más" contains multiple item groups - expand each group and combine
                    const allItemCategories = currentOtroCategories.flatMap(c =>
                        expandItemCategoryGroup(c.name as ItemCategoryGroup)
                    );
                    payload.itemCategory = allItemCategories.join(',');
                } else {
                    // At item groups level - filter by item group
                    payload.itemGroup = categoryName;
                }
            } else {
                if (isAggregatedGroup && currentOtroCategories.length > 0) {
                    // "Más" contains multiple item categories - join them with comma
                    payload.itemCategory = currentOtroCategories.map(c => c.name).join(',');
                } else {
                    // Drilled down - filter by item category
                    payload.itemCategory = categoryName;
                }
            }
        } else if (viewMode === 'item-categories') {
            if (isAggregatedGroup && currentOtroCategories.length > 0) {
                // "Más" contains multiple item categories - join them with comma
                payload.itemCategory = currentOtroCategories.map(c => c.name).join(',');
            } else {
                // At item categories level - filter by item category
                payload.itemCategory = categoryName;
            }
        }

        // Story 14.22: Build temporal filter based on current time period selection
        if (currentPeriod) {
            payload.temporal = {
                level: timePeriod,
                year: String(currentPeriod.year),
            };
            if (timePeriod === 'month' || timePeriod === 'week') {
                payload.temporal.month = `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, '0')}`;
            }
            if (timePeriod === 'quarter') {
                payload.temporal.quarter = `Q${currentPeriod.quarter}`;
            }
        }

        // Story 14.13a: Include full drill-down path for multi-dimension filtering
        // This allows ItemsView/HistoryView to filter by multiple dimensions simultaneously
        // NOTE: Skip drillDownPath for aggregated "Más" categories - they are already expanded
        // into payload.category/itemCategory above and drillDownPath would add "Más" literally
        if (!isAggregatedGroup) {
            const semanticPath = buildSemanticDrillDownPath(categoryName);
            if (Object.keys(semanticPath).length > 0) {
                payload.drillDownPath = semanticPath;
            }
        }

        onNavigateToHistory(payload);
    }, [onNavigateToHistory, viewMode, drillDownLevel, drillDownPath, timePeriod, currentPeriod, parentOtroCategories, drillDownCategorized.otroCategories, countMode, buildSemanticDrillDownPath]);

    // Story 14.14b Session 4: View mode labels for title display
    const viewModeLabels: Record<DonutViewMode, { es: string; en: string }> = {
        'store-groups': { es: 'Grupos de Compras', en: 'Purchase Groups' },
        'store-categories': { es: 'Categorías de Compras', en: 'Purchase Categories' },
        'item-groups': { es: 'Grupos de Productos', en: 'Product Groups' },
        'item-categories': { es: 'Categorías de Productos', en: 'Product Categories' },
    };

    const currentViewModeLabel = viewModeLabels[viewMode] || viewModeLabels['store-categories'];

    return (
        <div
            className="flex flex-col h-full"
            data-testid="donut-view"
        >
            {/* Story 14.13 Session 19: Header with back button immediately after title - min-h-7 ensures button fits */}
            <div className="flex items-center justify-center min-h-7 mb-1 mt-1 gap-1">
                {/* Story 14.13 Session 18: Title shows drill-down path (translated) or base view mode */}
                <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                    data-testid="donut-viewmode-title"
                >
                    {drillDownLevel > 0
                        ? translateCategory(drillDownPath[drillDownPath.length - 1], locale as 'en' | 'es')
                        : (locale === 'es' ? currentViewModeLabel.es : currentViewModeLabel.en)
                    }
                </span>
                {/* Story 14.13 Session 19: Back button - immediately after title text */}
                {drillDownLevel > 0 && (
                    <button
                        onClick={handleBack}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                        style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                        }}
                        aria-label={locale === 'es' ? 'Volver' : 'Back'}
                        data-testid="donut-back-btn"
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
            </div>

            {/* Donut Chart with side buttons - Ring style matching mockup */}
            <div className="flex items-center justify-center gap-2 pb-2">
                {/* Menos button on left side of donut - always render for stable positioning */}
                <button
                    onClick={handleCollapse}
                    disabled={!canCollapse}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--primary) 70%, transparent)',
                        color: 'white',
                        opacity: canCollapse ? 1 : 0,
                        pointerEvents: canCollapse ? 'auto' : 'none',
                    }}
                    aria-label={locale === 'es' ? 'Mostrar menos categorías' : 'Show fewer categories'}
                    data-testid="donut-collapse-btn"
                >
                    <Minus size={18} strokeWidth={2.5} />
                    {/* Badge with count - bottom right, semi-transparent */}
                    <span
                        className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold backdrop-blur-md"
                        style={{
                            backgroundColor: 'color-mix(in srgb, var(--primary) 50%, transparent)',
                            color: 'white',
                        }}
                    >
                        {expandedCount}
                    </span>
                </button>

                {/* Donut chart */}
                <div className="relative" style={{ width: '180px', height: '180px' }}>
                    <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                        {(() => {
                            const circumference = 2 * Math.PI * 52; // ~326.73
                            const gapPercent = 0.5; // 0.5% gap between segments (reduced)
                            let currentOffset = 0;
                            let segmentIndex = 0;

                            return displayData.map((cat) => {
                                if (cat.percent <= 0) return null;

                                const currentSegmentIndex = segmentIndex++;
                                const isVisible = visibleSegments.has(currentSegmentIndex);
                                const isSelected = selectedCategory === cat.name;
                                // Apply gap by reducing segment size slightly
                                const segmentPercent = Math.max(0, cat.percent - gapPercent);
                                const dashLength = (segmentPercent / 100) * circumference;
                                // Story 14.13.3: Animate from 0 to full dashLength for clockwise reveal
                                const animatedDashLength = isVisible ? dashLength : 0;
                                const strokeDasharray = `${animatedDashLength} ${circumference - animatedDashLength}`;
                                const strokeDashoffset = -currentOffset;

                                currentOffset += (cat.percent / 100) * circumference;

                                return (
                                    <circle
                                        key={`${cat.name}-${donutAnimationKey}`}
                                        cx="60"
                                        cy="60"
                                        r="52"
                                        fill="none"
                                        stroke={cat.fgColor}
                                        strokeWidth={isSelected ? 16 : 14}
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        className="cursor-pointer"
                                        style={{
                                            opacity: selectedCategory && !isSelected ? 0.4 : 1,
                                            transition: 'stroke-dasharray 400ms ease-out, stroke-width 200ms ease-out, opacity 200ms ease-out',
                                        }}
                                        onClick={() => handleSegmentClick(cat.name)}
                                        data-testid={`donut-segment-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                                    />
                                );
                            });
                        })()}
                    </svg>
                    {/* Center text - updates on segment selection (larger fonts) */}
                    {/* Story 14.13.3: Uses animated total for count-up effect */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {selectedData
                                ? formatCurrency(selectedData.value, currency)
                                : formatCurrency(animatedTotal, currency)
                            }
                        </span>
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {selectedData ? (() => {
                                // Story 14.14b: Translate based on current data type
                                // Story 14.13 Session 7: Updated for new drill-down structure with item groups
                                const isShowingStoreGroups = viewMode === 'store-groups' && drillDownLevel === 0;
                                const isShowingItemGroups =
                                    (viewMode === 'item-groups' && drillDownLevel === 0) ||
                                    (viewMode === 'store-categories' && drillDownLevel === 1) ||
                                    (viewMode === 'store-groups' && drillDownLevel === 2);
                                if (isShowingStoreGroups) {
                                    return translateStoreCategoryGroup(selectedData.name, locale as 'en' | 'es');
                                } else if (isShowingItemGroups) {
                                    return translateItemCategoryGroup(selectedData.name, locale as 'en' | 'es');
                                } else {
                                    return translateCategory(selectedData.name, locale as 'en' | 'es');
                                }
                            })() : 'Total'}
                        </span>
                    </div>
                </div>

                {/* Más button on right side of donut - always render for stable positioning */}
                <button
                    onClick={handleExpand}
                    disabled={!canExpand}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--primary) 70%, transparent)',
                        color: 'white',
                        opacity: canExpand ? 1 : 0,
                        pointerEvents: canExpand ? 'auto' : 'none',
                    }}
                    aria-label={locale === 'es' ? `Mostrar más (${otroCount} en Otro)` : `Show more (${otroCount} in Other)`}
                    data-testid="donut-expand-btn"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    {/* Badge with count - bottom right, semi-transparent */}
                    <span
                        className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold backdrop-blur-md"
                        style={{
                            backgroundColor: 'color-mix(in srgb, var(--primary) 50%, transparent)',
                            color: 'white',
                        }}
                    >
                        {otroCount}
                    </span>
                </button>
            </div>

            {/* Rich Legend Items (Phase 4) - Scrollable within available space */}
            <div className="flex flex-col gap-1 px-1 flex-1 overflow-y-auto min-h-0">
                {displayData.map(cat => {
                    const isSelected = selectedCategory === cat.name;
                    // "Más" = aggregated small categories group (expandable), not the real "Otro" category
                    const isMasGroup = cat.name === 'Más' || cat.name === 'More';

                    // Story 14.14b: Get display name and emoji based on viewMode and drillDownLevel
                    let displayName: string;
                    let emoji: string;

                    // Determine what type of data we're showing based on viewMode and level
                    // Story 14.13 Session 7: Updated for new drill-down structure with item groups as intermediate level
                    const isShowingStoreGroups = viewMode === 'store-groups' && drillDownLevel === 0;
                    const isShowingStoreCategories =
                        (viewMode === 'store-categories' && drillDownLevel === 0) ||
                        (viewMode === 'store-groups' && drillDownLevel === 1);
                    // Story 14.13 Session 7: Item groups now appear at multiple levels:
                    // - item-groups mode at level 0
                    // - store-categories mode at level 1 (drilling into store category shows item groups)
                    // - store-groups mode at level 2 (drilling into store category shows item groups)
                    const isShowingItemGroups =
                        (viewMode === 'item-groups' && drillDownLevel === 0) ||
                        (viewMode === 'store-categories' && drillDownLevel === 1) ||
                        (viewMode === 'store-groups' && drillDownLevel === 2);
                    // Story 14.13 Session 7: Item categories now appear at adjusted levels:
                    // - item-categories mode at level 0
                    // - store-categories mode at level 2 (after item groups)
                    // - store-groups mode at level 3 (after item groups)
                    // - item-groups mode at level 1 (after drilling into item group)
                    const isShowingItemCategories =
                        (viewMode === 'item-categories' && drillDownLevel === 0) ||
                        (viewMode === 'store-categories' && drillDownLevel === 2) ||
                        (viewMode === 'store-groups' && drillDownLevel === 3) ||
                        (viewMode === 'item-groups' && drillDownLevel === 1);

                    // Story 14.14b: Can drill down if not "Más" group and not at max level
                    // For item categories, also check if subcategories exist
                    const maxLevel = getMaxDrillDownLevel();
                    let canDrillDownFurther = !isMasGroup && drillDownLevel < maxLevel;

                    // If showing item categories, only allow drill-down if subcategories exist
                    if (canDrillDownFurther && isShowingItemCategories) {
                        canDrillDownFurther = hasSubcategories(cat.name);
                    }

                    // Handle "Más" aggregated group specially
                    if (isMasGroup) {
                        displayName = locale === 'es' ? 'Más' : 'More';
                        emoji = '📁';
                    } else if (isShowingStoreGroups) {
                        displayName = translateStoreCategoryGroup(cat.name, locale as 'en' | 'es');
                        emoji = getStoreCategoryGroupEmoji(cat.name);
                    } else if (isShowingStoreCategories) {
                        displayName = translateCategory(cat.name, locale as 'en' | 'es');
                        emoji = getCategoryEmoji(cat.name);
                    } else if (isShowingItemGroups) {
                        displayName = translateItemCategoryGroup(cat.name, locale as 'en' | 'es');
                        emoji = getItemCategoryGroupEmoji(cat.name);
                    } else if (isShowingItemCategories) {
                        displayName = translateCategory(cat.name, locale as 'en' | 'es');
                        emoji = getItemCategoryEmoji(cat.name);
                    } else {
                        // Subcategories (deepest level) - use as-is
                        displayName = cat.name;
                        emoji = '📄';
                    }

                    // Story 14.13: Get text color respecting fontColorMode setting
                    const legendTextColor = getCategoryColorsAuto(cat.name).fg;

                    return (
                        <div
                            key={cat.name}
                            className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                                isSelected
                                    ? isDark ? 'bg-slate-600' : 'bg-slate-200'
                                    : isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                            }`}
                            data-testid={`legend-item-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                            {/* Story 14.40: Icon button opens statistics popup */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Don't show popup for "Más" aggregated group
                                    if (cat.name !== 'Más' && cat.name !== 'More') {
                                        onIconClick?.(cat.name, emoji, cat.fgColor);
                                    } else {
                                        handleSegmentClick(cat.name);
                                    }
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 hover:scale-105 active:scale-95 transition-transform"
                                style={{ backgroundColor: cat.fgColor }}
                                aria-label={`${displayName} ${locale === 'es' ? 'estadísticas' : 'statistics'}`}
                            >
                                <span className="text-white drop-shadow-sm">
                                    {emoji}
                                </span>
                            </button>

                            {/* Name and amount info - two lines layout (spans full height) */}
                            <div
                                className="flex-1 flex flex-col items-start min-w-0"
                            >
                                {/* Line 1: Category name (clickable to select) */}
                                <button
                                    onClick={() => handleSegmentClick(cat.name)}
                                    className="text-sm font-medium truncate flex items-center gap-1 w-full text-left"
                                    style={{ color: legendTextColor }}
                                >
                                    {displayName}
                                    {/* Badge showing count of categories inside "Más" group */}
                                    {cat.categoryCount && (
                                        <span
                                            className="inline-flex items-center justify-center rounded-full text-xs"
                                            style={{
                                                backgroundColor: 'transparent',
                                                border: `1.5px solid ${legendTextColor}`,
                                                color: legendTextColor,
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                minWidth: '18px',
                                                height: '18px',
                                                padding: '0 4px',
                                            }}
                                        >
                                            {cat.categoryCount}
                                        </span>
                                    )}
                                </button>
                                {/* Line 2: Amount with percentage bar */}
                                <AnimatedAmountBar
                                    value={cat.value}
                                    percent={cat.percent}
                                    animationKey={donutAnimationKey}
                                    currency={currency}
                                    legendTextColor={legendTextColor}
                                    isDark={isDark}
                                    maxPercent={maxPercent}
                                    fgColor={cat.fgColor}
                                />
                            </div>

                            {/* Right side: Count pill, percentage, chevron - vertically centered */}
                            <AnimatedCountPill
                                count={cat.count}
                                itemCount={cat.itemCount ?? 0}
                                animationKey={donutAnimationKey}
                                countMode={countMode}
                                isDark={isDark}
                                locale={locale}
                                onCountClick={() => handleTransactionCountClick(cat.name)}
                                categoryName={cat.name}
                            />

                            <AnimatedPercent
                                percent={cat.percent}
                                animationKey={donutAnimationKey}
                                legendTextColor={legendTextColor}
                            />

                            {/* Drill-down chevron (can drill deeper) */}
                            {canDrillDownFurther && (
                                <button
                                    onClick={() => handleDrillDown(cat.name)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                        isDark
                                            ? 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                                            : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                                    }`}
                                    aria-label={`Drill down into ${displayName}`}
                                    data-testid={`drill-down-${cat.name.toLowerCase()}`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

/**
 * Story 14.13.2: Trend list item component - redesigned layout
 *
 * Card-based layout matching mockup (analytics-polygon.html):
 * [Icon] Name + count | [~~~sparkline~~~] | Amount + Change % (stacked) | Chevron
 *
 * Features:
 * - Card container with background, shadow, rounded corners
 * - Vibrant icon background using getCategoryPillColors (like donut chart)
 * - Sparkline color matches change direction (green=down/good, red=up/bad)
 * - Amount and change percentage stacked vertically
 * - Drill-down chevron icon on the right
 *
 * Change indicator colors (AC #3):
 * - up (spent more): Red with ↑ arrow (spending increase = bad)
 * - down (spent less): Green with ↓ arrow (spending decrease = good)
 * - same (no change): Gray with "= 0%"
 * - new (no previous data): Blue "nuevo" badge
 */
const TrendListItem: React.FC<{
    data: TrendData;
    onClick: () => void;
    onCountClick?: () => void; // Story 14.13.2: Clickable count pill like donut chart
    onIconClick?: (categoryName: string, emoji: string, color: string) => void; // Story 14.40: Open statistics popup
    currency: string;
    theme: 'light' | 'dark';
    locale: string;
    viewMode?: DonutViewMode; // Story 14.14b Session 5: View mode for correct translation
    countMode?: 'transactions' | 'items'; // Story 14.13.2: Count mode for pill icon
    animationIndex?: number; // Story 14.13.3: Index for staggered animation (used by parent for key)
    isVisible?: boolean; // Story 14.13.3: Whether item should be visible (animated in)
    showDrillDown?: boolean; // Story 14.13.3: Whether to show drill-down chevron
}> = ({ data, onClick, onCountClick, onIconClick, currency, theme, locale, viewMode = 'store-categories', countMode = 'transactions', animationIndex: _animationIndex, isVisible = true, showDrillDown = true }) => {
    const isDark = theme === 'dark';

    // Story 14.13.2: Determine change direction and style
    const changeDirection = data.changeDirection ?? (data.change >= 0 ? 'up' : 'down');

    // Story 14.13.2: Get semantic color for sparkline based on change direction
    const sparklineColor = useMemo(() => {
        switch (changeDirection) {
            case 'up':
                return 'var(--negative-primary, #ef4444)'; // Red for spending increase (bad)
            case 'down':
                return 'var(--positive-primary, #22c55e)'; // Green for spending decrease (good)
            case 'same':
            case 'new':
            default:
                return 'var(--text-tertiary, #6b7280)'; // Gray for neutral/new
        }
    }, [changeDirection]);

    // Story 14.13.2: Get vibrant icon background colors using getCategoryPillColors
    const iconColors = useMemo(() => {
        // "Más" = aggregated small categories group - use neutral colors
        if (data.name === 'Más' || data.name === 'More') {
            return {
                bg: isDark ? 'var(--bg-tertiary, #334155)' : 'var(--bg-tertiary, #f1f5f9)',
                fg: 'var(--text-secondary)',
            };
        }
        // Use the same color system as donut chart for vibrant backgrounds
        return getCategoryPillColors(data.name);
    }, [data.name, isDark]);

    // Story 14.14b Session 5: Get emoji based on view mode
    const emoji = useMemo(() => {
        // "Más" = aggregated small categories group
        if (data.name === 'Más' || data.name === 'More') {
            return '📁';
        }
        switch (viewMode) {
            case 'store-groups':
                return getStoreCategoryGroupEmoji(data.name as StoreCategoryGroup);
            case 'item-groups':
                return getItemCategoryGroupEmoji(data.name as ItemCategoryGroup);
            case 'item-categories':
                return getItemCategoryEmoji(data.name);
            case 'store-categories':
            default:
                return getCategoryEmoji(data.name);
        }
    }, [data.name, viewMode]);

    // Story 14.14b Session 5: Translate name based on view mode
    const displayName = useMemo(() => {
        // "Más" = aggregated small categories group
        if (data.name === 'Más' || data.name === 'More') {
            return locale === 'es' ? 'Más' : 'More';
        }
        switch (viewMode) {
            case 'store-groups':
                return translateStoreCategoryGroup(data.name as StoreCategoryGroup, locale as 'en' | 'es');
            case 'item-groups':
                return translateItemCategoryGroup(data.name as ItemCategoryGroup, locale as 'en' | 'es');
            case 'store-categories':
            case 'item-categories':
            default:
                return translateCategory(data.name, locale as 'en' | 'es');
        }
    }, [data.name, viewMode, locale]);

    // Story 14.13.2: Get text color respecting fontColorMode setting (like donut chart legend)
    const textColor = useMemo(() => {
        // "Más" = aggregated small categories group - use default text color
        if (data.name === 'Más' || data.name === 'More') {
            return 'var(--text-primary)';
        }
        return getCategoryColorsAuto(data.name).fg;
    }, [data.name]);

    // Story 14.13.2: Render change indicator based on direction (AC #3)
    const renderChangeIndicator = () => {
        const changeValue = Math.abs(data.change);

        switch (changeDirection) {
            case 'new':
                // New category: blue "nuevo" badge
                return (
                    <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                            backgroundColor: 'var(--info-bg, #eff6ff)',
                            color: 'var(--info-primary, #3b82f6)',
                        }}
                        data-testid="change-badge-new"
                    >
                        {locale === 'es' ? 'nuevo' : 'new'}
                    </span>
                );
            case 'same':
                // No change: gray "= 0%"
                return (
                    <span
                        className="text-xs font-semibold flex items-center gap-0.5"
                        style={{ color: 'var(--text-tertiary, #6b7280)' }}
                        data-testid="change-badge-same"
                    >
                        <span>=</span>
                        <span>0%</span>
                    </span>
                );
            case 'up':
                // Spent more: red with ↑ (bad)
                return (
                    <span
                        className="text-xs font-semibold flex items-center gap-0.5"
                        style={{ color: 'var(--negative-primary, #ef4444)' }}
                        data-testid="change-badge-up"
                    >
                        <span>↑</span>
                        <span>{changeValue}%</span>
                    </span>
                );
            case 'down':
                // Spent less: green with ↓ (good)
                return (
                    <span
                        className="text-xs font-semibold flex items-center gap-0.5"
                        style={{ color: 'var(--positive-primary, #22c55e)' }}
                        data-testid="change-badge-down"
                    >
                        <span>↓</span>
                        <span>{changeValue}%</span>
                    </span>
                );
            default:
                return null;
        }
    };

    // Story 14.13.2: Safe sparkline rendering with semantic colors
    // Shows cumulative daily spending with optional previous period reference line
    const renderSparkline = () => {
        const previousValue = data.previousValue || 0;

        if (!data.sparkline || data.sparkline.length < 2 || data.value === 0) {
            // Flat line when no data or zero value
            return (
                <>
                    <path
                        d="M0 12 L64 12"
                        fill="none"
                        stroke={sparklineColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.6"
                    />
                    {/* Show previous period reference line if available */}
                    {previousValue > 0 && (
                        <path
                            d="M0 6 L64 6"
                            fill="none"
                            stroke="var(--text-tertiary, #6b7280)"
                            strokeWidth="1"
                            strokeDasharray="3 2"
                            opacity="0.5"
                        />
                    )}
                </>
            );
        }

        // Calculate max value for scaling - include previous period value for reference
        const currentMax = Math.max(...data.sparkline);
        const maxVal = Math.max(currentMax, previousValue);
        const scale = maxVal > 0 ? 20 / maxVal : 0;

        // Generate path for cumulative sparkline
        // SVG viewBox is 64x24, so we map points across the width
        const points = data.sparkline;
        const xStep = 64 / (points.length - 1);

        const pathParts = points.map((val, i) => {
            const x = i * xStep;
            const y = 22 - val * scale; // Leave 2px margin at top/bottom
            return i === 0 ? `M${x} ${y}` : `L${x} ${y}`;
        });

        // Calculate Y position for previous period reference line
        const prevY = previousValue > 0 ? 22 - previousValue * scale : 12;

        return (
            <>
                {/* Previous period reference line (dashed) - shown when there's previous data */}
                {previousValue > 0 && (
                    <path
                        d={`M0 ${prevY} L64 ${prevY}`}
                        fill="none"
                        stroke="var(--text-tertiary, #6b7280)"
                        strokeWidth="1"
                        strokeDasharray="3 2"
                        opacity="0.5"
                    />
                )}
                {/* Current period cumulative sparkline */}
                <path
                    d={pathParts.join(' ')}
                    fill="none"
                    stroke={sparklineColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </>
        );
    };

    // Story 14.13.2: Get the count to display based on countMode
    const displayCount = countMode === 'items' ? (data.itemCount || 0) : data.count;

    // Story 14.13.2: Truncate long category names with ellipsis (max ~16 chars)
    const truncatedName = useMemo(() => {
        const maxChars = 16;
        if (displayName.length > maxChars) {
            return displayName.slice(0, maxChars - 1).trim() + '…';
        }
        return displayName;
    }, [displayName]);

    // Story 14.13.3: Animation styles for slide-in effect from left
    const animationStyle: React.CSSProperties = {
        minHeight: '64px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
        transition: `opacity 300ms ease-out, transform 300ms ease-out`,
    };

    return (
        <div
            className="w-full flex items-stretch group"
            style={animationStyle}
            data-testid={`trend-item-${data.name.toLowerCase().replace(/\s+/g, '-')}`}
        >
            {/* Main card content - ends before chevron zone, with full rounded corners */}
            <div
                className="flex-1 flex items-center gap-2 pl-2.5 pr-2 py-2.5 rounded-xl transition-all"
                style={{
                    backgroundColor: isDark ? 'var(--bg-secondary, #1e293b)' : 'var(--bg-secondary, #ffffff)',
                    boxShadow: isDark
                        ? '0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)'
                        : '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)',
                    marginRight: '-8px', // Overlap with button so button appears to emerge from behind
                    zIndex: 1,
                }}
            >
                {/* Story 14.40: Category icon with vibrant background - clickable for statistics popup */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Don't show popup for "Más" aggregated group
                        if (data.name !== 'Más' && data.name !== 'More') {
                            onIconClick?.(data.name, emoji, iconColors.bg);
                        } else {
                            onClick();
                        }
                    }}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 hover:scale-105 active:scale-95 transition-transform"
                    style={{ backgroundColor: iconColors.bg }}
                    aria-label={`${displayName} ${locale === 'es' ? 'estadísticas' : 'statistics'}`}
                >
                    {emoji}
                </button>

                {/* Name and clickable count pill below - flex-1 takes remaining space */}
                <div className="flex-1 text-left min-w-0 overflow-hidden">
                    <button
                        onClick={onClick}
                        className="w-full text-left"
                    >
                        <div
                            className="font-semibold text-base flex items-center gap-1"
                            style={{ color: textColor }}
                        >
                            <span title={displayName}>{truncatedName}</span>
                            {/* Badge showing count of categories inside "Más" group */}
                            {data.categoryCount && (
                                <span
                                    className="inline-flex items-center justify-center rounded-full flex-shrink-0"
                                    style={{
                                        backgroundColor: 'transparent',
                                        border: `1.5px solid ${textColor}`,
                                        color: textColor,
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        minWidth: '18px',
                                        height: '18px',
                                        padding: '0 4px',
                                    }}
                                >
                                    {data.categoryCount}
                                </span>
                            )}
                        </div>
                    </button>
                    {/* Story 14.13.2: Clickable count pill below category name */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCountClick?.();
                        }}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors mt-1 ${
                            isDark
                                ? 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                        aria-label={`${locale === 'es' ? 'Ver' : 'View'} ${displayCount} ${
                            countMode === 'items'
                                ? (locale === 'es' ? 'productos' : 'items')
                                : (locale === 'es' ? 'transacciones' : 'transactions')
                        }`}
                        data-testid={`trend-count-pill-${data.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                        {countMode === 'items' ? <Package size={11} /> : <Receipt size={11} />}
                        <span>{displayCount}</span>
                    </button>
                </div>

                {/* Sparkline + Stats - compact, close together on right */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Sparkline - minimal gap from numbers */}
                    <div className="w-14 h-6">
                        <svg viewBox="0 0 64 24" className="w-full h-full">
                            {renderSparkline()}
                        </svg>
                    </div>

                    {/* Stats: Amount + Change stacked vertically - right-aligned */}
                    <div className="text-right min-w-[52px]">
                        <div
                            className="font-semibold text-sm"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {formatShortCurrency(data.value, currency)}
                        </div>
                        {/* Story 14.13.2: Change indicator right-aligned below amount */}
                        <div className="mt-0.5 flex justify-end">
                            {renderChangeIndicator()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Drill-down chevron zone - emerges from behind card with rounded corners */}
            {/* Story 14.13.3: Only show when showDrillDown is true (hidden on item-categories) */}
            {showDrillDown && (
                <button
                    onClick={onClick}
                    className="flex-shrink-0 w-6 flex items-center justify-center rounded-r-xl transition-all pl-2"
                    style={{
                        backgroundColor: isDark
                            ? 'var(--bg-tertiary, #334155)'
                            : 'var(--bg-tertiary, #f1f5f9)',
                        color: 'var(--text-tertiary)',
                        zIndex: 0,
                    }}
                    aria-label={`Drill down into ${displayName}`}
                >
                    <ChevronRight
                        size={16}
                        className="transition-colors group-hover:text-[var(--text-secondary)]"
                    />
                </button>
            )}
        </div>
    );
};

// Note: TimeFilterDropdown component moved to IconFilterBar

// ============================================================================
// Main Component
// ============================================================================

export const TrendsView: React.FC<TrendsViewProps> = ({ __testData }) => {
    // Story 14e-25b.1: Get all data from internal hook
    const hookData = useTrendsViewData();

    // Merge hook data with test overrides (test overrides take precedence)
    const {
        transactions,
        theme,
        colorTheme: _colorTheme,
        currency,
        locale,
        lang: _lang,
        t,
        // Props kept for API compatibility but not used in redesigned view
        onEditTransaction: _onEditTransaction,
        exporting: _exporting = false,
        // Story 14.14b: User info for header consistency
        userName = '',
        userEmail = '',
        userId = '',
        appId: _appId = '',
        // Story 14.13 Session 7: Initial distribution view for back navigation
        initialDistributionView,
        // Story 14.13: Font color mode - receiving this prop triggers re-render when setting changes
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fontColorMode: _fontColorMode,
        isGroupMode = false,
        groupName: _groupName,
        groupMembers = [],
        spendingByMember: _spendingByMember,
    } = { ...hookData, ...__testData } as TrendsViewData;
    const isDark = theme === 'dark';
    const prefersReducedMotion = useReducedMotion();
    const carouselRef = useRef<HTMLDivElement>(null);

    // Story 14e-25d: Direct navigation from store and shared hooks (ViewHandlersContext deleted)
    const { handleNavigateToHistory } = useHistoryNavigation();
    const { navigateBack, setView } = useNavigationActions();
    const onNavigateToHistory = handleNavigateToHistory;
    const onBack = navigateBack;
    const navigateToView = setView;

    const carouselTitles = isGroupMode ? CAROUSEL_TITLES_GROUP : CAROUSEL_TITLES_BASE;
    const maxCarouselSlide = isGroupMode ? 2 : 1;

    // =========================================================================
    // State
    // =========================================================================

    // Story 14.14b: Profile dropdown state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

    // Story 14.14b: Use HistoryFilters context for IconFilterBar and bidirectional sync
    const { state: filterState, dispatch: filterDispatch } = useHistoryFilters();

    const { groups, isLoading: groupsLoading } = useAllUserGroups(userId);

    // Story 14.14b: Extract available filters from transactions for IconFilterBar
    const availableFilters = useMemo(
        () => extractAvailableFilters(transactions as any),
        [transactions]
    );

    // Time period selection (AC #2)
    // Story 14.14b Session 7: Persist time period to localStorage so it's retained on back navigation
    const [timePeriod, setTimePeriodLocal] = useState<TimePeriod>(() => {
        try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.getItem) {
                const saved = localStorage.getItem('boletapp-analytics-timeperiod');
                if (saved && ['year', 'quarter', 'month', 'week'].includes(saved)) {
                    return saved as TimePeriod;
                }
            }
        } catch {
            // localStorage not available
        }
        return 'month';
    });

    // Current period navigation (AC #3)
    // Story 14.14b Session 7: Persist current period to localStorage so it's retained on back navigation
    const now = new Date();
    const [currentPeriod, setCurrentPeriodLocal] = useState<CurrentPeriod>(() => {
        try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.getItem) {
                const saved = localStorage.getItem('boletapp-analytics-currentperiod');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Validate the parsed object has required fields
                    if (parsed && typeof parsed.year === 'number' && typeof parsed.month === 'number' &&
                        typeof parsed.quarter === 'number' && typeof parsed.week === 'number') {
                        return parsed as CurrentPeriod;
                    }
                }
            }
        } catch {
            // localStorage not available or invalid JSON
        }
        // Default to current date
        return {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            quarter: Math.ceil((now.getMonth() + 1) / 3),
            week: Math.ceil(now.getDate() / 7),
        };
    });

    // Track if we're updating from context to prevent loops
    const isUpdatingFromContext = useRef(false);

    // =========================================================================
    // Bidirectional Sync: TrendsView ↔ IconFilterBar (HistoryFiltersContext)
    // =========================================================================

    // Sync FROM context TO local state (when IconFilterBar changes temporal filter)
    useEffect(() => {
        const temporal = filterState.temporal;
        if (temporal.level === 'all') return; // No filter active, don't sync

        isUpdatingFromContext.current = true;

        // Map context level to TimePeriod
        const levelToTimePeriod: Record<string, TimePeriod> = {
            year: 'year',
            quarter: 'quarter',
            month: 'month',
            week: 'week',
            day: 'week', // Day filter maps to week view
        };

        const newTimePeriod = levelToTimePeriod[temporal.level];
        if (newTimePeriod && newTimePeriod !== timePeriod) {
            setTimePeriodLocal(newTimePeriod);
        }

        // Update currentPeriod from context values
        const newPeriod: CurrentPeriod = { ...currentPeriod };
        let hasChanges = false;

        if (temporal.year && parseInt(temporal.year) !== currentPeriod.year) {
            newPeriod.year = parseInt(temporal.year);
            hasChanges = true;
        }

        if (temporal.quarter) {
            const quarterNum = parseInt(temporal.quarter.replace('Q', ''));
            if (quarterNum !== currentPeriod.quarter) {
                newPeriod.quarter = quarterNum;
                hasChanges = true;
            }
        }

        if (temporal.month) {
            const monthNum = parseInt(temporal.month.split('-')[1]);
            if (monthNum !== currentPeriod.month) {
                newPeriod.month = monthNum;
                newPeriod.quarter = Math.ceil(monthNum / 3);
                hasChanges = true;
            }
        }

        if (temporal.week !== undefined && temporal.week !== currentPeriod.week) {
            newPeriod.week = temporal.week;
            hasChanges = true;
        }

        if (hasChanges) {
            setCurrentPeriodLocal(newPeriod);
        }

        // Reset flag after state updates
        setTimeout(() => {
            isUpdatingFromContext.current = false;
        }, 0);
    }, [filterState.temporal]);

    // Wrapped setters that also dispatch to context (sync TO context)
    // Story 14.14b Session 7: Also persist to localStorage for back navigation
    // Story 14.14b Session 8: Cascade time period changes properly (e.g., Q3 → Month = July)
    const setTimePeriod = useCallback((newPeriod: TimePeriod) => {
        // Calculate cascaded values based on current time period and new selection
        // When drilling down (e.g., Quarter → Month), use first unit of current period
        // When drilling up (e.g., Month → Year), keep current values
        let adjustedMonth = currentPeriod.month;
        let adjustedQuarter = currentPeriod.quarter;
        let adjustedWeek = currentPeriod.week;

        // Story 14.13.2: Smart cascade logic - when drilling down from Year view,
        // use current date's values if viewing current year, otherwise use last period with likely data
        const today = new Date();
        const currentYear = today.getFullYear();
        const isCurrentYear = currentPeriod.year === currentYear;

        // Cascade logic: When switching to a finer granularity, set to appropriate period
        if (timePeriod === 'year') {
            // From Year: use current date values for current year, or last period for historical years
            if (newPeriod === 'quarter') {
                if (isCurrentYear) {
                    // Current year: use today's quarter
                    adjustedQuarter = Math.ceil((today.getMonth() + 1) / 3);
                    adjustedMonth = today.getMonth() + 1;
                } else {
                    // Historical year: default to Q4 (most likely to have data at year end)
                    adjustedQuarter = 4;
                    adjustedMonth = 12;
                }
                adjustedWeek = 1;
            } else if (newPeriod === 'month') {
                if (isCurrentYear) {
                    // Current year: use today's month
                    adjustedMonth = today.getMonth() + 1;
                    adjustedQuarter = Math.ceil(adjustedMonth / 3);
                } else {
                    // Historical year: default to December (most likely to have data)
                    adjustedMonth = 12;
                    adjustedQuarter = 4;
                }
                adjustedWeek = 1;
            } else if (newPeriod === 'week') {
                if (isCurrentYear) {
                    // Current year: use today's values
                    adjustedMonth = today.getMonth() + 1;
                    adjustedQuarter = Math.ceil(adjustedMonth / 3);
                    adjustedWeek = Math.ceil(today.getDate() / 7);
                } else {
                    // Historical year: default to last week of December
                    adjustedMonth = 12;
                    adjustedQuarter = 4;
                    adjustedWeek = 4; // ~4th week of December
                }
            }
        } else if (timePeriod === 'quarter') {
            // From Quarter: set month to first month of current quarter, week to 1
            if (newPeriod === 'month') {
                // Q1=Jan(1), Q2=Apr(4), Q3=Jul(7), Q4=Oct(10)
                adjustedMonth = (currentPeriod.quarter - 1) * 3 + 1;
                adjustedWeek = 1;
            } else if (newPeriod === 'week') {
                adjustedMonth = (currentPeriod.quarter - 1) * 3 + 1;
                adjustedWeek = 1;
            }
        } else if (timePeriod === 'month') {
            // From Month: set week to 1
            if (newPeriod === 'week') {
                adjustedWeek = 1;
            }
            // Update quarter based on current month when going up
            if (newPeriod === 'quarter' || newPeriod === 'year') {
                adjustedQuarter = Math.ceil(currentPeriod.month / 3);
            }
        } else if (timePeriod === 'week') {
            // From Week: update quarter based on current month when going up
            if (newPeriod === 'quarter' || newPeriod === 'year') {
                adjustedQuarter = Math.ceil(currentPeriod.month / 3);
            }
        }

        // Update currentPeriod with adjusted values
        setCurrentPeriodLocal(prev => {
            const updated = {
                ...prev,
                month: adjustedMonth,
                quarter: adjustedQuarter,
                week: adjustedWeek,
            };
            // Persist to localStorage
            try {
                if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.setItem) {
                    localStorage.setItem('boletapp-analytics-currentperiod', JSON.stringify(updated));
                }
            } catch {
                // localStorage not available
            }
            return updated;
        });

        setTimePeriodLocal(newPeriod);

        // Persist to localStorage
        try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.setItem) {
                localStorage.setItem('boletapp-analytics-timeperiod', newPeriod);
            }
        } catch {
            // localStorage not available
        }

        // Don't dispatch if we're updating from context
        if (isUpdatingFromContext.current) return;

        // Dispatch to context based on new period type with adjusted values
        const yearStr = String(currentPeriod.year);
        const monthStr = `${currentPeriod.year}-${String(adjustedMonth).padStart(2, '0')}`;
        const quarterStr = `Q${adjustedQuarter}`;

        switch (newPeriod) {
            case 'year':
                filterDispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildYearFilter(yearStr) });
                break;
            case 'quarter':
                filterDispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildQuarterFilter(yearStr, quarterStr) });
                break;
            case 'month':
                filterDispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildMonthFilter(yearStr, monthStr) });
                break;
            case 'week':
                filterDispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildWeekFilter(yearStr, monthStr, adjustedWeek) });
                break;
        }
    }, [timePeriod, currentPeriod, filterDispatch]);

    // Story 14.14b Session 7: Also persist currentPeriod to localStorage for back navigation
    const setCurrentPeriod = useCallback((updater: CurrentPeriod | ((prev: CurrentPeriod) => CurrentPeriod)) => {
        setCurrentPeriodLocal(prev => {
            const newPeriod = typeof updater === 'function' ? updater(prev) : updater;

            // Persist to localStorage
            try {
                if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.setItem) {
                    localStorage.setItem('boletapp-analytics-currentperiod', JSON.stringify(newPeriod));
                }
            } catch {
                // localStorage not available
            }

            // Don't dispatch if we're updating from context
            if (!isUpdatingFromContext.current) {
                // Dispatch to context based on current timePeriod level
                const yearStr = String(newPeriod.year);
                const monthStr = `${newPeriod.year}-${String(newPeriod.month).padStart(2, '0')}`;
                const quarterStr = `Q${newPeriod.quarter}`;

                // Use setTimeout to dispatch after state update
                setTimeout(() => {
                    switch (timePeriod) {
                        case 'year':
                            filterDispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildYearFilter(yearStr) });
                            break;
                        case 'quarter':
                            filterDispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildQuarterFilter(yearStr, quarterStr) });
                            break;
                        case 'month':
                            filterDispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildMonthFilter(yearStr, monthStr) });
                            break;
                        case 'week':
                            filterDispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildWeekFilter(yearStr, monthStr, newPeriod.week) });
                            break;
                    }
                }, 0);
            }

            return newPeriod;
        });
    }, [timePeriod, filterDispatch]);

    // Carousel state (AC #4)
    // Story 14.13.2: Persist carousel position so navigating back returns to same slide
    const [carouselSlide, setCarouselSlideLocal] = useState<CarouselSlide>(() => {
        try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.getItem) {
                const saved = localStorage.getItem('boletapp-analytics-carousel');
                if (saved === '0' || saved === '1') {
                    return parseInt(saved) as CarouselSlide;
                }
            }
        } catch {
            // localStorage not available
        }
        return 0;
    });

    // Wrapped setter that persists carousel position
    const setCarouselSlide = useCallback((value: CarouselSlide | ((prev: CarouselSlide) => CarouselSlide)) => {
        setCarouselSlideLocal(prev => {
            const newValue = typeof value === 'function' ? value(prev) : value;
            try {
                if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.setItem) {
                    localStorage.setItem('boletapp-analytics-carousel', String(newValue));
                }
            } catch {
                // localStorage not available
            }
            return newValue;
        });
    }, []);

    // Animation trigger key - increments when slide changes to restart animations
    const [animationKey, setAnimationKey] = useState(0);

    // View toggle states (AC #7)
    // Story 14.13 Session 7: Initialize from prop for back navigation restoration
    const [distributionView, setDistributionView] = useState<DistributionView>(initialDistributionView || 'treemap');
    const [tendenciaView, setTendenciaView] = useState<TendenciaView>('list');

    // Story 14.13.3 Phase 5: Sankey mode state (3-level-groups or 3-level-categories)
    const [sankeyMode, setSankeyMode] = useState<SankeyMode>('3-level-groups');

    // Story 14.13.3: Sankey selection state (controlled from parent for toggle behavior)
    const [sankeySelectedNode, setSankeySelectedNode] = useState<string | null>(null);
    // Note: sankeyTitle is set but we use sankeySelectionData for pill-style display
    const [, setSankeyTitle] = useState<string | null>(null);
    const [sankeySelectionData, setSankeySelectionData] = useState<SankeySelectionData | null>(null);

    // Story 14.13.3: Refs for diagram scrolling (controlled by left/right buttons)
    const sankeyScrollableRef = useRef<HTMLDivElement>(null);
    const [sankeyContentWidth] = useState(500); // minWidth of diagram - 15% wider for better detail visibility

    // Story 14.13.3: Animation key for Sankey transitions (increments on view/mode change)
    const [sankeyAnimationKey, setSankeyAnimationKey] = useState(0);
    const [sankeyVisible, setSankeyVisible] = useState(false);

    // Story 14.13.3: Handle Sankey selection change with pill-style data
    const handleSankeySelectionChange = useCallback((
        nodeName: string | null,
        title: string | null,
        data?: SankeySelectionData | null
    ) => {
        setSankeySelectedNode(nodeName);
        setSankeyTitle(title);
        setSankeySelectionData(data ?? null);
    }, []);

    // Story 14.13.3: Trigger Sankey animation when view changes to Sankey or mode changes
    useEffect(() => {
        if (tendenciaView === 'sankey' && carouselSlide === 1) {
            // Reset visibility to trigger entrance animation
            setSankeyVisible(false);
            // Small delay to ensure CSS transition triggers
            const timer = setTimeout(() => {
                setSankeyVisible(true);
                // Scroll diagram to the right so user can swipe left to explore
                if (sankeyScrollableRef.current) {
                    sankeyScrollableRef.current.scrollTo({
                        left: sankeyScrollableRef.current.scrollWidth,
                        behavior: 'instant', // No animation, just position it
                    });
                }
            }, 50);
            return () => clearTimeout(timer);
        } else {
            setSankeyVisible(false);
        }
    }, [tendenciaView, carouselSlide, sankeyMode]);

    // Story 14.13.3: Increment animation key when Sankey mode changes to trigger re-animation
    useEffect(() => {
        if (tendenciaView === 'sankey') {
            setSankeyAnimationKey(prev => prev + 1);
            // Clear selection when mode changes
            setSankeySelectedNode(null);
            setSankeySelectionData(null);
        }
    }, [sankeyMode, tendenciaView]);

    // Note: Filter dropdown states moved to IconFilterBar component via HistoryFiltersProvider

    // Story 14.14b/14e-25d: Handle profile navigation via direct store actions
    const handleProfileNavigate = useCallback((view: string) => {
        setIsProfileOpen(false);
        navigateToView(view as View);
    }, [navigateToView]);

    // =========================================================================
    // Computed Data
    // =========================================================================

    // Filter transactions by current period AND apply category/location/group filters from filterState
    // Story 14.13.2: TrendsView manages its own time period selection via timePeriod/currentPeriod,
    // but category/location/group filters from CategorySelectorOverlay should still apply
    const filteredTransactions = useMemo(() => {
        // First filter by TrendsView's period selection
        const periodFiltered = filterByPeriod(transactions, timePeriod, currentPeriod);

        // Then apply category/location/group filters from filterState (but NOT temporal since we handle that above)
        // Create a filter state with 'all' temporal to avoid double-filtering by period
        const filtersWithoutTemporal: HistoryFilterState = {
            temporal: { level: 'all' },  // Skip temporal filtering (already done by filterByPeriod)
            category: filterState.category,
            location: filterState.location,
            group: filterState.group,
        };

        return filterTransactionsByHistoryFilters(periodFiltered, filtersWithoutTemporal);
    }, [transactions, timePeriod, currentPeriod, filterState.category, filterState.location, filterState.group]);

    // All category data (raw, for treemap logic)
    const allCategoryData = useMemo(
        () => computeAllCategoryData(filteredTransactions),
        [filteredTransactions]
    );

    // State for expanded categories from "Otro" (0 = collapsed, shows default categories)
    const [expandedCategoryCount, setExpandedCategoryCount] = useState(0);

    // Story 14.14b Session 4: View mode state for donut chart (lifted from DonutChart component)
    // Story 14.14b Session 6: Add localStorage persistence for view mode
    const [donutViewMode, setDonutViewModeLocal] = useState<DonutViewMode>(() => {
        // Initialize from localStorage if available
        // Note: Use try-catch for test environments where localStorage may be mocked
        try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.getItem) {
                const saved = localStorage.getItem('boletapp-analytics-viewmode');
                if (saved && ['store-groups', 'store-categories', 'item-groups', 'item-categories'].includes(saved)) {
                    return saved as DonutViewMode;
                }
            }
        } catch {
            // localStorage not available (e.g., SSR or test environment)
        }
        return 'store-categories';
    });

    // Story 14.14b Session 6: Wrapped setter that handles persistence and category filter sync
    const setDonutViewMode = useCallback((newMode: DonutViewMode) => {
        setDonutViewModeLocal(newMode);

        // Persist to localStorage (with defensive check for test environments)
        try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.setItem) {
                localStorage.setItem('boletapp-analytics-viewmode', newMode);
            }
        } catch {
            // localStorage not available
        }

        // Reverse sync: When switching to "groups" mode, clear category filters
        // This ensures the analytics show all data when viewing group-level aggregations
        if (newMode === 'store-groups' || newMode === 'item-groups') {
            filterDispatch({ type: 'CLEAR_CATEGORY' });
        }
    }, [filterDispatch]);

    // Story 14.13 Session 5: Count mode toggle - transactions vs items
    // 'transactions' = count transactions, navigate to Compras (Receipt icon)
    // 'items' = count items/products, navigate to Productos (Package icon)
    const [countMode, setCountModeLocal] = useState<'transactions' | 'items'>(() => {
        try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.getItem) {
                const saved = localStorage.getItem('boletapp-analytics-countmode');
                if (saved === 'transactions' || saved === 'items') {
                    return saved;
                }
            }
        } catch {
            // localStorage not available
        }
        return 'transactions'; // Default to counting transactions
    });

    // Story 14.13 Session 5: Toggle count mode with persistence
    const toggleCountMode = useCallback(() => {
        setCountModeLocal(prev => {
            const newMode = prev === 'transactions' ? 'items' : 'transactions';
            try {
                if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.setItem) {
                    localStorage.setItem('boletapp-analytics-countmode', newMode);
                }
            } catch {
                // localStorage not available
            }
            return newMode;
        });
    }, []);

    // Story 14.13 Session 17: TreeMap drill-down state
    // Level 0: Top level categories (Supermercado, Restaurante, etc.)
    // Level 1: Item groups within that category (Alimentos Frescos, Bebidas, etc.)
    // Level 2: Item categories within that group (Carnes y Mariscos, Frutas y Verduras, etc.)
    // Level 3: Subcategories (Res, Cerdo, etc.)
    const [treemapDrillDownLevel, setTreemapDrillDownLevel] = useState<0 | 1 | 2 | 3>(0);
    const [treemapDrillDownPath, setTreemapDrillDownPath] = useState<string[]>([]); // Stores names at each drill level
    const [treemapDrillDownExpandedCount, setTreemapDrillDownExpandedCount] = useState(0);

    // Reset treemap drill-down when period or view mode changes (data changes)
    useEffect(() => {
        setTreemapDrillDownLevel(0);
        setTreemapDrillDownPath([]);
        setTreemapDrillDownExpandedCount(0);
    }, [timePeriod, currentPeriod, donutViewMode]);

    // Story 14.13.2: Drill-down state for Tendencia trend list (sparklines section)
    // Mirrors treemap drill-down but for trend list with period comparison
    const [trendDrillDownLevel, setTrendDrillDownLevel] = useState<0 | 1 | 2 | 3>(0);
    const [trendDrillDownPath, setTrendDrillDownPath] = useState<string[]>([]);
    // Story 14.13.2: Expanded count for sparklines "Más" grouping (matches TreeMap behavior)
    const [trendExpandedCount, setTrendExpandedCount] = useState(0);
    // Track expanded count at drill-down levels for sparklines
    const [trendDrillDownExpandedCount, setTrendDrillDownExpandedCount] = useState(0);

    // Story 14.13.3: Animation state for Tendencia trend list
    // Tracks animation key to trigger re-animation on drill-down or slide change
    const [trendAnimationKey, setTrendAnimationKey] = useState(0);
    // Tracks which trend items have animated in (for staggered slide-in from left)
    const [visibleTrendItems, setVisibleTrendItems] = useState<Set<number>>(new Set());

    // Story 14.40: Category statistics popup state
    // When a category icon is tapped, show statistics popup instead of immediate drill-down
    const [statsPopupOpen, setStatsPopupOpen] = useState(false);
    const [statsPopupCategory, setStatsPopupCategory] = useState<{
        name: string;
        emoji: string;
        color: string;       // Background color
        fgColor: string;     // Story 14.44: Foreground/text color for header
        type: 'store-category' | 'store-group' | 'item-category' | 'item-group';
    } | null>(null);

    // Story 14.13.3: Effect to animate trend items appearing with staggered slide-in
    useEffect(() => {
        // Reset visible items first
        setVisibleTrendItems(new Set());

        const itemCount = 15; // Max items we might have
        const delays: ReturnType<typeof setTimeout>[] = [];

        for (let i = 0; i < itemCount; i++) {
            const timer = setTimeout(() => {
                setVisibleTrendItems(prev => new Set([...prev, i]));
            }, i * 60); // 60ms stagger between items
            delays.push(timer);
        }

        return () => delays.forEach(clearTimeout);
    }, [trendAnimationKey]);

    // Reset trend drill-down when period or view mode changes
    useEffect(() => {
        setTrendDrillDownLevel(0);
        setTrendDrillDownPath([]);
        setTrendExpandedCount(0);
        setTrendDrillDownExpandedCount(0);
        // Story 14.13.3: Trigger animation on data change
        setTrendAnimationKey(prev => prev + 1);
    }, [timePeriod, currentPeriod, donutViewMode]);

    // Story 14.13.3: Trigger trend animation when switching to Tendencia slide
    useEffect(() => {
        if (carouselSlide === 1) {
            setTrendAnimationKey(prev => prev + 1);
        }
    }, [carouselSlide]);

    // Reset expanded count when period or view mode changes (data changes)
    useEffect(() => {
        setExpandedCategoryCount(0);
    }, [timePeriod, currentPeriod, donutViewMode]);

    // Story 14.14b: View mode data computations for treemap
    // Aggregate allCategoryData by store category groups
    // Story 14.13 Session 5: Now also aggregates itemCount for count mode toggle
    const storeGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<StoreCategoryGroup, { value: number; count: number; itemCount: number }> = {
            'food-dining': { value: 0, count: 0, itemCount: 0 },
            'health-wellness': { value: 0, count: 0, itemCount: 0 },
            'retail-general': { value: 0, count: 0, itemCount: 0 },
            'retail-specialty': { value: 0, count: 0, itemCount: 0 },
            'automotive': { value: 0, count: 0, itemCount: 0 },
            'services': { value: 0, count: 0, itemCount: 0 },
            'hospitality': { value: 0, count: 0, itemCount: 0 },
            'other': { value: 0, count: 0, itemCount: 0 },
        };

        for (const cat of allCategoryData) {
            const group = STORE_CATEGORY_GROUPS[cat.name as keyof typeof STORE_CATEGORY_GROUPS] || 'other';
            groupTotals[group].value += cat.value;
            groupTotals[group].count += cat.count;
            groupTotals[group].itemCount += cat.itemCount || 0;
        }

        const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

        return ALL_STORE_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getStoreGroupColors(groupKey, theme, mode);
                return {
                    name: groupKey,
                    value: data.value,
                    count: data.count,
                    itemCount: data.itemCount,
                    color: colors.bg,
                    fgColor: colors.fg,
                    percent: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
                };
            })
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [allCategoryData]);

    // Aggregate item categories from transaction line items
    const itemCategoriesData = useMemo((): CategoryData[] => {
        return computeItemCategoryData(filteredTransactions);
    }, [filteredTransactions]);

    // Aggregate item categories by item groups
    // Story 14.14b Session 6: Use transactionIds for accurate counting (prevents double-counting)
    // Story 14.13 Session 5: Now also aggregates itemCount for count mode toggle
    // Story 14.13 Session 7: Compute unique products directly from transactions to avoid double-counting
    const itemGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<ItemCategoryGroup, { value: number; transactionIds: Set<string>; uniqueProducts: Set<string> }> = {
            'food-fresh': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'food-packaged': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'health-personal': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'household': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'nonfood-retail': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'services-fees': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'other-item': { value: 0, transactionIds: new Set(), uniqueProducts: new Set() },
        };

        // Story 14.13 Session 7: Compute directly from transactions to properly count unique products per group
        filteredTransactions.forEach((tx, index) => {
            (tx.items || []).forEach(item => {
                const cat = normalizeItemCategory(item.category || 'Other');
                const itemKey = ITEM_CATEGORY_TO_KEY[cat as keyof typeof ITEM_CATEGORY_TO_KEY];
                const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';

                groupTotals[group].value += item.price;
                groupTotals[group].transactionIds.add(tx.id ?? `tx-${index}`);

                // Track unique products by normalized name + merchant
                const normalizedName = (item.name || 'Unknown').toLowerCase().trim().replace(/\s+/g, ' ');
                const normalizedMerchant = (tx.merchant || 'unknown').toLowerCase().trim().replace(/\s+/g, ' ');
                const productKey = `${normalizedName}::${normalizedMerchant}`;
                groupTotals[group].uniqueProducts.add(productKey);
            });
        });

        const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

        return ALL_ITEM_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getItemGroupColors(groupKey, theme, mode);
                return {
                    name: groupKey,
                    value: data.value,
                    count: data.transactionIds.size,  // Unique transaction count
                    itemCount: data.uniqueProducts.size,  // Story 14.13 Session 7: Unique products count
                    transactionIds: data.transactionIds,  // Keep for further aggregation
                    color: colors.bg,
                    fgColor: colors.fg,
                    percent: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
                };
            })
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    // Get the base data for the current view mode (before treemap categorization)
    const viewModeBaseData = useMemo((): CategoryData[] => {
        switch (donutViewMode) {
            case 'store-groups':
                return storeGroupsData;
            case 'store-categories':
                return allCategoryData;
            case 'item-groups':
                return itemGroupsData;
            case 'item-categories':
                return itemCategoriesData;
            default:
                return allCategoryData;
        }
    }, [donutViewMode, allCategoryData, storeGroupsData, itemGroupsData, itemCategoriesData]);

    // Treemap categories with expand/collapse logic - now uses view mode data
    const { displayCategories: categoryData, otroCategories, canExpand, canCollapse } = useMemo(
        () => computeTreemapCategories(viewModeBaseData, expandedCategoryCount),
        [viewModeBaseData, expandedCategoryCount]
    );

    // Story 14.13 Session 17: TreeMap drill-down data computation
    // Computes what to display based on the treemap drill-down level and path
    const treemapDrillDownData = useMemo((): CategoryData[] => {
        if (treemapDrillDownLevel === 0) return [];

        const path = treemapDrillDownPath;

        // Drill-down structure depends on viewMode:
        // store-categories: storeCategory -> itemGroups -> itemCategories -> subcategories
        // store-groups: storeGroup -> storeCategories -> itemGroups -> itemCategories -> subcategories
        // item-groups: itemGroup -> itemCategories -> subcategories
        // item-categories: itemCategory -> subcategories

        if (donutViewMode === 'store-categories') {
            if (treemapDrillDownLevel === 1 && path[0]) {
                // Level 1: Item groups within this store category
                return computeItemGroupsForStore(filteredTransactions, path[0]);
            } else if (treemapDrillDownLevel === 2 && path[1] && path[0]) {
                // Level 2: Item categories within this item group, filtered by store category
                return computeItemCategoriesInGroup(filteredTransactions, path[1], path[0]);
            } else if (treemapDrillDownLevel === 3 && path[2]) {
                // Level 3: Subcategories
                return computeSubcategoryData(filteredTransactions, path[2]);
            }
        }

        if (donutViewMode === 'store-groups') {
            if (treemapDrillDownLevel === 1 && path[0]) {
                // Level 1: Store categories in this store group
                return allCategoryData.filter(cat => {
                    const catGroup = STORE_CATEGORY_GROUPS[cat.name as keyof typeof STORE_CATEGORY_GROUPS];
                    return catGroup === path[0];
                });
            } else if (treemapDrillDownLevel === 2 && path[1]) {
                // Level 2: Item groups in this store category
                return computeItemGroupsForStore(filteredTransactions, path[1]);
            } else if (treemapDrillDownLevel === 3 && path[2] && path[1]) {
                // Level 3: Item categories in this item group, filtered by store category
                return computeItemCategoriesInGroup(filteredTransactions, path[2], path[1]);
            }
        }

        if (donutViewMode === 'item-groups') {
            if (treemapDrillDownLevel === 1 && path[0]) {
                // Level 1: Item categories in this item group
                return computeItemCategoriesInGroup(filteredTransactions, path[0]);
            } else if (treemapDrillDownLevel === 2 && path[1]) {
                // Level 2: Subcategories
                return computeSubcategoryData(filteredTransactions, path[1]);
            }
        }

        if (donutViewMode === 'item-categories') {
            if (treemapDrillDownLevel === 1 && path[0]) {
                // Level 1: Subcategories
                return computeSubcategoryData(filteredTransactions, path[0]);
            }
        }

        return [];
    }, [treemapDrillDownLevel, treemapDrillDownPath, donutViewMode, filteredTransactions, allCategoryData]);

    // Story 14.13 Session 17: Process treemap drill-down data through the same expand/collapse logic
    const treemapDrillDownCategorized = useMemo(() => {
        if (treemapDrillDownLevel === 0) {
            return { displayCategories: categoryData, otroCategories, canExpand, canCollapse };
        }
        // Recalculate percentages relative to drill-down total (100% chart)
        const drillDownTotal = treemapDrillDownData.reduce((sum, c) => sum + c.value, 0);
        const recalculatedData = treemapDrillDownData.map(c => ({
            ...c,
            percent: drillDownTotal > 0 ? Math.round((c.value / drillDownTotal) * 100) : 0,
        }));
        return computeTreemapCategories(recalculatedData, treemapDrillDownExpandedCount);
    }, [treemapDrillDownLevel, treemapDrillDownData, treemapDrillDownExpandedCount, categoryData, otroCategories, canExpand, canCollapse]);

    // Story 14.13 Session 17: Get max drill-down level based on view mode
    const getTreemapMaxDrillDownLevel = useCallback((): number => {
        switch (donutViewMode) {
            case 'store-groups':
                return 3; // storeGroup -> storeCategory -> itemGroup -> itemCategory
            case 'store-categories':
                return 3; // storeCategory -> itemGroup -> itemCategory -> subcategory
            case 'item-groups':
                return 2; // itemGroup -> itemCategory -> subcategory
            case 'item-categories':
                return 1; // itemCategory -> subcategory
            default:
                return 3;
        }
    }, [donutViewMode]);

    /**
     * Story 14.13.2: Get previous period transactions for comparison
     * Filters all transactions to those in the previous corresponding period
     * Also applies category/location/group filters for consistency with filteredTransactions
     */
    const previousPeriodTransactions = useMemo(() => {
        // Build current period identifier
        const currentPeriodId: PeriodIdentifier = { year: currentPeriod.year };
        if (timePeriod === 'month' || timePeriod === 'week') {
            currentPeriodId.month = currentPeriod.month;
        }
        if (timePeriod === 'quarter') {
            currentPeriodId.quarter = currentPeriod.quarter;
        }
        if (timePeriod === 'week') {
            currentPeriodId.week = currentPeriod.week;
        }

        // Get previous period
        const prevPeriod = getPreviousPeriod(currentPeriodId, timePeriod);

        // Filter transactions to previous period
        const periodFiltered = transactions.filter(tx => {
            // Transaction.date is a string in ISO format
            const txDate = new Date(tx.date);
            return isDateInPeriod(txDate, prevPeriod, timePeriod);
        });

        // Apply category/location/group filters (same as filteredTransactions)
        const filtersWithoutTemporal: HistoryFilterState = {
            temporal: { level: 'all' },
            category: filterState.category,
            location: filterState.location,
            group: filterState.group,
        };

        return filterTransactionsByHistoryFilters(periodFiltered, filtersWithoutTemporal);
    }, [transactions, currentPeriod, timePeriod, filterState.category, filterState.location, filterState.group]);

    /**
     * Story 14.13.2: Compute previous period category totals for comparison
     * Aggregates spending by category from previous period transactions
     */
    const previousPeriodTotals = useMemo(() => {
        const totals = new Map<string, number>();

        // Helper to get category based on view mode
        const getCategory = (tx: Transaction): string | null => {
            switch (donutViewMode) {
                case 'store-groups': {
                    const storeCat = tx.category || 'Unknown';
                    // Look up the group for this store category
                    // STORE_CATEGORY_GROUPS maps category -> group (e.g., 'Supermarket' -> 'food-dining')
                    return STORE_CATEGORY_GROUPS[storeCat as keyof typeof STORE_CATEGORY_GROUPS] || 'other';
                }
                case 'store-categories':
                    return tx.category || 'Unknown';
                case 'item-groups': {
                    // Aggregate item categories to groups
                    const itemGroups = new Set<string>();
                    tx.items?.forEach(item => {
                        // TransactionItem uses 'category' not 'itemCategory'
                        const itemCat = normalizeItemCategory((item.category as string) || 'Unknown');
                        const groupKey = ITEM_CATEGORY_TO_KEY[itemCat as keyof typeof ITEM_CATEGORY_TO_KEY];
                        if (groupKey) {
                            // ITEM_CATEGORY_GROUPS maps itemCategoryKey -> group (e.g., 'Produce' -> 'food-fresh')
                            const group = ITEM_CATEGORY_GROUPS[groupKey as keyof typeof ITEM_CATEGORY_GROUPS];
                            if (group) {
                                itemGroups.add(group);
                            }
                        }
                    });
                    // Return first group found (simplified - actual implementation uses all items)
                    return itemGroups.size > 0 ? Array.from(itemGroups)[0] : null;
                }
                case 'item-categories': {
                    // Use first item's category (simplified)
                    const firstItem = tx.items?.[0];
                    if (firstItem) {
                        // TransactionItem uses 'category' not 'itemCategory'
                        return normalizeItemCategory((firstItem.category as string) || 'Unknown');
                    }
                    return null;
                }
                default:
                    return tx.category || 'Unknown';
            }
        };

        // For store-based modes, aggregate by transaction
        if (donutViewMode === 'store-groups' || donutViewMode === 'store-categories') {
            previousPeriodTransactions.forEach(tx => {
                const category = getCategory(tx);
                if (category) {
                    totals.set(category, (totals.get(category) || 0) + tx.total);
                }
            });
        } else {
            // For item-based modes, aggregate by items
            previousPeriodTransactions.forEach(tx => {
                tx.items?.forEach(item => {
                    let category: string | null = null;

                    if (donutViewMode === 'item-groups') {
                        // TransactionItem uses 'category' not 'itemCategory', and 'qty' not 'quantity'
                        const itemCat = normalizeItemCategory((item.category as string) || 'Unknown');
                        const groupKey = ITEM_CATEGORY_TO_KEY[itemCat as keyof typeof ITEM_CATEGORY_TO_KEY];
                        if (groupKey) {
                            // ITEM_CATEGORY_GROUPS maps itemCategoryKey -> group (e.g., 'Produce' -> 'food-fresh')
                            category = ITEM_CATEGORY_GROUPS[groupKey as keyof typeof ITEM_CATEGORY_GROUPS] || null;
                        }
                    } else {
                        // TransactionItem uses 'category' not 'itemCategory'
                        category = normalizeItemCategory((item.category as string) || 'Unknown');
                    }

                    if (category) {
                        // TransactionItem uses 'qty' not 'quantity'
                        const itemTotal = item.price * (item.qty || 1);
                        totals.set(category, (totals.get(category) || 0) + itemTotal);
                    }
                });
            });
        }

        return totals;
    }, [previousPeriodTransactions, donutViewMode]);

    /**
     * Story 14.13.2: Compute cumulative daily sparkline data for a category
     * Shows cumulative spending throughout the current period (X=days, Y=cumulative amount)
     * Each point represents the running total up to that day
     * - Week: 7 points (one per day)
     * - Month: up to 31 points (one per day)
     * - Quarter: ~90 points (one per day, may downsample)
     * - Year: ~365 points (downsampled to ~30 points)
     */
    const computeDailySparkline = useCallback((
        categoryName: string,
        currentTxs: Transaction[],
        _previousTxs: Transaction[]
    ): number[] => {
        // Helper to get category value from transaction based on view mode
        const getCategoryValue = (tx: Transaction): { match: boolean; value: number } => {
            switch (donutViewMode) {
                case 'store-groups': {
                    const storeCat = tx.category || 'Unknown';
                    for (const [groupKey, categories] of Object.entries(STORE_CATEGORY_GROUPS)) {
                        if (categories.includes(storeCat) && groupKey === categoryName) {
                            return { match: true, value: tx.total };
                        }
                    }
                    return { match: false, value: 0 };
                }
                case 'store-categories':
                    return tx.category === categoryName
                        ? { match: true, value: tx.total }
                        : { match: false, value: 0 };
                case 'item-groups':
                case 'item-categories':
                    // For item-based modes, sum up matching items
                    let itemTotal = 0;
                    tx.items?.forEach(item => {
                        const itemCat = normalizeItemCategory((item.category as string) || 'Unknown');
                        if (donutViewMode === 'item-groups') {
                            const groupKey = ITEM_CATEGORY_TO_KEY[itemCat as keyof typeof ITEM_CATEGORY_TO_KEY];
                            if (groupKey) {
                                for (const [group, categories] of Object.entries(ITEM_CATEGORY_GROUPS)) {
                                    if (categories.includes(groupKey) && group === categoryName) {
                                        itemTotal += item.price * (item.qty || 1);
                                        break;
                                    }
                                }
                            }
                        } else if (itemCat === categoryName) {
                            itemTotal += item.price * (item.qty || 1);
                        }
                    });
                    return { match: itemTotal > 0, value: itemTotal };
                default:
                    return { match: false, value: 0 };
            }
        };

        // Get the actual number of days in the current period
        const getDaysInCurrentPeriod = (): number => {
            switch (timePeriod) {
                case 'week': return 7;
                case 'month': {
                    // Get actual days in the selected month
                    const year = currentPeriod.year;
                    const month = currentPeriod.month || 1;
                    return new Date(year, month, 0).getDate();
                }
                case 'quarter': {
                    // Get days in the quarter (sum of 3 months)
                    const year = currentPeriod.year;
                    const quarter = currentPeriod.quarter || 1;
                    const startMonth = (quarter - 1) * 3;
                    let days = 0;
                    for (let m = 0; m < 3; m++) {
                        days += new Date(year, startMonth + m + 1, 0).getDate();
                    }
                    return days;
                }
                case 'year': return 365; // Will be downsampled
                default: return 30;
            }
        };

        const daysInPeriod = getDaysInCurrentPeriod();

        // Create daily buckets for current period only
        const dailyTotals = new Array(daysInPeriod).fill(0);

        // Process current period transactions - map each to its day within the period
        currentTxs.forEach(tx => {
            const result = getCategoryValue(tx);
            if (result.match) {
                const txDate = new Date(tx.date);
                let dayIndex: number;

                switch (timePeriod) {
                    case 'week': {
                        // Day of week (0-6)
                        dayIndex = txDate.getDay();
                        break;
                    }
                    case 'month': {
                        // Day of month (0-indexed)
                        dayIndex = txDate.getDate() - 1;
                        break;
                    }
                    case 'quarter': {
                        // Day within the quarter
                        const txMonth = txDate.getMonth();
                        const quarterStartMonth = ((currentPeriod.quarter || 1) - 1) * 3;
                        let dayOfQuarter = txDate.getDate() - 1;
                        // Add days from previous months in the quarter
                        for (let m = quarterStartMonth; m < txMonth; m++) {
                            dayOfQuarter += new Date(currentPeriod.year, m + 1, 0).getDate();
                        }
                        dayIndex = dayOfQuarter;
                        break;
                    }
                    case 'year': {
                        // Day of year (0-364)
                        const startOfYear = new Date(currentPeriod.year, 0, 1);
                        dayIndex = Math.floor((txDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
                        break;
                    }
                    default:
                        dayIndex = txDate.getDate() - 1;
                }

                // Ensure index is within bounds
                dayIndex = Math.max(0, Math.min(dayIndex, daysInPeriod - 1));
                dailyTotals[dayIndex] += result.value;
            }
        });

        // Convert daily totals to cumulative totals
        const cumulativeTotals: number[] = [];
        let runningTotal = 0;
        for (let i = 0; i < dailyTotals.length; i++) {
            runningTotal += dailyTotals[i];
            cumulativeTotals.push(runningTotal);
        }

        // Downsample to reasonable number of points for display (max 20 points)
        const maxPoints = 20;
        if (cumulativeTotals.length <= maxPoints) {
            return cumulativeTotals;
        }

        // For cumulative data, sample evenly to preserve the shape
        const sampledData: number[] = [];
        const step = (cumulativeTotals.length - 1) / (maxPoints - 1);
        for (let i = 0; i < maxPoints; i++) {
            const index = Math.round(i * step);
            sampledData.push(cumulativeTotals[index]);
        }

        return sampledData;
    }, [donutViewMode, timePeriod, currentPeriod]);

    /**
     * Story 14.13.2: Trend data with period-over-period comparison
     * Uses viewModeBaseData (current period) and previousPeriodTotals for comparison
     */
    const trendData = useMemo((): TrendData[] => {
        // Map current period categories with comparison data
        return viewModeBaseData.map((cat: CategoryData) => {
            const previousValue = previousPeriodTotals.get(cat.name) || 0;
            const changeResult = calculateChange(cat.value, previousValue);

            // Generate daily sparkline data showing both periods
            const sparklineData = computeDailySparkline(
                cat.name,
                filteredTransactions,
                previousPeriodTransactions
            );

            return {
                ...cat,
                sparkline: sparklineData,
                change: changeResult.percent,
                previousValue,
                changeDirection: changeResult.direction,
            };
        }).sort((a, b) => b.value - a.value); // Sort by current value descending (AC #1)
    }, [viewModeBaseData, previousPeriodTotals, computeDailySparkline, filteredTransactions, previousPeriodTransactions]);

    /**
     * Story 14.13.2: Get max drill-down level for trend list based on current view mode
     * Matches treemap logic
     */
    const getTrendMaxDrillDownLevel = useCallback((): number => {
        switch (donutViewMode) {
            case 'store-groups':
                return 3; // storeGroup -> storeCategory -> itemGroup -> itemCategory
            case 'store-categories':
                return 3; // storeCategory -> itemGroup -> itemCategory -> subcategory
            case 'item-groups':
                return 2; // itemGroup -> itemCategory -> subcategory
            case 'item-categories':
                return 1; // itemCategory -> subcategory
            default:
                return 3;
        }
    }, [donutViewMode]);

    /**
     * Story 14.13.2: Compute drill-down trend data with period comparison
     * Similar to treemapDrillDownData but returns TrendData with sparklines
     */
    const trendDrillDownData = useMemo((): TrendData[] => {
        if (trendDrillDownLevel === 0) return [];

        const path = trendDrillDownPath;
        let drillDownCategories: CategoryData[] = [];

        // Compute drill-down data based on view mode and level (matches treemap logic)
        switch (donutViewMode) {
            case 'store-categories':
                if (trendDrillDownLevel === 1 && path[0]) {
                    drillDownCategories = computeItemGroupsForStore(filteredTransactions, path[0]);
                } else if (trendDrillDownLevel === 2 && path[1] && path[0]) {
                    drillDownCategories = computeItemCategoriesInGroup(filteredTransactions, path[1], path[0]);
                } else if (trendDrillDownLevel === 3 && path[2]) {
                    drillDownCategories = computeSubcategoryData(filteredTransactions, path[2]);
                }
                break;
            case 'store-groups':
                if (trendDrillDownLevel === 1 && path[0]) {
                    // Drill into store group -> show store categories in that group
                    const categoriesInGroup = Object.entries(STORE_CATEGORY_GROUPS)
                        .filter(([, group]) => group === path[0])
                        .map(([cat]) => cat);
                    drillDownCategories = allCategoryData.filter(c => categoriesInGroup.includes(c.name));
                } else if (trendDrillDownLevel === 2 && path[1]) {
                    drillDownCategories = computeItemGroupsForStore(filteredTransactions, path[1]);
                } else if (trendDrillDownLevel === 3 && path[2] && path[1]) {
                    drillDownCategories = computeItemCategoriesInGroup(filteredTransactions, path[2], path[1]);
                }
                break;
            case 'item-groups':
                if (trendDrillDownLevel === 1 && path[0]) {
                    drillDownCategories = computeItemCategoriesInGroup(filteredTransactions, path[0]);
                } else if (trendDrillDownLevel === 2 && path[1]) {
                    drillDownCategories = computeSubcategoryData(filteredTransactions, path[1]);
                }
                break;
            case 'item-categories':
                if (trendDrillDownLevel === 1 && path[0]) {
                    drillDownCategories = computeSubcategoryData(filteredTransactions, path[0]);
                }
                break;
        }

        // Now compute previous period data for comparison
        let prevDrillDownCategories: CategoryData[] = [];
        switch (donutViewMode) {
            case 'store-categories':
                if (trendDrillDownLevel === 1 && path[0]) {
                    prevDrillDownCategories = computeItemGroupsForStore(previousPeriodTransactions, path[0]);
                } else if (trendDrillDownLevel === 2 && path[1] && path[0]) {
                    prevDrillDownCategories = computeItemCategoriesInGroup(previousPeriodTransactions, path[1], path[0]);
                } else if (trendDrillDownLevel === 3 && path[2]) {
                    prevDrillDownCategories = computeSubcategoryData(previousPeriodTransactions, path[2]);
                }
                break;
            case 'store-groups':
                if (trendDrillDownLevel === 1 && path[0]) {
                    const categoriesInGroup = Object.entries(STORE_CATEGORY_GROUPS)
                        .filter(([, group]) => group === path[0])
                        .map(([cat]) => cat);
                    const prevAllCategoryData = computeAllCategoryData(previousPeriodTransactions);
                    prevDrillDownCategories = prevAllCategoryData.filter(c => categoriesInGroup.includes(c.name));
                } else if (trendDrillDownLevel === 2 && path[1]) {
                    prevDrillDownCategories = computeItemGroupsForStore(previousPeriodTransactions, path[1]);
                } else if (trendDrillDownLevel === 3 && path[2] && path[1]) {
                    prevDrillDownCategories = computeItemCategoriesInGroup(previousPeriodTransactions, path[2], path[1]);
                }
                break;
            case 'item-groups':
                if (trendDrillDownLevel === 1 && path[0]) {
                    prevDrillDownCategories = computeItemCategoriesInGroup(previousPeriodTransactions, path[0]);
                } else if (trendDrillDownLevel === 2 && path[1]) {
                    prevDrillDownCategories = computeSubcategoryData(previousPeriodTransactions, path[1]);
                }
                break;
            case 'item-categories':
                if (trendDrillDownLevel === 1 && path[0]) {
                    prevDrillDownCategories = computeSubcategoryData(previousPeriodTransactions, path[0]);
                }
                break;
        }

        // Build map of previous period values
        const prevTotalsMap = new Map<string, number>();
        prevDrillDownCategories.forEach(c => prevTotalsMap.set(c.name, c.value));

        // Convert to TrendData with comparison
        return drillDownCategories.map(cat => {
            const previousValue = prevTotalsMap.get(cat.name) || 0;
            const changeResult = calculateChange(cat.value, previousValue);
            const sparklineData = computeDailySparkline(cat.name, filteredTransactions, previousPeriodTransactions);

            return {
                ...cat,
                sparkline: sparklineData,
                change: changeResult.percent,
                previousValue,
                changeDirection: changeResult.direction,
            };
        }).sort((a, b) => b.value - a.value);
    }, [trendDrillDownLevel, trendDrillDownPath, donutViewMode, filteredTransactions, previousPeriodTransactions, allCategoryData, computeDailySparkline]);

    /**
     * Story 14.13.2: Get the effective trend data based on drill-down state
     */
    const effectiveTrendData = useMemo((): TrendData[] => {
        return trendDrillDownLevel > 0 ? trendDrillDownData : trendData;
    }, [trendDrillDownLevel, trendDrillDownData, trendData]);

    /**
     * Story 14.13.2: Compute trend categories with "Más" grouping for sparklines
     * Uses trendExpandedCount at level 0, trendDrillDownExpandedCount at deeper levels
     */
    const currentTrendExpandedCount = trendDrillDownLevel > 0
        ? trendDrillDownExpandedCount
        : trendExpandedCount;

    const {
        displayTrends: displayTrendData,
        otroTrends: otroTrendCategories,
        canExpand: trendCanExpand,
        canCollapse: trendCanCollapse,
    } = useMemo(
        () => computeTrendCategories(effectiveTrendData, currentTrendExpandedCount),
        [effectiveTrendData, currentTrendExpandedCount]
    );

    /**
     * Story 14.13.2: Get current view mode at trend drill-down level
     * Used to determine which emoji/translation to use
     */
    const getTrendViewModeAtLevel = useCallback((): DonutViewMode => {
        if (trendDrillDownLevel === 0) return donutViewMode;

        switch (donutViewMode) {
            case 'store-groups':
                if (trendDrillDownLevel === 1) return 'store-categories';
                if (trendDrillDownLevel === 2) return 'item-groups';
                if (trendDrillDownLevel === 3) return 'item-categories';
                break;
            case 'store-categories':
                if (trendDrillDownLevel === 1) return 'item-groups';
                if (trendDrillDownLevel === 2) return 'item-categories';
                // Level 3 would be subcategories (still item-categories)
                break;
            case 'item-groups':
                if (trendDrillDownLevel === 1) return 'item-categories';
                // Level 2 would be subcategories
                break;
            case 'item-categories':
                // Level 1 would be subcategories
                break;
        }
        return donutViewMode;
    }, [trendDrillDownLevel, donutViewMode]);

    // Total spending
    const total = useMemo(
        () => filteredTransactions.reduce((sum, tx) => sum + tx.total, 0),
        [filteredTransactions]
    );

    // Period label
    const periodLabel = useMemo(
        () => getPeriodLabel(timePeriod, currentPeriod, locale),
        [timePeriod, currentPeriod, locale]
    );

    // Story 14.14b Session 7: Check if viewing current period (for visual indicator)
    // Returns true if the selected period matches today's date for the current time dimension
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isViewingCurrentPeriod = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentQuarter = Math.ceil(currentMonth / 3);
        const currentWeek = Math.ceil(now.getDate() / 7);

        switch (timePeriod) {
            case 'year':
                return currentPeriod.year === currentYear;
            case 'quarter':
                return currentPeriod.year === currentYear && currentPeriod.quarter === currentQuarter;
            case 'month':
                return currentPeriod.year === currentYear && currentPeriod.month === currentMonth;
            case 'week':
                return currentPeriod.year === currentYear &&
                       currentPeriod.month === currentMonth &&
                       currentPeriod.week === currentWeek;
            default:
                return true;
        }
    }, [timePeriod, currentPeriod]);

    // =========================================================================
    // Event Handlers
    // =========================================================================

    // Navigate to previous period (AC #3) with animation trigger
    const goPrevPeriod = useCallback(() => {
        setCurrentPeriod(prev => {
            switch (timePeriod) {
                case 'year':
                    return { ...prev, year: prev.year - 1 };
                case 'quarter':
                    if (prev.quarter === 1) {
                        return { ...prev, year: prev.year - 1, quarter: 4 };
                    }
                    return { ...prev, quarter: prev.quarter - 1 };
                case 'month':
                    if (prev.month === 1) {
                        return { ...prev, year: prev.year - 1, month: 12, quarter: 4 };
                    }
                    return {
                        ...prev,
                        month: prev.month - 1,
                        quarter: Math.ceil((prev.month - 1) / 3),
                    };
                case 'week':
                    if (prev.week === 1) {
                        // Go to previous month, last week
                        const newMonth = prev.month === 1 ? 12 : prev.month - 1;
                        const newYear = prev.month === 1 ? prev.year - 1 : prev.year;
                        return {
                            ...prev,
                            year: newYear,
                            month: newMonth,
                            quarter: Math.ceil(newMonth / 3),
                            week: 4, // Approximate
                        };
                    }
                    return { ...prev, week: prev.week - 1 };
            }
        });
        setAnimationKey(prev => prev + 1); // Trigger animations on period change
    }, [timePeriod]);

    // Navigate to next period (AC #3) with animation trigger
    const goNextPeriod = useCallback(() => {
        const now = new Date();
        setCurrentPeriod(prev => {
            switch (timePeriod) {
                case 'year':
                    if (prev.year >= now.getFullYear()) return prev;
                    return { ...prev, year: prev.year + 1 };
                case 'quarter':
                    if (prev.year >= now.getFullYear() && prev.quarter >= Math.ceil((now.getMonth() + 1) / 3)) {
                        return prev;
                    }
                    if (prev.quarter === 4) {
                        return { ...prev, year: prev.year + 1, quarter: 1 };
                    }
                    return { ...prev, quarter: prev.quarter + 1 };
                case 'month':
                    if (prev.year >= now.getFullYear() && prev.month >= now.getMonth() + 1) {
                        return prev;
                    }
                    if (prev.month === 12) {
                        return { ...prev, year: prev.year + 1, month: 1, quarter: 1 };
                    }
                    return {
                        ...prev,
                        month: prev.month + 1,
                        quarter: Math.ceil((prev.month + 1) / 3),
                    };
                case 'week':
                    if (prev.week >= 4) {
                        // Go to next month, first week
                        if (prev.year >= now.getFullYear() && prev.month >= now.getMonth() + 1) {
                            return prev;
                        }
                        const newMonth = prev.month === 12 ? 1 : prev.month + 1;
                        const newYear = prev.month === 12 ? prev.year + 1 : prev.year;
                        return {
                            ...prev,
                            year: newYear,
                            month: newMonth,
                            quarter: Math.ceil(newMonth / 3),
                            week: 1,
                        };
                    }
                    return { ...prev, week: prev.week + 1 };
            }
        });
        setAnimationKey(prev => prev + 1); // Trigger animations on period change
    }, [timePeriod]);

    // Story 14.14b Session 7: Handle time period pill click
    // If clicking on an already-selected period, reset to current (today's) period
    // This provides a quick way to return to "now" after navigating through past periods
    const handleTimePeriodClick = useCallback((period: TimePeriod) => {
        if (timePeriod === period) {
            // Already on this period - reset to current date
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const currentQuarter = Math.ceil(currentMonth / 3);
            const currentWeek = Math.ceil(now.getDate() / 7);

            setCurrentPeriod({
                year: currentYear,
                month: currentMonth,
                quarter: currentQuarter,
                week: currentWeek,
            });
            setAnimationKey(prev => prev + 1); // Trigger animation for the reset
        } else {
            // Different period - just switch to it
            setTimePeriod(period);
        }
    }, [timePeriod, setTimePeriod, setCurrentPeriod]);

    // Carousel navigation (AC #4) with animation trigger
    const goToPrevSlide = useCallback(() => {
        setCarouselSlide(prev => (prev === 0 ? maxCarouselSlide : prev - 1) as CarouselSlide);
        setAnimationKey(prev => prev + 1); // Trigger animations on new slide
    }, [maxCarouselSlide]);

    const goToNextSlide = useCallback(() => {
        setCarouselSlide(prev => (prev === maxCarouselSlide ? 0 : prev + 1) as CarouselSlide);
        setAnimationKey(prev => prev + 1); // Trigger animations on new slide
    }, [maxCarouselSlide]);

    // Story 14.13.3: Scroll Sankey diagram left/right (used by swipe gesture when on Sankey view)
    const scrollSankeyLeft = useCallback(() => {
        if (sankeyScrollableRef.current) {
            const scrollAmount = 150;
            sankeyScrollableRef.current.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth',
            });
        }
    }, []);

    const scrollSankeyRight = useCallback(() => {
        if (sankeyScrollableRef.current) {
            const scrollAmount = 150;
            sankeyScrollableRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth',
            });
        }
    }, []);

    // Toggle view (AC #7)
    const toggleView = useCallback(() => {
        if (carouselSlide === 0) {
            setDistributionView(prev => prev === 'treemap' ? 'donut' : 'treemap');
        } else {
            // Story 14.13.3: Toggle between list and sankey views
            setTendenciaView(prev => prev === 'list' ? 'sankey' : 'list');
        }
    }, [carouselSlide]);

    // Story 14.13.2: Handle trend list drill-down (chevron click)
    // Works like treemap drill-down - navigates into subcategories
    // Don't drill down on "Más" aggregated group - it doesn't have subcategories
    const handleTrendDrillDown = useCallback((categoryName: string) => {
        // Don't drill down on "Más" aggregated group - it's not a real category
        const isAggregatedGroup = categoryName === 'Más' || categoryName === 'More';
        if (isAggregatedGroup) return;

        const maxLevel = getTrendMaxDrillDownLevel();
        if (trendDrillDownLevel < maxLevel) {
            setTrendDrillDownPath(prev => [...prev, categoryName]);
            setTrendDrillDownLevel(prev => Math.min(prev + 1, 3) as 0 | 1 | 2 | 3);
            // Reset expanded count when drilling down (like treemap does)
            setTrendDrillDownExpandedCount(0);
            // Story 14.13.3: Trigger animation on drill-down
            setTrendAnimationKey(prev => prev + 1);
        }
    }, [trendDrillDownLevel, getTrendMaxDrillDownLevel]);

    // Story 14.13.2: Handle trend list back navigation
    const handleTrendBack = useCallback(() => {
        if (trendDrillDownLevel > 0) {
            setTrendDrillDownPath(prev => prev.slice(0, -1));
            setTrendDrillDownLevel(prev => Math.max(prev - 1, 0) as 0 | 1 | 2 | 3);
            // Story 14.13.3: Trigger animation on back navigation
            setTrendAnimationKey(prev => prev + 1);
        }
    }, [trendDrillDownLevel]);

    // Handle category drill-down (legacy - navigation)
    const handleCategoryClick = useCallback((category: string) => {
        onNavigateToHistory?.({ category });
    }, [onNavigateToHistory]);

    // Story 14.13.2: Handle trend count pill click - navigate to HistoryView/ItemsView with filters
    // Works like the donut chart's handleTransactionCountClick, but considers drill-down state
    // Fixed: Now properly builds drillDownPath like donut/treemap handlers do
    // Story 14.13.2: Handle "Más" aggregated group by expanding to constituent categories (matches treemap behavior)
    const handleTrendCountClick = useCallback((categoryName: string) => {
        if (!onNavigateToHistory) return;

        // Build the navigation payload based on viewMode and drill-down state
        const payload: HistoryNavigationPayload = {
            targetView: countMode === 'items' ? 'items' : 'history',
            sourceDistributionView: 'treemap', // Using treemap as source for Tendencia
        };

        // Check if this is the "Más" aggregated group - expand to constituent categories
        const isAggregatedGroup = categoryName === 'Más' || categoryName === 'More';

        // Build drillDownPath with accumulated context AND current clicked category
        // This matches donut chart's buildSemanticDrillDownPath and treemap's treemapPath logic
        const trendPath: DrillDownPath = {};

        // Add parent context from drill-down path based on view mode hierarchy
        if (trendDrillDownLevel > 0 && trendDrillDownPath.length > 0) {
            switch (donutViewMode) {
                case 'store-categories':
                    // Path order: storeCategory -> itemGroup -> itemCategory
                    if (trendDrillDownPath[0]) trendPath.storeCategory = trendDrillDownPath[0];
                    if (trendDrillDownPath[1]) trendPath.itemGroup = trendDrillDownPath[1];
                    if (trendDrillDownPath[2]) trendPath.itemCategory = trendDrillDownPath[2];
                    break;
                case 'store-groups':
                    // Path order: storeGroup -> storeCategory -> itemGroup -> itemCategory
                    if (trendDrillDownPath[0]) trendPath.storeGroup = trendDrillDownPath[0];
                    if (trendDrillDownPath[1]) trendPath.storeCategory = trendDrillDownPath[1];
                    if (trendDrillDownPath[2]) trendPath.itemGroup = trendDrillDownPath[2];
                    if (trendDrillDownPath[3]) trendPath.itemCategory = trendDrillDownPath[3];
                    break;
                case 'item-groups':
                    // Path order: itemGroup -> itemCategory
                    if (trendDrillDownPath[0]) trendPath.itemGroup = trendDrillDownPath[0];
                    if (trendDrillDownPath[1]) trendPath.itemCategory = trendDrillDownPath[1];
                    break;
                case 'item-categories':
                    // Path order: itemCategory
                    if (trendDrillDownPath[0]) trendPath.itemCategory = trendDrillDownPath[0];
                    break;
            }
        }

        // Add current clicked category to the path at the appropriate level
        // For "Más", expand to all constituent categories (matches treemap behavior)
        const effectiveViewMode = getTrendViewModeAtLevel();
        if (effectiveViewMode === 'store-categories') {
            if (isAggregatedGroup && otroTrendCategories.length > 0) {
                // Expand "Más" to all hidden store categories
                payload.category = otroTrendCategories.map(c => c.name).join(',');
            } else {
                trendPath.storeCategory = categoryName;
                payload.category = categoryName;
            }
        } else if (effectiveViewMode === 'store-groups') {
            if (isAggregatedGroup && otroTrendCategories.length > 0) {
                // Expand "Más" store groups to all their constituent store categories
                const allCategories = otroTrendCategories.flatMap(c =>
                    expandStoreCategoryGroup(c.name as StoreCategoryGroup)
                );
                payload.category = allCategories.join(',');
            } else {
                trendPath.storeGroup = categoryName;
                payload.storeGroup = categoryName;
            }
        } else if (effectiveViewMode === 'item-groups') {
            if (isAggregatedGroup && otroTrendCategories.length > 0) {
                // Expand "Más" item groups to all their constituent item categories
                const allItemCategories = otroTrendCategories.flatMap(c =>
                    expandItemCategoryGroup(c.name as ItemCategoryGroup)
                );
                payload.itemCategory = allItemCategories.join(',');
            } else {
                trendPath.itemGroup = categoryName;
                payload.itemGroup = categoryName;
            }
        } else if (effectiveViewMode === 'item-categories') {
            if (isAggregatedGroup && otroTrendCategories.length > 0) {
                // Expand "Más" to all hidden item categories
                payload.itemCategory = otroTrendCategories.map(c => c.name).join(',');
            } else {
                trendPath.itemCategory = categoryName;
                payload.itemCategory = categoryName;
            }
        }

        // Include drillDownPath if we have any accumulated context (skip for aggregated groups)
        if (!isAggregatedGroup && Object.keys(trendPath).length > 0) {
            payload.drillDownPath = trendPath;
        }

        // Add temporal filter based on current time period selection
        if (currentPeriod) {
            payload.temporal = {
                level: timePeriod,
                year: String(currentPeriod.year),
            };
            if (timePeriod === 'month' || timePeriod === 'week') {
                payload.temporal.month = `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, '0')}`;
            }
            if (timePeriod === 'quarter') {
                payload.temporal.quarter = `Q${currentPeriod.quarter}`;
            }
        }

        onNavigateToHistory(payload);
    }, [onNavigateToHistory, donutViewMode, countMode, timePeriod, currentPeriod, trendDrillDownLevel, trendDrillDownPath, getTrendViewModeAtLevel, otroTrendCategories]);

    // Story 14.13 Session 17: Handle treemap cell click - drill down into category
    const handleTreemapCellDrillDown = useCallback((categoryName: string) => {
        // Don't drill down on "Más" aggregated group - it doesn't have subcategories
        const isAggregatedGroup = categoryName === 'Más' || categoryName === 'More';
        if (isAggregatedGroup) return;

        const maxLevel = getTreemapMaxDrillDownLevel();
        if (treemapDrillDownLevel < maxLevel) {
            // Check if we can drill down further (e.g., subcategories exist)
            // For subcategory level (last level), check if there are any subcategories
            if (treemapDrillDownLevel === maxLevel - 1) {
                // At item-category level, check if subcategories exist
                const subcats = computeSubcategoryData(filteredTransactions, categoryName);
                if (subcats.length === 0) return; // No subcategories, can't drill down
            }

            setTreemapDrillDownPath(prev => [...prev, categoryName]);
            setTreemapDrillDownLevel(prev => Math.min(prev + 1, 3) as 0 | 1 | 2 | 3);
            setTreemapDrillDownExpandedCount(0); // Reset expanded count
            setAnimationKey(prev => prev + 1); // Trigger animation
        }
    }, [treemapDrillDownLevel, getTreemapMaxDrillDownLevel, filteredTransactions]);

    // Story 14.40: Open category statistics popup
    // Determines the category type based on current view mode and drill-down level
    const handleOpenStatsPopup = useCallback((
        categoryName: string,
        emoji: string,
        color: string
    ) => {
        // Don't show popup for "Más" aggregated group
        const isAggregatedGroup = categoryName === 'Más' || categoryName === 'More';
        if (isAggregatedGroup) return;

        // Determine category type based on view mode and drill-down level
        let type: CategoryFilterType = 'store-category';

        if (donutViewMode === 'store-groups' && treemapDrillDownLevel === 0) {
            type = 'store-group';
        } else if (donutViewMode === 'store-categories' && treemapDrillDownLevel === 0) {
            type = 'store-category';
        } else if (donutViewMode === 'item-groups' && treemapDrillDownLevel === 0) {
            type = 'item-group';
        } else if (donutViewMode === 'item-categories' && treemapDrillDownLevel === 0) {
            type = 'item-category';
        } else {
            // At drill-down levels, type depends on what's displayed
            // Drill-down structure:
            // store-categories: L0=storeCategories, L1=itemGroups, L2=itemCategories
            // store-groups: L0=storeGroups, L1=storeCategories, L2=itemGroups, L3=itemCategories
            // item-groups: L0=itemGroups, L1=itemCategories
            // item-categories: L0=itemCategories
            if (donutViewMode === 'store-categories') {
                if (treemapDrillDownLevel === 1) type = 'item-group';
                else if (treemapDrillDownLevel >= 2) type = 'item-category';
            } else if (donutViewMode === 'store-groups') {
                if (treemapDrillDownLevel === 1) type = 'store-category';
                else if (treemapDrillDownLevel === 2) type = 'item-group';
                else type = 'item-category';
            } else if (donutViewMode === 'item-groups') {
                if (treemapDrillDownLevel >= 1) type = 'item-category';
            }
        }

        // Story 14.44: Get contrasting text color for popup header/button
        // The popup header uses category color as background, so we need a contrasting text color
        const fgColor = getContrastTextColor(color);

        setStatsPopupCategory({ name: categoryName, emoji, color, fgColor, type });
        setStatsPopupOpen(true);
    }, [donutViewMode, treemapDrillDownLevel]);

    // Story 14.40: Close statistics popup
    const handleCloseStatsPopup = useCallback(() => {
        setStatsPopupOpen(false);
        setStatsPopupCategory(null);
    }, []);

    // Story 14.40: Navigate to history from statistics popup
    const handleStatsPopupViewHistory = useCallback(() => {
        if (!onNavigateToHistory || !statsPopupCategory) return;

        const payload: HistoryNavigationPayload = {
            targetView: statsPopupCategory.type.startsWith('item') ? 'items' : 'history',
        };

        // Set the appropriate filter based on category type
        switch (statsPopupCategory.type) {
            case 'store-category':
                payload.category = statsPopupCategory.name;
                break;
            case 'store-group':
                payload.storeGroup = statsPopupCategory.name;
                break;
            case 'item-category':
                payload.itemCategory = statsPopupCategory.name;
                break;
            case 'item-group':
                payload.itemGroup = statsPopupCategory.name;
                break;
        }

        // Add temporal filter
        payload.temporal = {
            level: timePeriod,
            year: currentPeriod.year.toString(),
            month: `${currentPeriod.year}-${currentPeriod.month.toString().padStart(2, '0')}`,
            quarter: `Q${currentPeriod.quarter}`,
        };

        handleCloseStatsPopup();
        onNavigateToHistory(payload);
    }, [onNavigateToHistory, statsPopupCategory, timePeriod, currentPeriod, handleCloseStatsPopup]);

    // Story 14.13 Session 17: Handle treemap back navigation
    const handleTreemapBack = useCallback(() => {
        if (treemapDrillDownLevel > 0) {
            setTreemapDrillDownPath(prev => prev.slice(0, -1));
            setTreemapDrillDownLevel(prev => Math.max(prev - 1, 0) as 0 | 1 | 2 | 3);
            setTreemapDrillDownExpandedCount(0); // Reset expanded count
            setAnimationKey(prev => prev + 1); // Trigger animation
        }
    }, [treemapDrillDownLevel]);

    // Story 14.22: Handle treemap transaction count pill click - navigate to HistoryView with filters
    // Story 14.14b Session 7: Handle "Más" aggregated group by expanding to constituent categories
    // Story 14.13 Session 5: Navigate to Items view when countMode is 'items'
    // Story 14.13 Session 19: Fixed to consider treemapDrillDownLevel when determining filter dimension
    const handleTreemapTransactionCountClick = useCallback((categoryName: string) => {
        if (!onNavigateToHistory) return;

        // Build the navigation payload based on view mode
        const payload: HistoryNavigationPayload = {
            // Story 14.13 Session 5: Target view based on countMode toggle
            targetView: countMode === 'items' ? 'items' : 'history',
        };

        // Check if this is the "Más" aggregated group - expand to constituent categories
        const isAggregatedGroup = categoryName === 'Más' || categoryName === 'More';

        // Story 14.13 Session 19: Get otroCategories based on current drill-down level
        const currentOtroCategories = treemapDrillDownLevel > 0
            ? treemapDrillDownCategorized.otroCategories
            : otroCategories;

        // Story 14.13 Session 19: Determine current view mode based on drill-down level
        // Similar to DonutChart's logic - what we're currently displaying depends on drill-down depth
        const getCurrentDisplayMode = (): 'store-groups' | 'store-categories' | 'item-groups' | 'item-categories' | 'subcategories' => {
            if (treemapDrillDownLevel === 0) return donutViewMode;

            // Drill-down structure depends on base viewMode:
            // store-categories: L0=storeCategories, L1=itemGroups, L2=itemCategories, L3=subcategories
            // store-groups: L0=storeGroups, L1=storeCategories, L2=itemGroups, L3=itemCategories
            // item-groups: L0=itemGroups, L1=itemCategories, L2=subcategories
            // item-categories: L0=itemCategories, L1=subcategories
            if (donutViewMode === 'store-categories') {
                if (treemapDrillDownLevel === 1) return 'item-groups';
                if (treemapDrillDownLevel === 2) return 'item-categories';
                return 'subcategories';
            }
            if (donutViewMode === 'store-groups') {
                if (treemapDrillDownLevel === 1) return 'store-categories';
                if (treemapDrillDownLevel === 2) return 'item-groups';
                if (treemapDrillDownLevel === 3) return 'item-categories';
                return 'subcategories';
            }
            if (donutViewMode === 'item-groups') {
                if (treemapDrillDownLevel === 1) return 'item-categories';
                return 'subcategories';
            }
            // item-categories
            return 'subcategories';
        };

        const currentDisplayMode = getCurrentDisplayMode();

        // Set the appropriate filter based on current display mode (NOT base viewMode)
        if (currentDisplayMode === 'store-categories') {
            if (isAggregatedGroup && currentOtroCategories.length > 0) {
                payload.category = currentOtroCategories.map(c => c.name).join(',');
            } else {
                payload.category = categoryName;
            }
        } else if (currentDisplayMode === 'store-groups') {
            if (isAggregatedGroup && currentOtroCategories.length > 0) {
                const allCategories = currentOtroCategories.flatMap(c =>
                    expandStoreCategoryGroup(c.name as StoreCategoryGroup)
                );
                payload.category = allCategories.join(',');
            } else {
                payload.storeGroup = categoryName;
            }
        } else if (currentDisplayMode === 'item-groups') {
            if (isAggregatedGroup && currentOtroCategories.length > 0) {
                const allItemCategories = currentOtroCategories.flatMap(c =>
                    expandItemCategoryGroup(c.name as ItemCategoryGroup)
                );
                payload.itemCategory = allItemCategories.join(',');
            } else {
                payload.itemGroup = categoryName;
            }
        } else if (currentDisplayMode === 'item-categories') {
            if (isAggregatedGroup && currentOtroCategories.length > 0) {
                payload.itemCategory = currentOtroCategories.map(c => c.name).join(',');
            } else {
                payload.itemCategory = categoryName;
            }
        } else if (currentDisplayMode === 'subcategories') {
            // At subcategory level, the subcategory name goes in drillDownPath.subcategory
            // For filtering, we still use the parent item category from the path
            // The drillDownPath will handle the full context including subcategory
        }

        // Story 14.13 Session 19: Build drillDownPath including parent path when drilled down
        if (!isAggregatedGroup) {
            const treemapPath: DrillDownPath = {};

            // Add parent context from drill-down path
            if (treemapDrillDownLevel > 0 && treemapDrillDownPath.length > 0) {
                // Include accumulated drill-down context
                if (donutViewMode === 'store-categories') {
                    if (treemapDrillDownPath[0]) treemapPath.storeCategory = treemapDrillDownPath[0];
                    if (treemapDrillDownPath[1]) treemapPath.itemGroup = treemapDrillDownPath[1];
                    if (treemapDrillDownPath[2]) treemapPath.itemCategory = treemapDrillDownPath[2];
                } else if (donutViewMode === 'store-groups') {
                    if (treemapDrillDownPath[0]) treemapPath.storeGroup = treemapDrillDownPath[0];
                    if (treemapDrillDownPath[1]) treemapPath.storeCategory = treemapDrillDownPath[1];
                    if (treemapDrillDownPath[2]) treemapPath.itemGroup = treemapDrillDownPath[2];
                    if (treemapDrillDownPath[3]) treemapPath.itemCategory = treemapDrillDownPath[3];
                } else if (donutViewMode === 'item-groups') {
                    if (treemapDrillDownPath[0]) treemapPath.itemGroup = treemapDrillDownPath[0];
                    if (treemapDrillDownPath[1]) treemapPath.itemCategory = treemapDrillDownPath[1];
                } else if (donutViewMode === 'item-categories') {
                    if (treemapDrillDownPath[0]) treemapPath.itemCategory = treemapDrillDownPath[0];
                }
            }

            // Add current clicked category to the appropriate level
            if (currentDisplayMode === 'store-groups') {
                treemapPath.storeGroup = categoryName;
            } else if (currentDisplayMode === 'store-categories') {
                treemapPath.storeCategory = categoryName;
            } else if (currentDisplayMode === 'item-groups') {
                treemapPath.itemGroup = categoryName;
            } else if (currentDisplayMode === 'item-categories') {
                treemapPath.itemCategory = categoryName;
            } else if (currentDisplayMode === 'subcategories') {
                treemapPath.subcategory = categoryName;
            }

            if (Object.keys(treemapPath).length > 0) {
                payload.drillDownPath = treemapPath;
            }
        }

        // Build temporal filter based on current time period selection
        payload.temporal = {
            level: timePeriod,
            year: String(currentPeriod.year),
        };
        if (timePeriod === 'month' || timePeriod === 'week') {
            payload.temporal.month = `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, '0')}`;
        }
        if (timePeriod === 'quarter') {
            payload.temporal.quarter = `Q${currentPeriod.quarter}`;
        }

        // Story 14.13a: Add sourceDistributionView for treemap navigation
        payload.sourceDistributionView = 'treemap';

        onNavigateToHistory(payload);
    }, [onNavigateToHistory, donutViewMode, timePeriod, currentPeriod, otroCategories, countMode, treemapDrillDownLevel, treemapDrillDownPath, treemapDrillDownCategorized]);

    // Note: Filter dropdown functions moved to IconFilterBar component

    // Story 14.13.3: Determine if we're on Sankey view for swapping swipe/button behavior
    const isOnSankeyView = carouselSlide === 1 && tendenciaView === 'sankey';

    // Swipe navigation for carousel
    // Story 14.13 Session 6: Added swipeOffset and isSwiping for live transform and crossfade effect
    // Story 14.13.3: When on Sankey view, swipe scrolls diagram instead of changing slides
    const {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        isSwiping,
        swipeDirection: _swipeDirection,
        swipeOffset,
    } = useSwipeNavigation({
        // Story 14.13.3: On Sankey view, swipe scrolls diagram; otherwise changes carousel slide
        onSwipeLeft: isOnSankeyView ? scrollSankeyRight : goToNextSlide,
        onSwipeRight: isOnSankeyView ? scrollSankeyLeft : goToPrevSlide,
        threshold: 50,
        enabled: true,
        hapticEnabled: !prefersReducedMotion,
    });

    // Attach touch handlers
    useEffect(() => {
        const container = carouselRef.current;
        if (!container) return;

        container.addEventListener('touchstart', onTouchStart, { passive: true });
        container.addEventListener('touchmove', onTouchMove, { passive: false });
        container.addEventListener('touchend', onTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', onTouchStart);
            container.removeEventListener('touchmove', onTouchMove);
            container.removeEventListener('touchend', onTouchEnd);
        };
    }, [onTouchStart, onTouchMove, onTouchEnd]);

    // =========================================================================
    // =========================================================================

    // Calculate member contributions for group analytics (AC4)
    const memberContributions = useMemo(() => {
        if (!isGroupMode || groupMembers.length === 0) {
            return [];
        }
        // Convert groupMembers to AnalyticsMember format
        const analyticsMembers: AnalyticsMember[] = groupMembers.map(m => ({
            uid: m.uid,
            displayName: m.displayName,
            email: m.email,
            avatarColor: m.avatarColor,
        }));
        return calculateMemberContributions(filteredTransactions, analyticsMembers);
    }, [isGroupMode, groupMembers, filteredTransactions]);

    // =========================================================================
    // Story 14.40: Category Statistics Calculation
    // =========================================================================

    // Calculate total spent for percentage calculation
    const totalSpentAllCategories = useMemo(() => {
        return filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
    }, [filteredTransactions]);

    // Calculate statistics for the selected category (if popup is open)
    const categoryStatistics = useCategoryStatistics({
        transactions: filteredTransactions,
        categoryName: statsPopupCategory?.name ?? '',
        categoryType: statsPopupCategory?.type ?? 'store-category',
        totalSpentAllCategories,
    });

    // Get translated category name for popup display
    const getTranslatedCategoryName = useCallback((name: string, type: CategoryFilterType): string => {
        const lang = locale as 'en' | 'es';
        if (type === 'store-category') {
            return translateCategory(name, lang);
        } else if (type === 'store-group') {
            return translateStoreCategoryGroup(name, lang);
        } else if (type === 'item-category') {
            return translateCategory(name, lang);
        } else if (type === 'item-group') {
            return translateItemCategoryGroup(name as ItemCategoryGroup, lang);
        }
        return name;
    }, [locale]);

    // =========================================================================
    // Render
    // =========================================================================

    return (
        <PageTransition viewKey="trends" direction="none">
            <div
                className="relative flex flex-col"
                style={{
                    minHeight: '100dvh',
                    paddingBottom: 'calc(6rem + var(--safe-bottom, 0px))',
                }}
            >
                {/* Story 14.14b: Fixed Header Container - Matches HistoryView header style exactly */}
                <div
                    className="sticky px-4"
                    style={{
                        top: 0,
                        zIndex: 50,
                        backgroundColor: 'var(--bg)',
                    }}
                >
                    {/* Fixed height header row - matches HistoryView exactly (72px) */}
                    <div
                        className="flex items-center justify-between"
                        style={{
                            height: '72px',
                            paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
                        }}
                    >
                        {/* Left side: Back button + Title */}
                        <div className="flex items-center gap-0">
                            {/* Back button - ChevronLeft style (same as HistoryView) */}
                            <button
                                onClick={onBack}
                                className="min-w-10 min-h-10 flex items-center justify-center -ml-1"
                                aria-label={locale === 'es' ? 'Volver' : 'Back'}
                                data-testid="back-button"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <ChevronLeft size={28} strokeWidth={2.5} />
                            </button>
                            <h1
                                className="font-semibold"
                                style={{
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 700,
                                    fontSize: '20px',
                                }}
                            >
                                Explora
                            </h1>
                        </div>
                        {/* Right side: Filters + Profile */}
                        <div className="flex items-center gap-3 relative">
                            {/* Story 14.14b: Use IconFilterBar for consistent filter dropdowns */}
                            {/* Story 14.14b Session 5: Sync view mode with category filter */}
                            <IconFilterBar
                                availableFilters={availableFilters}
                                t={t}
                                locale={locale}
                                groups={groups}
                                groupsLoading={groupsLoading}
                                viewMode={donutViewMode}
                                onViewModeChange={setDonutViewMode}
                            />
                            {/* Story 14.14b: Profile Avatar with Dropdown */}
                            <ProfileAvatar
                                ref={profileButtonRef}
                                initials={getInitials(userName)}
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                            />
                            <ProfileDropdown
                                isOpen={isProfileOpen}
                                onClose={() => setIsProfileOpen(false)}
                                userName={userName}
                                userEmail={userEmail}
                                onNavigate={handleProfileNavigate}
                                theme={theme}
                                t={t}
                                triggerRef={profileButtonRef}
                            />
                        </div>
                    </div>

                {/* Time Period Pills with Animated Selection Indicator (AC #2) */}
                {/* Story 14.14b Session 7: Reduced horizontal padding to give more space for pill text + dot indicator */}
                <div className="px-2 pt-1 pb-0">
                    <div
                        className="relative flex justify-center rounded-full p-1"
                        style={{
                            backgroundColor: 'var(--bg-secondary)',
                        }}
                        role="tablist"
                        aria-label="Time period selection"
                        data-testid="time-pills-container"
                    >
                        {/* Animated selection indicator */}
                        <div
                            className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out ${
                                prefersReducedMotion ? '' : 'transform'
                            }`}
                            style={{
                                // Each pill is 25% of inner width (container minus 8px padding)
                                width: 'calc((100% - 8px) / 4)',
                                // Position: 4px padding + percentage of inner width
                                // Order: Year (0) → Quarter (1) → Month (2) → Week (3)
                                left: timePeriod === 'year' ? '4px' :
                                      timePeriod === 'quarter' ? 'calc(4px + (100% - 8px) * 0.25)' :
                                      timePeriod === 'month' ? 'calc(4px + (100% - 8px) * 0.5)' :
                                      'calc(4px + (100% - 8px) * 0.75)',
                                background: 'var(--primary, #2563eb)',
                            }}
                            aria-hidden="true"
                        />
                        {/* Pills - Order: Year → Quarter → Month → Week (largest to smallest) */}
                        {(['year', 'quarter', 'month', 'week'] as TimePeriod[]).map((period) => {
                            const labels: Record<TimePeriod, { es: string; en: string }> = {
                                year: { es: 'Año', en: 'Year' },
                                quarter: { es: 'Trimestre', en: 'Quarter' },
                                month: { es: 'Mes', en: 'Month' },
                                week: { es: 'Semana', en: 'Week' },
                            };
                            const isActive = timePeriod === period;
                            // Story 14.14b Session 7: Show dot after label when viewing past period
                            const showPastIndicator = isActive && !isViewingCurrentPeriod;
                            return (
                                <button
                                    key={period}
                                    onClick={() => handleTimePeriodClick(period)}
                                    className="relative z-10 flex-1 px-2 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
                                    style={{
                                        color: isActive ? 'white' : 'var(--text-secondary)',
                                    }}
                                    aria-pressed={isActive}
                                    data-testid={`time-pill-${period}`}
                                >
                                    {locale === 'es' ? labels[period].es : labels[period].en}
                                    {showPastIndicator && <span className="ml-0.5">·</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Period Navigator (AC #3) - Tight spacing from pills */}
                <div className="px-4 py-1">
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={goPrevPeriod}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                            }}
                            aria-label="Previous period"
                            data-testid="period-nav-prev"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        {/* Swipeable period label */}
                        <span
                            onTouchStart={(e) => {
                                (e.currentTarget as HTMLElement).dataset.startX = String(e.touches[0].clientX);
                            }}
                            onTouchEnd={(e) => {
                                const startX = parseFloat((e.currentTarget as HTMLElement).dataset.startX || '0');
                                const endX = e.changedTouches[0].clientX;
                                const diffX = endX - startX;
                                if (Math.abs(diffX) >= 30) {
                                    if (diffX < 0) {
                                        goNextPeriod();
                                    } else {
                                        goPrevPeriod();
                                    }
                                }
                            }}
                            className="text-base font-medium min-w-[160px] text-center cursor-grab select-none"
                            style={{
                                touchAction: 'pan-y',
                                color: 'var(--text-primary)',
                            }}
                            data-testid="period-label"
                        >
                            {periodLabel}
                        </span>
                        <button
                            onClick={goNextPeriod}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                            style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                            }}
                            aria-label="Next period"
                            data-testid="period-nav-next"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                </div>{/* End of sticky header container */}

                {/* Analytics Card with Carousel (AC #4) - Dynamically fills space to bottom nav */}
                <TransitionChild index={2} totalItems={4} className="flex-1 flex flex-col min-h-0">
                    <div className="px-1 pt-1 pb-2 flex-1 flex flex-col min-h-0">
                        <div
                            className="rounded-2xl overflow-hidden border flex-1 flex flex-col min-h-0"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-light)',
                                // Dynamic height: viewport - header (~148px) - bottom nav (80px) - gap (8px)
                                // Header breakdown: 72px header + 44px pills + 32px period nav = 148px
                                // Bottom nav: ~80px (slightly less than 6rem to use more space)
                                maxHeight: 'calc(100dvh - 148px - 80px - 8px - var(--safe-bottom, 0px))',
                            }}
                            data-testid="analytics-card"
                        >
                            {/* Card Header - with centered title */}
                            <div className="relative flex items-center justify-between px-3 pt-3 pb-2">
                                {/* Left side buttons container */}
                                <div className="flex items-center gap-1.5 z-10">
                                    {/* View Toggle Button (AC #7) with icon morphing animation */}
                                    {carouselSlide !== 2 && (
                                        <button
                                            onClick={toggleView}
                                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                                            aria-label="Toggle view"
                                            data-testid="view-toggle"
                                            style={{
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                backgroundColor: carouselSlide === 0 && distributionView === 'donut'
                                                    ? 'var(--primary)'
                                                    : 'var(--bg-tertiary)',
                                                color: carouselSlide === 0 && distributionView === 'donut'
                                                    ? 'white'
                                                    : 'var(--text-secondary)',
                                            }}
                                        >
                                            <span
                                                className="inline-flex transition-transform duration-200 ease-out"
                                                style={{
                                                    transform: prefersReducedMotion ? 'none' : 'rotate(0deg)',
                                                }}
                                                key={`${carouselSlide}-${distributionView}-${tendenciaView}`}
                                            >
                                                {carouselSlide === 0 ? (
                                                    distributionView === 'treemap' ? (
                                                        <PieChart size={16} className="transition-opacity duration-150" />
                                                    ) : (
                                                        <LayoutGrid size={16} className="transition-opacity duration-150" />
                                                    )
                                                ) : (
                                                    // Story 14.13.3: Sankey toggle - show flow icon when on list, list icon when on sankey
                                                    tendenciaView === 'list' ? (
                                                        <GitBranch size={16} className="transition-opacity duration-150" />
                                                    ) : (
                                                        <List size={16} className="transition-opacity duration-150" />
                                                    )
                                                )}
                                            </span>
                                        </button>
                                    )}

                                    </div>

                                {/* Story 14.14b Session 5: View mode pills for all carousel slides */}
                                {/* Story 14.13.3 Phase 5: Show 2 icons for Sankey view, 4 icons for other views */}
                                {(carouselSlide === 0 || carouselSlide === 1) ? (
                                    <div
                                        className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center"
                                        data-testid="viewmode-pills-wrapper"
                                    >
                                        {/* Outer container pill - height matches left button (32px) */}
                                        <div
                                            className="relative flex items-center rounded-full"
                                            style={{
                                                backgroundColor: 'var(--bg-tertiary, #f1f5f9)',
                                                height: '32px',
                                                padding: '2px 4px',
                                                border: '1px solid var(--border-light, #e2e8f0)',
                                                gap: '6px',
                                            }}
                                            role="tablist"
                                            aria-label="View mode selection"
                                            data-testid="viewmode-pills-container"
                                        >
                                            {/* Story 14.13.3 Phase 5: Sankey mode pills (2 icons) when on Sankey view */}
                                            {carouselSlide === 1 && tendenciaView === 'sankey' ? (
                                                <>
                                                    {/* Animated selection indicator for Sankey (2 pills) */}
                                                    <div
                                                        className={`absolute rounded-full transition-all duration-300 ease-out ${
                                                            prefersReducedMotion ? '' : 'transform'
                                                        }`}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            top: '2px',
                                                            left: sankeyMode === '3-level-groups' ? '4px' : 'calc(4px + 34px)',
                                                            background: 'var(--primary, #2563eb)',
                                                        }}
                                                        aria-hidden="true"
                                                    />
                                                    {/* Sankey mode pills - 2 icons */}
                                                    {([
                                                        { value: '3-level-groups' as SankeyMode, emoji: '🏪', labelEs: 'Grupos → Categorías → Productos', labelEn: 'Groups → Categories → Products' },
                                                        { value: '3-level-categories' as SankeyMode, emoji: '🛒', labelEs: 'Compras → Grupos → Items', labelEn: 'Purchases → Groups → Items' },
                                                    ]).map((mode) => {
                                                        const isActive = sankeyMode === mode.value;
                                                        return (
                                                            <button
                                                                key={mode.value}
                                                                onClick={() => setSankeyMode(mode.value)}
                                                                className="relative z-10 flex items-center justify-center rounded-full transition-colors"
                                                                style={{
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    lineHeight: 1,
                                                                }}
                                                                aria-pressed={isActive}
                                                                aria-label={locale === 'es' ? mode.labelEs : mode.labelEn}
                                                                title={locale === 'es' ? mode.labelEs : mode.labelEn}
                                                                data-testid={`sankey-mode-pill-${mode.value}`}
                                                            >
                                                                <span
                                                                    className="text-lg leading-none transition-all"
                                                                    style={{
                                                                        filter: isActive ? 'brightness(1.2)' : 'none',
                                                                    }}
                                                                >
                                                                    {mode.emoji}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </>
                                            ) : (
                                                <>
                                                    {/* Animated selection indicator for Donut (4 pills) */}
                                                    <div
                                                        className={`absolute rounded-full transition-all duration-300 ease-out ${
                                                            prefersReducedMotion ? '' : 'transform'
                                                        }`}
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            top: '2px',
                                                            // 4px initial padding + (28px button + 6px gap) * index
                                                            left: donutViewMode === 'store-groups' ? '4px' :
                                                                  donutViewMode === 'store-categories' ? 'calc(4px + 34px)' :
                                                                  donutViewMode === 'item-groups' ? 'calc(4px + 68px)' :
                                                                  'calc(4px + 102px)',
                                                            background: 'var(--primary, #2563eb)',
                                                        }}
                                                        aria-hidden="true"
                                                    />
                                                    {/* View mode pills with icons only (4 icons for Donut/List views) */}
                                                    {([
                                                        { value: 'store-groups' as DonutViewMode, emoji: '🏪', labelEs: 'Grupos de Compras', labelEn: 'Purchase Groups' },
                                                        { value: 'store-categories' as DonutViewMode, emoji: '🛒', labelEs: 'Categorías de Compras', labelEn: 'Purchase Categories' },
                                                        { value: 'item-groups' as DonutViewMode, emoji: '📦', labelEs: 'Grupos de Productos', labelEn: 'Product Groups' },
                                                        { value: 'item-categories' as DonutViewMode, emoji: '🏷️', labelEs: 'Categorías de Productos', labelEn: 'Product Categories' },
                                                    ]).map((mode) => {
                                                        const isActive = donutViewMode === mode.value;
                                                        return (
                                                            <button
                                                                key={mode.value}
                                                                onClick={() => setDonutViewMode(mode.value)}
                                                                className="relative z-10 flex items-center justify-center rounded-full transition-colors"
                                                                style={{
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    lineHeight: 1,
                                                                }}
                                                                aria-pressed={isActive}
                                                                aria-label={locale === 'es' ? mode.labelEs : mode.labelEn}
                                                                title={locale === 'es' ? mode.labelEs : mode.labelEn}
                                                                data-testid={`viewmode-pill-${mode.value}`}
                                                            >
                                                                <span
                                                                    className="text-lg leading-none transition-all"
                                                                    style={{
                                                                        filter: isActive ? 'brightness(1.2)' : 'none',
                                                                    }}
                                                                >
                                                                    {mode.emoji}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span
                                        className="absolute left-1/2 transform -translate-x-1/2 font-semibold"
                                        style={{ color: 'var(--text-primary)' }}
                                        data-testid="carousel-title"
                                    >
                                        {carouselTitles[carouselSlide]}
                                    </span>
                                )}

                                {/* Right side buttons - Story 14.13.3: Show nav buttons for Sankey, count toggle for others */}
                                <div className="flex items-center gap-1 z-10">
                                    {carouselSlide === 2 ? (
                                        /* Slide 2 (Contribuciones): No right-side buttons - empty placeholder for layout balance */
                                        <div className="w-8 h-8" aria-hidden="true" />
                                    ) : carouselSlide === 1 && tendenciaView === 'sankey' ? (
                                        <>
                                            {/* Story 14.13.3: Left/Right buttons NOW navigate carousel slides (swipe scrolls diagram) */}
                                            {/* Enhanced styling with border and pulse animation to draw attention */}
                                            <button
                                                onClick={goToPrevSlide}
                                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                                                aria-label={locale === 'es' ? 'Ir al slide anterior' : 'Go to previous slide'}
                                                title={locale === 'es' ? 'Anterior' : 'Previous'}
                                                data-testid="sankey-nav-left"
                                                style={{
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                    backgroundColor: 'var(--bg)',
                                                    color: 'var(--primary)',
                                                    border: '2px solid var(--primary)',
                                                    animation: prefersReducedMotion ? 'none' : 'sankey-nav-pulse 2s ease-in-out infinite',
                                                }}
                                            >
                                                <ChevronLeft size={16} strokeWidth={2.5} />
                                            </button>
                                            <button
                                                onClick={goToNextSlide}
                                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                                                aria-label={locale === 'es' ? 'Ir al siguiente slide' : 'Go to next slide'}
                                                title={locale === 'es' ? 'Siguiente' : 'Next'}
                                                data-testid="sankey-nav-right"
                                                style={{
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                    backgroundColor: 'var(--bg)',
                                                    color: 'var(--primary)',
                                                    border: '2px solid var(--primary)',
                                                    animation: prefersReducedMotion ? 'none' : 'sankey-nav-pulse 2s ease-in-out infinite 0.3s',
                                                }}
                                            >
                                                <ChevronRight size={16} strokeWidth={2.5} />
                                            </button>
                                            {/* Keyframe animation for pulse effect */}
                                            <style>{`
                                                @keyframes sankey-nav-pulse {
                                                    0%, 100% { transform: scale(1); }
                                                    50% { transform: scale(1.05); }
                                                }
                                            `}</style>
                                        </>
                                    ) : (
                                        /* Count Mode Toggle Button for other views */
                                        <button
                                            onClick={toggleCountMode}
                                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                                            aria-label={countMode === 'transactions'
                                                ? (locale === 'es' ? 'Contando transacciones (clic para contar productos)' : 'Counting transactions (click to count products)')
                                                : (locale === 'es' ? 'Contando productos (clic para contar transacciones)' : 'Counting products (click to count transactions)')
                                            }
                                            title={countMode === 'transactions'
                                                ? (locale === 'es' ? 'Contando compras' : 'Counting purchases')
                                                : (locale === 'es' ? 'Contando productos' : 'Counting products')
                                            }
                                            data-testid="count-mode-toggle"
                                            style={{
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                backgroundColor: countMode === 'items'
                                                    ? 'var(--primary)'
                                                    : 'var(--bg-tertiary)',
                                                color: countMode === 'items'
                                                    ? 'white'
                                                    : 'var(--text-secondary)',
                                            }}
                                        >
                                            {countMode === 'transactions' ? (
                                                <Receipt size={16} className="transition-opacity duration-150" />
                                            ) : (
                                                <Package size={16} className="transition-opacity duration-150" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Carousel Content - Fills remaining height with scroll */}
                            <div
                                ref={carouselRef}
                                className="px-1.5 pb-1 flex-1 overflow-y-auto min-h-0"
                                data-testid="carousel-content"
                            >
                                {/* Story 14.13 Session 6: Swipe transform wrapper for live drag + crossfade effect */}
                                <div
                                    style={{
                                        transform: `translateX(${swipeOffset}px)`,
                                        opacity: Math.max(0.3, 1 - Math.abs(swipeOffset) / 150),
                                        transition: isSwiping ? 'none' : 'transform 0.2s ease-out, opacity 0.2s ease-out',
                                    }}
                                >
                                {/* Slide 0: Distribution (AC #5) - Treemap matching Dashboard design */}
                                {carouselSlide === 0 && distributionView === 'treemap' && (
                                    <div className="relative flex flex-col">
                                        {/* Story 14.13 Session 19: View mode title with back button immediately after - min-h-7 ensures button fits */}
                                        <div className="flex items-center justify-center min-h-7 mb-1 gap-1">
                                            <span
                                                className={`text-xs font-semibold uppercase tracking-wider ${
                                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                                }`}
                                                data-testid="treemap-viewmode-title"
                                            >
                                                {/* Story 14.13 Session 18: Show drill-down path (translated) or base title */}
                                                {treemapDrillDownLevel > 0
                                                    ? translateCategory(treemapDrillDownPath[treemapDrillDownPath.length - 1], locale as 'en' | 'es')
                                                    : (locale === 'es'
                                                        ? (donutViewMode === 'store-groups' ? 'Grupos de Compras'
                                                            : donutViewMode === 'store-categories' ? 'Categorías de Compras'
                                                            : donutViewMode === 'item-groups' ? 'Grupos de Productos'
                                                            : 'Categorías de Productos')
                                                        : (donutViewMode === 'store-groups' ? 'Purchase Groups'
                                                            : donutViewMode === 'store-categories' ? 'Purchase Categories'
                                                            : donutViewMode === 'item-groups' ? 'Product Groups'
                                                            : 'Product Categories'))
                                                }
                                            </span>
                                            {/* Story 14.13 Session 19: Back button - immediately after title text */}
                                            {treemapDrillDownLevel > 0 && (
                                                <button
                                                    onClick={handleTreemapBack}
                                                    className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                                                    style={{
                                                        backgroundColor: 'var(--primary)',
                                                        color: 'white',
                                                    }}
                                                    aria-label={locale === 'es' ? 'Volver' : 'Back'}
                                                    data-testid="treemap-back-btn"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                            )}
                                        </div>
                                        {/* Story 14.13: Squarified treemap layout - cells sized proportionally */}
                                        {(() => {
                                            // Story 14.13 Session 17: Use drill-down data when in drill-down mode
                                            const displayData = treemapDrillDownLevel > 0
                                                ? treemapDrillDownCategorized.displayCategories
                                                : categoryData;

                                            // Convert display data to treemap items and calculate layout
                                            const treemapItems = categoryDataToTreemapItems(displayData);
                                            const layout = calculateTreemapLayout(treemapItems);

                                            // Find the largest cell (by area) to mark as main cell for styling
                                            const largestArea = Math.max(...layout.map(r => r.width * r.height));

                                            // Story 14.13: Predictable height based on category count
                                            // Use a step function that increases height at specific category thresholds
                                            // This prevents jumpy resizing when adding/removing categories
                                            const categoryCount = displayData.length;
                                            let dynamicHeight: number;
                                            if (categoryCount <= 4) {
                                                dynamicHeight = 320; // Base height for up to 4 categories
                                            } else if (categoryCount <= 6) {
                                                dynamicHeight = 400; // Medium height for 5-6 categories
                                            } else if (categoryCount <= 8) {
                                                dynamicHeight = 480; // Taller for 7-8 categories
                                            } else if (categoryCount <= 10) {
                                                dynamicHeight = 560; // Even taller for 9-10 categories
                                            } else {
                                                dynamicHeight = 640; // Max height for 11+ categories
                                            }

                                            // Story 14.13 Session 17: Determine current view mode for cell display
                                            // This controls emoji and translation lookup in AnimatedTreemapCell
                                            const getCurrentTreemapViewMode = (): DonutViewMode => {
                                                if (treemapDrillDownLevel === 0) return donutViewMode;

                                                // Drill-down view modes based on base view mode and drill level
                                                if (donutViewMode === 'store-categories') {
                                                    // Level 1: item-groups, Level 2: item-categories, Level 3: item-categories (subcats)
                                                    if (treemapDrillDownLevel === 1) return 'item-groups';
                                                    return 'item-categories';
                                                }
                                                if (donutViewMode === 'store-groups') {
                                                    // Level 1: store-categories, Level 2: item-groups, Level 3: item-categories
                                                    if (treemapDrillDownLevel === 1) return 'store-categories';
                                                    if (treemapDrillDownLevel === 2) return 'item-groups';
                                                    return 'item-categories';
                                                }
                                                if (donutViewMode === 'item-groups') {
                                                    // Level 1: item-categories, Level 2: item-categories (subcats)
                                                    return 'item-categories';
                                                }
                                                // item-categories: Level 1 = subcategories (still item-categories display)
                                                return 'item-categories';
                                            };

                                            const currentViewMode = getCurrentTreemapViewMode();

                                            return (
                                                <div
                                                    className="relative"
                                                    style={{ height: `${dynamicHeight}px` }}
                                                    data-testid="treemap-grid"
                                                >
                                                    {layout.map((rect, index) => {
                                                        // originalItem contains the full CategoryData since we passed it through categoryDataToTreemapItems
                                                        const cat = rect.originalItem as unknown as CategoryData;
                                                        const cellArea = rect.width * rect.height;
                                                        // Main cell = largest area (within 10% of max to handle ties)
                                                        const isMainCell = cellArea >= largestArea * 0.9;

                                                        return (
                                                            <AnimatedTreemapCell
                                                                key={`${cat.name}-${animationKey}`}
                                                                data={cat}
                                                                isMainCell={isMainCell}
                                                                onClick={() => handleTreemapCellDrillDown(cat.name)}
                                                                currency={currency}
                                                                animationKey={animationKey}
                                                                locale={locale}
                                                                t={t}
                                                                viewMode={currentViewMode}
                                                                onTransactionCountClick={handleTreemapTransactionCountClick}
                                                                // Story 14.40: Open statistics popup on icon click
                                                                onIconClick={handleOpenStatsPopup}
                                                                // Story 14.13: Pass cell dimensions for compact layout detection
                                                                cellWidthPercent={rect.width}
                                                                cellHeightPercent={rect.height}
                                                                // Story 14.13 Session 5: Icon based on countMode toggle
                                                                // 'transactions' = Receipt icon, 'items' = Package icon
                                                                iconType={countMode === 'items' ? 'package' : 'receipt'}
                                                                // Story 14.13.3: Cell index for staggered entrance animation
                                                                index={index}
                                                                // Squarified layout uses absolute positioning
                                                                style={{
                                                                    position: 'absolute',
                                                                    left: `${rect.x}%`,
                                                                    top: `${rect.y}%`,
                                                                    width: `calc(${rect.width}% - 4px)`,
                                                                    height: `calc(${rect.height}% - 4px)`,
                                                                    margin: '2px',
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}

                                        {/* Story 14.44: Floating Expand/Collapse buttons - bottom center, horizontal layout */}
                                        {/* Moved from top-left to avoid blocking category icon clicks */}
                                        {/* Story 14.13 Session 17: Use drill-down state when in drill-down mode */}
                                        {(() => {
                                            const currentCanExpand = treemapDrillDownLevel > 0
                                                ? treemapDrillDownCategorized.canExpand
                                                : canExpand;
                                            const currentCanCollapse = treemapDrillDownLevel > 0
                                                ? treemapDrillDownCategorized.canCollapse
                                                : canCollapse;
                                            const currentOtroCategories = treemapDrillDownLevel > 0
                                                ? treemapDrillDownCategorized.otroCategories
                                                : otroCategories;
                                            const currentExpandedCount = treemapDrillDownLevel > 0
                                                ? treemapDrillDownExpandedCount
                                                : expandedCategoryCount;
                                            const handleExpand = treemapDrillDownLevel > 0
                                                ? () => setTreemapDrillDownExpandedCount(prev => prev + 1)
                                                : () => setExpandedCategoryCount(prev => prev + 1);
                                            const handleCollapse = treemapDrillDownLevel > 0
                                                ? () => setTreemapDrillDownExpandedCount(prev => Math.max(0, prev - 1))
                                                : () => setExpandedCategoryCount(prev => Math.max(0, prev - 1));

                                            // Only show if there's something to expand or collapse
                                            if (!currentCanExpand && !currentCanCollapse) return null;

                                            return (
                                                <div
                                                    className="absolute left-1/2 -translate-x-1/2 bottom-2 z-20 pointer-events-none"
                                                >
                                                    <div className="flex flex-row gap-4 pointer-events-auto">
                                                        {/* Plus button (expand) - on left */}
                                                        {/* Story 14.13: More transparent buttons to reduce visual clutter */}
                                                        <button
                                                            onClick={handleExpand}
                                                            disabled={!currentCanExpand}
                                                            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                                                            style={{
                                                                backgroundColor: 'color-mix(in srgb, var(--primary) 40%, transparent)',
                                                                color: 'white',
                                                                opacity: currentCanExpand ? 1 : 0,
                                                                pointerEvents: currentCanExpand ? 'auto' : 'none',
                                                            }}
                                                            aria-label={locale === 'es' ? `Mostrar más (${currentOtroCategories.length} en Otro)` : `Show more (${currentOtroCategories.length} in Other)`}
                                                            data-testid="expand-categories-btn"
                                                        >
                                                            <Plus size={18} strokeWidth={2.5} />
                                                            {/* Badge with count - bottom right, semi-transparent */}
                                                            <span
                                                                className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold backdrop-blur-md"
                                                                style={{
                                                                    backgroundColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                                                                    color: 'white',
                                                                }}
                                                            >
                                                                {currentOtroCategories.length}
                                                            </span>
                                                        </button>
                                                        {/* Minus button (collapse) - on right */}
                                                        <button
                                                            onClick={handleCollapse}
                                                            disabled={!currentCanCollapse}
                                                            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                                                            style={{
                                                                backgroundColor: 'color-mix(in srgb, var(--primary) 40%, transparent)',
                                                                color: 'white',
                                                                opacity: currentCanCollapse ? 1 : 0,
                                                                pointerEvents: currentCanCollapse ? 'auto' : 'none',
                                                            }}
                                                            aria-label={locale === 'es' ? 'Mostrar menos categorías' : 'Show fewer categories'}
                                                            data-testid="collapse-categories-btn"
                                                        >
                                                            <Minus size={18} strokeWidth={2.5} />
                                                            {/* Badge with count - bottom right, semi-transparent */}
                                                            <span
                                                                className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold backdrop-blur-md"
                                                                style={{
                                                                    backgroundColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                                                                    color: 'white',
                                                                }}
                                                            >
                                                                {currentExpandedCount}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Slide 0: Distribution - Donut view */}
                                {carouselSlide === 0 && distributionView === 'donut' && (
                                    <DonutChart
                                        categoryData={categoryData}
                                        allCategoryData={allCategoryData}
                                        total={total}
                                        periodLabel={periodLabel}
                                        currency={currency}
                                        locale={locale}
                                        isDark={isDark}
                                        animationKey={animationKey}
                                        onCategoryClick={handleCategoryClick}
                                        canExpand={canExpand}
                                        canCollapse={canCollapse}
                                        otroCount={otroCategories.length}
                                        otroCategories={otroCategories}
                                        expandedCount={expandedCategoryCount}
                                        onExpand={() => setExpandedCategoryCount(prev => prev + 1)}
                                        onCollapse={() => setExpandedCategoryCount(prev => Math.max(0, prev - 1))}
                                        transactions={filteredTransactions}
                                        onNavigateToHistory={onNavigateToHistory}
                                        viewMode={donutViewMode}
                                        timePeriod={timePeriod}
                                        currentPeriod={currentPeriod}
                                        countMode={countMode}
                                        // Story 14.40: Open statistics popup on icon click
                                        onIconClick={handleOpenStatsPopup}
                                    />
                                )}

                                {/* Slide 1: Tendencia (AC #6) - Card-based layout */}
                                {carouselSlide === 1 && tendenciaView === 'list' && (
                                    <div className="relative flex flex-col">
                                        {/* Story 14.13.2: Title header with drill-down support */}
                                        <div className="flex items-center justify-center min-h-7 mb-1 gap-1">
                                            <span
                                                className={`text-xs font-semibold uppercase tracking-wider ${
                                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                                }`}
                                                data-testid="trend-viewmode-title"
                                            >
                                                {trendDrillDownLevel > 0
                                                    ? translateCategory(trendDrillDownPath[trendDrillDownPath.length - 1], locale as 'en' | 'es')
                                                    : (locale === 'es'
                                                        ? (donutViewMode === 'store-groups' ? 'Grupos de Compras'
                                                            : donutViewMode === 'store-categories' ? 'Categorías de Compras'
                                                            : donutViewMode === 'item-groups' ? 'Grupos de Productos'
                                                            : 'Categorías de Productos')
                                                        : (donutViewMode === 'store-groups' ? 'Purchase Groups'
                                                            : donutViewMode === 'store-categories' ? 'Purchase Categories'
                                                            : donutViewMode === 'item-groups' ? 'Product Groups'
                                                            : 'Product Categories'))
                                                }
                                            </span>
                                            {/* Back button to the right of title when drilled down - matches donut chart style */}
                                            {trendDrillDownLevel > 0 && (
                                                <button
                                                    onClick={handleTrendBack}
                                                    className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                                                    style={{
                                                        backgroundColor: 'var(--primary)',
                                                        color: 'white',
                                                    }}
                                                    aria-label={locale === 'es' ? 'Volver' : 'Back'}
                                                    data-testid="trend-back-button"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                            )}
                                        </div>
                                        {/* Card list with gap */}
                                        <div
                                            className="flex flex-col gap-1.5 pb-3"
                                            data-testid="trend-list"
                                        >
                                            {displayTrendData.map((trend, index) => (
                                                <TrendListItem
                                                    key={`${trend.name}-${trendAnimationKey}`}
                                                    data={trend}
                                                    onClick={() => handleTrendDrillDown(trend.name)}
                                                    onCountClick={() => handleTrendCountClick(trend.name)}
                                                    // Story 14.40: Open statistics popup on icon click
                                                    onIconClick={handleOpenStatsPopup}
                                                    currency={currency}
                                                    theme={theme}
                                                    locale={locale}
                                                    viewMode={getTrendViewModeAtLevel()}
                                                    countMode={countMode}
                                                    animationIndex={index}
                                                    isVisible={visibleTrendItems.has(index)}
                                                    showDrillDown={getTrendViewModeAtLevel() !== 'item-categories'}
                                                />
                                            ))}
                                        </div>

                                        {/* Story 14.44: Floating Expand/Collapse buttons - bottom center, horizontal layout */}
                                        {/* Moved from top-left to avoid blocking category icon clicks */}
                                        {(() => {
                                            const handleTrendExpand = trendDrillDownLevel > 0
                                                ? () => setTrendDrillDownExpandedCount(prev => prev + 1)
                                                : () => setTrendExpandedCount(prev => prev + 1);
                                            const handleTrendCollapse = trendDrillDownLevel > 0
                                                ? () => setTrendDrillDownExpandedCount(prev => Math.max(0, prev - 1))
                                                : () => setTrendExpandedCount(prev => Math.max(0, prev - 1));

                                            // Only show if there's something to expand or collapse
                                            if (!trendCanExpand && !trendCanCollapse) return null;

                                            return (
                                                <div
                                                    className="absolute left-1/2 -translate-x-1/2 bottom-2 z-20 pointer-events-none"
                                                >
                                                    <div className="flex flex-row gap-4 pointer-events-auto">
                                                        {/* Plus button (expand) - on left */}
                                                        <button
                                                            onClick={handleTrendExpand}
                                                            disabled={!trendCanExpand}
                                                            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                                                            style={{
                                                                backgroundColor: 'color-mix(in srgb, var(--primary) 40%, transparent)',
                                                                color: 'white',
                                                                opacity: trendCanExpand ? 1 : 0,
                                                                pointerEvents: trendCanExpand ? 'auto' : 'none',
                                                            }}
                                                            aria-label={locale === 'es' ? `Mostrar más (${otroTrendCategories.length} en Más)` : `Show more (${otroTrendCategories.length} in More)`}
                                                            data-testid="trend-expand-categories-btn"
                                                        >
                                                            <Plus size={18} strokeWidth={2.5} />
                                                            {/* Badge with count - bottom right, semi-transparent */}
                                                            <span
                                                                className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold backdrop-blur-md"
                                                                style={{
                                                                    backgroundColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                                                                    color: 'white',
                                                                }}
                                                            >
                                                                {otroTrendCategories.length}
                                                            </span>
                                                        </button>
                                                        {/* Minus button (collapse) - on right */}
                                                        <button
                                                            onClick={handleTrendCollapse}
                                                            disabled={!trendCanCollapse}
                                                            className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                                                            style={{
                                                                backgroundColor: 'color-mix(in srgb, var(--primary) 40%, transparent)',
                                                                color: 'white',
                                                                opacity: trendCanCollapse ? 1 : 0,
                                                                pointerEvents: trendCanCollapse ? 'auto' : 'none',
                                                            }}
                                                            aria-label={locale === 'es' ? 'Mostrar menos categorías' : 'Show fewer categories'}
                                                            data-testid="trend-collapse-categories-btn"
                                                        >
                                                            <Minus size={18} strokeWidth={2.5} />
                                                            {/* Badge with count - bottom right, semi-transparent */}
                                                            <span
                                                                className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-xs font-bold backdrop-blur-md"
                                                                style={{
                                                                    backgroundColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                                                                    color: 'white',
                                                                }}
                                                            >
                                                                {currentTrendExpandedCount}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Slide 1: Tendencia - Sankey view (Story 14.13.3 Phase 5) */}
                                {carouselSlide === 1 && tendenciaView === 'sankey' && (
                                    <div
                                        className="flex flex-col"
                                        data-testid="sankey-view"
                                    >
                                        {/* Story 14.13.3: Reserved title space - OUTSIDE scrollable area */}
                                        {/* FIXED HEIGHT (60px) prevents diagram from shifting when selection changes */}
                                        {/* Two-line layout: Line 1 = category pill with name (truncated), Line 2 = amount and percentage */}
                                        <div
                                            className="flex flex-col items-center justify-center px-2"
                                            style={{ height: '60px' }} // Fixed height for title area
                                            data-testid="sankey-title-area"
                                        >
                                            {sankeySelectionData ? (
                                                <div className="flex flex-col items-center gap-0.5 transition-opacity duration-200 w-full max-w-full">
                                                    {/* Line 1: Category pill with emoji and name - truncate long names */}
                                                    <span
                                                        className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-sm font-semibold max-w-full"
                                                        style={{
                                                            backgroundColor: sankeySelectionData.color + '20', // 20% opacity background
                                                            color: sankeySelectionData.color,
                                                        }}
                                                    >
                                                        {sankeySelectionData.isLink ? (
                                                            // For links: show source > target (parent > child hierarchy)
                                                            <>
                                                                <span className="flex-shrink-0">{sankeySelectionData.sourceEmoji}</span>
                                                                <span className="truncate max-w-[80px]">{sankeySelectionData.sourceName}</span>
                                                                <span className="flex-shrink-0 mx-0.5">&gt;</span>
                                                                <span className="flex-shrink-0">{sankeySelectionData.targetEmoji}</span>
                                                                <span className="truncate max-w-[80px]">{sankeySelectionData.targetName}</span>
                                                            </>
                                                        ) : (
                                                            // For nodes: emoji + full name
                                                            <>
                                                                <span className="flex-shrink-0">{sankeySelectionData.emoji}</span>
                                                                <span className="truncate max-w-[180px]">{sankeySelectionData.displayName}</span>
                                                            </>
                                                        )}
                                                    </span>
                                                    {/* Line 2: Amount and percentage in category color - LARGER font */}
                                                    <span
                                                        className="text-sm font-semibold"
                                                        style={{ color: sankeySelectionData.color }}
                                                    >
                                                        {sankeySelectionData.amountK} ({sankeySelectionData.percent})
                                                    </span>
                                                </div>
                                            ) : (
                                                <span
                                                    className="text-xs text-center opacity-50"
                                                    style={{ color: 'var(--text-tertiary)' }}
                                                >
                                                    {locale === 'es' ? 'Toca una categoría para ver detalles' : 'Tap a category to see details'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Story 14.13.3: Scrollable diagram container (clipped) with entrance animation */}
                                        {/* Navigation is via left/right buttons in top-right corner */}
                                        {/* Carousel swipe works normally on this area */}
                                        <div
                                            className="overflow-hidden"
                                            style={{ height: '340px' }} // Adjusted for two-line title (48px)
                                        >
                                            <div
                                                ref={sankeyScrollableRef}
                                                className="overflow-x-hidden overflow-y-hidden h-full"
                                                style={{
                                                    scrollbarWidth: 'none', // Hide native scrollbar
                                                    msOverflowStyle: 'none', // IE/Edge
                                                }}
                                            >
                                                {/* Story 14.13.3: Animated container - fade in + scale up on view/mode change */}
                                                <div
                                                    key={sankeyAnimationKey}
                                                    style={{
                                                        minWidth: `${sankeyContentWidth}px`,
                                                        height: '100%',
                                                        opacity: sankeyVisible ? 1 : 0,
                                                        transform: sankeyVisible ? 'scale(1)' : 'scale(0.95)',
                                                        transition: prefersReducedMotion
                                                            ? 'none'
                                                            : 'opacity 400ms ease-out, transform 400ms ease-out',
                                                    }}
                                                >
                                                    <SankeyChart
                                                        transactions={filteredTransactions}
                                                        currency={currency}
                                                        locale={locale as 'es' | 'en'}
                                                        mode={sankeyMode}
                                                        theme={getCurrentTheme()}
                                                        colorMode={getCurrentMode()}
                                                        height={340}
                                                        prefersReducedMotion={prefersReducedMotion}
                                                        // Story 14.13.3: Simplified view - native ECharts labels with emoji inside bars
                                                        useIconNodes={false}
                                                        // Story 14.13.3: Title managed externally (above chart, no layout shift)
                                                        showTitle={false}
                                                        // Story 14.13.3: Disable auto-reset, parent manages selection
                                                        titleResetTimeout={0}
                                                        // Story 14.13.3: Controlled selection for toggle behavior
                                                        selectedNode={sankeySelectedNode}
                                                        onSelectionChange={handleSankeySelectionChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {carouselSlide === 2 && isGroupMode && memberContributions.length > 0 && (
                                    <div className="relative flex flex-col h-full">
                                        {/* Title */}
                                        <div className="flex items-center justify-center min-h-7 mb-2">
                                            <span
                                                className={`text-xs font-semibold uppercase tracking-wider ${
                                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                                }`}
                                            >
                                                {t('memberContributions')}
                                            </span>
                                        </div>
                                        {/* Chart */}
                                        <div className="flex-1 overflow-y-auto px-1">
                                            <MemberContributionChart
                                                contributions={memberContributions}
                                                currency={currency}
                                                theme={theme}
                                                showTransactionCount={true}
                                                t={t}
                                            />
                                        </div>
                                    </div>
                                )}
                                </div>
                                {/* End of swipe transform wrapper */}
                            </div>

                            {/* Indicator Bar (AC #4) - Flush bottom like Dashboard */}
                            <div
                                className="flex"
                                style={{
                                    backgroundColor: 'var(--border-light, #e2e8f0)',
                                    borderRadius: '0 0 12px 12px',
                                    overflow: 'hidden',
                                    height: '6px',
                                }}
                                role="tablist"
                                aria-label="Carousel slides"
                                data-testid="carousel-indicator"
                            >
                                {Array.from({ length: maxCarouselSlide + 1 }, (_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setCarouselSlide(idx as CarouselSlide);
                                            setAnimationKey(prev => prev + 1);
                                        }}
                                        className="flex-1 h-full transition-colors"
                                        style={{
                                            backgroundColor: carouselSlide === idx
                                                ? 'var(--primary, #2563eb)'
                                                : 'transparent',
                                            borderRadius: carouselSlide === idx
                                                ? (idx === 0 ? '0 0 0 12px' : idx === maxCarouselSlide ? '0 0 12px 0' : '0')
                                                : '0',
                                        }}
                                        aria-label={`Go to slide ${idx + 1}: ${carouselTitles[idx]}`}
                                        aria-selected={carouselSlide === idx}
                                        role="tab"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </TransitionChild>

                {/* Empty state */}
                {filteredTransactions.length === 0 && (
                    <TransitionChild index={3} totalItems={4}>
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                {t('noData')}
                            </p>
                        </div>
                    </TransitionChild>
                )}
            </div>

            {/* Story 14.40: Category Statistics Popup */}
            <CategoryStatisticsPopup
                isOpen={statsPopupOpen}
                onClose={handleCloseStatsPopup}
                onViewHistory={handleStatsPopupViewHistory}
                emoji={statsPopupCategory?.emoji ?? ''}
                categoryName={statsPopupCategory
                    ? getTranslatedCategoryName(statsPopupCategory.name, statsPopupCategory.type)
                    : ''}
                categoryColor={statsPopupCategory?.color ?? 'var(--primary)'}
                categoryFgColor={statsPopupCategory?.fgColor ?? 'white'}
                statistics={categoryStatistics}
                currency={currency}
                theme={theme}
                t={t}
                categoryType={statsPopupCategory?.type ?? 'store-category'}
                periodLabel={periodLabel}
            />

        </PageTransition>
    );
};

export default TrendsView;
