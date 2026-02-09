# Story: TD-CONSOLIDATED-11: Server-Side Rate Limiting

## Status: done
## Epic: Epic 14d-v2 Shared Groups (Tech Debt - Tier 5)

> **Consolidated from:** TD-14d-6, TD-14d-39
> **Priority:** LOW (nice to have)
> **Estimated Effort:** 3-4 hours
> **Story Points:** 3 (SMALL-MEDIUM)
> **Risk:** MEDIUM
> **Dependencies:** None

## Overview

As a **developer**,
I want **server-side rate limiting for destructive group operations**,
So that **malicious or buggy clients cannot perform excessive deletions or modifications**.

### Problem Statement

Currently, rate limiting is only enforced client-side via cooldown utilities. A malicious client could bypass these and perform unlimited destructive operations. Server-side enforcement via Firestore security rules provides defense in depth.

### Approach

Timestamp-based rate limiting in Firestore security rules using `request.time` (server-provided, not spoofable by clients):

| Operation | Cooldown | Field Used | Mechanism |
|-----------|----------|-----------|-----------|
| Settings update (name/icon/color) | 60 seconds | `lastSettingsUpdateAt` (new) | Rules check elapsed time |
| Group deletion | 30 seconds | `updatedAt` (existing) | Rules check time since last update |
| Transaction sharing toggle | Unchanged | `transactionSharingLastToggleAt` | Own independent cooldown system |
| Join/leave group | Not rate-limited | N/A | Self-service, not destructive |

## Functional Acceptance Criteria

- [x] AC-1: Firestore security rules enforce 60-second cooldown on group settings updates (owner path)
- [x] AC-2: Firestore security rules enforce 30-second cooldown on group deletions (time since last `updatedAt`)
- [x] AC-3: Join and leave operations are NOT affected by rate limiting
- [x] AC-4: Existing groups without `lastSettingsUpdateAt` field are not blocked (migration-safe, null-safe)
- [x] AC-5: Client-side cooldowns remain unchanged and functional as UX layer
- [x] AC-6: Integration tests validate rate limiting enforcement, cooldown expiry, migration safety, and join/leave isolation
- [x] AC-7: All existing tests pass (`npm run test:story`)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] AC-ARCH-LOC-1: Rate limiting helpers (`isSettingsUpdateAllowed`, `isDeleteAllowed`) in `firestore.rules` within `match /sharedGroups/{groupId}` block, alongside existing helpers
- [x] AC-ARCH-LOC-2: `lastSettingsUpdateAt` field in `SharedGroup` interface at `src/types/sharedGroup.ts`, grouped with existing `transactionSharingLastToggleAt` field
- [x] AC-ARCH-LOC-3: `lastSettingsUpdateAt` write logic in `updateGroup()` function at `src/features/shared-groups/services/groupService.ts`, within the existing `runTransaction` block
- [x] AC-ARCH-LOC-4: Rate limiting integration tests in `tests/integration/firestore-rules.test.ts` as a new `describe` block

### Pattern Requirements

- [x] AC-ARCH-PATTERN-1: `lastSettingsUpdateAt` written inside the same `runTransaction` that validates ownership (TOCTOU prevention)
- [x] AC-ARCH-PATTERN-2: Security rules include migration-safe null/missing-field guard: `!('lastSettingsUpdateAt' in resource.data) || resource.data.lastSettingsUpdateAt == null`
- [x] AC-ARCH-PATTERN-3: Uses `request.time` (server-provided) in security rules and `serverTimestamp()` in service writes — consistent with existing timestamp patterns
- [x] AC-ARCH-PATTERN-4: `lastSettingsUpdateAt: Timestamp | null` follows established pattern of `transactionSharingLastToggleAt: Timestamp | null` in SharedGroup type
- [x] AC-ARCH-PATTERN-5: Integration tests use existing emulator helpers (`setupFirebaseEmulator`, `clearFirestoreData`, `withSecurityRulesDisabled`, `assertSucceeds`, `assertFails`)
- [x] AC-ARCH-PATTERN-6: Rate limiting only on `isGroupOwner()` update path — join/leave paths remain unmodified

### Anti-Pattern Requirements (Must NOT Happen)

