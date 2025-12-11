/**
 * Shared Prompts Library - V2 Multi-Currency & Receipt Types
 *
 * Enhanced prompt that adds:
 * 1. Explicit currency handling for international receipts
 * 2. Receipt type hints to improve extraction accuracy
 *
 * New variables:
 * - {{receiptType}}: Optional hint about what type of document is being scanned
 *
 * Receipt Types Supported:
 * - Physical Receipts: supermarket, restaurant, pharmacy, gas_station, general_store
 * - Service Bills: utility_bill, parking, transport_ticket
 * - Online Purchases: online_purchase, subscription
 * - Financial: credit_card_statement, bank_statement
 * - Default: auto (let AI determine)
 */

import type { PromptConfig } from './types';
import { STORE_CATEGORY_LIST, ITEM_CATEGORY_LIST, DATE_INSTRUCTIONS } from './base';

/**
 * Receipt type categories for user hints.
 * These help the AI understand context before analyzing.
 */
export type ReceiptType =
  // Physical receipts
  | 'supermarket'
  | 'restaurant'
  | 'pharmacy'
  | 'gas_station'
  | 'general_store'
  // Service bills
  | 'utility_bill'
  | 'parking'
  | 'transport_ticket'
  // Online purchases
  | 'online_purchase'
  | 'subscription'
  // Financial documents
  | 'credit_card_statement'
  | 'bank_statement'
  // Default
  | 'auto';

/**
 * Human-readable descriptions for receipt types.
 * Used in prompt construction.
 */
const RECEIPT_TYPE_DESCRIPTIONS: Record<ReceiptType, string> = {
  supermarket: 'a supermarket or grocery store receipt with multiple items',
  restaurant: 'a restaurant bill or food service receipt',
  pharmacy: 'a pharmacy or drugstore receipt',
  gas_station: 'a gas/petrol station receipt',
  general_store: 'a general retail store receipt',
  utility_bill: 'a utility bill (electricity, water, gas, internet)',
  parking: 'a parking ticket or parking receipt',
  transport_ticket: 'a transportation ticket (bus, metro, taxi, ride-share)',
  online_purchase: 'a screenshot or confirmation of an online purchase',
  subscription: 'a subscription service charge or invoice',
  credit_card_statement: 'a credit card statement showing transactions',
  bank_statement: 'a bank account statement',
  auto: 'a receipt or financial document (type will be auto-detected)',
};

/**
 * Common currencies with their context for better number parsing.
 */
export const CURRENCY_CONTEXTS: Record<string, string> = {
  CLP: 'Chilean Peso (CLP) - integers only, no decimals (e.g., 15990)',
  USD: 'US Dollar (USD) - may have cents as decimals (e.g., 15.99 = 1599 cents)',
  EUR: 'Euro (EUR) - may have cents as decimals (e.g., 15.99 = 1599 cents)',
  MXN: 'Mexican Peso (MXN) - may have centavos (e.g., 159.90 = 15990 centavos)',
  ARS: 'Argentine Peso (ARS) - integers common, some decimals',
  COP: 'Colombian Peso (COP) - integers only, no decimals',
  PEN: 'Peruvian Sol (PEN) - may have céntimos (e.g., 15.99 = 1599 céntimos)',
  BRL: 'Brazilian Real (BRL) - may have centavos (e.g., 15.99 = 1599 centavos)',
};

/**
 * Build the V2 prompt with enhanced currency and receipt type support.
 *
 * Variables:
 * - {{currency}}: Currency code with parsing context (e.g., "CLP", "USD")
 * - {{date}}: Today's date in YYYY-MM-DD format
 * - {{receiptType}}: Optional receipt type hint (defaults to "auto")
 *
 * @returns The prompt template with placeholders
 */
function buildV2Prompt(): string {
  return `Analyze the document image. This is {{receiptType}}.

CURRENCY CONTEXT: {{currency}}
Convert all monetary values to INTEGER smallest units (no dots, no commas).
- For currencies with decimals (USD, EUR): multiply by 100 (e.g., $15.99 → 1599)
- For currencies without decimals (CLP, COP): use as-is (e.g., $15990 → 15990)
- Look for currency symbols or codes on the receipt to confirm

TODAY'S DATE: {{date}}
${DATE_INSTRUCTIONS}

OUTPUT FORMAT: Strict JSON only. No markdown, no explanation.
{
  "merchant": "store/service name",
  "date": "YYYY-MM-DD",
  "total": <integer>,
  "currency": "<detected currency code>",
  "category": "<one of: ${STORE_CATEGORY_LIST}>",
  "items": [
    {
      "name": "item description",
      "price": <integer>,
      "quantity": <number, default 1>,
      "category": "<one of: ${ITEM_CATEGORY_LIST}>",
      "subcategory": "optional detail"
    }
  ],
  "metadata": {
    "receiptType": "<detected type>",
    "confidence": <0.0-1.0>
  }
}

EXTRACTION RULES:
1. Extract ALL line items visible on the receipt
2. For utility bills: merchant = provider, single item with service description
3. For credit card statements: each transaction becomes a separate item
4. For online purchases: extract order items from confirmation screenshot
5. If currency on receipt differs from {{currency}}, note it in metadata and still convert to integers
6. Category should match the type of establishment, not the items purchased`;
}

/**
 * V2 Multi-Currency & Receipt Types Prompt
 *
 * Enhanced prompt for testing:
 * - Better international currency handling
 * - Receipt type hints for improved accuracy
 * - Support for non-traditional receipts (statements, online purchases)
 */
export const PROMPT_V2: PromptConfig = {
  id: 'v2-multi-currency-types',
  name: 'Multi-Currency + Receipt Types',
  description:
    'Enhanced prompt with explicit currency context and receipt type hints. Supports international currencies and non-traditional documents (statements, online purchases).',
  version: '2.0.0',
  createdAt: '2025-12-11',
  prompt: buildV2Prompt(),
};

/**
 * Get currency context string for a currency code.
 * Falls back to generic description if currency not in our map.
 *
 * @param currencyCode - ISO 4217 currency code
 * @returns Human-readable currency context for the prompt
 */
export function getCurrencyContext(currencyCode: string): string {
  const upper = currencyCode.toUpperCase();
  return CURRENCY_CONTEXTS[upper] || `${upper} - convert to smallest integer units`;
}

/**
 * Get receipt type description for prompt.
 *
 * @param receiptType - The receipt type hint
 * @returns Human-readable description for the prompt
 */
export function getReceiptTypeDescription(receiptType: ReceiptType = 'auto'): string {
  return RECEIPT_TYPE_DESCRIPTIONS[receiptType] || RECEIPT_TYPE_DESCRIPTIONS.auto;
}

/**
 * Build a complete V2 prompt with all variables replaced.
 * This is a convenience function for testing.
 *
 * @param options - Variable values to substitute
 * @returns Fully resolved prompt string
 */
export function buildCompleteV2Prompt(options: {
  currency: string;
  date: string;
  receiptType?: ReceiptType;
}): string {
  const { currency, date, receiptType = 'auto' } = options;
  const currencyContext = getCurrencyContext(currency);

  return PROMPT_V2.prompt
    .replaceAll('{{currency}}', currencyContext)
    .replaceAll('{{date}}', date)
    .replaceAll('{{receiptType}}', getReceiptTypeDescription(receiptType));
}
