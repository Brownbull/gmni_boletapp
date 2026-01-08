/**
 * Shared Prompts Library - Main Entry Point
 *
 * Exports:
 * - ACTIVE_PROMPT: The current production prompt (single source of truth)
 * - buildPrompt(): Build any prompt with runtime variables
 * - getPrompt(id): Get a specific prompt version by ID
 * - listPrompts(): Get all available prompt versions
 * - Runtime variables configuration for app injection
 *
 * Usage in Cloud Function:
 *   import { buildPrompt } from './prompts';
 *   const prompt = buildPrompt({
 *     currency: 'CLP',           // From user settings or scan options
 *     receiptType: 'supermarket' // Optional hint (defaults to 'auto')
 *   });
 *
 * Runtime Variables (injected at scan time):
 * - currency: User's selected currency (CLP, USD, EUR) - from settings or scan options
 * - date: Today's date (auto-generated)
 * - receiptType: Optional document type hint (defaults to 'auto')
 *
 * To change production prompt:
 *   1. Create new prompt version (e.g., v3-enhanced.ts)
 *   2. Import it here
 *   3. Change ACTIVE_PROMPT to reference the new version
 *   4. Deploy: firebase deploy --only functions
 */

// Re-export types
export type { PromptConfig } from './types';

// Re-export from unified schema (single source of truth for categories)
export {
  STORE_CATEGORIES,
  ITEM_CATEGORIES,
  STORE_CATEGORY_LIST,
  ITEM_CATEGORY_LIST,
  STORE_CATEGORY_COUNT,
  ITEM_CATEGORY_COUNT,
} from '../../shared/schema/categories';
export type { StoreCategory, ItemCategory } from '../../shared/schema/categories';

// Re-export from unified schema (currencies)
export {
  CURRENCIES,
  CURRENCY_CODES,
  getCurrencyPromptContext,
  getCurrency,
} from '../../shared/schema/currencies';
export type { CurrencyDefinition, CurrencyCode } from '../../shared/schema/currencies';

// Re-export output schema (AI response structure)
export {
  JSON_FORMAT_INSTRUCTIONS,
  JSON_STRUCTURE,
  DATE_INSTRUCTIONS,
  buildBasePrompt,
} from './output-schema';

// Re-export input hints (user-provided pre-scan context)
export {
  SUPPORTED_CURRENCIES,
  CURRENCY_INFO,
  CURRENCY_PARSING_CONTEXT,
  DEFAULT_INPUT_HINTS,
  DEFAULT_RUNTIME_VARIABLES, // Backwards compatibility alias
  VARIABLE_PLACEHOLDERS,
  isSupportedCurrency,
  getCurrencyParsingContext,
} from './input-hints';
export type { SupportedCurrency, InputHints, RuntimeVariables } from './input-hints';

// Import all prompt versions
import { PROMPT_V1 } from './v1-original';
import { PROMPT_V2, getReceiptTypeDescription, getCurrencyContext } from './v2-multi-currency-receipt-types';
import { PROMPT_V3 } from './v3-category-standardization';
import type { PromptConfig } from './types';
import type { ReceiptType } from './v2-multi-currency-receipt-types';
import { DEFAULT_INPUT_HINTS } from './input-hints';

/**
 * Registry of all available prompts.
 * Add new prompt versions here for A/B testing.
 */
const PROMPT_REGISTRY: Map<string, PromptConfig> = new Map([
  [PROMPT_V1.id, PROMPT_V1],
  [PROMPT_V2.id, PROMPT_V2],
  [PROMPT_V3.id, PROMPT_V3],
]);

// ============================================================================
// Dual Prompt Configuration
// ============================================================================

/**
 * PRODUCTION PROMPT - Used by the mobile app
 *
 * This is the stable prompt that real users interact with.
 * Only change this after thorough testing with DEV_PROMPT.
 *
 * To promote a tested prompt to production:
 *   1. Verify DEV_PROMPT passes all tests
 *   2. Change PRODUCTION_PROMPT to the new version
 *   3. Deploy: npm run build && firebase deploy --only functions
 */
export const PRODUCTION_PROMPT: PromptConfig = PROMPT_V3;

/**
 * DEVELOPMENT PROMPT - Used by the test harness
 *
 * Use this for iterating on new prompts without affecting production.
 * The test harness (npm run test:scan) uses this prompt.
 *
 * Workflow:
 *   1. Create new prompt version (e.g., v3-improved.ts)
 *   2. Set DEV_PROMPT to the new version
 *   3. Run tests: npm run test:scan
 *   4. When satisfied, promote to PRODUCTION_PROMPT
 */
