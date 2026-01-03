/**
 * TrendsView - Analytics View with Dual-Axis Navigation
 *
 * Orchestration component that uses AnalyticsContext for all navigation state.
 * Integrates breadcrumbs, chart mode toggle, charts, and drill-down cards.
 *
 * Story 7.7: TrendsView Integration
 * @see docs/architecture-epic7.md - ADR-010: React Context for Analytics State Management
 * @see docs/sprint-artifacts/epic7/story-7.7-trendsview-integration.md
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { SimplePieChart } from '../components/charts/SimplePieChart';
import { GroupedBarChart } from '../components/charts/GroupedBarChart';
import { TemporalBreadcrumb } from '../components/analytics/TemporalBreadcrumb';
import { CategoryBreadcrumb } from '../components/analytics/CategoryBreadcrumb';
import { ChartModeToggle } from '../components/analytics/ChartModeToggle';
import { DrillDownModeToggle } from '../components/analytics/DrillDownModeToggle';
import { DrillDownGrid, type HistoryNavigationPayload } from '../components/analytics/DrillDownGrid';
import { FloatingDownloadFab } from '../components/analytics/FloatingDownloadFab';
import { useAnalyticsNavigation, getParentTemporalLevel } from '../hooks/useAnalyticsNavigation';
import { getQuarterFromMonth } from '../utils/analyticsHelpers';
import { computeBarDataFromTransactions, type TemporalPosition, type CategoryPosition } from '../utils/chartDataComputation';
import { getColor } from '../utils/colors';
import { formatCurrency } from '../utils/currency';
import { downloadMonthlyTransactions, downloadYearlyStatistics } from '../utils/csvExport';
import { useSubscriptionTier } from '../hooks/useSubscriptionTier';
import { UpgradePromptModal } from '../components/UpgradePromptModal';
import type { Transaction } from '../types/transaction';

// ============================================================================
// Types
// ============================================================================

interface PieData {
    label: string;
    value: number;
    color: string;
}

// BarData type is now imported from chartDataComputation.ts

export interface TrendsViewProps {
    /** All transactions from the user */
    transactions: Transaction[];
    /** Theme for styling */
    theme: 'light' | 'dark';
    /** Color theme for chart colors (Normal/Professional/Mono) */
    colorTheme?: 'normal' | 'professional' | 'mono';
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
    /**
     * Story 9.20: Callback for navigating to History view with pre-applied filters.
     * Called when user clicks the transaction count badge on a drill-down card.
     */
    onNavigateToHistory?: (payload: HistoryNavigationPayload) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get week number within a month for a given date (1-based, 7-day chunks).
 * Week 1 = days 1-7, Week 2 = days 8-14, etc.
 */
function getWeekOfMonth(date: string): number {
    const day = parseInt(date.split('-')[2], 10);
    return Math.ceil(day / 7);
}

/**
 * Filter transactions based on the current temporal and category positions.
 * This is the core filtering logic that replaces the old getTrendsData function.
 */
function filterTransactionsByNavState(
    transactions: Transaction[],
    temporal: { level: string; year: string; quarter?: string; month?: string; week?: number; day?: string },
    category: { level: string; category?: string; group?: string; subcategory?: string }
): Transaction[] {
    return transactions.filter(tx => {
        // Temporal filtering
        const txYear = tx.date.substring(0, 4);
        const txMonth = tx.date.substring(0, 7);
        const txQuarter = getQuarterFromMonth(txMonth);

        // Year filter - always applied
        if (txYear !== temporal.year) return false;

        // Quarter filter
        if (temporal.level !== 'year' && temporal.quarter && txQuarter !== temporal.quarter) {
            return false;
        }

        // Month filter
        if (['month', 'week', 'day'].includes(temporal.level) && temporal.month && txMonth !== temporal.month) {
            return false;
        }

        // Week filter (days 1-7 = week 1, 8-14 = week 2, etc.)
        if (['week', 'day'].includes(temporal.level) && temporal.week !== undefined) {
            const txWeek = getWeekOfMonth(tx.date);
            if (txWeek !== temporal.week) return false;
        }

        // Day filter
        if (temporal.level === 'day' && temporal.day && tx.date !== temporal.day) {
            return false;
        }

        // Category filtering
        if (category.level !== 'all') {
            // Store category filter
            if (category.category && tx.category !== category.category) {
                return false;
            }

            // Group filter (item category)
            if (category.group && !tx.items.some(item => item.category === category.group)) {
                return false;
            }

            // Subcategory filter
            if (category.subcategory && !tx.items.some(item => item.subcategory === category.subcategory)) {
                return false;
            }
        }

        return true;
    });
}

