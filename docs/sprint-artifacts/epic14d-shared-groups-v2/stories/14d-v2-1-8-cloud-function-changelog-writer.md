# Story 14d-v2.1.8: Cloud Function - Changelog Writer

Status: ready-for-dev

## Story

As a **system**,
I want **changelog entries automatically created when transactions change**,
So that **all group members can sync changes reliably**.

## Acceptance Criteria

### Core Requirements (from Epic)

1. **Given** a transaction is assigned to a group (sharedGroupId set)
   **When** the transaction is saved
   **Then** a `TRANSACTION_ADDED` changelog entry is created containing:
   - Full transaction data (per AD-3)
   - Timestamp
   - Actor ID (user who made the change)
   - TTL field set to `timestamp + 30 days`

2. **Given** a transaction in a group is edited
   **When** the edit is saved
   **Then** a `TRANSACTION_MODIFIED` changelog entry is created with updated data

3. **Given** a transaction's `sharedGroupId` is changed to null or different group
   **When** the change is saved
   **Then** a `TRANSACTION_REMOVED` changelog entry is created in the OLD group
   **And** if new group, a `TRANSACTION_ADDED` entry is created in the NEW group

4. **Given** a transaction in a group is deleted
   **When** the delete is saved (soft delete via `deletedAt`)
   **Then** a `TRANSACTION_REMOVED` changelog entry is created

5. **Given** changelog writes occur
   **When** the Cloud Function executes
   **Then** all changelog writes are batched with any other writes (atomic)
   **And** Cloud Function uses event IDs for idempotency

### Atlas-Suggested Additional Criteria

6. **Given** Firestore triggers can retry on failure
   **When** the function is invoked multiple times for the same event
   **Then** the function uses event IDs to ensure idempotency
   **And** duplicate changelog entries are NOT created
   **And** the event ID is used as the changelog document ID

7. **Given** a transaction is saved with `sharedGroupId`
   **When** the Cloud Function processes the change
   **Then** the changelog write is batched with the analytics queue trigger (if applicable)
   **And** both operations succeed or fail atomically

8. **Given** a user is removed from a group membership
   **When** their transaction is still tagged with that group
   **Then** the Cloud Function validates group membership before writing changelog
   **And** appropriate handling occurs (no entry created, or REMOVED entry for orphaned tx)

9. **Given** a user attempts to manipulate changelog for transactions they don't own
   **When** the Cloud Function processes the change
   **Then** the function validates that `actorId` matches the transaction's `ownerId`
   **And** rejects attempts to create changelog entries for others' transactions

## Tasks / Subtasks

