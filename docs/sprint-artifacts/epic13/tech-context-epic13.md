# Epic 13 Technical Context

**Epic:** 13 - UX Design & Mockups
**Created:** 2025-12-23
**Status:** Ready for Design
**Estimated Points:** ~34 points
**Estimated Duration:** 2-3 weeks

---

## Executive Summary

Epic 13 transforms Boletapp from a "reactive data entry tool" to an "alive financial awareness companion" through comprehensive UX redesign. Unlike previous implementation epics, Epic 13 is a **design-focused epic** that produces documentation, guidelines, and visual mockups as deliverables.

**Core Innovation:** The app proactively surfaces information the user didn't know to ask for, creating positive feedback loops for healthy spending habits. The design system establishes the visual language and interaction patterns for Epics 14 and 15.

**Primary Deliverables:**
- 6 critical use cases for E2E testing (Story 13.1)
- Voice & Tone Guidelines document (Story 13.2)
- Motion Design System specification (Story 13.3)
- 8 comprehensive UI mockups (Stories 13.4-13.11)
- Design review and approval gate (Story 13.12)

---

## Atlas Architectural Context

### Relevant ADRs

| ADR | Decision | Applies To |
|-----|----------|------------|
| ADR-007 | Mermaid diagrams in Markdown | Diagram format for flows |
| ADR-015 | Client-Side Insight Engine | Powers insight carousel redesign |
| ADR-016 | Hybrid Storage | Goals system data model (Epic 15) |

### Architectural Considerations for Implementation (Epic 14+)

While Epic 13 is design-only, these architectural decisions should inform mockups:

1. **Animation Framework** - Consider Framer Motion or CSS animations for "Everything Breathes"
2. **Chart Library** - Evaluate D3.js for Sankey/Treemap (Story 13.5)
3. **Gesture Support** - Consider react-swipeable for carousel interactions
4. **Theme System** - CSS custom properties for themeable skins

### Feature Mapping

| Feature | Epic 13 Story | Implementation Epic |
|---------|---------------|---------------------|
| Critical Use Cases | 13.1 | E2E testing baseline |
| Voice & Tone | 13.2 | All copy/messaging |
| Motion System | 13.3 | Epic 14.1-14.2 |
| Home Dashboard | 13.4 | Epic 14.5-14.7 |
| Analytics Views | 13.5 | Epic 15.9-15.10 |
| Transaction Filters | 13.6 | Epic 14 scope |
| Scan Overlay | 13.7 | Epic 14.3-14.4 |
| Goals GPS | 13.8 | Epic 15.1-15.4 |
| Reports | 13.9 | Epic 14.10 |
| Insights Redesign | 13.10 | Epic 14.11-14.14 |
| Settings | 13.11 | Epic 15.13 |

---

## Design Approach

### Design-First Workflow

```
Brainstorming Session (COMPLETE)
         │
         ▼
   Epic 13: Design
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Use Cases  Voice & Tone  Motion Spec
    │         │           │
    └─────────┼───────────┘
              │
              ▼
         8 Mockups
              │
              ▼
      Design Review
              │
              ▼
   Epic 14: Implementation
```

### Persona-Driven Design

All mockups must be validated against the 4 personas:

| Persona | Key Need | Design Validation |
|---------|----------|-------------------|
| María | "¿Dónde se fue la plata?" | Does Home Dashboard answer this at a glance? |
| Diego | Goal progress | Is Savings GPS motivating, not overwhelming? |
| Rosa | Simple summaries | Are arrows/simple language accessible? |
| Tomás | Honest feedback | Does Emotional Airlock feel safe, not preachy? |

---

## Key Design Concepts

### 1. Dynamic Spending Polygon

**Purpose:** Visual health indicator on Home Dashboard

**Design Specifications:**
- 3-6 vertices based on trending spending categories
- Inner polygon = actual spending (lava/warm colors)
- Outer polygon = budget target (cool/green colors)
- Breathing animation (2-4s subtle pulse cycle)
- Tap vertex to drill into category

**Mockup Requirements (Story 13.4):**
- Show 3-vertex, 5-vertex, and 6-vertex states
- Show healthy vs overspending visual treatment
- Include breathing animation keyframes
- Document color mapping for categories

### 2. Savings GPS

**Purpose:** Goal tracking with journey visualization

**Design Specifications:**
- Origin point (start date) → Destination (goal)
- Current position marker with progress %
- ETA display: "Arriving by [date]"
- Alternate routes panel: "Save X more = Y days sooner"
- Milestone markers along path

**Mockup Requirements (Story 13.8):**
- Goal creation flow (name, emoji, amount, currency)
- GPS visualization states (on track, behind, ahead)
- Alternate routes interaction
- Goal-connected insight integration

### 3. Emotional Airlock

