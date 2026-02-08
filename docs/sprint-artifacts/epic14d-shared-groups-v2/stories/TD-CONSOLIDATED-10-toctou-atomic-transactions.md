# Story: TD-CONSOLIDATED-10: TOCTOU Atomic Transactions

## Status: done
## Epic: Epic 14d-v2 Shared Groups (Tech Debt - Tier 5)

> **Consolidated from:** TD-14d-11
> **Priority:** LOW (nice to have)
> **Estimated Effort:** 2-3 hours
> **Story Points:** 2-3 (SMALL)
> **Risk:** LOW
> **Dependencies:** None

## Overview

As a **developer**,
I want **membership validation wrapped in Firestore transactions**,
So that **time-of-check to time-of-use (TOCTOU) race conditions are prevented**.

### Problem Statement

Group membership is validated in a separate read before mutations. In rare concurrent scenarios, a user could pass validation then have their membership removed before the mutation executes.

### Scope

The planner analysis found that **most operations already use `runTransaction()` correctly**. Only three functions need changes:

| Function | File | Issue |
|----------|------|-------|
| `transferAndLeaveWithCleanup` | `groupMemberService.ts` | Two separate transactions should be merged into one |
| `deleteGroupAsLastMember` | `groupDeletionService.ts` | Initial `getDoc()` outside transaction for authorization |
| `deleteGroupAsOwner` | `groupDeletionService.ts` | Initial `getDoc()` outside transaction for authorization |

**Already correct (no changes needed):**
- `leaveGroup` — single atomic `runTransaction()`
- `transferOwnership` — single atomic `runTransaction()`
- `joinGroupDirectly` — single atomic `runTransaction()`
- `updateGroup` — single atomic `runTransaction()`
- `updateTransactionSharingEnabled` — single atomic `runTransaction()`

## Functional Acceptance Criteria

- [ ] AC-1: `transferAndLeaveWithCleanup` performs ownership transfer AND member removal in a **single** `runTransaction()` call
- [ ] AC-2: `deleteGroupAsLastMember` validates membership inside a `runTransaction()` (not bare `getDoc()`) before running cascade operations
- [ ] AC-3: `deleteGroupAsOwner` validates ownership inside a `runTransaction()` (not bare `getDoc()`) before running cascade operations
- [ ] AC-4: All existing tests pass (`npm run test:quick`)
- [ ] AC-5: Add concurrent operation tests verifying TOCTOU protection for all three functions

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] AC-ARCH-LOC-1: `transferAndLeaveWithCleanup` function remains in `src/features/shared-groups/services/groupMemberService.ts`
- [ ] AC-ARCH-LOC-2: `deleteGroupAsLastMember` function remains in `src/features/shared-groups/services/groupDeletionService.ts`
- [ ] AC-ARCH-LOC-3: `deleteGroupAsOwner` function remains in `src/features/shared-groups/services/groupDeletionService.ts`

### Pattern Requirements

