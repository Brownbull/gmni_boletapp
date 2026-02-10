# Story 15-TD-12: Batch Migration Completeness + Error Surfacing

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** MEDIUM
**Status:** ready-for-dev

## Description

Complete the migration of all remaining raw `writeBatch()` usages to the centralized `firestoreBatch.ts` utility and surface partial-commit failure semantics to UI callers so users are informed when batch operations partially succeed.

## Source

- **Code Review Finding #4 (MEDIUM):** `migrateCreatedAt.ts` uses raw `writeBatch()` imported directly from `firebase/firestore` instead of the centralized `batchWrite()` from `firestoreBatch.ts`. This bypasses the 500-op auto-chunking and retry logic.
- **Code Review Finding #9 (MEDIUM):** `batchDelete`/`batchWrite` have partial-commit semantics (batch 1 may succeed while batch 2 fails), but this is only documented in JSDoc. No UI caller handles partial failure — users see either full success or a generic error, losing the "N of M batches succeeded" information.

## Acceptance Criteria

- [ ] **AC1:** `migrateCreatedAt.ts` uses `batchWrite()` from `@/lib/firestoreBatch` instead of raw `writeBatch()`
- [ ] **AC2:** No remaining raw `writeBatch()` imports exist outside of `firestoreBatch.ts` itself (grep verification)
- [ ] **AC3:** `batchDelete` and `batchWrite` return a result object with success/failure counts (e.g., `{ successCount: number; failedCount: number; errors: Error[] }`)
- [ ] **AC4:** At least one UI caller (e.g., `useInAppNotifications.deleteAllNotifications`) uses the result to show partial-failure feedback
- [ ] **AC5:** Unit tests verify partial-commit result reporting
- [ ] **AC6:** All existing tests pass

## Tasks

- [ ] **Task 1:** Migrate `migrateCreatedAt.ts` to centralized batch utility
  - [ ] Replace `writeBatch()` import with `batchWrite()` from `@/lib/firestoreBatch`
  - [ ] Adapt the migration logic to use the `batchWrite` operation callback pattern
- [ ] **Task 2:** Add batch result type and return it from `batchDelete`/`batchWrite`
  - [ ] Define `BatchResult` type: `{ totalBatches: number; succeededBatches: number; failedBatches: number; errors: Error[] }`
  - [ ] Track per-chunk success/failure in the existing loop
  - [ ] Return result instead of void (backward-compatible: callers that ignore the return still work)
- [ ] **Task 3:** Surface partial failure in UI
  - [ ] Update `useInAppNotifications.deleteAllNotifications` to check batch result
  - [ ] Show toast or error message when `failedBatches > 0`
  - [ ] Consider: "Deleted X notifications, Y failed. Please retry." pattern
- [ ] **Task 4:** Verify no remaining raw writeBatch imports
  - [ ] Run `grep -r "writeBatch" src/ --include="*.ts" --include="*.tsx"` (should only find firestoreBatch.ts)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/lib/firestoreBatch.ts` | MODIFY | Add BatchResult return type |
| `src/services/migrateCreatedAt.ts` | MODIFY | Use centralized batchWrite |
| `src/hooks/useInAppNotifications.ts` | MODIFY | Handle partial batch failure |
| `tests/unit/lib/firestoreBatch.test.ts` | MODIFY | Test BatchResult reporting |

## Dev Notes

- `migrateCreatedAt.ts` is a one-time migration utility, so this is lower risk, but it sets the precedent that ALL batch operations go through the centralized utility
- The `BatchResult` return type is backward-compatible: existing callers that `await batchDelete(...)` without capturing the return still work (they just ignore the result)
- For partial-failure UI, use the existing error handler toast pattern from `errorHandler.ts`
- Consider whether partial-commit should throw or just return the result — returning is safer for callers that don't want to wrap in try/catch
