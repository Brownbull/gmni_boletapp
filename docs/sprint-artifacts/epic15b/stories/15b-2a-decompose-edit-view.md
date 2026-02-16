# Story 15b-2a: Decompose EditView

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 3
**Priority:** HIGH
**Status:** drafted

## Description

Decompose EditView.tsx (1,811 lines, 19 hooks) into smaller, focused sub-files. This is a never-scoped view that was moved into `features/transaction-editor/` in Phase 1. Target: <800 lines.

## Acceptance Criteria

- [ ] **AC1:** EditView.tsx reduced to <800 lines
- [ ] **AC2:** Extracted files are each <400 lines
- [ ] **AC3:** Behavior snapshot: all existing tests pass before AND after extraction
- [ ] **AC4:** No new functionality added — pure decomposition
- [ ] **AC5:** Fan-out of EditView decreased (depcruise verification)
- [ ] **AC6:** `npm run test:quick` passes

## Tasks

- [ ] **Task 1:** Run existing tests to establish behavior baseline
- [ ] **Task 2:** Analyze EditView structure — identify extractable sections
  - [ ] Pure helper functions → `editViewHelpers.ts`
  - [ ] Form validation logic → `editViewValidation.ts`
  - [ ] Sub-sections (item list, header, footer) → individual components
- [ ] **Task 3:** Extract pure functions first (lowest risk)
- [ ] **Task 4:** Extract UI sub-sections as components
- [ ] **Task 5:** Extract hook compositions if any are reusable
- [ ] **Task 6:** Run tests after each extraction, fix any breakage atomically

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/transaction-editor/views/EditView.tsx` | MODIFY | Reduce from 1,811 to <800 lines |
| `src/features/transaction-editor/views/editViewHelpers.ts` | CREATE | Extracted pure functions |
| `src/features/transaction-editor/components/EditView*.tsx` | CREATE | Extracted UI sub-sections |
| Tests for extracted files | CREATE | Unit tests for new files |

## Dev Notes

- EditView has 19 hooks — high state complexity. Focus on extracting render logic and pure helpers first
- 26 outgoing dependencies (fan-out) — decomposition should reduce this
- Do NOT refactor hook usage or state management — that's separate work
- One source file per decomposition story — EditView.tsx is the only target
