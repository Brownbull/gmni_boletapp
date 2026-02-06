# React Query Caching Architecture

> Story 14.29: React Query Migration
> Last Updated: 2026-01-22 (Epic 14c-refactor: Caching Simplification)

## Overview

Gastify uses **React Query** (`@tanstack/react-query`) combined with **Firestore real-time subscriptions** to provide:
- **Instant navigation** - cached data displays immediately when returning to views
- **Real-time updates** - Firestore listeners keep data fresh
- **Background sync** - stale-while-revalidate pattern
- **Optimistic updates** - immediate UI feedback (future capability)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          React Components                            │
│  (DashboardView, TrendsView, SettingsView, etc.)                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Custom Hooks Layer                               │
│  useTransactions, useCategoryMappings, useMerchantMappings, etc.    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   useFirestoreSubscription                           │
│  - Combines React Query cache with Firestore onSnapshot             │
│  - Local state for immediate updates                                 │
│  - Cache persistence across navigation                               │
└─────────────────────────────────────────────────────────────────────┘
                          │                     │
                          ▼                     ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│      React Query Cache          │  │    Firestore onSnapshot         │
│  (QueryClient in memory)        │  │    (Real-time listener)         │
│  - Instant data on navigation   │  │    - Live updates               │
│  - Shared across components     │  │    - Transforms data            │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/queryClient.ts` | QueryClient configuration with Firestore-optimized defaults |
| `src/lib/queryKeys.ts` | Hierarchical query key constants for cache management |
| `src/hooks/useFirestoreSubscription.ts` | Core hook combining RQ cache + Firestore subscriptions |
| `src/hooks/useFirestoreQuery.ts` | One-time fetch hook (for non-realtime data) |
| `src/hooks/useFirestoreMutation.ts` | Mutation hook with cache invalidation |
| `src/main.tsx` | QueryClientProvider setup + DevTools (dev only) |

## Data Flow

### On Component Mount (Cache Hit)

```
1. Component mounts, calls useTransactions()
2. useFirestoreSubscription checks React Query cache
3. ✅ Cache HIT → Returns cached data immediately (no loading spinner)
4. Firestore subscription starts in background
5. If Firestore data differs, state updates
```

### On Component Mount (Cache Miss)

```
1. Component mounts, calls useTransactions()
2. useFirestoreSubscription checks React Query cache
3. ❌ Cache MISS → isLoading=true
4. Firestore subscription starts
5. First onSnapshot fires → data + cache updated, isLoading=false
```

### On Firestore Update

```
1. Firestore document changes
2. onSnapshot callback fires with new data
3. useFirestoreSubscription compares with current data (JSON)
4. If different → setData(newData), update React Query cache
5. Components re-render with fresh data
```

## Query Keys

Query keys follow a hierarchical structure for easy invalidation:

```typescript
// src/lib/queryKeys.ts
export const QUERY_KEYS = {
    transactions: (userId: string, appId: string) =>
        ['transactions', userId, appId] as const,

    categoryMappings: (userId: string, appId: string) =>
        ['categoryMappings', userId, appId] as const,

    // ... etc
};
```

### Invalidation Patterns

```typescript
// Invalidate all transactions for a user
queryClient.invalidateQueries({ queryKey: ['transactions', userId] });

