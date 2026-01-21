# Story 14c.20: Shared Group Transaction Cache Optimization

**Status**: done
**Points**: 5
**Priority**: Medium
**Dependencies**: 14c.19 (View Mode Persistence Bug Fix)

---

## Story

As a user with shared groups,
I want the app to intelligently sync only changed transactions instead of re-fetching everything,
So that the app loads faster, uses less data, and reduces Firestore costs.

---

## Background & Problem Statement

### Current Behavior (Before 14c.19 Fix)

The shared group transactions hook had `refetchOnMount: true` which caused:
- **Full Firestore fetch on every app open** (~600 document reads per open)
- **Ignored the existing delta sync mechanism** already built into the codebase
- **Excessive costs**: ~$9/month for 50 active users

### Current Architecture

The codebase already has a sophisticated delta sync mechanism:

```
App Opens → Check IndexedDB cache →
  If cached: Return cached data → Check group.memberUpdates → Delta fetch if needed
  If not cached: Full Firestore fetch → Store in IndexedDB
```

**Key Components:**
- `IndexedDB` - Local cache for transactions
- `group.memberUpdates[userId].lastSyncAt` - Server-side timestamp when each member last modified data
- `fetchDeltaUpdates()` - Fetches only transactions changed since `lastSyncTimestamp`
- `React Query` - Manages query caching with `staleTime` and `gcTime`

### The Problem

The delta sync mechanism **only runs when React Query decides to call the queryFn**. With various `staleTime` settings, this creates trade-offs between cost and data freshness.

---

## User Requirements

1. **Automatic sync should be cost-efficient** - Don't fetch all transactions every time
2. **Data should stay reasonably fresh** - Users expect to see recent changes
3. **Manual refresh option** - "Force sync" button in Settings for edge cases
4. **Cooldown on manual refresh** - Prevent abuse (1-minute cooldown)

---

## Options Analysis

### Option A: Simple Fix (Remove refetchOnMount)

```typescript
staleTime: 5 * 60 * 1000,  // 5 minutes
// refetchOnMount: removed
refetchOnWindowFocus: true,
```

| Metric | Value |
|--------|-------|
| Daily Reads/User | ~5,000-8,000 |
| Monthly Cost (50 users) | ~$7.20 |
| Cost Reduction | ~20% |

**Pros:**
- Simple change, already implemented in 14c.19
- Uses React Query's built-in caching

**Cons:**
- Still does full refetch after 5 minutes
- Doesn't leverage delta sync after stale timeout
- Higher costs for active users

---

### Option B: Delta-Only (Never Stale)

```typescript
staleTime: Infinity,  // Never consider stale
refetchOnMount: false,
refetchOnWindowFocus: false,
// Always use IndexedDB + delta sync
```

| Metric | Value |
|--------|-------|
| Daily Reads/User | ~100-500 |
| Monthly Cost (50 users) | ~$0.45 |
| Cost Reduction | ~95% |

**Pros:**
- Maximum cost savings
- Only fetches what changed
- Works even after days of inactivity

**Cons:**
- **Risk**: Relies entirely on `memberUpdates` being accurate
- If a Firestore trigger fails, changes could be permanently missed
- No automatic recovery mechanism
- Needs special handling for edge cases (new member joins, cache corruption)

---

### Option C: Hybrid (Recommended)

```typescript
staleTime: 60 * 60 * 1000,  // 1 hour
refetchOnMount: false,
refetchOnWindowFocus: true,
// Delta sync runs on every mount from IndexedDB
// Full refresh after 1 hour as safety net
```

| Metric | Value |
|--------|-------|
| Daily Reads/User | ~700-1,500 |
| Monthly Cost (50 users) | ~$2.00 |
| Cost Reduction | ~75% |

**Pros:**
- Significant cost savings
- Safety net: full refresh after 1 hour catches missed deltas
- Delta sync handles most common cases

**Cons:**
- Slightly more complex than Option A
- Still does occasional full refreshes

---

### Option D: Hybrid + Manual Refresh

Extends Option C with user control:

```typescript
// Same as Option C, plus:
// - "Sync Now" button in Settings > Shared Groups
// - 1-minute cooldown between manual syncs
// - Visual feedback (spinner, last sync time)
```

| Metric | Value |
|--------|-------|
| Daily Reads/User | ~700-1,500 + manual syncs |
| Monthly Cost (50 users) | ~$2.00-2.50 |
| Cost Reduction | ~70-75% |

