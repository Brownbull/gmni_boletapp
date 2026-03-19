/**
 * A/B Comparison Mode (Story 8.7 - AC4, AC5, AC6)
 *
 * Extracted from run.ts to keep file under 800 lines.
 * Handles running the same test cases with two different prompts
 * and generating a side-by-side comparison report.
 */

import chalk from 'chalk';
import { CONFIG, EXIT_CODES } from '../config';
import {
  discoverTestCases,
  loadImageBuffer,
  loadExpectedJson,
  type TestCase,
} from '../lib/discovery';
import { scanReceipt, authenticateUser, signOutUser } from '../lib/scanner';
import {
  displayDryRunPlan,
  reportProgress,
  log,
  type OutputMode,
} from '../lib/reporter';
import { saveResults } from '../lib/result-writer';
import { validateTestCase, type TestCaseFile } from '../lib/schema';
import type { TestResult, TestRunSummary, FieldResults } from '../types';
import { getPrompt } from '../../prompts';

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

/**
 * Summary for A/B comparison between two prompts.
 */
export interface ComparisonSummary {
  promptA: {
    id: string;
    name: string;
    passedTests: number;
    accuracy: number;
  };
  promptB: {
    id: string;
    name: string;
    passedTests: number;
    accuracy: number;
  };
  winner: 'A' | 'B' | 'tie';
  improvementPct: number;
  perField: {
    total: { promptA: number; promptB: number; better: 'A' | 'B' | 'tie' };
    date: { promptA: number; promptB: number; better: 'A' | 'B' | 'tie' };
    merchant: { promptA: number; promptB: number; better: 'A' | 'B' | 'tie' };
    itemsCount: { promptA: number; promptB: number; better: 'A' | 'B' | 'tie' };
    itemPrices: { promptA: number; promptB: number; better: 'A' | 'B' | 'tie' };
  };
  perStoreType: Record<
    string,
    { promptA: number; promptB: number; better: 'A' | 'B' | 'tie' }
  >;
}

// ============================================================================
// Comparison Mode
// ============================================================================

/**
 * Run A/B comparison between two prompts.
 *
 * Runs the same test cases with both prompts and generates a
 * side-by-side comparison report.
 */
export async function runComparisonMode(
  options: ParsedOptions,
  generateSummary: (results: TestResult[], startTime: number, endTime: number, promptVersion: string) => TestRunSummary
): Promise<void> {
  const [promptAId, promptBId] = options.compare!;

  console.log(chalk.bold('\n A/B Prompt Comparison'));
  console.log('━'.repeat(50));
  console.log(`  Prompt A: ${chalk.cyan(promptAId)}`);
  console.log(`  Prompt B: ${chalk.cyan(promptBId)}`);
  console.log('━'.repeat(50));

  // Discover test cases
  log.info('Discovering test cases...');
  const testCases = discoverTestCases({
    image: options.image,
    type: options.type,
    folder: options.folder,
  });

  if (testCases.length === 0) {
    log.warn('No test cases found.');
    process.exit(EXIT_CODES.ERROR);
  }

  // Apply limit (respect maxTestsPerRun)
  const maxLimit = CONFIG.maxTestsPerRun;
  const effectiveLimit =
    options.limit === 'all'
      ? Math.min(testCases.length, maxLimit)
      : Math.min(options.limit, testCases.length, maxLimit);

  const selectedCases = testCases.slice(0, effectiveLimit);
  log.info(`Running ${selectedCases.length} test(s) with BOTH prompts`);
  log.dim(`  Estimated cost: $${(selectedCases.length * 2 * CONFIG.estimatedCostPerScan).toFixed(2)}`);

  // Dry run mode
  if (options.dryRun) {
    console.log(chalk.yellow('\nDry Run - No API calls will be made'));
    displayDryRunPlan(selectedCases, options.outputMode);
    process.exit(EXIT_CODES.SUCCESS);
  }

  // Authenticate
  log.info('Authenticating...');
  await authenticateUser();
  log.success('Authenticated');

  console.log('');

  // Run tests with Prompt A
  console.log(chalk.bold(`\n Running with Prompt A (${promptAId})`));
  console.log('─'.repeat(40));
  const startTimeA = Date.now();
  const resultsA = await runTestsWithPrompt(selectedCases, promptAId, options);
  const endTimeA = Date.now();
  const summaryA = generateSummary(resultsA, startTimeA, endTimeA, promptAId);

  // Brief pause between test runs
  await sleep(1000);

  // Run tests with Prompt B
  console.log(chalk.bold(`\n Running with Prompt B (${promptBId})`));
  console.log('─'.repeat(40));
  const startTimeB = Date.now();
  const resultsB = await runTestsWithPrompt(selectedCases, promptBId, options);
  const endTimeB = Date.now();
  const summaryB = generateSummary(resultsB, startTimeB, endTimeB, promptBId);

  // Generate comparison
  const comparison = generateComparison(summaryA, summaryB, promptAId, promptBId);

  // Display comparison report (AC6)
  displayComparisonReport(comparison, summaryA, summaryB);

  // Save both result files
  const filepathA = saveResults(resultsA, summaryA, promptAId);
  const filepathB = saveResults(resultsB, summaryB, promptBId);

  console.log('');
  log.success(`Results saved:`);
  log.dim(`  Prompt A: ${filepathA}`);
  log.dim(`  Prompt B: ${filepathB}`);

  // Sign out
  await signOutUser();

  // Exit code based on whether any tests failed
  const totalFailures = summaryA.failedTests + summaryB.failedTests;
  const exitCode = totalFailures > 0 ? EXIT_CODES.TEST_FAILURE : EXIT_CODES.SUCCESS;
  process.exit(exitCode);
}

