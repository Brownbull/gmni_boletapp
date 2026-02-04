# Story 14d-v2-1-7a: Leave + Transfer Service Layer

Status: done

> **Split from:** 14d-v2-1-7 (Leave/Manage Group)
> **Split strategy:** by_feature - Service foundation layer
> **Part:** 1 of 6

## Story

As a **group member**,
I want **backend service functions to leave a group and transfer ownership**,
So that **the leave and transfer operations are properly validated and executed**.

## Acceptance Criteria

### From Parent Story (applicable to this split)

1. **Given** I am a group member (not owner)
   **When** I call `leaveGroup(userId, groupId)`
   **Then** I am removed from the group
   **And** my transactions remain in the group (tagged with `sharedGroupId`)
   **And** the `updatedAt` timestamp is updated

2. **Given** I am a group owner
   **When** I try to leave without transferring ownership first
   **Then** the service rejects with error "You must transfer ownership before leaving"

3. **Given** I am a group owner
   **When** I call `transferOwnership(currentOwnerId, newOwnerId, groupId)`
   **Then** the new owner receives the `ownerId` field
   **And** ALL toggle state fields are preserved (no reset on transfer):
   - `transactionSharingToggleCountToday`
   - `transactionSharingLastToggleAt`
   - `transactionSharingToggleCountResetAt`

4. **Given** ownership is transferred
   **When** the transfer completes
   **Then** the `updatedAt` timestamp is updated
   **And** the cooldown continues from where it was (no reset)

5. **Given** I try to transfer ownership to a non-member
   **When** the request is processed
   **Then** a validation error is returned: "Selected user is not a member of this group"

6. **Given** I try to leave a group I'm not a member of
   **When** the request is processed
   **Then** a 403 Forbidden / validation error is returned

## Tasks / Subtasks

