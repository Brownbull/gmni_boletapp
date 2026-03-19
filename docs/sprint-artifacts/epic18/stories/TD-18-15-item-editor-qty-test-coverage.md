# Tech Debt Story TD-18-15: Item Editor Qty/UnitPrice Test Coverage

Status: ready-for-dev

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

1. **EditViewItemsSection.grouped.test.tsx:** Add tests for AC-1, AC-2, AC-3, AC-4
2. **EditViewItemsSection.edge.test.tsx:** Add tests for AC-5, AC-6, AC-7, AC-9, AC-10
3. **TransactionEditorViewInternal test:** Add test for AC-8 (deriveItemsPrices spy)

## Files to Modify
- `src/features/transaction-editor/views/EditViewItemsSection.grouped.test.tsx`
- `src/features/transaction-editor/views/EditViewItemsSection.edge.test.tsx`
- `tests/unit/features/transaction-editor/views/TransactionEditorViewInternal.test.ts` (new)

## Dev Notes
- Source story: [TD-18-13](./TD-18-13-item-qty-unitprice-editor.md)
- Review findings: #2 (missing test coverage for 7/13 ACs)
- The derivation logic itself is already tested in `itemPriceDerivation.test.ts` (27 tests). This story covers the UI wiring only.
