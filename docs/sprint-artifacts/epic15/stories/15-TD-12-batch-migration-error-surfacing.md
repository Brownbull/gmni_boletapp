# Story 15-TD-12: Batch Migration Completeness + Error Surfacing

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** done

## Description

Complete the migration of all remaining raw `writeBatch()` usages to the centralized `firestoreBatch.ts` utility and surface partial-commit failure semantics to UI callers so users are informed when batch operations partially succeed.

## Source

- **Code Review Finding #4 (MEDIUM):** `migrateCreatedAt.ts` uses raw `writeBatch()` imported directly from `firebase/firestore` instead of the centralized `batchWrite()` from `firestoreBatch.ts`. This bypasses the 500-op auto-chunking and retry logic.
- **Code Review Finding #9 (MEDIUM):** `batchDelete`/`batchWrite` have partial-commit semantics (batch 1 may succeed while batch 2 fails), but this is only documented in JSDoc. No UI caller handles partial failure — users see either full success or a generic error, losing the "N of M batches succeeded" information.

## Acceptance Criteria

- [x] **AC1:** `migrateCreatedAt.ts` uses `batchWrite()` from `@/lib/firestoreBatch` instead of raw `writeBatch()`
- [x] **AC2:** No remaining raw `writeBatch()` imports exist outside of `firestoreBatch.ts` itself (grep verification)
- [x] **AC3:** `batchDelete` and `batchWrite` return a result object with success/failure counts (e.g., `{ successCount: number; failedCount: number; errors: Error[] }`)
- [x] **AC4:** At least one UI caller (e.g., `useInAppNotifications.deleteAllNotifications`) uses the result to show partial-failure feedback
- [x] **AC5:** Unit tests verify partial-commit result reporting
- [x] **AC6:** All existing tests pass

## Tasks

- [x] **Task 1:** Migrate `migrateCreatedAt.ts` to centralized batch utility
  - [x] Replace `writeBatch()` import with `batchWrite()` from `@/lib/firestoreBatch`
  - [x] Adapt the migration logic to use the `batchWrite` operation callback pattern
- [x] **Task 2:** Add batch result type and return it from `batchDelete`/`batchWrite`
  - [x] Define `BatchResult` type: `{ totalBatches: number; succeededBatches: number; failedBatches: number; errors: Error[] }`
  - [x] Track per-chunk success/failure in the existing loop
  - [x] Return result instead of void (backward-compatible: callers that ignore the return still work)
- [x] **Task 3:** Surface partial failure in UI
  - [x] Update `useInAppNotifications.deleteAllNotifications` to check batch result
  - [x] Show toast or error message when `failedBatches > 0`
  - [x] Implemented "Some items could not be processed. Please try again." pattern
- [x] **Task 4:** Verify no remaining raw writeBatch imports
  - [x] Run `grep -r "writeBatch" src/ --include="*.ts" --include="*.tsx"` (only firestoreBatch.ts found)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/lib/firestoreBatch.ts` | MODIFY | Add BatchResult return type |
| `src/utils/migrateCreatedAt.ts` | MODIFY | Use centralized batchWrite |
| `src/hooks/useInAppNotifications.ts` | MODIFY | Handle partial batch failure |
| `tests/unit/lib/firestoreBatch.test.ts` | MODIFY | Test BatchResult reporting |

## Dev Notes

- `migrateCreatedAt.ts` is a one-time migration utility, so this is lower risk, but it sets the precedent that ALL batch operations go through the centralized utility
- The `BatchResult` return type is backward-compatible: existing callers that `await batchDelete(...)` without capturing the return still work (they just ignore the result)
- For partial-failure UI, use the existing error handler toast pattern from `errorHandler.ts`
- Consider whether partial-commit should throw or just return the result — returning is safer for callers that don't want to wrap in try/catch

## Senior Developer Review (ECC)

- **Review Date:** 2026-02-12
- **Classification:** STANDARD
- **ECC Agents:** code-reviewer, security-reviewer
- **Outcome:** APPROVE WITH CHANGES (7 quick fixes applied, 2 deferred)

### Quick Fixes Applied
1. Fixed `result.fixed` calculation for non-contiguous chunk failures (migrateCreatedAt.ts)
2. Fixed type mismatch: `batchResult` on thrown error now includes `errors` array (firestoreBatch.ts)
3. Replaced inline Firestore path construction with centralized `firestorePaths.ts` utilities (migrateCreatedAt.ts)
4. Sanitized error messages in MigrationResult — generic messages to callers, details to console (migrateCreatedAt.ts)
5. Consolidated 8 `eslint-disable-next-line` into block disable (migrateCreatedAt.ts)
6. Fixed story file spec table path (`src/services/` → `src/utils/`)
7. Fixed test assertion to use full equality with `errors: []` (useInAppNotifications.test.ts)

### Deferred Items

| Item | Description | Priority | Tracking |
|------|-------------|----------|----------|
| Unstable `t` dependency in App.tsx useCallback | Pre-existing pattern — `t` function recreated every render, making useCallback ineffective | LOW | Implicitly tracked by mega-view decomposition (15-TD-5b, 15-TD-16) |
| `markAllAsRead` BatchResult asymmetry | `markAllAsRead` discards batchWrite result while `deleteAllNotifications` surfaces it | LOW | Future enhancement — non-blocking, users rarely encounter partial failure on mark-as-read |
