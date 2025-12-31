# Story 13.1: Critical Use Cases Document

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Done
**Story Points:** 3
**Type:** Documentation
**Dependencies:** Brainstorming Session 2025-12-22

---

## User Story

As a **product team**,
I want **documented critical user journeys**,
So that **we can validate mockups against real scenarios and enable E2E testing**.

---

## Acceptance Criteria

- [x] **AC #1:** 6 critical use cases documented with step-by-step flows
- [x] **AC #2:** Each use case mapped to a persona (María, Diego, Rosa, Tomás, Power User, New User)
- [x] **AC #3:** Expected UI states and transitions specified for each step
- [x] **AC #4:** Success metrics defined per journey
- [x] **AC #5:** Edge cases and error states documented
- [x] **AC #6:** Format compatible with Claude Code Chrome extension E2E testing

---

## Use Cases to Document

### UC1: First Scan Experience
**Persona:** New user
**Flow:** App open → Scan → Progressive reveal → Quick Save → Celebration
**Success Metric:** < 60s from scan to saved transaction

### UC2: Weekly Health Check
**Persona:** María (overwhelmed parent)
**Flow:** Open app → Breathing polygon → Swipe story → "Intentional?" prompt
**Success Metric:** Answers "where did my money go?" in < 10s

### UC3: Goal Progress
**Persona:** Diego (young professional)
**Flow:** Check GPS → See "3 days closer" → View trade-off insight
**Success Metric:** Feels motivated, not guilty

### UC4: Simple Summary
**Persona:** Rosa (abuelita)
**Flow:** View arrows ↑↓→ → "Carnes subió harto" → Confirm understanding
**Success Metric:** Understands without asking for help

### UC5: Out-of-Character Alert
**Persona:** Tomás (disciplined accountant)
**Flow:** Airlock → Curiosity → Reveal → "Fue intencional" response
**Success Metric:** Feels informed, not judged

### UC6: Batch Scan Session
**Persona:** Power user
**Flow:** Scan 5 → Batch summary → Quick Save all → Aggregate insight
**Success Metric:** < 3 min for 5 receipts

---

## Deliverable

**File:** `docs/uxui/use-cases-e2e.md`

**Format:**
```markdown
# Use Case X: [Name]

## Persona
[Name, brief description]

## Preconditions
- [State before journey starts]

## Steps
1. [Action] → [Expected UI state]
2. [Action] → [Expected UI state]
...

## Success Criteria
- [Measurable outcome]

## Edge Cases
- [What if X happens?]

## Error States
- [Error condition] → [Expected handling]
```

---

## Definition of Done

- [x] All 6 use cases documented (expanded to 8 after review)
- [x] Each use case has step-by-step flow
- [x] UI states described (can reference future mockups)
- [x] Success metrics quantified
- [x] Edge cases covered
- [x] Document reviewed by Gabe (Atlas Code Review 2025-12-23)

---

## Context References

- **Brainstorming Session:** [brainstorming-session-2025-12-22.md](../../analysis/brainstorming-session-2025-12-22.md)
- **Epic Definition:** [epic-13-ux-design-mockups.md](./epic-13-ux-design-mockups.md)
- **Tech Context:** [tech-context-epic13.md](./tech-context-epic13.md)

---

## Dev Agent Record

### Implementation Plan
- Create comprehensive use-cases-e2e.md document at docs/uxui/use-cases-e2e.md
- Document all 6 use cases with full detail per story requirements
- Include Gherkin test scenarios for Claude Code Chrome extension compatibility
- Add appendices for UI state reference, success metrics, and persona quick reference

### Debug Log
- No issues encountered during implementation

### Completion Notes
- ✅ Created docs/uxui/use-cases-e2e.md with 6 comprehensive use cases
- ✅ Each use case includes: Persona, Preconditions, Steps with UI states, Success Criteria, Edge Cases, Error States, Chrome Extension Test Scenario
- ✅ Added Gherkin-format test scenarios compatible with E2E testing frameworks
- ✅ Added 3 appendices: UI State Reference, Success Metrics Summary, Persona Quick Reference
- ✅ All personas mapped: New User (UC1), María (UC2), Diego (UC3), Rosa (UC4), Tomás (UC5), Power User (UC6)

---

## File List

| File | Action | Description |
|------|--------|-------------|
| docs/uxui/use-cases-e2e.md | Created + Updated | 8 critical use cases for E2E testing (expanded after review) |

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
| 2025-12-23 | 1.1 | Implementation complete - all 6 use cases documented |
| 2025-12-23 | 1.2 | Atlas Code Review - expanded to 8 UCs, added status legend, locale appendix |