**Purpose:** Deliver difficult insights without triggering defensiveness

**Design Specifications:**
- Three-step progressive reveal
- Step 1: Curiosity gate (normalizing fact)
- Step 2: Playful brace (disarming humor)
- Step 3: Reveal with response options

**Mockup Requirements (Story 13.10):**
- All three steps as separate cards/screens
- Transition animations between steps
- Response buttons: "Fue intencional" / "No me había dado cuenta"
- Fallback for users who want to skip

### 4. Story Format Reports

**Purpose:** Instagram-style swipeable weekly/monthly summaries

**Design Specifications:**
- Full-screen card format
- Horizontal swipe navigation
- Simple arrows ↑↓→ for Rosa
- Celebration animations for milestones

**Mockup Requirements (Story 13.9):**
- Weekly summary card designs (7 cards)
- Monthly milestone card designs
- Swipe indicator and progress dots
- Personal record celebration treatment

---

## Voice & Tone Guidelines (Story 13.2)

### The Boletapp Voice Principles

| # | Principle | Do | Don't |
|---|-----------|-----|-------|
| 1 | Observes without judging | "Restaurants up 23%" | "You overspent on restaurants" |
| 2 | Reveals opportunity | "That's 2 days toward Tokyo" | "You could have saved this" |
| 3 | Invites experimentation | "What if you tried...?" | "You should try..." |
| 4 | Celebrates progress | "Your lowest restaurant week!" | Generic "Good job!" |
| 5 | Normalizes setbacks | "La vida es rara" | "You failed" or nothing |

### Message Templates to Document

| Category | Examples Needed |
|----------|-----------------|
| Insight observations | 5+ examples per persona |
| Goal updates | On track, behind, ahead |
| Celebrations | Personal records, milestones, streaks |
| Setback responses | Overspending, missed goals |
| System messages | Loading, errors, empty states |

### Chilean Market Language

| Standard Spanish | Chilean Adaptation |
|------------------|-------------------|
| "Incrementó 27%" | "Subió harto" |
| "Análisis completo" | Rosa-friendly alternative needed |
| "Gastos del mes" | Colloquial options |

---

## Motion Design System (Story 13.3)

### Animation Categories

| Category | Duration | Easing | Use Case |
|----------|----------|--------|----------|
| Navigation | 200-300ms | ease-out | Screen transitions |
| Breathing | 2-4s cycle | sine | Polygon idle state |
| Count-up | 300-500ms | ease-out | Money amounts on load |
| Stagger | 50ms per item | ease-out | List reveals |
| Celebration | 500-1000ms | spring | Achievements, milestones |

### Screen Transitions

| From | To | Animation |
|------|-----|-----------|
| Any | Settings | Instant (no animation) |
| Home | Analytics | Slide left with stagger |
| Analytics | Drill-down | Slide left |
| Drill-down | Back | Slide right |
| Any | Scan | Modal slide up |
| Scan | Result | Crossfade with reveal |

### Breathing Effect Specification

```css
/* Polygon breathing - for Motion System Spec */
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.02); opacity: 1; }
}

.polygon-breathing {
  animation: breathe 3s ease-in-out infinite;
}
```

### Accessibility

All animations must:
- Respect `prefers-reduced-motion: reduce`
- Provide static fallback states
- Never block interaction
- Complete within 300ms for interactive elements

---

## Critical Use Cases (Story 13.1)

### UC1: First Scan Experience
**Persona:** New user
**Flow:** App open → Scan → Progressive reveal → Quick Save → Celebration
**Success Metric:** <60s from scan to saved transaction

### UC2: Weekly Health Check
**Persona:** María
**Flow:** Open app → Breathing polygon → Swipe story → "Intentional?" prompt
**Success Metric:** Answers "where did my money go?" in <10s

### UC3: Goal Progress
**Persona:** Diego
**Flow:** Check GPS → See "3 days closer" → View trade-off insight
**Success Metric:** Feels motivated, not guilty

### UC4: Simple Summary
**Persona:** Rosa
**Flow:** View arrows ↑↓→ → "Carnes subió harto" → Confirm understanding
**Success Metric:** Understands without asking for help

### UC5: Out-of-Character Alert
**Persona:** Tomás
**Flow:** Airlock → Curiosity → Reveal → "Fue intencional" response
**Success Metric:** Feels informed, not judged

### UC6: Batch Scan Session
**Persona:** Power user
**Flow:** Scan 5 → Batch summary → Quick Save all → Aggregate insight
**Success Metric:** <3 min for 5 receipts

---

## Mockup Deliverables

### Mockup Format Options

| Format | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| Figma | Interactive, shareable | Requires account | For detailed UI |
| Excalidraw | In-repo, version controlled | Less polished | For flows/wireframes |
| HTML/CSS | Interactive in browser | More effort | For animation specs |

