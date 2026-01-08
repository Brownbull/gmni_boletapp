/**
 * V3 Prompt - Category Standardization
 *
 * Story 14.14b: Unified categories matching src/types/transaction.ts
 *
 * KEY CHANGES from V2:
 * 1. Categories imported from shared/schema (single source of truth)
 * 2. Currency AUTO-DETECTION (no hint from app - AI detects from receipt)
 * 3. Expanded categories (35 store + 37 item)
 * 4. Streamlined prompt text
 *
 * CURRENCY HANDLING:
 * - AI detects currency from receipt (symbols, text, country)
 * - Returns detected currency code or null if uncertain
 * - App compares with user settings and prompts user if mismatch
 *
 * This ensures consistent category values across:
 * - AI extraction → Database storage → Analytics display → History filtering
 */

import type { PromptConfig } from './types';
import {
  STORE_CATEGORY_LIST,
  ITEM_CATEGORY_LIST,
} from '../../shared/schema/categories';
import { DATE_INSTRUCTIONS } from './output-schema';
import { getReceiptTypeDescription } from './v2-multi-currency-receipt-types';
import type { ReceiptType } from './v2-multi-currency-receipt-types';

// ============================================================================
// V3 PROMPT BUILDER
// ============================================================================

/**
 * Build the V3 prompt with unified categories and auto-detect currency.
 *
 * Variables (replaced at runtime):
 * - {{date}}: Today's date in YYYY-MM-DD format
 * - {{receiptType}}: Document type hint (defaults to "auto")
 *
 * NOTE: Currency is NO LONGER a variable - AI auto-detects from receipt.
 */
function buildV3Prompt(): string {
  return `Analyze the document image. This is {{receiptType}}.

CURRENCY DETECTION:
- Detect the currency from the receipt (symbols like $, €, £, ¥, or text like "USD", "EUR", "GBP")
- Look at country/location clues if currency symbol is ambiguous ($ could be USD, CLP, MXN, etc.)
- Return the ISO 4217 currency code (e.g., "USD", "EUR", "GBP", "CLP", "JPY")
- Return null if you cannot confidently determine the currency

PRICE CONVERSION:
- Convert all monetary values to INTEGER smallest units (no dots, no commas)
- For currencies WITH decimals (USD, EUR, GBP, etc.): multiply by 100 (e.g., $15.99 → 1599)
- For currencies WITHOUT decimals (CLP, JPY, KRW, COP): use as-is (e.g., $15,990 → 15990)
- If currency is null, still extract prices as integers based on the format you see

TODAY: {{date}}
${DATE_INSTRUCTIONS}

OUTPUT: Strict JSON only. No markdown, no explanation.
{
  "merchant": "store name",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "total": <integer>,
  "currency": "<detected currency code or null>",
  "category": "<store category>",
  "country": "<country name or null>",
  "city": "<city name or null>",
  "items": [
    {
      "name": "item description (max 50 chars)",
      "price": <integer>,
      "quantity": <number, default 1>,
      "category": "<item category>",
      "subcategory": "optional detail"
    }
  ],
  "metadata": {
    "receiptType": "<detected type>",
    "confidence": <0.0-1.0>
  }
}

STORE CATEGORIES (pick exactly one):
${STORE_CATEGORY_LIST}

ITEM CATEGORIES (pick exactly one per item):
${ITEM_CATEGORY_LIST}

RULES:
1. Extract ALL visible line items (max 100, summarize excess as "Additional Items")
2. Store category = type of establishment (Supermarket, Restaurant, etc.)
3. Item category = what the item IS (Produce, Prepared Food, Electronics, etc.)
4. Use 'Other' only if no category fits
5. Item names max 50 characters - abbreviate if needed
6. Time in 24h format (HH:MM), use "04:04" if not found
7. Extract country/city ONLY from visible receipt text, null if not found
8. Subcategory is optional free-form for extra detail (e.g., "Fresh Fruits", "Craft Beer")
9. Currency can be null if you cannot determine it - the app will ask the user
10. MUST have at least one item: if no line items visible, create one using a keyword from the receipt (e.g., "estacionamiento", "servicio") as name, total as price, and infer both store and item category from that keyword
11. VALIDATION: The total should roughly equal the sum of (item price × quantity) for all items. If discrepancy exceeds 40%, re-check the total for missing or extra digits`;
}

/**
 * V3 Category Standardization Prompt
 *
 * Key improvements:
 * - 35 store categories (up from 13 in V1)
 * - 37 item categories (up from 9 in V1)
 * - Single source of truth: shared/schema/categories.ts
 * - AUTO-DETECT currency (no hint from app)
 */
export const PROMPT_V3: PromptConfig = {
  id: 'v3-category-standardization',
  name: 'Category Standardization',
  description:
    'Unified categories from shared/schema. 35 store + 37 item categories. Auto-detect currency. Total validation rule.',
  version: '3.2.0',
  createdAt: '2026-01-07',
  prompt: buildV3Prompt(),
};

/**
 * Build a complete V3 prompt with all variables replaced.
 * Use this for testing.
 *
 * NOTE: V3 does NOT take a currency parameter - it auto-detects.
 */
export function buildCompleteV3Prompt(options: {
  date: string;
  receiptType?: ReceiptType;
}): string {
  const { date, receiptType = 'auto' } = options;

  return PROMPT_V3.prompt
    .replaceAll('{{date}}', date)
    .replaceAll('{{receiptType}}', getReceiptTypeDescription(receiptType));
}
