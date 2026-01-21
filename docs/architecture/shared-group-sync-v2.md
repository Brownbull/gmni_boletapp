# Shared Group Transactions Sync V2

## Overview

This document describes the simplified architecture for shared group transaction synchronization, replacing the previous complex 3-layer caching system that had reliability issues.

## Problem Statement

The V1 implementation had multiple issues:
- 3 cache layers (React Query + IndexedDB + Firestore) that got out of sync
- Complex `memberUpdates` timestamp detection that didn't work reliably
- Delta sync that couldn't detect transaction removals from groups
- Race conditions between cache clearing and query invalidation
- Different devices showing different data for the same group

## V2 Architecture

### Design Principles

1. **Single source of truth**: React Query in-memory cache only
2. **Simple delta sync**: Use `updatedAt` timestamp, not member-based timestamps
3. **Explicit removal tracking**: `removedFromGroupIds` field on transactions
4. **Push-triggered sync**: Delta fetch on push notification receipt
5. **Manual sync fallback**: Refresh button with cooldown for user-initiated sync

### Data Model

#### Transaction Document

```typescript
interface Transaction {
  id: string;
  ownerId: string;
  amount: number;
  date: string;
  // ... other fields

  // Shared group fields
  sharedGroupIds: string[];           // Current groups this transaction belongs to
  removedFromGroupIds?: string[];     // Groups this transaction was removed from
  removedFromGroupsAt?: Timestamp;    // When the removal happened
  updatedAt: Timestamp;               // Used for delta sync
}
```

#### How Removals Work

When user removes a transaction from a group:

**Before:**
```typescript
{ sharedGroupIds: ['groupA', 'groupB'], ... }
```

**After:**
```typescript
{
  sharedGroupIds: ['groupA'],           // groupB removed
  removedFromGroupIds: ['groupB'],      // Track that it was removed from groupB
  removedFromGroupsAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### Sync Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     INITIAL LOAD (Cache Empty)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Query: transactions where sharedGroupIds array-contains     │
│            groupId, limited to 2 years, max 500 docs            │
│                                                                 │
│  2. Store in React Query cache                                  │
│                                                                 │
│  3. Remember lastFetchTime = now                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│            DELTA FETCH (Push notification or manual sync)       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Query: transactions where updatedAt > lastFetchTime         │
│            AND (sharedGroupIds array-contains groupId           │
│                 OR removedFromGroupIds array-contains groupId)  │
│                                                                 │
│  2. For each transaction in results:                            │
│     - If removedFromGroupIds.includes(groupId):                 │
│         → Remove from React Query cache                         │
│     - Else if sharedGroupIds.includes(groupId):                 │
│         → Add/update in React Query cache                       │
│                                                                 │
│  3. Update lastFetchTime = now                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Components

#### 1. useSharedGroupTransactionsV2 Hook

Simplified hook that:
- Uses React Query only (no IndexedDB)
- Implements simple delta sync
- Handles `removedFromGroupIds` filtering
- Provides `refresh()` function for manual sync
- Tracks `lastFetchTime` in React Query cache metadata

#### 2. GroupSyncButton Component

- Appears in group header next to group icon
- Shows sync icon with animation when syncing
- Has cooldown: 60 seconds, incrementing after 5th refresh
- Calls `refresh()` from the hook

#### 3. Transaction Save Logic

When saving a transaction with group assignment changes:
```typescript
// Calculate removed groups
const removedGroups = previousGroupIds.filter(id => !newGroupIds.includes(id));

