# Story 14.27: Transaction Pagination & Lazy Loading

## Status: Code Review Complete

> **Implementation completed:** 2026-01-07
> **Code review completed:** 2026-01-07 (Atlas-enhanced)
>
> **Implementation approach:** Created `usePaginatedTransactions` hook using React Query's `useInfiniteQuery` with Firestore cursor pagination (`startAfter`). HistoryView shows "Load more" button when at listener limit (100 transactions).
>
> **Key changes:**
> - `src/services/firestore.ts` - Added `getTransactionPage()` with cursor pagination
> - `src/hooks/usePaginatedTransactions.ts` - New hook combining real-time + paginated data
> - `src/lib/queryKeys.ts` - Added `transactionsPaginated` query key
> - `src/views/HistoryView.tsx` - Added "Load more" button and pagination props
> - `src/App.tsx` - Integrated `usePaginatedTransactions` for HistoryView
>
> **Tests added (Code Review):**
> - `tests/unit/hooks/usePaginatedTransactions.test.tsx` - 12 tests
> - `tests/unit/services/firestore.getTransactionPage.test.ts` - 14 tests
> - `tests/unit/lib/queryKeys.test.ts` - 19 tests

## Overview
Implement pagination for transaction history to support unlimited transaction growth while keeping memory usage and Firestore reads efficient.

## User Story
As a user with many transactions, I want the app to load my transaction history efficiently so that performance stays fast and I don't consume excessive data.

## Problem Statement

### Current Behavior
- All transactions loaded at once via real-time listener
- User with 1000 transactions = 1000 documents in memory
- Every transaction update = full collection re-read
- HistoryView renders all transactions (performance degrades)

### Target Behavior
- Load recent 100 transactions initially (via listener)
- Paginated loading for full history (on-demand)
- Smooth infinite scroll in HistoryView
- Cache older transactions to reduce re-fetching

---

## Acceptance Criteria

### AC #1: Initial Load Optimization
- [x] App loads only 100 most recent transactions on startup (Story 14.25)
- [x] Sufficient for dashboard insights (recent spending patterns)
- [x] Quick Save mappings work (mappings separate from transactions)
- [x] User sees "Load more" button for older transactions

### AC #2: History View Pagination
- [x] HistoryView loads transactions in pages of 50 (PAGINATION_PAGE_SIZE)
- [x] "Load more" button triggers next page load
- [x] Loading indicator during page fetch (Loader2 spinner)
- [x] Smooth scroll experience (no jumps) - existing client-side pagination
- [x] "End of history" indicator at end

### AC #3: Insights Calculation
- [x] Dashboard insights calculate from available transactions (100 recent)
- [x] TrendsView works with limited data (sufficient for recent patterns)
- [x] React Query caching reused when possible (5min stale, 30min gc)
- [N/A] Date range filters trigger appropriate queries (DEFERRED - not needed for MVP)

### AC #4: Memory Management
- [x] React Query handles cache management (gcTime: 30min)
- [N/A] Transaction list virtualized in HistoryView (DEFERRED - react-window v2 API changed; performance acceptable without virtualization for expected data sizes)
- [x] No performance degradation expected with pagination limiting loaded data

### AC #5: Offline Support
- [x] Firestore SDK handles offline caching automatically
- [x] New transactions sync when online (real-time listener)
- [x] Pagination works offline (from Firestore cache)

---

## Technical Design

### Data Flow Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Real-Time Listener (limit 100)     Paginated Fetch              │
│   ┌─────────────────────────────┐   ┌────────────────────────┐    │
│   │ Recent 100 transactions     │   │ On-demand older pages  │    │
│   │ - Live updates              │   │ - startAfter(lastDoc)  │    │
│   │ - Dashboard/Quick Save      │   │ - HistoryView scroll   │    │
│   └─────────────────────────────┘   └────────────────────────┘    │
│                  │                            │                   │
│                  └──────────┬─────────────────┘                   │
│                             ▼                                     │
│              ┌─────────────────────────────┐                      │
│              │   Combined Transaction      │                      │
│              │   State (useTransactions)   │                      │
│              └─────────────────────────────┘                      │
│                             │                                     │
│              ┌──────────────┼──────────────┐                      │
│              ▼              ▼              ▼                      │
│         Dashboard      HistoryView    TrendsView                  │
└─────────────────────────────────────────────────────────────────┘
```

### useTransactions Hook Enhancement
```typescript
interface UseTransactionsReturn {
  // Existing
  transactions: Transaction[];        // All loaded transactions
  loading: boolean;
  error: Error | null;

  // New pagination
  hasMore: boolean;                   // More pages available
  loadingMore: boolean;               // Fetching next page
  loadMore: () => Promise<void>;      // Fetch next page
  totalLoaded: number;                // Count of loaded transactions