export const DEV_PROMPT: PromptConfig = PROMPT_V3;

/**
 * ACTIVE_PROMPT - Runtime selection
 *
 * The Cloud Function checks the execution context:
 * - Production (mobile app): Uses PRODUCTION_PROMPT
 * - Test harness: Uses DEV_PROMPT
 *
 * For backwards compatibility, this defaults to PRODUCTION_PROMPT.
 * Use getActivePrompt() for context-aware selection.
 */
export const ACTIVE_PROMPT: PromptConfig = PRODUCTION_PROMPT;

/**
 * Get the appropriate prompt based on execution context.
 *
 * @param context - 'production' for mobile app, 'development' for test harness
 * @returns The appropriate PromptConfig
 *
 * @example
 * // In Cloud Function (production)
 * const prompt = getActivePrompt('production');
 *
 * // In test harness (development)
 * const prompt = getActivePrompt('development');
 */
export function getActivePrompt(context: 'production' | 'development' = 'production'): PromptConfig {
  return context === 'development' ? DEV_PROMPT : PRODUCTION_PROMPT;
}

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
 * Options for building a prompt with runtime variables.
 */
export interface BuildPromptOptions {
  /** Currency code (CLP, USD, EUR). Defaults to DEFAULT_RUNTIME_VARIABLES.currency */
  currency?: string;
  /** Today's date in YYYY-MM-DD format. Defaults to current date */
  date?: string;
  /** Receipt type hint for better extraction. Defaults to 'auto' */
  receiptType?: ReceiptType;
  /** Optional: use a specific prompt instead of ACTIVE_PROMPT */
  promptConfig?: PromptConfig;
  /** Optional: execution context for prompt selection ('production' | 'development') */
  context?: 'production' | 'development';
}

/**
 * Build a prompt with runtime variables substituted.
 *
 * This is the MAIN function for building prompts - works with any prompt version.
 * Replaces ALL occurrences of {{variable}} placeholders with appropriate values.
 *
 * @param options - Runtime variables to inject (all optional with sensible defaults)
 * @returns Fully resolved prompt string ready for Gemini API
 *
 * @example
 * // Simple usage with defaults
 * const prompt = buildPrompt({ currency: 'CLP' });
 *
 * // With receipt type hint
 * const prompt = buildPrompt({
 *   currency: 'USD',
 *   receiptType: 'restaurant'
 * });
 *
 * // Using a specific prompt version
 * const prompt = buildPrompt({
 *   currency: 'EUR',
 *   promptConfig: getPrompt('v1-original')
 * });
 */
export function buildPrompt(options: BuildPromptOptions = {}): string {
  const {
    currency, // No default - V3 auto-detects, V1/V2 use DEFAULT_INPUT_HINTS.currency
    date = new Date().toISOString().split('T')[0],
    receiptType = 'auto',
    promptConfig,
    context = 'production',
  } = options;

  // Use explicit promptConfig if provided, otherwise select based on context
  const selectedPrompt = promptConfig ?? getActivePrompt(context);

  // Check if this is V3 (which auto-detects currency, no {{currency}} placeholder)
  const isV3 = selectedPrompt.id === 'v3-category-standardization';

  // Get human-readable description for receipt type
  const receiptTypeDescription = getReceiptTypeDescription(receiptType);

  // Start with the base prompt
  let result = selectedPrompt.prompt;

  // Replace {{currency}} only for V1/V2 (V3 doesn't have this placeholder)
  if (!isV3) {
    // V1/V2: currency is required, use default if not provided
    const currencyToUse = currency || DEFAULT_INPUT_HINTS.currency || 'CLP';
    const currencyContext = getCurrencyContext(currencyToUse);
    result = result.replaceAll('{{currency}}', currencyContext);
  }
  // V3: no {{currency}} replacement needed - AI auto-detects

  // Replace remaining placeholders
  result = result.replaceAll('{{date}}', date);
  result = result.replaceAll('{{receiptType}}', receiptTypeDescription);

  return result;
}

/**
 * @deprecated Use buildPrompt() instead for full variable support.
 * This function only replaces the first occurrence and doesn't handle receiptType.
 *
 * Replace template variables in a prompt string (legacy function).
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
  RECEIPT_TYPES,
  getCurrencyContext,
  getReceiptTypeDescription,
  buildCompleteV2Prompt,
  CURRENCY_CONTEXTS,
} from './v2-multi-currency-receipt-types';
export type { ReceiptType } from './v2-multi-currency-receipt-types';
export {
  PROMPT_V3,
  buildCompleteV3Prompt,
} from './v3-category-standardization';
