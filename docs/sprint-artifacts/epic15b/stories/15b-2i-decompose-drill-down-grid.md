# Story 15b-2i: Decompose DrillDownGrid.tsx

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Decompose `DrillDownGrid.tsx` (808 lines) inside `features/analytics/`. This component renders the drill-down data grid for analytics. Target: <800 lines.

## Acceptance Criteria

- [ ] **AC1:** DrillDownGrid.tsx reduced to <800 lines
- [ ] **AC2:** Extracted components are each <400 lines
- [ ] **AC3:** Tests pass before AND after extraction
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Identify extractable sub-components
  - [ ] Grid row/cell components
  - [ ] Header component
  - [ ] Helper functions
- [ ] **Task 3:** Extract sub-components or helpers
- [ ] **Task 4:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/analytics/components/DrillDownGrid.tsx` | MODIFY | Reduce from 808 to <800 |
| `src/features/analytics/components/DrillDownRow.tsx` | CREATE | Extracted row component |
| `src/features/analytics/components/drillDownHelpers.ts` | CREATE | Extracted helpers |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- Only 8 lines over threshold — minimal extraction needed
- Grid components typically have row renderers that naturally separate
- Look for inline sub-components first
