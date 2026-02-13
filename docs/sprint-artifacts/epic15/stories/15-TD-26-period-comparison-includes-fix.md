# Tech Debt Story 15-TD-26: Fix String.includes() → Array.includes() in periodComparisonHelpers

Status: ready-for-dev

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

- [ ] **AC1:** `periodComparisonHelpers.ts:135-136` uses `STORE_CATEGORY_GROUPS.includes(category)` (array membership) instead of string substring check
- [ ] **AC2:** `periodComparisonHelpers.ts:155-156` uses `ITEM_CATEGORY_GROUPS.includes(category)` (array membership) instead of string substring check
- [ ] **AC3:** Existing tests in `periodComparisonHelpers.test.ts` updated to reflect corrected behavior (if any edge cases change)
- [ ] **AC4:** All tests pass with `npm run test:quick`

## Tasks

- [ ] **Task 1:** Fix the 4 lines in `periodComparisonHelpers.ts`
  - [ ] Line 135-136: Change String.includes to Array.includes for STORE_CATEGORY_GROUPS
  - [ ] Line 155-156: Change String.includes to Array.includes for ITEM_CATEGORY_GROUPS
- [ ] **Task 2:** Verify and update tests
  - [ ] Review test cases that document the bug (lines 309-326 in test file)
  - [ ] Update assertions if behavior changes for any edge cases

## Dev Notes

- Source stories: [15-TD-16](./15-TD-16-mega-view-decomposition-5c.md), [15-TD-21](./15-TD-21-mega-view-helper-tests.md)
- Review findings: pre-existing deferral (INFO severity)
- Files affected: `src/views/TrendsView/periodComparisonHelpers.ts`, `tests/unit/views/TrendsView/periodComparisonHelpers.test.ts`
- Verify that `STORE_CATEGORY_GROUPS` and `ITEM_CATEGORY_GROUPS` are arrays, not strings, before changing the call
