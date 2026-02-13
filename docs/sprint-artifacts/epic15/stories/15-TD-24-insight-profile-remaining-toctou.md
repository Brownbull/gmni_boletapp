# Tech Debt Story TD-24: insightProfileService Remaining TOCTOU Gaps

Status: ready-for-dev

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

- [ ] **AC1:** `trackTransactionForProfile()` wrapped in `runTransaction()` — atomic increment + conditional firstTransactionDate
- [ ] **AC2:** `setFirstTransactionDate()` wrapped in `runTransaction()` — atomic create-if-not-exists + date set
- [ ] **AC3:** `clearRecentInsights()` wrapped in `runTransaction()` — atomic create-if-not-exists + clear
- [ ] **AC4:** `resetInsightProfile()` wrapped in `runTransaction()` — atomic read (preserve firstTransactionDate) + reset
- [ ] **AC5:** Unit tests updated for all 4 wrapped functions
- [ ] **AC6:** All existing tests pass

## Tasks

- [ ] **Task 1:** Wrap all 4 functions using the existing `getOrCreateProfileInTransaction()` helper
  - [ ] Each reads full profile via transaction, mutates in-memory, writes via transaction.update()
  - [ ] Remove standalone `updateDoc` calls from these functions
- [ ] **Task 2:** Update unit tests in `tests/unit/services/insightProfileService.test.ts`
  - [ ] Replace standalone `updateDoc` assertions with `mockTransaction.update` assertions
  - [ ] Verify `updateDoc` is NOT called by these functions

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/insights/services/insightProfileService.ts` | MODIFY | Wrap 4 remaining functions in runTransaction |
| `tests/unit/services/insightProfileService.test.ts` | MODIFY | Update mocks for transaction wrapping |

## Dev Notes

- Uses the `getOrCreateProfileInTransaction()` helper extracted in TD-20
- After this story, ALL functions in insightProfileService.ts will use transactions (except read-only `getInsightProfile`)
- `getDoc` import can be removed after this (only used by `getInsightProfile` — check before removing)
- Source story: [15-TD-20](./15-TD-20-insight-profile-toctou.md)
- Review findings: #1, #2
