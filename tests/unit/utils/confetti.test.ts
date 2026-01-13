/**
 * Tests for confetti celebration effects
 *
 * Story 14.18: Celebration System
 * Epic 14: Core Implementation
 *
 * Tests:
 * - AC#2: Confetti animation using canvas-confetti
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock canvas-confetti before importing the module
vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
}));

import confetti from 'canvas-confetti';
import {
    celebrateSmall,
    celebrateSuccess,
    celebrateBig,
    triggerConfetti,
    CELEBRATION_COLORS,
} from '../../../src/utils/confetti';

describe('confetti utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('CELEBRATION_COLORS', () => {
        it('should have default colors', () => {
            expect(CELEBRATION_COLORS.default).toEqual([
                '#3b82f6',
                '#6366f1',
                '#8b5cf6',
                '#22c55e',
                '#f59e0b',
            ]);
        });

        it('should have milestone colors (gold theme)', () => {
            expect(CELEBRATION_COLORS.milestone).toContain('#f59e0b');
            expect(CELEBRATION_COLORS.milestone).toContain('#eab308');
        });

        it('should have streak colors (green theme)', () => {
            expect(CELEBRATION_COLORS.streak).toContain('#22c55e');
            expect(CELEBRATION_COLORS.streak).toContain('#16a34a');
        });

        it('should have personal colors (purple theme)', () => {
            expect(CELEBRATION_COLORS.personal).toContain('#6366f1');
            expect(CELEBRATION_COLORS.personal).toContain('#818cf8');
        });
    });

    describe('celebrateSmall', () => {
        it('should call confetti with small particle count', () => {
            celebrateSmall();

            expect(confetti).toHaveBeenCalledWith(
                expect.objectContaining({
                    particleCount: 40,
                    spread: 45,
                    disableForReducedMotion: true,
                })
            );
        });

        it('should use default colors', () => {
            celebrateSmall();

            expect(confetti).toHaveBeenCalledWith(
                expect.objectContaining({
                    colors: CELEBRATION_COLORS.default,
                })
            );
        });

        it('should accept custom colors', () => {
            const customColors = ['#ff0000', '#00ff00'];
            celebrateSmall(customColors);

            expect(confetti).toHaveBeenCalledWith(
                expect.objectContaining({
                    colors: customColors,
                })
            );
        });

        it('should have faster gravity for subtlety', () => {
            celebrateSmall();

            expect(confetti).toHaveBeenCalledWith(
                expect.objectContaining({
                    gravity: 1.2,
                })
            );
        });

        it('should have smaller particles', () => {
            celebrateSmall();

            expect(confetti).toHaveBeenCalledWith(
                expect.objectContaining({
                    scalar: 0.8,
                })
            );
        });
    });

    describe('celebrateSuccess', () => {
        it('should call confetti with medium particle count', () => {
            celebrateSuccess();

            expect(confetti).toHaveBeenCalledWith(
                expect.objectContaining({
                    particleCount: 80,
                    spread: 60,
                    disableForReducedMotion: true,
                })
            );
        });

        it('should use default colors', () => {
            celebrateSuccess();

            expect(confetti).toHaveBeenCalledWith(
                expect.objectContaining({
                    colors: CELEBRATION_COLORS.default,
                })
            );
        });

        it('should accept custom colors', () => {
            const customColors = ['#ff0000', '#00ff00'];
            celebrateSuccess(customColors);

            expect(confetti).toHaveBeenCalledWith(
                expect.objectContaining({
                    colors: customColors,
                })
            );
        });
    });

    describe('celebrateBig', () => {
        it('should fire multiple confetti bursts', () => {
            celebrateBig();

            // celebrateBig fires 5 bursts
            expect(confetti).toHaveBeenCalledTimes(5);
        });

        it('should use disableForReducedMotion for all bursts', () => {
            celebrateBig();

            const calls = vi.mocked(confetti).mock.calls;
            calls.forEach((call) => {
                expect(call[0]).toHaveProperty('disableForReducedMotion', true);
            });
        });

        it('should accept custom colors', () => {
            const customColors = ['#ff0000', '#00ff00'];
            celebrateBig(customColors);

            const calls = vi.mocked(confetti).mock.calls;
            calls.forEach((call) => {
                expect(call[0]).toHaveProperty('colors', customColors);
            });
        });

        it('should have varying spreads for visual interest', () => {
            celebrateBig();

            const calls = vi.mocked(confetti).mock.calls;
            const spreads = calls.map((call) => (call[0] as { spread?: number }).spread);

            // Should have different spread values
            expect(new Set(spreads).size).toBeGreaterThan(1);
        });
    });

    describe('triggerConfetti', () => {
        it('should call celebrateSmall for small type', () => {
            triggerConfetti('small');

            expect(confetti).toHaveBeenCalledWith(
                expect.objectContaining({
                    particleCount: 40,
                })
            );
        });

        it('should call celebrateBig for big type', () => {
            triggerConfetti('big');

            // celebrateBig fires 5 bursts
            expect(confetti).toHaveBeenCalledTimes(5);
        });

        it('should pass colors to small celebration', () => {
            const customColors = ['#ff0000'];
            triggerConfetti('small', customColors);

            expect(confetti).toHaveBeenCalledWith(
                expect.objectContaining({
                    colors: customColors,
                })
            );
        });

        it('should pass colors to big celebration', () => {
            const customColors = ['#ff0000'];
            triggerConfetti('big', customColors);

            const calls = vi.mocked(confetti).mock.calls;
            calls.forEach((call) => {
                expect(call[0]).toHaveProperty('colors', customColors);
            });
        });
    });
});
