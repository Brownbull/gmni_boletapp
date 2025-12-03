import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, BarChart2, PieChart, Loader2, FileText, BarChart } from 'lucide-react';
import { SimplePieChart } from '../components/charts/SimplePieChart';
import { GroupedBarChart } from '../components/charts/GroupedBarChart';
import { downloadMonthlyTransactions, downloadYearlyStatistics } from '../utils/csvExport';
import { useSubscriptionTier } from '../hooks/useSubscriptionTier';
import { UpgradePromptModal } from '../components/UpgradePromptModal';
import type { Transaction } from '../types/transaction';

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

interface TrendsViewProps {
    selectedYear: string;
    selectedMonth: string | null;
    selectedCategory: string | null;
    selectedGroup: string | null;
    selectedSubcategory: string | null;
    chartType: string;
    pieData: PieData[];
    barData: BarData[];
    total: number;
    filteredTrans: Transaction[];
    yearMonths: string[];
    years: string[];
    theme: string;
    currency: string;
    lang: string;
    t: (key: string) => string;
    formatCurrency: (amount: number, currency: string) => string;
    onBack: () => void;
    onSetSelectedYear: (year: string) => void;
    onSetSelectedMonth: (month: string | null) => void;
    onSetSelectedCategory: (category: string | null) => void;
    onSetSelectedGroup: (group: string | null) => void;
    onSetSelectedSubcategory: (subcategory: string | null) => void;
    onSetChartType: (type: string) => void;
    onEditTransaction: (transaction: Transaction) => void;
    /** Whether export is in progress (Story 5.4) */
    exporting?: boolean;
    /** Callback to set exporting state (Story 5.4) */
    onExporting?: (value: boolean) => void;
    /** Callback for premium upgrade prompt (Story 5.5 placeholder) */
    onUpgradeRequired?: () => void;
}

