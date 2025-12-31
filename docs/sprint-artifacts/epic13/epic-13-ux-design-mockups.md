# Epic 13: UX Design & Mockups

**Status:** In Progress
**Points:** ~39
**Origin:** Brainstorming Session 2025-12-22
**Approach:** Design System first, then mockups using design-system-mockup-builder workflow

## Vision

Transform Boletapp from a "reactive data entry tool" to an "alive financial awareness companion" through comprehensive UX redesign.

**Core Transformation Goal:** The app proactively surfaces information the user didn't know to ask for, creating positive feedback loops for healthy spending habits.

## Key Design Principles

### The Boletapp Voice

1. **Observes without judging** - "Restaurants up 23%" not "You overspent on restaurants"
2. **Reveals opportunity** - Trade-off visibility without guilt
3. **Invites experimentation** - "What if you tried...?"
4. **Celebrates progress** - Personal records, milestones
5. **Normalizes setbacks** - "La vida es rara. Los datos tambien."

### Motion Design System: "Everything Breathes"

- Navigation transitions with staggered entry
- Screen-specific entry animations
- Breathing effects on key components
- Settings = exception (instant load for efficiency)

### Key Visual Concepts

1. **Dynamic Spending Polygon** (3-6 sides based on trending categories)
2. **Expanding Lava Metaphor** - Inner = spending (lava), Outer = budget (green pastures)
3. **Savings GPS** - Google Maps-style goal tracking with ETA
4. **Story Format Reports** - Instagram-style swipeable cards
5. **Emotional Airlock** - Curiosity → Playfulness → Reveal for difficult insights

## Personas

| Persona | Profile | Key Insight |
|---------|---------|-------------|
| María | 38, overwhelmed parent, "Donde se fue la plata?" | "Intentional or Accidental?" framework |
| Diego | 26, young professional, wants Japan trip | Savings GPS, goal-connected insights |
| Rosa | 62, abuelita, 40 years paper records | Simple arrows ↑↓→, "Subio harto" |
| Tomás | 34, disciplined accountant, drifting | Emotional Airlock for uncomfortable truths |

---

## Workflow Approach

This epic uses the **design-system-mockup-builder** workflow to ensure design system compliance:

- **Phase 1 (Story 13.5):** Extract design system into compact reference file
- **Phase 2 (Stories 13.6-13.13):** Each screen mockup runs workflow Phase 2 independently

This approach prevents context window overflow and ensures each screen uses ONLY components from the design system.

---

## Stories

### Foundation (Specification Documents) - COMPLETED

#### Story 13.1: Critical Use Cases Document (3 pts) ✅

**Status:** Done
**Description:** Document the 6 critical user journeys for E2E testing.

**Use Cases:**
1. UC1: First Scan Experience (New user → Scan → Progressive reveal → Quick Save → Celebration)
2. UC2: Weekly Health Check (María: Breathing polygon → Swipe story → "Intentional?" prompt)
3. UC3: Goal Progress (Diego: Check GPS → "3 days closer" → Trade-off insight)
4. UC4: Simple Summary (Rosa: Arrows ↑↓→ → "Carnes subio harto" → Confirm)
5. UC5: Out-of-Character Alert (Tomás: Airlock → Curiosity → Reveal → Response)
6. UC6: Batch Scan Session (Power user: Scan 5 → Batch summary → Quick Save all → Aggregate insight)

**Deliverable:** [docs/uxui/use-cases-e2e.md](../../uxui/use-cases-e2e.md)

---

#### Story 13.2: Voice & Tone Guidelines (2 pts) ✅

**Status:** Done
**Description:** Establish the written communication style for all app messaging.

**Deliverables:**
- Voice principles document
- Example messages for each tone category
- Do's and Don'ts with examples
- Language adaptation for Chilean market ("harto", colloquialisms)

**Deliverable:** [docs/uxui/voice-tone-guidelines.md](../../uxui/voice-tone-guidelines.md)

---

#### Story 13.3: Motion Design System Spec (3 pts) ✅

**Status:** Done
**Description:** Define the "Everything Breathes" animation system.

**Deliverables:**
- Animation timing specifications
- Transition types and when to use each
- Component-specific animation patterns
- Accessibility considerations (reduced motion)

**Deliverable:** [docs/uxui/motion-design-system.md](../../uxui/motion-design-system.md)

---

### Design System Foundation

#### Story 13.4: Design System HTML Components (5 pts)

**Status:** Ready for Dev
**Description:** Build the master design system HTML file with all reusable components.

**Key Elements:**
- Typography scale (H1-H4, body, caption, currency)
- Color palette (primary, semantic, category colors)
- Spacing system (4px grid)
- Card variants (summary, dashboard, info, stat)
- Button variants (primary, secondary, ghost, icon)
- Navigation components (top bar, bottom nav with camera icon)
- Form elements (inputs, selects, toggles)
- Chart containers and patterns
- Feedback states (loading, empty, error, success)

