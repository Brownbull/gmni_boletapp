# Story 19-4: Group Admin Deletion (30-Day Window)

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "This story builds the shared board by giving the building manager a 30-day window to remove bad pins"

## Story
As a group admin, I want to delete group transactions within 30 days of posting, so that mistakes can be corrected while preserving long-term data integrity.

## Acceptance Criteria

### Functional
- **AC-1:** Given a Cloud Function `deleteGroupTransaction`, when admin deletes a transaction posted < 30 days ago, then it is deleted
- **AC-2:** Given a transaction posted >= 30 days ago, when admin tries to delete, then the request is DENIED with clear error
- **AC-3:** Given a non-admin member, when they try to delete, then the request is DENIED
- **AC-4:** Given associated images exist, when transaction is deleted, then images are also cleaned up

### Architectural
- **AC-ARCH-LOC-1:** Cloud Function at `functions/src/groups/deleteGroupTransaction.ts`
- **AC-ARCH-PATTERN-1:** 30-day check uses `postedAt` Timestamp, NOT `date` string
- **AC-ARCH-PATTERN-2:** TOCTOU: admin check + timestamp check + delete in same transaction

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Delete group txn | `functions/src/groups/deleteGroupTransaction.ts` | Cloud Function | NEW |
| Tests | `functions/src/groups/__tests__/deleteGroupTransaction.test.ts` | Jest | NEW |

## Tasks

### Task 1: Build Deletion Function (3 subtasks)
- [ ] 1.1: Validate caller is admin of the group
- [ ] 1.2: Check postedAt timestamp -- reject if >= 30 days
- [ ] 1.3: Delete transaction document (and associated images if any)

### Task 2: Security (1 subtask)
- [ ] 2.1: **HARDENING (TOCTOU):** Admin check + timestamp check + delete in single transaction

### Task 3: Tests (2 subtasks)
- [ ] 3.1: Unit test: admin deletes < 30-day transaction (success)
- [ ] 3.2: Unit test: admin deletes >= 30-day transaction (denied), non-admin deletes (denied)

### Task 4: Verification (1 subtask)
- [ ] 4.1: Build and deploy to staging

## Sizing
- **Points:** 3 (SMALL-MEDIUM)
- **Tasks:** 4
- **Subtasks:** 7
- **Files:** ~2

## Dependencies
- **19-3** (transactions must exist to delete)

## Risk Flags
- DATA_PIPELINE (deletion + cleanup)

## Dev Notes
- 30-day calculation: `Timestamp.now().seconds - postedAt.seconds > 30 * 24 * 60 * 60`
- Group transactions don't have images in the initial version (no receipt images copied to group). But if this changes, cascade delete must handle it.
- Error code: DELETION_WINDOW_EXPIRED
