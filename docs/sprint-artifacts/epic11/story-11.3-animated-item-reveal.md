# Story 11.3: Animated Item Reveal

**Epic:** Epic 11 - Quick Save & Scan Flow Optimization
**Status:** Done
**Story Points:** 3
**Dependencies:** Story 11.2 (Quick Save Card Component)
**Parallel With:** Story 11.4 (Trust Merchant System)
**Tech Context:** [tech-context-epic11.md](./tech-context-epic11.md)

---

## User Story

As a **user**,
I want **to see receipt items appear progressively with animation**,
So that **the scanning process feels dynamic and I can verify extraction accuracy**.

---

## Acceptance Criteria

- [x] **AC #1:** Items appear one-by-one with staggered animation
- [x] **AC #2:** Animation timing: 100ms stagger between items
- [x] **AC #3:** Each item fades in and slides up
- [x] **AC #4:** Total and merchant appear first, items follow
- [x] **AC #5:** Animation completes within 2 seconds for typical receipts (10-20 items)
- [x] **AC #6:** Respects `prefers-reduced-motion` setting
- [x] **AC #7:** User can scroll during animation if list is long
- [x] **AC #8:** Animation doesn't block user interaction

---

## Tasks / Subtasks

### Task 1: Create Staggered Animation Utility (0.5h)
- [x] Create `src/hooks/useStaggeredReveal.ts`
- [x] Implement `useStaggeredReveal` hook:
  ```typescript
  const { visibleItems, isComplete } = useStaggeredReveal(items, {
    staggerMs: 100,
    initialDelayMs: 300
  });
  ```
- [x] Handle empty arrays
- [x] Handle mid-animation updates (new items added)

### Task 2: Create Item Reveal Animation Component (1h)
- [x] Create `src/components/AnimatedItem.tsx`
- [x] Animation properties:
  - Initial: `opacity: 0, translateY: 20px`
  - Final: `opacity: 1, translateY: 0`
  - Duration: 200ms
  - Easing: ease-out
- [x] Support custom children content
- [x] Accept delay prop for staggering

### Task 3: Integrate Animation into Quick Save Card (0.5h)
- [x] Show merchant + total immediately
- [x] Items list with staggered reveal
- [x] Category appears with final item
- [x] Buttons appear after items complete

### Task 4: Integrate Animation into Edit View (0.5h)
- [x] Apply same animation to Edit view item list
- [x] Ensure animation only plays on initial load (not edits)
- [x] Support reordering without animation

### Task 5: Implement Motion Preference Check (0.25h)
- [x] Create `useReducedMotion` hook
- [x] Check `prefers-reduced-motion` media query
- [x] When reduced: show all items immediately (no animation)
- [ ] Option in Settings to override (deferred - not in story scope)

### Task 6: Performance Optimization (0.25h)
- [x] Ensure animations use GPU-accelerated properties (transform, opacity)
- [x] Avoid layout thrashing
- [x] Test with 50+ items (maxDurationMs caps animation time)
- [x] Profile animation frame rate

### Task 7: Testing (0.5h)
- [x] Unit tests for staggered reveal hook
- [x] Unit tests for AnimatedItem component
- [x] Test reduced motion behavior
- [x] Test with varying item counts (1, 10, 50)

---

## Technical Summary

The animated item reveal creates a sense of progress and activity during the scan result display. Items appearing one-by-one helps users verify accuracy and creates a more engaging experience than a static list.

**Animation Sequence:**
```
t=0ms:     Header (Merchant + Total) appears
t=300ms:   First item fades in
t=400ms:   Second item fades in
t=500ms:   Third item fades in
...
t=N*100ms: Last item fades in
t=N*100+200ms: Buttons appear
```

**Performance Considerations:**
- Use CSS transforms (GPU-accelerated)
- Avoid JavaScript-driven animations where CSS suffices
- Cap animation duration for long lists

---

## Project Structure Notes

- **Files to create:**
  - `src/components/AnimatedItem.tsx`
  - `src/hooks/useStaggeredReveal.ts`
  - `src/hooks/useReducedMotion.ts`

- **Files to modify:**
  - `src/components/QuickSaveCard.tsx` - Apply animation
  - `src/views/EditView.tsx` - Apply animation
  - `src/utils/animations.ts` (create if needed)

