# Tech Debt Story TD-CONSOLIDATED-23: Server-Side Toggle Cooldown Enforcement

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-08) on story TD-CONSOLIDATED-11
> **Priority:** MEDIUM
> **Estimated Effort:** 2-3 hours
> **Story Points:** 2 (SMALL)
> **Risk:** LOW

## Story

As a **developer**,
I want **server-side cooldown enforcement for transaction sharing toggles in Firestore security rules**,
So that **a malicious client cannot bypass the 15-minute cooldown and 3-per-day limit by directly calling the Firebase SDK**.

## Problem Statement

TD-CONSOLIDATED-11 added server-side rate limiting for settings updates and deletions, but the transaction sharing toggle path (`isTransactionSharingToggle()`) has no server-side cooldown enforcement. The 15-minute cooldown and 3-per-day limit are only enforced client-side in `canToggleTransactionSharing()` at `src/utils/sharingCooldown.ts`.

Additionally, `transactionSharingLastToggleAt` has no `request.time` validation, meaning a malicious client could write an arbitrary timestamp (including past values or year-2099 future timestamps) to manipulate the cooldown.

## Acceptance Criteria

- [ ] AC-1: Firestore security rules enforce 15-minute cooldown on transaction sharing toggles using `transactionSharingLastToggleAt`
- [ ] AC-2: `transactionSharingLastToggleAt` must equal `request.time` when being written (consistent with `lastSettingsUpdateAt` pattern)
- [ ] AC-3: Migration-safe: null/missing `transactionSharingLastToggleAt` does not block toggles
- [ ] AC-4: Integration tests validate cooldown enforcement, expiry, and migration safety
- [ ] AC-5: All existing tests pass

## Tasks / Subtasks

### Task 1: Add Toggle Cooldown to Security Rules

- [ ] 1.1 Add `request.time` validation for `transactionSharingLastToggleAt` in `isTransactionSharingToggle()`
- [ ] 1.2 Add 15-minute cooldown check on `transactionSharingLastToggleAt` (migration-safe)
- [ ] 1.3 Consider adding daily limit enforcement (3 toggles/day) — may require `transactionSharingToggleCountToday` validation in rules

### Task 2: Integration Tests

- [ ] 2.1 Test: toggle DENIED within 15-minute cooldown
- [ ] 2.2 Test: toggle ALLOWED after cooldown elapsed
- [ ] 2.3 Test: toggle ALLOWED with null/missing `transactionSharingLastToggleAt`
- [ ] 2.4 Test: toggle DENIED with non-`serverTimestamp()` value for `transactionSharingLastToggleAt`

## Dev Notes

- Source story: [TD-CONSOLIDATED-11](./TD-CONSOLIDATED-11-server-side-rate-limiting.md)
- Review findings: #3, #4
- Files affected: `firestore.rules`, `tests/integration/firestore-rules.test.ts`
- Pattern reference: Follow `isSettingsUpdateAllowed()` pattern with `request.time` validation + migration-safe null check
- Daily limit enforcement is harder — Firestore rules can check `transactionSharingToggleCountToday < 3` but can't verify the count is being incremented correctly by the client. Consider whether server-side count validation is worth the complexity.
