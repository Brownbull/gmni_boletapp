# Story 19-2: Group CRUD Cloud Functions

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "This story builds the shared board by adding the management office -- create, join, leave, and tear down groups"

## Story
As a user, I want to create groups, invite members, and manage membership, so that my household can start tracking shared expenses.

## Acceptance Criteria

### Functional
- **AC-1:** Given a Cloud Function `createGroup`, when called with name and creator userId, then a group document is created with creator as first admin and member
- **AC-2:** Given a Cloud Function `manageGroupMember`, when adding a member, then the member is added to members[] (max 50)
- **AC-3:** Given a Cloud Function `manageGroupMember`, when removing a member, then the member is removed and their group data access is revoked
- **AC-4:** Given a Cloud Function `transferGroupAdmin`, when called, then admin role transfers and at least 1 admin remains
- **AC-5:** Given a Cloud Function `deleteGroup`, when called by admin, then group doc and ALL subcollection transactions are deleted (batched at 500)
- **AC-6:** Given the last member (who is admin) leaves, when processed, then the group is automatically deleted

### Architectural
- **AC-ARCH-LOC-1:** Cloud Functions at `functions/src/groups/`
- **AC-ARCH-PATTERN-1:** All write operations via Cloud Functions (not direct Firestore writes)
- **AC-ARCH-PATTERN-2:** Batch deletion chunked at 500 operations
- **AC-ARCH-PATTERN-3:** Error responses: `{ success: false, error: { code, message } }`
- **AC-ARCH-NO-1:** No client-side group writes (all through Cloud Functions)

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Create group | `functions/src/groups/createGroup.ts` | Cloud Function | NEW |
| Manage member | `functions/src/groups/manageGroupMember.ts` | Cloud Function | NEW |
| Transfer admin | `functions/src/groups/transferGroupAdmin.ts` | Cloud Function | NEW |
| Delete group | `functions/src/groups/deleteGroup.ts` | Cloud Function | NEW |
| Group utils | `functions/src/groups/groupUtils.ts` | Utility | NEW |
| Tests | `functions/src/groups/__tests__/` | Jest | NEW |
| Functions index | `functions/src/index.ts` | Barrel | MODIFIED |

## Tasks

### Task 1: Create Group Function (2 subtasks)
- [ ] 1.1: Build `createGroup` -- validate name, set creator as admin[0] and member[0], set createdAt
- [ ] 1.2: Input validation: name maxLength 100, sanitize

### Task 2: Manage Member Function (3 subtasks)
- [ ] 2.1: Build `manageGroupMember` -- add/remove member, enforce 50 member limit
- [ ] 2.2: On remove: verify caller is admin (unless removing self)
- [ ] 2.3: On last-admin-leaving: auto-delete group (call deleteGroup internally)

### Task 3: Transfer Admin and Delete Group (3 subtasks)
- [ ] 3.1: Build `transferGroupAdmin` -- add/remove from admins[], enforce 1-5 admin limit
- [ ] 3.2: Build `deleteGroup` -- delete group doc + batch-delete all subcollection transactions
- [ ] 3.3: **HARDENING:** Batch deletion at 500 ops, with error handling and logging

### Task 4: Tests (3 subtasks)
- [ ] 4.1: Unit tests: createGroup, manageGroupMember (add, remove, limits)
- [ ] 4.2: Unit tests: transferGroupAdmin (min 1 admin, max 5 admins)
- [ ] 4.3: Unit tests: deleteGroup (batch deletion, last member auto-delete)

### Task 5: Build and Deploy (1 subtask)
- [ ] 5.1: `cd functions && npm run build` -- deploy to staging

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 12
- **Files:** ~7

## Dependencies
- **19-1** (data model and security rules)

## Risk Flags
- DATA_PIPELINE (batch deletion)
- INPUT_SANITIZATION (group name, member validation)
- ERROR_RESILIENCE (cascading deletion failure handling)

## Dev Notes
- Architecture decision 2a: Writes through Cloud Functions, reads direct to Firestore
- Batch deletion pattern: iterate subcollection, delete in batches of 500, retry on failure
- Admin transfer: last admin cannot remove themselves without transferring first
- Error codes: GROUP_MEMBER_LIMIT, GROUP_ADMIN_MIN, GROUP_NOT_FOUND, UNAUTHORIZED
