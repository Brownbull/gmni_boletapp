/**
 * Shared Prompts Library - Base Components
 *
 * Contains shared prompt components that are reused across prompt versions:
 * - Category lists
 * - JSON format instructions
 * - Common instructions
 */

import type { StoreCategory, ItemCategory } from './types';

/**
 * Valid store categories for receipt classification.
 * Order matters - commonly used categories are listed first.
 *
 * NOTE: This is the LEGACY set (V1/V2 prompts).
 * See v3-category-standardization.ts for expanded 32-category set.
 */
export const STORE_CATEGORIES: StoreCategory[] = [
  'Supermarket',
  'Restaurant',
  'Bakery',
  'Butcher',
  'Bazaar',
  'Veterinary',
  'PetShop',
  'Medical',
  'Pharmacy',
  'StreetVendor',
  'Transport',
  'Services',
  'Other',
];

/**
 * Valid item categories for line item classification.
 *
 * NOTE: This is the LEGACY set (V1/V2 prompts) - 9 categories.
 * See v3-category-standardization.ts for expanded 32-category set.
 */
export const ITEM_CATEGORIES: ItemCategory[] = [
  'Produce',
  'Pantry',
  'Beverages',
  'Household',
  'Personal Care',
  'Pet Supplies',
  'Electronics',
  'Clothing',
  'Other',
];

/**
 * Legacy category mappings for data migration.
 * Maps old prompt category values to new standardized values.
 */
export const LEGACY_ITEM_CATEGORY_MAP: Record<string, string> = {
  'Fresh Food': 'Produce',
  'Drinks': 'Beverages',
  'Pets': 'Pet Supplies',
  'Apparel': 'Clothing',
};

export const LEGACY_STORE_CATEGORY_MAP: Record<string, string> = {
  'Technology': 'Electronics',
};

/**
 * Store category list formatted for prompt inclusion.
 */
export const STORE_CATEGORY_LIST = STORE_CATEGORIES.join(', ');

/**
 * Item category list formatted for prompt inclusion.
 */
export const ITEM_CATEGORY_LIST = ITEM_CATEGORIES.join(', ');

/**
 * JSON format instructions for Gemini output.
 */
export const JSON_FORMAT_INSTRUCTIONS = `Strict JSON output. Return 'total' and 'price' as INTEGERS (no dots/commas).`;

/**
 * Expected JSON structure for Gemini output.
 */
export const JSON_STRUCTURE = `{
  "merchant": "store name",
  "date": "YYYY-MM-DD",
  "total": 12345,
  "category": "one of: ${STORE_CATEGORY_LIST}",
  "items": [
    {
      "name": "item name",
      "price": 1234,
      "category": "one of: ${ITEM_CATEGORY_LIST}",
      "subcategory": "optional subcategory"
    }
  ]
}`;

/**
 * Date handling instructions.
 */
export const DATE_INSTRUCTIONS = `If multiple dates, choose closest to today.`;

/**
 * Builds a basic prompt with variable placeholders.
 * Use this to create new prompt versions with consistent structure.
 *
 * @param options - Prompt configuration options
 * @returns Prompt string with {{currency}} and {{date}} placeholders
 */
export function buildBasePrompt(options: {
  additionalInstructions?: string;
  includeStructure?: boolean;
}): string {
  const { additionalInstructions = '', includeStructure = false } = options;

  let prompt = `Analyze receipt. Context: {{currency}}. Today: {{date}}. ${JSON_FORMAT_INSTRUCTIONS}`;

  if (includeStructure) {
    prompt += `\n\nExpected output format:\n${JSON_STRUCTURE}`;
  }

  prompt += `\n\nExtract: merchant (store name), date (YYYY-MM-DD), total, category (one of: ${STORE_CATEGORY_LIST}). Items: name, price, category (${ITEM_CATEGORY_LIST}), subcategory. ${DATE_INSTRUCTIONS}`;

  if (additionalInstructions) {
    prompt += `\n\n${additionalInstructions}`;
  }

  return prompt;
}

/**
 * Normalize a legacy item category to the current standard.
 * Returns the input unchanged if not a legacy value.
 */
export function normalizeItemCategory(category: string): string {
  return LEGACY_ITEM_CATEGORY_MAP[category] || category;
}

/**
 * Normalize a legacy store category to the current standard.
 * Returns the input unchanged if not a legacy value.
 */
export function normalizeStoreCategory(category: string): string {
  return LEGACY_STORE_CATEGORY_MAP[category] || category;
}
