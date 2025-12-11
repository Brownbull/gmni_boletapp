/**
 * Shared Prompts Library - V1 Original Prompt
 *
 * This is the original production prompt extracted from analyzeReceipt.ts
 * as of 2025-12-11. It serves as the baseline for A/B testing.
 */

import type { PromptConfig } from './types';
import { STORE_CATEGORY_LIST, ITEM_CATEGORY_LIST, DATE_INSTRUCTIONS } from './base';

/**
 * Build the V1 original prompt with runtime variables.
 *
 * Variables:
 * - {{currency}}: The currency context (e.g., "CLP" for Chilean Peso)
 * - {{date}}: Today's date in YYYY-MM-DD format
 *
 * @returns The prompt template with {{currency}} and {{date}} placeholders
 */
function buildV1Prompt(): string {
  return `Analyze receipt. Context: {{currency}}. Today: {{date}}. Strict JSON output. Return 'total' and 'price' as INTEGERS (no dots/commas). Extract: merchant (store name), date (YYYY-MM-DD), total, category (one of: ${STORE_CATEGORY_LIST}). Items: name, price, category (${ITEM_CATEGORY_LIST}), subcategory. ${DATE_INSTRUCTIONS}`;
}

/**
 * V1 Original Production Prompt
 *
 * This was the prompt in use at the start of Epic 8.
 * Extracted from functions/src/analyzeReceipt.ts line 228.
 */
export const PROMPT_V1: PromptConfig = {
  id: 'v1-original',
  name: 'Original Chilean',
  description: 'Initial production prompt, extracted from analyzeReceipt.ts. Baseline for A/B testing.',
  version: '1.0.0',
  createdAt: '2025-12-11',
  prompt: buildV1Prompt(),
};
