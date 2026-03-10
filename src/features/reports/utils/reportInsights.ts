/**
 * Report Insight and Highlight Helpers
 *
 * Persona insights, highlights, and seasonal context for report generation.
 * Split from reportYearGeneration.ts to stay under 800-line limit.
 */

import type { Transaction } from '@/types/transaction';
import type {
  CategoryBreakdown,
  TrendDirection,
} from '@/types/report';
import {
  formatCurrency,
} from '@/types/report';
import {
  parseDate,
  getISOWeekNumber,
  getWeekStart,
  getWeekEnd,
} from './reportDateUtils';
import {
  formatCategoryName,
} from './reportCategoryGrouping';
import { TRANSLATIONS } from '@/utils/translations';
import { getSettingsState } from '@shared/stores/useSettingsStore';

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
export function generateMonthlyPersonaInsight(
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
  const lang = getSettingsState().lang;
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
            name: formatCategoryName(cat.category, lang),
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
    return `${formatCategoryName(categories[0].category, lang)} dominó tu mes con ${categories[0].percent}% del gasto.`;
  }

  // Diversity insight
  if (categories.length >= 4) {
    return `Gastos diversos este mes: ${categories.length} categorías diferentes.`;
  }

  return undefined;
}

/**
 * Format a week date range in compact Spanish format
 * Example: "1-7 Ene" or "28 Dic - 3 Ene" (cross-month)
 */
export function formatWeekDateRange(weekStart: Date, weekEnd: Date): string {
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const startMonth = weekStart.toLocaleDateString('es-CL', { month: 'short' });
  const endMonth = weekEnd.toLocaleDateString('es-CL', { month: 'short' });

  // Capitalize first letter of month
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('.', '');

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    // Same month: "1-7 Ene"
    return `${startDay}-${endDay} ${capitalize(startMonth)}`;
  } else {
    // Cross month: "28 Dic - 3 Ene"
    return `${startDay} ${capitalize(startMonth)} - ${endDay} ${capitalize(endMonth)}`;
  }
}

/**
 * Generate highlights for monthly reports
 */
export function generateMonthlyHighlights(
  categories: CategoryBreakdown[],
  transactions: Transaction[],
  _year: number,
  _monthIndex: number
): Array<{ label: string; value: string }> {
  const highlights: Array<{ label: string; value: string }> = [];

  // Group transactions by week to find highest/lowest week
  // Track both total and date range for each week
  const weeklyData = new Map<number, { total: number; start: Date; end: Date }>();
  for (const t of transactions) {
    const txDate = parseDate(t.date);
    const weekNum = getISOWeekNumber(txDate);
    const existing = weeklyData.get(weekNum);
    if (existing) {
      existing.total += t.total;
    } else {
      weeklyData.set(weekNum, {
        total: t.total,
        start: getWeekStart(txDate),
        end: getWeekEnd(txDate),
      });
    }
  }

  if (weeklyData.size >= 2) {
    const weeks = Array.from(weeklyData.entries());
    weeks.sort((a, b) => b[1].total - a[1].total);

    const highestWeek = weeks[0];
    const lowestWeek = weeks[weeks.length - 1];

    const highDateRange = formatWeekDateRange(highestWeek[1].start, highestWeek[1].end);
    highlights.push({
      label: 'Semana más alta',
      value: `S${highestWeek[0]} (${highDateRange}) · ${formatCurrency(highestWeek[1].total)}`,
    });

    if (highestWeek[0] !== lowestWeek[0]) {
      const lowDateRange = formatWeekDateRange(lowestWeek[1].start, lowestWeek[1].end);
      highlights.push({
        label: 'Semana más baja',
        value: `S${lowestWeek[0]} (${lowDateRange}) · ${formatCurrency(lowestWeek[1].total)}`,
      });
    }
  }

  // Top category
  const lang = getSettingsState().lang;
  const t = TRANSLATIONS[lang] ?? TRANSLATIONS.es;
  if (categories.length > 0) {
    highlights.push({
      label: 'Categoría líder',
      value: `${formatCategoryName(categories[0].category, lang)} · ${categories[0].percent}%`,
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
        value: `${formatCategoryName(mostTransactions.category, lang)} · ${mostTransactions.transactionCount} ${t.reportPurchasePlural}`,
      });
    }
  }

  return highlights.slice(0, 4); // Max 4 highlights
}

/**
 * Generate highlights for quarterly reports
 */
export function generateQuarterlyHighlights(
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
  const lang = getSettingsState().lang;
  if (categories.length > 0) {
    highlights.push({
      label: 'Categoría líder',
      value: `${formatCategoryName(categories[0].category, lang)} · ${categories[0].percent}%`,
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
            name: formatCategoryName(cat.category, lang),
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
export function generateQuarterlyPersonaInsight(
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
  const lang = getSettingsState().lang;
  const topCategoryName = formatCategoryName(topCategory.category, lang);

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
export function generateYearlyHighlights(
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
  const lang = getSettingsState().lang;
  if (categories.length > 0) {
    highlights.push({
      label: 'Categoría #1',
      value: `${formatCategoryName(categories[0].category, lang)} · ${categories[0].percent}%`,
    });
  }

  return highlights.slice(0, 4);
}

/**
 * Generate persona insight for yearly reports
 */
export function generateYearlyPersonaInsight(
  categories: CategoryBreakdown[],
  isFirst: boolean
): string | undefined {
  if (isFirst) {
    return 'Tu primer año completo de decisiones inteligentes.';
  }

  if (categories.length === 0) return undefined;

  // Get top 2 categories for a richer insight
  const lang = getSettingsState().lang;
  const topCategory = categories[0];
  const topCategoryName = formatCategoryName(topCategory.category, lang).toLowerCase();

  // If we have a second category that's also significant (>20%), mention both
  if (categories.length >= 2 && categories[1].percent >= 20) {
    const secondCategoryName = formatCategoryName(categories[1].category, lang).toLowerCase();
    return `Un año completo de decisiones inteligentes. Tu mayor inversión fue en ${topCategoryName} y ${secondCategoryName}.`;
  }

  return `Un año completo de seguimiento financiero. Tu mayor inversión fue en ${topCategoryName}.`;
}
