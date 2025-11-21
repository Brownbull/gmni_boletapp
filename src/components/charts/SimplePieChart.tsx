import React from 'react';

export interface PieChartData {
    label: string;
    value: number;
    color: string;
}

interface SimplePieChartProps {
    data: PieChartData[];
    onSliceClick?: (label: string) => void;
    theme: string;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data, onSliceClick, theme }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    if (total === 0) {
        return <div className="h-40 flex items-center justify-center opacity-50">No Data</div>;
    }

    let currentAngle = 0;
    const slices = data.map(d => {
        const angle = (d.value / total) * 360;
        const start = currentAngle;
        currentAngle += angle;
        return { ...d, start, angle };
    });

    return (
        <div className="flex items-center justify-center py-4 animate-in fade-in">
            <svg viewBox="0 0 100 100" className="w-48 h-48 transform -rotate-90">
                {slices.map((slice, i) => {
                    const large = slice.angle > 180 ? 1 : 0;
                    const x1 = 50 + 50 * Math.cos(Math.PI * slice.start / 180);
                    const y1 = 50 + 50 * Math.sin(Math.PI * slice.start / 180);
                    const x2 = 50 + 50 * Math.cos(Math.PI * (slice.start + slice.angle) / 180);
                    const y2 = 50 + 50 * Math.sin(Math.PI * (slice.start + slice.angle) / 180);

                    // Safe handling for full circle
                    const d = slice.angle > 359
                        ? `M 50 50 m -50 0 a 50 50 0 1 0 100 0 a 50 50 0 1 0 -100 0`
                        : `M 50 50 L ${x1} ${y1} A 50 50 0 ${large} 1 ${x2} ${y2} Z`;

                    return (
                        <path
                            key={i}
                            d={d}
                            fill={slice.color}
                            stroke={theme === 'dark' ? '#1e293b' : '#ffffff'}
                            strokeWidth="2"
                            onClick={() => onSliceClick && onSliceClick(slice.label)}
                            className="hover:opacity-80 cursor-pointer"
                        />
                    );
                })}
                <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill={theme === 'dark' ? '#1e293b' : '#ffffff'}
                />
            </svg>
        </div>
    );
};
