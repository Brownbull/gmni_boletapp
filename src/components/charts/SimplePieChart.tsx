import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatCurrency } from '../../utils/currency';

export interface PieChartData {
    label: string;
    value: number;
    color: string;
}

interface SimplePieChartProps {
    data: PieChartData[];
    theme: string;
    currency: string;
}

// Tooltip data structure for displaying slice info
interface TooltipData {
    label: string;
    value: number;
    percentage: string;
    color: string;
}

/**
 * SimplePieChart - Donut-style pie chart for category breakdown.
 *
 * Uses CSS custom properties for theme-aware colors:
 * - Slice colors come from getColor() which uses --chart-* variables
 * - Center hole uses var(--bg) so it appears transparent (matches page background)
 * - Stroke uses var(--bg) for slice separation
 *
 * Tooltip behavior (Story 7.17):
 * - Click shows info tooltip at top of chart (never drills down)
 * - Auto-dismisses after 5 seconds
 * - Dismisses on click outside or selecting another slice
 *
 * @see docs/ux-design-specification.md Section 6.2 - PieChart component spec
 */
export const SimplePieChart: React.FC<SimplePieChartProps> = ({ data, theme, currency }) => {
    // Tooltip state - stores the data to display
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
    // Track which slice is active (for opacity effect)
    const [activeSliceIndex, setActiveSliceIndex] = useState<number | null>(null);
    // Timer ref for auto-dismiss
    const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isDark = theme === 'dark';
    const total = data.reduce((acc, d) => acc + d.value, 0);

    // Clear any existing timer
    const clearDismissTimer = useCallback(() => {
        if (dismissTimerRef.current) {
            clearTimeout(dismissTimerRef.current);
            dismissTimerRef.current = null;
        }
    }, []);

    // Start 5-second auto-dismiss timer
    const startDismissTimer = useCallback(() => {
        clearDismissTimer();
        dismissTimerRef.current = setTimeout(() => {
            setTooltipData(null);
            setActiveSliceIndex(null);
        }, 5000);
    }, [clearDismissTimer]);

    // Clean up timer on unmount
    useEffect(() => {
        return () => clearDismissTimer();
    }, [clearDismissTimer]);

    // Handle slice click - show tooltip at top of chart
    const handleSliceClick = (e: React.MouseEvent, sliceIndex: number, slice: PieChartData) => {
        e.stopPropagation();

        // If clicking the same slice, dismiss
        if (activeSliceIndex === sliceIndex) {
            setTooltipData(null);
            setActiveSliceIndex(null);
            clearDismissTimer();
            return;
        }

        // Calculate percentage
        const percentage = total > 0
            ? ((slice.value / total) * 100).toFixed(1)
            : '0.0';

        // Set tooltip data and active slice
        setTooltipData({
            label: slice.label,
            value: slice.value,
            percentage,
            color: slice.color
        });
        setActiveSliceIndex(sliceIndex);

        // Start auto-dismiss timer
        startDismissTimer();
    };

    // Click outside to dismiss tooltip
    const handleContainerClick = () => {
        setTooltipData(null);
        setActiveSliceIndex(null);
        clearDismissTimer();
    };

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

    // Use CSS variables for theme-aware colors
    // var(--bg) is the page background - using this makes the donut hole appear "transparent"
    // This ensures the chart blends seamlessly with the page in all themes
    const bgColor = 'var(--bg)';

    return (
        <div
            className="flex flex-col items-center justify-center py-4 animate-in fade-in relative"
            onClick={handleContainerClick}
        >
            {/* Tooltip positioned at top of chart area - always visible (Story 7.17) */}
            {tooltipData && (
                <div
                    className={`absolute top-0 left-1/2 -translate-x-1/2 text-sm px-4 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg border flex items-center gap-2 ${
                        isDark
                            ? 'bg-slate-800 text-white border-slate-600'
                            : 'bg-white text-slate-900 border-slate-300'
                    }`}
                >
                    {/* Color indicator dot */}
                    <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tooltipData.color }}
                    />
                    <div>
                        <span className="font-semibold">{tooltipData.label}</span>
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                            {' '}{formatCurrency(tooltipData.value, currency)} ({tooltipData.percentage}%)
                        </span>
                    </div>
                </div>
            )}

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

                    const isActive = activeSliceIndex === i;

                    return (
                        <path
                            key={i}
                            d={d}
                            fill={slice.color}
                            stroke={bgColor}
                            strokeWidth="2"
                            onClick={(e) => handleSliceClick(e, i, slice)}
                            className="cursor-pointer transition-opacity"
                            style={{ opacity: isActive ? 0.7 : 1 }}
                        />
                    );
                })}
                {/* Center hole for donut style - uses page background so it appears transparent */}
                <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill={bgColor}
                />
            </svg>
        </div>
    );
};
