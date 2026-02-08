# Story: TD-CONSOLIDATED-12: React Query Cache Staleness

## Status: ready-for-dev
## Epic: Epic 14d-v2 Shared Groups (Tech Debt - Tier 5)

> **Consolidated from:** TD-14d-47
> **Priority:** LOW
> **Estimated Effort:** 3-4 hours
> **Story Points:** 5 (MEDIUM)
> **Risk:** MEDIUM
> **Dependencies:** None

## Overview

As a **developer**,
I want **React Query cache properly invalidated after Firestore mutations**,
So that **UI always reflects the latest data without requiring manual refresh**.

### Problem Statement

Six of nine group mutation operations bypass React Query's mutation lifecycle entirely. They call raw Firestore service functions and then invoke `refetchGroups()`, but with no optimistic cache updates, no automatic rollback on error, and no count invalidation. This causes the UI to show stale data until the next refetch completes.

### Root Cause

| Issue | Detail |
|-------|--------|
| No optimistic updates | 6/9 mutations show stale data until round-trip to Firestore completes |
| Inconsistent patterns | `useCreateGroup`/`useUpdateGroup` use `useMutation` properly; other 6 use raw service calls |
| No count invalidation | `refetchGroups()` updates `groups.list` but not `groups.count` — BC-1 limit stale |
| No rollback on error | Failed mutations leave the UI in an indeterminate state |

### Current State

| Mutation | Has `useMutation`? | Cache Strategy | Status |
|----------|:--:|-----------------|--------|
| Create group | YES | Optimistic + `invalidateQueries` | CORRECT |
| Update group | YES | Optimistic + `invalidateQueries` | CORRECT |
| Delete group (owner) | NO | `refetchGroups()` only | NEEDS FIX |
| Leave group | NO | `refetchGroups()` only | NEEDS FIX |
| Transfer ownership | NO | `refetchGroups()` only | NEEDS FIX |
| Accept invitation | NO | `refetchGroups()` + `refetchInvitations()` | NEEDS FIX |
| Decline invitation | NO | `refetchInvitations()` only | NEEDS FIX |
| Toggle sharing | NO | `refetchGroups()` only | NEEDS FIX |

## Functional Acceptance Criteria

- [ ] AC-1: After deleting a group, the groups list updates immediately without page refresh
- [ ] AC-2: After leaving a group, the groups list updates immediately
- [ ] AC-3: After transferring ownership, the group's owner badge updates immediately
- [ ] AC-4: After accepting an invitation, both groups list and invitations list update immediately
- [ ] AC-5: After declining an invitation, the invitations list updates immediately
- [ ] AC-6: After toggling transaction sharing, the sharing state updates immediately
- [ ] AC-7: If any mutation fails, the UI rolls back to the previous state (no stuck optimistic data)
- [ ] AC-8: BC-1 limit check (`useGroupCount`/`useCanCreateGroup`) reflects correct count after mutations
- [ ] AC-9: All existing tests pass (`npm run test:quick`)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] AC-ARCH-LOC-1: New mutation hooks in `src/features/shared-groups/hooks/useGroupMutations.ts` (FSD compliance)
- [ ] AC-ARCH-LOC-2: New tests in `tests/unit/hooks/useGroupMutations.test.ts`
- [ ] AC-ARCH-LOC-3: Pending invitations query key centralized in `src/lib/queryKeys.ts`
- [ ] AC-ARCH-LOC-4: All new hooks exported from `src/features/shared-groups/hooks/index.ts` barrel

### Pattern Requirements

