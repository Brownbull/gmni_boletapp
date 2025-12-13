/**
 * Duplicate Detection Service
 * Story 9.11: Detects potential duplicate transactions
 *
 * Core matching criteria (required - all must match):
 * - Same date
 * - Same merchant name
 * - Same amount
 *
 * Optional refinement criteria (only compared if BOTH transactions have values):
 * - Time: If both have time, must be within 1 hour proximity. If either is missing, skip this check.
 * - City: If both have city, must match. If either is missing, skip this check.
 * - Country: If both have country, must match. If either is missing, skip this check.
 *
 * This allows legacy transactions without time/location to still be detected as duplicates
 * based on merchant, date, and amount alone.
 *
 * NOTE: Alias is NOT included because users may update it over time.
 */

import { Transaction } from '../types/transaction';

/**
 * Maximum time difference in minutes for transactions to be considered duplicates.
 * Transactions within this time window on the same date are potential duplicates.
 */
export const TIME_PROXIMITY_MINUTES = 60;

/**
 * Result of duplicate detection for a single transaction
 */
export interface DuplicateResult {
  /** The transaction being checked */
  transactionId: string;
  /** IDs of transactions that are duplicates of this one */
  duplicateIds: string[];
  /** Whether this transaction has duplicates */
  isDuplicate: boolean;
}

/**
 * Parse time string (HH:mm) to minutes since midnight.
 * Returns null if time is invalid or not set.
 *
 * @param time - Time string in HH:mm format
 * @returns Minutes since midnight, or null if invalid
 */
