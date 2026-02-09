# TD-CONSOLIDATED-24: PendingInvitationsSection Mutation Hook Migration

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-08) on story TD-CONSOLIDATED-12
> **Findings:** #4 (PendingInvitationsSection bypasses mutation hooks), #5 (handleInvitationHandled coupled refetch)
> **Tier:** 2 - Architecture (PLAN WITHIN SPRINT)
> **Priority:** MEDIUM (cache consistency gap — bypasses React Query mutation lifecycle)
> **Estimated Effort:** 2-3 hours
> **Risk:** MEDIUM (touches invitation accept/decline flow end-to-end)
> **Dependencies:** TD-CONSOLIDATED-12

## Story

As a **developer**,
I want **PendingInvitationsSection to use the same mutation hooks as GruposView**,
So that **all invitation accept/decline flows go through React Query's mutation lifecycle with optimistic updates, rollback, and automatic cache invalidation**.

## Problem Statement

PendingInvitationsSection currently calls `handleAcceptInvitationService`/`handleDeclineInvitationService` directly, bypassing the `useAcceptInvitation`/`useDeclineInvitation` mutation hooks created in TD-CONSOLIDATED-12. This means:

1. No optimistic cache updates when accepting/declining from the invitations list
2. Manual `refetchInvitations()` call in `handleInvitationHandled` instead of automatic invalidation
3. Cache staleness between GruposView and PendingInvitationsSection views

The `handleInvitationHandled` callback in `useGruposViewHandlers` calls `refetchInvitations()` directly — this couples the component to manual refetching rather than relying on React Query's `onSettled` invalidation in the mutation hooks.

## Acceptance Criteria

- [ ] PendingInvitationsSection uses `useAcceptInvitation` and `useDeclineInvitation` hooks instead of direct service calls
- [ ] `handleInvitationHandled` no longer calls `refetchInvitations()` directly — cache invalidation handled by mutation hooks' `onSettled`
- [ ] Optimistic removal of accepted/declined invitation from the pending list (same pattern as GruposView)
- [ ] Rollback on error restores the invitation to the list
- [ ] Existing tests updated to verify mutation hook usage
- [ ] All tests pass

## Tasks / Subtasks

### Task 1: Migrate PendingInvitationsSection to mutation hooks
- [ ] 1.1: Import `useAcceptInvitation`/`useDeclineInvitation` at component level
- [ ] 1.2: Pass `mutateAsync` functions to invitation handlers
- [ ] 1.3: Remove direct `handleAcceptInvitationService`/`handleDeclineInvitationService` imports

### Task 2: Remove manual refetch coupling
- [ ] 2.1: Remove `refetchInvitations` from `handleInvitationHandled` in `useGruposViewHandlers`
- [ ] 2.2: Verify `onSettled` in mutation hooks invalidates the same query keys
- [ ] 2.3: Remove `refetchInvitations` prop if no longer needed

### Task 3: Update tests
- [ ] 3.1: Update PendingInvitationsSection tests to mock mutation hooks
- [ ] 3.2: Verify optimistic removal behavior in tests
- [ ] 3.3: Verify rollback on error in tests

## Dev Notes

- GruposView already demonstrates the pattern — see `useAcceptInvitation`/`useDeclineInvitation` in `useGroupMutations.ts`
- The `services` DI pattern (`{ db, ...services }`) used by PendingInvitationsSection needs to align with what mutation hooks expect
- Consider whether PendingInvitationsSection should receive mutation hooks via props or call them directly
