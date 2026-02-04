# Story 14d-v2.1.8a: Cloud Function - Changelog Writer Foundation

Status: done

> **Split from:** 14d-v2-1-8 (11 tasks, 45 subtasks exceeded sizing limits)
> **Split strategy:** by_phase (foundation → validation → polish → testing)
> **Related stories:** 14d-v2-1-8b, 14d-v2-1-8c, 14d-v2-1-8d

## Story

As a **system**,
I want **the core changelog writer Cloud Function created with change detection and entry creation logic**,
So that **transaction changes can be detected and changelog entries generated**.

## Acceptance Criteria

### From Original Story

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

5. **Given** Firestore triggers can retry on failure
   **When** the function is invoked multiple times for the same event
   **Then** the function uses event IDs to ensure idempotency
   **And** duplicate changelog entries are NOT created

## Tasks / Subtasks

- [x] **Task 1: Create Cloud Function File** (AC: #1-5)
  - [x] 1.1: Create `functions/src/changelogWriter.ts` file
  - [x] 1.2: Export `onTransactionWrite` function using `onDocumentWritten` (2nd gen)
  - [x] 1.3: Configure trigger path: `artifacts/{appId}/users/{userId}/transactions/{transactionId}`
  - [x] 1.4: Import `ChangelogEntry` types from shared types or define locally

- [x] **Task 2: Implement Change Detection Logic** (AC: #1-4)
  - [x] 2.1: Extract `before` and `after` snapshots from event
  - [x] 2.2: Detect change type:
    - `!before && after && after.sharedGroupId` → ADDED
    - `before && after && sharedGroupId changed` → REMOVED (old) + ADDED (new)
    - `before && after && sharedGroupId same && data changed` → MODIFIED
    - `before && after && after.deletedAt && before.sharedGroupId` → REMOVED
    - `before && !after && before.sharedGroupId` → REMOVED (hard delete)
  - [x] 2.3: Handle null → group (ADDED), group → null (REMOVED), group A → group B (REMOVED + ADDED)

- [x] **Task 3: Implement Idempotency Pattern** (AC: #5)
  - [x] 3.1: Extract event ID from `event.id` (unique per event)
  - [x] 3.2: Use event ID as changelog document ID: `{eventId}-{type}`
  - [x] 3.3: Use `set()` instead of `add()` so retries overwrite same document
  - [x] 3.4: Add `processedAt` field for debugging duplicate detection

- [x] **Task 4: Implement Changelog Entry Creation** (AC: #1, #2)
  - [x] 4.1: Build `ChangelogEntry` object with all required fields
  - [x] 4.2: Include full transaction data in `data` field (AD-3)
  - [x] 4.3: Calculate `_ttl` as `timestamp + 30 days` for Firestore TTL
  - [x] 4.4: Build `summary` object with amount, currency, description, category
  - [x] 4.5: Set `actorId` from transaction's `ownerId` (not from auth context)

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
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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
  processedAt: Timestamp;
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

    // Change detection and entry creation logic here
    // (Validation layer added in story 14d-v2-1-8b)
    // (Batch writing added in story 14d-v2-1-8b)
    // (Logging added in story 14d-v2-1-8c)
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

### TTL Calculation

```typescript
const now = Timestamp.now();
const ttlMs = now.toMillis() + (30 * 24 * 60 * 60 * 1000); // 30 days
const _ttl = Timestamp.fromMillis(ttlMs);
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `functions/src/changelogWriter.ts` | **CREATE** | Core function (this story) |

### Dependencies

| Dependency | Status |
|------------|--------|
| **Blocked by:** Story 1.3 (Changelog Infrastructure) | Provides types and security rules |
| **Blocked by:** Story 1.2 (Transaction Type Migration) | Provides `sharedGroupId` field |
| **Blocks:** Story 14d-v2-1-8b (Validation Layer) | Adds validation to this function |

### Existing Cloud Functions Reference

Current Firestore trigger pattern: `onTransactionDeleted` in `functions/src/`

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-1.8]
- [Architecture Decisions: AD-2, AD-3, AD-7, AD-9 in epics.md]
- [Firestore Trigger Best Practices](https://firebase.google.com/docs/functions/firestore-events)
- [Idempotency Best Practices](https://cloud.google.com/blog/products/serverless/cloud-functions-pro-tips-building-idempotent-functions)

## Tech Debt Stories Created

> From ECC Code Review (2026-02-03)

| TD Story | Description | Priority |
|----------|-------------|----------|
| [TD-14d-9](./TD-14d-9-type-sync-validation.md) | Cloud Function type synchronization validation | LOW |
| [TD-14d-10](./TD-14d-10-changelog-data-sanitization.md) | Evaluate changelog data sanitization policy | MEDIUM |
| [TD-14d-11](./TD-14d-11-toctou-membership-validation.md) | Atomic membership validation with Firestore transactions | LOW |
| [TD-14d-12](./TD-14d-12-error-extraction-pattern.md) | Standardize error extraction pattern across Cloud Functions | LOW |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) via ECC Dev Story workflow

### Debug Log References

- ECC Planner: Agent ID a105a0f
- ECC TDD Guide: Agent ID a4c52b5
- ECC Code Reviewer: Agent ID a988caf
- ECC Security Reviewer: Agent ID ab3458c

### Completion Notes List

1. **Implementation complete**: Core Cloud Function `onTransactionWrite` with 2nd gen trigger
2. **TDD approach**: 26 initial tests written before implementation, 5 security tests added after review
3. **Test coverage**: 98%+ statement/branch/line/function coverage
4. **Security fixes applied**:
   - Added group membership validation (prevents unauthorized changelog writes)
   - Added groupId format validation (prevents path traversal)
   - Added try/catch error handling (matches onMemberRemoved.ts pattern)
   - Added defensive validation for transaction.total
5. **Performance improvement**: Parallelized group change writes with `Promise.all()`
6. **Code Review findings**: 2 HIGH, 4 MEDIUM, 4 LOW (all HIGH fixed)
7. **Security Review findings**: 1 HIGH, 2 MEDIUM, 2 LOW (HIGH fixed)
8. **Build verified**: TypeScript compiles without errors
9. **First 2nd gen Cloud Function** in the codebase - established pattern for future functions

### File List

| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `functions/src/changelogWriter.ts` | CREATE | 438 | Core Cloud Function with 2nd gen trigger |
| `functions/src/__tests__/changelogWriter.test.ts` | CREATE | 859 | 31 unit tests (26 original + 5 security) |
| `functions/src/index.ts` | MODIFY | +16 | Added export for onTransactionWrite |
| `functions/src/triggers/__tests__/onMemberRemoved.test.ts` | MODIFY | -12 | Removed unused mock function (build fix) |

## Senior Developer Review (ECC)

**Review Date:** 2026-02-03
**Review Type:** ECC Parallel Code Review (4 agents)

**ECC Agents Used:**
- Code Reviewer (everything-claude-code:code-reviewer)
- Security Reviewer (everything-claude-code:security-reviewer)
- Architect (everything-claude-code:architect)
- TDD Guide (everything-claude-code:tdd-guide)

**Overall Score:** 8.3/10

| Category | Status | Score |
|----------|--------|-------|
| Code Quality | PASS | 8/10 |
| Security | PASS | 8/10 |
| Architecture | PASS | 9/10 |
| Testing | PASS | 8/10 |

**Outcome:** APPROVED

**Findings Summary:**
- 0 CRITICAL, 0 HIGH, 5 MEDIUM, 8 LOW severity issues
- All ACs verified: AC#1-5 implemented correctly
- First 2nd gen Cloud Function - establishes pattern
- 31 tests with TDD compliance
- 4 tech debt stories created for deferred items

**Action Items:** None blocking - all items deferred to TD stories
