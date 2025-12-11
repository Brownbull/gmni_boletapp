/**
 * Shared Prompts Library - Type Definitions
 *
 * Defines the PromptConfig interface used across the codebase
 * for versioned prompt management.
 */

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

/**
 * Store categories used in prompts for receipt analysis.
 * These are the valid values for the top-level category field.
 */
export type StoreCategory =
  | 'Supermarket'
  | 'Restaurant'
  | 'Bakery'
  | 'Butcher'
  | 'Bazaar'
  | 'Veterinary'
  | 'PetShop'
  | 'Medical'
  | 'Pharmacy'
  | 'Technology'
  | 'StreetVendor'
  | 'Transport'
  | 'Services'
  | 'Other';

/**
 * Item categories used in prompts for line item categorization.
 */
export type ItemCategory =
  | 'Fresh Food'
  | 'Pantry'
  | 'Drinks'
  | 'Household'
  | 'Personal Care'
  | 'Pets'
  | 'Electronics'
  | 'Apparel'
  | 'Other';
