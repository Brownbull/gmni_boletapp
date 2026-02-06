/**
 * Analytics Service
 *
 * Story 14d-v2-1-14-polish: Analytics event tracking for opt-in dialog
 *
 * Lightweight event tracking stub. Logs events in development mode.
 * TODO (Epic 14e+): Integrate with Firebase Analytics via getAnalytics().logEvent()
 */

export function trackEvent(
    eventName: string,
    params?: Record<string, string | number | boolean>
): void {
    if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug(`[Analytics] ${eventName}`, params);
    }
}
