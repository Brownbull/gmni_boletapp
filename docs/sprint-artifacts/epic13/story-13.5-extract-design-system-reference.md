# Story 13.5: Extract Design System Reference

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Done
**Story Points:** 2
**Type:** Workflow Execution
**Dependencies:** Story 13.4 (Design System HTML)
**Priority:** HIGH - Blocks all mockup stories (13.6-13.13)

---

## User Story

As a **designer/AI agent**,
I want **a compact reference file extracted from the design system**,
So that **I can build screen mockups using ONLY established components without context overflow**.

---

## Background

Story 13.4 creates the master `design-system-final.html` with all components. However:
- The full HTML file may be too large for AI context
- We need a compact reference (<4000 tokens) for efficient screen building
- The reference must include copy-paste ready snippets
- Prescriptive validation rules must be documented

This story uses the **design-system-mockup-builder** workflow Phase 1 to extract and validate the reference.

---

## Workflow

**Workflow:** `design-system-mockup-builder` Phase 1
**Location:** `_bmad/bmm/workflows/design-system-mockup-builder/`

### Phase 1 Steps:
1. **step-01-init.md** - Initialize, detect state
2. **step-02-validate-source.md** - Validate design-system-final.html exists
3. **step-03-extract.md** - Extract tokens and components
4. **step-04-create-reference.md** - Create reference file
5. **step-05-validate-reference.md** - Validate extraction completeness

---

## Acceptance Criteria

- [x] **AC #1:** Workflow Phase 1 executed successfully
- [x] **AC #2:** Reference file created at `docs/uxui/mockups/00_components/design-system-reference.md`
- [x] **AC #3:** Reference file under 4000 tokens (~1800 tokens)
- [x] **AC #4:** All design tokens extracted (colors, spacing, typography, radii, shadows)
- [x] **AC #5:** All components catalogued with HTML/CSS snippets
- [x] **AC #6:** Canonical icon mapping documented
- [x] **AC #7:** Prescriptive validation rules documented:
  - Spanish nav labels: Inicio, Analíticas, Ideas, Ajustes
  - Camera icon for center button (NOT scan)
  - CSS variables only (no hardcoded hex)
  - scan-center: margin-top -56px
- [x] **AC #8:** Reference validated against checklist

---

## Input

**Source File:** `docs/uxui/mockups/00_components/design-system-final.html`

This file must exist and be valid before running this story.

---

## Output

**Reference File:** `docs/uxui/mockups/00_components/design-system-reference.md`

### Expected Structure:
```markdown
# Gastify Design System Reference
<!-- Generated from design-system-final.html -->
<!-- Size target: <4000 tokens -->

## Design Tokens
- Colors (variable names)
- Spacing
- Typography
- Border Radii
- Shadows

## Navigation Components
- Bottom Nav (with HTML/CSS snippets)
- Top Bar (with HTML/CSS snippets)

## Cards
[Component snippets]

## Charts
[Component snippets]

## Canonical Icons
[Icon mapping table]

## Prescriptive Validation Rules
[MUST/MUST NOT rules]
```

---

## Prescriptive Rules (Non-Negotiable)

These rules MUST be included in the reference:

### Navigation Labels (Spanish)
```
Inicio | Analíticas | [Camera] | Ideas | Ajustes
```

### Center Button Icon (Camera, NOT Scan)
```svg
<svg viewBox="0 0 24 24">
  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
  <circle cx="12" cy="13" r="3"/>
</svg>
```

### Color Usage
```css
/* CORRECT */
color: var(--primary);
background: var(--bg-secondary);

/* FORBIDDEN */
color: #0d9488;
background: #f8fafc;
```

### Scan Center Position
```css
.scan-center {
  margin-top: -56px; /* CORRECT */
  /* NOT -32px */
}
```

---

## Definition of Done

- [x] Workflow Phase 1 completed without errors
- [x] Reference file exists and is under 4000 tokens
- [x] All components from design system are catalogued
- [x] Validation checklist passed
- [x] Ready for Phase 2 (screen mockups)

---

## Impact on Epic 13

This story **unblocks** all remaining mockup stories:
- 13.6 Home Dashboard
- 13.7 Analytics with Polygon
- 13.8 Transaction List
- 13.9 Scan Overlay
- 13.10 Goals + GPS
- 13.11 Reports
- 13.12 Insights
- 13.13 Settings

Once this story is complete, all mockup stories can proceed **independently** using Workflow Phase 2.

---

## How to Execute

1. Ensure Story 13.4 is complete and `design-system-final.html` exists
2. Invoke the workflow: `/bmad:bmm:workflows:design-system-mockup-builder`
3. Follow Phase 1 steps (init → validate → extract → create → validate)
4. Approve the reference file when prompted
5. Workflow will save to `design-system-reference.md`

---

## Notes

- The reference file is the **single source of truth** for all screen mockups
- Each mockup story (13.6-13.13) will run Workflow Phase 2 independently
- This prevents context overflow by keeping each screen build separate
- Reference file is reusable across all mockup sessions

---

---

## Dev Agent Record

### Implementation Date
2025-12-27

### Approach
Executed atlas-dev-story workflow to extract design system reference from design-system-final.html. Used grep and read tools to analyze the 591KB source file in sections, extracting:
- CSS custom properties (colors, spacing, radii, shadows, typography)
- Navigation components with Spanish labels
- Card and transaction item patterns
- Button styles
- Category badge colors
- Canonical icon SVG paths
- Phone frame mockup container

### Completion Notes
- Reference file created at ~1800 tokens (well under 4000 limit)
- All prescriptive validation rules documented
- Corrected Spanish label "Analíticas" (with accent) from source "Analiticas"
- Camera icon correctly specified for center button

### Atlas Code Review Notes (2025-12-27)
**6 issues found and fixed:**
1. ✅ CLP currency format: Changed comma separator ($45,200) to dot separator ($45.200)
2. ✅ Added Implementation Status Legend (🟢 CURRENT / 🟡 FUTURE)
3. ✅ Added Use Case Mapping table (links to Story 13.1 use cases)
4. ✅ Added Themes & Fonts documentation (3 themes, 2 fonts from source)
5. ✅ Added Accessibility Requirements section (prefers-reduced-motion, ARIA)
6. ✅ Updated Quick Reference with CLP format reminder and font options

**Branding clarification:** "Gastify" is the correct user-facing app brand (NOT "Boletapp" which is the internal project name). Updated Atlas lessons to prevent future confusion.

---

## File List

| File | Action | Description |
|------|--------|-------------|
| docs/uxui/mockups/00_components/design-system-reference.md | Created + Fixed | Compact reference file for AI mockup building |
| docs/sprint-artifacts/epic13/story-13.5-extract-design-system-reference.md | Modified | Story file with completed ACs + code review |
| docs/sprint-artifacts/sprint-status.yaml | Modified | Story status updated |
| _bmad/agents/atlas/atlas-sidecar/knowledge/06-lessons.md | Modified | Added Gastify branding pattern (#28), corrected 13.4 review notes |

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-27 | 1.0 | Story created as part of Epic 13 restructuring |
| 2025-12-27 | 1.1 | Story completed - reference file extracted |
| 2025-12-27 | 1.2 | Atlas Code Review APPROVED with 6 fixes |
