# Motion Design System: "Everything Breathes"

**Created:** 2025-12-23
**Epic:** 13 - UX Design & Mockups
**Story:** 13.3 - Motion Design System Spec
**Status:** Complete
**Author:** Gabe

---

## Implementation Status Legend

| Status | Meaning |
|--------|---------|
| 🟢 **CURRENT** | Already implemented (Epic 11) - ready for testing |
| 🟡 **FUTURE** | To be implemented (Epic 14) - design spec only |

---

## Executive Summary

The Boletapp motion design system transforms the app from a static tool into a living financial companion. Every animation has purpose: to orient, delight, or celebrate. The system is built on three principles:

1. **Purposeful motion** - Every animation serves user understanding
2. **Accessible by default** - Respects `prefers-reduced-motion` throughout
3. **Performant first** - GPU-accelerated transforms, minimal repaints

---

## 1. Animation Categories

### 1.1 Timing Curves

| Curve Name | CSS Value | Use Case | Character |
|------------|-----------|----------|-----------|
| **ease-out** | `cubic-bezier(0, 0, 0.2, 1)` | Entrances, reveals | Fast start, gentle landing |
| **ease-in-out** | `cubic-bezier(0.4, 0, 0.2, 1)` | Breathing, looping | Smooth, organic |
| **ease-in** | `cubic-bezier(0.4, 0, 1, 1)` | Exits, dismissals | Accelerating away |
| **spring** | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Celebrations, bounces | Playful overshoot |
| **linear** | `linear` | Progress bars only | Mechanical, predictable |

### 1.2 Duration Scale

| Token | Duration | Use Case |
|-------|----------|----------|
| `--duration-instant` | 0ms | Settings screen, instant actions |
| `--duration-fast` | 100ms | Micro-interactions, focus states |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Modal entrances, complex reveals |
| `--duration-slower` | 400-500ms | Full-screen transitions, count-ups |
| `--duration-breathing` | 3000ms | Idle breathing animations |
| `--duration-celebration` | 500-1000ms | Achievements, confetti |

### 1.3 Animation Categories Table

| Category | Duration | Easing | Use Case | Interactive | Status |
|----------|----------|--------|----------|-------------|--------|
| **Navigation transitions** | 200-300ms | ease-out | Screen changes | Yes | 🟡 FUTURE |
| **Breathing effects** | 2-4s cycle | ease-in-out | Polygon, key metrics | No | 🟡 FUTURE |
| **Count-up animations** | 300-500ms | ease-out | Money amounts on load | No | 🟡 FUTURE |
| **Progressive reveal** | 100ms stagger | ease-out | List items, scan results | No | 🟢 CURRENT |
| **Celebration** | 500-1000ms | spring | Achievements, milestones | No | 🟡 FUTURE |
| **Micro-interactions** | 100-150ms | ease-out | Button presses, toggles | Yes | 🟢 CURRENT |

> **Note:** Progressive reveal uses 100ms stagger per existing Epic 11.3 implementation. The 50ms value in UX spec Section 10.3 is a future optimization target.

---

## 2. Screen Transition Patterns

### 2.1 Transition Matrix

| From | To | Animation | Duration | CSS Example |
|------|-----|-----------|----------|-------------|
| Any | Settings | **None (instant)** | 0ms | No animation |
| Home | Analytics | Slide left + stagger | 250ms | `transform: translateX(-100%)` |
| Analytics | Drill-down | Slide left | 200ms | `transform: translateX(-100%)` |
| Drill-down | Back | Slide right | 200ms | `transform: translateX(100%)` |
| Any | Scan | Modal slide up | 300ms | `transform: translateY(100%)` |
| Scan | Result | Crossfade + reveal | 400ms | Combined opacity + stagger |
| Tab | Tab | Fade crossfade | 150ms | `opacity: 0 → 1` |

### 2.2 Slide Transition Implementation

```css
/* Base slide transition */
.screen-transition {
  will-change: transform, opacity;
}

/* Slide Left (entering from right) */
@keyframes slideInLeft {
  from {
    transform: translateX(100%);
    opacity: 0.8;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in-left {
  animation: slideInLeft 250ms cubic-bezier(0, 0, 0.2, 1) forwards;
}

/* Slide Right (entering from left / back navigation) */
@keyframes slideInRight {
  from {
    transform: translateX(-100%);
    opacity: 0.8;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.slide-in-right {
  animation: slideInRight 200ms cubic-bezier(0, 0, 0.2, 1) forwards;
}

/* Exit variants */
@keyframes slideOutLeft {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0.8;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0.8;
  }
}
```

