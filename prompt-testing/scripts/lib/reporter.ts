/**
 * Console Reporter for Scan Test CLI
 *
 * Provides colorized console output for test progress, results, and summaries.
 * Uses chalk for terminal coloring.
 *
 * Output Modes:
 * - Default: Progress + summary + failed tests
 * - Verbose: + per-test details, diffs
 * - Quiet: Only final pass/fail
 * - JSON: Machine-readable JSON to stdout
 *
 * @see docs/sprint-artifacts/epic8/architecture-epic8.md#Console-Output
 * @see docs/sprint-artifacts/epic8/story-8.5-accuracy-reporting.md
 */

import chalk from 'chalk';
import { CONFIG } from '../config';
import type { TestResult, TestRunSummary, FieldResults } from '../types';

// ============================================================================
// Output Mode Types
// ============================================================================

/**
 * Output mode for the reporter.
 */
export type OutputMode = 'default' | 'verbose' | 'quiet' | 'json';

/**
 * Reporter options.
 */
export interface ReporterOptions {
  mode: OutputMode;
}

// ============================================================================
// Basic Logging Utilities (AC1: Colorized Console Output)
// ============================================================================

/**
 * Logging utilities with colored output.
 *
 * - success: green checkmark
 * - fail: red X
 * - warn: yellow triangle
 * - info: blue dot
 */
export const log = {
  /** Success message with green checkmark */
  success: (msg: string) => console.log(chalk.green('✓'), msg),

  /** Failure message with red X */
  fail: (msg: string) => console.log(chalk.red('✗'), msg),

  /** Warning message with yellow triangle */
  warn: (msg: string) => console.log(chalk.yellow('⚠'), msg),

  /** Info message with blue dot */
  info: (msg: string) => console.log(chalk.blue('●'), msg),

  /** Dimmed info message */
  dim: (msg: string) => console.log(chalk.dim(msg)),

  /** Section header with bold text and separator line */
  header: (msg: string) => {
    console.log(chalk.bold(`\n${msg}`));
    console.log('━'.repeat(40));
  },

  /** Error message */
  error: (msg: string) => console.log(chalk.red('✗ Error:'), msg),

  /** Plain message */
  plain: (msg: string) => console.log(msg),
};

// ============================================================================
// Test Progress Display (AC7: Progress Indicator)
// ============================================================================

/**
 * Display the test harness banner.
 */
export function displayBanner(mode: OutputMode = 'default'): void {
  if (mode === 'quiet' || mode === 'json') return;

  console.log(chalk.bold('\n🔬 Scan Test Harness'));
  console.log('━'.repeat(40));
}

/**
 * Display test run configuration.
 */
export function displayConfig(
  options: {
    limit: number | 'all';
    type?: string;
    image?: string;
    dryRun?: boolean;
    folder?: string;
    prompt?: string;
  },
  mode: OutputMode = 'default'
): void {
  if (mode === 'quiet' || mode === 'json') return;

  const parts: string[] = [];

  if (options.image) {
    parts.push(`image: ${options.image}`);
  } else {
    parts.push(`limit: ${options.limit}`);
  }

  if (options.type) {
    parts.push(`type: ${options.type}`);
  }

  if (options.folder) {
    parts.push(`folder: ${options.folder}`);
  }

  if (options.prompt) {
    parts.push(`prompt: ${options.prompt}`);
  }

  if (options.dryRun) {
    parts.push(chalk.yellow('DRY RUN'));
  }

  console.log(chalk.dim(`Config: ${parts.join(', ')}`));
  console.log('');
}

/**
 * Report progress during test execution.
 * Displays: [current/total] testId with colored status icon
 *
 * @param current - Current test number (1-based)
 * @param total - Total number of tests
 * @param testId - Test identifier (e.g., "supermarket/jumbo-001")
 * @param status - Test status: running, pass, fail, or error
 * @param mode - Output mode
 */
