/**
 * Shared Firestore mock helpers for tests.
 *
 * TD-CONSOLIDATED-8: Consolidates 25+ local createMockTimestamp definitions
 * into a single shared module with named variants for each usage pattern.
 *
 * Usage:
 *   import { createMockTimestamp, createMockTimestampDaysAgo } from '../../helpers';
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Creates a mock Firestore Timestamp from a Date (defaults to now).
 * Includes all Timestamp interface members for full type compatibility.
 */
export function createMockTimestamp(date: Date = new Date()): Timestamp {
    return {
        toDate: () => date,
        toMillis: () => date.getTime(),
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
        isEqual: (other: Timestamp) => other.seconds === Math.floor(date.getTime() / 1000),
        valueOf: () => `Timestamp(seconds=${Math.floor(date.getTime() / 1000)}, nanoseconds=0)`,
        toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
    } as unknown as Timestamp;
}

/**
 * Creates a mock Timestamp for a date N days in the past.
 */
export function createMockTimestampDaysAgo(daysAgo: number): Timestamp {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return createMockTimestamp(date);
}

/**
 * Creates a mock Timestamp for a date N days in the future.
 */
export function createMockTimestampDaysFromNow(daysFromNow: number): Timestamp {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return createMockTimestamp(date);
}

/**
 * Creates a mock Timestamp for a date N hours in the past.
 */
export function createMockTimestampHoursAgo(hoursAgo: number): Timestamp {
    const date = new Date();
    date.setHours(date.getHours() - hoursAgo);
    return createMockTimestamp(date);
}
