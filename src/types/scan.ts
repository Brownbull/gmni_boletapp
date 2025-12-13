/**
 * Story 9.10: Persistent Scan State Management
 *
 * Types for managing scan state that persists across navigation.
 * This ensures users don't lose scanned receipts when navigating away.
 */

import { Transaction } from './transaction';

/**
 * Status of a pending scan session.
 * - images_added: User has added images but not yet processed
 * - analyzing: AI analysis is in progress
 * - analyzed: AI has returned results, transaction ready for editing
 * - error: An error occurred during analysis
 */
export type PendingScanStatus = 'images_added' | 'analyzing' | 'analyzed' | 'error';

/**
 * Represents an in-progress receipt scan that persists across view navigation.
 * The scan is only cleared when the user explicitly saves or cancels the transaction.
 */
export interface PendingScan {
  /** Unique identifier for this scan session */
  sessionId: string;

  /** Raw scan images (base64 data URLs) */
  images: string[];

  /** Analyzed transaction data (null until AI processing completes) */
  analyzedTransaction: Transaction | null;

  /** Timestamp when scan session was initiated */
  createdAt: Date;

  /** Current status of the scan */
  status: PendingScanStatus;

  /** Error message if status is 'error' */
  error?: string;
}

/**
 * User's scan credit balance.
 * MVP implementation uses hardcoded 900 credits.
 * Future Epic 12 will implement real credit tracking via subscription.
 */
export interface UserCredits {
  /** Remaining credits available for scanning */
  remaining: number;

  /** Total credits used */
  used: number;
}

/**
 * Default credit allocation for MVP.
 * Each user starts with 900 credits.
 */
export const DEFAULT_CREDITS: UserCredits = {
  remaining: 900,
  used: 0,
};

/**
 * Generate a unique session ID for a new scan.
 */
export function generateScanSessionId(): string {
  return `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new empty PendingScan with generated session ID.
 */
export function createPendingScan(): PendingScan {
  return {
    sessionId: generateScanSessionId(),
    images: [],
    analyzedTransaction: null,
    createdAt: new Date(),
    status: 'images_added',
  };
}
