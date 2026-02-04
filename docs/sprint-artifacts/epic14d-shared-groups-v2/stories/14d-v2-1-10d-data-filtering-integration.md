# Story 14d-v2-1.10d: Data Filtering Integration

Status: ready-for-dev

## Story

As a **user**,
I want **all views to show data filtered by my selected view mode**,
So that **Personal mode shows only my transactions and Group mode shows only group transactions**.

## Context

This is the fourth and final sub-story split from the original Story 14d-v2-1.10.

This story implements the data filtering logic across all views (Home, History, Analytics) and handles filter clearing when switching modes.

## Acceptance Criteria

### Core Functionality

1. **Given** I am in Personal mode
   **When** I view Home, History, or Analytics
   **Then** I see only my personal transactions (no `sharedGroupId` filter)

2. **Given** I am in Group mode with group "Family"
   **When** I view Home, History, or Analytics
   **Then** I see only transactions with `sharedGroupId === 'family-group-id'`

3. **Given** I am viewing History with filters applied (date range, category)
   **When** I switch from Personal to Group mode
   **Then** my filters are cleared
   **And** I see the group's unfiltered transactions

4. **Given** I am on Analytics in Personal mode
   **When** I switch to Group mode
   **Then** the charts re-render with group-filtered data
   **And** spending breakdowns reflect only group transactions

5. **Given** I switch view modes
   **When** the mode changes
   **Then** filters are cleared but scroll position is preserved

## Dependencies

### Upstream (Required First)
- **Story 14d-v2-1.10c:** Header indicator (user can switch modes)
- **Story 14d-v2-1.2:** Transaction type has `sharedGroupId` field

### Downstream (Depends on This)
- **Story 14d-v2-2.1:** Tag Transaction to Group (needs mode context)
- **Story 14d-v2-2.2:** View Group Transactions (builds on filtering)

## Tasks / Subtasks

- [ ] Task 1: Update useTransactions hook for view mode filtering (AC: #1, #2)
  - [ ] Import `useViewModeStore` to get current mode and groupId
  - [ ] Modify Firestore query:
    ```typescript
    const baseQuery = query(transactionsRef, ...);
    if (isGroupMode && groupId) {
      return query(baseQuery, where('sharedGroupId', '==', groupId));
    }
    return baseQuery; // Personal mode - no group filter
    ```
  - [ ] Add `groupId` to query key for proper cache invalidation

- [ ] Task 2: Update Analytics data hooks (AC: #4)
  - [ ] Modify analytics aggregation queries to include `sharedGroupId` filter
  - [ ] Invalidate React Query cache on mode switch
  - [ ] Ensure TrendsView, DashboardView respect view mode

- [ ] Task 3: Update History filtering (AC: #2)
  - [ ] HistoryFiltersContext should include view mode state
  - [ ] Add `sharedGroupId` to filter criteria when in group mode
  - [ ] Ensure filter UI doesn't show group-related options (groups filter themselves)

- [ ] Task 4: Implement filter clear on mode switch (AC: #3, #5)
  - [ ] In `setGroupMode` and `setPersonalMode` actions, dispatch filter clear
  - [ ] Option A: Add callback param to store actions
  - [ ] Option B: Use Zustand subscribe to watch mode changes
  - [ ] Clear: temporal, category, location filters
  - [ ] Preserve: Scroll position

- [ ] Task 5: Implement React Query cache invalidation (AC: #4)
  - [ ] On mode switch, invalidate relevant query keys:
    - `['transactions']`
    - `['analytics']`
    - `['spending']`
  - [ ] Use `queryClient.invalidateQueries()` in mode switch handler

- [ ] Task 6: Add integration tests (AC: #1-5)
  - [ ] Test Home view filters by mode
  - [ ] Test History view filters by mode
  - [ ] Test Analytics re-renders on mode switch
  - [ ] Test filter clear on mode switch
  - [ ] Test scroll position preserved

## Dev Notes

### Data Filtering Pattern

```typescript
// In useTransactions or similar
import { useViewModeStore } from '@/shared/stores';

export function useTransactions(filters?: TransactionFilters) {
  const mode = useViewModeStore((state) => state.mode);
  const groupId = useViewModeStore((state) => state.groupId);
  const isGroupMode = mode === 'group';

  return useQuery({
    queryKey: ['transactions', filters, isGroupMode ? groupId : 'personal'],
    queryFn: async () => {
      let q = query(
        collection(db, 'users', userId, 'transactions'),
        orderBy('date', 'desc')
      );

      // Apply view mode filter
      if (isGroupMode && groupId) {
        q = query(q, where('sharedGroupId', '==', groupId));
      }

      // Apply other filters...
      if (filters?.startDate) {
        q = query(q, where('date', '>=', filters.startDate));
      }

      return getDocs(q);
    },
  });
}
```

### Filter Clear on Mode Switch

Option A - Callback parameter:
```typescript
// In useViewModeStore
setGroupMode: (groupId, group, clearFilters) => {
  set({ mode: 'group', groupId, group });
  clearFilters?.();
},
```

Option B - Zustand subscribe:
```typescript
// In App.tsx or filters context
useEffect(() => {
  const unsubscribe = useViewModeStore.subscribe(
    (state) => state.mode,
    (mode, prevMode) => {
      if (mode !== prevMode) {
        resetFilters();
      }
    }
  );
  return unsubscribe;
}, []);
```

### Query Invalidation

```typescript
// When mode switches
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const handleModeSwitch = () => {
  // Invalidate all transaction-related queries
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['analytics'] });
  queryClient.invalidateQueries({ queryKey: ['spending'] });
};
```

### Important: New Transactions NOT Auto-Tagged

Per the architecture alignment plan, switching to Group mode only affects **viewing**. New transactions scanned while in Group mode are NOT automatically tagged to the group. Story 14d-v2-2.1 implements explicit tagging via the `sharedGroupId` field.

### File Locations

| File | Purpose |
|------|---------|
| `src/hooks/useTransactions.ts` | Main query hook |
| `src/contexts/HistoryFiltersContext.tsx` | Filter state |
| `src/contexts/AnalyticsContext.tsx` | Analytics data |
| `src/views/HomeView/` | Home transaction list |
| `src/views/HistoryView/` | History with filters |
| `src/views/TrendsView/` | Analytics charts |

### Estimate

~3 story points

## References

- [Story 14d-v2-1.10c: Header Indicator](./14d-v2-1-10c-header-mode-indicator.md)
- [Original Story 14d-v2-1.10](./14d-v2-1-10-view-mode-switcher.md)
- [Architecture Alignment Plan - Workflow Integration](../14d-v2-architecture-alignment-plan.md#workflow-integration-notes)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

