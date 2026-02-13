# Story 15b-2k: Decompose historyFilterUtils.ts

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Decompose `historyFilterUtils.ts` (1,075 lines) inside `features/history/`. This utility file handles history list filtering, sorting, and grouping logic. Target: <800 lines.

## Acceptance Criteria

- [ ] **AC1:** historyFilterUtils.ts reduced to <800 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Tests pass before AND after extraction
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Categorize functions by domain
  - [ ] Filter predicate functions
  - [ ] Sort/grouping functions
  - [ ] Date range utility functions
- [ ] **Task 3:** Extract into domain-specific files
- [ ] **Task 4:** Update imports across consumers
- [ ] **Task 5:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/history/utils/historyFilterUtils.ts` | MODIFY | Reduce from 1,075 to <800 |
| `src/features/history/utils/historyGrouping.ts` | CREATE | Grouping/sorting logic |
| `src/features/history/utils/historyDateUtils.ts` | CREATE | Date range utilities |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- ~275 lines need extraction — look for the clearest function boundaries
- Filter utils often have pure predicate functions that are easy to test in isolation
- Check for overlap with shared date utilities (may deduplicate)
