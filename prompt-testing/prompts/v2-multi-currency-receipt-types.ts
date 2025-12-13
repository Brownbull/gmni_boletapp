/**
 * Shared Prompts Library - V2 Multi-Currency & Receipt Types
 *
 * Enhanced prompt that adds:
 * 1. Explicit currency handling for international receipts
 * 2. Receipt type hints to improve extraction accuracy
 * 3. Location extraction (country/city from receipt)
 *
 * Runtime Variables (injected by app at scan time):
 * - {{currency}}: User-selected currency with parsing context
 * - {{date}}: Today's date for date parsing hints
 * - {{receiptType}}: Optional hint about document type
 *
 * Extracted Fields (from receipt, not injected):
 * - country: Extracted from receipt address/text if visible
 * - city: Extracted from receipt address/text if visible
 *
 * Receipt Types Supported (35+ types organized by category):
 * - Grocery & Food: supermarket, restaurant, cafe, bar, bakery
 * - Retail: general_store, department_store, clothing, electronics, furniture, bookstore
 * - Health: pharmacy, medical_clinic, dental_clinic, optical_store
 * - Automotive: gas_station, auto_repair, car_wash
 * - Travel: hotel, car_rental, airline_ticket
 * - Entertainment: movie_theater, concert_ticket, event_ticket, museum_entry
 * - Services: utility_bill, parking, transport_ticket, cleaning, home_improvement
 * - Fitness: gym_membership, spa_service
 * - Education: tuition_payment
 * - Government: tax_payment, court_fee
 * - Other: donation_receipt, online_purchase, subscription
 * - Default: auto (let AI determine)
 *
 * NOT Supported (multi-transaction documents):
 * - Credit card statements (contain multiple transactions)
 * - Bank statements (contain multiple transactions)
 *
 * @see runtime-variables.ts for app-injectable variables configuration
 */

import type { PromptConfig } from './types';
import { STORE_CATEGORY_LIST, ITEM_CATEGORY_LIST, DATE_INSTRUCTIONS } from './output-schema';
import { CURRENCY_PARSING_CONTEXT } from './input-hints';

/**
 * Receipt type categories for user hints.
 * These help the AI understand context before analyzing.
 *
 * Grouped by category for easy reference:
 * - Grocery & Food: supermarket, restaurant, cafe, bar, bakery
 * - Retail: general_store, department_store, clothing_store, electronics_store, furniture_store, bookstore
 * - Health: pharmacy, medical_clinic, dental_clinic, optical_store
 * - Automotive: gas_station, auto_repair, car_wash
 * - Travel: hotel, car_rental, airline_ticket
 * - Entertainment: movie_theater, concert_ticket, event_ticket, museum_entry
 * - Services: utility_bill, parking, transport_ticket, cleaning_service, home_improvement
 * - Fitness: gym_membership, spa_service
 * - Education: tuition_payment
 * - Government: tax_payment, court_fee
 * - Other: donation_receipt, online_purchase, subscription
 */
export const RECEIPT_TYPES = [
  // ── Grocery & Food ──
  'supermarket',
  'restaurant',
  'cafe',
  'bar',
  'bakery',

  // ── Retail Stores ──
  'general_store',
  'department_store',
  'clothing_store',
  'electronics_store',
  'furniture_store',
  'bookstore',

  // ── Health & Medical ──
  'pharmacy',
  'medical_clinic',
  'dental_clinic',
  'optical_store',

  // ── Automotive ──
  'gas_station',
  'auto_repair',
  'car_wash',

  // ── Travel & Accommodation ──
  'hotel',
  'car_rental',
  'airline_ticket',

  // ── Entertainment & Events ──
  'movie_theater',
  'concert_ticket',
  'event_ticket',
  'museum_entry',

  // ── Services & Bills ──
  'utility_bill',
  'parking',
  'transport_ticket',
  'cleaning_service',
  'home_improvement',

  // ── Health & Fitness ──
  'gym_membership',
  'spa_service',

  // ── Education ──
  'tuition_payment',

  // ── Government & Legal ──
  'tax_payment',
  'court_fee',

  // ── Donations & Other ──
  'donation_receipt',
  'online_purchase',
  'subscription',

  // ── Default ──
  'auto',
] as const;

