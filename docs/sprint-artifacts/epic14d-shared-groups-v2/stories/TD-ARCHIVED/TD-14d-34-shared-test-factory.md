# Tech Debt Story TD-14d-34: Extract Test Factory Functions to Shared Utility

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-10d
> **Priority:** MEDIUM (DRY violation, test maintainability)
> **Estimated Effort:** 2-3 hours
> **Risk:** Low (test-only changes)

## Story

As a **developer**,
I want **test transaction factories extracted to a shared utility**,
So that **test setup is consistent and changes are made in one place**.

## Problem Statement

The ECC TDD Guide Review identified duplicate test factory patterns across multiple test files:

**Duplicate `createTestTransaction` factory in:**
- `tests/unit/utils/viewModeFilterUtils.test.ts`
- `tests/unit/views/HistoryView/useHistoryViewData.viewMode.test.tsx`
- `tests/unit/views/DashboardView/useDashboardViewData.viewMode.test.tsx`
- `tests/unit/views/TrendsView/useTrendsViewData.viewMode.test.tsx`
- `tests/unit/contexts/HistoryFiltersContext.viewModeSync.test.tsx` (similar `createFilteredState`)

Each file defines its own factory with slightly different implementations, making it hard to maintain consistency when the `Transaction` type changes.

## Acceptance Criteria

1. **Given** a shared test factory utility
   **When** tests need mock transactions
   **Then** they import from `tests/helpers/factories`

2. **Given** a `createTestTransaction` factory
   **When** called with partial overrides
   **Then** it returns a valid Transaction with defaults for all fields

3. **Given** all affected test files
   **When** refactored to use shared factory
   **Then** all tests still pass

4. **Given** the Transaction type changes
   **When** updating the factory
   **Then** only one file needs to be modified

## Tasks / Subtasks

- [ ] Task 1: Create shared test factories
  - [ ] Create `tests/helpers/factories/index.ts`
  - [ ] Create `tests/helpers/factories/transaction.ts`
  - [ ] Implement `createTestTransaction(overrides?: Partial<Transaction>): Transaction`
  - [ ] Add comprehensive defaults for all Transaction fields

- [ ] Task 2: Add additional factories as needed
  - [ ] `createTestSharedGroup(overrides?: Partial<SharedGroup>): SharedGroup`
  - [ ] `createTestTimestamp(daysAgo: number): Timestamp` (already exists in some tests)

- [ ] Task 3: Refactor affected test files
  - [ ] `tests/unit/utils/viewModeFilterUtils.test.ts`
  - [ ] `tests/unit/views/HistoryView/useHistoryViewData.viewMode.test.tsx`
  - [ ] `tests/unit/views/DashboardView/useDashboardViewData.viewMode.test.tsx`
  - [ ] `tests/unit/views/TrendsView/useTrendsViewData.viewMode.test.tsx`
  - [ ] `tests/unit/contexts/HistoryFiltersContext.viewModeSync.test.tsx`

- [ ] Task 4: Verify all tests pass
  - [ ] Run `npm test` for affected files
  - [ ] Run full test suite

## Dev Notes

### Proposed Implementation

```typescript
// tests/helpers/factories/transaction.ts
import type { Transaction, StoreCategory } from '@/types/transaction';

const DEFAULT_TRANSACTION: Transaction = {
  id: 'default-id',
  userId: 'test-user-id',
  date: '2026-01-22',
  merchant: 'Test Merchant',
  total: 100,
  currency: 'CLP',
  category: 'Supermercado' as StoreCategory,
  items: [],
  images: [],
  isQuickSave: false,
  confidence: 100,
  scannedAt: null,
  editedAt: null,
  deletedAt: null,
  sharedGroupId: null,
};

/**
 * Creates a test transaction with defaults that can be overridden.
 *
 * @example
 * // Personal transaction
 * const tx = createTestTransaction({ id: 'tx-1' });
 *
 * // Group transaction
 * const groupTx = createTestTransaction({
 *   id: 'tx-2',
 *   sharedGroupId: 'group-123'
 * });
 */
export function createTestTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  return {
    ...DEFAULT_TRANSACTION,
    ...overrides,
  };
}

/**
 * Creates multiple test transactions with sequential IDs.
 */
export function createTestTransactions(
  count: number,
  overrides?: Partial<Transaction>
): Transaction[] {
  return Array.from({ length: count }, (_, i) =>
    createTestTransaction({
      id: `tx-${i + 1}`,
      ...overrides,
    })
  );
}
```

```typescript
// tests/helpers/factories/index.ts
export * from './transaction';
export * from './sharedGroup';
export * from './timestamp';
```

### Usage in Tests

```typescript
// Before (duplicated in each file)
const createTestTransaction = (id, sharedGroupId) => ({
  id,
  // ... 15 lines of defaults
});

// After (shared factory)
import { createTestTransaction } from '@/tests/helpers/factories';

const personalTx = createTestTransaction({ id: 'tx-1' });
const groupTx = createTestTransaction({ id: 'tx-2', sharedGroupId: 'group-123' });
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `tests/helpers/factories/index.ts` | Create | Barrel export |
| `tests/helpers/factories/transaction.ts` | Create | Transaction factory |
| `tests/helpers/factories/sharedGroup.ts` | Create | SharedGroup factory |
| `tests/helpers/factories/timestamp.ts` | Create | Timestamp helper |
| Multiple test files | Modify | Use shared factories |

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Maintainability** | Single source | Multiple copies drift |
| **Merge conflict risk** | Medium - many files | Low per change |
| **Context window fit** | 2-3 hrs | 2-3 hrs |
| **Sprint capacity** | 2-3 hrs | Scheduled later |
| **Accumulation risk** | Medium - grows with tests | Higher over time |

**Recommendation:** Medium priority - Do before adding more view mode tests or when Transaction type changes.

### References

- [14d-v2-1-10d-data-filtering-integration.md](./14d-v2-1-10d-data-filtering-integration.md) - Source story
- ECC Parallel Code Review 2026-02-04 - TDD Guide agent
- Atlas 05-testing.md - Testing patterns
