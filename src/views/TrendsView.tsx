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
import { DrillDownGrid } from '../components/analytics/DrillDownGrid';
import { FloatingDownloadFab } from '../components/analytics/FloatingDownloadFab';
import { useAnalyticsNavigation, getParentTemporalLevel } from '../hooks/useAnalyticsNavigation';
import { getQuarterFromMonth } from '../utils/analyticsHelpers';
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

interface BarData {
    label: string;
    total: number;
    segments: Array<{
        label: string;
        value: number;
        color: string;
    }>;
}

export interface TrendsViewProps {
    /** All transactions from the user */
    transactions: Transaction[];
    /** Theme for styling */
    theme: 'light' | 'dark';
    /** Color theme for chart colors (Normal/Professional) */
    colorTheme?: 'normal' | 'professional';
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
 */
function computePieData(
    transactions: Transaction[],
    category: { level: string; category?: string; group?: string }
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
    } else {
        // Show subcategories within the selected group
        transactions.forEach(tx => {
            tx.items
                .filter(item => item.category === category.group)
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

/**
 * Compute bar chart data from filtered transactions for comparison view.
 *
 * Grouping logic per UX spec - ALWAYS shows all slots for consistent layout:
 * - Year view: Always 4 bars (Q1, Q2, Q3, Q4) - empty bars for quarters without data
 * - Quarter view: Always 3 bars (months in quarter) - empty bars for months without data
 * - Month view: 4-5 bars (W1-W4 or W1-W5 depending on month) - empty bars for weeks without data
 * - Week view: Always 7 bars (Mon-Sun) - empty bars for days without data
 * - Day view: No comparison mode (returns empty)
 *
 * Segment logic (Story 7.18 extension):
 * - category.level='all': Segments by store category (tx.category)
 * - category.level='category': Segments by item group (item.category)
 * - category.level='group': Segments by subcategory (item.subcategory)
 */
function computeBarData(
    transactions: Transaction[],
    temporal: { level: string; year: string; quarter?: string; month?: string; week?: number; day?: string },
    category: { level: string; category?: string; group?: string },
    locale: string
): BarData[] {
    // Day view has no comparison
    if (temporal.level === 'day') {
        return [];
    }

    const barMap: Record<string, { total: number; segments: Record<string, number> }> = {};
    const dayNames = locale === 'es'
        ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Aggregate transactions into barMap
    transactions.forEach(tx => {
        let key: string;

        if (temporal.level === 'year') {
            // Group by quarter (Q1-Q4)
            const txMonth = tx.date.substring(0, 7); // YYYY-MM
            key = getQuarterFromMonth(txMonth); // Returns Q1, Q2, Q3, Q4
        } else if (temporal.level === 'quarter') {
            // Group by month within quarter (3 months)
            key = tx.date.substring(0, 7); // YYYY-MM
        } else if (temporal.level === 'month') {
            // Group by week (W1-W5)
            const day = parseInt(tx.date.split('-')[2], 10);
            const weekNum = Math.ceil(day / 7);
            key = `W${weekNum}`;
        } else if (temporal.level === 'week') {
            // Group by day of week (Mon-Sun)
            const date = new Date(tx.date + 'T12:00:00'); // Add time to avoid timezone issues
            const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            key = dayOfWeek.toString();
        } else {
            return;
        }

        if (!barMap[key]) {
            barMap[key] = { total: 0, segments: {} };
        }

        // Determine segment key AND bar total based on category drill-down level (Story 7.18 extension)
        // Total must match segment sum so bars scale correctly at each level
        if (category.level === 'all' || !category.category) {
            // At store level: use full transaction total, segment by store category
            barMap[key].total += tx.total;
            const segmentKey = tx.category || 'Other';
            barMap[key].segments[segmentKey] = (barMap[key].segments[segmentKey] || 0) + tx.total;
        } else if (category.level === 'category' || !category.group) {
            // At store category level: total = sum of item prices, segment by item groups
            let txItemTotal = 0;
            tx.items.forEach(item => {
                const segmentKey = item.category || 'General';
                barMap[key].segments[segmentKey] = (barMap[key].segments[segmentKey] || 0) + item.price;
                txItemTotal += item.price;
            });
            barMap[key].total += txItemTotal;
        } else {
            // At item group level: total = sum of filtered item prices, segment by subcategories
            let groupTotal = 0;
            tx.items
                .filter(item => item.category === category.group)
                .forEach(item => {
                    const segmentKey = item.subcategory || 'Other';
                    barMap[key].segments[segmentKey] = (barMap[key].segments[segmentKey] || 0) + item.price;
                    groupTotal += item.price;
                });
            barMap[key].total += groupTotal;
        }
    });

    // Define ALL slots for each temporal level (always show fixed layout)
    let allSlots: { key: string; label: string }[] = [];

    if (temporal.level === 'year') {
        // Always show 4 quarters
        allSlots = [
            { key: 'Q1', label: 'Q1' },
            { key: 'Q2', label: 'Q2' },
            { key: 'Q3', label: 'Q3' },
            { key: 'Q4', label: 'Q4' },
        ];
    } else if (temporal.level === 'quarter') {
        // Get the 3 months for the current quarter
        const year = parseInt(temporal.year, 10);
        const quarter = temporal.quarter || 'Q1';
        const quarterMonthStart = { Q1: 1, Q2: 4, Q3: 7, Q4: 10 }[quarter] || 1;

        allSlots = [0, 1, 2].map(offset => {
            const monthNum = quarterMonthStart + offset;
            const monthKey = `${year}-${monthNum.toString().padStart(2, '0')}`;
            const date = new Date(year, monthNum - 1, 2);
            const rawLabel = date.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'short' });
            // Capitalize first letter (e.g., "oct" → "Oct")
            const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
            return { key: monthKey, label };
        });
    } else if (temporal.level === 'month') {
        // Default to 4 weeks per UX mockup
        // Only show week 5 if there's data in days 29-31
        allSlots = [
            { key: 'W1', label: 'W1' },
            { key: 'W2', label: 'W2' },
            { key: 'W3', label: 'W3' },
            { key: 'W4', label: 'W4' },
        ];

        // Check if there's any data in week 5 (days 29+)
        const hasWeek5Data = barMap['W5'] && barMap['W5'].total > 0;
        if (hasWeek5Data) {
            allSlots.push({ key: 'W5', label: 'W5' });
        }
    } else if (temporal.level === 'week') {
        // Always show 7 days: Mon, Tue, Wed, Thu, Fri, Sat, Sun
        // Keys are 0-6 (Sun=0), but we display Mon-Sun order
        allSlots = [
            { key: '1', label: dayNames[1] }, // Mon
            { key: '2', label: dayNames[2] }, // Tue
            { key: '3', label: dayNames[3] }, // Wed
            { key: '4', label: dayNames[4] }, // Thu
            { key: '5', label: dayNames[5] }, // Fri
            { key: '6', label: dayNames[6] }, // Sat
            { key: '0', label: dayNames[0] }, // Sun
        ];
    }

    // Build result with all slots, using empty data where no transactions
    return allSlots.map(slot => {
        const data = barMap[slot.key];

        if (data) {
            const segments = Object.entries(data.segments).map(([segLabel, value]) => ({
                label: segLabel,
                value,
                color: getColor(segLabel),
            }));
            return { label: slot.label, total: data.total, segments };
        } else {
            // Empty slot - no data for this period
            return { label: slot.label, total: 0, segments: [] };
        }
    });
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
    // Note: colorTheme is a dependency because getColor() reads CSS variables
    // which change when colorTheme changes (default vs ghibli)
    const pieData = useMemo(
        () => computePieData(filteredTransactions, category),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filteredTransactions, category, colorTheme]
    );

    const barData = useMemo(
        () => computeBarData(filteredTransactions, temporal, category, locale),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filteredTransactions, temporal, category, locale, colorTheme]
    );

    // Compute total based on category level
    // At store level: sum transaction totals
    // At category level: sum all item prices
    // At group level: sum item prices for that group only
    const total = useMemo(() => {
        if (category.level === 'all' || !category.category) {
            // Store level: sum transaction totals
            return filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
        } else if (category.level === 'category' || !category.group) {
            // Category level: sum all item prices
            return filteredTransactions.reduce((sum, tx) => {
                return sum + tx.items.reduce((itemSum, item) => itemSum + item.price, 0);
            }, 0);
        } else {
            // Group level: sum item prices for the selected group only
            return filteredTransactions.reduce((sum, tx) => {
                return sum + tx.items
                    .filter(item => item.category === category.group)
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
            <div className="fixed top-0 left-0 right-0 z-20 px-3 pt-3 pb-1" style={{ backgroundColor: 'var(--bg)' }}>
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
            <DrillDownGrid
                transactions={filteredTransactions}
                theme={theme}
                locale={locale}
                currency={currency}
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

export default TrendsView;
