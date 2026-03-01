# Story TD-15b-35: Orchestrator Cleanup

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture (Tech Debt)
**Points:** 1
**Priority:** LOW
**Status:** done
**Source:** 15b-4f code review findings F1, F2, F4, F6

## Overview

Cleanup tech debt from the 15b-4f App.tsx fan-out reduction. Remove dead state, add basic orchestrator unit tests, and migrate `getFirestore()` to a hook/repository pattern.

## Functional Acceptance Criteria

- [x] **AC1:** Dead `wiping`/`exporting` state removed from useViewHandlersOrchestrator (always false, setters unused)
- [x] **AC2:** Basic unit tests added for each orchestrator verifying return shape and hook composition
- [x] **AC3:** `getFirestore()` direct call in useUserContextOrchestrator migrated to use existing services pattern
- [x] **AC4:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

### Pattern Requirements

- [x] **AC-ARCH-PAT-1:** Orchestrator tests follow existing mock patterns from tests/unit/hooks/

### Anti-Pattern Requirements

- [x] **AC-ARCH-NO-1:** Return types changed minimally — only dead properties removed (wiping/exporting), db type widened to accept null
- [x] **AC-ARCH-NO-2:** App.tsx modified minimally — only dead references removed (3 lines), no new logic added

## Tasks / Subtasks

### Task 1: Remove dead state

- [x] 1.1 Remove `wiping` / `_setWiping` useState from useViewHandlersOrchestrator
- [x] 1.2 Remove `exporting` / `_setExporting` useState from useViewHandlersOrchestrator
- [x] 1.3 Remove `wiping` and `exporting` from return object
- [x] 1.4 Update App.tsx destructuring to remove `wiping` and `exporting` references
- [x] 1.5 Grep for any other consumers of these values

### Task 2: Add orchestrator unit tests

- [x] 2.1 Create tests/unit/app/hooks/ directory
- [x] 2.2 Add useUserContextOrchestrator.test.ts (mock hooks, verify return shape)
- [x] 2.3 Add useTransactionDataOrchestrator.test.ts (mock hooks, verify merge logic)
- [x] 2.4 Add useScanWorkflowOrchestrator.test.ts (mock hooks, verify setScanImages auto-transition)
- [x] 2.5 Add useMappingSystemOrchestrator.test.ts (mock hooks, verify return shape)
- [x] 2.6 Add useViewHandlersOrchestrator.test.ts (mock hooks, verify return shape)

### Task 3: Migrate getFirestore() call

- [x] 3.1 Check if `db` is available from `services` object (already returned by useAuth)
- [x] 3.2 Remove `getFirestore()` import and use `services?.db ?? null` instead
- [x] 3.3 Keep `db` in orchestrator return (now sourced from services.db, type: Firestore | null)
- [x] 3.4 Update TransactionEditorViewTestOverrides type to accept Firestore | null

## Dev Notes

- All findings from 15b-4f review are LOW priority
- `wiping` and `exporting` were always false with unused setters — SettingsView already had internal hardcoded `false` values
- `db = getFirestore()` replaced with `services?.db ?? null` — functionally equivalent since `useInAppNotifications` already accepts `Firestore | null`
- AC-ARCH-NO-1/NO-2 conflicted with task requirements — resolved by following tasks with minimal changes (user approved)
- `db` in `TransactionEditorViewTestOverrides` was dead code (passed but never consumed by wrapper)

## File List

| File | Action |
|------|--------|
| src/app/hooks/useViewHandlersOrchestrator.ts | Modified (removed dead state) |
| src/app/hooks/useUserContextOrchestrator.ts | Modified (migrated getFirestore) |
| src/App.tsx | Modified (removed 3 dead references) |
| src/features/transaction-editor/views/TransactionEditorView/TransactionEditorViewWrapper.tsx | Modified (db type: Firestore → Firestore \| null) |
| tests/unit/app/hooks/useUserContextOrchestrator.test.ts | Created |
| tests/unit/app/hooks/useTransactionDataOrchestrator.test.ts | Created |
| tests/unit/app/hooks/useScanWorkflowOrchestrator.test.ts | Created |
| tests/unit/app/hooks/useMappingSystemOrchestrator.test.ts | Created |
| tests/unit/app/hooks/useViewHandlersOrchestrator.test.ts | Created |

## Change Log

| Date | Change |
|------|--------|
| 2026-03-01 | Created from 15b-4f code review findings |
| 2026-03-01 | Implementation complete — 3 tasks, 15 subtasks, 9 files |
| 2026-03-01 | ECC Code Review: APPROVE 8.875/10 (code-reviewer 8.75/10, security-reviewer 9/10). 1 quick fix (F3: 11 missing keys in return-shape test), 9 deferred (all LOW/pre-existing). All orchestrator tests pass (17/17), tsc clean. |
