/**
 * Output Schema - AI Response Structure
 *
 * Re-exports category definitions from the unified schema
 * and provides prompt-specific formatting helpers.
 *
 * IMPORTANT: Categories are defined in shared/schema/categories.ts
 * This file just re-exports them for prompt usage.
 */

// ============================================================================
// RE-EXPORT FROM UNIFIED SCHEMA
// ============================================================================

export {
  STORE_CATEGORIES,
  ITEM_CATEGORIES,
  STORE_CATEGORY_LIST,
  ITEM_CATEGORY_LIST,
} from '../../shared/schema/categories';

export type {
  StoreCategory,
  ItemCategory,
} from '../../shared/schema/categories';

// ============================================================================
// JSON Output Format Instructions
// ============================================================================

/**
 * JSON format instructions for Gemini output.
 */
export const JSON_FORMAT_INSTRUCTIONS = `Strict JSON output. Return 'total' and 'price' as INTEGERS (no dots/commas).`;

/**
 * Date handling instructions.
 */
export const DATE_INSTRUCTIONS = `If multiple dates, choose closest to today.`;

// ============================================================================
// Helper Functions
// ============================================================================

import { STORE_CATEGORY_LIST, ITEM_CATEGORY_LIST } from '../../shared/schema/categories';

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
