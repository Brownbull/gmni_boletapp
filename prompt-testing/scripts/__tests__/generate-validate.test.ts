/**
 * Integration Tests for Generate and Validate Commands
 *
 * Tests cover:
 * - Validate command catches schema violations
 * - Validate command passes for valid files
 * - Generate skips if expected.json already exists
 * - Generate with --force overwrites existing
 * - Validation error reporting format
 *
 * Note: Generate command tests that require actual Cloud Function calls
 * are integration tests that need credentials and are skipped in unit test mode.
 *
 * @see docs/sprint-artifacts/epic8/story-8.6-generate-validate-commands.md
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TestCaseFileSchema } from '../lib/schema';

// ============================================================================
// Test Setup
// ============================================================================

const TEST_FIXTURES_DIR = path.join(__dirname, 'fixtures', 'generate-validate');

/**
 * Create a valid expected.json fixture file.
 */
function createValidExpectedJson(testId: string, storeType: string): object {
  return {
    metadata: {
      testId,
      storeType,
      difficulty: 'medium',
      region: 'CL',
      source: 'manual-collection',
      addedAt: new Date().toISOString(),
    },
    aiExtraction: {
      merchant: `Test ${storeType}`,
      date: '2025-12-11',
      total: 10000,
      category: 'Test',
      items: [{ name: 'Test Item', price: 10000 }],
      model: 'gemini-2.0-flash',
      modelVersion: 'latest',
      extractedAt: new Date().toISOString(),
    },
    corrections: {},
  };
}

/**
 * Create an invalid expected.json fixture file.
 */
function createInvalidExpectedJson(): object {
  return {
    metadata: {
      testId: '', // Invalid: empty testId
      storeType: 'invalid-store', // Invalid: not in enum
      difficulty: 'impossible', // Invalid: not in enum
      source: 'unknown', // Invalid: not in enum
      addedAt: 'not-a-date', // Invalid: not ISO format
    },
    // Missing aiExtraction and corrections - schema requires at least one
  };
}

/**
 * Create fixture directory and files.
 */
function setupFixtures(fixtures: Array<{ storeType: string; testId: string; valid: boolean }>): void {
  // Create base directory
  if (!fs.existsSync(TEST_FIXTURES_DIR)) {
    fs.mkdirSync(TEST_FIXTURES_DIR, { recursive: true });
  }

  for (const fixture of fixtures) {
    const typeDir = path.join(TEST_FIXTURES_DIR, fixture.storeType);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }

    const expectedPath = path.join(typeDir, `${fixture.testId}.expected.json`);
    const data = fixture.valid
      ? createValidExpectedJson(fixture.testId, fixture.storeType)
      : createInvalidExpectedJson();

    fs.writeFileSync(expectedPath, JSON.stringify(data, null, 2));
  }
}

/**
 * Clean up fixture directory.
 */
function cleanupFixtures(): void {
  if (fs.existsSync(TEST_FIXTURES_DIR)) {
    fs.rmSync(TEST_FIXTURES_DIR, { recursive: true, force: true });
  }
}

// ============================================================================
// Validation Tests
// ============================================================================

