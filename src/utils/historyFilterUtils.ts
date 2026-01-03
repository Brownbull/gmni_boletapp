/**
 * History Filter Utilities
 *
 * Filtering logic and helper functions for history transaction filtering.
 * Story 9.19: History Transaction Filters
 *
 * @see docs/sprint-artifacts/epic9/story-9.19-history-transaction-filters.md
 */

import type { Transaction } from '../types/transaction';
import type {
  HistoryFilterState,
  TemporalFilterState,
  CategoryFilterState,
  LocationFilterState,
} from '../contexts/HistoryFiltersContext';

// ============================================================================
// Filter Data Extraction
// ============================================================================

/**
 * Available filter options extracted from transaction data.
 */
export interface AvailableFilters {
  /** Unique years present in transactions */
  years: string[];
  /** Months by year (e.g., { "2024": ["2024-01", "2024-02"] }) */
  monthsByYear: Record<string, string[]>;
  /** Unique store categories */
  categories: string[];
  /** Item groups by store category */
  groupsByCategory: Record<string, string[]>;
  /** Subcategories by item group */
  subcategoriesByGroup: Record<string, string[]>;
  /** Unique countries */
  countries: string[];
  /** Cities by country */
  citiesByCountry: Record<string, string[]>;
}

/**
 * Extract available filter options from transactions.
 * Used to populate dropdown menus.
 */
export function extractAvailableFilters(transactions: Transaction[]): AvailableFilters {
  const yearsSet = new Set<string>();
  const monthsByYear: Record<string, Set<string>> = {};
  const categoriesSet = new Set<string>();
  const groupsByCategory: Record<string, Set<string>> = {};
  const subcategoriesByGroup: Record<string, Set<string>> = {};
  const countriesSet = new Set<string>();
  const citiesByCountry: Record<string, Set<string>> = {};

  for (const tx of transactions) {
    // Extract year
    const year = tx.date.substring(0, 4);
    yearsSet.add(year);

    // Extract month
    const month = tx.date.substring(0, 7);
    if (!monthsByYear[year]) {
      monthsByYear[year] = new Set();
    }
    monthsByYear[year].add(month);

    // Extract store category
    if (tx.category) {
      categoriesSet.add(tx.category);
    }

    // Extract item groups and subcategories
    for (const item of tx.items || []) {
      if (item.category) {
        if (!groupsByCategory[tx.category]) {
          groupsByCategory[tx.category] = new Set();
        }
        groupsByCategory[tx.category].add(item.category);

        if (item.subcategory) {
          if (!subcategoriesByGroup[item.category]) {
            subcategoriesByGroup[item.category] = new Set();
          }
          subcategoriesByGroup[item.category].add(item.subcategory);
        }
      }
    }

    // Extract location
    if (tx.country) {
      countriesSet.add(tx.country);

      if (tx.city) {
        if (!citiesByCountry[tx.country]) {
          citiesByCountry[tx.country] = new Set();
        }
        citiesByCountry[tx.country].add(tx.city);
      }
    }
  }

  // Convert sets to sorted arrays
  return {
    years: Array.from(yearsSet).sort((a, b) => b.localeCompare(a)), // Descending
    monthsByYear: Object.fromEntries(
      Object.entries(monthsByYear).map(([year, months]) => [
        year,
        Array.from(months).sort((a, b) => b.localeCompare(a)), // Descending
      ])
    ),
    categories: Array.from(categoriesSet).sort(),
    groupsByCategory: Object.fromEntries(
      Object.entries(groupsByCategory).map(([cat, groups]) => [
        cat,
        Array.from(groups).sort(),
      ])
    ),
    subcategoriesByGroup: Object.fromEntries(
      Object.entries(subcategoriesByGroup).map(([group, subcats]) => [
        group,
        Array.from(subcats).sort(),
      ])
    ),
    countries: Array.from(countriesSet).sort(),
    citiesByCountry: Object.fromEntries(
      Object.entries(citiesByCountry).map(([country, cities]) => [
        country,
        Array.from(cities).sort(),
      ])
    ),
  };
}

// ============================================================================
// Temporal Filter Helpers
// ============================================================================

/**
 * Get the quarter (1-4) from a month string (YYYY-MM).
 * Story 9.20: Quarter support for analytics navigation.
 */
