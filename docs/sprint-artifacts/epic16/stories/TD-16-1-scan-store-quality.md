# Tech Debt Story TD-16-1: Scan Store Quality Hardening

Status: done

> **Source:** ECC Code Review (2026-03-06) on story 16-1-split-scan-store-slices
> **Priority:** LOW | **Estimated Effort:** 3 pts

## Story
As a **developer**, I want **scan store internals hardened with production logging, type safety, and cross-slice integration tests**, so that **guard violations are observable, the public API is clean, and cross-slice interactions are verified**.

## Acceptance Criteria
- AC-1: Phase guard violations emit structured log events (not just DEV console.warn)
- AC-2: `_guardPhase` is not accessible from consumers (hidden from exported type)
- AC-3: `restoreState` validates the shape of incoming partial state at runtime
- AC-4: Selector tests include cross-slice scenarios (action from one slice affects another slice's selector)
- AC-5: `selectors.ts` split into domain-grouped files if it exceeds 500 lines

## Tasks / Subtasks
### Task 1: Production guard logging (2 subtasks)
- [x] 1.1: Replace DEV-only console.warn in `_guardPhase` with structured logger call
- [x] 1.2: Add structured logger to batch slice phase/mode guards

### Task 2: Hide _guardPhase from public type (2 subtasks)
- [x] 2.1: Remove `_guardPhase` from `ScanCoreSlice` exported interface
- [x] 2.2: Type it as internal-only within the slice creator

### Task 3: restoreState runtime validation (2 subtasks)
- [x] 3.1: Add runtime shape check for known ScanState keys
- [x] 3.2: Add test for malformed restoreState input

### Task 4: Cross-slice selector integration tests (2 subtasks)
- [x] 4.1: Add tests where batch actions affect core selectors (e.g., batchComplete -> useCanSave)
- [x] 4.2: Add tests where core actions affect credit selectors

### Task 5: Selectors file split (conditional) (1 subtask)
- [x] 5.1: selectors.ts is 408 lines — well under 500-line threshold. No split needed.

## Dev Notes
- Source story: [16-1-split-scan-store-slices](./16-1-split-scan-store-slices.md)
- Review findings: #2, #3, #6, #9, #10
- Files affected: `src/features/scan/store/slices/scanCoreSlice.ts`, `src/features/scan/store/slices/types.ts`, `src/features/scan/store/selectors.ts`, `src/features/scan/store/__tests__/`
- New file: `src/features/scan/store/slices/guardLog.ts` (structured guard violation logging)
- Also updated: `scanBatchSlice.ts`, `scanDialogSlice.ts`, `scanCreditSlice.ts`, `scanUISlice.ts`, `useScanStore.ts` (ScanFullStoreInternal type)
- Also fixed: KDBP hook wiring (10 missing scripts ported from Archie to boletapp + template)

## Code Review Quick Fixes (2026-03-06)
- Cast `useScanStore` to `ScanFullStore` type to hide `_guardPhase` from `getState()` (#1)
- Added explanatory comment for `satisfies` compile-time check in initialState.ts (#4)
- Added test for malformed value types in restoreState (#9)
- Strengthened guard violation log assertion to verify full structured payload (#10)

## Deferred Items Tracking

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| TD-16-2 | restoreState value-type validation, pluggable guard logging, dialog result typing, auto-derive _StateKeys | LOW | CREATED |

## Senior Developer Review (ECC)
- **Date:** 2026-03-06
- **Classification:** COMPLEX
- **Agents:** code-reviewer (8/10), security-reviewer (9/10), architect (9/10), tdd-guide (8/10)
- **Overall:** 8.5/10 — APPROVE
- **Outcome:** 4 quick fixes applied, 1 TD story created (TD-16-2, 4 deferred items)
- **Tests:** 100 passing, 0 failures

<!-- CITED: L2-007 (structured logging), L2-004 (type encapsulation) -->
