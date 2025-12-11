/**
 * Shared Prompts Library - Main Entry Point
 *
 * Exports:
 * - ACTIVE_PROMPT: The current production prompt (single source of truth)
 * - getPrompt(id): Get a specific prompt version by ID
 * - listPrompts(): Get all available prompt versions
 *
 * Usage in Cloud Function:
 *   import { ACTIVE_PROMPT } from '../../shared/prompts';
 *   const prompt = ACTIVE_PROMPT.prompt
 *     .replace('{{currency}}', currency)
 *     .replace('{{date}}', todayStr);
 *
 * To change production prompt:
 *   1. Create new prompt version (e.g., v2-enhanced.ts)
 *   2. Import it here
 *   3. Change ACTIVE_PROMPT to reference the new version
 *   4. Deploy: firebase deploy --only functions
 */

// Re-export types
export type { PromptConfig, StoreCategory, ItemCategory } from './types';

// Re-export base utilities
export {
  STORE_CATEGORIES,
  ITEM_CATEGORIES,
  STORE_CATEGORY_LIST,
  ITEM_CATEGORY_LIST,
  JSON_FORMAT_INSTRUCTIONS,
  JSON_STRUCTURE,
  DATE_INSTRUCTIONS,
  buildBasePrompt,
} from './base';

// Import all prompt versions
import { PROMPT_V1 } from './v1-original';
import {
  PROMPT_V2,
  getCurrencyContext,
  getReceiptTypeDescription,
  buildCompleteV2Prompt,
} from './v2-multi-currency-receipt-types';
import type { PromptConfig } from './types';

/**
 * Registry of all available prompts.
 * Add new prompt versions here for A/B testing.
 */
const PROMPT_REGISTRY: Map<string, PromptConfig> = new Map([
  [PROMPT_V1.id, PROMPT_V1],
  [PROMPT_V2.id, PROMPT_V2],
]);

/**
 * THE ACTIVE PRODUCTION PROMPT
 *
 * Change this single line to promote a new prompt version to production.
 * All Cloud Functions will automatically use the new prompt on next deploy.
 */
export const ACTIVE_PROMPT: PromptConfig = PROMPT_V1;

/**
 * Get a specific prompt version by ID.
 *
 * @param id - The prompt version ID (e.g., "v1-original")
 * @returns The PromptConfig for the requested version
 * @throws Error if the prompt ID is not found
 *
 * @example
 * const v1 = getPrompt('v1-original');
 * console.log(v1.prompt);
 */
export function getPrompt(id: string): PromptConfig {
  const prompt = PROMPT_REGISTRY.get(id);
  if (!prompt) {
    const availableIds = Array.from(PROMPT_REGISTRY.keys()).join(', ');
    throw new Error(`Prompt "${id}" not found. Available prompts: ${availableIds}`);
  }
  return prompt;
}

/**
 * List all available prompt versions.
 *
 * @returns Array of all registered PromptConfig objects
 *
 * @example
 * const prompts = listPrompts();
 * prompts.forEach(p => console.log(`${p.id}: ${p.name}`));
 */
export function listPrompts(): PromptConfig[] {
  return Array.from(PROMPT_REGISTRY.values());
}

/**
 * Replace template variables in a prompt string.
 *
 * @param prompt - The prompt template with {{variable}} placeholders
 * @param variables - Object with variable values to substitute
 * @returns The prompt with variables replaced
 *
 * @example
 * const prompt = replacePromptVariables(ACTIVE_PROMPT.prompt, {
 *   currency: 'CLP',
 *   date: '2025-12-11'
 * });
 */
export function replacePromptVariables(
  prompt: string,
  variables: { currency: string; date: string }
): string {
  return prompt
    .replace('{{currency}}', variables.currency)
    .replace('{{date}}', variables.date);
}

// Re-export individual prompt versions for direct access
export { PROMPT_V1 } from './v1-original';
export {
  PROMPT_V2,
  getCurrencyContext,
  getReceiptTypeDescription,
  buildCompleteV2Prompt,
  CURRENCY_CONTEXTS,
} from './v2-multi-currency-receipt-types';
export type { ReceiptType } from './v2-multi-currency-receipt-types';
