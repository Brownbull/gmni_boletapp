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
import { Plus, Inbox, ArrowUpDown, Filter, ChevronRight, ChevronLeft, ChevronDown, Minus, Package, X, Layers, Trash2 } from 'lucide-react';
import { ImageViewer } from '../components/ImageViewer';
// Story 10a.1: Filter bar for consolidated home view (AC #2)
import { HistoryFilterBar } from '../components/history/HistoryFilterBar';
// Story 14.15b: Selection mode and group modals for Dashboard
import { AssignGroupModal } from '../components/history/AssignGroupModal';
import { CreateGroupModal } from '../components/history/CreateGroupModal';
import { DeleteTransactionsModal } from '../components/history/DeleteTransactionsModal';
import type { TransactionPreview } from '../components/history/DeleteTransactionsModal';
import { useSelectionMode } from '../hooks/useSelectionMode';
import { useGroups } from '../hooks/useGroups';
import { assignTransactionsToGroup, createGroup } from '../services/groupService';
import { deleteTransactionsBatch } from '../services/firestore';
import { getFirestore } from 'firebase/firestore';
// Story 9.12: Category translations
import type { Language } from '../utils/translations';
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
import { getCategoryColorsAuto, getCategoryBackgroundAuto, getCategoryPillColors, type ThemeName } from '../config/categoryColors';
import { getCategoryEmoji } from '../utils/categoryEmoji';
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
    // Story 14.15b: Group display fields
    groupId?: string;
    groupName?: string;
    groupColor?: string;
}

interface DashboardViewProps {
    /** Story 10a.1: Used as fallback when allTransactions is empty */
    transactions: Transaction[];
    t: (key: string) => string;
    currency: string;
    dateFormat: string;
    theme: string;
    formatCurrency: (amount: number, currency: string) => string;
    formatDate: (date: string, format: string) => string;
    getSafeDate: (val: any) => string;
    onCreateNew: () => void;
    onViewTrends: (month: string | null) => void;
    onEditTransaction: (transaction: Transaction) => void;
    /** Story 14.12: Trigger scan action for quick action button */
    onTriggerScan?: () => void;
    /** Story 10a.1: All transactions for display (now used for full paginated list) */
    allTransactions?: Transaction[];
    /** Story 9.12: Language for category translations */
    lang?: Language;
    /** Story 14.12: Navigate to history view */
    onViewHistory?: () => void;
    /** Story 14.14: Color theme for unified category colors */
    colorTheme?: ThemeName;
    // Story 14.15b: Selection mode props for Dashboard
    /** Authenticated user ID for group operations */
    userId?: string | null;
    /** App ID for Firestore path */
    appId?: string;
    /** Callback when transactions are deleted */
    onTransactionsDeleted?: (deletedIds: string[]) => void;
}

// Story 14.12: Number of recent transactions to show (collapsed/expanded)
const RECENT_TRANSACTIONS_COLLAPSED = 5;
const RECENT_TRANSACTIONS_EXPANDED = 10;

