/**
 * Report Generation Utilities
 *
 * Story 14.16: Weekly Report Story Format
 * Epic 14: Core Implementation
 *
 * Provides functions for generating weekly summary data and report cards
 * from transaction data. Implements AC #3 (weekly summary card),
 * AC #4 (category breakdown cards), and AC #6 (Rosa-friendly format).
 */

import type { Transaction, StoreCategory } from '../types/transaction';
import type {
  ReportCard,
  WeeklySummary,
  CategoryBreakdown,
  TrendDirection,
} from '../types/report';
import {
  formatCurrency,
  formatDateRange as _formatDateRange,
  calculateTrend,
  getTrendDescription,
} from '../types/report';
import { getCategoryEmoji } from './categoryEmoji';
import { getWeeksInMonth as _getWeeksInMonth } from './date';

// Suppress unused import warnings - these may be used in future
void _formatDateRange;
void _getWeeksInMonth;

// ============================================================================
// Constants
// ============================================================================

/** Minimum transactions required to generate weekly report */
const MIN_TRANSACTIONS_FOR_REPORT = 1;

/** Maximum number of category cards to show in carousel */
const MAX_CATEGORY_CARDS = 5;

/** Threshold below which spending change is considered neutral (%) */
const NEUTRAL_THRESHOLD = 2;

// ============================================================================
// Week Date Utilities
// ============================================================================

/**
 * Get the start of week (Monday) for a given date
 * Uses ISO week where Monday is the first day
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get ISO week number for a date
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if a date is within a week range
 */
export function isDateInWeek(dateStr: string, weekStart: Date, weekEnd: Date): boolean {
  const date = parseDate(dateStr);
  return date >= weekStart && date <= weekEnd;
}

/**
 * Get the week range for a specific week offset from current week
 * @param weeksAgo - Number of weeks ago (0 = current week, 1 = last week, etc.)
 */
export function getWeekRange(weeksAgo: number = 0): { start: Date; end: Date } {
  const now = new Date();
  const start = getWeekStart(now);
  start.setDate(start.getDate() - weeksAgo * 7);
  const end = getWeekEnd(start);
  return { start, end };
}

// ============================================================================
// Transaction Filtering
// ============================================================================

/**
 * Filter transactions to a specific week
 */
export function filterTransactionsByWeek(
  transactions: Transaction[],
  weekStart: Date,
  weekEnd: Date
): Transaction[] {
  return transactions.filter((t) => isDateInWeek(t.date, weekStart, weekEnd));
}

/**
 * Calculate total spending from transactions
 */
export function calculateTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.total, 0);
}

// ============================================================================
// Category Breakdown Generation
// ============================================================================

/**
 * Group transactions by category and calculate breakdown
 */
export function getCategoryBreakdown(
  transactions: Transaction[],
  previousTransactions?: Transaction[]
): CategoryBreakdown[] {
  const totalSpent = calculateTotal(transactions);

  // Group by category
  const categoryMap = new Map<
    StoreCategory,
    { amount: number; transactionCount: number }
  >();

  for (const t of transactions) {
    const existing = categoryMap.get(t.category) || { amount: 0, transactionCount: 0 };
    categoryMap.set(t.category, {
      amount: existing.amount + t.total,
      transactionCount: existing.transactionCount + 1,
    });
  }

  // Calculate previous period category totals for trend comparison
  const previousCategoryTotals = new Map<StoreCategory, number>();
  if (previousTransactions && previousTransactions.length > 0) {
    for (const t of previousTransactions) {
      const existing = previousCategoryTotals.get(t.category) || 0;
      previousCategoryTotals.set(t.category, existing + t.total);
    }
  }

  // Convert to array with percentages and trends
  const breakdowns: CategoryBreakdown[] = [];

  for (const [category, data] of categoryMap.entries()) {
    const percent = totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0;
    const previousAmount = previousCategoryTotals.get(category) || 0;

    let trend: TrendDirection | undefined;
    let trendPercent: number | undefined;

    if (previousAmount > 0) {
      const trendResult = calculateTrend(data.amount, previousAmount, NEUTRAL_THRESHOLD);
      trend = trendResult.direction;
      trendPercent = Math.abs(trendResult.percent);
    }

    breakdowns.push({
      category,
      icon: getCategoryEmoji(category),
      amount: data.amount,
      percent,
      transactionCount: data.transactionCount,
      trend,
      trendPercent,
    });
  }

  // Sort by amount descending
  breakdowns.sort((a, b) => b.amount - a.amount);

  return breakdowns;
}

// ============================================================================
// Weekly Summary Generation (AC #3)
// ============================================================================

/**
 * Generate weekly summary from transactions
 *
 * @param transactions - All user transactions
 * @param weeksAgo - Number of weeks ago (0 = current week)
 * @returns WeeklySummary object or null if insufficient data
 */
export function generateWeeklySummary(
  transactions: Transaction[],
  weeksAgo: number = 0
): WeeklySummary | null {
  const currentWeek = getWeekRange(weeksAgo);
  const previousWeek = getWeekRange(weeksAgo + 1);

  const currentTransactions = filterTransactionsByWeek(
    transactions,
    currentWeek.start,
    currentWeek.end
  );

  // Check if enough data for report
  if (currentTransactions.length < MIN_TRANSACTIONS_FOR_REPORT) {
    return null;
  }

  const previousTransactions = filterTransactionsByWeek(
    transactions,
    previousWeek.start,
    previousWeek.end
  );

  const totalSpent = calculateTotal(currentTransactions);
  const previousWeekSpent = calculateTotal(previousTransactions);

  // Calculate trend
  const { direction: trendDirection, percent: trendPercent } = calculateTrend(
    totalSpent,
    previousWeekSpent,
    NEUTRAL_THRESHOLD
  );

  // Get category breakdown with trend comparison
  const categoryBreakdown = getCategoryBreakdown(currentTransactions, previousTransactions);

  // Get top 3 categories
  const topCategories = categoryBreakdown.slice(0, 3);

  // Check if this is the user's first week
  const isFirstWeek = previousTransactions.length === 0;

  return {
    totalSpent,
    previousWeekSpent,
    trendPercent,
    trendDirection,
    topCategories,
    dateRange: {
      start: currentWeek.start,
      end: currentWeek.end,
    },
    weekNumber: getISOWeekNumber(currentWeek.start),
    isFirstWeek,
    transactionCount: currentTransactions.length,
  };
}

// ============================================================================
// Report Card Generation (AC #3, #4)
// ============================================================================

/**
 * Generate report cards from weekly summary
 *
 * Creates Instagram-style swipeable cards:
 * 1. Summary card (total spent with trend)
 * 2. Category breakdown cards (one per top category)
 *
 * @param summary - Weekly summary data
 * @returns Array of ReportCard objects for carousel
 */