// Update transaction
{
  sharedGroupIds: newGroupIds,
  removedFromGroupIds: removedGroups.length > 0 ? removedGroups : deleteField(),
  removedFromGroupsAt: removedGroups.length > 0 ? serverTimestamp() : deleteField(),
  updatedAt: serverTimestamp()
}
```

#### 4. Push Notification Handler

When receiving a push notification for a shared group:
1. Extract `groupId` from notification payload
2. Call `queryClient.invalidateQueries(['sharedGroupTransactionsV2', groupId])`
3. This triggers the delta fetch automatically

### Migration Strategy

1. Create `useSharedGroupTransactionsV2` as a new hook
2. Test it in isolation
3. Swap it into `App.tsx` replacing the old hook
4. Remove old code:
   - `sharedGroupCache.ts` (IndexedDB layer)
   - `memberUpdates` detection in App.tsx
   - Old delta sync logic

### Cost Analysis

**V1 (Current broken system):**
- Complex caching was supposed to reduce costs but doesn't work reliably

**V2:**
- Initial load: 1 query per group view
- Delta sync: 1 query per push notification/manual sync
- Estimated: ~10-20 reads per user per day for active shared group usage
- Cost: ~$0.006/user/day = $0.18/user/month for 50 users = $9/month

This is acceptable given the reliability improvement.

### Cleanup (Future)

The `removedFromGroupIds` field can accumulate over time. Options:
1. Clear it after 30 days via Cloud Function
2. Clear it when transaction is modified again
3. Keep it indefinitely (small data footprint)

Recommendation: Option 2 - clear on next modification. Simple and automatic.

## Implementation Status (2026-01-20)

### ✅ COMPLETED

1. **Transaction type updated** - `src/types/transaction.ts`
   - Added `removedFromGroupIds?: string[]` field
   - Added `removedFromGroupsAt?: any` timestamp field

2. **Firestore save logic updated** - `src/services/firestore.ts`
   - `updateTransaction()` now handles `removedFromGroupIds`
   - Sets `removedFromGroupsAt` with `serverTimestamp()` when groups removed
   - Clears both fields with `deleteField()` on next modification

3. **App.tsx onGroupsChange updated** - `src/App.tsx` (line ~4077)
   - When groups are removed, sets `removedFromGroupIds` on `currentTransaction`
   - This gets saved to Firestore when user clicks Save

4. **V2 Delta fetch function** - `src/services/sharedGroupTransactionService.ts`
   - Added `fetchDeltaUpdatesV2()` function
   - Queries BOTH active transactions AND removed transactions in parallel
   - Returns `{ transactions, removedTransactionIds }`

5. **V2 Hook created** - `src/hooks/useSharedGroupTransactionsV2.ts`
   - React Query only (NO IndexedDB)
   - Simple delta sync using `fetchDeltaUpdatesV2`
   - `refresh()` function for manual/push-triggered sync
   - `forceFullRefresh()` for full data reload

### 🔄 IN PROGRESS

6. **Sync button component** - Need to create or reuse existing `SyncButton.tsx`
   - Check existing: `src/components/SharedGroups/SyncButton.tsx`
   - May just need to wire it to V2 hook's `refresh()` function

### ⏳ REMAINING STEPS

7. **Swap V2 hook into App.tsx**
   ```typescript
   // Replace:
   import { useSharedGroupTransactions } from './hooks/useSharedGroupTransactions';
   // With:
   import { useSharedGroupTransactionsV2 } from './hooks/useSharedGroupTransactionsV2';
   ```
   - Update the hook call (API is compatible)
   - REMOVE the complex `memberUpdates` detection useEffect (lines ~525-682)

8. **Add sync button to group header**
   - In `DashboardView` or wherever group header is rendered
   - Wire to V2 hook's `refresh()` function

9. **Wire push notification handler**
   - Use `usePushNotificationSync` from V2 hook
   - OR update existing push handler to call `refresh()`

10. **Create Firestore indexes** (if needed)
    - Index for: `removedFromGroupIds` array-contains + `removedFromGroupsAt` desc
    - Check Firebase console for auto-generated index links on first query failure

11. **Test cross-device sync**
    - User A removes transaction from group → User B should see it disappear
    - User A adds transaction to group → User B should see it appear

12. **Cleanup old code** (AFTER testing works)
    - Remove `src/lib/sharedGroupCache.ts` (IndexedDB layer)
    - Remove old delta sync code from `useSharedGroupTransactions.ts`
    - Remove `memberUpdates` timestamp management

## Files to Create/Modify

### New Files
- ✅ `src/hooks/useSharedGroupTransactionsV2.ts` - Simplified hook (CREATED)
- ⏳ `src/components/SharedGroups/GroupSyncButton.tsx` - Sync button with cooldown (check if exists)

### Files Modified
- ✅ `src/types/transaction.ts` - Added removedFromGroupIds fields
- ✅ `src/services/firestore.ts` - Added removedFromGroupIds handling in updateTransaction
- ✅ `src/services/sharedGroupTransactionService.ts` - Added fetchDeltaUpdatesV2
- ✅ `src/App.tsx` - Added removedFromGroupIds tracking in onGroupsChange

### Files to Modify (remaining)
- ⏳ `src/App.tsx` - Swap to V2 hook, remove memberUpdates detection (~150 lines to delete)

### Files to Delete (after migration complete)
- `src/lib/sharedGroupCache.ts` - IndexedDB layer no longer needed
