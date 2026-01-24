# Story 14d.1.1: Legacy Shared Groups Cleanup

Status: ready-for-dev

## Story

As a **developer**,
I want **all Epic 14c shared group code removed from the codebase**,
So that **we have a clean foundation to build the new architecture without conflicts**.

## Acceptance Criteria

1. **Given** the codebase contains Epic 14c shared group code
   **When** this story is completed
   **Then** the following are removed:
   - All files in `src/hooks/` related to shared group transactions (useSharedGroupTransactions, useSharedGroupTransactionsV2)
   - `src/services/sharedGroupTransactionService.ts`
   - `src/lib/sharedGroupCache.ts` (IndexedDB layer)
   - All shared group Cloud Functions (`memberUpdates`, `sharedGroupNotifications`, `getSharedGroupTransactions`)
   - `sharedGroupIds` array field handling in transaction service
   - `removedFromGroupIds` field handling
   - View mode state handling related to shared groups in `App.tsx`
   - All related tests for removed components

2. **Given** components are removed
   **When** the app compiles and runs
   **Then** existing personal transaction functionality is unaffected

3. **Given** UI components in `src/components/SharedGroups/`
   **When** evaluating what to keep
   **Then** PRESERVE UI shells that can be reused in Epic 14d:
   - `ViewModeSwitcher.tsx` - will be adapted for new architecture
   - `JoinGroupDialog.tsx` - join flow UI
   - `TransactionGroupSelector.tsx` - group picker
   - `ProfileIndicator.tsx` - ownership indicators
   - `SyncButton.tsx` - manual sync UI
   - Delete components that depend on removed services/hooks

4. **Given** Firestore data exists
   **When** cleanup is complete
   **Then** run cleanup script to clear legacy data (from 14c-refactor-6):
   - Delete `sharedGroups` collection data
   - Delete `pendingInvitations` collection data
   - Clear `sharedGroupIds` arrays on transactions

## Tasks / Subtasks

