/**
 * Analyzer Module - Failure Analysis and Pattern Detection
 *
 * Analyzes test results to identify failure patterns, group failures
 * by field and store type, and generate structured analysis for
 * prompt improvement.
 *
 * @see docs/sprint-artifacts/epic8/story-8.7-ab-prompt-comparison-analysis.md
 * @see docs/sprint-artifacts/epic8/architecture-epic8.md#Failure-Analysis-Report
 */

import type { TestResult, FieldResults } from '../types';
import type { TestRunOutput } from './result-writer';

// ============================================================================
// Analysis Types
// ============================================================================

/**
 * Pattern detected in failures.
 */
export interface FailurePattern {
  /** Human-readable description of the pattern */
  description: string;
  /** Number of times this pattern occurred */
  occurrences: number;
  /** Examples of this pattern */
  examples: Array<{
    testId: string;
    expected: string | number;
    actual: string | number;
  }>;
}

/**
 * Analysis data for a specific field.
 */
export interface FieldAnalysis {
  /** Number of failures for this field */
  failureCount: number;
  /** Failure rate (0-1) */
  failureRate: number;
  /** Test IDs affected by failures in this field */
  affectedTests: string[];
  /** Detected patterns in failures */
  patterns: FailurePattern[];
}

/**
 * Analysis data for a specific store type.
 */
export interface StoreTypeAnalysis {
  /** Number of failures for this store type */
  failureCount: number;
  /** Total tests for this store type */
  tests: number;
  /** Failure rate (0-1) */
  failureRate: number;
}

/**
 * Detailed failure information for a single test.
 */
export interface FailureDetail {
  testId: string;
  storeType: string;
  score: number;
  failedFields: string[];
  fieldDetails: {
    total?: { expected: number; actual: number; difference: number };
    date?: { expected: string; actual: string };
    merchant?: { expected: string; actual: string; similarity: number };
    itemsCount?: { expected: number; actual: number; difference: number };
    itemPrices?: { accuracy: number; mismatches: number };
  };
  error?: string;
}

/**
 * Complete analysis output structure.
 */
export interface Analysis {
  /** When this analysis was generated */
  generatedAt: string;
  /** Source file that was analyzed */
  sourceFile: string;
  /** Prompt version used in the source */
  promptVersion: string;
  /** Path to the prompt file */
  promptFile: string;

  /** Summary statistics */
  summary: {
    totalTests: number;
    failedTests: number;
    overallAccuracy: number;
  };

  /** Per-field failure analysis */
  byField: {
    total: FieldAnalysis;
    date: FieldAnalysis;
    merchant: FieldAnalysis;
    itemsCount: FieldAnalysis;
    itemPrices: FieldAnalysis;
  };

  /** Per-store-type failure analysis */
  byStoreType: Record<string, StoreTypeAnalysis>;

  /** Detailed failure information */
  failures: FailureDetail[];

  /** Usage hints for manual and LLM-assisted review */
  _meta: {
    usage: {
      manual: string;
      withLLM: {
        instructions: string;
        suggestedPrompt: string;
      };
    };
  };
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze test results and generate structured analysis.
 *
 * @param results - Array of test results to analyze
 * @param sourceFile - Path to the source results file
 * @param promptVersion - Prompt version used for the tests
 * @returns Structured analysis object
 */
export function analyzeResults(
  results: TestResult[],
  sourceFile: string,
  promptVersion: string
): Analysis {
  const failures = results.filter((r) => !r.passed);
  const failedTests = failures.length;
  const totalTests = results.length;
  const overallAccuracy = totalTests > 0
    ? results.reduce((sum, r) => sum + r.score, 0) / totalTests
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    sourceFile,
    promptVersion,
    promptFile: `prompt-testing/prompts/${promptVersion}.ts`,

    summary: {
      totalTests,
      failedTests,
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
    },

    byField: {
      total: analyzeField(results, 'total'),
      date: analyzeField(results, 'date'),
      merchant: analyzeField(results, 'merchant'),
      itemsCount: analyzeField(results, 'itemsCount'),
      itemPrices: analyzeField(results, 'itemPrices'),
    },

    byStoreType: analyzeByStoreType(results),

    failures: failures.map((r) => extractFailureDetail(r)),

    _meta: {
      usage: {
        manual: "Review 'byField' and 'patterns' to identify prompt improvements. Focus on fields with highest failureRate first.",
        withLLM: {
          instructions: 'Use this file as context along with the prompt file to get AI assistance improving your prompt.',
          suggestedPrompt: `I need help improving my receipt scanning prompt. Here's my failure analysis:

1. Overall accuracy: ${overallAccuracy.toFixed(1)}%
2. Most problematic fields: [list from byField with highest failureRate]
3. Store types with issues: [list from byStoreType with highest failureRate]

Please analyze the patterns and suggest specific prompt changes to address these issues.`,
        },
      },
    },
  };
}

