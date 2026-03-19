/**
 * Run Command - Execute scan tests against Cloud Function
 *
 * Main entry point for the test:scan command. Discovers test cases,
 * runs them through the Cloud Function, and reports results.
 *
 * Output Modes (AC6):
 * - Default: Progress + summary + failed tests
 * - --verbose: + per-test details, diffs
 * - --quiet: Only final pass/fail
 * - --json: Machine-readable JSON to stdout
 *
 * Prompt Options (Story 8.7):
 * - --prompt=v1: Use specific prompt version
 * - --compare=v1,v2: A/B compare two prompt versions
 *
 * @see docs/sprint-artifacts/epic8/architecture-epic8.md#Test-Execution-Flow
 * @see docs/sprint-artifacts/epic8/story-8.5-accuracy-reporting.md
 * @see docs/sprint-artifacts/epic8/story-8.7-ab-prompt-comparison-analysis.md
 */

import chalk from 'chalk';
import { CONFIG, EXIT_CODES } from '../config';
import {
  discoverTestCases,
  discoverAllCategories,
  loadImageBuffer,
  loadExpectedJson,
  type TestCase,
} from '../lib/discovery';
import { scanReceipt, authenticateUser, signOutUser } from '../lib/scanner';
import {
  displayBanner,
  displayConfig,
  displayDryRunPlan,
  displaySummary,
  displayFailures,
  displayVerboseResult,
  displayResultsFilePath,
  displayQuietSummary,
  reportProgress,
  outputJson,
  log,
  type OutputMode,
} from '../lib/reporter';
import { saveResults, ensureGitKeep } from '../lib/result-writer';
import { validateTestCase, type TestCaseFile } from '../lib/schema';
import type { RunOptions, TestResult, TestRunSummary, FieldResults } from '../types';
import { listPrompts } from '../../prompts';
import { runComparisonMode } from './run-comparison';

// ============================================================================
// Types
// ============================================================================

interface ParsedOptions {
  image?: string;
  type?: string;
  folder?: string;
  limit: number | 'all';
  verbose: boolean;
  quiet: boolean;
  json: boolean;
  dryRun: boolean;
  outputMode: OutputMode;
  prompt?: string;
  compare?: [string, string];
}

// ============================================================================
// Main Command Handler
// ============================================================================

/**
 * Execute the run command.
 *
 * @param options - Command options from Commander
 */