export function parseTimeToMinutes(time?: string): number | null {
  if (!time || time.trim() === '') return null;

  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * Check if two times are within the proximity threshold.
 * If either time is null (not set), returns true to allow matching
 * (we don't want to exclude potential duplicates just because time is missing).
 *
 * @param time1 - First time in minutes
 * @param time2 - Second time in minutes
 * @returns true if times are within proximity or either is null
 */
export function areTimesWithinProximity(
  time1: number | null,
  time2: number | null
): boolean {
  // If either time is missing, consider them as potentially matching
  // (legacy transactions without time shouldn't be excluded)
  if (time1 === null || time2 === null) return true;

  const diff = Math.abs(time1 - time2);
  return diff <= TIME_PROXIMITY_MINUTES;
}

/**
 * Check if two locations match (city and country).
 * If either transaction is missing city or country, returns true to allow matching
 * (we don't want to exclude potential duplicates just because location is missing).
 *
 * Only returns false if BOTH transactions have a value AND they don't match.
 *
 * @param tx1 - First transaction
 * @param tx2 - Second transaction
 * @returns true if locations match or either is missing location data
 */
export function areLocationsMatching(tx1: Transaction, tx2: Transaction): boolean {
  const city1 = (tx1.city || '').toLowerCase().trim();
  const city2 = (tx2.city || '').toLowerCase().trim();
  const country1 = (tx1.country || '').toLowerCase().trim();
  const country2 = (tx2.country || '').toLowerCase().trim();

  // Check city: only compare if BOTH have a value
  if (city1 !== '' && city2 !== '') {
    if (city1 !== city2) return false;
  }

  // Check country: only compare if BOTH have a value
  if (country1 !== '' && country2 !== '') {
    if (country1 !== country2) return false;
  }

  // Either locations match or one/both are missing - allow matching
  return true;
}

/**
 * Generate a base key for grouping transactions by CORE criteria only.
 * This groups by date + merchant + amount.
 * Time and location are checked separately as optional refinements.
 *
 * @param tx - Transaction to generate key for
 * @returns Base key string for grouping
 */
export function getBaseGroupKey(tx: Transaction): string {
  // Normalize values for consistent comparison
  // Use lowercase and trim for string fields
  const date = (tx.date || '').trim();
  const merchant = (tx.merchant || '').toLowerCase().trim();
  const total = tx.total?.toString() || '0';

  // Create a deterministic key from CORE criteria only (date, merchant, amount)
  // City, country, and time are checked separately as optional refinements
  return `${date}|${merchant}|${total}`;
}

/**
 * @deprecated Use getBaseGroupKey instead. This function is kept for backward compatibility.
 */
export function getDuplicateKey(tx: Transaction): string {
  return getBaseGroupKey(tx);
}

/**
 * Find all duplicate groups in a list of transactions.
 * Returns a Map where keys are transaction IDs and values are arrays
 * of duplicate transaction IDs.
 *
 * Core matching criteria (required - all must match):
 * - Same date, merchant, amount
 *
 * Optional refinement criteria (only compared if BOTH transactions have values):
 * - Time: within 1 hour proximity (if both have time set)
 * - City: must match (if both have city set)
 * - Country: must match (if both have country set)
 *
 * AC #4: Uses matching criteria (date, merchant, amount + optional time/location)
 * AC #6: Works in real-time as user browses history
 * AC #7: Applies to both new and existing transactions
 *
 * @param transactions - Array of transactions to check
 * @returns Map of transaction ID to array of duplicate IDs
 */
export function findDuplicates(
  transactions: Transaction[]
): Map<string, string[]> {
  // First pass: Group transactions by base key (date, merchant, amount)
  const keyToTransactions = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    // Skip transactions without ID (shouldn't happen but be defensive)
    if (!tx.id) continue;

    const key = getBaseGroupKey(tx);
    const existing = keyToTransactions.get(key) || [];
    existing.push(tx);
    keyToTransactions.set(key, existing);
  }

  // Second pass: Within each group, check optional refinements (time and location)
  const duplicateMap = new Map<string, string[]>();

  for (const [, txGroup] of keyToTransactions) {
    // Skip groups with only one transaction
    if (txGroup.length <= 1) continue;

    // For each pair of transactions in the group, check optional refinements
    for (let i = 0; i < txGroup.length; i++) {
      const tx1 = txGroup[i];
      const time1 = parseTimeToMinutes(tx1.time);
      const duplicatesForTx1: string[] = [];

      for (let j = 0; j < txGroup.length; j++) {
        if (i === j) continue; // Don't compare with self

        const tx2 = txGroup[j];
        const time2 = parseTimeToMinutes(tx2.time);

        // Check optional refinements:
        // 1. Time proximity (if both have time, must be within 1 hour)
        // 2. Location match (if both have city/country, they must match)
        const timesMatch = areTimesWithinProximity(time1, time2);
        const locationsMatch = areLocationsMatching(tx1, tx2);

        // Both optional checks must pass (or be skipped if data is missing)
        if (timesMatch && locationsMatch) {
          duplicatesForTx1.push(tx2.id!);
        }
      }

      // Only add to map if there are duplicates
      if (duplicatesForTx1.length > 0) {
        duplicateMap.set(tx1.id!, duplicatesForTx1);
      }
    }
  }

  return duplicateMap;
}

/**
 * Check if a specific transaction has duplicates in a list.
 * Convenience function for checking a single transaction.
 *
 * @param transaction - The transaction to check
 * @param allTransactions - All transactions to compare against
 * @returns DuplicateResult with duplicate status and IDs
 */
export function checkForDuplicates(
  transaction: Transaction,
  allTransactions: Transaction[]
): DuplicateResult {
  const duplicateMap = findDuplicates(allTransactions);
  const duplicateIds = duplicateMap.get(transaction.id || '') || [];

  return {
    transactionId: transaction.id || '',
    duplicateIds,
    isDuplicate: duplicateIds.length > 0,
  };
}

/**
 * Create a Set of transaction IDs that have duplicates.
 * Useful for quick lookup when rendering transaction cards.
 *
 * @param transactions - Array of transactions to check
 * @returns Set of transaction IDs that are duplicates
 */
export function getDuplicateIds(transactions: Transaction[]): Set<string> {
  const duplicateMap = findDuplicates(transactions);
  return new Set(duplicateMap.keys());
}
