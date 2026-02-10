# Story 15-TD-2: Batch Operations Completion

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** HIGH
**Status:** ready-for-dev

## Description

Complete the migration of all `writeBatch()` usages to the centralized `firestoreBatch.ts` utility and add retry/backoff logic to the batch commit function. Phase 0 created the utility and migrated core services, but `useInAppNotifications.ts` was missed and the utility lacks retry on failures.

## Background

Firestore silently fails when a `writeBatch()` exceeds 500 operations. Phase 0 (Story 15-0a) created `src/lib/firestoreBatch.ts` with auto-chunking `batchDelete`/`batchWrite` functions. However, `useInAppNotifications.ts` still uses raw `writeBatch` directly, and the utility lacks the retry/backoff pattern specified in `.claude/rules/security.md`.

## Source Tech Debt Items

- **TD-13:** `useInAppNotifications.ts` batch ops bypass centralized `firestoreBatch.ts` (500-op limit) + hardcoded paths
- **TD-20:** `firestoreBatch.ts` lacks retry/backoff on commit failures (`security.md` pattern)

## Acceptance Criteria

- [ ] **AC1:** `useInAppNotifications.ts` `markAllAsRead()` uses `batchWrite` from `@/lib/firestoreBatch`
- [ ] **AC2:** `useInAppNotifications.ts` `deleteAllNotifications()` uses `batchDelete` from `@/lib/firestoreBatch`
- [ ] **AC3:** All 5 hardcoded notification paths in `useInAppNotifications.ts` replaced with `firestorePaths.ts` builder
- [ ] **AC4:** `notificationsPath()` and `notificationDocSegments()` added to `firestorePaths.ts`
- [ ] **AC5:** `firestoreBatch.ts` `batchDelete` and `batchWrite` retry failed chunk commits with exponential backoff (1 retry, 1s delay)
- [ ] **AC6:** JSDoc on `firestoreBatch.ts` documents partial-commit behavior (chunks 1-2 may succeed while chunk 3 fails)
- [ ] **AC7:** All existing tests pass; new retry behavior has unit tests

## Tasks

- [ ] **Task 1:** Add notification path builders to `firestorePaths.ts`
  - [ ] `notificationsCollectionSegments(appId, userId)` returning path segments
  - [ ] `notificationDocSegments(appId, userId, notificationId)` returning doc segments
- [ ] **Task 2:** Migrate `useInAppNotifications.ts` to centralized utilities
  - [ ] Replace `writeBatch` import with `batchWrite`/`batchDelete` from `@/lib/firestoreBatch`
  - [ ] Replace all 5 inline path constructions with `firestorePaths` builders
- [ ] **Task 3:** Add retry logic to `firestoreBatch.ts`
  - [ ] Add exponential backoff retry (1 retry, 1s base delay) on `batch.commit()` failure
  - [ ] Document partial-commit semantics in JSDoc
  - [ ] Write unit tests for retry behavior

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/lib/firestorePaths.ts` | MODIFY | Add notifications path builders |
| `src/lib/firestoreBatch.ts` | MODIFY | Add retry/backoff on commit |
| `src/hooks/useInAppNotifications.ts` | MODIFY | Migrate to centralized batch + paths |
| `tests/unit/lib/firestoreBatch.test.ts` | CREATE | Tests for retry behavior (also covers TD-15 partial) |

## Dev Notes

- `useInAppNotifications.ts` has 5 inline path constructions at lines ~100, 144, 166, 184, 204
- The retry should be simple: 1 attempt with 1s delay, then propagate error. Don't retry indefinitely.
- Document that partial commits are possible (e.g., "If processing 1500 docs in 3 batches, batch 1 may succeed while batch 2 fails. Caller should handle idempotent retries.")
