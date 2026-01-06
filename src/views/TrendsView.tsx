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
import { ChevronLeft, ChevronRight, PieChart, LayoutGrid, Plus, Minus, Package } from 'lucide-react';
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
// Story 14.21: Use getCategoryPillColors for charts - ALWAYS colorful regardless of fontColorMode
// Story 14.14b: Category group helpers for donut view mode data transformation
import {
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
    type StoreCategoryGroup,
    type ItemCategoryGroup,
} from '../config/categoryColors';
import { formatCurrency } from '../utils/currency';
import { getCategoryEmoji } from '../utils/categoryEmoji';
import {
    translateCategory,
    translateStoreCategoryGroup,
    translateItemCategoryGroup,
    getStoreCategoryGroupEmoji,
    getItemCategoryGroupEmoji,
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
}

/** Trend data with sparkline */
interface TrendData extends CategoryData {
    sparkline: number[];
    change: number;
}

/** Navigation payload for History view */
export interface HistoryNavigationPayload {
    category?: string;
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
 */
function computeAllCategoryData(transactions: Transaction[]): CategoryData[] {
    const categoryMap: Record<string, { value: number; count: number }> = {};

    transactions.forEach(tx => {
        const cat = tx.category || 'Otro';
        if (!categoryMap[cat]) {
            categoryMap[cat] = { value: 0, count: 0 };
        }
        categoryMap[cat].value += tx.total;
        categoryMap[cat].count += 1;
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
                count: data.count,
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
 */
function computeItemCategoryData(transactions: Transaction[]): CategoryData[] {
    const itemCategoryMap: Record<string, { value: number; count: number }> = {};

    transactions.forEach(tx => {
        // Aggregate line items by their category
        (tx.items || []).forEach(item => {
            const cat = item.category || 'Other';
            if (!itemCategoryMap[cat]) {
                itemCategoryMap[cat] = { value: 0, count: 0 };
            }
            itemCategoryMap[cat].value += item.price * (item.qty || 1);
            itemCategoryMap[cat].count += 1;
        });
    });

    const total = Object.values(itemCategoryMap).reduce((sum, c) => sum + c.value, 0);

    return Object.entries(itemCategoryMap)
        .map(([name, data]) => {
            const pillColors = getCategoryPillColors(name);
            return {
                name,
                value: data.value,
                count: data.count,
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
 */
function computeSubcategoryData(
    transactions: Transaction[],
    itemCategoryFilter?: string
): CategoryData[] {
    const subcategoryMap: Record<string, { value: number; count: number }> = {};

    transactions.forEach(tx => {
        (tx.items || []).forEach(item => {
            // Filter by item category if specified
            if (itemCategoryFilter && item.category !== itemCategoryFilter) {
                return;
            }

            // Use subcategory if available, otherwise skip (we only show items with subcategories)
            const subcat = item.subcategory;
            if (!subcat) return;

            if (!subcategoryMap[subcat]) {
                subcategoryMap[subcat] = { value: 0, count: 0 };
            }
            subcategoryMap[subcat].value += item.price * (item.qty || 1);
            subcategoryMap[subcat].count += 1;
        });
    });

    const total = Object.values(subcategoryMap).reduce((sum, c) => sum + c.value, 0);

    return Object.entries(subcategoryMap)
        .map(([name, data]) => {
            const pillColors = getCategoryPillColors(name);
            return {
                name,
                value: data.value,
                count: data.count,
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

    // Helper to check if category is "Other" (in any language)
    const isOtherCategory = (name: string) => name === 'Otro' || name === 'Other';

    // Separate categories by threshold (excluding any existing "Otro" or "Other")
    const aboveThreshold = allCategories.filter(c => c.percent > 10 && !isOtherCategory(c.name));
    const belowThreshold = allCategories.filter(c => c.percent <= 10 && !isOtherCategory(c.name));

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

    // Find any existing "Other"/"Otro" categories that were in the original data
    const existingOtroCategories = allCategories.filter(c => isOtherCategory(c.name));

    // Calculate "Otro" totals if there are remaining categories OR existing Other/Otro
    if (otroCategories.length > 0 || existingOtroCategories.length > 0) {
        // Include both remaining small categories AND any existing Other/Otro values
        const allOtroCategories = [...otroCategories, ...existingOtroCategories];
        const otroValue = allOtroCategories.reduce((sum, c) => sum + c.value, 0);
        const otroCount = allOtroCategories.reduce((sum, c) => sum + c.count, 0);
        const totalValue = allCategories.reduce((sum, c) => sum + c.value, 0);
        const otroPercent = totalValue > 0 ? Math.round((otroValue / totalValue) * 100) : 0;

        // Story 14.21: Use getCategoryPillColors for "Otro" (ALWAYS colorful for charts)
        const otroColors = getCategoryPillColors('Otro');
        displayCategories.push({
            name: 'Otro',
            value: otroValue,
            count: otroCount,
            color: otroColors.bg,
            fgColor: otroColors.fg,
            percent: otroPercent,
        });
    }

    // Determine expand/collapse state
    const canExpand = otroCategories.length > 0;
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
}> = ({ data, isMainCell, onClick, gridRow, gridColumn, animationKey, locale = 'es', t, viewMode = 'store-categories' }) => {
    // Animated values using useCountUp hook
    const animatedAmount = useCountUp(Math.round(data.value / 1000), { duration: 1200, startValue: 0, key: animationKey });
    const animatedPercent = useCountUp(Math.round(data.percent), { duration: 1200, startValue: 0, key: animationKey });
    const animatedCount = useCountUp(data.count, { duration: 800, startValue: 0, key: animationKey });

    // Circle sizes - responsive: smaller on narrow screens
    // Main cell: 36px, Small cells: 28px (increased from 24px for better readability)
    const circleSize = isMainCell ? 36 : 28;
    const strokeWidth = isMainCell ? 3 : 2;
    // Override font size for small cells to improve readability (default 0.38 multiplier is too small)
    const circleFontSize = isMainCell ? undefined : 11;

    // Story 14.14b Session 5: Get emoji based on view mode
    const emoji = useMemo(() => {
        if (data.name === 'Otro' || data.name === 'Other') {
            return '📁'; // Folder emoji for "Other" category
        }
        switch (viewMode) {
            case 'store-groups':
                return getStoreCategoryGroupEmoji(data.name as StoreCategoryGroup);
            case 'item-groups':
                return getItemCategoryGroupEmoji(data.name as ItemCategoryGroup);
            case 'store-categories':
            case 'item-categories':
            default:
                return getCategoryEmoji(data.name);
        }
    }, [data.name, viewMode]);
    const emojiFontSize = isMainCell ? '16px' : '13px';

    // Story 14.14b Session 5: Translate name based on view mode
    const displayName = useMemo(() => {
        if (data.name === 'Otro' || data.name === 'Other') {
            return t ? t('otherCategory') : 'Otros';
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

    return (
        <button
            key={`${data.name}-${animationKey}`}
            onClick={onClick}
            className="rounded-lg flex flex-col justify-between overflow-hidden text-left transition-transform hover:scale-[0.98] active:scale-95"
            style={{
                backgroundColor: data.color,
                gridRow: gridRow,
                gridColumn: gridColumn,
                padding: isMainCell ? '8px 8px' : '6px 6px',
                // Ensure minimum height when in flex container (scrollable mode)
                minHeight: isMainCell ? undefined : '60px',
                flexShrink: 0,
            }}
            aria-label={`${displayName}: $${animatedAmount}k`}
            data-testid={`treemap-cell-${data.name.toLowerCase()}`}
        >
            {/* Top row: Emoji + Category name */}
            <div className="flex items-center gap-1.5 min-w-0">
                {/* Category emoji (no background - card already has category color) */}
                <span style={{ fontSize: emojiFontSize, lineHeight: 1 }}>{emoji}</span>
                {/* Category name - Story 14.21: Use fgColor for text contrast */}
                <div
                    className="font-bold truncate"
                    style={{
                        fontSize: isMainCell ? '14px' : '11px',
                        color: data.fgColor,
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                >
                    {displayName}
                </div>
            </div>

            {/* Bottom row: Amount + Transaction count pill + Percentage circle */}
            <div className="flex items-center justify-between gap-2">
                {/* Left side: Amount + Transaction count pill */}
                <div className="flex items-center gap-1.5">
                    {/* Animated amount spent - Story 14.21: Use fgColor for text contrast */}
                    <div
                        className="font-bold"
                        style={{
                            fontSize: isMainCell ? '22px' : '14px',
                            color: data.fgColor,
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                    >
                        ${animatedAmount}k
                    </div>
                    {/* Transaction count pill with Package icon */}
                    <span
                        className="inline-flex items-center gap-[2px] px-[4px] py-[1px] rounded-full"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.85)',
                            color: data.fgColor,
                            fontSize: isMainCell ? '11px' : '10px',
                        }}
                    >
                        <Package size={isMainCell ? 11 : 10} strokeWidth={2} />
                        {animatedCount}
                    </span>
                </div>
                {/* Right side: Circular progress with animated percentage - Story 14.21: Use fgColor */}
                <CircularProgress
                    animatedPercent={animatedPercent}
                    size={circleSize}
                    strokeWidth={strokeWidth}
                    fgColor={data.fgColor}
                    fontSize={circleFontSize}
                />
            </div>
        </button>
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
    expandedCount: parentExpandedCount,
    onExpand: parentOnExpand,
    onCollapse: parentOnCollapse,
    transactions,
    onNavigateToHistory,
    viewMode,
    onViewModeReset: _onViewModeReset,
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
    const itemGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<ItemCategoryGroup, { value: number; count: number }> = {
            'food-fresh': { value: 0, count: 0 },
            'food-packaged': { value: 0, count: 0 },
            'health-personal': { value: 0, count: 0 },
            'household': { value: 0, count: 0 },
            'nonfood-retail': { value: 0, count: 0 },
            'services-fees': { value: 0, count: 0 },
            'other-item': { value: 0, count: 0 },
        };

        // Aggregate itemCategoriesData into groups
        for (const item of itemCategoriesData) {
            const itemKey = ITEM_CATEGORY_TO_KEY[item.name as keyof typeof ITEM_CATEGORY_TO_KEY];
            const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
            groupTotals[group].value += item.value;
            groupTotals[group].count += item.count;
        }

        const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

        return ALL_ITEM_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getItemGroupColors(groupKey, theme, mode);
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
    const handleTransactionCountClick = useCallback((categoryName: string) => {
        if (!onNavigateToHistory) return;

        // Determine the store category to filter by based on viewMode and drill-down path
        // The goal is to show transactions matching the current context
        let storeCategory: string | undefined;

        if (viewMode === 'store-categories' && drillDownLevel === 0) {
            // At store categories level - filter by this store category
            storeCategory = categoryName;
        } else if (viewMode === 'store-groups' && drillDownLevel === 1) {
            // Viewing store categories within a group - filter by this store category
            storeCategory = categoryName;
        } else if (viewMode === 'store-categories' && drillDownLevel >= 1 && drillDownPath[0]) {
            // Drilled down from store category - filter by parent store category
            storeCategory = drillDownPath[0];
        } else if (viewMode === 'store-groups' && drillDownLevel >= 2 && drillDownPath[1]) {
            // Drilled down from store group > store category - filter by store category
            storeCategory = drillDownPath[1];
        }
        // Story 14.14b Session 5: For item-groups/item-categories views
        // Currently, the filter system doesn't support item category filtering
        // Navigate without filters to show all transactions
        // TODO: Extend HistoryNavigationPayload to support itemCategory filter in future story

        onNavigateToHistory({ category: storeCategory });
    }, [onNavigateToHistory, viewMode, drillDownLevel, drillDownPath]);

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
                    const isOtro = cat.name === 'Otro' || cat.name === 'Other' || cat.name === 'other' || cat.name === 'other-item';

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

                    // Story 14.14b: Can drill down if not Otro and not at max level
                    // For item categories, also check if subcategories exist
                    const maxLevel = getMaxDrillDownLevel();
                    let canDrillDownFurther = !isOtro && drillDownLevel < maxLevel;

                    // If showing item categories, only allow drill-down if subcategories exist
                    if (canDrillDownFurther && isShowingItemCategories) {
                        canDrillDownFurther = hasSubcategories(cat.name);
                    }

                    if (isShowingStoreGroups) {
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
                        emoji = getCategoryEmoji(cat.name);
                    } else {
                        // Subcategories (deepest level) - use as-is
                        displayName = cat.name;
                        emoji = '📄';
                    }

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
                                <span className={`text-sm font-medium truncate ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                }`}>
                                    {displayName}
                                </span>
                                <span className={`text-xs ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
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
                                <Package size={12} />
                                <span>{cat.count}</span>
                            </button>

                            {/* Percentage */}
                            <span className={`text-sm font-semibold ${
                                isDark ? 'text-slate-300' : 'text-slate-600'
                            }`}>
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
        if (data.name === 'Otro' || data.name === 'Other') {
            return '📁';
        }
        switch (viewMode) {
            case 'store-groups':
                return getStoreCategoryGroupEmoji(data.name as StoreCategoryGroup);
            case 'item-groups':
                return getItemCategoryGroupEmoji(data.name as ItemCategoryGroup);
            case 'store-categories':
            case 'item-categories':
            default:
                return getCategoryEmoji(data.name);
        }
    }, [data.name, viewMode]);

    // Story 14.14b Session 5: Translate name based on view mode
    const displayName = useMemo(() => {
        if (data.name === 'Otro' || data.name === 'Other') {
            return locale === 'es' ? 'Otros' : 'Other';
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
                <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {displayName}
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
    const [timePeriod, setTimePeriodLocal] = useState<TimePeriod>('month');

    // Current period navigation (AC #3)
    const now = new Date();
    const [currentPeriod, setCurrentPeriodLocal] = useState<CurrentPeriod>({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        quarter: Math.ceil((now.getMonth() + 1) / 3),
        week: Math.ceil(now.getDate() / 7),
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
    const setTimePeriod = useCallback((newPeriod: TimePeriod) => {
        setTimePeriodLocal(newPeriod);

        // Don't dispatch if we're updating from context
        if (isUpdatingFromContext.current) return;

        // Dispatch to context based on new period type
        const yearStr = String(currentPeriod.year);
        const monthStr = `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, '0')}`;
        const quarterStr = `Q${currentPeriod.quarter}`;

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
                filterDispatch({ type: 'SET_TEMPORAL_FILTER', payload: buildWeekFilter(yearStr, monthStr, currentPeriod.week) });
                break;
        }
    }, [currentPeriod, filterDispatch]);

    const setCurrentPeriod = useCallback((updater: CurrentPeriod | ((prev: CurrentPeriod) => CurrentPeriod)) => {
        setCurrentPeriodLocal(prev => {
            const newPeriod = typeof updater === 'function' ? updater(prev) : updater;

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
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('boletapp-analytics-viewmode');
            if (saved && ['store-groups', 'store-categories', 'item-groups', 'item-categories'].includes(saved)) {
                return saved as DonutViewMode;
            }
        }
        return 'store-categories';
    });

    // Story 14.14b Session 6: Wrapped setter that handles persistence and category filter sync
    const setDonutViewMode = useCallback((newMode: DonutViewMode) => {
        setDonutViewModeLocal(newMode);

        // Persist to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('boletapp-analytics-viewmode', newMode);
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
    const itemGroupsData = useMemo((): CategoryData[] => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<ItemCategoryGroup, { value: number; count: number }> = {
            'food-fresh': { value: 0, count: 0 },
            'food-packaged': { value: 0, count: 0 },
            'health-personal': { value: 0, count: 0 },
            'household': { value: 0, count: 0 },
            'nonfood-retail': { value: 0, count: 0 },
            'services-fees': { value: 0, count: 0 },
            'other-item': { value: 0, count: 0 },
        };

        for (const item of itemCategoriesData) {
            const itemKey = ITEM_CATEGORY_TO_KEY[item.name as keyof typeof ITEM_CATEGORY_TO_KEY];
            const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
            groupTotals[group].value += item.value;
            groupTotals[group].count += item.count;
        }

        const totalValue = Object.values(groupTotals).reduce((sum, g) => sum + g.value, 0);

        return ALL_ITEM_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getItemGroupColors(groupKey, theme, mode);
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
                <div className="px-4 pt-1 pb-0">
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
                            return (
                                <button
                                    key={period}
                                    onClick={() => setTimePeriod(period)}
                                    className="relative z-10 flex-1 px-3 py-2 rounded-full text-sm font-medium transition-colors"
                                    style={{
                                        color: isActive ? 'white' : 'var(--text-secondary)',
                                    }}
                                    aria-pressed={isActive}
                                    data-testid={`time-pill-${period}`}
                                >
                                    {locale === 'es' ? labels[period].es : labels[period].en}
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
                                        {/* Outer container pill */}
                                        <div
                                            className="relative flex items-center justify-center rounded-full px-1"
                                            style={{
                                                backgroundColor: 'var(--bg-tertiary, #f1f5f9)',
                                                height: '32px', // Slightly taller to contain inner pills
                                                border: '1px solid var(--border-light, #e2e8f0)',
                                            }}
                                            role="tablist"
                                            aria-label="View mode selection"
                                            data-testid="viewmode-pills-container"
                                        >
                                            {/* Animated selection indicator */}
                                            <div
                                                className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out ${
                                                    prefersReducedMotion ? '' : 'transform'
                                                }`}
                                                style={{
                                                    width: '28px',
                                                    left: donutViewMode === 'store-groups' ? '4px' :
                                                          donutViewMode === 'store-categories' ? 'calc(4px + 32px)' :
                                                          donutViewMode === 'item-groups' ? 'calc(4px + 64px)' :
                                                          'calc(4px + 96px)',
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
                                                            width: '32px',
                                                            height: '28px',
                                                        }}
                                                        aria-pressed={isActive}
                                                        aria-label={locale === 'es' ? mode.labelEs : mode.labelEn}
                                                        title={locale === 'es' ? mode.labelEs : mode.labelEn}
                                                        data-testid={`viewmode-pill-${mode.value}`}
                                                    >
                                                        <span
                                                            className="text-sm transition-all"
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
                                    <div className="relative flex flex-col h-full">
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
                                        {/* Dynamic treemap grid - expands based on category count */}
                                        {(() => {
                                            // Calculate grid layout based on number of categories
                                            const rightColumnCount = categoryData.length - 1;
                                            // Use 2-column layout: main cell on left, stacked cells on right
                                            // When more than 4 categories, allow scrolling in right column
                                            const showScrollableGrid = rightColumnCount > 4;
                                            const displayedRightCount = showScrollableGrid ? rightColumnCount : Math.max(rightColumnCount, 1);

                                            return (
                                                <div
                                                    className="grid gap-1 flex-1"
                                                    style={{
                                                        gridTemplateColumns: '1fr 1fr',
                                                        gridTemplateRows: showScrollableGrid
                                                            ? '1fr'
                                                            : `repeat(${displayedRightCount}, 1fr)`,
                                                    }}
                                                    data-testid="treemap-grid"
                                                >
                                                    {/* Main cell (left column) - spans all rows with animated values */}
                                                    {categoryData.length > 0 && (
                                                        <AnimatedTreemapCell
                                                            key={`main-${animationKey}`}
                                                            data={categoryData[0]}
                                                            isMainCell={true}
                                                            onClick={() => handleCategoryClick(categoryData[0].name)}
                                                            currency={currency}
                                                            gridRow={showScrollableGrid ? '1' : `1 / ${displayedRightCount + 1}`}
                                                            gridColumn="1"
                                                            animationKey={animationKey}
                                                            locale={locale}
                                                            t={t}
                                                            viewMode={donutViewMode}
                                                        />
                                                    )}
                                                    {/* Right column - scrollable container when many categories */}
                                                    {showScrollableGrid ? (
                                                        <div
                                                            className="flex flex-col gap-1 overflow-y-auto"
                                                        >
                                                            {categoryData.slice(1).map((cat) => (
                                                                <AnimatedTreemapCell
                                                                    key={`${cat.name}-${animationKey}`}
                                                                    data={cat}
                                                                    isMainCell={false}
                                                                    onClick={() => handleCategoryClick(cat.name)}
                                                                    currency={currency}
                                                                    animationKey={animationKey}
                                                                    locale={locale}
                                                                    t={t}
                                                                    viewMode={donutViewMode}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        // Normal grid layout for ≤4 categories
                                                        categoryData.slice(1).map((cat, idx) => (
                                                            <AnimatedTreemapCell
                                                                key={`${cat.name}-${animationKey}`}
                                                                data={cat}
                                                                isMainCell={false}
                                                                onClick={() => handleCategoryClick(cat.name)}
                                                                currency={currency}
                                                                gridRow={`${idx + 1} / ${idx + 2}`}
                                                                gridColumn="2"
                                                                animationKey={animationKey}
                                                                locale={locale}
                                                                t={t}
                                                                viewMode={donutViewMode}
                                                            />
                                                        ))
                                                    )}
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
                                                <button
                                                    onClick={() => setExpandedCategoryCount(prev => prev + 1)}
                                                    disabled={!canExpand}
                                                    className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                                                    style={{
                                                        backgroundColor: 'color-mix(in srgb, var(--primary) 70%, transparent)',
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
                                                            backgroundColor: 'color-mix(in srgb, var(--primary) 50%, transparent)',
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
                                                        backgroundColor: 'color-mix(in srgb, var(--primary) 70%, transparent)',
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
                                                            backgroundColor: 'color-mix(in srgb, var(--primary) 50%, transparent)',
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
                                        expandedCount={expandedCategoryCount}
                                        onExpand={() => setExpandedCategoryCount(prev => prev + 1)}
                                        onCollapse={() => setExpandedCategoryCount(prev => Math.max(0, prev - 1))}
                                        transactions={filteredTransactions}
                                        onNavigateToHistory={onNavigateToHistory}
                                        viewMode={donutViewMode}
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
                                                if (trend.name === 'Otro' || trend.name === 'Other') {
                                                    return locale === 'es' ? 'Otros' : 'Other';
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
                                                        className="text-sm w-24 truncate"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        {displayName}
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
