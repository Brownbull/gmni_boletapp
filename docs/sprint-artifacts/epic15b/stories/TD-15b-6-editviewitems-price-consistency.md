# Tech Debt Story TD-15b-6: EditViewItemsSection Form Consistency + Edge Case Tests

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-23) on story TD-15b-4
> **Priority:** LOW | **Estimated Effort:** 1 pt

## Story

As a **developer**, I want **the original-order view edit form to be consistent with the grouped view** (price parsing, display value, and translation keys), so that **both views behave identically and edge-case tests catch regressions**.

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
- [ ] **AC5:** Original-order view price `value` attr matches grouped: `value={item.price}` (not `value={item.price || ''}`)
- [ ] **AC6:** Original-order view price placeholder key matches grouped: `t('price')` not `t('itemPrice')` (or confirm intentional divergence in translations.ts)
- [ ] **AC7:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Fix original-order view price input inconsistencies
- [ ] 1.1 In `EditViewItemsSection.tsx` line ~233: change `parseFloat(e.target.value) || 0` to raw `e.target.value` (AC1 — matches grouped view parse path)
- [ ] 1.2 Change `value={item.price || ''}` to `value={item.price}` (AC5 — consistent display with grouped view)
- [ ] 1.3 Check `translations.ts` for `price` vs `itemPrice` keys — align to one key for the price placeholder (AC6)
- [ ] 1.4 Verify `test:quick` still passes

### Task 2: Add edge case tests to EditViewItemsSection.test.tsx
- [ ] 2.1 `handleAddItem with empty items` — render with `items: []`, click add, verify `onSetEditingItemIndex(0)`
- [ ] 2.2 `cross-group collapse isolation` — render with 2 groups, collapse group A, verify group B stays expanded
- [ ] 2.3 `delete last item — ItemViewToggle disappears` — render with 1 item, delete it, verify toggle absent

## Dev Notes

- Source story: [TD-15b-4](./TD-15b-4-editviewitems-unit-tests.md), [TD-15b-5](./TD-15b-5-editviewitems-code-quality.md)
- Review findings: #2 (price inconsistency), #7 (edge cases) from TD-15b-4 review; #3 (parse path), #4 (display value), #5 (i18n key) from TD-15b-5 review
- Files affected: `src/features/transaction-editor/views/EditViewItemsSection.tsx` (Task 1), `src/features/transaction-editor/views/EditViewItemsSection.test.tsx` (Task 2)
- Note: TD-15b-5 also touches `EditViewItemsSection.tsx` (type safety + a11y + DRY). If TD-15b-5 lands first, the `handleUpdateItem` signature will have typed `field: ItemEditableField`. Update test accordingly.
