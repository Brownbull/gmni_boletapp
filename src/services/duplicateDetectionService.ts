/**
 * Duplicate Detection Service
 * Story 9.11: Detects potential duplicate transactions
 *
 * Matching criteria (AC #4):
 * - Same date
 * - Same merchant name
 * - Same amount
 * - Same city
 * - Same country
 * - Time within 1 hour proximity (if both have time set)
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
 * Generate a base key for grouping transactions by core criteria.
 * This groups by date + merchant + amount + city + country.
 * Time proximity is checked separately.
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
  const city = (tx.city || '').toLowerCase().trim();
  const country = (tx.country || '').toLowerCase().trim();

  // Create a deterministic key from core criteria (no alias, no time)
  return `${date}|${merchant}|${total}|${city}|${country}`;
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
 * Matching criteria:
 * - Same date, merchant, amount, city, country
 * - Time within 1 hour (if both have time set)
 *
 * AC #4: Uses matching criteria (date, merchant, amount, city, country, time proximity)
 * AC #6: Works in real-time as user browses history
 * AC #7: Applies to both new and existing transactions
 *
 * @param transactions - Array of transactions to check
 * @returns Map of transaction ID to array of duplicate IDs
 */
export function findDuplicates(
  transactions: Transaction[]
): Map<string, string[]> {
  // First pass: Group transactions by base key (without time)
  const keyToTransactions = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    // Skip transactions without ID (shouldn't happen but be defensive)
    if (!tx.id) continue;

    const key = getBaseGroupKey(tx);
    const existing = keyToTransactions.get(key) || [];
    existing.push(tx);
    keyToTransactions.set(key, existing);
  }

  // Second pass: Within each group, check time proximity
  const duplicateMap = new Map<string, string[]>();

  for (const [, txGroup] of keyToTransactions) {
    // Skip groups with only one transaction
    if (txGroup.length <= 1) continue;

    // For each pair of transactions in the group, check time proximity
    for (let i = 0; i < txGroup.length; i++) {
      const tx1 = txGroup[i];
      const time1 = parseTimeToMinutes(tx1.time);
      const duplicatesForTx1: string[] = [];

      for (let j = 0; j < txGroup.length; j++) {
        if (i === j) continue; // Don't compare with self

        const tx2 = txGroup[j];
        const time2 = parseTimeToMinutes(tx2.time);

        // Check if times are within proximity
        if (areTimesWithinProximity(time1, time2)) {
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
