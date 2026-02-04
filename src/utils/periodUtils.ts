/**
 * Period Computation Utilities
 *
 * Story 14d-v2-1-2a: Transaction Type & Period Utility
 * Epic 14d-v2 Architecture Decision AD-5: Pre-computed periods for efficient queries
 *
 * Computes temporal identifiers from transaction dates for efficient Firestore queries.
 * Uses ISO week numbering (Monday start, week belongs to year containing Thursday).
 */

import type { TransactionPeriods } from '../types/transaction';

/**
 * Compute all period identifiers from a transaction date string.
 *
 * @param dateString - Date in YYYY-MM-DD format
 * @returns TransactionPeriods object with day, week, month, quarter, year
 *
 * @example
 * ```typescript
 * const periods = computePeriods('2026-01-22');
 * // {
 * //   day: '2026-01-22',
 * //   week: '2026-W04',
 * //   month: '2026-01',
 * //   quarter: '2026-Q1',
 * //   year: '2026'
 * // }
 * ```
 */
export function computePeriods(dateString: string): TransactionPeriods {
    // Parse date as local date (not UTC) to avoid timezone issues
    const date = parseLocalDate(dateString);

    // Handle invalid dates
    if (isNaN(date.getTime())) {
        return createFallbackPeriods(dateString);
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-indexed to 1-indexed

    return {
        day: formatDay(date),
        week: computeISOWeek(date),
        month: formatMonth(year, month),
        quarter: computeQuarter(year, month),
        year: String(year),
    };
}

/**
 * Parse a date string as a local date (avoiding UTC conversion issues).
 * Handles YYYY-MM-DD format specifically to avoid Date constructor timezone quirks.
 */
function parseLocalDate(dateString: string): Date {
    if (!dateString) return new Date(NaN);

    // Try to parse YYYY-MM-DD format manually to avoid timezone issues
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed
        const day = parseInt(parts[2], 10);

        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month, day);
        }
    }

    // Fallback to Date constructor
    return new Date(dateString);
}

/**
 * Format date as YYYY-MM-DD string.
 */
function formatDay(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format month as YYYY-MM string.
 */
function formatMonth(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Compute quarter identifier (YYYY-Qn).
 */
function computeQuarter(year: number, month: number): string {
    const quarter = Math.ceil(month / 3);
    return `${year}-Q${quarter}`;
}

/**
 * Compute ISO 8601 week number (YYYY-Www).
 *
 * ISO week rules:
 * - Week starts on Monday
 * - Week 1 is the week containing the first Thursday of the year
 * - Dec 31 may be in week 1 of next year
 * - Jan 1-3 may be in week 52/53 of previous year
 */
function computeISOWeek(date: Date): string {
    // Create a copy to avoid mutating the original
    const d = new Date(date.getTime());

    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Convert to ISO day (1 = Monday, ..., 7 = Sunday)
    const dayOfWeek = d.getDay() || 7;

    // Set to nearest Thursday: current date + (4 - day of week)
    // This ensures we're in the correct ISO week year
    d.setDate(d.getDate() + 4 - dayOfWeek);

    // Get the year of the Thursday (this is the ISO week year)
    const isoYear = d.getFullYear();

    // Get the ISO week number
    const isoWeekNumber = getISOWeekNumber(date);

    return `${isoYear}-W${String(isoWeekNumber).padStart(2, '0')}`;
}

/**
 * Get ISO 8601 week number (1-53).
 *
 * Algorithm:
 * 1. Find the Thursday of the current week
 * 2. Determine which year that Thursday belongs to
 * 3. Count weeks from the first Thursday of that year
 */
function getISOWeekNumber(date: Date): number {
    // Create a copy to avoid mutation
    const d = new Date(date.getTime());

    // Set to Thursday of current week (ISO week contains Thursday)
    const dayOfWeek = d.getDay() || 7; // Convert Sunday (0) to 7
    d.setDate(d.getDate() + (4 - dayOfWeek)); // Move to Thursday

    // Get the year of this Thursday (this is the ISO week year)
    const year = d.getFullYear();

    // Calculate the first Thursday of the ISO week year
    // Jan 4 is always in week 1 (because it's always within 3 days of Jan 1)
    const jan4 = new Date(year, 0, 4);
    const jan4DayOfWeek = jan4.getDay() || 7; // Convert Sunday (0) to 7

    // Find the Monday of week 1 (the Monday on or before Jan 4)
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() - (jan4DayOfWeek - 1));

    // Calculate weeks between the Monday of week 1 and the Monday of current week
    const currentMonday = new Date(d);
    currentMonday.setDate(d.getDate() - 3); // Thursday - 3 = Monday

    const diffMs = currentMonday.getTime() - week1Monday.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return weekNumber;
}

/**
 * Create fallback periods for invalid dates.
 * Returns a structure with placeholder values to prevent runtime errors.
 * Uses clearly invalid markers (W00, Q0) to make invalid data detectable.
 */
function createFallbackPeriods(dateString: string): TransactionPeriods {
    // Log warning in development to help debug invalid dates
    if (import.meta.env.DEV) {
        console.warn(`[periodUtils] Invalid date string: "${dateString}"`);
    }

    // Try to extract year from the string if possible
    const yearMatch = dateString.match(/^(\d{4})/);
    const year = yearMatch ? yearMatch[1] : '0000';

    // Return clearly invalid markers so downstream code can detect bad data
    // W00 and Q0 are intentionally invalid (weeks are 1-53, quarters are 1-4)
    return {
        day: dateString || '0000-00-00',
        week: `${year}-W00`,
        month: `${year}-00`,
        quarter: `${year}-Q0`,
        year: year,
    };
}
