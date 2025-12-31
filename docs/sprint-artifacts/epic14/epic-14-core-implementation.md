# Epic 14: Core Implementation

**Status:** Backlog
**Points:** ~48
**Origin:** Brainstorming Session 2025-12-22
**Dependency:** Epic 13 (UX Design & Mockups) must be complete

## Vision

Implement the approved mockups from Epic 13, bringing the "alive financial companion" to life with animations, new components, and enhanced user experience.

## Stories

### Story 14.1: Animation Framework (5 pts)

**Description:** Build core animation utilities and shared animation system.

**Deliverables:**
- Animation timing utilities
- Reusable animation components
- Spring physics configurations
- Stagger delay calculations

**Acceptance Criteria:**
- [ ] AnimationContext provider
- [ ] useBreathing hook
- [ ] useStagger hook
- [ ] Animation constants (timing, easing)
- [ ] prefers-reduced-motion support

---

### Story 14.2: Screen Transition System (3 pts)

**Description:** Implement screen-to-screen transitions with staggered entry.

**Acceptance Criteria:**
- [ ] PageTransition wrapper component
- [ ] Staggered child entry animations
- [ ] Settings exception (instant load)
- [ ] Navigation integration

---

### Story 14.3: Scan Overlay Flow (5 pts)

**Description:** Implement non-blocking scan processing overlay.

**Acceptance Criteria:**
- [ ] Grayed-out edit view during processing
- [ ] Overlay component with progress
- [ ] ETA calculation and display
- [ ] Non-blocking navigation support
- [ ] Progressive item reveal on completion

---

### Story 14.4: Quick Save Path (3 pts)

**Description:** Implement Quick Save vs Edit decision flow.

**Acceptance Criteria:**
- [ ] Quick Save card component
- [ ] Save confirmation animation
- [ ] Edit path alternative
- [ ] Integration with scan overlay

---

### Story 14.5: Dynamic Polygon Component (5 pts)

**Description:** Build the 3-6 sided spending polygon visualization.

**Acceptance Criteria:**
- [ ] DynamicPolygon component
- [ ] Dynamic side count (3-6 based on categories)
- [ ] Breathing animation
- [ ] Category labeling
- [ ] Touch/click interactivity

---

### Story 14.6: Polygon Dual Mode (3 pts)

**Description:** Enable merchant category and item group views.

**Acceptance Criteria:**
- [ ] Mode toggle component
- [ ] Merchant categories polygon
- [ ] Item groups polygon
- [ ] Smooth transition between modes

---

### Story 14.7: Expanding Lava Visual (3 pts)

**Description:** Implement inverted metaphor visualization.

**Acceptance Criteria:**
- [ ] Inner polygon = spending (lava/red)
- [ ] Outer polygon = budget (green)
- [ ] Visual tension when spending grows
- [ ] Budget proximity indicators

---

### Story 14.8: Enhanced Existing Charts (3 pts)

**Description:** Improve Pie, Bar, and Stacked Bar charts.

**Acceptance Criteria:**
- [ ] Animated count-up for values
- [ ] Entry animations
- [ ] Breathing effects on hover/focus
- [ ] Consistent styling with new design

---

### Story 14.9: Swipe Time Navigation (3 pts)

**Description:** Implement left/right swipe for week/month navigation.

**Acceptance Criteria:**
- [ ] Swipe gesture detection
- [ ] Time period change on swipe
- [ ] Visual feedback during swipe
- [ ] Integration with Analytics and History views

---

### Story 14.10: Weekly Report Story Format (5 pts)

**Description:** Implement Instagram-style swipeable report cards.

**Acceptance Criteria:**
- [ ] ReportCard component
- [ ] Swipeable carousel
- [ ] Weekly summary card
- [ ] Category breakdown cards
- [ ] Trend arrows ↑↓→
- [ ] Rosa-friendly simple format

---

### Story 14.11: "Intentional or Accidental?" Pattern (2 pts)

**Description:** Implement non-judgmental spending prompts.

**Acceptance Criteria:**
- [ ] IntentionalPrompt dialog component
- [ ] Two-button response (Intentional / Didn't realize)
- [ ] Response storage
- [ ] Pattern detection integration

---

### Story 14.12: Celebration System (3 pts)

**Description:** Implement multi-sensory celebration effects.

**Acceptance Criteria:**
- [ ] Confetti animation component
- [ ] Haptic feedback integration
- [ ] Optional sound effects
- [ ] Celebration triggers (milestones, records)

---

### Story 14.13: Personal Records Detection (3 pts)

**Description:** Detect and celebrate personal achievements.

**Acceptance Criteria:**
- [ ] Record detection service
- [ ] "Lowest [category] week in X months!" detection
- [ ] Record celebration display
- [ ] Record history storage

---

### Story 14.14: Session Completion Messaging (2 pts)

**Description:** Implement session wrap-up messages.

**Acceptance Criteria:**
- [ ] SessionComplete component
- [ ] "Great check-in today" messaging
- [ ] Session summary display
- [ ] Encouraging next-step suggestions

## Dependencies

- Epic 13 mockups approved before starting
- Animation framework (14.1) before most other stories
- Polygon (14.5) before dual mode (14.6) and lava (14.7)

## References

- [Epic 13: UX Design & Mockups](../epic13/epic-13-ux-design-mockups.md)
- [Brainstorming Session](../../analysis/brainstorming-session-2025-12-22.md)
