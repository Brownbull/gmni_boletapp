# Story 14d-v2.1.2: Transaction Type Migration

Status: split

> **SPLIT 2026-02-01:** 6 tasks, 35 subtasks exceeded sizing limits (max 4 tasks, 15 subtasks)
> Split into 3 sub-stories:
> - [14d-v2-1-2a](14d-v2-1-2a-transaction-types-periods.md) - Types + Period Utility (2 tasks, 17 subtasks)
> - [14d-v2-1-2b](14d-v2-1-2b-transaction-service-layer.md) - Service Layer (2 tasks, 10 subtasks)
> - [14d-v2-1-2c](14d-v2-1-2c-transaction-queries-tests.md) - Queries + Tests (2 tasks, 8 subtasks)

## Story

As a **user**,
I want **my transactions to support sharing with a single group**,
So that **I can tag expenses to shared groups with simpler, more reliable sync**.

## Acceptance Criteria

### Core Requirements (from Epic)

1. **Given** the Transaction type exists
   **When** this story is completed
   **Then** the Transaction type includes:
   - `sharedGroupId: string | null` (single group, not array)
   - `deletedAt: Timestamp | null` (soft delete)
   - `deletedBy: string | null` (who deleted)
   - `updatedAt: Timestamp` (update on EVERY change)
   - `version: number` (optimistic concurrency)
   - `periods: { day: string, week: string, month: string, quarter: string, year: string }` (pre-computed)

2. **Given** the old `sharedGroupIds: string[]` array field exists
   **When** this migration is complete
   **Then** `sharedGroupIds` array field is REMOVED from the type definition

3. **Given** a transaction is saved (new or update)
   **When** the Firestore save/update functions execute
   **Then** `updatedAt` is populated automatically with current timestamp
   **And** `periods` is computed from transaction `date` field

4. **Given** a transaction is created for the first time
   **When** the save completes
   **Then** `version` is set to `1`

5. **Given** a transaction is updated
   **When** the update completes
   **Then** `version` is incremented by 1

6. **Given** existing transactions without new fields are loaded
   **When** they are displayed or processed
   **Then** they are handled gracefully with sensible defaults:
   - `sharedGroupId`: `null`
   - `deletedAt`: `null`
   - `deletedBy`: `null`
   - `updatedAt`: falls back to `createdAt` or current time
   - `version`: `1`
   - `periods`: computed on-the-fly if missing

### Atlas-Suggested Additional Criteria

7. **Given** existing transactions without new fields exist in Firestore
   **When** they are loaded by the app
   **Then** they display correctly in transaction lists without errors

8. **Given** a mix of old and new format transactions
   **When** they are displayed in History/Home views
   **Then** all transactions render correctly regardless of field presence

9. **Given** the `computePeriods()` utility function
   **When** called with any valid transaction date
   **Then** it correctly computes day, week, month, quarter, and year strings
   **And** handles edge cases (year boundaries, week 53, leap years)

10. **Given** a transaction has `deletedAt` set (soft deleted)
    **When** normal transaction queries execute
    **Then** soft-deleted transactions are excluded from results

## Tasks / Subtasks

