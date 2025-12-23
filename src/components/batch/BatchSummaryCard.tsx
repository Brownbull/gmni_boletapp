/**
 * BatchSummaryCard Component
 *
 * Story 12.3: Batch Review Queue (AC #2, #3, #4, #7)
 * Displays a summary card for a single receipt in the batch review queue.
 *
 * Shows: emoji, merchant, total, item count, confidence indicator.
 * Actions: Edit, Discard (with retry for error state).
 *
 * @see docs/sprint-artifacts/epic12/story-12.3-batch-review-queue.md
 */

import React from 'react';
import { Check, AlertTriangle, X, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { BatchReceipt, BatchReceiptStatus } from '../../hooks/useBatchReview';
import { getCategoryEmoji } from '../../utils/categoryEmoji';
import { formatCurrency } from '../../utils/currency';
import type { Currency } from '../../types/settings';

export interface BatchSummaryCardProps {
  /** The receipt to display */
  receipt: BatchReceipt;
  /** Current theme */
  theme: 'light' | 'dark';
  /** Display currency */
  currency: Currency;
  /** Translation function */
  t: (key: string) => string;
  /** Called when Edit button is clicked */
  onEdit: () => void;
  /** Called when Discard button is clicked */
  onDiscard: () => void;
  /** Called when Retry button is clicked (error state only) */
  onRetry?: () => void;
}

/**
 * Get status configuration for display.
 */
function getStatusConfig(
  status: BatchReceiptStatus,
  isDark: boolean
): {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  textColor: string;
} {
  switch (status) {
    case 'ready':
      return {
        icon: <Check size={14} className="text-green-500" />,
        label: 'batchReviewReady',
        bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50',
        textColor: isDark ? 'text-green-400' : 'text-green-700',
      };
    case 'edited':
      return {
        icon: <Edit2 size={14} className="text-blue-500" />,
        label: 'batchReviewEdited',
        bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
        textColor: isDark ? 'text-blue-400' : 'text-blue-700',
      };
    case 'review':
      return {
        icon: <AlertTriangle size={14} className="text-amber-500" />,
        label: 'batchReviewNeeded',
        bgColor: isDark ? 'bg-amber-900/20' : 'bg-amber-50',
        textColor: isDark ? 'text-amber-400' : 'text-amber-700',
      };
    case 'error':
      return {
        icon: <X size={14} className="text-red-500" />,
        label: 'batchReviewError',
        bgColor: isDark ? 'bg-red-900/20' : 'bg-red-50',
        textColor: isDark ? 'text-red-400' : 'text-red-700',
      };
  }
}

/**
 * BatchSummaryCard Component
 *
 * Displays a receipt summary with:
 * - Category emoji and merchant name
 * - Total amount
 * - Item count
 * - Confidence indicator (ready/review/edited/error)
 * - Edit and Discard actions
 */
export const BatchSummaryCard: React.FC<BatchSummaryCardProps> = ({
  receipt,
  theme,
  currency,
  t,
  onEdit,
  onDiscard,
  onRetry,
}) => {
  const isDark = theme === 'dark';
  const { transaction, status, error } = receipt;

  // Get status configuration
  const statusConfig = getStatusConfig(status, isDark);

  // Get category emoji
  const categoryEmoji = getCategoryEmoji(transaction.category);

  // Get merchant display name
  const merchantName = transaction.alias || transaction.merchant || t('unknown');

  // Get item count
  const itemCount = transaction.items?.length || 0;

  // Get top 3 items by price for preview (Story 12.3 enhancement)
  const topItems = transaction.items
    ? [...transaction.items]
        .sort((a, b) => (b.price || 0) - (a.price || 0))
        .slice(0, Math.min(3, itemCount))
    : [];

  // Format total
  const formattedTotal = formatCurrency(transaction.total || 0, currency);

  // Card styling
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <div
      className={`rounded-lg border ${cardBorder} ${cardBg} p-4 shadow-sm transition-all duration-200`}
      role="article"
      aria-label={`${t('receipt')}: ${merchantName}`}
    >
      {/* Main content row */}
      <div className="flex items-start gap-3">
        {/* Category emoji */}
        <span className="text-2xl flex-shrink-0" aria-hidden="true">
          {categoryEmoji}
        </span>

        {/* Receipt info */}
        <div className="flex-1 min-w-0">
          {/* Merchant and total */}
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-medium truncate ${textPrimary}`}>
              {merchantName}
            </h3>
            <span className={`font-semibold flex-shrink-0 ${textPrimary}`}>
              {formattedTotal}
            </span>
          </div>

          {/* Item count and status */}
          <div className="flex items-center justify-between mt-1">
            <span className={`text-sm ${textSecondary}`}>
              {itemCount} {t(itemCount === 1 ? 'item' : 'items')}
            </span>

            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
            >
              {statusConfig.icon}
              {t(statusConfig.label)}
            </span>
          </div>

          {/* Top items preview (Story 12.3 enhancement) */}
          {topItems.length > 0 && (
            <div className={`mt-2 text-xs ${textSecondary}`}>
              {topItems.map((item, idx) => (
                <div key={idx} className="flex justify-between gap-2 truncate">
                  <span className="truncate">{item.name}</span>
                  <span className="flex-shrink-0">{formatCurrency(item.price || 0, currency)}</span>
                </div>
              ))}
              {itemCount > 3 && (
                <span className="text-xs opacity-60">+{itemCount - 3} {t('more')}</span>
              )}
            </div>
          )}

          {/* Error message (if error status) */}
          {status === 'error' && error && (
            <p className="mt-2 text-xs text-red-500 truncate">{error}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        {/* Retry button (only for error state) */}
        {status === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-400'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
            }`}
            aria-label={t('batchRetry')}
          >
            <RefreshCw size={14} />
            {t('batchRetry')}
          </button>
        )}

        {/* Edit button (not for error state) */}
        {status !== 'error' && (
          <button
            onClick={onEdit}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
            aria-label={t('batchReviewEdit')}
          >
            <Edit2 size={14} />
            {t('batchReviewEdit')}
          </button>
        )}

        {/* Discard button */}
        <button
          onClick={onDiscard}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isDark
              ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
              : 'bg-red-100 hover:bg-red-200 text-red-700'
          }`}
          aria-label={t('batchReviewDiscard')}
        >
          <Trash2 size={14} />
          {t('batchReviewDiscard')}
        </button>
      </div>
    </div>
  );
};

export default BatchSummaryCard;
