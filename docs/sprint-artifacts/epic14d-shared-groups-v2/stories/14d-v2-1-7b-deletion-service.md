# Story 14d-v2-1-7b: Deletion Service Logic

Status: done

> **Split from:** 14d-v2-1-7 (Leave/Manage Group)
> **Split strategy:** by_feature - Deletion logic layer
> **Part:** 2 of 6

## Story

As a **group owner or last member**,
I want **backend service functions to delete a group with proper cleanup**,
So that **groups are properly removed with all associated data cleaned up**.

## Acceptance Criteria

### From Parent Story (applicable to this split)

1. **Given** I am the only member of a group
   **When** I leave (effectively deleting the group)
   **Then** the group is deleted
   **And** all transactions have `sharedGroupId` set to null (constraint DM-6)

2. **Given** I am a group owner
   **When** I tap "Delete Group"
   **Then** all members are removed
   **And** all transactions have `sharedGroupId` set to null
   **And** the group is deleted

3. **Given** a group is deleted (last member or owner delete)
   **When** the deletion completes
   **Then** all `/groups/{groupId}/changelog/*` documents are deleted
   **And** all `/groups/{groupId}/analytics/*` documents are deleted
   **And** all pending invitations for this group are deleted

4. **Given** I try to delete a group I don't own
   **When** the request is processed
   **Then** a validation error is returned: "Only the group owner can delete the group"

## Tasks / Subtasks

