/**
 * Story 12.4: Credit Warning System - Credit Warning Dialog
 *
 * Modal dialog that shows before batch processing begins.
 * Displays credit cost, available credits, and post-batch remaining.
 * Blocks processing if insufficient credits.
 *
 * @see docs/sprint-artifacts/epic12/story-12.4-credit-warning-system.md
 */
import React from 'react';
import { AlertTriangle, XCircle, Coins, ArrowRight, MinusCircle } from 'lucide-react';
import type { CreditCheckResult } from '../../services/creditService';
import { isLowCreditsWarning } from '../../services/creditService';

export interface CreditWarningDialogProps {
  /** Credit check result from creditService */
  creditCheck: CreditCheckResult;
  /** Number of receipts in the batch */
  receiptCount: number;
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Translation function */
  t: (key: string) => string;
  /** Called when user confirms to proceed */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Optional: Called when user wants to reduce batch size (insufficient credits mode) */
  onReduceBatch?: () => void;
  /** Optional: Called when user wants to get more credits */
  onGetMoreCredits?: () => void;
}

/**
 * CreditWarningDialog Component
 *
 * Two modes:
 * 1. Sufficient credits: Shows warning with credit usage and Continuar/Cancelar buttons
 * 2. Insufficient credits: Shows error with options to reduce batch or get more credits
 *
 * @example
 * ```tsx
 * <CreditWarningDialog
 *   creditCheck={checkCreditSufficiency(userCredits, batchImages.length)}
 *   receiptCount={batchImages.length}
 *   theme="light"
 *   t={t}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 *   onReduceBatch={handleReduceBatch}
 * />
 * ```
 */
export const CreditWarningDialog: React.FC<CreditWarningDialogProps> = ({
  creditCheck,
  receiptCount,
  theme,
  t,
  onConfirm,
  onCancel,
  onReduceBatch,
  onGetMoreCredits,
}) => {
  const isDark = theme === 'dark';
  const { sufficient, available, required, remaining, maxProcessable } = creditCheck;

  // Theme-aware colors
  const overlayBg = 'bg-black/50';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const cardBorder = isDark ? 'border-slate-700' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const textMuted = isDark ? 'text-slate-500' : 'text-slate-400';

  // Status-specific colors
  const warningBg = isDark ? 'bg-amber-900/30' : 'bg-amber-50';
  const warningBorder = isDark ? 'border-amber-700' : 'border-amber-200';
  const warningText = isDark ? 'text-amber-400' : 'text-amber-700';
  const warningIcon = isDark ? 'text-amber-400' : 'text-amber-500';

  const errorBg = isDark ? 'bg-red-900/30' : 'bg-red-50';
  const errorBorder = isDark ? 'border-red-700' : 'border-red-200';
  const errorText = isDark ? 'text-red-400' : 'text-red-700';
  const errorIcon = isDark ? 'text-red-400' : 'text-red-500';

  const successBg = isDark ? 'bg-green-900/30' : 'bg-green-50';
  const successBorder = isDark ? 'border-green-700' : 'border-green-200';
  const successText = isDark ? 'text-green-400' : 'text-green-700';

  // Determine if this is a low credits warning (but still processable)
  const showLowCreditsWarning = sufficient && isLowCreditsWarning(available, required);

  return (
    <div
      className={`fixed inset-0 ${overlayBg} flex items-center justify-center z-50 p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credit-warning-title"
    >
      <div
        className={`w-full max-w-sm rounded-2xl border ${cardBorder} ${cardBg} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3 mb-4">
            {sufficient ? (
              <div className={`p-2 rounded-full ${warningBg}`}>
                <AlertTriangle className={warningIcon} size={24} />
              </div>
            ) : (
              <div className={`p-2 rounded-full ${errorBg}`}>
                <XCircle className={errorIcon} size={24} />
              </div>
            )}
            <h2
              id="credit-warning-title"
              className={`text-lg font-semibold ${textPrimary}`}
            >
              {sufficient ? t('creditWarningTitle') : t('insufficientCreditsTitle')}
            </h2>
          </div>

          {/* Content based on mode */}
          {sufficient ? (
            /* Sufficient credits mode */
            <div className="space-y-4">
              {/* Batch description */}
              <p className={`text-sm ${textSecondary}`}>
                {t('batchWillUse')
                  .replace('{count}', String(receiptCount))
                  .replace('{credits}', String(required))}
              </p>

              {/* Credit breakdown card */}
              <div className={`rounded-xl border ${cardBorder} p-4 space-y-3`}>
                {/* Credits required */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MinusCircle size={18} className={textMuted} />
                    <span className={`text-sm ${textSecondary}`}>{t('creditsRequired')}</span>
                  </div>
                  <span className={`text-lg font-bold ${textPrimary}`}>{required}</span>
                </div>

                {/* Available credits */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins size={18} className={textMuted} />
                    <span className={`text-sm ${textSecondary}`}>{t('creditsAvailable')}</span>
                  </div>
                  <span className={`text-lg font-semibold ${textPrimary}`}>{available}</span>
                </div>

                {/* Divider */}
                <hr className={isDark ? 'border-slate-700' : 'border-slate-200'} />

                {/* Remaining after batch */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowRight size={18} className={textMuted} />
                    <span className={`text-sm ${textSecondary}`}>{t('creditsAfterBatch')}</span>
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      showLowCreditsWarning ? warningText : successText
                    }`}
                  >
                    {remaining}
                  </span>
                </div>
              </div>

              {/* Low credits warning banner */}
              {showLowCreditsWarning && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${warningBorder} ${warningBg}`}
                  role="alert"
                >
                  <AlertTriangle size={18} className={warningIcon} />
                  <span className={`text-sm ${warningText}`}>
                    {t('lowCreditsWarning')}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Insufficient credits mode */
            <div className="space-y-4">
              {/* Error message */}
              <div className={`p-4 rounded-xl border ${errorBorder} ${errorBg}`}>
                <p className={`text-sm ${errorText}`}>
                  {t('insufficientCreditsMessage')
                    .replace('{required}', String(required))
                    .replace('{available}', String(available))}
                </p>
              </div>

              {/* Suggestion */}
              {maxProcessable > 0 && (
                <div className={`p-4 rounded-xl border ${successBorder} ${successBg}`}>
                  <p className={`text-sm ${successText}`}>
                    {t('canProcessPartial').replace('{count}', String(maxProcessable))}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={`p-4 pt-0 space-y-3`}>
          {sufficient ? (
            /* Sufficient credits buttons */
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold border-2 transition-colors ${
                  isDark
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                {t('continue')}
              </button>
            </div>
          ) : (
            /* Insufficient credits buttons */
            <>
              <div className="flex gap-3">
                {maxProcessable > 0 && onReduceBatch && (
                  <button
                    onClick={onReduceBatch}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    {t('reduceBatch')}
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold border-2 transition-colors ${
                    isDark
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t('cancel')}
                </button>
              </div>
              {onGetMoreCredits && (
                <button
                  onClick={onGetMoreCredits}
                  className={`w-full py-2.5 text-sm font-medium ${
                    isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  } transition-colors`}
                >
                  {t('getMoreCredits')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditWarningDialog;
