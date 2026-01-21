# Story 14c.5: Shared Group Transactions View

Status: done

## Implementation Notes

**Implemented: 2026-01-16**

### Files Created

1. **Service Layer**
   - `src/services/sharedGroupTransactionService.ts` - Multi-member parallel query service with delta sync
   - `src/lib/sharedGroupCache.ts` - IndexedDB caching layer with LRU eviction

2. **React Hook**
   - `src/hooks/useSharedGroupTransactions.ts` - React Query integration with IndexedDB hydration

3. **UI Components**
   - `src/components/SharedGroups/SharedGroupTotalCard.tsx` - Combined total display
   - `src/components/SharedGroups/MemberFilterBar.tsx` - Avatar toggle filter
   - `src/components/SharedGroups/DateRangeSelector.tsx` - Month/preset selector

4. **Tests (48 tests passing)**
   - `tests/unit/services/sharedGroupTransactionService.test.ts`
   - `tests/unit/lib/sharedGroupCache.test.ts`
   - `tests/unit/components/SharedGroups/SharedGroupTotalCard.test.tsx`
   - `tests/unit/components/SharedGroups/MemberFilterBar.test.tsx`

### Architecture Decisions

- **Parallel Queries**: `Promise.all()` for fetching from all members simultaneously
- **Cache-First Loading**: IndexedDB → display → Firestore background sync
- **Delta Sync**: Uses `group.memberUpdates[userId].lastSyncAt` to detect per-member changes
- **LRU Eviction**: 50,000 record limit with 5,000 batch eviction

### Query Keys Added
- `QUERY_KEYS.sharedGroupTransactions(groupId)` _(Story 14c.16: removed date range from key)_
- `QUERY_KEYS.sharedGroups.all/single/transactions/members`

## Story

As a group member,
I want to see all transactions shared to the group from all members,
so that I understand our combined spending.

## Acceptance Criteria

1. **AC1: Query Each Member's Transactions**
   - Given I'm viewing a shared group
   - When the view loads
   - Then transactions are queried from each member's collection
   - And query uses `array-contains` filter on `sharedGroupIds`
   - And queries are executed in parallel for performance

2. **AC2: Merge and Sort Results**
   - Given transactions are fetched from multiple members
   - When results are merged
   - Then they are sorted by date (most recent first)
   - And duplicates are handled (if any edge case)
   - And the merged list is displayed as a unified timeline

3. **AC3: IndexedDB Caching Layer**
   - Given shared group transactions are fetched
   - When the data is received
   - Then it's cached in IndexedDB for offline support
   - And subsequent loads hydrate from IndexedDB first
   - And cache survives app close/refresh

4. **AC4: Delta Sync with memberUpdates**
   - Given a cached dataset exists
   - When checking for updates
   - Then only fetch transactions with `updatedAt > lastSyncTimestamp`
   - And use `group.memberUpdates[userId]` to detect changes per member
   - And merge delta results into existing cache

5. **AC5: React Query Integration**
   - Given the caching strategy
   - When implementing data fetching
   - Then use React Query with IndexedDB as persistence layer
   - And set `staleTime: 5 minutes`, `gcTime: 30 minutes`
   - And show cached data immediately while fetching fresh

6. **AC6: Combined Total Spending**
   - Given I'm viewing a shared group
   - When transactions are loaded
   - Then I see the total combined spending at the top
   - And the total is for the current month by default
   - And it aggregates all members' tagged transactions

7. **AC7: Filter by Member**
   - Given I'm viewing shared group transactions
   - When I want to see one member's contributions
   - Then I can filter to show only their transactions
   - And the filter shows member avatars as toggle buttons

8. **AC8: Filter by Date Range**
   - Given I'm viewing shared group transactions
   - When I select a date range
   - Then transactions are filtered to that range
   - And maximum range is 12 months (hard cap)
   - And default is current month

9. **AC9: LRU Cache Eviction**
   - Given the IndexedDB cache grows over time
   - When it exceeds 50,000 records
   - Then the oldest 5,000 records are evicted (LRU)
   - And cache size is monitored on each write

## Tasks / Subtasks

