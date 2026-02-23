# Tech Debt Story TD-15b-4: Unit Tests for EditViewItemsSection

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-23) on story TD-15b-2a
> **Priority:** MEDIUM | **Estimated Effort:** 2 pts

## Story

As a **developer**, I want **unit tests for `EditViewItemsSection.tsx`**, so that **the extracted component's add/update/delete/grouping behaviors are independently verified and regressions are caught during future refactors**.

## Background

Story TD-15b-2a extracted the items section from EditView.tsx into a dedicated `EditViewItemsSection` sub-component (275 lines). The extraction passed `test:quick` (6810 tests, all passing) because existing EditView integration tests cover the end-to-end flow. However, no dedicated unit tests were written for the new component's internal behaviors.

The component contains meaningful pure logic:
- `itemsByGroup` useMemo grouping (normalizes categories, sorts by price, alphabetizes groups)
- `toggleGroupCollapse` (Set-based immutable update)
- `handleAddItem` (appends item + sets editing index atomically)
- `handleUpdateItem` (field dispatch with price parsing)
- `handleDeleteItem` (filters + clears editing index)
- View mode switching (grouped ↔ original)

## Acceptance Criteria

- [ ] **AC1:** `EditViewItemsSection.test.tsx` created at `src/features/transaction-editor/views/`
- [ ] **AC2:** `itemsByGroup` grouping logic tested — multi-category items sorted correctly by group and price
- [ ] **AC3:** `handleAddItem` tested — appends empty item to transaction + sets editing index
- [ ] **AC4:** `handleUpdateItem` tested — name field (string), price field (parseStrictNumber), category field
- [ ] **AC5:** `handleDeleteItem` tested — removes item by index, clears editingItemIndex to null
- [ ] **AC6:** `toggleGroupCollapse` tested — expands collapsed group, collapses expanded group
- [ ] **AC7:** View mode toggle rendered when items > 0; absent when items = 0
- [ ] **AC8:** `npm run test:quick` passes

## Tasks / Subtasks

### Task 1: Setup test file
- [ ] 1.1 Create `EditViewItemsSection.test.tsx` — mock `useStaggeredReveal`, `AnimatedItem`, `CategoryCombobox`, `CategoryBadge`, `ItemViewToggle`
- [ ] 1.2 Build `makeProps()` factory with minimal valid transaction (2 items, different categories)

### Task 2: Core handler tests
- [ ] 2.1 `handleAddItem` — verify `onUpdateTransaction` called with appended item, `onSetEditingItemIndex` called with items.length
- [ ] 2.2 `handleUpdateItem(i, 'name', value)` — string field update
- [ ] 2.3 `handleUpdateItem(i, 'price', '12.5')` — price goes through `parseStrictNumber`
- [ ] 2.4 `handleDeleteItem(i)` — item removed, `onSetEditingItemIndex(null)` called

### Task 3: Grouping + state tests
- [ ] 3.1 `itemsByGroup` — items with same category group are grouped together
- [ ] 3.2 `itemsByGroup` — groups sorted alphabetically; items within group sorted by price desc
- [ ] 3.3 Collapse/expand toggle — click group header twice, verify `aria-expanded` changes
- [ ] 3.4 View mode toggle — renders in grouped (default) and original modes

## Dev Notes

- Source story: [TD-15b-2a](./TD-15b-2a-editview-items-extraction.md)
- Review finding: #2 — no dedicated unit tests for new component
- Files affected: `src/features/transaction-editor/views/EditViewItemsSection.test.tsx` (new)
- Keep test file ≤300 lines (unit test limit)
- `parseStrictNumber` should be mocked or imported from `editViewHelpers` — check existing EditView tests for pattern