### 2.3 Modal Transition Implementation

```css
/* Modal slide up (for Scan overlay) */
@keyframes modalSlideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-slide-up {
  animation: modalSlideUp 300ms cubic-bezier(0, 0, 0.2, 1) forwards;
}

/* Modal slide down (dismiss) */
@keyframes modalSlideDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}

.modal-slide-down {
  animation: modalSlideDown 250ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

/* Backdrop fade */
@keyframes backdropFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-backdrop {
  animation: backdropFadeIn 200ms ease-out forwards;
  background: rgba(0, 0, 0, 0.5);
}
```

### 2.4 Crossfade Transition

```css
/* Crossfade (for Scan → Result, tab switches) */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.crossfade-enter {
  animation: fadeIn 200ms ease-out forwards;
}

.crossfade-exit {
  animation: fadeOut 150ms ease-in forwards;
  position: absolute;
}
```

---

## 3. Breathing Effects Specification

### 3.1 Polygon Breathing

The spending polygon on the Home Dashboard breathes subtly to indicate "aliveness" without distracting.

```css
/* Primary breathing animation for polygon */
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.02);
    opacity: 1;
  }
}

.polygon-breathing {
  animation: breathe 3s ease-in-out infinite;
  transform-origin: center center;
  will-change: transform, opacity;
}

/* Reduced motion: static state */
@media (prefers-reduced-motion: reduce) {
  .polygon-breathing {
    animation: none;
    transform: scale(1);
    opacity: 1;
  }
}
```

**Parameters:**
- **Duration:** 3 seconds per cycle
- **Scale amplitude:** 1.00 → 1.02 → 1.00 (2% growth)
- **Opacity amplitude:** 0.9 → 1.0 → 0.9
- **Easing:** ease-in-out (smooth sine wave feel)
- **Infinite:** Continuous loop while visible

### 3.2 Key Metrics Breathing

Subtle breathing for important numbers (total amount, goal progress).

```css
@keyframes subtleBreath {
  0%, 100% {
    opacity: 0.95;
  }
  50% {
    opacity: 1;
  }
}

.metric-breathing {
  animation: subtleBreath 4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .metric-breathing {
    animation: none;
    opacity: 1;
  }
}
```

**Parameters:**
- **Duration:** 4 seconds (slower than polygon for hierarchy)
- **Scale:** None (only opacity)
- **Opacity amplitude:** 0.95 → 1.0 → 0.95 (5% change)

### 3.3 Loading Pulse

For skeleton screens and loading states.

```css
@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.7;
  }
}

.skeleton-pulse {
  animation: pulse 1.5s ease-in-out infinite;
  background: linear-gradient(90deg, var(--color-skeleton) 0%, var(--color-skeleton-highlight) 50%, var(--color-skeleton) 100%);
  background-size: 200% 100%;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-pulse {
    animation: none;
    opacity: 0.5;
  }
}
```

---

## 4. Progressive Reveal (Staggered Entry) 🟢 CURRENT

> **Implementation Status:** This pattern is already implemented in Epic 11.3. See existing code:
> - `src/hooks/useStaggeredReveal.ts` - Timing logic
> - `src/hooks/useReducedMotion.ts` - Accessibility hook
> - `src/components/AnimatedItem.tsx` - Wrapper component

### 4.1 List Item Reveal

Used for scan results, transaction lists, drill-down cards.

