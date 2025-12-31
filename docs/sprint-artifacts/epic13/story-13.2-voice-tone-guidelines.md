# Story 13.2: Voice & Tone Guidelines

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Done
**Story Points:** 2
**Type:** Documentation
**Dependencies:** Story 13.1 (Use Cases)

---

## User Story

As a **designer/developer**,
I want **documented voice and tone guidelines**,
So that **all app messaging is consistent, non-judgmental, and culturally appropriate**.

---

## Acceptance Criteria

- [x] **AC #1:** 5 voice principles documented with Do/Don't examples
- [x] **AC #2:** Message templates for insights, alerts, celebrations, setbacks
- [x] **AC #3:** Rosa-friendly alternatives for all technical messages
- [x] **AC #4:** Chilean Spanish language adaptation guide
- [x] **AC #5:** Minimum 3 example messages per tone category

---

## Voice Principles to Document

### 1. Observes Without Judging
- State facts, not opinions
- **Do:** "Restaurants up 23%"
- **Don't:** "You overspent on restaurants"

### 2. Reveals Opportunity
- Show trade-offs without guilt
- **Do:** "This week's coffee = 1 day further from Tokyo"
- **Don't:** "You could have saved this money"

### 3. Invites Experimentation
- Suggest, don't prescribe
- **Do:** "What if you tried...?"
- **Don't:** "You should try..."

### 4. Celebrates Progress
- Highlight wins, however small
- **Do:** "Your lowest restaurant week in 3 months!"
- **Don't:** Generic "Good job!"

### 5. Normalizes Setbacks
- Life happens, data reflects that
- **Do:** "La vida es rara. Los datos también."
- **Don't:** "You failed to meet your goal"

---

## Message Categories

### Insight Messages
- Pattern observations
- Trade-off notifications
- Trend alerts

### Alert Messages
- Budget proximity (75%, 90%, 100%)
- Out-of-character spending
- Goal progress changes

### Celebration Messages
- Personal records
- Goal milestones
- Consistency streaks

### Setback Messages
- Budget exceeded
- Goal delayed
- Pattern disruption

### System Messages
- Loading states
- Error states
- Empty states

---

## Chilean Spanish Adaptations

| Standard Spanish | Chilean Adaptation |
|------------------|-------------------|
| "Incrementó 27%" | "Subió harto" |
| "¿Fue intencional?" | "¿Lo tenías planeado?" |
| "Análisis completo" | Simple alternative needed |

---

## Deliverable

**File:** `docs/uxui/voice-tone-guidelines.md`

---

## Definition of Done

- [x] 5 voice principles with examples
- [x] Message templates for all categories
- [x] Rosa-friendly alternatives documented
- [x] Chilean language guide complete
- [x] Document reviewed by Gabe (Atlas Code Review)

---

## Tasks

- [x] Create voice-tone-guidelines.md document
- [x] Document 5 voice principles with Do/Don't tables
- [x] Create message templates for all 5 categories
- [x] Add Rosa-friendly alternatives section
- [x] Add Chilean Spanish adaptation guide
- [x] Include Emotional Airlock pattern documentation
- [x] Add writing checklist and quick reference

---

## Context References

- **Brainstorming Session:** [brainstorming-session-2025-12-22.md](../../analysis/brainstorming-session-2025-12-22.md)
- **UX Spec Section 10.2:** [ux-design-specification.md](../../ux-design-specification.md#102-the-boletapp-voice)

---

## Dev Agent Record

### Implementation Plan
Created comprehensive voice and tone guidelines document at `docs/uxui/voice-tone-guidelines.md` containing:
- Executive summary and core philosophy ("Mirror, not judge")
- 5 detailed voice principles with Do/Don't tables and example messages
- Message templates for all 5 categories (Insights, Alerts, Celebrations, Setbacks, System)
- Rosa-friendly alternatives section with technical translations
- Chilean Spanish language adaptation guide with regional expressions
- Emotional Airlock pattern documentation for sensitive insights
- Writing checklist and quick reference card

### Completion Notes
All acceptance criteria satisfied:
- AC #1: 5 voice principles documented with extensive Do/Don't examples
- AC #2: 5 message categories with templates (Insights, Alerts, Celebrations, Setbacks, System)
- AC #3: Rosa-friendly alternatives table with 10+ technical term translations
- AC #4: Chilean Spanish section with regional expressions, playful guesses, words to avoid
- AC #5: Each category has 3+ example messages with templates

---

## File List

| File | Action |
|------|--------|
| docs/uxui/voice-tone-guidelines.md | Created |
| docs/sprint-artifacts/epic13/story-13.2-voice-tone-guidelines.md | Modified |
| docs/sprint-artifacts/sprint-status.yaml | Modified |

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
| 2025-12-23 | 1.1 | Implementation complete - voice-tone-guidelines.md created |
| 2025-12-23 | 1.2 | Atlas Code Review APPROVED - 4 issues fixed (use case mapping, pattern scope, epic context, CLP format) |
