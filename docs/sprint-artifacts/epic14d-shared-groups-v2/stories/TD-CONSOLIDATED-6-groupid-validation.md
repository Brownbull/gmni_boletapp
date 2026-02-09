# TD-CONSOLIDATED-6: GroupId Validation

Status: done

> **Tier:** 2 - Security (SHOULD DO)
> **Consolidated from:** TD-14d-55
> **Priority:** MEDIUM (path injection prevention)
> **Estimated Effort:** 1-2 hours
> **Risk:** LOW
> **Dependencies:** None

## Story

As a **developer**,
I want **groupId validated before use in Firestore field paths**,
So that **path injection attacks are prevented**.

## Problem Statement

GroupId values are used directly in Firestore field paths without validation. A malicious groupId containing path separators (e.g., `/`) could potentially access unintended document paths.

## Acceptance Criteria

- [x] Add `validateGroupId()` utility function
- [x] Validate groupId format (alphanumeric + hyphens only)
- [x] Apply validation at service layer entry points
- [x] Unit tests for validation edge cases

## Implementation Details

### Files Changed

| File | Change |
|------|--------|
| `src/utils/validationUtils.ts` | Added `validateGroupId()` as canonical location |
| `src/services/userPreferencesService.ts` | Replaced local definition with import + re-export |
| `src/features/shared-groups/services/groupService.ts` | Added validation to `updateGroup()`, `updateTransactionSharingEnabled()` |
| `src/features/shared-groups/services/groupDeletionService.ts` | Added validation to `deleteGroupAsLastMember()`, `deleteGroupAsOwner()` |
| `src/features/shared-groups/services/groupMemberService.ts` | Updated import path, added validation to `joinGroupDirectly()`, `leaveGroup()`, `transferOwnership()` |
| `src/services/changelogService.ts` | Replaced ad-hoc validation with `validateGroupId()` |
| `src/services/invitationService.ts` | Updated import path, added validation to `createInvitation()`, `acceptInvitation()`, `validateGroupCapacity()` |
| `tests/unit/utils/validationUtils.test.ts` | 22 new tests for `validateGroupId` edge cases |
| `tests/unit/services/invitationService.test.ts` | Updated mocks and expected messages |

### Dev Notes

- Cloud Functions (`functions/src/changelogWriter.ts`) have a separate `isValidGroupId()` with looser rules (allows any chars except `/`, up to 1500 chars). Out of scope for this story since Cloud Functions have isolated builds.
- `AcceptInvitationDialog.tsx` also uses groupId in a Firestore doc path, but the groupId comes from a validated Firestore document. Lower risk, deferred.
- Regex: `^[a-zA-Z0-9_-]{1,128}$` (matches Firestore auto-generated IDs)

## Senior Developer Review (ECC)

**Date:** 2026-02-08
**Classification:** STANDARD (2 agents: code-reviewer, security-reviewer)
**Score:** 7.5/10 — APPROVE WITH MINOR CHANGES
**Result:** All HIGH/MEDIUM fixes applied, 1 COMPLEX item deferred

### Quick Fixes Applied (5)
1. **HIGH** — Added `validateGroupId()` to `AcceptInvitationDialog.tsx` before Firestore doc path
2. **HIGH** — Added `validateGroupId()` to `checkDuplicateInvitation()` in invitationService.ts
3. **HIGH** — Added direct `validateGroupId()` to `leaveGroupWithCleanup()` and `transferAndLeaveWithCleanup()`
4. **MEDIUM** — Changed changelogService.ts error message to use caught error (prevents message drift)
5. **MEDIUM** — Moved `validateGroupId()` earlier in `acceptInvitation()` transaction (before status checks)

### Deferred to TD Stories (1)
- **TD-CONSOLIDATED-20** (MEDIUM) — Cloud Functions `isValidGroupId()` uses looser regex than client-side

### Test Impact
- All 8,178 tests pass (309 files)
- Fixed 1 test regression: `leaveGroupWithCleanup` empty-check order after adding validation guard

## Cross-References

- **Original story:** [TD-14d-55](TD-ARCHIVED/TD-14d-55-groupid-validation.md)
- **Source:** ECC Parallel Review #2 (2026-02-05) on story 14d-v2-1-12a
- **Spawned:** [TD-CONSOLIDATED-20](TD-CONSOLIDATED-20-cloud-functions-groupid-validation-alignment.md)