- [x] AC-ARCH-NO-1: Client-side timestamps must NOT be used for rate limiting enforcement — only `request.time` in rules
- [x] AC-ARCH-NO-2: `Timestamp.now()` must NOT be used in `updateGroup()` for `lastSettingsUpdateAt` — must use `serverTimestamp()`
- [x] AC-ARCH-NO-3: Rate limiting must NOT be applied to `isUserJoining()` or `isUserLeaving()` paths
- [x] AC-ARCH-NO-4: A separate `lastDeleteAttemptAt` field must NOT be introduced — use existing `updatedAt`
- [x] AC-ARCH-NO-5: `updateTransactionSharingEnabled()` must NOT write `lastSettingsUpdateAt` — toggle has its own independent cooldown system
- [x] AC-ARCH-NO-6: Rules must NOT access `resource.data.lastSettingsUpdateAt` without a prior existence/null check — would silently block ALL owner updates on pre-existing groups

## File Specification

| File/Component | Exact Path | Pattern | AC Reference |
|----------------|------------|---------|--------------|
| Firestore security rules | `firestore.rules` | Rate limiting helpers + rule guards | AC-1, AC-2, AC-ARCH-LOC-1, AC-ARCH-PATTERN-2/3/6, AC-ARCH-NO-3/6 |
| SharedGroup type | `src/types/sharedGroup.ts` | Type addition | AC-ARCH-LOC-2, AC-ARCH-PATTERN-4 |
| Group service | `src/features/shared-groups/services/groupService.ts` | Service timestamp write | AC-ARCH-LOC-3, AC-ARCH-PATTERN-1/3, AC-ARCH-NO-2/5 |
| Integration tests | `tests/integration/firestore-rules.test.ts` | Emulator-based test | AC-6, AC-ARCH-LOC-4, AC-ARCH-PATTERN-5 |

## Tasks / Subtasks

### Task 1: Type Foundation + Service Layer

**Files:** `src/types/sharedGroup.ts`, `src/features/shared-groups/services/groupService.ts`

- [x] 1.1 Add `lastSettingsUpdateAt: Timestamp | null` to `SharedGroup` interface (alongside `transactionSharingLastToggleAt`)
- [x] 1.2 Add `lastSettingsUpdateAt: null` to `createGroup()` initial document (same pattern as other nullable timestamps)
- [x] 1.3 Add `lastSettingsUpdateAt: serverTimestamp()` to `updateGroup()` transaction `updateData` object (alongside `updatedAt: serverTimestamp()`)
- [x] 1.4 Run `npx tsc --noEmit` to verify type changes compile

### Task 2: Firestore Security Rules

**File:** `firestore.rules`

- [x] 2.1 Add `isSettingsUpdateAllowed()` helper function in `match /sharedGroups/{groupId}` block:
  ```
  function isSettingsUpdateAllowed() {
    return !('lastSettingsUpdateAt' in resource.data)
        || resource.data.lastSettingsUpdateAt == null
        || request.time > resource.data.lastSettingsUpdateAt + duration.value(60, 's');
  }
  ```
- [x] 2.2 Add `isDeleteAllowed()` helper function:
  ```
  function isDeleteAllowed() {
    return !('updatedAt' in resource.data)
        || resource.data.updatedAt == null
        || request.time > resource.data.updatedAt + duration.value(30, 's');
  }
  ```
- [x] 2.3 Modify `allow update` rule: gate `isGroupOwner()` path with `&& isSettingsUpdateAllowed()`
- [x] 2.4 Modify `allow delete` rule: add `&& isDeleteAllowed()`
- [x] 2.5 Validate rules syntax (deploy to emulator or `firebase deploy --only firestore:rules --dry-run`)

### Task 3: Integration Tests

**File:** `tests/integration/firestore-rules.test.ts`

- [x] 3.1 Add `describe('Rate Limiting Security Rules (TD-CONSOLIDATED-11)')` block
- [x] 3.2 Test: owner update DENIED within 60s cooldown (`lastSettingsUpdateAt` = `Timestamp.now()`)
- [x] 3.3 Test: owner update ALLOWED after 60s cooldown (`lastSettingsUpdateAt` = 61s ago)
- [x] 3.4 Test: owner update ALLOWED with `null` `lastSettingsUpdateAt` (migration safety)
- [x] 3.5 Test: owner update ALLOWED with missing `lastSettingsUpdateAt` field (migration safety)
- [x] 3.6 Test: delete DENIED within 30s of last `updatedAt`
- [x] 3.7 Test: delete ALLOWED after 30s cooldown
- [x] 3.8 Test: join operation NOT affected by rate limiting
- [x] 3.9 Test: leave operation NOT affected by rate limiting
- [x] 3.10 Run `npm run test:story` to verify all tests pass

