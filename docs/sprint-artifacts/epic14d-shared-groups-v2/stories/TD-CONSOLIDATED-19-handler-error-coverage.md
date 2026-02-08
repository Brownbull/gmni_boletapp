# Tech Debt Story TD-CONSOLIDATED-19: Handler Error Handling & Test Coverage Gaps

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-08) on story TD-CONSOLIDATED-2
> **Priority:** MEDIUM
> **Estimated Effort:** 1-2 hours
> **Risk:** LOW

## Story

As a **developer**,
I want **error handling in useGruposViewHandlers properly contained and fully tested**,
So that **unhandled promise rejections don't reach production and all error paths have coverage**.

## Acceptance Criteria

- [ ] `handleConfirmDelete` catch block either removes `throw err` or callers (DeleteGroupDialog.onConfirm) handle the re-throw
- [ ] `handleToggleTransactionSharing` catch block either removes `throw err` or callers handle the re-throw
- [ ] Add unit test for `handleToggleTransactionSharing` success path
- [ ] Add unit test for `handleToggleTransactionSharing` error path
- [ ] Add unit test for `handleToggleTransactionSharing` guard clause (missing group/user/db)
- [ ] All existing tests continue to pass

## Tasks / Subtasks

- [ ] Task 1: Audit re-thrown errors in catch blocks
  - [ ] Check if `DeleteGroupDialog.onConfirm` wraps call in try/catch
  - [ ] Check if `EditGroupDialog.onToggleTransactionSharing` wraps call in try/catch
  - [ ] Either add try/catch in callers OR remove `throw err` from handlers
- [ ] Task 2: Add test coverage for `handleToggleTransactionSharing`
  - [ ] Success path: verify `updateTransactionSharingEnabled` called, toast shown, refetchGroups called
  - [ ] Error path: verify error toast shown, error re-thrown (or not, per Task 1 decision)
  - [ ] Guard clause: verify early return when group/user/db missing

## Dev Notes

- Source story: [TD-CONSOLIDATED-2](./TD-CONSOLIDATED-2-gruposview-dialog-extraction.md)
- Review findings: #1 (re-thrown errors), #2 (handleToggleTransactionSharing untested)
- Files affected: `src/components/settings/subviews/useGruposViewHandlers.ts`, `tests/unit/components/settings/subviews/GruposView.test.tsx`
- These gaps are pre-existing (from before the dialog extraction) — the refactoring merely made them more visible
