/**
 * Unit tests for Transaction Normalizer Utility
 * Story 9.11: AC #1, #2
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeTransaction,
  normalizeTransactions,
  DEFAULT_TIME,
  UserDefaults,
} from '../../src/utils/transactionNormalizer';
import { Transaction } from '../../src/types/transaction';

// Helper to create test transactions
const createTransaction = (
  overrides?: Partial<Transaction>
): Transaction => ({
  date: '2025-12-13',
  merchant: 'Test Merchant',
  category: 'Supermarket',
  total: 100,
  items: [],
  ...overrides,
});

const defaultUserSettings: UserDefaults = {
  city: 'Santiago',
  country: 'Chile',
};

describe('transactionNormalizer', () => {
  describe('DEFAULT_TIME constant', () => {
    it('should be 04:04 as the sentinel value', () => {
      expect(DEFAULT_TIME).toBe('04:04');
    });
  });

  describe('normalizeTransaction', () => {
    describe('AC #1: Legacy transactions show default time', () => {
      it('fills in default time when time is not set', () => {
        const tx = createTransaction({ time: undefined });
        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized.time).toBe(DEFAULT_TIME);
      });

      it('fills in default time when time is empty string', () => {
        const tx = createTransaction({ time: '' });
        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized.time).toBe(DEFAULT_TIME);
      });

      it('preserves existing time when set', () => {
        const tx = createTransaction({ time: '15:30' });
        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized.time).toBe('15:30');
      });

      it('preserves time even when it equals DEFAULT_TIME', () => {
        const tx = createTransaction({ time: DEFAULT_TIME });
        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized.time).toBe(DEFAULT_TIME);
      });
    });

    describe('AC #2: Legacy transactions show default city/country from Settings', () => {
      it('fills in default city when city is not set', () => {
        const tx = createTransaction({ city: undefined });
        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized.city).toBe('Santiago');
      });

      it('fills in default country when country is not set', () => {
        const tx = createTransaction({ country: undefined });
        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized.country).toBe('Chile');
      });

      it('fills in both city and country when not set', () => {
        const tx = createTransaction({ city: undefined, country: undefined });
        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized.city).toBe('Santiago');
        expect(normalized.country).toBe('Chile');
      });

      it('preserves existing city when set', () => {
        const tx = createTransaction({ city: 'London' });
        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized.city).toBe('London');
      });

      it('preserves existing country when set', () => {
        const tx = createTransaction({ country: 'UK' });
        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized.country).toBe('UK');
      });

      it('handles empty string city from user defaults', () => {
        const tx = createTransaction({ city: undefined });
        const emptyDefaults: UserDefaults = { city: '', country: 'Chile' };
        const normalized = normalizeTransaction(tx, emptyDefaults);

        expect(normalized.city).toBe('');
      });

      it('handles empty string country from user defaults', () => {
        const tx = createTransaction({ country: undefined });
        const emptyDefaults: UserDefaults = { city: 'Santiago', country: '' };
        const normalized = normalizeTransaction(tx, emptyDefaults);

        expect(normalized.country).toBe('');
      });

      it('handles both user defaults being empty', () => {
        const tx = createTransaction({ city: undefined, country: undefined });
        const emptyDefaults: UserDefaults = { city: '', country: '' };
        const normalized = normalizeTransaction(tx, emptyDefaults);

        expect(normalized.city).toBe('');
        expect(normalized.country).toBe('');
      });
    });

    describe('preserves other transaction fields', () => {
      it('preserves all other fields unchanged', () => {
        const tx = createTransaction({
          id: 'test-id',
          merchant: 'Store',
          alias: 'My Store',
          date: '2025-12-13',
          total: 999,
          category: 'Restaurant',
          items: [{ name: 'Item', price: 10 }],
          imageUrls: ['http://example.com/img.jpg'],
          thumbnailUrl: 'http://example.com/thumb.jpg',
          currency: 'USD',
          receiptType: 'invoice',
          promptVersion: '2.6.0',
          merchantSource: 'scan',
        });

        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized.id).toBe('test-id');
        expect(normalized.merchant).toBe('Store');
        expect(normalized.alias).toBe('My Store');
        expect(normalized.date).toBe('2025-12-13');
        expect(normalized.total).toBe(999);
        expect(normalized.category).toBe('Restaurant');
        expect(normalized.items).toHaveLength(1);
        expect(normalized.imageUrls).toEqual(['http://example.com/img.jpg']);
        expect(normalized.thumbnailUrl).toBe('http://example.com/thumb.jpg');
        expect(normalized.currency).toBe('USD');
        expect(normalized.receiptType).toBe('invoice');
        expect(normalized.promptVersion).toBe('2.6.0');
        expect(normalized.merchantSource).toBe('scan');
      });

      it('returns a new object (immutable)', () => {
        const tx = createTransaction();
        const normalized = normalizeTransaction(tx, defaultUserSettings);

        expect(normalized).not.toBe(tx);
      });
    });
  });

  describe('normalizeTransactions', () => {
    it('normalizes multiple transactions', () => {
      const transactions = [
        createTransaction({ time: undefined, city: undefined, country: undefined }),
        createTransaction({ time: '10:00', city: 'Madrid', country: 'Spain' }),
        createTransaction({ time: '', city: '', country: '' }),
      ];

      const normalized = normalizeTransactions(transactions, defaultUserSettings);

      expect(normalized).toHaveLength(3);

      // First transaction: all defaults applied
      expect(normalized[0].time).toBe(DEFAULT_TIME);
      expect(normalized[0].city).toBe('Santiago');
      expect(normalized[0].country).toBe('Chile');

      // Second transaction: values preserved
      expect(normalized[1].time).toBe('10:00');
      expect(normalized[1].city).toBe('Madrid');
      expect(normalized[1].country).toBe('Spain');

      // Third transaction: empty strings become defaults
      expect(normalized[2].time).toBe(DEFAULT_TIME);
      expect(normalized[2].city).toBe('Santiago');
      expect(normalized[2].country).toBe('Chile');
    });

    it('returns empty array for empty input', () => {
      const normalized = normalizeTransactions([], defaultUserSettings);
      expect(normalized).toEqual([]);
    });

    it('returns new array (immutable)', () => {
      const transactions = [createTransaction()];
      const normalized = normalizeTransactions(transactions, defaultUserSettings);

      expect(normalized).not.toBe(transactions);
      expect(normalized[0]).not.toBe(transactions[0]);
    });
  });
});
