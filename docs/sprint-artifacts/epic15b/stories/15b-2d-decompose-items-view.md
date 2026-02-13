# Story 15b-2d: Decompose ItemsView

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Decompose ItemsView.tsx (1,003 lines, 18 hooks) into smaller sub-files. Never-scoped view moved into `features/items/` in Phase 1. Target: <800 lines.

## Acceptance Criteria

- [ ] **AC1:** ItemsView.tsx reduced to <800 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Behavior snapshot: tests pass before AND after
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Analyze ItemsView — identify extractable sections
  - [ ] Item list rendering → component
  - [ ] Item operations logic → helpers
- [ ] **Task 3:** Extract pure functions first
- [ ] **Task 4:** Extract UI sub-sections
- [ ] **Task 5:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/items/views/ItemsView.tsx` | MODIFY | Reduce from 1,003 to <800 lines |
| `src/features/items/views/itemsViewHelpers.ts` | CREATE | Extracted pure functions |
| `src/features/items/components/ItemsView*.tsx` | CREATE | Extracted sub-sections |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- ItemsView has 23 outgoing deps (fan-out) — 18 hooks is high
- Closest to the 800-line target — may only need ~200 lines extracted
- Focus on the largest render blocks and any inline utility functions