export async function runCommand(options: RunOptions): Promise<void> {
  try {
    // Parse and validate options
    const parsedOptions = parseOptions(options);

    // Ensure .gitkeep exists for test-results directory (AC5)
    ensureGitKeep();

    // A/B Comparison Mode (AC4, AC5, AC6 from Story 8.7)
    if (parsedOptions.compare) {
      await runComparisonMode(parsedOptions, generateSummary);
      return;
    }

    // Display banner
    displayBanner(parsedOptions.outputMode);

    // Display configuration
    displayConfig(
      {
        limit: parsedOptions.limit,
        type: parsedOptions.type,
        image: parsedOptions.image,
        dryRun: parsedOptions.dryRun,
        folder: parsedOptions.folder,
        prompt: parsedOptions.prompt,
      },
      parsedOptions.outputMode
    );

    // Show available prompts if using --prompt flag
    if (parsedOptions.prompt && parsedOptions.outputMode !== 'quiet' && parsedOptions.outputMode !== 'json') {
      log.info(`Using prompt: ${parsedOptions.prompt}`);
    }

    // Show category summary before running (helps user decide scope)
    if (parsedOptions.outputMode !== 'quiet' && parsedOptions.outputMode !== 'json') {
      displayCategorySummary(parsedOptions.folder);
    }

    // Discover test cases
    if (parsedOptions.outputMode !== 'quiet' && parsedOptions.outputMode !== 'json') {
      log.info('Discovering test cases...');
    }
    const testCases = discoverTestCases({
      image: parsedOptions.image,
      type: parsedOptions.type,
      folder: parsedOptions.folder,
    });

    if (testCases.length === 0) {
      if (parsedOptions.outputMode === 'json') {
        console.log(JSON.stringify({ error: 'No test cases found', testCount: 0 }));
      } else {
        log.warn('No test cases found.');
        log.dim('Ensure test-cases/ contains images with matching .expected.json files.');
        log.dim('Use npm run test:scan:generate to create expected.json from images.');
      }
      process.exit(EXIT_CODES.ERROR);
    }

    // Apply limit (respect maxTestsPerRun hard cap)
    const maxLimit = CONFIG.maxTestsPerRun;
    const effectiveLimit =
      parsedOptions.limit === 'all'
        ? Math.min(testCases.length, maxLimit)
        : Math.min(parsedOptions.limit, testCases.length, maxLimit);

    const selectedCases = testCases.slice(0, effectiveLimit);

    if (parsedOptions.outputMode !== 'quiet' && parsedOptions.outputMode !== 'json') {
      log.info(`Found ${testCases.length} test case(s), running ${selectedCases.length} (max ${maxLimit}/run)`);
      if (testCases.length > maxLimit && parsedOptions.limit === 'all') {
        log.warn(`Capped at ${maxLimit} tests. Use --type to target specific categories.`);
      }
    }

    // Dry run mode - just show the plan
    if (parsedOptions.dryRun) {
      displayDryRunPlan(selectedCases, parsedOptions.outputMode);
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Authenticate before running tests
    if (parsedOptions.outputMode !== 'quiet' && parsedOptions.outputMode !== 'json') {
      log.info('Authenticating...');
    }
    await authenticateUser();
    if (parsedOptions.outputMode !== 'quiet' && parsedOptions.outputMode !== 'json') {
      log.success('Authenticated');
    }

    // Run tests
    if (parsedOptions.outputMode !== 'json') {
      console.log('');
    }
    const startTime = Date.now();
    const results = await runTests(selectedCases, parsedOptions);
    const endTime = Date.now();

    // Generate summary (with prompt version if specified)
    const promptVersion = parsedOptions.prompt || 'DEV_PROMPT';
    const summary = generateSummary(results, startTime, endTime, promptVersion);

    // Handle output based on mode (AC6)
    if (parsedOptions.outputMode === 'json') {
      // JSON mode: output to stdout
      outputJson(summary, results);
    } else if (parsedOptions.outputMode === 'quiet') {
      // Quiet mode: only final pass/fail
      displayQuietSummary(summary);
    } else {
      // Default/verbose mode: full display
      displaySummary(summary, parsedOptions.outputMode);
      displayFailures(results, parsedOptions.outputMode);

      // Save results to JSON file (AC4)
      const filepath = saveResults(results, summary, promptVersion);
      displayResultsFilePath(filepath, parsedOptions.outputMode);
    }

    // Sign out
    await signOutUser();

    // Exit with appropriate code
    const exitCode = summary.failedTests > 0 ? EXIT_CODES.TEST_FAILURE : EXIT_CODES.SUCCESS;

    process.exit(exitCode);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(errorMessage);
    process.exit(EXIT_CODES.ERROR);
  }
}

// ============================================================================
// Category Summary Display
// ============================================================================

/**
 * Display category summary table before running tests.
 * Shows available categories, baseline counts, and total images.
 */
function displayCategorySummary(folder?: string): void {
  const categories = discoverAllCategories(folder);
  if (categories.length === 0) return;

  const totalBaseline = categories.reduce((sum, c) => sum + c.withBaseline, 0);
  const totalImages = categories.reduce((sum, c) => sum + c.totalImages, 0);

  console.log('');
  const catCol = 22;
  const numCol = 10;
  console.log(
    '  ' +
    chalk.dim('Category'.padEnd(catCol)) +
    chalk.dim('Testable'.padStart(numCol)) +
    chalk.dim('Images'.padStart(numCol))
  );
  console.log('  ' + chalk.dim('─'.repeat(catCol + numCol * 2)));

  for (const cat of categories) {
    const testable = String(cat.withBaseline).padStart(numCol);
    const total = String(cat.totalImages).padStart(numCol);
    const catName = cat.path.padEnd(catCol);

    if (cat.withBaseline === 0) {
      console.log('  ' + chalk.dim(catName + testable + total));
    } else {
      console.log('  ' + catName + chalk.green(testable) + total);
    }
  }

  console.log('  ' + chalk.dim('─'.repeat(catCol + numCol * 2)));
  console.log(
    '  ' +
    chalk.bold('Total'.padEnd(catCol)) +
    chalk.bold(String(totalBaseline).padStart(numCol)) +
    String(totalImages).padStart(numCol)
  );
  console.log(chalk.dim(`  ~$${CONFIG.estimatedCostPerScan}/test | Max ${CONFIG.maxTestsPerRun}/run`));
  console.log('');
}

// ============================================================================
// Option Parsing
// ============================================================================

/**
 * Parse and validate command options.
 */
function parseOptions(options: RunOptions): ParsedOptions {
  // Parse limit
  let limit: number | 'all' = CONFIG.defaultLimit;

  if (options.limit !== undefined) {
    if (options.limit === 'all') {
      limit = 'all';
    } else {
      const parsed =
        typeof options.limit === 'number' ? options.limit : parseInt(String(options.limit), 10);

      if (isNaN(parsed) || parsed < 1) {
        throw new Error(`Invalid limit: ${options.limit}. Must be a positive number or "all".`);
      }
      limit = parsed;
    }
  }

  // Determine output mode (AC6)
  let outputMode: OutputMode = 'default';
  if (options.json) {
    outputMode = 'json';
  } else if (options.quiet) {
    outputMode = 'quiet';
  } else if (options.verbose) {
    outputMode = 'verbose';
  }

  // Validate prompt option (Story 8.7)
  let prompt: string | undefined;
  if (options.prompt) {
    const availablePrompts = listPrompts().map((p) => p.id);
    if (!availablePrompts.includes(options.prompt)) {
      throw new Error(
        `Invalid prompt: ${options.prompt}. ` +
          `Available prompts: ${availablePrompts.join(', ')}`
      );
    }
    prompt = options.prompt;
  }

  // Parse --compare option (Story 8.7)
  let compare: [string, string] | undefined;
  if (options.compare) {
    const parts = options.compare.split(',').map((s) => s.trim());
    if (parts.length !== 2) {
      throw new Error(
        `Invalid --compare format: "${options.compare}". ` +
          `Expected format: --compare=v1,v2`
      );
    }
    const availablePrompts = listPrompts().map((p) => p.id);
    for (const part of parts) {
      if (!availablePrompts.includes(part)) {
        throw new Error(
          `Invalid prompt in --compare: "${part}". ` +
            `Available prompts: ${availablePrompts.join(', ')}`
        );
      }
    }
    compare = parts as [string, string];
  }

  return {
    image: options.image,
    type: options.type,
    folder: options.folder,
    limit,
    verbose: options.verbose ?? false,
    quiet: options.quiet ?? false,
    json: options.json ?? false,
    dryRun: options.dryRun ?? false,
    outputMode,
    prompt,
    compare,
  };
}

// ============================================================================
// Test Execution
// ============================================================================

/**
 * Run all test cases and collect results.
 */
async function runTests(testCases: TestCase[], options: ParsedOptions): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testId = `${testCase.storeType}/${testCase.testId}`;

    // Report progress (running) - AC7
    reportProgress(i + 1, testCases.length, testId, 'running', options.outputMode);

    const result = await runSingleTest(testCase);
    results.push(result);

    // Update progress with result
    const status = result.error ? 'error' : result.passed ? 'pass' : 'fail';

    // Move cursor up and rewrite line (only for non-json/quiet modes)
    if (options.outputMode !== 'json' && options.outputMode !== 'quiet') {
      process.stdout.write('\x1b[1A\x1b[2K');
    }
    reportProgress(i + 1, testCases.length, testId, status, options.outputMode);

    // Show verbose output (AC7 verbose mode)
    if (options.verbose && !result.error) {
      displayVerboseResult(result);
    }
  }

  return results;
}

