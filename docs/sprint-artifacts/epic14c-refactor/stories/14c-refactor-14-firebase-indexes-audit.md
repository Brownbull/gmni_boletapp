# Story 14c-refactor.14: Firebase Indexes Audit

Status: ready-for-dev

## Story

As a **developer**,
I want **Firestore composite indexes audited and optimized**,
So that **unused indexes are removed and query performance is optimal**.

## Acceptance Criteria

1. **Given** `firestore.indexes.json` contains composite index definitions
   **When** this story is completed
   **Then** all composite indexes have been reviewed

2. **Given** shared groups feature is disabled (Epic 14c-refactor)
   **When** reviewing indexes
   **Then** remove indexes related to shared groups queries:
   - Any index on `sharedGroupIds` field (3 transaction indexes)
   - Any index on `sharedGroups` collection (1 index)
   - Any index on `pendingInvitations` collection (1 index - **verify hook status first**)

3. **Given** remaining indexes are kept
   **When** documenting
   **Then** each remaining index has a comment explaining its purpose and the query that uses it

4. **Given** updated `firestore.indexes.json`
   **When** deploying indexes
   **Then** `firebase deploy --only firestore:indexes` succeeds without errors

5. **Given** indexes have been removed
   **When** testing personal transaction queries
   **Then** no query performance regressions occur

6. **Given** this story is completed
   **When** documenting
   **Then** `docs/architecture/firestore-indexes.md` is created/updated with:
   - Current index inventory
   - Purpose of each index
   - Associated query locations in codebase
   - Removal history (what was removed and why)

## Tasks / Subtasks

- [ ] Task 1: Analyze current indexes and usage (AC: #1)
  - [ ] 1.1 Read `firestore.indexes.json` and document all indexes
  - [ ] 1.2 Search codebase for queries that require composite indexes
  - [ ] 1.3 Map each index to the query that needs it
  - [ ] 1.4 Identify indexes with NO matching queries (candidates for removal)

- [ ] Task 2: Verify shared group hooks are stubbed (AC: #2)
  - [ ] 2.1 Check `usePendingInvitations.ts` - if stubbed, `pendingInvitations` index can be removed
  - [ ] 2.2 Check if any code queries `sharedGroups` collection - if none, index can be removed
  - [ ] 2.3 Verify no queries use `sharedGroupIds` field in transaction queries

- [ ] Task 3: Update `firestore.indexes.json` (AC: #2, #3)
  - [ ] 3.1 Remove 3 `transactions` indexes using `sharedGroupIds`
  - [ ] 3.2 Remove `sharedGroups` collection index
  - [ ] 3.3 Conditionally remove `pendingInvitations` index (if hook is stubbed)
  - [ ] 3.4 Add comments to remaining indexes documenting their purpose

- [ ] Task 4: Deploy and verify (AC: #4, #5)
  - [ ] 4.1 Run `firebase deploy --only firestore:indexes --project boletapp-staging`
  - [ ] 4.2 Test personal transaction queries work correctly
  - [ ] 4.3 Run existing E2E tests to verify no regressions
  - [ ] 4.4 Deploy to production: `firebase deploy --only firestore:indexes --project boletapp-production`

- [ ] Task 5: Create documentation (AC: #6)
  - [ ] 5.1 Create `docs/architecture/firestore-indexes.md`
  - [ ] 5.2 Document remaining indexes with query locations
  - [ ] 5.3 Document removed indexes with removal reason
  - [ ] 5.4 Include deployment commands and verification steps

## Dev Notes

### Current Index Inventory (Pre-Audit)

From `firestore.indexes.json`:

| # | Collection | Fields | Status | Notes |
|---|------------|--------|--------|-------|
| 1 | `pendingInvitations` | invitedEmail (ASC), status (ASC), createdAt (DESC) | **REVIEW** | Used by `usePendingInvitations.ts` if not stubbed |
| 2 | `sharedGroups` | members (CONTAINS), createdAt (DESC) | **REMOVE** | Shared groups disabled |
| 3 | `transactions` (group) | sharedGroupIds (CONTAINS), updatedAt (DESC) | **REMOVE** | Shared groups disabled |
| 4 | `transactions` (group) | sharedGroupIds (CONTAINS), date (DESC) | **REMOVE** | Shared groups disabled |
| 5 | `transactions` (group) | sharedGroupIds (CONTAINS), date (DESC), __name__ (DESC) | **REMOVE** | Shared groups disabled |

**Field Overrides (KEEP):**
- `fcmTokens.token` - Used by `fcmTokenService.ts` for token lookup
- `pushSubscriptions.endpoint` - Used by push notification system

### Query-to-Index Mapping

| Query Location | Collection | Fields Used | Index Required |
|----------------|------------|-------------|----------------|
| `usePendingInvitations.ts` | pendingInvitations | invitedEmail, status, createdAt | Yes (if not stubbed) |
| `fcmTokenService.ts` | fcmTokens | token | Field override |
| `src/services/firestore.ts` | transactions | userId only | No composite index |

### Index Removal Safety

The following indexes are safe to remove because:

1. **`sharedGroups` index**: No code queries this collection after Epic 14c-refactor stubbing
2. **3x `transactions` indexes with `sharedGroupIds`**:
   - `sharedGroupIds` was used only for cross-user transaction queries
   - All cross-user queries are disabled per Epic 14c-refactor
   - Personal transaction queries use `userId` path, not `sharedGroupIds`

### Verification Steps

1. **Before deployment:**
   - `grep -r "collectionGroup" src/` - Should show no active shared group queries
   - `grep -r "sharedGroupIds" src/services` - Should show only type definitions, not queries

2. **After deployment:**
   - Test transaction list loads correctly
   - Test analytics dashboard works
   - Run E2E smoke tests

### Firestore Index Deployment

```bash
# Staging first
firebase deploy --only firestore:indexes --project boletapp-staging

# Verify in Firebase Console
# Check that unused indexes show "Building" → "Deleting" status

# Production
firebase deploy --only firestore:indexes --project boletapp-production
```

**Note:** Index deletion is asynchronous. Firebase may take several hours to fully delete large indexes.

### Project Structure Notes

- `firestore.indexes.json` is at project root
- Documentation goes in `docs/architecture/`
- This story is Part 3 of Epic 14c-refactor (Firebase & Infrastructure)

### References

- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.14] - AC definitions
- [Source: docs/sprint-artifacts/epic14c-refactor/tech-context-epic14c-refactor.md#Part-3] - Architecture spec
- [Source: firestore.indexes.json] - Current index definitions
- [Source: src/hooks/usePendingInvitations.ts] - Query requiring pendingInvitations index

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

No existing user workflows are affected by this story. The indexes being removed were only used by the reverted Epic 14c shared groups feature.

### Downstream Effects to Consider

- **Index removal is asynchronous**: Firebase may take hours to delete indexes
- **No rollback for indexes**: If an index is needed later (Epic 14d), it must be recreated and will take time to build
- **Field overrides preserved**: `fcmTokens.token` and `pushSubscriptions.endpoint` remain for active features

### Testing Implications

- **Existing tests to verify:** E2E smoke tests for transaction loading, analytics, history view
- **New scenarios to add:** None - this is infrastructure cleanup

### Workflow Chain Visualization

```
[Personal Transactions] → [React Query Cache] → [UI]
(No composite index needed - queries by userId path)

[Push Notifications] → [fcmTokens field override] → [Token Lookup]
(PRESERVED - active feature)
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

_(To be filled during implementation)_

### Completion Notes List

_(To be filled during implementation)_

### File List

_(To be filled during implementation)_
