import React from 'react';
import { ArrowLeft, Download, BarChart2, PieChart } from 'lucide-react';
import { SimplePieChart } from '../components/charts/SimplePieChart';
import { GroupedBarChart } from '../components/charts/GroupedBarChart';

interface Transaction {
    id: string;
    merchant: string;
    alias?: string;
    date: string;
    total: number;
    category: string;
    items?: Array<{
        name: string;
        price: number;
        category?: string;
        subcategory?: string;
    }>;
}

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
    exportToCSV: (data: Transaction[], filename: string) => void;
    onBack: () => void;
    onSetSelectedYear: (year: string) => void;
    onSetSelectedMonth: (month: string | null) => void;
    onSetSelectedCategory: (category: string | null) => void;
    onSetSelectedGroup: (group: string | null) => void;
    onSetSelectedSubcategory: (subcategory: string | null) => void;
    onSetChartType: (type: string) => void;
    onEditTransaction: (transaction: Transaction) => void;
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
    exportToCSV,
    onBack,
    onSetSelectedYear,
    onSetSelectedMonth,
    onSetSelectedCategory,
    onSetSelectedGroup,
    onSetSelectedSubcategory,
    onSetChartType,
    onEditTransaction,
}) => {
    const card = theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100';
    const input = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200';

    const handleBackClick = () => {
        if (selectedSubcategory) onSetSelectedSubcategory(null);
        else if (selectedGroup) onSetSelectedGroup(null);
        else if (selectedCategory) onSetSelectedCategory(null);
        else if (selectedMonth) onSetSelectedMonth(null);
        else onBack();
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
                    <button onClick={handleBackClick}>
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
                    <button
                        onClick={() => exportToCSV(filteredTrans, `export_${selectedMonth || 'year'}.csv`)}
                        className="text-blue-600"
                    >
                        <Download />
                    </button>
                    <button onClick={() => onSetChartType(chartType === 'pie' ? 'bar' : 'pie')}>
                        {chartType === 'pie' ? <BarChart2 /> : <PieChart />}
                    </button>
                    {!selectedMonth && (
                        <select
                            value={selectedYear}
                            onChange={(e) => onSetSelectedYear(e.target.value)}
                            className={`text-sm p-1 rounded border ${input}`}
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
        </div>
    );
};
