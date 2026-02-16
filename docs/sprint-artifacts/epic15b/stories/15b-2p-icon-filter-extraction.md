# Story 15b-2p: IconCategoryFilter Further Extraction

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** LOW
**Status:** drafted

## Description

Further decompose IconCategoryFilter.tsx (1,106 lines) which was partially decomposed from IconFilterBar (1,797) in Epic 15 Phase 5e. Target: <800 lines (this is a feature-internal component, not a view).

## Acceptance Criteria

- [ ] **AC1:** IconCategoryFilter.tsx reduced to <800 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Tests pass before AND after extraction
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Analyze remaining filter logic
  - [ ] Filter rendering sections
  - [ ] Filter state management
  - [ ] Icon rendering helpers
- [ ] **Task 3:** Extract ~306+ lines into sub-files
- [ ] **Task 4:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/history/components/IconCategoryFilter.tsx` | MODIFY | Reduce from 1,106 to <800 |
| `src/features/history/components/IconFilterHelpers.ts` | CREATE | Extracted helpers |
| `src/features/history/components/IconFilter*.tsx` | CREATE | Extracted sub-components |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- Already has 2 dropdown files from Phase 5e extraction
- ~306 lines need extraction — moderate effort
- Focus on render blocks and any inline filter predicate logic
