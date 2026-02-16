# Story 15b-2f: Decompose sankeyDataBuilder.ts

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Decompose `sankeyDataBuilder.ts` (1,037 lines) inside `features/analytics/`. This file builds complex Sankey chart data structures. Target: <800 lines.

## Acceptance Criteria

- [ ] **AC1:** `sankeyDataBuilder.ts` reduced to <800 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Tests pass before AND after extraction
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Analyze function domains in sankeyDataBuilder
  - [ ] Node creation logic
  - [ ] Link/edge calculation logic
  - [ ] Data transformation/normalization
- [ ] **Task 3:** Extract into domain-specific files
- [ ] **Task 4:** Update imports
- [ ] **Task 5:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/analytics/utils/sankeyDataBuilder.ts` | MODIFY | Reduce from 1,037 to <800 |
| `src/features/analytics/utils/sankeyNodes.ts` | CREATE | Node creation logic |
| `src/features/analytics/utils/sankeyLinks.ts` | CREATE | Link calculation logic |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- Sankey chart data is complex graph data — node and link logic are naturally separable
- Only ~237 lines need extraction — look for the clearest function boundaries
