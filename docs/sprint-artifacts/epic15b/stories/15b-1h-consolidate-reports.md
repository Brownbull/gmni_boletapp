# Story 15b-1h: Consolidate features/reports/

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 1
**Priority:** LOW
**Status:** drafted

## Description

Move ReportsView and remaining report components into `features/reports/`. The feature already has 14 files (5,297 lines) — this consolidates the ~3 remaining scattered files.

## Acceptance Criteria

- [ ] **AC1:** ReportsView.tsx moved into `features/reports/views/`
- [ ] **AC2:** Remaining report components moved into feature
- [ ] **AC3:** Test files migrated alongside source files
- [ ] **AC4:** All imports updated — 0 references to old paths
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Move ReportsView.tsx into `features/reports/views/`
- [ ] **Task 2:** Move remaining report components from `src/components/`
- [ ] **Task 3:** Migrate test files to mirror structure
- [ ] **Task 4:** Update all consumer imports and barrel exports

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/ReportsView.tsx` | MOVE | → `src/features/reports/views/` |
| Remaining report components | MOVE | → `src/features/reports/components/` |
| Test mirrors | MOVE | → `tests/unit/features/reports/` |
| `src/features/reports/index.ts` | MODIFY | Add new exports |

## Dev Notes

- ReportsView (575 lines) is in the warning zone but well below 800
- `reportUtils.ts` (2,401 lines) is already in the feature — decomposed in 15b-2e
- Small scope story — straightforward file moves