- [ ] **Task 1: Create Cloud Function File** (AC: #1-5)
  - [ ] 1.1: Create `functions/src/changelogWriter.ts` file
  - [ ] 1.2: Export `onTransactionWrite` function using `onDocumentWritten` (2nd gen)
  - [ ] 1.3: Configure trigger path: `artifacts/{appId}/users/{userId}/transactions/{transactionId}`
  - [ ] 1.4: Import `ChangelogEntry` types from shared types or define locally

- [ ] **Task 2: Implement Change Detection Logic** (AC: #1-4)
  - [ ] 2.1: Extract `before` and `after` snapshots from event
  - [ ] 2.2: Detect change type:
    - `!before && after && after.sharedGroupId` → ADDED
    - `before && after && sharedGroupId changed` → REMOVED (old) + ADDED (new)
    - `before && after && sharedGroupId same && data changed` → MODIFIED
    - `before && after && after.deletedAt && before.sharedGroupId` → REMOVED
    - `before && !after && before.sharedGroupId` → REMOVED (hard delete)
  - [ ] 2.3: Handle null → group (ADDED), group → null (REMOVED), group A → group B (REMOVED + ADDED)

- [ ] **Task 3: Implement Idempotency Pattern** (AC: #5, #6)
  - [ ] 3.1: Extract event ID from `event.id` (unique per event)
  - [ ] 3.2: Use event ID as changelog document ID: `{eventId}-{type}`
  - [ ] 3.3: Use `set()` instead of `add()` so retries overwrite same document
  - [ ] 3.4: Add `processedAt` field for debugging duplicate detection

- [ ] **Task 4: Implement Changelog Entry Creation** (AC: #1, #2)
  - [ ] 4.1: Build `ChangelogEntry` object with all required fields
  - [ ] 4.2: Include full transaction data in `data` field (AD-3)
  - [ ] 4.3: Calculate `_ttl` as `timestamp + 30 days` for Firestore TTL
  - [ ] 4.4: Build `summary` object with amount, currency, description, category
  - [ ] 4.5: Set `actorId` from transaction's `ownerId` (not from auth context)

- [ ] **Task 5: Implement Ownership Validation** (AC: #9)
  - [ ] 5.1: Validate that the transaction's `ownerId` matches expected pattern
  - [ ] 5.2: Log warning if transaction appears manipulated (unexpected owner change)
  - [ ] 5.3: For Cloud Functions triggered by Firestore, ownership is implicit (user's own subcollection)

- [ ] **Task 6: Implement Group Membership Validation** (AC: #8)
  - [ ] 6.1: Before writing changelog, verify group still exists
  - [ ] 6.2: If group doesn't exist, skip changelog creation (group deleted)
  - [ ] 6.3: Log warning for orphaned transaction scenarios

- [ ] **Task 7: Implement Batch Writing** (AC: #5, #7)
  - [ ] 7.1: Use Firestore batch/transaction for atomic writes
  - [ ] 7.2: If analytics trigger is needed, enqueue Cloud Task in same batch
  - [ ] 7.3: All writes succeed or fail together

- [ ] **Task 8: Add Logging and Error Handling** (AC: all)
  - [ ] 8.1: Log change detection results with transaction ID and group ID
  - [ ] 8.2: Log successful changelog writes with event ID
  - [ ] 8.3: Handle and log errors without throwing (allow transaction to complete)
  - [ ] 8.4: Use structured logging for Cloud Logging queries

- [ ] **Task 9: Export from Index** (AC: all)
  - [ ] 9.1: Add export to `functions/src/index.ts`
  - [ ] 9.2: Add JSDoc documentation following existing pattern
  - [ ] 9.3: Categorize as CRITICAL (core sync functionality)

- [ ] **Task 10: Add Unit Tests** (AC: all)
  - [ ] 10.1: Create `functions/test/changelogWriter.test.ts`
  - [ ] 10.2: Test ADDED scenario (null → groupId)
  - [ ] 10.3: Test MODIFIED scenario (same group, data changed)
  - [ ] 10.4: Test REMOVED scenario (groupId → null)
  - [ ] 10.5: Test group transfer (group A → group B)
  - [ ] 10.6: Test soft delete (deletedAt set)
  - [ ] 10.7: Test idempotency (same event ID = no duplicate)
  - [ ] 10.8: Test group not found (skip gracefully)

- [ ] **Task 11: Deploy and Verify** (AC: all)
  - [ ] 11.1: Deploy to staging environment
  - [ ] 11.2: Test with Firestore emulator or staging database
  - [ ] 11.3: Verify changelog entries created correctly
  - [ ] 11.4: Verify TTL field is populated correctly
  - [ ] 11.5: Verify idempotency by triggering retry simulation

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **AD-2** | Changelog as PRIMARY sync source | Normal sync reads changelog, not transactions |
| **AD-3** | Full transaction data in changelog | 50% cost reduction - single read per change |
| **AD-7** | Changelog as subcollection | Enables Firestore TTL policy on collection |
| **AD-9** | 30-day TTL on changelog entries | Auto-cleanup, cost control |

### Cloud Function Implementation Pattern

```typescript
// functions/src/changelogWriter.ts
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { Change, DocumentSnapshot } from 'firebase-functions/v2/firestore';

interface ChangelogEntry {
  id: string;
  type: 'TRANSACTION_ADDED' | 'TRANSACTION_MODIFIED' | 'TRANSACTION_REMOVED';
  transactionId: string;
  timestamp: Timestamp;
  actorId: string;
  groupId: string;
  data: Record<string, unknown> | null;
  summary: {
    amount: number;
    currency: string;
    description: string;
    category: string | null;
  };
  _ttl: Timestamp;
  processedAt: Timestamp; // For debugging retries
}

export const onTransactionWrite = onDocumentWritten(
  'artifacts/{appId}/users/{userId}/transactions/{transactionId}',
  async (event) => {
    const { before, after } = event.data as Change<DocumentSnapshot>;
    const eventId = event.id; // Unique event ID for idempotency

    const beforeData = before?.data();
    const afterData = after?.data();

    const beforeGroupId = beforeData?.sharedGroupId || null;
    const afterGroupId = afterData?.sharedGroupId || null;

    // Skip if no group involvement
    if (!beforeGroupId && !afterGroupId) {
      return null;
    }

    const db = getFirestore();
    const batch = db.batch();

    // Detect change type and write changelog entries
    // ... (see implementation details below)

    await batch.commit();
  }
);
```

### Change Detection Matrix

| Before State | After State | Changelog Action |
|--------------|-------------|------------------|
| `null` | `groupA` | ADDED to groupA |
| `groupA` | `null` | REMOVED from groupA |
| `groupA` | `groupA` (data changed) | MODIFIED in groupA |
| `groupA` | `groupB` | REMOVED from groupA, ADDED to groupB |
| `groupA` | `groupA` (deletedAt set) | REMOVED from groupA |
| `groupA` | document deleted | REMOVED from groupA |

### Idempotency Pattern

```typescript
// Use event ID as document ID for idempotent writes
const changelogDocId = `${eventId}-${changeType}`;

// set() instead of add() - retries overwrite same document
const changelogRef = db.collection('groups').doc(groupId)
  .collection('changelog').doc(changelogDocId);

batch.set(changelogRef, changelogEntry);
```

**Why this works:**
- Firestore triggers include unique event ID
- Event ID remains same across retries
- Using event ID as doc ID means set() overwrites on retry
- No duplicate entries created

### TTL Calculation

```typescript
const now = Timestamp.now();
const ttlMs = now.toMillis() + (30 * 24 * 60 * 60 * 1000); // 30 days
const _ttl = Timestamp.fromMillis(ttlMs);
```

### Error Handling Strategy

```typescript
try {
  // Write changelog entries
  await batch.commit();
  console.log(`Changelog written for event ${eventId}`);
} catch (error) {
  // Log but don't throw - transaction already happened
  console.error(`Failed to write changelog for event ${eventId}:`, error);
  // Consider: Dead letter queue for manual recovery
}
```

**Key Decision:** Don't throw errors from the function. The transaction has already been written to Firestore. Throwing would only cause retries which won't help if the issue is permanent (e.g., missing group).

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `functions/src/changelogWriter.ts` | **CREATE** | Cloud Function implementation |
| `functions/src/index.ts` | MODIFY | Add export |
| `functions/test/changelogWriter.test.ts` | **CREATE** | Unit tests |

### Security Considerations

1. **No Authentication Context:** Firestore triggers don't have auth context; ownership is implicit from document path (`users/{userId}/transactions/...`)
2. **Group Existence Check:** Verify group exists before writing to prevent orphaned changelog entries
3. **Data Sanitization:** Sanitize summary fields to prevent XSS in notifications

### Project Structure Notes

- Cloud Functions follow existing pattern in `functions/src/`
- Tests use Firebase emulator for Firestore triggers
- Export follows existing `index.ts` categorization pattern

### Testing Standards

- **Unit tests:** Mock Firestore for function logic
- **Integration tests:** Use Firebase emulator for trigger testing
- **Idempotency tests:** Simulate retry by calling function twice with same event
- **Coverage target:** 80%+ for new code

### Dependencies

| Dependency | Status |
|------------|--------|
| **Blocked by:** Story 1.3 (Changelog Infrastructure) | Provides types and security rules |
| **Blocked by:** Story 1.2 (Transaction Type Migration) | Provides `sharedGroupId` field |
| **Blocks:** Story 2.3 (90-Day Changelog Sync) | Consumes changelog entries |
| **Blocks:** Story 4.1 (Push Notification Infrastructure) | Uses summary field |

### Existing Cloud Functions Reference

Current functions in `functions/src/index.ts`:
- `analyzeReceipt` - HTTPS Callable (receipt OCR)
- `onTransactionDeleted` - Firestore Trigger (cascade delete)
- `cleanupStaleFcmTokens` - Scheduled Function
- `cleanupCrossUserFcmToken` - HTTPS Callable
- Web Push functions (`saveWebPushSubscription`, etc.)

**Pattern to Follow:** `onTransactionDeleted` is the existing Firestore trigger pattern.

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-1.8]
- [Architecture Decisions: AD-2, AD-3, AD-7, AD-9 in epics.md]
- [Firestore Trigger Best Practices: firebase.google.com/docs/functions/firestore-events](https://firebase.google.com/docs/functions/firestore-events)
- [Idempotency Best Practices: cloud.google.com/blog/products/serverless/cloud-functions-pro-tips-building-idempotent-functions](https://cloud.google.com/blog/products/serverless/cloud-functions-pro-tips-building-idempotent-functions)
- [Existing Trigger: functions/src/deleteTransactionImages.ts]
- [Changelog Types: src/types/changelog.ts (from Story 1.3)]

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **Scan Receipt Flow (#1)** | Triggers TRANSACTION_ADDED when saving scanned transaction with sharedGroupId |
| **Learning Flow (#5)** | Triggers TRANSACTION_MODIFIED when user edits category/merchant in shared transaction |
| **Trust Merchant Flow (#8)** | Triggers TRANSACTION_ADDED if trusted merchant auto-saves to group |

### Downstream Effects to Consider

- **Epic 2 (Changelog-Driven Sync):** All sync stories depend on changelog entries this function creates
- **Epic 3 (Server-Side Analytics):** Analytics triggers may be batched with changelog writes
- **Epic 4 (Notifications):** Push notification content uses `summary` field from changelog entries
- **Epic 14c-refactor stub services:** Current shared group services are stubbed; this is NEW implementation

### Testing Implications

- **Existing tests to verify:** `onTransactionDeleted` tests in functions/ for trigger pattern
- **New scenarios to add:**
  - Transaction added with sharedGroupId
  - Transaction modified while in group
  - Transaction removed from group (label change)
  - Transaction deleted while in group (soft delete)
  - Group transfer (A → B)
  - Idempotency (same event, multiple invocations)
  - Group not found (graceful skip)

### Workflow Chain Visualization

```
[User saves transaction with sharedGroupId]
              ↓
    Firestore write triggers function
              ↓
    [THIS FUNCTION: onTransactionWrite]
              ↓
   ┌─────────────────────────────────────┐
   │  Detect change type                  │
   │  Build ChangelogEntry with full data │
   │  Use event ID for idempotency        │
   │  Write to /groups/{id}/changelog/    │
   └─────────────────────────────────────┘
              ↓
   ┌─────────────────────────────────────┐
   │  Downstream consumers:               │
   │  - 90-Day Sync (Story 2.3)           │
   │  - Push Notifications (Story 4.1)    │
   │  - Server-Side Analytics (Epic 3)    │
   └─────────────────────────────────────┘
```

## Dev Agent Record

### Agent Model Used

_To be filled during implementation_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