**Recommended Approach:**
- Excalidraw for wireframes and flows (version controlled)
- Figma for final visual mockups (external link in docs)
- HTML snippets for animation timing (in motion spec)

### Required Mockups

| Story | Screen/Component | States Needed |
|-------|------------------|---------------|
| 13.4 | Home Dashboard | Default, overspending, empty |
| 13.5 | Analytics (Sankey) | With data, drilling down |
| 13.5 | Analytics (Treemap) | With data, category selected |
| 13.6 | Transaction List | With filters, empty, filtered |
| 13.7 | Scan Overlay | Processing, complete, error |
| 13.8 | Goals + GPS | Creation, in progress, achieved |
| 13.9 | Weekly Report | 3+ card designs |
| 13.9 | Monthly Report | Milestone celebration |
| 13.10 | Insight Carousel | 3+ insight card types |
| 13.10 | Emotional Airlock | All 3 steps |
| 13.11 | Settings | Collapsed, expanded, theme picker |

---

## File Structure

### New Files to Create

| File | Story | Description |
|------|-------|-------------|
| `docs/uxui/use-cases-e2e.md` | 13.1 | 6 critical user journeys |
| `docs/uxui/voice-tone-guidelines.md` | 13.2 | Voice principles + message templates |
| `docs/uxui/motion-design-system.md` | 13.3 | Animation specs + timing |
| `docs/uxui/mockups/home-dashboard.*` | 13.4 | Dashboard mockup |
| `docs/uxui/mockups/analytics.*` | 13.5 | Sankey + Treemap mockups |
| `docs/uxui/mockups/transaction-list.*` | 13.6 | List + filters mockup |
| `docs/uxui/mockups/scan-overlay.*` | 13.7 | Processing overlay mockup |
| `docs/uxui/mockups/goals-gps.*` | 13.8 | Goals + GPS mockup |
| `docs/uxui/mockups/reports.*` | 13.9 | Weekly/Monthly reports |
| `docs/uxui/mockups/insights.*` | 13.10 | Carousel + Airlock mockups |
| `docs/uxui/mockups/settings.*` | 13.11 | Settings redesign |
| `docs/sprint-artifacts/epic13/design-review.md` | 13.12 | Review notes + approval |

---

## Story Breakdown

### Story 13.1: Critical Use Cases Document (3 pts)

**Goal:** Document 6 critical user journeys for E2E testing

**Acceptance Criteria:**
- [ ] Each use case has step-by-step user flow
- [ ] Expected UI states and transitions specified
- [ ] Success metrics defined per journey
- [ ] Edge cases and error states documented
- [ ] Mapped to personas

**Deliverable:** `docs/uxui/use-cases-e2e.md`

### Story 13.2: Voice & Tone Guidelines (2 pts)

**Goal:** Establish written communication style for all messaging

**Acceptance Criteria:**
- [ ] 5 voice principles with Do/Don't examples
- [ ] Message templates for insights, alerts, celebrations, setbacks
- [ ] Rosa-friendly alternatives for all technical messages
- [ ] Chilean Spanish language adaptation guide

**Deliverable:** `docs/uxui/voice-tone-guidelines.md`

### Story 13.3: Motion Design System Spec (3 pts)

**Goal:** Define "Everything Breathes" animation system

**Acceptance Criteria:**
- [ ] Timing curves and durations documented
- [ ] Screen transition patterns specified
- [ ] Breathing effect keyframes
- [ ] Settings exception documented
- [ ] `prefers-reduced-motion` fallbacks defined

**Deliverable:** `docs/uxui/motion-design-system.md`

### Story 13.4: Mockup - Home Dashboard (3 pts)

**Goal:** Design new Home view with breathing polygon

**Acceptance Criteria:**
- [ ] Figma/Excalidraw mockup complete
- [ ] Polygon with 3-6 sides based on categories
- [ ] Lava metaphor visualization
- [ ] Animation notes included
- [ ] Validated against María persona

**Deliverable:** `docs/uxui/mockups/home-dashboard.*`

### Story 13.5: Mockup - Analytics (5 pts)

**Goal:** Design enhanced Analytics with Sankey and Treemap

**Acceptance Criteria:**
- [ ] Sankey diagram mockup
- [ ] Treemap mockup
- [ ] Swipe gesture indicators
- [ ] Drill-down filter system
- [ ] Full-screen mode

**Deliverable:** `docs/uxui/mockups/analytics.*`

### Story 13.6: Mockup - Transaction List + Filters (3 pts)

**Goal:** Design Transaction List with comprehensive filters

**Acceptance Criteria:**
- [ ] Filter panel mockup
- [ ] Filter chip states (active, inactive)
- [ ] Swipe gesture integration
- [ ] Empty state design