// Invalidate specific collection
queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions(userId, appId) });
```

## useFirestoreSubscription Hook

The core hook that bridges React Query and Firestore:

```typescript
function useFirestoreSubscription<TData>(
    queryKey: readonly unknown[],
    subscribeFn: (callback: (data: TData) => void) => Unsubscribe,
    options?: { enabled?: boolean }
): { data: TData | undefined; isLoading: boolean; error: Error | null }
```

### Key Implementation Details

1. **Cache-first approach**: Check cache before showing loading state
2. **Refs for stability**: Prevent stale closures and unnecessary re-subscriptions
3. **JSON comparison**: Skip redundant state updates when data unchanged
4. **Initialization tracking**: Prevent infinite loops from repeated cache reads

### Anti-patterns Avoided

| Problem | Solution |
|---------|----------|
| `useQuery` with subscriptions | Local state + useEffect, cache for persistence only |
| `setData(cached)` on every render | `initializedRef` flag to run once |
| Derived state with useState | `useMemo` for computed values |
| Stale closures in callbacks | Refs updated on every render |

## QueryClient Configuration

```typescript
// src/lib/queryClient.ts
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,      // 5 minutes
            gcTime: 30 * 60 * 1000,         // 30 minutes (formerly cacheTime)
            refetchOnWindowFocus: true,     // Catch updates while app was in background
            refetchOnReconnect: false,      // Firestore handles reconnection
            refetchOnMount: false,          // Don't refetch if data is fresh
            retry: 1,                       // Retry once on failure
        },
    },
});
```

## Development Tools

React Query DevTools are included for development only:

```tsx
// src/main.tsx
{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
```

- **TanStack logo** in bottom-right corner (dev only)
- Shows all cached queries, their status, and data
- Useful for debugging cache behavior
- **Automatically excluded from production builds** via tree-shaking

## Migration Pattern

When migrating a hook from raw Firestore to React Query:

```typescript
// Before: Direct Firestore subscription
export function useTransactions(user, services) {
    const [transactions, setTransactions] = useState([]);
    useEffect(() => {
        const unsubscribe = onSnapshot(query, (snapshot) => {
            setTransactions(snapshot.docs.map(d => d.data()));
        });
        return unsubscribe;
    }, [user?.uid]);
    return transactions;
}

// After: React Query + Firestore
export function useTransactions(user, services) {
    const queryKey = useMemo(() => QUERY_KEYS.transactions(user!.uid, services!.appId), [...]);

    const { data } = useFirestoreSubscription<Transaction[]>(
        queryKey,
        (callback) => subscribeToTransactions(services.db, user.uid, services.appId, callback),
        { enabled: !!user && !!services }
    );

    return data ?? [];
}
```

---

## Simplified Caching Architecture (Epic 14c-refactor)

> **Added:** 2026-01-22 (Story 14c-refactor.4, 14c-refactor.12)

Epic 14c-refactor simplified the caching architecture by removing the complex multi-layer cache that was causing sync issues in the failed Epic 14c (Shared Groups) implementation.

### Before (Multi-Layer Complexity)

```
React Query Cache (in-memory)
       ↓
IndexedDB Cache (LRU eviction)  ← REMOVED
       ↓
localStorage Cache              ← REMOVED
       ↓
Firestore (source of truth)
```

**Problems with multi-layer caching:**
- Delta sync couldn't detect deletions across layers
- Cache invalidation cascaded unpredictably
- IndexedDB added complexity with minimal benefit for current scale
- localStorage state could get out of sync with Firestore

### After (Simplified Two-Layer)

```
React Query Cache (in-memory)
       ↓
Firestore (source of truth)
  └── Offline persistence built-in
```

### What Was Removed

| Component | File | Status | Reason |
|-----------|------|--------|--------|
| IndexedDB cache | `src/lib/sharedGroupCache.ts` | ❌ Deleted | Complexity without benefit |
| IndexedDB hooks | `useSharedGroupTransactions.ts` | ❌ Deleted | Unused |
| localStorage sync | ViewModePreference | ✅ Simplified | React Query handles caching |
| localStorage state | Various prefs | ✅ Simplified | Single source of truth |

### Current Cache Configuration

```typescript
// src/lib/queryClient.ts
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,      // 5 minutes - data considered fresh
            gcTime: 30 * 60 * 1000,         // 30 minutes - cache kept for recovery
            refetchOnWindowFocus: true,     // Catch updates while app backgrounded
            refetchOnReconnect: false,      // Firestore handles reconnection
            refetchOnMount: false,          // Don't refetch if fresh
            retry: 1,                       // Single retry on failure
        },
    },
});
```

### Offline Support

**Firestore offline persistence** handles offline scenarios without a custom IndexedDB layer:

```typescript
// Firebase initialization (already configured)
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open - only one can have persistence
    } else if (err.code === 'unimplemented') {
        // Browser doesn't support IndexedDB
    }
});
```

**Benefits:**
- Firestore SDK manages cache internally
- Automatic sync on reconnection
- No custom cache invalidation needed
- Consistent behavior across tabs

### Key Lessons Applied

From the Epic 14c failure retrospective:

| Problem | Solution Applied |
|---------|------------------|
| Delta sync can't detect deletions | Removed multi-layer caching; Firestore handles sync |
| Cache layers got out of sync | Single React Query layer only |
| Cost explosion from refetchOnMount | Keep refetchOnMount: false |
| Complexity without benefit | YAGNI - simpler is better for current scale |

---

## Future Capabilities

With React Query in place, we can now implement:

1. **Optimistic updates** - Show changes immediately, rollback on error
2. **Infinite queries** - Paginated transaction loading (Story 14.27)
3. **Query prefetching** - Pre-load data before navigation
4. **Household sharing** - Multi-user cache management (Epic 14d - will use simplified architecture)

## Troubleshooting

### "Maximum update depth exceeded"

**Cause**: State updates in useEffect causing infinite re-renders

**Solutions**:
- Use refs to track initialization (`initializedRef`)
- Compare data with JSON before calling `setData`
- Use `useMemo` for derived values instead of useState+useEffect

### Cache not updating

**Cause**: Query key mismatch

**Solution**: Ensure query keys match exactly when reading and writing cache

### DevTools showing in production

**Cause**: `import.meta.env.DEV` check missing

**Solution**: Wrap in `{import.meta.env.DEV && <ReactQueryDevtools />}`

---

## References

- [TanStack React Query Docs](https://tanstack.com/query/latest)
- Story 14.29: `docs/sprint-artifacts/epic14/stories/story-14.29-react-query-migration.md`
- Project Patterns: `_bmad/bmm/knowledge/code-review-patterns.md` (migrated from Atlas 2026-02-05)