**Prescriptive Rules:**
- Spanish nav labels: Inicio, Analíticas, Ideas, Ajustes
- Camera icon for center button (NOT scan)
- CSS variables only (no hardcoded hex)
- scan-center: margin-top -56px

**Acceptance Criteria:**
- [ ] All components defined in single HTML file
- [ ] CSS custom properties in :root
- [ ] Spanish labels on all navigation
- [ ] Camera icon for center button
- [ ] Components are copy-paste ready

**Deliverable:** [docs/uxui/mockups/00_components/design-system-final.html](../../uxui/mockups/00_components/design-system-final.html)

---

#### Story 13.5: Extract Design System Reference (2 pts)

**Status:** Blocked by 13.4
**Description:** Run workflow Phase 1 to extract design system into compact reference file.

**Workflow:** `design-system-mockup-builder` Phase 1

**Key Elements:**
- Extract all design tokens (colors, spacing, typography, radii, shadows)
- Catalog all components with copy-paste HTML/CSS snippets
- Create canonical icon mapping
- Document prescriptive validation rules
- Target: <4000 tokens for AI context efficiency

**Acceptance Criteria:**
- [ ] Workflow Phase 1 completed successfully
- [ ] Reference file under 4000 tokens
- [ ] All components catalogued with snippets
- [ ] Spanish labels documented
- [ ] Camera icon path documented
- [ ] Validation rules section complete

**Deliverable:** [docs/uxui/mockups/00_components/design-system-reference.md](../../uxui/mockups/00_components/design-system-reference.md)

---

### Screen Mockups (Each uses Workflow Phase 2)

#### Story 13.6: Mockup - Home Dashboard (3 pts)

**Status:** Blocked by 13.5
**Description:** Design the Home view using workflow Phase 2.

**Workflow:** `design-system-mockup-builder` Phase 2

**Key Elements:**
- Today's summary card (spending overview)
- Recent transactions preview (3-5 items)
- Quick action buttons
- Top bar and bottom nav from design system

**Note:** Dynamic Spending Polygon moved to Analytics (13.7)

**Acceptance Criteria:**
- [ ] Workflow Phase 2 completed
- [ ] All components from design system reference
- [ ] Validation passed (Spanish labels, camera icon, CSS vars)
- [ ] Animation notes included

**Deliverable:** `docs/uxui/mockups/home-dashboard.html`

---

#### Story 13.7: Mockup - Analytics with Polygon (5 pts)

**Status:** Blocked by 13.5
**Description:** Design the Analytics view with Dynamic Spending Polygon, Sankey and Treemap.

**Workflow:** `design-system-mockup-builder` Phase 2

**Key Elements:**
- Dynamic Spending Polygon (3-6 sides based on categories)
- Breathing animation placeholder
- Sankey diagram for flow visualization
- Treemap for proportional breakdown
- Swipe time navigation indicators
- Chart mode toggle

**Acceptance Criteria:**
- [ ] Workflow Phase 2 completed
- [ ] Polygon with 3-6 sides visualization
- [ ] Sankey diagram mockup
- [ ] Treemap mockup
- [ ] Swipe gesture indicators
- [ ] Validation passed

**Deliverable:** `docs/uxui/mockups/analytics.html`

---

#### Story 13.8: Mockup - Transaction List + Filters (3 pts)

**Status:** Blocked by 13.5
**Description:** Design the Transaction List with comprehensive filters.

**Workflow:** `design-system-mockup-builder` Phase 2

**Key Elements:**
- Filter categories: Time, Location, Transaction Date, Scan Date, Categories
- Swipe time navigation
- Quick filter chips
- Transaction item cards
- Empty state

**Acceptance Criteria:**
- [ ] Workflow Phase 2 completed
- [ ] Filter panel mockup
- [ ] Filter chip states (active, inactive)
- [ ] Swipe gesture integration
- [ ] Empty state design
- [ ] Validation passed

**Deliverable:** `docs/uxui/mockups/transaction-list.html`

---

#### Story 13.9: Mockup - Scan Overlay Flow (3 pts)

**Status:** Blocked by 13.5
**Description:** Design the non-blocking scan processing overlay.

**Workflow:** `design-system-mockup-builder` Phase 2

**Key Elements:**
- Camera capture view
- Processing overlay with progress + ETA
- Progressive item reveal on completion
- Quick Save vs Edit path cards
- Batch scan summary

**Acceptance Criteria:**
- [ ] Workflow Phase 2 completed
- [ ] Processing overlay mockup
- [ ] Progress indicator design
- [ ] Item reveal animation notes
- [ ] Quick Save card mockup
- [ ] Validation passed

**Deliverable:** `docs/uxui/mockups/scan-overlay.html`

---

#### Story 13.10: Mockup - Goals + Savings GPS (3 pts)

**Status:** Blocked by 13.5
**Description:** Design the goal tracking system with GPS visualization.

**Workflow:** `design-system-mockup-builder` Phase 2

