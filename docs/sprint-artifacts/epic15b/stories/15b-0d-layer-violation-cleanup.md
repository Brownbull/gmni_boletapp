# Story 15b-0d: Layer Violation Cleanup

## Status: done
## Epic: 15b - Continued Codebase Refactoring
## Points: 1

## Overview

Fix the remaining 2 layer violations in `src/hooks/app/` where hooks import upward from components and views. Story 15b-0b already resolved the `components/App/` barrel violations — this story handles the 2 remaining violations:

1. `useDialogHandlers.ts` imports `ConflictingTransaction` + `ConflictReason` from `components/dialogs/TransactionConflictDialog`
2. `useNavigationHandlers.ts` imports `HistoryNavigationPayload` from `views/TrendsView/` (but the type already exists canonically at `src/types/navigation.ts`)

Expected layer flow: `views -> components -> features -> hooks/services -> shared -> utils/types`
Violations: hooks importing upward into components and views.

## Functional Acceptance Criteria

- [x] **AC1:** `useDialogHandlers.ts` no longer imports from `components/dialogs/TransactionConflictDialog`
- [x] **AC2:** `useNavigationHandlers.ts` no longer imports from `views/TrendsView/`
- [x] **AC3:** 0 layer violations remaining in `src/hooks/app/` — `grep -r 'from.*components/\|from.*views/' src/hooks/app/` returns no matches (excluding `@app/` alias)
- [x] **AC4:** Extracted interfaces maintain same behavior — no logic changes
- [x] **AC5:** `npm run test:quick` passes

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements
- [x] **AC-ARCH-LOC-1:** Canonical `ConflictReason` and `ConflictingTransaction` type definitions located at `src/types/conflict.ts` — no other file defines them (only re-exports)
- [x] **AC-ARCH-LOC-2:** Canonical `HistoryNavigationPayload` remains at `src/types/navigation.ts` — already correct, no change needed
- [x] **AC-ARCH-LOC-3:** Backward-compat re-exports of `ConflictReason` and `ConflictingTransaction` remain in `src/components/dialogs/TransactionConflictDialog.tsx`

### Pattern Requirements
- [x] **AC-ARCH-PATTERN-1:** `useDialogHandlers.ts` imports conflict types via `@/types/conflict` — zero matches for `from.*components/dialogs/TransactionConflictDialog` in `src/hooks/app/`
- [x] **AC-ARCH-PATTERN-2:** `useNavigationHandlers.ts` imports `HistoryNavigationPayload` via `@/types/navigation` — zero matches for `from.*views/TrendsView` in `src/hooks/app/`
- [x] **AC-ARCH-PATTERN-3:** `TransactionConflictDialog.tsx` re-exports both types from `@/types/conflict` for backward compatibility
- [x] **AC-ARCH-PATTERN-4:** `src/types/conflict.ts` follows same style as `src/types/navigation.ts` (JSDoc, no React imports)
- [x] **AC-ARCH-PATTERN-5:** `npx tsc --noEmit` passes with zero errors

### Anti-Pattern Requirements (Must NOT Happen)
- [x] **AC-ARCH-NO-1:** No file in `src/hooks/app/` imports from `src/components/` or `src/views/` (type or value)
- [x] **AC-ARCH-NO-2:** `src/types/conflict.ts` MUST NOT import React or any UI library
- [x] **AC-ARCH-NO-3:** MUST NOT change any logic, only import paths and type locations
- [x] **AC-ARCH-NO-4:** MUST NOT modify test files unless an import path physically breaks
- [x] **AC-ARCH-NO-5:** MUST NOT change imports in files outside the 4 specified files

## File Specification

| File/Component | Exact Path | Action | Pattern | AC Reference |
|----------------|------------|--------|---------|--------------|
| Conflict types | `src/types/conflict.ts` | CREATE | FSD: domain types in `src/types/` | AC-ARCH-LOC-1 |
| useDialogHandlers | `src/hooks/app/useDialogHandlers.ts` | MODIFY | Layer compliance: hooks -> types | AC-ARCH-PATTERN-1 |
| useNavigationHandlers | `src/hooks/app/useNavigationHandlers.ts` | MODIFY | Layer compliance: hooks -> types | AC-ARCH-PATTERN-2 |
| TransactionConflictDialog | `src/components/dialogs/TransactionConflictDialog.tsx` | MODIFY | Backward compat re-export | AC-ARCH-PATTERN-3 |

