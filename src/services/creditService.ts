/**
 * Story 12.4: Credit Warning System - Credit Service
 *
 * Provides credit check and validation logic for batch processing.
 * Currently works with in-memory credit state; future Epic will integrate
 * with Firestore for persistent credit tracking.
 *
 * @see docs/sprint-artifacts/epic12/story-12.4-credit-warning-system.md
 */

import { UserCredits } from '../types/scan';

/**
 * Result of a credit sufficiency check.
 * Includes all data needed for the Credit Warning Dialog.
 */
export interface CreditCheckResult {
  /** Whether user has enough credits for the operation */
  sufficient: boolean;
  /** Credits currently available */
  available: number;
  /** Credits required for the operation */
  required: number;
  /** Credits that will remain after the operation (0 if insufficient) */
  remaining: number;
  /** Shortage amount (0 if sufficient) */
  shortage: number;
  /** Maximum receipts processable with available credits */
  maxProcessable: number;
}

/**
 * Check if user has sufficient credits for a batch operation.
 *
 * @param userCredits - Current user credit state
 * @param requiredCredits - Number of credits needed (usually = image count)
 * @returns CreditCheckResult with all relevant data for UI display
 *
 * @example
 * ```typescript
 * const result = checkCreditSufficiency(userCredits, batchImages.length);
 * if (!result.sufficient) {
 *   // Show insufficient credits dialog
 *   console.log(`Need ${result.shortage} more credits`);
 * }
 * ```
 */
export function checkCreditSufficiency(
  userCredits: UserCredits,
  requiredCredits: number
): CreditCheckResult {
  const available = userCredits.remaining;
  const sufficient = available >= requiredCredits;
  const remaining = sufficient ? available - requiredCredits : 0;
  const shortage = sufficient ? 0 : requiredCredits - available;
  const maxProcessable = Math.min(available, requiredCredits);

  return {
    sufficient,
    available,
    required: requiredCredits,
    remaining,
    shortage,
    maxProcessable,
  };
}

/**
 * Calculate the number of credits required for a batch operation.
 * Currently: 1 credit per image.
 *
 * @param imageCount - Number of images in the batch
 * @returns Number of credits required
 */
export function calculateCreditsRequired(imageCount: number): number {
  // 1 credit per receipt
  return imageCount;
}

/**
 * Create updated credits after successful deduction.
 * Pure function - does not mutate state.
 *
 * @param currentCredits - Current credit state
 * @param amount - Amount to deduct
 * @returns New credit state
 * @throws Error if insufficient credits
 */
export function deductCredits(
  currentCredits: UserCredits,
  amount: number
): UserCredits {
  if (currentCredits.remaining < amount) {
    throw new Error('Insufficient credits');
  }

  return {
    remaining: currentCredits.remaining - amount,
    used: currentCredits.used + amount,
  };
}

/**
 * Check if credits are in a warning state (low but not exhausted).
 * Used to show visual warnings in the UI.
 *
 * @param available - Available credits
 * @param required - Credits needed
 * @returns True if credits are low (will be exhausted or nearly so)
 */
export function isLowCreditsWarning(
  available: number,
  required: number
): boolean {
  // Warning if this batch will use all remaining credits
  // or leave fewer than 10% of what we started with
  const remaining = available - required;
  return remaining <= 0 || remaining < available * 0.1;
}
