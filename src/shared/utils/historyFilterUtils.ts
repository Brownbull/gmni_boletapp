/**
 * History Filter Utilities
 *
 * Filtering logic and helper functions for history transaction filtering.
 * Story 9.19: History Transaction Filters
 *
 * @see docs/sprint-artifacts/epic9/story-9.19-history-transaction-filters.md
 */

import type { Transaction } from '@/types/transaction';
import type {
  HistoryFilterState,
  TemporalFilterState,
  CategoryFilterState,
  LocationFilterState,
} from '@/types/historyFilters';
// Story 14.15b: Category normalization for legacy data compatibility
import { normalizeItemCategory } from '@/utils/categoryNormalizer';
// Story 14.13a: Category group expansion for multi-dimension filtering
// Story 14.13 Session 15: Added getItemCategoryGroup and getStoreCategoryGroup for proper 'other' group filtering
import {
  expandStoreCategoryGroup,
  expandItemCategoryGroup,
  getItemCategoryGroup,
  getStoreCategoryGroup,
  type StoreCategoryGroup,
  type ItemCategoryGroup,
} from '@/config/categoryColors';
import type { StoreCategory } from '@/types/transaction';

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
    // Story 14.15b: Normalize legacy category names
    for (const item of tx.items || []) {
      if (item.category) {
        const normalizedCategory = normalizeItemCategory(item.category);
        if (!groupsByCategory[tx.category]) {
          groupsByCategory[tx.category] = new Set();
        }
        groupsByCategory[tx.category].add(normalizedCategory);

        if (item.subcategory) {
          if (!subcategoriesByGroup[normalizedCategory]) {
            subcategoriesByGroup[normalizedCategory] = new Set();
          }
          subcategoriesByGroup[normalizedCategory].add(item.subcategory);
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

  // Story 14.16: Date range filter takes priority (used by Reports navigation for ISO weeks)
  // This ensures exact date range matching regardless of month boundaries
  if (filter.dateRange) {
    return txDate >= filter.dateRange.start && txDate <= filter.dateRange.end;
  }

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
 * Supports multi-select via comma-separated values in category and group fields.
 * Story 14.13a: Extended to support drillDownPath for multi-dimension filtering.
 */
function matchesCategoryFilter(
  tx: Transaction,
  filter: CategoryFilterState
): boolean {
  // Story 14.13a: When drillDownPath is present, use ONLY drillDownPath filtering
  // This takes priority over legacy single-dimension filters (category, group, subcategory)
  // because drillDownPath contains the full multi-dimension context from TrendsView
  if (filter.drillDownPath) {
    const path = filter.drillDownPath;

    // Filter by store group (expand to all categories in the group)
    // Only if storeCategory is not set (storeCategory is more specific)
    // Story 14.13 Session 15: Special handling for 'other' group to match Dashboard counting
    if (path.storeGroup && !path.storeCategory) {
      const targetGroup = path.storeGroup as StoreCategoryGroup;

      if (targetGroup === 'other') {
        // For 'other' group, include transactions whose category doesn't map to any known group
        // This matches how Dashboard counts transactions in the 'other' group
        const txCategory = tx.category as StoreCategory;
        const storeGroup = getStoreCategoryGroup(txCategory);
        if (storeGroup !== 'other') {
          return false;
        }
      } else {
        // For other groups, use the standard expansion approach
        const groupCategories = expandStoreCategoryGroup(targetGroup);
        const txCategoryLower = tx.category?.toLowerCase();
        if (!groupCategories.some(cat => cat.toLowerCase() === txCategoryLower)) {
          return false;
        }
      }
    }

    // Filter by store category (supports multi-select via comma-separated values)
    if (path.storeCategory) {
      const txCategoryLower = tx.category?.toLowerCase();
      // Check if it's a multi-select (comma-separated)
      if (path.storeCategory.includes(',')) {
        const selectedCategories = path.storeCategory.split(',').map(c => c.trim().toLowerCase());
        if (!selectedCategories.some(cat => cat === txCategoryLower)) {
          return false;
        }
      } else {
        // Single category: exact match
        if (txCategoryLower !== path.storeCategory.toLowerCase()) {
          return false;
        }
      }
    }

    // Filter by item group (expand to all item categories in the group)
    // Only if itemCategory is not set (itemCategory is more specific)
    // Story 14.13 Session 15: Special handling for 'other-item' group to match Dashboard counting
    if (path.itemGroup && !path.itemCategory) {
      const targetGroup = path.itemGroup as ItemCategoryGroup;

      if (targetGroup === 'other-item') {
        // For 'other-item' group, include transactions with items whose category doesn't map to any known group
        // This matches how Dashboard counts items in the 'other-item' group
        const hasMatchingItem = tx.items?.some(item => {
          const normalizedCategory = normalizeItemCategory(item.category || 'Other');
          const itemGroup = getItemCategoryGroup(normalizedCategory);
          return itemGroup === 'other-item';
        });
        if (!hasMatchingItem) return false;
      } else {
        // For other groups, use the standard expansion approach
        const itemCategories = expandItemCategoryGroup(targetGroup);
        const hasMatchingItem = tx.items?.some(item => {
          const normalizedCategory = normalizeItemCategory(item.category || 'Other');
          return itemCategories.some(cat =>
            cat.toLowerCase() === normalizedCategory.toLowerCase()
          );
        });
        if (!hasMatchingItem) return false;
      }
    }

    // Filter by item category (supports multi-select via comma-separated values)
    if (path.itemCategory) {
      // Check if it's a multi-select (comma-separated)
      const isMultiSelect = path.itemCategory.includes(',');
      const selectedCategories = isMultiSelect
        ? path.itemCategory.split(',').map(c => c.trim().toLowerCase())
        : [path.itemCategory.toLowerCase()];

      const hasMatchingItem = tx.items?.some(item => {
        const normalizedCategory = normalizeItemCategory(item.category || 'Other').toLowerCase();
        return selectedCategories.some(cat => cat === normalizedCategory);
      });
      if (!hasMatchingItem) return false;
    }

    // Filter by subcategory
    if (path.subcategory) {
      const hasMatchingSubcategory = tx.items?.some(
        item => item.subcategory?.toLowerCase() === path.subcategory!.toLowerCase()
      );
      if (!hasMatchingSubcategory) return false;
    }

    return true;
  }

  // Legacy single-dimension filtering (when drillDownPath not present)
  // Early return for "all" level with no other filters
  if (filter.level === 'all') return true;

  // Store category filter (supports multi-select via comma-separated values)
  if (filter.category) {
    // Check if it's a multi-select (comma-separated)
    const categories = filter.category.split(',').map(c => c.trim());
    if (categories.length > 1) {
      // Multi-select: transaction must match ANY of the selected categories
      if (!categories.includes(tx.category)) {
        return false;
      }
    } else {
      // Single select: exact match
      if (tx.category !== filter.category) {
        return false;
      }
    }
  }

  // Item group filter - transaction must have at least one item in the group
  // Supports multi-select via comma-separated values
  // Story 14.14b Session 7: Apply 'Other' fallback for items without category to match TrendsView counting
  // Story 14.15b: Normalize legacy category names before comparison
  // Story 14.13: Normalize BOTH sides of comparison - filter values may be in Spanish (e.g., 'Otro')
  //              while item categories normalize to English (e.g., 'Other')
  if (filter.group) {
    const groups = filter.group.split(',').map(g => normalizeItemCategory(g.trim()));
    if (groups.length > 1) {
      // Multi-select: transaction must have at least one item in ANY of the groups
      const hasMatchingGroup = tx.items?.some(
        item => groups.includes(normalizeItemCategory(item.category || 'Other'))
      );
      if (!hasMatchingGroup) return false;
    } else {
      // Single select
      const normalizedFilterGroup = groups[0]; // Already normalized above
      const hasMatchingGroup = tx.items?.some(
        item => normalizeItemCategory(item.category || 'Other') === normalizedFilterGroup
      );
      if (!hasMatchingGroup) return false;
    }
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
 *
 * Story 14.36: Extended to support multi-select cities from multiple countries.
 * When selectedCities is present, it takes priority over legacy city/country fields.
 */
function matchesLocationFilter(
  tx: Transaction,
  filter: LocationFilterState
): boolean {
  // Story 14.36: Multi-select city filter takes priority
  if (filter.selectedCities) {
    // Transaction has no city data - exclude when filtering by city
    if (!tx.city) return false;

    // Parse comma-separated city codes
    const selectedCities = filter.selectedCities.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
    if (selectedCities.length === 0) return true;

    // Transaction's city must be in the selected cities
    return selectedCities.includes(tx.city.toLowerCase());
  }

  // Legacy single-selection filtering
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

// ============================================================================
// Cascading Temporal Filter Updates (Story 14.14)
// ============================================================================

/**
 * Build a complete temporal filter state with cascading defaults.
 * When a higher-level dimension changes, lower-level dimensions cascade to their first valid values.
 *
 * Story 14.14: Synchronized temporal navigation between breadcrumbs and IconFilterBar
 *
 * @param level - The target filter level
 * @param year - Selected year
 * @param quarter - Selected quarter (Q1-Q4) - optional, will be derived from month if not provided
 * @param month - Selected month (YYYY-MM format) - optional, will cascade from quarter
 * @param week - Selected week (1-5) - optional, will cascade from month
 * @param day - Selected day (YYYY-MM-DD format) - optional, will cascade from week
 * @returns Complete TemporalFilterState with all appropriate fields populated
 */
export function buildCascadingTemporalFilter(
  level: 'year' | 'quarter' | 'month' | 'week' | 'day',
  year: string,
  quarter?: string,
  month?: string,
  week?: number,
  day?: string
): TemporalFilterState {
  // Helper: get first month of a quarter
  const getFirstMonthOfQuarter = (y: string, q: string): string => {
    const qNum = parseInt(q.replace('Q', ''), 10);
    const monthNum = (qNum - 1) * 3 + 1;
    return `${y}-${String(monthNum).padStart(2, '0')}`;
  };

  // Helper: get quarter from month
  const getQuarterFromMonthStr = (m: string): string => {
    const monthNum = parseInt(m.split('-')[1], 10);
    return `Q${Math.ceil(monthNum / 3)}`;
  };

  // Helper: get first week (always 1)
  const getFirstWeek = (): number => 1;

  // Helper: get first day of a week in a month
  const getFirstDayOfWeek = (m: string, w: number): string => {
    const [y, mon] = m.split('-');
    const dayNum = (w - 1) * 7 + 1;
    return `${y}-${mon}-${String(dayNum).padStart(2, '0')}`;
  };

  // Build the filter based on level
  if (level === 'year') {
    return { level: 'year', year };
  }

  if (level === 'quarter') {
    const q = quarter || 'Q1';
    return { level: 'quarter', year, quarter: q };
  }

  if (level === 'month') {
    // Derive month from quarter if not provided
    const q = quarter || (month ? getQuarterFromMonthStr(month) : 'Q1');
    const m = month || getFirstMonthOfQuarter(year, q);
    // Ensure month is within the quarter
    const monthQuarter = getQuarterFromMonthStr(m);
    const finalMonth = monthQuarter === q ? m : getFirstMonthOfQuarter(year, q);
    return { level: 'month', year, quarter: q, month: finalMonth };
  }

  if (level === 'week') {
    const q = quarter || (month ? getQuarterFromMonthStr(month) : 'Q1');
    const m = month || getFirstMonthOfQuarter(year, q);
    // Ensure month is within the quarter
    const monthQuarter = getQuarterFromMonthStr(m);
    const finalMonth = monthQuarter === q ? m : getFirstMonthOfQuarter(year, q);
    const w = week !== undefined ? week : getFirstWeek();
    return { level: 'week', year, quarter: q, month: finalMonth, week: w };
  }

  if (level === 'day') {
    const q = quarter || (month ? getQuarterFromMonthStr(month) : 'Q1');
    const m = month || getFirstMonthOfQuarter(year, q);
    // Ensure month is within the quarter
    const monthQuarter = getQuarterFromMonthStr(m);
    const finalMonth = monthQuarter === q ? m : getFirstMonthOfQuarter(year, q);
    const w = week !== undefined ? week : getFirstWeek();
    const d = day || getFirstDayOfWeek(finalMonth, w);
    return { level: 'day', year, quarter: q, month: finalMonth, week: w, day: d };
  }

  // Default fallback
  return { level: 'all' };
}

/**
 * Build temporal filter when changing year.
 * Cascades to Q1 → January → Week 1 → Day 1
 */
export function buildYearFilter(year: string): TemporalFilterState {
  return buildCascadingTemporalFilter('year', year);
}

/**
 * Build temporal filter when changing quarter.
 * Cascades to first month of quarter → Week 1 → Day 1
 */
export function buildQuarterFilter(year: string, quarter: string): TemporalFilterState {
  return buildCascadingTemporalFilter('quarter', year, quarter);
}

/**
 * Build temporal filter when changing month.
 * Updates quarter if needed, cascades to Week 1 → Day 1
 */
export function buildMonthFilter(year: string, month: string): TemporalFilterState {
  const quarter = `Q${Math.ceil(parseInt(month.split('-')[1], 10) / 3)}`;
  return buildCascadingTemporalFilter('month', year, quarter, month);
}

/**
 * Build temporal filter when changing week.
 * Cascades to first day of week
 */
export function buildWeekFilter(year: string, month: string, week: number): TemporalFilterState {
  const quarter = `Q${Math.ceil(parseInt(month.split('-')[1], 10) / 3)}`;
  return buildCascadingTemporalFilter('week', year, quarter, month, week);
}

/**
 * Build temporal filter when changing day.
 * Full specification - no cascading needed
 */
export function buildDayFilter(year: string, month: string, week: number, day: string): TemporalFilterState {
  const quarter = `Q${Math.ceil(parseInt(month.split('-')[1], 10) / 3)}`;
  return buildCascadingTemporalFilter('day', year, quarter, month, week, day);
}
