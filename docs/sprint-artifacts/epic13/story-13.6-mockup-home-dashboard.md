# Story 13.6: Mockup - Home Dashboard

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Done
**Story Points:** 3
**Type:** Design/Mockup
**Dependencies:** Stories 13.1-13.3 (foundation docs)

---

## User Story

As a **user opening the app**,
I want **to see my financial health at a glance**,
So that **I immediately understand where I stand without drilling into details**.

---

## Acceptance Criteria

- [x] **AC #1:** Figma/Excalidraw mockup complete
- [x] **AC #2:** Dynamic Polygon with 3-6 sides based on categories
- [x] **AC #3:** Lava metaphor visualization (inner = spending, outer = budget)
- [x] **AC #4:** Animation notes included (breathing effect)
- [x] **AC #5:** Validated against María persona ("¿Dónde se fue la plata?")

---

## Key Elements to Design

### Dynamic Spending Polygon
- Central visual element
- 3-6 vertices based on top spending categories
- Inner polygon (actual spending) - warm/lava colors
- Outer polygon (budget) - cool/green colors
- Breathing animation on idle

### Today's Insight Card
- Single most relevant insight
- Non-judgmental observation
- Tap to expand or dismiss

### Recent Transactions Preview
- Last 3-5 transactions
- Quick access to full history
- Category color indicators

### Navigation Affordances
- Clear path to Analytics
- Scan button prominent (FAB)
- Goals access point

---

## Design States

### Default State
- Polygon showing current period
- Breathing animation active
- Today's insight visible

### Overspending State
- Polygon inner exceeds outer
- Visual warning (lava expanding)
- Non-judgmental insight

### Empty State (New User)
- Simplified polygon or placeholder
- "Scan your first receipt" CTA
- Welcoming message

---

## Persona Validation

**María (38, Overwhelmed Parent)**
- Opens app wondering "¿Dónde se fue la plata?"
- Should answer this question within 10 seconds
- Polygon shows category breakdown at a glance
- No need to navigate to see basic health

---

## Deliverable

**File:** `docs/uxui/mockups/home-dashboard.excalidraw` or Figma link

**Include:**
- Default state mockup
- Overspending state mockup
- Empty state mockup
- Animation timing notes
- Color specifications

---

## Definition of Done

- [x] Mockup complete with all states
- [x] Polygon with variable sides (3, 5, 6 examples)
- [x] Lava metaphor clear
- [x] Animation notes documented
- [x] María persona validation passed
- [x] Reviewed by Gabe (Atlas Code Review 2025-12-23)

---

## Context References

- **UX Spec Section 10.5:** [ux-design-specification.md](../../ux-design-specification.md#105-key-visual-concepts)
- **Tech Context:** [tech-context-epic13.md](./tech-context-epic13.md)
- **Persona:** María in [brainstorming-session-2025-12-22.md](../../analysis/brainstorming-session-2025-12-22.md)

---

## Tasks

- [x] Create docs/uxui/mockups directory
- [x] Create home-dashboard.excalidraw with all three states
- [x] Create home-dashboard.md specification document
- [x] Document Dynamic Polygon with 5-vertex example
- [x] Implement Lava metaphor (inner orange/red, outer green)
- [x] Add breathing animation notes (3s normal, 2s overspend)
- [x] Validate against María persona
- [x] Document color specifications
- [x] Add component interaction patterns

---

## Dev Agent Record

### Implementation Approach (2025-12-27)

Created comprehensive Home Dashboard mockup following Atlas-guided workflow with design-system-reference.md patterns:

1. **Interactive HTML Mockup** (`home-dashboard.html`)
   - Three switchable states: Default, Overspending, Empty
   - Working breathing animation with toggle for accessibility testing
   - Complete component specifications panel
   - María persona validation checklist

2. **Detailed Specification** (`home-dashboard.md`)
   - Complete screen layout specifications
   - Dynamic Polygon geometry (3-6 vertices)
   - Lava metaphor color gradients with CSS variables
   - Animation timing aligned with motion-design-system.md
   - Component patterns from design-system-reference.md
   - Use case mapping to UC2 (Weekly Health Check)

### Key Design Decisions

1. **Polygon Vertices:** 5 vertices shown (Supermercado, Restaurantes, Transporte, Salud, Entretención)
2. **Breathing Animation:** 3s cycle (healthy), 2s cycle (overspending) per motion-design-system.md
3. **Lava Gradient:** Radial gradient #fbbf24 → #f97316 → #ef4444 (core to edge)
4. **Budget Boundary:** Dashed green (#22c55e) stroke, 2px
5. **María Validation:** <10 second answer to "¿Dónde se fue la plata?"
6. **Voice & Tone:** Non-judgmental messaging per voice-tone-guidelines.md

### Files Created

| File | Purpose |
|------|---------|
| `docs/uxui/mockups/home-dashboard.html` | **Interactive HTML mockup** with all 3 states, working animations, specs panel |
| `docs/uxui/mockups/home-dashboard.md` | Detailed specification document for Epic 14 implementation |

### Patterns Applied (Atlas Architecture)

- Breathing animation from `motion-design-system.md` Section 3.1
- Voice & Tone from `voice-tone-guidelines.md` (non-judgmental)
- Component patterns from `design-system-reference.md`
- Reduced motion fallback patterns (CSS @media query)
- GPU-accelerated transforms (scale, opacity, will-change)
- CLP currency format ($xxx.xxx) per design-system-reference.md
- Spanish navigation labels per design-system-reference.md (Inicio, Analíticas, Ideas, Ajustes)
- Camera icon (NOT scan) for center FAB per design-system-reference.md

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
| 2025-12-23 | 1.1 | Story acceptance criteria defined |
| 2025-12-27 | 2.0 | Implementation complete - HTML mockup and MD specification created via atlas-dev-story workflow |
| 2025-12-29 | 2.1 | Atlas Code Review APPROVED - 0 blocking issues, minor doc inconsistencies accepted |
