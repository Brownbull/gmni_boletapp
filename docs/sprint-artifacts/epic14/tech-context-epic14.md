# Epic 14 Technical Context

**Epic:** 14 - Core Implementation
**Created:** 2025-12-31
**Status:** Ready for Implementation
**Estimated Points:** ~48 points
**Dependency:** Epic 13 (UX Design & Mockups) - COMPLETE

---

## Executive Summary

Epic 14 implements the approved mockups from Epic 13, bringing the "alive financial companion" to life. This is an **implementation-focused epic** that transforms design specifications into production code with animations, new components, and enhanced user experience.

**Core Deliverable:** Animation framework + Dynamic Polygon + Celebrations + Weekly Reports

**Existing Infrastructure Leverage:**
- `useReducedMotion` hook (Story 11.3) - already respects accessibility
- `useStaggeredReveal` hook (Story 11.3) - progressive item reveal
- `AnimatedItem` component (Story 11.3) - fade-in slide-up wrapper
- `confetti.ts` utility (Story 9.6) - `celebrateSuccess()` and `celebrateBig()`
- CSS animation keyframes in `index.css` - `animate-item-reveal`

---

## Atlas Architectural Context

### Relevant ADRs

| ADR | Decision | Applies To |
|-----|----------|------------|
| ADR-015 | Client-Side Insight Engine | Personal records detection (14.13) |
| ADR-016 | Hybrid Storage | Records history storage |
| ADR-017 | Phase-Based Priority | Celebration triggers based on user phase |
| ADR-020 | Batch Processing | Batch celebration after multi-save |

### Pattern Validation from Atlas Memory

**From 06-lessons.md:**

| # | Pattern | Applies To |
|---|---------|------------|
| 23 | Staggered animations via `useStaggeredReveal` | Screen transitions (14.2) |
| 24 | Reduced motion via `useReducedMotion` | All animation stories |
| 25 | Async side-effect pattern (save then insight) | Record detection (14.13) |
| 30 | CSS-only scaling effects | Polygon breathing (14.5) |
| 32 | `celebrateBig()` for major achievements | Celebrations (14.12) |

**From 04-architecture.md:**

- InsightEngine pattern: generators + selection algorithm = can extend for record detection
- State machine hook pattern: can apply to scan overlay states
- Weighted confidence scoring: can apply to Quick Save threshold

---

## Implementation Architecture

### New Components Architecture

```
src/
├── components/
│   ├── animation/
│   │   ├── AnimationContext.tsx      # 14.1 - Global animation state
│   │   ├── useBreathing.ts           # 14.1 - Breathing animation hook
│   │   ├── PageTransition.tsx        # 14.2 - Screen transition wrapper
│   │   └── constants.ts              # 14.1 - Timing, easing values
│   ├── polygon/
│   │   ├── DynamicPolygon.tsx        # 14.5 - SVG polygon renderer
│   │   ├── PolygonModeToggle.tsx     # 14.6 - Category/Item toggle
│   │   └── LavaOverlay.tsx           # 14.7 - Spending vs budget visual
│   ├── scan/
│   │   └── ScanOverlay.tsx           # 14.3 - Non-blocking overlay (enhance existing)
│   ├── reports/
│   │   ├── ReportCard.tsx            # 14.10 - Individual report card
│   │   ├── ReportCarousel.tsx        # 14.10 - Swipeable carousel
│   │   └── TrendArrow.tsx            # 14.10 - ↑↓→ indicators
│   └── celebrations/
│       ├── CelebrationTrigger.tsx    # 14.12 - Multi-sensory celebration
│       ├── PersonalRecordBanner.tsx  # 14.13 - Record display
│       └── SessionComplete.tsx       # 14.14 - Session wrap-up
├── hooks/
│   ├── useBreathing.ts               # 14.1 - Breathing animation
│   ├── usePersonalRecords.ts         # 14.13 - Record detection
│   └── useSwipeNavigation.ts         # 14.9 - Swipe gesture hook
└── services/
    └── recordsService.ts             # 14.13 - Record detection logic
```

### Design System Integration

From `design-system-reference.md`, these CSS variables are canonical:

