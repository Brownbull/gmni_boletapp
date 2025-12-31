# Story 13.12: Mockup - Insights Redesign

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Done
**Story Points:** 3
**Completed:** 2025-12-31
**Type:** Design/Mockup
**Dependencies:** Stories 13.1-13.3 (foundation docs)

---

## User Story

As a **user receiving insights**,
I want **an engaging carousel with thoughtful delivery of difficult truths**,
So that **I feel informed and empowered, not judged or defensive**.

---

## Acceptance Criteria

- [x] **AC #1:** Carousel mockup with swipeable insight cards
- [x] **AC #2:** Airlock sequence mockup (all 3 steps)
- [x] **AC #3:** "Intentional?" dialog mockup
- [x] **AC #4:** Personal record celebration mockup
- [x] **AC #5:** Validated against Tomás persona

---

## Key Elements to Design

### Insight Carousel
- Horizontal swipeable cards
- Larger, more visual than current
- Category color backgrounds
- Swipe indicators

### Insight Card Types
1. **Observation Card:** Pattern detected
2. **Comparison Card:** vs. last week/month
3. **Trade-off Card:** Goal-connected insight
4. **Celebration Card:** Personal record
5. **Airlock Card:** Difficult truth (triggers sequence)

### "Intentional or Accidental?" Dialog
- Non-judgmental prompt
- Two response buttons
- Records response for learning
- Example: "Restaurants up 23% - ¿lo tenías planeado?"

### Personal Record Celebration
- "¡Nuevo récord personal!"
- Confetti or celebration animation
- Specific achievement: "Tu semana más baja en restaurantes en 3 meses"
- Share option (optional)

---

## Emotional Airlock Sequence

### Step 1: Curiosity Gate
- Normalizing fact
- "¿Sabías que el 73% de las personas subestiman cuánto gastan en delivery?"
- Tappable to continue

### Step 2: Playful Brace
- Absurdist fact to disarm
- "Los pulpos tienen 3 corazones y sangre azul..."
- "La vida es rara. Los datos también."
- Tappable to continue

### Step 3: The Reveal
- "Tu Espejo Honesto"
- Actual insight delivered
- Non-judgmental framing
- Response options: "Fue intencional" / "No me había dado cuenta"

---

## Persona Validation

**Tomás (34, Disciplined Accountant)**
- Drifting without realizing
- Needs honest feedback
- Should feel informed, not preached at
- Airlock prepares him emotionally

---

## Deliverable

**File:** `docs/uxui/mockups/01_views/insights.html`

**Implemented Views:**
1. **Insights List View** - Time-grouped list with insight items (Esta Semana, Semana Anterior)
2. **Carousel View** - Swipeable insight cards with dot indicators (Quirky, Celebration, Actionable)
3. **Airlock View** - Complete 3-step emotional sequence (Curiosity Gate → Playful Brace → The Reveal)
4. **Celebration View** - Personal record card with badge unlock

**Components Used:**
- Section Headers (time grouping)
- Insight List Items (36x36 icons, title, meta, chevron)
- Insight Cards (carousel version with close button)
- Airlock Cards (animated emoji, progress dots)
- Celebration Card (stats, share button)
- "Intentional?" Dialog (modal overlay)

**Design System Compliance:**
- CSS variables only (no hardcoded colors)
- Spanish navigation labels (Inicio, Analíticas, Ideas, Ajustes)
- Camera icon for center button
- Theme/font switcher for testing variations

---

## Definition of Done

- [x] Carousel mockup complete
- [x] All insight card types designed
- [x] Airlock 3-step sequence complete
- [x] "Intentional?" dialog designed
- [x] Celebration mockup complete
- [x] Tomás persona validation passed
- [ ] Reviewed by Gabe

---

## Context References

- **UX Spec Section 10.4:** Tomás - Emotional Airlock pattern
- **UX Spec Section 10.6:** EmotionalAirlock component
- **Persona:** Tomás in [brainstorming-session-2025-12-22.md](../../analysis/brainstorming-session-2025-12-22.md)
- **Epic Definition:** Story 13.10 in [epic-13-ux-design-mockups.md](./epic-13-ux-design-mockups.md)

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
| 2025-12-31 | 2.0 | Mockup complete - insights.html with List, Carousel, Airlock, Celebration views |
