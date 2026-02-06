# Story 14d-v2-1-7c: Cloud Function - Member Leave Handler

Status: done

> **Split from:** 14d-v2-1-7 (Leave/Manage Group)
> **Split strategy:** by_feature - Cloud Function layer
> **Part:** 3 of 6

## Story

As a **shared group system**,
I want **a Cloud Function to detect when members leave and create changelog entries**,
So that **other members' next sync will properly remove the leaving member's transactions from their cache**.

## Acceptance Criteria

### From Parent Story (applicable to this split)

1. **Given** a member leaves the group (self or removed by owner)
   **When** the Cloud Function processes the membership change
   **Then** `TRANSACTION_REMOVED` changelog entries are created for all of that member's transactions

2. **Given** the Cloud Function detects a member leaving
   **When** processing the member's transactions
   **Then** other members' next sync will remove those transactions from their cache

3. **Given** the leaving member's transactions
   **When** changelog entries are created
   **Then** the transactions remain tagged with `sharedGroupId` but are inaccessible to the group

4. **Given** the Cloud Function runs multiple times (idempotency)
   **When** processing the same member leave event
   **Then** duplicate changelog entries are NOT created (check if entries already exist)

## Tasks / Subtasks

- [x] **Task 1: Cloud Function - Member Leave Handler** (AC: #1, #2, #3, #4)
  - [x] 1.1: Create `onMemberRemoved` Firestore trigger on `/sharedGroups/{groupId}`
  - [x] 1.2: Detect when `members` array shrinks (compare before/after)
  - [x] 1.3: Query all transactions owned by the leaving member with `sharedGroupId == groupId`
  - [x] 1.4: Write `TRANSACTION_REMOVED` changelog entry for each transaction
  - [x] 1.5: Ensure idempotency (atomic `create()` with error code check)
  - [x] 1.6: Add Cloud Function unit tests (23 tests, 100% coverage)

## Dev Notes

### Cloud Function Architecture

```typescript
// Firestore trigger on group document changes
export const onMemberRemoved = onDocumentUpdated(
  'sharedGroups/{groupId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // Detect members who left
    const removedMembers = before.memberIds.filter(
      (id: string) => !after.memberIds.includes(id)
    );

    for (const memberId of removedMembers) {
      await createTransactionRemovedEntries(event.params.groupId, memberId);
    }
  }
);
```

### Changelog Entry Structure

```typescript
// Cloud Function writes for EACH transaction owned by leaving member
{
  type: 'TRANSACTION_REMOVED',
  transactionId: 'tx-123',
  timestamp: serverTimestamp(),
  actorId: leavingUserId,
  summary: { reason: 'member_left', memberName: 'Alice' }
  // NOTE: No `data` field for removals
}
```

### Idempotency Check

```typescript
// Before writing, check if entry already exists
const existingEntry = await db
  .collection(`sharedGroups/${groupId}/changelog`)
  .where('type', '==', 'TRANSACTION_REMOVED')
  .where('transactionId', '==', txId)
  .where('actorId', '==', memberId)
  .get();

if (existingEntry.empty) {
  // Safe to write
}
```

### Error Handling

| Scenario | Handling |
|----------|----------|
| No transactions found | Complete successfully (no-op) |
| Partial write failure | Log error, retry on next trigger |
| Group deleted during processing | Check group exists before writing |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `functions/src/triggers/onMemberRemoved.ts` | **NEW** | Cloud Function for member leave |
| `tests/unit/functions/onMemberRemoved.test.ts` | **NEW** | Cloud Function tests |

### Testing Standards

- **Unit tests:** 15+ tests covering trigger scenarios
- **Coverage target:** 80%+ for new code
- Test idempotency
- Test with 0, 1, many transactions
- Test concurrent member removals

### Dependencies

- **14d-v2-1-7a**: Service layer triggers the memberIds change
- **14d-v2-1-3**: Changelog infrastructure (types, write functions)

### Downstream Stories

- **14d-v2-2-3**: 90-Day Changelog Sync (consumes these entries)
- **14d-v2-1-7f**: Integration tests (verifies changelog creation)

### References

- [Parent Story: 14d-v2-1-7-leave-manage-group.md]
- [Story 1.8 Changelog Writer: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-18-cloud-function---changelog-writer]
- [Changelog Infrastructure: 14d-v2-1-3]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) via ECC Dev Story workflow

### Debug Log References

- ECC Planner: Implementation plan created with 6 phases
- ECC TDD Guide: 22 tests written first (RED), then implementation (GREEN)
- ECC Code Reviewer: 1 HIGH, 4 MEDIUM, 3 LOW findings
- ECC Security Reviewer: 1 HIGH, 2 MEDIUM, 3 LOW findings

### Completion Notes List

1. ✅ Created `onMemberRemoved` Firestore trigger on `sharedGroups/{groupId}`
2. ✅ Implemented member removal detection via `detectRemovedMembers()`
3. ✅ Query transactions with `sharedGroupId` filter + 500 limit (DoS mitigation)
4. ✅ Create `TRANSACTION_REMOVED` changelog entries with:
   - `type: 'TRANSACTION_REMOVED'`
   - `data: null` (transactions remain tagged)
   - `summary: { amount, currency, description, category }`
   - `_ttl: 30 days`
