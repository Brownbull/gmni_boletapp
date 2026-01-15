# Story 14c.5: Shared Group Transactions View

Status: ready-for-dev

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

- [ ] Task 1: Create Multi-Member Query Service (AC: #1, #2)
  - [ ] 1.1 Create `src/services/sharedGroupTransactionService.ts`
  - [ ] 1.2 Implement `fetchSharedGroupTransactions(db, appId, groupId, members[], options)`
  - [ ] 1.3 Execute parallel queries per member using `Promise.all()`
  - [ ] 1.4 Implement client-side merge and sort by date
  - [ ] 1.5 Handle pagination for each member query
  - [ ] 1.6 Add date range filtering to queries

- [ ] Task 2: Set Up IndexedDB Schema (AC: #3, #9)
  - [ ] 2.1 Create `src/lib/sharedGroupCache.ts`
  - [ ] 2.2 Define IndexedDB schema: `sharedGroupTransactions` store
  - [ ] 2.3 Create indexes: `by-group-id`, `by-date`, `by-cached-at`
  - [ ] 2.4 Implement `openSharedGroupDB()` - open/create database
  - [ ] 2.5 Implement `writeToCache(groupId, transactions[])`
  - [ ] 2.6 Implement `readFromCache(groupId, dateRange)`
  - [ ] 2.7 Implement LRU eviction when limit exceeded

- [ ] Task 3: Implement Delta Sync Logic (AC: #4)
  - [ ] 3.1 Store `lastSyncTimestamp` per group in IndexedDB metadata
  - [ ] 3.2 Implement `getChangedMembers(group, lastSync)` - check memberUpdates
  - [ ] 3.3 Implement `fetchDeltaUpdates(db, appId, groupId, members[], since)`
  - [ ] 3.4 Merge delta results into existing cache
  - [ ] 3.5 Update lastSyncTimestamp after successful sync

- [ ] Task 4: Create React Query Integration (AC: #5)
  - [ ] 4.1 Create `src/hooks/useSharedGroupTransactions.ts`
  - [ ] 4.2 Implement cache-first loading: IndexedDB → display → Firestore fetch
  - [ ] 4.3 Configure React Query with appropriate staleTime/gcTime
  - [ ] 4.4 Add query key pattern: `['sharedGroupTransactions', groupId, dateRange]`
  - [ ] 4.5 Implement background refetch strategy
  - [ ] 4.6 Handle cache invalidation on member changes

- [ ] Task 5: Create Combined Total Component (AC: #6)
  - [ ] 5.1 Create `SharedGroupTotalCard.tsx` - displays total spending
  - [ ] 5.2 Calculate total from merged transactions
  - [ ] 5.3 Show currency formatting (handle single currency for MVP)
  - [ ] 5.4 Update total when date range changes

- [ ] Task 6: Implement Member Filter UI (AC: #7)
  - [ ] 6.1 Create `MemberFilterBar.tsx` - avatar toggle buttons
  - [ ] 6.2 Fetch member profiles for display names/avatars
  - [ ] 6.3 Filter transactions client-side when member selected
  - [ ] 6.4 Support multi-select (show multiple members)
  - [ ] 6.5 "All" option to reset filter

- [ ] Task 7: Implement Date Range Filter (AC: #8)
  - [ ] 7.1 Add date range selector to shared group views
  - [ ] 7.2 Default to current month
  - [ ] 7.3 Enforce 12-month maximum range
  - [ ] 7.4 Re-query when date range changes

- [ ] Task 8: Storage Strategy Fallback (AC: #3)
  - [ ] 8.1 Implement `useStorageStrategy()` hook to detect IndexedDB support
  - [ ] 8.2 Fall back to React Query in-memory if IndexedDB unavailable
  - [ ] 8.3 Show toast warning for degraded offline support

- [ ] Task 9: Component Tests
  - [ ] 9.1 Test multi-member query merges correctly
  - [ ] 9.2 Test IndexedDB cache read/write
  - [ ] 9.3 Test delta sync only fetches changed data
  - [ ] 9.4 Test LRU eviction at 50K records
  - [ ] 9.5 Test member filter functionality
  - [ ] 9.6 Test date range filter enforcement

## Dev Notes

### Architecture Context

**Query Strategy:** Parallel queries per member, client-side merge
- Firestore doesn't support cross-collection queries
- Query each member's transactions with `array-contains` filter
- Merge results client-side sorted by date

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

{{agent_model_name_version}}

### Completion Notes List

### File List

