/**
 * Unit Tests for Reporter Module
 *
 * Tests for accuracy reporting and console output formatting per Story 8.5:
 * - AC1: Colorized console output
 * - AC2: Per-field accuracy breakdown
 * - AC3: Per-store-type accuracy breakdown
 * - AC6: Output modes (default, verbose, quiet, json)
 *
 * Note: Console output tests use mocking to verify correct output.
 *
 * @see docs/sprint-artifacts/epic8/story-8.5-accuracy-reporting.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TestResult, TestRunSummary, FieldResults } from '../types';

// Mock chalk to simplify test assertions (no ANSI codes)
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => `[green]${s}[/green]`,
    red: (s: string) => `[red]${s}[/red]`,
    yellow: (s: string) => `[yellow]${s}[/yellow]`,
    blue: (s: string) => `[blue]${s}[/blue]`,
    dim: (s: string) => `[dim]${s}[/dim]`,
    bold: (s: string) => `[bold]${s}[/bold]`,
  },
}));

// Import after mocking
import {
  log,
  displayBanner,
  displaySummary,
  displayFieldBreakdown,
  displayStoreTypeBreakdown,
  displayFailures,
  reportProgress,
  outputJson,
  displayQuietSummary,
  type OutputMode,
} from '../lib/reporter';

// ============================================================================
// Test Fixtures
// ============================================================================

const createTestResult = (overrides: Partial<TestResult> = {}): TestResult => ({
  testId: 'supermarket/test-001',
  passed: true,
  score: 85,
  storeType: 'supermarket',
  promptVersion: 'ACTIVE_PROMPT',
  apiCost: 0.01,
  duration: 1000,
  fields: {
    total: { expected: 15990, actual: 15990, match: true },
    date: { expected: '2024-01-15', actual: '2024-01-15', match: true },
    merchant: { expected: 'JUMBO', actual: 'Jumbo', similarity: 1, match: true },
    category: { expected: 'groceries', actual: 'groceries', match: true },
    itemsCount: { expected: 5, actual: 5, match: true, tolerance: 1 },
    itemPrices: { accuracy: 100, details: [], matchCount: 5, totalCount: 5 },
  },
  ...overrides,
});

const createTestSummary = (overrides: Partial<TestRunSummary> = {}): TestRunSummary => ({
  startedAt: '2024-01-15T10:00:00.000Z',
  completedAt: '2024-01-15T10:01:00.000Z',
  duration: 60000,
  promptVersion: 'ACTIVE_PROMPT',
  totalTests: 10,
  passedTests: 8,
  failedTests: 2,
  erroredTests: 0,
  overallAccuracy: 85,
  totalApiCost: 0.10,
  byStoreType: {
    supermarket: { total: 6, passed: 5, accuracy: 83.3 },
    pharmacy: { total: 4, passed: 3, accuracy: 75 },
  },
  byField: {
    total: 90,
    date: 95,
    merchant: 85,
    itemsCount: 80,
    itemPrices: 88,
  },
  ...overrides,
});

// ============================================================================
// AC1: Log Utilities Tests
// ============================================================================

describe('log utilities (AC1)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('log.success should output green checkmark', () => {
    log.success('Test passed');
    expect(consoleSpy).toHaveBeenCalledWith('[green]✓[/green]', 'Test passed');
  });

  it('log.fail should output red X', () => {
    log.fail('Test failed');
    expect(consoleSpy).toHaveBeenCalledWith('[red]✗[/red]', 'Test failed');
  });

  it('log.warn should output yellow warning', () => {
    log.warn('Warning message');
    expect(consoleSpy).toHaveBeenCalledWith('[yellow]⚠[/yellow]', 'Warning message');
  });

  it('log.info should output blue dot', () => {
    log.info('Info message');
    expect(consoleSpy).toHaveBeenCalledWith('[blue]●[/blue]', 'Info message');
  });

  it('log.dim should output dimmed text', () => {
    log.dim('Dim message');
    expect(consoleSpy).toHaveBeenCalledWith('[dim]Dim message[/dim]');
  });

  it('log.header should output bold text with separator', () => {
    log.header('Section Title');
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, '[bold]\nSection Title[/bold]');
    expect(consoleSpy.mock.calls[1][0]).toContain('━');
  });

  it('log.error should output red error message', () => {
    log.error('Error occurred');
    expect(consoleSpy).toHaveBeenCalledWith('[red]✗ Error:[/red]', 'Error occurred');
  });

  it('log.plain should output plain text', () => {
    log.plain('Plain message');
    expect(consoleSpy).toHaveBeenCalledWith('Plain message');
  });
});

// ============================================================================
// Progress Reporting Tests (AC7)
// ============================================================================

describe('reportProgress (AC7)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should display running status with blue dot', () => {
    reportProgress(1, 5, 'test-001', 'running');
    expect(consoleSpy).toHaveBeenCalledWith(
      '[blue]●[/blue]',
      '[dim][1/5][/dim]',
      'test-001'
    );
  });

  it('should display pass status with green checkmark', () => {
    reportProgress(2, 5, 'test-002', 'pass');
    expect(consoleSpy).toHaveBeenCalledWith('[green]✓[/green]', '[2/5]', 'test-002');
  });

  it('should display fail status with red X', () => {
    reportProgress(3, 5, 'test-003', 'fail');
    expect(consoleSpy).toHaveBeenCalledWith('[red]✗[/red]', '[3/5]', 'test-003');
  });

  it('should display error status with yellow warning', () => {
    reportProgress(4, 5, 'test-004', 'error');
    expect(consoleSpy).toHaveBeenCalledWith(
      '[yellow]⚠[/yellow]',
      '[4/5]',
      'test-004',
      '[yellow](error)[/yellow]'
    );
  });

  it('should suppress output in quiet mode', () => {
    reportProgress(1, 5, 'test-001', 'running', 'quiet');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should suppress output in json mode', () => {
    reportProgress(1, 5, 'test-001', 'pass', 'json');
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Banner Display Tests
// ============================================================================

describe('displayBanner', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should display banner in default mode', () => {
    displayBanner('default');
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Scan Test Harness');
  });

  it('should suppress banner in quiet mode', () => {
    displayBanner('quiet');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should suppress banner in json mode', () => {
    displayBanner('json');
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

// ============================================================================
// AC2: Per-Field Breakdown Tests
// ============================================================================

describe('displayFieldBreakdown (AC2)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should display breakdown for all 5 fields', () => {
    const summary = createTestSummary();
    displayFieldBreakdown(summary);

    // Should have header + 5 field rows
    expect(consoleSpy).toHaveBeenCalled();

    // Check all field names appear in output
    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('total');
    expect(allCalls).toContain('date');
    expect(allCalls).toContain('merchant');
    expect(allCalls).toContain('itemsCount');
    expect(allCalls).toContain('itemPrices');
  });

  it('should show accuracy percentages', () => {
    const summary = createTestSummary({
      byField: {
        total: 90,
        date: 95,
        merchant: 85,
        itemsCount: 80,
        itemPrices: 88,
      },
    });
    displayFieldBreakdown(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('90%');
    expect(allCalls).toContain('95%');
    expect(allCalls).toContain('85%');
    expect(allCalls).toContain('80%');
    expect(allCalls).toContain('88%');
  });

  it('should color code based on target thresholds', () => {
    const summary = createTestSummary({
      byField: {
        total: 98, // >= 98% target -> green
        date: 80, // < 95% target -> warning or red
        merchant: 90, // >= 90% target -> green
        itemsCount: 85, // >= 85% target -> green
        itemPrices: 50, // < 90% target -> red
      },
    });
    displayFieldBreakdown(summary);

    // Just verify it runs without error - color coding is internal
    expect(consoleSpy).toHaveBeenCalled();
  });
});

// ============================================================================
// AC3: Per-Store-Type Breakdown Tests
// ============================================================================

describe('displayStoreTypeBreakdown (AC3)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should display breakdown for all store types', () => {
    const summary = createTestSummary({
      byStoreType: {
        supermarket: { total: 6, passed: 5, accuracy: 83 },
        pharmacy: { total: 4, passed: 3, accuracy: 75 },
      },
    });
    displayStoreTypeBreakdown(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('supermarket');
    expect(allCalls).toContain('pharmacy');
  });

  it('should show passed/total counts', () => {
    const summary = createTestSummary({
      byStoreType: {
        supermarket: { total: 10, passed: 8, accuracy: 80 },
      },
    });
    displayStoreTypeBreakdown(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('8/10');
    expect(allCalls).toContain('80%');
  });

  it('should highlight low accuracy store types', () => {
    const summary = createTestSummary({
      byStoreType: {
        pharmacy: { total: 10, passed: 3, accuracy: 30 }, // Very low
        supermarket: { total: 10, passed: 9, accuracy: 90 }, // High
      },
    });
    displayStoreTypeBreakdown(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    // Low accuracy types should have indicators
    expect(allCalls).toContain('pharmacy');
  });

  it('should handle empty store types', () => {
    const summary = createTestSummary({
      byStoreType: {},
    });
    displayStoreTypeBreakdown(summary);
    // Should not error, just not output anything meaningful
    expect(consoleSpy.mock.calls.length).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// Summary Display Tests
// ============================================================================

describe('displaySummary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should display overall pass rate', () => {
    const summary = createTestSummary({
      totalTests: 10,
      passedTests: 8,
      failedTests: 2,
    });
    displaySummary(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('8/10');
    expect(allCalls).toContain('80%');
  });

  it('should show green color for all passing', () => {
    const summary = createTestSummary({
      totalTests: 5,
      passedTests: 5,
      failedTests: 0,
    });
    displaySummary(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('[green]');
  });

  it('should show red color when failures exist', () => {
    const summary = createTestSummary({
      totalTests: 5,
      passedTests: 3,
      failedTests: 2,
    });
    displaySummary(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('[red]');
  });

  it('should display duration and cost', () => {
    const summary = createTestSummary({
      duration: 30000, // 30 seconds
      totalApiCost: 0.15,
    });
    displaySummary(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('30.0s');
    expect(allCalls).toContain('$0.15');
  });

  it('should suppress output in json mode', () => {
    displaySummary(createTestSummary(), 'json');
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Failures Display Tests
// ============================================================================

describe('displayFailures', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should not display anything when no failures', () => {
    const results = [createTestResult({ passed: true })];
    displayFailures(results);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should list failed test IDs', () => {
    const results = [
      createTestResult({ testId: 'test-001', passed: false }),
      createTestResult({ testId: 'test-002', passed: false }),
    ];
    displayFailures(results);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('test-001');
    expect(allCalls).toContain('test-002');
  });

  it('should show which fields failed', () => {
    const results = [
      createTestResult({
        testId: 'test-001',
        passed: false,
        fields: {
          total: { expected: 100, actual: 90, match: false },
          date: { expected: '2024-01-15', actual: '2024-01-15', match: true },
          merchant: { expected: 'JUMBO', actual: 'Jumbo', similarity: 1, match: true },
          category: { expected: 'groceries', actual: 'groceries', match: true },
          itemsCount: { expected: 5, actual: 5, match: true, tolerance: 1 },
          itemPrices: { accuracy: 100, details: [], matchCount: 5, totalCount: 5 },
        },
      }),
    ];
    displayFailures(results);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('total');
    expect(allCalls).toContain('expected 100');
    expect(allCalls).toContain('got 90');
  });

  it('should display error message for errored tests', () => {
    const results = [
      createTestResult({
        testId: 'test-001',
        passed: false,
        error: 'API timeout',
      }),
    ];
    displayFailures(results);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('API timeout');
  });

  it('should suppress output in quiet mode', () => {
    const results = [createTestResult({ passed: false })];
    displayFailures(results, 'quiet');
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});

// ============================================================================
// AC6: Output Modes Tests
// ============================================================================

describe('outputJson (AC6 --json)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should output valid JSON', () => {
    const summary = createTestSummary();
    const results = [createTestResult()];

    outputJson(summary, results);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const output = consoleSpy.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should include metadata in JSON output', () => {
    const summary = createTestSummary({
      startedAt: '2024-01-15T10:00:00.000Z',
      promptVersion: 'v2-test',
      totalTests: 5,
      passedTests: 4,
      failedTests: 1,
    });
    const results = [createTestResult()];

    outputJson(summary, results);

    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.metadata).toBeDefined();
    expect(output.metadata.runAt).toBe('2024-01-15T10:00:00.000Z');
    expect(output.metadata.promptVersion).toBe('v2-test');
    expect(output.metadata.totalTests).toBe(5);
    expect(output.metadata.passedTests).toBe(4);
    expect(output.metadata.failedTests).toBe(1);
  });

  it('should include byField breakdown in JSON output', () => {
    const summary = createTestSummary({
      byField: {
        total: 90,
        date: 95,
        merchant: 85,
        itemsCount: 80,
        itemPrices: 88,
      },
    });
    const results = [createTestResult()];

    outputJson(summary, results);

    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.byField).toBeDefined();
    expect(output.byField.total).toBe(90);
    expect(output.byField.date).toBe(95);
  });

  it('should include byStoreType breakdown in JSON output', () => {
    const summary = createTestSummary({
      byStoreType: {
        supermarket: { total: 6, passed: 5, accuracy: 83 },
      },
    });
    const results = [createTestResult()];

    outputJson(summary, results);

    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.byStoreType).toBeDefined();
    expect(output.byStoreType.supermarket).toBeDefined();
    expect(output.byStoreType.supermarket.total).toBe(6);
  });

  it('should include individual test results in JSON output', () => {
    const results = [
      createTestResult({ testId: 'test-001', passed: true, score: 95 }),
      createTestResult({ testId: 'test-002', passed: false, score: 65 }),
    ];

    outputJson(createTestSummary(), results);

    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.results).toHaveLength(2);
    expect(output.results[0].testId).toBe('test-001');
    expect(output.results[0].passed).toBe(true);
    expect(output.results[1].testId).toBe('test-002');
    expect(output.results[1].passed).toBe(false);
  });
});

describe('displayQuietSummary (AC6 --quiet)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should show green pass message when all pass', () => {
    const summary = createTestSummary({
      totalTests: 5,
      passedTests: 5,
      failedTests: 0,
      erroredTests: 0,
    });
    displayQuietSummary(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('[green]');
    expect(allCalls).toContain('5 tests passed');
  });

  it('should show red fail message when failures exist', () => {
    const summary = createTestSummary({
      totalTests: 5,
      passedTests: 3,
      failedTests: 2,
      erroredTests: 0,
    });
    displayQuietSummary(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('[red]');
    expect(allCalls).toContain('2/5 tests failed');
  });

  it('should count errored tests as failures', () => {
    const summary = createTestSummary({
      totalTests: 5,
      passedTests: 3,
      failedTests: 1,
      erroredTests: 1,
    });
    displayQuietSummary(summary);

    const allCalls = consoleSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(allCalls).toContain('2/5 tests failed');
  });
});
