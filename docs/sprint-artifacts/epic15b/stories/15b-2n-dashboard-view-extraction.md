# Story 15b-2n: DashboardView Further Extraction

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 3
**Priority:** MEDIUM
**Status:** drafted

## Description

Further decompose DashboardView.tsx (1,485 lines) which was reduced from 3,412 in Epic 15. Plateaued view — target <1,200 lines.

## Acceptance Criteria

- [ ] **AC1:** DashboardView.tsx reduced to <1,200 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Tests pass before AND after extraction
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** Fan-out decreased from 31
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Analyze remaining inline logic
  - [ ] Dashboard sections not yet extracted
  - [ ] Event handlers
  - [ ] Data transformation logic
- [ ] **Task 3:** Extract ~285+ lines into sub-files
- [ ] **Task 4:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/dashboard/views/DashboardView/DashboardView.tsx` | MODIFY | Reduce from 1,485 to <1,200 |
| `src/features/dashboard/views/DashboardView/*.ts(x)` | CREATE | Additional extracted sub-files |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- DashboardView already has 10 sub-files — this adds more
- ~285 lines need extraction — moderate effort
- 31 outgoing deps — decomposition should reduce coupling
