/**
 * V4 Prompt - 4-Level Category Taxonomy
 *
 * Story 17-3: 4-level taxonomy (L1 rubro → L2 giro, L3 familia → L4 categoria)
 * Story 18-8: Added unitPrice/totalPrice disambiguation, English-only prompt cleanup
 *
 * KEY CHANGES from V3:
 * 1. Expanded categories (44 store + 42 item) from shared/schema
 * 2. Store and item categories are independent dimensions
 * 3. Local term disambiguation loaded from locale files
 * 4. unitPrice + totalPrice extraction with quantity logic
 * 5. Stricter catch-all rules (Other/OtherItem are last resort)
 *
 * CATEGORY STRUCTURE:
 * - L2 (44 store categories) — WHERE you buy — prompt picks one per transaction
 * - L4 (42 item categories) — WHAT you buy — prompt picks one per item
 * - L1/L3 grouping is applied post-extraction in app logic, not in the prompt
 *
 * NOTE: The file name "v4-spanish-taxonomy" is historical. The prompt is English-only.
 * The "spanish taxonomy" refers to the 4-level hierarchy design (rubro/giro/familia/categoria).
 */

import type { PromptConfig } from './types';
import {
  STORE_CATEGORY_LIST,
  ITEM_CATEGORY_LIST,
} from '../../shared/schema/categories';
import { CL_LOCAL_TERMS } from '../../shared/schema/locale/cl';
import { DATE_INSTRUCTIONS } from './output-schema';
import { getReceiptTypeDescription } from './v2-multi-currency-receipt-types';
import type { ReceiptType } from './v2-multi-currency-receipt-types';

// ============================================================================
// V4 PROMPT BUILDER
// ============================================================================

/**
 * Build the V4 prompt with flat category lists and locale disambiguation.
 *
 * Variables (replaced at runtime):
 * - {{date}}: Today's date in YYYY-MM-DD format
 * - {{receiptType}}: Document type hint (defaults to "auto")
 *
 * NOTE: Currency is NOT a variable — AI auto-detects from receipt (same as V3).
 */
function buildV4Prompt(): string {
  return `Analyze the document image. This is {{receiptType}}.

CURRENCY DETECTION:
- Detect the currency from the receipt (symbols like $, €, £, ¥, or text like "USD", "EUR", "GBP")
- Look at country/location clues if currency symbol is ambiguous ($ could be USD, CLP, MXN, etc.)
- Return the ISO 4217 currency code (e.g., "USD", "EUR", "GBP", "CLP", "JPY")
- Return null if you cannot confidently determine the currency

PRICE CONVERSION:
- Convert all monetary values to INTEGER smallest units (no dots, no commas)
- For currencies WITH decimals (USD, EUR, GBP, etc.): multiply by 100 (e.g., $15.99 → 1599)
- For currencies WITHOUT decimals (CLP, JPY, KRW, COP): use as-is (e.g., $15,990 → 15990, $15.990 → 15990)
- If currency is null, still extract prices as integers based on the format you see

TODAY: {{date}}
${DATE_INSTRUCTIONS}

OUTPUT: Strict JSON only. No markdown, no explanation.

"total" = the transaction grand total (sum of everything on the receipt).
"totalPrice" = the line total for a single item (cost of that item times its quantity).
These are different values at different levels — do not confuse them.

{
  "merchant": "store name",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "total": <integer, transaction grand total>,
  "currency": "<detected currency code or null>",
  "category": "<store category>",
  "country": "<country name or null>",
  "city": "<city name or null>",
  "items": [
    {
      "name": "item description (max 50 chars)",
      "unitPrice": <integer, price per single unit>,
      "totalPrice": <integer, line total for this item>,
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

IMPORTANT: Store category and item categories are INDEPENDENT dimensions.
- Store category = the TYPE of establishment on the receipt (where you buy)
- Item category = what each LINE ITEM is, regardless of store type (what you buy)
- A supermarket can sell items from ANY item category
- A pharmacy primarily sells medications but may also sell personal care or snacks

STORE CATEGORIES (pick exactly one per transaction):
${STORE_CATEGORY_LIST}

ITEM CATEGORIES (pick exactly one per item):
${ITEM_CATEGORY_LIST}

PRICE LOGIC:
- For each item, default to: unitPrice = totalPrice, quantity = 1
- If the receipt shows a quantity greater than 1 (e.g., "4x", "4 UN", "QTY: 4"):
  extract the actual quantity, and unitPrice = totalPrice divided by quantity
- Example: receipt shows "4 x $2,000 = $8,000" → unitPrice=2000, quantity=4, totalPrice=8000
- Example: receipt shows "MILK $1,290" → unitPrice=1290, quantity=1, totalPrice=1290
- If only one price is visible per line, set both unitPrice and totalPrice to that value
- If a multiplier like "2x" appears, the larger number is totalPrice

FALLBACK RULES:
- "Other" (store) and "OtherItem" (item) are LAST RESORT categories
- Only use them when NO other category fits after reviewing all options
- If confidence is low but a specific category seems plausible, pick the specific category

LOCAL TERM DISAMBIGUATION:
${CL_LOCAL_TERMS}

RULES:
1. Extract ALL visible line items (max 100, summarize excess as "Additional Items")
2. Store category = type of establishment (Supermarket, Restaurant, etc.)
3. Item category = what the item IS (Produce, PreparedFood, Technology, etc.)
4. Item names max 50 characters — abbreviate if needed
5. Time in 24h format (HH:MM), use "04:04" if not found
6. Extract country/city ONLY from visible receipt text, null if not found
7. Subcategory is optional free-form for extra detail (e.g., "Fresh Fruits", "Craft Beer")
8. Currency can be null if you cannot determine it — the app will ask the user
9. MUST have at least one item: if no line items visible, create one using a keyword from the receipt as name, total as totalPrice, and infer both store and item category from that keyword (see LOCAL TERM DISAMBIGUATION for common keywords)
10. VALIDATION: The transaction total should roughly equal the sum of all items' totalPrice values. Similarly, each item's unitPrice x quantity should approximately equal its totalPrice. If discrepancy exceeds 40%, re-check the total for missing or extra digits`;
}

/**
 * V4 Category Taxonomy Prompt
 *
 * Key improvements over V3:
 * - 44 store categories (up from 35 in V3)
 * - 42 item categories (up from 37 in V3)
 * - unitPrice + totalPrice extraction with quantity logic
 * - Local term disambiguation loaded from locale data files
 * - Store/item category independence explanation
 * - Stricter catch-all behavior
 *
 * NOTE: Prompt ID "v4-spanish-taxonomy" is historical — the prompt is English-only.
 */
export const PROMPT_V4: PromptConfig = {
  id: 'v4-spanish-taxonomy',
  name: 'Category Taxonomy V4',
  description:
    '44 store + 42 item categories. unitPrice/totalPrice extraction. Local term disambiguation. English-only prompt.',
  version: '4.1.0',
  createdAt: '2026-03-09',
  prompt: buildV4Prompt(),
};

/**
 * Build a complete V4 prompt with all variables replaced.
 * Use this for testing.
 *
 * NOTE: V4 does NOT take a currency parameter — it auto-detects (same as V3).
 */
export function buildCompleteV4Prompt(options: {
  date: string;
  receiptType?: ReceiptType;
}): string {
  const { date, receiptType = 'auto' } = options;

  return PROMPT_V4.prompt
    .replaceAll('{{date}}', date)
    .replaceAll('{{receiptType}}', getReceiptTypeDescription(receiptType));
}
