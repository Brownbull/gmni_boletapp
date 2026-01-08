/**
 * TotalMismatchDialog Component
 *
 * Displays when the extracted total doesn't match the sum of items.
 * Allows user to choose between the extracted total or the calculated items sum.
 *
 * Features:
 * - Shows extracted total vs calculated items sum
 * - Indicates if error appears to be a missing/extra digit
 * - Options to use items sum, keep original, or cancel
 * - Follows modal overlay pattern from CurrencyMismatchDialog
 * - Dark mode support
 * - Accessibility features (ARIA labels, keyboard navigation)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { AlertTriangle, Calculator, ArrowRight, X } from 'lucide-react';
import { TotalValidationResult } from '../../utils/totalValidation';

export interface TotalMismatchDialogProps {
  /** Validation result from totalValidation utility */
  validationResult: TotalValidationResult;
  /** Currency code for formatting */
  currency: string;
  /** Callback when user chooses to use the items sum */
  onUseItemsSum: () => void;
  /** Callback when user chooses to keep the extracted total */
  onKeepOriginal: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Theme for styling */
  theme: 'light' | 'dark';
  /** Translation function */
  t: (key: string) => string;
  /** Whether dialog is visible */
  isOpen: boolean;
}

/**
 * Format a number as currency string for display.
 */
function formatCurrency(amount: number, currency: string): string {
  // For CLP, COP, JPY, KRW - no decimals
  const noDecimalCurrencies = ['CLP', 'COP', 'JPY', 'KRW'];
  const useDecimals = !noDecimalCurrencies.includes(currency);

  try {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: useDecimals ? 2 : 0,
      maximumFractionDigits: useDecimals ? 2 : 0,
    }).format(useDecimals ? amount / 100 : amount);
  } catch {
    // Fallback if currency code is invalid
    return `$${amount.toLocaleString()}`;
  }
}

/**
 * TotalMismatchDialog displays when extracted total doesn't match items sum.
 */
export const TotalMismatchDialog: React.FC<TotalMismatchDialogProps> = ({
  validationResult,
  currency,
  onUseItemsSum,
  onKeepOriginal,
  onCancel,
  theme,
  t,
  isOpen,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      dialogRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const { extractedTotal, itemsSum, discrepancyPercent, errorType } = validationResult;
  const formattedExtracted = formatCurrency(extractedTotal, currency);
  const formattedItemsSum = formatCurrency(itemsSum, currency);

  // Get the hint message based on error type
  const getHintMessage = () => {
    if (errorType === 'missing_digit') {
      return t('totalMismatchMissingDigit');
    }
    if (errorType === 'extra_digit') {
      return t('totalMismatchExtraDigit');
    }
    return null;
  };

  const hintMessage = getHintMessage();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="total-mismatch-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative w-full max-w-sm rounded-2xl shadow-xl p-6 ${
          isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
        style={{
          animation: 'slideUp 0.2s ease-out',
        }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isDark
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
          aria-label={t('close')}
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`p-3 rounded-full ${
              isDark ? 'bg-orange-900/30' : 'bg-orange-100'
            }`}
          >
            <AlertTriangle
              size={32}
              className={isDark ? 'text-orange-400' : 'text-orange-600'}
            />
          </div>
        </div>

        {/* Title */}
        <h2
          id="total-mismatch-title"
          className="text-lg font-semibold text-center mb-2"
        >
          {t('totalMismatchTitle')}
        </h2>

        {/* Message */}
        <p
          className={`text-center mb-4 text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          {t('totalMismatchMessage')
            .replace('{extractedTotal}', formattedExtracted)
            .replace('{itemsSum}', formattedItemsSum)}
        </p>

        {/* Hint message if digit error detected */}
        {hintMessage && (
          <p
            className={`text-center mb-4 text-sm font-medium ${
              isDark ? 'text-orange-300' : 'text-orange-600'
            }`}
          >
            {hintMessage}
          </p>
        )}

        {/* Total comparison */}
        <div
          className={`flex items-center justify-center gap-3 mb-4 p-4 rounded-xl ${
            isDark ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}
        >
          <div className="text-center">
            <div
              className={`text-xs uppercase tracking-wide mb-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {t('total')}
            </div>
            <div className={`text-lg font-bold ${
              errorType !== 'none'
                ? (isDark ? 'text-orange-400' : 'text-orange-600')
                : (isDark ? 'text-gray-300' : 'text-gray-700')
            }`}>
              {formattedExtracted}
            </div>
          </div>
          <ArrowRight
            size={20}
            className={isDark ? 'text-gray-500' : 'text-gray-400'}
          />
          <div className="text-center">
            <div
              className={`text-xs uppercase tracking-wide mb-1 flex items-center justify-center gap-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <Calculator size={12} />
              {t('itemsSum')}
            </div>
            <div
              className={`text-lg font-bold ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`}
            >
              {formattedItemsSum}
            </div>
          </div>
        </div>

        {/* Discrepancy info */}
        <div
          className={`text-center text-xs mb-6 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          {discrepancyPercent}% {t('diff').toLowerCase()}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Use items sum (primary - recommended) */}
          <button
            onClick={onUseItemsSum}
            className="w-full py-3 px-4 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            {t('useItemsSum').replace('{total}', formattedItemsSum)}
          </button>

          {/* Keep original (secondary) */}
          <button
            onClick={onKeepOriginal}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {t('useExtractedTotal').replace('{total}', formattedExtracted)}
          </button>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TotalMismatchDialog;