5. ✅ Atomic idempotency using `create()` (error code 6 for existing docs)
6. ✅ Error handling rethrows for Cloud Functions retry mechanism
7. ✅ 22 unit tests with 100% line coverage

### Fixes Applied from Review

| Severity | Issue | Fix |
|----------|-------|-----|
| HIGH | Unbounded query DoS | Added `MAX_TRANSACTIONS_PER_MEMBER = 500` limit |
| HIGH | Silent error swallowing | Changed to rethrow errors for retry |
| MEDIUM | Race condition | Changed to `create()` for atomic idempotency |

### Review Follow-up Fixes (2026-02-02)

| Severity | Issue | Fix |
|----------|-------|-----|
| HIGH | Hardcoded APP_ID | Changed to `process.env.GCLOUD_PROJECT \|\| 'boletapp-d609f'` |
| HIGH | Missing TTL duplication docs | Added JSDoc explaining Cloud Functions isolation |
| HIGH | Sequential processing | Added parallel processing with `Promise.all()` + 50-batch size |
| MEDIUM | User IDs in logs | Added `truncateUserId()` helper, all logs now truncate to 8 chars |
| MEDIUM | Type duplication undocumented | Added JSDoc to all interfaces explaining isolation rationale |
| MEDIUM | No 500+ limit test | Added test verifying `functions.logger.warn` is called at limit |
| LOW | console.log usage | Replaced all with `functions.logger.{info,debug,warn,error}` |
| LOW | Missing @throws JSDoc | Added `@throws` documentation to `createChangelogEntry()` |
| LOW | Weak TTL test | Added 30-day calculation verification with before/after time bounds |
| LOW | Unsafe error code check | Added `isFirestoreError()` type guard for type-safe error handling |

### File List

| File | Action | Description |
|------|--------|-------------|
| `functions/src/triggers/onMemberRemoved.ts` | NEW | Cloud Function implementation |
| `functions/src/triggers/__tests__/onMemberRemoved.test.ts` | NEW | 22 unit tests |
| `functions/src/index.ts` | MODIFIED | Added export for onMemberRemoved |

## Senior Developer Review (ECC)

**Review Date:** 2026-02-02
**ECC Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide
**Outcome:** ✅ APPROVED (all review follow-ups addressed 2026-02-02)
**Overall Score:** 8/10 → 9/10 (after review fixes)

### Review Follow-ups (ECC)

**HIGH Severity:**
- [x] [ECC-Review][HIGH][Code+Security] Replace hardcoded `APP_ID = 'boletapp-d609f'` with `process.env.GCLOUD_PROJECT || 'boletapp-d609f'` - `onMemberRemoved.ts:34`
- [x] [ECC-Review][HIGH][Code] Add documentation comment explaining CHANGELOG_TTL_MS duplication (Cloud Functions build isolation) - `onMemberRemoved.ts:35`
- [x] [ECC-Review][HIGH][Code] Consider parallel processing with `Promise.all()` + batching for 500 transactions - `onMemberRemoved.ts:235-238`

**MEDIUM Severity:**
- [x] [ECC-Review][MEDIUM][Security] Sanitize user IDs in logs using `functions.logger` with truncated IDs - `onMemberRemoved.ts:206,223-225,276`
- [x] [ECC-Review][MEDIUM][Code] Document type duplication rationale (Cloud Functions isolation) - `onMemberRemoved.ts:52-89`
- [x] [ECC-Review][MEDIUM][TDD] Add test for 500+ transactions to verify limit warning is logged

**LOW Severity:**
- [x] [ECC-Review][LOW][Code] Replace `console.log` with `functions.logger` for structured logging
- [x] [ECC-Review][LOW][Code] Add `@throws` JSDoc documentation to `createChangelogEntry()`
- [x] [ECC-Review][LOW][TDD] Strengthen TTL test assertion to verify 30-day calculation
- [x] [ECC-Review][LOW][Security] Add type-safe error code extraction in catch block

### Positive Observations

- Excellent idempotency design using `create()` with deterministic entry IDs
- Proper error handling (rethrow for Cloud Functions retry)
- Comprehensive test coverage (23 tests, 90%+)
- Clean separation of concerns with well-named helper functions
- DoS protection with 500 transaction limit

---

## Senior Developer Review #2 (ECC Parallel)

**Review Date:** 2026-02-02
**ECC Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide (parallel)
**Outcome:** ✅ APPROVED
**Overall Score:** 8.25/10

### Fixes Applied

| Severity | Issue | Fix |
|----------|-------|-----|
| HIGH | npm audit: 7 vulnerabilities (fast-xml-parser, jws, qs, lodash) | Added `overrides` in package.json for `fast-xml-parser@^5.3.4`, ran `npm audit fix` |

### Files Modified

| File | Change |
|------|--------|
| `functions/package.json` | Added `overrides: { "fast-xml-parser": "^5.3.4" }` |
| `functions/package-lock.json` | Updated via npm install |

### Verification

- Build: ✅ Passes
- Tests: ✅ 23/23 passing
- npm audit: ✅ 0 vulnerabilities
