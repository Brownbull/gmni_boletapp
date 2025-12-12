/**
 * Schema definitions for test case files
 *
 * TestCaseFile structure (ADR-011: Corrections-Based Ground Truth):
 * - metadata: Required test case identification and classification
 * - aiExtraction: AI-generated results from Gemini (auto-populated by generate command)
 * - corrections: Human corrections only for fields the AI got wrong
 * - thresholds: Optional per-test overrides for comparison tolerances
 *
 * Ground truth = aiExtraction + corrections (corrections override AI values)
 *
 * @see docs/sprint-artifacts/epic8/architecture-epic8.md#ADR-011
 */

import { z } from 'zod';
import { CONFIG, type ValidStoreType } from '../config';

// ============================================================================
// Store Type Enum
// ============================================================================

/**
 * Supported store types for receipt categorization.
 * Derived from CONFIG.validStoreTypes (single source of truth).
 */
export const StoreTypeEnum = z.enum(CONFIG.validStoreTypes as [ValidStoreType, ...ValidStoreType[]]);
export type StoreType = z.infer<typeof StoreTypeEnum>;

// ============================================================================
// Metadata Schema
// ============================================================================

/**
 * Test case metadata - required for all test cases.
 * Human fills this once when adding a test image.
 */
export const MetadataSchema = z.object({
  /** Unique test ID matching the image filename (e.g., "jumbo-001") */
  testId: z.string().min(1, 'testId is required'),

  /** Store type for categorization and filtering */
  storeType: StoreTypeEnum,

  /** Difficulty level for the scan (affects expectations) */
  difficulty: z.enum(['easy', 'medium', 'hard']),

  /** Region/country code for the receipt */
  region: z.enum(['CL', 'CO', 'MX', 'AR']).default('CL'),

  /** Source of the test image */
  source: z.enum(['production-failure', 'manual-collection', 'user-provided']),

  /** ISO date when the test case was added */
  addedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),

  /** Who added this test case (optional) */
  addedBy: z.string().optional(),

  /** Additional notes about the test case (optional) */
  notes: z.string().optional(),
});
export type Metadata = z.infer<typeof MetadataSchema>;

// ============================================================================
// AI Extraction Schema
// ============================================================================

/**
 * Item extracted by AI from receipt.
 */
export const AIExtractionItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  category: z.string().optional(),
});
export type AIExtractionItem = z.infer<typeof AIExtractionItemSchema>;

/**
 * Confidence scores for different fields (optional).
 */
export const ConfidenceSchema = z.object({
  overall: z.number().min(0).max(1).optional(),
  merchant: z.number().min(0).max(1).optional(),
  date: z.number().min(0).max(1).optional(),
  total: z.number().min(0).max(1).optional(),
});
export type Confidence = z.infer<typeof ConfidenceSchema>;

/**
 * AI extraction results - auto-populated by generate command.
 * This captures what the AI extracted from the receipt image.
 */
export const AIExtractionSchema = z.object({
  /** Merchant/store name extracted */
  merchant: z.string(),

  /** Date of the receipt (YYYY-MM-DD format) */
  date: z.string(),

  /** Time of the receipt (HH:MM 24h format, "04:04" if not found) */
  time: z.string().optional(),

  /** Total amount on the receipt */
  total: z.number(),

  /** Category assigned by AI */
  category: z.string(),

  /** Line items extracted from the receipt */
  items: z.array(AIExtractionItemSchema),

  /** Model used for extraction (e.g., "gemini-1.5-flash") */
  model: z.string(),

  /** Model version identifier */
  modelVersion: z.string(),

  /** ISO datetime when extraction was performed */
  extractedAt: z.string(),

  /** Optional confidence scores */
  confidence: ConfidenceSchema.optional(),
});
export type AIExtraction = z.infer<typeof AIExtractionSchema>;

// ============================================================================
// Corrections Schema
// ============================================================================

/**
 * Correction for a single item (by index in aiExtraction.items).
 */
export const ItemCorrectionSchema = z.object({
  /** Corrected name (only if AI got it wrong) */
  name: z.string().optional(),

  /** Corrected price (only if AI got it wrong) */
  price: z.number().optional(),

  /** Corrected category (only if AI got it wrong) */
  category: z.string().optional(),

  /** True if this item was hallucinated by AI (should be removed) */
  delete: z.boolean().optional(),
});
export type ItemCorrection = z.infer<typeof ItemCorrectionSchema>;

/**
 * Item to add that AI missed.
 */
export const AddItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  category: z.string().optional(),
});
export type AddItem = z.infer<typeof AddItemSchema>;

/**
 * Human corrections - only includes fields where AI was wrong.
 * If a field is not present, the AI extraction is correct.
 */