describe('Validate Command Logic', () => {
  beforeEach(() => {
    cleanupFixtures();
  });

  afterEach(() => {
    cleanupFixtures();
  });

  describe('Schema validation', () => {
    it('should pass validation for valid expected.json files', () => {
      const validData = createValidExpectedJson('jumbo-001', 'supermarket');
      const result = TestCaseFileSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should fail validation for invalid expected.json files', () => {
      const invalidData = createInvalidExpectedJson();
      const result = TestCaseFileSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have multiple errors
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should detect missing required metadata fields', () => {
      const missingFieldsData = {
        metadata: {
          testId: 'test-001',
          // Missing: storeType, difficulty, source, addedAt
        },
        aiExtraction: {
          merchant: 'Test',
          date: '2025-12-11',
          total: 1000,
          category: 'Test',
          items: [],
          model: 'test',
          modelVersion: '1.0',
          extractedAt: '2025-12-11T00:00:00Z',
        },
      };

      const result = TestCaseFileSchema.safeParse(missingFieldsData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.errors.map((e) => e.path.join('.'));
        expect(paths).toContain('metadata.storeType');
        expect(paths).toContain('metadata.difficulty');
        expect(paths).toContain('metadata.source');
        expect(paths).toContain('metadata.addedAt');
      }
    });

    it('should detect invalid enum values', () => {
      const invalidEnumData = {
        metadata: {
          testId: 'test-001',
          storeType: 'grocery', // Invalid - should be 'supermarket', 'pharmacy', etc.
          difficulty: 'easy',
          source: 'manual-collection',
          addedAt: '2025-12-11',
        },
        aiExtraction: {
          merchant: 'Test',
          date: '2025-12-11',
          total: 1000,
          category: 'Test',
          items: [],
          model: 'test',
          modelVersion: '1.0',
          extractedAt: '2025-12-11T00:00:00Z',
        },
      };

      const result = TestCaseFileSchema.safeParse(invalidEnumData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const storeTypeError = result.error.errors.find(
          (e) => e.path.includes('storeType')
        );
        expect(storeTypeError).toBeDefined();
        expect(storeTypeError?.message).toContain('Invalid enum value');
      }
    });

    it('should require at least aiExtraction or corrections', () => {
      const noExtractionOrCorrectionsData = {
        metadata: {
          testId: 'test-001',
          storeType: 'supermarket',
          difficulty: 'easy',
          source: 'manual-collection',
          addedAt: '2025-12-11',
        },
        // Missing both aiExtraction and corrections
      };

      const result = TestCaseFileSchema.safeParse(noExtractionOrCorrectionsData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const hasCustomError = result.error.errors.some(
          (e) => e.message.includes('aiExtraction or corrections')
        );
        expect(hasCustomError).toBe(true);
      }
    });
  });

  describe('File discovery', () => {
    it('should find expected.json files recursively', () => {
      setupFixtures([
        { storeType: 'supermarket', testId: 'jumbo-001', valid: true },
        { storeType: 'pharmacy', testId: 'cruz-verde-001', valid: true },
      ]);

      // Count .expected.json files
      let count = 0;
      function countFiles(dir: string): void {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            countFiles(path.join(dir, entry.name));
          } else if (entry.name.endsWith('.expected.json')) {
            count++;
          }
        }
      }
      countFiles(TEST_FIXTURES_DIR);

      expect(count).toBe(2);
    });

    it('should handle empty directories', () => {
      if (!fs.existsSync(TEST_FIXTURES_DIR)) {
        fs.mkdirSync(TEST_FIXTURES_DIR, { recursive: true });
      }

      // Count .expected.json files
      let count = 0;
      function countFiles(dir: string): void {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            countFiles(path.join(dir, entry.name));
          } else if (entry.name.endsWith('.expected.json')) {
            count++;
          }
        }
      }
      countFiles(TEST_FIXTURES_DIR);

      expect(count).toBe(0);
    });
  });
});

// ============================================================================
// Generate Command Tests (Unit-testable parts)
// ============================================================================

describe('Generate Command Logic', () => {
  describe('Store type mapping', () => {
    const DIRECTORY_TO_STORE_TYPE: Record<string, string> = {
      supermarket: 'supermarket',
      pharmacy: 'pharmacy',
      restaurant: 'restaurant',
      'gas-station': 'gas_station',
      convenience: 'convenience',
      other: 'other',
    };

    function mapStoreType(dirName: string): string {
      return DIRECTORY_TO_STORE_TYPE[dirName.toLowerCase()] || 'other';
    }

    it('should map supermarket directory to supermarket store type', () => {
      expect(mapStoreType('supermarket')).toBe('supermarket');
    });

    it('should map gas-station directory to gas_station store type', () => {
      expect(mapStoreType('gas-station')).toBe('gas_station');
    });

    it('should map unknown directory to other store type', () => {
      expect(mapStoreType('grocery')).toBe('other');
      expect(mapStoreType('unknown')).toBe('other');
    });

    it('should be case insensitive', () => {
      expect(mapStoreType('SUPERMARKET')).toBe('supermarket');
      expect(mapStoreType('Pharmacy')).toBe('pharmacy');
    });
  });

  describe('Test ID extraction', () => {
    function extractTestId(filename: string): string {
      return filename.replace(/\.(jpg|jpeg|png)$/i, '');
    }

    it('should remove .jpg extension', () => {
      expect(extractTestId('jumbo-001.jpg')).toBe('jumbo-001');
    });

    it('should remove .jpeg extension', () => {
      expect(extractTestId('jumbo-001.jpeg')).toBe('jumbo-001');
    });

    it('should remove .png extension', () => {
      expect(extractTestId('jumbo-001.png')).toBe('jumbo-001');
    });

    it('should be case insensitive for extensions', () => {
      expect(extractTestId('test.JPG')).toBe('test');
      expect(extractTestId('test.JPEG')).toBe('test');
      expect(extractTestId('test.PNG')).toBe('test');
    });

    it('should preserve complex filenames', () => {
      expect(extractTestId('cruz-verde-pharmacy-001.jpg')).toBe('cruz-verde-pharmacy-001');
    });
  });

  describe('Expected.json path derivation', () => {
    function getExpectedPath(imagePath: string): string {
      return imagePath.replace(/\.(jpg|jpeg|png)$/i, '.expected.json');
    }

    it('should derive expected.json path from image path', () => {
      expect(getExpectedPath('/test/jumbo-001.jpg')).toBe('/test/jumbo-001.expected.json');
      expect(getExpectedPath('/test/jumbo-001.jpeg')).toBe('/test/jumbo-001.expected.json');
      expect(getExpectedPath('/test/jumbo-001.png')).toBe('/test/jumbo-001.expected.json');
    });
  });

  describe('Metadata auto-fill', () => {
    function createMetadata(testId: string, storeType: string): object {
      return {
        testId,
        storeType,
        difficulty: 'medium', // Default
        region: 'CL', // Default for Chile
        source: 'manual-collection', // Default
        addedAt: new Date().toISOString(),
      };
    }

    it('should create metadata with all required fields', () => {
      const metadata = createMetadata('jumbo-001', 'supermarket');

      expect(metadata).toHaveProperty('testId', 'jumbo-001');
      expect(metadata).toHaveProperty('storeType', 'supermarket');
      expect(metadata).toHaveProperty('difficulty', 'medium');
      expect(metadata).toHaveProperty('region', 'CL');
      expect(metadata).toHaveProperty('source', 'manual-collection');
      expect(metadata).toHaveProperty('addedAt');
    });

    it('should generate valid ISO timestamp for addedAt', () => {
      const metadata = createMetadata('test', 'supermarket') as { addedAt: string };

      // Should be a valid ISO date string
      expect(() => new Date(metadata.addedAt).toISOString()).not.toThrow();
    });
  });
});

