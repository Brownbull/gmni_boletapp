/**
 * Unit Tests for Ground Truth Computation
 *
 * Tests the merging of AI extraction with human corrections
 * per ADR-011: Corrections-Based Ground Truth.
 *
 * AC7: `computeGroundTruth()` merges aiExtraction with corrections
 *
 * @see docs/sprint-artifacts/epic8/story-8.4-result-comparison-engine.md
 */

import { describe, it, expect } from 'vitest';
import { computeGroundTruth, hasCorrections, summarizeGroundTruth } from '../lib/ground-truth';
import type { TestCaseFile } from '../lib/schema';

// ============================================================================
// Test Fixtures
// ============================================================================

const createTestCase = (overrides: Partial<TestCaseFile> = {}): TestCaseFile => {
  return {
    metadata: {
      testId: 'test-001',
      storeType: 'supermarket',
      difficulty: 'medium',
      region: 'CL',
      source: 'manual-collection',
      addedAt: '2024-01-15',
    },
    aiExtraction: {
      merchant: 'JUMB0', // AI typo
      date: '2024-01-15',
      total: 15990,
      category: 'supermarket',
      items: [
        { name: 'Leche', price: 1990 },
        { name: 'Pan', price: 990 },
      ],
      model: 'gemini-1.5-flash',
      modelVersion: '001',
      extractedAt: '2024-01-15T10:00:00Z',
    },
    ...overrides,
  };
};

// ============================================================================
// AC7: Ground Truth Computation Tests
// ============================================================================

