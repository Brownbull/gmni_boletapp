/**
 * Date Utilities
 *
 * Quarter and week calculation utilities for temporal navigation.
 * Uses month-aligned week chunks (NOT ISO weeks) per ADR-012.
 *
 * @see docs/architecture-epic7.md - ADR-012: Month-Aligned Week Chunks
 * @see docs/sprint-artifacts/epic7/story-7.6-quarter-week-date-utilities.md
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Quarter representation with label and associated months.
 */
export interface Quarter {
  label: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  months: [string, string, string]; // YYYY-MM format
}

/**
 * Week range within a month.
 * Uses month-aligned chunks: Oct 1-7, Oct 8-14, etc.
 * Last week may have fewer than 7 days.
 */
export interface WeekRange {
  label: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  weekNumber: number; // 1-5 within month
}

// ============================================================================
// Quarter Utilities
// ============================================================================

/**
 * Gets all quarters for a given year.
 *
 * @param year - The year (e.g., 2024)
 * @returns Array of 4 Quarter objects with label and month strings
 *
 * @example
 * getQuartersInYear(2024)
 * // Returns: [
 * //   { label: 'Q1', months: ['2024-01', '2024-02', '2024-03'] },
 * //   { label: 'Q2', months: ['2024-04', '2024-05', '2024-06'] },
 * //   { label: 'Q3', months: ['2024-07', '2024-08', '2024-09'] },
 * //   { label: 'Q4', months: ['2024-10', '2024-11', '2024-12'] }
 * // ]
 */
export function getQuartersInYear(year: number): Quarter[] {
  const yearStr = year.toString();
  return [
    { label: 'Q1', months: [`${yearStr}-01`, `${yearStr}-02`, `${yearStr}-03`] },
    { label: 'Q2', months: [`${yearStr}-04`, `${yearStr}-05`, `${yearStr}-06`] },
    { label: 'Q3', months: [`${yearStr}-07`, `${yearStr}-08`, `${yearStr}-09`] },
    { label: 'Q4', months: [`${yearStr}-10`, `${yearStr}-11`, `${yearStr}-12`] },
  ];
}

/**
 * Gets the months in a specific quarter.
 *
 * @param year - The year (e.g., 2024)
 * @param quarter - Quarter string (Q1, Q2, Q3, Q4)
 * @returns Array of 3 month strings in YYYY-MM format
 *
 * @example
 * getMonthsInQuarter(2024, 'Q4')
 * // Returns: ['2024-10', '2024-11', '2024-12']
 */
export function getMonthsInQuarter(year: number, quarter: string): string[] {
  const yearStr = year.toString();
  switch (quarter.toUpperCase()) {
    case 'Q1':
      return [`${yearStr}-01`, `${yearStr}-02`, `${yearStr}-03`];
    case 'Q2':
      return [`${yearStr}-04`, `${yearStr}-05`, `${yearStr}-06`];
    case 'Q3':
      return [`${yearStr}-07`, `${yearStr}-08`, `${yearStr}-09`];
    case 'Q4':
      return [`${yearStr}-10`, `${yearStr}-11`, `${yearStr}-12`];
    default:
      return [`${yearStr}-01`, `${yearStr}-02`, `${yearStr}-03`]; // Default to Q1
  }
}

/**
 * Determines which quarter a month belongs to.
 *
 * @param month - Month string in YYYY-MM format (e.g., '2024-10')
 * @returns Quarter label (Q1, Q2, Q3, or Q4)
 *
 * @example
 * getQuarterFromMonth('2024-10')
 * // Returns: 'Q4'
 */
export function getQuarterFromMonth(month: string): string {
  const monthNum = parseInt(month.split('-')[1], 10);

  if (monthNum >= 1 && monthNum <= 3) return 'Q1';
  if (monthNum >= 4 && monthNum <= 6) return 'Q2';
  if (monthNum >= 7 && monthNum <= 9) return 'Q3';
  return 'Q4'; // 10, 11, 12
}

