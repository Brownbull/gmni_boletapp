/**
 * Scan Test CLI Configuration
 *
 * Configuration constants for the test harness including directories,
 * limits, thresholds, and accuracy targets per ADR-012.
 *
 * @see docs/sprint-artifacts/epic8/architecture-epic8.md#Configuration
 */

/**
 * Accuracy threshold configuration for a single field.
 */
export interface ThresholdConfig {
  /** Target accuracy percentage (0-1) */
  target: number;
  /** Weight in composite score (0-1, all weights should sum to 1) */
  weight: number;
  /** Optional: fuzzy matching threshold for string fields */
  fuzzyThreshold?: number;
  /** Optional: tolerance for numeric comparisons */
  tolerance?: number;
}

/**
 * Global configuration for the scan test harness.
 */
export const CONFIG = {
  /**
   * Directory containing test receipt images and expected.json files.
   * Structure: prompt-testing/test-cases/{store-type}/{test-id}.jpg + {test-id}.expected.json
   */
  testDataDir: 'prompt-testing/test-cases',

  /**
   * Directory for test result output files.
   * Files are named: {timestamp}_{prompt-version}.json
   */
  resultsDir: 'prompt-testing/results',

  /**
   * Directory containing prompts.
   */
  promptsDir: 'prompt-testing/prompts',

  /**
   * Default maximum tests per run (ADR-012: Cost Protection).
   * Each test costs ~$0.01 API call.
   * Override with --limit=N or --limit=all
   */
  defaultLimit: 5,

  /**
   * Default prompt identifier to use.
   */
  defaultPrompt: 'ACTIVE_PROMPT',

  /**
   * Cloud Function URL (auto-detected from firebase.json if not set).
   */
  cloudFunctionUrl: process.env.CLOUD_FUNCTION_URL || 'auto-detect',

  /**
   * Accuracy thresholds per field (from PRD).
   *
   * Composite Score = sum of (fieldCorrect ? 1 : 0) * weight for each field
   *
   * | Field       | Target | Weight | Method |
   * |-------------|--------|--------|--------|
   * | Total       | 98%    | 25%    | Exact match |
   * | Date        | 95%    | 15%    | Exact match |
   * | Merchant    | 90%    | 20%    | Fuzzy ≥ 0.8 |
   * | Items Count | 85%    | 15%    | ±1 tolerance |
   * | Item Prices | 90%    | 25%    | Per-item exact |
   */
  thresholds: {
    total: {
      target: 0.98,
      weight: 0.25,
    } as ThresholdConfig,
    date: {
      target: 0.95,
      weight: 0.15,
    } as ThresholdConfig,
    merchant: {
      target: 0.90,
      weight: 0.20,
      fuzzyThreshold: 0.8,
    } as ThresholdConfig,
    itemsCount: {
      target: 0.85,
      weight: 0.15,
      tolerance: 1,
    } as ThresholdConfig,
    itemPrices: {
      target: 0.90,
      weight: 0.25,
    } as ThresholdConfig,
  },

  /**
   * Estimated cost per API call (USD).
   * Used for cost tracking and reporting.
   */
  estimatedCostPerScan: 0.01,

  /**
   * API retry configuration.
   */
  api: {
    /** Number of retries on failure */
    maxRetries: 1,
    /** Wait time in ms when rate limited */
    rateLimitWaitMs: 30000,
    /** Request timeout in ms */
    timeoutMs: 30000,
  },

  /**
   * Valid store types for filtering.
   */
  validStoreTypes: [
    'supermarket',
    'pharmacy',
    'restaurant',
    'gas_station',
    'convenience',
    'other',
  ] as const,
} as const;

/**
 * Type for valid store types.
 */
export type ValidStoreType = typeof CONFIG.validStoreTypes[number];

/**
 * Check if a string is a valid store type.
 */
export function isValidStoreType(type: string): type is ValidStoreType {
  return CONFIG.validStoreTypes.includes(type as ValidStoreType);
}

/**
 * Exit codes for the CLI.
 *
 * | Code | Meaning |
 * |------|---------|
 * | 0    | All tests passed |
 * | 1    | One or more test failures |
 * | 2    | Error (invalid args, API error, etc.) |
 */
export const EXIT_CODES = {
  SUCCESS: 0,
  TEST_FAILURE: 1,
  ERROR: 2,
} as const;
