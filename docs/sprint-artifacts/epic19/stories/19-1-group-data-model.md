# Story 19-1: Group Data Model and Firestore Security Rules

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "Build the shared board — the data structure, the locks on the door, and the member roster"

## Story
As a developer, I want the group Firestore collection, security rules, TypeScript types, and indexes defined, so that all group features have a secure data foundation.

## Acceptance Criteria

### Functional
- **AC-1:** Given the group collection path `/artifacts/{appId}/groups/{groupId}`, when created, then group documents store name, icon, color, admins[], members[], memberProfiles, createdAt, createdBy
- **AC-2:** Given group transaction subcollection, when a document is created, then it stores merchant, date, total, items, currency, category, postedBy, postedByName, postedAt, sourceTransactionId
- **AC-3:** Given Firestore security rules, when a non-member reads group data, then the read is DENIED
- **AC-4:** Given Firestore security rules, when a member reads group data, then the read is ALLOWED
- **AC-5:** Given Firestore security rules, when a non-admin tries to delete a group transaction, then the delete is DENIED
- **AC-6:** Given Firestore security rules, when an admin deletes a transaction older than 60 days, then the delete is DENIED
- **AC-7:** Given Firestore security rules, when a member who is the poster (non-admin) tries to delete a group transaction, then the delete is DENIED (only admins can delete)

### Architectural
- **AC-ARCH-LOC-1:** Group types at `src/features/groups/types.ts` (Group, GroupMemberProfile) and `src/entities/transaction/types.ts` (GroupTransaction)
- **AC-ARCH-LOC-2:** Security rules at `firestore.rules`
- **AC-ARCH-LOC-3:** Constants at `src/features/groups/constants.ts`
- **AC-ARCH-PATTERN-1:** Collection naming: lowercase singular (`groups`, not `Groups`)
- **AC-ARCH-PATTERN-2:** Security rules enforce: members read, members create, admins delete (60-day window), no update
- **AC-ARCH-NO-1:** No client-side security checks in this story — rules only

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Group types | `src/features/groups/types.ts` | FSD types | NEW |
| GroupTransaction type | `src/entities/transaction/types.ts` | Entity types | MODIFIED |
| Group constants | `src/features/groups/constants.ts` | Constants | NEW |
| Firestore rules | `firestore.rules` | Security rules | MODIFIED |
| Firestore indexes | `firestore.indexes.json` | Index config | MODIFIED |
| Firestore rules tests | `tests/rules/groups.test.ts` | Rules test | NEW |
| Collection paths | `src/shared/utils/collectionPaths.ts` | Path builder | MODIFIED |

## Tasks

### Task 1: Define Types and Constants (3 subtasks)
- [ ] 1.1: Create `src/features/groups/types.ts` — Group (name, icon, color, admins[], members[], memberProfiles: Record<string, GroupMemberProfile>, createdAt, createdBy), GroupMemberProfile (displayName, email, photoURL)
- [ ] 1.2: Add GroupTransaction type to entity types — frozen snapshot fields (merchant, date, total, items, currency, category, postedBy, postedByName, postedAt, sourceTransactionId)
- [ ] 1.3: Create `src/features/groups/constants.ts` — MAX_GROUPS_PER_USER: 5, MAX_MEMBERS_PER_GROUP: 50, MAX_ADMINS_PER_GROUP: 5, DELETION_WINDOW_DAYS: 60

### Task 2: Firestore Security Rules (4 subtasks)
- [ ] 2.1: Add group document rules: read if member, create if authenticated, update if admin (name/icon/color fields only), delete if admin
- [ ] 2.2: Add group transaction rules: read if member, create if member, delete if admin AND postedAt > now - 60 days, update DENIED
- [ ] 2.3: Add update DENY rule for group transactions (frozen copies — never modified)
- [ ] 2.4: **HARDENING:** Verify rules don't break existing personal transaction rules. Scope: Gastify-only (Gustify decoupled separately).

### Task 3: Collection Path Builder and Indexes (2 subtasks)
- [ ] 3.1: Add group paths to `collectionPaths.ts`: `groupDoc(groupId)`, `groupTransactions(groupId)`, `groupTransaction(groupId, txnId)`
- [ ] 3.2: Add composite indexes to `firestore.indexes.json`: groups where members array-contains + createdAt, group transactions sorted by postedAt desc

### Task 4: Security Rules Tests (4 subtasks)
- [ ] 4.1: Test: member can read group, non-member cannot
- [ ] 4.2: Test: member can create group transaction, non-member cannot
- [ ] 4.3: Test: admin can delete < 60-day transaction, cannot delete >= 60-day transaction, non-admin cannot delete
- [ ] 4.4: Test: poster (non-admin) cannot delete their own group transaction

### Task 5: Verification (1 subtask)
- [ ] 5.1: Run rules tests and `npm run test:quick`

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 14
- **Files:** ~7

## Dependencies
- None (first story in epic)

## Risk Flags
- DATA_PIPELINE (data model foundation)

## Dev Notes
- Architecture decision 1a: Group data model uses subcollection with copy & bucket model
- Architecture decision 2a: Three-layer authorization (Firestore rules primary)
- The 60-day check in rules: `request.time < resource.data.postedAt + duration.value(60, 'd')`
- `admins` and `members` are arrays in the group doc — security rules check `request.auth.uid in resource.data.members`
- Group transactions are NEVER updated — security rules explicitly deny update
- Only admins can delete group transactions — not even the poster. This prevents members from retracting shared data.
- `memberProfiles` is a denormalized map of `{ userId: { displayName, email, photoURL } }` — updated on join/leave. Stale data is acceptable (display-only, rarely changes).
- Group doc also stores `icon` (emoji or predefined string) and `color` (hex string) for UI theming (nav bar, group switcher)