// ============================================================================
// Week Utilities
// ============================================================================

/**
 * Gets weeks in a month using month-aligned chunks.
 *
 * Week calculation uses fixed 7-day chunks within each month (NOT ISO weeks):
 * - Week 1: Days 1-7
 * - Week 2: Days 8-14
 * - Week 3: Days 15-21
 * - Week 4: Days 22-28
 * - Week 5: Days 29-31 (or 29-30, or just 29 for leap Feb)
 *
 * @param month - Month string in YYYY-MM format (e.g., '2024-10')
 * @param locale - Locale for formatting (default: 'en')
 * @returns Array of WeekRange objects
 *
 * @example
 * getWeeksInMonth('2024-10', 'en')
 * // Returns: [
 * //   { label: 'Oct 1-7', start: '2024-10-01', end: '2024-10-07', weekNumber: 1 },
 * //   { label: 'Oct 8-14', start: '2024-10-08', end: '2024-10-14', weekNumber: 2 },
 * //   { label: 'Oct 15-21', start: '2024-10-15', end: '2024-10-21', weekNumber: 3 },
 * //   { label: 'Oct 22-28', start: '2024-10-22', end: '2024-10-28', weekNumber: 4 },
 * //   { label: 'Oct 29-31', start: '2024-10-29', end: '2024-10-31', weekNumber: 5 }
 * // ]
 */
export function getWeeksInMonth(month: string, locale: string = 'en'): WeekRange[] {
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  // Get days in month (0th day of next month = last day of current month)
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const weeks: WeekRange[] = [];
  let weekStart = 1;
  let weekNumber = 1;

  while (weekStart <= daysInMonth) {
    const weekEnd = Math.min(weekStart + 6, daysInMonth);

    // Format dates as YYYY-MM-DD
    const startDate = `${yearStr}-${monthStr}-${weekStart.toString().padStart(2, '0')}`;
    const endDate = `${yearStr}-${monthStr}-${weekEnd.toString().padStart(2, '0')}`;

    // Generate label
    const label = formatWeekLabel(startDate, endDate, locale);

    weeks.push({
      label,
      start: startDate,
      end: endDate,
      weekNumber,
    });

    weekStart = weekEnd + 1;
    weekNumber++;
  }

  return weeks;
}

/**
 * Formats a week label with locale-aware month abbreviation.
 *
 * @param start - Start date in YYYY-MM-DD format
 * @param end - End date in YYYY-MM-DD format
 * @param locale - Locale for formatting ('en' or 'es')
 * @returns Formatted label like "Oct 1-7" (English) or "oct 1-7" (Spanish)
 *
 * @example
 * formatWeekLabel('2024-10-01', '2024-10-07', 'en')
 * // Returns: 'Oct 1-7'
 *
 * @example
 * formatWeekLabel('2024-10-01', '2024-10-07', 'es')
 * // Returns: 'oct 1-7' or similar locale-appropriate format
 */
export function formatWeekLabel(start: string, end: string, locale: string = 'en'): string {
  const [yearStr, monthStr, startDayStr] = start.split('-');
  const [, , endDayStr] = end.split('-');

  const startDay = parseInt(startDayStr, 10);
  const endDay = parseInt(endDayStr, 10);

  // Get locale-aware month abbreviation
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  const shortMonth = date.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    month: 'short',
  });

  // Remove trailing period if present (some locales add it)
  const cleanMonth = shortMonth.replace(/\.$/, '');

  return `${cleanMonth} ${startDay}-${endDay}`;
}

// ============================================================================
// Legacy formatDate function
// ============================================================================

export const formatDate = (dateStr: string, format: 'LatAm' | 'US'): string => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  if (format === 'US') return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return `${parts[2]}/${parts[1]}/${parts[0]}`; // LatAm default
};
