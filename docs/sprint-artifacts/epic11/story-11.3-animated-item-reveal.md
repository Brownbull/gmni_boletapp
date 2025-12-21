# Story 11.3: Animated Item Reveal

**Epic:** Epic 11 - Quick Save & Scan Flow Optimization
**Status:** Ready for Dev
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

- [ ] **AC #1:** Items appear one-by-one with staggered animation
- [ ] **AC #2:** Animation timing: 100ms stagger between items
- [ ] **AC #3:** Each item fades in and slides up
- [ ] **AC #4:** Total and merchant appear first, items follow
- [ ] **AC #5:** Animation completes within 2 seconds for typical receipts (10-20 items)
- [ ] **AC #6:** Respects `prefers-reduced-motion` setting
- [ ] **AC #7:** User can scroll during animation if list is long
- [ ] **AC #8:** Animation doesn't block user interaction

---

## Tasks / Subtasks

### Task 1: Create Staggered Animation Utility (0.5h)
- [ ] Create `src/utils/animations.ts` (if not exists)
- [ ] Implement `useStaggeredReveal` hook:
  ```typescript
  const { visibleItems, isComplete } = useStaggeredReveal(items, {
    staggerMs: 100,
    initialDelayMs: 300
  });
  ```
- [ ] Handle empty arrays
- [ ] Handle mid-animation updates (new items added)

### Task 2: Create Item Reveal Animation Component (1h)
- [ ] Create `src/components/AnimatedItem.tsx`
- [ ] Animation properties:
  - Initial: `opacity: 0, translateY: 20px`
  - Final: `opacity: 1, translateY: 0`
  - Duration: 200ms
  - Easing: ease-out
- [ ] Support custom children content
- [ ] Accept delay prop for staggering

### Task 3: Integrate Animation into Quick Save Card (0.5h)
- [ ] Show merchant + total immediately
- [ ] Items list with staggered reveal
- [ ] Category appears with final item
- [ ] Buttons appear after items complete

### Task 4: Integrate Animation into Edit View (0.5h)
- [ ] Apply same animation to Edit view item list
- [ ] Ensure animation only plays on initial load (not edits)
- [ ] Support reordering without animation

### Task 5: Implement Motion Preference Check (0.25h)
- [ ] Create `useReducedMotion` hook
- [ ] Check `prefers-reduced-motion` media query
- [ ] When reduced: show all items immediately (no animation)
- [ ] Option in Settings to override

### Task 6: Performance Optimization (0.25h)
- [ ] Ensure animations use GPU-accelerated properties (transform, opacity)
- [ ] Avoid layout thrashing
- [ ] Test with 50+ items
- [ ] Profile animation frame rate

### Task 7: Testing (0.5h)
- [ ] Unit tests for staggered reveal hook
- [ ] Unit tests for AnimatedItem component
- [ ] Test reduced motion behavior
- [ ] Test with varying item counts (1, 10, 50)

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

- [ ] All 8 acceptance criteria verified
- [ ] Items animate in staggered sequence
- [ ] Reduced motion preference respected
- [ ] Animation smooth (60fps)
- [ ] Long lists handle gracefully
- [ ] Tests passing
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 11 definition |
