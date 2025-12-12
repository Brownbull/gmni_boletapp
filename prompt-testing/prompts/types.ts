/**
 * Shared Prompts Library - Type Definitions
 *
 * Defines the PromptConfig interface used across the codebase
 * for versioned prompt management.
 *
 * Category types (StoreCategory, ItemCategory) are defined in base.ts
 * and derived from runtime arrays to prevent duplication.
 */

// Re-export category types from output-schema.ts (single source of truth)
export type { StoreCategory, ItemCategory } from './output-schema';

/**
 * Configuration for a versioned prompt.
 * Each prompt version is stored with metadata for tracking and A/B testing.
 */
export interface PromptConfig {
  /** Unique identifier, e.g., "v1-original" */
  id: string;

  /** Human-readable name, e.g., "Original Chilean" */
  name: string;

  /** Description of this prompt version */
  description: string;

  /** Semantic version string, e.g., "1.0.0" */
  version: string;

  /** ISO date when this prompt was created, e.g., "2025-12-11" */
  createdAt: string;

  /** The actual prompt text sent to Gemini API */
  prompt: string;

  /** Optional few-shot examples to append to the prompt */
  fewShotExamples?: string[];
}
