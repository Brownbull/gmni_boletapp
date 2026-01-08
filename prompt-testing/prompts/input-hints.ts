/**
 * Input Hints - Pre-Scan User Context
 *
 * Defines variables that the USER/APP provides BEFORE scanning:
 * - Currency (how to parse monetary amounts)
 * - Receipt type (what kind of document to expect)
 * - Date context (today's date for relative parsing)
 *
 * Currency definitions are imported from the unified schema.
 * See: shared/schema/currencies.ts
 */

// ============================================================================
// RE-EXPORT FROM UNIFIED SCHEMA
// ============================================================================

export {
  CURRENCIES,
  CURRENCY_CODES,
  CURRENCIES_WITH_CENTS,
  CURRENCIES_WITHOUT_CENTS,
  getCurrencyPromptContext,
  isSupportedCurrency,
  getCurrency,
} from '../../shared/schema/currencies';

export type {
  CurrencyDefinition,
  CurrencyCode,
} from '../../shared/schema/currencies';

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

import { getCurrencyPromptContext } from '../../shared/schema/currencies';

/**
 * @deprecated Use CURRENCY_CODES from unified schema
 * Kept for backward compatibility with existing code.
 */
export const SUPPORTED_CURRENCIES = ['CLP', 'USD', 'EUR'] as const;

/** @deprecated Use CurrencyCode from unified schema */
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * @deprecated Use CURRENCIES from unified schema
 * Kept for backward compatibility.
 */
export const CURRENCY_INFO: Record<
  SupportedCurrency,
  { name: string; symbol: string; decimals: boolean }
> = {
  CLP: { name: 'Chilean Peso', symbol: '$', decimals: false },
  USD: { name: 'US Dollar', symbol: '$', decimals: true },
  EUR: { name: 'Euro', symbol: '€', decimals: true },
};

/**
 * @deprecated Use getCurrencyPromptContext from unified schema
 * Kept for backward compatibility.
 */
export const CURRENCY_PARSING_CONTEXT: Record<SupportedCurrency, string> = {
  CLP: 'Chilean Peso (CLP) - integers only, no decimals. Example: $15.990 → 15990',
  USD: 'US Dollar (USD) - has cents. Multiply by 100. Example: $15.99 → 1599',
  EUR: 'Euro (EUR) - has cents. Multiply by 100. Example: €15.99 → 1599',
};

// ============================================================================
// Input Hints Interface
// ============================================================================

/**
 * Hints injected into the prompt at scan time.
 * These come from app settings or user selection, NOT from the receipt.
 */
export interface InputHints {
  /**
   * Expected currency for the receipt.
   * User selects this in app settings or advanced scan options.
   * AI will convert amounts to this currency's smallest unit.
   */
  currency: string;

  /**
   * Today's date in YYYY-MM-DD format.
   * Used for date parsing context (e.g., "closest to today").
   * Automatically set by the app.
   */
  date: string;

  /**
   * Optional hint about the receipt type.
   * Can improve extraction accuracy for specific document types.
   * Default: 'auto' (let AI determine)
   */
  receiptType?: string;
}

/**
 * Default input hints.
 * App should override these based on user settings.
 */
export const DEFAULT_INPUT_HINTS: InputHints = {
  currency: 'CLP',
  date: new Date().toISOString().split('T')[0],
  receiptType: 'auto',
};

// ============================================================================
// Backwards Compatibility Aliases
// ============================================================================

/** @deprecated Use InputHints instead */
export type RuntimeVariables = InputHints;

/** @deprecated Use DEFAULT_INPUT_HINTS instead */
export const DEFAULT_RUNTIME_VARIABLES = DEFAULT_INPUT_HINTS;

// ============================================================================
// Variable Placeholders
// ============================================================================

/**
 * Placeholder tokens used in prompts.
 * Format: {{variableName}}
 */
export const VARIABLE_PLACEHOLDERS = {
  currency: '{{currency}}',
  date: '{{date}}',
  receiptType: '{{receiptType}}',
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * @deprecated Use getCurrencyPromptContext from unified schema
 */
export function getCurrencyParsingContext(currency: string): string {
  return getCurrencyPromptContext(currency);
}