// ============================================================================
// Test Execution (with prompt selection)
// ============================================================================

async function runTestsWithPrompt(
  testCases: TestCase[],
  promptId: string,
  options: ParsedOptions
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testId = `${testCase.storeType}/${testCase.testId}`;

    reportProgress(i + 1, testCases.length, testId, 'running', options.outputMode);

    const result = await runSingleTestWithPrompt(testCase, promptId);
    results.push(result);

    const status = result.error ? 'error' : result.passed ? 'pass' : 'fail';

    if (options.outputMode !== 'json' && options.outputMode !== 'quiet') {
      process.stdout.write('\x1b[1A\x1b[2K');
    }
    reportProgress(i + 1, testCases.length, testId, status, options.outputMode);
  }

  return results;
}

async function runSingleTestWithPrompt(
  testCase: TestCase,
  promptId: string
): Promise<TestResult> {
  const startTime = Date.now();
  const testId = `${testCase.storeType}/${testCase.testId}`;

  try {
    const expectedData = loadExpectedJson(testCase.expectedPath);
    const expected = validateTestCase(expectedData);
    const imageBuffer = loadImageBuffer(testCase.imagePath);

    // Note: The scanner doesn't directly support prompt selection yet.
    const actual = await scanReceipt(imageBuffer);

    const fields = compareResults(expected, actual);
    const score = calculateScore(fields);
    const passed = score >= 70;

    return {
      testId, passed, score, fields,
      apiCost: CONFIG.estimatedCostPerScan,
      duration: Date.now() - startTime,
      storeType: testCase.storeType,
      promptVersion: promptId,
    };
  } catch (error) {
    return {
      testId, passed: false, score: 0, fields: getEmptyFields(),
      apiCost: CONFIG.estimatedCostPerScan,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      storeType: testCase.storeType,
      promptVersion: promptId,
    };
  }
}

// ============================================================================
// Comparison Logic (duplicated from run.ts to avoid circular deps)
// ============================================================================

