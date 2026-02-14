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
import { ChevronLeft, ChevronRight, Receipt, Package } from 'lucide-react';
import { ImageViewer } from '@/components/ImageViewer';
import type { TransactionPreview } from '@features/history/components/DeleteTransactionsModal';
import { useModalActions } from '@managers/ModalManager';
import { useSelectionMode } from '@/hooks/useSelectionMode';
import { deleteTransactionsBatch } from '@/services/firestore';
import { getFirestore } from 'firebase/firestore';
import { translateCategory } from '@/utils/categoryTranslations';
import { DashboardRadarSlide } from './DashboardRadarSlide';
import { DashboardBumpSlide } from './DashboardBumpSlide';
import { useHistoryFilters } from '@shared/hooks/useHistoryFilters';
import { getDuplicateIds } from '@/services/duplicateDetectionService';
import {
    extractAvailableFilters,
    filterTransactionsByHistoryFilters,
} from '@shared/utils/historyFilterUtils';
import { PageTransition } from '@/components/animation/PageTransition';
import { TransitionChild } from '@/components/animation/TransitionChild';
import { useCountUp } from '@/hooks/useCountUp';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
    expandStoreCategoryGroup,
    expandItemCategoryGroup,
    type StoreCategoryGroup,
    type ItemCategoryGroup,
} from '@/config/categoryColors';
import { getCategoryEmoji } from '@/utils/categoryEmoji';
import {
    translateStoreCategoryGroup,
    translateItemCategoryGroup,
    getStoreCategoryGroupEmoji,
    getItemCategoryGroupEmoji,
    getItemCategoryEmoji,
} from '@/utils/categoryTranslations';
import { calculateTreemapLayout } from '@/utils/treemapLayout';
import { HistoryNavigationPayload, DrillDownPath } from '@features/analytics/utils/analyticsToHistoryFilters';
import { useHistoryNavigation } from '@/shared/hooks';
import { useNavigationActions } from '@/shared/stores';
import { useDashboardViewData, type UseDashboardViewDataReturn } from './useDashboardViewData';
import { TransactionCard } from '@/components/transactions';
import { getStorageString, setStorageString } from '@/utils/storage';
import { toMillis } from '@/utils/timestamp';
import { computeRadarChartData, computeBumpChartData } from './chartDataHelpers';
import {
    computeStoreCategoriesData, computeStoreGroupsData,
    computeItemCategoriesData, computeItemGroupsData,
} from './categoryDataHelpers';
import type { SortType, CarouselSlide, TreemapViewMode, Transaction } from './types';
import {
    CAROUSEL_TITLE_KEYS, VIEW_MODE_CONFIG,
    MONTH_SHORT_KEYS,
    RECENT_TRANSACTIONS_COLLAPSED, RECENT_TRANSACTIONS_EXPANDED,
} from './types';
import { AnimatedTreemapCard } from './AnimatedTreemapCard';
import { DashboardFullListView } from './DashboardFullListView';
import { DashboardRecientesSection } from './DashboardRecientesSection';

