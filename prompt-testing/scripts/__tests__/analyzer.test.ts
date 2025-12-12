/**
 * Unit tests for the analyzer module.
 *
 * Tests pattern detection, failure analysis, and comparison generation.
 *
 * @see docs/sprint-artifacts/epic8/story-8.7-ab-prompt-comparison-analysis.md
 */

import { describe, test, expect } from 'vitest';
import {
  analyzeResults,
  type Analysis,
  type FailurePattern,
  type FieldAnalysis,
} from '../lib/analyzer';
import type { TestResult, FieldResults } from '../types';

// ============================================================================
// Test Data Helpers
// ============================================================================

/**
 * Create a mock test result with configurable failures.
 */
function createMockResult(overrides: {
  testId?: string;
  passed?: boolean;
  score?: number;
  storeType?: string;
  promptVersion?: string;
  totalMatch?: boolean;
  dateMatch?: boolean;
  merchantMatch?: boolean;
  merchantSimilarity?: number;
  itemsCountMatch?: boolean;
  itemPricesAccuracy?: number;
  error?: string;
  totalExpected?: number;
  totalActual?: number;
  dateExpected?: string;
  dateActual?: string;
  merchantExpected?: string;
  merchantActual?: string;
  itemsExpected?: number;
  itemsActual?: number;
} = {}): TestResult {
  const {
    testId = 'test-001',
    passed = true,
    score = 85,
    storeType = 'supermarket',
    promptVersion = 'v1-test',
    totalMatch = true,
    dateMatch = true,
    merchantMatch = true,
    merchantSimilarity = 0.95,
    itemsCountMatch = true,
    itemPricesAccuracy = 95,
    error,
    totalExpected = 10000,
    totalActual = 10000,
    dateExpected = '2025-01-15',
    dateActual = '2025-01-15',
    merchantExpected = 'Super Mart',
    merchantActual = 'Super Mart',
    itemsExpected = 5,
    itemsActual = 5,
  } = overrides;

  return {
    testId,
    passed,
    score,
    storeType,
    promptVersion,
    apiCost: 0.01,
    duration: 1000,
    error,
    fields: {
      total: {
        expected: totalExpected,
        actual: totalActual,
        match: totalMatch,
        difference: totalActual - totalExpected,
      },
      date: {
        expected: dateExpected,
        actual: dateActual,
        match: dateMatch,
      },
      merchant: {
        expected: merchantExpected,
        actual: merchantActual,
        similarity: merchantSimilarity,
        match: merchantMatch,
      },
      category: {
        expected: 'supermarket',
        actual: 'supermarket',
        match: true,
      },
      itemsCount: {
        expected: itemsExpected,
        actual: itemsActual,
        match: itemsCountMatch,
        tolerance: 1,
      },
      itemPrices: {
        accuracy: itemPricesAccuracy,
        details: [],
        matchCount: Math.round((itemPricesAccuracy / 100) * itemsExpected),
        totalCount: itemsExpected,
      },
    },
  };
}

// ============================================================================
// Analysis Tests
// ============================================================================