## Dev Notes

### Architecture Guidance

**Firestore `duration.value()` syntax:**
`request.time > resource.data.lastSettingsUpdateAt + duration.value(60, 's')` creates a 60-second server-side cooldown. `request.time` is server-provided, not spoofable.

**Field existence check in rules:**
Use `'lastSettingsUpdateAt' in resource.data` to guard against missing fields on pre-existing documents. Without this, the rule silently evaluates to false and blocks ALL owner updates on old groups.

**Emulator testing strategy:**
- Cooldown enforced: Set `lastSettingsUpdateAt` to `Timestamp.now()`, attempt update immediately -> expect DENIED
- Cooldown elapsed: Set `lastSettingsUpdateAt` to `Timestamp.fromDate(new Date(Date.now() - 61000))`, attempt update -> expect ALLOWED
- Migration safety: Omit `lastSettingsUpdateAt` entirely or set null -> expect ALLOWED

**No new field for delete cooldown:**
Delete uses existing `updatedAt` with `duration.value(30, 's')`. Groups that haven't been updated use `updatedAt` from creation as the baseline.

**Client-side error surface:**
When the rule denies the write, the client receives `permission-denied` (not a custom error message). Client UX improvements (showing "please wait X seconds") are a follow-up concern, not in scope for this story.

**`updateTransactionSharingEnabled` NOT changed:**
The toggle has its own independent cooldown system (`transactionSharingLastToggleAt`, `transactionSharingToggleCountToday`). Conflating the two cooldowns would create unintended coupling — toggling sharing should not affect the ability to rename the group 60 seconds later.

### Technical Notes

No specialized technical review required — Planner + Architect analysis covers security patterns comprehensively.

### E2E Testing

E2E coverage not critical for this story — rate limiting is tested via integration tests with Firebase emulator. The security rules layer is transparent to E2E tests.

## ECC Analysis Summary

- **Risk Level:** MEDIUM
- **Complexity:** Moderate
- **Sizing:** SMALL-MEDIUM (3 pts) — 3 tasks, 19 subtasks, 4 files
- **Agents consulted:** Planner, Architect

## Senior Developer Review (ECC)

- **Date:** 2026-02-08
- **Classification:** STANDARD (2 agents)
- **Agents:** code-reviewer, security-reviewer
- **Score:** 7/10 (pre-fix)
- **Outcome:** APPROVED with 4 quick fixes applied, 1 TD story created

### Quick Fixes Applied

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 1 | Settings cooldown bypass via omitting `lastSettingsUpdateAt` | HIGH | Made `lastSettingsUpdateAt` write MANDATORY in `isSettingsUpdateAllowed()` |
| 2 | Ownership transfer blocked by settings cooldown | HIGH | Added `isOwnershipTransfer()` helper as separate update path |
| 6 | Magic numbers in integration tests | LOW | Extracted `DELETE_COOLDOWN_BYPASS_MS`, `SETTINGS_COOLDOWN_BYPASS_MS`, `WELL_PAST_COOLDOWN_MS` constants |
| 9 | JSDoc example missing `lastSettingsUpdateAt` | LOW | Added `lastSettingsUpdateAt: null` to type example |

### Deferred to Tech Debt

| # | Finding | Severity | Reason | TD Story |
|---|---------|----------|--------|----------|
| 3 | Toggle path has no server-side cooldown enforcement | MEDIUM | Pre-existing gap, not introduced by this story | TD-CONSOLIDATED-23 |
| 4 | Toggle timestamp not validated as `request.time` | MEDIUM | Companion to #3, same TD story | TD-CONSOLIDATED-23 |

## Tech Debt Stories Created

| Story | Title | Source Findings |
|-------|-------|-----------------|
| [TD-CONSOLIDATED-23](TD-CONSOLIDATED-23-toggle-server-side-cooldown.md) | Toggle Server-Side Cooldown | Review findings #3, #4 |

## Cross-References

- **Original stories:**
  - [TD-14d-6](TD-ARCHIVED/TD-14d-6-delete-rate-limiting.md) - Delete rate limiting
  - [TD-14d-39](TD-ARCHIVED/TD-14d-39-server-side-rate-limiting.md) - Server-side rate limiting
- **Related:** TD-CONSOLIDATED-9 (ADR documentation — rate limiting ADR can be written there)
- **Sources:** ECC Reviews (2026-02-03, 2026-02-04)
- **Patterns:** `docs/architecture/firestore-patterns.md`, `.claude/rules/security.md`