/**
 * Compute pie chart data from filtered transactions based on current navigation state.
 * Story 9.13: Ensure pie chart data is consistent with total at each level (AC #2, #3)
 */
function computePieData(
    transactions: Transaction[],
    category: { level: string; category?: string; group?: string; subcategory?: string }
): PieData[] {
    const dataMap: Record<string, number> = {};

    if (category.level === 'all' || !category.category) {
        // Show store categories
        transactions.forEach(tx => {
            const key = tx.category || 'Other';
            dataMap[key] = (dataMap[key] || 0) + tx.total;
        });
    } else if (category.level === 'category' || !category.group) {
        // Show item groups (item.category)
        transactions.forEach(tx => {
            tx.items.forEach(item => {
                const key = item.category || 'General';
                dataMap[key] = (dataMap[key] || 0) + item.price;
            });
        });
    } else if (category.level === 'group' || !category.subcategory) {
        // Show subcategories within the selected group
        transactions.forEach(tx => {
            tx.items
                .filter(item => item.category === category.group)
                .forEach(item => {
                    const key = item.subcategory || 'Other';
                    dataMap[key] = (dataMap[key] || 0) + item.price;
                });
        });
    } else {
        // At subcategory level: show individual items (or just one entry for the subcategory)
        // Since subcategory is the lowest level, just show the total for that subcategory
        transactions.forEach(tx => {
            tx.items
                .filter(item => item.category === category.group && item.subcategory === category.subcategory)
                .forEach(item => {
                    const key = item.subcategory || 'Other';
                    dataMap[key] = (dataMap[key] || 0) + item.price;
                });
        });
    }

    return Object.entries(dataMap)
        .map(([label, value]) => ({
            label,
            value,
            color: getColor(label),
        }))
        .sort((a, b) => b.value - a.value);
}

// ============================================================================
// Component
// ============================================================================

/**
 * TrendsView Component
 *
 * Orchestrates the analytics view using AnalyticsContext for navigation state.
 * Delegates rendering to child components (breadcrumbs, charts, drill-down cards).
 */