**Key Elements:**
- Goal list view
- Goal creation flow (name, emoji, amount, currency)
- GPS-style progress ("Arriving by [date]")
- Alternate routes ("Save 10% more = 2 months sooner")
- Goal-connected insights

**Acceptance Criteria:**
- [ ] Workflow Phase 2 completed
- [ ] Goal creation flow mockup
- [ ] GPS visualization mockup
- [ ] Progress tracking states
- [ ] Trade-off insight integration
- [ ] Validation passed

**Deliverable:** `docs/uxui/mockups/goals-gps.html`

---

#### Story 13.11: Mockup - Weekly/Monthly Reports (3 pts)

**Status:** Blocked by 13.5
**Description:** Design story-format reports with swipeable cards.

**Workflow:** `design-system-mockup-builder` Phase 2

**Key Elements:**
- Instagram-style swipeable cards
- Weekly summary with arrows ↑↓→
- Monthly milestone celebrations
- Rosa-friendly simple format
- Share capability indicator

**Acceptance Criteria:**
- [ ] Workflow Phase 2 completed
- [ ] Card swipe flow mockup
- [ ] Weekly summary card designs
- [ ] Monthly milestone card designs
- [ ] Simple arrows format for accessibility
- [ ] Validation passed

**Deliverable:** `docs/uxui/mockups/reports.html`

---

#### Story 13.12: Mockup - Insights Redesign (3 pts)

**Status:** Blocked by 13.5
**Description:** Design the insight carousel with Emotional Airlock pattern.

**Workflow:** `design-system-mockup-builder` Phase 2

**Key Elements:**
- Swipeable insight carousel
- "Intentional or Accidental?" prompts
- Emotional Airlock sequence (Curiosity → Playful → Reveal)
- Personal records celebration
- Insight categories

**Acceptance Criteria:**
- [ ] Workflow Phase 2 completed
- [ ] Carousel mockup
- [ ] Airlock sequence mockup
- [ ] "Intentional?" dialog mockup
- [ ] Personal record celebration mockup
- [ ] Validation passed

**Deliverable:** `docs/uxui/mockups/insights.html`

---

#### Story 13.13: Mockup - Settings (2 pts)

**Status:** Blocked by 13.5
**Description:** Design Settings with progressive disclosure.

**Workflow:** `design-system-mockup-builder` Phase 2

**Key Elements:**
- Simplified default view
- Power user toggles (hidden by default)
- Smart defaults
- Theme selection (placeholder for Lava, Cats, Dogs)
- Account settings
- Data export options

**Acceptance Criteria:**
- [ ] Workflow Phase 2 completed
- [ ] Progressive disclosure mockup
- [ ] Theme selector mockup
- [ ] Simplified vs expanded states
- [ ] Validation passed

**Deliverable:** `docs/uxui/mockups/settings.html`

---

### Review Gate

#### Story 13.14: Design Review & Approval Gate (1 pt)

**Status:** Blocked by 13.6-13.13
**Description:** Comprehensive review of all mockups before implementation.

**Acceptance Criteria:**
- [ ] All 8 screen mockups reviewed for consistency
- [ ] Animation specifications validated against motion-design-system.md
- [ ] Voice & tone applied throughout (check against voice-tone-guidelines.md)
- [ ] Use cases validated (check against use-cases-e2e.md)
- [ ] Design system compliance confirmed (all screens pass validation)
- [ ] User approval obtained
- [ ] Implementation priorities for Epic 14 confirmed

---

## Story Dependency Graph

```
Stories 13.1-13.3 (Foundation Specs) ✅
         │
         ▼
    13.4 (Design System HTML)
         │
         ▼
    13.5 (Extract Reference - Workflow Phase 1)
         │
         ▼
  ┌──────┼──────┬──────┬──────┬──────┬──────┬──────┐
  ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
13.6   13.7   13.8   13.9  13.10  13.11  13.12  13.13
Home   Analy  Trans  Scan  Goals  Report Insig  Setti
  │      │      │      │      │      │      │      │
  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘
                         │
                         ▼
               13.14 (Review Gate)
                         │
                         ▼
                    Epic 14
```

## Points Summary

| Category | Stories | Points |
|----------|---------|--------|
| Foundation (Done) | 13.1, 13.2, 13.3 | 8 |
| Design System | 13.4, 13.5 | 7 |
| Screen Mockups | 13.6-13.13 | 25 |
| Review Gate | 13.14 | 1 |
| **Total** | **14 stories** | **41** |

## References

- [Brainstorming Session](../../analysis/brainstorming-session-2025-12-22.md)
- [UX Research - Habits](../../uxui/research/good%20habits.md)
- [UX Research - Animation](../../uxui/research/animated%20data%20visualization.md)
- [UX Research - UI Options](../../uxui/research/some%20ui%20options.md)
- [Design System Mockup Builder Workflow](_bmad/bmm/workflows/design-system-mockup-builder/)
