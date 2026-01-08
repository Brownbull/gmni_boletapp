/**
 * Shared Prompts Library - V3 Category Standardization
 *
 * Story 14.14b: Category Standardization
 *
 * MAJOR CHANGES from V2:
 * 1. Expanded item categories from 9 to 32 (matches src/types/transaction.ts)
 * 2. Expanded store categories from 13 to 32
 * 3. All categories in English (translation at UI layer only)
 * 4. Better alignment with Analytics filtering system
 *
 * This ensures consistent category values across:
 * - AI extraction → Database storage → Analytics display → History filtering
 */

import type { PromptConfig } from './types';
import { DATE_INSTRUCTIONS, CURRENCY_CONTEXTS } from './v2-multi-currency-receipt-types';

// ============================================================================
// V3 EXPANDED CATEGORY SETS
// Must match src/types/transaction.ts exactly
// ============================================================================

/**
 * Store categories (32 total) - matches src/types/transaction.ts StoreCategory
 */
export const V3_STORE_CATEGORIES = [
  // Food & Dining (most common)
  'Supermarket',
  'Restaurant',
  'Bakery',
  'Butcher',
  'StreetVendor',
  // Health & Wellness
  'Pharmacy',
  'Medical',
  'Veterinary',
  'HealthBeauty',
  // Retail - General
  'Bazaar',
  'Clothing',
  'Electronics',
  'HomeGoods',
  'Furniture',
  'Hardware',
  'GardenCenter',
  // Retail - Specialty
  'PetShop',
  'BooksMedia',
  'OfficeSupplies',
  'SportsOutdoors',
  'ToysGames',
  'Jewelry',
  'Optical',
  // Automotive & Transport
  'Automotive',
  'GasStation',
  'Transport',
  // Services & Finance
  'Services',
  'BankingFinance',
  'Education',
  'TravelAgency',
  // Hospitality & Entertainment
  'HotelLodging',
  'Entertainment',
  // Other
  'CharityDonation',
  'Other',
] as const;

/**
 * Item categories (32 total) - matches src/types/transaction.ts ItemCategory
 */
export const V3_ITEM_CATEGORIES = [
  // Food - Fresh
  'Produce',
  'Meat & Seafood',
  'Bakery',
  'Dairy & Eggs',
  // Food - Packaged
  'Pantry',
  'Frozen Foods',
  'Snacks',
  'Beverages',
  'Alcohol',
  // Health & Personal
  'Health & Beauty',
  'Personal Care',
  'Pharmacy',
  'Supplements',
  'Baby Products',
  // Household
  'Cleaning Supplies',
  'Household',
  'Pet Supplies',
  // Non-Food Retail
  'Clothing',
  'Electronics',
  'Hardware',
  'Garden',
  'Automotive',
  'Sports & Outdoors',
  'Toys & Games',
  'Books & Media',
  'Office & Stationery',
  'Crafts & Hobbies',
  'Furniture',
  // Services & Fees
  'Service',
  'Tax & Fees',
  'Tobacco',
  // Catch-all
  'Other',
] as const;

export const V3_STORE_CATEGORY_LIST = V3_STORE_CATEGORIES.join(', ');
export const V3_ITEM_CATEGORY_LIST = V3_ITEM_CATEGORIES.join(', ');

// ============================================================================
// V3 PROMPT BUILDER
// ============================================================================

/**
 * Build the V3 prompt with expanded categories and streamlined instructions.
 *
 * Variables:
 * - {{currency}}: Currency code with parsing context
 * - {{date}}: Today's date in YYYY-MM-DD format
 * - {{receiptType}}: Optional receipt type hint (defaults to "auto")
 */
function buildV3Prompt(): string {
  return `Analyze the document image. This is {{receiptType}}.

CURRENCY: {{currency}}
Convert all monetary values to INTEGER smallest units (no dots, no commas).
- Currencies with decimals (USD, EUR): multiply by 100 (e.g., $15.99 → 1599)
- Currencies without decimals (CLP, COP): use as-is (e.g., $15990 → 15990)

TODAY: {{date}}
${DATE_INSTRUCTIONS}

OUTPUT: Strict JSON only. No markdown, no explanation.
{
  "merchant": "store name",
  "date": "YYYY-MM-DD",
  "total": <integer>,
  "currency": "<detected currency code>",
  "category": "<store category>",
  "items": [
    {
      "name": "item description",
      "price": <integer>,
      "quantity": <number, default 1>,
      "category": "<item category>",
      "subcategory": "optional detail"
    }
  ]
}

STORE CATEGORIES (pick one):
${V3_STORE_CATEGORY_LIST}

ITEM CATEGORIES (pick one per item):
${V3_ITEM_CATEGORY_LIST}

RULES:
1. Extract ALL visible line items
2. Category = type of establishment (not items purchased)
3. Item category = what the item IS (food, electronics, etc.)
4. Use 'Other' only if no category fits`;
}

/**
 * V3 Category Standardization Prompt
 *
 * Key improvements:
 * - 32 store categories (up from 13)
 * - 32 item categories (up from 9)
 * - Consistent with src/types/transaction.ts
 * - Streamlined instructions (shorter prompt)
 */
export const PROMPT_V3: PromptConfig = {
  id: 'v3-category-standardization',
  name: 'Category Standardization',
  description:
    'Expanded categories (32 store + 32 item) matching src/types/transaction.ts. Ensures consistent filtering in Analytics/History.',
  version: '3.0.0',
  createdAt: '2026-01-06',
  prompt: buildV3Prompt(),
};

/**
 * Get currency context string for a currency code.
 * Re-exported from v2 for convenience.
 */
export function getCurrencyContext(currencyCode: string): string {
  const upper = currencyCode.toUpperCase();
  return CURRENCY_CONTEXTS[upper] || `${upper} - convert to smallest integer units`;
}

/**
 * Receipt type descriptions for V3.
 */
const V3_RECEIPT_TYPE_DESCRIPTIONS: Record<string, string> = {
  supermarket: 'a supermarket or grocery store receipt',
  restaurant: 'a restaurant bill or food service receipt',
  pharmacy: 'a pharmacy or drugstore receipt',
  gas_station: 'a gas/petrol station receipt',
  general_store: 'a general retail store receipt',
  utility_bill: 'a utility bill (electricity, water, gas, internet)',
  parking: 'a parking ticket or parking receipt',
  transport_ticket: 'a transportation ticket',
  online_purchase: 'an online purchase confirmation',
  subscription: 'a subscription service charge',
  auto: 'a receipt or financial document',
};

/**
 * Get receipt type description for prompt.
 */
export function getReceiptTypeDescription(receiptType: string = 'auto'): string {
  return V3_RECEIPT_TYPE_DESCRIPTIONS[receiptType] || V3_RECEIPT_TYPE_DESCRIPTIONS.auto;
}

/**
 * Build a complete V3 prompt with all variables replaced.
 * Use this for testing.
 */
export function buildCompleteV3Prompt(options: {
  currency: string;
  date: string;
  receiptType?: string;
}): string {
  const { currency, date, receiptType = 'auto' } = options;
  const currencyContext = getCurrencyContext(currency);

  return PROMPT_V3.prompt
    .replaceAll('{{currency}}', currencyContext)
    .replaceAll('{{date}}', date)
    .replaceAll('{{receiptType}}', getReceiptTypeDescription(receiptType));
}