**Deliverable:** `docs/uxui/mockups/transaction-list.*`

### Story 13.7: Mockup - Scan Overlay Flow (3 pts)

**Goal:** Design non-blocking scan processing overlay

**Acceptance Criteria:**
- [ ] Processing overlay mockup
- [ ] Progress indicator design
- [ ] Item reveal animation notes
- [ ] Quick Save card mockup

**Deliverable:** `docs/uxui/mockups/scan-overlay.*`

### Story 13.8: Mockup - Goals + Savings GPS (3 pts)

**Goal:** Design goal tracking with GPS visualization

**Acceptance Criteria:**
- [ ] Goal creation flow mockup
- [ ] GPS visualization mockup
- [ ] Progress tracking states
- [ ] Trade-off insight integration
- [ ] Validated against Diego persona

**Deliverable:** `docs/uxui/mockups/goals-gps.*`

### Story 13.9: Mockup - Weekly/Monthly Reports (3 pts)

**Goal:** Design story-format reports

**Acceptance Criteria:**
- [ ] Card swipe flow mockup
- [ ] Weekly summary card designs
- [ ] Monthly milestone designs
- [ ] Simple arrows format for Rosa

**Deliverable:** `docs/uxui/mockups/reports.*`

### Story 13.10: Mockup - Insights Redesign (3 pts)

**Goal:** Design insight carousel with Emotional Airlock

**Acceptance Criteria:**
- [ ] Carousel mockup
- [ ] Airlock sequence mockup (3 steps)
- [ ] "Intentional?" dialog mockup
- [ ] Personal record celebration
- [ ] Validated against Tomás persona

**Deliverable:** `docs/uxui/mockups/insights.*`

### Story 13.11: Mockup - Settings (2 pts)

**Goal:** Design Settings with progressive disclosure

**Acceptance Criteria:**
- [ ] Progressive disclosure mockup
- [ ] Theme selector mockup (Lava, Cats, Dogs)
- [ ] Simplified vs expanded states

**Deliverable:** `docs/uxui/mockups/settings.*`

### Story 13.12: Design Review & Approval Gate (1 pt)

**Goal:** Comprehensive review before implementation

**Acceptance Criteria:**
- [ ] All mockups reviewed for consistency
- [ ] Animation specifications validated
- [ ] Voice & tone applied throughout
- [ ] User (Gabe) approval obtained
- [ ] Implementation priorities confirmed for Epic 14

**Deliverable:** `docs/sprint-artifacts/epic13/design-review.md`

---

## Implementation Order

1. **Story 13.1** (3 pts) - Use Cases (foundation for all mockups)
2. **Story 13.2** (2 pts) - Voice & Tone (applies to all copy)
3. **Story 13.3** (3 pts) - Motion System (applies to all animations)
4. **Stories 13.4-13.11** (26 pts) - Mockups (can be parallelized)
5. **Story 13.12** (1 pt) - Design Review (gate before Epic 14)

**Parallelization:**
- Stories 13.1, 13.2, 13.3 establish foundations, do first
- Stories 13.4-13.11 are independent mockups, can run in parallel
- Story 13.12 depends on all mockups complete

---

## Dependencies

| Dependency | Status | Required By |
|------------|--------|-------------|
| Epic 12 Complete | ✅ DONE | Epic 13 start |
| Brainstorming Session | ✅ DONE | All stories |
| UX Research Documents | ✅ EXISTS | Voice & Motion specs |
| Existing Component Library | ✅ EXISTS | Mockup consistency |

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep into implementation | High | Medium | Strict design-only focus, defer code |
| Mockup tool learning curve | Low | Low | Use Excalidraw for quick wireframes |
| Persona validation delays | Medium | Medium | Gabe reviews each mockup as created |
| Animation specs too vague | Medium | High | Include CSS keyframes in motion spec |
| Lost context before Epic 14 | Medium | High | Comprehensive tech context + mockups |

---

## Success Metrics

### Design Quality
- All mockups validated against at least one persona
- Voice & Tone applied consistently across all copy
- Motion specs detailed enough for implementation

### Readiness for Epic 14
- No open design questions
- Clear implementation priorities
- Animation keyframes specified
- Component patterns documented

---

## Related Documents

- [Brainstorming Session](../../analysis/brainstorming-session-2025-12-22.md)
- [Epic 13 Definition](./epic-13-ux-design-mockups.md)
- [UX Design Specification (updated)](../../ux-design-specification.md)
- [UX Research - Habits](../../uxui/research/good%20habits.md)
- [UX Research - Animation](../../uxui/research/animated%20data%20visualization.md)

---

_Generated by Atlas Epic Tech Context Workflow_
_Date: 2025-12-23_
_For: Gabe_
