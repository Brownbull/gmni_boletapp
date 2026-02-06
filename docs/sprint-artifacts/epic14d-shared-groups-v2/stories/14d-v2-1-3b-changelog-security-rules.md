# Story 14d-v2.1.3b: Changelog Security Rules & TTL

Status: done

> **Split from:** 14d-v2-1-3 (Changelog Infrastructure) - Tasks 2, 5
> **Split reason:** Original story exceeded sizing guidelines (5 tasks, 27 subtasks)

## Story

As a **developer**,
I want **Firestore security rules and TTL configuration for changelog entries**,
So that **only group members can access changelog and entries auto-expire after 30 days**.

## Acceptance Criteria

### Core Requirements (from Original Story AC #2, #6)

1. **Given** changelog security rules are deployed
   **When** a group member attempts to access changelog
   **Then** Firestore security rules allow:
   - Read: group members only
   - Create: group members only
   - Update: forbidden (no one can update)
   - Delete: forbidden (no one can delete)
   - Append-only pattern enforced

2. **Given** Firestore TTL policy requirement (AD-9: 30-day TTL)
   **When** TTL is configured
   **Then** changelog entries with `_ttl` field will be auto-deleted by Firestore
   **And** documentation exists for manual Firebase Console setup

## Tasks / Subtasks

- [x] **Task 1: Update Firestore Security Rules** (AC: #1)
  - [x] 1.1: Add `/sharedGroups/{groupId}/changelog/{changeId}` rules to `firestore.rules`
  - [x] 1.2: Implement `read` rule: `isGroupMemberForSubcollection()`
  - [x] 1.3: Implement `create` rule: `isGroupMemberForSubcollection() && isValidChangelogEntry()`
  - [x] 1.4: Implement `update` rule: `false` (no updates allowed)
  - [x] 1.5: Implement `delete` rule: `false` (no deletes allowed)
  - [x] 1.6: Add helper function `isValidChangelogEntry()` for validation
  - [x] 1.7: Updated emulator test setup with new rules

- [x] **Task 2: Create Firestore TTL Index** (AC: #2)
  - [x] 2.1: Document TTL field (`_ttl`) in `firestore.indexes.json`
  - [x] 2.2: Document TTL policy setup in `docs/architecture/firestore-indexes.md`
  - [x] 2.3: Added comprehensive TTL setup instructions with step-by-step guide

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **AD-7** | Changelog as subcollection | Enables Firestore TTL policy on collection |
| **AD-9** | 30-day TTL on changelog entries | Auto-cleanup, cost control |

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
match /sharedGroups/{groupId}/changelog/{changeId} {
  // Helper: Is user a member of this group?
  function isGroupMemberForSubcollection() {
    return request.auth != null &&
           request.auth.uid in get(/databases/$(database)/documents/sharedGroups/$(groupId)).data.members;
  }

  // Helper: Is the changelog entry valid?
  // Note: Cloud Functions using Admin SDK bypass security rules entirely,
  // so actorId == auth.uid is safe to enforce for client-side writes
  function isValidChangelogEntry() {
    let entry = request.resource.data;
    return entry.type in ['TRANSACTION_ADDED', 'TRANSACTION_MODIFIED', 'TRANSACTION_REMOVED']
        && entry.transactionId is string
        && entry.transactionId.size() > 0
        && entry.actorId == request.auth.uid
        && entry.groupId is string
        && entry.groupId == groupId
        && entry.timestamp is timestamp
        && entry._ttl is timestamp
        && entry.summary is map
        && entry.summary.amount is number
        && entry.summary.currency is string
        && entry.summary.description is string;
  }

  // Read: Members only
  allow read: if isGroupMemberForSubcollection();

  // Create: Members only, with validation
  allow create: if isGroupMemberForSubcollection() && isValidChangelogEntry();

  // Update/Delete: FORBIDDEN (append-only)
  allow update, delete: if false;
}
```

### TTL Configuration Note

Firestore TTL must be enabled manually in Firebase Console:
1. Go to Firebase Console > Firestore Database
2. Navigate to "Time-to-live policies"
3. Add policy: Collection group = `changelog`, Field = `_ttl`
4. This is NOT deployable via `firebase deploy` - manual setup required

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `firestore.rules` | MODIFY | Add changelog security rules |
| `firestore.indexes.json` | MODIFY | Document TTL field (optional) |
| `README.md` or docs | MODIFY | Add TTL setup instructions |

### Project Structure Notes

- Security rules: Single `firestore.rules` file at project root
- Follow existing rule patterns for group membership checks

### Dependencies

- **Blocks:** Story 14d-v2-1-3c (needs rules for testing)
- **Blocked by:** None
- **Parallel with:** Story 14d-v2-1-3a (Types)

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-1.3]
- [Architecture Decisions: AD-7, AD-9 in epics.md]
- [Existing Security Rules: firestore.rules]
- [Original Story: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-3-changelog-infrastructure.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 15 firestore-rules integration tests pass
- 10 new changelog-specific tests added (9 original + 1 actorId impersonation test)

### Completion Notes List

1. **Security Rules Implementation**: Added changelog subcollection rules under `/sharedGroups/{groupId}/changelog/{changeId}` with:
   - `isGroupMemberForSubcollection()` helper for membership validation
   - `isValidChangelogEntry()` helper validating type, transactionId, actorId, groupId, and _ttl fields
   - Append-only pattern: read/create allowed for members, update/delete forbidden

2. **Path Correction**: Used `/sharedGroups/{groupId}` path (matching changelog.ts types) rather than `/groups/{groupId}` mentioned in Dev Notes

3. **Test Coverage**: Added 9 integration tests covering:
   - Group member read access (Test 1)
   - Non-member read denial (Test 2)
   - Valid entry creation (Test 3)
   - Non-member creation denial (Test 4)
   - Invalid type rejection (Test 5)
   - Missing field rejection (Test 6)
   - Update denial (Test 7)
   - Delete denial (Test 8)
   - All valid types acceptance (Test 9)

4. **TTL Documentation**: Comprehensive documentation added to `docs/architecture/firestore-indexes.md`:
   - TTL policy specification (_ttl field, 30-day duration)
   - Manual Firebase Console setup steps
   - Cost benefits explanation

### File List

| File | Action | Lines Changed |
|------|--------|---------------|
| `firestore.rules` | Modified | +50 (security rules with full validation) |
| `tests/setup/firebase-emulator.ts` | Modified | -95/+20 (reads rules from file, no duplication) |
| `tests/integration/firestore-rules.test.ts` | Modified | +200 (10 new changelog tests) |
| `firestore.indexes.json` | Modified | +3 (TTL documentation notes) |
| `docs/architecture/firestore-indexes.md` | Modified | +45 (TTL policies section) |

### Change Log

- 2026-02-01: Story implemented (atlas-dev-story workflow)
- 2026-02-01: Code review fixes applied (atlas-code-review workflow):
  - Fixed actorId impersonation risk: `actorId == request.auth.uid` now enforced
  - Added `timestamp` validation to security rules
  - Added `summary` field validation (amount, currency, description) to security rules
  - Removed security rules duplication: tests now read from `firestore.rules` file
  - Fixed Dev Notes path mismatch: `/groups/` → `/sharedGroups/`
  - Added Test 9: actorId impersonation rejection test
  - Expanded Test 6: now validates missing timestamp and summary fields
