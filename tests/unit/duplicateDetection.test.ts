/**
 * Unit tests for Duplicate Detection Service
 * Story 9.11: AC #4, #5, #6, #7
 *
 * Matching criteria:
 * - Same date (required)
 * - Same merchant (required)
 * - Same total amount (required)
 * - Same country (only if both have non-null/non-empty country)
 *
 * NOT checked: time, city, items, alias
 */

import { describe, it, expect } from 'vitest';
import {
  getBaseGroupKey,
  getDuplicateKey,
  findDuplicates,
  checkForDuplicates,
  getDuplicateIds,
  parseTimeToMinutes,
  areTimesWithinProximity,
  areLocationsMatching,
  TIME_PROXIMITY_MINUTES,
} from '../../src/services/duplicateDetectionService';
import { Transaction } from '../../src/types/transaction';

// Helper to create test transactions
const createTransaction = (
  overrides: Partial<Transaction> & { id: string }
): Transaction => ({
  date: '2025-12-13',
  merchant: 'Test Merchant',
  alias: 'Test Alias',
  category: 'Supermarket',
  total: 100,
  items: [],
  city: 'Santiago',
  country: 'Chile',
  time: '14:30',
  ...overrides,
});

describe('duplicateDetectionService', () => {
  // Note: parseTimeToMinutes and areTimesWithinProximity are kept for backwards compatibility
  // but are NO LONGER used in duplicate detection
  describe('parseTimeToMinutes (legacy - not used in duplicate detection)', () => {
    it('parses valid time string', () => {
      expect(parseTimeToMinutes('14:30')).toBe(14 * 60 + 30);
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('23:59')).toBe(23 * 60 + 59);
      expect(parseTimeToMinutes('9:05')).toBe(9 * 60 + 5);
    });

    it('returns null for invalid time strings', () => {
      expect(parseTimeToMinutes(undefined)).toBeNull();
      expect(parseTimeToMinutes('')).toBeNull();
      expect(parseTimeToMinutes('  ')).toBeNull();
      expect(parseTimeToMinutes('invalid')).toBeNull();
      expect(parseTimeToMinutes('25:00')).toBeNull();
      expect(parseTimeToMinutes('12:60')).toBeNull();
      expect(parseTimeToMinutes('12:5')).toBeNull(); // Missing leading zero in minutes
    });
  });

  describe('areTimesWithinProximity (legacy - not used in duplicate detection)', () => {
    it('returns true when times are within 1 hour', () => {
      const time1 = 14 * 60; // 14:00
      const time2 = 14 * 60 + 30; // 14:30
      expect(areTimesWithinProximity(time1, time2)).toBe(true);
    });

    it('returns true when times are exactly 1 hour apart', () => {
      const time1 = 14 * 60; // 14:00
      const time2 = 15 * 60; // 15:00
      expect(areTimesWithinProximity(time1, time2)).toBe(true);
    });

    it('returns false when times are more than 1 hour apart', () => {
      const time1 = 14 * 60; // 14:00
      const time2 = 15 * 60 + 1; // 15:01
      expect(areTimesWithinProximity(time1, time2)).toBe(false);
    });

    it('returns true when either time is null (missing)', () => {
      expect(areTimesWithinProximity(null, 14 * 60)).toBe(true);
      expect(areTimesWithinProximity(14 * 60, null)).toBe(true);
      expect(areTimesWithinProximity(null, null)).toBe(true);
    });
  });

  describe('areLocationsMatching (only checks country)', () => {
    it('returns true when countries match', () => {
      const tx1 = createTransaction({ id: '1', country: 'Chile' });
      const tx2 = createTransaction({ id: '2', country: 'Chile' });
      expect(areLocationsMatching(tx1, tx2)).toBe(true);
    });

    it('returns true when countries match (case insensitive)', () => {
      const tx1 = createTransaction({ id: '1', country: 'CHILE' });
      const tx2 = createTransaction({ id: '2', country: 'chile' });
      expect(areLocationsMatching(tx1, tx2)).toBe(true);
    });

    it('returns false when countries differ (both have values)', () => {
      const tx1 = createTransaction({ id: '1', country: 'Chile' });
      const tx2 = createTransaction({ id: '2', country: 'Argentina' });
      expect(areLocationsMatching(tx1, tx2)).toBe(false);
    });

    it('returns true when cities differ but countries match (city is NOT checked)', () => {
      const tx1 = createTransaction({ id: '1', city: 'Santiago', country: 'Chile' });
      const tx2 = createTransaction({ id: '2', city: 'Valparaiso', country: 'Chile' });
      expect(areLocationsMatching(tx1, tx2)).toBe(true);
    });

    it('returns true when tx1 has country but tx2 does not', () => {
      const tx1 = createTransaction({ id: '1', country: 'Chile' });
      const tx2 = createTransaction({ id: '2', country: '' });
      expect(areLocationsMatching(tx1, tx2)).toBe(true);
    });

    it('returns true when tx2 has country but tx1 does not', () => {
      const tx1 = createTransaction({ id: '1', country: '' });
      const tx2 = createTransaction({ id: '2', country: 'Chile' });
      expect(areLocationsMatching(tx1, tx2)).toBe(true);
    });

    it('returns true when neither has country', () => {
      const tx1 = createTransaction({ id: '1', country: '' });
      const tx2 = createTransaction({ id: '2', country: '' });
      expect(areLocationsMatching(tx1, tx2)).toBe(true);
    });

    it('returns true when neither has any location data', () => {
      const tx1 = createTransaction({ id: '1', city: undefined, country: undefined });
      const tx2 = createTransaction({ id: '2', city: undefined, country: undefined });
      expect(areLocationsMatching(tx1, tx2)).toBe(true);
    });

    it('returns true when one has location and other has none (legacy data)', () => {
      const tx1 = createTransaction({ id: '1', city: 'Villarrica', country: 'Chile' });
      const tx2 = createTransaction({ id: '2', city: undefined, country: undefined });
      expect(areLocationsMatching(tx1, tx2)).toBe(true);
    });
  });

  describe('getBaseGroupKey', () => {
    it('generates key WITHOUT alias (alias should not affect duplicate detection)', () => {
      const tx1 = createTransaction({ id: '1', alias: 'Alias A' });
      const tx2 = createTransaction({ id: '2', alias: 'Alias B' });

      // Same key even with different aliases
      expect(getBaseGroupKey(tx1)).toBe(getBaseGroupKey(tx2));
    });

    it('generates key WITHOUT time (time is NOT checked)', () => {
      const tx1 = createTransaction({ id: '1', time: '14:00' });
      const tx2 = createTransaction({ id: '2', time: '16:00' });

      // Same key even with different times
      expect(getBaseGroupKey(tx1)).toBe(getBaseGroupKey(tx2));
    });

    it('generates key WITHOUT city (city is NOT checked)', () => {
      const tx1 = createTransaction({ id: '1', city: 'Santiago' });
      const tx2 = createTransaction({ id: '2', city: 'Valparaiso' });

      // Same key even with different cities
      expect(getBaseGroupKey(tx1)).toBe(getBaseGroupKey(tx2));
    });

    it('generates consistent key from CORE transaction fields (date, merchant, amount)', () => {
      const tx = createTransaction({ id: '1' });
      const key = getBaseGroupKey(tx);

      // Key should include ONLY: date|merchant|total
      expect(key).toBe('2025-12-13|test merchant|100');
    });

    it('normalizes values to lowercase and trimmed', () => {
      const tx = createTransaction({
        id: '1',
        merchant: '  TEST MERCHANT  ',
        city: '  SANTIAGO  ',
        country: '  CHILE  ',
      });
      const key = getBaseGroupKey(tx);

      // City/country are NOT in the key
      expect(key).toBe('2025-12-13|test merchant|100');
    });

    it('handles missing optional fields gracefully', () => {
      const tx: Transaction = {
        id: '1',
        date: '2025-12-13',
        merchant: 'Test',
        category: 'Other',
        total: 50,
        items: [],
      };
      const key = getBaseGroupKey(tx);

      // Key only has core fields: date|merchant|total
      expect(key).toBe('2025-12-13|test|50');
    });

    it('generates different keys for different core fields', () => {
      const tx1 = createTransaction({ id: '1', total: 100 });
      const tx2 = createTransaction({ id: '2', total: 200 });

      expect(getBaseGroupKey(tx1)).not.toBe(getBaseGroupKey(tx2));
    });
  });

  describe('getDuplicateKey (deprecated)', () => {
    it('is an alias for getBaseGroupKey', () => {
      const tx = createTransaction({ id: '1' });
      expect(getDuplicateKey(tx)).toBe(getBaseGroupKey(tx));
    });
  });

  describe('findDuplicates', () => {
    it('returns empty map when no duplicates exist', () => {
      const transactions = [
        createTransaction({ id: '1', merchant: 'Store A', total: 100 }),
        createTransaction({ id: '2', merchant: 'Store B', total: 200 }),
        createTransaction({ id: '3', merchant: 'Store C', total: 300 }),
      ];

      const duplicates = findDuplicates(transactions);

      expect(duplicates.size).toBe(0);
    });

    it('detects duplicates with same core fields (date, merchant, amount)', () => {
      const transactions = [
        createTransaction({ id: '1' }),
        createTransaction({ id: '2' }), // Same core fields
        createTransaction({ id: '3', merchant: 'Different Store' }),
      ];

      const duplicates = findDuplicates(transactions);

      expect(duplicates.size).toBe(2);
      expect(duplicates.get('1')).toEqual(['2']);
      expect(duplicates.get('2')).toEqual(['1']);
    });

    it('detects duplicates regardless of time difference (time is NOT checked)', () => {
      const transactions = [
        createTransaction({ id: '1', time: '10:00' }),
        createTransaction({ id: '2', time: '18:00' }), // 8 hours apart - still duplicate
      ];

      const duplicates = findDuplicates(transactions);

      // Should still be duplicates - time is NOT checked
      expect(duplicates.size).toBe(2);
      expect(duplicates.get('1')).toEqual(['2']);
    });

    it('detects duplicates regardless of city difference (city is NOT checked)', () => {
      const transactions = [
        createTransaction({ id: '1', city: 'Villarrica', country: 'Chile' }),
        createTransaction({ id: '2', city: 'Temuco', country: 'Chile' }), // Different city
      ];

      const duplicates = findDuplicates(transactions);

      // Should still be duplicates - city is NOT checked, country matches
      expect(duplicates.size).toBe(2);
      expect(duplicates.get('1')).toEqual(['2']);
    });

    it('does NOT consider alias in duplicate detection', () => {
      const transactions = [
        createTransaction({ id: '1', alias: 'My Grocery Store' }),
        createTransaction({ id: '2', alias: 'Different Alias' }),
      ];

      const duplicates = findDuplicates(transactions);

      // Should still be duplicates despite different aliases
      expect(duplicates.size).toBe(2);
      expect(duplicates.get('1')).toEqual(['2']);
    });

    it('marks as duplicates if either time is missing (legacy data)', () => {
      const transactions = [
        createTransaction({ id: '1', time: '14:00' }),
        createTransaction({ id: '2', time: undefined }), // No time
      ];

      const duplicates = findDuplicates(transactions);

      // Should be duplicates - time is NOT checked
      expect(duplicates.size).toBe(2);
    });

    it('marks as duplicates if both times are missing', () => {
      const transactions = [
        createTransaction({ id: '1', time: undefined }),
        createTransaction({ id: '2', time: undefined }),
      ];

      const duplicates = findDuplicates(transactions);

      expect(duplicates.size).toBe(2);
    });

    it('detects multiple duplicates in a group', () => {
      const transactions = [
        createTransaction({ id: '1' }),
        createTransaction({ id: '2' }),
        createTransaction({ id: '3' }),
      ];

      const duplicates = findDuplicates(transactions);

      expect(duplicates.size).toBe(3);
      expect(duplicates.get('1')?.sort()).toEqual(['2', '3']);
      expect(duplicates.get('2')?.sort()).toEqual(['1', '3']);
      expect(duplicates.get('3')?.sort()).toEqual(['1', '2']);
    });

    it('matches based on CORE criteria (date, merchant, amount) - AC #4', () => {
      const baseTransaction = createTransaction({ id: '1' });

      // Each of these has ONE different CORE field - should NOT be a duplicate
      const differentDate = createTransaction({ id: '2', date: '2025-12-14' });
      const differentMerchant = createTransaction({ id: '3', merchant: 'Different' });
      const differentAmount = createTransaction({ id: '4', total: 999 });

      const transactions = [
        baseTransaction,
        differentDate,
        differentMerchant,
        differentAmount,
      ];

      const duplicates = findDuplicates(transactions);

      // None should be duplicates since each differs by at least one CORE field
      expect(duplicates.size).toBe(0);
    });

    it('does NOT mark as duplicates if BOTH have country and countries differ', () => {
      const transactions = [
        createTransaction({ id: '1', country: 'Chile' }),
        createTransaction({ id: '2', country: 'Argentina' }),
      ];

      const duplicates = findDuplicates(transactions);

      // NOT duplicates because both have country and they differ
      expect(duplicates.size).toBe(0);
    });

    it('marks as duplicates if one has country but other does not (legacy data)', () => {
      const transactions = [
        createTransaction({ id: '1', city: 'Villarrica', country: 'Chile' }),
        createTransaction({ id: '2', city: '', country: '' }),
      ];

      const duplicates = findDuplicates(transactions);

      // Should be duplicates because missing country doesn't exclude
      expect(duplicates.size).toBe(2);
      expect(duplicates.get('1')).toEqual(['2']);
      expect(duplicates.get('2')).toEqual(['1']);
    });

    it('marks as duplicates if both have no country', () => {
      const transactions = [
        createTransaction({ id: '1', city: undefined, country: undefined }),
        createTransaction({ id: '2', city: undefined, country: undefined }),
      ];

      const duplicates = findDuplicates(transactions);

      // Should be duplicates - missing country is skipped
      expect(duplicates.size).toBe(2);
    });

    it('marks as duplicates when time is null but country matches', () => {
      const transactions = [
        createTransaction({ id: '1', time: undefined, city: 'Villarrica', country: 'Chile' }),
        createTransaction({ id: '2', time: undefined, city: 'Villarrica', country: 'Chile' }),
      ];

      const duplicates = findDuplicates(transactions);

      expect(duplicates.size).toBe(2);
      expect(duplicates.get('1')).toEqual(['2']);
    });

    it('marks as duplicates when time is null and country is also null/empty (legacy data)', () => {
      const transactions = [
        createTransaction({ id: '1', time: undefined, city: '', country: '' }),
        createTransaction({ id: '2', time: undefined, city: '', country: '' }),
      ];

      const duplicates = findDuplicates(transactions);

      expect(duplicates.size).toBe(2);
    });

    it('handles empty transaction list', () => {
      const duplicates = findDuplicates([]);
      expect(duplicates.size).toBe(0);
    });

    it('handles single transaction', () => {
      const duplicates = findDuplicates([createTransaction({ id: '1' })]);
      expect(duplicates.size).toBe(0);
    });

    it('skips transactions without ID', () => {
      const transactions = [
        { ...createTransaction({ id: '1' }), id: undefined } as any,
        createTransaction({ id: '2' }),
      ];

      const duplicates = findDuplicates(transactions);
      expect(duplicates.size).toBe(0);
    });

    it('real-world case: same receipt with different city OCR (should be duplicate)', () => {
      // This is the exact case from production: H&M receipt scanned twice
      // Same date, merchant, amount - different city due to OCR error
      const transactions = [
        createTransaction({
          id: '1',
          merchant: 'H&M',
          date: '2025-12-15',
          total: 108930,
          city: 'Villarrica',
          country: 'Chile',
        }),
        createTransaction({
          id: '2',
          merchant: 'H&M',
          date: '2025-12-15',
          total: 108930,
          city: 'Temuco', // Different city - OCR error
          country: 'Chile',
        }),
      ];

      const duplicates = findDuplicates(transactions);

      // MUST be detected as duplicates - city is NOT checked
      expect(duplicates.size).toBe(2);
      expect(duplicates.get('1')).toEqual(['2']);
      expect(duplicates.get('2')).toEqual(['1']);
    });
  });

  describe('checkForDuplicates', () => {
    it('returns duplicate info for a specific transaction', () => {
      const transactions = [
        createTransaction({ id: '1' }),
        createTransaction({ id: '2' }),
        createTransaction({ id: '3', merchant: 'Different' }),
      ];

      const result = checkForDuplicates(transactions[0], transactions);

      expect(result.transactionId).toBe('1');
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateIds).toEqual(['2']);
    });

    it('returns false when no duplicates exist', () => {
      const transactions = [
        createTransaction({ id: '1', merchant: 'Store A' }),
        createTransaction({ id: '2', merchant: 'Store B' }),
      ];

      const result = checkForDuplicates(transactions[0], transactions);

      expect(result.isDuplicate).toBe(false);
      expect(result.duplicateIds).toEqual([]);
    });
  });

  describe('getDuplicateIds', () => {
    it('returns Set of all transaction IDs that have duplicates', () => {
      const transactions = [
        createTransaction({ id: '1' }),
        createTransaction({ id: '2' }), // Duplicate of 1
        createTransaction({ id: '3', merchant: 'Different' }),
        createTransaction({ id: '4', merchant: 'Another' }),
        createTransaction({ id: '5', merchant: 'Another' }), // Duplicate of 4
      ];

      const duplicateIds = getDuplicateIds(transactions);

      expect(duplicateIds.size).toBe(4);
      expect(duplicateIds.has('1')).toBe(true);
      expect(duplicateIds.has('2')).toBe(true);
      expect(duplicateIds.has('3')).toBe(false);
      expect(duplicateIds.has('4')).toBe(true);
      expect(duplicateIds.has('5')).toBe(true);
    });

    it('returns empty Set when no duplicates exist', () => {
      const transactions = [
        createTransaction({ id: '1', total: 100 }),
        createTransaction({ id: '2', total: 200 }),
        createTransaction({ id: '3', total: 300 }),
      ];

      const duplicateIds = getDuplicateIds(transactions);

      expect(duplicateIds.size).toBe(0);
    });
  });

  describe('AC #7: Works for both new and existing transactions', () => {
    it('detects duplicates regardless of order added', () => {
      // Simulate adding a new transaction that duplicates an existing one
      const existingTransactions = [
        createTransaction({ id: 'existing-1', merchant: 'Store' }),
        createTransaction({ id: 'existing-2', merchant: 'Other Store' }),
      ];

      // Add a "new" transaction that duplicates existing-1
      const newTransaction = createTransaction({ id: 'new-1', merchant: 'Store' });
      const allTransactions = [...existingTransactions, newTransaction];

      const duplicates = findDuplicates(allTransactions);

      // Both existing-1 and new-1 should be marked as duplicates
      expect(duplicates.has('existing-1')).toBe(true);
      expect(duplicates.has('new-1')).toBe(true);
      expect(duplicates.get('existing-1')).toContain('new-1');
      expect(duplicates.get('new-1')).toContain('existing-1');
    });
  });

  describe('TIME_PROXIMITY_MINUTES constant (legacy)', () => {
    it('should be 60 minutes (1 hour) - kept for backwards compatibility', () => {
      expect(TIME_PROXIMITY_MINUTES).toBe(60);
    });
  });
});
