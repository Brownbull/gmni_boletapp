# Story 14d-v2.1.2b: Transaction Service Layer Updates

Status: done

> Part 2/3 of Story 14d-v2.1.2 split - Service functions + default handling
> Original story exceeded sizing limits: 6 tasks, 35 subtasks

## Story

As a **developer**,
I want **Firestore save/update functions to populate new fields automatically**,
So that **all transactions have consistent metadata for sync and queries**.

## Acceptance Criteria

### Core Requirements (from Original Story)

1. **Given** a transaction is saved (new or update)
   **When** the Firestore save/update functions execute
   **Then** `updatedAt` is populated automatically with current timestamp
   **And** `periods` is computed from transaction `date` field

2. **Given** a transaction is created for the first time
   **When** the save completes
   **Then** `version` is set to `1`

3. **Given** a transaction is updated
   **When** the update completes
   **Then** `version` is incremented by 1

4. **Given** existing transactions without new fields are loaded
   **When** they are displayed or processed
   **Then** they are handled gracefully with sensible defaults:
   - `sharedGroupId`: `null`
   - `deletedAt`: `null`
   - `deletedBy`: `null`
   - `updatedAt`: falls back to `createdAt` or current time
   - `version`: `1`
   - `periods`: computed on-the-fly if missing

5. **Given** existing transactions without new fields exist in Firestore
   **When** they are loaded by the app
   **Then** they display correctly in transaction lists without errors

6. **Given** a mix of old and new format transactions
   **When** they are displayed in History/Home views
   **Then** all transactions render correctly regardless of field presence

## Tasks / Subtasks

