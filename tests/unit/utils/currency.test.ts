/**
 * Tests for currency formatting utility
 *
 * Story 14.34: Quick Save Currency Formatting Fix
 * Validates that formatCurrency correctly handles:
 * - Currencies with cents (USD, EUR, GBP) - divides by 100
 * - Currencies without cents (CLP, JPY, COP) - uses as-is
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../../../src/utils/currency';

describe('formatCurrency', () => {
  describe('currencies with cents (usesCents: true)', () => {
    it('should format USD amounts by dividing by 100', () => {
      // 1899 cents = $18.99
      expect(formatCurrency(1899, 'USD')).toBe('$18.99');
    });

    it('should format EUR amounts by dividing by 100', () => {
      // 2550 cents = €25.50
      expect(formatCurrency(2550, 'EUR')).toBe('€25.50');
    });

    it('should format GBP amounts by dividing by 100', () => {
      // 1500 cents = £15.00
      expect(formatCurrency(1500, 'GBP')).toBe('£15.00');
    });

    it('should handle zero amounts', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });

    it('should handle large amounts', () => {
      // 123456 cents = $1,234.56
      expect(formatCurrency(123456, 'USD')).toBe('$1,234.56');
    });

    it('should handle single cent', () => {
      expect(formatCurrency(1, 'USD')).toBe('$0.01');
    });
  });

  describe('currencies without cents (usesCents: false)', () => {
    it('should format CLP amounts without dividing', () => {
      // CLP doesn't use cents - 15990 = $15.990
      expect(formatCurrency(15990, 'CLP')).toBe('$15.990');
    });

    it('should format JPY amounts without dividing', () => {
      // JPY doesn't use cents - 1500 = ¥1,500
      expect(formatCurrency(1500, 'JPY')).toBe('¥1,500');
    });

    it('should format COP amounts without dividing', () => {
      // COP doesn't use cents - 50000 = $50.000 (Colombian format)
      const result = formatCurrency(50000, 'COP');
      // Check that it contains 50,000 or 50.000 (locale dependent)
      expect(result).toMatch(/50[,.]000/);
    });

    it('should handle zero amounts for CLP', () => {
      expect(formatCurrency(0, 'CLP')).toBe('$0');
    });
  });

  describe('edge cases', () => {
    it('should handle NaN as zero', () => {
      expect(formatCurrency(NaN, 'USD')).toBe('$0.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-1000, 'USD')).toBe('-$10.00');
    });
  });

  describe('Story 14.34: QuickSaveCard foreign currency scenario', () => {
    /**
     * This is the exact scenario from the bug:
     * 1. User scans a USD receipt abroad
     * 2. AI detects USD and returns total: 1899 (cents)
     * 3. QuickSaveCard displays with formatCurrency(1899, 'USD')
     * 4. Expected: "$18.99", Not: "$1,899"
     */
    it('should correctly format foreign receipt total (USD)', () => {
      // Simulates AI returning 1899 cents for a $18.99 transaction
      const aiReturnedTotal = 1899;
      const detectedCurrency = 'USD';

      const formatted = formatCurrency(aiReturnedTotal, detectedCurrency);

      expect(formatted).toBe('$18.99');
    });

    it('should correctly format GBP receipt total', () => {
      // Simulates AI returning 4250 pence for a £42.50 transaction
      const aiReturnedTotal = 4250;
      const detectedCurrency = 'GBP';

      const formatted = formatCurrency(aiReturnedTotal, detectedCurrency);

      expect(formatted).toBe('£42.50');
    });

    it('should correctly format EUR receipt total', () => {
      // Simulates AI returning 9999 cents for a €99.99 transaction
      const aiReturnedTotal = 9999;
      const detectedCurrency = 'EUR';

      const formatted = formatCurrency(aiReturnedTotal, detectedCurrency);

      expect(formatted).toBe('€99.99');
    });
  });
});
