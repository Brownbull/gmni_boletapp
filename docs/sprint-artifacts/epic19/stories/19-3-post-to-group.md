# Story 19-3: Post Transaction to Group (Copy & Bucket)

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "This story builds the shared board by enabling the first pin -- copy a receipt and stick it to the board"

## Story
As a group member, I want to post a transaction to my group as a frozen snapshot, so that the group can see what I spent without accessing my personal data.

## Acceptance Criteria

### Functional
- **AC-1:** Given a Cloud Function `postToGroup`, when called with a personal transaction ID and group ID, then a frozen copy is created in the group's transaction subcollection
- **AC-2:** Given the copy, when created, then it includes: merchant, date, total, items (deep cloned), currency, category, postedBy, postedAt, sourceTransactionId
- **AC-3:** Given the copy, when created, then it does NOT include: alias, imageUrls, thumbnailUrl, periods (personal/computed fields excluded)
- **AC-4:** Given the copy, when created, then items are deep-cloned via structuredClone (not reference copy)
- **AC-5:** Given a non-member calls postToGroup, when executed, then the request is DENIED

### Architectural
- **AC-ARCH-LOC-1:** Cloud Function at `functions/src/groups/postToGroup.ts`
- **AC-ARCH-PATTERN-1:** Copy specific fields, deep clone items -- architecture doc pattern
- **AC-ARCH-PATTERN-2:** Auth check + write in same transaction (TOCTOU prevention)
- **AC-ARCH-NO-1:** No live link between personal and group copy -- changes to personal don't propagate

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Post to group | `functions/src/groups/postToGroup.ts` | Cloud Function | NEW |
| Tests | `functions/src/groups/__tests__/postToGroup.test.ts` | Jest | NEW |

## Tasks

### Task 1: Build Post Function (3 subtasks)
- [ ] 1.1: Read source transaction, validate caller is group member
- [ ] 1.2: Build frozen copy: explicit field list, structuredClone for items
- [ ] 1.3: Write to group transactions subcollection with serverTimestamp for postedAt

### Task 2: Security (2 subtasks)
- [ ] 2.1: **HARDENING (TOCTOU):** Auth check + membership check + write in same transaction
- [ ] 2.2: Validate source transaction belongs to the caller (auth.uid matches transaction owner)

### Task 3: Tests (2 subtasks)
- [ ] 3.1: Unit test: correct fields copied, personal fields excluded, items deep-cloned
- [ ] 3.2: Unit test: non-member rejected, non-owner rejected

### Task 4: Verification (1 subtask)
- [ ] 4.1: `cd functions && npm run build` -- deploy to staging

## Sizing
- **Points:** 3 (MEDIUM)
- **Tasks:** 4
- **Subtasks:** 8
- **Files:** ~2

## Dependencies
- **19-1** (data model), **19-2** (group must exist)

## Risk Flags
- DATA_PIPELINE (data copy correctness)
- INPUT_SANITIZATION (field allowlist)

## Dev Notes
- Architecture doc pattern for copy: explicit field list (merchant, date, total, items, currency, category, postedBy, postedAt, sourceTransactionId). Use allowlist, NOT spread.
- `structuredClone(sourceTxn.items)` for deep copy of items array
- `sourceTransactionId` is informational only -- no live link. Firestore rules block access to the source document from other users.
- The accepted risk: sourceTransactionId exposes personal txn ID to group members. Low severity -- ID alone reveals nothing, Firestore rules block document access.