## Tasks / Subtasks

- [x] **Task 1: Extract conflict types to shared layer**
  - [x] 1.1: Create `src/types/conflict.ts` with `ConflictReason` (string union) and `ConflictingTransaction` (interface), copied exactly from `TransactionConflictDialog.tsx` lines 27-44
  - [x] 1.2: Update `TransactionConflictDialog.tsx` — remove inline type definitions, replace with `import type` + `export type` from `@/types/conflict`
  - [x] 1.3: Update `useDialogHandlers.ts` — change line 60 import from `../../components/dialogs/TransactionConflictDialog` to `@/types/conflict`
- [x] **Task 2: Fix navigation type import**
  - [x] 2.1: Update `useNavigationHandlers.ts` — change line 54 import from `../../views/TrendsView` to `@/types/navigation`
- [x] **Task 3: Verify**
  - [x] 3.1: Run `npx tsc --noEmit` — must pass
  - [x] 3.2: Run `npm run test:quick` — must pass (281 files, 6884 tests)
  - [x] 3.3: Run `grep -r 'from.*components/\|from.*views/' src/hooks/app/` — 0 import matches (1 JSDoc comment match, not a violation)

## Dev Notes

### Scope Refinement
The original story description listed 8 violations including `components/App/` imports. Story 15b-0b (in review) already fixed all `components/App/` barrel violations. This story now handles the 2 remaining violations:

1. `useDialogHandlers.ts` -> `components/dialogs/TransactionConflictDialog` (type-only import)
2. `useNavigationHandlers.ts` -> `views/TrendsView/` (type-only import)

### Architecture Guidance

**Violation 1: Conflict Types Extraction**
- Create `src/types/conflict.ts` with `ConflictReason` (string union) and `ConflictingTransaction` (interface)
- These are pure data contracts with zero React dependencies — ideal for `src/types/`
- `TransactionConflictDialog.tsx` keeps backward-compat re-exports so 3 other consumers (`ModalManager/types.ts`, `conflictDetection.ts`, `scan/utils/index.ts`) are unaffected
- Only `useDialogHandlers.ts` is updated to import from `@/types/conflict`

**Violation 2: Navigation Type Redirect**
- `HistoryNavigationPayload` already exists canonically at `src/types/navigation.ts`
- `useNavigationHandlers.ts` imports it via `../../views/TrendsView` (a re-export chain)
- Fix: one-line change to import from `@/types/navigation` instead
- `ScanFeature.tsx` also imports via TrendsView — out of scope (feature-layer, separate story)

### Technical Notes
- Tests do NOT directly import `ConflictingTransaction`/`ConflictReason`/`HistoryNavigationPayload`
- Tests import hook types (`UseDialogHandlersProps`, `UseNavigationHandlersProps`) which reference these types transitively — TypeScript resolves automatically
- No test file modifications expected; backward-compat re-exports prevent breakage

### Trade-Off: Backward-Compat Re-Export vs. Update All Consumers
- **Chosen:** Re-export from `TransactionConflictDialog.tsx`, update only the violating hook
- **Rationale:** Minimal blast radius (4 files). Other consumers can be migrated in their own stories.
- **Alternative rejected:** Updating all 5 consumers — expands scope beyond story purpose

### Future Work (NOT in scope)
- `ModalManager/types.ts` still imports from `TransactionConflictDialog` — separate story
- `conflictDetection.ts` still imports from `TransactionConflictDialog` — separate story
- `ScanFeature.tsx` still imports `HistoryNavigationPayload` from `@/views/TrendsView` — separate story

### E2E Testing
No E2E testing required — pure type-only import path refactoring with zero runtime behavior changes.

## ECC Analysis Summary
- Risk Level: LOW
- Complexity: Simple
- Sizing: SMALL (1 pt) — 3 tasks, 7 subtasks, 4 files
- Agents consulted: Planner, Architect

## Senior Developer Review (ECC)
- **Date:** 2026-02-13
- **Classification:** SIMPLE
- **Agents:** code-reviewer (sonnet), tdd-guide (haiku)
- **Outcome:** APPROVE 10/10 — zero findings
- **Verification:** AC3 grep 0 matches, tsc clean, 281 files / 6884 tests pass
- **Deferred items:** 3 pre-existing (all tracked by Phase 1 stories)
- **Session cost:** $4.53
