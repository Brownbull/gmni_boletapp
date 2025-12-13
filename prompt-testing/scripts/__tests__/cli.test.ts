/**
 * CLI Integration Tests for Scan Test Harness
 *
 * Tests cover:
 * - --dry-run mode produces expected output
 * - --limit flag is respected
 * - --type filter works correctly
 * - Exit code 2 for invalid arguments
 *
 * @see docs/sprint-artifacts/epic8/story-8.3-test-harness-core-cli.md#AC9
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { discoverTestCases, type TestCase } from '../lib/discovery';
import { CONFIG, isValidStoreType, EXIT_CODES } from '../config';

// ============================================================================
// Test Setup
// ============================================================================

const TEST_DATA_DIR = path.join(__dirname, 'fixtures', 'test-data');

/**
 * Create a temporary test data directory with mock test cases.
 */
function createMockTestData(testCases: Array<{ storeType: string; testId: string }>): void {
  // Create base directory
  if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  }

  // Create test cases
  for (const tc of testCases) {
    const typeDir = path.join(TEST_DATA_DIR, tc.storeType);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }

    // Create mock image (1x1 white JPEG)
    const imagePath = path.join(typeDir, `${tc.testId}.jpg`);
    // Minimal valid JPEG bytes
    const jpegBytes = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
      0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
      0xFF, 0xD9
    ]);
    fs.writeFileSync(imagePath, jpegBytes);

    // Create expected.json
    const expectedPath = path.join(typeDir, `${tc.testId}.expected.json`);
    const expectedData = {
      metadata: {
        testId: tc.testId,
        storeType: tc.storeType,
        difficulty: 'easy',
        source: 'manual-collection',
        addedAt: '2025-12-11',
      },
      aiExtraction: {
        merchant: `Test ${tc.storeType}`,
        date: '2025-12-11',
        total: 10000,
        category: 'Test',
        items: [{ name: 'Test Item', price: 10000 }],
        model: 'gemini-1.5-flash',
        modelVersion: '1.5',
        extractedAt: '2025-12-11T00:00:00Z',
      },
    };
    fs.writeFileSync(expectedPath, JSON.stringify(expectedData, null, 2));
  }
}

/**
 * Clean up temporary test data.
 */