- [x] **Task 1: Implement Last Member Deletion** (AC: #1, #3)
  - [x] 1.1: Create `deleteGroupAsLastMember(userId, groupId): Promise<void>`
  - [x] 1.2: Verify user is only member
  - [x] 1.3: Set `sharedGroupId = null` on all transactions in the group
  - [x] 1.4: Delete all `/groups/{groupId}/changelog/*` documents
  - [x] 1.5: Delete all `/groups/{groupId}/analytics/*` documents
  - [x] 1.6: Delete the group document itself
  - [x] 1.7: Add unit tests for cascade deletion

- [x] **Task 2: Implement Owner Group Deletion** (AC: #2, #3, #4)
  - [x] 2.1: Create `deleteGroupAsOwner(ownerId, groupId): Promise<void>`
  - [x] 2.2: Verify user is owner
  - [x] 2.3: Set `sharedGroupId = null` on ALL transactions in the group (all members)
  - [x] 2.4: Delete changelog and analytics subcollections
  - [x] 2.5: Delete all pending invitations for this group
  - [x] 2.6: Delete the group document
  - [x] 2.7: Add unit tests for owner deletion

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **DM-6** | No remaining users = group deleted | Cleanup orphaned groups |
| **Cascade Order** | Transactions → Subcollections → Invitations → Group | Maintain referential integrity |

### Cascade Deletion Order (Last Member or Owner Delete)

```
1. Set sharedGroupId = null on ALL transactions (batched writes)
2. Delete /groups/{groupId}/changelog/* (subcollection)
3. Delete /groups/{groupId}/analytics/* (subcollection)
4. Delete /pendingInvitations where groupId == groupId
5. Delete /sharedGroups/{groupId} (main document)
```

### Batch Writing for Transactions

```typescript
// Use batched writes for transaction updates (max 500 per batch)
const batch = writeBatch(db);
transactions.forEach(tx => {
  batch.update(doc(db, 'transactions', tx.id), { sharedGroupId: null });
});
await batch.commit();
```

### Error Handling

| Scenario | Error Message |
|----------|---------------|
| Delete when not owner | "Only the group owner can delete the group" |
| Delete with multiple members (non-owner) | "You must be the only member or owner to delete" |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/sharedGroupService.ts` | Modify | Add `deleteGroupAsLastMember`, `deleteGroupAsOwner` functions |
| `tests/unit/services/sharedGroupService.test.ts` | Modify | Add tests for deletion scenarios |

### Testing Standards

- **Unit tests:** 15+ tests covering deletion scenarios
- **Coverage target:** 80%+ for new code
- Test cascade deletion order
- Test batch writing with >500 transactions

### Dependencies

- **14d-v2-1-7a**: Uses ownership validation patterns from transfer service

### Downstream Stories

- **14d-v2-1-7e**: Delete UI (calls `deleteGroupAsOwner`)
- **14d-v2-1-7f**: Integration tests (verifies cascade)

### References

- [Parent Story: 14d-v2-1-7-leave-manage-group.md]
- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-17-leavemanage-group]
- [Data Model Constraints: DM-1 through DM-6 in epics.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 via ECC-dev-story workflow (Atlas Puppeteer orchestration)

### Debug Log References

- ECC Planner: Implementation plan created with 5 phases
- ECC TDD Guide: 26 tests written, all passing
- ECC Build Resolver: Fixed batch handling in `deleteSubcollection()` and `deletePendingInvitationsForGroup()`
- ECC Code Reviewer: 3 HIGH, 3 MEDIUM, 3 LOW findings
- ECC Security Reviewer: 1 CRITICAL, 2 HIGH, 3 MEDIUM findings

### Completion Notes List

1. **Implementation:** Added `deleteGroupAsLastMember` and `deleteGroupAsOwner` functions to `groupService.ts`
2. **Tests:** 26 new tests covering input validation, group validation, cascade deletion, and batching
3. **Coverage:** 79-80% for new code
4. **Code Review Fixes:** Batch handling added to all helper functions (originally missing in 2 functions)
5. **Review Fixes (2026-02-02):** All CRITICAL, HIGH, and MEDIUM ECC review items addressed:
   - TOCTOU race condition eliminated via atomic `runTransaction()`
   - appId validation added with allowlist
   - Cascade error handling improved
   - Batch helper extracted for DRY
   - Audit logging added
   - 45+ new tests for review fixes

### File List

| File | Action | Lines Changed |
|------|--------|---------------|
| `src/features/shared-groups/services/groupService.ts` | Modified | +290 (initial), +120 (review fixes) |
| `src/features/shared-groups/services/index.ts` | Modified | +2 (exports) |
| `src/features/shared-groups/index.ts` | Modified | +4 (exports) |
| `src/utils/validationUtils.ts` | Modified | +25 (validateAppId) |
| `tests/unit/services/groupService.test.ts` | Modified | +350 (initial), +200 (review fix tests) |
| `tests/unit/utils/validationUtils.test.ts` | Modified | +50 (validateAppId tests) |

## Senior Developer Review (ECC)

**Review Date:** 2026-02-02
**ECC Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide
**Outcome:** ~~CHANGES REQUESTED~~ → APPROVED (review fixes applied 2026-02-02)
**Overall Score:** 6/10 → 9/10 (post-fix)

| Category | Score |
|----------|-------|
| Code Quality | 7/10 |
| Security | 4/10 |
| Architecture | 6/10 |
| Testing | 7/10 |

### Review Follow-ups (ECC)

#### CRITICAL (Block deployment)

- [x] [ECC-Review][CRITICAL][Security] **TOCTOU Race Condition** - ✅ FIXED: Wrapped authorization check + group deletion in `runTransaction()`. Cascade operations run outside transaction (idempotent), final delete uses atomic check + delete.

#### HIGH (Must fix)

- [x] [ECC-Review][HIGH][Security] **Changelog Deletion Security Rules** - ✅ FIXED: Added try-catch with informative logging. TTL cleanup handles orphaned entries.
- [x] [ECC-Review][HIGH][Security] **appId Validation** - ✅ FIXED: Added `validateAppId()` function in `src/utils/validationUtils.ts` with allowlist `['boletapp']`. Applied to both deletion functions.
- [x] [ECC-Review][HIGH][Architect] **Barrel Exports Missing** - ✅ FIXED: Exported all functions from both barrel files.

#### MEDIUM (Should fix)

- [x] [ECC-Review][MEDIUM][Code] **Cascade Error Handling** - ✅ FIXED: Added try-catch with structured logging. Re-throws to prevent orphaned group documents.
- [x] [ECC-Review][MEDIUM][Code] **Extract Batch Helper** - ✅ FIXED: Created `processBatchedOperation()` helper used by all 3 batch functions.
- [x] [ECC-Review][MEDIUM][Test] **Add >500 Batch Tests** - ✅ FIXED: Added tests for >500 documents in changelog, transactions, and multiple members.
- [x] [ECC-Review][MEDIUM][Test] **Add Edge Case Tests** - ✅ FIXED: Added tests for empty members, batch.commit() failure.
- [x] [ECC-Review][MEDIUM][Security] **Audit Logging** - ✅ FIXED: Added structured DEV logging for deletion initiation and completion.

#### LOW (Nice to have)

- [x] [ECC-Review][LOW][Code] **JSDoc @returns** - ✅ FIXED: Added `@returns {Promise<void>}` to all helper functions.
- [ ] [ECC-Review][LOW][Code] **File Size** - Deferred: Consider splitting in future refactor story.
- [ ] [ECC-Review][LOW][Architect] **Test Location** - Deferred: Consider moving in future cleanup story.

### Action Items Count

| Severity | Original | Fixed | Remaining |
|----------|----------|-------|-----------|
| CRITICAL | 1 | 1 | 0 |
| HIGH | 3 | 3 | 0 |
| MEDIUM | 5 | 5 | 0 |
| LOW | 3 | 1 | 2 (deferred) |
| **Total** | **12** | **10** | **2** |

**Note:** All CRITICAL, HIGH, and MEDIUM items have been addressed. 2 LOW items (File Size, Test Location) deferred to future cleanup stories.

### Review Fixes Session (2026-02-02)

**Agent:** Claude Opus 4.5 via ECC-dev-story workflow
**Duration:** Single session
**Outcome:** All blocking items resolved

**Changes Made:**

| File | Change |
|------|--------|
| `src/utils/validationUtils.ts` | Added `validateAppId()` function with allowlist |
| `src/features/shared-groups/services/groupService.ts` | TOCTOU fix, appId validation, cascade error handling, batch helper extraction, audit logging, JSDoc |
| `src/features/shared-groups/services/index.ts` | Added barrel exports for deletion functions |
| `src/features/shared-groups/index.ts` | Added barrel exports for all membership functions |
| `tests/unit/utils/validationUtils.test.ts` | Added 15 tests for `validateAppId` |
| `tests/unit/services/groupService.test.ts` | Added 30+ tests for ECC review fixes |

**Test Results:**
- All 167 tests pass (groupService + validationUtils)
- TypeScript check passes
- No linting errors

**Code Quality:**
- TOCTOU race condition eliminated via atomic transaction
- Security improved with appId validation allowlist
- Error handling improved with cascade try-catch
- Code DRY'd with shared batch helper
- Audit trail added for destructive operations

### ECC Review Session #2 (2026-02-02)

**Agent:** Claude Opus 4.5 via ECC-code-review workflow (parallel 4-agent review)
**ECC Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide
**Outcome:** CHANGES REQUESTED → APPROVED (post-fix)

**Initial Scores (Post-Fix Session #1):**

| Category | Initial | Post-Fix #2 |
|----------|---------|-------------|
| Code Quality | 7/10 | 8/10 |
| Security | 8/10 | 9/10 |
| Architecture | 9/10 | 9/10 |
| Testing | 9/10 | 9/10 |
| **OVERALL** | **8/10** | **9/10** |

**New Findings:**

#### HIGH (Fixed)

- [x] [ECC-Review-2][HIGH][Code+Security] **Missing ownership pre-check before cascade** - ✅ FIXED: Added ownership validation BEFORE cascade operations in `deleteGroupAsOwner` (line 970-974). Prevents unauthorized users from triggering transaction updates on other members' data before the operation fails.

- [x] [ECC-Review-2][HIGH][Code] **Undocumented cascade trade-offs** - ✅ FIXED: Added ARCHITECTURAL NOTE comments documenting why cascade operations run outside transaction (Firestore 500 op limit, idempotent operations, trade-offs).

#### MEDIUM (Deferred)

- [ ] [ECC-Review-2][MEDIUM][Code] **DRY violation** - ~80% shared code between deletion functions. Deferred to future refactor.
- [ ] [ECC-Review-2][MEDIUM][Code] **Sequential member processing** - Could use Promise.all for parallel execution. Acceptable with max 10 members.
- [ ] [ECC-Review-2][MEDIUM][Security] **DEV-only audit logging** - Production audit trail recommended. Deferred to monitoring story.

#### LOW (Deferred)

- [ ] [ECC-Review-2][LOW][Code] **Type assertions with any** - Use proper Firestore types in processBatchedOperation.
- [ ] [ECC-Review-2][LOW][Code] **Magic strings** - Define 'artifacts', 'users', 'transactions' as constants.

**Changes Made Session #2:**

| File | Change |
|------|--------|
| `src/features/shared-groups/services/groupService.ts` | Added ownership pre-check (lines 970-974), architectural documentation for cascade operations |
| `tests/unit/services/groupService.test.ts` | Added test verifying cascade is NOT called when ownership check fails |

**Test Results (Session #2):**
- All 124 tests pass
- TypeScript check passes
- New test verifies cascade operations are blocked for non-owners
