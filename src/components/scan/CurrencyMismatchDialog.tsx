/**
 * CurrencyMismatchDialog Component
 *
 * Story 14.15b: V3 Prompt Production Integration
 *
 * Displays when AI-detected currency differs from user's default currency.
 * Allows user to choose which currency to use for the transaction.
 *
 * Features:
 * - Shows AI-detected currency vs user's default
 * - Options to use detected, use default, or cancel
 * - Follows modal overlay pattern from QuickSaveCard
 * - Dark mode support
 * - Accessibility features (ARIA labels, keyboard navigation)
 *
 * @see docs/sprint-artifacts/epic14/stories/story-14.15b-v3-prompt-integration.md
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { AlertCircle, ArrowRight, X } from 'lucide-react';

export interface CurrencyMismatchDialogProps {
  /** AI-detected currency code (e.g., "GBP", "EUR") */
  detectedCurrency: string;
  /** User's default currency code (e.g., "CLP", "USD") */
  userCurrency: string;
  /** Callback when user chooses detected currency */
  onUseDetected: () => void;
  /** Callback when user chooses their default currency */
  onUseDefault: () => void;
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
 * Currency display name mapping for common currencies.
 * Provides user-friendly names for currency codes.
 */
const CURRENCY_NAMES: Record<string, string> = {
  CLP: 'Chilean Peso',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  MXN: 'Mexican Peso',
  ARS: 'Argentine Peso',
  BRL: 'Brazilian Real',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CNY: 'Chinese Yuan',
  KRW: 'Korean Won',
  INR: 'Indian Rupee',
  CHF: 'Swiss Franc',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  PLN: 'Polish Zloty',
  CZK: 'Czech Koruna',
  HUF: 'Hungarian Forint',
  COP: 'Colombian Peso',
  PEN: 'Peruvian Sol',
};

/**
 * Get display name for a currency code.
 */
function getCurrencyDisplayName(code: string): string {
  return CURRENCY_NAMES[code] || code;
}

/**
 * CurrencyMismatchDialog displays when AI detects a different currency than user's default.
 */
export const CurrencyMismatchDialog: React.FC<CurrencyMismatchDialogProps> = ({
  detectedCurrency,
  userCurrency,
  onUseDetected,
  onUseDefault,
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

  const detectedName = getCurrencyDisplayName(detectedCurrency);
  // userCurrencyName is intentionally unused - showing code instead of full name

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="currency-mismatch-title"
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
              isDark ? 'bg-amber-900/30' : 'bg-amber-100'
            }`}
          >
            <AlertCircle
              size={32}
              className={isDark ? 'text-amber-400' : 'text-amber-600'}
            />
          </div>
        </div>

        {/* Title */}
        <h2
          id="currency-mismatch-title"
          className="text-lg font-semibold text-center mb-2"
        >
          {t('currencyMismatchTitle')}
        </h2>

        {/* Message */}
        <p
          className={`text-center mb-6 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
        >
          {t('currencyMismatchMessage').replace('{currency}', detectedName)}
        </p>

        {/* Currency comparison */}
        <div
          className={`flex items-center justify-center gap-3 mb-6 p-4 rounded-xl ${
            isDark ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}
        >
          <div className="text-center">
            <div
              className={`text-xs uppercase tracking-wide mb-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {t('detected')}
            </div>
            <div className="text-xl font-bold text-amber-500">
              {detectedCurrency}
            </div>
          </div>
          <ArrowRight
            size={20}
            className={isDark ? 'text-gray-500' : 'text-gray-400'}
          />
          <div className="text-center">
            <div
              className={`text-xs uppercase tracking-wide mb-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {t('yourDefault')}
            </div>
            <div
              className={`text-xl font-bold ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {userCurrency}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Use detected currency (primary) */}
          <button
            onClick={onUseDetected}
            className="w-full py-3 px-4 rounded-xl font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            {t('useDetectedCurrency').replace('{currency}', detectedCurrency)}
          </button>

          {/* Use default currency (secondary) */}
          <button
            onClick={onUseDefault}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
          >
            {t('useMyDefaultCurrency').replace('{currency}', userCurrency)}
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

export default CurrencyMismatchDialog;