  // Filtering (for insights)
  getByDateRange: (start: Date, end: Date) => Transaction[];
  getByMonth: (year: number, month: number) => Transaction[];
}
```

### Pagination State
```typescript
interface PaginationState {
  lastDoc: DocumentSnapshot | null;   // Cursor for next page
  hasMore: boolean;                   // More data available
  loadingMore: boolean;               // Currently fetching
  pageSize: number;                   // Items per page (50)
}
```

### HistoryView Integration
```typescript
// Using react-window for virtualization
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

function HistoryView({ transactions, hasMore, loadMore, loadingMore }) {
  const itemCount = hasMore ? transactions.length + 1 : transactions.length;

  const isItemLoaded = (index: number) =>
    !hasMore || index < transactions.length;

  const loadMoreItems = loadingMore ? () => {} : loadMore;

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount}
      loadMoreItems={loadMoreItems}
    >
      {({ onItemsRendered, ref }) => (
        <FixedSizeList
          ref={ref}
          height={windowHeight}
          itemCount={itemCount}
          itemSize={80}
          onItemsRendered={onItemsRendered}
        >
          {Row}
        </FixedSizeList>
      )}
    </InfiniteLoader>
  );
}
```

---

## Tasks

### Phase 1: usePaginatedTransactions Hook (COMPLETED)
- [x] Task 1.1: Created `usePaginatedTransactions` hook with pagination state
- [x] Task 1.2: Implemented `getTransactionPage()` with Firestore cursor pagination
- [x] Task 1.3: Merged paginated results with real-time listener results
- [x] Task 1.4: Deduplication logic handles real-time updates

### Phase 2: HistoryView Pagination (COMPLETED)
- [x] Task 2.1: Installed react-window and react-window-infinite-loader
- [x] Task 2.2: Added "Load more" button to HistoryView pagination controls
- [x] Task 2.3: Load more button appears when at listener limit + last page
- [x] Task 2.4: Styled loading indicator and "End of history" indicator

### Phase 3: Insights Integration (VERIFIED)
- [x] Task 3.1: TrendsView uses real-time listener data (100 recent - sufficient)
- [x] Task 3.2: React Query caching with 5min stale time, 30min gc
- [ ] Task 3.3: Date range query for specific months/years (future)
- [N/A] Task 3.4: UX handled by "Load more" button in HistoryView

### Phase 4: Performance Optimization (COMPLETED)
- [x] Task 4.1: Dev-mode logging for pagination state monitoring
- [x] Task 4.2: React Query gcTime handles page unloading (30min)
- [x] Task 4.3: Added console logging in development mode
- [ ] Task 4.4: Virtualization deferred (react-window v2 API changed)

### Phase 5: Testing (COMPLETED)
- [x] Task 5.1: TypeScript compiles without errors
- [x] Task 5.2: Production build succeeds
- [x] Task 5.3: Existing HistoryView tests pass
- [x] Task 5.4: Unit tests for pagination functionality (45 tests added)
  - `usePaginatedTransactions.test.tsx` - 12 tests
  - `firestore.getTransactionPage.test.ts` - 14 tests
  - `queryKeys.test.ts` - 19 tests

---

## Dependencies
- Story 14.25 (Listener Limits) - ✅ COMPLETED
- Story 14.29 (React Query Migration) - ✅ COMPLETED - Use `useInfiniteQuery` pattern
- react-window package (to be installed)

## Estimated Effort
- **Size**: Large (5-8 points)
- **Risk**: Medium - UI changes and state management complexity

---

## New Dependencies to Install

```bash
npm install react-window react-window-infinite-loader
npm install -D @types/react-window
```

---

## Migration Path

1. **Phase 1**: Add pagination to hook (no UI changes yet)
2. **Phase 2**: Enable virtualized list in HistoryView
3. **Phase 3**: Update insights to work with paginated data
4. **Phase 4**: Optional - aggressive memory optimization

---

## Resume Prompt for New Session
```
Continue implementing Story 14.27: Transaction Pagination & Lazy Loading.

Read the story at `docs/sprint-artifacts/epic14/stories/story-14.27-transaction-pagination.md`.

**Prerequisites:**
- Story 14.25 should be completed first (listener limits)
- Install: npm install react-window react-window-infinite-loader @types/react-window

**Key files to modify:**
- `src/hooks/useTransactions.ts` - Add pagination state and loadMore()
- `src/services/firestore.ts` - Add getTransactionPage() function
- `src/views/HistoryView.tsx` - Implement virtualized infinite scroll

**Priority**: Medium - builds on Story 14.25 for full optimization
```
