/**
 * Result Comparison Engine
 *
 * Compares actual scan results against expected ground truth values.
 * Implements field-by-field comparison with fuzzy matching for merchants
 * and tolerance for items count.
 *
 * Comparison Rules (per PRD/Architecture):
 * - Total: Exact match (no tolerance)
 * - Date: Exact match (optional tolerance override)
 * - Merchant: Fuzzy similarity >= 0.8
 * - Items Count: ±1 tolerance
 * - Item Prices: Per-item exact match
 *
 * @see docs/sprint-artifacts/epic8/story-8.4-result-comparison-engine.md
 */

import { CONFIG } from '../config';
import type {
  NumericFieldResult,
  StringFieldResult,
  FuzzyFieldResult,
  CategoryFieldResult,
  ItemCountResult,
  ItemPricesResult,
  ItemComparison,
  FieldResults,
  TestResult,
  CorrectionsFeedback,
} from '../types';
import type { GroundTruth, GroundTruthItem } from './ground-truth';
import { stringSimilarity, MERCHANT_SIMILARITY_THRESHOLD, findBestMatch } from './fuzzy';

// ============================================================================
// Types for Actual Results (from Cloud Function)
// ============================================================================

/**
 * Actual item from scan result.
 */
export interface ActualItem {
  name: string;
  price: number;
  category?: string;
}

/**
 * Actual scan result from Cloud Function.
 */
export interface ActualScanResult {
  merchant: string;
  date: string;
  total: number;
  category: string;
  items: ActualItem[];
}

// ============================================================================
// Individual Field Comparators
// ============================================================================

/**
 * Compares total amounts using exact match.
 *
 * AC1: Total field comparison uses exact match (no tolerance)
 *
 * @param expected - Expected total from ground truth
 * @param actual - Actual total from scan
 * @returns Comparison result with match status
 *
 * @example
 * compareTotal(15990, 15990) // { expected: 15990, actual: 15990, match: true }
 * compareTotal(15990, 15980) // { expected: 15990, actual: 15980, match: false, difference: 10 }
 */
export function compareTotal(expected: number, actual: number): NumericFieldResult {
  const match = expected === actual;
  return {
    expected,
    actual,
    match,
    difference: match ? undefined : Math.abs(expected - actual),
  };
}

/**
 * Compares dates using exact string match.
 *
 * AC2: Date field comparison uses exact match by default
 *
 * @param expected - Expected date (YYYY-MM-DD)
 * @param actual - Actual date from scan (YYYY-MM-DD)
 * @param tolerance - Optional tolerance ('exact', 'day', 'month')
 * @returns Comparison result with match status
 *
 * @example
 * compareDate("2024-01-15", "2024-01-15") // match: true
 * compareDate("2024-01-15", "2024-01-16") // match: false
 * compareDate("2024-01-15", "2024-01-16", "day") // match: true (same month)
 */
export function compareDate(
  expected: string,
  actual: string,
  tolerance: 'exact' | 'day' | 'month' = 'exact'
): StringFieldResult {
  let match: boolean;

  switch (tolerance) {
    case 'exact':
      match = expected === actual;
      break;

    case 'day':
      // Match if same year and month (day can differ)
      match = expected.substring(0, 7) === actual.substring(0, 7);
      break;

    case 'month':
      // Match if same year (month and day can differ)
      match = expected.substring(0, 4) === actual.substring(0, 4);
      break;

    default:
      match = expected === actual;
  }

  return {
    expected,
    actual,
    match,
  };
}

/**
 * Compares merchant names using fuzzy string similarity.
 *
 * AC3: Merchant name uses fuzzy similarity with threshold >= 0.8 for pass
 *
 * @param expected - Expected merchant name from ground truth
 * @param actual - Actual merchant name from scan
 * @param threshold - Minimum similarity for match (default: 0.8)
 * @returns Comparison result with similarity score and match status
 *
 * @example
 * compareMerchant("JUMBO", "Jumbo") // similarity: 1.0, match: true
 * compareMerchant("JUMBO", "WALMART") // similarity: ~0.0, match: false
 */