export function getQuarterFromMonth(month: string): number {
  const monthNum = parseInt(month.split('-')[1], 10);
  return Math.ceil(monthNum / 3);
}

/**
 * Get the quarter label (Q1, Q2, Q3, Q4) from a quarter number.
 */
export function getQuarterLabel(quarter: number): string {
  return `Q${quarter}`;
}

/**
 * Get the months (YYYY-MM strings) that belong to a quarter.
 * Story 9.20: Quarter support for analytics navigation.
 * @param year - Year as string (e.g., "2024")
 * @param quarter - Quarter number (1-4)
 * @returns Array of 3 month strings (e.g., ["2024-01", "2024-02", "2024-03"])
 */
export function getMonthsInQuarter(year: string, quarter: number): string[] {
  const startMonth = (quarter - 1) * 3 + 1;
  return [0, 1, 2].map(offset => {
    const month = (startMonth + offset).toString().padStart(2, '0');
    return `${year}-${month}`;
  });
}

/**
 * Get the quarters available in a year.
 * @returns Array of quarter numbers [1, 2, 3, 4]
 */
export function getQuartersInYear(): number[] {
  return [1, 2, 3, 4];
}

/**
 * Get week number within a month for a given date (1-based, 7-day chunks).
 * Week 1 = days 1-7, Week 2 = days 8-14, etc.
 */
export function getWeekOfMonth(date: string): number {
  const day = parseInt(date.split('-')[2], 10);
  return Math.ceil(day / 7);
}

/**
 * Get weeks available in a given month.
 * Returns array like [1, 2, 3, 4, 5] depending on days in month.
 */
export function getWeeksInMonth(yearMonth: string): number[] {
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekCount = Math.ceil(daysInMonth / 7);
  return Array.from({ length: weekCount }, (_, i) => i + 1);
}

/**
 * Get days available in a given week of a month.
 * Returns array of date strings (YYYY-MM-DD).
 */
export function getDaysInWeek(yearMonth: string, week: number): string[] {
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const startDay = (week - 1) * 7 + 1;
  const endDay = Math.min(week * 7, daysInMonth);

  const days: string[] = [];
  for (let day = startDay; day <= endDay; day++) {
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    days.push(`${year}-${monthStr}-${dayStr}`);
  }
  return days;
}

/**
 * Check if a transaction date matches a temporal filter.
 * Story 9.20: Added quarter filtering support.
 */
function matchesTemporalFilter(
  txDate: string,
  filter: TemporalFilterState
): boolean {
  if (filter.level === 'all') return true;

  const txYear = txDate.substring(0, 4);
  const txMonth = txDate.substring(0, 7);

  // Year filter
  if (filter.year && txYear !== filter.year) return false;

  // Quarter filter (Story 9.20)
  if (filter.quarter && filter.year) {
    const txQuarter = getQuarterFromMonth(txMonth);
    const filterQuarter = parseInt(filter.quarter.replace('Q', ''), 10);
    if (txQuarter !== filterQuarter) return false;
  }

  // Month filter
  if (filter.month && txMonth !== filter.month) return false;

  // Week filter
  if (filter.week !== undefined && filter.month) {
    const txWeek = getWeekOfMonth(txDate);
    if (txWeek !== filter.week) return false;
  }

  // Day filter
  if (filter.day && txDate !== filter.day) return false;

  return true;
}

// ============================================================================
// Category Filter Helpers
// ============================================================================

/**
 * Check if a transaction matches a category filter.
 */
function matchesCategoryFilter(
  tx: Transaction,
  filter: CategoryFilterState
): boolean {
  if (filter.level === 'all') return true;

  // Store category filter
  if (filter.category && tx.category !== filter.category) {
    return false;
  }

  // Item group filter - transaction must have at least one item in the group
  if (filter.group) {
    const hasMatchingGroup = tx.items?.some(
      item => item.category === filter.group
    );
    if (!hasMatchingGroup) return false;
  }

  // Subcategory filter - transaction must have at least one item in the subcategory
  if (filter.subcategory) {
    const hasMatchingSubcategory = tx.items?.some(
      item => item.subcategory === filter.subcategory
    );
    if (!hasMatchingSubcategory) return false;
  }

  return true;
}

// ============================================================================
// Location Filter Helpers
// ============================================================================

