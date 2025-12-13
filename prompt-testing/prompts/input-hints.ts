/**
 * Input Hints - Pre-Scan User Context
 *
 * Defines variables that the USER/APP provides BEFORE scanning:
 * - Currency (how to parse monetary amounts)
 * - Receipt type (what kind of document to expect)
 * - Date context (today's date for relative parsing)
 *
 * These are INPUT hints that help the AI understand the context,
 * NOT part of the AI's output schema.
 *
 * Usage in app:
 *   import { SUPPORTED_CURRENCIES, DEFAULT_INPUT_HINTS } from './prompts';
 *   const hints = { ...DEFAULT_INPUT_HINTS, currency: userSelectedCurrency };
 *
 * The prompt uses {{variableName}} placeholders that get replaced at runtime.
 */

// ============================================================================
// Currency Hints
// ============================================================================

/**
 * Currencies supported by the application.
 * User selects one of these in the app settings or scan advanced options.
 */
export const SUPPORTED_CURRENCIES = ['CLP', 'USD', 'EUR'] as const;

/** Type for supported currency codes */
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Currency display information for UI.
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
 * Extended currency contexts for prompt injection.
 * Includes parsing hints for the AI.
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
 *
 * Think of these as "pre-scan context" that helps the AI understand:
 * - What currency to expect
 * - What type of document it's looking at
 * - What today's date is (for relative date parsing)
 */
export interface InputHints {
  /**
   * Expected currency for the receipt.
   * User selects this in app settings or advanced scan options.
   * AI will convert amounts to this currency's smallest unit.
   */
  currency: SupportedCurrency;

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
   *
   * Examples: 'parking', 'supermarket', 'restaurant', 'utility_bill'
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

/**
 * @deprecated Use InputHints instead. Kept for backwards compatibility.
 */
export type RuntimeVariables = InputHints;

/**
 * @deprecated Use DEFAULT_INPUT_HINTS instead. Kept for backwards compatibility.
 */
export const DEFAULT_RUNTIME_VARIABLES = DEFAULT_INPUT_HINTS;

// ============================================================================
// Variable Placeholders
// ============================================================================

/**
 * Placeholder tokens used in prompts.
 * Format: {{variableName}}
 *
 * These placeholders are replaced with actual values at runtime
 * using the buildPrompt() function in index.ts.
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
 * Check if a currency code is supported.
 */
export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(code.toUpperCase() as SupportedCurrency);
}

/**
 * Get currency parsing context for prompt injection.
 * Falls back to generic message for unsupported currencies.
 */
export function getCurrencyParsingContext(currency: string): string {
  const upper = currency.toUpperCase() as SupportedCurrency;
  return (
    CURRENCY_PARSING_CONTEXT[upper] ||
    `${upper} - convert all amounts to smallest integer units (no decimals)`
  );
}