export function compareMerchant(
  expected: string,
  actual: string,
  threshold: number = MERCHANT_SIMILARITY_THRESHOLD
): FuzzyFieldResult {
  const similarity = stringSimilarity(expected, actual);
  return {
    expected,
    actual,
    similarity,
    match: similarity >= threshold,
  };
}

/**
 * Compares category strings using case-insensitive exact match.
 *
 * @param expected - Expected category from ground truth
 * @param actual - Actual category from scan
 * @returns Comparison result with match status
 *
 * @example
 * compareCategory("Groceries", "groceries") // match: true
 * compareCategory("parking", "Other") // match: false
 */
export function compareCategory(expected: string, actual: string): CategoryFieldResult {
  const match = expected.toLowerCase() === actual.toLowerCase();
  return {
    expected,
    actual,
    match,
  };
}

/**
 * Compares items count with tolerance.
 *
 * AC4: Items count allows ±1 tolerance
 *
 * @param expected - Expected number of items
 * @param actual - Actual number of items from scan
 * @param tolerance - Allowed difference (default: 1 from config)
 * @returns Comparison result with match status
 *
 * @example
 * compareItemsCount(5, 5) // match: true
 * compareItemsCount(5, 6) // match: true (within ±1)
 * compareItemsCount(5, 7) // match: false (outside ±1)
 */
export function compareItemsCount(
  expected: number,
  actual: number,
  tolerance: number = CONFIG.thresholds.itemsCount.tolerance ?? 1
): ItemCountResult {
  const difference = Math.abs(expected - actual);
  return {
    expected,
    actual,
    match: difference <= tolerance,
    tolerance,
  };
}

/**
 * Compares item prices between expected and actual items.
 *
 * AC5: Per-item price comparison uses exact match
 *
 * Strategy:
 * 1. Try to match items by name (fuzzy matching)
 * 2. Compare prices for matched items
 * 3. Calculate accuracy as percentage of correct prices
 *
 * @param expectedItems - Expected items from ground truth
 * @param actualItems - Actual items from scan
 * @returns Comparison result with per-item details and accuracy
 *
 * @example
 * compareItemPrices(
 *   [{ name: "Milk", price: 1990 }],
 *   [{ name: "MILK", price: 1990 }]
 * )
 * // { accuracy: 100, matchCount: 1, totalCount: 1, details: [...] }
 */
export function compareItemPrices(
  expectedItems: GroundTruthItem[],
  actualItems: ActualItem[]
): ItemPricesResult {
  const details: ItemComparison[] = [];
  let matchCount = 0;

  // For each expected item, find the best matching actual item
  const usedActualIndices = new Set<number>();

  for (let i = 0; i < expectedItems.length; i++) {
    const expected = expectedItems[i];

    // Get remaining actual item names for matching
    const remainingActual = actualItems
      .map((item, idx) => ({ name: item.name, idx }))
      .filter(({ idx }) => !usedActualIndices.has(idx));

    if (remainingActual.length === 0) {
      // No more actual items to match
      details.push({
        index: i,
        expectedName: expected.name,
        actualName: '',
        nameSimilarity: 0,
        nameMatch: false,
        expectedPrice: expected.price,
        actualPrice: 0,
        priceMatch: false,
        match: false,
      });
      continue;
    }

    // Find best matching actual item by name
    const bestMatch = findBestMatch(
      expected.name,
      remainingActual.map((r) => r.name)
    );

    if (!bestMatch) {
      details.push({
        index: i,
        expectedName: expected.name,
        actualName: '',
        nameSimilarity: 0,
        nameMatch: false,
        expectedPrice: expected.price,
        actualPrice: 0,
        priceMatch: false,
        match: false,
      });
      continue;
    }

    const actualIdx = remainingActual[bestMatch.index].idx;
    const actual = actualItems[actualIdx];
    usedActualIndices.add(actualIdx);

    // Compare prices (exact match)
    const priceMatch = expected.price === actual.price;
    const nameMatch = bestMatch.similarity >= 0.6; // Lower threshold for item names

    if (priceMatch) {
      matchCount++;
    }

    details.push({
      index: i,
      expectedName: expected.name,
      actualName: actual.name,
      nameSimilarity: bestMatch.similarity,
      nameMatch,
      expectedPrice: expected.price,
      actualPrice: actual.price,
      priceMatch,
      match: priceMatch && nameMatch,
    });
  }

  // Calculate accuracy
  const totalCount = expectedItems.length;
  const accuracy = totalCount > 0 ? (matchCount / totalCount) * 100 : 100;

  return {
    accuracy,
    details,
    matchCount,
    totalCount,
  };
}

