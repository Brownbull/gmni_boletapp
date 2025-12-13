/**
 * Confetti celebration effects
 * Story 9.6: Positive feedback for merchant learning
 */

import confetti from 'canvas-confetti'

/**
 * Fire a celebratory confetti burst
 * Used when user saves a new merchant mapping
 */
export function celebrateSuccess(): void {
    // Quick burst of confetti from center
    confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#22c55e', '#f59e0b'],
        disableForReducedMotion: true, // Accessibility: respect user preferences
    })
}

/**
 * Fire confetti from both sides (bigger celebration)
 * Can be used for major achievements
 */
export function celebrateBig(): void {
    const count = 150
    const defaults = {
        origin: { y: 0.7 },
        disableForReducedMotion: true,
    }

    function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
        })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
}
