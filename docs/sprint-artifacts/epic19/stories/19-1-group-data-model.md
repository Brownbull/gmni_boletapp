# Story 19-1: Group Data Model and Firestore Security Rules

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "This story builds the shared board by setting up the board itself -- the data structure and the locks on the door"

## Story
As a developer, I want the group Firestore collection, security rules, and TypeScript types defined, so that all group features have a secure data foundation.

## Acceptance Criteria

### Functional
- **AC-1:** Given the group collection path `/artifacts/{appId}/groups/{groupId}`, when created, then group documents store name, admins[], members[], createdAt, createdBy
- **AC-2:** Given group transaction subcollection, when a document is created, then it stores merchant, date, total, items, currency, category, postedBy, postedAt, sourceTransactionId
- **AC-3:** Given Firestore security rules, when a non-member reads group data, then the read is DENIED
- **AC-4:** Given Firestore security rules, when a member reads group data, then the read is ALLOWED
- **AC-5:** Given Firestore security rules, when a non-admin tries to delete a group transaction, then the delete is DENIED
- **AC-6:** Given Firestore security rules, when an admin deletes a transaction older than 30 days, then the delete is DENIED

### Architectural
- **AC-ARCH-LOC-1:** Group types at `src/entities/transaction/types.ts` (GroupTransaction) and `src/features/groups/types.ts` (Group, GroupMember)
- **AC-ARCH-LOC-2:** Security rules at `firestore.rules`
- **AC-ARCH-PATTERN-1:** Collection naming: lowercase singular (`groups`, not `Groups`)
- **AC-ARCH-PATTERN-2:** Security rules enforce: members read, members create, admins delete (30-day window), no update
- **AC-ARCH-NO-1:** No client-side security checks in this story -- rules only

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Group types | `src/features/groups/types.ts` | FSD types | NEW |
| GroupTransaction type | `src/entities/transaction/types.ts` | Entity types | MODIFIED |
| Firestore rules | `firestore.rules` | Security rules | MODIFIED |
| Firestore rules tests | `tests/rules/groups.test.ts` | Rules test | NEW |
| Collection paths | `src/shared/utils/collectionPaths.ts` | Path builder | MODIFIED |

## Tasks

### Task 1: Define Types (2 subtasks)
- [ ] 1.1: Create `src/features/groups/types.ts` -- Group, GroupMember interfaces
- [ ] 1.2: Add GroupTransaction type to entity types -- frozen snapshot fields

### Task 2: Firestore Security Rules (4 subtasks)
- [ ] 2.1: Add group document rules: read if member, create if authenticated
- [ ] 2.2: Add group transaction rules: read if member, create if member, delete if admin AND postedAt > now - 30 days
- [ ] 2.3: Add update DENY rule for group transactions (frozen copies)
- [ ] 2.4: **HARDENING:** Verify rules don't break existing personal transaction rules

### Task 3: Collection Path Builder (1 subtask)
- [ ] 3.1: Add group paths to `collectionPaths.ts`: `groupDoc(groupId)`, `groupTransactions(groupId)`, `groupTransaction(groupId, txnId)`

### Task 4: Security Rules Tests (3 subtasks)
- [ ] 4.1: Test: member can read group, non-member cannot
- [ ] 4.2: Test: member can create group transaction, non-member cannot
- [ ] 4.3: Test: admin can delete < 30-day transaction, cannot delete >= 30-day transaction, non-admin cannot delete

### Task 5: Verification (1 subtask)
- [ ] 5.1: Run rules tests and `npm run test:quick`

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 11
- **Files:** ~5

## Dependencies
- None (first story in epic)

## Risk Flags
- DATA_PIPELINE (data model foundation)

## Dev Notes
- Architecture decision 1a: Group data model uses subcollection with copy & bucket model
- Architecture decision 2a: Three-layer authorization (Firestore rules primary)
- The 30-day check in rules: `request.time < resource.data.postedAt + duration.value(30, 'd')`
- `admins` and `members` are arrays in the group doc -- security rules check `request.auth.uid in resource.data.members`
- Group transactions are NEVER updated -- security rules explicitly deny update
