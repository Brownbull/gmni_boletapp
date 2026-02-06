# Story 14d-v2.1.3c: Changelog Service & Tests

Status: done

> **Split from:** 14d-v2-1-3 (Changelog Infrastructure) - Tasks 3, 4
> **Split reason:** Original story exceeded sizing guidelines (5 tasks, 27 subtasks)

## Story

As a **developer**,
I want **a service function to query changelog entries and comprehensive tests**,
So that **sync operations can retrieve changes since a given timestamp with confidence**.

## Acceptance Criteria

### Core Requirements (from Original Story AC #4)

1. **Given** a developer needs to query changelog
   **When** this story is completed
   **Then** a service function exists to query changelog by timestamp:
   - `getChangelogSince(groupId: string, sinceTimestamp: Timestamp, limit?: number)`
   - Returns entries ordered by timestamp ascending
   - Supports pagination via limit parameter

2. **Given** the service function is implemented
   **When** tests are executed
   **Then** unit tests cover:
   - Normal query with results
   - Empty results (no changes since timestamp)
   - Max limit enforcement (safety cap)
   - Invalid groupId handling
   - Access denied scenarios

3. **Given** security rules are deployed (from 14d-v2-1-3b)
   **When** security rules tests are executed
   **Then** append-only behavior is verified:
   - Members can create entries
   - No one can update entries
   - No one can delete entries

## Tasks / Subtasks

- [x] **Task 1: Create Changelog Service Function** (AC: #1)
  - [x] 1.1: Create `src/services/changelogService.ts` file
  - [x] 1.2: Implement `getChangelogSince(groupId, sinceTimestamp, limit?)` function
  - [x] 1.3: Query: `changelog WHERE timestamp > sinceTimestamp ORDER BY timestamp ASC LIMIT limit`
  - [x] 1.4: Default limit to 1000 entries (safety limit)
  - [x] 1.5: Return typed `ChangelogEntry[]` array
  - [x] 1.6: Add error handling for missing group or access denied

- [x] **Task 2: Add Unit Tests** (AC: #2, #3)
  - [x] 2.1: Create `tests/unit/types/changelog.test.ts` - type validation tests (already exists from 1-3a: 25 tests)
  - [x] 2.2: Create `tests/unit/services/changelogService.test.ts` - service tests (29 tests)
  - [x] 2.3: Test `getChangelogSince` with mock Firestore
  - [x] 2.4: Test edge cases: empty results, max limit, invalid groupId
  - [x] 2.5: Add security rules tests for append-only behavior (already exists from 1-3b: 10 tests)

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **AD-2** | Changelog as PRIMARY sync source | Normal sync reads changelog, not transactions |

### Service Function Pattern

```typescript
// src/services/changelogService.ts
import {
  collection, query, where, orderBy, limit, getDocs, Firestore, Timestamp
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

  const changelogRef = collection(db, 'sharedGroups', groupId, 'changelog');
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
| `src/services/changelogService.ts` | **CREATE** | Query service function |
| `tests/unit/services/changelogService.test.ts` | **CREATE** | Service tests |

### Testing Standards

- **Unit tests:** Mock Firestore for service tests
- **Type tests:** Verify type narrowing and validation
- **Security rules tests:** Use Firebase emulator for rule testing
- **Coverage target:** 80%+ for new code

### Project Structure Notes

- Services follow existing pattern: `src/services/{feature}Service.ts`
- Tests mirror source: `tests/unit/{path}/{file}.test.ts`

### Dependencies

- **Blocks:** Story 1.8 (Cloud Function - Changelog Writer)
- **Blocked by:**
  - Story 14d-v2-1-3a (needs types)
  - Story 14d-v2-1-3b (needs security rules for rule tests)
- **Parallel with:** None (final story in split)

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-1.3]
- [Architecture Decisions: AD-2 in epics.md]
- [Original Story: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-3-changelog-infrastructure.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 29 changelog service tests pass
- All 6298 quick tests pass (255 test files)
- Security rules tests (10 tests) from story 1-3b verify append-only behavior

### Completion Notes List

1. **Task 1 Complete:** Created `src/services/changelogService.ts` with `getChangelogSince()` function
   - Queries `sharedGroups/{groupId}/changelog` collection
   - Filters by `timestamp > sinceTimestamp`, orders ascending
   - Default limit 1000, max limit 10000 (safety caps)
   - Returns typed `ChangelogEntry[]` array
   - Error handling: INVALID_GROUP_ID, ACCESS_DENIED, QUERY_FAILED codes

2. **Task 2 Complete:** Unit tests created and existing tests verified
   - Type tests (25 tests) already exist from story 1-3a
   - Service tests (29 tests) created in `changelogService.test.ts`
   - Security rules tests (10 tests) already exist from story 1-3b
   - Tests cover: normal query, empty results, max limit, invalid groupId, access denied

3. **Atlas Pattern Compliance:**
   - Service pattern follows `src/services/{feature}Service.ts` convention
   - Test pattern follows `tests/unit/{path}/{file}.test.ts` convention
   - Firestore query uses same patterns as existing services

### File List

| File | Action | Lines |
|------|--------|-------|
| `src/services/changelogService.ts` | **CREATE** | 155 |
| `tests/unit/services/changelogService.test.ts` | **CREATE** | 497 |

**Pre-existing from dependencies:**
- `src/types/changelog.ts` (from 1-3a)
- `tests/unit/types/changelog.test.ts` (from 1-3a)
- `firestore.rules` changelog section (from 1-3b)
- `tests/integration/firestore-rules.test.ts` changelog tests (from 1-3b)
