# Story 15b-1d: Consolidate features/history/

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Move HistoryView, history-related hooks, and `historyFilterUtils.ts` into `features/history/`. The feature currently has 18 files (5,545 lines) — this consolidates the remaining ~8 scattered files.

## Acceptance Criteria

- [ ] **AC1:** HistoryView.tsx moved into `features/history/views/`
- [ ] **AC2:** History-related hooks moved into `features/history/hooks/`
- [ ] **AC3:** `historyFilterUtils.ts` moved into `features/history/utils/`
- [ ] **AC4:** Test files migrated alongside source files
- [ ] **AC5:** All imports updated — 0 references to old paths
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Move HistoryView.tsx into `features/history/views/`
- [ ] **Task 2:** Move history hooks from `src/hooks/`
  - [ ] Identify history-specific hooks via import analysis
- [ ] **Task 3:** Move `shared/utils/historyFilterUtils.ts` to `features/history/utils/`
- [ ] **Task 4:** Migrate test files to mirror structure
- [ ] **Task 5:** Update all consumer imports
- [ ] **Task 6:** Update feature barrel `index.ts`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/HistoryView.tsx` | MOVE | → `src/features/history/views/` |
| `src/shared/utils/historyFilterUtils.ts` | MOVE | → `src/features/history/utils/` |
| `src/hooks/useHistory*.ts` | MOVE | → `src/features/history/hooks/` |
| Test mirrors | MOVE | → `tests/unit/features/history/` |
| `src/features/history/index.ts` | MODIFY | Add new exports |

## Dev Notes

- HistoryView (1,168 lines) is a never-scoped view — moves here, decomposed in 15b-2c
- `historyFilterUtils.ts` (1,075 lines) also needs decomposition in 15b-2k — but moves first
- Verify `historyFilterUtils` is truly history-specific (not used by other features) before moving
