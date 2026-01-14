/**
 * Tests for celebration sound effects utilities
 *
 * Story 14.18: Celebration System
 * Epic 14: Core Implementation
 *
 * Tests:
 * - AC#4: Optional sound effects
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    isAudioAvailable,
    playCelebrationSound,
    preloadCelebrationSounds,
    stopCelebrationSounds,
    clearAudioCache,
} from '../../../src/utils/celebrationSounds';

describe('celebrationSounds utilities', () => {
    let mockAudioInstances: MockAudio[];

    interface MockAudio {
        src: string;
        preload: string;
        volume: number;
        currentTime: number;
        play: ReturnType<typeof vi.fn>;
        pause: ReturnType<typeof vi.fn>;
    }

    // Create a proper class that can be used with `new`
    function createMockAudioClass(instances: MockAudio[]) {
        return class MockAudio {
            src: string;
            preload: string = '';
            volume: number = 1;
            currentTime: number = 0;
            play = vi.fn(() => Promise.resolve());
            pause = vi.fn();

            constructor(src?: string) {
                this.src = src || '';
                instances.push(this);
            }
        };
    }

    beforeEach(() => {
        mockAudioInstances = [];
        const MockAudioClass = createMockAudioClass(mockAudioInstances);
        vi.stubGlobal('Audio', MockAudioClass);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        clearAudioCache();
    });

    describe('isAudioAvailable', () => {
        it('should return true when Audio is available', () => {
            expect(isAudioAvailable()).toBe(true);
        });

        it('should return false when Audio is undefined', () => {
            vi.stubGlobal('Audio', undefined);
            expect(isAudioAvailable()).toBe(false);
        });

        it('should return false when window is undefined', () => {
            vi.stubGlobal('window', undefined);
            expect(isAudioAvailable()).toBe(false);
        });
    });

    describe('playCelebrationSound', () => {
        it('should not play when soundEnabled is false', async () => {
            const result = await playCelebrationSound('small', false);

            expect(result).toBe(false);
            expect(mockAudioInstances.length).toBe(0);
        });

        it('should not play when audio is not available', async () => {
            vi.stubGlobal('Audio', undefined);

            const result = await playCelebrationSound('small', true);

            expect(result).toBe(false);
        });

        it('should play small celebration sound when enabled', async () => {
            const result = await playCelebrationSound('small', true);

            expect(result).toBe(true);
            expect(mockAudioInstances[0].src).toBe('/sounds/chime.mp3');
            expect(mockAudioInstances[0].play).toHaveBeenCalled();
        });

        it('should play big celebration sound when enabled', async () => {
            const result = await playCelebrationSound('big', true);

            expect(result).toBe(true);
            expect(mockAudioInstances[0].src).toBe('/sounds/triumph.mp3');
            expect(mockAudioInstances[0].play).toHaveBeenCalled();
        });

        it('should set volume to 0.5', async () => {
            await playCelebrationSound('small', true);

            expect(mockAudioInstances[0].volume).toBe(0.5);
        });

        it('should reset currentTime before playing', async () => {
            await playCelebrationSound('small', true);
            mockAudioInstances[0].currentTime = 5;

            await playCelebrationSound('small', true);

            expect(mockAudioInstances[0].currentTime).toBe(0);
        });

        it('should cache audio elements', async () => {
            await playCelebrationSound('small', true);
            await playCelebrationSound('small', true);

            // Should reuse the cached instance
            expect(mockAudioInstances.length).toBe(1);
            expect(mockAudioInstances[0].play).toHaveBeenCalledTimes(2);
        });

        it('should return false when play() fails', async () => {
            // Create a failing Audio mock class
            const FailingAudioClass = class {
                src: string = '';
                preload: string = '';
                volume: number = 1;
                currentTime: number = 0;
                play = vi.fn(() => Promise.reject(new Error('Autoplay blocked')));
                pause = vi.fn();
            };
            vi.stubGlobal('Audio', FailingAudioClass);
            // Clear cache to ensure the new class is used
            clearAudioCache();

            const result = await playCelebrationSound('small', true);

            expect(result).toBe(false);
        });
    });

    describe('preloadCelebrationSounds', () => {
        it('should create audio elements for both types', () => {
            preloadCelebrationSounds();

            expect(mockAudioInstances.length).toBe(2);
            expect(mockAudioInstances.map(a => a.src)).toEqual([
                '/sounds/chime.mp3',
                '/sounds/triumph.mp3',
            ]);
        });

        it('should set preload to auto', () => {
            preloadCelebrationSounds();

            expect(mockAudioInstances.every(a => a.preload === 'auto')).toBe(true);
        });

        it('should set volume to 0.5', () => {
            preloadCelebrationSounds();

            expect(mockAudioInstances.every(a => a.volume === 0.5)).toBe(true);
        });

        it('should not recreate if called twice', () => {
            preloadCelebrationSounds();
            preloadCelebrationSounds();

            expect(mockAudioInstances.length).toBe(2);
        });

        it('should not create audio when not available', () => {
            vi.stubGlobal('Audio', undefined);

            preloadCelebrationSounds();

            expect(mockAudioInstances.length).toBe(0);
        });
    });

    describe('stopCelebrationSounds', () => {
        it('should pause all cached sounds', async () => {
            await playCelebrationSound('small', true);
            await playCelebrationSound('big', true);

            stopCelebrationSounds();

            mockAudioInstances.forEach(audio => {
                expect(audio.pause).toHaveBeenCalled();
                expect(audio.currentTime).toBe(0);
            });
        });

        it('should not throw when no sounds cached', () => {
            expect(() => stopCelebrationSounds()).not.toThrow();
        });
    });

    describe('clearAudioCache', () => {
        it('should stop sounds before clearing', async () => {
            await playCelebrationSound('small', true);
            const pauseFn = mockAudioInstances[0].pause;

            clearAudioCache();

            expect(pauseFn).toHaveBeenCalled();
        });

        it('should clear the cache', async () => {
            await playCelebrationSound('small', true);
            clearAudioCache();

            await playCelebrationSound('small', true);

            // Should create a new instance after clearing
            expect(mockAudioInstances.length).toBe(2);
        });
    });
});