export function reportProgress(
  current: number,
  total: number,
  testId: string,
  status: 'running' | 'pass' | 'fail' | 'error' = 'running',
  mode: OutputMode = 'default'
): void {
  if (mode === 'quiet' || mode === 'json') return;

  const prefix = `[${current}/${total}]`;
  const fullId = testId;

  switch (status) {
    case 'running':
      console.log(chalk.blue('●'), chalk.dim(prefix), fullId);
      break;
    case 'pass':
      console.log(chalk.green('✓'), prefix, fullId);
      break;
    case 'fail':
      console.log(chalk.red('✗'), prefix, fullId);
      break;
    case 'error':
      console.log(chalk.yellow('⚠'), prefix, fullId, chalk.yellow('(error)'));
      break;
  }
}

/**
 * Report test result for a single test.
 * Used in default and verbose modes.
 *
 * @param result - The test result
 * @param verbose - Whether to show detailed field comparisons
 * @param mode - Output mode
 */
export function reportTestResult(
  result: TestResult,
  verbose: boolean = false,
  mode: OutputMode = 'default'
): void {
  if (mode === 'quiet' || mode === 'json') return;

  if (verbose) {
    displayVerboseResult(result);
  }
}

// ============================================================================
// Verbose Output (AC6: Verbose Mode)
// ============================================================================

/**
 * Display detailed field comparison for verbose mode.
 * Shows expected vs actual for each field with pass/fail icons.
 */
export function displayFieldComparison(fields: FieldResults): void {
  console.log(chalk.dim('  Field comparisons:'));

  // Total
  const totalIcon = fields.total.match ? chalk.green('✓') : chalk.red('✗');
  console.log(
    `    ${totalIcon} total: expected ${fields.total.expected}, got ${fields.total.actual}`
  );

  // Date
  const dateIcon = fields.date.match ? chalk.green('✓') : chalk.red('✗');
  console.log(
    `    ${dateIcon} date: expected ${fields.date.expected}, got ${fields.date.actual}`
  );

  // Merchant
  const merchantIcon = fields.merchant.match ? chalk.green('✓') : chalk.red('✗');
  const similarity = (fields.merchant.similarity * 100).toFixed(0);
  console.log(
    `    ${merchantIcon} merchant: "${fields.merchant.expected}" vs "${fields.merchant.actual}" (${similarity}% similar)`
  );

  // Category (informational - not in weighted score)
  const categoryIcon = fields.category.match ? chalk.green('✓') : chalk.red('✗');
  console.log(
    `    ${categoryIcon} category: "${fields.category.expected}" vs "${fields.category.actual}"`
  );

  // Items count
  const countIcon = fields.itemsCount.match ? chalk.green('✓') : chalk.red('✗');
  console.log(
    `    ${countIcon} items count: expected ${fields.itemsCount.expected}, got ${fields.itemsCount.actual}`
  );

  // Item prices
  const pricesIcon = fields.itemPrices.accuracy >= 90 ? chalk.green('✓') : chalk.red('✗');
  console.log(
    `    ${pricesIcon} item prices: ${fields.itemPrices.matchCount}/${fields.itemPrices.totalCount} correct (${fields.itemPrices.accuracy.toFixed(0)}%)`
  );
}

/**
 * Display verbose test result with score and field details.
 */
export function displayVerboseResult(result: TestResult): void {
  console.log(chalk.dim(`  Score: ${result.score.toFixed(1)}%`));
  displayFieldComparison(result.fields);

  // Show item-by-item price comparison on failures
  if (result.fields.itemPrices.accuracy < 100 && result.fields.itemPrices.details.length > 0) {
    console.log(chalk.dim('  Item details:'));
    for (const item of result.fields.itemPrices.details) {
      if (!item.priceMatch) {
        console.log(
          chalk.dim(
            `    - "${item.expectedName}": expected $${item.expectedPrice}, got $${item.actualPrice}`
          )
        );
      }
    }
  }

  // Show corrections feedback (what AI got wrong - for prompt improvement)
  if (result.correctionsFeedback?.hasCorrections) {
    console.log(chalk.cyan('  📝 Corrections applied (AI errors):'));
    console.log(chalk.cyan(`    ${result.correctionsFeedback.summary}`));
  }

  console.log('');
}

