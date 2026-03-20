# Tech Debt Story TD-18-16: Qty Test Coverage Strengthening

Status: done

> **Source:** ECC Code Review (2026-03-19) on story TD-18-15
> **Priority:** LOW | **Estimated Effort:** 1 point
> **Stage:** MVP

## Story
As a **developer**, I want **stronger assertions in the qty/unitPrice test suite**, so that **the tests verify actual derived values rather than just code path execution**.

## Acceptance Criteria

- AC-1: AC-8 test (TransactionEditorViewInternal) asserts that onSave receives items with derived unitPrice values, not just that deriveItemsPrices was called
- AC-2: EditViewItemsSection test covers qty=undefined item rendering — verifies the input still appears with default value 1

## Tasks

1. [x] Strengthen AC-8 assertion: change spy to return derived values, assert onSave receives items with correct unitPrice
2. [x] Add qty=undefined test case to EditViewItemsSection.qty.test.tsx grouped view section

## Dev Notes
- Source story: [TD-18-15](./TD-18-15-item-editor-qty-test-coverage.md)
- Review findings: #8 (AC-8 spy passthrough), #9 (missing qty=undefined edge case)
- Files affected: `src/features/transaction-editor/views/EditViewItemsSection.qty.test.tsx`, `tests/unit/features/transaction-editor/views/TransactionEditorViewInternal.test.tsx`

## Senior Developer Review (ECC)
- **Date:** 2026-03-19
- **Agents:** code-reviewer (TRIVIAL classification)
- **Score:** 7.5/10 → APPROVE with 4 quick fixes
- **Fixes applied:** mock fidelity (qty division), restore deriveItemsPrices call assertion, defaultValue comment, AC-N tag convention
- **TD stories created:** 0
<!-- CITED: none -->
