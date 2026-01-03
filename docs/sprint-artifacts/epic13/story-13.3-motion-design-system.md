# Story 13.3: Motion Design System Spec

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Done
**Story Points:** 3
**Type:** Documentation
**Dependencies:** None

---

## User Story

As a **developer implementing animations**,
I want **a detailed motion design specification**,
So that **all animations are consistent, purposeful, and accessible**.

---

## Acceptance Criteria

- [x] **AC #1:** Timing curves and durations documented for all animation types
- [x] **AC #2:** Screen transition patterns specified with CSS/keyframe examples
- [x] **AC #3:** Breathing effect specifications with exact parameters
- [x] **AC #4:** Settings exception documented (instant load)
- [x] **AC #5:** `prefers-reduced-motion` fallbacks defined for all animations

---

## Animation Categories

### Navigation Transitions
- **Duration:** 200-300ms
- **Easing:** ease-out
- **Use Case:** Screen changes
- **Pattern:** Staggered entry for lists

### Breathing Effects
- **Duration:** 2-4s cycle
- **Easing:** sine (smooth in-out)
- **Use Case:** Polygon idle state, key metrics
- **Amplitude:** scale(1.02), opacity 0.9->1

### Count-up Animations
- **Duration:** 300-500ms
- **Easing:** ease-out
- **Use Case:** Money amounts on load
- **Pattern:** Number increments from 0

### Progressive Reveal
- **Duration:** 50ms stagger per item
- **Easing:** ease-out
- **Use Case:** List items, scan results
- **Pattern:** Fade + slide up

### Celebration Animations
- **Duration:** 500-1000ms
- **Easing:** spring
- **Use Case:** Achievements, milestones
- **Pattern:** Confetti, scale bounce

---

## Screen Transitions Matrix

| From | To | Animation | Duration |
|------|-----|-----------|----------|
| Any | Settings | None (instant) | 0ms |
| Home | Analytics | Slide left + stagger | 250ms |
| Analytics | Drill-down | Slide left | 200ms |
| Drill-down | Back | Slide right | 200ms |
| Any | Scan | Modal slide up | 300ms |
| Scan | Result | Crossfade + reveal | 400ms |

---

## Breathing Effect Specification

```css
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
}

@media (prefers-reduced-motion: reduce) {
  .polygon-breathing {
    animation: none;
    opacity: 1;
  }
}
```

---

## Accessibility Requirements

All animations must:
1. Respect `prefers-reduced-motion: reduce`
2. Provide static fallback states
3. Never block user interaction
4. Complete within 300ms for interactive elements
5. Not cause vestibular issues (no rapid movement)

---

## Deliverable

**File:** `docs/uxui/motion-design-system.md`

**Contents:**
- Animation category definitions
- Timing specifications table
- CSS keyframe examples
- Screen transition matrix
- Accessibility guidelines
- Implementation notes for Framer Motion / CSS

---

## Tasks/Subtasks

- [x] Create comprehensive motion design system document
  - [x] Section 1: Animation Categories with timing curves table
  - [x] Section 2: Screen Transition Patterns with CSS keyframes
  - [x] Section 3: Breathing Effects with exact parameters
  - [x] Section 4: Progressive Reveal (staggered entry)
  - [x] Section 5: Count-up Animations
  - [x] Section 6: Celebration Animations
  - [x] Section 7: Settings Exception (instant load policy)
  - [x] Section 8: Accessibility (prefers-reduced-motion fallbacks)
  - [x] Section 9: Implementation notes (CSS variables, Tailwind, Framer Motion)
  - [x] Section 10: Quick Reference Card

---

## Definition of Done

- [x] All animation types documented
- [x] Timing specs with exact values
- [x] CSS keyframe examples included
- [x] Reduced motion fallbacks specified
- [x] Document reviewed (Atlas Code Review 2025-12-23)

---

## Dev Agent Record

### Implementation Plan
Documentation story following Atlas patterns:
1. Create comprehensive motion-design-system.md document
2. Document all 5 animation categories with exact timing specs
3. Include complete CSS keyframe examples for each animation type
4. Specify Settings screen exception (instant load, no animation)
5. Define reduced-motion fallbacks for every animation
6. Add implementation notes for CSS variables, Tailwind, and Framer Motion

### Debug Log
- None (documentation story, no code debugging required)

### Completion Notes
**Completed:** 2025-12-23

Created comprehensive Motion Design System specification at `docs/uxui/motion-design-system.md`:

**Key Deliverables:**
1. **Timing Curves** - 5 easing curves (ease-out, ease-in-out, ease-in, spring, linear) with CSS bezier values
2. **Duration Scale** - 8 duration tokens from instant (0ms) to breathing (3000ms)
3. **Animation Categories Table** - 6 categories with duration, easing, and interactive flag

**Screen Transitions (AC #2):**
- Full transition matrix (7 transitions)
- Complete CSS keyframes for slide, modal, and crossfade animations
- Exit variants included

**Breathing Effects (AC #3):**
- Polygon breathing: 3s cycle, scale 1.02, opacity 0.9-1.0
- Metrics breathing: 4s cycle, opacity only
- Loading pulse: 1.5s cycle for skeleton screens

**Settings Exception (AC #4):**
- Documented as Section 7 with rationale
- Implementation pattern for instant-load screens
- List of other instant actions (toggles, buttons, dropdowns)

**Accessibility (AC #5):**
- Global reduced-motion reset pattern
- Component-level fallback for every animation class
- JavaScript useReducedMotion hook pattern
- Testing checklist included

**Implementation Notes:**
- CSS custom properties for tokens
- Tailwind configuration extension
- Framer Motion alternative patterns
- Performance guidelines (GPU-accelerated transforms)

**Document Structure:**
- 10 main sections
- Quick reference card for easy lookup
- Related documents linked
- Compatible with existing Epic 11.3 animation patterns

---

## File List

| File | Action | Description |
|------|--------|-------------|
| `docs/uxui/motion-design-system.md` | Created | Motion Design System specification |
| `docs/sprint-artifacts/epic13/story-13.3-motion-design-system.md` | Modified | Story file updated with completion |
| `docs/sprint-artifacts/sprint-status.yaml` | Modified | Status updated to review |

---

## Context References

- **UX Spec Section 10.3:** [ux-design-specification.md](../../ux-design-specification.md#103-motion-design-system-everything-breathes)
- **Tech Context:** [tech-context-epic13.md](./tech-context-epic13.md)

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
| 2025-12-23 | 1.1 | Implementation complete - motion-design-system.md created |
| 2025-12-23 | 1.2 | Atlas Code Review APPROVED - 8 issues fixed: implementation status legend added, timing values aligned with Epic 11.3 code (100ms stagger, 20px translateY), useCountUp marked as FUTURE, testing checklist updated |