// ============================================================================
// Summary Display (AC2: Per-Field Breakdown, AC3: Per-Store-Type Breakdown)
// ============================================================================

/**
 * Display test run summary with per-field and per-store-type breakdowns.
 *
 * @param summary - Test run summary data
 * @param mode - Output mode
 */
export function displaySummary(summary: TestRunSummary, mode: OutputMode = 'default'): void {
  if (mode === 'json') return;

  console.log('');
  console.log('━'.repeat(40));

  const passRate =
    summary.totalTests > 0
      ? ((summary.passedTests / summary.totalTests) * 100).toFixed(0)
      : 0;

  const summaryColor = summary.failedTests === 0 ? chalk.green : chalk.red;
  console.log(
    summaryColor(`Summary: ${summary.passedTests}/${summary.totalTests} passed (${passRate}%)`)
  );

  if (mode === 'quiet') {
    // Quiet mode: only show pass/fail
    return;
  }

  // Show overall accuracy
  console.log(chalk.dim(`Overall accuracy: ${summary.overallAccuracy.toFixed(1)}%`));

  // Per-field breakdown (AC2)
  displayFieldBreakdown(summary);

  // Per-store-type breakdown (AC3)
  displayStoreTypeBreakdown(summary);

  // Show duration
  const durationSec = (summary.duration / 1000).toFixed(1);
  console.log(chalk.dim(`\nDuration: ${durationSec}s`));

  // Show cost
  console.log(chalk.dim(`Estimated cost: $${summary.totalApiCost.toFixed(2)}`));
}

/**
 * Display per-field accuracy breakdown (AC2).
 * Shows pass rate per field with color coding based on targets.
 */
export function displayFieldBreakdown(summary: TestRunSummary): void {
  console.log('');
  console.log('By Field:');

  const fields = [
    { name: 'total', target: CONFIG.thresholds.total.target * 100 },
    { name: 'date', target: CONFIG.thresholds.date.target * 100 },
    { name: 'merchant', target: CONFIG.thresholds.merchant.target * 100 },
    { name: 'itemsCount', target: CONFIG.thresholds.itemsCount.target * 100 },
    { name: 'itemPrices', target: CONFIG.thresholds.itemPrices.target * 100 },
  ];

  for (const field of fields) {
    const accuracy = summary.byField[field.name as keyof typeof summary.byField];
    const total = summary.totalTests;

    // Calculate passes based on accuracy percentage
    const passed = Math.round((accuracy / 100) * total);

    // Determine icon based on target
    let icon: string;
    if (accuracy >= field.target) {
      icon = chalk.green('✓');
    } else if (accuracy >= field.target * 0.9) {
      icon = chalk.yellow('⚠');
    } else {
      icon = chalk.red('✗');
    }

    // Format field name with padding
    const fieldDisplay = (field.name + ':').padEnd(12);
    const stats = `${passed}/${total} (${accuracy.toFixed(0)}%)`;

    console.log(`  ${fieldDisplay} ${stats.padEnd(15)} ${icon}`);
  }
}

/**
 * Display per-store-type accuracy breakdown (AC3).
 * Groups results by store type and shows pass rate.
 */
export function displayStoreTypeBreakdown(summary: TestRunSummary): void {
  const storeTypes = Object.keys(summary.byStoreType);
  if (storeTypes.length === 0) return;

  console.log('');
  console.log('By Store Type:');

  // Sort by accuracy (lowest first to highlight problem areas)
  const sortedTypes = storeTypes.sort((a, b) => {
    return summary.byStoreType[a].accuracy - summary.byStoreType[b].accuracy;
  });

  for (const storeType of sortedTypes) {
    const data = summary.byStoreType[storeType];
    const accuracy = data.accuracy;

    // Highlight problem areas
    let indicator = '';
    if (accuracy < 50) {
      indicator = chalk.red(' ← focus here');
    } else if (accuracy < 80) {
      indicator = chalk.yellow(' ← needs attention');
    }

    const typeDisplay = (storeType + ':').padEnd(14);
    const stats = `${data.passed}/${data.total} (${accuracy.toFixed(0)}%)`;

    console.log(`  ${typeDisplay} ${stats}${indicator}`);
  }
}