/** DashboardView props - minimal, only test overrides and App-level callbacks. */
export interface DashboardViewProps {
    _testOverrides?: Partial<UseDashboardViewDataReturn & {
        onTransactionsDeleted?: (deletedIds: string[]) => void;
    }>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ _testOverrides }) => {
    const hookData = useDashboardViewData();

    // Merge hook data with test overrides (test overrides take precedence)
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
        onCreateNew: _onCreateNew,
        onViewTrends,
        onEditTransaction,
        onTriggerScan: _onTriggerScan,
        onViewRecentScans,
    } = { ...hookData, ..._testOverrides };

    const onTransactionsDeleted = _testOverrides?.onTransactionsDeleted;
    const isDark = theme === 'dark';

    // Navigation hooks
    const { handleNavigateToHistory } = useHistoryNavigation();
    const { setView } = useNavigationActions();
    const onNavigateToHistory = handleNavigateToHistory;
    const onViewHistory = () => setView('history');

    useReducedMotion();

    // ImageViewer modal state
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Selected month/year for viewing data
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });

    // Recientes carousel state
    const [recientesExpanded, setRecientesExpanded] = useState(false);
    const [recientesSlide, setRecientesSlide] = useState<0 | 1>(0);
    const [recientesSlideDirection, setRecientesSlideDirection] = useState<'left' | 'right' | null>(null);
    const [recientesAnimKey, setRecientesAnimKey] = useState(0);
    const [recientesTouchStart, setRecientesTouchStart] = useState<number | null>(null);
    const [recientesTouchEnd, setRecientesTouchEnd] = useState<number | null>(null);

    // Main carousel state (3 slides: treemap, polygon, bump chart)
    const [carouselSlide, setCarouselSlide] = useState<CarouselSlide>(0);
    const [carouselCollapsed] = useState(false);
    // Treemap view mode - persisted to localStorage, synced with TrendsView
    const [treemapViewMode, setTreemapViewMode] = useState<TreemapViewMode>(() => {
        const saved = getStorageString('boletapp-analytics-viewmode', 'store-categories');
        if (['store-groups', 'store-categories', 'item-groups', 'item-categories'].includes(saved)) {
            return saved as TreemapViewMode;
        }
        return 'store-categories';
    });

    useEffect(() => {
        setStorageString('boletapp-analytics-viewmode', treemapViewMode);
    }, [treemapViewMode]);

    // Count mode toggle: 'transactions' = Compras, 'items' = Productos (synced with TrendsView)
    const [countMode, setCountMode] = useState<'transactions' | 'items'>(() => {
        const saved = getStorageString('boletapp-analytics-countmode', 'transactions');
        if (saved === 'transactions' || saved === 'items') {
            return saved;
        }
        return 'transactions';
    });

    useEffect(() => {
        setStorageString('boletapp-analytics-countmode', countMode);
    }, [countMode]);

    const toggleCountMode = useCallback(() => {
        setCountMode(prev => prev === 'transactions' ? 'items' : 'transactions');
    }, []);

    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const monthPickerRef = useRef<HTMLDivElement>(null);
    const monthPickerToggleRef = useRef<HTMLButtonElement>(null);
    const [showCountTooltip, setShowCountTooltip] = useState(false);
    const [selectedRadarCategory, setSelectedRadarCategory] = useState<{
        name: string;
        emoji: string;
        currAmount: number;
        prevAmount: number;
        color: string;
    } | null>(null);
    const [bumpTooltip, setBumpTooltip] = useState<{ category: string; month: string; amount: number; color: string } | null>(null);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [carouselSwipeOffset, setCarouselSwipeOffset] = useState(0);
    const [monthTouchStart, setMonthTouchStart] = useState<number | null>(null);
    const [monthSwipeOffset, setMonthSwipeOffset] = useState(0);
    const [animationKey, setAnimationKey] = useState(0);

    // Pagination
    const [historyPage, setHistoryPage] = useState(1);
    const pageSize = 10;

    // Sort and filter preferences
    const [sortType, setSortType] = useState<SortType>('transactionDate');
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);

    // Toggle between refreshed dashboard and full list view
    const [showFullList, setShowFullList] = useState(false);

    // Selection mode for Dashboard Recientes
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

    const { openModal, closeModal } = useModalActions();

    // Long-press for selection mode entry
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const longPressMoved = useRef(false);
    const LONG_PRESS_DURATION = 500; // ms

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

    // Story 15-TD-5b: Category aggregation extracted to categoryDataHelpers.ts
    const treemapCategoriesResult = useMemo(() =>
        computeStoreCategoriesData(monthTransactions, monthTotal),
    [monthTransactions, monthTotal]);

    const treemapCategories = treemapCategoriesResult.displayCategories;
    const storeCategoriesOtro = treemapCategoriesResult.otroCategories;

    const storeGroupsDataResult = useMemo(() =>
        computeStoreGroupsData(monthTransactions, monthTotal),
    [monthTransactions, monthTotal]);

    const storeGroupsData = storeGroupsDataResult.displayCategories;
    const storeGroupsOtro = storeGroupsDataResult.otroCategories;

    const itemCategoriesDataResult = useMemo(() =>
        computeItemCategoriesData(monthTransactions),
    [monthTransactions]);

    const itemCategoriesData = itemCategoriesDataResult.displayCategories;
    const itemCategoriesOtro = itemCategoriesDataResult.otroCategories;

    const itemGroupsDataResult = useMemo(() =>
        computeItemGroupsData(monthTransactions),
    [monthTransactions]);

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

    // Story 15-TD-16: Shared compact amount formatter for chart slides
    const formatCompactAmount = useCallback(
        (amount: number) => `${formatCurrency(Math.round(amount / 1000), currency).replace(/\s/g, '')}k`,
        [formatCurrency, currency]
    );

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
    // Story 15-TD-5b: Computation extracted to chartDataHelpers.ts
    const radarChartData = useMemo(() =>
        computeRadarChartData(monthTransactions, allTx, selectedMonth, treemapViewMode),
    [monthTransactions, allTx, selectedMonth, treemapViewMode]);

    // Story 14.12: Translate month labels for radar chart (outside useMemo to access t)
    const radarCurrentMonthLabel = t(MONTH_SHORT_KEYS[radarChartData.currentMonthIdx]);
    const radarPrevMonthLabel = t(MONTH_SHORT_KEYS[radarChartData.prevMonthIdx]);


    // Story 14.12: Bump chart data for "Ultimos 4 Meses" view
    // Story 15-TD-5b: Computation extracted to chartDataHelpers.ts
    const bumpChartData = useMemo(() =>
        computeBumpChartData(allTx, selectedMonth, treemapViewMode),
    [allTx, selectedMonth, treemapViewMode]);

    // Story 14.12: Translate bump chart month labels (outside useMemo to access t)
    const bumpChartMonthLabels = bumpChartData.monthData.map(m =>
        m.isCurrentMonth ? t('todayLabel') : t(MONTH_SHORT_KEYS[m.month])
    );

    // Story 10a.1: Extract available filters from transactions (AC #2)
    const availableFilters = useMemo(() => {
        return extractAvailableFilters(allTx);
    }, [allTx]);

    // Story 10a.1: Duplicate detection (AC #4) - moved before filtering for duplicatesOnly filter
    const duplicateIds = useMemo(() => {
        return getDuplicateIds(allTx);
    }, [allTx]);

    // Story 10a.1: Apply filters to transactions (AC #2)
    // Story 11.1: Extended to support duplicates-only filter and sort by createdAt
    const filteredTransactions = useMemo(() => {
        let result = filterTransactionsByHistoryFilters(allTx, filterState);

        // Story 11.1: Apply duplicates-only filter
        if (showDuplicatesOnly) {
            result = result.filter(tx => tx.id && duplicateIds.has(tx.id));
        }

        // Story 11.1: Sort by selected sort type
        return [...result].sort((a, b) => {
            if (sortType === 'scanDate') {
                return toMillis(b.createdAt) - toMillis(a.createdAt);
            } else {
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
            .filter((tx): tx is Transaction & { id: string } => {
                const id = (tx as Transaction).id;
                return id != null && selectedIds.has(id);
            })
            .map(tx => ({
                id: tx.id,
                displayName: tx.alias || tx.merchant,
                total: tx.total,
                currency: tx.currency || currency,
            }));
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
    const renderTransactionItem = (transaction: Transaction, _index: number) => {
        if (!transaction.id) return null;
        const txId = transaction.id;
        const isDuplicate = duplicateIds.has(txId);

        return (
            <div
                key={txId}
                onTouchStart={() => handleLongPressStart(txId)}
                onTouchEnd={handleLongPressEnd}
                onTouchMove={handleLongPressMove}
                onMouseDown={() => handleLongPressStart(txId)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
            >
                <TransactionCard
                    transaction={{
                        id: txId,
                        merchant: transaction.merchant,
                        alias: transaction.alias,
                        date: transaction.date,
                        time: transaction.time,
                        total: transaction.total,
                        category: transaction.category,
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
                    onClick={() => onEditTransaction(transaction)}
                    onThumbnailClick={() => handleThumbnailClick(transaction)}
                    selection={isSelectionMode ? {
                        isSelectionMode,
                        isSelected: isSelected(txId),
                        onToggleSelect: () => toggleSelection(txId),
                    } : undefined}
                />
            </div>
        );
    };

    // Story 14.12: If showing full list, render the old paginated view
    // Story 15-TD-5b: Extracted to DashboardFullListView component
    if (showFullList) {
        return (
            <DashboardFullListView
                onBack={() => setShowFullList(false)}
                availableFilters={availableFilters}
                theme={theme}
                lang={lang}
                t={t}
                allTxCount={allTx.length}
                filteredTransactions={filteredTransactions}
                hasActiveFilters={hasActiveFilters}
                sortType={sortType}
                setSortType={setSortType}
                showDuplicatesOnly={showDuplicatesOnly}
                setShowDuplicatesOnly={setShowDuplicatesOnly}
                duplicateIds={duplicateIds}
                isDark={isDark}
                paginatedTransactions={paginatedTransactions}
                historyPage={historyPage}
                setHistoryPage={setHistoryPage}
                totalPages={totalPages}
                renderTransactionItem={renderTransactionItem}
                selectedTransaction={selectedTransaction}
                handleCloseViewer={handleCloseViewer}
            />
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
                                        <DashboardRadarSlide
                                            radarChartData={radarChartData}
                                            animationKey={animationKey}
                                            isDark={isDark}
                                            selectedRadarCategory={selectedRadarCategory}
                                            setSelectedRadarCategory={setSelectedRadarCategory}
                                            radarCurrentMonthLabel={radarCurrentMonthLabel}
                                            radarPrevMonthLabel={radarPrevMonthLabel}
                                            translateTreemapName={translateTreemapName}
                                            t={t}
                                            formatCompactAmount={formatCompactAmount}
                                        />
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
                                        <DashboardBumpSlide
                                            bumpChartData={bumpChartData}
                                            bumpChartMonthLabels={bumpChartMonthLabels}
                                            animationKey={animationKey}
                                            isDark={isDark}
                                            lang={lang as 'en' | 'es'}
                                            bumpTooltip={bumpTooltip}
                                            setBumpTooltip={setBumpTooltip}
                                            translateTreemapName={translateTreemapName}
                                            getTreemapEmoji={getTreemapEmoji}
                                            t={t}
                                            formatCompactAmount={formatCompactAmount}
                                        />
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
                {/* Story 15-TD-5b: Extracted to DashboardRecientesSection component */}
                <TransitionChild index={1} totalItems={2}>
                    <DashboardRecientesSection
                        cardStyle={cardStyle}
                        recientesSlide={recientesSlide}
                        isSelectionMode={isSelectionMode}
                        selectedIds={selectedIds}
                        exitSelectionMode={exitSelectionMode}
                        handleViewAll={handleViewAll}
                        visibleRecientesIds={visibleRecientesIds}
                        handleRecientesSelectAllToggle={handleRecientesSelectAllToggle}
                        handleOpenDelete={handleOpenDelete}
                        recentTransactions={recentTransactions}
                        recientesAnimKey={recientesAnimKey}
                        recientesSlideDirection={recientesSlideDirection}
                        renderTransactionItem={renderTransactionItem}
                        canExpand={canExpand}
                        recientesExpanded={recientesExpanded}
                        setRecientesExpanded={setRecientesExpanded}
                        t={t}
                        setRecientesTouchStart={setRecientesTouchStart}
                        setRecientesTouchEnd={setRecientesTouchEnd}
                        recientesTouchStart={recientesTouchStart}
                        recientesTouchEnd={recientesTouchEnd}
                        goToRecientesSlide={goToRecientesSlide}
                    />
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
