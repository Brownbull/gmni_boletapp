/**
 * Tests for CelebrationTrigger and SuccessIndicator components
 *
 * Story 14.18: Celebration System
 * Epic 14: Core Implementation
 *
 * Tests:
 * - AC#1: CelebrationTrigger orchestrates effects
 * - AC#6: Reduced motion support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import {
    CelebrationTrigger,
    SuccessIndicator,
    type CelebrationTriggerHandle,
} from '../../../../src/components/celebrations/CelebrationTrigger';

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
    isHapticAvailable: vi.fn(() => true),
}));

vi.mock('../../../../src/utils/celebrationSounds', () => ({
    playCelebrationSound: vi.fn(() => Promise.resolve(true)),
    isAudioAvailable: vi.fn(() => true),
    preloadCelebrationSounds: vi.fn(),
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

describe('CelebrationTrigger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockReducedMotion = false;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('declarative trigger (via props)', () => {
        it('should trigger celebration when trigger prop changes from false to true', async () => {
            const onCelebrate = vi.fn();
            const { rerender } = render(
                <CelebrationTrigger
                    preset="quickSave"
                    trigger={false}
                    onCelebrate={onCelebrate}
                />
            );

            // No celebration yet
            expect(triggerConfetti).not.toHaveBeenCalled();

            // Trigger celebration
            rerender(
                <CelebrationTrigger
                    preset="quickSave"
                    trigger={true}
                    onCelebrate={onCelebrate}
                />
            );

            await waitFor(() => {
                expect(triggerConfetti).toHaveBeenCalledWith('small', undefined);
                expect(triggerHaptic).toHaveBeenCalledWith('small');
            });
        });

        it('should call onCelebrate callback with result', async () => {
            const onCelebrate = vi.fn();
            const { rerender } = render(
                <CelebrationTrigger trigger={false} onCelebrate={onCelebrate} />
            );

            rerender(
                <CelebrationTrigger trigger={true} onCelebrate={onCelebrate} />
            );

            await waitFor(() => {
                expect(onCelebrate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        confettiTriggered: true,
                        hapticTriggered: true,
                    })
                );
            });
        });

        it('should use different presets correctly', async () => {
            const { rerender } = render(
                <CelebrationTrigger preset="milestone" trigger={false} />
            );

            rerender(<CelebrationTrigger preset="milestone" trigger={true} />);

            await waitFor(() => {
                // Milestone is 'big' type
                expect(triggerConfetti).toHaveBeenCalledWith('big', expect.any(Array));
                expect(triggerHaptic).toHaveBeenCalledWith('big');
            });
        });

        it('should not trigger again on repeated true values', async () => {
            const { rerender } = render(
                <CelebrationTrigger trigger={false} />
            );

            rerender(<CelebrationTrigger trigger={true} />);
            await waitFor(() => expect(triggerConfetti).toHaveBeenCalled());

            vi.clearAllMocks();

            // Same value, should not trigger again
            rerender(<CelebrationTrigger trigger={true} />);
            expect(triggerConfetti).not.toHaveBeenCalled();
        });
    });

    describe('imperative trigger (via ref)', () => {
        it('should expose celebrate method via ref', async () => {
            const ref = createRef<CelebrationTriggerHandle>();
            render(<CelebrationTrigger ref={ref} />);

            expect(ref.current).toBeDefined();
            expect(ref.current?.celebrate).toBeDefined();

            await act(async () => {
                await ref.current?.celebrate();
            });

            expect(triggerConfetti).toHaveBeenCalled();
            expect(triggerHaptic).toHaveBeenCalled();
        });

        it('should expose celebratePreset method via ref', async () => {
            const ref = createRef<CelebrationTriggerHandle>();
            render(<CelebrationTrigger ref={ref} />);

            await act(async () => {
                await ref.current?.celebratePreset('personalRecord');
            });

            // personalRecord is 'big' type
            expect(triggerConfetti).toHaveBeenCalledWith('big', expect.any(Array));
            expect(triggerHaptic).toHaveBeenCalledWith('big');
        });

        it('should expose isReducedMotion status via ref', () => {
            const ref = createRef<CelebrationTriggerHandle>();
            render(<CelebrationTrigger ref={ref} />);

            expect(ref.current?.isReducedMotion).toBe(false);
        });
    });

    describe('disable props', () => {
        it('should respect disableConfetti prop', async () => {
            const { rerender } = render(
                <CelebrationTrigger trigger={false} disableConfetti />
            );

            rerender(<CelebrationTrigger trigger={true} disableConfetti />);

            await waitFor(() => {
                expect(triggerConfetti).not.toHaveBeenCalled();
                expect(triggerHaptic).toHaveBeenCalled();
            });
        });

        it('should respect disableHaptic prop', async () => {
            const { rerender } = render(
                <CelebrationTrigger trigger={false} disableHaptic />
            );

            rerender(<CelebrationTrigger trigger={true} disableHaptic />);

            await waitFor(() => {
                expect(triggerConfetti).toHaveBeenCalled();
                expect(triggerHaptic).not.toHaveBeenCalled();
            });
        });

        it('should respect disableSound prop', async () => {
            const { rerender } = render(
                <CelebrationTrigger
                    trigger={false}
                    preset="milestone"
                    soundEnabled={true}
                    disableSound
                />
            );

            rerender(
                <CelebrationTrigger
                    trigger={true}
                    preset="milestone"
                    soundEnabled={true}
                    disableSound
                />
            );

            await waitFor(() => {
                expect(playCelebrationSound).not.toHaveBeenCalled();
            });
        });
    });

    describe('sound behavior', () => {
        it('should not play sound by default (soundEnabled=false)', async () => {
            const { rerender } = render(
                <CelebrationTrigger trigger={false} preset="milestone" />
            );

            rerender(<CelebrationTrigger trigger={true} preset="milestone" />);

            await waitFor(() => {
                expect(playCelebrationSound).not.toHaveBeenCalled();
            });
        });

        it('should play sound when soundEnabled=true and preset has sound', async () => {
            const { rerender } = render(
                <CelebrationTrigger
                    trigger={false}
                    preset="milestone"
                    soundEnabled={true}
                />
            );

            rerender(
                <CelebrationTrigger
                    trigger={true}
                    preset="milestone"
                    soundEnabled={true}
                />
            );

            await waitFor(() => {
                expect(playCelebrationSound).toHaveBeenCalledWith('big', true);
            });
        });

        it('should not play sound for presets without sound even when enabled', async () => {
            const { rerender } = render(
                <CelebrationTrigger
                    trigger={false}
                    preset="quickSave" // quickSave has sound: false
                    soundEnabled={true}
                />
            );

            rerender(
                <CelebrationTrigger
                    trigger={true}
                    preset="quickSave"
                    soundEnabled={true}
                />
            );

            await waitFor(() => {
                expect(playCelebrationSound).not.toHaveBeenCalled();
            });
        });
    });

    describe('reduced motion support (AC#6)', () => {
        it('should skip confetti when reduced motion is preferred', async () => {
            mockReducedMotion = true;

            const onCelebrate = vi.fn();
            const { rerender } = render(
                <CelebrationTrigger trigger={false} onCelebrate={onCelebrate} />
            );

            rerender(<CelebrationTrigger trigger={true} onCelebrate={onCelebrate} />);

            await waitFor(() => {
                // Confetti should NOT be triggered
                expect(triggerConfetti).not.toHaveBeenCalled();

                // But haptic should still work
                expect(triggerHaptic).toHaveBeenCalled();

                // Result should indicate reduced motion was applied
                expect(onCelebrate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        confettiTriggered: false,
                        hapticTriggered: true,
                        reducedMotionApplied: true,
                    })
                );
            });
        });

        it('should still provide haptic feedback with reduced motion', async () => {
            mockReducedMotion = true;

            const ref = createRef<CelebrationTriggerHandle>();
            render(<CelebrationTrigger ref={ref} />);

            await act(async () => {
                await ref.current?.celebrate();
            });

            expect(triggerHaptic).toHaveBeenCalled();
        });

        it('should still play sound with reduced motion when enabled', async () => {
            mockReducedMotion = true;

            const { rerender } = render(
                <CelebrationTrigger
                    trigger={false}
                    preset="milestone"
                    soundEnabled={true}
                />
            );

            rerender(
                <CelebrationTrigger
                    trigger={true}
                    preset="milestone"
                    soundEnabled={true}
                />
            );

            await waitFor(() => {
                expect(playCelebrationSound).toHaveBeenCalled();
            });
        });
    });

    describe('component rendering', () => {
        it('should render nothing (null)', () => {
            const { container } = render(<CelebrationTrigger />);
            expect(container.firstChild).toBeNull();
        });
    });
});

describe('SuccessIndicator', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockReducedMotion = false;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should not render when show is false', () => {
        render(<SuccessIndicator show={false} />);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should render when show is true', () => {
        render(<SuccessIndicator show={true} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should display custom message', () => {
        render(<SuccessIndicator show={true} message="🎉" />);
        expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should call onHide after duration', () => {
        const onHide = vi.fn();
        render(<SuccessIndicator show={true} duration={2000} onHide={onHide} />);

        expect(onHide).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(onHide).toHaveBeenCalled();
    });

    it('should use default duration of 2000ms', () => {
        const onHide = vi.fn();
        render(<SuccessIndicator show={true} onHide={onHide} />);

        act(() => {
            vi.advanceTimersByTime(1999);
        });
        expect(onHide).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(onHide).toHaveBeenCalled();
    });

    it('should have accessible role and aria-live', () => {
        render(<SuccessIndicator show={true} />);
        const indicator = screen.getByRole('status');
        expect(indicator).toHaveAttribute('aria-live', 'polite');
    });
});