/**
 * Analyze failures for a specific field.
 */
function analyzeField(
  results: TestResult[],
  field: 'total' | 'date' | 'merchant' | 'itemsCount' | 'itemPrices'
): FieldAnalysis {
  const totalTests = results.length;
  const failures: TestResult[] = [];
  const affectedTests: string[] = [];

  for (const result of results) {
    let failed = false;

    if (field === 'itemPrices') {
      // Item prices uses accuracy threshold
      if (result.fields.itemPrices.accuracy < 90) {
        failed = true;
      }
    } else {
      // Other fields use boolean match
      const fieldResult = result.fields[field];
      if ('match' in fieldResult && !fieldResult.match) {
        failed = true;
      }
    }

    if (failed) {
      failures.push(result);
      affectedTests.push(result.testId);
    }
  }

  const failureCount = failures.length;
  const failureRate = totalTests > 0 ? failureCount / totalTests : 0;

  // Detect patterns for this field
  const patterns = detectPatterns(failures, field);

  return {
    failureCount,
    failureRate: Math.round(failureRate * 1000) / 1000, // Round to 3 decimals
    affectedTests,
    patterns,
  };
}

/**
 * Analyze failures by store type.
 */
function analyzeByStoreType(results: TestResult[]): Record<string, StoreTypeAnalysis> {
  const byStoreType: Record<string, { failures: number; total: number }> = {};

  for (const result of results) {
    const storeType = result.storeType;
    if (!byStoreType[storeType]) {
      byStoreType[storeType] = { failures: 0, total: 0 };
    }
    byStoreType[storeType].total++;
    if (!result.passed) {
      byStoreType[storeType].failures++;
    }
  }

  const analysis: Record<string, StoreTypeAnalysis> = {};
  for (const [storeType, data] of Object.entries(byStoreType)) {
    analysis[storeType] = {
      failureCount: data.failures,
      tests: data.total,
      failureRate: data.total > 0 ? Math.round((data.failures / data.total) * 1000) / 1000 : 0,
    };
  }

  return analysis;
}

/**
 * Extract detailed failure information from a test result.
 */