- [ ] AC-ARCH-PATTERN-1: `transferAndLeaveWithCleanup` merges ownership transfer + member removal into a SINGLE `runTransaction()` with authorization check (ownerId verification) and mutations (ownerId update + `arrayRemove`) happening atomically
- [ ] AC-ARCH-PATTERN-2: `deleteGroupAsLastMember` validates membership and sole-member status inside a `runTransaction()` (transactional validation gate). Cascade operations may run outside due to 500-operation limit
- [ ] AC-ARCH-PATTERN-3: `deleteGroupAsOwner` validates ownership inside a `runTransaction()` (transactional validation gate). Cascade operations may run outside due to 500-operation limit
- [ ] AC-ARCH-PATTERN-4: Preference cleanup in `transferAndLeaveWithCleanup` remains outside the main transaction, wrapped in try/catch (non-blocking per AC#7)
- [ ] AC-ARCH-PATTERN-5: All existing input validation (`validateAppId`, `validateGroupId`, empty string checks) is preserved
- [ ] AC-ARCH-PATTERN-6: All existing error messages are preserved (consumers may depend on specific error strings)
- [ ] AC-ARCH-PATTERN-7: Public function signatures (parameter and return types) are unchanged
- [ ] AC-ARCH-PATTERN-8: Firestore batch chunking at 500 operations remains intact in cascade operations

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] AC-ARCH-NO-1: `transferAndLeaveWithCleanup` must NOT call `transferOwnership()` and `leaveGroup()` as two separate transactions
- [ ] AC-ARCH-NO-2: `deleteGroupAsLastMember` must NOT use bare `getDoc()` for the initial authorization/membership check
- [ ] AC-ARCH-NO-3: `deleteGroupAsOwner` must NOT use bare `getDoc()` for the initial authorization/ownership check
- [ ] AC-ARCH-NO-4: No new `getDoc()` imports or calls may be added to `groupDeletionService.ts` — existing `getDoc` import should be removed if no longer used
- [ ] AC-ARCH-NO-5: Cascade operations must NOT be moved inside the authorization transaction — they may exceed 500 operations
- [ ] AC-ARCH-NO-6: `leaveGroupWithCleanup` must NOT be modified — it already calls `leaveGroup()` which is a single atomic transaction
- [ ] AC-ARCH-NO-7: No changes to hook-layer files (`useLeaveTransferFlow.ts`, `useGruposViewHandlers.ts`) — this story is service-layer only

## File Specification

| File/Component | Exact Path | Pattern | AC Reference |
|----------------|------------|---------|--------------|
| groupMemberService | `src/features/shared-groups/services/groupMemberService.ts` | TOCTOU Prevention | AC-1, AC-ARCH-PATTERN-1, AC-ARCH-NO-1 |
| groupDeletionService | `src/features/shared-groups/services/groupDeletionService.ts` | TOCTOU Prevention | AC-2, AC-3, AC-ARCH-PATTERN-2/3, AC-ARCH-NO-2/3/4 |
| Feature test | `tests/unit/features/shared-groups/services/groupService.test.ts` | Testing conventions | AC-4, AC-5 |
| Service test | `tests/unit/services/groupService.test.ts` | Testing conventions | AC-4, AC-5 |

## Tasks / Subtasks

### Task 1: Merge `transferAndLeaveWithCleanup` into Single Transaction

**File:** `src/features/shared-groups/services/groupMemberService.ts` (lines ~335-364)

- [ ] 1.1 Rewrite `transferAndLeaveWithCleanup` to use a single `runTransaction()`:
  - Read group document once via `transaction.get()`
  - Validate `currentOwnerId` is the actual `ownerId`
  - Validate `newOwnerId` is in `members` array
  - Atomically set `ownerId = newOwnerId` and remove `currentOwnerId` from `members`
  - Use `arrayRemove` for member removal and `serverTimestamp` for `updatedAt`
- [ ] 1.2 Keep preference cleanup (`removeGroupPreference`) outside the transaction (non-blocking, try/catch)
- [ ] 1.3 Update JSDoc to document the atomic nature of the operation
- [ ] 1.4 Preserve all existing validation checks and error messages

### Task 2: Harden Deletion Service with Transactional Validation Gate

**File:** `src/features/shared-groups/services/groupDeletionService.ts`

- [ ] 2.1 In `deleteGroupAsLastMember` (lines ~222-347): Replace initial `getDoc()` with `runTransaction()` that reads and validates (membership + sole-member check), returns validated data for cascade use
- [ ] 2.2 In `deleteGroupAsOwner` (lines ~376-497): Replace initial `getDoc()` with `runTransaction()` that reads and validates (ownership check), returns validated data for cascade use
- [ ] 2.3 Keep cascade operations outside transaction (500-op limit constraint)
- [ ] 2.4 Keep final `runTransaction()` delete with re-validation (already exists)
- [ ] 2.5 Remove `getDoc` import if no longer used
- [ ] 2.6 Enhance architectural comments explaining the transactional gate pattern

### Task 3: Update Tests + Add Concurrent Operation Tests