export type ReceiptType = (typeof RECEIPT_TYPES)[number];

/**
 * Human-readable descriptions for receipt types.
 * Used in prompt construction to give AI context about the document.
 */
const RECEIPT_TYPE_DESCRIPTIONS: Record<ReceiptType, string> = {
  // ── Grocery & Food ──
  supermarket: 'a supermarket or grocery store receipt with multiple items',
  restaurant: 'a restaurant bill or food service receipt',
  cafe: 'a coffee shop or cafe receipt',
  bar: 'a bar or pub receipt for drinks and food',
  bakery: 'a bakery receipt for bread, pastries, or baked goods',

  // ── Retail Stores ──
  general_store: 'a general retail store receipt',
  department_store: 'a department store receipt with various merchandise',
  clothing_store: 'a clothing or apparel store receipt',
  electronics_store: 'an electronics or technology store receipt',
  furniture_store: 'a furniture or home decor store receipt',
  bookstore: 'a bookstore receipt for books or stationery',

  // ── Health & Medical ──
  pharmacy: 'a pharmacy or drugstore receipt',
  medical_clinic: 'a medical clinic or doctor visit receipt',
  dental_clinic: 'a dental clinic or dentist receipt',
  optical_store: 'an optical store or eye care receipt',

  // ── Automotive ──
  gas_station: 'a gas/petrol station receipt',
  auto_repair: 'an auto repair or mechanic service receipt',
  car_wash: 'a car wash service receipt',

  // ── Travel & Accommodation ──
  hotel: 'a hotel or lodging receipt',
  car_rental: 'a car rental receipt',
  airline_ticket: 'an airline ticket or flight booking receipt',

  // ── Entertainment & Events ──
  movie_theater: 'a movie theater or cinema ticket receipt',
  concert_ticket: 'a concert or live event ticket',
  event_ticket: 'an event admission ticket or receipt',
  museum_entry: 'a museum or exhibition entry ticket',

  // ── Services & Bills ──
  utility_bill: 'a utility bill (electricity, water, gas, internet)',
  parking: 'a parking ticket or parking receipt',
  transport_ticket: 'a transportation ticket (bus, metro, taxi, ride-share)',
  cleaning_service: 'a cleaning or housekeeping service receipt',
  home_improvement: 'a home improvement or hardware store receipt',

  // ── Health & Fitness ──
  gym_membership: 'a gym or fitness membership payment receipt',
  spa_service: 'a spa or wellness service receipt',

  // ── Education ──
  tuition_payment: 'a tuition or educational fee payment receipt',

  // ── Government & Legal ──
  tax_payment: 'a tax payment or government fee receipt',
  court_fee: 'a court fee or legal service receipt',

  // ── Donations & Other ──
  donation_receipt: 'a charitable donation receipt',
  online_purchase: 'a screenshot or confirmation of an online purchase',
  subscription: 'a subscription service charge or invoice',

  // ── Default ──
  auto: 'a receipt or financial document (type will be auto-detected)',
};

/**
 * @deprecated Use CURRENCY_PARSING_CONTEXT from runtime-variables.ts
 * Kept for backward compatibility.
 */
export const CURRENCY_CONTEXTS: Record<string, string> = {
  ...CURRENCY_PARSING_CONTEXT,
  // Extended currencies (not in app UI but supported for extraction)
  MXN: 'Mexican Peso (MXN) - may have centavos (e.g., 159.90 = 15990 centavos)',
  ARS: 'Argentine Peso (ARS) - integers common, some decimals',
  COP: 'Colombian Peso (COP) - integers only, no decimals',
  PEN: 'Peruvian Sol (PEN) - may have céntimos (e.g., 15.99 = 1599 céntimos)',
  BRL: 'Brazilian Real (BRL) - may have centavos (e.g., 15.99 = 1599 centavos)',
  GBP: 'British Pound (GBP) - has pence. Multiply by 100. Example: £15.99 → 1599',
};