- **Estimated effort:** 3 story points (~5 hours)
- **Prerequisites:** Story 11.2 (Quick Save Card)

---

## Key Code References

**Staggered Reveal Hook:**
```typescript
// src/hooks/useStaggeredReveal.ts
export function useStaggeredReveal<T>(
  items: T[],
  options: { staggerMs: number; initialDelayMs: number }
) {
  const [visibleCount, setVisibleCount] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(items.length);
      return;
    }

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setVisibleCount(prev => {
          if (prev >= items.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, options.staggerMs);

      return () => clearInterval(interval);
    }, options.initialDelayMs);

    return () => clearTimeout(timeout);
  }, [items.length, options, reducedMotion]);

  return {
    visibleItems: items.slice(0, visibleCount),
    isComplete: visibleCount >= items.length
  };
}
```

**Animated Item Component:**
```typescript
// src/components/AnimatedItem.tsx
export function AnimatedItem({
  children,
  delay = 0,
  className = ''
}: AnimatedItemProps) {
  return (
    <div
      className={`animate-item-reveal ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// CSS
@keyframes item-reveal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-item-reveal {
  animation: item-reveal 200ms ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-item-reveal {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

---

## UI Specifications

**Animation Timing:**
- Initial delay: 300ms (let header render)
- Stagger: 100ms between items
- Item animation: 200ms
- Max total animation: 2500ms (cap at 20 items visible before scroll)

**Visual Effect:**
- Fade in: 0% → 100% opacity
- Slide up: 20px → 0px translateY
- Easing: ease-out

---

## Context References

**Research:** [some ui options.md](../../uxui/research/some%20ui%20options.md) - Animation timing specifications

---

## Definition of Done

- [x] All 8 acceptance criteria verified
- [x] Items animate in staggered sequence
- [x] Reduced motion preference respected
- [x] Animation smooth (60fps via GPU-accelerated transforms)
- [x] Long lists handle gracefully (maxDurationMs cap)
- [x] Tests passing (2474 tests)
- [x] Code review approved

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 via Claude Code

### Completion Notes
Story 11.3 implemented with all 8 acceptance criteria met:

1. **Staggered Animation Hook** (`useStaggeredReveal`): Progressively reveals items with configurable timing (100ms stagger, 300ms initial delay). Automatically adjusts stagger time for long lists to fit within maxDurationMs (2500ms default).

2. **AnimatedItem Component**: Wrapper that applies fade-in + slide-up animation using CSS keyframes. Uses GPU-accelerated transforms for smooth 60fps.

3. **Reduced Motion Support** (`useReducedMotion`): Detects `prefers-reduced-motion` and shows all items immediately when enabled. Subscribes to live preference changes.

4. **Integration**: Both QuickSaveCard and EditView support optional animated item reveals. EditView animation only plays on initial load, not on subsequent edits.

5. **Performance**: CSS-only animations with `will-change` hints. Long lists (50+ items) automatically compress timing to stay within 2.5s.

### Files Created
- `src/hooks/useReducedMotion.ts` - Motion preference detection hook
- `src/hooks/useStaggeredReveal.ts` - Staggered animation timing hook
- `src/components/AnimatedItem.tsx` - Animated wrapper component
- `tests/unit/hooks/useReducedMotion.test.ts` - 7 tests
- `tests/unit/hooks/useStaggeredReveal.test.ts` - 12 tests
- `tests/unit/components/AnimatedItem.test.tsx` - 15 tests

### Files Modified
- `index.html` - Added `@keyframes item-reveal` and CSS class
- `src/views/EditView.tsx` - Added optional animated item reveal
- `src/App.tsx` - Added `animateEditViewItems` state and integration

### Integration Note
QuickSaveCard (`src/components/scan/QuickSaveCard.tsx`) was created in Story 11.2 and uses the animation components from this story.

### Test Results
- All 2474 unit tests passing
- TypeScript compilation: No errors
- New tests added: 34 tests for animation functionality

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 11 definition |
| 2025-12-21 | 1.1 | Story implemented - Code Complete |
| 2025-12-21 | 1.2 | Code review: Fixed EditView animation wiring in App.tsx |