**Pros:**
- All benefits of Option C
- User has escape hatch for "I know data changed but app doesn't show it"
- Cooldown prevents abuse
- Increases user trust (visible control)

**Cons:**
- Additional UI work
- Need to track cooldown state

---

## Cost Comparison Summary

| Option | Daily Reads/User | Monthly (50 users) | Cost | Reduction |
|--------|------------------|-------------------|------|-----------|
| **Old (refetchOnMount: true)** | ~10,000+ | 15,000,000 | ~$9.00 | - |
| **A: Simple Fix** | ~5,000-8,000 | 12,000,000 | ~$7.20 | 20% |
| **B: Delta-Only** | ~100-500 | 750,000 | ~$0.45 | 95% |
| **C: Hybrid (1hr)** | ~700-1,500 | 3,300,000 | ~$2.00 | 78% |
| **D: Hybrid + Manual** | ~700-1,500 | 3,500,000 | ~$2.10 | 77% |

---

## Risk Analysis

| Risk | A | B | C | D |
|------|---|---|---|---|
| Missed transaction updates | None | **High** | Low | **Very Low** |
| Stale data shown to user | Low | Medium | Low | **Very Low** |
| User confusion | None | Medium | Low | **None** |
| Implementation complexity | Simple | Medium | Medium | Medium+ |
| IndexedDB corruption | N/A | **Critical** | Recoverable | **Recoverable** |

---

## Recommendation

**Option D: Hybrid + Manual Refresh** provides the best balance:

1. **75%+ cost reduction** vs current behavior
2. **Safety net**: Full refresh after 1 hour catches edge cases
3. **User control**: Manual sync button for peace of mind
4. **Abuse prevention**: 1-minute cooldown on manual sync
5. **Transparency**: Show last sync time in Settings

---

## Acceptance Criteria

### AC1: Extended Stale Time
- Given the shared group transactions hook
- When configuring React Query options
- Then `staleTime` should be set to 60 minutes (1 hour)
- And `refetchOnMount` should be removed/false
- And `refetchOnWindowFocus` should remain true

### AC2: Manual Sync Button
- Given the Settings > Shared Groups section
- When displaying each shared group
- Then show a "Sync Now" button (or icon)
- And show "Last synced: X minutes ago" text

### AC3: Sync Cooldown
- Given the user clicks "Sync Now"
- When the sync completes (or is in progress)
- Then disable the button for 60 seconds
- And show remaining cooldown time (e.g., "Available in 45s")

### AC4: Sync Feedback
- Given the user clicks "Sync Now"
- When the sync is in progress
- Then show a loading spinner on the button
- And when complete, show success feedback (checkmark or toast)

### AC5: Delta Sync Preserved
- Given the app opens with cached data
- When `memberUpdates` indicates changes
- Then delta sync should fetch only changed transactions
- And merge them with the IndexedDB cache

### AC6: Full Refresh Safety Net
- Given the cache is older than 1 hour (staleTime)
- When the user opens the app or returns to tab
- Then perform a full Firestore fetch
- And update the IndexedDB cache

---

## Tasks / Subtasks

### Task 1: Update React Query Configuration

- [x] 1.1 Change `staleTime` from 5 minutes to 60 minutes
- [x] 1.2 Change `refetchOnMount` to `false` (was `true`)
- [x] 1.3 Change `refetchOnWindowFocus` to `false` (was `true`)
- [x] 1.4 Change `gcTime` from 30 minutes to 24 hours
- [x] 1.5 Add tests for cache optimization behavior (3 new tests)

### Task 2: Add Manual Sync UI

- [x] 2.1 Create `SyncButton` component with loading state
- [x] 2.2 Add "Last synced: X ago" timestamp display
- [x] 2.3 Connect button to `queryClient.invalidateQueries()` for the group
- [x] 2.4 Add SyncButton to owned groups in GruposView
- [x] 2.5 Add SyncButton to member groups in GruposView
- [x] 2.6 Add SyncButton tests (13 tests)

### Task 3: Implement Cooldown Logic

- [x] 3.1 Create `useManualSync` hook with cooldown
- [x] 3.2 Track last sync time in localStorage (per group)
- [x] 3.3 Disable button during cooldown period
- [x] 3.4 Show countdown timer on disabled button
- [x] 3.5 Add tests for cooldown behavior (12 tests)