```css
/* Animation Timing (from motion-design-system.md) */
--transition-fast: 150ms ease;        /* Interactive elements */
--transition-normal: 200ms ease;      /* Standard transitions */
--transition-slow: 300ms ease;        /* Navigation, overlays */
--transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1); /* Celebrations */

/* Breathing Animation */
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.02); opacity: 1; }
}
.breathing { animation: breathe 3s ease-in-out infinite; }

/* Category Colors (from analytics-polygon.html) */
--cat-groceries: #22c55e;
--cat-restaurant: #ef4444;
--cat-transport: #3b82f6;
--cat-entertainment: #8b5cf6;
--cat-utilities: #f59e0b;
--cat-other: #6b7280;
```

---

## Story Technical Details

### Story 14.1: Animation Framework (5 pts)

**Objective:** Build shared animation utilities that all other stories depend on.

**Technical Approach:**
1. Create `AnimationContext` provider with global animation state
2. Move existing `useReducedMotion` integration into context
3. Create `useBreathing` hook with configurable cycle time
4. Define animation constants (timing curves from motion-design-system.md)

**Key Files:**
- `src/components/animation/AnimationContext.tsx`
- `src/components/animation/useBreathing.ts`
- `src/components/animation/constants.ts`

**Implementation Notes:**
```typescript
// constants.ts
export const ANIMATION = {
  DURATION: {
    INSTANT: 0,
    FAST: 150,
    NORMAL: 200,
    SLOW: 300,
    BREATHING: 3000,
    CELEBRATION: 500,
  },
  EASING: {
    DEFAULT: 'ease',
    OUT: 'ease-out',
    IN_OUT: 'ease-in-out',
    SPRING: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  STAGGER: {
    DEFAULT: 100,
    FAST: 50,
  },
} as const;
```

**Dependencies:** None (foundation story)

---

### Story 14.2: Screen Transition System (3 pts)

**Objective:** Wrap screen navigation with staggered entry animations.

**Technical Approach:**
1. Create `PageTransition` wrapper component
2. Integrate with existing router (likely react-router)
3. Apply staggered child reveal using existing `useStaggeredReveal`
4. Add Settings exception (instant load per motion-design-system.md)

**Key Pattern from motion-design-system.md:**
```
| From | To | Animation |
|------|-----|-----------|
| Any | Settings | Instant (no animation) |
| Home | Analytics | Slide left with stagger |
| Analytics | Drill-down | Slide left |
| Drill-down | Back | Slide right |
```

**Dependencies:** 14.1 (Animation Framework)

---

### Story 14.3: Scan Overlay Flow (5 pts)

**Objective:** Implement non-blocking scan processing overlay matching mockup.

**Reference Mockup:** `docs/uxui/mockups/01_views/scan-overlay.html`

**Technical Approach:**
1. Enhance existing `ScanProgress.tsx` with overlay pattern
2. Add ETA calculation based on average processing time
3. Implement progressive item reveal using `useStaggeredReveal`
4. Gray out EditView during processing (CSS opacity + pointer-events)

**States from mockup:**
- `uploading` - Image uploading to API
- `processing` - Gemini OCR processing
- `ready` - Items revealed, ready for save

**Dependencies:** 14.1, 14.2

---

### Story 14.4: Quick Save Path (3 pts)

**Objective:** Decision flow between Quick Save and Edit.

**Technical Approach:**
1. Enhance existing `QuickSaveCard.tsx` with save confirmation animation
2. Add spring animation on successful save (use `--transition-spring`)
3. Integrate with scan overlay completion state

**Existing Foundation:**
- `src/components/scan/QuickSaveCard.tsx` - 85% confidence threshold already implemented

**Dependencies:** 14.3

---

### Story 14.5: Dynamic Polygon Component (5 pts)

**Objective:** Build the 3-6 sided spending polygon visualization.

**Reference Mockup:** `docs/uxui/mockups/01_views/analytics-polygon.html`

**Technical Approach:**
1. SVG-based polygon with dynamic point calculation
2. Category count determines vertices (3-6 based on top categories)
3. Apply breathing animation via `useBreathing` hook
4. Touch/click handlers for vertex drilling

**Implementation Pattern:**
```typescript
interface DynamicPolygonProps {
  categories: CategorySpending[];  // { name, amount, color }
  maxVertices?: 3 | 4 | 5 | 6;
  breathing?: boolean;
  onVertexClick?: (category: string) => void;
}
```

**Key Algorithm:**
- Calculate polygon points on unit circle
- Scale radii by spending ratio per category
- Apply breathing transform to container

**Dependencies:** 14.1

---

### Story 14.6: Polygon Dual Mode (3 pts)

**Objective:** Toggle between merchant category and item group views.

