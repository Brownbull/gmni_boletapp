# TD-CONSOLIDATED-26: TD-12 Test Quality Bundle

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-08) on story TD-CONSOLIDATED-12
> **Findings:** #10 (test file sizes), #11 (createMockUser factory duplication), #12 (query key empty string)
> **Tier:** 3 - Test Quality (DO WHEN TOUCHING)
> **Priority:** LOW (maintainability improvements, no runtime bugs)
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW (test infrastructure only)
> **Dependencies:** TD-CONSOLIDATED-12, TD-CONSOLIDATED-22

## Story

As a **developer**,
I want **test quality issues from the TD-CONSOLIDATED-12 review addressed**,
So that **test files are maintainable, mock factories are DRY, and edge cases are covered**.

## Problem Statement

Three test quality issues were identified during TD-CONSOLIDATED-12 code review:

1. **Test file sizes exceed convention limits**: `useGroupMutations.test.ts` (581 lines, limit 300 for unit tests) and `GruposView.test.tsx` (2748 lines, limit 300). GruposView is a known pre-existing issue but useGroupMutations is new code.
2. **createMockUser factory duplicated**: At least 3 test files define their own `createMockUser()` factory with identical structure. Should be extracted to `tests/helpers/`.
3. **Query key uses empty string for null email**: `usePendingInvitationsCount` passes `email ?? ''` to `QUERY_KEYS.pendingInvitations.byEmail()`, creating a query keyed on empty string. While the query is disabled when email is null, the key still exists in the cache. A `null` sentinel or skip pattern would be cleaner.

## Acceptance Criteria

### #10: Test file sizes
- [ ] `useGroupMutations.test.ts` split into per-hook test files or describe-block files (each under 300 lines)
- [ ] GruposView.test.tsx: document the pre-existing size as accepted tech debt (splitting a 2748-line test for a 399-line component requires component extraction first — see TD-CONSOLIDATED-2)

### #11: createMockUser factory
- [ ] Extract `createMockUser()` to `tests/helpers/factories.ts` (or extend existing `tests/helpers/mockFactories.ts`)
- [ ] Update all test files that define inline `createMockUser` to import from shared factory
- [ ] Verify no duplicate definitions remain (grep for `createMockUser`)
- [ ] Related: check if TD-CONSOLIDATED-22 already plans to cover this — if so, add as AC there instead

### #12: Query key empty string
- [ ] Replace `email ?? ''` with a pattern that avoids creating cache entries for null email (e.g., conditional query key array or `null` sentinel)
- [ ] Verify `enabled: !!email` still prevents fetching
- [ ] Add test case for null email scenario verifying no cache entry created

## Tasks / Subtasks

### Task 1: Split useGroupMutations.test.ts
- [ ] 1.1: Create per-hook test files (e.g., `useDeleteGroup.test.ts`, `useLeaveGroup.test.ts`, etc.)
- [ ] 1.2: Move shared mock setup to a local `__fixtures__` or shared describe
- [ ] 1.3: Verify all tests pass after split

### Task 2: Extract createMockUser factory
- [ ] 2.1: Add `createMockUser()` to `tests/helpers/mockFactories.ts`
- [ ] 2.2: Update consuming test files to import from helpers
- [ ] 2.3: Remove inline definitions

### Task 3: Fix query key empty string pattern
- [ ] 3.1: Update `usePendingInvitationsCount` to avoid empty string key
- [ ] 3.2: Add test case for null email
- [ ] 3.3: Verify cache behavior

## Dev Notes

- GruposView.test.tsx at 2748 lines is a systemic issue — the component itself (399 lines) orchestrates 15+ child components and dialogs. Real fix requires TD-CONSOLIDATED-2 (dialog extraction) to reduce component surface area first.
- For #12, consider: `queryKey: email ? QUERY_KEYS.pendingInvitations.byEmail(email) : ['pendingInvitations', 'disabled']` — but React Query's `enabled: false` already prevents fetching. The empty string key is technically harmless but messy.
- TD-CONSOLIDATED-22 covers test helper migration broadly — check if createMockUser fits there before duplicating effort.