// ============================================================================
// Composite Score Calculation
// ============================================================================

/**
 * Calculates weighted composite score per PRD thresholds.
 *
 * AC6: Weighted composite score with:
 * - Total: 25% weight
 * - Date: 15% weight
 * - Merchant: 20% weight
 * - Items Count: 15% weight
 * - Item Prices: 25% weight
 *
 * @param fieldResults - Results of all field comparisons
 * @returns Composite score (0-100)
 *
 * @example
 * calculateCompositeScore({
 *   total: { match: true },
 *   date: { match: true },
 *   merchant: { match: true, similarity: 0.9 },
 *   itemsCount: { match: false },
 *   itemPrices: { accuracy: 80 }
 * })
 * // Score = (1*0.25) + (1*0.15) + (1*0.20) + (0*0.15) + (0.80*0.25) = 0.80 * 100 = 80
 */
export function calculateCompositeScore(fieldResults: FieldResults): number {
  const { thresholds } = CONFIG;

  const totalScore = fieldResults.total.match ? 1 : 0;
  const dateScore = fieldResults.date.match ? 1 : 0;
  const merchantScore = fieldResults.merchant.match ? 1 : 0;
  const itemsCountScore = fieldResults.itemsCount.match ? 1 : 0;
  const itemPricesScore = fieldResults.itemPrices.accuracy / 100; // Convert percentage to 0-1

  const compositeScore =
    totalScore * thresholds.total.weight +
    dateScore * thresholds.date.weight +
    merchantScore * thresholds.merchant.weight +
    itemsCountScore * thresholds.itemsCount.weight +
    itemPricesScore * thresholds.itemPrices.weight;

  return Math.round(compositeScore * 100 * 100) / 100; // Round to 2 decimal places
}

// ============================================================================
// Main Compare Function
// ============================================================================

/**
 * Generates corrections feedback from ground truth source info.
 *
 * This provides insight into what the AI got wrong, helping identify
 * areas where the prompt could be improved.
 *
 * @param source - The _source metadata from ground truth computation
 * @returns Structured feedback about corrections applied
 */
export function generateCorrectionsFeedback(source: GroundTruth['_source']): CorrectionsFeedback {
  const parts: string[] = [];

  if (source.correctedFields.length > 0) {
    parts.push(`AI errors: ${source.correctedFields.join(', ')}`);
  }

  if (source.itemsModified > 0) {
    parts.push(`${source.itemsModified} item(s) had wrong values`);
  }

  if (source.itemsDeleted > 0) {
    parts.push(`${source.itemsDeleted} item(s) were hallucinated by AI`);
  }

  if (source.itemsAdded > 0) {
    parts.push(`${source.itemsAdded} item(s) were missed by AI`);
  }

  const hasCorrections = source.correctedFields.length > 0 ||
    source.itemsModified > 0 ||
    source.itemsDeleted > 0 ||
    source.itemsAdded > 0;

  return {
    correctedFields: source.correctedFields,
    itemsModified: source.itemsModified,
    itemsDeleted: source.itemsDeleted,
    itemsAdded: source.itemsAdded,
    hasCorrections,
    summary: hasCorrections ? parts.join('; ') : 'AI extraction was correct (no corrections needed)',
  };
}