**Technical Approach:**
1. Create `PolygonModeToggle` component (segmented control style)
2. Two modes: "Categorías" and "Grupos"
3. Smooth transition between polygon shapes (CSS transition on points)

**Dependencies:** 14.5

---

### Story 14.7: Expanding Lava Visual (3 pts)

**Objective:** Inner spending polygon vs outer budget polygon.

**Technical Approach:**
1. Two nested polygons in SVG
2. Inner polygon = actual spending (warm colors: red/orange)
3. Outer polygon = budget target (cool colors: green/blue)
4. Visual tension when spending approaches budget

**Color System:**
```typescript
const LAVA_COLORS = {
  SPENDING: 'rgba(239, 68, 68, 0.7)',   // red-500 with opacity
  BUDGET: 'rgba(34, 197, 94, 0.3)',     // green-500 with opacity
  DANGER: 'rgba(239, 68, 68, 1)',       // solid red when over budget
};
```

**Dependencies:** 14.5, 14.6

---

### Story 14.8: Enhanced Existing Charts (3 pts)

**Objective:** Add animations to Pie and Bar charts.

**Existing Components:**
- `src/components/charts/GroupedBarChart.tsx`
- `src/components/charts/SimplePieChart.tsx`

**Technical Approach:**
1. Add animated count-up for money values
2. Entry animations (fade-in + scale)
3. Optional breathing on hover/focus

**Dependencies:** 14.1

---

### Story 14.9: Swipe Time Navigation (3 pts)

**Objective:** Left/right swipe for week/month navigation.

**Technical Approach:**
1. Create `useSwipeNavigation` hook with touch event handlers
2. Configure swipe threshold (50px minimum travel)
3. Integrate with existing `HistoryFiltersContext` time navigation

**Implementation:**
```typescript
const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeNavigation({
  onSwipeLeft: () => goNextPeriod(),
  onSwipeRight: () => goPrevPeriod(),
  threshold: 50,
});
```

**Dependencies:** 14.1

---

### Story 14.10: Weekly Report Story Format (5 pts)

**Objective:** Instagram-style swipeable report cards.

**Reference Mockup:** `docs/uxui/mockups/01_views/reports.html`

**Technical Approach:**
1. `ReportCard` component with full-screen styling
2. `ReportCarousel` with horizontal swipe (reuse 14.9 hook)
3. `TrendArrow` component (↑↓→) with color coding
4. Weekly summary generation from transactions

**Card Types:**
- Overview card (total spent, vs last week)
- Category breakdown cards (one per major category)
- Trend summary card (biggest changes)

**Dependencies:** 14.1, 14.9

---

### Story 14.11: "Intentional or Accidental?" Pattern (2 pts)

**Objective:** Non-judgmental spending awareness prompts.

**Technical Approach:**
1. `IntentionalPrompt` dialog component
2. Two-button response: "Fue intencional" / "No me había dado cuenta"
3. Store response in transaction metadata
4. Trigger on pattern-detected spending (e.g., unusual category spike)

**Dependencies:** 14.1

---

### Story 14.12: Celebration System (3 pts)

**Objective:** Multi-sensory celebration effects.

**Existing Foundation:**
- `src/utils/confetti.ts` - `celebrateSuccess()`, `celebrateBig()`
- Already respects `disableForReducedMotion`

**Technical Approach:**
1. Create `CelebrationTrigger` component that orchestrates:
   - Confetti animation (existing)
   - Haptic feedback (navigator.vibrate API)
   - Optional sound (if user enabled)
2. Define trigger events: milestones, personal records, goal completions

**Implementation:**
```typescript
interface CelebrationConfig {
  type: 'small' | 'big';
  haptic?: boolean;
  sound?: boolean;
}

function triggerCelebration(config: CelebrationConfig) {
  if (config.type === 'big') celebrateBig();
  else celebrateSuccess();

  if (config.haptic && navigator.vibrate) {
    navigator.vibrate(config.type === 'big' ? [100, 50, 100] : [50]);
  }
}
```

**Dependencies:** 14.1

---

### Story 14.13: Personal Records Detection (3 pts)

**Objective:** Detect and celebrate personal achievements.

**Technical Approach:**
1. Create `recordsService.ts` with detection logic
2. Detect patterns like:
   - "Lowest [category] week in X months!"
   - "First time under budget for [category]!"
   - "Saved [amount] more than last month!"