**Files:**
- `tests/unit/features/shared-groups/services/groupService.test.ts`
- `tests/unit/services/groupService.test.ts`

- [ ] 3.1 Update `transferAndLeaveWithCleanup` tests to verify single `runTransaction` call (was two calls)
- [ ] 3.2 Verify atomic validation: transfer + leave happens in single transaction
- [ ] 3.3 Verify preference cleanup still runs after the transaction (non-blocking)
- [ ] 3.4 Test error cases: not owner, new owner not a member, group not found
- [ ] 3.5 Update `deleteGroupAsLastMember` tests: mock `runTransaction` for validation gate instead of `getDoc`
- [ ] 3.6 Update `deleteGroupAsOwner` tests: mock `runTransaction` for validation gate instead of `getDoc`
- [ ] 3.7 Add concurrent operation test: deletion rejects when membership changes
- [ ] 3.8 Add concurrent operation test: transfer+leave validates atomically
- [ ] 3.9 Run `npm run test:quick` to verify all tests pass

## Dev Notes

### Architecture Guidance

**Design Decisions:**

1. **Single Transaction for Transfer+Leave:** The current `transferAndLeaveWithCleanup` calls `transferOwnership()` (Transaction 1) then `leaveGroup()` (Transaction 2). Between these calls, a concurrent operation could interleave. Merging into a single `runTransaction()` eliminates this gap. The combined transaction reads the group once, validates, and performs both mutations atomically.

2. **Transactional Validation Gate for Deletions:** The deletion functions use a two-phase approach: validate-then-cascade-then-delete. The cascade operations (clearing transaction tags, deleting subcollections, deleting invitations) cannot fit inside a single transaction because they may exceed Firestore's 500-operation limit. The fix replaces the bare `getDoc()` initial read with a `runTransaction()` that provides snapshot isolation for the validation phase. The cascade operations are idempotent by design, and the final transaction re-validates before deleting.

3. **No Public API Changes:** All three functions maintain their existing signatures. No changes to hooks, UI components, or barrel exports.

**Firestore Transaction Constraints:**
- 500-operation limit per transaction (why cascades run outside)
- Read-only transactions are valid — provides snapshot isolation without writes
- Client SDK auto-retries up to 5x on contention
- `arrayRemove()` works within transactions

**Key Code Locations:**
- `transferAndLeaveWithCleanup`: `groupMemberService.ts` ~lines 335-364
- `deleteGroupAsLastMember`: `groupDeletionService.ts` ~lines 222-347
- `deleteGroupAsOwner`: `groupDeletionService.ts` ~lines 376-497
- Architectural note on cascades: `groupDeletionService.ts` ~lines 268-273
- Existing TOCTOU tests: `groupService.test.ts` ~line 1780+

### Technical Notes

No specialized technical review required — Planner + Architect analysis covers database and security patterns comprehensively.

### E2E Testing

E2E coverage recommended — run `/ecc-e2e TD-CONSOLIDATED-10` after implementation for concurrency scenarios.

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Simple
- **Sizing:** SMALL (2-3 pts) — 3 tasks, 18 subtasks, 4 files
- **Agents consulted:** Planner, Architect

## Senior Developer Review (ECC)

- **Review date:** 2026-02-08
- **Classification:** STANDARD
- **ECC agents used:** code-reviewer, security-reviewer
- **Outcome:** APPROVE (9/10)
- **Findings:** 3 quick fixes applied (comment clarity, test assertion, DRY helper)
- **TOCTOU analysis:** All 3 functions hardened correctly. No remaining TOCTOU windows in critical paths.
- **Tests:** 8217/8217 passing (309 files)

## Cross-References

- **Original story:** [TD-14d-11](TD-ARCHIVED/TD-14d-11-toctou-membership-validation.md)
- **Source:** ECC Parallel Review (2026-02-03) on story 14d-v2-1-8a
- **Related patterns:** `docs/architecture/firestore-patterns.md` (TOCTOU section)
- **Security rules:** `.claude/rules/security.md` (TOCTOU Prevention section)