/**
 * Run a single test case.
 */
async function runSingleTest(testCase: TestCase): Promise<TestResult> {
  const startTime = Date.now();
  const testId = `${testCase.storeType}/${testCase.testId}`;

  try {
    // Load expected data
    const expectedData = loadExpectedJson(testCase.expectedPath);
    const expected = validateTestCase(expectedData);

    // Load and scan image
    const imageBuffer = loadImageBuffer(testCase.imagePath);
    const actual = await scanReceipt(imageBuffer);

    // Compare results
    const fields = compareResults(expected, actual);
    const score = calculateScore(fields);
    const passed = score >= 70; // Passing threshold

    return {
      testId,
      passed,
      score,
      fields,
      apiCost: CONFIG.estimatedCostPerScan,
      duration: Date.now() - startTime,
      storeType: testCase.storeType,
      promptVersion: 'ACTIVE_PROMPT',
    };
  } catch (error) {
    return {
      testId,
      passed: false,
      score: 0,
      fields: getEmptyFields(),
      apiCost: CONFIG.estimatedCostPerScan,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      storeType: testCase.storeType,
      promptVersion: 'ACTIVE_PROMPT',
    };
  }
}

// ============================================================================
// Comparison Logic (Basic - Full implementation in Story 8.4)
// ============================================================================

/**
 * Compute ground truth from test case (aiExtraction + corrections).
 */