describe('computeGroundTruth (AC7)', () => {
  describe('aiExtraction only (no corrections)', () => {
    it('should use AI values when no corrections exist', () => {
      const testCase = createTestCase({ corrections: undefined });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.merchant).toBe('JUMB0');
      expect(groundTruth.date).toBe('2024-01-15');
      expect(groundTruth.total).toBe(15990);
      expect(groundTruth.category).toBe('supermarket');
      expect(groundTruth.items).toHaveLength(2);
    });

    it('should track source as AI only', () => {
      const testCase = createTestCase({ corrections: undefined });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth._source.hasAiExtraction).toBe(true);
      expect(groundTruth._source.hasCorrections).toBe(false);
      expect(groundTruth._source.correctedFields).toHaveLength(0);
    });

    it('should preserve all AI items', () => {
      const testCase = createTestCase({ corrections: undefined });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items[0]).toEqual({ name: 'Leche', price: 1990, category: undefined });
      expect(groundTruth.items[1]).toEqual({ name: 'Pan', price: 990, category: undefined });
    });
  });

  describe('corrections override aiExtraction fields', () => {
    it('should override merchant when corrected', () => {
      const testCase = createTestCase({
        corrections: {
          merchant: 'JUMBO', // Corrected typo
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.merchant).toBe('JUMBO');
      expect(groundTruth._source.correctedFields).toContain('merchant');
    });

    it('should override date when corrected', () => {
      const testCase = createTestCase({
        corrections: {
          date: '2024-01-16', // Corrected date
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.date).toBe('2024-01-16');
      expect(groundTruth._source.correctedFields).toContain('date');
    });

    it('should override total when corrected', () => {
      const testCase = createTestCase({
        corrections: {
          total: 16990, // Corrected total
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.total).toBe(16990);
      expect(groundTruth._source.correctedFields).toContain('total');
    });

    it('should override category when corrected', () => {
      const testCase = createTestCase({
        corrections: {
          category: 'grocery',
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.category).toBe('grocery');
      expect(groundTruth._source.correctedFields).toContain('category');
    });

    it('should override multiple fields at once', () => {
      const testCase = createTestCase({
        corrections: {
          merchant: 'JUMBO',
          date: '2024-01-16',
          total: 16990,
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.merchant).toBe('JUMBO');
      expect(groundTruth.date).toBe('2024-01-16');
      expect(groundTruth.total).toBe(16990);
      expect(groundTruth._source.correctedFields).toEqual(
        expect.arrayContaining(['merchant', 'date', 'total'])
      );
    });

    it('should keep AI values for non-corrected fields', () => {
      const testCase = createTestCase({
        corrections: {
          merchant: 'JUMBO', // Only merchant corrected
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.merchant).toBe('JUMBO'); // Corrected
      expect(groundTruth.date).toBe('2024-01-15'); // From AI
      expect(groundTruth.total).toBe(15990); // From AI
    });
  });

  describe('item deletion via corrections', () => {
    it('should remove items marked with delete: true', () => {
      const testCase = createTestCase({
        corrections: {
          items: {
            '0': { delete: true }, // Delete first item (Leche)
          },
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items).toHaveLength(1);
      expect(groundTruth.items[0].name).toBe('Pan');
      expect(groundTruth._source.itemsDeleted).toBe(1);
    });

    it('should handle deleting multiple items', () => {
      const testCase = createTestCase({
        corrections: {
          items: {
            '0': { delete: true },
            '1': { delete: true },
          },
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items).toHaveLength(0);
      expect(groundTruth._source.itemsDeleted).toBe(2);
    });

    it('should track deleted items in source', () => {
      const testCase = createTestCase({
        corrections: {
          items: {
            '0': { delete: true },
          },
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth._source.itemsDeleted).toBe(1);
    });
  });

  describe('item modification via corrections', () => {
    it('should modify item name', () => {
      const testCase = createTestCase({
        corrections: {
          items: {
            '0': { name: 'Leche Descremada' }, // Correct name
          },
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items[0].name).toBe('Leche Descremada');
      expect(groundTruth.items[0].price).toBe(1990); // Unchanged
      expect(groundTruth._source.itemsModified).toBe(1);
    });

    it('should modify item price', () => {
      const testCase = createTestCase({
        corrections: {
          items: {
            '0': { price: 2190 }, // Correct price
          },
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items[0].price).toBe(2190);
      expect(groundTruth.items[0].name).toBe('Leche'); // Unchanged
    });

    it('should modify item category', () => {
      const testCase = createTestCase({
        corrections: {
          items: {
            '0': { category: 'dairy' },
          },
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items[0].category).toBe('dairy');
    });

    it('should modify multiple fields on same item', () => {
      const testCase = createTestCase({
        corrections: {
          items: {
            '0': { name: 'Leche Descremada', price: 2190 },
          },
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items[0].name).toBe('Leche Descremada');
      expect(groundTruth.items[0].price).toBe(2190);
      expect(groundTruth._source.itemsModified).toBe(1);
    });
  });

  describe('addItems in corrections', () => {
    it('should add items from addItems array', () => {
      const testCase = createTestCase({
        corrections: {
          addItems: [{ name: 'Queso', price: 3990 }],
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items).toHaveLength(3);
      expect(groundTruth.items[2]).toEqual({
        name: 'Queso',
        price: 3990,
        category: undefined,
      });
      expect(groundTruth._source.itemsAdded).toBe(1);
    });

    it('should add multiple items', () => {
      const testCase = createTestCase({
        corrections: {
          addItems: [
            { name: 'Queso', price: 3990 },
            { name: 'Mantequilla', price: 2990 },
          ],
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items).toHaveLength(4);
      expect(groundTruth._source.itemsAdded).toBe(2);
    });

    it('should add items with category', () => {
      const testCase = createTestCase({
        corrections: {
          addItems: [{ name: 'Queso', price: 3990, category: 'dairy' }],
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items[2].category).toBe('dairy');
    });

    it('should handle combined delete and add', () => {
      const testCase = createTestCase({
        corrections: {
          items: {
            '0': { delete: true }, // Delete Leche
          },
          addItems: [{ name: 'Leche Entera', price: 2190 }], // Add correct item
        },
      });
      const groundTruth = computeGroundTruth(testCase);

      expect(groundTruth.items).toHaveLength(2); // 2 original - 1 deleted + 1 added
      expect(groundTruth.items.map((i) => i.name)).toEqual(['Pan', 'Leche Entera']);
    });
  });

  describe('edge cases', () => {
    it('should throw error when neither aiExtraction nor corrections exist', () => {
      const testCase: TestCaseFile = {
        metadata: {
          testId: 'test-001',
          storeType: 'supermarket',
          difficulty: 'medium',
          region: 'CL',
          source: 'manual-collection',
          addedAt: '2024-01-15',
        },
      } as TestCaseFile;

      expect(() => computeGroundTruth(testCase)).toThrow(
        'Cannot compute ground truth without aiExtraction or corrections'
      );
    });

    it('should handle corrections-only test case', () => {
      const testCase: TestCaseFile = {
        metadata: {
          testId: 'test-001',
          storeType: 'supermarket',
          difficulty: 'medium',
          region: 'CL',
          source: 'manual-collection',
          addedAt: '2024-01-15',
        },
        corrections: {
          merchant: 'JUMBO',
          date: '2024-01-15',
          total: 15990,
          category: 'supermarket',
          addItems: [{ name: 'Item 1', price: 1000 }],
        },
      };

      const groundTruth = computeGroundTruth(testCase);
      expect(groundTruth.merchant).toBe('JUMBO');
      expect(groundTruth._source.hasAiExtraction).toBe(false);
      expect(groundTruth._source.hasCorrections).toBe(true);
    });

    it('should handle empty corrections object', () => {
      const testCase = createTestCase({
        corrections: {},
      });
      const groundTruth = computeGroundTruth(testCase);

      // Should use all AI values
      expect(groundTruth.merchant).toBe('JUMB0');
      expect(groundTruth._source.correctedFields).toHaveLength(0);
    });

    it('should handle empty items array in AI extraction', () => {
      const testCase = createTestCase({
        aiExtraction: {
          merchant: 'JUMBO',
          date: '2024-01-15',
          total: 0,
          category: 'supermarket',
          items: [],
          model: 'gemini-1.5-flash',
          modelVersion: '001',
          extractedAt: '2024-01-15T10:00:00Z',
        },
      });

      const groundTruth = computeGroundTruth(testCase);
      expect(groundTruth.items).toHaveLength(0);
    });
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('hasCorrections', () => {
  it('should return false when no corrections', () => {
    const testCase = createTestCase({ corrections: undefined });
    expect(hasCorrections(testCase)).toBe(false);
  });

  it('should return false when corrections is empty object', () => {
    const testCase = createTestCase({ corrections: {} });
    expect(hasCorrections(testCase)).toBe(false);
  });

  it('should return true when merchant is corrected', () => {
    const testCase = createTestCase({ corrections: { merchant: 'JUMBO' } });
    expect(hasCorrections(testCase)).toBe(true);
  });

  it('should return true when items are corrected', () => {
    const testCase = createTestCase({
      corrections: { items: { '0': { price: 2000 } } },
    });
    expect(hasCorrections(testCase)).toBe(true);
  });

  it('should return true when addItems exist', () => {
    const testCase = createTestCase({
      corrections: { addItems: [{ name: 'Test', price: 100 }] },
    });
    expect(hasCorrections(testCase)).toBe(true);
  });

  it('should return false when items is empty object', () => {
    const testCase = createTestCase({ corrections: { items: {} } });
    expect(hasCorrections(testCase)).toBe(false);
  });

  it('should return false when addItems is empty array', () => {
    const testCase = createTestCase({ corrections: { addItems: [] } });
    expect(hasCorrections(testCase)).toBe(false);
  });
});

describe('summarizeGroundTruth', () => {
  it('should summarize AI-only source', () => {
    const testCase = createTestCase({ corrections: undefined });
    const groundTruth = computeGroundTruth(testCase);
    const summary = summarizeGroundTruth(groundTruth);

    expect(summary).toContain('AI only');
  });

  it('should summarize AI + Corrections source', () => {
    const testCase = createTestCase({ corrections: { merchant: 'JUMBO' } });
    const groundTruth = computeGroundTruth(testCase);
    const summary = summarizeGroundTruth(groundTruth);

    expect(summary).toContain('AI + Corrections');
    expect(summary).toContain('corrected');
    expect(summary).toContain('merchant');
  });

  it('should include item change counts', () => {
    const testCase = createTestCase({
      corrections: {
        items: { '0': { delete: true } },
        addItems: [{ name: 'New', price: 100 }],
      },
    });
    const groundTruth = computeGroundTruth(testCase);
    const summary = summarizeGroundTruth(groundTruth);

    expect(summary).toContain('deleted');
    expect(summary).toContain('added');
  });
});
