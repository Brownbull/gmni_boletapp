# Tech Debt Story TD-15b-6: EditViewItemsSection Price Input Consistency + Edge Case Tests

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-23) on story TD-15b-4
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story

As a **developer**, I want **the original-order view price input to use the same parsing path as the grouped view**, so that **price parsing behavior is consistent across both views and edge-case tests catch regressions**.

## Background

Story TD-15b-4 added unit tests for `EditViewItemsSection`. Code review (2026-02-23) identified two related gaps:

1. **Price input inconsistency (source bug):** The original-order view price input (source line 228) pre-processes the value before passing to `handleUpdateItem`:
   ```tsx
   // Original view (inconsistent):
   onChange={e => handleUpdateItem(i, 'price', parseFloat(e.target.value) || 0)}

   // Grouped view (correct — raw string passed to parseStrictNumber via handler):
   onChange={e => handleUpdateItem(i, 'price', e.target.value)}
   ```
   This means `parseStrictNumber` receives an already-parsed `number` in the original view instead of the raw string, potentially handling edge cases (e.g., Chilean comma-decimals) differently.

2. **Missing edge case tests:** `EditViewItemsSection.test.tsx` tests only cover the primary paths. Three edge cases are untested: add-first-item (empty list), cross-group collapse isolation, and delete-last-item.

## Acceptance Criteria

- [ ] **AC1:** Original-order view price input uses raw string: `onChange={e => handleUpdateItem(i, 'price', e.target.value)}` (matches grouped view)
- [ ] **AC2:** Test added — `handleAddItem` with empty `items` array sets `editingItemIndex` to `0`
- [ ] **AC3:** Test added — collapsing group A does not affect group B's `aria-expanded` state
- [ ] **AC4:** Test added — `handleDeleteItem` on last item results in empty `items` array AND `ItemViewToggle` is no longer rendered
- [ ] **AC5:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Fix price input in original-order view
- [ ] 1.1 In `EditViewItemsSection.tsx` line ~228: change `parseFloat(e.target.value) || 0` to raw `e.target.value` (matches grouped view pattern)
- [ ] 1.2 Verify `test:quick` still passes — existing price test covers this path via grouped view

### Task 2: Add edge case tests to EditViewItemsSection.test.tsx
- [ ] 2.1 `handleAddItem with empty items` — render with `items: []`, click add, verify `onSetEditingItemIndex(0)`
- [ ] 2.2 `cross-group collapse isolation` — render with 2 groups, collapse group A, verify group B stays expanded
- [ ] 2.3 `delete last item — ItemViewToggle disappears` — render with 1 item, delete it, verify toggle absent

## Dev Notes

- Source story: [TD-15b-4](./TD-15b-4-editviewitems-unit-tests.md)
- Review findings: #2 (price inconsistency), #7 (edge cases)
- Files affected: `src/features/transaction-editor/views/EditViewItemsSection.tsx` (Task 1), `src/features/transaction-editor/views/EditViewItemsSection.test.tsx` (Task 2)
- Note: TD-15b-5 also touches `EditViewItemsSection.tsx` (type safety + a11y + DRY). If TD-15b-5 lands first, the `handleUpdateItem` signature will have typed `field: ItemEditableField`. Update test accordingly.
