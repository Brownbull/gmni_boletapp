/**
 * Analytics Service Tests
 *
 * Story 14d-v2-1-14-polish: Analytics event tracking stub
 * ECC Review #8: Dedicated unit tests for analyticsService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('analyticsService', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        vi.unstubAllEnvs();
    });

    it('logs event name and params in DEV mode', async () => {
        vi.stubEnv('DEV', 'true');
        // Re-import to pick up env
        const { trackEvent } = await import('@/services/analyticsService');

        trackEvent('test_event', { key: 'value', count: 42 });

        expect(consoleSpy).toHaveBeenCalledWith(
            '[Analytics] test_event',
            { key: 'value', count: 42 }
        );
    });

    it('logs event without params in DEV mode', async () => {
        vi.stubEnv('DEV', 'true');
        const { trackEvent } = await import('@/services/analyticsService');

        trackEvent('simple_event');

        expect(consoleSpy).toHaveBeenCalledWith(
            '[Analytics] simple_event',
            undefined
        );
    });

    it('accepts boolean params', async () => {
        vi.stubEnv('DEV', 'true');
        const { trackEvent } = await import('@/services/analyticsService');

        trackEvent('bool_event', { enabled: true });

        expect(consoleSpy).toHaveBeenCalledWith(
            '[Analytics] bool_event',
            { enabled: true }
        );
    });

    // ECC Review #2: Verify production mode is a no-op
    it('does NOT log in production mode (DEV not set)', async () => {
        vi.stubEnv('DEV', '');
        const { trackEvent } = await import('@/services/analyticsService');

        trackEvent('prod_event', { key: 'value' });

        expect(consoleSpy).not.toHaveBeenCalled();
    });
});
