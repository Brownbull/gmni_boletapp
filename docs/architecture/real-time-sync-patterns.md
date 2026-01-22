# Real-Time Sync Patterns for Multi-User Applications

> ⚠️ **HISTORICAL DOCUMENT (Epic 14c-refactor: 2026-01-22)**
>
> This document captures patterns discovered during **Epic 14c (Shared Groups)** which was subsequently **reverted**.
> The implementation described here **never shipped to production**.
> See [epic-14c-retro-2026-01-20.md](../sprint-artifacts/epic-14c-retro-2026-01-20.md) for the full failure analysis.
>
> **Historical Value:** The patterns and bugs documented here are valuable lessons for:
> - Signal-based cache invalidation pattern
> - The four critical bugs in multi-layer caching
> - Testing checklist for real-time sync
>
> **Key Lesson:** Multi-layer caching (React Query + IndexedDB + Firestore) adds complexity without proportional benefit. Epic 14c-refactor simplified to React Query only.

> **Original Context:** This document captures patterns and bug fixes learned while implementing shared group transaction sync in a React + Firebase + React Query application.
>
> **Originally Applicable to:** Any app with real-time sync between users using:
> - React Query (TanStack Query)
> - IndexedDB caching (REMOVED in Epic 14c-refactor)
> - Firestore (or similar) real-time listeners
> - Multi-user data sharing

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [The Four Critical Bugs](#the-four-critical-bugs)
3. [Correct Implementation Pattern](#correct-implementation-pattern)
4. [Code Examples](#code-examples)
5. [Testing Checklist](#testing-checklist)
6. [Quick Reference](#quick-reference)

---

## Architecture Overview

### The Problem

When implementing real-time sync between users with caching optimization, you need to balance:
- **Performance**: Don't refetch on every component mount
- **Freshness**: Other users' changes must appear quickly
- **Cost**: Minimize database reads (especially with Firestore)

### The Solution: Signal-Based Cache Invalidation

```
User A modifies data
       │
       ├── 1. Save data to database
       └── 2. Update "signal timestamp" in shared document
                         │
                         ▼
User B has listener on shared document
       │
       ├── 3. Listener detects signal timestamp changed
       ├── 4. Clear local cache (IndexedDB)
       ├── 5. Reset React Query cache
       └── 6. Invalidate + refetch fresh data
                         │
                         ▼
User B sees User A's changes (2-5 seconds total)
```

### Key Components

| Component | Purpose |
|-----------|---------|
| Signal Document | Lightweight doc with timestamps indicating who has changes |
| Real-time Listener | `onSnapshot` on signal document |
| Cache Layer | IndexedDB for persistence, React Query for in-memory |
| Delta Sync | Fetch only changed records since last sync |
| Manual Sync | Fallback button for users to force refresh |

---

## The Four Critical Bugs

### Bug 1: Race Condition - Cache Clear vs Query Refetch

**Symptom:** First sync works, subsequent syncs show stale data.

**Root Cause:** IndexedDB clear is async but not awaited.

```typescript
// ❌ BUG: Race condition
clearIndexedDBCache(groupId).catch(...);  // Fire-and-forget
queryClient.invalidateQueries({ queryKey });  // Triggers refetch IMMEDIATELY
// queryFn reads stale IndexedDB data before clear completes!

// ✅ FIX: Await cache clear before invalidating
await clearIndexedDBCache(groupId);
queryClient.invalidateQueries({ queryKey });
```

**Why it happens:** `invalidateQueries` triggers `queryFn` synchronously. If `queryFn` reads from IndexedDB, and the clear hasn't completed, you get stale data.

---

### Bug 2: Inactive Query Not Refetching

**Symptom:** User switches views, comes back, sees stale data.

**Root Cause:** `invalidateQueries` only refetches ACTIVE queries by default.

```typescript
// ❌ BUG: Only active (currently rendered) queries refetch
queryClient.invalidateQueries({ queryKey: ['data', id] });
// If component is unmounted (user on different page), no refetch happens
// When component mounts again with refetchOnMount: false, stale data is used

// ✅ FIX: Use refetchType: 'all'
queryClient.invalidateQueries({
    queryKey: ['data', id],
    refetchType: 'all'  // Force refetch ALL matching queries, not just active
});
```

**From React Query docs:**
> "An invalidation doesn't always equate to a refetch. Invalidation merely refetches all **active** Queries that it matches."

---

### Bug 3: Delta Sync Can't Detect Removals

**Symptom:** Added items sync fine, but removed items persist in other users' views.

**Root Cause:** Delta sync query filters by `array-contains groupId`. When item is removed from group, it no longer matches the query.

```typescript
// Delta sync query
query(
    collection('transactions'),
    where('sharedGroupIds', 'array-contains', groupId),  // ← The problem
    where('updatedAt', '>', lastSyncTimestamp)
);

// When transaction.sharedGroupIds changes from ['groupA'] to []
// The transaction no longer matches the query!
// Delta sync returns empty → cache still has stale transaction
```

**Solution:** On cache invalidation, use `resetQueries` to clear React Query's in-memory cache, forcing a full fresh fetch:

```typescript
// ✅ FIX: Reset + Invalidate
await queryClient.resetQueries({ queryKey: ['data', id] });  // Clear in-memory
queryClient.invalidateQueries({
    queryKey: ['data', id],
    refetchType: 'all'
});
// Now queryFn will do a FULL fetch, not delta, because cache is empty
```

---

### Bug 4: Signal Write Failure (Silent)

**Symptom:** Sometimes changes don't sync at all between users.

**Root Cause:** Signal timestamp update is fire-and-forget and can fail silently.

```typescript
// ❌ BUG: Fire-and-forget
await saveTransaction(data);
updateSignalTimestamp(groupId).catch(console.warn);  // If fails, no sync signal
// Other users never know about the change

// ✅ FIX: Retry logic
const MAX_RETRIES = 2;
const attemptUpdate = async (attempt: number): Promise<boolean> => {
    try {
        await batch.commit();
        return true;
    } catch (error) {
        return false;
    }
};

let success = await attemptUpdate(0);
if (!success) {
    for (let retry = 1; retry <= MAX_RETRIES; retry++) {
        await delay(500 * retry);  // Exponential backoff
        success = await attemptUpdate(retry);
        if (success) break;
    }
}
```

---

## Correct Implementation Pattern

### 1. Signal Document Structure

```typescript
// Firestore document: sharedGroups/{groupId}
{
    id: 'group-123',
    name: 'Family',
    members: ['userA', 'userB'],
    memberUpdates: {
        userA: { lastSyncAt: Timestamp },  // ← Updated when userA modifies data
        userB: { lastSyncAt: Timestamp }
    }
}
```

### 2. Write Path (User A saves data)

```typescript
async function saveTransaction(transaction) {
    // 1. Save the actual data
    await firestore.doc(`users/${userId}/transactions/${txId}`).set(transaction);

    // 2. Update signal timestamp (with retry)
    await updateSignalWithRetry(db, userId, transaction.sharedGroupIds);
}

async function updateSignalWithRetry(db, userId, groupIds) {
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const batch = writeBatch(db);
            const now = serverTimestamp();

            for (const groupId of groupIds) {
                batch.update(doc(db, 'sharedGroups', groupId), {
                    [`memberUpdates.${userId}.lastSyncAt`]: now
                });
            }

            await batch.commit();
            return;  // Success
        } catch (error) {
            if (attempt === MAX_RETRIES) {
                console.error('Signal update failed after retries');
            }
            await delay(500 * (attempt + 1));
        }
    }
}
```

### 3. Read Path (User B detects changes)

```typescript
// In App.tsx or similar root component
const prevTimestampsRef = useRef(new Map());

useEffect(() => {
    // Compare current memberUpdates to previous
    const result = detectChanges(sharedGroups, prevTimestampsRef.current, userId);

    if (result.shouldInvalidate) {
        // Process each changed group
        result.groupsWithChanges.forEach(async (groupId) => {
            // 1. Clear IndexedDB FIRST (await!)
            await clearIndexedDBCache(groupId);

            // 2. Reset React Query in-memory cache
            await queryClient.resetQueries({
                queryKey: ['sharedGroupTransactions', groupId]
            });

            // 3. Invalidate with refetchType: 'all'
            queryClient.invalidateQueries({
                queryKey: ['sharedGroupTransactions', groupId],
                refetchType: 'all'
            });
        });
    }

    // Update ref for next comparison
    prevTimestampsRef.current = result.updatedMap;
}, [sharedGroups]);
```

### 4. React Query Configuration

```typescript
useQuery({
    queryKey: ['sharedGroupTransactions', groupId],
    queryFn: fetchTransactions,

    // Cache optimization
    staleTime: 60 * 60 * 1000,      // 1 hour
    gcTime: 24 * 60 * 60 * 1000,    // 24 hours
    refetchOnMount: false,           // Critical for optimization
    refetchOnWindowFocus: false,
});
```

---

## Code Examples

### Complete Cache Invalidation Handler

```typescript
async function handleMemberUpdatesChange(
    groupsWithChanges: string[],
    queryClient: QueryClient
) {
    await Promise.all(
        groupsWithChanges.map(async (groupId) => {
            console.log(`[Sync] Invalidating cache for group ${groupId}`);

            // Step 1: Clear persistent cache (IndexedDB)
            try {
                await clearIndexedDBCache(groupId);
                console.log(`[Sync] IndexedDB cleared for ${groupId}`);
            } catch (err) {
                console.warn(`[Sync] IndexedDB clear failed:`, err);
            }

            // Step 2: Reset React Query in-memory cache
            await queryClient.resetQueries({
                queryKey: ['sharedGroupTransactions', groupId]
            });
            console.log(`[Sync] React Query reset for ${groupId}`);

            // Step 3: Force refetch (even inactive queries)
            queryClient.invalidateQueries({
                queryKey: ['sharedGroupTransactions', groupId],
                refetchType: 'all'
            });
            console.log(`[Sync] Invalidation triggered for ${groupId}`);
        })
    );
}
```

### Change Detection Utility

```typescript
interface DetectionResult {
    shouldInvalidate: boolean;
    groupsWithChanges: string[];
    updatedMap: Map<string, Record<string, number>>;
}

function detectMemberUpdates(
    groups: SharedGroup[],
    previousMap: Map<string, Record<string, number>>,
    currentUserId: string
): DetectionResult {
    const groupsWithChanges: string[] = [];
    const updatedMap = new Map<string, Record<string, number>>();

    for (const group of groups) {
        const current = group.memberUpdates || {};
        const previous = previousMap.get(group.id) || {};

        // Check each member EXCEPT self
        for (const [memberId, updates] of Object.entries(current)) {
            if (memberId === currentUserId) continue;

            const currentTs = updates.lastSyncAt?.seconds || 0;
            const previousTs = previous[memberId] || 0;

            if (currentTs > previousTs) {
                groupsWithChanges.push(group.id);
                break;
            }
        }

        // Store current timestamps for next comparison
        const timestamps: Record<string, number> = {};
        for (const [memberId, updates] of Object.entries(current)) {
            timestamps[memberId] = updates.lastSyncAt?.seconds || 0;
        }
        updatedMap.set(group.id, timestamps);
    }

    return {
        shouldInvalidate: groupsWithChanges.length > 0,
        groupsWithChanges,
        updatedMap
    };
}
```

---

## Testing Checklist

### Manual Testing Scenarios

- [ ] **Add Test:** User A adds item → User B sees it within 5 seconds
- [ ] **Remove Test:** User A removes item from group → User B stops seeing it within 5 seconds
- [ ] **Rapid Updates:** User A makes 5 changes in 30 seconds → User B sees all eventually
- [ ] **View Switch:** User B switches to personal mode, User A makes change, User B switches back → sees change
- [ ] **Offline Recovery:** User B goes offline, User A makes changes, User B comes online → sees changes
- [ ] **Manual Sync:** If automatic sync fails, manual sync button works

### Automated Testing

```typescript
describe('Real-time Sync', () => {
    it('should await IndexedDB clear before invalidating', async () => {
        const clearSpy = vi.spyOn(cache, 'clearIndexedDBCache');
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        await handleMemberUpdatesChange(['group-1'], queryClient);

        // Verify order: clear MUST complete before invalidate
        expect(clearSpy).toHaveBeenCalledBefore(invalidateSpy);
    });

    it('should use refetchType: all for inactive query support', async () => {
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        await handleMemberUpdatesChange(['group-1'], queryClient);

        expect(invalidateSpy).toHaveBeenCalledWith(
            expect.objectContaining({ refetchType: 'all' })
        );
    });

    it('should reset queries to handle removal sync', async () => {
        const resetSpy = vi.spyOn(queryClient, 'resetQueries');

        await handleMemberUpdatesChange(['group-1'], queryClient);

        expect(resetSpy).toHaveBeenCalledWith(
            expect.objectContaining({ queryKey: ['sharedGroupTransactions', 'group-1'] })
        );
    });
});
```

---

## Quick Reference

### The Three-Step Invalidation Pattern

```typescript
// ALWAYS use this pattern when invalidating cached data
async function invalidateCacheForGroup(groupId: string) {
    // 1. Clear IndexedDB (AWAIT!)
    await clearIndexedDBCache(groupId);

    // 2. Reset React Query in-memory cache
    await queryClient.resetQueries({ queryKey: ['data', groupId] });

    // 3. Invalidate with refetchType: 'all'
    queryClient.invalidateQueries({
        queryKey: ['data', groupId],
        refetchType: 'all'
    });
}
```

### Key React Query Settings for Cache Optimization

```typescript
{
    staleTime: 60 * 60 * 1000,      // Don't auto-refetch for 1 hour
    gcTime: 24 * 60 * 60 * 1000,    // Keep in cache for 24 hours
    refetchOnMount: false,           // Use cached data on mount
    refetchOnWindowFocus: false,     // Don't refetch on tab focus
}
```

### Signal Update Retry Pattern

```typescript
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
        await writeSignal();
        return;  // Success
    } catch {
        if (attempt < MAX_RETRIES) {
            await delay(RETRY_DELAY_MS * (attempt + 1));
        }
    }
}
console.error('Signal update failed - other users may not see changes');
```

---

## Related Documentation

- [React Query - Query Invalidation](https://tanstack.com/query/v4/docs/react/guides/query-invalidation)
- [Firestore Real-time Listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

> **Last Updated:** 2026-01-20
> **Story:** 14c.20 (Shared Group Cache Optimization)
> **Author:** Claude + Gabriel Carcamo
