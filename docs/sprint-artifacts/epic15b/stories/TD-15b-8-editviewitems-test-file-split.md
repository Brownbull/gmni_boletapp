# Tech Debt Story TD-15b-8: EditViewItemsSection Test File Split

**Status:** done

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

- [x] **AC1:** Original test file split into two files, each under 300 lines
- [x] **AC2:** All 20 existing tests pass after the split (no test deleted or changed)
- [x] **AC3:** Shared mock setup and factory functions extracted to a `EditViewItemsSection.test-utils.ts` helper (or duplicated per file — dev's choice, whichever keeps each file under 300 lines and avoids hook violations)
- [x] **AC4:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Split test file
- [x] 1.1 Decide on split boundary (e.g., `EditViewItemsSection.handlers.test.tsx` + `EditViewItemsSection.groups.test.tsx`, or primary + edge-cases)
- [x] 1.2 Extract shared mock setup (`vi.mock(...)` blocks) and factory functions (`makeTransaction`, `makeProps`) to a shared helper OR duplicate them per file
- [x] 1.3 Create the two new test files, moving describe blocks accordingly
- [x] 1.4 Delete (or rename) the original `EditViewItemsSection.test.tsx`
- [x] 1.5 Verify both new files are under 300 lines

### Task 2: Verify
- [x] 2.1 Run `npx vitest run src/features/transaction-editor/views/` and confirm all 20 tests pass
- [x] 2.2 Run `npm run test:quick` — full suite passes

## Dev Notes

- Source story: [TD-15b-6](./TD-15b-6-editviewitems-price-consistency.md)
- Review finding: #2 (test file 368 lines, limit 300)
- Files affected: `src/features/transaction-editor/views/EditViewItemsSection.test.tsx` (split into 2 files)
- Note: no source code changes — tests and mocks only
- If duplicating mocks instead of extracting, both files remain self-contained, which is simpler

## Code Review Debt Tracking (2026-02-23)

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [TD-15b-10](./TD-15b-10-keyboard-nav-test-fix.md) | Fix dead predicate in `getItemRows` — 4 keyboard nav tests pass vacuously | MEDIUM | CREATED |

## Implementation Notes (2026-02-23)

- Split boundary chosen: grouped view behaviors vs edge cases & sanitization
  - `EditViewItemsSection.grouped.test.tsx` — Handlers + Grouping + Keyboard (282 lines, 14 tests)
  - `EditViewItemsSection.edge.test.tsx` — Edge cases + Input sanitization + View mode (284 lines, 13 tests)
- Approach: mocks and factories duplicated per file (simpler, self-contained)
- Total tests: 27 (original 20 + 7 sanitization tests added by TD-15b-7 were also preserved)
- All 27 tests pass in both new files

## Senior Developer Review (ECC) — 2026-02-23

- **Classification:** SIMPLE | **Agents:** code-reviewer, tdd-guide
- **Score:** 8.25/10 | **Outcome:** APPROVED
- **Fixed:** 1 quick (missing `makeProps()` comment in edge file)
- **Deferred:** 1 TD story created (TD-15b-10 — dead predicate in keyboard nav tests, pre-existing)