/**
 * Check if a transaction matches a location filter.
 * AC #4: Gracefully handles transactions without location data.
 */
function matchesLocationFilter(
  tx: Transaction,
  filter: LocationFilterState
): boolean {
  // No location filter applied
  if (!filter.country) return true;

  // Transaction has no location data - include it when filtering
  // (user can still see transactions without location)
  if (!tx.country) return false;

  // Country filter
  if (tx.country !== filter.country) return false;

  // City filter (if applied)
  if (filter.city && tx.city !== filter.city) return false;

  return true;
}

// ============================================================================
// Main Filtering Function
// ============================================================================

/**
 * Filter transactions based on the current history filter state.
 * This is the core filtering logic for HistoryView.
 *
 * AC #7: Filters applied client-side with memoization for performance.
 */
export function filterTransactionsByHistoryFilters(
  transactions: Transaction[],
  filters: HistoryFilterState
): Transaction[] {
  return transactions.filter(tx => {
    // Temporal filter (AC #2)
    if (!matchesTemporalFilter(tx.date, filters.temporal)) {
      return false;
    }

    // Category filter (AC #3)
    if (!matchesCategoryFilter(tx, filters.category)) {
      return false;
    }

    // Location filter (AC #4)
    if (!matchesLocationFilter(tx, filters.location)) {
      return false;
    }

    return true;
  });
}

// ============================================================================
// Display Formatting
// ============================================================================

/**
 * Format temporal filter selection for display (breadcrumb style).
 * Story 9.20: Added quarter display support.
 */
export function formatTemporalRange(
  temporal: TemporalFilterState,
  locale: string = 'en'
): string {
  if (temporal.level === 'all') {
    return locale === 'es' ? 'Todo el tiempo' : 'All time';
  }

  const parts: string[] = [];

  if (temporal.year) {
    parts.push(temporal.year);
  }

  // Quarter display (Story 9.20)
  if (temporal.quarter) {
    const quarterNum = parseInt(temporal.quarter.replace('Q', ''), 10);
    const quarterLabel = locale === 'es' ? `T${quarterNum}` : temporal.quarter;
    parts.push(quarterLabel);
  }

  if (temporal.month) {
    const [, monthNum] = temporal.month.split('-');
    const date = new Date(2024, parseInt(monthNum, 10) - 1, 1);
    const monthName = date.toLocaleDateString(
      locale === 'es' ? 'es-ES' : 'en-US',
      { month: 'long' }
    );
    parts.push(monthName);
  }

  if (temporal.week !== undefined) {
    const weekLabel = locale === 'es' ? `Sem ${temporal.week}` : `W${temporal.week}`;
    parts.push(weekLabel);
  }

  if (temporal.day) {
    const dayNum = parseInt(temporal.day.split('-')[2], 10);
    parts.push(dayNum.toString());
  }

  return parts.join(' > ');
}

/**
 * Format category filter selection for display (breadcrumb style).
 */
export function formatCategoryPath(
  category: CategoryFilterState,
  t: (key: string) => string
): string {
  if (category.level === 'all') {
    return t('allCategories');
  }

  const parts: string[] = [];

  if (category.category) {
    parts.push(category.category);
  }

  if (category.group) {
    parts.push(category.group);
  }

  if (category.subcategory) {
    parts.push(category.subcategory);
  }

  return parts.join(' > ');
}

/**
 * Format location filter selection for display.
 */
export function formatLocationPath(
  location: LocationFilterState,
  t: (key: string) => string
): string {
  if (!location.country) {
    return t('allLocations');
  }

  if (location.city) {
    return `${location.country} > ${location.city}`;
  }

  return location.country;
}

/**
 * Get month name from YYYY-MM format.
 */
export function getMonthName(month: string, locale: string = 'en'): string {
  const [, monthNum] = month.split('-');
  const date = new Date(2024, parseInt(monthNum, 10) - 1, 1);
  return date.toLocaleDateString(
    locale === 'es' ? 'es-ES' : 'en-US',
    { month: 'long' }
  );
}

/**
 * Get short month name from YYYY-MM format.
 */
export function getShortMonthName(month: string, locale: string = 'en'): string {
  const [, monthNum] = month.split('-');
  const date = new Date(2024, parseInt(monthNum, 10) - 1, 1);
  return date.toLocaleDateString(
    locale === 'es' ? 'es-ES' : 'en-US',
    { month: 'short' }
  );
}