/**
 * Display failed tests summary.
 * Shows which tests failed and why (field-level details).
 */
export function displayFailures(results: TestResult[], mode: OutputMode = 'default'): void {
  if (mode === 'quiet' || mode === 'json') return;

  const failures = results.filter((r) => !r.passed);
  if (failures.length === 0) return;

  console.log('');
  console.log(chalk.red('Failed tests:'));
  for (const result of failures) {
    console.log(chalk.red(`  ✗ ${result.testId}`));

    if (result.error) {
      console.log(chalk.dim(`    Error: ${result.error}`));
      continue;
    }

    // Show which fields failed
    const failedFields: string[] = [];
    if (!result.fields.total.match) {
      failedFields.push(
        `total: expected ${result.fields.total.expected}, got ${result.fields.total.actual}`
      );
    }
    if (!result.fields.date.match) {
      failedFields.push(
        `date: expected ${result.fields.date.expected}, got ${result.fields.date.actual}`
      );
    }
    if (!result.fields.merchant.match) {
      const similarity = (result.fields.merchant.similarity * 100).toFixed(0);
      failedFields.push(
        `merchant: "${result.fields.merchant.expected}" vs "${result.fields.merchant.actual}" (similarity: ${similarity}%)`
      );
    }
    // Category mismatch (informational)
    if (!result.fields.category.match) {
      failedFields.push(
        `category: "${result.fields.category.expected}" vs "${result.fields.category.actual}"`
      );
    }
    if (!result.fields.itemsCount.match) {
      failedFields.push(
        `items count: expected ${result.fields.itemsCount.expected}, got ${result.fields.itemsCount.actual}`
      );
    }
    if (result.fields.itemPrices.accuracy < 90) {
      failedFields.push(`item prices: ${result.fields.itemPrices.accuracy.toFixed(0)}% accuracy`);
    }

    for (const field of failedFields) {
      console.log(chalk.dim(`    - ${field}`));
    }

    // Show corrections feedback for all results (helps understand what AI got wrong)
    if (result.correctionsFeedback?.hasCorrections) {
      console.log(chalk.cyan(`    📝 AI errors: ${result.correctionsFeedback.summary}`));
    }
  }
}

/**
 * Display corrections summary across all test results.
 * Shows aggregate info about what the AI commonly gets wrong.
 */
export function displayCorrectionsSummary(results: TestResult[], mode: OutputMode = 'default'): void {
  if (mode === 'quiet' || mode === 'json') return;

  const resultsWithCorrections = results.filter((r) => r.correctionsFeedback?.hasCorrections);
  if (resultsWithCorrections.length === 0) return;

  console.log('');
  console.log(chalk.cyan('📝 AI Accuracy Insights (based on corrections):'));

  // Aggregate corrected fields
  const fieldCounts: Record<string, number> = {};
  let totalItemsMissed = 0;
  let totalItemsHallucinated = 0;
  let totalItemsModified = 0;

  for (const result of resultsWithCorrections) {
    const feedback = result.correctionsFeedback!;
    for (const field of feedback.correctedFields) {
      fieldCounts[field] = (fieldCounts[field] || 0) + 1;
    }
    totalItemsMissed += feedback.itemsAdded;
    totalItemsHallucinated += feedback.itemsDeleted;
    totalItemsModified += feedback.itemsModified;
  }

  // Display field correction counts
  if (Object.keys(fieldCounts).length > 0) {
    console.log(chalk.dim('  Fields commonly incorrect:'));
    const sortedFields = Object.entries(fieldCounts).sort((a, b) => b[1] - a[1]);
    for (const [field, count] of sortedFields) {
      console.log(chalk.dim(`    - ${field}: ${count} time(s)`));
    }
  }

  // Display item-level issues
  if (totalItemsMissed > 0 || totalItemsHallucinated > 0 || totalItemsModified > 0) {
    console.log(chalk.dim('  Item extraction issues:'));
    if (totalItemsMissed > 0) {
      console.log(chalk.dim(`    - Items missed by AI: ${totalItemsMissed}`));
    }
    if (totalItemsHallucinated > 0) {
      console.log(chalk.dim(`    - Items hallucinated: ${totalItemsHallucinated}`));
    }
    if (totalItemsModified > 0) {
      console.log(chalk.dim(`    - Items with wrong values: ${totalItemsModified}`));
    }
  }

  console.log(
    chalk.cyan(
      `  ${resultsWithCorrections.length}/${results.length} test cases required corrections`
    )
  );
}