function getGroundTruth(testCase: TestCaseFile): {
  merchant: string;
  date: string;
  total: number;
  category: string;
  items: Array<{ name: string; totalPrice: number; unitPrice?: number; category?: string }>;
} {
  const ai = testCase.aiExtraction;
  const corrections = testCase.corrections;

  // Start with AI extraction as base
  const baseItems = ai?.items ?? [];
  const result = {
    merchant: ai?.merchant ?? '',
    date: ai?.date ?? '',
    total: ai?.total ?? 0,
    category: ai?.category ?? '',
    items: baseItems.map((item) => ({
      name: item.name,
      totalPrice: item.totalPrice,
      unitPrice: item.unitPrice,
      category: item.category,
    })),
  };

  // Apply corrections
  if (corrections) {
    if (corrections.merchant !== undefined) result.merchant = corrections.merchant;
    if (corrections.date !== undefined) result.date = corrections.date;
    if (corrections.total !== undefined) result.total = corrections.total;
    if (corrections.category !== undefined) result.category = corrections.category;

    // Apply item corrections
    if (corrections.items) {
      for (const [indexStr, correction] of Object.entries(corrections.items)) {
        const index = parseInt(indexStr, 10);
        if (index >= 0 && index < result.items.length) {
          if (correction.delete) {
            result.items[index] = { ...result.items[index], name: '__DELETE__' };
          } else {
            if (correction.name !== undefined) result.items[index].name = correction.name;
            if (correction.totalPrice !== undefined) result.items[index].totalPrice = correction.totalPrice;
            if (correction.category !== undefined) result.items[index].category = correction.category;
          }
        }
      }
      result.items = result.items.filter((item) => item.name !== '__DELETE__');
    }

    // Add missing items
    if (corrections.addItems) {
      result.items.push(...corrections.addItems.map(item => ({
        name: item.name,
        totalPrice: item.totalPrice,
        unitPrice: item.unitPrice,
        category: item.category,
      })));
    }
  }

  return result;
}

/**
 * Compare actual scan result against expected (ground truth).
 */
function compareResults(
  expected: TestCaseFile,
  actual: { merchant: string; date: string; total: number; category?: string; items: Array<{ name: string; totalPrice: number }> }
): FieldResults {
  const groundTruth = getGroundTruth(expected);

  const totalMatch = Math.abs(groundTruth.total - actual.total) < 0.01;
  const dateMatch = groundTruth.date === actual.date;
  const merchantSimilarity = simpleSimilarity(groundTruth.merchant, actual.merchant);
  const merchantMatch = merchantSimilarity >= (expected.thresholds?.merchantSimilarity ?? 0.8);
  const expectedCategory = groundTruth.category || 'Other';
  const actualCategory = actual.category || 'Other';
  const categoryMatch = expectedCategory.toLowerCase() === actualCategory.toLowerCase();

  const expectedCount = groundTruth.items.length;
  const actualCount = actual.items.length;
  const tolerance = CONFIG.thresholds.itemsCount.tolerance ?? 1;
  const countMatch = Math.abs(expectedCount - actualCount) <= tolerance;

  // Name-matched item comparison: match expected items to actual items by
  // name similarity (greedy best-match), then compare prices on matched pairs.
  // This avoids false negatives when the AI returns items in a different order.
  let priceMatchCount = 0;
  const itemDetails = [];
  const usedActualIndices = new Set<number>();

  for (let i = 0; i < expectedCount; i++) {
    const expectedItem = groundTruth.items[i];
    let bestMatch = -1;
    let bestSimilarity = 0;

    // Find best matching actual item by name
    for (let j = 0; j < actualCount; j++) {
      if (usedActualIndices.has(j)) continue;
      const sim = simpleSimilarity(expectedItem.name, actual.items[j].name);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatch = j;
      }
    }

    const NAME_MATCH_THRESHOLD = 0.4;
    if (bestMatch >= 0 && bestSimilarity >= NAME_MATCH_THRESHOLD) {
      usedActualIndices.add(bestMatch);
      const actualItem = actual.items[bestMatch];
      const priceMatch = Math.abs(expectedItem.totalPrice - actualItem.totalPrice) < 0.01;
      if (priceMatch) priceMatchCount++;
      itemDetails.push({
        index: i, expectedName: expectedItem.name, actualName: actualItem.name,
        nameSimilarity: bestSimilarity, nameMatch: bestSimilarity >= NAME_MATCH_THRESHOLD,
        expectedPrice: expectedItem.totalPrice, actualPrice: actualItem.totalPrice,
        priceMatch, match: priceMatch,
      });
    } else {
      // No matching actual item found
      itemDetails.push({
        index: i, expectedName: expectedItem.name, actualName: '',
        nameSimilarity: 0, nameMatch: false,
        expectedPrice: expectedItem.totalPrice, actualPrice: 0,
        priceMatch: false, match: false,
      });
    }
  }

  const priceAccuracy = expectedCount > 0 ? (priceMatchCount / expectedCount) * 100 : 100;

  return {
    total: { expected: groundTruth.total, actual: actual.total, match: totalMatch, difference: actual.total - groundTruth.total },
    date: { expected: groundTruth.date, actual: actual.date, match: dateMatch },
    merchant: { expected: groundTruth.merchant, actual: actual.merchant, similarity: merchantSimilarity, match: merchantMatch },
    category: { expected: expectedCategory, actual: actualCategory, match: categoryMatch },
    itemsCount: { expected: expectedCount, actual: actualCount, match: countMatch, tolerance },
    itemPrices: { accuracy: priceAccuracy, details: itemDetails, matchCount: priceMatchCount, totalCount: expectedCount },
  };
}

