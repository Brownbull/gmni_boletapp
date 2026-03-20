# Tech Debt Story TD-18-15: Item Editor Qty/UnitPrice Test Coverage

Status: done

> **Source:** ECC Code Review (2026-03-19) on story TD-18-13
> **Priority:** HIGH | **Estimated Effort:** 2 points
> **Stage:** MVP

## Story
As a **developer**, I want **unit tests covering the qty input and unitPrice display interactions in both item editor views**, so that **regressions to the always-visible qty/unitPrice feature are caught automatically**.

## Acceptance Criteria

- AC-1: Test qty input is always visible in grouped edit view (not conditional on qty > 1)
- AC-2: Test unitPrice read-only display is rendered in grouped edit view
- AC-3: Test qty change triggers onUpdateTransaction with updated qty value
- AC-4: Test totalPrice change with qty > 1 reflects correct derived unitPrice
- AC-5: Test qty input is present in original edit view
- AC-6: Test unitPrice display is present in original edit view
- AC-7: Test new item (via Add Item) shows qty and unitPrice fields after rerender
- AC-8: Test deriveItemsPrices is called in save path (TransactionEditorViewInternal)
- AC-9: Test view mode hides qty/unitPrice when qty=1, shows when qty > 1
- AC-10: Test qty validation: non-numeric input clamped to 1, zero rejected

## Tasks

1. [x] **EditViewItemsSection.qty.test.tsx:** Tests for AC-1, AC-2, AC-3, AC-4 (grouped view)
2. [x] **EditViewItemsSection.qty.test.tsx:** Tests for AC-5, AC-6, AC-7, AC-9, AC-10 (original + view mode + validation)
3. [x] **TransactionEditorViewInternal.test.tsx:** Test for AC-8 (deriveItemsPrices spy)

## Files Created
- `src/features/transaction-editor/views/EditViewItemsSection.qty.test.tsx` (new — separate file to avoid 300-line limit on existing test files)
- `tests/unit/features/transaction-editor/views/TransactionEditorViewInternal.test.tsx` (new)

## Dev Notes
- Source story: [TD-18-13](./TD-18-13-item-qty-unitprice-editor.md)
- Review findings: #2 (missing test coverage for 7/13 ACs)
- The derivation logic itself is already tested in `itemPriceDerivation.test.ts` (27 tests). This story covers the UI wiring only.
- File deviation: Created `EditViewItemsSection.qty.test.tsx` instead of appending to grouped/edge test files — both were at 293/287 lines (300-line limit). Consolidating qty tests in one file follows "many small files" principle.
- Self-review: APPROVE 8/10, ORDERING: clean
- Code review: APPROVE 7.0/10, 7 quick fixes applied, 4 deferred

## Deferred Items

| # | Finding | Stage | Destination | Tracking |
|---|---------|-------|-------------|----------|
| 8 | AC-8 spy passthrough — strengthen onSave assertion | MVP | TD-18-16 | DEFER_EPIC |
| 9 | Missing qty=undefined edge case test | MVP | TD-18-16 | DEFER_EPIC |
| 10 | handleFinalSave guard branch untested | PROD | Backlog | DEFER_BACKLOG |
| 11 | parseStrictNumber stub inaccuracy | PROD | Backlog | DEFER_BACKLOG |
<!-- CITED: none -->
<!-- ORDERING: clean -->
