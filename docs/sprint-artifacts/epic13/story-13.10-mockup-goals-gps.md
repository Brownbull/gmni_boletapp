# Story 13.10: Mockup - Goals + Savings GPS

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Ready for Dev
**Story Points:** 3
**Type:** Design/Mockup
**Dependencies:** Stories 13.1-13.3 (foundation docs)

---

## User Story

As a **user saving toward a goal**,
I want **a GPS-style visualization of my progress**,
So that **I can see my ETA, track progress, and understand trade-offs**.

---

## Acceptance Criteria

- [ ] **AC #1:** Goal creation flow mockup (name, emoji, amount, currency)
- [ ] **AC #2:** GPS visualization mockup with journey metaphor
- [ ] **AC #3:** Progress tracking states (on track, behind, ahead)
- [ ] **AC #4:** Trade-off insight integration ("Coffee = 1 day further")
- [ ] **AC #5:** Validated against Diego persona

---

## Key Elements to Design

### Goal Creation Flow
1. **Name & Emoji:** "🗾 Japan Trip"
2. **Target Amount:** $2,000,000
3. **Currency:** CLP (default from settings)
4. **Target Date:** Optional, or app suggests based on spending

### GPS Visualization
- Journey path from start to goal
- Current position marker with progress %
- ETA display: "Llegando el [fecha]"
- Milestone markers along path

### Alternate Routes
- "Recalculando..." when spending changes
- "Ahorra 10% más = 2 meses antes"
- Visual comparison of routes

### Goal-Connected Insights
- Link spending to goal impact
- "Esta semana en café: $13,500 = 1 día más lejos de Tokyo"
- Non-judgmental, opportunity-focused

---

## Design States

### On Track
- Green progress indicator
- Positive ETA message
- Encouraging insight

### Behind Schedule
- Amber indicator
- Adjusted ETA
- Alternate route suggestion

### Ahead of Schedule
- Blue/celebration indicator
- Earlier ETA
- Celebration message

### Goal Achieved
- Celebration animation
- "¡Llegaste!" message
- Option to create new goal

---

## Persona Validation

**Diego (26, Young Professional)**
- Saving for Japan trip
- Wants to see concrete progress
- Motivated by visualizing the connection between daily spending and goals
- Should feel motivated, not guilty

---

## Deliverable

**File:** `docs/uxui/mockups/goals-gps.excalidraw` or Figma

**Include:**
- Goal creation flow (3-4 screens)
- GPS visualization in multiple states
- Alternate routes display
- Goal-connected insight card
- Celebration state

---

## Definition of Done

- [ ] Goal creation flow complete
- [ ] GPS visualization with journey metaphor
- [ ] All progress states designed
- [ ] Trade-off insights integrated
- [ ] Diego persona validation passed
- [ ] Reviewed by Gabe

---

## Context References

- **UX Spec Section 10.5:** Savings GPS Visualization
- **Persona:** Diego in [brainstorming-session-2025-12-22.md](../../analysis/brainstorming-session-2025-12-22.md)
- **Epic Definition:** Story 13.8 in [epic-13-ux-design-mockups.md](./epic-13-ux-design-mockups.md)

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