describe('analyzeResults', () => {
  test('should generate analysis from test results', () => {
    const results: TestResult[] = [
      createMockResult({ testId: 'test-001', passed: true, score: 90 }),
      createMockResult({ testId: 'test-002', passed: false, score: 60, totalMatch: false }),
    ];

    const analysis = analyzeResults(results, 'test-results.json', 'v1-test');

    expect(analysis.sourceFile).toBe('test-results.json');
    expect(analysis.promptVersion).toBe('v1-test');
    expect(analysis.summary.totalTests).toBe(2);
    expect(analysis.summary.failedTests).toBe(1);
  });

  test('should calculate overall accuracy', () => {
    const results: TestResult[] = [
      createMockResult({ score: 90 }),
      createMockResult({ score: 80 }),
      createMockResult({ score: 70 }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');

    // Average of 90, 80, 70 = 80
    expect(analysis.summary.overallAccuracy).toBe(80);
  });

  test('should handle empty results', () => {
    const analysis = analyzeResults([], 'empty.json', 'v1');

    expect(analysis.summary.totalTests).toBe(0);
    expect(analysis.summary.failedTests).toBe(0);
    expect(analysis.summary.overallAccuracy).toBe(0);
    expect(analysis.failures).toHaveLength(0);
  });
});

// ============================================================================
// Field Analysis Tests
// ============================================================================

describe('byField analysis', () => {
  test('should identify total field failures', () => {
    const results: TestResult[] = [
      createMockResult({ totalMatch: true }),
      createMockResult({ totalMatch: false, passed: false }),
      createMockResult({ totalMatch: false, passed: false }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');

    expect(analysis.byField.total.failureCount).toBe(2);
    expect(analysis.byField.total.failureRate).toBeCloseTo(0.667, 2);
    expect(analysis.byField.total.affectedTests).toHaveLength(2);
  });

  test('should identify date field failures', () => {
    const results: TestResult[] = [
      createMockResult({ dateMatch: true }),
      createMockResult({ dateMatch: false, passed: false }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');

    expect(analysis.byField.date.failureCount).toBe(1);
    expect(analysis.byField.date.failureRate).toBe(0.5);
  });

  test('should identify merchant field failures', () => {
    const results: TestResult[] = [
      createMockResult({ merchantMatch: true }),
      createMockResult({ merchantMatch: false, merchantSimilarity: 0.5, passed: false }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');

    expect(analysis.byField.merchant.failureCount).toBe(1);
  });

  test('should identify itemPrices failures based on accuracy threshold', () => {
    const results: TestResult[] = [
      createMockResult({ itemPricesAccuracy: 95 }), // Pass (≥90)
      createMockResult({ itemPricesAccuracy: 85, passed: false }), // Fail (<90)
      createMockResult({ itemPricesAccuracy: 50, passed: false }), // Fail (<90)
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');

    expect(analysis.byField.itemPrices.failureCount).toBe(2);
  });
});

// ============================================================================
// Store Type Analysis Tests
// ============================================================================

describe('byStoreType analysis', () => {
  test('should group failures by store type', () => {
    const results: TestResult[] = [
      createMockResult({ storeType: 'supermarket', passed: true }),
      createMockResult({ storeType: 'supermarket', passed: false }),
      createMockResult({ storeType: 'pharmacy', passed: false }),
      createMockResult({ storeType: 'pharmacy', passed: false }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');

    expect(analysis.byStoreType['supermarket'].failureCount).toBe(1);
    expect(analysis.byStoreType['supermarket'].tests).toBe(2);
    expect(analysis.byStoreType['supermarket'].failureRate).toBe(0.5);

    expect(analysis.byStoreType['pharmacy'].failureCount).toBe(2);
    expect(analysis.byStoreType['pharmacy'].tests).toBe(2);
    expect(analysis.byStoreType['pharmacy'].failureRate).toBe(1);
  });

  test('should handle single store type', () => {
    const results: TestResult[] = [
      createMockResult({ storeType: 'restaurant', passed: true }),
      createMockResult({ storeType: 'restaurant', passed: true }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');

    expect(Object.keys(analysis.byStoreType)).toHaveLength(1);
    expect(analysis.byStoreType['restaurant'].failureRate).toBe(0);
  });
});

// ============================================================================
// Pattern Detection Tests
// ============================================================================

describe('pattern detection', () => {
  test('should detect subtotal pattern in total failures', () => {
    const results: TestResult[] = [
      // AI picked subtotal (actual < expected by significant amount)
      createMockResult({
        totalMatch: false,
        passed: false,
        totalExpected: 10000,
        totalActual: 8500, // Significant undershoot
      }),
      createMockResult({
        totalMatch: false,
        passed: false,
        totalExpected: 20000,
        totalActual: 17000, // Significant undershoot
      }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');
    const patterns = analysis.byField.total.patterns;

    // Should detect the subtotal pattern
    const subtotalPattern = patterns.find((p) =>
      p.description.toLowerCase().includes('subtotal')
    );
    expect(subtotalPattern).toBeDefined();
    expect(subtotalPattern!.occurrences).toBe(2);
  });

  test('should detect date format mismatch pattern', () => {
    const results: TestResult[] = [
      // Same date but different format
      createMockResult({
        dateMatch: false,
        passed: false,
        dateExpected: '2025-01-15',
        dateActual: '20250115', // Same numbers, different format
      }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');
    const patterns = analysis.byField.date.patterns;

    // Should detect format pattern
    expect(patterns.length).toBeGreaterThan(0);
  });

  test('should detect missing items pattern', () => {
    const results: TestResult[] = [
      createMockResult({
        itemsCountMatch: false,
        passed: false,
        itemsExpected: 10,
        itemsActual: 7, // Fewer items
      }),
      createMockResult({
        itemsCountMatch: false,
        passed: false,
        itemsExpected: 5,
        itemsActual: 3, // Fewer items
      }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');
    const patterns = analysis.byField.itemsCount.patterns;

    const missingPattern = patterns.find((p) =>
      p.description.toLowerCase().includes('missed')
    );
    expect(missingPattern).toBeDefined();
    expect(missingPattern!.occurrences).toBe(2);
  });

  test('should detect merchant similarity issues', () => {
    const results: TestResult[] = [
      createMockResult({
        merchantMatch: false,
        passed: false,
        merchantExpected: 'Supermercado Jumbo',
        merchantActual: 'Jumbo', // Partial match
        merchantSimilarity: 0.6,
      }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');
    const patterns = analysis.byField.merchant.patterns;

    expect(patterns.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Failure Details Tests
// ============================================================================

describe('failure details', () => {
  test('should extract failed field details', () => {
    const results: TestResult[] = [
      createMockResult({
        passed: false,
        totalMatch: false,
        totalExpected: 10000,
        totalActual: 9500,
        dateMatch: false,
        dateExpected: '2025-01-15',
        dateActual: '2025-01-14',
      }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');
    const failure = analysis.failures[0];

    expect(failure.failedFields).toContain('total');
    expect(failure.failedFields).toContain('date');
    expect(failure.fieldDetails.total).toBeDefined();
    expect(failure.fieldDetails.total!.difference).toBe(-500);
    expect(failure.fieldDetails.date).toBeDefined();
    expect(failure.fieldDetails.date!.expected).toBe('2025-01-15');
  });

  test('should include error in failure details', () => {
    const results: TestResult[] = [
      createMockResult({
        passed: false,
        error: 'API timeout',
      }),
    ];

    const analysis = analyzeResults(results, 'test.json', 'v1');
    const failure = analysis.failures[0];

    expect(failure.error).toBe('API timeout');
  });
});

// ============================================================================
// Meta Information Tests
// ============================================================================

describe('meta information', () => {
  test('should include usage hints', () => {
    const results: TestResult[] = [createMockResult()];
    const analysis = analyzeResults(results, 'test.json', 'v1');

    expect(analysis._meta.usage.manual).toBeDefined();
    expect(analysis._meta.usage.withLLM.instructions).toBeDefined();
    expect(analysis._meta.usage.withLLM.suggestedPrompt).toBeDefined();
  });

  test('should include prompt file reference', () => {
    const analysis = analyzeResults([], 'test.json', 'v2-multi-currency');

    expect(analysis.promptFile).toBe('prompt-testing/prompts/v2-multi-currency.ts');
  });
});
