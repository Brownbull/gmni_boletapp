/**
 * Story 16-7: Application Event Types
 *
 * Typed event map for cross-feature communication via mitt.
 * Events use `feature:action` format with past tense (AC-ARCH-PATTERN-1).
 * Payloads carry IDs only, never full objects (AC-ARCH-PATTERN-2).
 */

import type { ScanMode } from '@shared/types/scanWorkflow';

/**
 * Application-wide event map for typed mitt emitter.
 *
 * Convention: `feature:action` (past tense)
 * Payload: IDs only — subscriber reads full data from shared stores.
 */
export type AppEvents = {
  /**
   * Scan completed — transaction available in scan store results.
   * transactionIds is currently empty (signal-only): transactions are not yet
   * persisted at emit time. Subscribers read data via getScanState().
   * Will carry actual IDs once post-save events are added.
   */
  'scan:completed': { transactionIds: string[] };

  /** Scan cancelled by user. */
  'scan:cancelled': { mode: ScanMode };

  /**
   * Batch editing finished — batch-review should transition state.
   * transactionIds is currently empty (signal-only): emitted on cancel
   * to signal editing phase complete. Subscriber calls finishEditing().
   */
  'review:saved': { transactionIds: string[] };
};
