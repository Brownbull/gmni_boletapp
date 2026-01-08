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
import { ChevronLeft, ChevronRight, PieChart, LayoutGrid, Plus, Minus, Receipt } from 'lucide-react';
// Story 14.13: Animation components
import { PageTransition } from '../components/animation/PageTransition';
import { TransitionChild } from '../components/animation/TransitionChild';
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
} from '../utils/historyFilterUtils';
import { useGroups } from '../hooks/useGroups';
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
import type { ColorTheme } from '../types/settings';

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
type CarouselSlide = 0 | 1; // 0 = Distribution, 1 = Tendencia

/** View toggle state per slide */
type DistributionView = 'treemap' | 'donut';
type TendenciaView = 'list' | 'breakdown';

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
    count: number;
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
}

/** Navigation payload for History view */
export interface HistoryNavigationPayload {
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
}

export interface TrendsViewProps {
    /** All transactions from the user */
    transactions: Transaction[];
    /** Theme for styling */
    theme: 'light' | 'dark';
    /** Color theme for branding */
    colorTheme?: ColorTheme;
    /** Currency code for formatting */
    currency: string;
    /** Locale for date/currency formatting */
    locale: string;
    /** Translation function */
    t: (key: string) => string;
    /** Callback to edit a transaction */
    onEditTransaction: (transaction: Transaction) => void;
    /** Whether export is in progress */
    exporting?: boolean;
    /** Callback to set exporting state */
    onExporting?: (value: boolean) => void;
    /** Callback for premium upgrade prompt */
    onUpgradeRequired?: () => void;
    /** Callback for navigating to History view with pre-applied filters */
    onNavigateToHistory?: (payload: HistoryNavigationPayload) => void;
    /** Story 14.14b: Back button handler */
    onBack?: () => void;
    /** Story 14.14b: User name for profile avatar */
    userName?: string;
    /** Story 14.14b: User email for profile dropdown */
    userEmail?: string;
    /** Story 14.14b: General navigation handler for profile dropdown menu items */
    onNavigateToView?: (view: string) => void;
    /** Story 14.14b: User ID for groups hook */
    userId?: string;
    /** Story 14.14b: App ID for groups hook */
    appId?: string;
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

const CAROUSEL_TITLES = ['Distribución', 'Tendencia'] as const;

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
    const categoryMap: Record<string, { value: number; transactionIds: Set<string> }> = {};

