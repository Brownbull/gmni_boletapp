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
  'Technology',
  'StreetVendor',
  'Transport',
  'Services',
  'Other',
];

/**
 * Valid item categories for line item classification.
 */
export const ITEM_CATEGORIES: ItemCategory[] = [
  'Fresh Food',
  'Pantry',
  'Drinks',
  'Household',
  'Personal Care',
  'Pets',
  'Electronics',
  'Apparel',
  'Other',
];

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
