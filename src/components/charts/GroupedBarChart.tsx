import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatCurrency } from '../../utils/currency';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { DURATION, EASING, STAGGER } from '../animation/constants';

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

interface StackedBarChartProps {
    data: BarChartData[];
    theme: string;
    currency: string;
}

// Tooltip data structure for displaying segment info
interface TooltipData {
    label: string;
    value: number;
    percentage: string;
    color: string;
}

/**
 * StackedBarChart - Displays stacked vertical bars for comparison view.
 *
 * Story 14.8: Enhanced with animations:
 * - Entry animation: staggered fade-in + scale-up for each bar
 * - Breathing effect on hover/focus (subtle scale)
 * - Touch feedback on tap
 * - Reduced motion support
 *
 * Each bar represents a time period with segments stacked vertically,
 * showing both total spending AND category breakdown in a single visual.
 *
 * Per UX Spec Section 6.2 and mockup (docs/ux-design-directions.html):
 * - Bars scale to max total
 * - Each bar divided by category colors
 * - Bars spread across full width using justify-between (AC #13)
 * - Horizontal scroll enabled when many bars (AC #14)
 *
 * Tooltip behavior (Story 7.17):
 * - Shows above all bars (never hidden behind)
 * - Auto-dismisses after 5 seconds
 * - Dismisses on click outside or selecting another segment
 *
 * Temporal grouping (handled by TrendsView.computeBarData):
 * - Year view: 4 bars (Q1-Q4)
 * - Quarter view: 3 bars (months)
 * - Month view: 4-5 bars (W1-W5)
 * - Week view: 7 bars (Mon-Sun)
 *
 * @see docs/uxui/motion-design-system.md - Animation specifications
 */