export const TrendsView: React.FC<TrendsViewProps> = ({
    transactions,
    theme,
    colorTheme = 'default',
    currency,
    locale,
    t,
    onEditTransaction,
    exporting = false,
    onExporting,
    onUpgradeRequired,
    onNavigateToHistory,
}) => {
    // Get navigation state from context
    const { temporal, category, chartMode, temporalLevel, dispatch } = useAnalyticsNavigation();

    // Theme styling
    const isDark = theme === 'dark';
    const card = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';

    // Story 5.4/5.5: Subscription tier check for premium export
    const { canAccessPremiumExport } = useSubscriptionTier();
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    // =========================================================================
    // Computed Data (Memoized)
    // =========================================================================

    // Filter transactions based on current navigation state
    const filteredTransactions = useMemo(
        () => filterTransactionsByNavState(transactions, temporal, category),
        [transactions, temporal, category]
    );

    // Compute chart data
    // Note: colorTheme is included as dependency because getColor() reads CSS variables
    // which change when colorTheme changes (normal vs professional). The linter doesn't
    // see colorTheme in the function body because it affects getColor() behavior indirectly
    // through CSS custom properties.
    const pieData = useMemo(
        () => computePieData(filteredTransactions, category),
        [filteredTransactions, category, colorTheme] // colorTheme triggers re-render for new colors
    );

    const barData = useMemo(
        () => computeBarDataFromTransactions(
            filteredTransactions,
            temporal as TemporalPosition,
            category as CategoryPosition,
            locale
        ),
        [filteredTransactions, temporal, category, locale, colorTheme] // colorTheme triggers re-render for new colors
    );

    // Compute total based on category level
    // Story 9.13: Ensure totals are consistent at each level (AC #2)
    // At store level: sum transaction totals
    // At category level: sum all item prices within the filtered store category
    // At group level: sum item prices for that group only
    // At subcategory level: sum item prices for that subcategory only
    const total = useMemo(() => {
        if (category.level === 'all' || !category.category) {
            // Store level: sum transaction totals
            return filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
        } else if (category.level === 'category' || !category.group) {
            // Category level: sum all item prices within the filtered store category
            return filteredTransactions.reduce((sum, tx) => {
                return sum + tx.items.reduce((itemSum, item) => itemSum + item.price, 0);
            }, 0);
        } else if (category.level === 'group' || !category.subcategory) {
            // Group level: sum item prices for the selected group only
            return filteredTransactions.reduce((sum, tx) => {
                return sum + tx.items
                    .filter(item => item.category === category.group)
                    .reduce((itemSum, item) => itemSum + item.price, 0);
            }, 0);
        } else {
            // Subcategory level: sum item prices for the selected subcategory only
            return filteredTransactions.reduce((sum, tx) => {
                return sum + tx.items
                    .filter(item => item.category === category.group && item.subcategory === category.subcategory)
                    .reduce((itemSum, item) => itemSum + item.price, 0);
            }, 0);
        }
    }, [filteredTransactions, category]);

    // Determine export type based on view granularity
    const isStatisticsExport = temporalLevel === 'year' || temporalLevel === 'quarter';

    // =========================================================================
    // Event Handlers
    // =========================================================================

    // Story 7.17: Removed handleSliceClick - pie chart now shows tooltip instead of drilling down
    // Drill-down navigation happens via the drill-down cards below the chart

    /**
     * Handle export with subscription check.
     */
    const handleExport = useCallback(async () => {
        if (!canAccessPremiumExport) {
            setShowUpgradePrompt(true);
            onUpgradeRequired?.();
            return;
        }

        onExporting?.(true);
        try {
            await new Promise(resolve => requestAnimationFrame(resolve));

            if (temporal.month && (temporalLevel === 'month' || temporalLevel === 'week' || temporalLevel === 'day')) {
                // Month/week/day view: export transactions
                const [year, month] = temporal.month.split('-');
                downloadMonthlyTransactions(filteredTransactions, year, month);
            } else {
                // Year/quarter view: export statistics
                downloadYearlyStatistics(filteredTransactions, temporal.year);
            }
        } finally {
            onExporting?.(false);
        }
    }, [canAccessPremiumExport, temporal, temporalLevel, filteredTransactions, onExporting, onUpgradeRequired]);

    const handleCloseUpgradePrompt = useCallback(() => {
        setShowUpgradePrompt(false);
    }, []);

    const handleUpgrade = useCallback(() => {
        console.log('Upgrade requested - Epic 8 will implement Mercado Pago integration');
        setShowUpgradePrompt(false);
    }, []);

    /**
     * Handle back button click - navigate up one level in the hierarchy.
     * Priority: Category filter first (if active), then temporal level.
     * Story 7.14: Back button in fixed header for quick navigation.
     */
    const handleBack = useCallback(() => {
        // First priority: Go back in category hierarchy if a filter is active
        if (category.level === 'subcategory') {
            dispatch({
                type: 'SET_CATEGORY_FILTER',
                payload: { level: 'group', category: category.category, group: category.group }
            });
            return;
        }
        if (category.level === 'group') {
            dispatch({
                type: 'SET_CATEGORY_FILTER',
                payload: { level: 'category', category: category.category }
            });
            return;
        }
        if (category.level === 'category') {
            dispatch({ type: 'CLEAR_CATEGORY_FILTER' });
            return;
        }

        // Second priority: Go back in temporal hierarchy
        const parentLevel = getParentTemporalLevel(temporalLevel);
        if (parentLevel) {
            if (parentLevel === 'year') {
                dispatch({
                    type: 'SET_TEMPORAL_LEVEL',
                    payload: { level: 'year', year: temporal.year }
                });
            } else if (parentLevel === 'quarter') {
                dispatch({
                    type: 'SET_TEMPORAL_LEVEL',
                    payload: { level: 'quarter', year: temporal.year, quarter: temporal.quarter }
                });
            } else if (parentLevel === 'month') {
                dispatch({
                    type: 'SET_TEMPORAL_LEVEL',
                    payload: { level: 'month', year: temporal.year, quarter: temporal.quarter, month: temporal.month }
                });
            } else if (parentLevel === 'week') {
                dispatch({
                    type: 'SET_TEMPORAL_LEVEL',
                    payload: { level: 'week', year: temporal.year, quarter: temporal.quarter, month: temporal.month, week: temporal.week }
                });
            }
        }
        // If at year level with no category filter, back button does nothing
        // User can use bottom nav to leave analytics
    }, [dispatch, category, temporal, temporalLevel]);

    // Check if back navigation is possible
    const canGoBack = category.level !== 'all' || temporalLevel !== 'year';

    // =========================================================================
    // Render
    // =========================================================================

    return (
        <div className="space-y-1">
            {/* Fixed Header: Back button + Logo + Breadcrumbs - stays visible when scrolling (Story 7.14) */}
            {/* Uses var(--bg) CSS variable for seamless theme integration (Story 7.15) */}
            {/* Story 11.6: Safe area top padding for PWA (AC #3) */}
            <div
                className="fixed top-0 left-0 right-0 z-20 px-3 pb-1"
                style={{
                    backgroundColor: 'var(--bg)',
                    paddingTop: 'calc(0.75rem + var(--safe-top, 0px))',
                }}
            >
                <div className="flex items-center justify-between">
                    {/* Left: Back button - fixed width to balance with right icons */}
                    <div className="w-20 flex justify-start">
                        <button
                            onClick={handleBack}
                            disabled={!canGoBack}
                            className={`p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center ${
                                canGoBack
                                    ? isDark
                                        ? 'hover:bg-slate-700/50 text-slate-300'
                                        : 'hover:bg-slate-200/50 text-slate-600'
                                    : isDark
                                        ? 'text-slate-600 cursor-not-allowed'
                                        : 'text-slate-300 cursor-not-allowed'
                            }`}
                            aria-label="Go back"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    </div>

                    {/* Center: Logo - truly centered with fixed-width siblings */}
                    <span
                        className={`text-2xl tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontWeight: 600, fontStyle: 'italic' }}
                    >
                        Gastify
                    </span>

                    {/* Right: Breadcrumb icons - fixed width to balance with left button */}
                    <div className="w-20 flex justify-end items-center gap-0">
                        <TemporalBreadcrumb theme={theme} locale={locale} />
                        <CategoryBreadcrumb theme={theme} locale={locale} />
                    </div>
                </div>
            </div>

            {/* Spacer to account for fixed header height - reduced */}
            <div className="h-10"></div>

            {/* Total Spending Display - compact */}
            <div className="text-center px-4 py-1">
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('totalSpent')}
                </div>
                <div className="text-2xl font-bold">{formatCurrency(total, currency)}</div>
            </div>

            {/* Chart Mode Toggle - full width */}
            <ChartModeToggle theme={theme} locale={locale as 'en' | 'es'} fullWidth />

            {/* Chart - reduced padding */}
            <div className="px-4 py-2">
                <div className="h-52 flex items-center justify-center">
                    {chartMode === 'aggregation' ? (
                        pieData.length > 0 ? (
                            <SimplePieChart
                                data={pieData}
                                theme={theme}
                                currency={currency}
                            />
                        ) : (
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {t('noData')}
                            </p>
                        )
                    ) : (
                        barData.length > 0 ? (
                            <GroupedBarChart data={barData} theme={theme} currency={currency} />
                        ) : (
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {t('noData')}
                            </p>
                        )
                    )}
                </div>
            </div>

            {/* Story 7.17: Removed CategoryLegend - redundant with drill-down category cards below */}

            {/* Story 7.16: Drill-down mode toggle (Temporal/Category) */}
            {/* Placed above drill-down cards section per AC #1 */}
            <DrillDownModeToggle theme={theme} locale={locale as 'en' | 'es'} />

            {/* Drill-down Cards Grid (AC #1, #2, #5-13) */}
            {/* Story 9.20: Pass onNavigateToHistory to enable badge navigation (AC #3) */}
            <DrillDownGrid
                transactions={filteredTransactions}
                theme={theme}
                locale={locale}
                currency={currency}
                onNavigateToHistory={onNavigateToHistory}
            />

            {/* Transaction list at subcategory level */}
            {category.level === 'subcategory' && filteredTransactions.length > 0 && (
                <div className="space-y-2">
                    <h3 className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t('transactions')}
                    </h3>
                    {filteredTransactions.map(tx => (
                        <div
                            key={tx.id}
                            onClick={() => onEditTransaction(tx)}
                            className={`p-3 border rounded-lg flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow ${card}`}
                        >
                            <div className="truncate">{tx.alias || tx.merchant}</div>
                            <div className="font-bold">{formatCurrency(tx.total, currency)}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Floating Download FAB (Story 7.11) */}
            <FloatingDownloadFab
                onExport={handleExport}
                exporting={exporting}
                isStatisticsExport={isStatisticsExport}
                theme={theme}
                t={t}
            />

            {/* Upgrade prompt modal */}
            <UpgradePromptModal
                isOpen={showUpgradePrompt}
                onClose={handleCloseUpgradePrompt}
                onUpgrade={handleUpgrade}
                t={t}
                theme={theme}
            />
        </div>
    );
};

// Story 9.20: Re-export HistoryNavigationPayload for App.tsx
export type { HistoryNavigationPayload } from '../components/analytics/DrillDownGrid';

export default TrendsView;
