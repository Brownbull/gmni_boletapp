/**
 * Test harness type definitions
 *
 * Types for test results, comparisons, and CLI operations.
 *
 * @see docs/sprint-artifacts/epic8/tech-spec-epic-8.md#Data-Models-and-Contracts
 */

// Re-export schema types for convenience
export type {
  TestCaseFile,
  Metadata,
  AIExtraction,
  AIExtractionItem,
  Corrections,
  ItemCorrection,
  AddItem,
  Thresholds,
  Confidence,
  StoreType,
} from './lib/schema';

// ============================================================================
// Item Comparison Result
// ============================================================================

/**
 * Result of comparing a single item (expected vs actual).
 */
export interface ItemComparison {
  /** Index in the expected items array */
  index: number;

  /** Expected item name */
  expectedName: string;

  /** Actual item name from AI */
  actualName: string;

  /** Similarity score between names (0-1) */
  nameSimilarity: number;

  /** Whether the name is considered a match (similarity >= threshold) */
  nameMatch: boolean;

  /** Expected item price */
  expectedPrice: number;

  /** Actual item price from AI */
  actualPrice: number;

  /** Whether the price is an exact match */
  priceMatch: boolean;

  /** Overall match status for this item */
  match: boolean;
}

// ============================================================================
// Field Comparison Results
// ============================================================================

/**
 * Comparison result for numeric fields (total).
 */
export interface NumericFieldResult {
  expected: number;
  actual: number;
  match: boolean;
  difference?: number;
}

/**
 * Comparison result for string fields (date).
 */
export interface StringFieldResult {
  expected: string;
  actual: string;
  match: boolean;
}

/**
 * Comparison result for fuzzy string fields (merchant).
 */
export interface FuzzyFieldResult {
  expected: string;
  actual: string;
  similarity: number;
  match: boolean;
}

/**
 * Comparison result for item count.
 */
export interface ItemCountResult {
  expected: number;
  actual: number;
  match: boolean;
  tolerance: number;
}

/**
 * Comparison result for item prices (aggregate).
 */
export interface ItemPricesResult {
  /** Percentage of items with correct prices (0-100) */
  accuracy: number;

  /** Per-item comparison details */
  details: ItemComparison[];

  /** Count of items with matching prices */
  matchCount: number;

  /** Total items compared */
  totalCount: number;
}

/**
 * Comparison result for category field.
 */
export interface CategoryFieldResult {
  expected: string;
  actual: string;
  match: boolean;
}

/**
 * All field comparison results for a test case.
 */
export interface FieldResults {
  total: NumericFieldResult;
  date: StringFieldResult;
  merchant: FuzzyFieldResult;
  category: CategoryFieldResult;
  itemsCount: ItemCountResult;
  itemPrices: ItemPricesResult;
}

/**
 * Feedback about corrections applied - helps identify AI weaknesses for prompt improvement.
 */
export interface CorrectionsFeedback {
  /** Fields that were corrected (AI got these wrong) */
  correctedFields: string[];

  /** Number of items modified by corrections */
  itemsModified: number;

  /** Number of items deleted (AI hallucinated) */
  itemsDeleted: number;

  /** Number of items added (AI missed) */
  itemsAdded: number;

  /** Whether any corrections were applied */
  hasCorrections: boolean;

  /** Human-readable summary of what AI got wrong */
  summary: string;
}

// ============================================================================
// Test Result
// ============================================================================

/**
 * Complete test result for a single test case.
 */
export interface TestResult {
  /** Test ID matching the expected.json file */
  testId: string;

  /** Whether the test passed overall */
  passed: boolean;

  /** Weighted composite score (0-100) */
  score: number;

  /** Per-field comparison results */
  fields: FieldResults;

  /** Estimated API cost for this test (USD) */
  apiCost: number;

  /** Duration of the test in milliseconds */
  duration: number;

  /** Error message if the test failed due to an error */
  error?: string;

  /** Store type for filtering/grouping */
  storeType: string;

  /** Prompt version used for this test */
  promptVersion: string;

  /** Feedback about corrections applied - shows what AI got wrong */
  correctionsFeedback?: CorrectionsFeedback;
}

// ============================================================================
// Test Run Summary
// ============================================================================

/**
 * Summary of a test run (multiple test cases).
 */
export interface TestRunSummary {
  /** ISO datetime when the run started */
  startedAt: string;

  /** ISO datetime when the run completed */
  completedAt: string;

  /** Total duration in milliseconds */
  duration: number;

  /** Prompt version used */
  promptVersion: string;

  /** Total number of tests run */
  totalTests: number;

  /** Number of tests that passed */
  passedTests: number;

  /** Number of tests that failed */
  failedTests: number;

  /** Number of tests that errored */
  erroredTests: number;

  /** Overall accuracy percentage */
  overallAccuracy: number;

  /** Total estimated API cost */
  totalApiCost: number;

  /** Per-store-type accuracy breakdown */
  byStoreType: Record<
    string,
    {
      total: number;
      passed: number;
      accuracy: number;
    }
  >;

  /** Per-field accuracy breakdown */
  byField: {
    total: number;
    date: number;
    merchant: number;
    itemsCount: number;
    itemPrices: number;
  };
}

/**
 * Complete test run output (saved to test-results/).
 */
export interface TestRunOutput {
  summary: TestRunSummary;
  results: TestResult[];
}

// ============================================================================
// CLI Options
// ============================================================================

/**
 * Options for the run command.
 */
export interface RunOptions {
  /** Specific image to test (e.g., "jumbo-001.jpg") */
  image?: string;

  /** Filter by store type */
  type?: string;

  /** Custom folder path for test images */
  folder?: string;

  /** Maximum number of tests to run */
  limit?: number | 'all';

  /** Specific prompt version to use */
  prompt?: string;

  /** A/B comparison between prompt versions */
  compare?: string;

  /** Verbose output with diffs */
  verbose?: boolean;

  /** Only show final pass/fail */
  quiet?: boolean;

  /** Machine-readable JSON output */
  json?: boolean;

  /** Show plan without making API calls */
  dryRun?: boolean;
}

/**
 * Options for the generate command.
 */
export interface GenerateOptions {
  /** Specific image to generate expected.json for */
  image?: string;

  /** Folder of images to process */
  folder?: string;

  /** Force overwrite existing expected.json files */
  force?: boolean;
}

/**
 * Options for the validate command.
 */
export interface ValidateOptions {
  /** Specific file to validate */
  file?: string;

  /** Fix common issues automatically */
  fix?: boolean;
}

/**
 * Options for the analyze command.
 */
export interface AnalyzeOptions {
  /** Specific result file to analyze */
  result?: string;

  /** Output format (console or json) */
  format?: 'console' | 'json';
}
