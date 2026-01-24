# Story 14c-refactor.4: Clean IndexedDB Cache

Status: done

## Story

As a **developer**,
I want **the sharedGroupCache.ts deleted and legacy IndexedDB data cleared**,
So that **there's no orphaned cache code or stale data cluttering the app**.

## Acceptance Criteria

1. **Given** `src/lib/sharedGroupCache.ts` implements IndexedDB caching for shared group transactions
   **When** this story is completed
   **Then:**
   - `src/lib/sharedGroupCache.ts` is deleted
   - A one-time migration script clears the `boletapp_shared_groups` IndexedDB database on app startup
   - All imports to `sharedGroupCache.ts` are removed
   - No orphaned IndexedDB databases remain on user devices
   - App compiles and runs without errors

2. **Given** users may have cached shared group data in IndexedDB
   **When** the app starts after this update
   **Then:**
   - The `boletapp_shared_groups` database is deleted automatically
   - Users see no errors or degraded experience
   - A console log indicates successful cleanup (dev mode only)

## Tasks / Subtasks

- [x] Task 1: Create migration script to clear IndexedDB (AC: #2)
  - [x] Create `src/migrations/clearSharedGroupCache.ts`
  - [x] Implement `clearLegacySharedGroupCache()` function
  - [x] Add migration version tracking to localStorage
  - [x] Call migration on app startup in `src/main.tsx`

- [x] Task 2: Delete sharedGroupCache.ts (AC: #1)
  - [x] Delete `src/lib/sharedGroupCache.ts`
  - [x] Find all imports and remove them
  - [x] Verify `useSharedGroupTransactions.ts` was already deleted in Story 14c-refactor.3

- [x] Task 3: Update any remaining consumers (AC: #1)
  - [x] Search for `from '../lib/sharedGroupCache'`
  - [x] Search for `from './sharedGroupCache'`
  - [x] Remove or update imports

- [x] Task 4: Verify build and runtime success (AC: #1, #2)
  - [x] Run `npm run build`
  - [x] Run the app locally and check console for migration log
  - [x] Verify no errors in DevTools console

## Dev Notes

### Files to Delete
- `src/lib/sharedGroupCache.ts` (~756 lines) - IndexedDB cache implementation

### Files to Create
- `src/migrations/clearSharedGroupCache.ts` - One-time migration script

### Migration Script Implementation

```typescript
// src/migrations/clearSharedGroupCache.ts

const MIGRATION_KEY = 'boletapp_migrations_v1';
const SHARED_GROUP_CACHE_CLEARED = 'shared_group_cache_cleared';

/**
 * One-time migration to clear legacy shared group cache from IndexedDB.
 * This runs on app startup and only executes once per device.
 *
 * Story 14c-refactor.4: Clean IndexedDB Cache
 */
export async function clearLegacySharedGroupCache(): Promise<void> {
    // Check if migration already ran
    const migrations = JSON.parse(localStorage.getItem(MIGRATION_KEY) || '{}');
    if (migrations[SHARED_GROUP_CACHE_CLEARED]) {
        return; // Already migrated
    }

    try {
        // Check if IndexedDB is available
        if (typeof indexedDB === 'undefined') {
            migrations[SHARED_GROUP_CACHE_CLEARED] = Date.now();
            localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));
            return;
        }

        // Delete the database
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase('boletapp_shared_groups');

            request.onsuccess = () => {
                if (import.meta.env.DEV) {
                    console.log('[migration] Cleared legacy shared group cache');
                }
                resolve();
            };

            request.onerror = () => {
                console.warn('[migration] Failed to clear shared group cache:', request.error);
                // Still mark as migrated to avoid retry loops
                resolve();
            };

            request.onblocked = () => {
                console.warn('[migration] Database deletion blocked - continuing without deletion');
                resolve();
            };
        });

        // Mark migration as complete
        migrations[SHARED_GROUP_CACHE_CLEARED] = Date.now();
        localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));

    } catch (err) {
        console.warn('[migration] Error clearing shared group cache:', err);
        // Mark as migrated to avoid infinite retries
        migrations[SHARED_GROUP_CACHE_CLEARED] = Date.now();
        localStorage.setItem(MIGRATION_KEY, JSON.stringify(migrations));
    }
}
```

### Integration in App Startup

Add to `src/main.tsx` or early in `src/App.tsx`:

```typescript
import { clearLegacySharedGroupCache } from './migrations/clearSharedGroupCache';

// Run migration on app startup (non-blocking)
clearLegacySharedGroupCache().catch(console.error);
```

### IndexedDB Database Details

- Database name: `boletapp_shared_groups`
- Version: 1
- Object stores:
  - `transactions` - Cached shared group transactions
  - `metadata` - Sync timestamps per group

### Architecture Context

From Epic 14c Retrospective:
> The IndexedDB cache was part of the shared group transaction service. Since we're deleting that service, we should also delete the cache and clear any existing data to prevent orphaned storage.

### Testing Standards

- Run `npm run build` to verify compilation
- Manual test: Open DevTools → Application → IndexedDB → verify `boletapp_shared_groups` is deleted
- Console should show migration log in dev mode

### Project Structure Notes

- Lib directory: `src/lib/`
- Migrations directory: `src/migrations/` (may need to create)
- This story depends on hooks being stubbed first (Story 14c-refactor.3)

### Dependencies

- **Depends on:** Story 14c-refactor.3 (Hooks must be stubbed first since they import sharedGroupCache)
- **Blocks:** None (this is a cleanup story)

### References

- [Source: docs/sprint-artifacts/epic-14c-retro-2026-01-20.md] - Retrospective
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.4] - Story definition
- [Source: src/lib/sharedGroupCache.ts] - Current cache implementation

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

- **Household Sharing Flow (#10)**: Cache layer removed, no more offline support for shared groups
- **App Startup Flow**: One-time migration added to clear legacy data

### Downstream Effects to Consider

- Users with cached shared group transactions will lose that data (expected - feature disabled)
- App startup may take slightly longer on first load (migration runs once)
- No impact on personal transaction caching (separate system)

### Important Note

**These effects are intentional.** The IndexedDB cache served the now-disabled shared group feature. Clearing it prevents stale data issues when the feature is re-implemented in Epic 14d.

### Testing Implications

- **Manual verification:** Check IndexedDB in DevTools before/after
- **Migration idempotency:** Run app multiple times, verify migration only runs once

### Workflow Chain Visualization

```
[DELETE: sharedGroupCache.ts] → No more IndexedDB caching
[CREATE: migration script] → Clears legacy data on startup
App Startup → Migration → Mark complete → Continue
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build: TypeScript compilation passed, Vite build successful (8.70s)
- Tests: 4557 tests passed, 33 skipped (npm run test:quick)
- Migration tests: 7/7 passed (tests/unit/migrations/clearSharedGroupCache.test.ts)

### Completion Notes List

1. **Created migration script** (`src/migrations/clearSharedGroupCache.ts`):
   - One-time migration that deletes `boletapp_shared_groups` IndexedDB database
   - Tracks migration state in localStorage under `boletapp_migrations_v1`
   - Handles errors gracefully (blocked, failed, localStorage unavailable)
   - Logs to console in dev mode only

2. **Integrated migration into app startup** (`src/main.tsx`):
   - Fire-and-forget call to `clearLegacySharedGroupCache()`
   - Non-blocking - doesn't delay app load

3. **Deleted sharedGroupCache.ts** (756 lines removed):
   - Deleted `src/lib/sharedGroupCache.ts`
   - Deleted `tests/unit/lib/sharedGroupCache.test.ts`

4. **Updated consumers**:
   - `src/App.tsx`: Removed import and `clearGroupCacheById` usage (line 51, 3880-3886)
   - `src/App.tsx`: Removed dev debug utility `clearAllGroupCaches` (line 275-279)
   - `src/App.tsx`: Changed `updateCachesForGroup` from async to sync function
   - `src/views/DashboardView.tsx`: Removed import and `clearGroupCacheById` usage (line 36, 2074-2097)

5. **Created migration tests** (7 tests):
   - Skip if already migrated
   - Delete database on first run
   - Handle error gracefully
   - Handle blocked gracefully
   - Handle missing IndexedDB
   - Handle localStorage errors
   - Idempotency check

### File List

**Created:**
- `src/migrations/clearSharedGroupCache.ts` (95 lines)
- `src/migrations/index.ts` (7 lines) - Barrel export
- `tests/unit/migrations/clearSharedGroupCache.test.ts` (170 lines)

**Deleted:**
- `src/lib/sharedGroupCache.ts` (756 lines)
- `tests/unit/lib/sharedGroupCache.test.ts` (deleted)

**Modified:**
- `src/main.tsx` - Added migration import and call
- `src/App.tsx` - Removed import, debug utility, and `clearGroupCacheById` usages
- `src/views/DashboardView.tsx` - Removed import and `clearGroupCacheById` usage

### Change Log

| Date | Change |
|------|--------|
| 2026-01-21 | Story 14c-refactor.4: Created migration script, deleted sharedGroupCache.ts, updated consumers |
| 2026-01-21 | Atlas Code Review: Fixed onblocked console message, added barrel export index.ts, updated test assertions |
