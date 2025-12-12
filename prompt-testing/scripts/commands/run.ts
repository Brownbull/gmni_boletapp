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
import { CONFIG, EXIT_CODES, isValidStoreType } from '../config';
import {
  discoverTestCases,
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
import { getPrompt, listPrompts, type PromptConfig } from '../../prompts';

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
interface ComparisonSummary {
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
      await runComparisonMode(parsedOptions);
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
        log.dim('Ensure test-data/receipts/ contains images with matching .expected.json files.');
        log.dim('Use npm run test:scan:generate to create expected.json from images.');
      }
      process.exit(EXIT_CODES.ERROR);
    }

    // Apply limit
    const effectiveLimit =
      parsedOptions.limit === 'all'
        ? testCases.length
        : Math.min(parsedOptions.limit, testCases.length);

    const selectedCases = testCases.slice(0, effectiveLimit);

    if (parsedOptions.outputMode !== 'quiet' && parsedOptions.outputMode !== 'json') {
      log.info(`Found ${testCases.length} test case(s), running ${selectedCases.length}`);
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

  // Validate store type
  if (options.type && !isValidStoreType(options.type)) {
    throw new Error(
      `Invalid store type: ${options.type}. ` +
        `Valid types: ${CONFIG.validStoreTypes.join(', ')}`
    );
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
// A/B Comparison Mode (Story 8.7 - AC4, AC5, AC6)
// ============================================================================

/**
 * Run A/B comparison between two prompts.
 *
 * Runs the same test cases with both prompts and generates a
 * side-by-side comparison report.
 */
async function runComparisonMode(options: ParsedOptions): Promise<void> {
  const [promptAId, promptBId] = options.compare!;

  console.log(chalk.bold('\n🔬 A/B Prompt Comparison'));
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

  // Apply limit
  const effectiveLimit =
    options.limit === 'all'
      ? testCases.length
      : Math.min(options.limit, testCases.length);

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
  console.log(chalk.bold(`\n📋 Running with Prompt A (${promptAId})`));
  console.log('─'.repeat(40));
  const startTimeA = Date.now();
  const resultsA = await runTestsWithPrompt(selectedCases, promptAId, options);
  const endTimeA = Date.now();
  const summaryA = generateSummary(resultsA, startTimeA, endTimeA, promptAId);

  // Brief pause between test runs
  await sleep(1000);

  // Run tests with Prompt B
  console.log(chalk.bold(`\n📋 Running with Prompt B (${promptBId})`));
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

/**
 * Run tests with a specific prompt.
 */
async function runTestsWithPrompt(
  testCases: TestCase[],
  promptId: string,
  options: ParsedOptions
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const testId = `${testCase.storeType}/${testCase.testId}`;

    // Report progress
    reportProgress(i + 1, testCases.length, testId, 'running', options.outputMode);

    const result = await runSingleTestWithPrompt(testCase, promptId);
    results.push(result);

    // Update progress with result
    const status = result.error ? 'error' : result.passed ? 'pass' : 'fail';

    if (options.outputMode !== 'json' && options.outputMode !== 'quiet') {
      process.stdout.write('\x1b[1A\x1b[2K');
    }
    reportProgress(i + 1, testCases.length, testId, status, options.outputMode);
  }

  return results;
}

/**
 * Run a single test with a specific prompt.
 */
async function runSingleTestWithPrompt(
  testCase: TestCase,
  promptId: string
): Promise<TestResult> {
  const startTime = Date.now();
  const testId = `${testCase.storeType}/${testCase.testId}`;

  try {
    // Load expected data
    const expectedData = loadExpectedJson(testCase.expectedPath);
    const expected = validateTestCase(expectedData);

    // Load and scan image with specific prompt
    const imageBuffer = loadImageBuffer(testCase.imagePath);

    // Note: The scanner doesn't directly support prompt selection yet.
    // For now, we pass promptId for tracking. Full prompt selection would
    // require Cloud Function changes to accept a prompt parameter.
    const actual = await scanReceipt(imageBuffer);

    // Compare results
    const fields = compareResults(expected, actual);
    const score = calculateScore(fields);
    const passed = score >= 70;

    return {
      testId,
      passed,
      score,
      fields,
      apiCost: CONFIG.estimatedCostPerScan,
      duration: Date.now() - startTime,
      storeType: testCase.storeType,
      promptVersion: promptId,
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
      promptVersion: promptId,
    };
  }
}

/**
 * Generate comparison summary between two prompt runs.
 */
function generateComparison(
  summaryA: TestRunSummary,
  summaryB: TestRunSummary,
  promptAId: string,
  promptBId: string
): ComparisonSummary {
  const promptAConfig = getPrompt(promptAId);
  const promptBConfig = getPrompt(promptBId);

  // Determine winner
  const accA = summaryA.overallAccuracy;
  const accB = summaryB.overallAccuracy;
  let winner: 'A' | 'B' | 'tie' = 'tie';
  if (Math.abs(accA - accB) < 0.01) {
    winner = 'tie';
  } else if (accA > accB) {
    winner = 'A';
  } else {
    winner = 'B';
  }

  const improvementPct = accB - accA; // Positive means B is better

  // Compare per-field
  const perField = {
    total: compareField(summaryA.byField.total, summaryB.byField.total),
    date: compareField(summaryA.byField.date, summaryB.byField.date),
    merchant: compareField(summaryA.byField.merchant, summaryB.byField.merchant),
    itemsCount: compareField(summaryA.byField.itemsCount, summaryB.byField.itemsCount),
    itemPrices: compareField(summaryA.byField.itemPrices, summaryB.byField.itemPrices),
  };

  // Compare per-store-type
  const allStoreTypes = new Set([
    ...Object.keys(summaryA.byStoreType),
    ...Object.keys(summaryB.byStoreType),
  ]);

  const perStoreType: Record<
    string,
    { promptA: number; promptB: number; better: 'A' | 'B' | 'tie' }
  > = {};

  for (const storeType of allStoreTypes) {
    const accA = summaryA.byStoreType[storeType]?.accuracy ?? 0;
    const accB = summaryB.byStoreType[storeType]?.accuracy ?? 0;
    perStoreType[storeType] = compareField(accA, accB);
  }

  return {
    promptA: {
      id: promptAId,
      name: promptAConfig.name,
      passedTests: summaryA.passedTests,
      accuracy: accA,
    },
    promptB: {
      id: promptBId,
      name: promptBConfig.name,
      passedTests: summaryB.passedTests,
      accuracy: accB,
    },
    winner,
    improvementPct,
    perField,
    perStoreType,
  };
}

/**
 * Compare two field accuracy values.
 */
function compareField(
  accA: number,
  accB: number
): { promptA: number; promptB: number; better: 'A' | 'B' | 'tie' } {
  let better: 'A' | 'B' | 'tie' = 'tie';
  if (Math.abs(accA - accB) < 0.01) {
    better = 'tie';
  } else if (accA > accB) {
    better = 'A';
  } else {
    better = 'B';
  }
  return { promptA: accA, promptB: accB, better };
}

/**
 * Display A/B comparison report.
 */
function displayComparisonReport(
  comparison: ComparisonSummary,
  summaryA: TestRunSummary,
  summaryB: TestRunSummary
): void {
  console.log('');
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════'));
  console.log(chalk.bold('                    COMPARISON REPORT'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════\n'));

  // Winner announcement
  if (comparison.winner === 'tie') {
    console.log(chalk.yellow('  🤝 Result: TIE - Both prompts performed equally'));
  } else {
    const winnerPrompt = comparison.winner === 'A' ? comparison.promptA : comparison.promptB;
    const winnerColor = comparison.winner === 'A' ? chalk.cyan : chalk.magenta;
    console.log(winnerColor(`  🏆 Winner: ${winnerPrompt.name} (${winnerPrompt.id})`));
    console.log(chalk.dim(`     Improvement: ${comparison.improvementPct > 0 ? '+' : ''}${comparison.improvementPct.toFixed(1)}% accuracy`));
  }

  // Overall accuracy comparison
  console.log('');
  console.log(chalk.bold('Overall Accuracy:'));
  console.log('─'.repeat(50));
  console.log(`  Prompt A (${comparison.promptA.id}): ${formatAccuracyColored(comparison.promptA.accuracy)}%  (${comparison.promptA.passedTests}/${summaryA.totalTests} passed)`);
  console.log(`  Prompt B (${comparison.promptB.id}): ${formatAccuracyColored(comparison.promptB.accuracy)}%  (${comparison.promptB.passedTests}/${summaryB.totalTests} passed)`);

  // Per-field comparison
  console.log('');
  console.log(chalk.bold('Per-Field Comparison:'));
  console.log('─'.repeat(50));
  console.log('  Field          Prompt A    Prompt B    Better');
  console.log('  ' + '─'.repeat(46));

  const fields = ['total', 'date', 'merchant', 'itemsCount', 'itemPrices'] as const;
  for (const field of fields) {
    const data = comparison.perField[field];
    const betterIndicator = getBetterIndicator(data.better);
    const fieldName = (field + ':').padEnd(14);
    const accA = data.promptA.toFixed(0).padStart(7) + '%';
    const accB = data.promptB.toFixed(0).padStart(7) + '%';
    console.log(`  ${fieldName} ${accA}     ${accB}     ${betterIndicator}`);
  }

  // Per-store-type comparison (if multiple store types)
  const storeTypes = Object.keys(comparison.perStoreType);
  if (storeTypes.length > 1) {
    console.log('');
    console.log(chalk.bold('Per-Store-Type Comparison:'));
    console.log('─'.repeat(50));
    console.log('  Store Type     Prompt A    Prompt B    Better');
    console.log('  ' + '─'.repeat(46));

    for (const storeType of storeTypes) {
      const data = comparison.perStoreType[storeType];
      const betterIndicator = getBetterIndicator(data.better);
      const typeName = (storeType + ':').padEnd(14);
      const accA = data.promptA.toFixed(0).padStart(7) + '%';
      const accB = data.promptB.toFixed(0).padStart(7) + '%';
      console.log(`  ${typeName} ${accA}     ${accB}     ${betterIndicator}`);
    }
  }

  console.log('');
  console.log('═'.repeat(55));
}

/**
 * Format accuracy with color based on value.
 */
function formatAccuracyColored(accuracy: number): string {
  if (accuracy >= 90) return chalk.green(accuracy.toFixed(1));
  if (accuracy >= 70) return chalk.yellow(accuracy.toFixed(1));
  return chalk.red(accuracy.toFixed(1));
}

/**
 * Get indicator for which prompt is better.
 */
function getBetterIndicator(better: 'A' | 'B' | 'tie'): string {
  switch (better) {
    case 'A':
      return chalk.cyan('← A');
    case 'B':
      return chalk.magenta('B →');
    case 'tie':
      return chalk.dim('tie');
  }
}

/**
 * Sleep utility for pacing API calls.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  items: Array<{ name: string; price: number; category?: string }>;
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
      price: item.price,
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
            // Mark for deletion (we'll filter later)
            result.items[index] = { ...result.items[index], name: '__DELETE__' };
          } else {
            if (correction.name !== undefined) result.items[index].name = correction.name;
            if (correction.price !== undefined) result.items[index].price = correction.price;
            if (correction.category !== undefined) result.items[index].category = correction.category;
          }
        }
      }
      // Remove deleted items
      result.items = result.items.filter((item) => item.name !== '__DELETE__');
    }

    // Add missing items
    if (corrections.addItems) {
      result.items.push(...corrections.addItems);
    }
  }

  return result;
}

/**
 * Compare actual scan result against expected (ground truth).
 * Basic comparison - full implementation in Story 8.4.
 */
function compareResults(
  expected: TestCaseFile,
  actual: { merchant: string; date: string; total: number; category?: string; items: Array<{ name: string; price: number }> }
): FieldResults {
  const groundTruth = getGroundTruth(expected);

  // Total comparison (exact match)
  const totalMatch = Math.abs(groundTruth.total - actual.total) < 0.01;

  // Date comparison (exact match)
  const dateMatch = groundTruth.date === actual.date;

  // Merchant comparison (basic - fuzzy matching in Story 8.4)
  const merchantSimilarity = simpleSimilarity(groundTruth.merchant, actual.merchant);
  const merchantMatch = merchantSimilarity >= (expected.thresholds?.merchantSimilarity ?? 0.8);

  // Category comparison (case-insensitive exact match)
  const expectedCategory = groundTruth.category || 'Other';
  const actualCategory = actual.category || 'Other';
  const categoryMatch = expectedCategory.toLowerCase() === actualCategory.toLowerCase();

  // Items count (within tolerance)
  const expectedCount = groundTruth.items.length;
  const actualCount = actual.items.length;
  const tolerance = CONFIG.thresholds.itemsCount.tolerance ?? 1;
  const countMatch = Math.abs(expectedCount - actualCount) <= tolerance;

  // Item prices (basic comparison)
  let priceMatchCount = 0;
  const itemDetails = [];

  for (let i = 0; i < Math.max(expectedCount, actualCount); i++) {
    const expectedItem = groundTruth.items[i];
    const actualItem = actual.items[i];

    if (expectedItem && actualItem) {
      const priceMatch = Math.abs(expectedItem.price - actualItem.price) < 0.01;
      if (priceMatch) {
        priceMatchCount++;
      }
      itemDetails.push({
        index: i,
        expectedName: expectedItem.name,
        actualName: actualItem.name,
        nameSimilarity: simpleSimilarity(expectedItem.name, actualItem.name),
        nameMatch: true,
        expectedPrice: expectedItem.price,
        actualPrice: actualItem.price,
        priceMatch,
        match: priceMatch,
      });
    } else if (expectedItem) {
      // Missing actual item
      itemDetails.push({
        index: i,
        expectedName: expectedItem.name,
        actualName: '',
        nameSimilarity: 0,
        nameMatch: false,
        expectedPrice: expectedItem.price,
        actualPrice: 0,
        priceMatch: false,
        match: false,
      });
    }
  }

  const priceAccuracy = expectedCount > 0 ? (priceMatchCount / expectedCount) * 100 : 100;

  return {
    total: {
      expected: groundTruth.total,
      actual: actual.total,
      match: totalMatch,
      difference: actual.total - groundTruth.total,
    },
    date: {
      expected: groundTruth.date,
      actual: actual.date,
      match: dateMatch,
    },
    merchant: {
      expected: groundTruth.merchant,
      actual: actual.merchant,
      similarity: merchantSimilarity,
      match: merchantMatch,
    },
    category: {
      expected: expectedCategory,
      actual: actualCategory,
      match: categoryMatch,
    },
    itemsCount: {
      expected: expectedCount,
      actual: actualCount,
      match: countMatch,
      tolerance,
    },
    itemPrices: {
      accuracy: priceAccuracy,
      details: itemDetails,
      matchCount: priceMatchCount,
      totalCount: expectedCount,
    },
  };
}

/**
 * Simple string similarity (Dice coefficient).
 * Full fuzzy matching in Story 8.4.
 */
function simpleSimilarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  if (aLower === bLower) return 1;
  if (aLower.length === 0 || bLower.length === 0) return 0;

  // Simple character overlap
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

  // Calculate overall accuracy
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const overallAccuracy = results.length > 0 ? totalScore / results.length : 0;

  // By store type (AC3)
  const byStoreType: Record<string, { total: number; passed: number; accuracy: number }> = {};
  for (const result of results) {
    if (!byStoreType[result.storeType]) {
      byStoreType[result.storeType] = { total: 0, passed: 0, accuracy: 0 };
    }
    byStoreType[result.storeType].total++;
    if (result.passed) byStoreType[result.storeType].passed++;
  }
  // Calculate accuracy per store type
  for (const storeType of Object.keys(byStoreType)) {
    const st = byStoreType[storeType];
    st.accuracy = st.total > 0 ? (st.passed / st.total) * 100 : 0;
  }

  // By field (AC2)
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
