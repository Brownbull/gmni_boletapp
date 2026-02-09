# Tech Debt Story TD-CONSOLIDATED-17: groupDeletionService Cascade DRY Extraction

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-07) on story TD-CONSOLIDATED-1
> **Priority:** MEDIUM
> **Estimated Effort:** 1-2 hours
> **Tier:** 1 - Code Bloat Prevention

## Story

As a **developer**,
I want **the duplicated cascade cleanup logic in groupDeletionService.ts extracted into a shared helper**,
So that **the ~40 LOC of identical cascade cleanup code between deleteGroupAsLastMember and deleteGroupAsOwner is DRY**.

## Problem Statement

`deleteGroupAsLastMember()` and `deleteGroupAsOwner()` contain nearly identical cascade cleanup blocks (~40 LOC each): clearing transaction tags, deleting changelog/analytics subcollections with try/catch, deleting pending invitations, and structured error logging. The only difference is the `memberIds` argument passed to `clearTransactionsSharedGroupId` (`[userId]` vs `memberIds`).

## Acceptance Criteria

- [ ] Extract `executeCascadeCleanup(db, groupId, memberIds, appId)` private helper
- [ ] Both deletion functions use the shared helper
- [ ] No behavioral changes — identical cascade ordering and error handling preserved
- [ ] All existing deletion tests pass without modification
- [ ] groupDeletionService.ts line count reduced by ~35 lines

## Tasks / Subtasks

- [ ] Task 1: Extract `executeCascadeCleanup()` helper function
  - [ ] 1.1: Create helper with `db`, `groupId`, `memberIds`, `appId` parameters
  - [ ] 1.2: Move cascade try/catch block (subcollections, invitations, logging) into helper
  - [ ] 1.3: Update `deleteGroupAsLastMember` to call helper with `[userId]`
  - [ ] 1.4: Update `deleteGroupAsOwner` to call helper with `memberIds`
- [ ] Task 2: Verify tests pass
  - [ ] 2.1: Run `npx vitest run tests/unit/services/groupService.test.ts`
  - [ ] 2.2: Run `npx vitest run tests/integration/`

## Dev Notes

- Source story: [TD-CONSOLIDATED-1](./TD-CONSOLIDATED-1-groupservice-modularization.md)
- Review finding: #5 (HIGH, Code Reviewer)
- Files affected: `src/features/shared-groups/services/groupDeletionService.ts`
- Pre-existing duplication from original monolithic groupService.ts