function extractFailureDetail(result: TestResult): FailureDetail {
  const failedFields: string[] = [];
  const fieldDetails: FailureDetail['fieldDetails'] = {};

  // Check total
  if (!result.fields.total.match) {
    failedFields.push('total');
    fieldDetails.total = {
      expected: result.fields.total.expected,
      actual: result.fields.total.actual,
      difference: result.fields.total.actual - result.fields.total.expected,
    };
  }

  // Check date
  if (!result.fields.date.match) {
    failedFields.push('date');
    fieldDetails.date = {
      expected: result.fields.date.expected,
      actual: result.fields.date.actual,
    };
  }

  // Check merchant
  if (!result.fields.merchant.match) {
    failedFields.push('merchant');
    fieldDetails.merchant = {
      expected: result.fields.merchant.expected,
      actual: result.fields.merchant.actual,
      similarity: result.fields.merchant.similarity,
    };
  }

  // Check items count
  if (!result.fields.itemsCount.match) {
    failedFields.push('itemsCount');
    fieldDetails.itemsCount = {
      expected: result.fields.itemsCount.expected,
      actual: result.fields.itemsCount.actual,
      difference: result.fields.itemsCount.actual - result.fields.itemsCount.expected,
    };
  }

  // Check item prices
  if (result.fields.itemPrices.accuracy < 90) {
    failedFields.push('itemPrices');
    fieldDetails.itemPrices = {
      accuracy: result.fields.itemPrices.accuracy,
      mismatches: result.fields.itemPrices.totalCount - result.fields.itemPrices.matchCount,
    };
  }

  return {
    testId: result.testId,
    storeType: result.storeType,
    score: result.score,
    failedFields,
    fieldDetails,
    error: result.error,
  };
}

// ============================================================================
// Pattern Detection (AC2, AC3)
// ============================================================================

/**
 * Detect common patterns in field failures.
 */
function detectPatterns(
  failures: TestResult[],
  field: 'total' | 'date' | 'merchant' | 'itemsCount' | 'itemPrices'
): FailurePattern[] {
  const patterns: FailurePattern[] = [];

  switch (field) {
    case 'total':
      patterns.push(...detectTotalPatterns(failures));
      break;
    case 'date':
      patterns.push(...detectDatePatterns(failures));
      break;
    case 'merchant':
      patterns.push(...detectMerchantPatterns(failures));
      break;
    case 'itemsCount':
      patterns.push(...detectItemCountPatterns(failures));
      break;
    case 'itemPrices':
      patterns.push(...detectItemPricePatterns(failures));
      break;
  }

  // Sort by occurrence count (highest first)
  return patterns.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Detect patterns in total field failures.
 */
function detectTotalPatterns(failures: TestResult[]): FailurePattern[] {
  const patterns: FailurePattern[] = [];

  // Pattern: AI picked subtotal instead of final total (actual < expected)
  const subtotalIssues = failures.filter((r) => {
    const diff = r.fields.total.actual - r.fields.total.expected;
    return diff < 0 && Math.abs(diff) > 100; // Significant undershoot
  });

  if (subtotalIssues.length > 0) {
    patterns.push({
      description: 'AI picked subtotal instead of final total (missing tax/fees)',
      occurrences: subtotalIssues.length,
      examples: subtotalIssues.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.total.expected,
        actual: r.fields.total.actual,
      })),
    });
  }

  // Pattern: AI included extra amounts (actual > expected)
  const overShootIssues = failures.filter((r) => {
    const diff = r.fields.total.actual - r.fields.total.expected;
    return diff > 0 && Math.abs(diff) > 100; // Significant overshoot
  });

  if (overShootIssues.length > 0) {
    patterns.push({
      description: 'AI included extra amounts (tip, change, or misread)',
      occurrences: overShootIssues.length,
      examples: overShootIssues.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.total.expected,
        actual: r.fields.total.actual,
      })),
    });
  }

  // Pattern: Minor rounding differences
  const roundingIssues = failures.filter((r) => {
    const diff = Math.abs(r.fields.total.actual - r.fields.total.expected);
    return diff > 0 && diff <= 10; // Small difference
  });

  if (roundingIssues.length > 0) {
    patterns.push({
      description: 'Minor rounding or decimal parsing differences',
      occurrences: roundingIssues.length,
      examples: roundingIssues.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.total.expected,
        actual: r.fields.total.actual,
      })),
    });
  }

  return patterns;
}

/**
 * Detect patterns in date field failures.
 */
