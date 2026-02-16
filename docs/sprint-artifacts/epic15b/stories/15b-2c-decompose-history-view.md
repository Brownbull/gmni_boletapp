# Story 15b-2c: Decompose HistoryView

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Decompose HistoryView.tsx (1,168 lines, 15+ hooks) into smaller sub-files. Never-scoped view moved into `features/history/` in Phase 1. Target: <800 lines.

## Acceptance Criteria

- [ ] **AC1:** HistoryView.tsx reduced to <800 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Behavior snapshot: all existing tests pass before AND after
- [ ] **AC4:** No new functionality added
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests — establish baseline
- [ ] **Task 2:** Analyze HistoryView — identify extractable sections
  - [ ] Filter/sort logic → helpers
  - [ ] List rendering sections → components
- [ ] **Task 3:** Extract pure functions first
- [ ] **Task 4:** Extract UI sub-sections
- [ ] **Task 5:** Run tests after each extraction

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/history/views/HistoryView.tsx` | MODIFY | Reduce from 1,168 to <800 lines |
| `src/features/history/views/historyViewHelpers.ts` | CREATE | Extracted pure functions |
| `src/features/history/components/HistoryView*.tsx` | CREATE | Extracted sub-sections |
| Tests for extracted files | CREATE | Unit tests |

## Dev Notes

- HistoryView has 27 outgoing deps (fan-out) — decomposition should reduce this
- Filter logic may overlap with `historyFilterUtils.ts` — deduplicate if found
