/**
 * Statement Prompts Library — Main Entry Point
 *
 * Parallel to prompt-testing/prompts/index.ts but for statement extraction.
 *
 * Exports:
 * - PRODUCTION_STATEMENT_PROMPT: Stable prompt for the mobile app
 * - DEV_STATEMENT_PROMPT: Prompt for test harness iteration
 * - buildStatementPrompt(): Build prompt with runtime variables
 * - getStatementPrompt(id): Get specific version by ID
 * - listStatementPrompts(): Get all available versions
 *
 * Usage in Cloud Function:
 *   import { buildStatementPrompt } from './prompts/statement';
 *   const prompt = buildStatementPrompt({ context: 'production' });
 */

import type { StatementPromptConfig } from './types';
import { STATEMENT_PROMPT_V1 } from './v1-statement-extraction';

// Re-export types
export type { StatementPromptConfig, StatementResult, StatementTransaction, StatementInfo, StatementMetadata } from './types';

// Re-export prompt versions
export { STATEMENT_PROMPT_V1 } from './v1-statement-extraction';

// ============================================================================
// Prompt Registry
// ============================================================================

const STATEMENT_PROMPT_REGISTRY: Map<string, StatementPromptConfig> = new Map([
  [STATEMENT_PROMPT_V1.id, STATEMENT_PROMPT_V1],
]);

// ============================================================================
// Dual Prompt Configuration
// ============================================================================

/**
 * PRODUCTION prompt — used by the mobile app via analyzeStatement Cloud Function.
 * Only change after thorough testing with DEV prompt.
 */
export const PRODUCTION_STATEMENT_PROMPT: StatementPromptConfig = STATEMENT_PROMPT_V1;

/**
 * DEVELOPMENT prompt — used by the test harness for iteration.
 * Safe to change without affecting production.
 */
export const DEV_STATEMENT_PROMPT: StatementPromptConfig = STATEMENT_PROMPT_V1;

/**
 * Get the appropriate statement prompt based on execution context.
 */
export function getActiveStatementPrompt(
  context: 'production' | 'development' = 'production'
): StatementPromptConfig {
  return context === 'development' ? DEV_STATEMENT_PROMPT : PRODUCTION_STATEMENT_PROMPT;
}

/**
 * Get a specific statement prompt version by ID.
 */
export function getStatementPrompt(id: string): StatementPromptConfig {
  const prompt = STATEMENT_PROMPT_REGISTRY.get(id);
  if (!prompt) {
    const availableIds = Array.from(STATEMENT_PROMPT_REGISTRY.keys()).join(', ');
    throw new Error(`Statement prompt "${id}" not found. Available: ${availableIds}`);
  }
  return prompt;
}

/**
 * List all available statement prompt versions.
 */
export function listStatementPrompts(): StatementPromptConfig[] {
  return Array.from(STATEMENT_PROMPT_REGISTRY.values());
}

// ============================================================================
// Prompt Builder
// ============================================================================

export interface BuildStatementPromptOptions {
  /** Today's date in YYYY-MM-DD format. Defaults to current date */
  date?: string;
  /** Use a specific prompt instead of active prompt */
  promptConfig?: StatementPromptConfig;
  /** Execution context: 'production' (default) or 'development' */
  context?: 'production' | 'development';
}

/**
 * Build a statement prompt with runtime variables substituted.
 *
 * @example
 * // Simple usage with defaults
 * const prompt = buildStatementPrompt();
 *
 * // Using a specific prompt version
 * const prompt = buildStatementPrompt({
 *   promptConfig: getStatementPrompt('s1-statement-extraction'),
 * });
 */
export function buildStatementPrompt(options: BuildStatementPromptOptions = {}): string {
  const {
    date = new Date().toISOString().split('T')[0],
    promptConfig,
    context = 'production',
  } = options;

  const selectedPrompt = promptConfig ?? getActiveStatementPrompt(context);

  return selectedPrompt.prompt.replaceAll('{{date}}', date);
}