export const StackedBarChart: React.FC<StackedBarChartProps> = ({ data, theme, currency }) => {
    // Animation and accessibility hooks
    const prefersReducedMotion = useReducedMotion();

    // Tooltip state - stores the data to display, positioned at top of chart
    const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
    // Track which segment is highlighted (for opacity effect)
    const [activeSegment, setActiveSegment] = useState<{ barIndex: number; segIndex: number } | null>(null);
    // Track hover state for breathing effect
    const [hoveredSegment, setHoveredSegment] = useState<{ barIndex: number; segIndex: number } | null>(null);
    // Track touch state for touch feedback
    const [touchedSegment, setTouchedSegment] = useState<{ barIndex: number; segIndex: number } | null>(null);
    // Entry animation state
    const [hasEntered, setHasEntered] = useState(false);
    // Timer ref for auto-dismiss
    const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Trigger entry animation after mount
    useEffect(() => {
        if (prefersReducedMotion) {
            setHasEntered(true);
            return;
        }
        // Small delay before entry animation
        const timer = setTimeout(() => setHasEntered(true), 50);
        return () => clearTimeout(timer);
    }, [prefersReducedMotion]);

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
            setActiveSegment(null);
        }, 5000);
    }, [clearDismissTimer]);

    // Clean up timer on unmount
    useEffect(() => {
        return () => clearDismissTimer();
    }, [clearDismissTimer]);

    // Handle segment click - show tooltip above chart
    const handleSegmentClick = (
        e: React.MouseEvent,
        barIndex: number,
        segIndex: number,
        seg: BarSegment,
        barTotal: number
    ) => {
        e.stopPropagation();

        // If clicking the same segment, dismiss
        if (activeSegment?.barIndex === barIndex && activeSegment?.segIndex === segIndex) {
            setTooltipData(null);
            setActiveSegment(null);
            clearDismissTimer();
            return;
        }

        // Calculate percentage
        const percentage = barTotal > 0
            ? ((seg.value / barTotal) * 100).toFixed(1)
            : '0.0';

        // Set tooltip data and active segment
        setTooltipData({
            label: seg.label,
            value: seg.value,
            percentage,
            color: seg.color
        });
        setActiveSegment({ barIndex, segIndex });

        // Start auto-dismiss timer
        startDismissTimer();
    };

    // Touch handlers for mobile feedback
    const handleTouchStart = (barIndex: number, segIndex: number) => {
        if (!prefersReducedMotion) {
            setTouchedSegment({ barIndex, segIndex });
            // Haptic feedback on supported devices
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }
    };

    const handleTouchEnd = () => {
        setTouchedSegment(null);
    };

    // Click outside to dismiss tooltip
    const handleContainerClick = () => {
        setTooltipData(null);
        setActiveSegment(null);
        clearDismissTimer();
    };

    // Scale based on TOTAL bar heights, not individual segments (AC #2)
    const maxTotal = Math.max(...data.map(d => d.total), 1);

    // Determine if we need horizontal scroll (only for many bars like 31 days)
    const needsScroll = data.length > 8;

    // Dynamic bar width based on count
    // For ≤7 bars (typical case): use flex-1 to fill available space
    // For >8 bars: use fixed width with scroll
    const getBarWidthClass = () => {
        if (!needsScroll) return 'flex-1 max-w-16'; // Fill space, max 64px
        if (data.length <= 12) return 'w-10';       // 40px
        return 'w-8';                                // 32px for many bars
    };

    const barWidthClass = getBarWidthClass();
    const isDark = theme === 'dark';

    // Calculate stagger delay for entry animation
    const getBarDelay = (index: number): number => {
        if (prefersReducedMotion) return 0;
        // Compress stagger for many bars
        const stagger = data.length > 10
            ? STAGGER.FAST // 50ms
            : STAGGER.DEFAULT; // 100ms
        const maxDelay = STAGGER.MAX_DURATION - DURATION.NORMAL;
        return Math.min(index * stagger, maxDelay);
    };

    if (data.length === 0) {
        return <div className="h-40 flex items-center justify-center opacity-50">No Data</div>;
    }

    return (
        <div
            className="w-full relative flex flex-col"
            onClick={handleContainerClick}
        >
            {/* Tooltip area - dedicated space above bars (Story 7.17 fix) */}
            {/* Fixed height ensures tooltip never overlaps chart bars */}
            <div className="h-10 relative flex items-center justify-center">
                {tooltipData && (
                    <div
                        className={`text-sm px-4 py-2 rounded-lg whitespace-nowrap z-50 shadow-lg border flex items-center gap-2 ${
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
            </div>

            {/* Chart area with bars */}
            <div className={`h-48 pb-8 px-4 ${needsScroll ? 'overflow-x-auto' : ''}`}>
                {/*
                  Full-width distribution (AC #13):
                  - justify-between spreads bars across full width
                  - For scrollable content, use min-w-max to prevent shrinking
                */}
                <div className={`h-full flex items-end ${needsScroll ? 'gap-2 min-w-max' : 'justify-between'} px-2`}>
                {data.map((d, barIndex) => {
                    // Entry animation style for each bar (staggered)
                    const barEntryStyle: React.CSSProperties = prefersReducedMotion
                        ? {}
                        : {
                            opacity: hasEntered ? 1 : 0,
                            transform: hasEntered ? 'scaleY(1)' : 'scaleY(0)',
                            transformOrigin: 'bottom',
                            transition: `opacity ${DURATION.NORMAL}ms ${EASING.OUT}, transform ${DURATION.SLOW}ms ${EASING.OUT}`,
                            transitionDelay: `${getBarDelay(barIndex)}ms`,
                        };

                    return (
                        <div
                            key={barIndex}
                            className={`flex flex-col items-center h-full justify-end ${barWidthClass}`}
                            style={barEntryStyle}
                        >
                            {/* STACKED: Single column with segments stacked vertically (AC #1) */}
                            <div
                                className="flex flex-col-reverse w-full relative"
                                style={{
                                    height: `${(d.total / maxTotal) * 100}%`,
                                    minHeight: d.total > 0 ? '4px' : '0',
                                    maxWidth: needsScroll ? undefined : '48px' // Limit bar width when using justify-between
                                }}
                            >
                                {d.segments.map((seg, segIndex) => {
                                    // Height proportional to segment value within this bar's total (AC #2, #3)
                                    const segmentHeightPercent = d.total > 0
                                        ? (seg.value / d.total) * 100
                                        : 0;

                                    // Highlight active segment with reduced opacity
                                    const isActive = activeSegment?.barIndex === barIndex && activeSegment?.segIndex === segIndex;
                                    const isHovered = hoveredSegment?.barIndex === barIndex && hoveredSegment?.segIndex === segIndex;
                                    const isTouched = touchedSegment?.barIndex === barIndex && touchedSegment?.segIndex === segIndex;

                                    // Calculate scale for hover/touch feedback
                                    let scaleX = 1;
                                    if (!prefersReducedMotion) {
                                        if (isTouched) {
                                            scaleX = 0.95; // Press-in effect
                                        } else if (isHovered) {
                                            scaleX = 1.05; // Subtle breathing/hover effect (horizontal only)
                                        }
                                    }

                                    // Segment styles with animation
                                    const segmentStyle: React.CSSProperties = {
                                        height: `${segmentHeightPercent}%`,
                                        backgroundColor: seg.color,
                                        minHeight: seg.value > 0 ? '2px' : '0',
                                        opacity: isActive ? 0.7 : 1,
                                        transform: `scaleX(${scaleX})`,
                                        transition: prefersReducedMotion
                                            ? undefined
                                            : `opacity ${DURATION.FAST}ms ${EASING.OUT}, transform ${DURATION.FAST}ms ${EASING.OUT}`,
                                    };

                                    return (
                                        <div
                                            key={segIndex}
                                            className={`relative cursor-pointer ${segIndex === d.segments.length - 1 ? 'rounded-t' : ''}`}
                                            style={segmentStyle}
                                            onClick={(e) => handleSegmentClick(e, barIndex, segIndex, seg, d.total)}
                                            onMouseEnter={() => setHoveredSegment({ barIndex, segIndex })}
                                            onMouseLeave={() => setHoveredSegment(null)}
                                            onTouchStart={() => handleTouchStart(barIndex, segIndex)}
                                            onTouchEnd={handleTouchEnd}
                                            onTouchCancel={handleTouchEnd}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`${seg.label}: ${formatCurrency(seg.value, currency)}`}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleSegmentClick(e as unknown as React.MouseEvent, barIndex, segIndex, seg, d.total);
                                                }
                                            }}
                                            onFocus={() => setHoveredSegment({ barIndex, segIndex })}
                                            onBlur={() => setHoveredSegment(null)}
                                        />
                                    );
                                })}
                            </div>
                            {/* Period label - text-sm (14px) increased for better readability */}
                            <div className={`text-sm mt-2 font-medium text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {d.label}
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>
        </div>
    );
};

// Export alias for backwards compatibility with existing imports
export const GroupedBarChart = StackedBarChart;