/**
 * Compares actual scan result against expected ground truth.
 *
 * AC8: Comparator produces TestResult with all field comparisons and scores
 *
 * @param testId - Unique test identifier
 * @param expected - Ground truth computed from test case
 * @param actual - Actual scan result from Cloud Function
 * @param options - Optional comparison options
 * @returns Complete TestResult with all comparisons and scores
 *
 * @example
 * ```typescript
 * const result = compare("jumbo-001", groundTruth, actualResult, {
 *   storeType: "supermarket",
 *   promptVersion: "v1-original"
 * });
 * console.log(`Score: ${result.score}, Passed: ${result.passed}`);
 * ```
 */
export function compare(
  testId: string,
  expected: GroundTruth,
  actual: ActualScanResult,
  options: {
    storeType?: string;
    promptVersion?: string;
    apiCost?: number;
    duration?: number;
    dateTolerance?: 'exact' | 'day' | 'month';
    merchantThreshold?: number;
    itemsCountTolerance?: number;
  } = {}
): TestResult {
  const {
    storeType = 'other',
    promptVersion = CONFIG.defaultPrompt,
    apiCost = CONFIG.estimatedCostPerScan,
    duration = 0,
    dateTolerance = 'exact',
    merchantThreshold,
    itemsCountTolerance,
  } = options;

  // Compare all fields (including category)
  const fields: FieldResults = {
    total: compareTotal(expected.total, actual.total),
    date: compareDate(expected.date, actual.date, dateTolerance),
    merchant: compareMerchant(expected.merchant, actual.merchant, merchantThreshold),
    category: compareCategory(expected.category, actual.category),
    itemsCount: compareItemsCount(expected.items.length, actual.items.length, itemsCountTolerance),
    itemPrices: compareItemPrices(expected.items, actual.items),
  };

  // Calculate composite score
  const score = calculateCompositeScore(fields);

  // Determine if test passed (all fields must match)
  const passed =
    fields.total.match &&
    fields.date.match &&
    fields.merchant.match &&
    fields.itemsCount.match &&
    fields.itemPrices.accuracy === 100;

  // Generate corrections feedback from ground truth source
  const correctionsFeedback = generateCorrectionsFeedback(expected._source);

  return {
    testId,
    passed,
    score,
    fields,
    apiCost,
    duration,
    storeType,
    promptVersion,
    correctionsFeedback,
  };
}

/**
 * Creates an error test result when the test fails due to an error.
 *
 * @param testId - Test identifier
 * @param error - Error message
 * @param options - Optional metadata
 * @returns TestResult with error flag set
 */
export function createErrorResult(
  testId: string,
  error: string,
  options: {
    storeType?: string;
    promptVersion?: string;
    duration?: number;
  } = {}
): TestResult {
  const { storeType = 'other', promptVersion = CONFIG.defaultPrompt, duration = 0 } = options;

  // Create a "zero" result for errors
  const emptyNumeric: NumericFieldResult = { expected: 0, actual: 0, match: false };
  const emptyString: StringFieldResult = { expected: '', actual: '', match: false };
  const emptyFuzzy: FuzzyFieldResult = { expected: '', actual: '', similarity: 0, match: false };
  const emptyCategory: CategoryFieldResult = { expected: '', actual: '', match: false };
  const emptyItemCount: ItemCountResult = { expected: 0, actual: 0, match: false, tolerance: 1 };
  const emptyItemPrices: ItemPricesResult = {
    accuracy: 0,
    details: [],
    matchCount: 0,
    totalCount: 0,
  };

  return {
    testId,
    passed: false,
    score: 0,
    fields: {
      total: emptyNumeric,
      date: emptyString,
      merchant: emptyFuzzy,
      category: emptyCategory,
      itemsCount: emptyItemCount,
      itemPrices: emptyItemPrices,
    },
    apiCost: 0,
    duration,
    storeType,
    promptVersion,
    error,
  };
}