```css
/* Base stagger animation (matches existing index.html) */
@keyframes staggerReveal {
  from {
    opacity: 0;
    transform: translateY(20px);  /* Matches AnimatedItem.tsx */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-item {
  opacity: 0;
  animation: staggerReveal 200ms cubic-bezier(0, 0, 0.2, 1) forwards;
  will-change: transform, opacity;
}

/* Stagger timing via custom property (100ms per Epic 11.3) */
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 100ms; }
.stagger-item:nth-child(3) { animation-delay: 200ms; }
.stagger-item:nth-child(4) { animation-delay: 300ms; }
.stagger-item:nth-child(5) { animation-delay: 400ms; }
.stagger-item:nth-child(6) { animation-delay: 500ms; }
.stagger-item:nth-child(7) { animation-delay: 600ms; }
.stagger-item:nth-child(8) { animation-delay: 700ms; }
.stagger-item:nth-child(9) { animation-delay: 800ms; }
.stagger-item:nth-child(10) { animation-delay: 900ms; }

/* Cap at 1000ms for long lists (maxDurationMs handles compression) */
.stagger-item:nth-child(n+11) { animation-delay: 1000ms; }

@media (prefers-reduced-motion: reduce) {
  .stagger-item {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

**Parameters (per Epic 11.3 implementation):**
- **Stagger delay:** 100ms between items (default in useStaggeredReveal)
- **Initial delay:** 300ms before first item
- **Max total duration:** 2500ms (adjusts stagger for long lists)
- **Individual animation:** 200ms
- **Movement:** 20px vertical slide up
- **Easing:** ease-out

### 4.2 Dynamic Stagger Calculation (JavaScript)

For long lists, calculate stagger dynamically to cap total time:

```typescript
// Constants (aligned with useStaggeredReveal.ts defaults)
const STAGGER_DELAY_MS = 100;
const INITIAL_DELAY_MS = 300;
const INDIVIDUAL_DURATION_MS = 200;
const MAX_TOTAL_DURATION_MS = 2500;

/**
 * Calculate stagger delay for an item based on index and total count
 * Caps total animation time for very long lists
 */
export function calculateStaggerDelay(index: number, totalItems: number): number {
  if (totalItems <= 10) {
    return index * STAGGER_DELAY_MS;
  }

  // For long lists, compress stagger to fit within max duration
  const availableTime = MAX_TOTAL_DURATION_MS - INDIVIDUAL_DURATION_MS;
  const adjustedStagger = availableTime / (totalItems - 1);
  return Math.min(index * adjustedStagger, availableTime);
}

/**
 * Hook for animated item reveal (existing pattern from Epic 11.3)
 */
export function useAnimatedReveal(itemCount: number, enabled: boolean) {
  const [animationComplete, setAnimationComplete] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;

    const totalDuration = Math.min(
      itemCount * STAGGER_DELAY_MS + INDIVIDUAL_DURATION_MS,
      MAX_TOTAL_DURATION_MS
    );

    const timer = setTimeout(() => setAnimationComplete(true), totalDuration);
    return () => clearTimeout(timer);
  }, [itemCount, enabled]);

  return animationComplete;
}
```

---

## 5. Count-Up Animations 🟡 FUTURE

> **Implementation Note (Epic 14):** This hook does not exist yet and should be created during Epic 14 implementation. The `useReducedMotion` hook already exists at `src/hooks/useReducedMotion.ts`.

### 5.1 Money Amount Counter

Used when displaying totals on screen load.

```css
/* Counter container */
.amount-counter {
  font-variant-numeric: tabular-nums;
  will-change: contents;
}
```

```typescript
/**
 * Animated counter hook for money amounts
 * NEW HOOK - Create in Epic 14: src/hooks/useCountUp.ts
 */
