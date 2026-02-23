# Tech Debt Story TD-15b-8: EditViewItemsSection Test File Split

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-23) on story TD-15b-6
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story

As a **developer**, I want **the EditViewItemsSection test file split into two files under 300 lines each**, so that **the pre-edit hook stops blocking future edits and the test file stays maintainable**.

## Background

`EditViewItemsSection.test.tsx` grew to 368 lines across three stories (TD-15b-4 created it, TD-15b-5 and TD-15b-6 added tests). The project enforces a 300-line maximum for unit tests (`testing.md` + pre-edit hook). Attempting to add any further tests to this file will be blocked by the hook.

Current describe blocks and approximate line counts:
- `Handlers` — 6 tests, ~90 lines
- `Grouping` — 3 tests, ~55 lines
- `Keyboard navigation` — 4 tests, ~30 lines
- `Edge cases` — 3 tests, ~58 lines
- `View mode` — 3 tests, ~25 lines

## Acceptance Criteria

- [ ] **AC1:** Original test file split into two files, each under 300 lines
- [ ] **AC2:** All 20 existing tests pass after the split (no test deleted or changed)
- [ ] **AC3:** Shared mock setup and factory functions extracted to a `EditViewItemsSection.test-utils.ts` helper (or duplicated per file — dev's choice, whichever keeps each file under 300 lines and avoids hook violations)
- [ ] **AC4:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Split test file
- [ ] 1.1 Decide on split boundary (e.g., `EditViewItemsSection.handlers.test.tsx` + `EditViewItemsSection.groups.test.tsx`, or primary + edge-cases)
- [ ] 1.2 Extract shared mock setup (`vi.mock(...)` blocks) and factory functions (`makeTransaction`, `makeProps`) to a shared helper OR duplicate them per file
- [ ] 1.3 Create the two new test files, moving describe blocks accordingly
- [ ] 1.4 Delete (or rename) the original `EditViewItemsSection.test.tsx`
- [ ] 1.5 Verify both new files are under 300 lines

### Task 2: Verify
- [ ] 2.1 Run `npx vitest run src/features/transaction-editor/views/` and confirm all 20 tests pass
- [ ] 2.2 Run `npm run test:quick` — full suite passes

## Dev Notes

- Source story: [TD-15b-6](./TD-15b-6-editviewitems-price-consistency.md)
- Review finding: #2 (test file 368 lines, limit 300)
- Files affected: `src/features/transaction-editor/views/EditViewItemsSection.test.tsx` (split into 2 files)
- Note: no source code changes — tests and mocks only
- If duplicating mocks instead of extracting, both files remain self-contained, which is simpler