// ============================================================================
// Results File Display
// ============================================================================

/**
 * Display the saved results file path.
 */
export function displayResultsFilePath(filepath: string, mode: OutputMode = 'default'): void {
  if (mode === 'json') return;

  console.log('');
  console.log(chalk.dim(`Results saved: ${filepath}`));
}

// ============================================================================
// Dry Run Display
// ============================================================================

/**
 * Display dry run plan.
 */
export function displayDryRunPlan(
  testCases: Array<{ testId: string; storeType: string; imagePath: string }>,
  mode: OutputMode = 'default'
): void {
  if (mode === 'json') {
    console.log(
      JSON.stringify({
        dryRun: true,
        testCount: testCases.length,
        tests: testCases.map((tc) => ({
          testId: tc.testId,
          storeType: tc.storeType,
          imagePath: tc.imagePath,
        })),
        estimatedCost: testCases.length * CONFIG.estimatedCostPerScan,
      })
    );
    return;
  }

  if (mode === 'quiet') {
    console.log(`Would run ${testCases.length} test(s)`);
    return;
  }

  console.log(chalk.yellow('\nDry Run - No API calls will be made\n'));
  console.log(`Would run ${testCases.length} test(s):\n`);

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`  ${i + 1}. ${tc.storeType}/${tc.testId}`);
    console.log(chalk.dim(`     Image: ${tc.imagePath}`));
  }

  console.log('');
  console.log(chalk.dim(`Estimated cost: $${(testCases.length * CONFIG.estimatedCostPerScan).toFixed(2)}`));
}

// ============================================================================
// JSON Output Mode (AC6: --json mode)
// ============================================================================

/**
 * Output results as JSON to stdout for machine-readable output.
 */
export function outputJson(summary: TestRunSummary, results: TestResult[]): void {
  const output = {
    metadata: {
      runAt: summary.startedAt,
      promptVersion: summary.promptVersion,
      totalTests: summary.totalTests,
      passedTests: summary.passedTests,
      failedTests: summary.failedTests,
      erroredTests: summary.erroredTests,
      overallAccuracy: Math.round(summary.overallAccuracy * 100) / 100,
    },
    byField: summary.byField,
    byStoreType: summary.byStoreType,
    results: results.map((r) => ({
      testId: r.testId,
      passed: r.passed,
      score: r.score,
      storeType: r.storeType,
      error: r.error,
      fields: {
        total: r.fields.total,
        date: r.fields.date,
        merchant: {
          expected: r.fields.merchant.expected,
          actual: r.fields.merchant.actual,
          similarity: r.fields.merchant.similarity,
          match: r.fields.merchant.match,
        },
        category: r.fields.category,
        itemsCount: r.fields.itemsCount,
        itemPrices: {
          accuracy: r.fields.itemPrices.accuracy,
          matchCount: r.fields.itemPrices.matchCount,
          totalCount: r.fields.itemPrices.totalCount,
        },
      },
      correctionsFeedback: r.correctionsFeedback,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
}

// ============================================================================
// Quiet Mode (AC6: --quiet mode)
// ============================================================================

/**
 * Display quiet mode summary (only final pass/fail).
 */
export function displayQuietSummary(summary: TestRunSummary): void {
  const passed = summary.failedTests === 0 && summary.erroredTests === 0;

  if (passed) {
    console.log(chalk.green(`✓ All ${summary.totalTests} tests passed`));
  } else {
    console.log(
      chalk.red(`✗ ${summary.failedTests + summary.erroredTests}/${summary.totalTests} tests failed`)
    );
  }
}
