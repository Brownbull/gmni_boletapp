# Story 13.9: Mockup - Scan Overlay Flow

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Ready for Dev
**Story Points:** 3
**Type:** Design/Mockup
**Dependencies:** Stories 13.1-13.3 (foundation docs)

---

## User Story

As a **user scanning a receipt**,
I want **a non-blocking processing experience with progressive reveal**,
So that **I can see results appear item-by-item and feel the app is actively working**.

---

## Acceptance Criteria

- [ ] **AC #1:** Processing overlay mockup showing grayed-out edit view
- [ ] **AC #2:** Progress indicator design with ETA
- [ ] **AC #3:** Item reveal animation notes (progressive appearance)
- [ ] **AC #4:** Quick Save card mockup

---

## Key Elements to Design

### Processing Overlay
- Semi-transparent overlay on edit view
- Grayed-out background (edit view visible but inactive)
- Centered progress indicator
- ETA display ("Procesando... ~3s")

### Progress Indicator
- Circular or linear progress
- Animated scanning effect
- Receipt icon or animation
- Non-blocking (user can navigate away)

### Progressive Item Reveal
- Items appear one by one
- Staggered fade-in animation
- Category colors applied progressively
- Total updates as items appear

### Quick Save Card
- Compact summary of extracted data
- Merchant, date, total visible
- Item count indicator
- "Guardar" primary action
- "Editar" secondary action

---

## Flow Sequence

```
1. Camera/Upload
   └─→ Image captured

2. Processing Overlay
   └─→ Edit view grayed out
   └─→ Progress indicator centered
   └─→ "Procesando... ~3s"

3. Progressive Reveal
   └─→ Overlay fades
   └─→ Items appear one by one (50ms stagger)
   └─→ Merchant/date/total fill in

4. Quick Save Card
   └─→ Summary shown
   └─→ [Guardar] [Editar] options
```

---

## Design States

### Processing
- Overlay active
- Progress animating
- Background visible but inactive

### Revealing
- Overlay fading
- Items appearing progressively
- Edit fields becoming active

### Complete
- Full edit view visible
- Quick Save card shown
- All items displayed

### Error
- Error message overlay
- Retry option
- Manual entry fallback

---

## Deliverable

**File:** `docs/uxui/mockups/scan-overlay.excalidraw` or Figma

**Include:**
- Processing state mockup
- Progress indicator design
- Progressive reveal frames (animation storyboard)
- Quick Save card mockup
- Error state

---

## Definition of Done

- [ ] Processing overlay designed
- [ ] Progress indicator complete
- [ ] Item reveal animation documented
- [ ] Quick Save card designed
- [ ] Error state included
- [ ] Reviewed by Gabe

---

## Context References

- **Epic Definition:** Story 13.7 in [epic-13-ux-design-mockups.md](./epic-13-ux-design-mockups.md)
- **Existing Scan Flow:** Epic 11 Quick Save implementation
- **Motion Spec:** Story 13.3

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
