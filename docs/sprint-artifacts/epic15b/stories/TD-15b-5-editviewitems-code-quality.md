# Tech Debt Story TD-15b-5: EditViewItemsSection Code Quality Polish

**Status:** ready-for-dev

> **Source:** ECC Code Review (2026-02-23) on story TD-15b-2a
> **Priority:** LOW | **Estimated Effort:** 2 pts

## Story

As a **developer**, I want **`EditViewItemsSection.tsx` code quality issues resolved**, so that **the component is type-safe, accessible, and DRY**.

## Background

Story TD-15b-2a extracted the items section from EditView.tsx. Three code quality issues were identified — two were pre-existing in EditView before extraction, one is new duplication introduced by the extraction:

1. **Type safety** — `handleUpdateItem` field param is `string` (accepts typos)
2. **Accessibility** — item rows use `<div onClick>` without `role="button"` or keyboard handlers
3. **DRY** — animation logic (shouldAnimate block, ItemContainer selection, containerProps) is copy-pasted verbatim in grouped view and original order view

## Acceptance Criteria

- [ ] **AC1:** `handleUpdateItem` field param typed as `'name' | 'price' | 'category' | 'subcategory'` (or `keyof Pick<TransactionItem, 'name' | 'price' | 'category' | 'subcategory'>`)
- [ ] **AC2:** Item row clickable divs (grouped view and original view) have `role="button"` and `onKeyDown` handler for Enter/Space
- [ ] **AC3:** Animation logic extracted to a local helper function `getItemContainerProps(i, shouldAnimate, animationPlayedRef)` → used in both views
- [ ] **AC4:** `npm run test:quick` passes after changes (no regressions)
- [ ] **AC5:** `npx tsc --noEmit` clean

## Tasks / Subtasks

### Task 1: Type safety
- [ ] 1.1 Define `ItemEditableField = 'name' | 'price' | 'category' | 'subcategory'` in `EditViewItemsSection.tsx`
- [ ] 1.2 Update `handleUpdateItem(index: number, field: ItemEditableField, value: string | number)` signature
- [ ] 1.3 Update all 4 `handleUpdateItem` callsites — verify no TS errors

### Task 2: Accessibility
- [ ] 2.1 Grouped view item row div — add `role="button"`, `tabIndex={0}`, `onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSetEditingItemIndex(i)}`
- [ ] 2.2 Original order item row div — same treatment
- [ ] 2.3 Verify visually: touch targets already ≥44px (existing styling)

### Task 3: DRY animation logic
- [ ] 3.1 Extract `function getItemContainerConfig(i: number, shouldAnimate: boolean, played: boolean, testIdPrefix: string)` → returns `{ ItemContainer, containerProps }`
- [ ] 3.2 Replace duplicated animation block in grouped view with `getItemContainerConfig(i, shouldAnimate, animationPlayedRef.current, 'edit-view-item')`
- [ ] 3.3 Replace duplicated block in original view with `getItemContainerConfig(i, shouldAnimate, animationPlayedRef.current, 'edit-view-item-original')`
- [ ] 3.4 Run `npm run test:quick` — confirm all pass

## Dev Notes

- Source story: [TD-15b-2a](./TD-15b-2a-editview-items-extraction.md)
- Review findings: #1 (type safety), #3 (a11y), #5 (animation DRY)
- Files affected: `src/features/transaction-editor/views/EditViewItemsSection.tsx` only (1 file)
- Pre-existing context: `<div onClick>` pattern existed in EditView before extraction — AC2 fixes it in the new component; EditView.tsx itself has same pattern but is out of scope here
- If TD-15b-4 (unit tests) lands first, update `handleUpdateItem` tests to use the typed field