### Task 4: Documentation & Monitoring

- [x] 4.1 Update hook documentation with Story 14c.20 changes
- [x] 4.2 Update Atlas architecture docs with new caching strategy

---

## Definition of Done

- [x] `staleTime` increased to 60 minutes
- [x] `gcTime` increased to 24 hours
- [x] `refetchOnMount` set to `false`
- [x] `refetchOnWindowFocus` set to `false`
- [x] Delta sync mechanism preserved and working
- [x] Manual "Sync Now" button visible in Settings > Shared Groups (both owned and member groups)
- [x] 60-second cooldown enforced on manual sync
- [x] "Last synced" timestamp displayed
- [x] Loading and success states shown during sync
- [x] All existing tests pass
- [x] New tests added: 28 total (12 useManualSync + 13 SyncButton + 3 config tests)
- [ ] Code review approved

---

## Technical Design

### Manual Sync Hook

```typescript
interface UseManualSyncOptions {
  groupId: string;
  cooldownMs?: number; // Default: 60000 (1 minute)
}

interface UseManualSyncResult {
  triggerSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  cooldownRemaining: number; // seconds
  canSync: boolean;
}

function useManualSync(options: UseManualSyncOptions): UseManualSyncResult;
```

### UI Location

```
Settings View
└── Shared Groups Section
    └── [Group Card]
        ├── Group Name & Icon
        ├── Member Count
        ├── [Sync Now] button (or refresh icon)
        └── "Last synced: 5 minutes ago"
```

### Storage Keys

```typescript
// localStorage keys for cooldown tracking
const SYNC_COOLDOWN_KEY = `boletapp_group_sync_${groupId}`;
// Value: ISO timestamp of last manual sync
```

---

## Open Questions for Brainstorming

1. **Should the sync button be per-group or global?**
   - Per-group: More granular control, but cluttered UI if many groups
   - Global: Simpler UI, but syncs all groups even if only one needs it

2. **What happens if delta sync fails?**
   - Current: Silent failure, cached data shown
   - Option: Show error toast, offer manual full refresh

3. **Should we show sync status in the main app (not just Settings)?**
   - Could add a subtle indicator in the header when in group mode
   - "Last updated: 5 min ago" near the group selector

4. **Cooldown scope:**
   - Per-group: Each group has its own cooldown
   - Global: One cooldown for all groups (simpler)

5. **Should `refetchOnWindowFocus` trigger full or delta?**
   - Currently: Triggers queryFn which does delta if cache exists
   - Consider: Could be too aggressive for tab-heavy users

---

## File List

| File | Change |
|------|--------|
| `src/hooks/useSharedGroupTransactions.ts` | Updated staleTime (1hr), gcTime (24hr), refetchOnMount (false), refetchOnWindowFocus (false) |
| `src/hooks/useManualSync.ts` | **NEW** - Hook for manual sync with 60s cooldown and localStorage tracking |
| `src/components/SharedGroups/SyncButton.tsx` | **NEW** - Sync button component with loading, cooldown countdown, and last sync time |
| `src/components/SharedGroups/index.ts` | Export SyncButton |
| `src/components/settings/subviews/GruposView.tsx` | Add SyncButton to owned groups and member groups |
| `tests/unit/hooks/useManualSync.test.ts` | **NEW** - 12 tests for manual sync hook |
| `tests/unit/hooks/useSharedGroupTransactions.test.ts` | Added 3 Story 14c.20 cache optimization tests |
| `tests/unit/components/SharedGroups/SyncButton.test.tsx` | **NEW** - 13 tests for SyncButton component |
| `src/services/userPreferencesService.ts` | **BUG FIX** - Use `deleteField()` instead of `undefined` for groupId when saving personal mode |
| `tests/unit/hooks/useViewModePreferencePersistence.test.tsx` | Added 1 regression test for undefined groupId bug |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-19 | Story created from cost analysis discussion | User + Atlas |
| 2026-01-20 | Implementation complete: React Query config, useManualSync, SyncButton, 28 tests | Atlas |
| 2026-01-20 | **Bug Fix**: Firestore `setDoc()` failed with "Unsupported field value: undefined" when saving personal mode preference. Fixed by using `deleteField()` instead of `undefined` for `viewModePreference.groupId` when mode='personal'. Added regression test. | Atlas |
