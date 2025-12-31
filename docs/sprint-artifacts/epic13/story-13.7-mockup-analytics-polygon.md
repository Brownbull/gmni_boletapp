# Story 13.7: Mockup - Analytics with Polygon

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Ready for Dev
**Story Points:** 5
**Type:** Design/Mockup
**Dependencies:** Stories 13.1-13.3 (foundation docs)

---

## User Story

As a **user exploring my spending patterns**,
I want **rich visualizations like Sankey and Treemap charts**,
So that **I can understand money flow and proportional breakdown intuitively**.

---

## Acceptance Criteria

- [ ] **AC #1:** Sankey diagram mockup showing money flow
- [ ] **AC #2:** Treemap mockup showing proportional breakdown
- [ ] **AC #3:** Swipe gesture indicators for time navigation
- [ ] **AC #4:** Drill-down filter system designed
- [ ] **AC #5:** Full-screen mode for deep exploration

---

## Key Elements to Design

### Sankey Diagram View
- Shows money flow: Income → Categories → Subcategories
- Interactive nodes (tap to filter)
- Color-coded by category
- Animated flow lines

### Treemap View
- Proportional rectangles by spending
- Nested categories visible
- Tap to zoom into category
- Color intensity by amount

### Time Navigation
- Swipe left/right to change period
- Visual indicator of current period
- Works with existing breadcrumb system

### Drill-Down System
- Filter by time, category, location
- Chip-based filter display
- Clear all filters option
- Filter persistence across views

### Full-Screen Mode
- Expand chart to full viewport
- Hide navigation temporarily
- Gesture to exit
- Optimal for detailed analysis

---

## Design States

### Sankey - Default
- Current month income → expenses
- Top 5-6 categories
- "Other" for remainder

### Sankey - Filtered
- Single category expanded
- Subcategory breakdown
- Back navigation clear

### Treemap - Default
- All categories proportional
- Labels for top categories
- Color by category

### Treemap - Zoomed
- Single category fills screen
- Subcategories/stores visible
- Breadcrumb shows path

---

## Deliverable

**Files:**
- `docs/uxui/mockups/analytics-sankey.excalidraw`
- `docs/uxui/mockups/analytics-treemap.excalidraw`

Or Figma with multiple frames.

**Include:**
- Both chart types with multiple states
- Swipe gesture indicators
- Filter chip designs
- Full-screen mode toggle
- Mobile viewport (375px)

---

## Definition of Done

- [ ] Sankey diagram mockup complete
- [ ] Treemap mockup complete
- [ ] Swipe indicators designed
- [ ] Drill-down filter system shown
- [ ] Full-screen mode designed
- [ ] Reviewed by Gabe

---

## Context References

- **UX Spec Section 10.6:** [ux-design-specification.md](../../ux-design-specification.md#106-new-component-patterns)
- **Tech Context:** [tech-context-epic13.md](./tech-context-epic13.md)
- **Epic Definition:** Story 13.5 in [epic-13-ux-design-mockups.md](./epic-13-ux-design-mockups.md)

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
