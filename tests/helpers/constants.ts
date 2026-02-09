/**
 * Shared test constants to eliminate magic numbers.
 *
 * TD-CONSOLIDATED-8: Centralize commonly used time values
 * and re-export source-of-truth constants for test convenience.
 */

/** 7 days in milliseconds */
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** 1 day in milliseconds */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** 1 hour in milliseconds */
export const ONE_HOUR_MS = 60 * 60 * 1000;

/** 1 minute in milliseconds */
export const ONE_MINUTE_MS = 60 * 1000;

// Re-export source-of-truth limits for test convenience
export { SHARED_GROUP_LIMITS } from '../../src/types/sharedGroup';