- [ ] Task 1: Remove shared group transaction hooks (AC: #1)
  - [ ] Delete `src/hooks/useSharedGroupTransactions.ts` if it exists
  - [ ] Delete `src/hooks/useSharedGroupTransactionsV2.ts` if it exists
  - [ ] Verify no imports remain in codebase

- [ ] Task 2: Remove shared group transaction service (AC: #1)
  - [ ] Delete `src/services/sharedGroupTransactionService.ts`
  - [ ] Remove any imports/usages from other files

- [ ] Task 3: Remove IndexedDB cache layer (AC: #1)
  - [ ] Delete `src/lib/sharedGroupCache.ts` if it exists
  - [ ] Remove IndexedDB initialization code from App.tsx if present

- [ ] Task 4: Undeploy and remove Cloud Functions (AC: #1)
  - [ ] List deployed functions: `firebase functions:list`
  - [ ] Undeploy shared group functions: `firebase functions:delete memberUpdates getSharedGroupTransactions sendSharedGroupNotification --force`
  - [ ] Remove function code from `functions/src/`
  - [ ] Update `functions/src/index.ts` to remove exports

- [ ] Task 5: Clean transaction type fields (AC: #1)
  - [ ] Remove `sharedGroupIds?: string[]` from Transaction type
  - [ ] Remove `removedFromGroupIds` handling from firestore.ts
  - [ ] Keep `deletedAt` (will be used in Epic 14d with new semantics)
  - [ ] Keep `_ownerId` (client-side field, useful for Epic 14d)

- [ ] Task 6: Clean App.tsx shared group state (AC: #1)
  - [ ] Remove view mode state that switches between Personal/Group views
  - [ ] Remove memberUpdates detection useEffect
  - [ ] Remove shared group transaction caching state
  - [ ] Preserve ScanContext and batch processing state (from Epic 14d-scan-refactor)

- [ ] Task 7: Remove related tests (AC: #1)
  - [ ] Delete tests for removed hooks
  - [ ] Delete tests for removed services
  - [ ] Keep tests for preserved UI components

- [ ] Task 8: Verify app compiles and personal transactions work (AC: #2)
  - [ ] Run `npm run build` - should succeed
  - [ ] Run smoke test checklist for personal transactions
  - [ ] Verify scan flow works
  - [ ] Verify transaction CRUD works
  - [ ] Verify analytics work

- [ ] Task 9: Evaluate and clean UI components (AC: #3)
  - [ ] Review each component in `src/components/SharedGroups/`
  - [ ] Mark components for KEEP vs DELETE
  - [ ] Delete components that import removed services/hooks
  - [ ] Stub out preserved components if needed (disable functionality)

- [ ] Task 10: Run Firestore cleanup (AC: #4)
  - [ ] Execute cleanup script from 14c-refactor-6
  - [ ] Verify collections are cleared

## Dev Notes

### Critical Context: Epic 14c Failure Analysis

Epic 14c failed due to three root causes:
1. **Delta sync cannot detect deletions** - `array-contains` query misses removed items
2. **State staleness after first operation** - `prevMemberUpdatesRef` didn't update correctly
3. **Cost explosion from full refetch fallback** - `refetchOnMount: true` caused read spike

The cleanup must ensure ALL of this problematic code is removed to enable a clean rebuild.

### Epic 14d Architecture Changes (Key Differences)

| Epic 14c | Epic 14d |
|----------|----------|
| `sharedGroupIds: string[]` | `sharedGroupId: string \| null` (single group) |
| `array-contains` queries | Simple `WHERE sharedGroupId ==` queries |
| IndexedDB + React Query + Firestore | React Query only (with Firestore offline persistence) |
| `memberUpdates` listener for sync | Changelog subcollection for explicit change events |
| Real-time listeners | Poll on app open, manual sync buttons |

### Files to DELETE (Confirmed Exists)

**Hooks:**
- None found with pattern `useSharedGroupTransactions*.ts` - likely already removed in 14c-refactor

**Services:**
- `src/services/sharedGroupTransactionService.ts` - CONFIRMED EXISTS
- `src/services/sharedGroupService.ts` - CONFIRMED EXISTS (may contain useful CRUD - review)

**Types:**
- `src/types/sharedGroup.ts` - CONFIRMED EXISTS (review for reuse potential)

**Lib:**
- `src/lib/sharedGroupErrors.ts` - CONFIRMED EXISTS (review for reuse)

**Tests:**
- `tests/unit/lib/sharedGroupErrors.test.ts` - CONFIRMED EXISTS
- `tests/unit/hooks/useSharedGroups.test.ts` - CONFIRMED EXISTS
- `tests/unit/components/SharedGroups/*.test.tsx` - CONFIRMED EXISTS

### Files to PRESERVE

**UI Components (30 files in src/components/SharedGroups/):**
These UI components represent significant development effort and can be adapted for Epic 14d:
- `ViewModeSwitcher.tsx` - Core group/personal toggle UI
- `JoinGroupDialog.tsx` - Group invitation flow
- `TransactionGroupSelector.tsx` - Group picker dropdown
- `ProfileIndicator.tsx` - Shows transaction owner
- `SyncButton.tsx` - Manual sync trigger
- `SharedGroupSkeleton.tsx` - Loading states
- `SharedGroupEmptyState.tsx` - Empty state UI
- `GroupMembersManager.tsx` - Member management
- `PendingInvitationsSection.tsx` - Invitation display
- And more...

**Decision:** Keep all UI components, stub out their service dependencies. Epic 14d stories will rewire them to new architecture.

### Transaction Type Changes

Current Transaction type has:
```typescript
sharedGroupIds?: string[];        // DELETE - Epic 14c pattern (array)
deletedAt?: any;                  // KEEP - Useful for Epic 14d soft delete
_ownerId?: string;                // KEEP - Client-side ownership tracking
```

Epic 14d will add:
```typescript
sharedGroupId: string | null;     // Single group (not array)
updatedAt: Timestamp;             // Update on EVERY change
version: number;                  // Optimistic concurrency
periods: { ... };                 // Pre-computed period fields
```

### Cloud Functions Status

Based on recent commits (14c-refactor), shared group Cloud Functions may already be stubbed/removed. Verify before deletion:
- `getSharedGroupTransactions` - Cross-user transaction query
- `memberUpdates` - Real-time sync signaling
- `sendSharedGroupNotification` - Push notification trigger

### Project Structure Notes

- **Source root:** `src/`
- **Components:** `src/components/SharedGroups/` (30 files)
- **Services:** `src/services/`
- **Hooks:** `src/hooks/`
- **Types:** `src/types/`
- **Tests:** `tests/unit/`
- **Cloud Functions:** `functions/src/`

### Testing Requirements

After cleanup:
1. Build should succeed: `npm run build`
2. Unit tests should pass (minus deleted tests): `npm test`
3. E2E smoke test for personal transactions
4. No console errors about missing shared group code

### References

- [Epic 14c Retrospective](docs/sprint-artifacts/epic-14c-retro-2026-01-20.md) - Failure analysis
- [Epic 14d Requirements](docs/architecture/epic-14d-requirements-and-concerns.md) - New architecture
- [Epic 14d Epics](docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md) - Story breakdown
- [14c-refactor Completion](docs/sprint-artifacts/epic14c-refactor/) - Prior cleanup work

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