/**
 * Build the V2 prompt with enhanced currency and receipt type support.
 *
 * Runtime Variables (injected by app):
 * - {{currency}}: Currency code with parsing context (e.g., "CLP", "USD", "EUR")
 * - {{date}}: Today's date in YYYY-MM-DD format
 * - {{receiptType}}: Optional receipt type hint (defaults to "auto")
 *
 * Extracted from Receipt (not injected):
 * - country: From address/text on receipt, or null if not found
 * - city: From address/text on receipt, or null if not found
 *
 * @returns The prompt template with placeholders
 */
function buildV2Prompt(): string {
  return `Analyze the document image. This is {{receiptType}}.

CURRENCY CONTEXT: {{currency}}
Convert all monetary values to INTEGER smallest units (no dots, no commas).
- For currencies with decimals (USD, EUR, GBP): multiply by 100 (e.g., $15.99 → 1599)
- For currencies without decimals (CLP, COP): use as-is (e.g., $15990 → 15990)
- Look for currency symbols or codes on the receipt to confirm

TODAY'S DATE: {{date}}
${DATE_INSTRUCTIONS}

OUTPUT FORMAT: Strict JSON only. No markdown, no explanation.
{
  "merchant": "store/service name",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "total": <integer>,
  "currency": "<detected currency code>",
  "category": "<one of: ${STORE_CATEGORY_LIST}>",
  "country": "<country name or null>",
  "city": "<city name or null>",
  "items": [
    {
      "name": "item description",
      "price": <integer>,
      "quantity": <number, default 1>,
      "category": "<one of: ${ITEM_CATEGORY_LIST}>",
      "subcategory": "<granular classification, free-form>"
    }
  ],
  "metadata": {
    "receiptType": "<detected type>",
    "confidence": <0.0-1.0>
  }
}

EXTRACTION RULES:
1. Extract ALL line items visible on the receipt
2. For utility bills: merchant = provider, single item with service description, category="Services"
3. For parking receipts: merchant = parking provider/location, single item "Parking" with the fee, category="Transport"
4. For transport tickets: merchant = transport provider, single item with fare/ticket description, category="Transport"
5. For online purchases: extract order items from confirmation screenshot
6. If currency on receipt differs from {{currency}}, note it in metadata and still convert to integers
7. Store category MUST be EXACTLY one of: ${STORE_CATEGORY_LIST}. NEVER invent categories like "Parking" - use "Transport" instead
8. For simple single-charge receipts (parking, tolls, transport): always create at least one item with the total amount
9. Maximum of 100 items; if more, summarize excess items into one "Additional Items" entry
10. Item names MUST be max 50 characters. If longer, summarize or abbreviate meaningfully
11. For unclear/cryptic merrchant name: look for email addresses on receipt and use the domain as merchant name (e.g., "info@mufin.cl" → "Mufin")
12. Subcategory is OPTIONAL and FREE-FORM - only add when it provides useful granularity (e.g., "Fresh Fruits", "Craft Beer", "Organic Milk"). Omit for simple items like parking fees or generic services
13. Time MUST be in 24-hour format (HH:MM). Extract from receipt if visible. If not found, use "04:04" as default

LOCATION EXTRACTION:
- Extract country and city ONLY from visible text on the receipt (address, header, footer)
- Look for: store address, city name, postal codes, country indicators
- If not visible on receipt, set to null (do NOT guess based on currency or language)
- Examples: "Santiago, Chile" → country: "Chile", city: "Santiago"`;
}

/**
 * V2 Multi-Currency & Receipt Types Prompt
 *
 * Enhanced prompt for testing:
 * - Better international currency handling (CLP, USD, EUR + others)
 * - Receipt type hints for improved accuracy
 * - Location extraction (country/city from receipt)
 * - Support for 35+ receipt types (single-transaction documents only)
 */
export const PROMPT_V2: PromptConfig = {
  id: 'v2-multi-currency-types',
  name: 'Multi-Currency + Receipt Types',
  description:
    'Enhanced prompt with explicit currency context, receipt type hints, and location extraction. Supports international currencies (CLP, USD, EUR) and non-traditional documents.',
  version: '2.6.0',
  createdAt: '2025-12-12',
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