- [x] **Task 3: Update Firestore Save Functions** (AC: #1, #2, #3)
  - [x] 3.1: Update `addTransaction()` to auto-populate `updatedAt` (serverTimestamp)
  - [x] 3.2: Update `addTransaction()` to compute and set `periods`
  - [x] 3.3: Update `addTransaction()` to set `version: 1` for new transactions
  - [x] 3.4: Update `updateTransaction()` to increment `version` (FieldValue.increment)
  - [x] 3.5: Update `updateTransaction()` to refresh `updatedAt` (serverTimestamp)
  - [x] 3.6: Update `updateTransaction()` to recompute `periods` if date changed
  - [x] 3.7: Update `updateTransactionsBatch()` with same logic

- [x] **Task 4: Add Default Value Handling** (AC: #4, #5, #6)
  - [x] 4.1: Create `normalizeTransaction()` utility for consistent defaults
  - [x] 4.2: Export utility for consumers to apply defaults when loading from Firestore
  - [x] 4.3: Created helper functions: `isDeleted()`, `isSharedTransaction()`
  - [x] 4.4: Add unit tests for normalization with various field combinations (22 tests)

## Dev Notes

### Default Values for Legacy Data

```typescript
// Renamed to avoid collision with transactionNormalizer.normalizeTransaction (Story 9.11)
function ensureTransactionDefaults(tx: Partial<Transaction>): Transaction {
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

### Files to Modify

| File | Changes |
|------|---------|
| `src/services/firestore.ts` | Update save/update functions |
| `src/utils/transactionUtils.ts` | Add normalizeTransaction utility |
| `tests/unit/services/firestore.*.test.ts` | Update existing tests |
| `tests/unit/utils/transactionUtils.test.ts` | Add normalization tests |

### Testing Standards

- **Unit tests:** Normalization with various field combinations
- **Integration tests:** Verify save/update behavior with new fields
- **Coverage target:** 80%+ for modified code

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md]
- [Current Firestore Service: src/services/firestore.ts]
- [Story 14d-v2-1-2a: Types + periodUtils (dependency)]

### Dependencies

- **Depends on:** Story 14d-v2-1-2a (needs Transaction type + computePeriods)
- **Blocks:** Story 14d-v2-1-2c (needs service layer ready)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Dependency resolved: Required Story 14d-v2-1-2a to be implemented first (Transaction types + computePeriods)
- Used Firestore `increment()` for atomic version updates
- Added debug logging to addTransaction showing version and periods.month

### Completion Notes List

- **Task 3**: Updated all Firestore save/update functions:
  - `addTransaction()`: Sets version=1, computes periods, sets updatedAt via serverTimestamp()
  - `updateTransaction()`: Increments version via FieldValue.increment(1), recomputes periods if date changed
  - `updateTransactionsBatch()`: Same logic as single update
  - Added debug logging showing version and periods in DEV mode
- **Task 4**: Created ensureTransactionDefaults utility for legacy data handling:
  - `ensureTransactionDefaults()`: Fills missing Epic 14d-v2 fields with sensible defaults (renamed from normalizeTransaction to avoid collision with Story 9.11)
  - `ensureTransactionsDefaults()`: Array wrapper
  - `isDeleted()`: Check if soft-deleted
  - `isSharedTransaction()`: Check if tagged to a group
  - 22 comprehensive unit tests covering all edge cases
  - Integrated into firestore.ts: subscribeToTransactions, subscribeToRecentScans, getTransactionPage

### File List

| File | Action |
|------|--------|
| `src/services/firestore.ts` | Modified - Added computePeriods import, version/periods in add/update functions, integrated ensureTransactionsDefaults |
| `src/utils/transactionUtils.ts` | Created - ensureTransactionDefaults, isDeleted, isSharedTransaction utilities |
| `src/entities/transaction/index.ts` | Modified - Export new utilities |
| `src/entities/transaction/utils/index.ts` | Modified - Export new utilities |
| `tests/unit/utils/transactionUtils.test.ts` | Created - 22 comprehensive tests |

## Code Review Record (Atlas-Enhanced)

### Review Date
2026-02-01

### Reviewer
Claude Opus 4.5 (Atlas-enhanced adversarial review)

### Initial Findings (2 HIGH, 2 MEDIUM)

1. **[HIGH] AC #5 & #6 NOT MET**: `normalizeTransaction()` was created but NOT integrated into data loading pipeline - legacy transactions were not getting defaults applied
2. **[HIGH] Naming Collision**: Two different `normalizeTransaction()` functions existed with different signatures (transactionNormalizer.ts for display vs transactionUtils.ts for data integrity)
3. **[MEDIUM] Helper functions unused**: `isDeleted()` and `isSharedTransaction()` created but not exported via entity module
4. **[MEDIUM] Architecture drift**: Entity module not updated to export new utilities per FSD pattern

### Fixes Applied

1. **Renamed functions** to avoid collision:
   - `normalizeTransaction()` → `ensureTransactionDefaults()`
   - `normalizeTransactions()` → `ensureTransactionsDefaults()`

2. **Integrated into data loading pipeline**:
   - `subscribeToTransactions()`: Now calls `ensureTransactionsDefaults()` on loaded data
   - `subscribeToRecentScans()`: Now calls `ensureTransactionsDefaults()` on loaded data
   - `getTransactionPage()`: Now calls `ensureTransactionsDefaults()` on paginated data

3. **Updated entity module exports**:
   - Added `ensureTransactionDefaults`, `ensureTransactionsDefaults`, `isDeleted`, `isSharedTransaction` to `@entities/transaction`

### Final AC Verification

| AC | Status | Evidence |
|----|--------|----------|
| #1 | ✅ PASS | updatedAt + periods auto-populated in Firestore functions |
| #2 | ✅ PASS | version: 1 set in addTransaction |
| #3 | ✅ PASS | version: increment(1) in updateTransaction |
| #4 | ✅ PASS | ensureTransactionDefaults utility created and exported |
| #5 | ✅ PASS | Legacy transactions now normalized via subscribeToTransactions |
| #6 | ✅ PASS | All transaction loading points apply defaults |

### Tests
- All 6,228 tests pass
- 22 tests specific to transactionUtils