export const TrendsView: React.FC<TrendsViewProps> = ({
    selectedYear,
    selectedMonth,
    selectedCategory,
    selectedGroup,
    selectedSubcategory,
    chartType,
    pieData,
    barData,
    total,
    filteredTrans,
    yearMonths,
    years,
    theme,
    currency,
    lang,
    t,
    formatCurrency,
    onBack,
    onSetSelectedYear,
    onSetSelectedMonth,
    onSetSelectedCategory,
    onSetSelectedGroup,
    onSetSelectedSubcategory,
    onSetChartType,
    onEditTransaction,
    exporting = false,
    onExporting,
    onUpgradeRequired,
}) => {
    const card = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
    const input = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200';

    // Story 5.4: Subscription tier check for premium export
    const { canAccessPremiumExport } = useSubscriptionTier();

    // Story 5.5: Upgrade prompt modal state (AC#4, AC#5, AC#6)
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const downloadButtonRef = useRef<HTMLButtonElement>(null);

    /**
     * Story 5.5: Determine export type based on view granularity (AC#3, ADR-012)
     * - selectedMonth null = year/quarter view = statistics export
     * - selectedMonth set = month view = transactions export
     */
    const isStatisticsExport = selectedMonth === null;

    const handleBackClick = () => {
        if (selectedSubcategory) onSetSelectedSubcategory(null);
        else if (selectedGroup) onSetSelectedGroup(null);
        else if (selectedCategory) onSetSelectedCategory(null);
        else if (selectedMonth) onSetSelectedMonth(null);
        else onBack();
    };

    /**
     * Handle upgrade modal close - return focus to download button (AC#6)
     */
    const handleCloseUpgradePrompt = useCallback(() => {
        setShowUpgradePrompt(false);
        // Focus will be returned by the modal component
    }, []);

    /**
     * Handle upgrade CTA click (placeholder for Epic 7)
     * TODO: Epic 7 - Navigate to subscription page or Mercado Pago
     */
    const handleUpgrade = useCallback(() => {
        // TODO: Epic 7 - Replace with actual navigation to subscription page
        console.log('Upgrade requested - Epic 7 will implement Mercado Pago integration');
        setShowUpgradePrompt(false);
    }, []);

    /**
     * Story 5.4 + 5.5: Handle export with subscription check and loading state
     * AC#1: Check subscription tier before download
     * AC#2, AC#3: Context-aware export (transactions vs statistics based on view)
     * AC#4: Show upgrade prompt for non-subscribers
     * AC#5, AC#6: Loading state during export with non-blocking UI
     */
    const handleExport = async () => {
        // AC#1, AC#4: Subscription check - show upgrade prompt if not premium
        if (!canAccessPremiumExport) {
            // Story 5.5: Show upgrade prompt modal instead of callback
            setShowUpgradePrompt(true);
            onUpgradeRequired?.(); // Keep callback for backwards compatibility
            return;
        }

        // Set loading state
        onExporting?.(true);
        try {
            // AC#5: Use requestAnimationFrame for non-blocking UI
            await new Promise(resolve => requestAnimationFrame(resolve));

            if (selectedMonth) {
                // Month view: export transactions with item-level detail
                const [year, month] = selectedMonth.split('-');
                downloadMonthlyTransactions(filteredTrans as Transaction[], year, month);
            } else {
                // Story 5.5 AC#1, AC#2: Year/quarter view exports statistics, not transactions
                downloadYearlyStatistics(filteredTrans as Transaction[], selectedYear);
            }
        } finally {
            onExporting?.(false);
        }
    };

    const handleSliceClick = (label: string) => {
        if (!selectedCategory) onSetSelectedCategory(label);
        else if (!selectedGroup) onSetSelectedGroup(label);
        else if (!selectedSubcategory) onSetSelectedSubcategory(label);
    };

    const handleMonthChange = (monthValue: string) => {
        if (selectedMonth) {
            onSetSelectedMonth(`${selectedMonth.split('-')[0]}-${monthValue}`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <button onClick={handleBackClick} aria-label={t('back')}>
                        <ArrowLeft />
                    </button>
                    <div className="flex flex-col justify-center">
                        {selectedMonth && !selectedCategory && (
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-lg uppercase">
                                    {new Date(selectedMonth + '-02').toLocaleString(lang, { month: 'long' })}
                                </span>
                                <span className="text-sm opacity-60">{selectedMonth.split('-')[0]}</span>
                                <select
                                    className="ml-2 bg-transparent text-xs opacity-0 absolute w-20 h-8 cursor-pointer"
                                    value={selectedMonth.split('-')[1]}
                                    onChange={(e) => handleMonthChange(e.target.value)}
                                    aria-label={t('selectMonth')}
                                >
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const m = String(i + 1).padStart(2, '0');
                                        return (
                                            <option key={m} value={m}>
                                                {new Date(`2000-${m}-01`).toLocaleString(lang, { month: 'long' })}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}
                        {(!selectedMonth || selectedCategory) && (
                            <h1 className="font-bold text-lg capitalize">
                                {selectedSubcategory || selectedGroup || selectedCategory || t('allTime')}
                            </h1>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Story 5.4 + 5.5: Download button with context-aware icon and subscription check */}
                    <button
                        ref={downloadButtonRef}
                        onClick={handleExport}
                        className="text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={isStatisticsExport ? t('downloadStatistics') : t('downloadTransactions')}
                        aria-busy={exporting}
                        disabled={exporting}
                        title={isStatisticsExport ? t('downloadStatistics') : t('downloadTransactions')}
                    >
                        {exporting ? (
                            <Loader2 className="animate-spin" aria-hidden="true" />
                        ) : isStatisticsExport ? (
                            /* Story 5.5 AC#3: BarChart2 icon for statistics export (year/quarter view) */
                            <BarChart2 aria-hidden="true" />
                        ) : (
                            /* Story 5.4: FileText icon for transactions export (month view) */
                            <FileText aria-hidden="true" />
                        )}
                    </button>
                    <button
                        onClick={() => onSetChartType(chartType === 'pie' ? 'bar' : 'pie')}
                        aria-label={chartType === 'pie' ? t('showBarChart') : t('showPieChart')}
                    >
                        {chartType === 'pie' ? <BarChart aria-hidden="true" /> : <PieChart aria-hidden="true" />}
                    </button>
                    {!selectedMonth && (
                        <select
                            value={selectedYear}
                            onChange={(e) => onSetSelectedYear(e.target.value)}
                            className={`text-sm p-1 rounded border ${input}`}
                            aria-label={t('selectYear')}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                            {!years.includes(selectedYear) && (
                                <option value={selectedYear}>{selectedYear}</option>
                            )}
                        </select>
                    )}
                </div>
            </div>

            <div className={`p-6 rounded-2xl border text-center ${card}`}>
                <div className="text-3xl font-bold mb-4">{formatCurrency(total, currency)}</div>
                <div className="h-60 flex items-center justify-center">
                    {chartType === 'pie' ? (
                        pieData.length > 0 ? (
                            <SimplePieChart
                                data={pieData}
                                theme={theme}
                                onSliceClick={handleSliceClick}
                            />
                        ) : (
                            <p>{t('noData')}</p>
                        )
                    ) : (
                        <GroupedBarChart data={barData} theme={theme} currency={currency} />
                    )}
                </div>
            </div>

            <div className="space-y-2">
                {!selectedMonth && !selectedCategory && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold opacity-60 uppercase mb-1">Breakdown</h3>
                            {pieData.map((d, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        if (!selectedCategory) onSetSelectedCategory(d.label);
                                    }}
                                    className={`p-2 border rounded flex justify-between items-center cursor-pointer text-xs ${card}`}
                                >
                                    <div className="truncate w-20">{d.label}</div>
                                    <div className="font-bold">{formatCurrency(d.value, currency)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold opacity-60 uppercase mb-1">
                                {t('monthsBreakdown')}
                            </h3>
                            {yearMonths.map(m => (
                                <div
                                    key={m}
                                    onClick={() => onSetSelectedMonth(m)}
                                    className={`p-2 border rounded flex justify-between items-center cursor-pointer text-xs ${card}`}
                                >
                                    <div>
                                        {new Date(m + '-02').toLocaleString(lang, { month: 'short' })}
                                    </div>
                                    <div className="font-bold">
                                        {formatCurrency(
                                            filteredTrans
                                                .filter(t => t.date.startsWith(m))
                                                .reduce((a, b) => a + b.total, 0),
                                            currency
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {(selectedMonth || selectedCategory) && !selectedSubcategory && pieData.map((d, i) => (
                    <div
                        key={i}
                        onClick={() => {
                            if (!selectedCategory) onSetSelectedCategory(d.label);
                            else if (!selectedGroup) onSetSelectedGroup(d.label);
                            else if (!selectedSubcategory) onSetSelectedSubcategory(d.label);
                        }}
                        className={`p-3 border rounded flex justify-between items-center cursor-pointer ${card}`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                            {d.label}
                        </div>
                        <div className="font-bold">{formatCurrency(d.value, currency)}</div>
                    </div>
                ))}
                {selectedSubcategory && filteredTrans.map(t => (
                    <div
                        key={t.id}
                        onClick={() => onEditTransaction(t)}
                        className={`p-3 border rounded flex justify-between items-center cursor-pointer ${card}`}
                    >
                        <div>{t.alias || t.merchant}</div>
                        <div className="font-bold">{formatCurrency(t.total, currency)}</div>
                    </div>
                ))}
            </div>

            {/* Story 5.5: Upgrade prompt modal for non-subscribers (AC#4-AC#7) */}
            <UpgradePromptModal
                isOpen={showUpgradePrompt}
                onClose={handleCloseUpgradePrompt}
                onUpgrade={handleUpgrade}
                t={t}
                theme={theme as 'light' | 'dark'}
            />
        </div>
    );
};