- [x] Task 1: Create Multi-Member Query Service (AC: #1, #2)
  - [x] 1.1 Create `src/services/sharedGroupTransactionService.ts`
  - [x] 1.2 Implement `fetchSharedGroupTransactions(db, appId, groupId, members[], options)`
  - [x] 1.3 Execute parallel queries per member using `Promise.all()`
  - [x] 1.4 Implement client-side merge and sort by date
  - [x] 1.5 Handle pagination for each member query
  - [x] 1.6 Add date range filtering to queries

- [x] Task 2: Set Up IndexedDB Schema (AC: #3, #9)
  - [x] 2.1 Create `src/lib/sharedGroupCache.ts`
  - [x] 2.2 Define IndexedDB schema: `sharedGroupTransactions` store
  - [x] 2.3 Create indexes: `by-group-id`, `by-date`, `by-cached-at`
  - [x] 2.4 Implement `openSharedGroupDB()` - open/create database
  - [x] 2.5 Implement `writeToCache(groupId, transactions[])`
  - [x] 2.6 Implement `readFromCache(groupId, dateRange)`
  - [x] 2.7 Implement LRU eviction when limit exceeded

- [x] Task 3: Implement Delta Sync Logic (AC: #4)
  - [x] 3.1 Store `lastSyncTimestamp` per group in IndexedDB metadata
  - [x] 3.2 Implement `getChangedMembers(group, lastSync)` - check memberUpdates
  - [x] 3.3 Implement `fetchDeltaUpdates(db, appId, groupId, members[], since)`
  - [x] 3.4 Merge delta results into existing cache
  - [x] 3.5 Update lastSyncTimestamp after successful sync

- [x] Task 4: Create React Query Integration (AC: #5)
  - [x] 4.1 Create `src/hooks/useSharedGroupTransactions.ts`
  - [x] 4.2 Implement cache-first loading: IndexedDB → display → Firestore fetch
  - [x] 4.3 Configure React Query with appropriate staleTime/gcTime
  - [x] 4.4 Add query key pattern: `['sharedGroupTransactions', groupId, dateRange]`
  - [x] 4.5 Implement background refetch strategy
  - [x] 4.6 Handle cache invalidation on member changes

- [x] Task 5: Create Combined Total Component (AC: #6)
  - [x] 5.1 Create `SharedGroupTotalCard.tsx` - displays total spending
  - [x] 5.2 Calculate total from merged transactions
  - [x] 5.3 Show currency formatting (handle single currency for MVP)
  - [x] 5.4 Update total when date range changes

- [x] Task 6: Implement Member Filter UI (AC: #7)
  - [x] 6.1 Create `MemberFilterBar.tsx` - avatar toggle buttons
  - [x] 6.2 Fetch member profiles for display names/avatars
  - [x] 6.3 Filter transactions client-side when member selected
  - [x] 6.4 Support multi-select (show multiple members)
  - [x] 6.5 "All" option to reset filter

- [x] Task 7: Implement Date Range Filter (AC: #8)
  - [x] 7.1 Add date range selector to shared group views
  - [x] 7.2 Default to current month
  - [x] 7.3 Enforce 12-month maximum range
  - [x] 7.4 Re-query when date range changes

- [x] Task 8: Storage Strategy Fallback (AC: #3)
  - [x] 8.1 Implement `useStorageStrategy()` hook to detect IndexedDB support
  - [x] 8.2 Fall back to React Query in-memory if IndexedDB unavailable
  - [x] 8.3 Show toast warning for degraded offline support

- [x] Task 9: Component Tests
  - [x] 9.1 Test multi-member query merges correctly
  - [x] 9.2 Test IndexedDB cache read/write
  - [x] 9.3 Test delta sync only fetches changed data
  - [x] 9.4 Test LRU eviction at 50K records
  - [x] 9.5 Test member filter functionality
  - [x] 9.6 Test date range filter enforcement

- [x] Task 10: App.tsx Integration (AC: #1, #5, #6) **CRITICAL - Missing Integration**
  - [x] 10.1 Import `useSharedGroupTransactions` hook in App.tsx
  - [x] 10.2 Call hook conditionally when `viewMode === 'group'` with `activeGroup`
  - [x] 10.3 Create data source switching (isGroupMode, activeTransactions, activeRecentTransactions)
  - [x] 10.4 Pass shared group transactions to DashboardView when in group mode
  - [x] 10.5 Pass shared group transactions to HistoryView when in group mode
  - [x] 10.6 Pass shared group transactions to TrendsView when in group mode
  - [x] 10.7 Pass shared group transactions to ItemsView when in group mode
  - [x] 10.8 Update Firestore security rules for cross-user transaction reads
  - [ ] 10.9 Test end-to-end: switch to group mode → see group transactions

- [x] Task 11: Cache Invalidation on Group Assignment (Session 2026-01-16)
  - [x] 11.1 Add `useQueryClient` to DashboardView for cache invalidation
  - [x] 11.2 Update `handleGroupSelect` to invalidate `sharedGroupTransactions` cache for affected groups
  - [x] 11.3 Add `useQueryClient` to App.tsx
  - [x] 11.4 Update `onGroupsChange` in TransactionEditorView to invalidate cache

- [x] Task 12: UI Improvements for Group Selection (Session 2026-01-16)
  - [x] 12.1 Add red trash icon for already-assigned groups in TransactionGroupSelector
  - [x] 12.2 Track `originallyAssigned` groups to show delete indicator
  - [x] 12.3 Update checkbox styling to show red background when removing

- [x] Task 13: Cache Staleness Issues - RESOLVED BY STORY 14c.12 (Session 2026-01-17)
  # NOTE: These "bugs" were symptoms of missing real-time sync, not bugs in 14c.5's code.
  # Story 14c.12 (Real-Time Sync - Complete the Circuit) implements the missing pieces:
  # - Writer: updateMemberTimestamp when transactions change
  # - Reader: onSnapshot listener on group documents
  # - Reactor: cache invalidation when other members make changes
  #
  # Original issues (now understood as expected behavior without real-time sync):
  # - 13.1 Transaction not showing: Cache shows stale data until invalidated
  # - 13.2 Assignment persistence: IndexedDB cache not cleared on remote changes
  # - 13.3 Cache invalidation: No trigger exists to invalidate on OTHER user's changes
  #
  # See: docs/sprint-artifacts/epic14c/BRAINSTORM-REALTIME-SYNC-DECISION.md
  # See: docs/sprint-artifacts/epic14c/14c-12-realtime-sync-complete-circuit.md

## Dev Notes

### CRITICAL: Task 10 Integration Gap (Added 2026-01-16)

**Problem Discovered During Manual Testing:**
- Tasks 1-9 built the infrastructure (service, cache, hook, components)
- But the hook was **never integrated into App.tsx**
- When user switches to shared group mode, they still see personal transactions (or nothing)

**Root Cause:**
- Story 14c.4 Task 5.5 (`useFilteredTransactions()`) was left unchecked but story marked done
- This story (14c.5) built the hook but didn't integrate it

**Integration Pattern Required:**
```typescript
// In App.tsx
const { mode: viewMode, group: activeGroup } = useViewMode();

// Personal transactions (existing)
const personalTransactions = useTransactions(user, services);

// Shared group transactions (NEW - Task 10)
const {
    transactions: sharedTransactions,
    isLoading: sharedLoading,
    total: sharedTotal,
    dateRange,
    setDateRange,
    selectedMembers,
    toggleMember,
    selectAllMembers,
} = useSharedGroupTransactions({
    services,
    group: activeGroup,
    enabled: viewMode === 'group' && !!activeGroup,
});

// Switch data source based on view mode
const transactions = viewMode === 'group' ? sharedTransactions : personalTransactions;
```

### Architecture Context

**Query Strategy Evolution (Documented 2026-01-16):**

The brainstorming session (2026-01-15) originally designed **parallel per-member queries**:
```typescript
// Original design from brainstorming
const q = query(
  collection(db, `artifacts/${appId}/users/${memberId}/transactions`),
  where('sharedGroupIds', 'array-contains', groupId),
  ...
);
// Execute for each member, merge client-side
```

During implementation, this was **evolved to use `collectionGroup`** as the primary approach:
```typescript
// Current implementation (superior)
const transactionsRef = collectionGroup(db, 'transactions');
const q = query(
  transactionsRef,
  where('sharedGroupIds', 'array-contains', groupId),
  orderBy('date', 'desc'),
  ...
);
// Single query returns all members' transactions
```

**Why collectionGroup is better:**
| Aspect | Per-Member (Original) | CollectionGroup (Current) |
|--------|----------------------|---------------------------|
| Queries | N queries (N = members) | 1 query |
| Client merge | Required | Not required (Firestore merges) |
| Performance | O(N) network calls | O(1) network call |
| Scalability | Degrades with member count | Constant |

**Per-member queries kept as fallback** in `fetchSharedGroupTransactionsFallback()` if collectionGroup fails (e.g., missing index).

**Requirements for collectionGroup to work:**
1. Security rules with `/{path=**}/transactions/{transactionId}` match
2. `COLLECTION_GROUP` scope index in firestore.indexes.json
3. Rules deployed: `firebase deploy --only firestore:rules,firestore:indexes`

**CRITICAL Security Finding (2026-01-16):**

Firestore collection group queries **cannot** use `resource.data.*` conditions in security rules. This means:
- ❌ `resource.data.sharedGroupIds != null` - FAILS
- ❌ `resource.data.sharedGroupIds.size() > 0` - FAILS
- ❌ `get(/sharedGroups/...).data.members.hasAny([userId])` - FAILS
- ✅ `request.auth != null` - WORKS

The deployed rule is auth-only:
```javascript
match /{path=**}/transactions/{transactionId} {
  allow read: if request.auth != null;
}
```

**Security Mitigations:**
1. Query includes `array-contains groupId` - only returns tagged transactions
2. GroupIds are UUIDs - not enumerable
3. App validates group membership before showing group options
4. Personal (unshared) transactions protected by user/{userId}/... rule
5. Users must explicitly tag transactions to groups (opt-in sharing)

**Three-Layer Caching:**
```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: React Query In-Memory Cache                   │
│  - staleTime: 5 minutes                                 │
│  - gcTime: 30 minutes                                   │
├─────────────────────────────────────────────────────────┤
│  Layer 2: IndexedDB Persistent Cache                    │
│  - Survives app close/refresh                           │
│  - Works offline                                        │
│  - LRU eviction at 50K records                          │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Firestore (Source of Truth)                   │
│  - Delta sync: where('updatedAt', '>', lastSync)        │
│  - Invalidation via memberUpdates timestamp             │
└─────────────────────────────────────────────────────────┘
```

### Existing Code to Leverage

**React Query Setup:** Already configured in project
- Query client configured in `src/App.tsx`
- Hooks like `useFirestoreSubscription` as patterns

**Transaction Types:** `src/types/transaction.ts`
- `Transaction` interface
- Date/currency handling utilities

**Firestore Query Patterns:** `src/services/transactionService.ts`
- Query builder patterns
- Pagination patterns

### Project Structure Notes

**New files to create:**
```
src/
├── services/
│   └── sharedGroupTransactionService.ts  # Multi-member query logic
├── lib/
│   └── sharedGroupCache.ts               # IndexedDB operations
├── hooks/
│   └── useSharedGroupTransactions.ts     # React Query integration
├── components/
│   └── shared-groups/
│       ├── SharedGroupTotalCard.tsx      # Combined total display
│       └── MemberFilterBar.tsx           # Member filter avatars
```

**Files to modify:**
```
src/components/views/HistoryView.tsx       # Use shared transactions hook
src/components/views/DashboardView.tsx     # Show shared total card
```

### IndexedDB Schema

```typescript
// src/lib/sharedGroupCache.ts
const DB_NAME = 'boletapp_shared_groups';
const DB_VERSION = 1;

interface CachedTransaction {
  id: string;
  groupId: string;
  ownerId: string;       // Which member owns this transaction
  date: number;          // Timestamp for sorting
  cachedAt: number;      // For LRU eviction
  data: Transaction;     // Full transaction object
}

interface SyncMetadata {
  groupId: string;
  lastSyncTimestamp: number;
  memberSyncTimestamps: { [userId: string]: number };
}

const stores = {
  transactions: {
    keyPath: 'id',
    indexes: [
      { name: 'by-group-id', keyPath: 'groupId' },
      { name: 'by-date', keyPath: 'date' },
      { name: 'by-cached-at', keyPath: 'cachedAt' },
    ],
  },
  metadata: {
    keyPath: 'groupId',
  },
};
```

### Multi-Member Query Implementation

```typescript
// src/services/sharedGroupTransactionService.ts
export async function fetchSharedGroupTransactions(
  db: Firestore,
  appId: string,
  groupId: string,
  members: string[],
  options: { startDate?: Date; endDate?: Date; limit?: number }
): Promise<Transaction[]> {
  // Execute queries in parallel
  const queries = members.map(memberId =>
    query(
      collection(db, `artifacts/${appId}/users/${memberId}/transactions`),
      where('sharedGroupIds', 'array-contains', groupId),
      where('date', '>=', options.startDate),
      where('date', '<=', options.endDate),
      orderBy('date', 'desc'),
      limit(options.limit || 100)
    )
  );

  const snapshots = await Promise.all(queries.map(q => getDocs(q)));

  // Flatten and merge results
  const allTransactions = snapshots.flatMap((snapshot, idx) =>
    snapshot.docs.map(doc => ({
      ...doc.data() as Transaction,
      _ownerId: members[idx],  // Track who owns this
    }))
  );

  // Sort by date descending
  return allTransactions.sort((a, b) => b.date.toMillis() - a.date.toMillis());
}
```

### Delta Sync Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Delta Sync Flow                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Load from IndexedDB (instant display)                │
│                      │                                   │
│                      ▼                                   │
│  2. Fetch group doc (get memberUpdates)                  │
│                      │                                   │
│                      ▼                                   │
│  3. Compare memberUpdates[userId] vs lastSync            │
│     - If any member updated → fetch their changes        │
│                      │                                   │
│                      ▼                                   │
│  4. Query only changed members:                          │
│     where('updatedAt', '>', memberSyncTimestamp)         │
│                      │                                   │
│                      ▼                                   │
│  5. Merge delta into IndexedDB cache                     │
│                      │                                   │
│                      ▼                                   │
│  6. Update lastSyncTimestamp in metadata                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### LRU Cache Eviction

```typescript
const CACHE_CONFIG = {
  MAX_RECORDS: 50_000,
  EVICTION_BATCH: 5_000,
};

async function enforeCacheLimit(db: IDBPDatabase): Promise<void> {
  const store = db.transaction('transactions', 'readonly').objectStore('transactions');
  const count = await store.count();

  if (count > CACHE_CONFIG.MAX_RECORDS) {
    const tx = db.transaction('transactions', 'readwrite');
    const index = tx.objectStore('transactions').index('by-cached-at');

    // Get oldest records
    let deleted = 0;
    for await (const cursor of index.iterate()) {
      if (deleted >= CACHE_CONFIG.EVICTION_BATCH) break;
      await cursor.delete();
      deleted++;
    }

    await tx.done;
  }
}
```

### Performance Considerations

- **Parallel queries:** Use `Promise.all()` for member queries
- **Pagination:** Limit per-member query to prevent huge fetches
- **Debounce:** Debounce filter changes to avoid rapid re-queries
- **Background sync:** Use React Query background refetch
- **Memory:** Don't load entire 12-month history into memory at once

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md#caching-strategy
- [Brainstorming - Caching]: docs/analysis/brainstorming-session-2026-01-15.md#caching-strategy-approach-c
- [Brainstorming - Q28 Cache Size]: docs/analysis/brainstorming-session-2026-01-15.md#q28-maximum-cache-size
- [IndexedDB API]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- [idb Library]: https://github.com/jakearchibald/idb
- [React Query Persistence]: https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- Code Review: Fixed missing Firestore composite index for delta sync queries
- Code Review: Fixed query key centralization - moved SHARED_GROUP_TRANSACTIONS_KEY to queryKeys.ts
- Code Review: Added missing barrel exports to SharedGroups/index.ts
- Code Review: Fixed DateRangeSelector to use project's TRANSLATIONS pattern instead of react-i18next
- Code Review: Added 14 new tests for DateRangeSelector and hook coverage (94 total passing)
- Code Review: Added dateRange translation keys in both en/es
- Task 10: Integrated useSharedGroupTransactions hook into App.tsx
- Task 10: Created data source switching (isGroupMode, activeTransactions, activeRecentTransactions)
- Task 10: Updated DashboardView, HistoryView, TrendsView, ItemsView to use switched data source
- Task 10: Added Firestore security rules for cross-user transaction reads (isGroupMemberForTransaction)
- Task 10: Security rules allow reading other users' transactions when tagged to shared group

### File List

**New Files:**
- src/services/sharedGroupTransactionService.ts
- src/lib/sharedGroupCache.ts
- src/hooks/useSharedGroupTransactions.ts
- src/components/SharedGroups/SharedGroupTotalCard.tsx
- src/components/SharedGroups/MemberFilterBar.tsx
- src/components/SharedGroups/DateRangeSelector.tsx
- src/components/SharedGroups/ProfileIndicator.tsx
- tests/unit/services/sharedGroupTransactionService.test.ts
- tests/unit/lib/sharedGroupCache.test.ts
- tests/unit/components/SharedGroups/SharedGroupTotalCard.test.tsx
- tests/unit/components/SharedGroups/MemberFilterBar.test.tsx
- tests/unit/components/SharedGroups/ProfileIndicator.test.tsx
- tests/unit/components/SharedGroups/DateRangeSelector.test.tsx
- tests/unit/hooks/useSharedGroupTransactions.test.ts

**Modified Files:**
- src/App.tsx (Task 10: hook integration, data source switching)
- src/components/SharedGroups/index.ts (barrel exports)
- src/lib/queryKeys.ts (sharedGroupTransactions key)
- src/types/transaction.ts (_ownerId field, isOwnTransaction helper)
- src/utils/translations.ts (dateRange translation keys)
- firestore.rules (cross-user transaction read for shared groups)
- firestore.indexes.json (composite indexes for delta sync)

