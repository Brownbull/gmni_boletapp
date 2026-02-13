# Story 15b-1c: Consolidate features/transaction-editor/

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Description

Move TransactionEditorView directory (8 files), EditView, and editor-related hooks into `features/transaction-editor/`. The feature currently has 5 files (541 lines) — this story consolidates the remaining scattered editor code.

## Acceptance Criteria

- [ ] **AC1:** TransactionEditorView/ directory moved into `features/transaction-editor/views/`
- [ ] **AC2:** EditView.tsx moved into `features/transaction-editor/views/`
- [ ] **AC3:** Editor-related hooks moved into `features/transaction-editor/hooks/`
- [ ] **AC4:** Test files migrated alongside source files
- [ ] **AC5:** All imports updated — 0 references to old paths
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Move TransactionEditorView/ directory into feature
  - [ ] Move all ~8 files
  - [ ] Update internal imports
- [ ] **Task 2:** Move EditView.tsx into `features/transaction-editor/views/`
- [ ] **Task 3:** Move editor hooks from `src/hooks/` to feature
  - [ ] `useTransactionEditorHandlers.ts` and related hooks
  - [ ] `useActiveTransaction.ts` if editor-specific
- [ ] **Task 4:** Migrate test files to mirror structure
- [ ] **Task 5:** Update all consumer imports
- [ ] **Task 6:** Update feature barrel `index.ts`

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/views/TransactionEditorView/` (~8 files) | MOVE | → `src/features/transaction-editor/views/` |
| `src/views/EditView.tsx` | MOVE | → `src/features/transaction-editor/views/` |
| `src/hooks/useTransactionEditorHandlers.ts` | MOVE | → `src/features/transaction-editor/hooks/` |
| `src/hooks/useActiveTransaction.ts` | MOVE | → `src/features/transaction-editor/hooks/` |
| Test mirrors | MOVE | → `tests/unit/features/transaction-editor/` |
| `src/features/transaction-editor/index.ts` | MODIFY | Add new exports |

## Dev Notes

- EditView (1,811 lines) is the largest never-scoped view — it moves here but gets decomposed in 15b-2a
- TransactionEditorViewInternal (1,421 lines) was partially decomposed in Epic 15 Phase 5d
- Both are oversized but decomposition is Phase 2 — this story only moves files
