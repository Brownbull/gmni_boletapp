# Epic 15: Advanced Features

**Status:** Backlog
**Points:** ~38 (revised after mockup verification - restored Themeable Skins)
**Origin:** Brainstorming Session 2025-12-22
**Dependency:** Epic 14 (Core Implementation) must be complete
**Last Updated:** 2025-12-31 (mockup alignment review)

## Vision

Add advanced behavioral intelligence features: custom goals with Savings GPS, learned budgets, out-of-character detection, and treemap visualization.

## Mockup Verification Notes

Stories verified against `/docs/uxui/mockups/01_views/` on 2025-12-31:
- **REMOVED 15.9 Sankey**: CSS defined in analytics-polygon.html but never rendered/used
- **REMOVED 15.12 Shareable Personality**: Not in any mockup
- **RESTORED 15.11 Themeable Skins**: Present in settings.html - 3 themes (Professional Blue, Mono, Ni No Kuni)

## Stories

### Story 15.1: Custom Goals CRUD (3 pts)

**Description:** Enable users to create, read, update, delete custom financial goals.

**Deliverables:**
- Goal creation dialog
- Goals list view
- Edit/delete functionality
- Goal data model

**Acceptance Criteria:**
- [ ] Goal with name, emoji, amount, currency
- [ ] Default currency from user settings
- [ ] Goals stored in Firestore
- [ ] Goals management in Settings

---

### Story 15.2: Savings GPS Visualization (5 pts)

**Description:** Implement Google Maps-style goal tracking.

**Acceptance Criteria:**
- [ ] "Arriving at your goal by [date]" display
- [ ] Real-time updates based on spending
- [ ] Alternate routes ("Save 10% more = 2 months sooner")
- [ ] Progress animation

---

### Story 15.3: Hybrid Income Mode (3 pts)

**Description:** Implement Smart Mode default with optional Precision Mode.

**Acceptance Criteria:**
- [ ] Smart Mode: estimates from spending patterns
- [ ] Precision Mode: optional income entry
- [ ] Income stored locally only (never uploaded)
- [ ] Mode toggle in Settings

---

### Story 15.4: Goal-Connected Insights (3 pts)

**Description:** Link spending insights to goal progress.

**Acceptance Criteria:**
- [ ] "This week's coffee: $13,500 = 1 day further from Tokyo"
- [ ] Trade-off visibility without judgment
- [ ] Multiple goals connection
- [ ] Insight prioritization

---

### Story 15.5: Learned Budget Thresholds (3 pts)

**Description:** App suggests budget limits based on spending history.

**Acceptance Criteria:**
- [ ] Threshold suggestion algorithm
- [ ] "Based on your history, typical [category] is $X/month"
- [ ] User confirmation flow
- [ ] Threshold adjustment UI

---

### Story 15.6: Threshold Proximity Alerts (2 pts)

**Description:** Alert users when approaching budget limits.

**Acceptance Criteria:**
- [ ] 75%, 90%, 100% threshold alerts
- [ ] Explicit (user-set) thresholds
- [ ] Learned (app-suggested) thresholds
- [ ] Non-intrusive notification style

---

### Story 15.7: Out-of-Character Detection (5 pts)

**Description:** Detect spending patterns that deviate from user's normal behavior.

**Acceptance Criteria:**
- [ ] Pattern baseline calculation
- [ ] Deviation detection algorithm
- [ ] "This is different for you" messaging
- [ ] Sensitivity configuration

---

### Story 15.8: Emotional Airlock Flow (3 pts)

**Description:** Implement Curiosity → Playfulness → Reveal sequence.

**Acceptance Criteria:**
- [ ] Step 1: Curiosity gate (normalizing stat)
- [ ] Step 2: Playful brace (absurdist fact)
- [ ] Step 3: Reveal ("Tu Espejo Honesto")
- [ ] Response options (Intentional / Didn't realize)
- [ ] Smooth transitions between steps

---

### ~~Story 15.9: Sankey Diagram Implementation~~ (REMOVED)

> **REMOVED 2025-12-31**: CSS was defined in analytics-polygon.html but the diagram was never actually rendered or used in any mockup. The treemap visualization (15.10) serves the same purpose more effectively.

---

### Story 15.9: Treemap Implementation (5 pts)

**Description:** Implement proportional spending breakdown.

**Mockup Reference:** [analytics-polygon.html](../../uxui/mockups/01_views/analytics-polygon.html), [home-dashboard.html](../../uxui/mockups/01_views/home-dashboard.html)

**Acceptance Criteria:**
- [ ] Treemap component
- [ ] Category-based tiling
- [ ] Size proportional to spending
- [ ] Interactive drill-down
- [ ] Entry animation

---

### Story 15.10: Monthly Milestone View (3 pts)

**Description:** Celebrate monthly progress with milestone display.

**Mockup Reference:** [goals-gps.html](../../uxui/mockups/01_views/goals-gps.html) (milestone markers in GPS journey)

**Acceptance Criteria:**
- [ ] Monthly summary view
- [ ] Milestone achievements list
- [ ] Month-over-month comparison
- [ ] Celebration animations

---

### ~~Story 15.11: Shareable Spending Personality~~ (REMOVED)

> **REMOVED 2025-12-31**: Not designed in any mockup. Feature was brainstormed but not included in UX design phase.

---

### Story 15.11: Themeable Skins Infrastructure (3 pts)

**Description:** Implement the 3-theme color palette system shown in Settings mockup.

**Mockup Reference:** [settings.html](../../uxui/mockups/01_views/settings.html) - "PALETA DE COLOR" section

**Available Themes:**
1. **Professional Blue** - Business-focused blue palette (default)
2. **Mono** - Monochrome minimal black/gray
3. **Ni No Kuni** - Studio Ghibli-inspired green/earth tones

**Acceptance Criteria:**
- [ ] Theme selection UI in Preferencias
- [ ] Theme swatches with visual preview
- [ ] CSS variables switch on theme change
- [ ] Theme persisted in user settings
- [ ] Works with light/dark mode independently
- [ ] Logo gradient updates per theme

---

## Dependencies

- Epic 14 complete (animation framework, polygon, celebrations)
- Insight Engine from Epic 10 for pattern detection

## References

- [Epic 14: Core Implementation](../epic14/epic-14-core-implementation.md)
- [Epic 13: UX Design & Mockups](../epic13/epic-13-ux-design-mockups.md)
- [Brainstorming Session](../../analysis/brainstorming-session-2025-12-22.md)
