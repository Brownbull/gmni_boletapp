# Story 14d-v2.1.3: Changelog Infrastructure

Status: ready-for-dev

## Story

As a **developer**,
I want **a changelog subcollection structure for each group**,
So that **transaction changes can be explicitly tracked for reliable sync**.

## Acceptance Criteria

### Core Requirements (from Epic)

1. **Given** a shared group exists
   **When** this story is completed
   **Then** the following Firestore structure is defined:
   - Path: `/groups/{groupId}/changelog/{changeId}`
   - Document schema: `{ type, transactionId, timestamp, actorId, data, summary }`
   - Types: `TRANSACTION_ADDED`, `TRANSACTION_MODIFIED`, `TRANSACTION_REMOVED`

2. **Given** changelog security rules are deployed
   **When** a group member attempts to access changelog
   **Then** Firestore security rules allow:
   - Read: group members only
   - Create: group members only
   - Update: forbidden (no one can update)
   - Delete: forbidden (no one can delete)
   - Append-only pattern enforced

3. **Given** TypeScript is used in the codebase
   **When** this story is completed
   **Then** TypeScript types are defined for:
   - `ChangelogEntry` interface (full document structure)
   - `ChangelogEntryType` enum/union type
   - `ChangelogSummary` interface
   - Export from appropriate type file

4. **Given** a developer needs to query changelog
   **When** this story is completed
   **Then** a service function exists to query changelog by timestamp:
   - `getChangelogSince(groupId: string, sinceTimestamp: Timestamp, limit?: number)`
   - Returns entries ordered by timestamp ascending
   - Supports pagination via limit parameter

### Atlas-Suggested Additional Criteria

5. **Given** the changelog entry structure (AD-3: Full transaction data embedded)
   **When** a changelog entry is created
   **Then** the `data` field contains the FULL transaction object
   **And** this enables single-read sync (no additional query for transaction details)

6. **Given** Firestore TTL policy requirement (AD-9: 30-day TTL)
   **When** a changelog entry is created
   **Then** it includes a `ttl` field set to `timestamp + 30 days`
   **And** this field is named `_ttl` to follow Firestore TTL naming convention

7. **Given** the changelog types are imported in other files
   **When** the types are defined
   **Then** they are exported from `src/types/index.ts` barrel file
   **And** JSDoc comments document the purpose of each field

8. **Given** a changelog entry is created without a transaction (edge case)
   **When** validation occurs
   **Then** the `transactionId` and `actorId` fields are required (non-nullable)
   **And** the `data` field can be `null` ONLY for `TRANSACTION_REMOVED` type

## Tasks / Subtasks

