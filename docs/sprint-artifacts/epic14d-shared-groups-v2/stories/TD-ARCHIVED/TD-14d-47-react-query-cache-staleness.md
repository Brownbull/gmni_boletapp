# Tech Debt Story TD-14d-47: React Query Cache Staleness After Firestore Mutations

Status: backlog

## Problem Statement

When a Firestore mutation succeeds, calling `refetchGroups()` immediately after can return stale/cached data because Firestore's eventual consistency model means the write may not be reflected in the next read query.

## Discovery Context

**Found during:** Story 14d-v2-1-11c E2E testing (2026-02-04)
**Symptom:** Transaction sharing toggle appears to "rollback" after successful Firestore write
**Root Cause:** React Query cache returns stale data before Firestore propagates the write

### Evidence

E2E test output showing the issue:
```
→ State after click: true      ← Optimistic update worked
✅ Success toast appeared       ← Firestore write succeeded
→ Final state: false           ← React Query returned stale data
⚠️ Toggle rolled back to original state (Firestore update failed)
```

**Proof that Firestore write succeeded:** Subsequent test run showed cooldown was active:
```
→ Restriction message: "Por favor espera 10 minutos antes de cambiar esta configuración"
```

This proves `transactionSharingLastToggleAt` was updated in Firestore.

## Affected Patterns

This issue affects any flow that:
1. Performs a Firestore mutation
2. Immediately calls `refetch()` on a React Query
3. Expects the UI to reflect the new state

### Known Affected Areas

| Location | Operation | Impact |
|----------|-----------|--------|
| `GruposView.tsx` | `handleToggleTransactionSharing` | Toggle appears to rollback |
| Potentially others | Any mutation + immediate refetch | Stale UI state |

## Proposed Solutions

### Option A: Optimistic Cache Update (Recommended)

Update React Query cache optimistically before/after mutation:

```typescript
const handleToggleTransactionSharing = useCallback(async (enabled: boolean) => {
    // ... validation ...

    // Optimistically update the cache
    queryClient.setQueryData(['groups', user?.uid], (old: SharedGroup[] | undefined) => {
        if (!old) return old;
        return old.map(g =>
            g.id === dialogs.editingGroup?.id
                ? { ...g, transactionSharingEnabled: enabled }
                : g
        );
    });

    try {
        await updateTransactionSharingEnabled(db, groupId, userId, enabled);
        // Invalidate to get fresh server data eventually
        queryClient.invalidateQueries(['groups', user?.uid]);
        onShowToast?.('Success', 'success');
    } catch (err) {
        // Rollback cache on error
        queryClient.invalidateQueries(['groups', user?.uid]);
        onShowToast?.('Error', 'error');
        throw err;
    }
}, [...]);
```

### Option B: Delayed Refetch

Add a delay before refetching to allow Firestore propagation:

```typescript
await updateTransactionSharingEnabled(...);
await new Promise(resolve => setTimeout(resolve, 500)); // Wait for propagation
refetchGroups();
```

**Cons:** Adds latency, doesn't guarantee consistency.

### Option C: Use Firestore Real-time Listeners

Replace React Query polling with Firestore `onSnapshot` listeners for groups.

**Cons:** More complex, may not fit current architecture.

## Acceptance Criteria

- [ ] After successful Firestore mutation, UI immediately reflects new state
- [ ] No "rollback" appearance when mutation succeeds
- [ ] Optimistic updates work correctly with proper rollback on actual failure
- [ ] Pattern documented for other mutations to follow

## Estimation

- **Complexity:** Medium
- **Points:** 2-3
- **Risk:** Low (UI polish, not data integrity)

## Dependencies

- None (standalone improvement)

## References

- [React Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Firestore Consistency Model](https://firebase.google.com/docs/firestore/manage-data/transactions)
- Story 14d-v2-1-11c: Where issue was discovered