export function generateReportCards(summary: WeeklySummary): ReportCard[] {
  const cards: ReportCard[] = [];

  // Summary card (AC #3)
  const summaryCard: ReportCard = {
    id: 'summary',
    type: 'summary',
    title: 'Esta Semana',
    primaryValue: formatCurrency(summary.totalSpent),
    secondaryValue: summary.isFirstWeek
      ? 'Tu primera semana'
      : `vs ${formatCurrency(summary.previousWeekSpent)} la semana pasada`,
    trend: summary.isFirstWeek ? undefined : summary.trendDirection,
    trendPercent: summary.isFirstWeek ? undefined : Math.abs(summary.trendPercent),
    description: summary.isFirstWeek
      ? undefined
      : getTrendDescription(summary.trendDirection, summary.trendPercent),
  };
  cards.push(summaryCard);

  // Category breakdown cards (AC #4)
  const categoryCards = summary.topCategories
    .slice(0, MAX_CATEGORY_CARDS)
    .map((cat, index): ReportCard => {
      const id = `category-${index}`;
      return {
        id,
        type: 'category',
        title: formatCategoryName(cat.category),
        primaryValue: formatCurrency(cat.amount),
        secondaryValue: `${cat.percent}% del total · ${cat.transactionCount} ${
          cat.transactionCount === 1 ? 'compra' : 'compras'
        }`,
        category: cat.category,
        categoryIcon: cat.icon,
        trend: cat.trend,
        trendPercent: cat.trendPercent,
        description:
          cat.trend && cat.trendPercent
            ? getTrendDescription(cat.trend, cat.trendPercent)
            : undefined,
      };
    });

  cards.push(...categoryCards);

  return cards;
}

/**
 * Generate empty state report card for users with no data
 */
