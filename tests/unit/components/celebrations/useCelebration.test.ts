/**
 * Tests for useCelebration hook
 *
 * Story 14.18: Celebration System
 * Epic 14: Core Implementation
 *
 * Tests:
 * - AC#1: Orchestrates celebration effects
 * - AC#5: Celebration triggers for milestones, records, goals, first scan
 * - AC#6: Reduced motion support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    useCelebration,
    CELEBRATION_PRESETS,
} from '../../../../src/components/celebrations/useCelebration';

// Mock the utilities
vi.mock('../../../../src/utils/confetti', () => ({
    triggerConfetti: vi.fn(),
    CELEBRATION_COLORS: {
        default: ['#3b82f6'],
        milestone: ['#f59e0b'],
        streak: ['#22c55e'],
        personal: ['#6366f1'],
    },
}));

vi.mock('../../../../src/utils/haptic', () => ({
    triggerHaptic: vi.fn(() => true),
}));

vi.mock('../../../../src/utils/celebrationSounds', () => ({
    playCelebrationSound: vi.fn(() => Promise.resolve(true)),
}));

// Mock useReducedMotion
let mockReducedMotion = false;
vi.mock('../../../../src/hooks/useReducedMotion', () => ({
    useReducedMotion: () => mockReducedMotion,
    default: () => mockReducedMotion,
}));

import { triggerConfetti } from '../../../../src/utils/confetti';
import { triggerHaptic } from '../../../../src/utils/haptic';
import { playCelebrationSound } from '../../../../src/utils/celebrationSounds';

describe('useCelebration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockReducedMotion = false;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('CELEBRATION_PRESETS (AC#5)', () => {
        it('should have milestone preset for savings goals', () => {
            expect(CELEBRATION_PRESETS.milestone).toEqual({
                type: 'big',
                confetti: true,
                haptic: true,
                sound: true,
            });
        });

        it('should have personalRecord preset for lowest category week', () => {
            expect(CELEBRATION_PRESETS.personalRecord).toEqual({
                type: 'big',
                confetti: true,
                haptic: true,
                sound: true,
            });
        });

        it('should have quickSave preset (smaller, no sound)', () => {
            expect(CELEBRATION_PRESETS.quickSave).toEqual({
                type: 'small',
                confetti: true,
                haptic: true,
                sound: false,
            });
        });

        it('should have firstScan preset for welcome', () => {
            expect(CELEBRATION_PRESETS.firstScan).toEqual({
                type: 'big',
                confetti: true,
                haptic: true,
                sound: true,
            });
        });

        it('should have streak preset for consecutive tracking', () => {
            expect(CELEBRATION_PRESETS.streak).toEqual({
                type: 'small',
                confetti: true,
                haptic: true,
                sound: false,
            });
        });
    });

    describe('hook return value', () => {
        it('should return celebrate function', () => {
            const { result } = renderHook(() => useCelebration());
            expect(typeof result.current.celebrate).toBe('function');
        });

        it('should return celebratePreset function', () => {
            const { result } = renderHook(() => useCelebration());
            expect(typeof result.current.celebratePreset).toBe('function');
        });

        it('should return celebrateCustom function', () => {
            const { result } = renderHook(() => useCelebration());
            expect(typeof result.current.celebrateCustom).toBe('function');
        });

        it('should return isReducedMotion status', () => {
            const { result } = renderHook(() => useCelebration());
            expect(result.current.isReducedMotion).toBe(false);
        });

        it('should return true for isReducedMotion when preference is set', () => {
            mockReducedMotion = true;
            const { result } = renderHook(() => useCelebration());
            expect(result.current.isReducedMotion).toBe(true);
        });
    });

    describe('celebrate function', () => {
        it('should trigger default (quickSave) when no options provided', async () => {
            const { result } = renderHook(() => useCelebration());

            await act(async () => {
                await result.current.celebrate();
            });

            expect(triggerConfetti).toHaveBeenCalledWith('small', undefined);
            expect(triggerHaptic).toHaveBeenCalledWith('small');
        });

        it('should trigger preset when specified', async () => {
            const { result } = renderHook(() => useCelebration());

            await act(async () => {
                await result.current.celebrate({ preset: 'milestone' });
            });

            expect(triggerConfetti).toHaveBeenCalledWith('big', expect.any(Array));
            expect(triggerHaptic).toHaveBeenCalledWith('big');
        });

        it('should trigger custom config when specified', async () => {
            const { result } = renderHook(() => useCelebration());

            await act(async () => {
                await result.current.celebrate({
                    config: { type: 'big', confetti: true, haptic: false, sound: false },
                });
            });

            expect(triggerConfetti).toHaveBeenCalledWith('big', undefined);
            expect(triggerHaptic).not.toHaveBeenCalled();
        });

        it('should apply overrides to preset', async () => {
            const { result } = renderHook(() => useCelebration());

            await act(async () => {
                await result.current.celebrate({
                    preset: 'milestone',
                    overrides: { confetti: false },
                });
            });

            expect(triggerConfetti).not.toHaveBeenCalled();
            expect(triggerHaptic).toHaveBeenCalled();
        });

        it('should return result with triggered effects', async () => {
            const { result } = renderHook(() => useCelebration());

            let celebrationResult;
            await act(async () => {
                celebrationResult = await result.current.celebrate();
            });

            expect(celebrationResult).toEqual({
                confettiTriggered: true,
                hapticTriggered: true,
                soundPlayed: false,
                reducedMotionApplied: false,
            });
        });
    });

    describe('celebratePreset function', () => {
        it('should trigger milestone preset', async () => {
            const { result } = renderHook(() => useCelebration());

            await act(async () => {
                await result.current.celebratePreset('milestone');
            });

            expect(triggerConfetti).toHaveBeenCalledWith('big', expect.any(Array));
            expect(triggerHaptic).toHaveBeenCalledWith('big');
        });

        it('should trigger quickSave preset', async () => {
            const { result } = renderHook(() => useCelebration());

            await act(async () => {
                await result.current.celebratePreset('quickSave');
            });

            expect(triggerConfetti).toHaveBeenCalledWith('small', undefined);
            expect(triggerHaptic).toHaveBeenCalledWith('small');
        });
    });

    describe('celebrateCustom function', () => {
        it('should trigger custom configuration', async () => {
            const { result } = renderHook(() => useCelebration());

            await act(async () => {
                await result.current.celebrateCustom({
                    type: 'big',
                    confetti: true,
                    haptic: true,
                    sound: false,
                });
            });

            expect(triggerConfetti).toHaveBeenCalledWith('big', undefined);
            expect(triggerHaptic).toHaveBeenCalledWith('big');
            expect(playCelebrationSound).not.toHaveBeenCalled();
        });
    });

    describe('sound behavior', () => {
        it('should not play sound when soundEnabled is false (default)', async () => {
            const { result } = renderHook(() => useCelebration());

            await act(async () => {
                await result.current.celebratePreset('milestone');
            });

            expect(playCelebrationSound).not.toHaveBeenCalled();
        });

        it('should play sound when soundEnabled is true and preset has sound', async () => {
            const { result } = renderHook(() => useCelebration({ soundEnabled: true }));

            await act(async () => {
                await result.current.celebratePreset('milestone');
            });

            expect(playCelebrationSound).toHaveBeenCalledWith('big', true);
        });

        it('should not play sound for presets without sound even when enabled', async () => {
            const { result } = renderHook(() => useCelebration({ soundEnabled: true }));

            await act(async () => {
                await result.current.celebratePreset('quickSave');
            });

            expect(playCelebrationSound).not.toHaveBeenCalled();
        });

        it('should return soundPlayed status in result', async () => {
            const { result } = renderHook(() => useCelebration({ soundEnabled: true }));

            let celebrationResult;
            await act(async () => {
                celebrationResult = await result.current.celebratePreset('milestone');
            });

            expect(celebrationResult).toHaveProperty('soundPlayed', true);
        });
    });

    describe('reduced motion support (AC#6)', () => {
        beforeEach(() => {
            mockReducedMotion = true;
        });

        it('should skip confetti when reduced motion is preferred', async () => {
            const { result } = renderHook(() => useCelebration());

            await act(async () => {
                await result.current.celebrate();
            });

            expect(triggerConfetti).not.toHaveBeenCalled();
        });

        it('should still trigger haptic when reduced motion is preferred', async () => {
            const { result } = renderHook(() => useCelebration());

            await act(async () => {
                await result.current.celebrate();
            });

            expect(triggerHaptic).toHaveBeenCalled();
        });

        it('should still play sound when reduced motion is preferred and sound enabled', async () => {
            const { result } = renderHook(() => useCelebration({ soundEnabled: true }));

            await act(async () => {
                await result.current.celebratePreset('milestone');
            });

            expect(playCelebrationSound).toHaveBeenCalled();
        });

        it('should return reducedMotionApplied in result', async () => {
            const { result } = renderHook(() => useCelebration());

            let celebrationResult;
            await act(async () => {
                celebrationResult = await result.current.celebrate();
            });

            expect(celebrationResult).toHaveProperty('reducedMotionApplied', true);
        });

        it('should return confettiTriggered as false with reduced motion', async () => {
            const { result } = renderHook(() => useCelebration());

            let celebrationResult;
            await act(async () => {
                celebrationResult = await result.current.celebrate();
            });

            expect(celebrationResult).toHaveProperty('confettiTriggered', false);
        });
    });
});
