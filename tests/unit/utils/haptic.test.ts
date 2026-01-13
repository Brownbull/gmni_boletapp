/**
 * Tests for haptic feedback utilities
 *
 * Story 14.18: Celebration System
 * Epic 14: Core Implementation
 *
 * Tests:
 * - AC#3: Haptic feedback via navigator.vibrate API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    isHapticAvailable,
    triggerHaptic,
    triggerHapticPattern,
    cancelHaptic,
} from '../../../src/utils/haptic';
import { HAPTIC_PATTERNS } from '../../../src/types/celebration';

describe('haptic utilities', () => {
    let mockVibrate: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockVibrate = vi.fn(() => true);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('isHapticAvailable', () => {
        it('should return true when navigator.vibrate is available', () => {
            vi.stubGlobal('navigator', { vibrate: mockVibrate });
            expect(isHapticAvailable()).toBe(true);
        });

        it('should return false when navigator is undefined', () => {
            vi.stubGlobal('navigator', undefined);
            expect(isHapticAvailable()).toBe(false);
        });

        it('should return false when navigator.vibrate is not a function', () => {
            vi.stubGlobal('navigator', { vibrate: undefined });
            expect(isHapticAvailable()).toBe(false);
        });
    });

    describe('triggerHaptic', () => {
        it('should call navigator.vibrate with small pattern', () => {
            vi.stubGlobal('navigator', { vibrate: mockVibrate });

            const result = triggerHaptic('small');

            expect(result).toBe(true);
            expect(mockVibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.small);
            expect(mockVibrate).toHaveBeenCalledWith([50]);
        });

        it('should call navigator.vibrate with big pattern', () => {
            vi.stubGlobal('navigator', { vibrate: mockVibrate });

            const result = triggerHaptic('big');

            expect(result).toBe(true);
            expect(mockVibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.big);
            expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
        });

        it('should return false when vibration not available', () => {
            vi.stubGlobal('navigator', { vibrate: undefined });

            const result = triggerHaptic('small');

            expect(result).toBe(false);
        });

        it('should return false when vibrate throws', () => {
            vi.stubGlobal('navigator', {
                vibrate: () => {
                    throw new Error('Vibration failed');
                },
            });

            const result = triggerHaptic('small');

            expect(result).toBe(false);
        });
    });

    describe('triggerHapticPattern', () => {
        it('should call navigator.vibrate with custom pattern', () => {
            vi.stubGlobal('navigator', { vibrate: mockVibrate });

            const customPattern = [200, 100, 200, 100, 200];
            const result = triggerHapticPattern(customPattern);

            expect(result).toBe(true);
            expect(mockVibrate).toHaveBeenCalledWith(customPattern);
        });

        it('should return false for empty pattern', () => {
            vi.stubGlobal('navigator', { vibrate: mockVibrate });

            const result = triggerHapticPattern([]);

            expect(result).toBe(false);
            expect(mockVibrate).not.toHaveBeenCalled();
        });

        it('should return false when vibration not available', () => {
            vi.stubGlobal('navigator', { vibrate: undefined });

            const result = triggerHapticPattern([100, 50, 100]);

            expect(result).toBe(false);
        });
    });

    describe('cancelHaptic', () => {
        it('should call navigator.vibrate with 0 to cancel', () => {
            vi.stubGlobal('navigator', { vibrate: mockVibrate });

            cancelHaptic();

            expect(mockVibrate).toHaveBeenCalledWith(0);
        });

        it('should not throw when vibration not available', () => {
            vi.stubGlobal('navigator', { vibrate: undefined });

            expect(() => cancelHaptic()).not.toThrow();
        });

        it('should not throw when vibrate throws', () => {
            vi.stubGlobal('navigator', {
                vibrate: () => {
                    throw new Error('Cancel failed');
                },
            });

            expect(() => cancelHaptic()).not.toThrow();
        });
    });
});

describe('HAPTIC_PATTERNS', () => {
    it('should have correct small pattern (AC#3)', () => {
        expect(HAPTIC_PATTERNS.small).toEqual([50]);
    });

    it('should have correct big pattern (AC#3)', () => {
        expect(HAPTIC_PATTERNS.big).toEqual([100, 50, 100]);
    });
});
