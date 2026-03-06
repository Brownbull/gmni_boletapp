/**
 * Story TD-16-1: Structured guard violation logging
 *
 * Emits structured log events for phase guard violations in all environments.
 * Replaces DEV-only console.warn with observable, structured events.
 */

export interface GuardViolationEvent {
  store: 'scan';
  action: string;
  currentPhase: string;
  expectedPhase: string;
  currentMode?: string;
  expectedMode?: string;
  detail?: string;
  timestamp: number;
}

/**
 * Log a phase guard violation as a structured event.
 * Runs in all environments (not gated on import.meta.env.DEV).
 */
export function logGuardViolation(event: Omit<GuardViolationEvent, 'store' | 'timestamp'>): void {
  const fullEvent: GuardViolationEvent = {
    store: 'scan',
    timestamp: Date.now(),
    ...event,
  };

  // Structured warn — parseable by log aggregators
  console.warn('[ScanStore:guard]', JSON.stringify(fullEvent));
}
