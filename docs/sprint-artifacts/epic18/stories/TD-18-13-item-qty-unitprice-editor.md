# Story TD-18-13: Always Show Qty & UnitPrice in Item Editor

Status: done

> **Source:** Field gap analysis (2026-03-19) — qty/unitPrice hidden when qty=1, blocking manual adjustment
> **Priority:** HIGH | **Estimated Effort:** 3 points
> **DEPENDS:** None (all infrastructure exists)

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Every item tells its full price story"
**Value:** V5 — "Easier than the receipt drawer"

## Story
As a **user**, I want **to always see and edit the quantity and see the derived unit price when editing transaction items**, so that **I can correct quantities the AI missed and understand the per-unit cost of what I bought**.

## Background

### Current behavior
- qty input only visible when `(item.qty ?? 1) > 1`
- unitPrice only visible when qty > 1
- User cannot change qty=1 items to multi-quantity
- Add Item creates items without qty field
- Original view ("Original" tab) has no qty field at all

### Target behavior
- **Edit mode:** Always show qty (editable) + unitPrice (read-only, derived) + totalPrice (editable)
- **View mode:** Hide qty/unitPrice when qty=1 (unchanged — current behavior is correct)
- **Price model:**
  - `unitPrice = totalPrice / qty` (always derived, never directly editable)
  - When user changes qty → unitPrice recalculates
  - When user changes totalPrice → unitPrice recalculates
  - User edits only qty and totalPrice; unitPrice is display-only

### Derivation rules
```
unitPrice = Math.round(totalPrice / qty)   # CLP has no decimals
totalPrice = user-entered value             # source of truth from receipt
qty = user-entered value                    # default 1, min 0.001
```

Rounding loss accepted (e.g., 10000/3 = 3333, not 3333.33). Epic 18.5 for currency-aware rounding.

## Acceptance Criteria

### Grouped view (Por Grupo)
- **AC-1:** qty input always visible for every item (not conditional on qty > 1)
- **AC-2:** unitPrice displayed as read-only derived value for every item
- **AC-3:** When user changes qty → unitPrice recalculates immediately (on change, not on blur)
- **AC-4:** When user changes totalPrice → unitPrice recalculates immediately

### Original view (Original)
- **AC-5:** Add qty input to OriginalItemEditView (currently missing entirely)
- **AC-6:** Add unitPrice read-only display to OriginalItemEditView
- **AC-7:** Same derivation behavior as Grouped view

### Add Item
- **AC-8:** New items via "+ Agregar" initialize with `qty: 1` (currently missing)
- **AC-9:** New items show qty and unitPrice fields immediately

### Save path
- **AC-10:** Call `deriveItemsPrices()` in save handler before writing to Firestore
- **AC-11:** Verify qty and unitPrice are persisted correctly to Firestore

### Display consistency
- **AC-12:** View mode (TransactionCard, QuickSaveCard, ItemDisplayRow) unchanged — still hide qty/unitPrice when qty=1
- **AC-13:** View mode shows qty and unitPrice when qty > 1 (unchanged)

## Tasks

1. **EditorItemsSection.tsx (Grouped view):** Remove `(item.qty ?? 1) > 1` conditional on qty input and unitPrice display. Make unitPrice read-only.
2. **EditViewItemsSection.tsx (Original view):** Add qty input + unitPrice display following same pattern as Grouped view.
3. **TransactionEditorViewInternal.tsx:** Add `qty: 1` to `handleAddItem()` item initialization.
4. **TransactionEditorViewInternal.tsx:** Call `deriveItemsPrices()` in `handleFinalSave()` before Firestore write.
5. **itemPriceDerivation.ts:** Verify derivation handles qty=1 correctly (unitPrice = totalPrice).
6. **Tests:** Unit tests for derivation with qty=1, qty>1, and edge cases (qty=0 → coerce to 1).

## Files to Modify
- `src/features/transaction-editor/views/TransactionEditorView/EditorItemsSection.tsx`
- `src/features/transaction-editor/views/EditViewItemsSection.tsx`
- `src/features/transaction-editor/views/TransactionEditorViewInternal.tsx`
- `src/entities/transaction/utils/itemPriceDerivation.ts` (verify, may not need changes)
- `tests/unit/entities/transaction/utils/itemPriceDerivation.test.ts`

## Out of Scope
- Decimal qty (separate story TD-18-14)
- Currency-aware rounding (Epic 18.5)
- Changing view-mode display behavior
- unitPrice editability (always derived)

## Senior Developer Review (ECC)
- **Date:** 2026-03-19
- **Classification:** SIMPLE
- **Agents:** code-reviewer (7.5/10), tdd-guide (3/10), ui-consistency (7/10)
- **Overall:** 5.8/10 → CHANGES REQUESTED → 7 quick fixes applied → APPROVE
- **Quick fixes applied:** i18n key, SSoT derivation helper, touch targets, onChange guard, consistent labels, dead ternary, aria-labels
- **TD story created:** TD-18-15 (item editor qty test coverage, 2 pts)
- **Backlog:** 2 entries (controlled/uncontrolled mismatch, duplicate validation logic)

### Repeat Review (ECC)
- **Date:** 2026-03-19
- **Classification:** STANDARD
- **Agents:** code-reviewer (7/10), security-reviewer (8/10), ui-consistency (8/10)
- **Overall:** 7.5/10 → CHANGES REQUESTED → 6 quick fixes applied → APPROVE
- **Quick fixes applied:** controlled→uncontrolled qty inputs, single-const derivation, aria-label on GroupedItemEditView, truncate on unitPrice spans, qty upper-bound guard (1-9999), blocklist ordering normalization
- **Backlog updated:** 1 entry updated (qty mismatch resolved, totalPrice remains), 1 new entry (structural layout difference)

### Deferred Item Tracking
| # | Finding | Stage | Destination | Tracking |
|---|---------|-------|-------------|----------|
| 2 | Missing test coverage for 7/13 ACs | MVP | TD-18-15 | ready-for-dev |
| 4 | Controlled vs uncontrolled totalPrice mismatch | PROD | Backlog | deferred-findings.md (updated) |
| 10 | Duplicate qty validation logic | PROD | Backlog | deferred-findings.md |
| 4r | Structural layout diff grouped vs original | PROD | Backlog | deferred-findings.md (new) |

<!-- CITED: L2-008 (SSoT), L2-002 (input sanitization) -->
