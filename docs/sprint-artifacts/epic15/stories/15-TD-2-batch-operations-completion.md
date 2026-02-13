# Story 15-TD-2: Batch Operations Completion

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** HIGH
**Status:** done

## Description

Complete the migration of all `writeBatch()` usages to the centralized `firestoreBatch.ts` utility and add retry/backoff logic to the batch commit function. Phase 0 created the utility and migrated core services, but `useInAppNotifications.ts` was missed and the utility lacks retry on failures.

## Background

Firestore silently fails when a `writeBatch()` exceeds 500 operations. Phase 0 (Story 15-0a) created `src/lib/firestoreBatch.ts` with auto-chunking `batchDelete`/`batchWrite` functions. However, `useInAppNotifications.ts` still uses raw `writeBatch` directly, and the utility lacks the retry/backoff pattern specified in `.claude/rules/security.md`.

## Source Tech Debt Items

- **TD-13:** `useInAppNotifications.ts` batch ops bypass centralized `firestoreBatch.ts` (500-op limit) + hardcoded paths
- **TD-20:** `firestoreBatch.ts` lacks retry/backoff on commit failures (`security.md` pattern)

## Acceptance Criteria

- [x] **AC1:** `useInAppNotifications.ts` `markAllAsRead()` uses `batchWrite` from `@/lib/firestoreBatch`
- [x] **AC2:** `useInAppNotifications.ts` `deleteAllNotifications()` uses `batchDelete` from `@/lib/firestoreBatch`
- [x] **AC3:** All 5 hardcoded notification paths replaced with `notificationsPath()` / `notificationDocSegments()`
- [x] **AC4:** `notificationsPath()` and `notificationDocSegments()` added to `firestorePaths.ts`
- [x] **AC5:** `commitWithRetry()` retries once with 1s exponential backoff delay
- [x] **AC6:** JSDoc documents partial-commit behavior on both `batchDelete` and `batchWrite`
- [x] **AC7:** All 6,357 tests pass; 12 new tests for chunking + retry behavior

## Tasks

- [x] **Task 1:** Add notification path builders to `firestorePaths.ts`
  - [x] `notificationsPath(appId, userId)` for collection references
  - [x] `notificationDocSegments(appId, userId, notificationId)` for doc() calls
- [x] **Task 2:** Migrate `useInAppNotifications.ts` to centralized utilities
  - [x] Replaced `writeBatch` with `batchWrite`/`batchDelete` from `@/lib/firestoreBatch`
  - [x] Replaced all 5 inline paths with `firestorePaths` builders
- [x] **Task 3:** Add retry logic to `firestoreBatch.ts`
  - [x] `commitWithRetry()` with 1 retry, 1s base delay, exponential backoff
  - [x] JSDoc documents partial-commit behavior on both functions
  - [x] 12 unit tests covering chunking, retry success/failure, per-chunk independence

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
