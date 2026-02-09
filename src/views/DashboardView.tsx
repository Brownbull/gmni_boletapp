/**
 * DashboardView - Home Dashboard
 *
 * Story 14.12: Home Dashboard Refresh
 * Epic 14: Core Implementation
 *
 * Redesigned home screen matching home-dashboard.html mockup:
 * - "Este Mes" treemap visualization with category breakdown
 * - Month/year navigation arrows
 * - "Recientes" expandable transaction list
 * - PageTransition + TransitionChild for staggered entry
 *
 * Previous functionality retained:
 * - Transaction filtering (Story 10a.1)
 * - Sort controls (Story 11.1)
 * - Duplicate detection (Story 10a.1)
 * - Image viewer (Story 9.11)
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Inbox, ArrowUpDown, Filter, ChevronLeft, ChevronRight, Receipt, Package, X, Trash2, CheckSquare } from 'lucide-react';
import { ImageViewer } from '../components/ImageViewer';
// Story 10a.1: Filter bar for consolidated home view (AC #2)
import { HistoryFilterBar } from '../components/history/HistoryFilterBar';
// Story 14.15b: Selection mode and modals for Dashboard
// Story 14e-5: DeleteTransactionsModal now uses Modal Manager
import type { TransactionPreview } from '../components/history/DeleteTransactionsModal';
import { useModalActions } from '@managers/ModalManager';
import { useSelectionMode } from '../hooks/useSelectionMode';
import { deleteTransactionsBatch } from '../services/firestore';
import { getFirestore } from 'firebase/firestore';
// Story 14d-v2-1.1: useQueryClient import removed - group cache invalidation disabled (Epic 14c cleanup)
// Story 14c-refactor.4: clearGroupCacheById import REMOVED (IndexedDB cache deleted)
// Story 9.12: Category translations
// Story 14e-25b.2: Language type now comes from hook (useDashboardViewData)
import { translateCategory } from '../utils/categoryTranslations';
// Story 10a.1: Filter and duplicate detection utilities (AC #2, #4)
import { useHistoryFilters } from '../hooks/useHistoryFilters';
import { getDuplicateIds } from '../services/duplicateDetectionService';
import {
    extractAvailableFilters,
    filterTransactionsByHistoryFilters,
} from '../utils/historyFilterUtils';
import type { Transaction as TransactionType } from '../types/transaction';
// Story 14.12: Animation framework imports
import { PageTransition } from '../components/animation/PageTransition';
import { TransitionChild } from '../components/animation/TransitionChild';
import { useCountUp } from '../hooks/useCountUp';
import { useReducedMotion } from '../hooks/useReducedMotion';
// Story 14.21: Use unified category colors (both fg and bg for text contrast)
// getCategoryColorsAuto - respects fontColorMode (colorful/plain) for general text
// getCategoryPillColors - ALWAYS colorful for pills/badges/legends
// Story 14.13 Session 4: Added imports for view mode groups and item categories
import {
    getCategoryColorsAuto,
    getCategoryBackgroundAuto,
    getCategoryPillColors,
    getStoreGroupColors,
    getItemGroupColors,
    getCurrentTheme,
    getCurrentMode,
    ALL_STORE_CATEGORY_GROUPS,
    ALL_ITEM_CATEGORY_GROUPS,
    STORE_CATEGORY_GROUPS,
    ITEM_CATEGORY_GROUPS,
    ITEM_CATEGORY_TO_KEY,
    expandStoreCategoryGroup,  // Story 14.13 Session 13: For "Más" expansion
    expandItemCategoryGroup,   // Story 14.13 Session 13: For "Más" expansion
    type StoreCategoryGroup,
    type ItemCategoryGroup,
    // Story 14e-25b.2: ThemeName type now comes from hook (useDashboardViewData)
} from '../config/categoryColors';
import { getCategoryEmoji } from '../utils/categoryEmoji';
// Story 14.13 Session 4: Category translations for view mode labels
import {
    translateStoreCategoryGroup,
    translateItemCategoryGroup,
    getStoreCategoryGroupEmoji,
    getItemCategoryGroupEmoji,
    getItemCategoryEmoji,
} from '../utils/categoryTranslations';
// Story 14.15b: Category normalization for legacy data compatibility
import { normalizeItemCategory } from '../utils/categoryNormalizer';
// Story 14.13: Import normalizeItemNameForGrouping for consistent unique product counting
import { normalizeItemNameForGrouping } from '../hooks/useItems';
import { calculateTreemapLayout } from '../utils/treemapLayout';
// Story 14.13 Session 4: Navigation payload for treemap cell clicks
import { HistoryNavigationPayload, DrillDownPath } from '../utils/analyticsToHistoryFilters';
// Story 14e-25d: Direct navigation hooks (ViewHandlersContext deleted)
import { useHistoryNavigation } from '@/shared/hooks';
import { useNavigationActions } from '@/shared/stores';
// Story 14e-25b.2: DashboardView data hook
import { useDashboardViewData, type UseDashboardViewDataReturn } from './DashboardView/useDashboardViewData';
// Story 14.15b: Use consolidated TransactionCard from shared transactions folder
import { TransactionCard } from '../components/transactions';
// Story 14.12: Radar chart uses inline SVG (matching mockup hexagonal design)

// Story 11.1: Sort type for dashboard transactions
type SortType = 'transactionDate' | 'scanDate';

// Story 9.11: Extended transaction interface with v2.6.0 fields for unified display
interface Transaction {
    id: string;
    merchant: string;
    alias?: string;
    date: string;
    total: number;
    category: string;
    imageUrls?: string[];
    thumbnailUrl?: string;
    items?: Array<{
        name: string;
        price: number;
        category?: string;
        subcategory?: string;
    }>;
    // v2.6.0 fields for unified card display
    time?: string;
    city?: string;
    country?: string;
    currency?: string;
    // Story 11.1: createdAt for sort by scan date
    createdAt?: any; // Firestore Timestamp or Date
}

/**
 * Story 14e-25b.2: DashboardView Props
 *
 * DashboardView now owns its data via useDashboardViewData hook.
 * Props are minimal - only test overrides for testing and callbacks
 * that need App-level state coordination.
 */
export interface DashboardViewProps {
    /**
     * Optional overrides for testing and production callbacks.
     * In production, App.tsx passes callbacks that need App-level coordination.
     * In tests, can inject mock data without needing to mock hooks.
     */
    _testOverrides?: Partial<UseDashboardViewDataReturn & {
        /** Callback when transactions are deleted */
        onTransactionsDeleted?: (deletedIds: string[]) => void;
    }>;
}

// Story 14.12: Number of recent transactions to show (collapsed/expanded)
const RECENT_TRANSACTIONS_COLLAPSED = 5;
const RECENT_TRANSACTIONS_EXPANDED = 10;

// Story 14.12: Carousel slide configuration
type CarouselSlide = 0 | 1 | 2;
// CAROUSEL_TITLES keys for translation lookup
const CAROUSEL_TITLE_KEYS = ['thisMonthCarousel', 'monthToMonth', 'lastFourMonths'] as const;

/**
 * Story 14.13 Session 4: Treemap view mode - controls what data level is displayed
 * - 'store-groups': Transaction category groups (Food & Dining, Health & Wellness, etc.)
 * - 'store-categories': Transaction categories (Supermercado, Restaurante, etc.) - DEFAULT
 * - 'item-groups': Item category groups (Fresh Food, Packaged Food, etc.)
 * - 'item-categories': Item categories (Carnes y Mariscos, Lácteos, etc.)
 */
type TreemapViewMode = 'store-groups' | 'store-categories' | 'item-groups' | 'item-categories';

// Story 14.13 Session 4: View mode configuration for pill selector
const VIEW_MODE_CONFIG: Array<{
    value: TreemapViewMode;
    emoji: string;
    labelEs: string;
    labelEn: string;
}> = [
    { value: 'store-groups', emoji: '🏪', labelEs: 'Grupos de Compras', labelEn: 'Purchase Groups' },
    { value: 'store-categories', emoji: '🛒', labelEs: 'Categorías de Compras', labelEn: 'Purchase Categories' },
    { value: 'item-groups', emoji: '📦', labelEs: 'Grupos de Productos', labelEn: 'Product Groups' },
    { value: 'item-categories', emoji: '🏷️', labelEs: 'Categorías de Productos', labelEn: 'Product Categories' },
];

// Story 14.21: Get category colors for treemap using unified color system
// Returns both bg (background) and fg (text) colors for proper contrast
const getTreemapColors = (category: string): { bg: string; fg: string } => {
    const colors = getCategoryColorsAuto(category);
    return { bg: colors.bg, fg: colors.fg };
};

// Story 14.12: Month translation keys (short and full)
const MONTH_SHORT_KEYS = [
    'monthJan', 'monthFeb', 'monthMar', 'monthApr', 'monthMay', 'monthJun',
    'monthJul', 'monthAug', 'monthSep', 'monthOct', 'monthNov', 'monthDec'
] as const;