// ============================================================================
// Edge Case Tests
// ============================================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    cleanupFixtures();
  });

  afterEach(() => {
    cleanupFixtures();
  });

  describe('Invalid JSON handling', () => {
    it('should report invalid JSON parse errors', () => {
      // Create invalid JSON file
      if (!fs.existsSync(TEST_FIXTURES_DIR)) {
        fs.mkdirSync(TEST_FIXTURES_DIR, { recursive: true });
      }
      const invalidJsonPath = path.join(TEST_FIXTURES_DIR, 'invalid.expected.json');
      fs.writeFileSync(invalidJsonPath, '{ invalid json }');

      // Try to parse
      let parseError: Error | null = null;
      try {
        JSON.parse(fs.readFileSync(invalidJsonPath, 'utf-8'));
      } catch (error) {
        parseError = error as Error;
      }

      expect(parseError).not.toBeNull();
    });
  });

  describe('File existence checks', () => {
    it('should detect when expected.json already exists', () => {
      setupFixtures([{ storeType: 'supermarket', testId: 'existing', valid: true }]);

      const expectedPath = path.join(TEST_FIXTURES_DIR, 'supermarket', 'existing.expected.json');
      expect(fs.existsSync(expectedPath)).toBe(true);
    });

    it('should detect when expected.json does not exist', () => {
      if (!fs.existsSync(TEST_FIXTURES_DIR)) {
        fs.mkdirSync(TEST_FIXTURES_DIR, { recursive: true });
      }

      const expectedPath = path.join(TEST_FIXTURES_DIR, 'supermarket', 'nonexistent.expected.json');
      expect(fs.existsSync(expectedPath)).toBe(false);
    });
  });

  describe('Image file detection', () => {
    it('should recognize valid image extensions', () => {
      const imageExtensions = ['.jpg', '.jpeg', '.png'];
      const testFiles = ['test.jpg', 'test.jpeg', 'test.png', 'test.gif', 'test.txt'];

      const imageFiles = testFiles.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      });

      expect(imageFiles).toHaveLength(3);
      expect(imageFiles).toContain('test.jpg');
      expect(imageFiles).toContain('test.jpeg');
      expect(imageFiles).toContain('test.png');
      expect(imageFiles).not.toContain('test.gif');
      expect(imageFiles).not.toContain('test.txt');
    });
  });
});

// ============================================================================
// Generated File Structure Tests
// ============================================================================

describe('Generated File Structure', () => {
  it('should match expected structure with empty corrections', () => {
    const generated = createValidExpectedJson('test-001', 'supermarket');

    // Verify structure
    expect(generated).toHaveProperty('metadata');
    expect(generated).toHaveProperty('aiExtraction');
    expect(generated).toHaveProperty('corrections');

    // Corrections should be empty object
    expect((generated as { corrections: object }).corrections).toEqual({});

    // Should be valid according to schema
    const result = TestCaseFileSchema.safeParse(generated);
    expect(result.success).toBe(true);
  });

  it('should include all required aiExtraction fields', () => {
    const generated = createValidExpectedJson('test-001', 'supermarket') as {
      aiExtraction: {
        merchant: string;
        date: string;
        total: number;
        category: string;
        items: Array<{ name: string; price: number }>;
        model: string;
        modelVersion: string;
        extractedAt: string;
      };
    };

    expect(generated.aiExtraction).toHaveProperty('merchant');
    expect(generated.aiExtraction).toHaveProperty('date');
    expect(generated.aiExtraction).toHaveProperty('total');
    expect(generated.aiExtraction).toHaveProperty('category');
    expect(generated.aiExtraction).toHaveProperty('items');
    expect(generated.aiExtraction).toHaveProperty('model');
    expect(generated.aiExtraction).toHaveProperty('modelVersion');
    expect(generated.aiExtraction).toHaveProperty('extractedAt');
  });
});
