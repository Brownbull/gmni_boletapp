# Story 15b-2g: Decompose SankeyChart.tsx

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Decompose `SankeyChart.tsx` (890 lines) inside `features/analytics/`. This React component renders the Sankey flow diagram. Target: <800 lines.

## Acceptance Criteria

- [ ] **AC1:** SankeyChart.tsx reduced to <800 lines
- [ ] **AC2:** Extracted components are each <400 lines
- [ ] **AC3:** Tests pass before AND after extraction
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Identify extractable sub-components
  - [ ] Tooltip/overlay components
  - [ ] Legend component
  - [ ] Render helper functions
- [ ] **Task 3:** Extract sub-components
- [ ] **Task 4:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/analytics/components/SankeyChart.tsx` | MODIFY | Reduce from 890 to <800 |
| `src/features/analytics/components/SankeyTooltip.tsx` | CREATE | Extracted tooltip |
| `src/features/analytics/components/sankeyChartHelpers.ts` | CREATE | Extracted render helpers |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- Only ~90 lines over threshold — minimal extraction needed
- Look for inline sub-components or render functions that can be named components
- Chart components often have tooltip logic that naturally separates
