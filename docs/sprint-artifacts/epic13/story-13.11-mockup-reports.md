# Story 13.11: Mockup - Weekly/Monthly Reports

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Ready for Dev
**Story Points:** 3
**Type:** Design/Mockup
**Dependencies:** Stories 13.1-13.3 (foundation docs)

---

## User Story

As a **user wanting periodic summaries**,
I want **story-format reports with swipeable cards**,
So that **I can quickly digest my spending patterns in an engaging, familiar format**.

---

## Acceptance Criteria

- [ ] **AC #1:** Card swipe flow mockup (Instagram-style)
- [ ] **AC #2:** Weekly summary card designs (multiple card types)
- [ ] **AC #3:** Monthly milestone card designs
- [ ] **AC #4:** Simple arrows format for Rosa (↑↓→)

---

## Key Elements to Design

### Card Format
- Full-screen cards (mobile viewport)
- Horizontal swipe navigation
- Progress dots at bottom
- Tap to pause/continue

### Weekly Summary Cards
1. **Overview Card:** Total spent, vs last week
2. **Top Categories Card:** Top 3 with percentages
3. **Highlight Card:** Biggest single purchase
4. **Pattern Card:** Day-of-week spending pattern
5. **Insight Card:** Personalized observation
6. **Progress Card:** Goal progress (if goals exist)
7. **Wrap-up Card:** Summary + next week outlook

### Monthly Milestone Cards
1. **Month Total:** With trend vs previous month
2. **Category Breakdown:** Pie/bar visual
3. **Personal Records:** Any records set
4. **Goal Progress:** Monthly contribution
5. **Celebration:** If any milestones reached

### Rosa-Friendly Format
- Simple arrows: ↑ (up), ↓ (down), → (same)
- Plain language: "Subió harto", "Bajó un poco"
- Large, clear numbers
- Minimal text, maximum clarity

---

## Swipe Interaction

```
← Swipe left: Next card
→ Swipe right: Previous card
Tap: Pause auto-advance (if enabled)
Progress dots: Show position
```

---

## Design States

### Weekly Report
- 5-7 cards per week
- Available on Sunday/Monday
- Push notification option

### Monthly Report
- 5-6 cards per month
- Available on 1st of month
- Includes milestone celebrations

### First Report (New User)
- Simplified cards
- Encouraging messaging
- "More insights after more data"

---

## Deliverable

**File:** `docs/uxui/mockups/reports.excalidraw` or Figma

**Include:**
- Weekly card set (7 cards)
- Monthly card set (6 cards)
- Swipe indicators and progress dots
- Rosa-friendly variant cards
- Celebration animations notes

---

## Definition of Done

- [ ] Weekly card designs complete
- [ ] Monthly card designs complete
- [ ] Swipe flow documented
- [ ] Rosa-friendly format included
- [ ] Celebration animations noted
- [ ] Reviewed by Gabe

---

## Context References

- **UX Spec Section 10.5:** Story Format Reports
- **Persona:** Rosa in [brainstorming-session-2025-12-22.md](../../analysis/brainstorming-session-2025-12-22.md)
- **Epic Definition:** Story 13.9 in [epic-13-ux-design-mockups.md](./epic-13-ux-design-mockups.md)

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