// Story 14.12: Carousel slide configuration
type CarouselSlide = 0 | 1 | 2;
// CAROUSEL_TITLES keys for translation lookup
const CAROUSEL_TITLE_KEYS = ['thisMonthCarousel', 'monthToMonth', 'lastFourMonths'] as const;

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
const MONTH_FULL_KEYS = [
    'monthJanFull', 'monthFebFull', 'monthMarFull', 'monthAprFull', 'monthMayFull', 'monthJunFull',
    'monthJulFull', 'monthAugFull', 'monthSepFull', 'monthOctFull', 'monthNovFull', 'monthDecFull'
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
interface AnimatedTreemapCardProps {
    cat: { name: string; amount: number; percent: number; count: number; bgColor: string; fgColor: string };
    displayName: string; // Translated category name
    isMainCell: boolean;
    gridRow?: string;
    gridColumn: string;
    animationKey: number;
    getValueFontSize: (percent: number, isMainCell: boolean) => string;
}

const AnimatedTreemapCard: React.FC<AnimatedTreemapCardProps> = ({
    cat,
    displayName,
    isMainCell,
    gridRow,
    gridColumn,
    animationKey,
    getValueFontSize
}) => {
    // Pass animationKey to useCountUp to re-trigger animation when carousel slides
    const animatedAmount = useCountUp(Math.round(cat.amount / 1000), { duration: 1200, startValue: 0, key: animationKey });
    const animatedPercent = useCountUp(Math.round(cat.percent), { duration: 1200, startValue: 0, key: animationKey });
    // Animated count for the badge
    const animatedCount = useCountUp(cat.count, { duration: 800, startValue: 0, key: animationKey });

    // Circle sizes - responsive: smaller on narrow screens
    // Main cell: 36px, Small cells: 28px (increased from 24px for better readability)
    const circleSize = isMainCell ? 36 : 28;
    const strokeWidth = isMainCell ? 3 : 2;
    // Override font size for small cells to improve readability (default 0.38 multiplier is too small)
    const circleFontSize = isMainCell ? undefined : 11;

    // Story 14.14: Get category emoji for display
    const emoji = getCategoryEmoji(cat.name);
    const emojiFontSize = isMainCell ? '16px' : '13px';

    return (
        <div
            key={`${cat.name}-${animationKey}`}
            className="rounded-lg flex flex-col justify-between overflow-hidden"
            style={{
                backgroundColor: cat.bgColor,
                gridRow: gridRow,
                gridColumn: gridColumn,
                minHeight: 0,
                // Compact padding for mobile screens
                padding: isMainCell ? '8px 8px' : '6px 6px'
            }}
        >
            {isMainCell ? (
                <>
                    {/* Top row: Category emoji + Category name */}
                    {/* Story 14.14: Emoji replaces count badge, no background needed */}
                    <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: emojiFontSize, lineHeight: 1 }}>{emoji}</span>
                        <div className="font-bold truncate" style={{ fontSize: '14px', color: cat.fgColor, lineHeight: 1.2 }}>{displayName}</div>
                    </div>
                    {/* Bottom row: Amount + Transaction count pill + Percentage circle */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className="font-bold" style={{ fontSize: getValueFontSize(cat.percent, true), color: cat.fgColor, lineHeight: 1 }}>
                                ${animatedAmount}k
                            </div>
                            {/* Transaction count pill - uses app background color for theme consistency */}
                            <span
                                className="inline-flex items-center gap-[2px] px-[5px] py-[2px] rounded-full"
                                style={{
                                    backgroundColor: 'var(--bg)',
                                    color: cat.fgColor,
                                    fontSize: '11px',
                                }}
                            >
                                <Package size={11} strokeWidth={2} />
                                {animatedCount}
                            </span>
                        </div>
                        <CircularProgress
                            animatedPercent={animatedPercent}
                            size={circleSize}
                            strokeWidth={strokeWidth}
                            fgColor={cat.fgColor}
                        />
                    </div>
                </>
            ) : (
                <>
                    {/* Top row: Category emoji + Category name - compact for small screens */}
                    {/* Story 14.14: Emoji replaces count badge */}
                    <div className="flex items-center gap-1 min-w-0">
                        <span style={{ fontSize: emojiFontSize, lineHeight: 1 }}>{emoji}</span>
                        <div className="font-bold truncate" style={{ fontSize: '11px', color: cat.fgColor, lineHeight: 1.2 }}>{displayName}</div>
                    </div>
                    {/* Bottom row: Amount + Transaction count pill + Percentage circle */}
                    <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                            <div className="font-bold" style={{ fontSize: getValueFontSize(cat.percent, false), color: cat.fgColor, lineHeight: 1 }}>
                                ${animatedAmount}k
                            </div>
                            {/* Transaction count pill - uses app background color for theme consistency */}
                            <span
                                className="inline-flex items-center gap-[2px] px-[4px] py-[1px] rounded-full"
                                style={{
                                    backgroundColor: 'var(--bg)',
                                    color: cat.fgColor,
                                    fontSize: '10px',
                                }}
                            >
                                <Package size={10} strokeWidth={2} />
                                {animatedCount}
                            </span>
                        </div>
                        <CircularProgress
                            animatedPercent={animatedPercent}
                            size={circleSize}
                            strokeWidth={strokeWidth}
                            fontSize={circleFontSize}
                            fgColor={cat.fgColor}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
    transactions,
    t,
    currency,
    dateFormat,
    theme,
    formatCurrency,
    formatDate,
    // onCreateNew - kept in interface for backwards compatibility, unused per mockup alignment
    onViewTrends,
    onEditTransaction,
    // onTriggerScan - kept in interface for backwards compatibility, FAB in nav handles scan
    allTransactions = [],
    // Story 9.12: Language for translations
    lang = 'en',
    onViewHistory,
    // Story 14.14: Color theme for unified category colors
    colorTheme = 'normal',
    // Story 14.15b: Selection mode props
    userId = null,
    appId = 'boletapp',
    onTransactionsDeleted,
}) => {
    // Story 7.12: Theme-aware styling using CSS variables (AC #1, #2, #8)
    const isDark = theme === 'dark';

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
    const [carouselCollapsed, setCarouselCollapsed] = useState(false);
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
    // Story 14.12: Swipe gesture tracking for carousel
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    // Story 14.12: Animation trigger key - increments when slide changes to restart animations
    const [animationKey, setAnimationKey] = useState(0);
    // Story 14.12: Temporary state for picker (only applied when "Aplicar" is clicked)
    const [pickerMonth, setPickerMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });

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
    } = useSelectionMode();

    // Story 14.15b: Groups hook for group assignment
    const { groups } = useGroups(userId, appId);

    // Story 14.15b: Modal states
    const [showAssignGroupModal, setShowAssignGroupModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    // Display: All categories >10% + first category ≤10% + "Otro" aggregating rest
    const treemapCategories = useMemo(() => {
        // Aggregate by category
        const categoryTotals: Record<string, { amount: number; count: number }> = {};
        monthTransactions.forEach(tx => {
            const cat = tx.category || 'Otro';
            if (!categoryTotals[cat]) {
                categoryTotals[cat] = { amount: 0, count: 0 };
            }
            categoryTotals[cat].amount += tx.total;
            categoryTotals[cat].count += 1;
        });

        // Convert to array and sort by amount (highest first)
        // Story 14.21: Include both bg and fg colors for proper text contrast
        const sorted = Object.entries(categoryTotals)
            .map(([name, data]) => {
                const colors = getTreemapColors(name);
                return {
                    name,
                    amount: data.amount,
                    count: data.count,
                    bgColor: colors.bg,
                    fgColor: colors.fg,
                    percent: monthTotal > 0 ? (data.amount / monthTotal) * 100 : 0,
                };
            })
            .sort((a, b) => b.amount - a.amount);

        // Apply selection criteria:
        // 1. All categories >10% (excluding 'Otro'/'Other' which will be merged into aggregated Otro)
        // 2. First category ≤10% (highest below threshold, excluding 'Otro'/'Other')
        // 3. Everything else goes to "Otro" (including any existing 'Otro'/'Other' transactions)
        const isOtroCategory = (name: string) => name === 'Otro' || name === 'Other';
        const aboveThreshold = sorted.filter(c => c.percent > 10 && !isOtroCategory(c.name));
        const belowThreshold = sorted.filter(c => c.percent <= 10 && !isOtroCategory(c.name));
        const existingOtro = sorted.find(c => isOtroCategory(c.name));

        const result = [...aboveThreshold];

        // Add first category ≤10% if exists
        if (belowThreshold.length > 0) {
            result.push(belowThreshold[0]);
        }

        // Aggregate remaining into "Otro" (skip the first below-threshold which we already added)
        // Also include any existing 'Otro'/'Other' category transactions
        const remaining = belowThreshold.slice(1);
        let otroAmount = remaining.reduce((sum, cat) => sum + cat.amount, 0);
        let otroCount = remaining.reduce((sum, cat) => sum + cat.count, 0);

        // Merge existing 'Otro'/'Other' category into aggregated Otro
        if (existingOtro) {
            otroAmount += existingOtro.amount;
            otroCount += existingOtro.count;
        }

        if (otroAmount > 0 || otroCount > 0) {
            const otroColors = getTreemapColors('Otro');
            result.push({
                name: 'Otro',
                amount: otroAmount,
                count: otroCount,
                bgColor: otroColors.bg,
                fgColor: otroColors.fg,
                percent: monthTotal > 0 ? (otroAmount / monthTotal) * 100 : 0,
            });
        }

        return result;
    }, [monthTransactions, monthTotal]);


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

    // Story 14.12: Swipe gesture handlers for carousel
    const minSwipeDistance = 50; // Minimum distance to trigger swipe

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null); // Reset
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
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
    };

    // Story 14.12: Toggle carousel collapse
    const toggleCarouselCollapse = () => {
        setCarouselCollapsed(prev => !prev);
    };

    // Story 14.12: Recientes carousel navigation with slide animation
    const goToRecientesSlide = (targetSlide: 0 | 1, direction: 'left' | 'right') => {
        setRecientesSlideDirection(direction);
        setRecientesSlide(targetSlide);
        setRecientesAnimKey(prev => prev + 1); // Re-trigger staggered item animations
    };

    // Story 14.12: Toggle month picker and sync picker state
    const toggleMonthPicker = () => {
        if (!showMonthPicker) {
            // Opening picker - sync picker state with current selection
            setPickerMonth({ ...selectedMonth });
        }
        setShowMonthPicker(!showMonthPicker);
    };

    // Story 14.12: Apply picker selection to actual state and trigger animations
    const applyPickerSelection = () => {
        // Only trigger animations if month actually changed
        if (pickerMonth.year !== selectedMonth.year || pickerMonth.month !== selectedMonth.month) {
            setAnimationKey(prev => prev + 1); // Trigger all carousel animations
            setSelectedRadarCategory(null); // Clear radar selection
            setBumpTooltip(null); // Clear bump tooltip
        }
        setSelectedMonth({ ...pickerMonth });
        setShowMonthPicker(false);
    };

    // Story 14.12: Update picker state (temporary, not applied until "Aplicar")
    const updatePickerMonth = (year: number, month: number) => {
        setPickerMonth({ year, month });
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
    const radarChartData = useMemo(() => {
        // Get previous month
        const prevMonth = selectedMonth.month === 0 ? 11 : selectedMonth.month - 1;
        const prevYear = selectedMonth.month === 0 ? selectedMonth.year - 1 : selectedMonth.year;
        const prevMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

        // Get transactions for current and previous month
        const currMonthTx = monthTransactions;
        const prevMonthTx = allTx.filter(tx => tx.date.startsWith(prevMonthStr));

        // Aggregate by category for both months
        const currTotals: Record<string, number> = {};
        const prevTotals: Record<string, number> = {};
        let totalCurrMonth = 0;
        let totalPrevMonth = 0;

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

        // Get all unique categories with their percentage of current month budget
        const allCategories = new Set([...Object.keys(currTotals), ...Object.keys(prevTotals)]);
        const allCategoriesWithData = Array.from(allCategories)
            .map(name => ({
                name,
                currAmount: currTotals[name] || 0,
                prevAmount: prevTotals[name] || 0,
                percent: totalCurrMonth > 0 ? ((currTotals[name] || 0) / totalCurrMonth) * 100 : 0,
                emoji: getCategoryEmoji(name),
                color: getCategoryBackgroundAuto(name),
            }))
            .sort((a, b) => b.currAmount - a.currAmount);

        // Apply selection criteria:
        // 1. All categories >10%
        // 2. First category ≤10%
        // 3. Everything else goes to "Otro"
        const significant = allCategoriesWithData.filter(c => c.percent > 10 && c.name !== 'Otro');
        const belowThreshold = allCategoriesWithData.filter(c => c.percent <= 10 && c.name !== 'Otro');

        let selectedCategories = [...significant];

        // Add first category ≤10% if exists
        if (belowThreshold.length > 0) {
            selectedCategories.push(belowThreshold[0]);
        }

        // Aggregate remaining into "Otro" (exclude already selected categories)
        const selectedNames = new Set(selectedCategories.map(c => c.name));
        const remaining = allCategoriesWithData.filter(c => !selectedNames.has(c.name) && c.name !== 'Otro');

        // Calculate "Otro" totals from remaining categories + any existing "Otro" transactions
        const existingOtro = allCategoriesWithData.find(c => c.name === 'Otro');
        let otroAmount = remaining.reduce((sum, c) => sum + c.currAmount, 0);
        let otroPrevAmount = remaining.reduce((sum, c) => sum + c.prevAmount, 0);
        if (existingOtro) {
            otroAmount += existingOtro.currAmount;
            otroPrevAmount += existingOtro.prevAmount;
        }

        // Always include "Otro" if there's any remaining data
        if (otroAmount > 0 || otroPrevAmount > 0) {
            selectedCategories.push({
                name: 'Otro',
                currAmount: otroAmount,
                prevAmount: otroPrevAmount,
                percent: totalCurrMonth > 0 ? (otroAmount / totalCurrMonth) * 100 : 0,
                emoji: getCategoryEmoji('Otro'),
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
    }, [monthTransactions, allTx, selectedMonth]);

    // Story 14.12: Translate month labels for radar chart (outside useMemo to access t)
    const radarCurrentMonthLabel = t(MONTH_SHORT_KEYS[radarChartData.currentMonthIdx]);
    const radarPrevMonthLabel = t(MONTH_SHORT_KEYS[radarChartData.prevMonthIdx]);


    // Story 14.12: Bump chart data for "Ultimos 4 Meses" view
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

        // Calculate category totals per month
        const categoryRankings: Record<string, { amounts: number[]; color: string }> = {};

        months.forEach((m, idx) => {
            const monthStr = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
            const monthTx = allTx.filter(tx => tx.date.startsWith(monthStr));

            // Aggregate by category
            const totals: Record<string, number> = {};
            monthTx.forEach(tx => {
                const cat = tx.category || 'Otro';
                totals[cat] = (totals[cat] || 0) + tx.total;
            });

            // Update rankings
            // Story 14.21: Use fg colors (vibrant) for line charts/legends (always colorful)
            // Use getCategoryPillColors to ignore fontColorMode - charts/legends always colorful
            Object.entries(totals).forEach(([cat, amount]) => {
                if (!categoryRankings[cat]) {
                    const colors = getCategoryPillColors(cat);
                    categoryRankings[cat] = { amounts: [0, 0, 0, 0], color: colors.fg };
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
        const sortedCategories = Object.entries(categoryRankings)
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

        // Aggregate remaining categories into "Otro"
        let categoryTotals = top4;
        if (rest.length > 0) {
            const otroAmounts = rest.reduce(
                (sums, cat) => sums.map((s, i) => s + cat.amounts[i]),
                [0, 0, 0, 0]
            );
            const otroTotal = otroAmounts.reduce((sum, a) => sum + a, 0);

            // Calculate ranks for Otro based on its amounts
            const otroRanks = months.map((_, monthIdx) => {
                const allAmounts = [...top4.map(c => c.amounts[monthIdx]), otroAmounts[monthIdx]];
                const sorted = [...allAmounts].sort((a, b) => b - a);
                return sorted.indexOf(otroAmounts[monthIdx]) + 1;
            });

            // Story 14.21: Use fg color for "Otro" from unified color system
            // Use getCategoryPillColors - charts/legends always colorful
            const otroColors = getCategoryPillColors('Otro');
            categoryTotals = [
                ...top4,
                {
                    name: 'Otro',
                    color: otroColors.fg,
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
    }, [allTx, selectedMonth]);

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
    const recentTransactionsByScan = useMemo(() => {
        // Sort ALL transactions by createdAt descending (most recently scanned first)
        const sorted = [...filteredTransactions].sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bDate - aDate;
        });
        const limit = recientesExpanded ? RECENT_TRANSACTIONS_EXPANDED : RECENT_TRANSACTIONS_COLLAPSED;
        return sorted.slice(0, limit);
    }, [filteredTransactions, recientesExpanded]);

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

    // Story 14.12: Handle View All click (AC #3)
    const handleViewAll = () => {
        if (onViewHistory) {
            onViewHistory();
        } else {
            setShowFullList(true);
        }
    };

    // Story 14.15b: Modal handlers for selection mode
    const handleOpenAssignGroup = () => {
        if (selectedIds.size > 0) {
            setShowAssignGroupModal(true);
        }
    };

    const handleOpenDelete = () => {
        if (selectedIds.size > 0) {
            setShowDeleteModal(true);
        }
    };

    // Story 14.15b: Handle group assignment from AssignGroupModal
    const handleAssignGroup = async (groupId: string, groupName: string) => {
        if (!userId || selectedIds.size === 0) return;

        const db = getFirestore();
        const selectedTxIds = Array.from(selectedIds);

        // Find the group to get its color
        const group = groups.find(g => g.id === groupId);
        const groupColor = group?.color || '#10b981';

        // Build transaction totals map
        const transactionTotals = new Map<string, number>();
        recentTransactions.forEach(tx => {
            const transaction = tx as Transaction;
            if (selectedIds.has(transaction.id)) {
                transactionTotals.set(transaction.id, transaction.total);
            }
        });

        try {
            await assignTransactionsToGroup(
                db,
                userId,
                appId,
                selectedTxIds,
                groupId,
                groupName,
                groupColor,
                transactionTotals
            );
            setShowAssignGroupModal(false);
            exitSelectionMode();
        } catch (error) {
            console.error('Error assigning group:', error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!userId || selectedIds.size === 0) return;

        const db = getFirestore();
        const selectedTxIds = Array.from(selectedIds);

        try {
            await deleteTransactionsBatch(db, userId, appId, selectedTxIds);
            onTransactionsDeleted?.(selectedTxIds);
            setShowDeleteModal(false);
            exitSelectionMode();
        } catch (error) {
            console.error('Error deleting transactions:', error);
        }
    };

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
                        currency: transaction.currency || currency,
                        thumbnailUrl: transaction.thumbnailUrl,
                        imageUrls: transaction.imageUrls,
                        items: transaction.items || [],
                        groupName: transaction.groupName,
                        groupColor: transaction.groupColor,
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
                    isDuplicate={isDuplicate}
                    onClick={() => onEditTransaction(transaction)}
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
                        {/* Carousel Header with title, expand/collapse, and navigation */}
                        <div className="flex justify-between items-center p-3 pb-0">
                            <div className="flex items-center gap-2 relative">
                                {/* Title with month picker dropdown trigger (toggle on click) */}
                                <button
                                    ref={monthPickerToggleRef}
                                    onClick={toggleMonthPicker}
                                    className="flex items-center gap-1 font-semibold hover:opacity-80 transition-opacity"
                                    style={{ color: 'var(--text-primary)' }}
                                    data-testid="carousel-title"
                                >
                                    <span>{t(CAROUSEL_TITLE_KEYS[carouselSlide])}</span>
                                    <ChevronDown size={14} className={`transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Month/Year Picker Dropdown - Two rows with left/right navigation + Apply button */}
                                {showMonthPicker && (
                                    <div
                                        ref={monthPickerRef}
                                        className="absolute top-full left-0 mt-2 z-50 rounded-lg border shadow-lg p-3 min-w-[180px]"
                                        style={{
                                            backgroundColor: 'var(--surface)',
                                            borderColor: isDark ? '#334155' : '#e2e8f0'
                                        }}
                                        data-testid="month-picker"
                                    >
                                        {/* Year Row - left/right navigation */}
                                        <div className="flex items-center justify-between mb-2">
                                            <button
                                                onClick={() => updatePickerMonth(pickerMonth.year - 1, pickerMonth.month)}
                                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                aria-label="Previous year"
                                                data-testid="prev-year-btn"
                                            >
                                                <ChevronLeft size={16} style={{ color: 'var(--secondary)' }} />
                                            </button>
                                            <span className="font-semibold text-sm min-w-[60px] text-center" style={{ color: 'var(--text-primary)' }}>
                                                {pickerMonth.year}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const now = new Date();
                                                    // Don't allow going past current year
                                                    if (pickerMonth.year < now.getFullYear()) {
                                                        updatePickerMonth(pickerMonth.year + 1, pickerMonth.month);
                                                    }
                                                }}
                                                disabled={pickerMonth.year >= new Date().getFullYear()}
                                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                aria-label="Next year"
                                                data-testid="next-year-btn"
                                            >
                                                <ChevronRight size={16} style={{ color: 'var(--secondary)' }} />
                                            </button>
                                        </div>

                                        {/* Month Row - left/right navigation */}
                                        <div className="flex items-center justify-between mb-3">
                                            <button
                                                onClick={() => {
                                                    const newMonth = pickerMonth.month === 0 ? 11 : pickerMonth.month - 1;
                                                    const newYear = pickerMonth.month === 0 ? pickerMonth.year - 1 : pickerMonth.year;
                                                    updatePickerMonth(newYear, newMonth);
                                                }}
                                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                                aria-label="Previous month"
                                                data-testid="prev-month-picker-btn"
                                            >
                                                <ChevronLeft size={16} style={{ color: 'var(--secondary)' }} />
                                            </button>
                                            <span className="font-medium text-sm min-w-[80px] text-center" style={{ color: 'var(--text-primary)' }}>
                                                {t(MONTH_FULL_KEYS[pickerMonth.month])}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const now = new Date();
                                                    const newMonth = pickerMonth.month === 11 ? 0 : pickerMonth.month + 1;
                                                    const newYear = pickerMonth.month === 11 ? pickerMonth.year + 1 : pickerMonth.year;
                                                    // Don't allow going past current month
                                                    const isFuture = newYear > now.getFullYear() ||
                                                        (newYear === now.getFullYear() && newMonth > now.getMonth());
                                                    if (!isFuture) {
                                                        updatePickerMonth(newYear, newMonth);
                                                    }
                                                }}
                                                disabled={(() => {
                                                    const now = new Date();
                                                    const newMonth = pickerMonth.month === 11 ? 0 : pickerMonth.month + 1;
                                                    const newYear = pickerMonth.month === 11 ? pickerMonth.year + 1 : pickerMonth.year;
                                                    return newYear > now.getFullYear() ||
                                                        (newYear === now.getFullYear() && newMonth > now.getMonth());
                                                })()}
                                                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                aria-label="Next month"
                                                data-testid="next-month-picker-btn"
                                            >
                                                <ChevronRight size={16} style={{ color: 'var(--secondary)' }} />
                                            </button>
                                        </div>

                                        {/* Apply Button */}
                                        <button
                                            onClick={applyPickerSelection}
                                            className="w-full py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
                                            style={{ backgroundColor: 'var(--primary)' }}
                                            data-testid="apply-month-picker-btn"
                                        >
                                            {t('apply')}
                                        </button>
                                    </div>
                                )}

                                {/* Expand/Collapse Button */}
                                <button
                                    onClick={toggleCarouselCollapse}
                                    className="w-5 h-5 rounded-full border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    style={{ borderColor: 'var(--border-medium)' }}
                                    aria-label={carouselCollapsed ? 'Expand carousel' : 'Collapse carousel'}
                                    data-testid="carousel-collapse-btn"
                                >
                                    {carouselCollapsed ? (
                                        <Plus size={12} style={{ color: 'var(--secondary)' }} />
                                    ) : (
                                        <Minus size={12} style={{ color: 'var(--secondary)' }} />
                                    )}
                                </button>
                            </div>

                            {/* Navigation Arrows - press squish effect per design system */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={goToPrevSlide}
                                    className="w-6 h-6 rounded-full border flex items-center justify-center focus:outline-none select-none"
                                    style={{
                                        borderColor: 'var(--border-medium)',
                                        WebkitTapHighlightColor: 'transparent'
                                    }}
                                    onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
                                    onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
                                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                    aria-label="Previous slide"
                                    data-testid="prev-slide-btn"
                                >
                                    <ChevronLeft size={14} style={{ color: 'var(--secondary)' }} />
                                </button>
                                <button
                                    onClick={goToNextSlide}
                                    className="w-6 h-6 rounded-full border flex items-center justify-center focus:outline-none select-none"
                                    style={{
                                        borderColor: 'var(--border-medium)',
                                        WebkitTapHighlightColor: 'transparent'
                                    }}
                                    onTouchStart={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
                                    onTouchEnd={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
                                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                    aria-label="Next slide"
                                    data-testid="next-slide-btn"
                                >
                                    <ChevronRight size={14} style={{ color: 'var(--secondary)' }} />
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
                                        {treemapCategories.length > 0 ? (
                                            (() => {
                                                // Per mockup: show up to 5 categories (1 left + 4 right)
                                                // treemapCategories already has: all >10% + first ≤10% + Otro
                                                const displayCategories = treemapCategories.slice(0, 5);
                                                const rightColumnCount = Math.max(displayCategories.length - 1, 1);
                                                // Use 4 rows max for right column
                                                const gridRowCount = Math.min(rightColumnCount, 4);
                                                const gridRows = Array(gridRowCount).fill('1fr').join(' ');

                                                // Calculate proportional font sizes based on percentage
                                                // Larger percentage = larger font, smaller = smaller font
                                                const getValueFontSize = (percent: number, isMainCell: boolean) => {
                                                    if (isMainCell) return '22px'; // Main cell always larger
                                                    if (percent >= 25) return '18px';
                                                    if (percent >= 15) return '16px';
                                                    return '14px'; // Smaller cells like "Otro"
                                                };

                                                return (
                                                    <div
                                                        className="grid gap-1 h-full"
                                                        style={{
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gridTemplateRows: gridRows
                                                        }}
                                                    >
                                                        {/* First category spans all rows on left column - with animated values */}
                                                        {displayCategories[0] && (
                                                            <AnimatedTreemapCard
                                                                key={`main-${animationKey}`}
                                                                cat={displayCategories[0]}
                                                                displayName={displayCategories[0].name === 'Otro' || displayCategories[0].name === 'Other' ? t('otherCategory') : translateCategory(displayCategories[0].name, lang)}
                                                                isMainCell={true}
                                                                gridRow={`1 / ${gridRowCount + 1}`}
                                                                gridColumn="1"
                                                                animationKey={animationKey}
                                                                getValueFontSize={getValueFontSize}
                                                            />
                                                        )}

                                                        {/* Right column: one cell per remaining category (max 4) - with animated values */}
                                                        {displayCategories.slice(1).map((cat, idx) => (
                                                            <AnimatedTreemapCard
                                                                key={`${cat.name}-${animationKey}`}
                                                                cat={cat}
                                                                displayName={cat.name === 'Otro' || cat.name === 'Other' ? t('otherCategory') : translateCategory(cat.name, lang)}
                                                                isMainCell={false}
                                                                gridRow={`${idx + 1} / ${idx + 2}`}
                                                                gridColumn="2"
                                                                animationKey={animationKey}
                                                                getValueFontSize={getValueFontSize}
                                                            />
                                                        ))}
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
                                        {/* Layout: Total del mes | [count badge] | Progress bar | days | Amount */}
                                        <div
                                            className="pt-3 mt-3 border-t flex-shrink-0"
                                            style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {/* Total label */}
                                                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--secondary)' }}>
                                                    Total del mes
                                                </span>
                                                {/* Transaction count badge with tooltip on click */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowCountTooltip(!showCountTooltip)}
                                                        className="flex items-center justify-center font-bold cursor-pointer transition-transform hover:scale-110"
                                                        style={{
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: '50%',
                                                            backgroundColor: 'var(--primary)',
                                                            color: 'white',
                                                            fontSize: '12px',
                                                            lineHeight: 1,
                                                            flexShrink: 0,
                                                            border: 'none',
                                                            padding: 0
                                                        }}
                                                        aria-label="Total transacciones"
                                                    >
                                                        {animatedMonthCount}
                                                    </button>
                                                    {/* Tooltip popup */}
                                                    {showCountTooltip && (
                                                        <div
                                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                                                            style={{
                                                                backgroundColor: isDark ? '#1e293b' : '#0f172a',
                                                                color: 'white',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                                            }}
                                                        >
                                                            Total transacciones
                                                            {/* Tooltip arrow */}
                                                            <div
                                                                className="absolute top-full left-1/2 -translate-x-1/2"
                                                                style={{
                                                                    width: 0,
                                                                    height: 0,
                                                                    borderLeft: '5px solid transparent',
                                                                    borderRight: '5px solid transparent',
                                                                    borderTop: `5px solid ${isDark ? '#1e293b' : '#0f172a'}`
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
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
                                                    <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
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
                                                {selectedRadarCategory && (
                                                    <React.Fragment key={selectedRadarCategory.name}>
                                                        {/* Left side - Previous month (secondary) */}
                                                        <div
                                                            className="absolute left-0 top-1 flex flex-col items-start animate-comparison-left"
                                                            style={{ maxWidth: '80px' }}
                                                        >
                                                            <div
                                                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium shadow-sm"
                                                                style={{
                                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                                                                    color: 'var(--secondary)'
                                                                }}
                                                            >
                                                                <span className="opacity-70">{radarPrevMonthLabel}</span>
                                                                <span>${Math.round(selectedRadarCategory.prevAmount / 1000)}k</span>
                                                            </div>
                                                            <div
                                                                className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                                                style={{
                                                                    backgroundColor: selectedRadarCategory.color + '25',
                                                                    color: 'var(--primary)'
                                                                }}
                                                            >
                                                                <span>{selectedRadarCategory.emoji}</span>
                                                                <span className="truncate" style={{ maxWidth: '55px' }}>{selectedRadarCategory.name === 'Otro' || selectedRadarCategory.name === 'Other' ? t('otherCategory') : translateCategory(selectedRadarCategory.name, lang)}</span>
                                                            </div>
                                                        </div>

                                                        {/* Right side - Current month (primary) + change */}
                                                        <div
                                                            className="absolute right-0 top-1 flex flex-col items-end animate-comparison-right"
                                                            style={{ maxWidth: '80px' }}
                                                        >
                                                            <div
                                                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold shadow-sm"
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
                                                                        className="inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
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
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                            <span style={{ color: cat.color }}>
                                                                {cat.name === 'Otro' || cat.name === 'Other' ? t('otherCategory') : translateCategory(cat.name, lang)} #{idx + 1}
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
                                    {canExpand && (
                                        <button
                                            onClick={() => setRecientesExpanded(!recientesExpanded)}
                                            className="w-5 h-5 rounded-full border flex items-center justify-center"
                                            style={{ borderColor: 'var(--border-medium)' }}
                                            aria-label={recientesExpanded ? 'Colapsar' : 'Expandir'}
                                            data-testid="expand-recientes-btn"
                                        >
                                            <span className="text-xs" style={{ color: 'var(--secondary)' }}>
                                                {recientesExpanded ? '−' : '+'}
                                            </span>
                                        </button>
                                    )}
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
                                        onClick={handleOpenAssignGroup}
                                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                        style={{ backgroundColor: 'var(--primary)' }}
                                        aria-label="Asignar grupo"
                                        disabled={selectedIds.size === 0}
                                    >
                                        <Layers size={16} style={{ color: 'white' }} />
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

                {/* Story 14.15b: Group Assignment Modal */}
                {showAssignGroupModal && (
                    <AssignGroupModal
                        isOpen={showAssignGroupModal}
                        onClose={() => setShowAssignGroupModal(false)}
                        groups={groups}
                        onAssign={handleAssignGroup}
                        onCreateNew={() => {
                            setShowAssignGroupModal(false);
                            setShowCreateGroupModal(true);
                        }}
                        selectedCount={selectedIds.size}
                        t={t}
                    />
                )}

                {/* Story 14.15b: Create Group Modal */}
                {showCreateGroupModal && userId && (
                    <CreateGroupModal
                        isOpen={showCreateGroupModal}
                        selectedCount={selectedIds.size}
                        onClose={() => setShowCreateGroupModal(false)}
                        onCreate={async (name: string, color: string) => {
                            // Create the group and assign selected transactions
                            const db = getFirestore();
                            const groupId = await createGroup(db, userId, appId, { name, color });
                            if (groupId) {
                                await handleAssignGroup(groupId, name);
                            }
                            setShowCreateGroupModal(false);
                        }}
                        onBack={() => {
                            setShowCreateGroupModal(false);
                            setShowAssignGroupModal(true);
                        }}
                        t={t}
                    />
                )}

                {/* Story 14.15b: Delete Transactions Modal */}
                {showDeleteModal && (
                    <DeleteTransactionsModal
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onDelete={handleConfirmDelete}
                        transactions={getSelectedTransactions()}
                        t={t}
                        formatCurrency={formatCurrency}
                        currency={currency}
                    />
                )}
            </div>
        </PageTransition>
    );
};
