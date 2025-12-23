/**
 * Date Helper Utilities
 *
 * Story 10a.4: Insights History View
 *
 * Centralized date calculation utilities used across components.
 */

/**
 * Gets the ISO week number for a given date.
 *
 * ISO weeks start on Monday, and week 1 is the week containing January 4th.
 *
 * @param date - The date to get the week number for
 * @returns The ISO week number (1-53)
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
  // Make Sunday day 7 instead of 0
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  // January 4th is always in week 1
  const week1 = new Date(d.getFullYear(), 0, 4);
  // Calculate week number: weekday difference / 7 days
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
  return weekNum;
}

/**
 * Long press delay constant in milliseconds.
 * Used for batch selection activation in InsightsView.
 */
export const LONG_PRESS_DELAY_MS = 500;
