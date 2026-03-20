# Story TD-18-14: Decimal Quantity Support (Weight-Based Items)

Status: done

> **Source:** Field gap analysis adversarial review (2026-03-19) — editor blocks decimal qty but derivation supports it
> **Priority:** MEDIUM | **Estimated Effort:** 2 points
> **DEPENDS:** TD-18-13 (qty field must be always visible first)

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Half a kilo is a valid purchase"
**Value:** V5 — "Easier than the receipt drawer"

## Story
As a **user**, I want **to enter decimal quantities like 0.633 kg when editing items**, so that **weight-based grocery purchases are accurately tracked with correct per-unit (per-kg) pricing**.

## Background

### Current behavior
- Editor input has `inputMode="numeric"` + `pattern="[0-9]*"`
- `preventDefault` on `.`, `,`, `e`, `+`, `-` keys (EditorItemsSection.tsx:456-458)
- Derivation logic (`itemPriceDerivation.ts`) already supports decimals — no validation against them
- Only the UI blocks decimal entry

### Target behavior
- Allow decimal qty up to 3 decimal places (e.g., 0.633, 1.5, 2.250)
- Minimum qty: 0.001
- unitPrice derivation becomes "price per 1 unit" (e.g., per kg, per liter)
- Example: totalPrice=5000, qty=0.633 → unitPrice = Math.round(5000/0.633) = 7899 (price per kg)

### Gemini prompt consideration
- V4 prompt already extracts quantity as a number (no integer constraint)
- Receipts like "0.633 kg x $7,899/kg = $4,999" are already handled
- No prompt changes needed

## Acceptance Criteria

### Editor input
- **AC-1:** qty input accepts decimal values (allow `.` key, remove preventDefault)
- **AC-2:** Maximum 3 decimal places enforced in input (e.g., 0.633 valid, 0.6333 truncated)
- **AC-3:** Minimum value 0.001 (validated on blur or save)
- **AC-4:** `inputMode="decimal"` for mobile numeric keyboard with decimal point
- **AC-5:** Both Grouped and Original views support decimal qty

### Derivation
- **AC-6:** `deriveItemsPrices()` handles decimal qty correctly (already does — verify)
- **AC-7:** unitPrice display shows integer result for CLP (Math.round)
- **AC-8:** Edge case: qty=0.001 → unitPrice = totalPrice/0.001 (very large but valid)

### Display
- **AC-9:** View mode shows decimal qty when qty is not exactly 1 (e.g., "0.633 kg" or "x0.633")
- **AC-10:** QuickSaveCard and TransactionCard display decimal qty correctly

## Tasks

1. **EditorItemsSection.tsx:** Remove preventDefault on `.` key. Change `inputMode` to `"decimal"`. Add 3-decimal-place validation.
2. **EditViewItemsSection.tsx:** Same changes for Original view.
3. **Input validation:** On blur, clamp to 3 decimal places and minimum 0.001.
4. **Display components:** Verify TransactionCard and QuickSaveCard handle decimal qty in display (e.g., "x0.633" not "x0").
5. **Tests:** Unit tests for decimal qty derivation, display formatting, input validation.

## Files to Modify
- `src/features/transaction-editor/views/TransactionEditorView/EditorItemsSection.tsx`
- `src/features/transaction-editor/views/EditViewItemsSection.tsx`
- `src/features/history/components/TransactionCard.tsx` (verify display)
- `src/features/scan/components/QuickSaveCard.tsx` (verify display)
- `tests/unit/entities/transaction/utils/itemPriceDerivation.test.ts`

## Senior Developer Review (ECC)

- **Date:** 2026-03-19
- **Agents:** code-reviewer (sonnet), security-reviewer (sonnet), ui-consistency-reviewer (sonnet)
- **Classification:** STANDARD
- **Outcome:** APPROVE 8.3/10 — 7 quick fixes applied, 1 archived
- **Quick fixes:** import alias, handleUpdateItem delegation, aria-labels (x5), shouldShowQty(0) guard, formatQty Infinity guard, test import alias
- **Archived:** #7 (sanitizeQtyInput double-dot flash — by design, cosmetic)
- **TD stories:** 0 | **Backlog:** 0

<!-- CITED: L2-008, L2-005 -->

## Out of Scope
- Unit labels (kg, L, units) — future story
- Currency-aware decimal rounding (Epic 18.5)
- Gemini prompt changes (already supports decimals)