export function useCountUp(
  targetValue: number,
  duration: number = 400,
  enabled: boolean = true
): number {
  const [displayValue, setDisplayValue] = useState(enabled ? 0 : targetValue);
  const prefersReducedMotion = useReducedMotion(); // Use existing hook

  useEffect(() => {
    // Skip animation if reduced motion preferred or disabled
    if (!enabled || prefersReducedMotion) {
      setDisplayValue(targetValue);
      return;
    }

    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration, enabled, prefersReducedMotion]);

  return displayValue;
}
```

**Parameters:**
- **Duration:** 400ms default
- **Easing:** Cubic ease-out
- **Font:** Tabular nums for stable width

---

## 6. Celebration Animations 🟡 FUTURE

### 6.1 Achievement Bounce

```css
@keyframes celebrationBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.celebration-bounce {
  animation: celebrationBounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@media (prefers-reduced-motion: reduce) {
  .celebration-bounce {
    animation: fadeIn 200ms ease-out forwards;
  }
}
```

### 6.2 Confetti Burst (CSS-only)

```css
@keyframes confettiFall {
  0% {
    transform: translateY(-100%) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.confetti-particle {
  position: fixed;
  width: 10px;
  height: 10px;
  animation: confettiFall 2s ease-in forwards;
  pointer-events: none;
}

.confetti-particle:nth-child(odd) {
  border-radius: 50%;
}

.confetti-particle:nth-child(even) {
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .confetti-particle {
    display: none;
  }
}
```

### 6.3 Personal Record Highlight

```css
@keyframes personalRecord {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

.personal-record {
  animation: personalRecord 1s ease-out 2;
}

@media (prefers-reduced-motion: reduce) {
  .personal-record {
    animation: none;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.5);
  }
}
```

---

## 7. Settings Exception

### 7.1 Instant Load Policy

The Settings screen loads **instantly with no animation**. This is intentional:

**Rationale:**
- Settings are utility-focused, not experiential
- Users expect immediate response for preferences
- Consistency with OS settings patterns (iOS, Android)
- Reduces perceived latency for frequently accessed page

**Implementation:**

```css
/* Settings screen - no transitions */
.settings-view {
  /* Override any parent transitions */
  animation: none !important;
  transition: none !important;
}

.settings-view * {
  /* Ensure no child animations on load */
  animation-delay: 0ms !important;
}
```

```typescript
// In navigation router/handler
const INSTANT_LOAD_SCREENS = ['settings'];

function navigateTo(screen: string) {
  const useAnimation = !INSTANT_LOAD_SCREENS.includes(screen);

  if (useAnimation) {
    // Apply standard transition
    applyTransition(screen);
  } else {
    // Immediate swap, no animation
    swapScreenImmediate(screen);
  }
}
```

### 7.2 Other Instant Actions

These actions should also feel instant (no delay):

| Action | Target Response | Implementation |
|--------|-----------------|----------------|
| Toggle switch | < 50ms | CSS transition only |
| Checkbox | < 50ms | CSS transition only |
| Button press feedback | < 100ms | Active state |
| Dropdown open | < 100ms | Scale transform |
| Dismiss gesture | < 150ms | Velocity-based |

---

## 8. Accessibility: `prefers-reduced-motion` 🟢 CURRENT

> **Implementation Status:** The `useReducedMotion` hook already exists at `src/hooks/useReducedMotion.ts` (Epic 11.3). All Epic 11 animations already respect this preference.

### 8.1 Core Requirements

All animations **must** respect the user's motion preference:

1. **Decorative animations**: Disabled entirely
2. **Functional animations**: Replaced with instant state changes
3. **Progress indicators**: Keep, but use opacity only
4. **Celebrations**: Simplified to fade-in

### 8.2 Global Fallback Pattern

```css
/* Global reduced motion reset */
@media (prefers-reduced-motion: reduce) {
  /* Disable all animations by default */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Re-enable essential opacity transitions */
  .transition-essential {
    transition-duration: 100ms !important;
    transition-property: opacity !important;
  }
}
```

### 8.3 Component-Level Fallbacks

Every animation class must have a reduced-motion fallback:

```css
/* Example: Stagger reveal */
.stagger-item {
  animation: staggerReveal 300ms ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .stagger-item {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

/* Example: Slide transition */
.slide-in-left {
  animation: slideInLeft 250ms ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .slide-in-left {
    animation: none;
    transform: none;
    opacity: 1;
  }
}

/* Example: Breathing */
.polygon-breathing {
  animation: breathe 3s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .polygon-breathing {
    animation: none;
    opacity: 1;
  }
}
```

### 8.4 JavaScript Detection 🟢 CURRENT

> **Existing Implementation:** `src/hooks/useReducedMotion.ts` - See actual code for browser compatibility (Safari 13 fallback).

```typescript
// Import the existing hook - DO NOT recreate
import { useReducedMotion } from '../hooks/useReducedMotion';

// Usage in components
function AnimatedComponent() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    // Show static version
    return <StaticContent />;
  }

  return <AnimatedContent />;
}
```

### 8.5 Testing Checklist

**Epic 11.3 (Tested - 7 unit tests passing):**
- [x] `useReducedMotion` hook detects and subscribes to preference changes
- [x] `AnimatedItem` component skips animation when reduced motion preferred
- [x] `useStaggeredReveal` shows all items immediately when reduced motion enabled

**Epic 14 (To Be Tested):**
- [ ] All new keyframe animations have `@media (prefers-reduced-motion: reduce)` fallback
- [ ] Infinite animations (breathing) are completely disabled
- [ ] Essential state changes still visible (opacity-based)
- [ ] No vestibular-triggering motion (rapid movement, parallax)
- [ ] Interactive elements remain functional without animation

---

## 9. Implementation Notes

### 9.1 CSS Custom Properties

Define animation tokens as CSS custom properties for consistency:

```css
:root {
  /* Durations */
  --motion-duration-instant: 0ms;
  --motion-duration-fast: 100ms;
  --motion-duration-normal: 200ms;
  --motion-duration-slow: 300ms;
  --motion-duration-slower: 400ms;
  --motion-duration-breathing: 3000ms;

  /* Easings */
  --motion-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --motion-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Stagger */
  --motion-stagger-delay: 50ms;
  --motion-stagger-max-total: 500ms;

  /* Breathing */
  --motion-breathe-scale: 1.02;
  --motion-breathe-opacity-min: 0.9;
}
```

### 9.2 Tailwind CSS Configuration 🟡 FUTURE

If using Tailwind (check project config), extend the config:

```typescript
// tailwind.config.ts (or .js if using CommonJS)
import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      animation: {
        'breathe': 'breathe 3s ease-in-out infinite',
        'slide-up': 'slideUp 200ms ease-out forwards',  // Aligned with Epic 11.3
        'slide-down': 'slideDown 250ms ease-in forwards',
        'stagger': 'staggerReveal 200ms ease-out forwards',  // Aligned with Epic 11.3
        'celebration': 'celebrationBounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.02)', opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },  // 20px per AnimatedItem.tsx
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        staggerReveal: {
          from: { transform: 'translateY(20px)', opacity: '0' },  // 20px per AnimatedItem.tsx
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        celebrationBounce: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
} satisfies Config;
```

### 9.3 Framer Motion Alternative

For complex orchestrated animations, Framer Motion provides cleaner APIs:

```typescript
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Reduced motion aware component
function PolygonBreathing() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : {
        scale: [1, 1.02, 1],
        opacity: [0.9, 1, 0.9],
      }}
      transition={{
        duration: 3,
        ease: 'easeInOut',
        repeat: Infinity,
      }}
    />
  );
}

