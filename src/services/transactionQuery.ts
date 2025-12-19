/**
 * Transaction Query Service
 *
 * Unified transaction filtering and aggregation service that consolidates
 * filtering logic from TrendsView, HistoryView, and other components.
 *
 * Story 10.0: Foundation Sprint - Extract transactionQuery.ts service
 * @see docs/sprint-artifacts/epic10/story-10.0-foundation-sprint.md
 *
 * Key design decisions:
 * - Pure functions (no side effects, no Firebase)
 * - Composable filter functions that can be chained
 * - Type-safe interfaces for all query operations
 * - Reusable by Insight Engine, Analytics, and History views
 */

import type { Transaction, StoreCategory, ItemCategory } from '../types/transaction';

// ============================================================================
// Types
// ============================================================================

/**
 * Date range for filtering transactions.
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Amount range for filtering transactions.
 */
export interface AmountRange {
  min?: number;
  max?: number;
}

/**
 * Category aggregate result from aggregation queries.
 */
export interface CategoryAggregate {
  category: string;
  total: number;
  count: number;
  percentage?: number;
}

/**
 * Merchant aggregate result from aggregation queries.
 */
export interface MerchantAggregate {
  merchant: string;
  alias?: string;
  total: number;
  count: number;
  percentage?: number;
}

/**
 * Period aggregate result for temporal grouping.
 */
export interface PeriodAggregate {
  period: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

/**
 * Temporal filter options.
 */
export interface TemporalFilter {
  year?: string;
  quarter?: string; // Q1, Q2, Q3, Q4
  month?: string; // YYYY-MM
  week?: number; // 1-5
  day?: string; // YYYY-MM-DD
}

/**
 * Category filter options.
 */
export interface CategoryFilter {
  storeCategory?: StoreCategory | string;
  itemCategory?: ItemCategory | string;
  subcategory?: string;
}

/**
 * Location filter options.
 */
export interface LocationFilter {
  country?: string;
  city?: string;
}

/**
 * Combined filter options for complex queries.
 */
export interface TransactionFilter {
  temporal?: TemporalFilter;
  category?: CategoryFilter;
  location?: LocationFilter;
  amount?: AmountRange;
  merchant?: string;
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Get quarter (Q1-Q4) from a month string (YYYY-MM).
 */
export function getQuarterFromMonth(month: string): string {
  const monthNum = parseInt(month.split('-')[1], 10);
  const quarter = Math.ceil(monthNum / 3);
  return `Q${quarter}`;
}

/**
 * Get week of month (1-5) from a date string (YYYY-MM-DD).
 * Week 1 = days 1-7, Week 2 = days 8-14, etc.
 */
export function getWeekOfMonth(date: string): number {
  const day = parseInt(date.split('-')[2], 10);
  return Math.ceil(day / 7);
}

/**
 * Get the start date of the current week (Monday).
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the start date of the current month.
 */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// ============================================================================
// Basic Filter Functions
// ============================================================================

/**
 * Filter transactions by date range (inclusive).
 * AC #1: filterByDateRange(transactions, startDate, endDate)
 */
export function filterByDateRange(
  transactions: Transaction[],
  start: Date,
  end: Date
): Transaction[] {
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  return transactions.filter(tx => {
    return tx.date >= startStr && tx.date <= endStr;
  });
}

/**
 * Filter transactions by store category.
 * AC #1: filterByCategory(transactions, category)
 */
export function filterByCategory(
  transactions: Transaction[],
  category: StoreCategory | string
): Transaction[] {
  return transactions.filter(tx => tx.category === category);
}

/**
 * Filter transactions by merchant name (exact or partial match).
 * AC #1: filterByMerchant(transactions, merchant)
 */
export function filterByMerchant(
  transactions: Transaction[],
  merchant: string,
  exactMatch: boolean = false
): Transaction[] {
  const searchTerm = merchant.toLowerCase();
  return transactions.filter(tx => {
    const txMerchant = (tx.merchant || '').toLowerCase();
    const txAlias = (tx.alias || '').toLowerCase();
    if (exactMatch) {
      return txMerchant === searchTerm || txAlias === searchTerm;
    }
    return txMerchant.includes(searchTerm) || txAlias.includes(searchTerm);
  });
}

/**
 * Filter transactions by amount range.
 * AC #1: filterByAmount(transactions, min, max)
 */
export function filterByAmount(
  transactions: Transaction[],
  min?: number,
  max?: number
): Transaction[] {
  return transactions.filter(tx => {
    if (min !== undefined && tx.total < min) return false;
    if (max !== undefined && tx.total > max) return false;
    return true;
  });
}

/**
 * Filter transactions by location (country and/or city).
 */
export function filterByLocation(
  transactions: Transaction[],
  country?: string,
  city?: string
): Transaction[] {
  return transactions.filter(tx => {
    if (country && tx.country !== country) return false;
    if (city && tx.city !== city) return false;
    return true;
  });
}

/**
 * Filter transactions by item category (any item in transaction matches).
 */
export function filterByItemCategory(
  transactions: Transaction[],
  itemCategory: ItemCategory | string
): Transaction[] {
  return transactions.filter(tx =>
    tx.items.some(item => item.category === itemCategory)
  );
}

/**
 * Filter transactions by item subcategory (any item in transaction matches).
 */
export function filterBySubcategory(
  transactions: Transaction[],
  subcategory: string
): Transaction[] {
  return transactions.filter(tx =>
    tx.items.some(item => item.subcategory === subcategory)
  );
}

// ============================================================================
// Temporal Filter Functions
// ============================================================================

/**
 * Filter transactions by temporal criteria (year, quarter, month, week, day).
 */
export function filterByTemporal(
  transactions: Transaction[],
  temporal: TemporalFilter
): Transaction[] {
  return transactions.filter(tx => {
    const txYear = tx.date.substring(0, 4);
    const txMonth = tx.date.substring(0, 7);

    // Year filter
    if (temporal.year && txYear !== temporal.year) return false;

    // Quarter filter
    if (temporal.quarter) {
      const txQuarter = getQuarterFromMonth(txMonth);
      if (txQuarter !== temporal.quarter) return false;
    }

    // Month filter
    if (temporal.month && txMonth !== temporal.month) return false;

    // Week filter
    if (temporal.week !== undefined) {
      const txWeek = getWeekOfMonth(tx.date);
      if (txWeek !== temporal.week) return false;
    }

    // Day filter
    if (temporal.day && tx.date !== temporal.day) return false;

    return true;
  });
}

/**
 * Get transactions from this week (Monday to Sunday).
 * AC #1: getThisWeek(transactions)
 */
export function getThisWeek(transactions: Transaction[]): Transaction[] {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return filterByDateRange(transactions, weekStart, weekEnd);
}

/**
 * Get transactions from this month.
 * AC #1: getThisMonth(transactions)
 */
export function getThisMonth(transactions: Transaction[]): Transaction[] {
  const now = new Date();
  const monthStart = getMonthStart(now);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return filterByDateRange(transactions, monthStart, monthEnd);
}

/**
 * Get transactions from the last N days (including today).
 * AC #1: getLastNDays(transactions, n)
 */
export function getLastNDays(transactions: Transaction[], n: number): Transaction[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - n + 1);
  start.setHours(0, 0, 0, 0);

