/**
 * Tests for timestamp utilities
 *
 * Story 15-2c: Unified TimestampLike → Date/millis
 *
 * Test coverage:
 * - isFirestoreTimestamp type guard
 * - isValidDate type guard
 * - toMillis conversion from all TimestampLike variants
 * - toDateSafe conversion from all TimestampLike variants
 * - Edge cases: null, undefined, NaN, invalid strings
 */

import { describe, it, expect } from 'vitest';
import {
    isFirestoreTimestamp,
    isValidDate,
    toMillis,
    toDateSafe,
} from '../../../src/utils/timestamp';

describe('isFirestoreTimestamp', () => {
    it('should return true for object with seconds property', () => {
        expect(isFirestoreTimestamp({ seconds: 1700000000 })).toBe(true);
    });

    it('should return true for object with seconds and nanoseconds', () => {
        expect(isFirestoreTimestamp({ seconds: 1700000000, nanoseconds: 500000000 })).toBe(true);
    });

    it('should return true for object with seconds and toDate method', () => {
        expect(isFirestoreTimestamp({
            seconds: 1700000000,
            nanoseconds: 0,
            toDate: () => new Date(1700000000000),
        })).toBe(true);
    });

    it('should return false for null', () => {
        expect(isFirestoreTimestamp(null)).toBe(false);
    });

    it('should return false for undefined', () => {
        expect(isFirestoreTimestamp(undefined)).toBe(false);
    });

    it('should return false for a Date object', () => {
        expect(isFirestoreTimestamp(new Date())).toBe(false);
    });

    it('should return false for a number', () => {
        expect(isFirestoreTimestamp(1700000000000)).toBe(false);
    });

    it('should return false for a string', () => {
        expect(isFirestoreTimestamp('2024-01-01')).toBe(false);
    });

    it('should return false for an object without seconds', () => {
        expect(isFirestoreTimestamp({ toDate: () => new Date() })).toBe(false);
    });

    it('should return false for an object with non-numeric seconds', () => {
        expect(isFirestoreTimestamp({ seconds: 'not-a-number' })).toBe(false);
    });
});

describe('isValidDate', () => {
    it('should return true for a valid Date', () => {
        expect(isValidDate(new Date('2024-01-15'))).toBe(true);
    });

    it('should return false for an invalid Date (NaN)', () => {
        expect(isValidDate(new Date('invalid'))).toBe(false);
    });

    it('should return false for non-Date objects', () => {
        expect(isValidDate('2024-01-15')).toBe(false);
        expect(isValidDate(1700000000000)).toBe(false);
        expect(isValidDate(null)).toBe(false);
        expect(isValidDate(undefined)).toBe(false);
        expect(isValidDate({})).toBe(false);
    });
});