/**
 * Get day label in format "Dec 15".
 */
export function getDayLabel(day: string, locale: string = 'en'): string {
  const [year, month, dayNum] = day.split('-').map(Number);
  const date = new Date(year, month - 1, dayNum);
  return date.toLocaleDateString(
    locale === 'es' ? 'es-ES' : 'en-US',
    { month: 'short', day: 'numeric' }
  );
}

/**
 * Get week label in format "Dec 1-7".
 */
export function getWeekLabel(month: string, week: number, locale: string = 'en'): string {
  const shortMonth = getShortMonthName(month, locale);
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const startDay = (week - 1) * 7 + 1;
  const endDay = Math.min(week * 7, daysInMonth);

  return `${shortMonth} ${startDay}-${endDay}`;
}

// ============================================================================
// Temporal Period Navigation (Story 14.9)
// ============================================================================

/**
 * Calculate the next temporal period based on current temporal state.
 * Navigates forward in time at the current granularity level.
 *
 * Story 14.9: Swipe Time Navigation
 * @param current - Current temporal filter state
 * @returns Next temporal filter state (or null if can't go further)
 */
export function getNextTemporalPeriod(
  current: TemporalFilterState
): TemporalFilterState | null {
  if (current.level === 'all') return null;

  // Day navigation
  if (current.level === 'day' && current.day && current.month && current.year) {
    const [year, month, day] = current.day.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    // If next day is still in same week
    const nextDay = day + 1;
    if (nextDay <= daysInMonth) {
      const nextDayStr = `${year}-${month.toString().padStart(2, '0')}-${nextDay.toString().padStart(2, '0')}`;
      const nextWeek = Math.ceil(nextDay / 7);
      return {
        level: 'day',
        year: current.year,
        month: current.month,
        week: nextWeek,
        day: nextDayStr,
      };
    }

    // Move to first day of next month
    const nextMonthDate = new Date(year, month, 1);
    const nextYear = nextMonthDate.getFullYear().toString();
    const nextMonth = `${nextYear}-${(nextMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
    return {
      level: 'day',
      year: nextYear,
      month: nextMonth,
      week: 1,
      day: `${nextMonth}-01`,
    };
  }

  // Week navigation
  if (current.level === 'week' && current.month && current.week !== undefined && current.year) {
    const [year, monthNum] = current.month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const totalWeeks = Math.ceil(daysInMonth / 7);

    const nextWeek = current.week + 1;
    if (nextWeek <= totalWeeks) {
      return {
        level: 'week',
        year: current.year,
        month: current.month,
        week: nextWeek,
      };
    }

    // Move to first week of next month
    const nextMonthDate = new Date(year, monthNum, 1);
    const nextYear = nextMonthDate.getFullYear().toString();
    const nextMonth = `${nextYear}-${(nextMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
    return {
      level: 'week',
      year: nextYear,
      month: nextMonth,
      week: 1,
    };
  }

  // Month navigation
  if (current.level === 'month' && current.month && current.year) {
    const [year, monthNum] = current.month.split('-').map(Number);
    const nextMonthDate = new Date(year, monthNum, 1);
    const nextYear = nextMonthDate.getFullYear().toString();
    const nextMonth = `${nextYear}-${(nextMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
    return {
      level: 'month',
      year: nextYear,
      month: nextMonth,
    };
  }

  // Quarter navigation
  if (current.level === 'quarter' && current.quarter && current.year) {
    const currentQ = parseInt(current.quarter.replace('Q', ''), 10);
    if (currentQ < 4) {
      return {
        level: 'quarter',
        year: current.year,
        quarter: `Q${currentQ + 1}`,
      };
    }
    // Move to Q1 of next year
    const nextYear = (parseInt(current.year, 10) + 1).toString();
    return {
      level: 'quarter',
      year: nextYear,
      quarter: 'Q1',
    };
  }

  // Year navigation
  if (current.level === 'year' && current.year) {
    const nextYear = (parseInt(current.year, 10) + 1).toString();
    return {
      level: 'year',
      year: nextYear,
    };
  }

  return null;
}

/**
 * Calculate the previous temporal period based on current temporal state.
 * Navigates backward in time at the current granularity level.
 *
 * Story 14.9: Swipe Time Navigation
 * @param current - Current temporal filter state
 * @returns Previous temporal filter state (or null if can't go further)
 */
export function getPrevTemporalPeriod(
  current: TemporalFilterState
): TemporalFilterState | null {
  if (current.level === 'all') return null;

  // Day navigation
  if (current.level === 'day' && current.day && current.month && current.year) {
    const [year, month, day] = current.day.split('-').map(Number);

    // If prev day is still in same month
    const prevDay = day - 1;
    if (prevDay >= 1) {
      const prevDayStr = `${year}-${month.toString().padStart(2, '0')}-${prevDay.toString().padStart(2, '0')}`;
      const prevWeek = Math.ceil(prevDay / 7);
      return {
        level: 'day',
        year: current.year,
        month: current.month,
        week: prevWeek,
        day: prevDayStr,
      };
    }

    // Move to last day of previous month
    const prevMonthDate = new Date(year, month - 1, 0);
    const prevYear = prevMonthDate.getFullYear().toString();
    const prevMonthNum = prevMonthDate.getMonth() + 1;
    const prevMonth = `${prevYear}-${prevMonthNum.toString().padStart(2, '0')}`;
    const lastDay = prevMonthDate.getDate();
    const lastWeek = Math.ceil(lastDay / 7);
    return {
      level: 'day',
      year: prevYear,
      month: prevMonth,
      week: lastWeek,
      day: `${prevMonth}-${lastDay.toString().padStart(2, '0')}`,
    };
  }

  // Week navigation
  if (current.level === 'week' && current.month && current.week !== undefined && current.year) {
    const prevWeek = current.week - 1;
    if (prevWeek >= 1) {
      return {
        level: 'week',
        year: current.year,
        month: current.month,
        week: prevWeek,
      };
    }

    // Move to last week of previous month
    const [year, monthNum] = current.month.split('-').map(Number);
    const prevMonthDate = new Date(year, monthNum - 1, 0);
    const prevYear = prevMonthDate.getFullYear().toString();
    const prevMonthNum = prevMonthDate.getMonth() + 1;
    const prevMonth = `${prevYear}-${prevMonthNum.toString().padStart(2, '0')}`;
    const daysInPrevMonth = prevMonthDate.getDate();
    const lastWeek = Math.ceil(daysInPrevMonth / 7);
    return {
      level: 'week',
      year: prevYear,
      month: prevMonth,
      week: lastWeek,
    };
  }

  // Month navigation
  if (current.level === 'month' && current.month && current.year) {
    const [year, monthNum] = current.month.split('-').map(Number);
    const prevMonthDate = new Date(year, monthNum - 2, 1);
    const prevYear = prevMonthDate.getFullYear().toString();
    const prevMonth = `${prevYear}-${(prevMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
    return {
      level: 'month',
      year: prevYear,
      month: prevMonth,
    };
  }

  // Quarter navigation
  if (current.level === 'quarter' && current.quarter && current.year) {
    const currentQ = parseInt(current.quarter.replace('Q', ''), 10);
    if (currentQ > 1) {
      return {
        level: 'quarter',
        year: current.year,
        quarter: `Q${currentQ - 1}`,
      };
    }
    // Move to Q4 of previous year
    const prevYear = (parseInt(current.year, 10) - 1).toString();
    return {
      level: 'quarter',
      year: prevYear,
      quarter: 'Q4',
    };
  }

  // Year navigation
  if (current.level === 'year' && current.year) {
    const prevYear = (parseInt(current.year, 10) - 1).toString();
    return {
      level: 'year',
      year: prevYear,
    };
  }

  return null;
}

/**
 * Get display label for the next period (for preview during swipe).
 * Story 14.9: Swipe Time Navigation
 */
export function getNextPeriodLabel(
  current: TemporalFilterState,
  locale: string = 'en'
): string | null {
  const next = getNextTemporalPeriod(current);
  if (!next) return null;
  return formatTemporalRange(next, locale);
}

/**
 * Get display label for the previous period (for preview during swipe).
 * Story 14.9: Swipe Time Navigation
 */
export function getPrevPeriodLabel(
  current: TemporalFilterState,
  locale: string = 'en'
): string | null {
  const prev = getPrevTemporalPeriod(current);
  if (!prev) return null;
  return formatTemporalRange(prev, locale);
}
