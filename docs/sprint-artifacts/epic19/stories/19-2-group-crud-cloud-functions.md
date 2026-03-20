# Story 19-2: Group CRUD Cloud Functions

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "Build the management office — create, join, leave, update, and tear down groups"

## Story
As a user, I want to create groups, manage membership, update group settings, and leave or delete groups, so that my household can start tracking shared expenses.

## Acceptance Criteria

### Functional
- **AC-1:** Given a Cloud Function `createGroup`, when called with name, icon, and color, then a group document is created with creator as first admin and member, with memberProfiles populated from Firebase Auth
- **AC-2:** Given a Cloud Function `createGroup`, when the user already belongs to 5 groups (any role), then the request is DENIED with GROUP_LIMIT_REACHED error
- **AC-3:** Given a Cloud Function `manageGroupMember`, when adding a member, then the member is added to members[] (max 50), memberProfiles is updated, and the new member's total group count is checked (max 5)
- **AC-4:** Given a Cloud Function `manageGroupMember`, when a member leaves (self-removal):
  - (a) If last person in group → group is auto-deleted (with client-side confirmation before calling)
  - (b) If only admin but other members exist → request DENIED with MUST_APPOINT_ADMIN error
  - (c) Otherwise → removed from members[] and memberProfiles
- **AC-5:** Given a Cloud Function `transferGroupAdmin`, when called, then admin role transfers and at least 1 admin remains. Self-demotion allowed if ≥2 admins exist.
- **AC-6:** Given a Cloud Function `deleteGroup`, when called by admin, then group doc and ALL subcollection transactions are deleted (batched at 500)
- **AC-7:** Given a Cloud Function `updateGroup`, when called by admin with new name/icon/color, then the group doc is updated

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
| Update group | `functions/src/groups/updateGroup.ts` | Cloud Function | NEW |
| Group utils | `functions/src/groups/groupUtils.ts` | Utility | NEW |
| Tests | `functions/src/groups/__tests__/` | Jest | NEW |
| Functions index | `functions/src/index.ts` | Barrel | MODIFIED |

## Tasks

### Task 1: Create Group Function (3 subtasks)
- [ ] 1.1: Build `createGroup` — validate name/icon/color, set creator as admin[0] and member[0], populate memberProfiles from Firebase Auth user record, set createdAt
- [ ] 1.2: Input validation: name maxLength 100 via sanitizeInput(). Icon: emoji or predefined set. Color: hex format validation (#RRGGBB).
- [ ] 1.3: **HARDENING:** Check caller's total group count across all groups (max 5 as admin/member combined). Reject with GROUP_LIMIT_REACHED if exceeded.

### Task 2: Manage Member Function (4 subtasks)
- [ ] 2.1: Build `manageGroupMember` — add/remove member, enforce 50 member limit
- [ ] 2.2: On add: populate memberProfiles with displayName/email/photoURL from Firebase Auth, check new member's total group count (max 5), reject with GROUP_LIMIT_REACHED if exceeded
- [ ] 2.3: On self-removal (leave): if last person → auto-delete group. If only admin with other members → DENIED with MUST_APPOINT_ADMIN. Otherwise → remove from members[] and memberProfiles.
- [ ] 2.4: On admin-removal of other member: verify caller is admin. Remove from members[] and memberProfiles. If removed member was also admin, remove from admins[].

### Task 3: Transfer Admin, Update, and Delete Group (4 subtasks)
- [ ] 3.1: Build `transferGroupAdmin` — add/remove from admins[], enforce 1-5 admin limit. Allow self-demotion if ≥2 admins exist.
- [ ] 3.2: Build `deleteGroup` — delete group doc + batch-delete all subcollection transactions
- [ ] 3.3: Build `updateGroup` — admin-only, update name/icon/color with input validation and sanitization
- [ ] 3.4: **HARDENING:** Batch deletion at 500 ops, with error handling and logging

### Task 4: Tests (4 subtasks)
- [ ] 4.1: Unit tests: createGroup (success, group limit reached at 5, input validation)
- [ ] 4.2: Unit tests: manageGroupMember (add with profile, remove, leave as last person, leave as only admin with others, member limit at 50, target member group limit)
- [ ] 4.3: Unit tests: transferGroupAdmin (min 1 admin, max 5 admins, self-demotion with ≥2 admins, self-demotion blocked as sole admin)
- [ ] 4.4: Unit tests: deleteGroup (batch deletion at 500), updateGroup (admin-only, field validation, non-admin rejected)

### Task 5: Build and Deploy (1 subtask)
- [ ] 5.1: `cd functions && npm run build` — deploy to staging

## Sizing
- **Points:** 8 (LARGE)
- **Tasks:** 5
- **Subtasks:** 16
- **Files:** ~8

## Dependencies
- **19-1** (data model and security rules)

## Risk Flags
- DATA_PIPELINE (batch deletion)
- INPUT_SANITIZATION (group name/icon/color, member validation)
- ERROR_RESILIENCE (cascading deletion failure handling)

## Dev Notes
- Architecture decision 2a: Writes through Cloud Functions, reads direct to Firestore
- Batch deletion pattern: iterate subcollection, delete in batches of 500, retry on failure
- Leave-group rules summary: last person → delete group, only admin → must appoint first, otherwise → leave freely
- Error codes: GROUP_MEMBER_LIMIT, GROUP_LIMIT_REACHED, GROUP_ADMIN_MIN, GROUP_NOT_FOUND, UNAUTHORIZED, MUST_APPOINT_ADMIN
- memberProfiles populated from Firebase Auth user record: displayName, email, photoURL. Stale data is acceptable.
- `updateGroup` only allows name, icon, color updates — not admins/members (those go through dedicated functions)