- [ ] AC-ARCH-PATTERN-1: Every mutation hook uses `onMutate`/`onError`/`onSettled` lifecycle (matching `useCreateGroup` pattern)
- [ ] AC-ARCH-PATTERN-2: `onMutate` cancels in-flight queries via `cancelQueries({ queryKey: QUERY_KEYS.groups.all() })`
- [ ] AC-ARCH-PATTERN-3: `onMutate` snapshots previous state and returns rollback context
- [ ] AC-ARCH-PATTERN-4: `onError` restores snapshots from context
- [ ] AC-ARCH-PATTERN-5: `onSettled` invalidates `QUERY_KEYS.groups.all()` (and `pendingInvitations.all()` for invitation mutations)
- [ ] AC-ARCH-PATTERN-6: Optimistic updates use immutable operations (spread/filter/map, never mutate cached arrays)
- [ ] AC-ARCH-PATTERN-7: `groups.count` included in invalidation for membership-changing mutations (delete, leave, accept)
- [ ] AC-ARCH-PATTERN-8: All hooks accept `(user, services)` dependency injection pattern matching existing hooks

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] AC-ARCH-NO-1: No direct service function calls from handler code for operations that have mutation hooks
- [ ] AC-ARCH-NO-2: No `refetchGroups()`/`refetchInvitations()` calls that duplicate `onSettled` invalidation
- [ ] AC-ARCH-NO-3: No mutation hooks with missing `onSettled` invalidation
- [ ] AC-ARCH-NO-4: No `queryClient.invalidateQueries()` with hardcoded string arrays instead of `QUERY_KEYS`
- [ ] AC-ARCH-NO-5: No optimistic update that mutates cached arrays in place

## File Specification

| File/Component | Exact Path | Pattern | AC Reference |
|----------------|------------|---------|--------------|
| useGroupMutations (NEW) | `src/features/shared-groups/hooks/useGroupMutations.ts` | useMutation hooks | AC-1 to AC-8, AC-ARCH-LOC-1 |
| queryKeys | `src/lib/queryKeys.ts` | Centralized keys | AC-ARCH-LOC-3 |
| usePendingInvitationsCount | `src/hooks/usePendingInvitationsCount.ts` | Import centralized key | AC-ARCH-LOC-3 |
| hooks barrel | `src/features/shared-groups/hooks/index.ts` | FSD exports | AC-ARCH-LOC-4 |
| useLeaveTransferFlow | `src/features/shared-groups/hooks/useLeaveTransferFlow.ts` | Use mutation hooks | AC-ARCH-NO-1/2 |
| useGruposViewHandlers | `src/components/settings/subviews/useGruposViewHandlers.ts` | Use mutation hooks | AC-ARCH-NO-1/2 |
| GruposView | `src/components/settings/subviews/GruposView.tsx` | Wire up hooks | AC-ARCH-NO-1 |
| useGroupMutations test (NEW) | `tests/unit/hooks/useGroupMutations.test.ts` | Unit tests | AC-ARCH-LOC-2 |
| GruposView test | `tests/unit/components/settings/subviews/GruposView.test.tsx` | Mock updates | AC-9 |

## Tasks / Subtasks

### Task 1: Create `useGroupMutations.ts` with 6 Mutation Hooks

**File (NEW):** `src/features/shared-groups/hooks/useGroupMutations.ts`

- [ ] 1.1 Create `useDeleteGroup` hook with optimistic removal from `groups.list` + decrement `groups.count`
- [ ] 1.2 Create `useLeaveGroup` hook with optimistic removal from `groups.list` + decrement `groups.count`
- [ ] 1.3 Create `useTransferOwnership` hook with optimistic `ownerId` update
- [ ] 1.4 Create `useAcceptInvitation` hook with `groups` + `pendingInvitations` invalidation
- [ ] 1.5 Create `useDeclineInvitation` hook with `pendingInvitations` invalidation
- [ ] 1.6 Create `useToggleTransactionSharing` hook with optimistic `transactionSharingEnabled` flip
- [ ] 1.7 All hooks follow `onMutate`/`onError`/`onSettled` lifecycle pattern from `useCreateGroup`

### Task 2: Centralize Pending Invitations Query Key

**Files:** `src/lib/queryKeys.ts`, `src/hooks/usePendingInvitationsCount.ts`

- [ ] 2.1 Add `pendingInvitations.all()` and `pendingInvitations.byEmail(email)` to `QUERY_KEYS`
- [ ] 2.2 Update `usePendingInvitationsCount.ts` to import from `QUERY_KEYS` instead of local key
- [ ] 2.3 Mark old local `pendingInvitationsQueryKey` as `@deprecated`

### Task 3: Wire Mutation Hooks into Handlers

**Files:** `GruposView.tsx`, `useGruposViewHandlers.ts`, `useLeaveTransferFlow.ts`, barrel `index.ts`