export const CorrectionsSchema = z.object({
  /** Corrected merchant name (only if AI got it wrong) */
  merchant: z.string().optional(),

  /** Corrected date (only if AI got it wrong) */
  date: z.string().optional(),

  /** Corrected total (only if AI got it wrong) */
  total: z.number().optional(),

  /** Corrected category (only if AI got it wrong) */
  category: z.string().optional(),

  /** Corrections to individual items (keyed by index in aiExtraction.items) */
  items: z.record(z.string(), ItemCorrectionSchema).optional(),

  /** Items that AI missed entirely */
  addItems: z.array(AddItemSchema).optional(),

  /** ISO datetime when corrections were made */
  correctedAt: z.string().optional(),

  /** Who made the corrections */
  correctedBy: z.string().optional(),

  /** Notes explaining the corrections */
  reviewNotes: z.string().optional(),
});
export type Corrections = z.infer<typeof CorrectionsSchema>;

// ============================================================================
// Thresholds Schema
// ============================================================================

/**
 * Per-test threshold overrides for comparison.
 * If not specified, default thresholds from config.ts are used.
 */
export const ThresholdsSchema = z.object({
  /** Minimum similarity score for merchant name match (default: 0.8) */
  merchantSimilarity: z.number().min(0).max(1).default(0.8),

  /** Tolerance for total amount (default: 0 = exact match) */
  totalTolerance: z.number().min(0).default(0),

  /** Date comparison tolerance (default: exact) */
  dateTolerance: z.enum(['exact', 'day', 'month']).default('exact'),
});
export type Thresholds = z.infer<typeof ThresholdsSchema>;

// ============================================================================
// Input Schema
// ============================================================================

/**
 * Input variables used when generating this test case.
 * These mirror the app's runtime variables that affect how the prompt is built.
 *
 * The input file (.input.json) is created BEFORE running generate,
 * mirroring how user settings exist before scanning in the app.
 *
 * @see ARCHITECTURE.md Section 7 for input file workflow
 */
export const InputSchema = z.object({
  /** Currency code (affects price parsing in prompt) */
  currency: z.string().default('CLP'),

  /** Receipt type hint (helps AI understand document context) */
  receiptType: z.string().default('auto'),
});
export type Input = z.infer<typeof InputSchema>;

// ============================================================================
// Test Case File Schema (Complete)
// ============================================================================

/**
 * Complete test case file schema.
 *
 * Structure:
 * - metadata: REQUIRED - test identification and classification
 * - input: OPTIONAL - variables used when generating (currency, receiptType)
 * - aiExtraction: OPTIONAL - populated by generate command
 * - corrections: OPTIONAL - human corrections for AI mistakes
 * - thresholds: OPTIONAL - per-test comparison thresholds
 *
 * A test case is valid if:
 * 1. It has metadata (always required)
 * 2. It has aiExtraction OR corrections (or both)
 *
 * Ground truth calculation: corrections.field ?? aiExtraction.field
 */
export const TestCaseFileSchema = z.object({
  metadata: MetadataSchema,
  input: InputSchema.optional(),
  aiExtraction: AIExtractionSchema.optional(),
  corrections: CorrectionsSchema.optional(),
  thresholds: ThresholdsSchema.optional(),
}).refine(
  (data) => data.aiExtraction !== undefined || data.corrections !== undefined,
  {
    message: 'Test case must have either aiExtraction or corrections (or both)',
  }
);
export type TestCaseFile = z.infer<typeof TestCaseFileSchema>;

// ============================================================================
// Validation Function
// ============================================================================

/**
 * Validates a test case file against the schema.
 *
 * @param data - Unknown data to validate
 * @returns Validated TestCaseFile
 * @throws ZodError with detailed validation failures
 *
 * @example
 * ```typescript
 * try {
 *   const testCase = validateTestCase(JSON.parse(fileContent));
 *   console.log('Valid test case:', testCase.metadata.testId);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     console.error('Validation errors:', error.errors);
 *   }
 * }
 * ```
 */
export function validateTestCase(data: unknown): TestCaseFile {
  return TestCaseFileSchema.parse(data);
}

/**
 * Safe validation that returns a result instead of throwing.
 *
 * @param data - Unknown data to validate
 * @returns Object with success flag and either data or error
 *
 * @example
 * ```typescript
 * const result = safeValidateTestCase(JSON.parse(fileContent));
 * if (result.success) {
 *   console.log('Valid:', result.data.metadata.testId);
 * } else {
 *   console.error('Invalid:', result.error.errors);
 * }
 * ```
 */
export function safeValidateTestCase(data: unknown): z.SafeParseReturnType<unknown, TestCaseFile> {
  return TestCaseFileSchema.safeParse(data);
}