- [ ] **Task 1: Define TypeScript Types** (AC: #3, #5, #6, #7, #8)
  - [ ] 1.1: Create `src/types/changelog.ts` file
  - [ ] 1.2: Define `ChangelogEntryType` union type: `'TRANSACTION_ADDED' | 'TRANSACTION_MODIFIED' | 'TRANSACTION_REMOVED'`
  - [ ] 1.3: Define `ChangelogSummary` interface with `amount`, `description`, `category` summary fields
  - [ ] 1.4: Define `ChangelogEntry` interface with all fields:
    - `id: string` (document ID)
    - `type: ChangelogEntryType`
    - `transactionId: string` (required)
    - `timestamp: Timestamp`
    - `actorId: string` (required - user who made the change)
    - `data: Transaction | null` (full transaction, null only for REMOVED)
    - `summary: ChangelogSummary` (for notifications)
    - `_ttl: Timestamp` (Firestore TTL field - 30 days after timestamp)
    - `groupId: string` (denormalized for queries)
  - [ ] 1.5: Add comprehensive JSDoc comments for each field
  - [ ] 1.6: Export types from `src/types/index.ts`

- [ ] **Task 2: Update Firestore Security Rules** (AC: #2)
  - [ ] 2.1: Add `/groups/{groupId}/changelog/{changeId}` rules to `firestore.rules`
  - [ ] 2.2: Implement `read` rule: `isGroupMember(groupId)`
  - [ ] 2.3: Implement `create` rule: `isGroupMember(groupId) && isValidChangelogEntry()`
  - [ ] 2.4: Implement `update` rule: `false` (no updates allowed)
  - [ ] 2.5: Implement `delete` rule: `false` (no deletes allowed)
  - [ ] 2.6: Add helper function `isValidChangelogEntry()` for validation
  - [ ] 2.7: Deploy rules to staging for testing

- [ ] **Task 3: Create Changelog Service Function** (AC: #4)
  - [ ] 3.1: Create `src/services/changelogService.ts` file
  - [ ] 3.2: Implement `getChangelogSince(groupId, sinceTimestamp, limit?)` function
  - [ ] 3.3: Query: `changelog WHERE timestamp > sinceTimestamp ORDER BY timestamp ASC LIMIT limit`
  - [ ] 3.4: Default limit to 1000 entries (safety limit)
  - [ ] 3.5: Return typed `ChangelogEntry[]` array
  - [ ] 3.6: Add error handling for missing group or access denied

- [ ] **Task 4: Add Unit Tests** (AC: all)
  - [ ] 4.1: Create `tests/unit/types/changelog.test.ts` - type validation tests
  - [ ] 4.2: Create `tests/unit/services/changelogService.test.ts` - service tests
  - [ ] 4.3: Test `getChangelogSince` with mock Firestore
  - [ ] 4.4: Test edge cases: empty results, max limit, invalid groupId
  - [ ] 4.5: Add security rules tests for append-only behavior

- [ ] **Task 5: Create Firestore TTL Index** (AC: #6)
  - [ ] 5.1: Document TTL field (`_ttl`) in `firestore.indexes.json`
  - [ ] 5.2: Verify TTL policy can be enabled in Firebase Console
  - [ ] 5.3: Add README note about enabling TTL in Firebase Console

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **AD-2** | Changelog as PRIMARY sync source | Normal sync reads changelog, not transactions |
| **AD-3** | Full transaction data in changelog | 50% cost reduction - single read per change |
| **AD-7** | Changelog as subcollection | Enables Firestore TTL policy on collection |
| **AD-9** | 30-day TTL on changelog entries | Auto-cleanup, cost control |

### Changelog Entry Schema

```typescript
export type ChangelogEntryType =
  | 'TRANSACTION_ADDED'
  | 'TRANSACTION_MODIFIED'
  | 'TRANSACTION_REMOVED';

export interface ChangelogSummary {
  /** Transaction amount for notification display */
  amount: number;
  /** Currency code (CLP, USD, etc.) */
  currency: string;
  /** Short description for notification */
  description: string;
  /** Store category for context */
  category: string | null;
}

export interface ChangelogEntry {
  /** Firestore document ID */
  id: string;
  /** Type of change */
  type: ChangelogEntryType;
  /** ID of affected transaction */
  transactionId: string;
  /** When the change occurred */
  timestamp: Timestamp;
  /** User ID who made the change */
  actorId: string;
  /** Group ID (denormalized) */
  groupId: string;
  /** Full transaction data (null only for REMOVED) */
  data: Transaction | null;
  /** Summary for notifications */
  summary: ChangelogSummary;
  /** TTL field for Firestore auto-delete (timestamp + 30 days) */
  _ttl: Timestamp;
}
```

### Firestore Path Structure

```
/groups/{groupId}/
  ├── ...group document fields...
  └── changelog/
      ├── {changeId1}  → ChangelogEntry (TRANSACTION_ADDED)
      ├── {changeId2}  → ChangelogEntry (TRANSACTION_MODIFIED)
      └── {changeId3}  → ChangelogEntry (TRANSACTION_REMOVED)
```

### Security Rules Pattern

```javascript
// firestore.rules
match /groups/{groupId}/changelog/{changeId} {
  // Helper: Is user a member of this group?
  function isGroupMember() {
    return request.auth != null &&
           request.auth.uid in get(/databases/$(database)/documents/groups/$(groupId)).data.members;
  }

  // Helper: Is the changelog entry valid?
  function isValidChangelogEntry() {
    let entry = request.resource.data;
    return entry.type in ['TRANSACTION_ADDED', 'TRANSACTION_MODIFIED', 'TRANSACTION_REMOVED']
        && entry.transactionId is string
        && entry.actorId == request.auth.uid
        && entry.timestamp == request.time
        && entry._ttl is timestamp;
  }

  // Read: Members only
  allow read: if isGroupMember();

  // Create: Members only, with validation
  allow create: if isGroupMember() && isValidChangelogEntry();

  // Update/Delete: FORBIDDEN (append-only)
  allow update, delete: if false;
}
```

### Service Function Pattern

```typescript
// src/services/changelogService.ts
import {
  collection, query, where, orderBy, limit, getDocs, Timestamp
} from 'firebase/firestore';
import { ChangelogEntry } from '@/types/changelog';

const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 10000;

export async function getChangelogSince(
  db: Firestore,
  groupId: string,
  sinceTimestamp: Timestamp,
  limitCount: number = DEFAULT_LIMIT
): Promise<ChangelogEntry[]> {
  const safeLimit = Math.min(limitCount, MAX_LIMIT);

  const changelogRef = collection(db, 'groups', groupId, 'changelog');
  const q = query(
    changelogRef,
    where('timestamp', '>', sinceTimestamp),
    orderBy('timestamp', 'asc'),
    limit(safeLimit)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ChangelogEntry));
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/changelog.ts` | **CREATE** | TypeScript type definitions |
| `src/types/index.ts` | MODIFY | Add changelog exports |
| `src/services/changelogService.ts` | **CREATE** | Query service function |
| `firestore.rules` | MODIFY | Add changelog security rules |
| `tests/unit/types/changelog.test.ts` | **CREATE** | Type tests |
| `tests/unit/services/changelogService.test.ts` | **CREATE** | Service tests |

### TTL Configuration Note

Firestore TTL must be enabled manually in Firebase Console:
1. Go to Firebase Console > Firestore Database
2. Navigate to "Time-to-live policies"
3. Add policy: Collection = `groups/{groupId}/changelog`, Field = `_ttl`
4. This is NOT deployable via `firebase deploy` - manual setup required

### Project Structure Notes

- Types follow existing pattern: `src/types/{feature}.ts`
- Services follow existing pattern: `src/services/{feature}Service.ts`
- Tests mirror source: `tests/unit/{path}/{file}.test.ts`
- Security rules: Single `firestore.rules` file at project root

### Testing Standards

- **Unit tests:** Mock Firestore for service tests
- **Type tests:** Verify type narrowing and validation
- **Security rules tests:** Use Firebase emulator for rule testing
- **Coverage target:** 80%+ for new code

### Dependencies

- **Blocks:** Story 1.8 (Cloud Function - Changelog Writer)
- **Blocked by:** None (foundation story)
- **Parallel with:** Story 1.2 (Transaction Type Migration) can be done in parallel

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-1.3]
- [Architecture Decisions: AD-2, AD-3, AD-7, AD-9 in epics.md]
- [Existing Security Rules: firestore.rules]
- [Type Patterns: src/types/transaction.ts]

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **None (Foundation Story)** | Creates NEW infrastructure consumed by future stories |

This is a **foundation infrastructure story** that does not modify existing workflows. Instead, it creates the data structures and services that will be consumed by:

- Story 1.8: Cloud Function - Changelog Writer (uses types, writes entries)
- Stories 2.1-2.10: All sync stories (read changelog via service)
- Story 4.1: Push notifications (use summary field)

### Downstream Effects to Consider

- Changelog types will be imported by Cloud Functions code
- Service function will be used by sync hooks
- Security rules must be deployed before Cloud Functions
- TTL policy requires manual Firebase Console setup

### Testing Implications

- **Existing tests to verify:** None (new infrastructure)
- **New scenarios to add:**
  - Type validation tests
  - Service query tests with mock Firestore
  - Security rules tests with emulator (append-only enforcement)

### Workflow Chain Visualization

```
[Legacy Cleanup] → [Transaction Type] → [THIS STORY] → [Create Group]
                                             ↓
                                   [Changelog Writer CF]
                                             ↓
                              [90-Day Sync] [Full Sync] [Badge]
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