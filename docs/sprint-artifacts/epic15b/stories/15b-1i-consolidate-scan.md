# Story 15b-1i: Consolidate features/scan/

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Move ScanView, ScanResultView, and remaining scan hooks/components into `features/scan/`. The feature already has 32 files (7,453 lines) — this consolidates the ~5 remaining scattered files.

## Acceptance Criteria

- [ ] **AC1:** ScanView.tsx and ScanResultView.tsx moved into `features/scan/views/`
- [ ] **AC2:** Remaining scan hooks moved into `features/scan/hooks/`
- [ ] **AC3:** Test files migrated alongside source files
- [ ] **AC4:** All imports updated — 0 references to old paths
- [ ] **AC5:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Move ScanView.tsx into `features/scan/views/`
- [ ] **Task 2:** Move ScanResultView.tsx into `features/scan/views/`
- [ ] **Task 3:** Move remaining scan hooks from `src/hooks/`
  - [ ] `useScanHandlers.ts` (956 lines) — moves here, decomposed in 15b-2l
  - [ ] Other scan-specific hooks
- [ ] **Task 4:** Migrate test files to mirror structure
- [ ] **Task 5:** Update all consumer imports and barrel exports

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/ScanView.tsx` | MOVE | → `src/features/scan/views/` |
| `src/views/ScanResultView.tsx` | MOVE | → `src/features/scan/views/` |
| `src/hooks/useScanHandlers.ts` | MOVE | → `src/features/scan/hooks/` |
| Remaining scan hooks | MOVE | → `src/features/scan/hooks/` |
| Test mirrors | MOVE | → `tests/unit/features/scan/` |
| `src/features/scan/index.ts` | MODIFY | Add new exports |

## Dev Notes

- ScanResultView (1,554 lines) is a never-scoped view — decomposed in 15b-2b after this move
- `useScanHandlers.ts` (956 lines) needs decomposition in 15b-2l
- scan has cross-feature deps to categories and transaction-editor — both acceptable per analysis
