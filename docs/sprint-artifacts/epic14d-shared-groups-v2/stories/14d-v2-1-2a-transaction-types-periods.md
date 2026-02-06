# Story 14d-v2.1.2a: Transaction Type & Period Utility

Status: done

> Part 1/3 of Story 14d-v2.1.2 split - Types + computePeriods utility
> Original story exceeded sizing limits: 6 tasks, 35 subtasks

## Story

As a **developer**,
I want **the Transaction type updated with new fields and a computePeriods utility**,
So that **the foundation is ready for shared group sync and temporal queries**.

## Acceptance Criteria

### Core Requirements (from Original Story)

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

3. **Given** the `computePeriods()` utility function
   **When** called with any valid transaction date
   **Then** it correctly computes day, week, month, quarter, and year strings
   **And** handles edge cases (year boundaries, week 53, leap years)

## Tasks / Subtasks

- [x] **Task 1: Update Transaction Type Definition** (AC: #1, #2)
  - [x] 1.1: Add `sharedGroupId: string | null` field
  - [x] 1.2: Add `deletedAt: Timestamp | null` field
  - [x] 1.3: Add `deletedBy: string | null` field
  - [x] 1.4: Ensure `updatedAt: Timestamp` exists (verify or add)
  - [x] 1.5: Add `version: number` field
  - [x] 1.6: Add `periods` interface and field
  - [x] 1.7: Remove `sharedGroupIds: string[]` array field (already removed in 14c cleanup)
  - [x] 1.8: Update JSDoc comments explaining each field's purpose

- [x] **Task 2: Create computePeriods Utility** (AC: #3)
  - [x] 2.1: Create `src/utils/periodUtils.ts`
  - [x] 2.2: Implement `computePeriods(date: string): TransactionPeriods`
  - [x] 2.3: Compute `day` as YYYY-MM-DD
  - [x] 2.4: Compute `week` as YYYY-Www (ISO week number)
  - [x] 2.5: Compute `month` as YYYY-MM
  - [x] 2.6: Compute `quarter` as YYYY-Qn
  - [x] 2.7: Compute `year` as YYYY
  - [x] 2.8: Handle edge cases (week 53, year boundaries)
  - [x] 2.9: Add comprehensive unit tests (25 test cases - exceeds 15 target)

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

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/transaction.ts` | Add new fields, remove `sharedGroupIds` |
| `src/utils/periodUtils.ts` | **NEW** - computePeriods utility |
| `tests/unit/utils/periodUtils.test.ts` | **NEW** - period tests |

### Testing Standards

- **Unit tests:** 15+ tests for `computePeriods()` covering all edge cases
- **Coverage target:** 80%+ for new code

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md]
- [Architecture Decisions: AD-1, AD-5, AD-8 in epics.md]
- [Current Transaction Type: src/types/transaction.ts]

### Dependencies

- **Blocks:** Story 14d-v2-1-2b (Service Layer needs types)
- **Blocked by:** None

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Fixed Timestamp type compatibility issue in RecentScansView.tsx (line 77-78)
- ISO week calculation fixed for year boundary cases (Jan 1 in previous year's week)

### Completion Notes List

- **Task 1**: Added all Epic 14d-v2 fields to Transaction type with comprehensive JSDoc documentation
  - TransactionPeriods interface created with day/week/month/quarter/year fields
  - createdAt/updatedAt changed from `any` to `Timestamp | Date | string` for type safety with backward compatibility
  - sharedGroupIds array already removed in Epic 14c cleanup
- **Task 2**: Created computePeriods utility with ISO 8601 week numbering
  - Handles all edge cases: week 53, year boundaries, leap years
  - 25 comprehensive unit tests (exceeds 15 target)
  - Fixed ISO week algorithm to correctly handle Jan 1 falling in previous year's week

### Code Review Fixes (Atlas-Enhanced Review 2026-02-01)

- **M2 Fixed**: Added DEV-only warning for invalid dates + improved JSDoc explaining intentionally invalid W00/Q0 markers
- **L1 Fixed**: Added `console.warn` in DEV mode for invalid date debugging
- **L3 Fixed**: Improved error handling tests to verify full fallback structure (now 26 tests)

### File List

| File | Action |
|------|--------|
| `src/types/transaction.ts` | Modified - Added TransactionPeriods, sharedGroupId, deletedBy, version, periods fields |
| `src/utils/periodUtils.ts` | Created - computePeriods utility with ISO week support + DEV warnings |
| `tests/unit/utils/periodUtils.test.ts` | Created - 26 comprehensive tests (includes fallback structure verification) |
| `src/views/RecentScansView.tsx` | Modified - Fixed Timestamp type narrowing
