/**
 * JSON Result File Writer
 *
 * Saves test run results to JSON files in the test-results/ directory.
 * Files are named: {timestamp}_{promptId}.json
 *
 * @see docs/sprint-artifacts/epic8/architecture-epic8.md#Result-Storage
 */

import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from '../config';
import type { TestResult, TestRunSummary } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Complete test run output structure saved to JSON.
 */
export interface TestRunOutput {
  metadata: {
    runAt: string;
    promptId: string;
    promptVersion: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    erroredTests: number;
    overallAccuracy: number;
    duration: number;
    totalApiCost: number;
  };
  byField: {
    total: FieldAccuracy;
    date: FieldAccuracy;
    merchant: FieldAccuracy;
    itemsCount: FieldAccuracy;
    itemPrices: FieldAccuracy;
  };
  byStoreType: Record<string, StoreTypeAccuracy>;
  results: TestResult[];
}

interface FieldAccuracy {
  passed: number;
  total: number;
  accuracy: number;
}

interface StoreTypeAccuracy {
  passed: number;
  total: number;
  accuracy: number;
}

// ============================================================================
// Directory Management
// ============================================================================

/**
 * Ensures the test-results directory exists.
 */
export function ensureResultsDirectory(): void {
  const resultsDir = path.resolve(CONFIG.resultsDir);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
}

/**
 * Creates a .gitkeep file in the test-results directory if it doesn't exist.
 */
export function ensureGitKeep(): void {
  const gitkeepPath = path.resolve(CONFIG.resultsDir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
  }
}

// ============================================================================
// Result Saving
// ============================================================================

/**
 * Generates a timestamped filename for result files.
 *
 * @param promptId - The prompt identifier (e.g., "v1-original")
 * @returns Filename in format: {timestamp}_{promptId}.json
 *
 * @example
 * generateFilename('v1-original')
 * // "2025-12-11_143022_v1-original.json"
 */
export function generateFilename(promptId: string): string {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  // Sanitize promptId for filename
  const safePromptId = promptId.replace(/[^a-zA-Z0-9_-]/g, '_');

  return `${timestamp}_${safePromptId}.json`;
}

/**
 * Calculates per-field accuracy from test results.
 */
function calculateFieldAccuracies(results: TestResult[]): TestRunOutput['byField'] {
  const total = results.length;
  if (total === 0) {
    return {
      total: { passed: 0, total: 0, accuracy: 0 },
      date: { passed: 0, total: 0, accuracy: 0 },
      merchant: { passed: 0, total: 0, accuracy: 0 },
      itemsCount: { passed: 0, total: 0, accuracy: 0 },
      itemPrices: { passed: 0, total: 0, accuracy: 0 },
    };
  }

  const countMatches = (predicate: (r: TestResult) => boolean): number =>
    results.filter(predicate).length;

  const totalPassed = countMatches((r) => r.fields.total.match);
  const datePassed = countMatches((r) => r.fields.date.match);
  const merchantPassed = countMatches((r) => r.fields.merchant.match);
  const itemsCountPassed = countMatches((r) => r.fields.itemsCount.match);

  // Item prices is a bit different - we take the average accuracy
  const avgItemPricesAccuracy =
    results.reduce((sum, r) => sum + r.fields.itemPrices.accuracy, 0) / total;
  // Count as "passed" if accuracy >= 90%
  const itemPricesPassed = countMatches((r) => r.fields.itemPrices.accuracy >= 90);

  return {
    total: {
      passed: totalPassed,
      total,
      accuracy: Math.round((totalPassed / total) * 100),
    },
    date: {
      passed: datePassed,
      total,
      accuracy: Math.round((datePassed / total) * 100),
    },
    merchant: {
      passed: merchantPassed,
      total,
      accuracy: Math.round((merchantPassed / total) * 100),
    },
    itemsCount: {
      passed: itemsCountPassed,
      total,
      accuracy: Math.round((itemsCountPassed / total) * 100),
    },
    itemPrices: {
      passed: itemPricesPassed,
      total,
      accuracy: Math.round(avgItemPricesAccuracy),
    },
  };
}

/**
 * Calculates per-store-type accuracy from test results.
 */
function calculateStoreTypeAccuracies(
  results: TestResult[]
): Record<string, StoreTypeAccuracy> {
  const byStoreType: Record<string, { passed: number; total: number }> = {};

  for (const result of results) {
    const storeType = result.storeType;
    if (!byStoreType[storeType]) {
      byStoreType[storeType] = { passed: 0, total: 0 };
    }
    byStoreType[storeType].total++;
    if (result.passed) {
      byStoreType[storeType].passed++;
    }
  }

  const accuracies: Record<string, StoreTypeAccuracy> = {};
  for (const [storeType, data] of Object.entries(byStoreType)) {
    accuracies[storeType] = {
      passed: data.passed,
      total: data.total,
      accuracy: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
    };
  }

  return accuracies;
}

/**
 * Saves test results to a JSON file.
 *
 * @param results - Array of individual test results
 * @param summary - Test run summary
 * @param promptId - Prompt identifier used for the run
 * @returns Path to the saved file
 *
 * @example
 * const filepath = saveResults(results, summary, 'v1-original');
 * // Returns: "test-results/2025-12-11_143022_v1-original.json"
 */
export function saveResults(
  results: TestResult[],
  summary: TestRunSummary,
  promptId: string
): string {
  // Ensure directory exists
  ensureResultsDirectory();

  // Generate filename
  const filename = generateFilename(promptId);
  const filepath = path.resolve(CONFIG.resultsDir, filename);

  // Build output structure
  const output: TestRunOutput = {
    metadata: {
      runAt: summary.startedAt,
      promptId,
      promptVersion: summary.promptVersion,
      totalTests: summary.totalTests,
      passedTests: summary.passedTests,
      failedTests: summary.failedTests,
      erroredTests: summary.erroredTests,
      overallAccuracy: Math.round(summary.overallAccuracy * 100) / 100,
      duration: summary.duration,
      totalApiCost: Math.round(summary.totalApiCost * 1000) / 1000,
    },
    byField: calculateFieldAccuracies(results),
    byStoreType: calculateStoreTypeAccuracies(results),
    results,
  };

  // Write to file
  fs.writeFileSync(filepath, JSON.stringify(output, null, 2), 'utf8');

  return path.relative(process.cwd(), filepath);
}

/**
 * Gets the relative path for display purposes.
 */
export function getResultsRelativePath(): string {
  return CONFIG.resultsDir;
}