function compareResults(
  expected: TestCaseFile,
  actual: { merchant: string; date: string; total: number; category?: string; items: Array<{ name: string; totalPrice: number }> }
): FieldResults {
  const ai = expected.aiExtraction;
  const corrections = expected.corrections;
  const baseItems = ai?.items ?? [];
  const groundTruth = {
    merchant: corrections?.merchant ?? ai?.merchant ?? '',
    date: corrections?.date ?? ai?.date ?? '',
    total: corrections?.total ?? ai?.total ?? 0,
    category: corrections?.category ?? ai?.category ?? '',
    items: baseItems.map((item) => ({
      name: item.name, totalPrice: item.totalPrice,
      unitPrice: item.unitPrice, category: item.category,
    })),
  };

  const totalMatch = Math.abs(groundTruth.total - actual.total) < 0.01;
  const dateMatch = groundTruth.date === actual.date;
  const merchantSimilarity = simpleSimilarity(groundTruth.merchant, actual.merchant);
  const merchantMatch = merchantSimilarity >= (expected.thresholds?.merchantSimilarity ?? 0.8);
  const categoryMatch = (groundTruth.category || 'Other').toLowerCase() === (actual.category || 'Other').toLowerCase();
  const expectedCount = groundTruth.items.length;
  const actualCount = actual.items.length;
  const tolerance = CONFIG.thresholds.itemsCount.tolerance ?? 1;
  const countMatch = Math.abs(expectedCount - actualCount) <= tolerance;

  let priceMatchCount = 0;
  const itemDetails = [];
  for (let i = 0; i < Math.max(expectedCount, actualCount); i++) {
    const expectedItem = groundTruth.items[i];
    const actualItem = actual.items[i];
    if (expectedItem && actualItem) {
      const priceMatch = Math.abs(expectedItem.totalPrice - actualItem.totalPrice) < 0.01;
      if (priceMatch) priceMatchCount++;
      itemDetails.push({
        index: i, expectedName: expectedItem.name, actualName: actualItem.name,
        nameSimilarity: simpleSimilarity(expectedItem.name, actualItem.name),
        nameMatch: true, expectedPrice: expectedItem.totalPrice,
        actualPrice: actualItem.totalPrice, priceMatch, match: priceMatch,
      });
    } else if (expectedItem) {
      itemDetails.push({
        index: i, expectedName: expectedItem.name, actualName: '',
        nameSimilarity: 0, nameMatch: false, expectedPrice: expectedItem.totalPrice,
        actualPrice: 0, priceMatch: false, match: false,
      });
    }
  }

  return {
    total: { expected: groundTruth.total, actual: actual.total, match: totalMatch, difference: actual.total - groundTruth.total },
    date: { expected: groundTruth.date, actual: actual.date, match: dateMatch },
    merchant: { expected: groundTruth.merchant, actual: actual.merchant, similarity: merchantSimilarity, match: merchantMatch },
    category: { expected: groundTruth.category || 'Other', actual: actual.category || 'Other', match: categoryMatch },
    itemsCount: { expected: expectedCount, actual: actualCount, match: countMatch, tolerance },
    itemPrices: { accuracy: expectedCount > 0 ? (priceMatchCount / expectedCount) * 100 : 100, details: itemDetails, matchCount: priceMatchCount, totalCount: expectedCount },
  };
}

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

function calculateScore(fields: FieldResults): number {
  const t = CONFIG.thresholds;
  return (
    (fields.total.match ? 1 : 0) * t.total.weight * 100 +
    (fields.date.match ? 1 : 0) * t.date.weight * 100 +
    (fields.merchant.match ? 1 : 0) * t.merchant.weight * 100 +
    (fields.itemsCount.match ? 1 : 0) * t.itemsCount.weight * 100 +
    (fields.itemPrices.accuracy / 100) * t.itemPrices.weight * 100
  );
}

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
// Comparison Generation & Display
// ============================================================================

function generateComparison(
  summaryA: TestRunSummary,
  summaryB: TestRunSummary,
  promptAId: string,
  promptBId: string
): ComparisonSummary {
  const promptAConfig = getPrompt(promptAId);
  const promptBConfig = getPrompt(promptBId);

  const accA = summaryA.overallAccuracy;
  const accB = summaryB.overallAccuracy;
  let winner: 'A' | 'B' | 'tie' = 'tie';
  if (Math.abs(accA - accB) >= 0.01) {
    winner = accA > accB ? 'A' : 'B';
  }

  const perField = {
    total: cmpField(summaryA.byField.total, summaryB.byField.total),
    date: cmpField(summaryA.byField.date, summaryB.byField.date),
    merchant: cmpField(summaryA.byField.merchant, summaryB.byField.merchant),
    itemsCount: cmpField(summaryA.byField.itemsCount, summaryB.byField.itemsCount),
    itemPrices: cmpField(summaryA.byField.itemPrices, summaryB.byField.itemPrices),
  };

  const allStoreTypes = new Set([
    ...Object.keys(summaryA.byStoreType),
    ...Object.keys(summaryB.byStoreType),
  ]);
  const perStoreType: ComparisonSummary['perStoreType'] = {};
  for (const st of allStoreTypes) {
    perStoreType[st] = cmpField(
      summaryA.byStoreType[st]?.accuracy ?? 0,
      summaryB.byStoreType[st]?.accuracy ?? 0
    );
  }

  return {
    promptA: { id: promptAId, name: promptAConfig.name, passedTests: summaryA.passedTests, accuracy: accA },
    promptB: { id: promptBId, name: promptBConfig.name, passedTests: summaryB.passedTests, accuracy: accB },
    winner, improvementPct: accB - accA, perField, perStoreType,
  };
}

