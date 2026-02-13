# Tech Debt Story 15-TD-26: Fix String.includes() → Array.includes() in periodComparisonHelpers

Status: done

> **Source:** ECC Code Review (2026-02-13) on story 15-TD-21 (pre-existing from 15-TD-16)
> **Priority:** LOW
> **Estimated Effort:** 1 pt

## Story

As a **developer**,
I want **the String.includes() calls in periodComparisonHelpers.ts replaced with proper Array.includes()**,
So that **category group membership checks are correct by design, not by accident**.

## Background

`periodComparisonHelpers.ts` lines 135-136 and 155-156 use `String.includes()` to check if a category belongs to `STORE_CATEGORY_GROUPS` or `ITEM_CATEGORY_GROUPS`. This currently works by accident because no category name is a substring of another group name. The intent is array membership checking (`Array.includes()`), not substring matching.

Both 15-TD-16 and 15-TD-21 document this as a known bug. Tests in 15-TD-21 document the current behavior.

## Acceptance Criteria

- [x] **AC1:** `periodComparisonHelpers.ts:135-136` uses direct key lookup instead of String.includes loop
- [x] **AC2:** `periodComparisonHelpers.ts:155-156` uses direct key lookup instead of String.includes loop
- [x] **AC3:** Tests updated: bug-documenting test replaced with 4 new tests (store-groups + item-groups positive/negative)
- [x] **AC4:** All tests pass with `npm run test:quick` (283 files, 6886 tests)

## Tasks

- [x] **Task 1:** Fix the 4 lines in `periodComparisonHelpers.ts`
  - [x] Line 135-136: Replaced String.includes loop with direct key lookup for STORE_CATEGORY_GROUPS
  - [x] Line 155-156: Replaced String.includes loop with direct key lookup for ITEM_CATEGORY_GROUPS
- [x] **Task 2:** Verify and update tests
  - [x] Replaced bug-documenting test with correct positive/negative tests for store-groups
  - [x] Added item-groups tests (positive match + negative non-matching group)

## Dev Notes

- Source stories: [15-TD-16](./15-TD-16-mega-view-decomposition-5c.md), [15-TD-21](./15-TD-21-mega-view-helper-tests.md)
- Review findings: pre-existing deferral (INFO severity)
- Files affected: `src/views/TrendsView/periodComparisonHelpers.ts`, `tests/unit/views/TrendsView/periodComparisonHelpers.test.ts`
- Verify that `STORE_CATEGORY_GROUPS` and `ITEM_CATEGORY_GROUPS` are arrays, not strings, before changing the call

## Senior Developer Review (ECC)

- **Date:** 2026-02-13
- **Classification:** SIMPLE
- **Agents:** code-reviewer, tdd-guide
- **Outcome:** APPROVE (9/10)
- **Quick fixes:** 1 (AC3 wording: "5 new tests" → "4 new tests")
- **TEA Score:** 93/100 (Determinism 95, Isolation 95, Maintainability 90, Coverage 90, Performance 98)
- **Notes:** Both agents confirmed fix is correct — O(n*m) loop replaced by O(1) direct key lookup. `as keyof typeof` casts handle undefined safely. Both `computePreviousPeriodTotals` and `computeDailySparkline` now use same lookup pattern.
