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
import { ChevronLeft, ChevronRight } from 'lucide-react';
// Story 14.13: Animation components
import { PageTransition } from '../../components/animation/PageTransition';
import { TransitionChild } from '../../components/animation/TransitionChild';
// Story 14.40: Category statistics popup
import { CategoryStatisticsPopup } from '@features/analytics/components/CategoryStatisticsPopup';
import { useCategoryStatistics, type CategoryFilterType } from '@features/analytics/hooks/useCategoryStatistics';
// Story 14.14b: Profile dropdown for consistent header
import { ProfileDropdown, ProfileAvatar, getInitials } from '../../components/ProfileDropdown';
// Story 14.14b: IconFilterBar for consistent filter dropdowns
import { IconFilterBar } from '@features/history/components/IconFilterBar';
import { useHistoryFilters } from '@shared/hooks/useHistoryFilters';
import {
    extractAvailableFilters,
    buildYearFilter,
    buildQuarterFilter,
    buildMonthFilter,
    buildWeekFilter,
    filterTransactionsByHistoryFilters,
} from '@shared/utils/historyFilterUtils';
import type { HistoryFilterState } from '@/types/historyFilters';
// Story 14.13: Hooks
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { useReducedMotion } from '../../hooks/useReducedMotion';
// Utilities
import {
    getContrastTextColor,
    getCurrentTheme,
    getCurrentMode,
    type ItemCategoryGroup,
} from '../../config/categoryColors';
import { getStorageString, setStorageString, getStorageJSON, setStorageJSON } from '@/utils/storage';
import { calculateTreemapLayout, categoryDataToTreemapItems } from '../../utils/treemapLayout';
import {
    translateCategory,
    translateStoreCategoryGroup,
    translateItemCategoryGroup,
} from '../../utils/categoryTranslations';
import type { Transaction } from '../../types/transaction';
// Story 14.13.3: Sankey chart for flow visualization
import { SankeyChart, type SankeySelectionData } from '@features/analytics/components/SankeyChart';
import type { SankeyMode } from '@features/analytics/utils/sankeyDataBuilder';
// Story 14e-25b.1: ColorTheme now comes from TrendsViewData type
// Story 14.13.2: Period comparison utilities
import {
    getPreviousPeriod,
    calculateChange,
    isDateInPeriod,
    type PeriodIdentifier,
} from '@features/analytics/utils/periodComparison';
// Story 14e-25d: Direct navigation from store and shared hooks (ViewHandlersContext deleted)
import { useNavigationActions } from '@/shared/stores';
import { useHistoryNavigation } from '@/shared/hooks';
// Story 14c-refactor.31a: View type for proper type assertion
import type { View } from '../../components/App/types';
// Story 14e-25b.1: Internal data hook for view-owned data pattern
import { useTrendsViewData, type TrendsViewData } from './useTrendsViewData';

// ============================================================================
// Types (extracted to ./types.ts)
// ============================================================================
import type {
    TimePeriod, CurrentPeriod, CarouselSlide, DistributionView, TendenciaView,
    DonutViewMode, CategoryData, TrendData,
} from './types';
// Re-export canonical types for backward compatibility (consumers import from TrendsView)
export type { DrillDownPath, HistoryNavigationPayload } from '../../types/navigation';
import type { HistoryNavigationPayload } from '../../types/navigation';

/**
 * Story 14e-25b.1: TrendsView props interface.
 *
 * The view now owns its data via useTrendsViewData() hook internally.
 * Props are ONLY used for test data injection via _testOverrides.
 * In production, App.tsx renders <TrendsView /> with no props.
 */
export interface TrendsViewProps {
    /**
     * Story 14e-25b.1: Test data override for testing.
     * When provided, these values override the hook data.
     * Production code should NOT pass this prop.
     */
    _testOverrides?: Partial<TrendsViewData>;
}

// ============================================================================
// Constants & Helpers (extracted to ./helpers.ts)
// ============================================================================
import {
    computeStoreGroupsData, computeItemGroupsData,
} from './aggregationHelpers';
import {
    getPeriodLabel, filterByPeriod,
    computeAllCategoryData, computeItemCategoryData,
    computeSubcategoryData,
    computeTreemapCategories, computeTrendCategories,
    CAROUSEL_TITLES_BASE,
} from './helpers';