- [x] **Task 1: Update Group Service for Leave Operations** (AC: #1, #2, #6)
  - [x] 1.1: Create `leaveGroup(userId, groupId): Promise<void>` in `groupService.ts` (FSD location)
  - [x] 1.2: Implement member removal from `members` array using `arrayRemove`
  - [x] 1.3: Verify user is member before allowing leave
  - [x] 1.4: Verify user is NOT owner (must transfer first)
  - [x] 1.5: Update `updatedAt` timestamp on group document
  - [x] 1.6: Add unit tests for leave scenarios (8 tests)

- [x] **Task 2: Implement Ownership Transfer** (AC: #3, #4, #5)
  - [x] 2.1: Create `transferOwnership(currentOwnerId, newOwnerId, groupId): Promise<void>`
  - [x] 2.2: Verify `currentOwnerId` is current owner
  - [x] 2.3: Verify `newOwnerId` is a member of the group
  - [x] 2.4: Transfer `ownerId` field to new owner
  - [x] 2.5: Preserve ALL toggle state fields (NO reset on transfer):
    - `transactionSharingToggleCountToday`
    - `transactionSharingLastToggleAt`
    - `transactionSharingToggleCountResetAt`
  - [x] 2.6: Update `updatedAt` timestamp
  - [x] 2.7: Add unit tests for ownership transfer (11 tests)

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **DM-1** | Transaction owner = creator | Only creator can modify |
| **DM-2** | Ownership is permanent | Cannot transfer except group owner role |
| **Toggle Cooldown Preservation** | New owner inherits cooldown | Prevents gaming via transfer |

### Data Model Implications

```typescript
// Group document update on leave:
{
  memberIds: arrayRemove(leavingUserId),  // Remove from array
  updatedAt: serverTimestamp()
}

// Ownership transfer update:
{
  ownerId: newOwnerId,
  updatedAt: serverTimestamp()
  // NOTE: Do NOT reset toggle fields!
}
```

### Error Handling

| Scenario | Error Message |
|----------|---------------|
| Leave when owner | "You must transfer ownership before leaving" |
| Transfer to non-member | "Selected user is not a member of this group" |
| Leave when not member | "You are not a member of this group" |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/sharedGroupService.ts` | Modify | Add `leaveGroup`, `transferOwnership` functions |
| `tests/unit/services/sharedGroupService.test.ts` | Modify | Add tests for leave/transfer |

### Testing Standards

- **Unit tests:** 20+ tests covering all leave/transfer scenarios
- **Coverage target:** 80%+ for new code
- Test error paths (not member, owner trying to leave, etc.)

### Dependencies

- **None** - This is the foundation story for the leave/manage feature

### Downstream Stories

- **14d-v2-1-7b**: Deletion service (builds on ownership validation)
- **14d-v2-1-7c**: Cloud Function (listens for memberIds changes)
- **14d-v2-1-7d**: UI components (call these service functions)

### References

- [Parent Story: 14d-v2-1-7-leave-manage-group.md]
- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-17-leavemanage-group]
- [Toggle Cooldown Rules: docs/architecture/epic-14d-requirements-and-concerns.md#51-layered-visibility-model]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (atlas-dev-story workflow)

### Debug Log References

- None (clean implementation)

### Completion Notes List

1. Implemented `leaveGroup(db, userId, groupId)` in `groupService.ts`:
   - Uses Firestore transaction for atomic update
   - Validates user is a member before allowing leave
   - Prevents owner from leaving (must transfer first)
   - Removes user from `members` array using `arrayRemove`
   - Updates `updatedAt` with `serverTimestamp()`
   - Transactions remain tagged (no sharedGroupId removal)

2. Implemented `transferOwnership(db, currentOwnerId, newOwnerId, groupId)`:
   - Uses Firestore transaction for atomic update
   - Validates current owner is actual owner
   - Validates new owner is a member of the group
   - Transfers `ownerId` field to new owner
   - **CRITICAL**: Does NOT reset toggle state fields (preserves cooldown)
   - Only updates `ownerId` and `updatedAt` (minimal update)

3. Added 19 unit tests covering all acceptance criteria:
   - 8 tests for `leaveGroup` scenarios
   - 11 tests for `transferOwnership` scenarios
   - All tests follow red-green-refactor TDD approach

4. Location changed from story spec: Functions added to `src/features/shared-groups/services/groupService.ts` (FSD-compliant location) instead of `src/services/sharedGroupService.ts` (stub file).

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/features/shared-groups/services/groupService.ts` | Modified | Added `leaveGroup`, `transferOwnership` functions + `arrayRemove` import |
| `src/features/shared-groups/services/index.ts` | Modified | Added barrel exports for `leaveGroup`, `transferOwnership` |
| `tests/unit/services/groupService.test.ts` | Modified | Added 27 tests for leave/transfer scenarios (exceeds claimed 19) |
| `docs/sprint-artifacts/sprint-status.yaml` | Modified | Updated status to in-progress → review → done |

## Senior Developer Review (ECC)

### Review Date
2026-02-02

### ECC Agents Used
- Code Reviewer (quality, maintainability)
- Security Reviewer (OWASP, vulnerabilities)
- Architect (patterns, design compliance)
- TDD Guide (test coverage, quality)

### Review Scores

| Category | Status | Score |
|----------|--------|-------|
| Code Quality | ✅ PASS | 8/10 |
| Security | ✅ PASS | 9/10 |
| Architecture | ✅ PASS | 9/10 |
| Testing | ✅ PASS | 10/10 |
| **OVERALL** | **✅ PASS** | **9/10** |

### Findings Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 2 |
| LOW | 5 |

### Issues Fixed During Review

1. **[MEDIUM]** Missing barrel exports for `leaveGroup` and `transferOwnership` in `index.ts` - **FIXED**

### Remaining Action Items (Optional)

1. **[MEDIUM]** Add validation to prevent owner transferring ownership to self (edge case, low priority)
2. **[LOW]** Add explicit array validation for data integrity monitoring
3. **[LOW]** Add JSDoc note about atomicity guarantees

### Outcome
**APPROVED** - Implementation meets all acceptance criteria, comprehensive test coverage (27 tests, 100% AC coverage), follows established patterns, no security vulnerabilities found.