function detectDatePatterns(failures: TestResult[]): FailurePattern[] {
  const patterns: FailurePattern[] = [];

  // Pattern: Format mismatch (same date, different format)
  const formatIssues = failures.filter((r) => {
    const expected = r.fields.date.expected;
    const actual = r.fields.date.actual;
    // Check if they contain the same numbers
    const expectedNumbers = expected.replace(/\D/g, '');
    const actualNumbers = actual.replace(/\D/g, '');
    return expectedNumbers === actualNumbers && expected !== actual;
  });

  if (formatIssues.length > 0) {
    patterns.push({
      description: 'Date format mismatch (same date, different format)',
      occurrences: formatIssues.length,
      examples: formatIssues.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.date.expected,
        actual: r.fields.date.actual,
      })),
    });
  }

  // Pattern: Day/month swap (common in international formats)
  const swapIssues = failures.filter((r) => {
    const expected = r.fields.date.expected;
    const actual = r.fields.date.actual;
    // Check for DD-MM vs MM-DD patterns
    const expMatch = expected.match(/(\d{2})-(\d{2})-(\d{4})/);
    const actMatch = actual.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (expMatch && actMatch && expMatch[3] === actMatch[3]) {
      // Same year, check if day/month swapped
      return expMatch[1] === actMatch[2] && expMatch[2] === actMatch[1];
    }
    return false;
  });

  if (swapIssues.length > 0) {
    patterns.push({
      description: 'Day/month swap (DD-MM vs MM-DD format confusion)',
      occurrences: swapIssues.length,
      examples: swapIssues.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.date.expected,
        actual: r.fields.date.actual,
      })),
    });
  }

  // Pattern: Year mismatch
  const yearIssues = failures.filter((r) => {
    const expectedYear = r.fields.date.expected.match(/\d{4}/)?.[0];
    const actualYear = r.fields.date.actual.match(/\d{4}/)?.[0];
    return expectedYear && actualYear && expectedYear !== actualYear;
  });

  if (yearIssues.length > 0) {
    patterns.push({
      description: 'Wrong year extracted',
      occurrences: yearIssues.length,
      examples: yearIssues.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.date.expected,
        actual: r.fields.date.actual,
      })),
    });
  }

  // Generic parsing issues
  const remainingIssues = failures.filter((r) =>
    !formatIssues.includes(r) && !swapIssues.includes(r) && !yearIssues.includes(r)
  );

  if (remainingIssues.length > 0) {
    patterns.push({
      description: 'Date parsing or OCR issues',
      occurrences: remainingIssues.length,
      examples: remainingIssues.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.date.expected,
        actual: r.fields.date.actual,
      })),
    });
  }

  return patterns;
}

/**
 * Detect patterns in merchant name failures.
 */
function detectMerchantPatterns(failures: TestResult[]): FailurePattern[] {
  const patterns: FailurePattern[] = [];

  // Pattern: Partial match (one contains the other)
  const partialMatches = failures.filter((r) => {
    const expected = r.fields.merchant.expected.toLowerCase();
    const actual = r.fields.merchant.actual.toLowerCase();
    return expected.includes(actual) || actual.includes(expected);
  });

  if (partialMatches.length > 0) {
    patterns.push({
      description: 'Partial merchant name match (truncated or extended)',
      occurrences: partialMatches.length,
      examples: partialMatches.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.merchant.expected,
        actual: r.fields.merchant.actual,
      })),
    });
  }

  // Pattern: Low similarity (completely different)
  const lowSimilarity = failures.filter((r) => r.fields.merchant.similarity < 0.3);

  if (lowSimilarity.length > 0) {
    patterns.push({
      description: 'Completely different merchant name extracted',
      occurrences: lowSimilarity.length,
      examples: lowSimilarity.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.merchant.expected,
        actual: r.fields.merchant.actual,
      })),
    });
  }

  // Pattern: Similar but not exact (close similarity)
  const closeButNotExact = failures.filter((r) =>
    r.fields.merchant.similarity >= 0.5 && r.fields.merchant.similarity < 0.8
  );

  if (closeButNotExact.length > 0) {
    patterns.push({
      description: 'Similar merchant name but below threshold (typos, abbreviations)',
      occurrences: closeButNotExact.length,
      examples: closeButNotExact.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.merchant.expected,
        actual: r.fields.merchant.actual,
      })),
    });
  }

  return patterns;
}

