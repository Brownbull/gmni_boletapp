import React from 'react';
import { formatCurrency } from '../../utils/currency';

export interface BarSegment {
    label: string;
    value: number;
    color: string;
}

export interface BarChartData {
    label: string;
    total: number;
    segments: BarSegment[];
}

interface GroupedBarChartProps {
    data: BarChartData[];
    theme: string;
    currency: string;
}

export const GroupedBarChart: React.FC<GroupedBarChartProps> = ({ data, theme, currency }) => {
    const allValues = data.flatMap(d => d.segments.map(s => s.value));
    const max = Math.max(...allValues, 1);

    if (data.length === 0) {
        return <div className="h-40 flex items-center justify-center opacity-50">No Data</div>;
    }

    return (
        <div className="h-60 pt-6 pb-8 px-2 overflow-x-auto w-full">
            <div className="h-full flex items-end gap-4 min-w-max px-2">
                {data.map((d, i) => (
                    <div key={i} className="flex flex-col items-center group h-full justify-end">
                        <div className="flex items-end gap-1 h-full">
                            {d.segments.map((seg, j) => (
                                <div
                                    key={j}
                                    className="w-3 sm:w-4 rounded-t transition-all duration-300 relative hover:opacity-80"
                                    style={{
                                        height: `${(seg.value / max) * 100}%`,
                                        backgroundColor: seg.color,
                                        minHeight: seg.value > 0 ? '4px' : '0'
                                    }}
                                >
                                    <div
                                        className={`hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] p-1 rounded whitespace-nowrap z-50 shadow-sm border pointer-events-none ${theme === 'dark' ? 'bg-black text-white border-gray-700' : 'bg-white text-black border-gray-200'}`}
                                    >
                                        {seg.label}: {formatCurrency(seg.value, currency)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={`text-[10px] mt-2 font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            {d.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
