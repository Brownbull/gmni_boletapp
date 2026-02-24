# Tech Debt Story TD-15b-10: Keyboard Navigation Test Fix

**Status:** done

> **Source:** ECC Code Review (2026-02-23) on story TD-15b-8
> **Priority:** MEDIUM | **Estimated Effort:** 1 pt

## Story

As a **developer**, I want **the keyboard navigation tests to actually exercise the keyDown handler**, so that **the tests provide real coverage and don't pass vacuously**.

## Background

`EditViewItemsSection.grouped.test.tsx` has a `getItemRows` helper:

```tsx
const getItemRows = () =>
  screen.getAllByRole('button').filter(el => el.tagName !== 'BUTTON');
```

`getAllByRole('button')` returns only elements matching the button role — native `<button>` elements have tagName `'BUTTON'`, so the filter produces an empty array. The 4 keyboard navigation tests (`it.each(['Enter', ' '])` × 2) call `fireEvent.keyDown(undefined, ...)`, which is a silent no-op. All 4 tests pass vacuously without exercising any code.

The fix requires inspecting the `EditViewItemsSection` source to identify which DOM element receives `keyDown` events for item row selection (likely `div[role="button"]` or a container with `tabIndex`), then updating the selector accordingly.

## Acceptance Criteria

- [x] **AC1:** Identify the correct DOM selector for clickable item rows in `EditViewItemsSection` (inspect source)
- [x] **AC2:** Update `getItemRows` helper in `EditViewItemsSection.grouped.test.tsx` to return non-empty array when items exist
- [x] **AC3:** All 4 keyboard navigation tests exercise the actual `keyDown` handler (verify with a spy or by asserting `onSetEditingItemIndex` is called with a specific index, not `expect.any(Number)`)
- [x] **AC4:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Investigate
- [x] 1.1 Read `EditViewItemsSection.tsx` to find the element that handles `onKeyDown` for item row selection
- [x] 1.2 Determine the correct query (`getByRole`, `queryAllByRole`, or DOM query) to select item rows

### Task 2: Fix
- [x] 2.1 Update `getItemRows` helper with correct selector
- [x] 2.2 Tighten `onSetEditingItemIndex` assertion to use specific index (not `expect.any(Number)`) where deterministic
- [x] 2.3 Run `npx vitest run src/features/transaction-editor/views/` — all 27 tests pass

## Dev Notes

- Source story: [TD-15b-8](./TD-15b-8-editviewitems-test-file-split.md)
- Review findings: #1 (HIGH) from code-reviewer + tdd-guide
- Files affected: `src/features/transaction-editor/views/EditViewItemsSection.grouped.test.tsx`
- Pre-existing defect — inherited from original file before the split; not a regression of TD-15b-8
- If item rows use `div[role="button"]`, then `getAllByRole('button')` already includes them and the filter just needs adjustment (e.g., filter by tagName `'DIV'` or use `querySelectorAll('[role="button"]')`)

## Senior Developer Review (ECC) — 2026-02-23

| Field | Value |
|-------|-------|
| Date | 2026-02-23 |
| Agents | code-reviewer (TRIVIAL classification) |
| Score | 8.5/10 |
| Outcome | APPROVED |
| Quick fixes applied | 2 (guard assertions in 3 test locations + file staging) |
| TD stories created | 0 |