/**
 * Detect patterns in item count failures.
 */
function detectItemCountPatterns(failures: TestResult[]): FailurePattern[] {
  const patterns: FailurePattern[] = [];

  // Pattern: AI extracted fewer items
  const fewerItems = failures.filter((r) =>
    r.fields.itemsCount.actual < r.fields.itemsCount.expected
  );

  if (fewerItems.length > 0) {
    patterns.push({
      description: 'AI missed items (extracted fewer than expected)',
      occurrences: fewerItems.length,
      examples: fewerItems.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.itemsCount.expected,
        actual: r.fields.itemsCount.actual,
      })),
    });
  }

  // Pattern: AI extracted more items (hallucination or split)
  const moreItems = failures.filter((r) =>
    r.fields.itemsCount.actual > r.fields.itemsCount.expected
  );

  if (moreItems.length > 0) {
    patterns.push({
      description: 'AI hallucinated items or split single items (extracted more than expected)',
      occurrences: moreItems.length,
      examples: moreItems.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.itemsCount.expected,
        actual: r.fields.itemsCount.actual,
      })),
    });
  }

  return patterns;
}

/**
 * Detect patterns in item price failures.
 */
function detectItemPricePatterns(failures: TestResult[]): FailurePattern[] {
  const patterns: FailurePattern[] = [];

  // Pattern: Very low accuracy
  const veryLowAccuracy = failures.filter((r) => r.fields.itemPrices.accuracy < 50);

  if (veryLowAccuracy.length > 0) {
    patterns.push({
      description: 'Very low item price accuracy (< 50%)',
      occurrences: veryLowAccuracy.length,
      examples: veryLowAccuracy.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.itemPrices.totalCount,
        actual: `${r.fields.itemPrices.matchCount} correct`,
      })),
    });
  }

  // Pattern: Most prices correct but some wrong
  const mostlyCorrect = failures.filter((r) =>
    r.fields.itemPrices.accuracy >= 50 && r.fields.itemPrices.accuracy < 90
  );

  if (mostlyCorrect.length > 0) {
    patterns.push({
      description: 'Most prices correct but some mismatches (50-90% accuracy)',
      occurrences: mostlyCorrect.length,
      examples: mostlyCorrect.slice(0, 3).map((r) => ({
        testId: r.testId,
        expected: r.fields.itemPrices.totalCount,
        actual: `${r.fields.itemPrices.matchCount} correct`,
      })),
    });
  }

  return patterns;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Load and parse a results file.
 */
export function loadResultsFile(filepath: string): TestRunOutput {
  const fs = require('fs');
  const content = fs.readFileSync(filepath, 'utf8');
  return JSON.parse(content) as TestRunOutput;
}

/**
 * Find the most recent results file in the results directory.
 */
export function findMostRecentResultsFile(resultsDir: string): string | null {
  const fs = require('fs');
  const path = require('path');

  if (!fs.existsSync(resultsDir)) {
    return null;
  }

  const files = fs.readdirSync(resultsDir)
    .filter((f: string) => f.endsWith('.json') && f !== '.gitkeep')
    .sort()
    .reverse(); // Most recent first (timestamp-based naming)

  if (files.length === 0) {
    return null;
  }

  return path.join(resultsDir, files[0]);
}

/**
 * Save analysis to a JSON file.
 *
 * @param analysis - The analysis to save
 * @param resultsDir - Directory to save to
 * @returns Path to the saved file
 */
export function saveAnalysis(analysis: Analysis, resultsDir: string): string {
  const fs = require('fs');
  const path = require('path');

  // Generate filename
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

  const filename = `analysis-${timestamp}.json`;
  const filepath = path.join(resultsDir, filename);

  // Ensure directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2), 'utf8');

  return path.relative(process.cwd(), filepath);
}