// Story 14.12: Circular progress ring component for percentage display with text inside
// Story 14.21: Added fgColor prop for proper contrast with unified colors
interface CircularProgressProps {
    animatedPercent: number;
    size: number;
    strokeWidth: number;
    fontSize?: number;
    /** Foreground color for stroke and text (defaults to white for backwards compat) */
    fgColor?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ animatedPercent, size, strokeWidth, fontSize, fgColor = 'white' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (animatedPercent / 100) * circumference;
    // Default font size based on circle size (0.38 multiplier for better readability)
    const textSize = fontSize || Math.round(size * 0.38);
    // Story 14.21: Calculate semi-transparent version of fgColor for background ring
    const bgRingColor = fgColor === 'white' ? 'rgba(255,255,255,0.3)' : `${fgColor}33`; // 33 = 20% opacity in hex

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle (soft color - fg with low opacity) */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={bgRingColor}
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle (bold fg color) */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={fgColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                        transition: 'stroke-dashoffset 0.05s ease-out'
                    }}
                />
            </svg>
            {/* Percentage text centered inside with % sign */}
            <span
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${textSize}px`,
                    fontWeight: 600,
                    color: fgColor,
                    lineHeight: 1
                }}
            >
                {animatedPercent}%
            </span>
        </div>
    );
};

// Story 14.12: Animated treemap card with count-up effect and circular progress
// Story 14.21: Updated to use both bg and fg colors for proper contrast
// Story 14.14: Category emoji in top row, transaction count moved to bottom right
// Story 14.13 Session 13: Added categoryCount for "Más" aggregated group badge
interface AnimatedTreemapCardProps {
    cat: { name: string; amount: number; percent: number; count: number; itemCount: number; bgColor: string; fgColor: string; categoryCount?: number };
    displayName: string; // Translated category name
    isMainCell: boolean;
    gridRow?: string;
    gridColumn?: string;
    animationKey: number;
    getValueFontSize: (percent: number, isMainCell: boolean) => string;
    style?: React.CSSProperties; // Story 14.13: Support squarified treemap absolute positioning
    emoji?: string; // Story 14.13 Session 4: Optional emoji override for view mode
    onClick?: () => void; // Story 14.13 Session 4: Click handler for category navigation
    iconType?: 'receipt' | 'package'; // Story 14.13 Session 10: Receipt for transactions, Package for items
    countMode?: 'transactions' | 'items'; // Story 14.13 Session 10: Which count to display
}

const AnimatedTreemapCard: React.FC<AnimatedTreemapCardProps> = ({
    cat,
    displayName,
    isMainCell,
    gridRow,
    gridColumn,
    animationKey,
    getValueFontSize,
    style,
    emoji: emojiProp,
    onClick,
    iconType = 'receipt', // Story 14.13 Session 10: Default to receipt icon
    countMode = 'transactions', // Story 14.13 Session 10: Default to transactions
}) => {
    // Pass animationKey to useCountUp to re-trigger animation when carousel slides
    const animatedAmount = useCountUp(Math.round(cat.amount / 1000), { duration: 1200, startValue: 0, key: animationKey });
    const animatedPercent = useCountUp(Math.round(cat.percent), { duration: 1200, startValue: 0, key: animationKey });
    // Story 14.13 Session 10: Display itemCount when in items mode, otherwise transaction count
    const displayCount = countMode === 'items' ? (cat.itemCount || 0) : cat.count;
    const animatedCount = useCountUp(displayCount, { duration: 800, startValue: 0, key: animationKey });

    // Story 14.13 Session 8: Get text color at render time respecting fontColorMode setting
    // getCategoryColorsAuto returns plain text (black/white) when fontColorMode is 'plain'
    // and category-specific colors when fontColorMode is 'colorful'
    // This matches the TrendsView pattern and ensures reactivity to settings changes
    const textColors = getCategoryColorsAuto(cat.name);
    const textColor = textColors.fg;

    // Circle sizes - responsive: smaller on narrow screens
    // Main cell: 36px, Small cells: 28px (increased from 24px for better readability)
    const circleSize = isMainCell ? 36 : 28;
    const strokeWidth = isMainCell ? 3 : 2;
    // Override font size for small cells to improve readability (default 0.38 multiplier is too small)
    const circleFontSize = isMainCell ? undefined : 11;

    // Story 14.14: Get category emoji for display
    // Story 14.13 Session 4: Use provided emoji prop if available, otherwise fallback to getCategoryEmoji
    const emoji = emojiProp ?? getCategoryEmoji(cat.name);
    const emojiFontSize = isMainCell ? '16px' : '13px';

    return (
        <div
            key={`${cat.name}-${animationKey}`}
            className="rounded-lg flex flex-col justify-between overflow-hidden cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all"
            style={{
                backgroundColor: cat.bgColor,
                gridRow: gridRow,
                gridColumn: gridColumn,
                minHeight: 0,
                // Compact padding for mobile screens
                padding: isMainCell ? '8px 8px' : '6px 6px',
                // Story 14.13: Merge with passed style for squarified treemap positioning
                ...style,
            }}
            // Story 14.13 Session 4: Handle click for category navigation
            onClick={(e) => {
                e.stopPropagation(); // Prevent triggering parent treemap click
                onClick?.();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >
            {/* Top row: Emoji + Category name (+ categoryCount badge for "Más") */}
            {/* Story 14.13: Unified layout for squarified treemap cells */}
            {/* Story 14.13 Session 13: Added categoryCount badge for "Más" aggregated group */}
            <div className="flex items-center gap-1.5 min-w-0">
                <span style={{ fontSize: emojiFontSize, lineHeight: 1 }}>{emoji}</span>
                {/* Story 14.37: Category name scales with font size setting */}
                <div className="font-bold truncate flex items-center gap-1" style={{ fontSize: isMainCell ? 'var(--font-size-sm)' : 'var(--font-size-xs)', color: textColor, lineHeight: 1.2 }}>
                    {displayName}
                    {/* Badge showing count of categories inside "Más" group */}
                    {cat.categoryCount && (
                        <span
                            className="inline-flex items-center justify-center rounded-full flex-shrink-0"
                            style={{
                                backgroundColor: 'transparent',
                                border: `1.5px solid ${textColor}`,
                                color: textColor,
                                fontSize: isMainCell ? '10px' : '9px',
                                fontWeight: 600,
                                minWidth: isMainCell ? '18px' : '16px',
                                height: isMainCell ? '18px' : '16px',
                                padding: '0 3px',
                            }}
                        >
                            {cat.categoryCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Bottom section: Count + Amount (left), Percentage circle (bottom right) */}
            {/* Story 14.13 Session 5: Receipt icon for transactions, Package icon for items */}
            <div className="flex items-end justify-between">
                {/* Left side: count above amount */}
                <div className="flex flex-col gap-0.5">
                    {/* Count pill - Receipt for transactions, Package for items */}
                    <span
                        className="inline-flex items-center gap-[2px] px-[5px] py-[1px] rounded-full self-start"
                        style={{
                            backgroundColor: 'var(--bg)',
                            color: textColor,
                            fontSize: isMainCell ? '11px' : '10px',
                        }}
                    >
                        {iconType === 'package' ? (
                            <Package size={isMainCell ? 11 : 10} strokeWidth={2} />
                        ) : (
                            <Receipt size={isMainCell ? 11 : 10} strokeWidth={2} />
                        )}
                        {animatedCount}
                    </span>
                    {/* Amount - left aligned below count */}
                    <div className="font-bold" style={{ fontSize: getValueFontSize(cat.percent, isMainCell), color: textColor, lineHeight: 1 }}>
                        ${animatedAmount}k
                    </div>
                </div>
                {/* Right side: Percentage circle - bottom right */}
                <CircularProgress
                    animatedPercent={animatedPercent}
                    size={circleSize}
                    strokeWidth={strokeWidth}
                    fontSize={circleFontSize}
                    fgColor={textColor}
                />
            </div>
        </div>
    );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ _testOverrides }) => {
    // Story 14e-25b.2: Get all data from internal hook
    const hookData = useDashboardViewData();

    // Merge hook data with test overrides (test overrides take precedence)
    // Pattern: HistoryView lines 186-209
    const {
        transactions,
        allTransactions,
        recentScans,
        userId,
        appId,
        theme,
        colorTheme,
        fontColorMode: _fontColorMode,
        lang,
        currency,
        dateFormat,
        defaultCountry,
        foreignLocationFormat,
        t,
        formatCurrency,
        formatDate,
        getSafeDate: _getSafeDate,
        sharedGroups: _sharedGroups,
        onCreateNew: _onCreateNew,
        onViewTrends,
        onEditTransaction,
        onTriggerScan: _onTriggerScan,
        onViewRecentScans,
    } = { ...hookData, ..._testOverrides };

    // Extract onTransactionsDeleted from overrides (not in hook)
    const onTransactionsDeleted = _testOverrides?.onTransactionsDeleted;

    // Story 7.12: Theme-aware styling using CSS variables (AC #1, #2, #8)
    const isDark = theme === 'dark';

    // Story 14e-25d: Direct navigation hooks (ViewHandlersContext deleted)
    const { handleNavigateToHistory } = useHistoryNavigation();
    const { setView } = useNavigationActions();
    const onNavigateToHistory = handleNavigateToHistory;
    // Story 14e-25b.2: onViewHistory from navigation (fallback for "Ver todo")
    const onViewHistory = () => setView('history');

    // Story 14.12: Reduced motion preference (available for future use)
    useReducedMotion();

    // Story 9.11: State for ImageViewer modal
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Story 14.12: Selected month/year for viewing data
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });

    // Story 14.12: Expanded state for recientes list
    const [recientesExpanded, setRecientesExpanded] = useState(false);
    // Story 14.12: Recientes carousel state (0 = by scan date, 1 = by transaction date)
    const [recientesSlide, setRecientesSlide] = useState<0 | 1>(0);
    // Story 14.12: Slide direction for recientes carousel transition animation
    const [recientesSlideDirection, setRecientesSlideDirection] = useState<'left' | 'right' | null>(null);
    // Story 14.12: Animation key for recientes - increments to re-trigger staggered item animations
    const [recientesAnimKey, setRecientesAnimKey] = useState(0);
    // Story 14.12: Swipe tracking for recientes carousel
    const [recientesTouchStart, setRecientesTouchStart] = useState<number | null>(null);
    const [recientesTouchEnd, setRecientesTouchEnd] = useState<number | null>(null);

    // Story 14.12: Carousel state (3 slides: treemap, polygon, bump chart)
    const [carouselSlide, setCarouselSlide] = useState<CarouselSlide>(0);
    const [carouselCollapsed] = useState(false); // Toggle function removed, but state still used for layout
    // Story 14.13 Session 4: Treemap view mode state - persisted to localStorage
    // Story 14.13 Session 9: Synced with Analytics view using shared localStorage key
    const [treemapViewMode, setTreemapViewMode] = useState<TreemapViewMode>(() => {
        // Restore from localStorage if available (shared with TrendsView for sync)
        try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.getItem) {
                const saved = localStorage.getItem('boletapp-analytics-viewmode');
                if (saved && ['store-groups', 'store-categories', 'item-groups', 'item-categories'].includes(saved)) {
                    return saved as TreemapViewMode;
                }
            }
        } catch {
            // localStorage not available (e.g., SSR or test environment)
        }
        return 'store-categories';
    });

    // Story 14.13 Session 9: Persist view mode to localStorage (shared with TrendsView)
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.setItem) {
                localStorage.setItem('boletapp-analytics-viewmode', treemapViewMode);
            }
        } catch {
            // localStorage not available
        }
    }, [treemapViewMode]);

    // Story 14.13 Session 10: Count mode toggle - transactions vs items (synced with TrendsView)
    // 'transactions' = count transactions, navigate to Compras (Receipt icon)
    // 'items' = count items/products, navigate to Productos (Package icon)
    const [countMode, setCountMode] = useState<'transactions' | 'items'>(() => {
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
        return 'transactions';
    });

    // Story 14.13 Session 10: Persist count mode to localStorage (shared with TrendsView)
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined' && localStorage?.setItem) {
                localStorage.setItem('boletapp-analytics-countmode', countMode);
            }
        } catch {
            // localStorage not available
        }
    }, [countMode]);

    // Story 14.13 Session 10: Toggle count mode between transactions and items
    const toggleCountMode = useCallback(() => {
        setCountMode(prev => prev === 'transactions' ? 'items' : 'transactions');
    }, []);

    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const monthPickerRef = useRef<HTMLDivElement>(null);
    const monthPickerToggleRef = useRef<HTMLButtonElement>(null);
    // Story 14.12: Tooltip for transaction count badge
    const [showCountTooltip, setShowCountTooltip] = useState(false);
    // Story 14.12: Radar tooltip state (shows category name + amounts on click)
    // Story 14.12: Selected radar category for comparison display
    const [selectedRadarCategory, setSelectedRadarCategory] = useState<{
        name: string;
        emoji: string;
        currAmount: number;
        prevAmount: number;
        color: string;
    } | null>(null);
    // Story 14.12: Bump chart tooltip state (shows category + month + amount on click)
    const [bumpTooltip, setBumpTooltip] = useState<{ category: string; month: string; amount: number; color: string } | null>(null);
    // Story 14.12: Slide direction for carousel transition animation
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    // Story 14.12: Swipe gesture tracking for carousel with live animation
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [carouselSwipeOffset, setCarouselSwipeOffset] = useState(0);
    // Story 14.13: Month swipe navigation touch state with live animation
    const [monthTouchStart, setMonthTouchStart] = useState<number | null>(null);
    const [monthSwipeOffset, setMonthSwipeOffset] = useState(0);
    // Story 14.12: Animation trigger key - increments when slide changes to restart animations
    const [animationKey, setAnimationKey] = useState(0);
    // Story 14d.4c: pickerMonth removed - picker functions were unused

    // Story 10a.1: Pagination state (AC #3)
    const [historyPage, setHistoryPage] = useState(1);
    const pageSize = 10;

    // Story 11.1: Sort preference (transactionDate = by receipt date, scanDate = by createdAt)
    const [sortType, setSortType] = useState<SortType>('transactionDate');
    // Story 11.1: Show only possible duplicates filter
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

    // Story 14.12: Toggle between refreshed dashboard and full list view
    const [showFullList, setShowFullList] = useState(false);

    // Story 14.15b: Selection mode state and hooks for Dashboard Recientes
    const {
        isSelectionMode,
        selectedIds,
        toggleSelection,
        enterSelectionMode,
        exitSelectionMode,
        isSelected,
        selectAll,
        clearSelection,
    } = useSelectionMode();

    // Story 14e-5: Delete modal now uses Modal Manager
    const { openModal, closeModal } = useModalActions();

    // Story 14.15b: Long-press state for selection mode entry
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const longPressMoved = useRef(false);
    const LONG_PRESS_DURATION = 500; // ms

    // Story 14.15b: Long-press handlers
    const handleLongPressStart = useCallback((txId: string) => {
        longPressMoved.current = false;
        longPressTimerRef.current = setTimeout(() => {
            if (!longPressMoved.current) {
                enterSelectionMode(txId);
            }
        }, LONG_PRESS_DURATION);
    }, [enterSelectionMode]);

    const handleLongPressEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    const handleLongPressMove = useCallback(() => {
        longPressMoved.current = true;
        handleLongPressEnd();
    }, [handleLongPressEnd]);

    // Story 10a.1: Access filter state from context (AC #2, #6)
    const { state: filterState, hasActiveFilters } = useHistoryFilters();

    // Story 10a.1: Use allTransactions for display (AC #3)
    const allTx = allTransactions.length > 0 ? allTransactions : transactions;

    // Story 14.12: Get selected month string (YYYY-MM format)
    const selectedMonthString = useMemo(() => {
        const month = String(selectedMonth.month + 1).padStart(2, '0');
        return `${selectedMonth.year}-${month}`;
    }, [selectedMonth]);

    // Story 14.12: Filter transactions for selected month
    const monthTransactions = useMemo(() => {
        return allTx.filter(tx => tx.date.startsWith(selectedMonthString));
    }, [allTx, selectedMonthString]);

    // Story 14.12: Calculate month total with count-up
    const monthTotal = useMemo(() => {
        return monthTransactions.reduce((sum, tx) => sum + tx.total, 0);
    }, [monthTransactions]);

    const animatedMonthTotal = useCountUp(monthTotal, { duration: 400, key: animationKey });
    // Animated transaction count for footer badge
    const animatedMonthCount = useCountUp(monthTransactions.length, { duration: 800, startValue: 0, key: animationKey });

    // Story 14.12: Calculate month progress (days elapsed / total days)
    const monthProgress = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();

        // Get total days in the selected month
        const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();

        // Check if selected month is the current month
        const isCurrentMonth = selectedMonth.year === currentYear && selectedMonth.month === currentMonth;

        // If current month, show days elapsed; otherwise, show full month
        const daysElapsed = isCurrentMonth ? currentDay : daysInMonth;

        return {
            daysElapsed,
            daysInMonth,
            percent: Math.round((daysElapsed / daysInMonth) * 100),
            isCurrentMonth
        };
    }, [selectedMonth]);

    // Animated day count for month progress
    const animatedDaysElapsed = useCountUp(monthProgress.daysElapsed, { duration: 1200, startValue: 0, key: animationKey });

    // Story 14.12: Calculate categories for treemap (AC #1)
    // Story 14.21: Updated to use both bgColor and fgColor for proper contrast
    // Story 14.13 Session 10: Added itemCount for unique products per category
    // Story 14.13 Session 13: Changed "Otro" → "Más", added categoryCount, returns otroCategories for expansion
    // Display: All categories >10% + first category ≤10% + "Más" aggregating rest
    const treemapCategoriesResult = useMemo(() => {
        // Aggregate by category - track unique transactions and unique products
        // Story 14.13 Session 14: Changed to use transactionIds Set for accurate unique transaction counting
        // This matches TrendsView pattern and prevents double-counting
        const categoryTotals: Record<string, { amount: number; transactionIds: Set<string>; uniqueProducts: Set<string> }> = {};
        monthTransactions.forEach((tx, index) => {
            const cat = tx.category || 'Otro';
            if (!categoryTotals[cat]) {
                categoryTotals[cat] = { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() };
            }
            categoryTotals[cat].amount += tx.total;
            // Track unique transaction IDs (fallback to index if no id)
            categoryTotals[cat].transactionIds.add(tx.id ?? `tx-${index}`);
            // Count unique products by normalized name + merchant
            // Story 14.13: Use normalizeItemNameForGrouping for consistent counting with ItemsView
            (tx.items || []).forEach(item => {
                const normalizedName = normalizeItemNameForGrouping(item.name || '');
                const normalizedMerchant = normalizeItemNameForGrouping(tx.merchant || '');
                const productKey = `${normalizedName}::${normalizedMerchant}`;
                categoryTotals[cat].uniqueProducts.add(productKey);
            });
        });

        // Category data type with optional categoryCount for "Más" aggregation
        // Story 14.13 Session 14: Added transactionIds for accurate "Más" aggregation
        type CategoryEntry = {
            name: string;
            amount: number;
            count: number;
            itemCount: number;
            bgColor: string;
            fgColor: string;
            percent: number;
            categoryCount?: number;
            transactionIds?: Set<string>;  // For unique transaction count in "Más" aggregation
        };

        // Convert to array and sort by amount (highest first)
        // Story 14.21: Include both bg and fg colors for proper text contrast
        const sorted: CategoryEntry[] = Object.entries(categoryTotals)
            .map(([name, data]) => {
                const colors = getTreemapColors(name);
                return {
                    name,
                    amount: data.amount,
                    count: data.transactionIds.size,  // Use Set size for unique count
                    itemCount: data.uniqueProducts.size,
                    bgColor: colors.bg,
                    fgColor: colors.fg,
                    percent: monthTotal > 0 ? (data.amount / monthTotal) * 100 : 0,
                    transactionIds: data.transactionIds,  // Keep for "Más" aggregation
                };
            })
            .sort((a, b) => b.amount - a.amount);

        // Apply selection criteria:
        // 1. All categories >10% (excluding aggregated "Más" group)
        // 2. First category ≤10% (highest below threshold)
        // 3. Everything else goes to "Más" (aggregated group)
        // Helper to check if category is aggregated "Más" group
        const isAggregatedGroup = (name: string) => name === 'Más' || name === 'More';
        const aboveThreshold = sorted.filter(c => c.percent > 10 && !isAggregatedGroup(c.name));
        const belowThreshold = sorted.filter(c => c.percent <= 10 && !isAggregatedGroup(c.name));

        const result: CategoryEntry[] = [...aboveThreshold];

        // Add first category ≤10% if exists
        if (belowThreshold.length > 0) {
            result.push(belowThreshold[0]);
        }

        // Remaining categories that would go into "Más"
        const otroCategories = belowThreshold.slice(1);

        // If exactly 1 category would go into "Más", show it directly instead
        if (otroCategories.length === 1) {
            result.push(otroCategories[0]);
        } else if (otroCategories.length > 1) {
            // Multiple categories: aggregate into "Más" (not "Otro" to avoid conflict with real "Otro" category)
            const masAmount = otroCategories.reduce((sum, cat) => sum + cat.amount, 0);
            // Story 14.13 Session 14: Merge transactionIds Sets for unique count (prevents double-counting)
            const masTransactionIds = new Set<string>();
            otroCategories.forEach(cat => {
                if (cat.transactionIds) {
                    cat.transactionIds.forEach(id => masTransactionIds.add(id));
                }
            });
            const masCount = masTransactionIds.size;
            const masItemCount = otroCategories.reduce((sum, cat) => sum + cat.itemCount, 0);
            const masPercent = monthTotal > 0 ? (masAmount / monthTotal) * 100 : 0;

            // Use gray color for aggregated "Más" group
            const masColors = getTreemapColors('Otro');
            result.push({
                name: 'Más',
                amount: masAmount,
                count: masCount,
                itemCount: masItemCount,
                bgColor: masColors.bg,
                fgColor: masColors.fg,
                percent: masPercent,
                categoryCount: otroCategories.length,  // Number of categories inside "Más"
            });
        }

        return { displayCategories: result, otroCategories };
    }, [monthTransactions, monthTotal]);

    // Extract display categories and otroCategories for expansion
    const treemapCategories = treemapCategoriesResult.displayCategories;
    const storeCategoriesOtro = treemapCategoriesResult.otroCategories;

    // Story 14.13 Session 4: Calculate store groups data for treemap
    // Story 14.13 Session 10: Added itemCount for unique products per group
    // Story 14.13 Session 13: Added "Más" aggregation with categoryCount
    // Story 14.13 Session 14: Changed to use transactionIds Set for accurate unique transaction counting
    const storeGroupsDataResult = useMemo(() => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<StoreCategoryGroup, { amount: number; transactionIds: Set<string>; uniqueProducts: Set<string> }> = {
            'food-dining': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'health-wellness': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'retail-general': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'retail-specialty': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'automotive': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'services': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'hospitality': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'other': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
        };

        monthTransactions.forEach((tx, index) => {
            const cat = tx.category || 'Otro';
            const group = STORE_CATEGORY_GROUPS[cat as keyof typeof STORE_CATEGORY_GROUPS] || 'other';
            groupTotals[group].amount += tx.total;
            groupTotals[group].transactionIds.add(tx.id ?? `tx-${index}`);
            // Count unique products by normalized name + merchant
            // Story 14.13: Use normalizeItemNameForGrouping for consistent counting with ItemsView
            (tx.items || []).forEach(item => {
                const normalizedName = normalizeItemNameForGrouping(item.name || '');
                const normalizedMerchant = normalizeItemNameForGrouping(tx.merchant || '');
                const productKey = `${normalizedName}::${normalizedMerchant}`;
                groupTotals[group].uniqueProducts.add(productKey);
            });
        });

        // Category data type with optional categoryCount for "Más" aggregation
        type GroupEntry = {
            name: string;
            amount: number;
            count: number;
            itemCount: number;
            bgColor: string;
            fgColor: string;
            percent: number;
            categoryCount?: number;
            transactionIds?: Set<string>;
        };

        const sorted: GroupEntry[] = ALL_STORE_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getStoreGroupColors(groupKey, theme, mode);
                return {
                    name: groupKey,
                    amount: data.amount,
                    count: data.transactionIds.size,
                    itemCount: data.uniqueProducts.size,
                    bgColor: colors.bg,
                    fgColor: colors.fg,
                    percent: monthTotal > 0 ? (data.amount / monthTotal) * 100 : 0,
                    transactionIds: data.transactionIds,
                };
            })
            .filter(g => g.amount > 0)
            .sort((a, b) => b.amount - a.amount);

        // Apply "Más" aggregation: >10% + first ≤10% + "Más" for rest
        const isAggregatedGroup = (name: string) => name === 'Más' || name === 'More';
        const aboveThreshold = sorted.filter(c => c.percent > 10 && !isAggregatedGroup(c.name));
        const belowThreshold = sorted.filter(c => c.percent <= 10 && !isAggregatedGroup(c.name));

        const result: GroupEntry[] = [...aboveThreshold];
        if (belowThreshold.length > 0) {
            result.push(belowThreshold[0]);
        }

        const otroCategories = belowThreshold.slice(1);
        if (otroCategories.length === 1) {
            result.push(otroCategories[0]);
        } else if (otroCategories.length > 1) {
            const masAmount = otroCategories.reduce((sum, cat) => sum + cat.amount, 0);
            // Merge transactionIds Sets for unique count
            const masTransactionIds = new Set<string>();
            otroCategories.forEach(cat => {
                if (cat.transactionIds) {
                    cat.transactionIds.forEach(id => masTransactionIds.add(id));
                }
            });
            const masCount = masTransactionIds.size;
            const masItemCount = otroCategories.reduce((sum, cat) => sum + cat.itemCount, 0);
            const masPercent = monthTotal > 0 ? (masAmount / monthTotal) * 100 : 0;
            const masColors = getTreemapColors('Otro');
            result.push({
                name: 'Más',
                amount: masAmount,
                count: masCount,
                itemCount: masItemCount,
                bgColor: masColors.bg,
                fgColor: masColors.fg,
                percent: masPercent,
                categoryCount: otroCategories.length,
            });
        }

        return { displayCategories: result, otroCategories };
    }, [monthTransactions, monthTotal]);

    const storeGroupsData = storeGroupsDataResult.displayCategories;
    const storeGroupsOtro = storeGroupsDataResult.otroCategories;

    // Story 14.13 Session 4: Calculate item categories data from transaction line items
    // Story 14.13 Session 10: Added itemCount for unique products per item category
    // Story 14.13 Session 13: Added "Más" aggregation with categoryCount
    // Story 14.13 Session 14: Changed to use transactionIds Set for accurate unique transaction counting
    const itemCategoriesDataResult = useMemo(() => {
        const itemCategoryMap: Record<string, { amount: number; transactionIds: Set<string>; uniqueProducts: Set<string> }> = {};

        monthTransactions.forEach((tx, index) => {
            (tx.items || []).forEach(item => {
                const cat = normalizeItemCategory(item.category || 'Other');
                if (!itemCategoryMap[cat]) {
                    itemCategoryMap[cat] = { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() };
                }
                itemCategoryMap[cat].amount += item.price;
                // Track unique transaction IDs to count transactions, not items
                itemCategoryMap[cat].transactionIds.add(tx.id ?? `tx-${index}`);
                // Count unique products by normalized name + merchant
                // Story 14.13: Use normalizeItemNameForGrouping for consistent counting with ItemsView
                const normalizedName = normalizeItemNameForGrouping(item.name || '');
                const normalizedMerchant = normalizeItemNameForGrouping(tx.merchant || '');
                const productKey = `${normalizedName}::${normalizedMerchant}`;
                itemCategoryMap[cat].uniqueProducts.add(productKey);
            });
        });

        const total = Object.values(itemCategoryMap).reduce((sum, c) => sum + c.amount, 0);

        // Category data type with optional categoryCount for "Más" aggregation
        type ItemCatEntry = {
            name: string;
            amount: number;
            count: number;
            itemCount: number;
            bgColor: string;
            fgColor: string;
            percent: number;
            categoryCount?: number;
            transactionIds?: Set<string>;
        };

        const sorted: ItemCatEntry[] = Object.entries(itemCategoryMap)
            .map(([name, data]) => {
                const colors = getCategoryPillColors(name);
                return {
                    name,
                    amount: data.amount,
                    count: data.transactionIds.size,  // Count unique transactions
                    itemCount: data.uniqueProducts.size,
                    bgColor: colors.bg,
                    fgColor: colors.fg,
                    percent: total > 0 ? (data.amount / total) * 100 : 0,
                    transactionIds: data.transactionIds,
                };
            })
            .sort((a, b) => b.amount - a.amount);

        // Apply "Más" aggregation: >10% + first ≤10% + "Más" for rest
        const isAggregatedGroup = (name: string) => name === 'Más' || name === 'More';
        const aboveThreshold = sorted.filter(c => c.percent > 10 && !isAggregatedGroup(c.name));
        const belowThreshold = sorted.filter(c => c.percent <= 10 && !isAggregatedGroup(c.name));

        const result: ItemCatEntry[] = [...aboveThreshold];
        if (belowThreshold.length > 0) {
            result.push(belowThreshold[0]);
        }

        const otroCategories = belowThreshold.slice(1);
        if (otroCategories.length === 1) {
            result.push(otroCategories[0]);
        } else if (otroCategories.length > 1) {
            const masAmount = otroCategories.reduce((sum, cat) => sum + cat.amount, 0);
            // Merge transactionIds Sets for unique count
            const masTransactionIds = new Set<string>();
            otroCategories.forEach(cat => {
                if (cat.transactionIds) {
                    cat.transactionIds.forEach(id => masTransactionIds.add(id));
                }
            });
            const masCount = masTransactionIds.size;
            const masItemCount = otroCategories.reduce((sum, cat) => sum + cat.itemCount, 0);
            const masPercent = total > 0 ? (masAmount / total) * 100 : 0;
            const masColors = getTreemapColors('Otro');
            result.push({
                name: 'Más',
                amount: masAmount,
                count: masCount,
                itemCount: masItemCount,
                bgColor: masColors.bg,
                fgColor: masColors.fg,
                percent: masPercent,
                categoryCount: otroCategories.length,
            });
        }

        return { displayCategories: result, otroCategories };
    }, [monthTransactions]);

    const itemCategoriesData = itemCategoriesDataResult.displayCategories;
    const itemCategoriesOtro = itemCategoriesDataResult.otroCategories;

    // Story 14.13 Session 4: Calculate item groups data
    // Story 14.13 Session 10: Added itemCount - computed directly from transactions to avoid double-counting
    // Story 14.13 Session 13: Added "Más" aggregation with categoryCount
    // Story 14.13 Session 14: Changed to use transactionIds Set for accurate unique transaction counting
    const itemGroupsDataResult = useMemo(() => {
        const theme = getCurrentTheme();
        const mode = getCurrentMode();
        const groupTotals: Record<ItemCategoryGroup, { amount: number; transactionIds: Set<string>; uniqueProducts: Set<string> }> = {
            'food-fresh': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'food-packaged': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'health-personal': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'household': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'nonfood-retail': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'services-fees': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
            'other-item': { amount: 0, transactionIds: new Set(), uniqueProducts: new Set() },
        };

        // Compute directly from transactions to get accurate unique product counts
        monthTransactions.forEach((tx, index) => {
            (tx.items || []).forEach(item => {
                const cat = normalizeItemCategory(item.category || 'Other');
                const itemKey = ITEM_CATEGORY_TO_KEY[cat as keyof typeof ITEM_CATEGORY_TO_KEY];
                const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
                groupTotals[group].amount += item.price;
                groupTotals[group].transactionIds.add(tx.id ?? `tx-${index}`);
                // Count unique products by normalized name + merchant
                // Story 14.13: Use normalizeItemNameForGrouping for consistent counting with ItemsView
                const normalizedName = normalizeItemNameForGrouping(item.name || '');
                const normalizedMerchant = normalizeItemNameForGrouping(tx.merchant || '');
                const productKey = `${normalizedName}::${normalizedMerchant}`;
                groupTotals[group].uniqueProducts.add(productKey);
            });
        });

        const total = Object.values(groupTotals).reduce((sum, g) => sum + g.amount, 0);

        // Category data type with optional categoryCount for "Más" aggregation
        type ItemGroupEntry = {
            name: string;
            amount: number;
            count: number;
            itemCount: number;
            bgColor: string;
            fgColor: string;
            percent: number;
            categoryCount?: number;
            transactionIds?: Set<string>;
        };

        const sorted: ItemGroupEntry[] = ALL_ITEM_CATEGORY_GROUPS
            .map(groupKey => {
                const data = groupTotals[groupKey];
                const colors = getItemGroupColors(groupKey, theme, mode);
                return {
                    name: groupKey,
                    amount: data.amount,
                    count: data.transactionIds.size,
                    itemCount: data.uniqueProducts.size,
                    bgColor: colors.bg,
                    fgColor: colors.fg,
                    percent: total > 0 ? (data.amount / total) * 100 : 0,
                    transactionIds: data.transactionIds,
                };
            })
            .filter(g => g.amount > 0)
            .sort((a, b) => b.amount - a.amount);

        // Apply "Más" aggregation: >10% + first ≤10% + "Más" for rest
        const isAggregatedGroup = (name: string) => name === 'Más' || name === 'More';
        const aboveThreshold = sorted.filter(c => c.percent > 10 && !isAggregatedGroup(c.name));
        const belowThreshold = sorted.filter(c => c.percent <= 10 && !isAggregatedGroup(c.name));

        const result: ItemGroupEntry[] = [...aboveThreshold];
        if (belowThreshold.length > 0) {
            result.push(belowThreshold[0]);
        }

        const otroCategories = belowThreshold.slice(1);
        if (otroCategories.length === 1) {
            result.push(otroCategories[0]);
        } else if (otroCategories.length > 1) {
            const masAmount = otroCategories.reduce((sum, cat) => sum + cat.amount, 0);
            // Merge transactionIds Sets for unique count
            const masTransactionIds = new Set<string>();
            otroCategories.forEach(cat => {
                if (cat.transactionIds) {
                    cat.transactionIds.forEach(id => masTransactionIds.add(id));
                }
            });
            const masCount = masTransactionIds.size;
            const masItemCount = otroCategories.reduce((sum, cat) => sum + cat.itemCount, 0);
            const masPercent = total > 0 ? (masAmount / total) * 100 : 0;
            const masColors = getTreemapColors('Otro');
            result.push({
                name: 'Más',
                amount: masAmount,
                count: masCount,
                itemCount: masItemCount,
                bgColor: masColors.bg,
                fgColor: masColors.fg,
                percent: masPercent,
                categoryCount: otroCategories.length,
            });
        }

        return { displayCategories: result, otroCategories };
    }, [monthTransactions]);

    const itemGroupsData = itemGroupsDataResult.displayCategories;
    const itemGroupsOtro = itemGroupsDataResult.otroCategories;

    // Story 14.13 Session 4: Get treemap data based on current view mode
    const currentTreemapData = useMemo(() => {
        switch (treemapViewMode) {
            case 'store-groups':
                return storeGroupsData;
            case 'store-categories':
                return treemapCategories;
            case 'item-groups':
                return itemGroupsData;
            case 'item-categories':
                return itemCategoriesData;
            default:
                return treemapCategories;
        }
    }, [treemapViewMode, treemapCategories, storeGroupsData, itemGroupsData, itemCategoriesData]);

    // Story 14.13 Session 4: Get emoji for treemap cell based on view mode
    const getTreemapEmoji = useCallback((name: string) => {
        switch (treemapViewMode) {
            case 'store-groups':
                return getStoreCategoryGroupEmoji(name as StoreCategoryGroup);
            case 'item-groups':
                return getItemCategoryGroupEmoji(name as ItemCategoryGroup);
            case 'item-categories':
                return getItemCategoryEmoji(name);
            case 'store-categories':
            default:
                return getCategoryEmoji(name);
        }
    }, [treemapViewMode]);

    // Story 14.13 Session 4: Translate category name based on view mode
    const translateTreemapName = useCallback((name: string) => {
        switch (treemapViewMode) {
            case 'store-groups':
                return translateStoreCategoryGroup(name as StoreCategoryGroup, lang as 'en' | 'es');
            case 'item-groups':
                return translateItemCategoryGroup(name as ItemCategoryGroup, lang as 'en' | 'es');
            case 'store-categories':
            case 'item-categories':
            default:
                return translateCategory(name, lang as 'en' | 'es');
        }
    }, [treemapViewMode, lang]);

    // Story 14.12: Carousel navigation (wraps around) with slide animation
    const goToPrevSlide = () => {
        setSlideDirection('right'); // Content slides right (coming from left)
        setCarouselSlide(prev => (prev === 0 ? 2 : prev - 1) as CarouselSlide);
        setAnimationKey(prev => prev + 1); // Trigger animations on new slide
        setSelectedRadarCategory(null);
        setBumpTooltip(null);
    };

    const goToNextSlide = () => {
        setSlideDirection('left'); // Content slides left (coming from right)
        setCarouselSlide(prev => (prev === 2 ? 0 : prev + 1) as CarouselSlide);
        setAnimationKey(prev => prev + 1); // Trigger animations on new slide
        setSelectedRadarCategory(null);
        setBumpTooltip(null);
    };

    // Story 14.12: Swipe gesture handlers for carousel with live animation
    const minSwipeDistance = 50; // Minimum distance to trigger swipe

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setCarouselSwipeOffset(0);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const currentX = e.targetTouches[0].clientX;
        setTouchEnd(currentX);
        setCarouselSwipeOffset(currentX - touchStart);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            goToNextSlide(); // Swipe left = go to next slide
        } else if (isRightSwipe) {
            goToPrevSlide(); // Swipe right = go to previous slide
        }

        // Reset touch state
        setTouchStart(null);
        setTouchEnd(null);
        setCarouselSwipeOffset(0);
    };

    // Story 14.13: Navigate to previous month
    const goToPrevMonth = useCallback(() => {
        setSelectedMonth(prev => {
            const newMonth = prev.month === 0 ? 11 : prev.month - 1;
            const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
            return { year: newYear, month: newMonth };
        });
        setAnimationKey(prev => prev + 1);
        setSelectedRadarCategory(null);
        setBumpTooltip(null);
    }, []);

    // Story 14.13: Navigate to next month
    const goToNextMonth = useCallback(() => {
        const now = new Date();
        setSelectedMonth(prev => {
            const newMonth = prev.month === 11 ? 0 : prev.month + 1;
            const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
            // Don't go beyond current month
            const isFuture = newYear > now.getFullYear() ||
                (newYear === now.getFullYear() && newMonth > now.getMonth());
            if (isFuture) return prev;
            return { year: newYear, month: newMonth };
        });
        setAnimationKey(prev => prev + 1);
        setSelectedRadarCategory(null);
        setBumpTooltip(null);
    }, []);

    // Story 14.31: Return to current month when tapping on the month title (if not current)
    const goToCurrentMonth = useCallback(() => {
        const now = new Date();
        setSelectedMonth({ year: now.getFullYear(), month: now.getMonth() });
        setAnimationKey(prev => prev + 1);
        setSelectedRadarCategory(null);
        setBumpTooltip(null);
    }, []);

    // Story 14.31: Check if currently viewing current month
    const isViewingCurrentMonth = useMemo(() => {
        const now = new Date();
        return selectedMonth.year === now.getFullYear() && selectedMonth.month === now.getMonth();
    }, [selectedMonth]);

    // Story 14.13: Check if we can navigate to next month
    const canGoToNextMonth = useMemo(() => {
        const now = new Date();
        const nextMonth = selectedMonth.month === 11 ? 0 : selectedMonth.month + 1;
        const nextYear = selectedMonth.month === 11 ? selectedMonth.year + 1 : selectedMonth.year;
        return !(nextYear > now.getFullYear() ||
            (nextYear === now.getFullYear() && nextMonth > now.getMonth()));
    }, [selectedMonth]);

    // Story 14.13: Format month for display (e.g., "Ene '26")
    const formatMonth = useCallback((month: number, year: number) => {
        const monthNames = lang === 'es'
            ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sept', 'Oct', 'Nov', 'Dic']
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
        const shortYear = year.toString().slice(-2);
        return `${monthNames[month]} '${shortYear}`;
    }, [lang]);

    const formattedMonthName = useMemo(() => {
        return formatMonth(selectedMonth.month, selectedMonth.year);
    }, [selectedMonth, formatMonth]);

    // Story 14.13: Get prev/next month names for swipe animation
    const prevMonthName = useMemo(() => {
        const prevMonth = selectedMonth.month === 0 ? 11 : selectedMonth.month - 1;
        const prevYear = selectedMonth.month === 0 ? selectedMonth.year - 1 : selectedMonth.year;
        return formatMonth(prevMonth, prevYear);
    }, [selectedMonth, formatMonth]);

    const nextMonthName = useMemo(() => {
        const nextMonth = selectedMonth.month === 11 ? 0 : selectedMonth.month + 1;
        const nextYear = selectedMonth.month === 11 ? selectedMonth.year + 1 : selectedMonth.year;
        return formatMonth(nextMonth, nextYear);
    }, [selectedMonth, formatMonth]);

    // Story 14.13: Month swipe gesture handlers
    const onMonthTouchStart = (e: React.TouchEvent) => {
        setMonthTouchStart(e.targetTouches[0].clientX);
        setMonthSwipeOffset(0);
    };

    const onMonthTouchMove = (e: React.TouchEvent) => {
        if (monthTouchStart === null) return;
        const currentX = e.targetTouches[0].clientX;
        const offset = currentX - monthTouchStart;
        // Resistance effect when at current month
        if (offset < 0 && !canGoToNextMonth) {
            setMonthSwipeOffset(offset * 0.2);
        } else {
            setMonthSwipeOffset(offset);
        }
    };

    const onMonthTouchEnd = () => {
        if (monthTouchStart === null) return;
        const distance = -monthSwipeOffset;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && canGoToNextMonth) {
            goToNextMonth();
        } else if (isRightSwipe) {
            goToPrevMonth();
        }

        setMonthTouchStart(null);
        setMonthSwipeOffset(0);
    };

    // Story 14.12: Recientes carousel navigation with slide animation
    const goToRecientesSlide = (targetSlide: 0 | 1, direction: 'left' | 'right') => {
        setRecientesSlideDirection(direction);
        setRecientesSlide(targetSlide);
        setRecientesAnimKey(prev => prev + 1); // Re-trigger staggered item animations
    };

    // Story 14.12: Close month picker when clicking outside (exclude toggle button)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Don't close if clicking the toggle button (it handles its own toggle)
            if (monthPickerToggleRef.current?.contains(target)) {
                return;
            }
            if (monthPickerRef.current && !monthPickerRef.current.contains(target)) {
                setShowMonthPicker(false);
            }
        };
        if (showMonthPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMonthPicker]);

    // Story 14.12: Auto-hide transaction count tooltip after 2 seconds
    useEffect(() => {
        if (showCountTooltip) {
            const timer = setTimeout(() => setShowCountTooltip(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showCountTooltip]);


    // Story 14.12: Radar chart data for "Mes a Mes" view (dynamic polygon)
    // Criteria: Categories >10% + first category ≤10% + "Otro" catch-all
    // - 3 categories = triangle, 4 = diamond, 5 = pentagon, 6 = hexagon (max)
    // - Minimum 3 categories required
    // Story 14.13 Session 4: Now responds to treemapViewMode for different data groupings
    const radarChartData = useMemo(() => {
        // Get previous month
        const prevMonth = selectedMonth.month === 0 ? 11 : selectedMonth.month - 1;
        const prevYear = selectedMonth.month === 0 ? selectedMonth.year - 1 : selectedMonth.year;
        const prevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

        // Get transactions for current and previous month
        const currMonthTx = monthTransactions;
        const prevMonthTx = allTx.filter(tx => tx.date.startsWith(prevMonthStr));

        // Story 14.13 Session 4: Helper to get emoji and color based on view mode
        const getEmojiForMode = (name: string): string => {
            switch (treemapViewMode) {
                case 'store-groups':
                    return getStoreCategoryGroupEmoji(name as StoreCategoryGroup);
                case 'item-groups':
                    return getItemCategoryGroupEmoji(name as ItemCategoryGroup);
                case 'item-categories':
                    return getItemCategoryEmoji(name);
                case 'store-categories':
                default:
                    return getCategoryEmoji(name);
            }
        };

        const getColorForMode = (name: string): string => {
            const theme = getCurrentTheme();
            const mode = getCurrentMode();
            switch (treemapViewMode) {
                case 'store-groups':
                    return getStoreGroupColors(name as StoreCategoryGroup, theme, mode).bg;
                case 'item-groups':
                    return getItemGroupColors(name as ItemCategoryGroup, theme, mode).bg;
                case 'store-categories':
                case 'item-categories':
                default:
                    return getCategoryBackgroundAuto(name);
            }
        };

        // Aggregate data based on view mode
        const currTotals: Record<string, number> = {};
        const prevTotals: Record<string, number> = {};
        let totalCurrMonth = 0;
        let totalPrevMonth = 0;

        if (treemapViewMode === 'store-categories') {
            // Original behavior: aggregate by transaction category
            currMonthTx.forEach(tx => {
                const cat = tx.category || 'Otro';
                currTotals[cat] = (currTotals[cat] || 0) + tx.total;
                totalCurrMonth += tx.total;
            });
            prevMonthTx.forEach(tx => {
                const cat = tx.category || 'Otro';
                prevTotals[cat] = (prevTotals[cat] || 0) + tx.total;
                totalPrevMonth += tx.total;
            });
        } else if (treemapViewMode === 'store-groups') {
            // Aggregate by store category groups
            currMonthTx.forEach(tx => {
                const cat = tx.category || 'Otro';
                const group = STORE_CATEGORY_GROUPS[cat as keyof typeof STORE_CATEGORY_GROUPS] || 'other';
                currTotals[group] = (currTotals[group] || 0) + tx.total;
                totalCurrMonth += tx.total;
            });
            prevMonthTx.forEach(tx => {
                const cat = tx.category || 'Otro';
                const group = STORE_CATEGORY_GROUPS[cat as keyof typeof STORE_CATEGORY_GROUPS] || 'other';
                prevTotals[group] = (prevTotals[group] || 0) + tx.total;
                totalPrevMonth += tx.total;
            });
        } else if (treemapViewMode === 'item-categories') {
            // Aggregate by item categories from line items
            currMonthTx.forEach(tx => {
                (tx.items || []).forEach(item => {
                    const cat = normalizeItemCategory(item.category || 'Other');
                    currTotals[cat] = (currTotals[cat] || 0) + item.price;
                    totalCurrMonth += item.price;
                });
            });
            prevMonthTx.forEach(tx => {
                (tx.items || []).forEach(item => {
                    const cat = normalizeItemCategory(item.category || 'Other');
                    prevTotals[cat] = (prevTotals[cat] || 0) + item.price;
                    totalPrevMonth += item.price;
                });
            });
        } else if (treemapViewMode === 'item-groups') {
            // Aggregate by item category groups from line items
            currMonthTx.forEach(tx => {
                (tx.items || []).forEach(item => {
                    const cat = normalizeItemCategory(item.category || 'Other');
                    const itemKey = ITEM_CATEGORY_TO_KEY[cat as keyof typeof ITEM_CATEGORY_TO_KEY];
                    const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
                    currTotals[group] = (currTotals[group] || 0) + item.price;
                    totalCurrMonth += item.price;
                });
            });
            prevMonthTx.forEach(tx => {
                (tx.items || []).forEach(item => {
                    const cat = normalizeItemCategory(item.category || 'Other');
                    const itemKey = ITEM_CATEGORY_TO_KEY[cat as keyof typeof ITEM_CATEGORY_TO_KEY];
                    const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
                    prevTotals[group] = (prevTotals[group] || 0) + item.price;
                    totalPrevMonth += item.price;
                });
            });
        }

        // Get all unique categories with their percentage of current month budget
        const allCategories = new Set([...Object.keys(currTotals), ...Object.keys(prevTotals)]);
        const otherKey = treemapViewMode === 'item-groups' ? 'other-item' :
                         treemapViewMode === 'store-groups' ? 'other' : 'Otro';

        const allCategoriesWithData = Array.from(allCategories)
            .map(name => ({
                name,
                currAmount: currTotals[name] || 0,
                prevAmount: prevTotals[name] || 0,
                percent: totalCurrMonth > 0 ? ((currTotals[name] || 0) / totalCurrMonth) * 100 : 0,
                emoji: getEmojiForMode(name),
                color: getColorForMode(name),
            }))
            .sort((a, b) => b.currAmount - a.currAmount);

        // Apply selection criteria:
        // 1. All categories >10%
        // 2. First category ≤10%
        // 3. Everything else goes to "Otro"
        const isOtherCategory = (name: string) => name === otherKey || name === 'Otro' || name === 'Other';
        const significant = allCategoriesWithData.filter(c => c.percent > 10 && !isOtherCategory(c.name));
        const belowThreshold = allCategoriesWithData.filter(c => c.percent <= 10 && !isOtherCategory(c.name));

        let selectedCategories = [...significant];

        // Add first category ≤10% if exists
        if (belowThreshold.length > 0) {
            selectedCategories.push(belowThreshold[0]);
        }

        // Aggregate remaining into "Otro" (exclude already selected categories)
        const selectedNames = new Set(selectedCategories.map(c => c.name));
        const remaining = allCategoriesWithData.filter(c => !selectedNames.has(c.name) && !isOtherCategory(c.name));

        // Calculate "Otro" totals from remaining categories + any existing "Otro" transactions
        const existingOtro = allCategoriesWithData.find(c => isOtherCategory(c.name));
        let otroAmount = remaining.reduce((sum, c) => sum + c.currAmount, 0);
        let otroPrevAmount = remaining.reduce((sum, c) => sum + c.prevAmount, 0);
        if (existingOtro) {
            otroAmount += existingOtro.currAmount;
            otroPrevAmount += existingOtro.prevAmount;
        }

        // Always include "Otro" if there's any remaining data
        if (otroAmount > 0 || otroPrevAmount > 0) {
            selectedCategories.push({
                name: otherKey,
                currAmount: otroAmount,
                prevAmount: otroPrevAmount,
                percent: totalCurrMonth > 0 ? (otroAmount / totalCurrMonth) * 100 : 0,
                emoji: getEmojiForMode(otherKey),
                color: '#9ca3af', // Gray for "Otro"
            });
        }

        // Ensure minimum 3 categories (pad with zeros if needed)
        while (selectedCategories.length < 3 && belowThreshold.length > selectedCategories.length - significant.length) {
            const nextCat = belowThreshold[selectedCategories.length - significant.length];
            if (nextCat && !selectedNames.has(nextCat.name)) {
                selectedCategories.splice(selectedCategories.length - 1, 0, nextCat); // Insert before "Otro"
            } else {
                break;
            }
        }

        // Cap at 6 categories maximum (hexagon)
        selectedCategories = selectedCategories.slice(0, 6);

        // Calculate max value for scaling
        const maxValue = Math.max(
            ...selectedCategories.map(c => Math.max(c.currAmount, c.prevAmount)),
            1
        );

        // Determine polygon type based on number of categories
        const sides = selectedCategories.length;
        const polygonType = sides === 3 ? 'triangle' : sides === 4 ? 'diamond' : sides === 5 ? 'pentagon' : 'hexagon';

        return {
            categories: selectedCategories,
            maxValue,
            sides,
            polygonType,
            currentMonthIdx: selectedMonth.month,
            prevMonthIdx: prevMonth,
        };
    }, [monthTransactions, allTx, selectedMonth, treemapViewMode]);

    // Story 14.12: Translate month labels for radar chart (outside useMemo to access t)
    const radarCurrentMonthLabel = t(MONTH_SHORT_KEYS[radarChartData.currentMonthIdx]);
    const radarPrevMonthLabel = t(MONTH_SHORT_KEYS[radarChartData.prevMonthIdx]);


    // Story 14.12: Bump chart data for "Ultimos 4 Meses" view
    // Story 14.13 Session 4: Now responds to treemapViewMode for different data groupings
    const bumpChartData = useMemo(() => {
        // Get last 4 months including current
        const months: { year: number; month: number; isCurrentMonth: boolean }[] = [];
        let year = selectedMonth.year;
        let month = selectedMonth.month;

        for (let i = 0; i < 4; i++) {
            months.unshift({
                year,
                month,
                isCurrentMonth: i === 0
            });
            // Go to previous month
            if (month === 0) {
                month = 11;
                year -= 1;
            } else {
                month -= 1;
            }
        }

        // Story 14.13 Session 4: Helper to get color based on view mode
        const getColorForMode = (name: string): string => {
            const theme = getCurrentTheme();
            const mode = getCurrentMode();
            switch (treemapViewMode) {
                case 'store-groups':
                    return getStoreGroupColors(name as StoreCategoryGroup, theme, mode).fg;
                case 'item-groups':
                    return getItemGroupColors(name as ItemCategoryGroup, theme, mode).fg;
                case 'store-categories':
                case 'item-categories':
                default:
                    return getCategoryPillColors(name).fg;
            }
        };

        // Calculate category totals per month
        const categoryRankings: Record<string, { amounts: number[]; color: string }> = {};
        const otherKey = treemapViewMode === 'item-groups' ? 'other-item' :
                         treemapViewMode === 'store-groups' ? 'other' : 'Otro';

        months.forEach((m, idx) => {
            const monthStr = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
            const monthTx = allTx.filter(tx => tx.date.startsWith(monthStr));

            // Aggregate based on view mode
            const totals: Record<string, number> = {};

            if (treemapViewMode === 'store-categories') {
                // Original behavior: aggregate by transaction category
                monthTx.forEach(tx => {
                    const cat = tx.category || 'Otro';
                    totals[cat] = (totals[cat] || 0) + tx.total;
                });
            } else if (treemapViewMode === 'store-groups') {
                // Aggregate by store category groups
                monthTx.forEach(tx => {
                    const cat = tx.category || 'Otro';
                    const group = STORE_CATEGORY_GROUPS[cat as keyof typeof STORE_CATEGORY_GROUPS] || 'other';
                    totals[group] = (totals[group] || 0) + tx.total;
                });
            } else if (treemapViewMode === 'item-categories') {
                // Aggregate by item categories from line items
                monthTx.forEach(tx => {
                    (tx.items || []).forEach(item => {
                        const cat = normalizeItemCategory(item.category || 'Other');
                        totals[cat] = (totals[cat] || 0) + item.price;
                    });
                });
            } else if (treemapViewMode === 'item-groups') {
                // Aggregate by item category groups from line items
                monthTx.forEach(tx => {
                    (tx.items || []).forEach(item => {
                        const cat = normalizeItemCategory(item.category || 'Other');
                        const itemKey = ITEM_CATEGORY_TO_KEY[cat as keyof typeof ITEM_CATEGORY_TO_KEY];
                        const group = itemKey ? ITEM_CATEGORY_GROUPS[itemKey as keyof typeof ITEM_CATEGORY_GROUPS] : 'other-item';
                        totals[group] = (totals[group] || 0) + item.price;
                    });
                });
            }

            // Update rankings
            Object.entries(totals).forEach(([cat, amount]) => {
                if (!categoryRankings[cat]) {
                    categoryRankings[cat] = { amounts: [0, 0, 0, 0], color: getColorForMode(cat) };
                }
                categoryRankings[cat].amounts[idx] = amount;
            });
        });

        // Calculate ranks for each month (1 = highest spending)
        const ranks: Record<string, number[]> = {};
        months.forEach((_, monthIdx) => {
            const categoryAmounts = Object.entries(categoryRankings)
                .map(([cat, data]) => ({ cat, amount: data.amounts[monthIdx] }))
                .sort((a, b) => b.amount - a.amount);

            categoryAmounts.forEach((item, rank) => {
                if (!ranks[item.cat]) ranks[item.cat] = [4, 4, 4, 4]; // Default to lowest rank
                ranks[item.cat][monthIdx] = rank + 1;
            });
        });

        // Return top 4 categories + "Otro" (max 5 categories)
        const isOtherCategory = (name: string) => name === otherKey || name === 'Otro' || name === 'Other';
        const sortedCategories = Object.entries(categoryRankings)
            .filter(([cat]) => !isOtherCategory(cat)) // Exclude "other" categories from sorting
            .map(([cat, data]) => ({
                name: cat,
                color: data.color,
                amounts: data.amounts,
                ranks: ranks[cat] || [5, 5, 5, 5],
                total: data.amounts.reduce((sum, a) => sum + a, 0)
            }))
            .sort((a, b) => b.total - a.total);

        const top4 = sortedCategories.slice(0, 4);
        const rest = sortedCategories.slice(4);

        // Get existing "other" category data if any
        const existingOther = Object.entries(categoryRankings).find(([cat]) => isOtherCategory(cat));

        // Aggregate remaining categories into "Otro"
        let categoryTotals = top4;
        const hasRemainingOrOther = rest.length > 0 || existingOther;

        if (hasRemainingOrOther) {
            const otroAmounts = rest.reduce(
                (sums, cat) => sums.map((s, i) => s + cat.amounts[i]),
                existingOther ? [...existingOther[1].amounts] : [0, 0, 0, 0]
            );
            const otroTotal = otroAmounts.reduce((sum, a) => sum + a, 0);

            // Calculate ranks for Otro based on its amounts
            const otroRanks = months.map((_, monthIdx) => {
                const allAmounts = [...top4.map(c => c.amounts[monthIdx]), otroAmounts[monthIdx]];
                const sorted = [...allAmounts].sort((a, b) => b - a);
                return sorted.indexOf(otroAmounts[monthIdx]) + 1;
            });

            categoryTotals = [
                ...top4,
                {
                    name: otherKey,
                    color: getColorForMode(otherKey),
                    amounts: otroAmounts,
                    ranks: otroRanks,
                    total: otroTotal
                }
            ];

            // Recalculate ranks with Otro included
            months.forEach((_, monthIdx) => {
                const categoryAmounts = categoryTotals
                    .map(cat => ({ name: cat.name, amount: cat.amounts[monthIdx] }))
                    .sort((a, b) => b.amount - a.amount);
                categoryAmounts.forEach((item, rank) => {
                    const cat = categoryTotals.find(c => c.name === item.name);
                    if (cat) cat.ranks[monthIdx] = rank + 1;
                });
            });
        }

        return { monthData: months, categories: categoryTotals };
    }, [allTx, selectedMonth, treemapViewMode]);

    // Story 14.12: Translate bump chart month labels (outside useMemo to access t)
    const bumpChartMonthLabels = bumpChartData.monthData.map(m =>
        m.isCurrentMonth ? t('todayLabel') : t(MONTH_SHORT_KEYS[m.month])
    );

    // Story 10a.1: Extract available filters from transactions (AC #2)
    const availableFilters = useMemo(() => {
        return extractAvailableFilters(allTx as unknown as TransactionType[]);
    }, [allTx]);

    // Story 10a.1: Duplicate detection (AC #4) - moved before filtering for duplicatesOnly filter
    const duplicateIds = useMemo(() => {
        return getDuplicateIds(allTx as unknown as TransactionType[]);
    }, [allTx]);

    // Story 10a.1: Apply filters to transactions (AC #2)
    // Story 11.1: Extended to support duplicates-only filter and sort by createdAt
    const filteredTransactions = useMemo(() => {
        let result = filterTransactionsByHistoryFilters(allTx as unknown as TransactionType[], filterState);

        // Story 11.1: Apply duplicates-only filter
        if (showDuplicatesOnly) {
            result = result.filter(tx => tx.id && duplicateIds.has(tx.id));
        }

        // Story 11.1: Sort by selected sort type
        return [...result].sort((a, b) => {
            if (sortType === 'scanDate') {
                // Sort by createdAt (scan date) - newest first
                const getCreatedTime = (tx: any): number => {
                    if (!tx.createdAt) return 0;
                    // Firestore Timestamp has toDate() method
                    if (typeof tx.createdAt.toDate === 'function') {
                        return tx.createdAt.toDate().getTime();
                    }
                    // Fallback to Date parsing
                    return new Date(tx.createdAt).getTime();
                };
                return getCreatedTime(b) - getCreatedTime(a);
            } else {
                // Sort by transaction date - newest first
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });
    }, [allTx, filterState, showDuplicatesOnly, duplicateIds, sortType]);

    // Story 14.12: Recent transactions by SCAN date (sorted by createdAt/scan order)
    // NOTE: NOT filtered by month - shows globally recent scans
    // v9.7.0: Uses dedicated recentScans prop (separate Firestore query by createdAt)
    // This ensures recently scanned receipts with old transaction dates appear
    const recentTransactionsByScan = useMemo(() => {
        // recentScans is already ordered by createdAt desc from Firestore
        const limit = recientesExpanded ? RECENT_TRANSACTIONS_EXPANDED : RECENT_TRANSACTIONS_COLLAPSED;
        return recentScans.slice(0, limit);
    }, [recentScans, recientesExpanded]);

    // Story 14.12: Recent transactions by TRANSACTION date (sorted by date field)
    // NOTE: NOT filtered by month - shows globally recent transactions
    const recentTransactionsByDate = useMemo(() => {
        // Sort ALL transactions by transaction date descending (most recent transaction first)
        const sorted = [...filteredTransactions].sort((a, b) => {
            const aDate = new Date(a.date + (a.time ? `T${a.time}` : '')).getTime();
            const bDate = new Date(b.date + (b.time ? `T${b.time}` : '')).getTime();
            return bDate - aDate;
        });
        const limit = recientesExpanded ? RECENT_TRANSACTIONS_EXPANDED : RECENT_TRANSACTIONS_COLLAPSED;
        return sorted.slice(0, limit);
    }, [filteredTransactions, recientesExpanded]);

    // Story 14.12: Active transactions based on recientes carousel slide
    const recentTransactions = recientesSlide === 0 ? recentTransactionsByScan : recentTransactionsByDate;

    const visibleRecientesIds = useMemo(() => {
        return recentTransactions.map(tx => (tx as Transaction).id).filter((id): id is string => !!id);
    }, [recentTransactions]);

    const handleRecientesSelectAllToggle = useCallback(() => {
        const allVisibleSelected = visibleRecientesIds.length > 0 &&
            visibleRecientesIds.every(id => selectedIds.has(id));
        if (allVisibleSelected) {
            clearSelection();
        } else {
            selectAll(visibleRecientesIds);
        }
    }, [visibleRecientesIds, selectedIds, selectAll, clearSelection]);

    // Story 14.12: Total transaction count (for determining if expand is useful)
    // NOTE: Uses ALL transactions, not month-filtered
    const totalTransactionsCount = filteredTransactions.length;

    // Story 14.12: Whether expand button should be shown (more than collapsed limit)
    const canExpand = totalTransactionsCount > RECENT_TRANSACTIONS_COLLAPSED;

    // Story 10a.1: Paginate filtered results (AC #3)
    const totalPages = Math.ceil(filteredTransactions.length / pageSize);
    const paginatedTransactions = useMemo(() => {
        const startIndex = (historyPage - 1) * pageSize;
        return filteredTransactions.slice(startIndex, startIndex + pageSize);
    }, [filteredTransactions, historyPage, pageSize]);

    // Story 10a.1: Reset to page 1 when filters change
    // Story 11.1: Also reset when sort type or duplicates filter changes
    useEffect(() => {
        setHistoryPage(1);
    }, [filterState, sortType, showDuplicatesOnly]);

    // Card styling using CSS variables (AC #1)
    // Story 14.12: Use --border-light for theme-aware border color (peach in normal theme)
    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-light)',
    };

    // Story 9.11: Thumbnail click handler
    const handleThumbnailClick = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
    };

    const handleCloseViewer = () => {
        setSelectedTransaction(null);
    };

    // Story 14.12: Handle treemap tap to navigate to TrendsView (AC #1)
    const handleTreemapClick = () => {
        onViewTrends(selectedMonthString);
    };

    // Story 14.13 Session 4: Handle treemap cell click to navigate to filtered transactions
    // Story 14.13 Session 10: Navigate to Items view when countMode is 'items'
    // Story 14.13 Session 11: Aligned with TrendsView - add drillDownPath for proper filtering
    // Story 14.13 Session 13: Added "Más" expansion to constituent categories
    const handleTreemapCellClick = useCallback((categoryName: string) => {
        if (!onNavigateToHistory) return;

        // Build payload based on current view mode
        const payload: HistoryNavigationPayload = {
            // Story 14.13 Session 10: Target view based on countMode toggle
            targetView: countMode === 'items' ? 'items' : 'history',
            // Include temporal filter for the selected month
            temporal: {
                level: 'month',
                year: String(selectedMonth.year),
                month: selectedMonthString,
            },
            // Story 14.13 Session 11: Add sourceDistributionView for back-navigation context
            sourceDistributionView: 'treemap',
        };

        // Story 14.13 Session 13: Check if this is the "Más" aggregated group
        const isAggregatedGroup = categoryName === 'Más' || categoryName === 'More';

        // Add category filter based on view mode
        // Story 14.13 Session 13: Expand "Más" to constituent categories
        switch (treemapViewMode) {
            case 'store-groups':
                if (isAggregatedGroup && storeGroupsOtro.length > 0) {
                    // "Más" contains multiple store groups - expand each group and combine
                    const allCategories = storeGroupsOtro.flatMap(c =>
                        expandStoreCategoryGroup(c.name as StoreCategoryGroup)
                    );
                    payload.category = allCategories.join(',');
                } else {
                    payload.storeGroup = categoryName;
                }
                break;
            case 'store-categories':
                if (isAggregatedGroup && storeCategoriesOtro.length > 0) {
                    // "Más" contains multiple store categories - join them with comma
                    payload.category = storeCategoriesOtro.map(c => c.name).join(',');
                } else {
                    payload.category = categoryName;
                }
                break;
            case 'item-groups':
                if (isAggregatedGroup && itemGroupsOtro.length > 0) {
                    // "Más" contains multiple item groups - expand each group and combine
                    const allItemCategories = itemGroupsOtro.flatMap(c =>
                        expandItemCategoryGroup(c.name as ItemCategoryGroup)
                    );
                    payload.itemCategory = allItemCategories.join(',');
                } else {
                    payload.itemGroup = categoryName;
                }
                break;
            case 'item-categories':
                if (isAggregatedGroup && itemCategoriesOtro.length > 0) {
                    // "Más" contains multiple item categories - join them with comma
                    payload.itemCategory = itemCategoriesOtro.map(c => c.name).join(',');
                } else {
                    payload.itemCategory = categoryName;
                }
                break;
        }

        // Story 14.13 Session 11: Build semantic drill-down path for proper multi-level filtering
        // Story 14.13 Session 13: Skip drillDownPath for aggregated "Más" - already expanded above
        if (!isAggregatedGroup) {
            const dashboardPath: DrillDownPath = {};
            switch (treemapViewMode) {
                case 'store-groups':
                    dashboardPath.storeGroup = categoryName;
                    break;
                case 'store-categories':
                    dashboardPath.storeCategory = categoryName;
                    break;
                case 'item-groups':
                    dashboardPath.itemGroup = categoryName;
                    break;
                case 'item-categories':
                    dashboardPath.itemCategory = categoryName;
                    break;
            }
            if (Object.keys(dashboardPath).length > 0) {
                payload.drillDownPath = dashboardPath;
            }
        }

        onNavigateToHistory(payload);
    }, [onNavigateToHistory, treemapViewMode, selectedMonth.year, selectedMonthString, countMode, storeCategoriesOtro, storeGroupsOtro, itemCategoriesOtro, itemGroupsOtro]);

    // Story 14.31: Handle View All click - navigate based on current slide
    // Slide 0 (Últimos Escaneados): Navigate to RecentScansView (by scan date)
    // Slide 1 (Por Fecha): Navigate to HistoryView with current month filter (by transaction date)
    const handleViewAll = () => {
        if (recientesSlide === 0) {
            // "Últimos Escaneados" slide - show recent scans by scan date
            if (onViewRecentScans) {
                onViewRecentScans();
            } else if (onViewHistory) {
                onViewHistory();
            } else {
                setShowFullList(true);
            }
        } else {
            // "Por Fecha" slide - show transactions filtered by current month
            if (onNavigateToHistory) {
                onNavigateToHistory({
                    temporal: {
                        level: 'month',
                        year: String(selectedMonth.year),
                        month: selectedMonthString,
                    },
                });
            } else {
                setShowFullList(true);
            }
        }
    };

    // Story 14e-5: handleConfirmDelete logic moved into openDeleteModal callback

    // Story 14.15b: Get selected transactions for delete modal preview
    const getSelectedTransactions = useCallback((): TransactionPreview[] => {
        return recentTransactions
            .filter(tx => selectedIds.has((tx as Transaction).id))
            .map(tx => {
                const transaction = tx as Transaction;
                return {
                    id: transaction.id,
                    displayName: transaction.alias || transaction.merchant,
                    total: transaction.total,
                    currency: transaction.currency || currency,
                };
            });
    }, [recentTransactions, selectedIds, currency]);

    // Story 14e-5: handleOpenDelete uses Modal Manager (defined after getSelectedTransactions)
    const handleOpenDelete = useCallback(() => {
        openModal('deleteTransactions', {
            transactions: getSelectedTransactions(),
            onClose: closeModal,
            onDelete: async () => {
                if (!userId || selectedIds.size === 0) return;
                const db = getFirestore();
                const selectedTxIds = Array.from(selectedIds);
                try {
                    await deleteTransactionsBatch(db, userId, appId, selectedTxIds);
                    onTransactionsDeleted?.(selectedTxIds);
                    closeModal();
                    exitSelectionMode();
                } catch (error) {
                    console.error('Error deleting transactions:', error);
                    throw error;
                }
            },
            formatCurrency,
            t,
            lang: lang as 'en' | 'es',
            currency,
        });
    }, [openModal, closeModal, getSelectedTransactions, userId, selectedIds, appId, onTransactionsDeleted, exitSelectionMode, formatCurrency, t, lang, currency]);

    // Story 14.15b: Use consolidated TransactionCard with simplified props interface
    // Includes selection mode and long-press handlers
    const renderTransactionItem = (tx: Transaction | TransactionType, _index: number) => {
        const transaction = tx as Transaction;
        const isDuplicate = transaction.id ? duplicateIds.has(transaction.id) : false;

        return (
            <div
                key={transaction.id}
                onTouchStart={() => handleLongPressStart(transaction.id)}
                onTouchEnd={handleLongPressEnd}
                onTouchMove={handleLongPressMove}
                onMouseDown={() => handleLongPressStart(transaction.id)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
            >
                <TransactionCard
                    transaction={{
                        id: transaction.id,
                        merchant: transaction.merchant,
                        alias: transaction.alias,
                        date: transaction.date,
                        time: transaction.time,
                        total: transaction.total,
                        category: transaction.category as any,
                        city: transaction.city,
                        country: transaction.country,
                        currency: transaction.currency || currency,
                        thumbnailUrl: transaction.thumbnailUrl,
                        imageUrls: transaction.imageUrls,
                        items: transaction.items || [],
                    }}
                    formatters={{
                        formatCurrency,
                        formatDate,
                        t,
                    }}
                    theme={{
                        mode: theme === 'dark' ? 'dark' : 'light',
                        colorTheme,
                        dateFormat,
                    }}
                    defaultCurrency={currency}
                    userDefaultCountry={defaultCountry}
                    foreignLocationFormat={foreignLocationFormat}
                    isDuplicate={isDuplicate}
                    onClick={() => onEditTransaction(transaction as any)}
                    onThumbnailClick={() => handleThumbnailClick(transaction)}
                    selection={isSelectionMode ? {
                        isSelectionMode,
                        isSelected: isSelected(transaction.id),
                        onToggleSelect: () => toggleSelection(transaction.id),
                    } : undefined}
                />
            </div>
        );
    };

    // Story 14.12: If showing full list, render the old paginated view
    if (showFullList) {
        return (
            <div className="space-y-6">
                {/* Back button to return to dashboard */}
                <button
                    onClick={() => setShowFullList(false)}
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: 'var(--accent)' }}
                >
                    <ChevronRight size={16} className="rotate-180" />
                    {t('backToDashboard') || 'Volver'}
                </button>

                {/* Filter bar */}
                <HistoryFilterBar
                    availableFilters={availableFilters}
                    theme={theme}
                    locale={lang}
                    t={t}
                    totalCount={allTx.length}
                    filteredCount={filteredTransactions.length}
                />

                {/* Sort and duplicates filter controls */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5">
                        <ArrowUpDown size={14} style={{ color: 'var(--secondary)' }} />
                        <select
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value as SortType)}
                            className="text-sm py-1.5 px-2 rounded-lg border min-h-[36px] cursor-pointer"
                            style={{
                                backgroundColor: 'var(--surface)',
                                borderColor: 'var(--border-light)',
                                color: 'var(--text-primary)',
                            }}
                            aria-label={t('sortBy')}
                        >
                            <option value="transactionDate">{t('sortByTransactionDate')}</option>
                            <option value="scanDate">{t('sortByScanDate')}</option>
                        </select>
                    </div>

                    {duplicateIds.size > 0 && (
                        <button
                            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
                            className={`flex items-center gap-1.5 text-sm py-1.5 px-3 rounded-lg border min-h-[36px] transition-colors ${
                                showDuplicatesOnly
                                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30'
                                    : ''
                            }`}
                            style={{
                                backgroundColor: showDuplicatesOnly
                                    ? undefined
                                    : 'var(--surface)',
                                borderColor: showDuplicatesOnly
                                    ? '#fbbf24'
                                    : isDark ? '#334155' : '#e2e8f0',
                                color: showDuplicatesOnly
                                    ? isDark ? '#fbbf24' : '#d97706'
                                    : 'var(--secondary)',
                            }}
                            aria-pressed={showDuplicatesOnly}
                            aria-label={t('filterDuplicates')}
                        >
                            <Filter size={14} />
                            <span>{t('filterDuplicates')}</span>
                            <span className="font-semibold">({duplicateIds.size})</span>
                        </button>
                    )}
                </div>

                {/* Transaction list */}
                {filteredTransactions.length === 0 && hasActiveFilters ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Inbox size={48} className="mb-4 opacity-50" style={{ color: 'var(--secondary)' }} />
                        <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{t('noMatchingTransactions')}</p>
                        <p className="text-sm opacity-75" style={{ color: 'var(--secondary)' }}>{t('tryDifferentFilters')}</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {paginatedTransactions.map((tx, index) => renderTransactionItem(tx, index))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                                <button
                                    disabled={historyPage === 1}
                                    onClick={() => setHistoryPage(p => p - 1)}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50 min-h-11"
                                    style={{
                                        borderColor: 'var(--border-light)',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {t('prev')}
                                </button>
                                <span style={{ color: 'var(--secondary)' }}>
                                    {t('page')} {historyPage} / {totalPages}
                                </span>
                                <button
                                    disabled={historyPage >= totalPages}
                                    onClick={() => setHistoryPage(p => p + 1)}
                                    className="px-4 py-2 border rounded-lg disabled:opacity-50 min-h-11"
                                    style={{
                                        borderColor: 'var(--border-light)',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    {t('next')}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Image Viewer Modal */}
                {selectedTransaction && selectedTransaction.imageUrls && selectedTransaction.imageUrls.length > 0 && (
                    <ImageViewer
                        images={selectedTransaction.imageUrls}
                        merchantName={selectedTransaction.alias || selectedTransaction.merchant}
                        onClose={handleCloseViewer}
                    />
                )}
            </div>
        );
    }

    // Story 14.12: Refreshed dashboard view (matching mockup)
    // Story 14.15b: Reduced gap between sections from space-y-4 (16px) to space-y-2 (8px)
    return (
        <PageTransition viewKey="dashboard" direction="none">
            <div className="space-y-2">
                {/* Section 1: Carousel Card with 3 views */}
                <TransitionChild index={0} totalItems={2}>
                    <div
                        className="rounded-xl border overflow-hidden"
                        style={cardStyle}
                        data-testid="carousel-card"
                    >
                        {/* Carousel Header with swipeable month and slide arrows */}
                        {/* Story 14.13 Session 4: Restructured for true center alignment of view mode selector */}
                        {/* Story 14.13.3: All elements aligned to 32px height (matching count toggle button) */}
                        <div className="relative flex justify-between items-center p-3 pb-0">
                            {/* Story 14.31: Left-aligned month with swipe navigation and chevron hints */}
                            {/* Tap on text returns to current month when viewing past months */}
                            <div
                                className="relative flex items-center cursor-pointer select-none"
                                style={{
                                    touchAction: 'pan-y',
                                    height: '24px',
                                    marginLeft: '-4px',
                                }}
                                data-testid="carousel-title"
                                onTouchStart={onMonthTouchStart}
                                onTouchMove={onMonthTouchMove}
                                onTouchEnd={onMonthTouchEnd}
                                onClick={!isViewingCurrentMonth ? goToCurrentMonth : undefined}
                            >
                                {/* Left chevron hint */}
                                <ChevronLeft
                                    size={12}
                                    strokeWidth={2}
                                    style={{
                                        color: 'var(--text-tertiary)',
                                        opacity: 0.4,
                                    }}
                                />
                                {/* Month text container with sliding animation */}
                                <div
                                    className="relative overflow-hidden flex items-center justify-center"
                                    style={{ width: '54px', height: '100%' }}
                                >
                                    {/* Previous month (slides in from left when swiping right) */}
                                    <span
                                        className="absolute font-semibold whitespace-nowrap text-sm"
                                        style={{
                                            color: 'var(--text-primary)',
                                            transform: `translateX(${monthSwipeOffset - 54}px)`,
                                            transition: monthTouchStart === null ? 'transform 0.2s ease-out' : 'none',
                                            opacity: monthSwipeOffset > 0 ? Math.min(monthSwipeOffset / 50, 1) : 0,
                                        }}
                                    >
                                        {prevMonthName}
                                    </span>
                                    {/* Current month */}
                                    <span
                                        className="absolute font-semibold whitespace-nowrap text-sm"
                                        style={{
                                            color: 'var(--text-primary)',
                                            transform: `translateX(${monthSwipeOffset}px)`,
                                            transition: monthTouchStart === null ? 'transform 0.2s ease-out' : 'none',
                                        }}
                                    >
                                        {formattedMonthName}
                                        {/* Dot indicator when not on current month */}
                                        {!isViewingCurrentMonth && (
                                            <span style={{ marginLeft: '2px', color: 'var(--primary)' }}>·</span>
                                        )}
                                    </span>
                                    {/* Next month (slides in from right when swiping left) */}
                                    <span
                                        className="absolute font-semibold whitespace-nowrap text-sm"
                                        style={{
                                            color: 'var(--text-primary)',
                                            transform: `translateX(${monthSwipeOffset + 54}px)`,
                                            transition: monthTouchStart === null ? 'transform 0.2s ease-out' : 'none',
                                            opacity: monthSwipeOffset < 0 ? Math.min(-monthSwipeOffset / 50, 1) : 0,
                                        }}
                                    >
                                        {nextMonthName}
                                    </span>
                                </div>
                                {/* Right chevron hint */}
                                <ChevronRight
                                    size={12}
                                    strokeWidth={2}
                                    style={{
                                        color: 'var(--text-tertiary)',
                                        opacity: canGoToNextMonth ? 0.4 : 0.15,
                                    }}
                                />
                            </div>

                            {/* Story 14.13 Session 4: View mode selector - absolutely centered for all slides */}
                            {/* Story 14.13.3: Height increased to 32px to match count toggle button */}
                            <div
                                className="absolute left-1/2 transform -translate-x-1/2 flex items-center"
                                style={{ top: '12px' }}
                            >
                                <div
                                    className="relative flex items-center rounded-full"
                                    style={{
                                        backgroundColor: 'var(--bg-tertiary, #f1f5f9)',
                                        height: '32px',
                                        padding: '2px 4px',
                                        border: '1px solid var(--border-light, #e2e8f0)',
                                        gap: '4px',
                                    }}
                                    role="tablist"
                                    aria-label="View mode selection"
                                    data-testid="viewmode-pills-container"
                                >
                                    {/* Animated selection indicator */}
                                    <div
                                        className="absolute rounded-full transition-all duration-300 ease-out"
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            top: '2px',
                                            // 4px initial padding + (28px button + 4px gap) * index
                                            left: treemapViewMode === 'store-groups' ? '4px' :
                                                  treemapViewMode === 'store-categories' ? 'calc(4px + 32px)' :
                                                  treemapViewMode === 'item-groups' ? 'calc(4px + 64px)' :
                                                  'calc(4px + 96px)',
                                            background: 'var(--primary, #2563eb)',
                                        }}
                                        aria-hidden="true"
                                    />
                                    {/* View mode pills with icons only */}
                                    {VIEW_MODE_CONFIG.map((mode) => {
                                        const isActive = treemapViewMode === mode.value;
                                        return (
                                            <button
                                                key={mode.value}
                                                onClick={() => {
                                                    setTreemapViewMode(mode.value);
                                                    setAnimationKey(prev => prev + 1);
                                                }}
                                                className="relative z-10 flex items-center justify-center rounded-full transition-colors"
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    lineHeight: 1,
                                                }}
                                                aria-pressed={isActive}
                                                aria-label={lang === 'es' ? mode.labelEs : mode.labelEn}
                                                title={lang === 'es' ? mode.labelEs : mode.labelEn}
                                                data-testid={`viewmode-pill-${mode.value}`}
                                            >
                                                <span
                                                    className="text-base leading-none transition-all"
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

                            {/* Story 14.13 Session 11: Count Mode Toggle (arrows removed - swipe navigation only) */}
                            <div className="flex items-center gap-1 z-10">
                                {/* Count Mode Toggle - Receipt (transactions) or Package (items) */}
                                <button
                                    onClick={toggleCountMode}
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
                                    aria-label={countMode === 'transactions'
                                        ? (lang === 'es' ? 'Contando compras (clic para contar productos)' : 'Counting purchases (click to count products)')
                                        : (lang === 'es' ? 'Contando productos (clic para contar compras)' : 'Counting products (click to count purchases)')
                                    }
                                    title={countMode === 'transactions'
                                        ? (lang === 'es' ? 'Contando compras' : 'Counting purchases')
                                        : (lang === 'es' ? 'Contando productos' : 'Counting products')
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
                            </div>
                        </div>

                        {/* Carousel Content (collapsible) - Fixed height for consistent carousel across all slides */}
                        {/* pt-3 matches the p-3 header padding for equal spacing above/below title */}
                        {/* Touch handlers for swipe gesture navigation */}
                        {/* Story 14.12: Height increased to 310px for better footer spacing */}
                        {!carouselCollapsed && (
                            <div
                                className="p-3 pt-3 overflow-hidden"
                                style={{ height: '310px', touchAction: 'pan-y' }}
                                data-testid="carousel-content"
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                            >
                                {/* Slide 0: Este Mes - Treemap (per mockup: 2col x 4row grid, first cat spans all rows) */}
                                {/* Mockup shows 5 categories: 1 large left + 4 stacked right (top 3 + below threshold + Otro) */}
                                {carouselSlide === 0 && (
                                    <div
                                        className="h-full flex flex-col"
                                        style={{
                                            transform: `translateX(${carouselSwipeOffset}px)`,
                                            transition: touchStart === null ? 'transform 0.2s ease-out' : 'none',
                                            animation: slideDirection ? `slideIn${slideDirection === 'left' ? 'FromRight' : 'FromLeft'} 0.25s ease-out` : undefined
                                        }}
                                        onAnimationEnd={() => setSlideDirection(null)}
                                    >
                                        <div
                                            className="cursor-pointer flex-1"
                                            onClick={handleTreemapClick}
                                            role="button"
                                            aria-label={t('viewAnalytics') || 'Ver analíticas'}
                                            data-testid="treemap-grid"
                                            style={{ overflow: 'hidden' }}
                                        >
                                        {currentTreemapData.length > 0 ? (
                                            (() => {
                                                // Story 14.13: Squarified treemap layout - cells sized proportionally
                                                // Show up to 5 categories for dashboard
                                                const displayCategories = currentTreemapData.slice(0, 5);

                                                // Calculate proportional font sizes based on percentage
                                                const getValueFontSize = (percent: number, isMainCell: boolean) => {
                                                    if (isMainCell) return '22px';
                                                    if (percent >= 25) return '18px';
                                                    if (percent >= 15) return '16px';
                                                    return '14px';
                                                };

                                                // Convert to treemap items format (use amount as value for layout)
                                                const treemapItems = displayCategories.map(cat => ({
                                                    id: cat.name,
                                                    value: cat.amount,
                                                    ...cat
                                                }));
                                                const layout = calculateTreemapLayout(treemapItems);

                                                // Find the largest cell (by area) to mark as main cell for styling
                                                const largestArea = Math.max(...layout.map(r => r.width * r.height));

                                                return (
                                                    <div className="relative h-full">
                                                        {layout.map((rect) => {
                                                            const cat = rect.originalItem as unknown as typeof displayCategories[0];
                                                            const cellArea = rect.width * rect.height;
                                                            // Main cell = largest area (within 10% of max to handle ties)
                                                            const isMainCell = cellArea >= largestArea * 0.9;
                                                            // Story 14.13 Session 4: Use view mode-aware translation
                                                            const displayName = cat.name === 'Otro' || cat.name === 'Other'
                                                                ? t('otherCategory')
                                                                : translateTreemapName(cat.name);

                                                            return (
                                                                <AnimatedTreemapCard
                                                                    key={`${cat.name}-${animationKey}`}
                                                                    cat={cat}
                                                                    displayName={displayName}
                                                                    isMainCell={isMainCell}
                                                                    animationKey={animationKey}
                                                                    getValueFontSize={getValueFontSize}
                                                                    // Story 14.13 Session 4: Use view mode-aware emoji
                                                                    emoji={getTreemapEmoji(cat.name)}
                                                                    // Story 14.13 Session 4: Click to navigate to filtered transactions
                                                                    onClick={() => handleTreemapCellClick(cat.name)}
                                                                    // Story 14.13 Session 10: Icon based on countMode toggle
                                                                    iconType={countMode === 'items' ? 'package' : 'receipt'}
                                                                    countMode={countMode}
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
                                            })()
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <p className="text-sm text-center" style={{ color: 'var(--secondary)' }}>
                                                    {t('noTransactionsThisMonth') || 'No se detectaron transacciones este mes'}
                                                </p>
                                            </div>
                                        )}
                                        </div>
                                        {/* Footer with total, transaction count, and month progress */}
                                        {/* Story 14.13 Session 4: Clickable footer to view month transactions */}
                                        {/* Layout: Total del mes | [receipt icon + count] | Progress bar | days | Amount */}
                                        <div
                                            className="pt-3 mt-3 border-t flex-shrink-0"
                                            style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {/* Total label + transaction count - clickable to view month transactions */}
                                                <button
                                                    onClick={() => {
                                                        // Story 14.13 Session 4: Navigate to transaction view filtered by this month
                                                        if (onNavigateToHistory) {
                                                            onNavigateToHistory({
                                                                temporal: {
                                                                    level: 'month',
                                                                    year: String(selectedMonth.year),
                                                                    month: selectedMonthString,
                                                                },
                                                            });
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                                                    style={{ color: 'var(--secondary)', background: 'none', border: 'none', padding: 0 }}
                                                    aria-label={`Ver ${monthTransactions.length} transacciones del mes`}
                                                >
                                                    <span>Total del mes</span>
                                                    {/* Receipt icon + transaction count badge */}
                                                    <span
                                                        className="inline-flex items-center gap-[2px] px-1.5 py-0.5 rounded-full font-semibold"
                                                        style={{
                                                            backgroundColor: 'var(--primary)',
                                                            color: 'white',
                                                            fontSize: '11px',
                                                        }}
                                                    >
                                                        <Receipt size={10} strokeWidth={2} />
                                                        {animatedMonthCount}
                                                    </span>
                                                </button>
                                                {/* Month progress bar */}
                                                <div className="flex-1 flex items-center gap-1.5">
                                                    <div
                                                        className="flex-1 h-2 rounded-full overflow-hidden"
                                                        style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}
                                                    >
                                                        <div
                                                            className="h-full rounded-full transition-all duration-100"
                                                            style={{
                                                                width: `${(animatedDaysElapsed / monthProgress.daysInMonth) * 100}%`,
                                                                backgroundColor: monthProgress.isCurrentMonth ? 'var(--primary)' : 'var(--secondary)'
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                                                        {animatedDaysElapsed}/{monthProgress.daysInMonth}
                                                    </span>
                                                </div>
                                                {/* Total amount */}
                                                <span className="text-lg font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                                                    {formatCurrency(animatedMonthTotal, currency)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Slide 1: Mes a Mes - Dynamic polygon radar chart */}
                                {/* Shows 3-6 sided polygon based on categories with >10% of budget */}
                                {/* Per mockup: h-full for consistent carousel height */}
                                {carouselSlide === 1 && (
                                    <div
                                        className="relative h-full flex flex-col"
                                        data-testid="radar-view"
                                        style={{
                                            transform: `translateX(${carouselSwipeOffset}px)`,
                                            transition: touchStart === null ? 'transform 0.2s ease-out' : 'none',
                                            animation: slideDirection ? `slideIn${slideDirection === 'left' ? 'FromRight' : 'FromLeft'} 0.25s ease-out` : undefined
                                        }}
                                        onAnimationEnd={() => setSlideDirection(null)}
                                    >
                                        {radarChartData.categories.length >= 3 ? (
                                            <>
                                                {/* SVG Dynamic Polygon Radar Chart with left/right comparison overlays */}
                                                <div className="flex-1 relative">
                                                <svg
                                                    viewBox="0 0 200 150"
                                                    style={{ width: '100%', height: '100%' }}
                                                    className="overflow-visible"
                                                >
                                                    {/* Dynamic grid rings and data polygons */}
                                                    {(() => {
                                                        const center = { x: 100, y: 80 };
                                                        const maxRadius = 58;
                                                        const sides = radarChartData.sides;

                                                        // Generate angles for N-sided polygon (starting from top, -90 degrees)
                                                        const angles = Array.from({ length: sides }, (_, i) =>
                                                            (-90 + (360 / sides) * i) * Math.PI / 180
                                                        );

                                                        // Helper to generate polygon points at a given radius
                                                        const getPolygonPoints = (radius: number) =>
                                                            angles.map(a => ({
                                                                x: center.x + radius * Math.cos(a),
                                                                y: center.y + radius * Math.sin(a)
                                                            }));

                                                        // Generate 4 concentric grid rings - theme-aware colors
                                                        const ringRadii = [maxRadius, maxRadius * 0.75, maxRadius * 0.5, maxRadius * 0.25];
                                                        const gridRings = ringRadii.map((r, i) => ({
                                                            points: getPolygonPoints(r).map(p => `${p.x},${p.y}`).join(' '),
                                                            fill: isDark
                                                                ? (i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)')
                                                                : (i % 2 === 0 ? '#f1f5f9' : '#f8fafc')
                                                        }));

                                                        // Axis lines from center to each vertex
                                                        const axisEndpoints = getPolygonPoints(maxRadius);

                                                        // Data polygons based on category amounts
                                                        const currPoints = radarChartData.categories.map((cat, i) => {
                                                            const ratio = cat.currAmount / radarChartData.maxValue;
                                                            const radius = maxRadius * Math.max(0.1, ratio);
                                                            return {
                                                                x: center.x + radius * Math.cos(angles[i]),
                                                                y: center.y + radius * Math.sin(angles[i])
                                                            };
                                                        });

                                                        const prevPoints = radarChartData.categories.map((cat, i) => {
                                                            const ratio = cat.prevAmount / radarChartData.maxValue;
                                                            const radius = maxRadius * Math.max(0.1, ratio);
                                                            return {
                                                                x: center.x + radius * Math.cos(angles[i]),
                                                                y: center.y + radius * Math.sin(angles[i])
                                                            };
                                                        });

                                                        const currPolygon = currPoints.map(p => `${p.x},${p.y}`).join(' ');
                                                        const prevPolygon = prevPoints.map(p => `${p.x},${p.y}`).join(' ');

                                                        return (
                                                            <>
                                                                {/* Grid rings (dynamic N-sided polygons) - theme-aware */}
                                                                {gridRings.map((ring, i) => (
                                                                    <polygon
                                                                        key={`ring-${i}`}
                                                                        points={ring.points}
                                                                        fill={ring.fill}
                                                                        stroke={isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}
                                                                        strokeWidth="1"
                                                                    />
                                                                ))}

                                                                {/* Axis lines from center to each vertex - theme-aware */}
                                                                {axisEndpoints.map((p, i) => (
                                                                    <line
                                                                        key={`axis-${i}`}
                                                                        x1={center.x}
                                                                        y1={center.y}
                                                                        x2={p.x}
                                                                        y2={p.y}
                                                                        stroke={isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}
                                                                        strokeWidth="1"
                                                                        opacity="0.5"
                                                                    />
                                                                ))}

                                                                {/* Previous month polygon (orange, back layer) - with expand animation */}
                                                                {/* opacity: 0 ensures polygon is hidden until animation starts (prevents flash) */}
                                                                <polygon
                                                                    key={`prev-${animationKey}`}
                                                                    points={prevPolygon}
                                                                    fill="#f59e0b"
                                                                    fillOpacity="0.12"
                                                                    stroke="#f59e0b"
                                                                    strokeWidth="2"
                                                                    style={{
                                                                        opacity: 0,
                                                                        transformOrigin: `${center.x}px ${center.y}px`,
                                                                        animation: 'radarExpand 1s ease-out forwards',
                                                                        animationDelay: '0.1s'
                                                                    }}
                                                                />

                                                                {/* Current month polygon (primary blue, front layer) - with expand animation */}
                                                                {/* opacity: 0 ensures polygon is hidden until animation starts (prevents flash) */}
                                                                <polygon
                                                                    key={`curr-${animationKey}`}
                                                                    points={currPolygon}
                                                                    fill="var(--primary, #2563eb)"
                                                                    fillOpacity="0.18"
                                                                    stroke="var(--primary, #2563eb)"
                                                                    strokeWidth="2"
                                                                    style={{
                                                                        opacity: 0,
                                                                        transformOrigin: `${center.x}px ${center.y}px`,
                                                                        animation: 'radarExpand 1s ease-out forwards',
                                                                        animationDelay: '0.3s'
                                                                    }}
                                                                />

                                                                {/* Data points for current month - fade in place with polygon */}
                                                                {currPoints.map((p, i) => (
                                                                    <circle
                                                                        key={`curr-dot-${animationKey}-${i}`}
                                                                        cx={p.x}
                                                                        cy={p.y}
                                                                        r="4"
                                                                        fill="var(--primary, #2563eb)"
                                                                        stroke="white"
                                                                        strokeWidth="1.5"
                                                                        style={{
                                                                            opacity: 0,
                                                                            animation: 'fade-in 0.5s ease-out forwards',
                                                                            animationDelay: '0.8s'
                                                                        }}
                                                                    />
                                                                ))}
                                                            </>
                                                        );
                                                    })()}
                                                </svg>

                                                {/* Category icons with dual progress rings (outer=current, inner=previous) */}
                                                {(() => {
                                                    const sides = radarChartData.sides;
                                                    // Calculate positions based on polygon sides (top vertex = -90 degrees)
                                                    const getPositionStyle = (index: number) => {
                                                        const angle = (-90 + (360 / sides) * index) * Math.PI / 180;
                                                        const radius = 42; // percent from center
                                                        const x = 50 + radius * Math.cos(angle);
                                                        const y = 50 + radius * Math.sin(angle);
                                                        return {
                                                            left: `${x}%`,
                                                            top: `${y}%`,
                                                            transform: 'translate(-50%, -50%)'
                                                        };
                                                    };

                                                    // Calculate percentage for progress ring
                                                    const getPercent = (amount: number) => {
                                                        if (radarChartData.maxValue === 0) return 0;
                                                        return Math.min(100, (amount / radarChartData.maxValue) * 100);
                                                    };

                                                    const iconSize = 52; // Total size including rings - bigger
                                                    const strokeWidth = 3.5;
                                                    const outerRadius = 23; // Outer ring radius
                                                    // Inner ring touches outer ring (no gap) - outer edge of inner = inner edge of outer
                                                    const innerRadius = outerRadius - strokeWidth; // = 19.5, so inner ring outer edge = 19.5 + 1.75 = 21.25
                                                    // Center fill radius touches inner ring inner edge
                                                    const centerRadius = innerRadius - (strokeWidth / 2); // = 17.75

                                                    // Animation delay per icon for staggered effect
                                                    const baseDelay = 0.3; // seconds
                                                    const staggerDelay = 0.1; // seconds per icon

                                                    return radarChartData.categories.map((cat, i) => {
                                                        const currPercent = getPercent(cat.currAmount);
                                                        const prevPercent = getPercent(cat.prevAmount);
                                                        const innerCircum = 2 * Math.PI * innerRadius;
                                                        const outerCircum = 2 * Math.PI * outerRadius;
                                                        // Swapped: outer = current month, inner = previous month
                                                        const innerOffset = innerCircum - (prevPercent / 100) * innerCircum;
                                                        const outerOffset = outerCircum - (currPercent / 100) * outerCircum;
                                                        const isSelected = selectedRadarCategory?.name === cat.name;
                                                        const animDelay = baseDelay + (i * staggerDelay);

                                                        return (
                                                            <div
                                                                key={`${cat.name}-${animationKey}`}
                                                                className="absolute cursor-pointer hover:scale-110 transition-transform"
                                                                style={{
                                                                    ...getPositionStyle(i),
                                                                    width: iconSize,
                                                                    height: iconSize
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (selectedRadarCategory?.name === cat.name) {
                                                                        setSelectedRadarCategory(null);
                                                                    } else {
                                                                        setSelectedRadarCategory({
                                                                            name: cat.name,
                                                                            emoji: cat.emoji,
                                                                            currAmount: cat.currAmount,
                                                                            prevAmount: cat.prevAmount,
                                                                            color: cat.color
                                                                        });
                                                                    }
                                                                }}
                                                                data-testid={`radar-icon-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                                                            >
                                                                {/* SVG with dual progress rings - no background circles, only percentage covered */}
                                                                <svg width={iconSize} height={iconSize} style={{ position: 'absolute', top: 0, left: 0 }}>
                                                                    {/* Outer ring progress (current month - primary blue) - animated fill */}
                                                                    <circle
                                                                        key={`outer-ring-${cat.name}-${animationKey}`}
                                                                        cx={iconSize / 2}
                                                                        cy={iconSize / 2}
                                                                        r={outerRadius}
                                                                        fill="none"
                                                                        stroke="var(--primary, #2563eb)"
                                                                        strokeWidth={strokeWidth}
                                                                        strokeLinecap="round"
                                                                        strokeDasharray={outerCircum}
                                                                        style={{
                                                                            transform: 'rotate(-90deg)',
                                                                            transformOrigin: 'center',
                                                                            // @ts-expect-error - CSS custom properties
                                                                            '--ring-circumference': outerCircum,
                                                                            '--target-offset': outerOffset,
                                                                            strokeDashoffset: outerOffset,
                                                                            animation: `progressRingFill 0.8s ease-out ${animDelay}s forwards`
                                                                        }}
                                                                    />
                                                                    {/* Inner ring progress (previous month - orange) - animated fill */}
                                                                    <circle
                                                                        key={`inner-ring-${cat.name}-${animationKey}`}
                                                                        cx={iconSize / 2}
                                                                        cy={iconSize / 2}
                                                                        r={innerRadius}
                                                                        fill="none"
                                                                        stroke="#f59e0b"
                                                                        strokeWidth={strokeWidth}
                                                                        strokeLinecap="round"
                                                                        strokeDasharray={innerCircum}
                                                                        style={{
                                                                            transform: 'rotate(-90deg)',
                                                                            transformOrigin: 'center',
                                                                            // @ts-expect-error - CSS custom properties
                                                                            '--ring-circumference': innerCircum,
                                                                            '--target-offset': innerOffset,
                                                                            strokeDashoffset: innerOffset,
                                                                            animation: `progressRingFill 0.8s ease-out ${animDelay + 0.1}s forwards`
                                                                        }}
                                                                    />
                                                                    {/* Center filled circle - fills up to inner ring edge, no gap */}
                                                                    {/* Story 14.21: Use full category color for visible background */}
                                                                    <circle
                                                                        cx={iconSize / 2}
                                                                        cy={iconSize / 2}
                                                                        r={centerRadius}
                                                                        fill={cat.color}
                                                                        stroke={isSelected ? 'white' : 'none'}
                                                                        strokeWidth={isSelected ? 2 : 0}
                                                                    />
                                                                </svg>
                                                                {/* Emoji centered - larger */}
                                                                <span
                                                                    className="absolute flex items-center justify-center"
                                                                    style={{
                                                                        top: '50%',
                                                                        left: '50%',
                                                                        transform: 'translate(-50%, -50%)',
                                                                        fontSize: '18px'
                                                                    }}
                                                                >
                                                                    {cat.emoji}
                                                                </span>
                                                            </div>
                                                        );
                                                    });
                                                })()}

                                                {/* Left/Right comparison overlays when category selected */}
                                                {/* Reading order: Left = Previous month, Right = Current month */}
                                                {/* Key forces re-animation when category changes */}
                                                {/* Story 14.13 Session 4: Increased font sizes for better readability */}
                                                {selectedRadarCategory && (
                                                    <React.Fragment key={selectedRadarCategory.name}>
                                                        {/* Left side - Previous month (secondary) */}
                                                        <div
                                                            className="absolute left-0 top-1 flex flex-col items-start animate-comparison-left"
                                                            style={{ maxWidth: '90px' }}
                                                        >
                                                            <div
                                                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium shadow-sm"
                                                                style={{
                                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                                                                    color: 'var(--secondary)'
                                                                }}
                                                            >
                                                                <span className="opacity-70">{radarPrevMonthLabel}</span>
                                                                <span>${Math.round(selectedRadarCategory.prevAmount / 1000)}k</span>
                                                            </div>
                                                            <div
                                                                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                                                                style={{
                                                                    backgroundColor: selectedRadarCategory.color + '25',
                                                                    color: 'var(--primary)'
                                                                }}
                                                            >
                                                                <span>{selectedRadarCategory.emoji}</span>
                                                                <span className="truncate" style={{ maxWidth: '60px' }}>{
                                                                    // Story 14.13 Session 4: Use view mode-aware translation for category names
                                                                    selectedRadarCategory.name === 'Otro' || selectedRadarCategory.name === 'Other' ||
                                                                    selectedRadarCategory.name === 'other' || selectedRadarCategory.name === 'other-item'
                                                                        ? t('otherCategory')
                                                                        : translateTreemapName(selectedRadarCategory.name)
                                                                }</span>
                                                            </div>
                                                        </div>

                                                        {/* Right side - Current month (primary) + change */}
                                                        <div
                                                            className="absolute right-0 top-1 flex flex-col items-end animate-comparison-right"
                                                            style={{ maxWidth: '90px' }}
                                                        >
                                                            <div
                                                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold shadow-sm"
                                                                style={{
                                                                    backgroundColor: 'var(--primary)',
                                                                    color: 'var(--bg)'
                                                                }}
                                                            >
                                                                <span className="opacity-70">{radarCurrentMonthLabel}</span>
                                                                <span>${Math.round(selectedRadarCategory.currAmount / 1000)}k</span>
                                                            </div>
                                                            {/* Change badge */}
                                                            {(() => {
                                                                const change = selectedRadarCategory.prevAmount > 0
                                                                    ? ((selectedRadarCategory.currAmount - selectedRadarCategory.prevAmount) / selectedRadarCategory.prevAmount) * 100
                                                                    : 100;
                                                                const isUp = change >= 0;
                                                                return (
                                                                    <span
                                                                        className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-bold"
                                                                        style={{
                                                                            backgroundColor: isUp ? 'var(--negative-bg)' : 'var(--positive-bg)',
                                                                            color: isUp ? 'var(--negative-primary)' : 'var(--positive-primary)'
                                                                        }}
                                                                    >
                                                                        {isUp ? '↑' : '↓'}{Math.abs(Math.round(change))}%
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </React.Fragment>
                                                )}

                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-sm text-center" style={{ color: 'var(--secondary)' }}>
                                                {t('needMoreCategories') || 'Se necesitan al menos 3 categorías para mostrar el radar'}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Slide 2: Ultimos 4 Meses - Bump chart */}
                                {/* h-full for consistent carousel height */}
                                {carouselSlide === 2 && (
                                    <div
                                        className="h-full"
                                        data-testid="bump-chart-view"
                                        style={{
                                            transform: `translateX(${carouselSwipeOffset}px)`,
                                            transition: touchStart === null ? 'transform 0.2s ease-out' : 'none',
                                            animation: slideDirection ? `slideIn${slideDirection === 'left' ? 'FromRight' : 'FromLeft'} 0.25s ease-out` : undefined
                                        }}
                                        onAnimationEnd={() => setSlideDirection(null)}
                                    >
                                        {bumpChartData.categories.length > 0 ? (
                                            <div>
                                                {/* Tooltip display area at top */}
                                                <div className="h-6 flex items-center justify-center mb-1">
                                                    {bumpTooltip ? (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bumpTooltip.color }} />
                                                            <span style={{ color: bumpTooltip.color, fontWeight: 600 }}>{bumpTooltip.category === 'Otro' || bumpTooltip.category === 'Other' ? t('otherCategory') : translateCategory(bumpTooltip.category, lang)}</span>
                                                            <span style={{ color: 'var(--text-tertiary)' }}>en {bumpTooltip.month}:</span>
                                                            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                                                ${Math.round(bumpTooltip.amount).toLocaleString('es-CL')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                            Toca un punto para ver detalles
                                                        </span>
                                                    )}
                                                </div>

                                                {/* SVG Bump Chart */}
                                                <svg viewBox="0 0 320 110" style={{ width: '100%', height: '110px' }}>
                                                    {/* Y-axis labels - 5 ranks */}
                                                    <text x="0" y="6" dominantBaseline="middle" fontSize="10" fill="var(--text-tertiary)" fontWeight="600">#1</text>
                                                    <text x="0" y="30" dominantBaseline="middle" fontSize="10" fill="var(--text-tertiary)">#2</text>
                                                    <text x="0" y="54" dominantBaseline="middle" fontSize="10" fill="var(--text-tertiary)">#3</text>
                                                    <text x="0" y="78" dominantBaseline="middle" fontSize="10" fill="var(--text-tertiary)">#4</text>
                                                    <text x="0" y="102" dominantBaseline="middle" fontSize="10" fill="var(--text-tertiary)">#5</text>

                                                    {/* Grid lines - 5 ranks */}
                                                    <line x1="28" y1="6" x2="310" y2="6" stroke="var(--border-light)" strokeWidth="1" />
                                                    <line x1="28" y1="30" x2="310" y2="30" stroke="var(--border-light)" strokeWidth="1" />
                                                    <line x1="28" y1="54" x2="310" y2="54" stroke="var(--border-light)" strokeWidth="1" />
                                                    <line x1="28" y1="78" x2="310" y2="78" stroke="var(--border-light)" strokeWidth="1" />
                                                    <line x1="28" y1="102" x2="310" y2="102" stroke="var(--border-light)" strokeWidth="1" />

                                                    {/* Category lines and points - with draw animation */}
                                                    {bumpChartData.categories.map((cat, catIdx) => {
                                                        const yPositions = [6, 30, 54, 78, 102]; // Y positions for ranks 1-5
                                                        const xPositions = [28, 122, 216, 310]; // X positions for 4 months
                                                        const points = cat.ranks.map((rank, monthIdx) => {
                                                            const y = yPositions[Math.min(rank - 1, 4)];
                                                            return `${xPositions[monthIdx]},${y}`;
                                                        }).join(' ');

                                                        return (
                                                            <g key={`${cat.name}-${animationKey}`}>
                                                                {/* Line - with draw animation */}
                                                                <polyline
                                                                    fill="none"
                                                                    stroke={cat.color}
                                                                    strokeWidth="3"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    points={points}
                                                                    style={{
                                                                        strokeDasharray: 1000,
                                                                        strokeDashoffset: 1000,
                                                                        animation: 'drawLine 0.8s ease-out forwards',
                                                                        animationDelay: `${catIdx * 0.1}s`
                                                                    }}
                                                                />
                                                                {/* Points - all same size, clickable, with appear animation */}
                                                                {cat.ranks.map((rank, monthIdx) => {
                                                                    const y = yPositions[Math.min(rank - 1, 4)];
                                                                    const isSelected = bumpTooltip?.category === cat.name && bumpTooltip?.month === bumpChartMonthLabels[monthIdx];
                                                                    return (
                                                                        <circle
                                                                            key={`${cat.name}-${monthIdx}-${animationKey}`}
                                                                            cx={xPositions[monthIdx]}
                                                                            cy={y}
                                                                            r={isSelected ? 8 : 6}
                                                                            fill={cat.color}
                                                                            stroke="white"
                                                                            strokeWidth={isSelected ? 3 : 2}
                                                                            style={{
                                                                                cursor: 'pointer',
                                                                                opacity: 0,
                                                                                animation: 'dotAppear 0.3s ease-out forwards',
                                                                                animationDelay: `${catIdx * 0.1 + monthIdx * 0.15 + 0.2}s`
                                                                            }}
                                                                            onClick={() => setBumpTooltip({
                                                                                category: cat.name,
                                                                                month: bumpChartMonthLabels[monthIdx],
                                                                                amount: cat.amounts[monthIdx],
                                                                                color: cat.color
                                                                            })}
                                                                        />
                                                                    );
                                                                })}
                                                            </g>
                                                        );
                                                    })}
                                                </svg>

                                                {/* X-axis labels */}
                                                <div className="flex justify-between mt-1 pl-5">
                                                    {bumpChartMonthLabels.map((label, idx) => (
                                                        <span
                                                            key={label}
                                                            className="text-xs"
                                                            style={{
                                                                color: idx === 3 ? 'var(--primary)' : 'var(--text-tertiary)',
                                                                fontWeight: idx === 3 ? 600 : 400
                                                            }}
                                                        >
                                                            {label}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Legend - with sequential fade-in animation */}
                                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
                                                    {bumpChartData.categories.map((cat, idx) => (
                                                        <div
                                                            key={`${cat.name}-${animationKey}`}
                                                            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                                                            style={{
                                                                backgroundColor: `${cat.color}20`,
                                                                opacity: 0,
                                                                animation: 'fade-in 300ms ease-out forwards',
                                                                animationDelay: `${800 + idx * 100}ms`
                                                            }}
                                                        >
                                                            {/* Story 14.13 Session 4: Use category emoji instead of dot */}
                                                            <span className="text-sm">{getTreemapEmoji(cat.name)}</span>
                                                            <span style={{ color: cat.color }}>
                                                                {/* Story 14.13 Session 4: Use view mode-aware translation */}
                                                                {cat.name === 'Otro' || cat.name === 'Other' || cat.name === 'other' || cat.name === 'other-item'
                                                                    ? t('otherCategory')
                                                                    : translateTreemapName(cat.name)} #{idx + 1}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-[180px] flex items-center justify-center">
                                                <p className="text-sm text-center" style={{ color: 'var(--secondary)' }}>
                                                    {t('noDataForBumpChart') || 'Sin datos suficientes'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Carousel Indicator Bar - uses CSS variables for theme colors
                            Story 14.12: Uses --border-light for inactive, --border-medium for active (per mockup) */}
                        <div
                            className={`flex ${carouselCollapsed ? 'mt-3' : ''}`}
                            style={{
                                backgroundColor: 'var(--border-light)',
                                borderRadius: '0 0 12px 12px',
                                overflow: 'hidden',
                                height: '6px',
                            }}
                            data-testid="carousel-indicators"
                        >
                            {[0, 1, 2].map((idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        const direction = idx > carouselSlide ? 'left' : idx < carouselSlide ? 'right' : null;
                                        if (direction) {
                                            setSlideDirection(direction);
                                            setAnimationKey(prev => prev + 1); // Trigger animations on new slide
                                        }
                                        setCarouselSlide(idx as CarouselSlide);
                                        setSelectedRadarCategory(null);
                                        setBumpTooltip(null);
                                    }}
                                    className="flex-1 h-full transition-colors"
                                    style={{
                                        backgroundColor: carouselSlide === idx
                                            ? 'var(--border-medium, #d4a574)'
                                            : 'transparent',
                                        borderRadius: carouselSlide === idx
                                            ? (idx === 0 ? '0 0 0 12px' : idx === 2 ? '0 0 12px 0' : '0')
                                            : '0',
                                    }}
                                    aria-label={`Go to slide ${idx + 1}: ${t(CAROUSEL_TITLE_KEYS[idx])}`}
                                    data-testid={`carousel-indicator-${idx}`}
                                />
                            ))}
                        </div>
                    </div>
                </TransitionChild>

                {/* Section 2: Recientes Carousel (AC #3) - 2 slides: by scan date, by transaction date */}
                <TransitionChild index={1} totalItems={2}>
                    <div className="rounded-xl border overflow-hidden" style={cardStyle}>
                        {/* Section Header - fixed height (h-10 = 40px) to prevent layout shift between modes */}
                        <div className="flex justify-between items-center px-2.5 h-10 relative">
                            {/* Left side: Title or Selection count - uses absolute positioning for smooth transitions */}
                            <div className="flex items-center gap-2 h-full">
                                {/* Normal mode: Title + Expand button */}
                                <div
                                    className="flex items-center gap-2 transition-opacity duration-150"
                                    style={{
                                        opacity: isSelectionMode ? 0 : 1,
                                        pointerEvents: isSelectionMode ? 'none' : 'auto',
                                        position: isSelectionMode ? 'absolute' : 'relative',
                                    }}
                                >
                                    <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                        {recientesSlide === 0 ? 'Últimos Escaneados' : 'Por Fecha'}
                                    </h2>
                                    {/* Story 14.41b: Removed expand button - now using "See More" card at end of list */}
                                </div>
                                {/* Selection mode: X button + count */}
                                <div
                                    className="flex items-center gap-2 transition-opacity duration-150"
                                    style={{
                                        opacity: isSelectionMode ? 1 : 0,
                                        pointerEvents: isSelectionMode ? 'auto' : 'none',
                                        position: isSelectionMode ? 'relative' : 'absolute',
                                    }}
                                >
                                    <button
                                        onClick={exitSelectionMode}
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                                        aria-label="Cancelar selección"
                                    >
                                        <X size={14} style={{ color: 'var(--text-secondary)' }} />
                                    </button>
                                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                        {selectedIds.size} {selectedIds.size === 1 ? 'seleccionado' : 'seleccionados'}
                                    </span>
                                </div>
                            </div>
                            {/* Right side: Ver todo or Action buttons - uses absolute positioning for smooth transitions */}
                            <div className="flex items-center h-full">
                                {/* Normal mode: Ver todo link */}
                                <div
                                    className="transition-opacity duration-150"
                                    style={{
                                        opacity: isSelectionMode ? 0 : 1,
                                        pointerEvents: isSelectionMode ? 'none' : 'auto',
                                        position: isSelectionMode ? 'absolute' : 'relative',
                                        right: isSelectionMode ? '0.625rem' : undefined,
                                    }}
                                >
                                    <button
                                        onClick={handleViewAll}
                                        className="text-sm font-medium"
                                        style={{ color: 'var(--primary)' }}
                                        data-testid="view-all-link"
                                    >
                                        Ver todo →
                                    </button>
                                </div>
                                {/* Selection mode: Action buttons */}
                                <div
                                    className="flex items-center gap-2 transition-opacity duration-150"
                                    style={{
                                        opacity: isSelectionMode ? 1 : 0,
                                        pointerEvents: isSelectionMode ? 'auto' : 'none',
                                        position: isSelectionMode ? 'relative' : 'absolute',
                                        right: isSelectionMode ? undefined : '0.625rem',
                                    }}
                                >
                                    <button
                                        onClick={handleRecientesSelectAllToggle}
                                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                        style={{ backgroundColor: 'var(--secondary)' }}
                                        aria-label={visibleRecientesIds.every(id => selectedIds.has(id)) ? 'Deseleccionar todo' : 'Seleccionar todo'}
                                        data-testid="recientes-select-all"
                                    >
                                        <CheckSquare
                                            size={16}
                                            style={{ color: 'white' }}
                                            fill={visibleRecientesIds.length > 0 && visibleRecientesIds.every(id => selectedIds.has(id)) ? 'rgba(255, 255, 255, 0.3)' : 'none'}
                                        />
                                    </button>
                                    <button
                                        onClick={handleOpenDelete}
                                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                        style={{ backgroundColor: 'var(--error)' }}
                                        aria-label="Eliminar"
                                        disabled={selectedIds.size === 0}
                                    >
                                        <Trash2 size={16} style={{ color: 'white' }} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Transaction List with swipe support - reduced horizontal padding */}
                        <div
                            className="px-1.5 pb-1.5"
                            onTouchStart={(e) => setRecientesTouchStart(e.targetTouches[0].clientX)}
                            onTouchMove={(e) => setRecientesTouchEnd(e.targetTouches[0].clientX)}
                            onTouchEnd={() => {
                                if (recientesTouchStart !== null && recientesTouchEnd !== null) {
                                    const diff = recientesTouchStart - recientesTouchEnd;
                                    const minSwipeDistance = 50;
                                    if (diff > minSwipeDistance) {
                                        // Swiped left -> go to next slide (slide 1)
                                        goToRecientesSlide(recientesSlide === 0 ? 1 : 0, 'left');
                                    } else if (diff < -minSwipeDistance) {
                                        // Swiped right -> go to prev slide (slide 0)
                                        goToRecientesSlide(recientesSlide === 1 ? 0 : 1, 'right');
                                    }
                                }
                                setRecientesTouchStart(null);
                                setRecientesTouchEnd(null);
                            }}
                        >
                            {recentTransactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Inbox size={36} className="mb-3 opacity-50" style={{ color: 'var(--secondary)' }} />
                                    <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                                        {t('noRecentTransactions') || 'Sin transacciones recientes'}
                                    </p>
                                </div>
                            ) : (
                                <div
                                    key={`recientes-list-${recientesAnimKey}`}
                                    className="space-y-1"
                                    style={{
                                        animation: recientesSlideDirection
                                            ? `${recientesSlideDirection === 'left' ? 'slideInFromRight' : 'slideInFromLeft'} 300ms ease-out`
                                            : undefined
                                    }}
                                >
                                    {recentTransactions.map((tx, index) => (
                                        <div
                                            key={`${(tx as Transaction).id}-${recientesAnimKey}`}
                                            className="animate-fade-in-left"
                                            style={{
                                                opacity: 0,
                                                animationDelay: `${index * 80}ms`
                                            }}
                                        >
                                            {renderTransactionItem(tx, index)}
                                        </div>
                                    ))}
                                    {/* Story 14.41b: "See More" / "See Less" link at end of list - styled like "Ver todo" */}
                                    {canExpand && (
                                        <div
                                            key={`see-more-less-${recientesAnimKey}`}
                                            className="flex justify-center pt-2 pb-1 animate-fade-in-left"
                                            style={{
                                                opacity: 0,
                                                animationDelay: `${recentTransactions.length * 80}ms`
                                            }}
                                        >
                                            <button
                                                onClick={() => setRecientesExpanded(!recientesExpanded)}
                                                className="text-sm font-medium flex items-center gap-1"
                                                style={{ color: 'var(--primary)' }}
                                                data-testid={recientesExpanded ? 'show-less-card' : 'see-more-card'}
                                            >
                                                <span>
                                                    {recientesExpanded
                                                        ? (t('showLess') || 'Ver menos')
                                                        : (t('seeMore') || 'Ver más')}
                                                </span>
                                                <span className="text-base font-bold">{recientesExpanded ? '−' : '+'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Indicator Bar (2 segments) - uses CSS variables for theme colors */}
                        <div
                            className="flex"
                            style={{
                                backgroundColor: 'var(--border-light)',
                                borderRadius: '0 0 12px 12px',
                                overflow: 'hidden',
                                height: '6px',
                            }}
                            data-testid="recientes-indicator-bar"
                        >
                            {[0, 1].map((idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (idx !== recientesSlide) {
                                            goToRecientesSlide(idx as 0 | 1, idx > recientesSlide ? 'left' : 'right');
                                        }
                                    }}
                                    className="flex-1 h-full transition-colors"
                                    style={{
                                        backgroundColor: recientesSlide === idx
                                            ? 'var(--border-medium, #d4a574)'
                                            : 'transparent',
                                        borderRadius: recientesSlide === idx
                                            ? (idx === 0 ? '0 0 0 12px' : '0 0 12px 0')
                                            : '0',
                                    }}
                                    aria-label={idx === 0 ? 'Últimos Escaneados' : 'Por Fecha'}
                                    data-testid={`recientes-indicator-${idx}`}
                                />
                            ))}
                        </div>
                    </div>
                </TransitionChild>

                {/* Image Viewer Modal */}
                {selectedTransaction && selectedTransaction.imageUrls && selectedTransaction.imageUrls.length > 0 && (
                    <ImageViewer
                        images={selectedTransaction.imageUrls}
                        merchantName={selectedTransaction.alias || selectedTransaction.merchant}
                        onClose={handleCloseViewer}
                    />
                )}

                {/* Story 14e-5: Delete Transactions Modal now uses Modal Manager */}
                {/* Rendered by ModalManager component via openModal('deleteTransactions', {...}) */}
            </div>
        </PageTransition>
    );
};