export function generateEmptyStateCard(): ReportCard {
  return {
    id: 'empty',
    type: 'summary',
    title: 'Esta Semana',
    primaryValue: '$0',
    secondaryValue: 'Sin transacciones todavía',
    description: 'Escanea una boleta para comenzar',
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format category name in Rosa-friendly Spanish
 */
export function formatCategoryName(category: StoreCategory): string {
  const categoryNames: Record<StoreCategory, string> = {
    // Food & Dining
    Supermarket: 'Supermercado',
    Restaurant: 'Restaurantes',
    Bakery: 'Panadería',
    Butcher: 'Carnicería',
    StreetVendor: 'Comida Callejera',
    // Health & Wellness
    Pharmacy: 'Farmacia',
    Medical: 'Salud',
    Veterinary: 'Veterinaria',
    HealthBeauty: 'Belleza',
    // Retail - General
    Bazaar: 'Bazar',
    Clothing: 'Ropa',
    Electronics: 'Electrónica',
    HomeGoods: 'Hogar',
    Furniture: 'Muebles',
    Hardware: 'Ferretería',
    GardenCenter: 'Jardín',
    // Retail - Specialty
    PetShop: 'Mascotas',
    BooksMedia: 'Libros',
    OfficeSupplies: 'Oficina',
    SportsOutdoors: 'Deportes',
    ToysGames: 'Juguetes',
    Jewelry: 'Joyería',
    Optical: 'Óptica',
    // Automotive & Transport
    Automotive: 'Auto',
    GasStation: 'Bencina',
    Transport: 'Transporte',
    // Services & Finance
    Services: 'Servicios',
    BankingFinance: 'Banco',
    Education: 'Educación',
    TravelAgency: 'Viajes',
    // Hospitality & Entertainment
    HotelLodging: 'Hotel',
    Entertainment: 'Entretenimiento',
    // Other
    CharityDonation: 'Donación',
    Other: 'Otros',
  };

  return categoryNames[category] || 'Otros';
}

// ============================================================================
// Month Date Utilities
// ============================================================================

/**
 * Get the start of month for a given date
 */
export function getMonthStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of month for a given date
 */
export function getMonthEnd(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0); // Last day of previous month
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get the month range for a specific month offset from current month
 * @param monthsAgo - Number of months ago (0 = current month)
 */
export function getMonthRange(monthsAgo: number = 0): { start: Date; end: Date } {
  const now = new Date();
  const start = getMonthStart(now);
  start.setMonth(start.getMonth() - monthsAgo);
  const end = getMonthEnd(start);
  return { start, end };
}

/**
 * Check if a date is within a month range
 */
export function isDateInMonth(dateStr: string, monthStart: Date, monthEnd: Date): boolean {
  const date = parseDate(dateStr);
  return date >= monthStart && date <= monthEnd;
}

/**
 * Filter transactions to a specific month
 */
export function filterTransactionsByMonth(
  transactions: Transaction[],
  monthStart: Date,
  monthEnd: Date
): Transaction[] {
  return transactions.filter((t) => isDateInMonth(t.date, monthStart, monthEnd));
}

// ============================================================================
// Quarter Date Utilities
// ============================================================================

/**
 * Get the start of quarter for a given date
 */
export function getQuarterStart(date: Date): Date {
  const d = new Date(date);
  const quarter = Math.floor(d.getMonth() / 3);
  d.setMonth(quarter * 3);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of quarter for a given date
 */
export function getQuarterEnd(date: Date): Date {
  const d = new Date(date);
  const quarter = Math.floor(d.getMonth() / 3);
  d.setMonth((quarter + 1) * 3);
  d.setDate(0); // Last day of previous month (end of quarter)
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get quarter number (1-4) for a date
 */
export function getQuarterNumber(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

/**
 * Get the quarter range for a specific quarter offset from current quarter
 * @param quartersAgo - Number of quarters ago (0 = current quarter)
 */
export function getQuarterRange(quartersAgo: number = 0): { start: Date; end: Date } {
  const now = new Date();
  const currentQuarterStart = getQuarterStart(now);
  const start = new Date(currentQuarterStart);
  start.setMonth(start.getMonth() - quartersAgo * 3);
  const end = getQuarterEnd(start);
  return { start, end };
}

/**
 * Check if a date is within a quarter range
 */
export function isDateInQuarter(dateStr: string, quarterStart: Date, quarterEnd: Date): boolean {
  const date = parseDate(dateStr);
  return date >= quarterStart && date <= quarterEnd;
}

/**
 * Filter transactions to a specific quarter
 */
export function filterTransactionsByQuarter(
  transactions: Transaction[],
  quarterStart: Date,
  quarterEnd: Date
): Transaction[] {
  return transactions.filter((t) => isDateInQuarter(t.date, quarterStart, quarterEnd));
}

// ============================================================================
// Year Date Utilities
// ============================================================================

/**
 * Get the start of year for a given date
 */
export function getYearStart(date: Date): Date {
  const d = new Date(date);
  d.setMonth(0);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of year for a given date
 */
export function getYearEnd(date: Date): Date {
  const d = new Date(date);
  d.setMonth(11);
  d.setDate(31);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get the year range for a specific year offset from current year
 * @param yearsAgo - Number of years ago (0 = current year)
 */
export function getYearRange(yearsAgo: number = 0): { start: Date; end: Date } {
  const now = new Date();
  const start = getYearStart(now);
  start.setFullYear(start.getFullYear() - yearsAgo);
  const end = getYearEnd(start);
  return { start, end };
}

/**
 * Check if a date is within a year range
 */
export function isDateInYear(dateStr: string, yearStart: Date, yearEnd: Date): boolean {
  const date = parseDate(dateStr);
  return date >= yearStart && date <= yearEnd;
}

/**
 * Filter transactions to a specific year
 */
export function filterTransactionsByYear(
  transactions: Transaction[],
  yearStart: Date,
  yearEnd: Date
): Transaction[] {
  return transactions.filter((t) => isDateInYear(t.date, yearStart, yearEnd));
}

// ============================================================================
// Report Row Data Types
// ============================================================================

import type { ReportPeriodType } from '../types/report';

export interface ReportRowData {
  id: string;
  title: string;
  fullTitle: string;
  amount: number;
  trend?: TrendDirection;
  trendPercent?: number;
  comparisonLabel?: string;
  periodType: ReportPeriodType;
  isUnread: boolean;
  isFirst: boolean;
  firstLabel?: string;
  personaHook?: string;
  categories: CategoryBreakdown[];
  personaInsight?: string;
  highlights?: Array<{ label: string; value: string }>;
  /** Total number of transactions in this period */
  transactionCount: number;
  /** Date range for the period (used for filtering navigation) */
  dateRange: { start: Date; end: Date };
}

// ============================================================================
// Period Summary Generation
// ============================================================================

/**
 * Generate monthly summary from transactions
 */
export function generateMonthlySummary(
  transactions: Transaction[],
  monthsAgo: number = 0
): ReportRowData | null {
  const currentMonth = getMonthRange(monthsAgo);
  const previousMonth = getMonthRange(monthsAgo + 1);

  const currentTransactions = filterTransactionsByMonth(
    transactions,
    currentMonth.start,
    currentMonth.end
  );

  if (currentTransactions.length < MIN_TRANSACTIONS_FOR_REPORT) {
    return null;
  }

  const previousTransactions = filterTransactionsByMonth(
    transactions,
    previousMonth.start,
    previousMonth.end
  );

  const totalSpent = calculateTotal(currentTransactions);
  const previousSpent = calculateTotal(previousTransactions);
  const { direction: trend, percent: trendPercent } = calculateTrend(
    totalSpent,
    previousSpent,
    NEUTRAL_THRESHOLD
  );

  const isFirst = previousTransactions.length === 0;
  const categories = getCategoryBreakdown(currentTransactions, previousTransactions);

  const monthName = currentMonth.start.toLocaleDateString('es-CL', { month: 'long' });
  const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const year = currentMonth.start.getFullYear();
  const quarter = getQuarterNumber(currentMonth.start);
  const prevMonthName = previousMonth.start.toLocaleDateString('es-CL', { month: 'short' });
  const prevMonthCapitalized = prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1);

  // Generate persona insight based on data
  let personaInsight: string | undefined;
  if (categories.length > 0) {
    const topCategory = categories[0];
    if (topCategory.trend === 'up' && topCategory.trendPercent && topCategory.trendPercent > 15) {
      personaInsight = `${formatCategoryName(topCategory.category)} subió ${topCategory.trendPercent}% este mes.`;
    } else if (isFirst) {
      personaInsight = 'Tu primer mes completo con Gastify.';
    }
  }

  return {
    id: `monthly-${monthsAgo}`,
    title: monthNameCapitalized,
    fullTitle: `${monthNameCapitalized} · Q${quarter} ${year}`,
    amount: totalSpent,
    trend: isFirst ? undefined : trend,
    trendPercent: isFirst ? undefined : Math.abs(trendPercent),
    comparisonLabel: `vs ${prevMonthCapitalized}`,
    periodType: 'monthly',
    isUnread: monthsAgo === 0, // Current month is unread
    isFirst,
    firstLabel: 'Tu primer mes',
    categories,
    personaInsight,
    transactionCount: currentTransactions.length,
    dateRange: { start: currentMonth.start, end: currentMonth.end },
  };
}

/**
 * Generate quarterly summary from transactions
 */
export function generateQuarterlySummary(
  transactions: Transaction[],
  quartersAgo: number = 0
): ReportRowData | null {
  const currentQuarter = getQuarterRange(quartersAgo);
  const previousQuarter = getQuarterRange(quartersAgo + 1);

  const currentTransactions = filterTransactionsByQuarter(
    transactions,
    currentQuarter.start,
    currentQuarter.end
  );

  if (currentTransactions.length < MIN_TRANSACTIONS_FOR_REPORT) {
    return null;
  }

  const previousTransactions = filterTransactionsByQuarter(
    transactions,
    previousQuarter.start,
    previousQuarter.end
  );

  const totalSpent = calculateTotal(currentTransactions);
  const previousSpent = calculateTotal(previousTransactions);
  const { direction: trend, percent: trendPercent } = calculateTrend(
    totalSpent,
    previousSpent,
    NEUTRAL_THRESHOLD
  );

  const isFirst = previousTransactions.length === 0;
  const categories = getCategoryBreakdown(currentTransactions, previousTransactions);

  const quarterNum = getQuarterNumber(currentQuarter.start);
  const year = currentQuarter.start.getFullYear();
  const prevQuarterNum = getQuarterNumber(previousQuarter.start);

  // Generate highlights for quarterly reports
  const highlights: Array<{ label: string; value: string }> = [];
  if (categories.length > 0) {
    const topCategory = categories[0];
    highlights.push({
      label: 'Categoría líder',
      value: `${formatCategoryName(topCategory.category)} · ${topCategory.percent}%`,
    });
  }

  // Generate persona hook
  const personaHook = 'Descubre qué categoría dominó tu trimestre';
  let personaInsight: string | undefined;
  if (categories.length > 0) {
    const topCategory = categories[0];
    personaInsight = `Este trimestre, ${formatCategoryName(topCategory.category)} fue tu categoría estrella con ${topCategory.percent}% del gasto total.`;
  }

  return {
    id: `quarterly-${quartersAgo}`,
    title: `Q${quarterNum} ${year}`,
    fullTitle: `Q${quarterNum} · ${year}`,
    amount: totalSpent,
    trend: isFirst ? undefined : trend,
    trendPercent: isFirst ? undefined : Math.abs(trendPercent),
    comparisonLabel: `vs Q${prevQuarterNum}`,
    periodType: 'quarterly',
    isUnread: quartersAgo === 0,
    isFirst,
    firstLabel: 'Tu primer trimestre',
    personaHook,
    categories,
    personaInsight,
    highlights,
    transactionCount: currentTransactions.length,
    dateRange: { start: currentQuarter.start, end: currentQuarter.end },
  };
}

/**
 * Generate yearly summary from transactions
 */
export function generateYearlySummary(
  transactions: Transaction[],
  yearsAgo: number = 0
): ReportRowData | null {
  const currentYear = getYearRange(yearsAgo);
  const previousYear = getYearRange(yearsAgo + 1);

  const currentTransactions = filterTransactionsByYear(
    transactions,
    currentYear.start,
    currentYear.end
  );

  if (currentTransactions.length < MIN_TRANSACTIONS_FOR_REPORT) {
    return null;
  }

  const previousTransactions = filterTransactionsByYear(
    transactions,
    previousYear.start,
    previousYear.end
  );

  const totalSpent = calculateTotal(currentTransactions);
  const previousSpent = calculateTotal(previousTransactions);
  const { direction: trend, percent: trendPercent } = calculateTrend(
    totalSpent,
    previousSpent,
    NEUTRAL_THRESHOLD
  );

  const isFirst = previousTransactions.length === 0;
  const categories = getCategoryBreakdown(currentTransactions, previousTransactions);

  const year = currentYear.start.getFullYear();
  const prevYear = previousYear.start.getFullYear();

  // Generate highlights for yearly reports
  const highlights: Array<{ label: string; value: string }> = [];
  if (categories.length > 0) {
    highlights.push({
      label: 'Categoría #1',
      value: `${formatCategoryName(categories[0].category)} · ${categories[0].percent}%`,
    });
  }

  // Generate persona hook
  const personaHook = 'Un año de decisiones financieras inteligentes';
  const personaInsight = isFirst
    ? 'Tu primer año completo de decisiones inteligentes.'
    : `Un año completo de seguimiento financiero. Tu mayor inversión fue en ${categories.length > 0 ? formatCategoryName(categories[0].category).toLowerCase() : 'gastos generales'}.`;

  return {
    id: `yearly-${yearsAgo}`,
    title: `${year}`,
    fullTitle: `${year}`,
    amount: totalSpent,
    trend: isFirst ? undefined : trend,
    trendPercent: isFirst ? undefined : Math.abs(trendPercent),
    comparisonLabel: `vs ${prevYear}`,
    periodType: 'yearly',
    isUnread: yearsAgo === 0,
    isFirst,
    firstLabel: 'Tu primer año completo',
    personaHook,
    categories,
    personaInsight,
    highlights,
    transactionCount: currentTransactions.length,
    dateRange: { start: currentYear.start, end: currentYear.end },
  };
}

/**
 * Generate weekly report row data
 */
export function generateWeeklyReportRow(
  transactions: Transaction[],
  weeksAgo: number = 0
): ReportRowData | null {
  const summary = generateWeeklySummary(transactions, weeksAgo);
  if (!summary) return null;

  const prevWeekNum = summary.weekNumber - 1 > 0 ? summary.weekNumber - 1 : 52;

  return {
    id: `weekly-${weeksAgo}`,
    title: `Semana ${summary.weekNumber}`,
    fullTitle: `Semana ${summary.weekNumber} · ${summary.dateRange.start.toLocaleDateString('es-CL', { month: 'long' })} · Q${getQuarterNumber(summary.dateRange.start)} ${summary.dateRange.start.getFullYear()}`,
    amount: summary.totalSpent,
    trend: summary.isFirstWeek ? undefined : summary.trendDirection,
    trendPercent: summary.isFirstWeek ? undefined : Math.abs(summary.trendPercent),
    comparisonLabel: `vs S${prevWeekNum}`,
    periodType: 'weekly',
    isUnread: weeksAgo === 0,
    isFirst: summary.isFirstWeek,
    firstLabel: 'Tu primera semana',
    categories: summary.topCategories,
    transactionCount: summary.transactionCount,
    dateRange: summary.dateRange,
  };
}

// ============================================================================
// Reports List Generation
// ============================================================================

/**
 * Get all available reports for a given period type within a time filter
 * @param transactions - All user transactions
 * @param periodType - Type of period (weekly, monthly, quarterly, yearly)
 * @param maxReports - Maximum number of reports to return
 */
export function getAvailableReports(
  transactions: Transaction[],
  periodType: ReportPeriodType,
  maxReports: number = 10
): ReportRowData[] {
  const reports: ReportRowData[] = [];

  for (let i = 0; i < maxReports; i++) {
    let report: ReportRowData | null = null;

    switch (periodType) {
      case 'weekly':
        report = generateWeeklyReportRow(transactions, i);
        break;
      case 'monthly':
        report = generateMonthlySummary(transactions, i);
        break;
      case 'quarterly':
        report = generateQuarterlySummary(transactions, i);
        break;
      case 'yearly':
        report = generateYearlySummary(transactions, i);
        break;
    }

    if (report) {
      reports.push(report);
    }
  }

  return reports;
}

/**
 * Get time filter label for display
 */
export function getTimeFilterLabel(
  periodType: ReportPeriodType,
  offset: number = 0
): string {
  const now = new Date();

  switch (periodType) {
    case 'weekly': {
      const monthStart = getMonthStart(now);
      monthStart.setMonth(monthStart.getMonth() - offset);
      const monthName = monthStart.toLocaleDateString('es-CL', { month: 'long' });
      return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    }
    case 'monthly': {
      const monthStart = getMonthStart(now);
      monthStart.setMonth(monthStart.getMonth() - offset);
      const monthName = monthStart.toLocaleDateString('es-CL', { month: 'long' });
      return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    }
    case 'quarterly': {
      const quarterStart = getQuarterStart(now);
      quarterStart.setMonth(quarterStart.getMonth() - offset * 3);
      return `Q${getQuarterNumber(quarterStart)} ${quarterStart.getFullYear()}`;
    }
    case 'yearly': {
      return `${now.getFullYear() - offset}`;
    }
  }
}

// ============================================================================
// Insight Generation Helpers
// ============================================================================

/**
 * Holiday/seasonal months in Chile (for contextual insights)
 */
const HOLIDAY_MONTHS: Record<number, string> = {
  0: 'verano', // January - summer vacation
  1: 'verano', // February - summer vacation
  2: 'vuelta a clases', // March - back to school
  8: 'fiestas patrias', // September - Independence Day
  11: 'fiestas de fin de año', // December - holidays
};

/**
 * Generate a persona insight for monthly reports based on data patterns
 */
function generateMonthlyPersonaInsight(
  categories: CategoryBreakdown[],
  trend: TrendDirection | undefined,
  trendPercent: number | undefined,
  isFirst: boolean,
  monthIndex: number,
  prevMonthCategories?: CategoryBreakdown[]
): string | undefined {
  if (isFirst) {
    return 'Tu primer mes completo con Gastify.';
  }

  // Check for holiday context
  const holidayContext = HOLIDAY_MONTHS[monthIndex];

  // Find the category with biggest increase
  if (categories.length > 0 && prevMonthCategories && prevMonthCategories.length > 0) {
    const categoryChanges: { category: string; change: number; name: string }[] = [];

    for (const cat of categories) {
      const prevCat = prevMonthCategories.find((pc) => pc.category === cat.category);
      if (prevCat && prevCat.amount > 0) {
        const change = ((cat.amount - prevCat.amount) / prevCat.amount) * 100;
        if (Math.abs(change) > 10) {
          categoryChanges.push({
            category: cat.category,
            change,
            name: formatCategoryName(cat.category),
          });
        }
      }
    }

    // Sort by absolute change descending
    categoryChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    if (categoryChanges.length > 0) {
      const biggest = categoryChanges[0];

      // Holiday-aware insights
      if (holidayContext && biggest.change > 20) {
        if (monthIndex === 11) {
          return `Las ${holidayContext} se notaron: ${biggest.name} subió ${Math.round(biggest.change)}% este mes.`;
        } else if (monthIndex === 8) {
          return `Las ${holidayContext} impulsaron ${biggest.name}: +${Math.round(biggest.change)}%.`;
        } else if (monthIndex <= 2) {
          return `El ${holidayContext} trajo más gastos en ${biggest.name}.`;
        }
      }

      // Generic category change insights
      if (biggest.change > 25) {
        return `${biggest.name} subió harto este mes: +${Math.round(biggest.change)}% vs el anterior.`;
      } else if (biggest.change < -25) {
        return `Buen control en ${biggest.name}: bajaste ${Math.round(Math.abs(biggest.change))}% este mes.`;
      } else if (biggest.change > 15) {
        return `${biggest.name} subió ${Math.round(biggest.change)}% este mes.`;
      } else if (biggest.change < -15) {
        return `Gastaste menos en ${biggest.name}: -${Math.round(Math.abs(biggest.change))}%.`;
      }
    }
  }

  // Trend-based insights
  if (trend && trendPercent !== undefined) {
    if (trend === 'down' && trendPercent > 10) {
      return `Buen control este mes. Gastaste ${Math.round(trendPercent)}% menos que el anterior.`;
    } else if (trend === 'up' && trendPercent > 15) {
      return `Mes de mayor gasto: +${Math.round(trendPercent)}% vs el mes anterior.`;
    }
  }

  // Dominant category insight
  if (categories.length > 0 && categories[0].percent >= 45) {
    return `${formatCategoryName(categories[0].category)} dominó tu mes con ${categories[0].percent}% del gasto.`;
  }

  // Diversity insight
  if (categories.length >= 4) {
    return `Gastos diversos este mes: ${categories.length} categorías diferentes.`;
  }

  return undefined;
}

/**
 * Generate highlights for monthly reports
 */
function generateMonthlyHighlights(
  categories: CategoryBreakdown[],
  transactions: Transaction[],
  _year: number,
  _monthIndex: number
): Array<{ label: string; value: string }> {
  const highlights: Array<{ label: string; value: string }> = [];

  // Group transactions by week to find highest/lowest week
  const weeklyTotals = new Map<number, number>();
  for (const t of transactions) {
    const txDate = parseDate(t.date);
    const weekNum = getISOWeekNumber(txDate);
    const existing = weeklyTotals.get(weekNum) || 0;
    weeklyTotals.set(weekNum, existing + t.total);
  }

  if (weeklyTotals.size >= 2) {
    const weeks = Array.from(weeklyTotals.entries());
    weeks.sort((a, b) => b[1] - a[1]);

    const highestWeek = weeks[0];
    const lowestWeek = weeks[weeks.length - 1];

    highlights.push({
      label: 'Semana más alta',
      value: `S${highestWeek[0]} · ${formatCurrency(highestWeek[1])}`,
    });

    if (highestWeek[0] !== lowestWeek[0]) {
      highlights.push({
        label: 'Semana más baja',
        value: `S${lowestWeek[0]} · ${formatCurrency(lowestWeek[1])}`,
      });
    }
  }

  // Top category
  if (categories.length > 0) {
    highlights.push({
      label: 'Categoría líder',
      value: `${formatCategoryName(categories[0].category)} · ${categories[0].percent}%`,
    });
  }

  // Most transactions category (if different from top spend)
  if (categories.length > 1) {
    const mostTransactions = [...categories].sort(
      (a, b) => b.transactionCount - a.transactionCount
    )[0];
    if (mostTransactions.category !== categories[0].category) {
      highlights.push({
        label: 'Más visitas',
        value: `${formatCategoryName(mostTransactions.category)} · ${mostTransactions.transactionCount} compras`,
      });
    }
  }

  return highlights.slice(0, 4); // Max 4 highlights
}

/**
 * Generate highlights for quarterly reports
 */
function generateQuarterlyHighlights(
  transactions: Transaction[],
  categories: CategoryBreakdown[],
  year: number,
  _quarter: number,
  prevQuarterCategories?: CategoryBreakdown[]
): Array<{ label: string; value: string }> {
  const highlights: Array<{ label: string; value: string }> = [];

  // Group by month to find highest/lowest
  const monthlyTotals = new Map<number, { total: number; name: string }>();

  for (const t of transactions) {
    const txDate = parseDate(t.date);
    const month = txDate.getMonth();
    const existing = monthlyTotals.get(month) || { total: 0, name: '' };
    if (!existing.name) {
      const monthDate = new Date(year, month, 1);
      existing.name =
        monthDate.toLocaleDateString('es-CL', { month: 'long' }).charAt(0).toUpperCase() +
        monthDate.toLocaleDateString('es-CL', { month: 'long' }).slice(1);
    }
    monthlyTotals.set(month, { total: existing.total + t.total, name: existing.name });
  }

  if (monthlyTotals.size >= 2) {
    const months = Array.from(monthlyTotals.entries());
    months.sort((a, b) => b[1].total - a[1].total);

    const highestMonth = months[0];
    const lowestMonth = months[months.length - 1];

    highlights.push({
      label: 'Mes más alto',
      value: `${highestMonth[1].name} · ${formatCurrency(highestMonth[1].total)}`,
    });

    if (highestMonth[0] !== lowestMonth[0]) {
      highlights.push({
        label: 'Mes más bajo',
        value: `${lowestMonth[1].name} · ${formatCurrency(lowestMonth[1].total)}`,
      });
    }
  }

  // Leading category
  if (categories.length > 0) {
    highlights.push({
      label: 'Categoría líder',
      value: `${formatCategoryName(categories[0].category)} · ${categories[0].percent}%`,
    });
  }

  // Find biggest category change vs previous quarter
  if (prevQuarterCategories && prevQuarterCategories.length > 0) {
    let biggestIncrease: { name: string; change: number } | null = null;

    for (const cat of categories) {
      const prevCat = prevQuarterCategories.find((pc) => pc.category === cat.category);
      if (prevCat && prevCat.amount > 0) {
        const change = ((cat.amount - prevCat.amount) / prevCat.amount) * 100;
        // Lower threshold to 10% to show more category changes
        if (change > 10 && (!biggestIncrease || change > biggestIncrease.change)) {
          biggestIncrease = {
            name: formatCategoryName(cat.category),
            change: Math.round(change),
          };
        }
      }
    }

    if (biggestIncrease) {
      highlights.push({
        label: 'Mayor aumento',
        value: `${biggestIncrease.name} · +${biggestIncrease.change}%`,
      });
    }
  }

  return highlights.slice(0, 4);
}

/**
 * Generate persona insight for quarterly reports
 */
function generateQuarterlyPersonaInsight(
  categories: CategoryBreakdown[],
  isFirst: boolean,
  quarter: number,
  prevQuarterCategories?: CategoryBreakdown[]
): string | undefined {
  if (isFirst) {
    return 'Tu historia financiera comienza aquí.';
  }

  if (categories.length === 0) return undefined;

  const topCategory = categories[0];
  const topCategoryName = formatCategoryName(topCategory.category);

  // Check for category changes
  if (prevQuarterCategories && prevQuarterCategories.length > 0) {
    const prevTop = prevQuarterCategories.find((pc) => pc.category === topCategory.category);

    if (prevTop && prevTop.amount > 0) {
      const change = ((topCategory.amount - prevTop.amount) / prevTop.amount) * 100;

      if (change > 20) {
        // Seasonal insights
        if (quarter === 4) {
          return `Este trimestre, ${topCategoryName} fue tu categoría estrella con ${topCategory.percent}% del gasto total. Las fiestas de fin de año impulsaron el gasto.`;
        } else if (quarter === 3) {
          return `El verano trajo más gastos en ${topCategoryName}. ¡Disfrutaste bien!`;
        } else if (quarter === 1) {
          return `Vuelta a la rutina: ${topCategoryName} lideró con ${topCategory.percent}% del total.`;
        }
        return `${topCategoryName} creció ${Math.round(change)}% este trimestre, llegando a ${topCategory.percent}% del total.`;
      } else if (change < -15) {
        return `Buen control: ${topCategoryName} bajó ${Math.round(Math.abs(change))}% vs el trimestre anterior.`;
      }
    }
  }

  return `Este trimestre, ${topCategoryName} fue tu categoría estrella con ${topCategory.percent}% del gasto total.`;
}

/**
 * Generate highlights for yearly reports
 */
function generateYearlyHighlights(
  transactions: Transaction[],
  categories: CategoryBreakdown[],
  year: number
): Array<{ label: string; value: string }> {
  const highlights: Array<{ label: string; value: string }> = [];

  // Group by month to find highest/lowest
  const monthlyTotals = new Map<number, { total: number; name: string }>();

  for (const t of transactions) {
    const txDate = parseDate(t.date);
    const month = txDate.getMonth();
    const existing = monthlyTotals.get(month) || { total: 0, name: '' };
    if (!existing.name) {
      const monthDate = new Date(year, month, 1);
      existing.name =
        monthDate.toLocaleDateString('es-CL', { month: 'long' }).charAt(0).toUpperCase() +
        monthDate.toLocaleDateString('es-CL', { month: 'long' }).slice(1);
    }
    monthlyTotals.set(month, { total: existing.total + t.total, name: existing.name });
  }

  if (monthlyTotals.size >= 2) {
    const months = Array.from(monthlyTotals.entries());
    months.sort((a, b) => b[1].total - a[1].total);

    const highestMonth = months[0];
    const lowestMonth = months[months.length - 1];

    highlights.push({
      label: 'Mes más alto',
      value: `${highestMonth[1].name} · ${formatCurrency(highestMonth[1].total)}`,
    });

    if (highestMonth[0] !== lowestMonth[0]) {
      highlights.push({
        label: 'Mes más bajo',
        value: `${lowestMonth[1].name} · ${formatCurrency(lowestMonth[1].total)}`,
      });
    }
  }

  // Top category
  if (categories.length > 0) {
    highlights.push({
      label: 'Categoría #1',
      value: `${formatCategoryName(categories[0].category)} · ${categories[0].percent}%`,
    });
  }

  return highlights.slice(0, 4);
}

/**
 * Generate persona insight for yearly reports
 */
function generateYearlyPersonaInsight(
  categories: CategoryBreakdown[],
  isFirst: boolean
): string | undefined {
  if (isFirst) {
    return 'Tu primer año completo de decisiones inteligentes.';
  }

  if (categories.length === 0) return undefined;

  // Get top 2 categories for a richer insight
  const topCategory = categories[0];
  const topCategoryName = formatCategoryName(topCategory.category).toLowerCase();

  // If we have a second category that's also significant (>20%), mention both
  if (categories.length >= 2 && categories[1].percent >= 20) {
    const secondCategoryName = formatCategoryName(categories[1].category).toLowerCase();
    return `Un año completo de decisiones inteligentes. Tu mayor inversión fue en ${topCategoryName} y ${secondCategoryName}.`;
  }

  return `Un año completo de seguimiento financiero. Tu mayor inversión fue en ${topCategoryName}.`;
}

// ============================================================================
// Year-Based Report Generation
// ============================================================================

/**
 * Filter transactions to a specific year
 */
function filterTransactionsBySpecificYear(
  transactions: Transaction[],
  year: number
): Transaction[] {
  return transactions.filter((t) => {
    const txYear = parseInt(t.date.split('-')[0], 10);
    return txYear === year;
  });
}

/**
 * Generate weekly reports for a specific year
 * Only generates reports for completed weeks (excludes current week)
 * Compares across year boundaries (Week 1 vs Week 52 of previous year)
 *
 * IMPORTANT: ISO weeks can span year boundaries. Week 1 of a year is defined as
 * the week containing January 4th. This means Week 1 may include days from December
 * of the previous year. We filter by the week's date range, not by calendar year.
 */
function generateWeeklyReportsForYear(
  transactions: Transaction[],
  year: number
): ReportRowData[] {
  const reports: ReportRowData[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeekNum = getISOWeekNumber(now);

  // Group ALL transactions by their ISO week (not filtered by year)
  // This ensures Week 1 of 2026 includes Dec 29-31, 2025 transactions
  const weeksWithData = new Map<string, Transaction[]>(); // key: "year-weekNum"

  for (const t of transactions) {
    const txDate = parseDate(t.date);
    const weekNum = getISOWeekNumber(txDate);
    // Determine which year this ISO week belongs to
    // Use Thursday of the week to determine the year (ISO standard)
    const thursday = getWeekStart(txDate);
    thursday.setDate(thursday.getDate() + 3);
    const isoYear = thursday.getFullYear();

    const key = `${isoYear}-${weekNum}`;
    const existing = weeksWithData.get(key) || [];
    existing.push(t);
    weeksWithData.set(key, existing);
  }

  // Get weeks for this specific year
  const yearWeeks = Array.from(weeksWithData.entries())
    .filter(([key]) => key.startsWith(`${year}-`))
    .map(([key, txs]) => ({
      weekNum: parseInt(key.split('-')[1], 10),
      transactions: txs,
    }))
    .sort((a, b) => b.weekNum - a.weekNum); // Sort descending

  // Get previous year weeks for comparison
  const prevYearWeeksMap = new Map<number, Transaction[]>();
  Array.from(weeksWithData.entries())
    .filter(([key]) => key.startsWith(`${year - 1}-`))
    .forEach(([key, txs]) => {
      const weekNum = parseInt(key.split('-')[1], 10);
      prevYearWeeksMap.set(weekNum, txs);
    });

  // Current year weeks map for intra-year comparison
  const currentYearWeeksMap = new Map<number, Transaction[]>();
  yearWeeks.forEach(({ weekNum, transactions: txs }) => {
    currentYearWeeksMap.set(weekNum, txs);
  });

  for (const { weekNum, transactions: weekTransactions } of yearWeeks) {
    // Skip current incomplete week
    const isCurrentWeek = year === currentYear && weekNum === currentWeekNum;
    if (isCurrentWeek) {
      continue; // Don't generate report for current week
    }

    const totalSpent = calculateTotal(weekTransactions);
    const categories = getCategoryBreakdown(weekTransactions);

    // Get previous week data for trend - check across year boundary
    let prevWeekTransactions: Transaction[];
    let comparisonLabel: string;

    if (weekNum === 1) {
      // Week 1: compare with last week of previous year (week 52 or 53)
      prevWeekTransactions = prevYearWeeksMap.get(52) || prevYearWeeksMap.get(53) || [];
      comparisonLabel = `vs S52 ${year - 1}`;
    } else {
      prevWeekTransactions = currentYearWeeksMap.get(weekNum - 1) || [];
      comparisonLabel = `vs S${weekNum - 1}`;
    }

    const prevTotalSpent = calculateTotal(prevWeekTransactions);

    const { direction: trend, percent: trendPercent } = calculateTrend(
      totalSpent,
      prevTotalSpent,
      NEUTRAL_THRESHOLD
    );

    const isFirst = prevWeekTransactions.length === 0;

    // Get month name for full title - use Thursday of the week (ISO standard)
    const firstTxDate = parseDate(weekTransactions[0].date);
    const weekStart = getWeekStart(firstTxDate);
    const weekEnd = getWeekEnd(firstTxDate);

    // Use Thursday for month attribution (ISO standard)
    const thursday = new Date(weekStart);
    thursday.setDate(thursday.getDate() + 3);
    const monthName = thursday.toLocaleDateString('es-CL', { month: 'long' });

    // Generate persona insight based on data
    let personaInsight: string | undefined;
    if (categories.length > 0) {
      const topCategory = categories[0];
      const topCategoryName = formatCategoryName(topCategory.category);

      if (isFirst) {
        personaInsight = `Tu primera semana registrada. ${topCategoryName} fue tu mayor gasto.`;
      } else if (trend === 'up' && trendPercent > 20) {
        personaInsight = `Semana de mayor gasto: +${Math.abs(trendPercent)}% vs la semana anterior.`;
      } else if (trend === 'down' && trendPercent < -20) {
        personaInsight = `¡Buen control! Redujiste ${Math.abs(trendPercent)}% vs la semana anterior.`;
      } else if (topCategory.percent >= 50) {
        personaInsight = `${topCategoryName} dominó tu semana con ${topCategory.percent}% del gasto.`;
      } else if (categories.length >= 3) {
        personaInsight = `Gastos diversos esta semana: ${categories.length} categorías diferentes.`;
      }
    }

    reports.push({
      id: `weekly-${year}-${weekNum}`,
      title: `Semana ${weekNum}`,
      fullTitle: `Semana ${weekNum} · ${monthName} · Q${getQuarterNumber(thursday)} ${year}`,
      amount: totalSpent,
      trend: isFirst ? undefined : trend,
      trendPercent: isFirst ? undefined : Math.abs(trendPercent),
      comparisonLabel,
      periodType: 'weekly',
      isUnread: false, // Completed weeks are not "unread" in the current sense
      isFirst,
      firstLabel: 'Tu primera semana',
      categories,
      personaInsight,
      transactionCount: weekTransactions.length,
      dateRange: { start: weekStart, end: weekEnd },
    });
  }

  return reports;
}

/**
 * Generate monthly reports for a specific year
 * Only generates reports for completed months (excludes current month)
 * Compares across year boundaries (January vs December of previous year)
 */
function generateMonthlyReportsForYear(
  transactions: Transaction[],
  year: number
): ReportRowData[] {
  const yearTransactions = filterTransactionsBySpecificYear(transactions, year);
  if (yearTransactions.length === 0) return [];

  const reports: ReportRowData[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Get months in this year that have transactions
  const monthsWithData = new Map<number, Transaction[]>();

  for (const t of yearTransactions) {
    const txDate = parseDate(t.date);
    const month = txDate.getMonth();
    const existing = monthsWithData.get(month) || [];
    existing.push(t);
    monthsWithData.set(month, existing);
  }

  // Also get previous year's December for cross-year comparison
  const prevYearTransactions = filterTransactionsBySpecificYear(transactions, year - 1);
  const prevYearMonthsWithData = new Map<number, Transaction[]>();
  for (const t of prevYearTransactions) {
    const txDate = parseDate(t.date);
    const month = txDate.getMonth();
    const existing = prevYearMonthsWithData.get(month) || [];
    existing.push(t);
    prevYearMonthsWithData.set(month, existing);
  }

  // Sort months descending (most recent first)
  const sortedMonths = Array.from(monthsWithData.keys()).sort((a, b) => b - a);

  // Pre-calculate categories for all months to enable comparison (including December of prev year)
  const monthCategories = new Map<number, CategoryBreakdown[]>();
  for (const month of sortedMonths) {
    const monthTransactions = monthsWithData.get(month) || [];
    monthCategories.set(month, getCategoryBreakdown(monthTransactions));
  }

  // Calculate December categories from previous year
  const prevYearDecemberTransactions = prevYearMonthsWithData.get(11) || [];
  const prevYearDecemberCategories =
    prevYearDecemberTransactions.length > 0
      ? getCategoryBreakdown(prevYearDecemberTransactions)
      : undefined;

  for (const month of sortedMonths) {
    // Skip current incomplete month
    const isCurrentMonth = year === currentYear && month === currentMonth;
    if (isCurrentMonth) {
      continue; // Don't generate report for current month
    }

    const monthTransactions = monthsWithData.get(month) || [];
    const totalSpent = calculateTotal(monthTransactions);
    const categories = monthCategories.get(month) || [];

    // Get previous month data for trend - check across year boundary
    let prevMonthTransactions: Transaction[];
    let prevCategories: CategoryBreakdown[] | undefined;
    let comparisonLabel: string;

    if (month === 0) {
      // January: compare with December of previous year
      prevMonthTransactions = prevYearDecemberTransactions;
      prevCategories = prevYearDecemberCategories;
      comparisonLabel = `vs Dic ${year - 1}`;
    } else {
      const prevMonth = month - 1;
      prevMonthTransactions = monthsWithData.get(prevMonth) || [];
      prevCategories = monthCategories.get(prevMonth);
      const prevMonthDate = new Date(year, prevMonth, 1);
      const prevMonthName = prevMonthDate.toLocaleDateString('es-CL', { month: 'short' });
      const prevMonthCapitalized = prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1);
      comparisonLabel = `vs ${prevMonthCapitalized}`;
    }

    const prevTotalSpent = calculateTotal(prevMonthTransactions);

    const { direction: trend, percent: trendPercent } = calculateTrend(
      totalSpent,
      prevTotalSpent,
      NEUTRAL_THRESHOLD
    );

    const isFirst = prevMonthTransactions.length === 0;

    const monthDate = new Date(year, month, 1);
    const monthName = monthDate.toLocaleDateString('es-CL', { month: 'long' });
    const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // Calculate month date range
    const monthStart = getMonthStart(monthDate);
    const monthEnd = getMonthEnd(monthDate);

    // Generate persona insight retroactively
    const personaInsight = generateMonthlyPersonaInsight(
      categories,
      trend,
      Math.abs(trendPercent),
      isFirst,
      month,
      prevCategories
    );

    // Generate highlights for the month
    const highlights = generateMonthlyHighlights(categories, monthTransactions, year, month);

    reports.push({
      id: `monthly-${year}-${month}`,
      title: monthNameCapitalized,
      fullTitle: `${monthNameCapitalized} · Q${getQuarterNumber(monthDate)} ${year}`,
      amount: totalSpent,
      trend: isFirst ? undefined : trend,
      trendPercent: isFirst ? undefined : Math.abs(trendPercent),
      comparisonLabel,
      periodType: 'monthly',
      isUnread: false, // Completed months
      isFirst,
      firstLabel: 'Tu primer mes',
      categories,
      personaInsight,
      highlights: highlights.length > 0 ? highlights : undefined,
      transactionCount: monthTransactions.length,
      dateRange: { start: monthStart, end: monthEnd },
    });
  }

  return reports;
}

/**
 * Generate quarterly reports for a specific year
 * Only generates reports for completed quarters (excludes current quarter)
 * Compares across year boundaries (Q1 vs Q4 of previous year)
 */
function generateQuarterlyReportsForYear(
  transactions: Transaction[],
  year: number
): ReportRowData[] {
  const yearTransactions = filterTransactionsBySpecificYear(transactions, year);
  if (yearTransactions.length === 0) return [];

  const reports: ReportRowData[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = getQuarterNumber(now);

  // Get quarters in this year that have transactions
  const quartersWithData = new Map<number, Transaction[]>();

  for (const t of yearTransactions) {
    const txDate = parseDate(t.date);
    const quarter = getQuarterNumber(txDate);
    const existing = quartersWithData.get(quarter) || [];
    existing.push(t);
    quartersWithData.set(quarter, existing);
  }

  // Also get previous year's Q4 for cross-year comparison
  const prevYearTransactions = filterTransactionsBySpecificYear(transactions, year - 1);
  const prevYearQuartersWithData = new Map<number, Transaction[]>();
  for (const t of prevYearTransactions) {
    const txDate = parseDate(t.date);
    const quarter = getQuarterNumber(txDate);
    const existing = prevYearQuartersWithData.get(quarter) || [];
    existing.push(t);
    prevYearQuartersWithData.set(quarter, existing);
  }

  // Sort quarters descending
  const sortedQuarters = Array.from(quartersWithData.keys()).sort((a, b) => b - a);

  // Pre-calculate categories for all quarters to enable comparison
  const quarterCategories = new Map<number, CategoryBreakdown[]>();
  for (const quarter of sortedQuarters) {
    const quarterTransactions = quartersWithData.get(quarter) || [];
    quarterCategories.set(quarter, getCategoryBreakdown(quarterTransactions));
  }

  // Calculate Q4 categories from previous year
  const prevYearQ4Transactions = prevYearQuartersWithData.get(4) || [];
  const prevYearQ4Categories =
    prevYearQ4Transactions.length > 0
      ? getCategoryBreakdown(prevYearQ4Transactions)
      : undefined;

  for (const quarter of sortedQuarters) {
    // Skip current incomplete quarter
    const isCurrentQuarter = year === currentYear && quarter === currentQuarter;
    if (isCurrentQuarter) {
      continue; // Don't generate report for current quarter
    }

    const quarterTransactions = quartersWithData.get(quarter) || [];
    const totalSpent = calculateTotal(quarterTransactions);
    const categories = quarterCategories.get(quarter) || [];

    // Get previous quarter data for trend - check across year boundary
    let prevQuarterTransactions: Transaction[];
    let prevCategories: CategoryBreakdown[] | undefined;
    let comparisonLabel: string;

    if (quarter === 1) {
      // Q1: compare with Q4 of previous year
      prevQuarterTransactions = prevYearQ4Transactions;
      prevCategories = prevYearQ4Categories;
      comparisonLabel = `vs Q4 ${year - 1}`;
    } else {
      const prevQuarter = quarter - 1;
      prevQuarterTransactions = quartersWithData.get(prevQuarter) || [];
      prevCategories = quarterCategories.get(prevQuarter);
      comparisonLabel = `vs Q${prevQuarter}`;
    }

    const prevTotalSpent = calculateTotal(prevQuarterTransactions);

    const { direction: trend, percent: trendPercent } = calculateTrend(
      totalSpent,
      prevTotalSpent,
      NEUTRAL_THRESHOLD
    );

    const isFirst = prevQuarterTransactions.length === 0;

    // Calculate quarter date range (quarter is 1-4, needs to be converted to 0-3 for month calculation)
    const quarterStartMonth = (quarter - 1) * 3;
    const quarterStartDate = new Date(year, quarterStartMonth, 1);
    const quarterStart = getQuarterStart(quarterStartDate);
    const quarterEnd = getQuarterEnd(quarterStartDate);

    // Generate rich highlights with month analysis
    const highlights = generateQuarterlyHighlights(
      quarterTransactions,
      categories,
      year,
      quarter,
      prevCategories
    );

    // Generate persona insight
    const personaInsight = generateQuarterlyPersonaInsight(
      categories,
      isFirst,
      quarter,
      prevCategories
    );

    reports.push({
      id: `quarterly-${year}-${quarter}`,
      title: `Q${quarter} ${year}`,
      fullTitle: `Q${quarter} · ${year}`,
      amount: totalSpent,
      trend: isFirst ? undefined : trend,
      trendPercent: isFirst ? undefined : Math.abs(trendPercent),
      comparisonLabel,
      periodType: 'quarterly',
      isUnread: false, // Completed quarters
      isFirst,
      firstLabel: 'Tu primer trimestre',
      personaHook: 'Descubre qué categoría dominó tu trimestre',
      categories,
      highlights: highlights.length > 0 ? highlights : undefined,
      personaInsight,
      transactionCount: quarterTransactions.length,
      dateRange: { start: quarterStart, end: quarterEnd },
    });
  }

  return reports;
}

/**
 * Generate yearly report for a specific year
 * Only generates report for completed years (excludes current year)
 */
function generateYearlyReportForYear(
  transactions: Transaction[],
  year: number
): ReportRowData[] {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Don't generate report for current incomplete year
  if (year === currentYear) {
    return []; // Year hasn't completed yet
  }

  const yearTransactions = filterTransactionsBySpecificYear(transactions, year);
  if (yearTransactions.length === 0) return [];

  const totalSpent = calculateTotal(yearTransactions);
  const categories = getCategoryBreakdown(yearTransactions);

  // Get previous year data for trend
  const prevYearTransactions = filterTransactionsBySpecificYear(transactions, year - 1);
  const prevTotalSpent = calculateTotal(prevYearTransactions);

  const { direction: trend, percent: trendPercent } = calculateTrend(
    totalSpent,
    prevTotalSpent,
    NEUTRAL_THRESHOLD
  );

  const isFirst = prevYearTransactions.length === 0;

  // Calculate year date range
  const yearStart = new Date(year, 0, 1);
  yearStart.setHours(0, 0, 0, 0);
  const yearEnd = new Date(year, 11, 31);
  yearEnd.setHours(23, 59, 59, 999);

  // Generate rich highlights with month analysis
  const highlights = generateYearlyHighlights(yearTransactions, categories, year);

  // Generate persona insight
  const personaInsight = generateYearlyPersonaInsight(categories, isFirst);

  return [{
    id: `yearly-${year}`,
    title: `${year}`,
    fullTitle: `${year}`,
    amount: totalSpent,
    trend: isFirst ? undefined : trend,
    trendPercent: isFirst ? undefined : Math.abs(trendPercent),
    comparisonLabel: `vs ${year - 1}`,
    periodType: 'yearly',
    isUnread: false, // Completed year
    isFirst,
    firstLabel: 'Tu primer año completo',
    personaHook: 'Un año de decisiones financieras inteligentes',
    categories,
    highlights: highlights.length > 0 ? highlights : undefined,
    personaInsight,
    transactionCount: yearTransactions.length,
    dateRange: { start: yearStart, end: yearEnd },
  }];
}

/**
 * Get all available reports for a given period type within a specific year
 * Only returns reports that have actual transaction data
 */
export function getAvailableReportsForYear(
  transactions: Transaction[],
  periodType: ReportPeriodType,
  year: number
): ReportRowData[] {
  switch (periodType) {
    case 'weekly':
      return generateWeeklyReportsForYear(transactions, year);
    case 'monthly':
      return generateMonthlyReportsForYear(transactions, year);
    case 'quarterly':
      return generateQuarterlyReportsForYear(transactions, year);
    case 'yearly':
      return generateYearlyReportForYear(transactions, year);
    default:
      return [];
  }
}

/**
 * Get the maximum possible number of reports for a given period type in a year
 * Always returns the total periods for that year type:
 * - Weekly: 52 (standard year)
 * - Monthly: 12
 * - Quarterly: 4
 * - Yearly: 1
 *
 * This is used for display purposes to show "X of Y" counters
 * where Y represents the total possible reports for that period type.
 */
export function getMaxReportsForYear(
  periodType: ReportPeriodType,
  _year: number
): number {
  switch (periodType) {
    case 'weekly':
      return 52; // Standard year has 52 weeks
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'yearly':
      return 1;
    default:
      return 0;
  }
}
