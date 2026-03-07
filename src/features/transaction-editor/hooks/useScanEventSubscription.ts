/**
 * Story 16-7: Scan Event Subscription Hook
 *
 * Subscribes to scan:completed events and sets up transaction-editor state.
 * Replaces direct cross-feature import of transactionEditorActions in processScan.
 *
 * The scan feature emits events; this feature listens and reacts locally.
 */

import { useEffect, useRef } from 'react';
import { appEvents } from '@shared/events';
import { useTransactionEditorActions } from '@features/transaction-editor/store';
import { getScanState } from '@features/scan/store';

/**
 * Subscribe to scan:completed events and hydrate editor state.
 *
 * Must be mounted in a component that lives for the duration of scan flows
 * (e.g., App-level or feature orchestrator).
 *
 * Uses getScanState() (not reactive hook) to read scan results at event time,
 * avoiding stale closure issues since processSuccess writes synchronously
 * before the event fires.
 *
 * AC-ARCH-PATTERN-3: Cleanup function returned in useEffect.
 */
export function useScanEventSubscription(): void {
  const actions = useTransactionEditorActions();
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const handleScanCompleted = () => {
      const { results, activeResultIndex } = getScanState();
      const transaction = results[activeResultIndex];
      if (!transaction) return;

      actionsRef.current.setTransaction(transaction);
      actionsRef.current.setCreditUsed(true);
      actionsRef.current.setAnimateItems(true);
    };

    appEvents.on('scan:completed', handleScanCompleted);
    return () => {
      appEvents.off('scan:completed', handleScanCompleted);
    };
  }, []); // Stable — reads from store getState() and ref
}