- [ ] 3.1 Export new hooks from `src/features/shared-groups/hooks/index.ts`
- [ ] 3.2 Call mutation hooks in `GruposView.tsx` (hooks must be called at component level)
- [ ] 3.3 Pass `mutateAsync` functions to `useGruposViewHandlers` (replace `refetchGroups` for delete/toggle)
- [ ] 3.4 Refactor `useLeaveTransferFlow` to use mutation hooks for leave/transfer/accept/decline
- [ ] 3.5 Preserve `handleAutoSwitchViewMode` in leave handler's `onSuccess`
- [ ] 3.6 Remove redundant `refetchGroups()`/`refetchInvitations()` calls from refactored handlers

### Task 4: Update Tests

**Files:** `tests/unit/hooks/useGroupMutations.test.ts` (NEW), `tests/unit/components/settings/subviews/GruposView.test.tsx`

- [ ] 4.1 Write tests for each mutation hook: optimistic update applied to cache
- [ ] 4.2 Write tests for rollback on error (cache restored from snapshot)
- [ ] 4.3 Write tests for `invalidateQueries` called in `onSettled`
- [ ] 4.4 Update `GruposView.test.tsx` mocks for new mutation hook dependencies
- [ ] 4.5 Run `npm run test:quick` to verify all tests pass

## Dev Notes

### Architecture Guidance

**Design Decision: `useMutation` Hooks (not inline invalidation)**

The Architect recommends creating `useMutation` hooks (consistent with existing `useCreateGroup`/`useUpdateGroup`) rather than adding inline `queryClient.invalidateQueries()` in handlers. This provides:
- Automatic optimistic updates + rollback
- Consistent patterns across all mutations
- React Query DevTools visibility
- Proper `onSettled` guarantees

**Optimistic Update Pattern (template):**
```typescript
useMutation({
    mutationFn: async (input) => { /* call service */ },
    onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups.all() });
        const prev = queryClient.getQueryData(QUERY_KEYS.groups.list(uid));
        queryClient.setQueryData(QUERY_KEYS.groups.list(uid), (old) => /* transform */);
        return { prev };
    },
    onError: (_err, _input, ctx) => { /* restore prev */ },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups.all() }); },
});
```

**Handler-Specific Transforms:**

| Handler | Optimistic Transform |
|---------|---------------------|
| Delete | `old.filter(g => g.id !== groupId)` + decrement count |
| Leave | `old.filter(g => g.id !== groupId)` + decrement count |
| Transfer | `old.map(g => g.id === groupId ? { ...g, ownerId: newOwnerId } : g)` |
| Toggle sharing | `old.map(g => g.id === groupId ? { ...g, transactionSharingEnabled: !old } : g)` |
| Accept/Decline | No optimistic add — just `invalidateQueries` |

**Important Caveats:**
- Mutation hooks must be called at component level (React rules of hooks), then `mutateAsync` passed down
- Accept invitation has TWO code paths (standard + opt-in) — both must use the same mutation hook
- `useGroupMutations.ts` is estimated ~350 lines — if it exceeds 400, split into mutations + invitation mutations
- `leaveGroup` handler must preserve `handleAutoSwitchViewMode()` in `onSuccess` (not `onSettled`)

### Technical Notes

No specialized technical review required — Planner + Architect analysis covers React Query patterns comprehensively.

### E2E Testing

E2E coverage recommended — run `/ecc-e2e TD-CONSOLIDATED-12` after implementation to verify UI responsiveness after mutations.

## ECC Analysis Summary

- **Risk Level:** MEDIUM
- **Complexity:** Moderate
- **Sizing:** MEDIUM (5 pts) — 4 tasks, 20 subtasks, 9 files (2 new + 7 modified)
- **Agents consulted:** Planner, Architect

## Cross-References

- **Original story:** [TD-14d-47](TD-ARCHIVED/TD-14d-47-react-query-cache-staleness.md)
- **Source:** E2E Test investigation (2026-02-04) on story 14d-v2-1-11c
- **Patterns:** `docs/architecture/state-management.md`, existing `useCreateGroup`/`useUpdateGroup` in `useGroups.ts`
- **Reference implementation:** `src/features/shared-groups/hooks/useGroups.ts` lines 254-396 (`useCreateGroup`)
