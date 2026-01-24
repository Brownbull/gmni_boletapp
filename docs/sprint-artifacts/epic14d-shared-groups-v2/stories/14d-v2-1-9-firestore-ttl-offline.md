# Story 14d-v2-1.9: Firestore TTL & Offline Persistence

Status: ready-for-dev

## Story

As a **system**,
I want **automatic changelog pruning and offline persistence enabled**,
so that **storage costs are controlled and the app works offline with cached data**.

## Background

This story implements two foundational infrastructure requirements for Epic 14d-v2:

1. **TTL Policy:** Auto-delete changelog entries after 30 days to control storage costs
2. **Offline Persistence:** Enable Firestore offline caching for improved performance and offline support

These are prerequisites for the changelog-driven sync system (Epic 2 stories).

```
┌─────────────────────────────────────────────────────────────────┐
│  CHANGELOG LIFECYCLE                                            │
│                                                                 │
│  Transaction Change → Changelog Entry Created → TTL: 30 days   │
│                       (with expiresAt field)       ↓           │
│                                              Auto-deleted       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  OFFLINE PERSISTENCE                                            │
│                                                                 │
│  App Open → Serve cached data (< 500ms) → Background sync      │
│                                                                 │
│  If offline > 30 days → Recovery prompt → Full Sync            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Acceptance Criteria

### Firestore TTL Policy

**AC1:** Given the Firestore database is configured, When the TTL policy is set up, Then:
- TTL policy targets `/groups/{groupId}/changelog/{changeId}` collection group
- TTL field: `expiresAt` (Timestamp type)
- Documents auto-delete when `expiresAt` timestamp is reached
- Policy configured via gcloud CLI or Firebase Console

**AC2:** Given a changelog entry is created, When the Cloud Function writes it, Then:
- `expiresAt` field is set to `serverTimestamp() + 30 days`
- Field is of type `Timestamp` (not string or number)

**AC3:** Given a changelog entry has `expiresAt` in the past, When Firestore TTL runs, Then:
- Document is automatically deleted (within 24 hours per Firestore behavior)
- No Cloud Function cleanup required

### Offline Persistence

**AC4:** Given the app initializes, When Firestore is configured, Then:
- Offline persistence is enabled with `persistentLocalCache`
- Multi-tab support enabled with `persistentMultipleTabManager()`
- Cached data served on app open meeting NFR-1 (< 500ms)

**AC5:** Given the browser doesn't support IndexedDB persistence, When Firestore initializes, Then:
- Gracefully fall back to memory-only cache
- Log warning but don't crash the app
- App continues to function (online-only mode)

**AC6:** Given multiple browser tabs are open, When data changes in one tab, Then:
- Changes sync to other tabs via `persistentMultipleTabManager()`
- No "multiple tabs" error occurs

### Offline Recovery Prompt

**AC7:** Given a user's `lastSyncTime` for a group is > 30 days ago, When they open the group view, Then:
- They see a recovery prompt dialog
- Title: "Sync Recovery Needed"
- Message: "You've been offline for a while. Some sync history has expired. Please do a full sync to restore your group data."
- Actions: [Full Sync] [Cancel]

**AC8:** Given the user taps "Full Sync" on the recovery prompt, When the action executes, Then:
- User is navigated to full sync flow (Story 2.6)
- Recovery prompt dismisses

**AC9:** Given the user taps "Cancel" on the recovery prompt, When the action executes, Then:
- Prompt dismisses
- Red dot badge remains on sync button
- User can manually trigger sync later

### Edge Cases

**AC10:** Given `lastSyncTime` is exactly 30 days ago, When recovery check runs, Then:
- Recovery prompt is NOT shown (boundary: >30 days required)

**AC11:** Given `lastSyncTime` is null (new group, never synced), When recovery check runs, Then:
- Recovery prompt is NOT shown
- Treat as fresh group needing initial sync

## Tasks / Subtasks

### Task 1: TTL Policy Configuration (AC: 1)

- [ ] 1.1 Configure TTL policy via gcloud CLI:
  ```bash
  gcloud firestore fields ttls update expiresAt \
    --collection-group=changelog \
    --enable-ttl \
    --project=boletapp-prod
  ```
- [ ] 1.2 Wait for policy activation (10+ minutes even on empty database)
- [ ] 1.3 Verify policy is active: `gcloud firestore fields ttls list`
- [ ] 1.4 Document TTL policy in infrastructure docs

### Task 2: Changelog Entry Type Update (AC: 2)

- [ ] 2.1 Add `expiresAt: Timestamp` to `ChangelogEntry` type in `src/types/sharedGroups.ts`
- [ ] 2.2 Update Cloud Function (Story 1.8) to set `expiresAt = serverTimestamp() + 30 days`
- [ ] 2.3 Write unit test verifying `expiresAt` calculation

### Task 3: Offline Persistence Configuration (AC: 4, 5, 6)

- [ ] 3.1 Update `src/lib/firebase.ts` to use `initializeFirestore` with persistence:
  ```typescript
  initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  })
  ```
- [ ] 3.2 Add error handling for `failed-precondition` (multiple tabs edge case)
- [ ] 3.3 Add error handling for `unimplemented` (unsupported browser)
- [ ] 3.4 Write integration test for offline cache serving

### Task 4: Recovery Prompt Logic (AC: 7, 8, 9, 10, 11)

- [ ] 4.1 Create `useOfflineRecoveryDetection(lastSyncTime: Date | null): { needsRecovery: boolean }` hook
- [ ] 4.2 Implement 30-day threshold check (> 30 days, not >=)
- [ ] 4.3 Handle null `lastSyncTime` case (no recovery needed)
- [ ] 4.4 Write 6+ unit tests for recovery detection logic

### Task 5: Recovery Prompt UI Component (AC: 7, 8, 9)

- [ ] 5.1 Create `RecoverySyncPrompt.tsx` dialog component
- [ ] 5.2 Implement "Full Sync" action (navigate to Story 2.6 flow)
- [ ] 5.3 Implement "Cancel" action (dismiss, keep badge)
- [ ] 5.4 Integrate into group view (show when `needsRecovery` is true)
- [ ] 5.5 Write 4+ component tests

### Task 6: TTL Verification Test (AC: 3)

- [ ] 6.1 Create manual test document with `expiresAt` in the past
- [ ] 6.2 Wait up to 24 hours and verify deletion
- [ ] 6.3 Document TTL behavior in test notes

## Dev Notes

### Architecture Patterns

- **AD-7:** Changelog as subcollection enables collection-group TTL policy
- **AD-9:** 30-day TTL balances sync reliability vs storage costs
- **AD-10:** Full sync recovery handles users offline >30 days
- **AD-11:** Offline persistence provides 30-50% read reduction

### Technical Details: Firestore TTL

From [Firebase documentation](https://firebase.google.com/docs/firestore/ttl):

- Data is typically deleted **within 24 hours** after expiration (not instant)
- TTL deletes count toward document delete costs
- TTL delete triggers Cloud Functions triggers (if any exist)
- Only `Timestamp` type fields work for TTL (not strings/numbers)
- Maximum 500 TTL policies per database

### Technical Details: Offline Persistence

From [Firebase documentation](https://firebase.google.com/docs/firestore/manage-data/enable-offline):

- Supported browsers: Chrome, Safari, Firefox
- Cache isn't automatically cleared between sessions (security consideration)
- Use `persistentMultipleTabManager()` for multi-tab support
- Default cache size threshold triggers periodic cleanup of unused documents

### Source Tree Components

| Component | Path | Change Type |
|-----------|------|-------------|
| Firebase config | `src/lib/firebase.ts` | Modify |
| Changelog type | `src/types/sharedGroups.ts` | Extend |
| Cloud Function | `functions/src/changelog.ts` | Modify (Story 1.8) |
| Recovery hook | `src/hooks/useOfflineRecoveryDetection.ts` | New |
| Recovery prompt | `src/components/SharedGroups/RecoverySyncPrompt.tsx` | New |

### Testing Standards

- Unit tests for `expiresAt` calculation (exact 30 days from now)
- Unit tests for recovery detection (boundary conditions: 29 days, 30 days, 31 days, null)
- Integration test for offline persistence (mock network, verify cache)
- Manual verification for TTL deletion (requires 24-hour wait)

### Constraints from Architecture

- **NFR-1:** App open to cached data < 500ms (enabled by offline persistence)
- **NFR-5:** < 1,000 daily reads per user (offline cache reduces reads)
- **NFR-6:** < $50/month at 1,000 users (TTL controls storage growth)
- **AD-10:** Full sync recovery available for >30 day offline users

### Project Structure Notes

- Firebase initialization in `src/lib/firebase.ts` (existing file)
- Shared group types centralized in `src/types/sharedGroups.ts`
- Hooks follow project convention in `src/hooks/`
- Dialog components follow existing modal patterns

### Dependencies

- **Depends on:** Story 1.3 (Changelog Infrastructure) - collection structure exists
- **Depends on:** Story 1.8 (Cloud Function Changelog Writer) - must set `expiresAt` field
- **Enables:** All Epic 2 stories (Changelog-Driven Sync)

### References

- [Source: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md - Story 1.9]
- [Source: docs/architecture/epic-14d-requirements-and-concerns.md - Section 7.3, AD-9, AD-11]
- [Firebase TTL Documentation](https://firebase.google.com/docs/firestore/ttl)
- [Firebase Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows

**None directly modified.** This story is foundational infrastructure that enables future workflows without impacting existing user flows.

| Workflow | Impact Description |
|----------|-------------------|
| **All Existing Workflows** | Gain offline caching support (improved performance, offline capability) |
| **Changelog-Driven Sync (Epic 2)** | ENABLED by this story - TTL keeps changelog manageable |

### Downstream Effects to Consider

| Story | Effect |
|-------|--------|
| **2.3 (90-Day Changelog Sync)** | Depends on changelog existing with TTL pruning |
| **2.6 (Full 2-Year Recovery Sync)** | Recovery prompt routes users here when offline >30 days |
| **All Group View Stories** | Benefit from offline persistence caching |

### Testing Implications

- **Existing tests to verify:** None affected (infrastructure-only story)
- **New scenarios to add:**
  - TTL deletion (manual 24-hour verification)
  - Offline cache serving (mock network tests)
  - Multi-tab sync (browser integration)
  - Recovery prompt boundary conditions

### Workflow Chain Visualization

```
[Story 1.3: Changelog Infrastructure] → [Story 1.8: Changelog Writer]
                                                    ↓
                                       [THIS STORY: TTL + Offline]
                                                    ↓
                        [Story 2.3-2.6: Changelog-Driven Sync workflows]
                                                    ↓
                        [Story 2.6: Full Recovery Sync] ← Recovery prompt routes here
```

---

## Dev Agent Record

### Agent Model Used

(To be filled during development)

### Debug Log References

(To be filled during development)

### Completion Notes List

(To be filled during development)

### File List

(To be filled during development)