describe('toMillis', () => {
    it('should return 0 for null', () => {
        expect(toMillis(null)).toBe(0);
    });

    it('should return 0 for undefined', () => {
        expect(toMillis(undefined)).toBe(0);
    });

    it('should return number as-is (assumed millis)', () => {
        expect(toMillis(1700000000000)).toBe(1700000000000);
    });

    it('should return 0 for zero', () => {
        expect(toMillis(0)).toBe(0);
    });

    it('should convert Date to millis', () => {
        const date = new Date('2024-01-15T12:00:00Z');
        expect(toMillis(date)).toBe(date.getTime());
    });

    it('should return 0 for invalid Date', () => {
        expect(toMillis(new Date('invalid'))).toBe(0);
    });

    it('should convert Firestore Timestamp-like with seconds', () => {
        const ts = { seconds: 1700000000, nanoseconds: 500000000 };
        expect(toMillis(ts)).toBe(1700000000 * 1000 + 500);
    });

    it('should convert Firestore Timestamp-like with only seconds (no nanoseconds)', () => {
        const ts = { seconds: 1700000000 };
        expect(toMillis(ts)).toBe(1700000000000);
    });

    it('should convert object with toDate method', () => {
        const expected = new Date('2024-01-15T12:00:00Z');
        const ts = { toDate: () => expected };
        expect(toMillis(ts)).toBe(expected.getTime());
    });

    it('should return 0 when toDate throws', () => {
        const ts = { toDate: () => { throw new Error('broken'); } };
        expect(toMillis(ts)).toBe(0);
    });

    it('should parse ISO string', () => {
        const iso = '2024-01-15T12:00:00Z';
        expect(toMillis(iso)).toBe(new Date(iso).getTime());
    });

    it('should parse date-only string', () => {
        const dateStr = '2024-01-15';
        const result = toMillis(dateStr);
        expect(result).toBeGreaterThan(0);
    });

    it('should return 0 for unparseable string', () => {
        expect(toMillis('not-a-date')).toBe(0);
    });

    it('should return 0 for empty string', () => {
        expect(toMillis('')).toBe(0);
    });

    it('should prefer seconds path over toDate for objects with both', () => {
        // When an object has both seconds and toDate, seconds path is hit first
        const ts = {
            seconds: 1700000000,
            nanoseconds: 0,
            toDate: () => new Date(9999999999999), // different value
        };
        expect(toMillis(ts)).toBe(1700000000000);
    });
});

describe('toDateSafe', () => {
    it('should return null for null', () => {
        expect(toDateSafe(null)).toBeNull();
    });

    it('should return null for undefined', () => {
        expect(toDateSafe(undefined)).toBeNull();
    });

    it('should return valid Date as-is', () => {
        const date = new Date('2024-01-15T12:00:00Z');
        expect(toDateSafe(date)).toBe(date);
    });

    it('should return null for invalid Date', () => {
        expect(toDateSafe(new Date('invalid'))).toBeNull();
    });

    it('should convert object with toDate method', () => {
        const expected = new Date('2024-01-15T12:00:00Z');
        const ts = { toDate: () => expected };
        expect(toDateSafe(ts)).toBe(expected);
    });

    it('should return null when toDate returns invalid Date', () => {
        const ts = { toDate: () => new Date('invalid') };
        expect(toDateSafe(ts)).toBeNull();
    });

    it('should return null when toDate throws', () => {
        const ts = { toDate: () => { throw new Error('broken'); } };
        expect(toDateSafe(ts)).toBeNull();
    });

    it('should convert Firestore Timestamp-like with seconds', () => {
        const ts = { seconds: 1700000000, nanoseconds: 0 };
        const result = toDateSafe(ts);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getTime()).toBe(1700000000000);
    });

    it('should return null for zero seconds', () => {
        const ts = { seconds: 0 };
        const result = toDateSafe(ts);
        expect(result).toBeNull();
    });

    it('should convert positive number (millis) to Date', () => {
        const millis = 1700000000000;
        const result = toDateSafe(millis);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getTime()).toBe(millis);
    });

    it('should return null for zero millis', () => {
        expect(toDateSafe(0)).toBeNull();
    });

    it('should return null for negative millis', () => {
        expect(toDateSafe(-1)).toBeNull();
    });

    it('should parse valid ISO string', () => {
        const iso = '2024-01-15T12:00:00Z';
        const result = toDateSafe(iso);
        expect(result).toBeInstanceOf(Date);
        expect(result!.getTime()).toBe(new Date(iso).getTime());
    });

    it('should return null for unparseable string', () => {
        expect(toDateSafe('not-a-date')).toBeNull();
    });

    it('should return null for empty string', () => {
        expect(toDateSafe('')).toBeNull();
    });

    it('should prefer toDate path over seconds for live Firestore Timestamps', () => {
        // When an object has toDate AND seconds, toDate path is hit first
        const expected = new Date('2024-01-15T12:00:00Z');
        const ts = {
            seconds: 9999999999, // different value
            toDate: () => expected,
        };
        expect(toDateSafe(ts)).toBe(expected);
    });
});
