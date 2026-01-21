/**
 *
 * Date range selector for filtering shared group transactions.
 * Enforces a maximum 12-month range.
 *
 * AC8: Filter by Date Range
 * - Select a date range for filtering transactions
 * - Maximum range is 12 months (hard cap)
 * - Default is current month
 *
 * @example
 * ```tsx
 * <DateRangeSelector
 *   startDate={dateRange.startDate}
 *   endDate={dateRange.endDate}
 *   onChange={setDateRange}
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import { TRANSLATIONS } from '../../utils/translations';

// =============================================================================
// Types
// =============================================================================

export interface DateRangeSelectorProps {
    /** Start date of the range */
    startDate: Date;
    /** End date of the range */
    endDate: Date;
    /** Callback when date range changes */
    onChange: (startDate: Date, endDate: Date) => void;
    /** Whether the selector is disabled */
    disabled?: boolean;
    /** Language for translations (default: 'es') */
    language?: 'en' | 'es';
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format date for display (e.g., "Enero 2026")
 */
function formatMonthYear(date: Date, locale: string = 'es'): string {
    return date.toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Get the first day of a month
 */
function getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of a month
 */
function getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Move to previous month
 */
function getPreviousMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

/**
 * Move to next month
 */
function getNextMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

// =============================================================================
// Preset Options
// =============================================================================

type PresetKey = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear';

interface Preset {
    key: PresetKey;
    labelKey: string;
    getRange: () => { startDate: Date; endDate: Date };
}

const PRESETS: Preset[] = [
    {
        key: 'thisMonth',
        labelKey: 'dateRangeThisMonth',
        getRange: () => {
            const now = new Date();
            return {
                startDate: getFirstDayOfMonth(now),
                endDate: getLastDayOfMonth(now),
            };
        },
    },
    {
        key: 'lastMonth',
        labelKey: 'dateRangeLastMonth',
        getRange: () => {
            const now = new Date();
            const lastMonth = getPreviousMonth(now);
            return {
                startDate: getFirstDayOfMonth(lastMonth),
                endDate: getLastDayOfMonth(lastMonth),
            };
        },
    },
    {
        key: 'last3Months',
        labelKey: 'dateRangeLast3Months',
        getRange: () => {
            const now = new Date();
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            return {
                startDate: getFirstDayOfMonth(threeMonthsAgo),
                endDate: getLastDayOfMonth(now),
            };
        },
    },
    {
        key: 'last6Months',
        labelKey: 'dateRangeLast6Months',
        getRange: () => {
            const now = new Date();
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            return {
                startDate: getFirstDayOfMonth(sixMonthsAgo),
                endDate: getLastDayOfMonth(now),
            };
        },
    },
    {
        key: 'thisYear',
        labelKey: 'dateRangeThisYear',
        getRange: () => {
            const now = new Date();
            return {
                startDate: new Date(now.getFullYear(), 0, 1),
                endDate: getLastDayOfMonth(now),
            };
        },
    },
];

// =============================================================================
// Component
// =============================================================================

/**
 * DateRangeSelector - Date range picker for shared group transactions.
 */
export function DateRangeSelector({
    startDate,
    endDate,
    onChange,
    disabled = false,
    language = 'es',
}: DateRangeSelectorProps) {
    const [showPicker, setShowPicker] = useState(false);
    const t = TRANSLATIONS[language] || TRANSLATIONS.es;

    // Format the current range for display
    const displayLabel = React.useMemo(() => {
        const startMonth = formatMonthYear(startDate, language);
        const endMonth = formatMonthYear(endDate, language);

        if (startMonth === endMonth) {
            return startMonth;
        }
        return `${startMonth} - ${endMonth}`;
    }, [startDate, endDate, language]);

    // Navigate to previous month
    const handlePreviousMonth = useCallback(() => {
        const newStart = getPreviousMonth(startDate);
        const newEnd = getLastDayOfMonth(newStart);
        onChange(getFirstDayOfMonth(newStart), newEnd);
    }, [startDate, onChange]);

    // Navigate to next month
    const handleNextMonth = useCallback(() => {
        const newStart = getNextMonth(startDate);
        const newEnd = getLastDayOfMonth(newStart);
        onChange(getFirstDayOfMonth(newStart), newEnd);
    }, [startDate, onChange]);

    // Apply a preset
    const handlePresetClick = useCallback((preset: Preset) => {
        const { startDate: newStart, endDate: newEnd } = preset.getRange();
        onChange(newStart, newEnd);
        setShowPicker(false);
    }, [onChange]);

    // Can't go to next month if it's in the future
    const canGoNext = startDate.getMonth() < new Date().getMonth() ||
                      startDate.getFullYear() < new Date().getFullYear();

    return (
        <div className="relative">
            {/* Main Control */}
            <div className="flex items-center gap-2 bg-[var(--color-card)] rounded-lg p-1">
                {/* Previous Button */}
                <button
                    type="button"
                    onClick={handlePreviousMonth}
                    disabled={disabled}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors disabled:opacity-50"
                    aria-label={t.dateRangePreviousMonth}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Date Display / Dropdown Toggle */}
                <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    disabled={disabled}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-center hover:bg-[var(--color-surface-alt)] rounded-lg transition-colors"
                    aria-expanded={showPicker}
                    aria-haspopup="listbox"
                >
                    {displayLabel}
                    <svg className={`inline-block ml-1 w-3 h-3 transition-transform ${showPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Next Button */}
                <button
                    type="button"
                    onClick={handleNextMonth}
                    disabled={disabled || !canGoNext}
                    className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors disabled:opacity-50"
                    aria-label={t.dateRangeNextMonth}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Dropdown Menu */}
            {showPicker && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowPicker(false)}
                        aria-hidden="true"
                    />

                    {/* Preset Options */}
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-card)] rounded-lg shadow-lg z-20 py-1 border border-[var(--color-border)]">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => handlePresetClick(preset)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-surface-alt)] transition-colors"
                            >
                                {t[preset.labelKey as keyof typeof t] || preset.key}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// =============================================================================
// Compact Variant
// =============================================================================

/**
 * Compact date range display (read-only).
 */
export function DateRangeDisplay({
    startDate,
    endDate,
    language = 'es',
}: {
    startDate: Date;
    endDate: Date;
    language?: 'en' | 'es';
}) {
    const displayLabel = React.useMemo(() => {
        const startMonth = formatMonthYear(startDate, language);
        const endMonth = formatMonthYear(endDate, language);

        if (startMonth === endMonth) {
            return startMonth;
        }
        return `${startMonth} - ${endMonth}`;
    }, [startDate, endDate, language]);

    return (
        <span className="text-xs text-[var(--color-text-secondary)]">
            {displayLabel}
        </span>
    );
}

export default DateRangeSelector;