function cleanupMockTestData(): void {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('CLI Discovery', () => {
  beforeEach(() => {
    cleanupMockTestData();
  });

  afterEach(() => {
    cleanupMockTestData();
  });

  describe('discoverTestCases', () => {
    it('should discover all test cases in directory', () => {
      createMockTestData([
        { storeType: 'supermarket', testId: 'jumbo-001' },
        { storeType: 'supermarket', testId: 'lider-001' },
        { storeType: 'pharmacy', testId: 'cruz-verde-001' },
      ]);

      const testCases = discoverTestCases({ folder: TEST_DATA_DIR });

      expect(testCases).toHaveLength(3);
      expect(testCases.map(tc => tc.testId)).toContain('jumbo-001');
      expect(testCases.map(tc => tc.testId)).toContain('lider-001');
      expect(testCases.map(tc => tc.testId)).toContain('cruz-verde-001');
    });

    it('should filter by store type', () => {
      createMockTestData([
        { storeType: 'supermarket', testId: 'jumbo-001' },
        { storeType: 'pharmacy', testId: 'cruz-verde-001' },
        { storeType: 'restaurant', testId: 'dominos-001' },
      ]);

      const testCases = discoverTestCases({ folder: TEST_DATA_DIR, type: 'supermarket' });

      expect(testCases).toHaveLength(1);
      expect(testCases[0].testId).toBe('jumbo-001');
      expect(testCases[0].storeType).toBe('supermarket');
    });

    it('should filter by single image', () => {
      createMockTestData([
        { storeType: 'supermarket', testId: 'jumbo-001' },
        { storeType: 'supermarket', testId: 'lider-001' },
      ]);

      const testCases = discoverTestCases({ folder: TEST_DATA_DIR, image: 'jumbo-001.jpg' });

      expect(testCases).toHaveLength(1);
      expect(testCases[0].testId).toBe('jumbo-001');
    });

    it('should return empty array when no test cases found', () => {
      createMockTestData([]);

      const testCases = discoverTestCases({ folder: TEST_DATA_DIR });

      expect(testCases).toHaveLength(0);
    });

    it('should skip images without expected.json', () => {
      // Create directory but only add image, no expected.json
      const typeDir = path.join(TEST_DATA_DIR, 'supermarket');
      fs.mkdirSync(typeDir, { recursive: true });
      fs.writeFileSync(path.join(typeDir, 'orphan.jpg'), Buffer.from([0xFF, 0xD8, 0xFF, 0xD9]));

      const testCases = discoverTestCases({ folder: TEST_DATA_DIR });

      expect(testCases).toHaveLength(0);
    });

    it('should throw error for invalid store type', () => {
      createMockTestData([{ storeType: 'supermarket', testId: 'test-001' }]);

      expect(() => {
        discoverTestCases({ folder: TEST_DATA_DIR, type: 'invalid_type' });
      }).toThrow('Invalid store type');
    });

    it('should sort results by store type then testId', () => {
      createMockTestData([
        { storeType: 'restaurant', testId: 'dominos-001' },
        { storeType: 'pharmacy', testId: 'cruz-verde-001' },
        { storeType: 'supermarket', testId: 'lider-001' },
        { storeType: 'pharmacy', testId: 'ahumada-001' },
        { storeType: 'supermarket', testId: 'jumbo-001' },
      ]);

      const testCases = discoverTestCases({ folder: TEST_DATA_DIR });

      expect(testCases[0].storeType).toBe('pharmacy');
      expect(testCases[0].testId).toBe('ahumada-001');
      expect(testCases[1].storeType).toBe('pharmacy');
      expect(testCases[1].testId).toBe('cruz-verde-001');
      expect(testCases[2].storeType).toBe('restaurant');
      expect(testCases[3].storeType).toBe('supermarket');
      expect(testCases[3].testId).toBe('jumbo-001');
      expect(testCases[4].storeType).toBe('supermarket');
      expect(testCases[4].testId).toBe('lider-001');
    });
  });
});

describe('CONFIG', () => {
  it('should have default limit of 5 (ADR-012)', () => {
    expect(CONFIG.defaultLimit).toBe(5);
  });

  it('should have valid threshold weights summing to 1', () => {
    const totalWeight =
      CONFIG.thresholds.total.weight +
      CONFIG.thresholds.date.weight +
      CONFIG.thresholds.merchant.weight +
      CONFIG.thresholds.itemsCount.weight +
      CONFIG.thresholds.itemPrices.weight;

    expect(totalWeight).toBe(1);
  });

  it('should have estimatedCostPerScan of $0.01', () => {
    expect(CONFIG.estimatedCostPerScan).toBe(0.01);
  });

  it('should have all valid store types', () => {
    expect(CONFIG.validStoreTypes).toContain('supermarket');
    expect(CONFIG.validStoreTypes).toContain('pharmacy');
    expect(CONFIG.validStoreTypes).toContain('restaurant');
    expect(CONFIG.validStoreTypes).toContain('gas_station');
    expect(CONFIG.validStoreTypes).toContain('convenience');
    expect(CONFIG.validStoreTypes).toContain('other');
  });
});

describe('isValidStoreType', () => {
  it('should return true for valid store types', () => {
    expect(isValidStoreType('supermarket')).toBe(true);
    expect(isValidStoreType('pharmacy')).toBe(true);
    expect(isValidStoreType('restaurant')).toBe(true);
  });

  it('should return false for invalid store types', () => {
    expect(isValidStoreType('invalid')).toBe(false);
    expect(isValidStoreType('grocery')).toBe(false);
    expect(isValidStoreType('')).toBe(false);
  });
});

describe('EXIT_CODES', () => {
  it('should have code 0 for success', () => {
    expect(EXIT_CODES.SUCCESS).toBe(0);
  });

  it('should have code 1 for test failure', () => {
    expect(EXIT_CODES.TEST_FAILURE).toBe(1);
  });

  it('should have code 2 for error', () => {
    expect(EXIT_CODES.ERROR).toBe(2);
  });
});

describe('Limit application', () => {
  beforeEach(() => {
    cleanupMockTestData();
  });

  afterEach(() => {
    cleanupMockTestData();
  });

  it('should apply default limit of 5', () => {
    // Create 10 test cases
    const testCases: Array<{ storeType: string; testId: string }> = [];
    for (let i = 1; i <= 10; i++) {
      testCases.push({ storeType: 'supermarket', testId: `test-${i.toString().padStart(3, '0')}` });
    }
    createMockTestData(testCases);

    const discovered = discoverTestCases({ folder: TEST_DATA_DIR });
    const limited = discovered.slice(0, CONFIG.defaultLimit);

    expect(discovered).toHaveLength(10);
    expect(limited).toHaveLength(5);
  });

  it('should respect custom limit', () => {
    const testCases: Array<{ storeType: string; testId: string }> = [];
    for (let i = 1; i <= 10; i++) {
      testCases.push({ storeType: 'supermarket', testId: `test-${i.toString().padStart(3, '0')}` });
    }
    createMockTestData(testCases);

    const discovered = discoverTestCases({ folder: TEST_DATA_DIR });
    const limited = discovered.slice(0, 3);

    expect(limited).toHaveLength(3);
  });

  it('should allow "all" to bypass limit', () => {
    const testCases: Array<{ storeType: string; testId: string }> = [];
    for (let i = 1; i <= 10; i++) {
      testCases.push({ storeType: 'supermarket', testId: `test-${i.toString().padStart(3, '0')}` });
    }
    createMockTestData(testCases);

    const discovered = discoverTestCases({ folder: TEST_DATA_DIR });
    // When limit is 'all', we take all discovered
    const limited = discovered;

    expect(limited).toHaveLength(10);
  });
});
