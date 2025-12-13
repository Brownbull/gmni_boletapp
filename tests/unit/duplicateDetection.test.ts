/**
 * Unit tests for Duplicate Detection Service
 * Story 9.11: AC #4, #5, #6, #7
 *
 * Updated criteria:
 * - Same date, merchant, amount, city, country
 * - Time within 1 hour proximity
 * - Alias is NOT considered (users may change it)
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
  describe('parseTimeToMinutes', () => {
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

  describe('areTimesWithinProximity', () => {
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

  describe('getBaseGroupKey', () => {
    it('generates key WITHOUT alias (alias should not affect duplicate detection)', () => {
      const tx1 = createTransaction({ id: '1', alias: 'Alias A' });
      const tx2 = createTransaction({ id: '2', alias: 'Alias B' });

      // Same key even with different aliases
      expect(getBaseGroupKey(tx1)).toBe(getBaseGroupKey(tx2));
    });

    it('generates key WITHOUT time (time is checked separately)', () => {
      const tx1 = createTransaction({ id: '1', time: '14:00' });
      const tx2 = createTransaction({ id: '2', time: '16:00' });

      // Same key even with different times
      expect(getBaseGroupKey(tx1)).toBe(getBaseGroupKey(tx2));
    });

    it('generates consistent key from transaction fields', () => {
      const tx = createTransaction({ id: '1' });
      const key = getBaseGroupKey(tx);

      // Key should include: date|merchant|total|city|country
      expect(key).toBe('2025-12-13|test merchant|100|santiago|chile');
    });

    it('normalizes values to lowercase and trimmed', () => {
      const tx = createTransaction({
        id: '1',
        merchant: '  TEST MERCHANT  ',
        city: '  SANTIAGO  ',
        country: '  CHILE  ',
      });
      const key = getBaseGroupKey(tx);

      expect(key).toBe('2025-12-13|test merchant|100|santiago|chile');
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

      expect(key).toBe('2025-12-13|test|50||');
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

    it('detects duplicates with same core fields and time within 1 hour', () => {
      const transactions = [
        createTransaction({ id: '1', time: '14:00' }),
        createTransaction({ id: '2', time: '14:30' }), // Within 1 hour
        createTransaction({ id: '3', merchant: 'Different Store' }),
      ];

      const duplicates = findDuplicates(transactions);

      expect(duplicates.size).toBe(2);
      expect(duplicates.get('1')).toEqual(['2']);
      expect(duplicates.get('2')).toEqual(['1']);
    });

    it('does NOT consider alias in duplicate detection', () => {
      const transactions = [
        createTransaction({ id: '1', alias: 'My Grocery Store', time: '14:00' }),
        createTransaction({ id: '2', alias: 'Different Alias', time: '14:30' }),
      ];

      const duplicates = findDuplicates(transactions);

      // Should still be duplicates despite different aliases
      expect(duplicates.size).toBe(2);
      expect(duplicates.get('1')).toEqual(['2']);
    });

    it('does NOT mark as duplicates if time is more than 1 hour apart', () => {
      const transactions = [
        createTransaction({ id: '1', time: '10:00' }),
        createTransaction({ id: '2', time: '12:00' }), // 2 hours apart
      ];

      const duplicates = findDuplicates(transactions);

      expect(duplicates.size).toBe(0);
    });

    it('marks as duplicates if either time is missing (legacy data)', () => {
      const transactions = [
        createTransaction({ id: '1', time: '14:00' }),
        createTransaction({ id: '2', time: undefined }), // No time
      ];

      const duplicates = findDuplicates(transactions);

      // Should be duplicates because missing time doesn't exclude
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

    it('detects multiple duplicates in a group within time proximity', () => {
      const transactions = [
        createTransaction({ id: '1', time: '14:00' }),
        createTransaction({ id: '2', time: '14:30' }),
        createTransaction({ id: '3', time: '14:45' }),
      ];

      const duplicates = findDuplicates(transactions);

      expect(duplicates.size).toBe(3);
      expect(duplicates.get('1')?.sort()).toEqual(['2', '3']);
      expect(duplicates.get('2')?.sort()).toEqual(['1', '3']);
      expect(duplicates.get('3')?.sort()).toEqual(['1', '2']);
    });

    it('handles edge case: 3 transactions where only 2 are within time proximity', () => {
      const transactions = [
        createTransaction({ id: '1', time: '10:00' }),
        createTransaction({ id: '2', time: '10:30' }), // Within 1 hour of tx1
        createTransaction({ id: '3', time: '12:00' }), // More than 1 hour from both
      ];

      const duplicates = findDuplicates(transactions);

      expect(duplicates.size).toBe(2);
      expect(duplicates.get('1')).toEqual(['2']);
      expect(duplicates.get('2')).toEqual(['1']);
      expect(duplicates.has('3')).toBe(false);
    });

    it('matches based on all core criteria except alias and time (AC #4)', () => {
      const baseTransaction = createTransaction({ id: '1', time: '14:00' });

      // Each of these has ONE different CORE field - should NOT be a duplicate
      const differentDate = createTransaction({ id: '2', date: '2025-12-14', time: '14:00' });
      const differentMerchant = createTransaction({ id: '3', merchant: 'Different', time: '14:00' });
      const differentAmount = createTransaction({ id: '4', total: 999, time: '14:00' });
      const differentCity = createTransaction({ id: '5', city: 'Other City', time: '14:00' });
      const differentCountry = createTransaction({ id: '6', country: 'Other Country', time: '14:00' });

      const transactions = [
        baseTransaction,
        differentDate,
        differentMerchant,
        differentAmount,
        differentCity,
        differentCountry,
      ];

      const duplicates = findDuplicates(transactions);

      // None should be duplicates since each differs by at least one core field
      expect(duplicates.size).toBe(0);
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
  });

  describe('checkForDuplicates', () => {
    it('returns duplicate info for a specific transaction', () => {
      const transactions = [
        createTransaction({ id: '1', time: '14:00' }),
        createTransaction({ id: '2', time: '14:30' }),
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
        createTransaction({ id: '1', time: '14:00' }),
        createTransaction({ id: '2', time: '14:30' }), // Duplicate of 1
        createTransaction({ id: '3', merchant: 'Different' }),
        createTransaction({ id: '4', merchant: 'Another', time: '10:00' }),
        createTransaction({ id: '5', merchant: 'Another', time: '10:30' }), // Duplicate of 4
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
        createTransaction({ id: 'existing-1', merchant: 'Store', time: '14:00' }),
        createTransaction({ id: 'existing-2', merchant: 'Other Store' }),
      ];

      // Add a "new" transaction that duplicates existing-1
      const newTransaction = createTransaction({ id: 'new-1', merchant: 'Store', time: '14:30' });
      const allTransactions = [...existingTransactions, newTransaction];

      const duplicates = findDuplicates(allTransactions);

      // Both existing-1 and new-1 should be marked as duplicates
      expect(duplicates.has('existing-1')).toBe(true);
      expect(duplicates.has('new-1')).toBe(true);
      expect(duplicates.get('existing-1')).toContain('new-1');
      expect(duplicates.get('new-1')).toContain('existing-1');
    });
  });

  describe('TIME_PROXIMITY_MINUTES constant', () => {
    it('should be 60 minutes (1 hour)', () => {
      expect(TIME_PROXIMITY_MINUTES).toBe(60);
    });
  });
});