- [ ] **Task 1: Update Transaction Type Definition** (AC: #1, #2)
  - [ ] 1.1: Add `sharedGroupId: string | null` field
  - [ ] 1.2: Add `deletedAt: Timestamp | null` field
  - [ ] 1.3: Add `deletedBy: string | null` field
  - [ ] 1.4: Ensure `updatedAt: Timestamp` exists (verify or add)
  - [ ] 1.5: Add `version: number` field
  - [ ] 1.6: Add `periods` interface and field
  - [ ] 1.7: Remove `sharedGroupIds: string[]` array field
  - [ ] 1.8: Update JSDoc comments explaining each field's purpose

- [ ] **Task 2: Create computePeriods Utility** (AC: #3, #9)
  - [ ] 2.1: Create `src/utils/periodUtils.ts`
  - [ ] 2.2: Implement `computePeriods(date: string): TransactionPeriods`
  - [ ] 2.3: Compute `day` as YYYY-MM-DD
  - [ ] 2.4: Compute `week` as YYYY-Www (ISO week number)
  - [ ] 2.5: Compute `month` as YYYY-MM
  - [ ] 2.6: Compute `quarter` as YYYY-Qn
  - [ ] 2.7: Compute `year` as YYYY
  - [ ] 2.8: Handle edge cases (week 53, year boundaries)
  - [ ] 2.9: Add comprehensive unit tests (15+ test cases)

- [ ] **Task 3: Update Firestore Save Functions** (AC: #3, #4, #5)
  - [ ] 3.1: Update `saveTransaction()` to auto-populate `updatedAt`
  - [ ] 3.2: Update `saveTransaction()` to compute and set `periods`
  - [ ] 3.3: Update `saveTransaction()` to set `version: 1` for new transactions
  - [ ] 3.4: Update `updateTransaction()` to increment `version`
  - [ ] 3.5: Update `updateTransaction()` to refresh `updatedAt`
  - [ ] 3.6: Update `updateTransaction()` to recompute `periods` if date changed

- [ ] **Task 4: Add Default Value Handling** (AC: #6, #7, #8)
  - [ ] 4.1: Create `normalizeTransaction()` utility for consistent defaults
  - [ ] 4.2: Apply defaults when loading from Firestore
  - [ ] 4.3: Ensure transaction lists handle missing fields gracefully
  - [ ] 4.4: Add unit tests for normalization with various field combinations

- [ ] **Task 5: Update Transaction Queries** (AC: #10)
  - [ ] 5.1: Review existing query functions in `firestore.ts`
  - [ ] 5.2: Add `deletedAt == null` filter to active transaction queries
  - [ ] 5.3: Ensure subscription queries exclude soft-deleted transactions
  - [ ] 5.4: Add tests for query behavior with soft-deleted transactions

- [ ] **Task 6: Update Tests and Mocks** (AC: all)
  - [ ] 6.1: Update transaction mock factories with new fields
  - [ ] 6.2: Update existing unit tests that create Transaction objects
  - [ ] 6.3: Add integration tests for save/update with new fields
  - [ ] 6.4: Verify existing E2E tests still pass

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **AD-1** | Single `sharedGroupId` (not array) | Eliminates `array-contains` query limitations |
| **AD-8** | Soft delete with `deletedAt`, `updatedAt`, `version` | Enables changelog tracking |
| **AD-5** | Pre-computed `periods` field | Enables efficient temporal queries |

### Current Transaction Type Fields to Change

**Current fields (from `src/types/transaction.ts`):**
```typescript
// REMOVE this field:
sharedGroupIds?: string[];  // Epic 14c - was array, now single

// KEEP these (already exist):
deletedAt?: any;  // Already exists for soft delete
updatedAt?: any;  // Already exists

// ADD these new fields:
sharedGroupId?: string | null;  // Single group (AD-1)
deletedBy?: string | null;      // Who deleted
version?: number;               // Optimistic concurrency
periods?: TransactionPeriods;   // Pre-computed (AD-5)
```

### TransactionPeriods Interface

```typescript
export interface TransactionPeriods {
  day: string;      // YYYY-MM-DD (e.g., "2026-01-22")
  week: string;     // YYYY-Www (e.g., "2026-W04")
  month: string;    // YYYY-MM (e.g., "2026-01")
  quarter: string;  // YYYY-Qn (e.g., "2026-Q1")
  year: string;     // YYYY (e.g., "2026")
}
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/transaction.ts` | Add new fields, remove `sharedGroupIds` |
| `src/services/firestore.ts` | Update save/update functions |
| `src/utils/periodUtils.ts` | **NEW** - computePeriods utility |
| `tests/unit/utils/periodUtils.test.ts` | **NEW** - period tests |
| `tests/unit/services/firestore.*.test.ts` | Update existing tests |

### Period Computation Rules

| Period | Format | Example | Edge Case |
|--------|--------|---------|-----------|
| day | YYYY-MM-DD | 2026-01-22 | None |
| week | YYYY-Www | 2026-W04 | Week 53, year boundaries |
| month | YYYY-MM | 2026-01 | None |
| quarter | YYYY-Qn | 2026-Q1 | None |
| year | YYYY | 2026 | None |

**Week Calculation:**
- Use ISO week numbering (Monday = week start)
- Week belongs to year containing Thursday
- Edge case: Dec 31 may be W01 of next year

### Default Values for Legacy Data

```typescript
function normalizeTransaction(tx: Partial<Transaction>): Transaction {
  return {
    ...tx,
    sharedGroupId: tx.sharedGroupId ?? null,
    deletedAt: tx.deletedAt ?? null,
    deletedBy: tx.deletedBy ?? null,
    updatedAt: tx.updatedAt ?? tx.createdAt ?? new Date(),
    version: tx.version ?? 1,
    periods: tx.periods ?? computePeriods(tx.date),
  };
}
```

### Soft Delete Query Pattern

```typescript
// Active transactions only
const activeQuery = query(
  transactionsRef,
  where('deletedAt', '==', null),
  orderBy('date', 'desc')
);
```

### Project Structure Notes

- Type definition: `src/types/transaction.ts` (single source of truth)
- Service functions: `src/services/firestore.ts`
- Utility functions: `src/utils/` directory
- Test files: Mirror source structure under `tests/unit/`

### Testing Standards

- **Unit tests:** 15+ tests for `computePeriods()` covering all edge cases
- **Integration tests:** Verify save/update behavior in `firestore.test.ts`
- **Coverage target:** 80%+ for new code

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md]
- [Architecture Decisions: AD-1, AD-5, AD-8 in epics.md]
- [Current Transaction Type: src/types/transaction.ts]
- [Firestore Service: src/services/firestore.ts]

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **Scan Receipt Flow (#1)** | Save path must populate new fields automatically |
| **Quick Save Flow (#2)** | Same save path - new fields required |
| **Batch Processing Flow (#3)** | Uses same `handleSaveTransaction` - same impact |
| **Learning Flow (#5)** | Transaction edits must increment version |
| **History Filter Flow (#6)** | `periods` field enables efficient queries |

### Downstream Effects to Consider

- All transaction saves automatically populate `updatedAt`, `version`, `periods`
- All transaction updates increment `version` for optimistic concurrency
- `periods` computed from `date` field on every save/update
- Legacy transactions handled gracefully with default values
- Soft delete filter (`deletedAt == null`) added to queries

### Testing Implications

- **Existing tests to verify:** Transaction save tests, batch processing tests, E2E scan flow
- **New scenarios to add:** Period edge cases, version increment, soft delete filtering

### Workflow Chain Visualization

```
[Legacy 14c Code Cleanup] → [THIS STORY] → [Changelog Infrastructure]
                                 ↓
                    [All Save Paths Updated]
                                 ↓
           [Scan Flow] [Quick Save] [Batch] [Learning]
```

## Dev Agent Record

### Agent Model Used

_To be filled during implementation_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
