/**
 * Unit tests for processScan utility functions
 *
 * Story 14e-8a: Pure utilities extraction
 * Tests cover all exported pure functions from utils.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseLocationResult,
  normalizeItems,
  validateScanDate,
  buildInitialTransaction,
  hasValidTotal,
  hasItems,
  getSafeDate,
  parseStrictNumber,
} from '../../../../../../src/features/scan/handlers/processScan/utils';
import type {
  ScanResult,
  LocationDefaults,
  BuildTransactionConfig,
  CityValidator,
  TransactionItem,
} from '../../../../../../src/features/scan/handlers/processScan/types';

describe('processScan utilities', () => {
  describe('getSafeDate (re-exported)', () => {
    it('should be re-exported from utils/validation', () => {
      expect(getSafeDate).toBeDefined();
      expect(typeof getSafeDate).toBe('function');
    });

    it('should return today for undefined input', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(getSafeDate(undefined)).toBe(today);
    });

    it('should return valid date string unchanged', () => {
      expect(getSafeDate('2026-01-25')).toBe('2026-01-25');
    });
  });

  describe('parseStrictNumber (re-exported)', () => {
    it('should be re-exported from utils/validation', () => {
      expect(parseStrictNumber).toBeDefined();
      expect(typeof parseStrictNumber).toBe('function');
    });

    it('should parse numeric strings', () => {
      expect(parseStrictNumber('15000')).toBe(15000);
    });

    it('should return 0 for non-numeric input', () => {
      expect(parseStrictNumber('abc')).toBe(0);
    });
  });

  describe('parseLocationResult', () => {
    const mockGetCitiesForCountry: CityValidator = (country: string) => {
      const cityMap: Record<string, string[]> = {
        Chile: ['Santiago', 'Valparaíso', 'Concepción'],
        Argentina: ['Buenos Aires', 'Córdoba', 'Mendoza'],
        USA: ['New York', 'Los Angeles', 'Chicago'],
      };
      return cityMap[country] || [];
    };

    const defaultDefaults: LocationDefaults = {
      defaultCountry: 'Chile',
      defaultCity: 'Santiago',
    };

    it('should return scanned location when city is valid', () => {
      const result = parseLocationResult(
        { country: 'Chile', city: 'Santiago' },
        defaultDefaults,
        mockGetCitiesForCountry
      );
      expect(result).toEqual({ country: 'Chile', city: 'Santiago' });
    });

    it('should match city case-insensitively', () => {
      const result = parseLocationResult(
        { country: 'Chile', city: 'SANTIAGO' },
        defaultDefaults,
        mockGetCitiesForCountry
      );
      expect(result).toEqual({ country: 'Chile', city: 'Santiago' });
    });

    it('should use default city when scanned city is invalid but country matches default', () => {
      // When country matches default and city is invalid, it falls back to default city
      const result = parseLocationResult(
        { country: 'Chile', city: 'InvalidCity' },
        defaultDefaults,
        mockGetCitiesForCountry
      );
      expect(result).toEqual({ country: 'Chile', city: 'Santiago' });
    });

    it('should clear city if not in valid list and country differs from default', () => {
      // When country differs from default and city is invalid, city stays empty
      const result = parseLocationResult(
        { country: 'Argentina', city: 'InvalidCity' },
        defaultDefaults,
        mockGetCitiesForCountry
      );
      expect(result).toEqual({ country: 'Argentina', city: '' });
    });

    it('should use defaults when no country detected', () => {
      const result = parseLocationResult(
        { country: '', city: '' },
        defaultDefaults,
        mockGetCitiesForCountry
      );
      expect(result).toEqual({ country: 'Chile', city: 'Santiago' });
    });

    it('should use default city when same country but no city detected', () => {
      const result = parseLocationResult(
        { country: 'Chile', city: '' },
        defaultDefaults,
        mockGetCitiesForCountry
      );
      expect(result).toEqual({ country: 'Chile', city: 'Santiago' });
    });

    it('should not use default city for different country', () => {
      const result = parseLocationResult(
        { country: 'Argentina', city: '' },
        defaultDefaults,
        mockGetCitiesForCountry
      );
      expect(result).toEqual({ country: 'Argentina', city: '' });
    });

    it('should handle empty defaults', () => {
      const result = parseLocationResult(
        { country: '', city: '' },
        { defaultCountry: '', defaultCity: '' },
        mockGetCitiesForCountry
      );
      expect(result).toEqual({ country: '', city: '' });
    });

    it('should handle undefined scan values', () => {
      const result = parseLocationResult(
        { country: undefined, city: undefined } as any,
        defaultDefaults,
        mockGetCitiesForCountry
      );
      expect(result).toEqual({ country: 'Chile', city: 'Santiago' });
    });
  });

  describe('normalizeItems', () => {
    it('should return empty array for undefined input', () => {
      expect(normalizeItems(undefined)).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      expect(normalizeItems([])).toEqual([]);
    });

    it('should normalize items with quantity field', () => {
      const items = [{ name: 'Item 1', price: 100, quantity: 2 }];
      const result = normalizeItems(items);
      expect(result).toEqual([
        { name: 'Item 1', price: 100, qty: 2, category: undefined, subcategory: undefined },
      ]);
    });

    it('should normalize items with qty field', () => {
      const items = [{ name: 'Item 1', price: 100, qty: 3 }];
      const result = normalizeItems(items);
      expect(result).toEqual([
        { name: 'Item 1', price: 100, qty: 3, category: undefined, subcategory: undefined },
      ]);
    });

    it('should default qty to 1 when not provided', () => {
      const items = [{ name: 'Item 1', price: 100 }];
      const result = normalizeItems(items);
      expect(result).toEqual([
        { name: 'Item 1', price: 100, qty: 1, category: undefined, subcategory: undefined },
      ]);
    });

    it('should prefer quantity over qty when both present', () => {
      const items = [{ name: 'Item 1', price: 100, quantity: 5, qty: 3 }];
      const result = normalizeItems(items);
      expect(result[0].qty).toBe(5);
    });

    it('should preserve category and subcategory', () => {
      const items = [{ name: 'Item 1', price: 100, category: 'Food', subcategory: 'Dairy' }];
      const result = normalizeItems(items);
      expect(result).toEqual([
        { name: 'Item 1', price: 100, qty: 1, category: 'Food', subcategory: 'Dairy' },
      ]);
    });

    it('should normalize multiple items', () => {
      const items = [
        { name: 'Item 1', price: 100 },
        { name: 'Item 2', price: 200, quantity: 2 },
        { name: 'Item 3', price: 300, qty: 3 },
      ];
      const result = normalizeItems(items);
      expect(result.length).toBe(3);
      expect(result[0].qty).toBe(1);
      expect(result[1].qty).toBe(2);
      expect(result[2].qty).toBe(3);
    });
  });

  describe('validateScanDate', () => {
    it('should return today for undefined input', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(validateScanDate(undefined)).toBe(today);
    });

    it('should return valid date unchanged', () => {
      expect(validateScanDate('2025-12-15')).toBe('2025-12-15');
    });

    it('should clamp future year to today', () => {
      const futureYear = new Date().getFullYear() + 1;
      const futureDate = `${futureYear}-06-15`;
      const today = new Date().toISOString().split('T')[0];
      expect(validateScanDate(futureDate)).toBe(today);
    });

    it('should allow current year dates', () => {
      const currentYear = new Date().getFullYear();
      const currentYearDate = `${currentYear}-01-15`;
      expect(validateScanDate(currentYearDate)).toBe(currentYearDate);
    });

    it('should allow past year dates', () => {
      expect(validateScanDate('2020-06-15')).toBe('2020-06-15');
    });
  });

  describe('buildInitialTransaction', () => {
    const mockScanResult: ScanResult = {
      merchant: 'Test Store',
      date: '2026-01-25',
      total: 15000,
      category: 'Supermarket',
      items: [],
      imageUrls: ['https://storage.test/image1.jpg'],
      thumbnailUrl: 'https://storage.test/thumb1.jpg',
      time: '14:30',
      country: 'Chile',
      city: 'Santiago',
      currency: 'CLP',
      receiptType: 'receipt',
      promptVersion: 'v3',
      merchantSource: 'scan',
    };

    const mockParsedItems: TransactionItem[] = [
      { name: 'Item 1', price: 5000, qty: 1 },
      { name: 'Item 2', price: 10000, qty: 1 },
    ];

    const mockLocation = { country: 'Chile', city: 'Santiago' };
    const personalConfig: BuildTransactionConfig = {
      viewMode: 'personal',
      activeGroupId: undefined,
      language: 'es',
    };

    it('should build transaction with all fields', () => {
      const result = buildInitialTransaction(
        mockScanResult,
        mockParsedItems,
        mockLocation,
        15000,
        '2026-01-25',
        personalConfig
      );

      expect(result.merchant).toBe('Test Store');
      expect(result.alias).toBe('Test Store');
      expect(result.date).toBe('2026-01-25');
      expect(result.total).toBe(15000);
      expect(result.category).toBe('Supermarket');
      expect(result.items).toEqual(mockParsedItems);
      expect(result.imageUrls).toEqual(['https://storage.test/image1.jpg']);
      expect(result.thumbnailUrl).toBe('https://storage.test/thumb1.jpg');
      expect(result.time).toBe('14:30');
      expect(result.country).toBe('Chile');
      expect(result.city).toBe('Santiago');
      expect(result.currency).toBe('CLP');
      expect(result.receiptType).toBe('receipt');
      expect(result.promptVersion).toBe('v3');
      expect(result.merchantSource).toBe('scan');
    });

    it('should use "Unknown" for missing merchant', () => {
      const scanResultNoMerchant = { ...mockScanResult, merchant: undefined };
      const result = buildInitialTransaction(
        scanResultNoMerchant,
        mockParsedItems,
        mockLocation,
        15000,
        '2026-01-25',
        personalConfig
      );
      expect(result.merchant).toBe('Unknown');
      expect(result.alias).toBe('Unknown');
    });

    it('should use "Other" for missing category', () => {
      const scanResultNoCategory = { ...mockScanResult, category: undefined };
      const result = buildInitialTransaction(
        scanResultNoCategory,
        mockParsedItems,
        mockLocation,
        15000,
        '2026-01-25',
        personalConfig
      );
      expect(result.category).toBe('Other');
    });

    it('should not include sharedGroupIds in personal mode', () => {
      const result = buildInitialTransaction(
        mockScanResult,
        mockParsedItems,
        mockLocation,
        15000,
        '2026-01-25',
        personalConfig
      );
      expect(result.sharedGroupIds).toBeUndefined();
    });

    it('should include sharedGroupIds in group mode', () => {
      const groupConfig: BuildTransactionConfig = {
        viewMode: 'group',
        activeGroupId: 'group-123',
        language: 'es',
      };
      const result = buildInitialTransaction(
        mockScanResult,
        mockParsedItems,
        mockLocation,
        15000,
        '2026-01-25',
        groupConfig
      );
      expect(result.sharedGroupIds).toEqual(['group-123']);
    });

    it('should not include sharedGroupIds in group mode without activeGroupId', () => {
      const groupConfigNoId: BuildTransactionConfig = {
        viewMode: 'group',
        activeGroupId: undefined,
        language: 'es',
      };
      const result = buildInitialTransaction(
        mockScanResult,
        mockParsedItems,
        mockLocation,
        15000,
        '2026-01-25',
        groupConfigNoId
      );
      expect(result.sharedGroupIds).toBeUndefined();
    });

    it('should use provided location over scan result location', () => {
      const customLocation = { country: 'Argentina', city: 'Buenos Aires' };
      const result = buildInitialTransaction(
        mockScanResult,
        mockParsedItems,
        customLocation,
        15000,
        '2026-01-25',
        personalConfig
      );
      expect(result.country).toBe('Argentina');
      expect(result.city).toBe('Buenos Aires');
    });

    it('should use provided total and date over scan result', () => {
      const result = buildInitialTransaction(
        mockScanResult,
        mockParsedItems,
        mockLocation,
        99999,
        '2020-01-01',
        personalConfig
      );
      expect(result.total).toBe(99999);
      expect(result.date).toBe('2020-01-01');
    });
  });

  describe('hasValidTotal', () => {
    it('should return true for positive numbers', () => {
      expect(hasValidTotal(100)).toBe(true);
      expect(hasValidTotal(0.01)).toBe(true);
      expect(hasValidTotal(999999)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(hasValidTotal(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(hasValidTotal(-100)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasValidTotal(undefined)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(hasValidTotal(NaN)).toBe(false);
    });
  });

  describe('hasItems', () => {
    it('should return true for non-empty arrays', () => {
      expect(hasItems([{ name: 'Item', price: 100 }])).toBe(true);
    });

    it('should return false for empty arrays', () => {
      expect(hasItems([])).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasItems(undefined)).toBe(false);
    });

    it('should return false for null', () => {
      expect(hasItems(null as any)).toBe(false);
    });
  });
});