    transactions.forEach((tx, index) => {
        const cat = tx.category || 'Otro';
        if (!categoryMap[cat]) {
            categoryMap[cat] = { value: 0, transactionIds: new Set() };
        }
        categoryMap[cat].value += tx.total;
        // Use tx.id if available, otherwise fallback to index-based ID
        categoryMap[cat].transactionIds.add(tx.id ?? `tx-${index}`);
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
    // Track value per category and which transactions contain each category
    const itemCategoryMap: Record<string, { value: number; transactionIds: Set<string> }> = {};

    transactions.forEach((tx, index) => {
        // Aggregate line items by their category
        (tx.items || []).forEach(item => {
            // Story 14.15b: Normalize legacy category names (V1/V2 -> V3)
            const cat = normalizeItemCategory(item.category || 'Other');
            if (!itemCategoryMap[cat]) {
                itemCategoryMap[cat] = { value: 0, transactionIds: new Set() };
            }
            // Story 14.24: price is total for line item, qty is informational only
            itemCategoryMap[cat].value += item.price;
            // Track unique transaction IDs to count transactions, not items
            itemCategoryMap[cat].transactionIds.add(tx.id ?? `tx-${index}`);
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
    const subcategoryMap: Record<string, { value: number; transactionIds: Set<string> }> = {};

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
                subcategoryMap[subcat] = { value: 0, transactionIds: new Set() };
            }
            // Story 14.24: price is total for line item, qty is informational only
            subcategoryMap[subcat].value += item.price;
            // Track unique transaction IDs to count transactions, not items
            subcategoryMap[subcat].transactionIds.add(tx.id ?? `tx-${index}`);
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
                transactionIds: data.transactionIds, // Keep for group aggregation
                color: pillColors.bg,
                fgColor: pillColors.fg,
                percent: total > 0 ? Math.round((data.value / total) * 100) : 0,
            };
        })
        .sort((a, b) => b.value - a.value);
}

/**
 * Story 14.14b Session 4: Get item categories for a specific store category.
 * Filters transactions by store category and aggregates their line items.
 */
function computeItemCategoriesForStore(
    transactions: Transaction[],
    storeCategoryName: string
): CategoryData[] {
    // Filter transactions to only those matching the store category
    const filteredTx = transactions.filter(tx => tx.category === storeCategoryName);
    return computeItemCategoryData(filteredTx);
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

        // Use gray color for aggregated "Más" group
        const masColors = getCategoryPillColors('Otro'); // Reuse Otro colors (gray)
        displayCategories.push({
            name: 'Más',
            value: masValue,
            count: masCount,
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
    style?: React.CSSProperties; // Story 14.13: Support squarified treemap absolute positioning
    cellWidthPercent?: number; // Story 14.13: Cell width % for compact layout detection
    cellHeightPercent?: number; // Story 14.13: Cell height % for compact layout detection
}> = ({ data, isMainCell, onClick, gridRow, gridColumn, animationKey, locale = 'es', t, viewMode = 'store-categories', onTransactionCountClick, style, cellWidthPercent = 100, cellHeightPercent = 100 }) => {
    // Animated values using useCountUp hook
    const animatedAmount = useCountUp(Math.round(data.value / 1000), { duration: 1200, startValue: 0, key: animationKey });
    const animatedPercent = useCountUp(Math.round(data.percent), { duration: 1200, startValue: 0, key: animationKey });
    const animatedCount = useCountUp(data.count, { duration: 800, startValue: 0, key: animationKey });

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
                }}
                aria-label={`${displayName}: $${animatedAmount}k, ${data.count} ${locale === 'es' ? 'transacciones' : 'transactions'}`}
                data-testid={`treemap-cell-${data.name.toLowerCase()}`}
            >
                {/* Emoji only - most compact representation */}
                <span style={{ fontSize: '12px', lineHeight: 1 }}>{emoji}</span>
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
                }}
                aria-label={`${displayName}: $${animatedAmount}k`}
                data-testid={`treemap-cell-${data.name.toLowerCase()}`}
            >
                {/* Top: Emoji + truncated name - using main cell font size (14px) */}
                <div className="flex items-center gap-1.5 min-w-0">
                    <span style={{ fontSize: '14px', lineHeight: 1 }}>{emoji}</span>
                    <span
                        className="font-bold truncate"
                        style={{
                            fontSize: '14px',
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
                    {/* Transaction count pill */}
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
                        aria-label={`${locale === 'es' ? 'Ver' : 'View'} ${data.count} ${locale === 'es' ? 'transacciones' : 'transactions'}`}
                    >
                        <Receipt size={10} strokeWidth={2} />
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
            }}
            aria-label={`${displayName}: $${animatedAmount}k`}
            data-testid={`treemap-cell-${data.name.toLowerCase()}`}
        >
            {/* Top row: Emoji + Category name */}
            <div className="flex items-center gap-1.5 min-w-0">
                {/* Category emoji (no background - card already has category color) */}
                <span style={{ fontSize: '16px', lineHeight: 1 }}>{emoji}</span>
                {/* Category name - Story 14.13: Always use 14px font, truncate if needed */}
                <div
                    className="font-bold truncate flex items-center gap-1"
                    style={{
                        fontSize: '14px',
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

            {/* Bottom section: Transaction count + Amount (left), Percentage circle (bottom right) */}
            {/* Story 14.13: Unified layout for squarified treemap cells */}
            <div className="flex items-end justify-between">
                {/* Left side: count above amount */}
                <div className="flex flex-col gap-0.5">
                    {/* Transaction count pill - Story 14.22: Clickable to navigate to transactions */}
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
                        aria-label={`${locale === 'es' ? 'Ver' : 'View'} ${data.count} ${locale === 'es' ? 'transacciones' : 'transactions'}`}
                    >
                        <Receipt size={isMainCell ? 11 : 10} strokeWidth={2} />
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
}) => {
    // State for selected segment
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Story 14.14b: Enhanced drill-down state to support all view modes
    // Drill-down path tracks: [storeGroup?, storeCategory?, itemCategory?]
    // Level 0: Show base view (based on viewMode)
    // Level 1: First drill-down (group->categories OR category->items)
    // Level 2: Second drill-down (category->items OR item->subcategories)
    // Level 3: Third drill-down (items->subcategories, only from store-groups)
    const [drillDownLevel, setDrillDownLevel] = useState<0 | 1 | 2 | 3>(0);
    const [drillDownPath, setDrillDownPath] = useState<string[]>([]); // Stores names at each drill level

    // Internal expand state for drill-down levels
    const [drillDownExpandedCount, setDrillDownExpandedCount] = useState(0);

    // Story 14.14b Session 4: Reset drill-down when viewMode changes from parent
    useEffect(() => {
        setDrillDownLevel(0);
        setDrillDownPath([]);
        setSelectedCategory(null);
        setDrillDownExpandedCount(0);
    }, [viewMode]);

    // Story 14.14b Session 5: Aggregate allCategoryData (not treemap-processed categoryData) by store category groups
    // This ensures all store categories are included, not just those above the treemap threshold
    const storeGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<StoreCategoryGroup, { value: number; count: number }> = {
            'food-dining': { value: 0, count: 0 },
            'health-wellness': { value: 0, count: 0 },
            'retail-general': { value: 0, count: 0 },
            'retail-specialty': { value: 0, count: 0 },
            'automotive': { value: 0, count: 0 },
            'services': { value: 0, count: 0 },
            'hospitality': { value: 0, count: 0 },
            'other': { value: 0, count: 0 },
        };

        // Aggregate allCategoryData into groups (use all categories, not treemap-filtered)
        for (const cat of allCategoryData) {
            // Map category name to its group
            const group = STORE_CATEGORY_GROUPS[cat.name as keyof typeof STORE_CATEGORY_GROUPS] || 'other';
            groupTotals[group].value += cat.value;
            groupTotals[group].count += cat.count;
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
    const itemGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<ItemCategoryGroup, { value: number; transactionIds: Set<string> }> = {
            'food-fresh': { value: 0, transactionIds: new Set() },
            'food-packaged': { value: 0, transactionIds: new Set() },
            'health-personal': { value: 0, transactionIds: new Set() },
            'household': { value: 0, transactionIds: new Set() },
            'nonfood-retail': { value: 0, transactionIds: new Set() },
            'services-fees': { value: 0, transactionIds: new Set() },
            'other-item': { value: 0, transactionIds: new Set() },
        };

        // Aggregate itemCategoriesData into groups using transaction IDs for accurate counting
        for (const item of itemCategoriesData) {
            const itemKey = ITEM_CATEGORY_TO_KEY[item.name as keyof typeof ITEM_CATEGORY_TO_KEY];
            const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
            groupTotals[group].value += item.value;
            // Merge transaction IDs to avoid double-counting
            if (item.transactionIds) {
                item.transactionIds.forEach(id => groupTotals[group].transactionIds.add(id));
            }
        }

        const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

        return ALL_ITEM_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getItemGroupColors(groupKey, theme, mode);
                return {
                    name: groupKey,
                    value: data.value,
                    count: data.transactionIds.size,  // Unique transaction count
                    transactionIds: data.transactionIds,  // Keep for further aggregation
                    color: colors.bg,
                    fgColor: colors.fg,
                    percent: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
                };
            })
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [itemCategoriesData]);

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
    const getStoreCategoriesInGroup = useCallback((groupKey: string): CategoryData[] => {
        // Filter categoryData to only include categories in this group
        return categoryData.filter(cat => {
            const catGroup = STORE_CATEGORY_GROUPS[cat.name as keyof typeof STORE_CATEGORY_GROUPS];
            return catGroup === groupKey;
        });
    }, [categoryData]);

    // Story 14.14b Session 4: Get real item categories for a store category from actual transactions
    const getItemCategoriesForStore = useCallback((storeCategoryName: string): CategoryData[] => {
        return computeItemCategoriesForStore(transactions, storeCategoryName);
    }, [transactions]);

    // Story 14.14b: Get item categories within an item group
    const getItemCategoriesInGroup = useCallback((groupKey: string): CategoryData[] => {
        return itemCategoriesData.filter(item => {
            const itemKey = ITEM_CATEGORY_TO_KEY[item.name as keyof typeof ITEM_CATEGORY_TO_KEY];
            const itemGroup = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
            return itemGroup === groupKey;
        });
    }, [itemCategoriesData]);

    // Story 14.14b: Get drill-down data based on viewMode and current path
    const rawDrillDownData = useMemo((): CategoryData[] => {
        if (drillDownLevel === 0) return [];

        const path = drillDownPath;

        // Store Groups: group -> store categories -> item categories -> subcategories
        if (viewMode === 'store-groups') {
            if (drillDownLevel === 1 && path[0]) {
                return getStoreCategoriesInGroup(path[0]);
            } else if (drillDownLevel === 2 && path[1]) {
                return getItemCategoriesForStore(path[1]);
            } else if (drillDownLevel === 3 && path[2]) {
                return getItemSubcategories(path[2]) as CategoryData[];
            }
        }

        // Store Categories: store category -> item categories -> subcategories
        if (viewMode === 'store-categories') {
            if (drillDownLevel === 1 && path[0]) {
                return getItemCategoriesForStore(path[0]);
            } else if (drillDownLevel === 2 && path[1]) {
                return getItemSubcategories(path[1]) as CategoryData[];
            }
        }

        // Item Groups: item group -> item categories -> subcategories
        if (viewMode === 'item-groups') {
            if (drillDownLevel === 1 && path[0]) {
                return getItemCategoriesInGroup(path[0]);
            } else if (drillDownLevel === 2 && path[1]) {
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
    }, [drillDownLevel, drillDownPath, viewMode, getStoreCategoriesInGroup, getItemCategoriesForStore, getItemCategoriesInGroup, getItemSubcategories]);

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
    const drillDownCategorized = useMemo(() => {
        if (drillDownLevel === 0) {
            return { displayCategories: viewModeBaseData, otroCategories: [] as CategoryData[], canExpand: false, canCollapse: false };
        }
        return computeTreemapCategories(rawDrillDownData, drillDownExpandedCount);
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
    const getMaxDrillDownLevel = useCallback((): number => {
        switch (viewMode) {
            case 'store-groups': return 3; // group -> store cat -> item cat -> subcategory
            case 'store-categories': return 2; // store cat -> item cat -> subcategory
            case 'item-groups': return 2; // item group -> item cat -> subcategory
            case 'item-categories': return 1; // item cat -> subcategory
            default: return 2;
        }
    }, [viewMode]);

    // Handle drill-down into a category/group
    const handleDrillDown = (name: string) => {
        setSelectedCategory(null); // Clear selection
        setDrillDownExpandedCount(0); // Reset expanded count when drilling down

        const maxLevel = getMaxDrillDownLevel();
        if (drillDownLevel < maxLevel) {
            // Add name to path and increment level
            setDrillDownPath(prev => [...prev, name]);
            setDrillDownLevel(prev => Math.min(prev + 1, 3) as 0 | 1 | 2 | 3);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        setSelectedCategory(null);
        setDrillDownExpandedCount(0); // Reset expanded count when going back

        if (drillDownLevel > 0) {
            // Remove last item from path and decrement level
            setDrillDownPath(prev => prev.slice(0, -1));
            setDrillDownLevel(prev => Math.max(prev - 1, 0) as 0 | 1 | 2 | 3);
        }
    };

    // Story 14.14b Session 4+5: Handle transaction count pill click - navigate to HistoryView with filters
    // Story 14.22: Full support for all view modes and drill-down levels
    // Story 14.14b Session 7: Handle "Más" aggregated group by expanding to constituent categories
    const handleTransactionCountClick = useCallback((categoryName: string) => {
        if (!onNavigateToHistory) return;

        // Build the navigation payload based on viewMode and drill-down state
        const payload: HistoryNavigationPayload = {};

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

        onNavigateToHistory(payload);
    }, [onNavigateToHistory, viewMode, drillDownLevel, drillDownPath, timePeriod, currentPeriod, parentOtroCategories, drillDownCategorized.otroCategories]);

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
            {/* Story 14.14b Session 4: Header with back button and title (dropdown moved to carousel) */}
            <div className="flex items-center justify-center mb-2 mt-1 relative">
                {/* Back button (shown when drilled down) */}
                {drillDownLevel > 0 && (
                    <button
                        onClick={handleBack}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isDark
                                ? 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                        }`}
                        aria-label={locale === 'es' ? 'Volver' : 'Back'}
                        data-testid="donut-back-btn"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}

                {/* Story 14.14b Session 4: Simple title showing current view mode */}
                <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                    style={{
                        marginLeft: drillDownLevel > 0 ? '40px' : '0',
                    }}
                    data-testid="donut-viewmode-title"
                >
                    {locale === 'es' ? currentViewModeLabel.es : currentViewModeLabel.en}
                </span>
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
                        className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold backdrop-blur-md"
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

                            return displayData.map((cat) => {
                                if (cat.percent <= 0) return null;

                                const isSelected = selectedCategory === cat.name;
                                // Apply gap by reducing segment size slightly
                                const segmentPercent = Math.max(0, cat.percent - gapPercent);
                                const dashLength = (segmentPercent / 100) * circumference;
                                const gapLength = circumference - dashLength;
                                const strokeDasharray = `${dashLength} ${gapLength}`;
                                const strokeDashoffset = -currentOffset;

                                currentOffset += (cat.percent / 100) * circumference;

                                return (
                                    <circle
                                        key={cat.name}
                                        cx="60"
                                        cy="60"
                                        r="52"
                                        fill="none"
                                        stroke={cat.fgColor}
                                        strokeWidth={isSelected ? 16 : 14}
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        className="cursor-pointer transition-all duration-200"
                                        style={{
                                            opacity: selectedCategory && !isSelected ? 0.4 : 1,
                                        }}
                                        onClick={() => handleSegmentClick(cat.name)}
                                        data-testid={`donut-segment-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                                    />
                                );
                            });
                        })()}
                    </svg>
                    {/* Center text - updates on segment selection (larger fonts) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {selectedData
                                ? formatCurrency(selectedData.value, currency)
                                : formatCurrency(displayTotal, currency)
                            }
                        </span>
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {selectedData ? (() => {
                                // Story 14.14b: Translate based on current data type
                                const isShowingStoreGroups = viewMode === 'store-groups' && drillDownLevel === 0;
                                const isShowingItemGroups = viewMode === 'item-groups' && drillDownLevel === 0;
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
                        className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold backdrop-blur-md"
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
                    const isShowingStoreGroups = viewMode === 'store-groups' && drillDownLevel === 0;
                    const isShowingStoreCategories =
                        (viewMode === 'store-categories' && drillDownLevel === 0) ||
                        (viewMode === 'store-groups' && drillDownLevel === 1);
                    const isShowingItemGroups = viewMode === 'item-groups' && drillDownLevel === 0;
                    const isShowingItemCategories =
                        (viewMode === 'item-categories' && drillDownLevel === 0) ||
                        (viewMode === 'store-categories' && drillDownLevel === 1) ||
                        (viewMode === 'store-groups' && drillDownLevel === 2) ||
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
                            {/* Icon in colored square - uses vibrant fgColor for visibility */}
                            <button
                                onClick={() => handleSegmentClick(cat.name)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                                style={{ backgroundColor: cat.fgColor }}
                                aria-label={`Select ${displayName}`}
                            >
                                <span className="text-white drop-shadow-sm">
                                    {emoji}
                                </span>
                            </button>

                            {/* Name and amount (clickable to select) */}
                            <button
                                onClick={() => handleSegmentClick(cat.name)}
                                className="flex-1 flex flex-col items-start min-w-0"
                            >
                                <span
                                    className="text-sm font-medium truncate flex items-center gap-1"
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
                                </span>
                                <span
                                    className="text-xs"
                                    style={{ color: legendTextColor, opacity: 0.7 }}
                                >
                                    {formatCurrency(cat.value, currency)}
                                </span>
                            </button>

                            {/* Story 14.14b Session 4: Clickable transaction count pill */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleTransactionCountClick(cat.name);
                                }}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                    isDark
                                        ? 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                }`}
                                aria-label={`${locale === 'es' ? 'Ver' : 'View'} ${cat.count} ${locale === 'es' ? 'transacciones' : 'transactions'}`}
                                data-testid={`transaction-count-pill-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                                <Receipt size={12} />
                                <span>{cat.count}</span>
                            </button>

                            {/* Percentage */}
                            <span
                                className="text-sm font-semibold"
                                style={{ color: legendTextColor }}
                            >
                                {cat.percent}%
                            </span>

                            {/* Drill-down chevron (can drill deeper) */}
                            {canDrillDownFurther && (
                                <button
                                    onClick={() => handleDrillDown(cat.name)}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
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

/** Trend list item component */
const TrendListItem: React.FC<{
    data: TrendData;
    onClick: () => void;
    currency: string;
    theme: 'light' | 'dark';
    locale: string;
    viewMode?: DonutViewMode; // Story 14.14b Session 5: View mode for correct translation
}> = ({ data, onClick, currency, theme, locale, viewMode = 'store-categories' }) => {
    const isDark = theme === 'dark';
    const isPositive = data.change >= 0;
    const countLabel = locale === 'es' ? 'compras' : 'purchases';

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

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
            }`}
            data-testid={`trend-item-${data.name.toLowerCase()}`}
        >
            {/* Category icon */}
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${data.color}20` }}
            >
                {emoji}
            </div>

            {/* Name and count */}
            <div className="flex-1 text-left">
                <div className={`font-medium flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {displayName}
                    {/* Badge showing count of categories inside "Más" group */}
                    {data.categoryCount && (
                        <span
                            className="inline-flex items-center justify-center rounded-full"
                            style={{
                                backgroundColor: 'transparent',
                                border: '1.5px solid var(--text-secondary)',
                                color: 'var(--text-secondary)',
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
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {data.count} {countLabel}
                </div>
            </div>

            {/* Sparkline (simplified) */}
            <div className="w-12 h-6">
                <svg viewBox="0 0 48 24" className="w-full h-full">
                    <path
                        d={`M0 ${24 - (data.sparkline[0] / data.value) * 20}
                            L16 ${24 - (data.sparkline[1] / data.value) * 20}
                            L32 ${24 - (data.sparkline[2] / data.value) * 20}
                            L48 ${24 - (data.sparkline[3] / data.value) * 20}`}
                        fill="none"
                        stroke={data.color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {/* Value and change */}
            <div className="text-right">
                <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatShortCurrency(data.value, currency)}
                </div>
                {/* Story 14.16b: Using semantic colors for trend indicators */}
                <div
                    className="text-xs flex items-center justify-end gap-1"
                    style={{ color: isPositive ? 'var(--negative-primary)' : 'var(--positive-primary)' }}
                >
                    <span>{isPositive ? '↑' : '↓'}</span>
                    <span>{Math.abs(data.change)}%</span>
                </div>
            </div>
        </button>
    );
};

// Note: TimeFilterDropdown component moved to IconFilterBar

// ============================================================================
// Main Component
// ============================================================================

export const TrendsView: React.FC<TrendsViewProps> = ({
    transactions,
    theme,
    colorTheme: _colorTheme,
    currency,
    locale,
    t,
    // Props kept for API compatibility but not used in redesigned view
    onEditTransaction: _onEditTransaction,
    exporting: _exporting = false,
    onExporting: _onExporting,
    onUpgradeRequired: _onUpgradeRequired,
    onNavigateToHistory,
    // Story 14.14b: New props for header consistency
    onBack,
    userName = '',
    userEmail = '',
    onNavigateToView,
    // Story 14.14b: Props for groups in IconFilterBar
    userId = '',
    appId = '',
}) => {
    const isDark = theme === 'dark';
    const prefersReducedMotion = useReducedMotion();
    const carouselRef = useRef<HTMLDivElement>(null);

    // =========================================================================
    // State
    // =========================================================================

    // Story 14.14b: Profile dropdown state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

    // Story 14.14b: Use HistoryFilters context for IconFilterBar and bidirectional sync
    const { state: filterState, dispatch: filterDispatch } = useHistoryFilters();

    // Story 14.14b: Groups hook for IconFilterBar custom groups dropdown
    const { groups, loading: groupsLoading } = useGroups(userId, appId);

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

        // Cascade logic: When switching to a finer granularity, set to first unit of current period
        if (timePeriod === 'year') {
            // From Year: set to first quarter/month/week
            if (newPeriod === 'quarter') {
                adjustedQuarter = 1;
                adjustedMonth = 1;
                adjustedWeek = 1;
            } else if (newPeriod === 'month') {
                adjustedMonth = 1;
                adjustedQuarter = 1;
                adjustedWeek = 1;
            } else if (newPeriod === 'week') {
                adjustedMonth = 1;
                adjustedQuarter = 1;
                adjustedWeek = 1;
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
    const [carouselSlide, setCarouselSlide] = useState<CarouselSlide>(0);

    // Animation trigger key - increments when slide changes to restart animations
    const [animationKey, setAnimationKey] = useState(0);

    // View toggle states (AC #7)
    const [distributionView, setDistributionView] = useState<DistributionView>('treemap');
    const [tendenciaView, setTendenciaView] = useState<TendenciaView>('list');

    // Note: Filter dropdown states moved to IconFilterBar component via HistoryFiltersProvider

    // Story 14.14b: Handle profile navigation
    const handleProfileNavigate = useCallback((view: string) => {
        setIsProfileOpen(false);
        if (onNavigateToView) {
            onNavigateToView(view);
        }
    }, [onNavigateToView]);

    // =========================================================================
    // Computed Data
    // =========================================================================

    // Filter transactions by current period
    const filteredTransactions = useMemo(
        () => filterByPeriod(transactions, timePeriod, currentPeriod),
        [transactions, timePeriod, currentPeriod]
    );

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

    // Reset expanded count when period or view mode changes (data changes)
    useEffect(() => {
        setExpandedCategoryCount(0);
    }, [timePeriod, currentPeriod, donutViewMode]);

    // Story 14.14b: View mode data computations for treemap
    // Aggregate allCategoryData by store category groups
    const storeGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<StoreCategoryGroup, { value: number; count: number }> = {
            'food-dining': { value: 0, count: 0 },
            'health-wellness': { value: 0, count: 0 },
            'retail-general': { value: 0, count: 0 },
            'retail-specialty': { value: 0, count: 0 },
            'automotive': { value: 0, count: 0 },
            'services': { value: 0, count: 0 },
            'hospitality': { value: 0, count: 0 },
            'other': { value: 0, count: 0 },
        };

        for (const cat of allCategoryData) {
            const group = STORE_CATEGORY_GROUPS[cat.name as keyof typeof STORE_CATEGORY_GROUPS] || 'other';
            groupTotals[group].value += cat.value;
            groupTotals[group].count += cat.count;
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
    const itemGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<ItemCategoryGroup, { value: number; transactionIds: Set<string> }> = {
            'food-fresh': { value: 0, transactionIds: new Set() },
            'food-packaged': { value: 0, transactionIds: new Set() },
            'health-personal': { value: 0, transactionIds: new Set() },
            'household': { value: 0, transactionIds: new Set() },
            'nonfood-retail': { value: 0, transactionIds: new Set() },
            'services-fees': { value: 0, transactionIds: new Set() },
            'other-item': { value: 0, transactionIds: new Set() },
        };

        // Aggregate itemCategoriesData into groups using transaction IDs for accurate counting
        for (const item of itemCategoriesData) {
            const itemKey = ITEM_CATEGORY_TO_KEY[item.name as keyof typeof ITEM_CATEGORY_TO_KEY];
            const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
            groupTotals[group].value += item.value;
            // Merge transaction IDs to avoid double-counting
            if (item.transactionIds) {
                item.transactionIds.forEach(id => groupTotals[group].transactionIds.add(id));
            }
        }

        const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

        return ALL_ITEM_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getItemGroupColors(groupKey, theme, mode);
                return {
                    name: groupKey,
                    value: data.value,
                    count: data.transactionIds.size,  // Unique transaction count
                    transactionIds: data.transactionIds,  // Keep for further aggregation
                    color: colors.bg,
                    fgColor: colors.fg,
                    percent: totalValue > 0 ? Math.round((data.value / totalValue) * 100) : 0,
                };
            })
            .filter(g => g.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [itemCategoriesData]);

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

    // Story 14.14b Session 5: Trend data with sparklines - now view-mode-aware
    // Uses viewModeBaseData to generate trends for the selected view mode
    const trendData = useMemo((): TrendData[] => {
        // Get the current period data (viewModeBaseData is already filtered by period)
        return viewModeBaseData.map((cat: CategoryData) => ({
            ...cat,
            sparkline: [
                cat.value * 0.8,
                cat.value * 0.9,
                cat.value * 1.1,
                cat.value
            ],
            change: Math.round((Math.random() - 0.5) * 20), // Placeholder
        }));
    }, [viewModeBaseData]);

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
        setCarouselSlide(prev => (prev === 0 ? 1 : 0));
        setAnimationKey(prev => prev + 1); // Trigger animations on new slide
    }, []);

    const goToNextSlide = useCallback(() => {
        setCarouselSlide(prev => (prev === 1 ? 0 : 1));
        setAnimationKey(prev => prev + 1); // Trigger animations on new slide
    }, []);

    // Toggle view (AC #7)
    const toggleView = useCallback(() => {
        if (carouselSlide === 0) {
            setDistributionView(prev => prev === 'treemap' ? 'donut' : 'treemap');
        } else {
            setTendenciaView(prev => prev === 'list' ? 'breakdown' : 'list');
        }
    }, [carouselSlide]);

    // Handle category drill-down
    const handleCategoryClick = useCallback((category: string) => {
        onNavigateToHistory?.({ category });
    }, [onNavigateToHistory]);

    // Story 14.22: Handle treemap transaction count pill click - navigate to HistoryView with filters
    // Story 14.14b Session 7: Handle "Más" aggregated group by expanding to constituent categories
    const handleTreemapTransactionCountClick = useCallback((categoryName: string) => {
        if (!onNavigateToHistory) return;

        // Build the navigation payload based on view mode
        const payload: HistoryNavigationPayload = {};

        // Check if this is the "Más" aggregated group - expand to constituent categories
        const isAggregatedGroup = categoryName === 'Más' || categoryName === 'More';

        // Set the appropriate filter based on view mode
        if (donutViewMode === 'store-categories') {
            if (isAggregatedGroup && otroCategories.length > 0) {
                // "Más" contains multiple store categories - join them with comma
                payload.category = otroCategories.map(c => c.name).join(',');
            } else {
                // Store category (e.g., "Supermarket", "Restaurant")
                payload.category = categoryName;
            }
        } else if (donutViewMode === 'store-groups') {
            if (isAggregatedGroup && otroCategories.length > 0) {
                // "Más" contains multiple store groups - expand each group and combine
                const allCategories = otroCategories.flatMap(c =>
                    expandStoreCategoryGroup(c.name as StoreCategoryGroup)
                );
                payload.category = allCategories.join(',');
            } else {
                // Store category group (e.g., "Essentials", "Entertainment")
                payload.storeGroup = categoryName;
            }
        } else if (donutViewMode === 'item-groups') {
            if (isAggregatedGroup && otroCategories.length > 0) {
                // "Más" contains multiple item groups - expand each group and combine
                const allItemCategories = otroCategories.flatMap(c =>
                    expandItemCategoryGroup(c.name as ItemCategoryGroup)
                );
                payload.itemCategory = allItemCategories.join(',');
            } else {
                // Item category group (e.g., "Produce", "Beverages")
                payload.itemGroup = categoryName;
            }
        } else if (donutViewMode === 'item-categories') {
            if (isAggregatedGroup && otroCategories.length > 0) {
                // "Más" contains multiple item categories - join them with comma
                payload.itemCategory = otroCategories.map(c => c.name).join(',');
            } else {
                // Item category/subcategory (e.g., "Fruits", "Soft Drinks")
                payload.itemCategory = categoryName;
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

        onNavigateToHistory(payload);
    }, [onNavigateToHistory, donutViewMode, timePeriod, currentPeriod, otroCategories]);

    // Note: Filter dropdown functions moved to IconFilterBar component

    // Swipe navigation for carousel
    const {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        isSwiping: _isSwiping,
        swipeDirection: _swipeDirection,
    } = useSwipeNavigation({
        onSwipeLeft: goToNextSlide,
        onSwipeRight: goToPrevSlide,
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
                                {/* View Toggle Button (AC #7) with icon morphing animation */}
                                <button
                                    onClick={toggleView}
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10"
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
                                            tendenciaView === 'list' ? (
                                                <LayoutGrid size={16} className="transition-opacity duration-150" />
                                            ) : (
                                                <PieChart size={16} className="transition-opacity duration-150" />
                                            )
                                        )}
                                    </span>
                                </button>

                                {/* Story 14.14b Session 5: View mode pills for all carousel slides */}
                                {carouselSlide === 0 || carouselSlide === 1 ? (
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
                                            {/* Animated selection indicator */}
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
                                            {/* View mode pills with icons only */}
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
                                        </div>
                                    </div>
                                ) : (
                                    <span
                                        className="absolute left-1/2 transform -translate-x-1/2 font-semibold"
                                        style={{ color: 'var(--text-primary)' }}
                                        data-testid="carousel-title"
                                    >
                                        {CAROUSEL_TITLES[carouselSlide]}
                                    </span>
                                )}

                                {/* Navigation Arrows */}
                                <div className="flex items-center gap-1 z-10">
                                    <button
                                        onClick={goToPrevSlide}
                                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                                        style={{
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            color: 'var(--text-secondary)',
                                        }}
                                        aria-label="Previous slide"
                                        data-testid="carousel-prev"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={goToNextSlide}
                                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                                        style={{
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                            backgroundColor: 'var(--bg-tertiary)',
                                            color: 'var(--text-secondary)',
                                        }}
                                        aria-label="Next slide"
                                        data-testid="carousel-next"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Carousel Content - Fills remaining height with scroll */}
                            <div
                                ref={carouselRef}
                                className="px-3 pb-1 flex-1 overflow-y-auto min-h-0"
                                data-testid="carousel-content"
                            >
                                {/* Slide 0: Distribution (AC #5) - Treemap matching Dashboard design */}
                                {carouselSlide === 0 && distributionView === 'treemap' && (
                                    <div className="relative flex flex-col">
                                        {/* Story 14.14b Session 5: View mode title above treemap (uppercase to match donut) */}
                                        <div className="text-center pb-2">
                                            <span
                                                className={`text-xs font-semibold uppercase tracking-wider ${
                                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                                }`}
                                                data-testid="treemap-viewmode-title"
                                            >
                                                {locale === 'es'
                                                    ? (donutViewMode === 'store-groups' ? 'Grupos de Compras'
                                                        : donutViewMode === 'store-categories' ? 'Categorías de Compras'
                                                        : donutViewMode === 'item-groups' ? 'Grupos de Productos'
                                                        : 'Categorías de Productos')
                                                    : (donutViewMode === 'store-groups' ? 'Purchase Groups'
                                                        : donutViewMode === 'store-categories' ? 'Purchase Categories'
                                                        : donutViewMode === 'item-groups' ? 'Product Groups'
                                                        : 'Product Categories')
                                                }
                                            </span>
                                        </div>
                                        {/* Story 14.13: Squarified treemap layout - cells sized proportionally */}
                                        {(() => {
                                            // Convert categoryData to treemap items and calculate layout
                                            const treemapItems = categoryDataToTreemapItems(categoryData);
                                            const layout = calculateTreemapLayout(treemapItems);

                                            // Find the largest cell (by area) to mark as main cell for styling
                                            const largestArea = Math.max(...layout.map(r => r.width * r.height));

                                            // Story 14.13: Predictable height based on category count
                                            // Use a step function that increases height at specific category thresholds
                                            // This prevents jumpy resizing when adding/removing categories
                                            const categoryCount = categoryData.length;
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

                                            return (
                                                <div
                                                    className="relative"
                                                    style={{ height: `${dynamicHeight}px` }}
                                                    data-testid="treemap-grid"
                                                >
                                                    {layout.map((rect) => {
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
                                                                onClick={() => handleCategoryClick(cat.name)}
                                                                currency={currency}
                                                                animationKey={animationKey}
                                                                locale={locale}
                                                                t={t}
                                                                viewMode={donutViewMode}
                                                                onTransactionCountClick={handleTreemapTransactionCountClick}
                                                                // Story 14.13: Pass cell dimensions for compact layout detection
                                                                cellWidthPercent={rect.width}
                                                                cellHeightPercent={rect.height}
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

                                        {/* Floating Expand/Collapse buttons - fixed pixel position from top, left aligned */}
                                        <div
                                            className="absolute left-2 z-20 pointer-events-none"
                                            style={{
                                                // Fixed pixel position - buttons stay in place regardless of container height
                                                top: '80px',
                                            }}
                                        >
                                            <div className="flex flex-col gap-2 pointer-events-auto">
                                                {/* Plus button (expand) - on top, always rendered for position stability */}
                                                {/* Story 14.13: More transparent buttons to reduce visual clutter */}
                                                <button
                                                    onClick={() => setExpandedCategoryCount(prev => prev + 1)}
                                                    disabled={!canExpand}
                                                    className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                                                    style={{
                                                        backgroundColor: 'color-mix(in srgb, var(--primary) 40%, transparent)',
                                                        color: 'white',
                                                        opacity: canExpand ? 1 : 0,
                                                        pointerEvents: canExpand ? 'auto' : 'none',
                                                    }}
                                                    aria-label={locale === 'es' ? `Mostrar más (${otroCategories.length} en Otro)` : `Show more (${otroCategories.length} in Other)`}
                                                    data-testid="expand-categories-btn"
                                                >
                                                    <Plus size={18} strokeWidth={2.5} />
                                                    {/* Badge with count - bottom right, semi-transparent */}
                                                    <span
                                                        className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold backdrop-blur-md"
                                                        style={{
                                                            backgroundColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                                                            color: 'white',
                                                        }}
                                                    >
                                                        {otroCategories.length}
                                                    </span>
                                                </button>
                                                {/* Minus button (collapse) - below, always rendered for position stability */}
                                                <button
                                                    onClick={() => setExpandedCategoryCount(prev => Math.max(0, prev - 1))}
                                                    disabled={!canCollapse}
                                                    className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                                                    style={{
                                                        backgroundColor: 'color-mix(in srgb, var(--primary) 40%, transparent)',
                                                        color: 'white',
                                                        opacity: canCollapse ? 1 : 0,
                                                        pointerEvents: canCollapse ? 'auto' : 'none',
                                                    }}
                                                    aria-label={locale === 'es' ? 'Mostrar menos categorías' : 'Show fewer categories'}
                                                    data-testid="collapse-categories-btn"
                                                >
                                                    <Minus size={18} strokeWidth={2.5} />
                                                    {/* Badge with count - bottom right, semi-transparent */}
                                                    <span
                                                        className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold backdrop-blur-md"
                                                        style={{
                                                            backgroundColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
                                                            color: 'white',
                                                        }}
                                                    >
                                                        {expandedCategoryCount}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
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
                                    />
                                )}

                                {/* Slide 1: Tendencia (AC #6) */}
                                {carouselSlide === 1 && tendenciaView === 'list' && (
                                    <div
                                        className="space-y-1 pb-3"
                                        data-testid="trend-list"
                                    >
                                        {trendData.slice(0, 5).map(trend => (
                                            <TrendListItem
                                                key={trend.name}
                                                data={trend}
                                                onClick={() => handleCategoryClick(trend.name)}
                                                currency={currency}
                                                theme={theme}
                                                locale={locale}
                                                viewMode={donutViewMode}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Slide 1: Tendencia - Breakdown view */}
                                {carouselSlide === 1 && tendenciaView === 'breakdown' && (
                                    <div
                                        className="space-y-2 pt-2 pb-3"
                                        data-testid="breakdown-view"
                                    >
                                        {trendData.slice(0, 5).map(trend => {
                                            // Story 14.14b Session 5: Translate name based on view mode
                                            const displayName = (() => {
                                                // "Más" = aggregated small categories group
                                                if (trend.name === 'Más' || trend.name === 'More') {
                                                    return locale === 'es' ? 'Más' : 'More';
                                                }
                                                switch (donutViewMode) {
                                                    case 'store-groups':
                                                        return translateStoreCategoryGroup(trend.name as StoreCategoryGroup, locale as 'en' | 'es');
                                                    case 'item-groups':
                                                        return translateItemCategoryGroup(trend.name as ItemCategoryGroup, locale as 'en' | 'es');
                                                    case 'store-categories':
                                                    case 'item-categories':
                                                    default:
                                                        return translateCategory(trend.name, locale as 'en' | 'es');
                                                }
                                            })();
                                            return (
                                                <div key={trend.name} className="flex items-center gap-3">
                                                    <span
                                                        className="text-sm w-28 truncate flex items-center gap-1"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        {displayName}
                                                        {/* Badge showing count of categories inside "Más" group */}
                                                        {trend.categoryCount && (
                                                            <span
                                                                className="inline-flex items-center justify-center rounded-full flex-shrink-0"
                                                                style={{
                                                                    backgroundColor: 'transparent',
                                                                    border: '1.5px solid var(--text-secondary)',
                                                                    color: 'var(--text-secondary)',
                                                                    fontSize: '9px',
                                                                    fontWeight: 600,
                                                                    minWidth: '16px',
                                                                    height: '16px',
                                                                    padding: '0 3px',
                                                                }}
                                                            >
                                                                {trend.categoryCount}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <div
                                                        className="flex-1 h-6 rounded-full overflow-hidden"
                                                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                                    >
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{
                                                                width: `${trend.percent}%`,
                                                                backgroundColor: trend.color,
                                                            }}
                                                        />
                                                    </div>
                                                    <span
                                                        className="text-sm font-medium w-16 text-right"
                                                        style={{ color: 'var(--text-primary)' }}
                                                    >
                                                        {trend.percent}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                                {[0, 1].map(idx => (
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
                                                ? (idx === 0 ? '0 0 0 12px' : '0 0 12px 0')
                                                : '0',
                                        }}
                                        aria-label={`Go to slide ${idx + 1}: ${CAROUSEL_TITLES[idx]}`}
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

        </PageTransition>
    );
};

export default TrendsView;
