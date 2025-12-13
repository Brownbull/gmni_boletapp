/**
 * Unit Tests for Result Writer Module
 *
 * Tests for JSON result file generation per Story 8.5:
 * - AC4: JSON result file creation
 * - AC5: test-results/ directory management
 *
 * @see docs/sprint-artifacts/epic8/story-8.5-accuracy-reporting.md
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import type { TestResult, TestRunSummary } from '../types';

// Mocked fs functions
const mockExistsSync = vi.fn();
const mockMkdirSync = vi.fn();
const mockWriteFileSync = vi.fn();

// Mock fs module with explicit mocks
vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
}));

// Mock path.resolve and path.relative
vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('path')>('path');
  return {
    ...actual,
    resolve: (...args: string[]) => args.join('/'),
    relative: (_from: string, to: string) => to,
  };
});

// Import after mocking
import {
  generateFilename,
  ensureResultsDirectory,
  ensureGitKeep,
  saveResults,
} from '../lib/result-writer';

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
// Filename Generation Tests
// ============================================================================

describe('generateFilename', () => {
  it('should generate filename with timestamp and promptId', () => {
    const filename = generateFilename('v1-original');
    expect(filename).toMatch(/^\d{8}_\d{6}_v1-original\.json$/);
  });

  it('should sanitize special characters in promptId', () => {
    const filename = generateFilename('test/prompt:v2');
    expect(filename).not.toContain('/');
    expect(filename).not.toContain(':');
    expect(filename).toContain('test_prompt_v2');
  });

  it('should preserve valid characters', () => {
    const filename = generateFilename('my-prompt_v3');
    expect(filename).toContain('my-prompt_v3');
  });

  it('should end with .json extension', () => {
    const filename = generateFilename('test');
    expect(filename).toMatch(/\.json$/);
  });
});

// ============================================================================
// Directory Management Tests (AC5)
// ============================================================================

describe('ensureResultsDirectory (AC5)', () => {
  beforeEach(() => {
    mockExistsSync.mockReset();
    mockMkdirSync.mockReset();
  });

  it('should create directory if it does not exist', () => {
    mockExistsSync.mockReturnValue(false);

    ensureResultsDirectory();

    expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it('should not create directory if it already exists', () => {
    mockExistsSync.mockReturnValue(true);

    ensureResultsDirectory();

    expect(mockMkdirSync).not.toHaveBeenCalled();
  });
});

describe('ensureGitKeep (AC5)', () => {
  beforeEach(() => {
    mockExistsSync.mockReset();
    mockWriteFileSync.mockReset();
  });

  it('should create .gitkeep if it does not exist', () => {
    mockExistsSync.mockReturnValue(false);

    ensureGitKeep();

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('.gitkeep'),
      ''
    );
  });

  it('should not create .gitkeep if it already exists', () => {
    mockExistsSync.mockReturnValue(true);

    ensureGitKeep();

    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Result Saving Tests (AC4)
// ============================================================================

describe('saveResults (AC4)', () => {
  beforeEach(() => {
    mockExistsSync.mockReturnValue(true);
    mockWriteFileSync.mockReset();
  });

  it('should write JSON file to results directory', () => {
    const results = [createTestResult()];
    const summary = createTestSummary();

    saveResults(results, summary, 'v1-test');

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('prompt-testing/results'),
      expect.any(String),
      'utf8'
    );
  });

  it('should write valid JSON content', () => {
    const results = [createTestResult()];
    const summary = createTestSummary();

    saveResults(results, summary, 'v1-test');

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
    expect(() => JSON.parse(writtenContent)).not.toThrow();
  });

  it('should include metadata section', () => {
    const results = [createTestResult()];
    const summary = createTestSummary({
      startedAt: '2024-01-15T10:00:00.000Z',
      promptVersion: 'v2-original',
      totalTests: 5,
      passedTests: 4,
    });

    saveResults(results, summary, 'v2-original');

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenContent);

    expect(parsed.metadata).toBeDefined();
    expect(parsed.metadata.runAt).toBe('2024-01-15T10:00:00.000Z');
    expect(parsed.metadata.promptId).toBe('v2-original');
    expect(parsed.metadata.totalTests).toBe(5);
    expect(parsed.metadata.passedTests).toBe(4);
  });

  it('should include byField section', () => {
    const results = [createTestResult()];
    const summary = createTestSummary({
      byField: {
        total: 90,
        date: 95,
        merchant: 85,
        itemsCount: 80,
        itemPrices: 88,
      },
    });

    saveResults(results, summary, 'test');

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenContent);

    expect(parsed.byField).toBeDefined();
    expect(parsed.byField.total.accuracy).toBe(100); // From results calculation
    expect(parsed.byField.date.accuracy).toBe(100); // From results calculation
  });

  it('should include byStoreType section', () => {
    const results = [
      createTestResult({ storeType: 'supermarket', passed: true }),
      createTestResult({ storeType: 'supermarket', passed: false }),
    ];
    const summary = createTestSummary({
      byStoreType: {
        supermarket: { total: 2, passed: 1, accuracy: 50 },
      },
    });

    saveResults(results, summary, 'test');

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenContent);

    expect(parsed.byStoreType).toBeDefined();
    expect(parsed.byStoreType.supermarket).toBeDefined();
  });

  it('should include individual results array', () => {
    const results = [
      createTestResult({ testId: 'test-001', passed: true }),
      createTestResult({ testId: 'test-002', passed: false }),
    ];
    const summary = createTestSummary();

    saveResults(results, summary, 'test');

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenContent);

    expect(parsed.results).toHaveLength(2);
    expect(parsed.results[0].testId).toBe('test-001');
    expect(parsed.results[1].testId).toBe('test-002');
  });

  it('should return relative file path', () => {
    const results = [createTestResult()];
    const summary = createTestSummary();

    const filepath = saveResults(results, summary, 'v1-test');

    expect(filepath).toContain('prompt-testing/results');
    expect(filepath).toContain('.json');
  });

  it('should calculate byField accuracies from results', () => {
    const results = [
      createTestResult({
        fields: {
          total: { expected: 100, actual: 100, match: true },
          date: { expected: '2024-01-15', actual: '2024-01-15', match: true },
          merchant: { expected: 'JUMBO', actual: 'Jumbo', similarity: 1, match: true },
          itemsCount: { expected: 5, actual: 5, match: true, tolerance: 1 },
          itemPrices: { accuracy: 100, details: [], matchCount: 5, totalCount: 5 },
        },
      }),
      createTestResult({
        fields: {
          total: { expected: 100, actual: 90, match: false }, // Failed
          date: { expected: '2024-01-15', actual: '2024-01-15', match: true },
          merchant: { expected: 'JUMBO', actual: 'WALMART', similarity: 0.2, match: false }, // Failed
          itemsCount: { expected: 5, actual: 5, match: true, tolerance: 1 },
          itemPrices: { accuracy: 50, details: [], matchCount: 2, totalCount: 4 },
        },
      }),
    ];
    const summary = createTestSummary();

    saveResults(results, summary, 'test');

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenContent);

    // total: 1/2 passed = 50%
    expect(parsed.byField.total.accuracy).toBe(50);
    // date: 2/2 passed = 100%
    expect(parsed.byField.date.accuracy).toBe(100);
    // merchant: 1/2 passed = 50%
    expect(parsed.byField.merchant.accuracy).toBe(50);
  });

  it('should calculate byStoreType accuracies from results', () => {
    const results = [
      createTestResult({ storeType: 'supermarket', passed: true }),
      createTestResult({ storeType: 'supermarket', passed: false }),
      createTestResult({ storeType: 'pharmacy', passed: true }),
    ];
    const summary = createTestSummary();

    saveResults(results, summary, 'test');

    const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenContent);

    // supermarket: 1/2 = 50%
    expect(parsed.byStoreType.supermarket.passed).toBe(1);
    expect(parsed.byStoreType.supermarket.total).toBe(2);
    expect(parsed.byStoreType.supermarket.accuracy).toBe(50);

    // pharmacy: 1/1 = 100%
    expect(parsed.byStoreType.pharmacy.passed).toBe(1);
    expect(parsed.byStoreType.pharmacy.total).toBe(1);
    expect(parsed.byStoreType.pharmacy.accuracy).toBe(100);
  });
});
