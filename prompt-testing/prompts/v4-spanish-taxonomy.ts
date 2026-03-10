/**
 * V4 Prompt - Spanish Taxonomy with Grouped Categories
 *
 * Story 17-3: Update Gemini prompt for new 4-level Spanish taxonomy
 *
 * KEY CHANGES from V3:
 * 1. Categories grouped by parent level (L1 rubros → L2 giros, L3 familias → L4 categorías)
 * 2. Spanish display names alongside English keys (helps Gemini understand Chilean receipts)
 * 3. Chilean-specific disambiguation rules (Feria, Almacén, Botillería, etc.)
 * 4. L2/L4 independence explanation (store type vs item type are independent dimensions)
 * 5. Stricter catch-all rules (Other/OtherItem are last resort)
 *
 * CATEGORY STRUCTURE:
 * - L1 Rubro (12) groups L2 Giro (44) — WHERE you buy
 * - L3 Familia (9) groups L4 Categoría (42) — WHAT you buy
 * - L2 and L4 are independent: any item category can appear at any store type
 */

import type { PromptConfig } from './types';
import {
  STORE_CATEGORIES_GROUPED,
  ITEM_CATEGORIES_GROUPED,
} from '../../shared/schema/categories';
import { DATE_INSTRUCTIONS } from './output-schema';
import { getReceiptTypeDescription } from './v2-multi-currency-receipt-types';
import type { ReceiptType } from './v2-multi-currency-receipt-types';

// ============================================================================
// V4 PROMPT BUILDER
// ============================================================================

/**
 * Build the V4 prompt with grouped Spanish taxonomy and Chilean context.
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
- Detect the currency from the receipt (symbols like $, CLP, or text like "pesos")
- Look at country/location clues if currency symbol is ambiguous ($ could be USD, CLP, MXN, etc.)
- Return the ISO 4217 currency code (e.g., "CLP", "USD", "EUR")
- Return null if you cannot confidently determine the currency

PRICE CONVERSION:
- Convert all monetary values to INTEGER smallest units (no dots, no commas)
- For currencies WITH decimals (USD, EUR, GBP, etc.): multiply by 100 (e.g., $15.99 → 1599)
- For currencies WITHOUT decimals (CLP, JPY, KRW, COP): use as-is (e.g., $15.990 → 15990)
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
  "category": "<store category KEY>",
  "country": "<country name or null>",
  "city": "<city name or null>",
  "items": [
    {
      "name": "item description (max 50 chars)",
      "price": <integer>,
      "quantity": <number, default 1>,
      "category": "<item category KEY>",
      "subcategory": "optional detail"
    }
  ],
  "metadata": {
    "receiptType": "<detected type>",
    "confidence": <0.0-1.0>
  }
}

IMPORTANT: Store category and item categories are INDEPENDENT dimensions.
- Store category (L2 Giro) = the TYPE of establishment on the receipt
- Item category (L4 Categoría) = what each LINE ITEM is, regardless of store type
- A "Supermercado" can sell items from ANY item category
- A "Farmacia" primarily sells "Medications" but may also sell "PersonalCare" or "Snacks"

STORE CATEGORIES — Giro del Negocio (pick exactly one KEY per transaction):
${STORE_CATEGORIES_GROUPED}

ITEM CATEGORIES — Categoría de Producto (pick exactly one KEY per item):
${ITEM_CATEGORIES_GROUPED}

RETURN the English KEY (e.g., "Supermarket", "MeatSeafood"), NOT the Spanish label.

CHILEAN MARKET RULES:
- "Feria" = open-air market selling produce/seafood → OpenMarket (NOT a fair/exhibition)
- "Almacén" / "Negocio" = neighborhood corner store → Almacen (NOT a warehouse)
- "Botillería" = liquor store → LiquorStore
- "Bencinera" / "Copec" / "Shell" / "Petrobras" = gas station → GasStation
- "Kiosko" = small street-level shop (snacks, newspapers, phone cards) → Kiosk
- "Panadería" = bakery (store type, L2) → Bakery; bread items are BreadPastry (L4)
- "Carnicería" = butcher shop (store type, L2) → Butcher; meat items are MeatSeafood (L4)
- "Farmacia" / "Cruz Verde" / "Ahumada" / "Salcobrand" = pharmacy → Pharmacy
- "Ferretería" = hardware store → Hardware
- "Minimarket" / "OK Market" / "Oxxo" = minimarket → Minimarket

FALLBACK RULES:
- "Other" (store) and "OtherItem" (item) are LAST RESORT categories
- Only use them when NO other category fits after reviewing all options
- If confidence is low but a specific category seems plausible, pick the specific category
- Never default to "Other" for common Chilean store types or everyday products

RULES:
1. Extract ALL visible line items (max 100, summarize excess as "Additional Items")
2. Store category = type of establishment (Supermarket, Restaurant, etc.)
3. Item category = what the item IS (Produce, PreparedFood, Technology, etc.)
4. Item names max 50 characters — abbreviate if needed
5. Time in 24h format (HH:MM), use "04:04" if not found
6. Extract country/city ONLY from visible receipt text, null if not found
7. Subcategory is optional free-form for extra detail (e.g., "Frutas Frescas", "Cerveza Artesanal")
8. Currency can be null if you cannot determine it — the app will ask the user
9. MUST have at least one item: if no line items visible, create one using a keyword from the receipt (e.g., "estacionamiento", "servicio") as name, total as price, and infer both store and item category from that keyword
10. VALIDATION: The total should roughly equal the sum of (item price x quantity) for all items. If discrepancy exceeds 40%, re-check the total for missing or extra digits`;
}

/**
 * V4 Spanish Taxonomy Prompt
 *
 * Key improvements over V3:
 * - 44 store categories grouped by 12 rubros (up from flat list)
 * - 42 item categories grouped by 9 familias (up from flat list)
 * - Spanish display names for Chilean receipt context
 * - Chilean market disambiguation rules
 * - L2/L4 independence explanation
 * - Stricter catch-all behavior
 */
export const PROMPT_V4: PromptConfig = {
  id: 'v4-spanish-taxonomy',
  name: 'Spanish Taxonomy',
  description:
    'Grouped categories by rubro/familia. 44 store + 42 item categories with Spanish labels. Chilean market rules.',
  version: '4.0.0',
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