3. Store record history in Firestore (insightRecords collection)
4. Display `PersonalRecordBanner` on detection

**Integration with Insight Engine:**
- Can register as new insight generator
- Follow existing generator pattern from Epic 10

**Dependencies:** 14.1, 14.12

---

### Story 14.14: Session Completion Messaging (2 pts)

**Objective:** Session wrap-up with encouraging message.

**Technical Approach:**
1. Create `SessionComplete` component
2. Show after save + insight display
3. Message options:
   - "Great check-in today!"
   - "You've been tracking for X days!"
   - Next-step suggestions

**Dependencies:** 14.1

---

## Implementation Order

```
Week 1: Foundation
├── 14.1 Animation Framework (5 pts) - MUST BE FIRST
├── 14.2 Screen Transitions (3 pts)
└── 14.12 Celebration System (3 pts) - parallel with 14.2

Week 2: Scan Flow
├── 14.3 Scan Overlay (5 pts)
├── 14.4 Quick Save Path (3 pts)
└── 14.11 Intentional Prompt (2 pts)

Week 3: Polygon
├── 14.5 Dynamic Polygon (5 pts)
├── 14.6 Dual Mode (3 pts)
└── 14.7 Lava Visual (3 pts)

Week 4: Charts & Reports
├── 14.8 Enhanced Charts (3 pts)
├── 14.9 Swipe Navigation (3 pts)
└── 14.10 Weekly Reports (5 pts)

Week 5: Records & Completion
├── 14.13 Personal Records (3 pts)
└── 14.14 Session Complete (2 pts)
```

**Critical Path:** 14.1 → 14.5 → 14.6 → 14.7 (Polygon chain)

---

## Mockup-to-Story Mapping

| Mockup File | Stories | Key Components |
|-------------|---------|----------------|
| `home-dashboard.html` | 14.5, 14.6, 14.7 | DynamicPolygon, LavaOverlay |
| `scan-overlay.html` | 14.3, 14.4 | ScanOverlay, QuickSaveCard |
| `analytics-polygon.html` | 14.5, 14.6, 14.8 | Polygon, Enhanced Charts |
| `reports.html` | 14.10 | ReportCarousel, TrendArrow |
| `insights.html` | 14.11, 14.12, 14.14 | IntentionalPrompt, Celebrations |

---

## Testing Strategy

### Unit Tests
- Animation hooks with mock timers
- Polygon point calculations
- Record detection service
- Swipe threshold calculations

### Integration Tests
- Scan overlay state machine
- Celebration trigger flow
- Report carousel navigation

### Visual Tests (Storybook recommended)
- Polygon with different vertex counts
- Breathing animation timing
- Screen transitions

### Accessibility Tests
- All animations disabled when `prefers-reduced-motion: reduce`
- Focus management during transitions
- Screen reader announcements for celebrations

---

## Dependencies

| Dependency | Status | Required By |
|------------|--------|-------------|
| Epic 13 Complete | ✅ DONE | All stories |
| Mockups Approved | ✅ DONE | All stories |
| Motion Design System | ✅ EXISTS | 14.1, 14.2 |
| Existing Animation Hooks | ✅ EXISTS | 14.2, 14.3 |
| Confetti Utility | ✅ EXISTS | 14.12 |

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Polygon performance on low-end devices | Medium | High | Use CSS transforms, avoid repaints |
| Animation jank | Medium | Medium | Use requestAnimationFrame, will-change hints |
| Swipe conflicts with scroll | High | Medium | Careful touch event handling, disable during scroll |
| Celebration spam | Low | Medium | Cooldown between celebrations |

---

## Success Metrics

### Animation Quality
- 60fps maintained during breathing animation
- No layout shifts during transitions
- Smooth polygon vertex transitions

### User Experience
- First scan to celebration < 60 seconds
- Report card swipe feels native
- Polygon interaction feels responsive

### Accessibility
- All motion disabled with reduced motion preference
- No motion-induced content changes
- Focus trap during overlays

---

## Related Documents

- [Epic 14 Definition](./epic-14-core-implementation.md)
- [Epic 13 Tech Context](../epic13/tech-context-epic13.md)
- [Motion Design System](../../uxui/motion-design-system.md)
- [Design System Reference](../../uxui/mockups/00_components/design-system-reference.md)
- [Mockups Directory](../../uxui/mockups/01_views/)

---

_Generated by Atlas Epic Tech Context Workflow_
_Date: 2025-12-31_
_For: Gabe_