function cmpField(a: number, b: number): { promptA: number; promptB: number; better: 'A' | 'B' | 'tie' } {
  const better: 'A' | 'B' | 'tie' = Math.abs(a - b) < 0.01 ? 'tie' : a > b ? 'A' : 'B';
  return { promptA: a, promptB: b, better };
}

function displayComparisonReport(
  comparison: ComparisonSummary,
  summaryA: TestRunSummary,
  summaryB: TestRunSummary
): void {
  console.log('');
  console.log(chalk.bold('\n' + '═'.repeat(55)));
  console.log(chalk.bold('                    COMPARISON REPORT'));
  console.log(chalk.bold('═'.repeat(55) + '\n'));

  if (comparison.winner === 'tie') {
    console.log(chalk.yellow('  Result: TIE - Both prompts performed equally'));
  } else {
    const wp = comparison.winner === 'A' ? comparison.promptA : comparison.promptB;
    const wc = comparison.winner === 'A' ? chalk.cyan : chalk.magenta;
    console.log(wc(`  Winner: ${wp.name} (${wp.id})`));
    console.log(chalk.dim(`     Improvement: ${comparison.improvementPct > 0 ? '+' : ''}${comparison.improvementPct.toFixed(1)}% accuracy`));
  }

  console.log('');
  console.log(chalk.bold('Overall Accuracy:'));
  console.log('─'.repeat(50));
  console.log(`  Prompt A (${comparison.promptA.id}): ${fmtAcc(comparison.promptA.accuracy)}%  (${comparison.promptA.passedTests}/${summaryA.totalTests} passed)`);
  console.log(`  Prompt B (${comparison.promptB.id}): ${fmtAcc(comparison.promptB.accuracy)}%  (${comparison.promptB.passedTests}/${summaryB.totalTests} passed)`);

  console.log('');
  console.log(chalk.bold('Per-Field Comparison:'));
  console.log('─'.repeat(50));
  console.log('  Field          Prompt A    Prompt B    Better');
  console.log('  ' + '─'.repeat(46));

  const fields = ['total', 'date', 'merchant', 'itemsCount', 'itemPrices'] as const;
  for (const field of fields) {
    const d = comparison.perField[field];
    const bi = d.better === 'A' ? chalk.cyan('A') : d.better === 'B' ? chalk.magenta('B') : chalk.dim('tie');
    console.log(`  ${(field + ':').padEnd(14)} ${d.promptA.toFixed(0).padStart(7)}%     ${d.promptB.toFixed(0).padStart(7)}%     ${bi}`);
  }

  const storeTypes = Object.keys(comparison.perStoreType);
  if (storeTypes.length > 1) {
    console.log('');
    console.log(chalk.bold('Per-Store-Type Comparison:'));
    console.log('─'.repeat(50));
    for (const st of storeTypes) {
      const d = comparison.perStoreType[st];
      const bi = d.better === 'A' ? chalk.cyan('A') : d.better === 'B' ? chalk.magenta('B') : chalk.dim('tie');
      console.log(`  ${(st + ':').padEnd(14)} ${d.promptA.toFixed(0).padStart(7)}%     ${d.promptB.toFixed(0).padStart(7)}%     ${bi}`);
    }
  }

  console.log('');
  console.log('═'.repeat(55));
}

function fmtAcc(accuracy: number): string {
  if (accuracy >= 90) return chalk.green(accuracy.toFixed(1));
  if (accuracy >= 70) return chalk.yellow(accuracy.toFixed(1));
  return chalk.red(accuracy.toFixed(1));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
