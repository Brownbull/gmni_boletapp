# Tech Debt Story TD-14d-30: Extract Transaction Merging Logic to Shared Utility

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-10d
> **Priority:** MEDIUM (DRY violation, code duplication)
> **Estimated Effort:** 1-2 hours
> **Risk:** Low (refactoring with tests)

## Story

As a **developer**,
I want **the transaction merging logic extracted to a shared utility**,
So that **code duplication is eliminated and maintenance is simplified**.

## Problem Statement

The ECC Code Review identified duplicated transaction merging logic in two view data hooks:

**Duplicated in:**
- `src/views/HistoryView/useHistoryViewData.ts:247-260`
- `src/views/DashboardView/useDashboardViewData.ts:212-225`

```typescript
// Duplicated pattern:
const transactionsWithRecentScans = useMemo(() => {
  if (!recentScans?.length) return paginatedTransactions;
  const recentIds = new Set(recentScans.filter((s) => s.id).map((s) => s.id));
  const filteredPaginated = paginatedTransactions.filter(
    (tx) => tx.id && !recentIds.has(tx.id)
  );
  return [...recentScans, ...filteredPaginated];
}, [paginatedTransactions, recentScans]);
```

This violates the DRY principle and creates risk of divergence if one location is updated but not the other.

## Acceptance Criteria

1. **Given** a new utility function `mergeTransactionsWithRecentScans`
   **When** called with paginated transactions and recent scans
   **Then** it returns merged array with duplicates removed (preferring recentScans)

2. **Given** useHistoryViewData and useDashboardViewData
   **When** they need to merge transactions
   **Then** they both use the shared utility function

3. **Given** the utility function
   **When** tested with various edge cases
   **Then** all edge cases pass (empty arrays, null ids, overlapping ids)

## Tasks / Subtasks

- [ ] Task 1: Create shared utility function
  - [ ] Create `src/utils/mergeTransactions.ts`
  - [ ] Implement `mergeTransactionsWithRecentScans(paginated, recentScans)`
  - [ ] Add JSDoc with examples
  - [ ] Export from utils barrel

- [ ] Task 2: Add comprehensive tests
  - [ ] Create `tests/unit/utils/mergeTransactions.test.ts`
  - [ ] Test: empty recentScans returns paginated unchanged
  - [ ] Test: removes duplicates by id
  - [ ] Test: handles null/undefined ids gracefully
  - [ ] Test: preserves order (recentScans first)
  - [ ] Test: handles empty paginated array

- [ ] Task 3: Refactor useHistoryViewData
  - [ ] Import shared utility
  - [ ] Replace inline useMemo logic with utility call
  - [ ] Verify existing tests pass

- [ ] Task 4: Refactor useDashboardViewData
  - [ ] Import shared utility
  - [ ] Replace inline useMemo logic with utility call
  - [ ] Verify existing tests pass

## Dev Notes

### Proposed Implementation

```typescript
// src/utils/mergeTransactions.ts
import type { Transaction } from '@/types/transaction';

/**
 * Merges recent scans with paginated transactions, removing duplicates.
 * Recent scans take precedence (appear first, duplicates removed from paginated).
 *
 * @example
 * const merged = mergeTransactionsWithRecentScans(paginated, recentScans);
 */
export function mergeTransactionsWithRecentScans(
  paginatedTransactions: Transaction[],
  recentScans: Transaction[] | undefined
): Transaction[] {
  if (!recentScans?.length) return paginatedTransactions;

  const recentIds = new Set(
    recentScans.filter((s) => s.id).map((s) => s.id)
  );

  const filteredPaginated = paginatedTransactions.filter(
    (tx) => tx.id && !recentIds.has(tx.id)
  );

  return [...recentScans, ...filteredPaginated];
}
```

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/utils/mergeTransactions.ts` | Create | Shared utility |
| `tests/unit/utils/mergeTransactions.test.ts` | Create | Unit tests |
| `src/views/HistoryView/useHistoryViewData.ts` | Modify | Use shared utility |
| `src/views/DashboardView/useDashboardViewData.ts` | Modify | Use shared utility |

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Merge conflict risk** | Low | Increases if more hooks added |
| **Context window fit** | Easy | Easy |
| **Sprint capacity** | 1-2 hrs | Scheduled later |
| **Accumulation risk** | Medium - may diverge | Higher over time |
| **Dependency risk** | None | None |

**Recommendation:** Medium priority - Fix during next refactor or when touching these hooks.

### References

- [14d-v2-1-10d-data-filtering-integration.md](./14d-v2-1-10d-data-filtering-integration.md) - Source story
- ECC Parallel Code Review 2026-02-04 - Code Reviewer agent