// Story 15-TD-5b: Extracted helpers
import { computePreviousPeriodTotals, computeDailySparkline as computeDailySparklineFn } from './periodComparisonHelpers';
import { buildTreemapNavigationPayload, buildTrendNavigationPayload, getDonutViewModeAtDrillLevel, getMaxDrillDownLevel } from './navigationHelpers';
import { resolveDrillDownCategories } from './drillDownHelpers';
import { getPreviousPeriodState, getNextPeriodState, getCurrentDatePeriod, isCurrentPeriod } from './periodNavigationHelpers';
// Sub-Components (co-located + extracted)
import { AnimatedTreemapCell } from './AnimatedTreemapCell';
import { DonutChart } from './DonutChart';
import { TrendListItem } from './TrendListItem';
import { TrendsCardHeader } from './TrendsCardHeader';
import { ExpandCollapseButtons } from './ExpandCollapseButtons';

// ============================================================================
// Main Component
// ============================================================================

export const TrendsView: React.FC<TrendsViewProps> = ({ _testOverrides }) => {
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
        userId: _userId = '',
        appId: _appId = '',
        // Story 14.13 Session 7: Initial distribution view for back navigation
        initialDistributionView,
        // Story 14.13: Font color mode - receiving this prop triggers re-render when setting changes
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fontColorMode: _fontColorMode,
    } = { ...hookData, ..._testOverrides } as TrendsViewData;
    const isDark = theme === 'dark';
    const prefersReducedMotion = useReducedMotion();
    const carouselRef = useRef<HTMLDivElement>(null);

    // Story 14e-25d: Direct navigation from store and shared hooks (ViewHandlersContext deleted)
    const { handleNavigateToHistory } = useHistoryNavigation();
    const { navigateBack, setView } = useNavigationActions();
    const onNavigateToHistory = handleNavigateToHistory;
    const onBack = navigateBack;
    const navigateToView = setView;

    const carouselTitles = CAROUSEL_TITLES_BASE;
    const maxCarouselSlide = 1;

    // =========================================================================
    // State
    // =========================================================================

    // Story 14.14b: Profile dropdown state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

    // Story 14.14b: Use HistoryFilters context for IconFilterBar and bidirectional sync
    const { state: filterState, dispatch: filterDispatch } = useHistoryFilters();

    // Story 14.14b: Extract available filters from transactions for IconFilterBar
    const availableFilters = useMemo(
        () => extractAvailableFilters(transactions as any),
        [transactions]
    );

    // Time period selection (AC #2)
    // Story 14.14b Session 7: Persist time period to localStorage so it's retained on back navigation
    const [timePeriod, setTimePeriodLocal] = useState<TimePeriod>(() => {
        const saved = getStorageString('boletapp-analytics-timeperiod', 'month');
        if (['year', 'quarter', 'month', 'week'].includes(saved)) {
            return saved as TimePeriod;
        }
        return 'month';
    });

    // Current period navigation (AC #3)
    // Story 14.14b Session 7: Persist current period to localStorage so it's retained on back navigation
    const now = new Date();
    const [currentPeriod, setCurrentPeriodLocal] = useState<CurrentPeriod>(() => {
        const defaultPeriod: CurrentPeriod = {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            quarter: Math.ceil((now.getMonth() + 1) / 3),
            week: Math.ceil(now.getDate() / 7),
        };
        const parsed = getStorageJSON<CurrentPeriod | null>('boletapp-analytics-currentperiod', null);
        // Validate the parsed object has required fields
        if (parsed && typeof parsed.year === 'number' && typeof parsed.month === 'number' &&
            typeof parsed.quarter === 'number' && typeof parsed.week === 'number') {
            return parsed;
        }
        return defaultPeriod;
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
            setStorageJSON('boletapp-analytics-currentperiod', updated);
            return updated;
        });

        setTimePeriodLocal(newPeriod);
        setStorageString('boletapp-analytics-timeperiod', newPeriod);

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

            setStorageJSON('boletapp-analytics-currentperiod', newPeriod);

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
        const saved = getStorageString('boletapp-analytics-carousel', '0');
        if (saved === '0' || saved === '1') {
            return parseInt(saved) as CarouselSlide;
        }
        return 0;
    });

    // Wrapped setter that persists carousel position
    const setCarouselSlide = useCallback((value: CarouselSlide | ((prev: CarouselSlide) => CarouselSlide)) => {
        setCarouselSlideLocal(prev => {
            const newValue = typeof value === 'function' ? value(prev) : value;
            setStorageString('boletapp-analytics-carousel', String(newValue));
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

        // Then apply category/location filters from filterState (but NOT temporal since we handle that above)
        // Create a filter state with 'all' temporal to avoid double-filtering by period
        const filtersWithoutTemporal: HistoryFilterState = {
            temporal: { level: 'all' },  // Skip temporal filtering (already done by filterByPeriod)
            category: filterState.category,
            location: filterState.location,
        };

        return filterTransactionsByHistoryFilters(periodFiltered, filtersWithoutTemporal);
    }, [transactions, timePeriod, currentPeriod, filterState.category, filterState.location]);

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
        const saved = getStorageString('boletapp-analytics-viewmode', 'store-categories');
        if (['store-groups', 'store-categories', 'item-groups', 'item-categories'].includes(saved)) {
            return saved as DonutViewMode;
        }
        return 'store-categories';
    });

    // Story 14.14b Session 6: Wrapped setter that handles persistence and category filter sync
    const setDonutViewMode = useCallback((newMode: DonutViewMode) => {
        setDonutViewModeLocal(newMode);

        setStorageString('boletapp-analytics-viewmode', newMode);

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
        const saved = getStorageString('boletapp-analytics-countmode', 'transactions');
        if (saved === 'transactions' || saved === 'items') {
            return saved;
        }
        return 'transactions'; // Default to counting transactions
    });

    // Story 14.13 Session 5: Toggle count mode with persistence
    const toggleCountMode = useCallback(() => {
        setCountModeLocal(prev => {
            const newMode = prev === 'transactions' ? 'items' : 'transactions';
            setStorageString('boletapp-analytics-countmode', newMode);
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
    // Story 15-TD-5b: Extracted to aggregationHelpers.ts
    const storeGroupsData = useMemo(
        () => computeStoreGroupsData(allCategoryData),
        [allCategoryData]
    );

    // Aggregate item categories from transaction line items
    const itemCategoriesData = useMemo((): CategoryData[] => {
        return computeItemCategoryData(filteredTransactions);
    }, [filteredTransactions]);

    // Aggregate item categories by item groups
    // Story 15-TD-5b: Extracted to aggregationHelpers.ts
    const itemGroupsData = useMemo(
        () => computeItemGroupsData(filteredTransactions),
        [filteredTransactions]
    );

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
    // Story 15-TD-5b: Extracted to drillDownHelpers.ts
    const treemapDrillDownData = useMemo((): CategoryData[] => {
        return resolveDrillDownCategories(
            filteredTransactions, donutViewMode, treemapDrillDownLevel, treemapDrillDownPath, allCategoryData
        );
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

    // Story 15-TD-5b: Max drill-down level extracted to navigationHelpers.ts
    const getTreemapMaxDrillDownLevel = useCallback(
        () => getMaxDrillDownLevel(donutViewMode),
        [donutViewMode]
    );

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

        // Apply category/location filters (same as filteredTransactions)
        const filtersWithoutTemporal: HistoryFilterState = {
            temporal: { level: 'all' },
            category: filterState.category,
            location: filterState.location,
        };

        return filterTransactionsByHistoryFilters(periodFiltered, filtersWithoutTemporal);
    }, [transactions, currentPeriod, timePeriod, filterState.category, filterState.location]);

    /**
     * Story 14.13.2: Compute previous period category totals for comparison
     * Story 15-TD-5b: Extracted to periodComparisonHelpers.ts
     */
    const previousPeriodTotals = useMemo(
        () => computePreviousPeriodTotals(previousPeriodTransactions, donutViewMode),
        [previousPeriodTransactions, donutViewMode]
    );

    /**
     * Story 14.13.2: Compute cumulative daily sparkline data for a category
     * Story 15-TD-5b: Extracted to periodComparisonHelpers.ts
     */
    const computeDailySparkline = useCallback((
        categoryName: string,
        currentTxs: Transaction[]
    ): number[] => {
        return computeDailySparklineFn(
            categoryName, currentTxs,
            donutViewMode, timePeriod, currentPeriod
        );
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
                filteredTransactions
            );

            return {
                ...cat,
                sparkline: sparklineData,
                change: changeResult.percent,
                previousValue,
                changeDirection: changeResult.direction,
            };
        }).sort((a, b) => b.value - a.value); // Sort by current value descending (AC #1)
    }, [viewModeBaseData, previousPeriodTotals, computeDailySparkline, filteredTransactions]);

    // Story 15-TD-5b: Max drill-down level extracted to navigationHelpers.ts
    const getTrendMaxDrillDownLevel = useCallback(
        () => getMaxDrillDownLevel(donutViewMode),
        [donutViewMode]
    );

    /**
     * Story 14.13.2: Compute drill-down trend data with period comparison
     * Similar to treemapDrillDownData but returns TrendData with sparklines
     */
    // Story 15-TD-5b: Extracted drill-down resolution to drillDownHelpers.ts
    const trendDrillDownData = useMemo((): TrendData[] => {
        if (trendDrillDownLevel === 0) return [];

        // Resolve current period drill-down categories
        const drillDownCategories = resolveDrillDownCategories(
            filteredTransactions, donutViewMode, trendDrillDownLevel, trendDrillDownPath, allCategoryData
        );

        // Resolve previous period drill-down categories (for comparison)
        const prevDrillDownCategories = resolveDrillDownCategories(
            previousPeriodTransactions, donutViewMode, trendDrillDownLevel, trendDrillDownPath
        );

        // Build map of previous period values
        const prevTotalsMap = new Map<string, number>();
        prevDrillDownCategories.forEach(c => prevTotalsMap.set(c.name, c.value));

        // Convert to TrendData with comparison
        return drillDownCategories.map(cat => {
            const previousValue = prevTotalsMap.get(cat.name) || 0;
            const changeResult = calculateChange(cat.value, previousValue);
            const sparklineData = computeDailySparkline(cat.name, filteredTransactions);

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

    // Story 15-TD-5b: View mode at drill level extracted to navigationHelpers.ts
    const getTrendViewModeAtLevel = useCallback(
        () => getDonutViewModeAtDrillLevel(donutViewMode, trendDrillDownLevel),
        [trendDrillDownLevel, donutViewMode]
    );

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
    // Story 15-TD-5b: Logic extracted to periodNavigationHelpers.ts
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isViewingCurrentPeriod = useMemo(
        () => isCurrentPeriod(timePeriod, currentPeriod),
        [timePeriod, currentPeriod]
    );

    // =========================================================================
    // Event Handlers
    // =========================================================================

    // Navigate to previous period (AC #3) with animation trigger
    // Story 15-TD-5b: Arithmetic extracted to periodNavigationHelpers.ts
    const goPrevPeriod = useCallback(() => {
        setCurrentPeriod(prev => getPreviousPeriodState(prev, timePeriod));
        setAnimationKey(prev => prev + 1);
    }, [timePeriod]);

    // Navigate to next period (AC #3) with animation trigger
    // Story 15-TD-5b: Arithmetic extracted to periodNavigationHelpers.ts
    const goNextPeriod = useCallback(() => {
        const now = new Date();
        setCurrentPeriod(prev => getNextPeriodState(prev, timePeriod, now));
        setAnimationKey(prev => prev + 1);
    }, [timePeriod]);

    // Story 14.14b Session 7: Handle time period pill click
    // Story 15-TD-5b: Date arithmetic extracted to periodNavigationHelpers.ts
    const handleTimePeriodClick = useCallback((period: TimePeriod) => {
        if (timePeriod === period) {
            // Already on this period - reset to current date
            setCurrentPeriod(getCurrentDatePeriod());
            setAnimationKey(prev => prev + 1);
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

    // Story 14.13.2: Handle trend count pill click - navigate to HistoryView/ItemsView with filters
    // Story 15-TD-5b: Payload building extracted to navigationHelpers.ts
    const handleTrendCountClick = useCallback((categoryName: string) => {
        if (!onNavigateToHistory) return;

        const payload = buildTrendNavigationPayload({
            categoryName,
            countMode,
            donutViewMode,
            effectiveViewMode: getTrendViewModeAtLevel(),
            timePeriod,
            currentPeriod,
            trendDrillDownLevel,
            trendDrillDownPath,
            otroTrendCategories,
        });

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
    // Story 15-TD-5b: Payload building extracted to navigationHelpers.ts
    const handleTreemapTransactionCountClick = useCallback((categoryName: string) => {
        if (!onNavigateToHistory) return;

        // Story 14.13 Session 19: Get otroCategories based on current drill-down level
        const currentOtroCategories = treemapDrillDownLevel > 0
            ? treemapDrillDownCategorized.otroCategories
            : otroCategories;

        const payload = buildTreemapNavigationPayload({
            categoryName,
            countMode,
            donutViewMode,
            timePeriod,
            currentPeriod,
            treemapDrillDownLevel,
            treemapDrillDownPath,
            otroCategories: currentOtroCategories,
        });

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
    // Story 14.40: Category Statistics Calculation
    // =========================================================================

    // Calculate statistics for the selected category (if popup is open)
    // Story 15-TD-5b: Reuse `total` (identical computation) instead of duplicate useMemo
    const categoryStatistics = useCategoryStatistics({
        transactions: filteredTransactions,
        categoryName: statsPopupCategory?.name ?? '',
        categoryType: statsPopupCategory?.type ?? 'store-category',
        totalSpentAllCategories: total,
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
                            {/* Card Header - Story 15-TD-5b: Extracted to TrendsCardHeader */}
                            <TrendsCardHeader
                                carouselSlide={carouselSlide}
                                distributionView={distributionView}
                                tendenciaView={tendenciaView}
                                toggleView={toggleView}
                                prefersReducedMotion={prefersReducedMotion}
                                donutViewMode={donutViewMode}
                                setDonutViewMode={setDonutViewMode}
                                sankeyMode={sankeyMode}
                                setSankeyMode={setSankeyMode}
                                locale={locale}
                                countMode={countMode}
                                toggleCountMode={toggleCountMode}
                                goToPrevSlide={goToPrevSlide}
                                goToNextSlide={goToNextSlide}
                                carouselTitles={carouselTitles}
                            />

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

                                            // Story 15-TD-5b: View mode at drill level extracted to navigationHelpers.ts
                                            const currentViewMode = getDonutViewModeAtDrillLevel(donutViewMode, treemapDrillDownLevel);

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

                                        {/* Story 15-TD-5b: Extracted to ExpandCollapseButtons */}
                                        <ExpandCollapseButtons
                                            canExpand={treemapDrillDownLevel > 0 ? treemapDrillDownCategorized.canExpand : canExpand}
                                            canCollapse={treemapDrillDownLevel > 0 ? treemapDrillDownCategorized.canCollapse : canCollapse}
                                            otroCount={(treemapDrillDownLevel > 0 ? treemapDrillDownCategorized.otroCategories : otroCategories).length}
                                            expandedCount={treemapDrillDownLevel > 0 ? treemapDrillDownExpandedCount : expandedCategoryCount}
                                            onExpand={treemapDrillDownLevel > 0
                                                ? () => setTreemapDrillDownExpandedCount(prev => prev + 1)
                                                : () => setExpandedCategoryCount(prev => prev + 1)}
                                            onCollapse={treemapDrillDownLevel > 0
                                                ? () => setTreemapDrillDownExpandedCount(prev => Math.max(0, prev - 1))
                                                : () => setExpandedCategoryCount(prev => Math.max(0, prev - 1))}
                                            locale={locale}
                                        />
                                    </div>
                                )}

                                {/* Slide 0: Distribution - Donut view */}
                                {carouselSlide === 0 && distributionView === 'donut' && (
                                    <DonutChart
                                        categoryData={categoryData}
                                        allCategoryData={allCategoryData}
                                        total={total}
                                        currency={currency}
                                        locale={locale}
                                        isDark={isDark}
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

                                        {/* Story 15-TD-5b: Extracted to ExpandCollapseButtons */}
                                        <ExpandCollapseButtons
                                            canExpand={trendCanExpand}
                                            canCollapse={trendCanCollapse}
                                            otroCount={otroTrendCategories.length}
                                            expandedCount={currentTrendExpandedCount}
                                            onExpand={trendDrillDownLevel > 0
                                                ? () => setTrendDrillDownExpandedCount(prev => prev + 1)
                                                : () => setTrendExpandedCount(prev => prev + 1)}
                                            onCollapse={trendDrillDownLevel > 0
                                                ? () => setTrendDrillDownExpandedCount(prev => Math.max(0, prev - 1))
                                                : () => setTrendExpandedCount(prev => Math.max(0, prev - 1))}
                                            locale={locale}
                                            testIdPrefix="trend-"
                                        />
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
