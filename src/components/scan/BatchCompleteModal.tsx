/**
 * Story 14.15: Batch Complete Success Modal
 *
 * Displays after batch transactions are saved successfully.
 * Shows summary of saved transactions with totals and credit usage.
 *
 * @see docs/uxui/mockups/01_views/scan-overlay.html State 3.a
 */
import React from 'react';
import { X, Check, DollarSign, BarChart3, Home } from 'lucide-react';
import type { Transaction } from '../../types/transaction';
import type { HistoryNavigationPayload } from '../../utils/analyticsToHistoryFilters';

export interface BatchCompleteModalProps {
  /** List of saved transactions */
  transactions: Transaction[];
  /** Credits used for this batch */
  creditsUsed: number;
  /** Remaining credits after batch */
  creditsRemaining: number;
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Translation function */
  t: (key: string) => string;
  /** Called when user dismisses the modal (X button) */
  onDismiss: () => void;
  /** Called when user clicks "View History" - navigates to history with current month filter */
  onNavigateToHistory: (payload: HistoryNavigationPayload) => void;
  /** Called when user clicks "Go Home" */
  onGoHome: () => void;
  /** Format currency for display */
  formatCurrency: (amount: number, currency: string) => string;
}

/**
 * BatchCompleteModal Component
 *
 * Shows batch completion success with:
 * - Success checkmark icon
 * - "X Transactions Saved" header
 * - List of transactions with merchant names and amounts
 * - Total batch amount
 * - Credit usage summary
 * - "View History" and "Go Home" buttons
 */
export const BatchCompleteModal: React.FC<BatchCompleteModalProps> = ({
  transactions,
  creditsUsed,
  creditsRemaining,
  theme,
  t,
  onDismiss,
  onNavigateToHistory,
  onGoHome,
  formatCurrency,
}) => {
  const isDark = theme === 'dark';

  // Calculate total amount (assumes all transactions use same currency)
  const currency = transactions[0]?.currency || 'USD';
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.total, 0);

  // Get current date for display
  const currentDate = new Date().toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Handle View History click - navigate to current month's transactions
  const handleViewHistory = () => {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    onNavigateToHistory({
      temporal: {
        level: 'month',
        year,
        month,
      },
    });
  };

  // Theme-based styling
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const textTertiary = isDark ? 'text-slate-500' : 'text-slate-500';
  const bgTertiary = isDark ? 'bg-slate-700' : 'bg-slate-100';
  const borderLight = isDark ? 'border-slate-600' : 'border-slate-200';
  const successBg = isDark ? 'bg-green-900/30' : 'bg-green-50';

  return (
    <div
      className={`${cardBg} rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]`}
      role="dialog"
      aria-labelledby="batch-complete-title"
    >
      {/* Close Button */}
      <button
        onClick={onDismiss}
        className={`absolute top-3 right-3 w-8 h-8 ${bgTertiary} rounded-lg flex items-center justify-center z-10`}
        aria-label={t('close')}
      >
        <X className={textSecondary} size={16} />
      </button>

      {/* Success Icon & Header */}
      <div className="p-5 flex flex-col items-center gap-3">
        <div className={`w-16 h-16 ${successBg} rounded-full flex items-center justify-center`}>
          <Check className="text-green-500" size={32} strokeWidth={3} />
        </div>
        <div className="text-center">
          <h2 id="batch-complete-title" className={`text-xl font-bold ${textPrimary}`}>
            {transactions.length} {t('batchTransactionsSaved')}
          </h2>
          <p className={`text-sm ${textSecondary}`}>
            {t('batchProcessedSuccess')}
          </p>
        </div>
      </div>

      {/* Batch Summary */}
      <div className="px-5 flex-1 overflow-y-auto">
        <div className={`${bgTertiary} rounded-xl p-3.5`}>
          {/* Summary Header */}
          <div className="flex justify-between items-center mb-2.5">
            <span className={`text-xs uppercase tracking-wider ${textTertiary}`}>
              {t('batchSummaryTitle')}
            </span>
            <span className={`text-xs ${textTertiary}`}>
              {currentDate}
            </span>
          </div>

          {/* Transaction List */}
          <div className="space-y-0">
            {transactions.map((tx, index) => (
              <div
                key={tx.id || index}
                className={`flex justify-between items-center py-2 ${
                  index < transactions.length - 1 ? `border-b ${borderLight}` : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className={`text-sm ${textPrimary}`}>
                    {tx.merchant || tx.alias || t('unknownMerchant')}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${textPrimary}`}>
                  {formatCurrency(tx.total, tx.currency || 'USD')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total Section */}
      <div className="px-5 pt-3">
        <div className={`${successBg} rounded-xl p-3.5 flex justify-between items-center`}>
          <div className="flex items-center gap-2">
            <DollarSign className="text-green-500" size={20} />
            <span className="text-sm font-medium text-green-600">
              {t('batchTotal')}
            </span>
          </div>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(totalAmount, currency)}
          </span>
        </div>
      </div>

      {/* Credit Usage */}
      <div className="px-5 pt-3 flex items-center justify-center gap-1.5">
        <span className={`text-xs ${textTertiary}`}>
          {t('creditsUsedRemaining')
            .replace('{used}', String(creditsUsed))
            .replace('{remaining}', String(creditsRemaining))}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="p-5 flex gap-3">
        <button
          onClick={handleViewHistory}
          className={`flex-1 h-12 rounded-xl font-semibold border-2 transition-colors flex items-center justify-center gap-2 ${
            isDark
              ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
              : 'border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BarChart3 size={16} />
          {t('viewHistory')}
        </button>
        <button
          onClick={onGoHome}
          className="flex-1 h-12 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600"
        >
          <Home size={16} />
          {t('goHome')}
        </button>
      </div>
    </div>
  );
};

export default BatchCompleteModal;
