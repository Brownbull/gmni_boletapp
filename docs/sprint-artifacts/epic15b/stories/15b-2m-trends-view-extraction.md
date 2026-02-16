# Story 15b-2m: TrendsView Further Extraction

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 3
**Priority:** MEDIUM
**Status:** drafted

## Description

Further decompose TrendsView.tsx (1,981 lines) which was already reduced from 5,901 in Epic 15 Phase 5b. This is a plateaued view — target <1,200 lines (honest ceiling for an already-decomposed complex view).

## Acceptance Criteria

- [ ] **AC1:** TrendsView.tsx reduced to <1,200 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Tests pass before AND after extraction
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** Fan-out decreased from 36
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Analyze remaining inline logic — what wasn't extracted in Phase 5b
  - [ ] Inline render functions
  - [ ] State handler callbacks
  - [ ] Remaining helper logic
- [ ] **Task 3:** Extract ~780+ lines of logic into sub-files
  - [ ] Focus on render sections first
  - [ ] Then state handlers
- [ ] **Task 4:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/analytics/views/TrendsView/TrendsView.tsx` | MODIFY | Reduce from 1,981 to <1,200 |
| `src/features/analytics/views/TrendsView/*.ts(x)` | CREATE | Additional extracted sub-files |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- TrendsView already has 17 sub-files from Epic 15 — this adds more
- ~780 lines need extraction — substantial work requiring careful analysis of what's left
- 36 outgoing deps is the 2nd highest fan-out — decomposition should meaningfully reduce this
- Previous decomposition focused on chart sections — look at remaining handler logic and render blocks
