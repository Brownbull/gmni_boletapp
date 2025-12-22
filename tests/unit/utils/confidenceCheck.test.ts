/**
 * Tests for confidenceCheck utility
 *
 * Story 11.2: Quick Save Card Component
 * Tests confidence calculation and Quick Save eligibility determination.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateConfidence,
  shouldShowQuickSave,
  getConfidenceBreakdown,
  QUICK_SAVE_CONFIDENCE_THRESHOLD,
} from '../../../src/utils/confidenceCheck';
import { Transaction } from '../../../src/types/transaction';

// Helper to create test transactions
function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    merchant: 'Test Store',
    date: '2024-01-15',
    total: 25000,
    category: 'Supermarket',
    items: [{ name: 'Test Item', price: 5000, qty: 1 }],
    ...overrides,
  };
}

describe('confidenceCheck', () => {
  describe('calculateConfidence', () => {
    it('returns 1.0 (100%) for a complete transaction', () => {
      const transaction = createTransaction();
      const confidence = calculateConfidence(transaction);
      expect(confidence).toBe(1.0);
    });

    it('returns 0 for empty transaction', () => {
      const transaction = createTransaction({
        merchant: '',
        date: '',
        total: 0,
        category: 'Other',
        items: [],
      });
      const confidence = calculateConfidence(transaction);
      expect(confidence).toBe(0);
    });

    it('reduces score when merchant is missing', () => {
      const full = createTransaction();
      const noMerchant = createTransaction({ merchant: '' });

      expect(calculateConfidence(noMerchant)).toBeLessThan(calculateConfidence(full));
    });

    it('reduces score when total is 0', () => {
      const full = createTransaction();
      const noTotal = createTransaction({ total: 0 });

      expect(calculateConfidence(noTotal)).toBeLessThan(calculateConfidence(full));
    });

    it('reduces score when date is invalid', () => {
      const full = createTransaction();
      const noDate = createTransaction({ date: '' });

      expect(calculateConfidence(noDate)).toBeLessThan(calculateConfidence(full));
    });

    it('reduces score when category is "Other"', () => {
      const full = createTransaction();
      const otherCategory = createTransaction({ category: 'Other' });

      expect(calculateConfidence(otherCategory)).toBeLessThan(calculateConfidence(full));
    });

    it('reduces score when items are empty', () => {
      const full = createTransaction();
      const noItems = createTransaction({ items: [] });

      expect(calculateConfidence(noItems)).toBeLessThan(calculateConfidence(full));
    });

    it('considers item with name but no price as invalid', () => {
      const noPrice = createTransaction({
        items: [{ name: 'Test', price: -1, qty: 1 }],
      });
      // Negative prices should not count
      const breakdown = getConfidenceBreakdown(noPrice);
      expect(breakdown.items).toBe(false);
    });

    it('considers item with 0 price as valid', () => {
      const zeroPrice = createTransaction({
        items: [{ name: 'Free Sample', price: 0, qty: 1 }],
      });
      const breakdown = getConfidenceBreakdown(zeroPrice);
      expect(breakdown.items).toBe(true);
    });

    it('returns score between 0 and 1', () => {
      const testCases = [
        createTransaction(),
        createTransaction({ merchant: '' }),
        createTransaction({ total: 0 }),
        createTransaction({ items: [] }),
        createTransaction({ merchant: '', total: 0, items: [] }),
      ];

      testCases.forEach((tx) => {
        const confidence = calculateConfidence(tx);
        expect(confidence).toBeGreaterThanOrEqual(0);
        expect(confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('shouldShowQuickSave', () => {
    it('returns true for high-confidence transaction', () => {
      const transaction = createTransaction();
      expect(shouldShowQuickSave(transaction)).toBe(true);
    });

    it('returns false when merchant is missing', () => {
      const transaction = createTransaction({ merchant: '' });
      expect(shouldShowQuickSave(transaction)).toBe(false);
    });

    it('returns false when total is 0', () => {
      const transaction = createTransaction({ total: 0 });
      expect(shouldShowQuickSave(transaction)).toBe(false);
    });

    it('returns false when total is negative', () => {
      const transaction = createTransaction({ total: -100 });
      expect(shouldShowQuickSave(transaction)).toBe(false);
    });

    it('returns false for low-confidence transaction', () => {
      // Missing date, category is Other, no items
      const transaction = createTransaction({
        date: '',
        category: 'Other',
        items: [],
      });
      expect(shouldShowQuickSave(transaction)).toBe(false);
    });

    it('respects the 85% threshold', () => {
      expect(QUICK_SAVE_CONFIDENCE_THRESHOLD).toBe(0.85);
    });
  });

  describe('getConfidenceBreakdown', () => {
    it('returns detailed breakdown for complete transaction', () => {
      const transaction = createTransaction();
      const breakdown = getConfidenceBreakdown(transaction);

      expect(breakdown.merchant).toBe(true);
      expect(breakdown.total).toBe(true);
      expect(breakdown.date).toBe(true);
      expect(breakdown.category).toBe(true);
      expect(breakdown.items).toBe(true);
      expect(breakdown.score).toBe(1.0);
      expect(breakdown.meetsThreshold).toBe(true);
    });

    it('identifies missing fields', () => {
      const transaction = createTransaction({
        merchant: '',
        category: 'Other',
      });
      const breakdown = getConfidenceBreakdown(transaction);

      expect(breakdown.merchant).toBe(false);
      expect(breakdown.category).toBe(false);
      expect(breakdown.total).toBe(true);
      expect(breakdown.date).toBe(true);
    });

    it('correctly calculates meetsThreshold', () => {
      const high = createTransaction();
      const low = createTransaction({
        date: '',
        category: 'Other',
        items: [],
      });

      expect(getConfidenceBreakdown(high).meetsThreshold).toBe(true);
      expect(getConfidenceBreakdown(low).meetsThreshold).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles whitespace-only merchant as empty', () => {
      const transaction = createTransaction({ merchant: '   ' });
      expect(shouldShowQuickSave(transaction)).toBe(false);
    });

    it('handles merchant with whitespace as valid', () => {
      const transaction = createTransaction({ merchant: '  Store Name  ' });
      expect(shouldShowQuickSave(transaction)).toBe(true);
    });

    it('handles invalid date string', () => {
      const transaction = createTransaction({ date: 'not-a-date' });
      const breakdown = getConfidenceBreakdown(transaction);
      expect(breakdown.date).toBe(false);
    });

    it('handles item with empty name as invalid', () => {
      const transaction = createTransaction({
        items: [{ name: '', price: 100, qty: 1 }],
      });
      const breakdown = getConfidenceBreakdown(transaction);
      expect(breakdown.items).toBe(false);
    });

    it('handles item with whitespace-only name as invalid', () => {
      const transaction = createTransaction({
        items: [{ name: '   ', price: 100, qty: 1 }],
      });
      const breakdown = getConfidenceBreakdown(transaction);
      expect(breakdown.items).toBe(false);
    });
  });
});
