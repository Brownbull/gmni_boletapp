/**
 * BatchInsight Component
 *
 * Story 12.5: Batch Save & Insights
 * Displays aggregate insights after batch save completion.
 *
 * Features:
 * - Total amount saved (AC #4)
 * - Receipt count (AC #4)
 * - Top category with percentage (AC #4)
 * - Celebration animation for 5+ receipts (AC #7)
 * - Navigation options (AC #6, AC #8)
 *
 * @see docs/sprint-artifacts/epic12/story-12.5-batch-save-insights.md
 */

import React, { useEffect, useRef } from 'react';
import { PartyPopper, ChevronRight, Home } from 'lucide-react';
import { Transaction, StoreCategory } from '../types/transaction';
import { formatCurrency } from '../utils/currency';
import { getCategoryEmoji } from '../utils/categoryEmoji';
import { celebrateBig } from '../utils/confetti';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { Currency } from '../types/settings';

/**
 * Category breakdown for insights display.
 */
export interface CategoryBreakdown {
  category: StoreCategory | string;
  amount: number;
  count: number;
  percentage: number;
}

/**
 * Result from batch save operation.
 */
export interface BatchSaveResult {
  /** Successfully saved transactions */
  transactions: Transaction[];
  /** Total amount across all saved transactions */
  totalAmount: number;
  /** Number of failed saves (for display, if any) */
  failedCount: number;
}

export interface BatchInsightProps {
  /** Result from batch save */
  saveResult: BatchSaveResult;
  /** Current theme */
  theme: 'light' | 'dark';
  /** Display currency */
  currency: Currency;
  /** Translation function */
  t: (key: string) => string;
  /** Format currency function */
  formatCurrencyFn?: typeof formatCurrency;
  /** Called when user clicks "Continuar" (go to home) */
  onContinue: () => void;
  /** Called when user clicks "Ver boletas guardadas" (view saved receipts) */
  onViewReceipts: () => void;
}

/**
 * Calculate category breakdown from transactions.
 */
function calculateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const tx of transactions) {
    const category = tx.category || 'Other';
    const existing = categoryMap.get(category) || { amount: 0, count: 0 };
    categoryMap.set(category, {
      amount: existing.amount + (tx.total || 0),
      count: existing.count + 1,
    });
  }

  const totalAmount = transactions.reduce((sum, tx) => sum + (tx.total || 0), 0);

  const breakdown: CategoryBreakdown[] = [];
  categoryMap.forEach((value, category) => {
    breakdown.push({
      category,
      amount: value.amount,
      count: value.count,
      percentage: totalAmount > 0 ? Math.round((value.amount / totalAmount) * 100) : 0,
    });
  });

  // Sort by amount descending
  return breakdown.sort((a, b) => b.amount - a.amount);
}

/**
 * BatchInsight Component
 *
 * Displays a celebration modal with aggregate insights after batch save.
 * Shows top category, total amount, and navigation options.
 */
export const BatchInsight: React.FC<BatchInsightProps> = ({
  saveResult,
  theme,
  currency,
  t,
  formatCurrencyFn = formatCurrency,
  onContinue,
  onViewReceipts,
}) => {
  const isDark = theme === 'dark';
  const prefersReducedMotion = useReducedMotion();
  const hasAnimated = useRef(false);

  const { transactions, totalAmount, failedCount } = saveResult;
  const savedCount = transactions.length;

  // Calculate category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(transactions);
  const topCategory = categoryBreakdown[0];

  // Fire celebration for 5+ receipts (AC #7)
  useEffect(() => {
    if (savedCount >= 5 && !hasAnimated.current && !prefersReducedMotion) {
      hasAnimated.current = true;
      // Short delay so the modal is visible first
      const timer = setTimeout(() => {
        celebrateBig();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [savedCount, prefersReducedMotion]);

  // Theme-based styling
  const bgColor = isDark ? 'bg-slate-900' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-slate-50';
  const accentBg = isDark ? 'bg-emerald-900/30' : 'bg-emerald-50';
  const accentText = isDark ? 'text-emerald-400' : 'text-emerald-700';

  // Format amounts
  const formattedTotal = formatCurrencyFn(totalAmount, currency);
  const formattedTopAmount = topCategory
    ? formatCurrencyFn(topCategory.amount, currency)
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-insight-title"
    >
      <div
        className={`w-full max-w-md rounded-2xl ${bgColor} shadow-xl overflow-hidden`}
      >
        {/* Header with celebration icon */}
        <div className={`px-6 pt-8 pb-4 text-center ${accentBg}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
            <PartyPopper size={32} />
          </div>
          <h2
            id="batch-insight-title"
            className={`text-2xl font-bold ${textPrimary}`}
          >
            {t('batchInsightTitle').replace('{count}', String(savedCount))}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Total amount */}
          <div className={`rounded-xl p-4 ${cardBg}`}>
            <p className={`text-sm ${textSecondary}`}>{t('total')}</p>
            <p className={`text-3xl font-bold ${textPrimary}`}>
              {formattedTotal}
            </p>
          </div>

          {/* Top category insight (AC #3, #4) */}
          {topCategory && (
            <div className={`rounded-xl p-4 ${cardBg}`}>
              <p className={`text-sm ${textSecondary} mb-2`}>
                {t('batchInsightTopCategory')}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getCategoryEmoji(topCategory.category)}
                </span>
                <div className="flex-1">
                  <p className={`font-semibold ${textPrimary}`}>
                    {t(topCategory.category) || topCategory.category}
                  </p>
                  <p className={`text-sm ${textSecondary}`}>
                    {formattedTopAmount} ({topCategory.percentage}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tip */}
          <p className={`text-sm text-center ${textSecondary}`}>
            {t('batchInsightTip')}
          </p>

          {/* Warning for failed saves */}
          {failedCount > 0 && (
            <p className="text-sm text-center text-amber-600 dark:text-amber-400">
              {t('batchInsightFailed').replace('{count}', String(failedCount))}
            </p>
          )}
        </div>

        {/* Actions (AC #6, AC #8) */}
        <div className="px-6 pb-6 space-y-3">
          {/* Primary action: Continue to home */}
          <button
            onClick={onContinue}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${accentText} bg-emerald-600 hover:bg-emerald-700`}
          >
            <Home size={20} />
            {t('batchInsightContinue')}
          </button>

          {/* Secondary action: View saved receipts */}
          <button
            onClick={onViewReceipts}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {t('batchInsightViewReceipts')}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchInsight;
