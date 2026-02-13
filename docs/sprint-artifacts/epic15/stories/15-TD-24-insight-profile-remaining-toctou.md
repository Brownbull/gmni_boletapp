# Tech Debt Story TD-24: insightProfileService Remaining TOCTOU Gaps

Status: done

> **Source:** ECC Code Review (2026-02-13) on story 15-TD-20
> **Priority:** LOW
> **Estimated Effort:** 1 pt

## Story

As a **developer**,
I want **the remaining 4 non-transactional functions in insightProfileService to use `runTransaction()`**,
So that **the entire service is fully consistent with the TOCTOU prevention pattern established in TD-20**.

## Context

After TD-20 wrapped 5 functions in `runTransaction()`, 4 functions remain using a split pattern: they call `getOrCreateInsightProfile()` (now transactional) then issue a standalone `updateDoc()`. The gap between the transaction completing and the `updateDoc` executing is a theoretical TOCTOU window.

Risk is LOW because:
- `trackTransactionForProfile` uses `increment()` (server-side atomic) for the counter; only `firstTransactionDate` conditional has a stale-read risk
- `setFirstTransactionDate`, `clearRecentInsights`, `resetInsightProfile` are administrative/utility functions called infrequently
- All operate on per-user non-financial data

The `getOrCreateProfileInTransaction()` helper extracted in TD-20 makes wrapping these trivial.

## Acceptance Criteria

- [x] **AC1:** `trackTransactionForProfile()` wrapped in `runTransaction()` — atomic increment + conditional firstTransactionDate
- [x] **AC2:** `setFirstTransactionDate()` wrapped in `runTransaction()` — atomic create-if-not-exists + date set
- [x] **AC3:** `clearRecentInsights()` wrapped in `runTransaction()` — atomic create-if-not-exists + clear
- [x] **AC4:** `resetInsightProfile()` wrapped in `runTransaction()` — atomic read (preserve firstTransactionDate) + reset
- [x] **AC5:** Unit tests updated for all 4 wrapped functions
- [x] **AC6:** All existing tests pass

## Tasks

- [x] **Task 1:** Wrap all 4 functions using the existing `getOrCreateProfileInTransaction()` helper
  - [x] Each reads full profile via transaction, mutates in-memory, writes via transaction.update()
  - [x] Remove standalone `updateDoc` calls from these functions
- [x] **Task 2:** Update unit tests in `tests/unit/services/insightProfileService.test.ts`
  - [x] Replace standalone `updateDoc` assertions with `mockTransaction.update` assertions
  - [x] Verify `updateDoc` is NOT called by these functions

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/insights/services/insightProfileService.ts` | MODIFY | Wrap 4 remaining functions in runTransaction |
| `tests/unit/services/insightProfileService.test.ts` | MODIFY | Update mocks for transaction wrapping |

## Dev Notes

- Uses the `getOrCreateProfileInTransaction()` helper extracted in TD-20
- After this story, ALL functions in insightProfileService.ts use transactions (except read-only `getInsightProfile`)
- `updateDoc` import removed — no remaining callers. `getDoc` retained for `getInsightProfile`.
- 4 new negative assertions added: each function verifies `updateDoc` is NOT called
- 35 tests total, all passing. 6916 tests pass in full suite.
- Source story: [15-TD-20](./15-TD-20-insight-profile-toctou.md)
- Review findings: #1, #2

## Senior Developer Review (ECC)

- **Review date:** 2026-02-13
- **ECC agents:** code-reviewer (TRIVIAL classification)
- **Outcome:** APPROVE 9/10
- **Findings:** 2 info-only (no action required)
  - #1 LOW: `increment(1)` inside transaction is valid and idiomatic — keeping as-is
  - #2 LOW: `null as unknown as Timestamp` pre-existing from story 10.2 — not in scope
- **All 6 ACs validated**, clean transaction wrapping, DRY helper reuse, negative assertions present