  return filterByDateRange(transactions, start, now);
}

/**
 * Get transactions from today.
 */
export function getToday(transactions: Transaction[]): Transaction[] {
  const today = new Date().toISOString().split('T')[0];
  return transactions.filter(tx => tx.date === today);
}

/**
 * Get transactions from yesterday.
 */
export function getYesterday(transactions: Transaction[]): Transaction[] {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  return transactions.filter(tx => tx.date === yesterdayStr);
}

// ============================================================================
// Aggregation Functions
// ============================================================================

/**
 * Aggregate transactions by store category.
 * AC #1: aggregateByCategory(transactions)
 */
export function aggregateByCategory(transactions: Transaction[]): CategoryAggregate[] {
  const aggregates: Record<string, CategoryAggregate> = {};
  let grandTotal = 0;

  transactions.forEach(tx => {
    const category = tx.category || 'Other';
    if (!aggregates[category]) {
      aggregates[category] = { category, total: 0, count: 0 };
    }
    aggregates[category].total += tx.total;
    aggregates[category].count += 1;
    grandTotal += tx.total;
  });

  // Calculate percentages and sort by total (descending)
  return Object.values(aggregates)
    .map(agg => ({
      ...agg,
      percentage: grandTotal > 0 ? (agg.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Aggregate transactions by item category.
 */
export function aggregateByItemCategory(transactions: Transaction[]): CategoryAggregate[] {
  const aggregates: Record<string, CategoryAggregate> = {};
  let grandTotal = 0;

  transactions.forEach(tx => {
    tx.items.forEach(item => {
      const category = item.category || 'Other';
      if (!aggregates[category]) {
        aggregates[category] = { category, total: 0, count: 0 };
      }
      aggregates[category].total += item.price;
      aggregates[category].count += 1;
      grandTotal += item.price;
    });
  });

  return Object.values(aggregates)
    .map(agg => ({
      ...agg,
      percentage: grandTotal > 0 ? (agg.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Aggregate transactions by merchant.
 * AC #1: aggregateByMerchant(transactions)
 */
export function aggregateByMerchant(transactions: Transaction[]): MerchantAggregate[] {
  const aggregates: Record<string, MerchantAggregate> = {};
  let grandTotal = 0;

  transactions.forEach(tx => {
    const merchant = tx.merchant || 'Unknown';
    if (!aggregates[merchant]) {
      aggregates[merchant] = { merchant, alias: tx.alias, total: 0, count: 0 };
    }
    aggregates[merchant].total += tx.total;
    aggregates[merchant].count += 1;
    grandTotal += tx.total;
  });

  return Object.values(aggregates)
    .map(agg => ({
      ...agg,
      percentage: grandTotal > 0 ? (agg.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Group transactions by time period (day, week, month, quarter, year).
 */
export function groupByPeriod(
  transactions: Transaction[],
  period: 'day' | 'week' | 'month' | 'quarter' | 'year'
): PeriodAggregate[] {
  const groups: Record<string, PeriodAggregate> = {};

  transactions.forEach(tx => {
    let key: string;

    switch (period) {
      case 'day':
        key = tx.date;
        break;
      case 'week':
        // Group by ISO week (YYYY-Www)
        const d = new Date(tx.date + 'T12:00:00');
        const weekStart = getWeekStart(d);
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = tx.date.substring(0, 7);
        break;
      case 'quarter':
        key = `${tx.date.substring(0, 4)}-${getQuarterFromMonth(tx.date.substring(0, 7))}`;
        break;
      case 'year':
        key = tx.date.substring(0, 4);
        break;
    }

    if (!groups[key]) {
      groups[key] = { period: key, total: 0, count: 0, transactions: [] };
    }
    groups[key].total += tx.total;
    groups[key].count += 1;
    groups[key].transactions.push(tx);
  });

  return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
}

// ============================================================================
// Combined Query Functions
// ============================================================================

/**
 * Apply multiple filters to transactions.
 * This is the main entry point for complex queries.
 */
export function queryTransactions(
  transactions: Transaction[],
  filter: TransactionFilter
): Transaction[] {
  let result = transactions;

  // Apply temporal filter
  if (filter.temporal) {
    result = filterByTemporal(result, filter.temporal);
  }

  // Apply category filters
  if (filter.category) {
    if (filter.category.storeCategory) {
      result = filterByCategory(result, filter.category.storeCategory);
    }
    if (filter.category.itemCategory) {
      result = filterByItemCategory(result, filter.category.itemCategory);
    }
    if (filter.category.subcategory) {
      result = filterBySubcategory(result, filter.category.subcategory);
    }
  }

  // Apply location filter
  if (filter.location) {
    result = filterByLocation(result, filter.location.country, filter.location.city);
  }

  // Apply amount filter
  if (filter.amount) {
    result = filterByAmount(result, filter.amount.min, filter.amount.max);
  }

  // Apply merchant filter
  if (filter.merchant) {
    result = filterByMerchant(result, filter.merchant);
  }

  return result;
}

// ============================================================================
// Statistics Functions (for Insight Engine)
// ============================================================================

/**
 * Calculate basic statistics for a set of transactions.
 */
export interface TransactionStats {
  count: number;
  total: number;
  average: number;
  min: number;
  max: number;
  median: number;
}

/**
 * Get statistics for a set of transactions.
 */
export function getTransactionStats(transactions: Transaction[]): TransactionStats {
  if (transactions.length === 0) {
    return { count: 0, total: 0, average: 0, min: 0, max: 0, median: 0 };
  }

  const totals = transactions.map(tx => tx.total).sort((a, b) => a - b);
  const sum = totals.reduce((acc, val) => acc + val, 0);
  const mid = Math.floor(totals.length / 2);

  return {
    count: transactions.length,
    total: sum,
    average: sum / transactions.length,
    min: totals[0],
    max: totals[totals.length - 1],
    median: totals.length % 2 !== 0 ? totals[mid] : (totals[mid - 1] + totals[mid]) / 2,
  };
}

/**
 * Get unique years present in transactions (sorted descending).
 */
export function getAvailableYears(transactions: Transaction[]): string[] {
  const years = new Set(transactions.map(tx => tx.date.substring(0, 4)));
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

/**
 * Get unique months present in transactions for a given year.
 */
export function getAvailableMonths(transactions: Transaction[], year: string): string[] {
  const months = new Set(
    transactions
      .filter(tx => tx.date.startsWith(year))
      .map(tx => tx.date.substring(0, 7))
  );
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

/**
 * Get unique store categories present in transactions.
 */
export function getAvailableCategories(transactions: Transaction[]): string[] {
  const categories = new Set(transactions.map(tx => tx.category).filter(Boolean));
  return Array.from(categories).sort();
}

/**
 * Get unique merchants present in transactions.
 */
export function getAvailableMerchants(transactions: Transaction[]): string[] {
  const merchants = new Set(transactions.map(tx => tx.merchant).filter(Boolean));
  return Array.from(merchants).sort();
}
