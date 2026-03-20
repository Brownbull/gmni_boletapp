# Story 19-3: Post Transaction to Group (Copy & Bucket)

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "Build the pinning mechanism — copy a receipt and stick it to the board, with duplicate protection"

## Story
As a group member, I want Cloud Functions that copy personal transactions to a group as frozen snapshots (single or batch), so that the group can see what I spent without accessing my personal data.

## Acceptance Criteria

### Functional
- **AC-1:** Given a Cloud Function `postToGroup`, when called with a personal transaction ID and group ID, then a frozen copy is created in the group's transaction subcollection
- **AC-2:** Given the copy, when created, then it includes: merchant, date, total, items (deep cloned), currency, category, postedBy, postedByName, postedAt, sourceTransactionId
- **AC-3:** Given the copy, when created, then it does NOT include: alias, imageUrls, thumbnailUrl, periods (personal/computed fields excluded)
- **AC-4:** Given the copy, when created, then items are deep-cloned via structuredClone (not reference copy)
- **AC-5:** Given a non-member calls postToGroup, when executed, then the request is DENIED
- **AC-6:** Given a transaction already posted to the group (matching sourceTransactionId), when postToGroup is called again, then the request is DENIED with DUPLICATE_POST error
- **AC-7:** Given a Cloud Function `batchPostToGroup`, when called with multiple transaction IDs and a group ID, then all valid transactions are copied (skipping duplicates), returning success count and skip count

### Architectural
- **AC-ARCH-LOC-1:** Cloud Functions at `functions/src/groups/postToGroup.ts` and `functions/src/groups/batchPostToGroup.ts`
- **AC-ARCH-PATTERN-1:** Copy specific fields via allowlist, deep clone items — architecture doc pattern
- **AC-ARCH-PATTERN-2:** Auth check + membership check + duplicate check + write in same transaction (TOCTOU prevention)
- **AC-ARCH-NO-1:** No live link between personal and group copy — changes to personal don't propagate

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Post to group | `functions/src/groups/postToGroup.ts` | Cloud Function | NEW |
| Batch post | `functions/src/groups/batchPostToGroup.ts` | Cloud Function | NEW |
| Tests | `functions/src/groups/__tests__/postToGroup.test.ts` | Jest | NEW |

## Tasks

### Task 1: Build Post Function (4 subtasks)
- [ ] 1.1: Read source transaction, validate caller is group member
- [ ] 1.2: Build frozen copy: explicit field allowlist, structuredClone for items, add postedByName from memberProfiles or Firebase Auth
- [ ] 1.3: Write to group transactions subcollection with serverTimestamp for postedAt
- [ ] 1.4: **HARDENING:** Check sourceTransactionId uniqueness in group — query group transactions for matching sourceTransactionId before writing. Reject with DUPLICATE_POST if exists.

### Task 2: Build Batch Post Function (2 subtasks)
- [ ] 2.1: Build `batchPostToGroup` — accept array of transaction IDs + groupId, iterate and call postToGroup logic for each, skip duplicates
- [ ] 2.2: Return result: `{ posted: number, skipped: number, errors: string[] }` — partial success is OK

### Task 3: Security (2 subtasks)
- [ ] 3.1: **HARDENING (TOCTOU):** Auth check + membership check + duplicate check + write in same transaction
- [ ] 3.2: Validate source transaction belongs to the caller (auth.uid matches transaction owner)

### Task 4: Tests (3 subtasks)
- [ ] 4.1: Unit test: correct fields copied, personal fields excluded, items deep-cloned
- [ ] 4.2: Unit test: non-member rejected, non-owner rejected, duplicate rejected with DUPLICATE_POST
- [ ] 4.3: Unit test: batchPostToGroup with mix of valid, duplicate, and invalid transactions — verify partial success reporting

### Task 5: Verification (1 subtask)
- [ ] 5.1: `cd functions && npm run build` — deploy to staging

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 12
- **Files:** ~3

## Dependencies
- **19-1** (data model)
- Development depends on 19-1. Testing requires 19-2 (to create test groups).

## Risk Flags
- DATA_PIPELINE (data copy correctness)
- INPUT_SANITIZATION (field allowlist)

## Dev Notes
- Architecture doc pattern for copy: explicit field list (merchant, date, total, items, currency, category, postedBy, postedByName, postedAt, sourceTransactionId). Use allowlist, NOT spread.
- `structuredClone(sourceTxn.items)` for deep copy of items array
- `sourceTransactionId` is informational only — no live link. Firestore rules block access to the source document from other users.
- The accepted risk: sourceTransactionId exposes personal txn ID to group members. Low severity — ID alone reveals nothing, Firestore rules block document access.
- `batchPostToGroup` is used by: (a) batch selection "Add to Group" action from Home/Transactions screens, (b) potential bulk operations
- `postToGroup` is used by: (a) auto-copy toggle (called on each transaction save — see Story 19-6)
- **Offline note:** Group writes require internet — Cloud Functions are not available offline. Client must check connectivity before calling. Auto-copy silently skips when offline (with toast notification).
