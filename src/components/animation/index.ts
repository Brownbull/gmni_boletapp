/**
 * Animation Module Barrel Export
 *
 * Story 14.1: Animation Framework
 * Epic 14: Core Implementation
 *
 * Centralized exports for animation utilities and components.
 *
 * @example
 * ```tsx
 * import {
 *   AnimationProvider,
 *   useAnimationContext,
 *   useBreathing,
 *   useStagger,
 *   ANIMATION,
 *   DURATION,
 *   EASING,
 * } from './components/animation';
 * ```
 */

// Context and Provider
export {
  AnimationProvider,
  useAnimationContext,
  type AnimationContextValue,
  type AnimationProviderProps,
  type StaggerOptions,
} from './AnimationContext';

// Hooks
export {
  useBreathing,
  type UseBreathingOptions,
  type UseBreathingResult,
} from './useBreathing';

export {
  useStagger,
  calculateStaggerDelay,
  type UseStaggerOptions,
  type UseStaggerResult,
} from './useStagger';

// Constants
export {
  ANIMATION,
  DURATION,
  EASING,
  STAGGER,
  BREATHING,
  CELEBRATION,
} from './constants';