/**
 * Simple string similarity (Dice coefficient).
 */
function simpleSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  if (aLower === bLower) return 1;
  if (aLower.length === 0 || bLower.length === 0) return 0;

  const aChars = aLower.split('');
  const bSet = new Set(bLower.split(''));
  const uniqueIntersection = new Set(aChars.filter((c) => bSet.has(c))).size;
  const aSet = new Set(aChars);
  return (2 * uniqueIntersection) / (aSet.size + bSet.size);
}

/**
 * Calculate weighted composite score.
 */
function calculateScore(fields: FieldResults): number {
  const thresholds = CONFIG.thresholds;

  return (
    (fields.total.match ? 1 : 0) * thresholds.total.weight * 100 +
    (fields.date.match ? 1 : 0) * thresholds.date.weight * 100 +
    (fields.merchant.match ? 1 : 0) * thresholds.merchant.weight * 100 +
    (fields.itemsCount.match ? 1 : 0) * thresholds.itemsCount.weight * 100 +
    (fields.itemPrices.accuracy / 100) * thresholds.itemPrices.weight * 100
  );
}

/**
 * Get empty field results (for error cases).
 */
function getEmptyFields(): FieldResults {
  return {
    total: { expected: 0, actual: 0, match: false },
    date: { expected: '', actual: '', match: false },
    merchant: { expected: '', actual: '', similarity: 0, match: false },
    category: { expected: '', actual: '', match: false },
    itemsCount: { expected: 0, actual: 0, match: false, tolerance: 1 },
    itemPrices: { accuracy: 0, details: [], matchCount: 0, totalCount: 0 },
  };
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generate test run summary from results.
 */
function generateSummary(
  results: TestResult[],
  startTime: number,
  endTime: number,
  promptVersion: string = 'ACTIVE_PROMPT'
): TestRunSummary {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed && !r.error).length;
  const errored = results.filter((r) => r.error !== undefined).length;

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const overallAccuracy = results.length > 0 ? totalScore / results.length : 0;

  const byStoreType: Record<string, { total: number; passed: number; accuracy: number }> = {};
  for (const result of results) {
    if (!byStoreType[result.storeType]) {
      byStoreType[result.storeType] = { total: 0, passed: 0, accuracy: 0 };
    }
    byStoreType[result.storeType].total++;
    if (result.passed) byStoreType[result.storeType].passed++;
  }
  for (const storeType of Object.keys(byStoreType)) {
    const st = byStoreType[storeType];
    st.accuracy = st.total > 0 ? (st.passed / st.total) * 100 : 0;
  }

  const byField = {
    total: calculateFieldAccuracy(results, (r) => r.fields.total.match),
    date: calculateFieldAccuracy(results, (r) => r.fields.date.match),
    merchant: calculateFieldAccuracy(results, (r) => r.fields.merchant.match),
    itemsCount: calculateFieldAccuracy(results, (r) => r.fields.itemsCount.match),
    itemPrices:
      results.reduce((sum, r) => sum + r.fields.itemPrices.accuracy, 0) / (results.length || 1),
  };

  return {
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date(endTime).toISOString(),
    duration: endTime - startTime,
    promptVersion,
    totalTests: results.length,
    passedTests: passed,
    failedTests: failed,
    erroredTests: errored,
    overallAccuracy,
    totalApiCost: results.reduce((sum, r) => sum + r.apiCost, 0),
    byStoreType,
    byField,
  };
}

/**
 * Calculate field accuracy percentage.
 */
function calculateFieldAccuracy(
  results: TestResult[],
  predicate: (r: TestResult) => boolean
): number {
  if (results.length === 0) return 0;
  const matches = results.filter(predicate).length;
  return (matches / results.length) * 100;
}