// Stagger list
function StaggerList({ items }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : 0.05,
          },
        },
      }}
    >
      {items.map(item => (
        <motion.li
          key={item.id}
          variants={{
            hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.3 }}
        />
      ))}
    </motion.ul>
  );
}
```

### 9.4 Performance Guidelines

1. **Use `will-change` sparingly** - Only on elements that will animate
2. **Prefer `transform` and `opacity`** - GPU-accelerated, no repaints
3. **Avoid layout thrashing** - No animating width/height/margin
4. **Limit concurrent animations** - Max 5-10 simultaneous
5. **Clean up listeners** - Remove event listeners on unmount

```css
/* Good: GPU-accelerated */
.animated-element {
  will-change: transform, opacity;
  transform: translateX(0);
  opacity: 1;
}

/* Bad: Causes repaints */
.avoid-this {
  width: 100px; /* Don't animate */
  margin-left: 0; /* Don't animate */
  left: 0; /* Don't animate */
}
```

---

## 10. Quick Reference Card

### Timing Quick Reference

| Animation | Duration | Easing |
|-----------|----------|--------|
| Screen slide | 200-250ms | ease-out |
| Modal open | 300ms | ease-out |
| Modal close | 250ms | ease-in |
| Stagger delay | 50ms/item | - |
| Count-up | 400ms | ease-out |
| Breathing cycle | 3000ms | ease-in-out |
| Celebration | 600ms | spring |
| Micro-interaction | 100ms | ease-out |

### Fallback Quick Reference

| Animation Type | Reduced Motion Fallback |
|----------------|------------------------|
| Slide transitions | Instant swap |
| Fade transitions | 100ms opacity |
| Breathing | Static opacity: 1 |
| Stagger reveal | All items visible |
| Count-up | Show final value |
| Celebrations | Simple fade-in |
| Confetti | Hidden |

---

## Related Documents

**Epic 13 Design Documents:**
- [Voice & Tone Guidelines](./voice-tone-guidelines.md)
- [Use Cases E2E](./use-cases-e2e.md)
- [Epic 13 Tech Context](../sprint-artifacts/epic13/tech-context-epic13.md)

**Source Requirements:**
- [UX Design Specification - Section 10.3](../ux-design-specification.md#103-motion-design-system-everything-breathes)

**Existing Implementation (Epic 11.3):**
- Source: `src/hooks/useReducedMotion.ts`
- Source: `src/hooks/useStaggeredReveal.ts`
- Source: `src/components/AnimatedItem.tsx`
- Story: `docs/sprint-artifacts/epic11/story-11.3-animated-item-reveal.md`

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Initial motion design system specification |
| 2025-12-23 | 1.1 | Code review fixes: Added implementation status legend, aligned timing values with Epic 11.3, fixed testing checklist |

---

_This document establishes the "Everything Breathes" animation system for Boletapp. All animations are purposeful, accessible, and performant by design._
