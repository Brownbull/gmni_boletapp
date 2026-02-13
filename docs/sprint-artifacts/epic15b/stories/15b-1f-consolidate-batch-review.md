# Story 15b-1f: Consolidate features/batch-review/

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Move BatchCaptureView, BatchReviewView, remaining batch hooks, and batch components into `features/batch-review/`. The feature already has 27 files (4,498 lines) — this consolidates the ~15 remaining scattered files.

## Acceptance Criteria

- [ ] **AC1:** BatchCaptureView and BatchReviewView moved into `features/batch-review/views/`
- [ ] **AC2:** Batch hooks moved into `features/batch-review/hooks/`
- [ ] **AC3:** Remaining batch components moved into `features/batch-review/components/`
- [ ] **AC4:** Test files migrated alongside source files
- [ ] **AC5:** All imports updated — 0 references to old paths
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Move BatchCaptureView.tsx into `features/batch-review/views/`
- [ ] **Task 2:** Move BatchReviewView.tsx into `features/batch-review/views/`
- [ ] **Task 3:** Move batch hooks from `src/hooks/`
  - [ ] `useBatchCapture.ts`, `useBatchSession.ts`, `useBatchProcessing.ts`, etc.
- [ ] **Task 4:** Move remaining batch components from `src/components/`
- [ ] **Task 5:** Migrate test files to mirror structure
- [ ] **Task 6:** Update all consumer imports and barrel exports

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/BatchCaptureView.tsx` | MOVE | → `src/features/batch-review/views/` |
| `src/views/BatchReviewView.tsx` | MOVE | → `src/features/batch-review/views/` |
| `src/hooks/useBatch*.ts` | MOVE | → `src/features/batch-review/hooks/` |
| Batch components in `src/components/` | MOVE | → `src/features/batch-review/components/` |
| Test mirrors | MOVE | → `tests/unit/features/batch-review/` |
| `src/features/batch-review/index.ts` | MODIFY | Add new exports |

## Dev Notes

- BatchCaptureView (798 lines) is in the warning zone but below the 800-line decomposition threshold
- `useBatchReviewHandlers.ts` (768 lines) gets decomposed in 15b-2j after this move
- batch-review already has cross-feature deps to categories and scan — these are acceptable per dependency analysis
