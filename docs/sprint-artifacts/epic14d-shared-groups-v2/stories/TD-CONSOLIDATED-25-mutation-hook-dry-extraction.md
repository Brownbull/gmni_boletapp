# TD-CONSOLIDATED-25: Mutation Hook DRY Extraction

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-08) on story TD-CONSOLIDATED-12
> **Findings:** #6 (useDeleteGroup/useLeaveGroup duplicate optimistic cache pattern)
> **Tier:** 3 - Test Quality (DO WHEN TOUCHING)
> **Priority:** LOW (code duplication, not a bug — fix when next touching mutation hooks)
> **Estimated Effort:** 1-2 hours
> **Risk:** LOW (internal refactoring, no behavior change)
> **Dependencies:** TD-CONSOLIDATED-12

## Story

As a **developer**,
I want **shared optimistic update logic extracted from mutation hooks into a reusable helper**,
So that **useDeleteGroup, useLeaveGroup, and future mutation hooks share a single optimistic groups-cache pattern without copy-paste**.

## Problem Statement

`useDeleteGroup` and `useLeaveGroup` have near-identical `onMutate`/`onError`/`onSettled` blocks:
- Both cancel `QUERY_KEYS.groups.all()` queries
- Both snapshot `previousGroups` for rollback
- Both filter the groups cache optimistically
- Both restore on error and invalidate on settle

The only difference is the filter predicate (`g.id !== groupId`). This 30+ line pattern is duplicated across both hooks and will be duplicated again for any future group-modifying mutation.

## Acceptance Criteria

- [ ] Extract a `createGroupsOptimisticMutation` helper (or similar) that encapsulates the shared `onMutate`/`onError`/`onSettled` pattern
- [ ] `useDeleteGroup` and `useLeaveGroup` use the extracted helper
- [ ] Helper accepts a filter/transform function for the optimistic cache update
- [ ] Behavior is identical before and after (no functional changes)
- [ ] All existing mutation hook tests pass without modification (behavior preserved)
- [ ] New unit tests for the extracted helper

## Tasks / Subtasks

### Task 1: Extract shared helper
- [ ] 1.1: Create `createGroupsOptimisticMutation()` in `useGroupMutations.ts` (or new file if preferred)
- [ ] 1.2: Parameterize the optimistic update predicate/transform
- [ ] 1.3: Handle the groups query key, cancel, snapshot, restore, invalidate internally

### Task 2: Refactor existing hooks
- [ ] 2.1: Refactor `useDeleteGroup` to use the helper
- [ ] 2.2: Refactor `useLeaveGroup` to use the helper
- [ ] 2.3: Verify all tests pass

### Task 3: Add helper tests
- [ ] 3.1: Unit test the extracted helper directly
- [ ] 3.2: Verify rollback behavior through the helper

## Dev Notes

- The `useAcceptInvitation` hook has a similar but different pattern (groups + invitations caches) — don't force it into the same abstraction
- Keep the helper co-located in `useGroupMutations.ts` unless it grows large enough to warrant its own file
- Consider a generic `createOptimisticMutation` factory if the pattern extends to invitations cache too
