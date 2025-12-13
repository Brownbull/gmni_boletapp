/**
 * Unit tests for TestCaseFile schema validation
 *
 * Tests cover:
 * - Valid test cases pass validation
 * - Missing required metadata fields fail
 * - Invalid enum values fail
 * - Partial aiExtraction is accepted
 * - Corrections-only (no aiExtraction) is valid
 *
 * @see docs/sprint-artifacts/epic8/story-8.2-test-data-schema-structure.md
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  validateTestCase,
  safeValidateTestCase,
  TestCaseFileSchema,
  MetadataSchema,
  AIExtractionSchema,
  CorrectionsSchema,
  StoreTypeEnum,
} from '../lib/schema';

// Import test fixtures
import validTestCase from './fixtures/valid-test-case.json';
import correctionsOnlyTestCase from './fixtures/corrections-only-test-case.json';
import partialAIExtraction from './fixtures/partial-ai-extraction.json';

describe('TestCaseFile Schema', () => {
  describe('validateTestCase', () => {
    it('should validate a complete test case with all fields', () => {
      const result = validateTestCase(validTestCase);

      expect(result.metadata.testId).toBe('jumbo-001');
      expect(result.metadata.storeType).toBe('supermarket');
      expect(result.aiExtraction).toBeDefined();
      expect(result.aiExtraction?.merchant).toBe('JUMBO');
    });

    it('should validate a corrections-only test case (no aiExtraction)', () => {
      const result = validateTestCase(correctionsOnlyTestCase);

      expect(result.metadata.testId).toBe('lider-001');
      expect(result.aiExtraction).toBeUndefined();
      expect(result.corrections).toBeDefined();
      expect(result.corrections?.merchant).toBe('LIDER');
    });

    it('should validate a test case with partial aiExtraction and corrections', () => {
      const result = validateTestCase(partialAIExtraction);

      expect(result.metadata.testId).toBe('pharmacy-001');
      expect(result.aiExtraction).toBeDefined();
      expect(result.corrections).toBeDefined();
      expect(result.corrections?.items).toBeDefined();
      expect(result.corrections?.addItems).toHaveLength(1);
    });

    it('should throw on missing metadata', () => {
      const invalidData = {
        aiExtraction: validTestCase.aiExtraction,
      };

      expect(() => validateTestCase(invalidData)).toThrow();
    });

    it('should throw on missing both aiExtraction and corrections', () => {
      const invalidData = {
        metadata: validTestCase.metadata,
      };

      expect(() => validateTestCase(invalidData)).toThrow(
        'Test case must have either aiExtraction or corrections'
      );
    });
  });

  describe('safeValidateTestCase', () => {
    it('should return success: true for valid data', () => {
      const result = safeValidateTestCase(validTestCase);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata.testId).toBe('jumbo-001');
      }
    });

    it('should return success: false with errors for invalid data', () => {
      const invalidData = { metadata: { testId: '' } };
      const result = safeValidateTestCase(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('MetadataSchema', () => {
    it('should require testId to be non-empty', () => {
      const invalidMetadata = {
        testId: '',
        storeType: 'supermarket',
        difficulty: 'easy',
        source: 'manual-collection',
        addedAt: '2025-12-11',
      };

      const result = MetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should reject invalid storeType', () => {
      const invalidMetadata = {
        testId: 'test-001',
        storeType: 'invalid-store',
        difficulty: 'easy',
        source: 'manual-collection',
        addedAt: '2025-12-11',
      };

      const result = MetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should reject invalid difficulty', () => {
      const invalidMetadata = {
        testId: 'test-001',
        storeType: 'supermarket',
        difficulty: 'impossible',
        source: 'manual-collection',
        addedAt: '2025-12-11',
      };

      const result = MetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should reject invalid source', () => {
      const invalidMetadata = {
        testId: 'test-001',
        storeType: 'supermarket',
        difficulty: 'easy',
        source: 'unknown-source',
        addedAt: '2025-12-11',
      };

      const result = MetadataSchema.safeParse(invalidMetadata);
      expect(result.success).toBe(false);
    });

    it('should default region to CL', () => {
      const metadata = {
        testId: 'test-001',
        storeType: 'supermarket',
        difficulty: 'easy',
        source: 'manual-collection',
        addedAt: '2025-12-11',
      };

      const result = MetadataSchema.parse(metadata);
      expect(result.region).toBe('CL');
    });

    it('should accept optional fields', () => {
      const metadata = {
        testId: 'test-001',
        storeType: 'supermarket',
        difficulty: 'easy',
        source: 'manual-collection',
        addedAt: '2025-12-11',
        addedBy: 'test-author',
        notes: 'Some notes',
      };

      const result = MetadataSchema.parse(metadata);
      expect(result.addedBy).toBe('test-author');
      expect(result.notes).toBe('Some notes');
    });
  });

  describe('StoreTypeEnum', () => {
    it('should accept all valid store types', () => {
      const validTypes = [
        'supermarket',
        'pharmacy',
        'restaurant',
        'gas_station',
        'convenience',
        'other',
      ];

      validTypes.forEach((type) => {
        const result = StoreTypeEnum.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid store types', () => {
      const result = StoreTypeEnum.safeParse('grocery');
      expect(result.success).toBe(false);
    });
  });

  describe('AIExtractionSchema', () => {
    it('should validate complete AI extraction', () => {
      const result = AIExtractionSchema.safeParse(validTestCase.aiExtraction);
      expect(result.success).toBe(true);
    });

    it('should accept AI extraction without confidence', () => {
      const aiExtraction = {
        merchant: 'Test Store',
        date: '2025-12-11',
        total: 1000,
        category: 'Test',
        items: [],
        model: 'gemini-1.5-flash',
        modelVersion: '1.5',
        extractedAt: '2025-12-11T00:00:00Z',
      };

      const result = AIExtractionSchema.safeParse(aiExtraction);
      expect(result.success).toBe(true);
    });

    it('should accept items without category', () => {
      const aiExtraction = {
        merchant: 'Test Store',
        date: '2025-12-11',
        total: 1000,
        category: 'Test',
        items: [{ name: 'Item 1', price: 500 }],
        model: 'gemini-1.5-flash',
        modelVersion: '1.5',
        extractedAt: '2025-12-11T00:00:00Z',
      };

      const result = AIExtractionSchema.safeParse(aiExtraction);
      expect(result.success).toBe(true);
    });

    it('should reject AI extraction without required fields', () => {
      const incompleteExtraction = {
        merchant: 'Test Store',
        // missing date, total, category, items, model, modelVersion, extractedAt
      };

      const result = AIExtractionSchema.safeParse(incompleteExtraction);
      expect(result.success).toBe(false);
    });
  });

  describe('CorrectionsSchema', () => {
    it('should accept empty corrections object', () => {
      const result = CorrectionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept corrections with only some fields', () => {
      const corrections = {
        total: 15000,
        correctedAt: '2025-12-11T00:00:00Z',
      };

      const result = CorrectionsSchema.safeParse(corrections);
      expect(result.success).toBe(true);
    });

    it('should accept item corrections by index', () => {
      const corrections = {
        items: {
          '0': { price: 1000 },
          '2': { name: 'Corrected Name', delete: true },
        },
      };

      const result = CorrectionsSchema.safeParse(corrections);
      expect(result.success).toBe(true);
    });

    it('should accept addItems array', () => {
      const corrections = {
        addItems: [
          { name: 'Missing Item', price: 500 },
          { name: 'Another Missing', price: 750, category: 'Test' },
        ],
      };

      const result = CorrectionsSchema.safeParse(corrections);
      expect(result.success).toBe(true);
    });
  });

  describe('Thresholds defaults', () => {
    it('should apply default thresholds when not specified', () => {
      const testCase = validateTestCase({
        metadata: {
          testId: 'test-001',
          storeType: 'supermarket',
          difficulty: 'easy',
          source: 'manual-collection',
          addedAt: '2025-12-11',
        },
        corrections: { total: 1000 },
      });

      // Thresholds should be undefined (not auto-populated)
      // Defaults are applied at comparison time, not parse time
      expect(testCase.thresholds).toBeUndefined();
    });

    it('should preserve custom thresholds', () => {
      const testCase = validateTestCase({
        metadata: {
          testId: 'test-001',
          storeType: 'supermarket',
          difficulty: 'easy',
          source: 'manual-collection',
          addedAt: '2025-12-11',
        },
        corrections: { total: 1000 },
        thresholds: {
          merchantSimilarity: 0.9,
          totalTolerance: 10,
          dateTolerance: 'day',
        },
      });

      expect(testCase.thresholds?.merchantSimilarity).toBe(0.9);
      expect(testCase.thresholds?.totalTolerance).toBe(10);
      expect(testCase.thresholds?.dateTolerance).toBe('day');
    });
  });

  describe('Date format validation', () => {
    it('should accept YYYY-MM-DD format', () => {
      const metadata = {
        testId: 'test-001',
        storeType: 'supermarket',
        difficulty: 'easy',
        source: 'manual-collection',
        addedAt: '2025-12-11',
      };

      const result = MetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });

    it('should accept ISO datetime format', () => {
      const metadata = {
        testId: 'test-001',
        storeType: 'supermarket',
        difficulty: 'easy',
        source: 'manual-collection',
        addedAt: '2025-12-11T10:30:00Z',
      };

      const result = MetadataSchema.safeParse(metadata);
      expect(result.success).toBe(true);
    });
  });

  describe('Error messages', () => {
    it('should provide clear error message for missing testId', () => {
      const result = safeValidateTestCase({
        metadata: {
          testId: '',
          storeType: 'supermarket',
          difficulty: 'easy',
          source: 'manual-collection',
          addedAt: '2025-12-11',
        },
        corrections: {},
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const testIdError = result.error.errors.find(
          (e) => e.path.includes('testId')
        );
        expect(testIdError).toBeDefined();
        expect(testIdError?.message).toContain('required');
      }
    });

    it('should provide clear error for invalid storeType enum', () => {
      const result = safeValidateTestCase({
        metadata: {
          testId: 'test-001',
          storeType: 'invalid',
          difficulty: 'easy',
          source: 'manual-collection',
          addedAt: '2025-12-11',
        },
        corrections: {},
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const storeTypeError = result.error.errors.find(
          (e) => e.path.includes('storeType')
        );
        expect(storeTypeError).toBeDefined();
      }
    });
  });
});
