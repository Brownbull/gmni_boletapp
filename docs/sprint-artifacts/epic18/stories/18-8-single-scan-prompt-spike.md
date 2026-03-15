# Story 18-8: Item Price Extraction — unitPrice, Quantity, and Total Accuracy

## Status: done

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Count the items properly — every line item should tell you what one costs, how many, and the total"
**Values:** V1 — "Can they see the items, not just the total?" (item-level granularity) + V2 — "Would you bet money on this number?" (accuracy over speed)

## Story
As a **user**, I want **receipt scanning to correctly extract unit price, quantity, and total price for each item**, so that **a receipt showing "4 x $2,000 = $8,000" records $8,000 as the total, not $2,000**.

## Background

### Absorbs 18-12 Analysis
This story absorbs the analysis work from 18-12 (item fields enrichment analysis). The schema design is well-understood from real failure cases — a separate analysis doc adds delay without value.

### The Problem
The Manteca receipt shows: `4.00 UN X 2,000 = 8,000` — clearly 4 units at $2,000 each = $8,000 total. But Gemini returns `totalPrice=2000, qty=4` — treating the unit price as the total.

### Prerequisite: TD-18-8
TD-18-8 renames `TransactionItem.price` → `totalPrice` across the codebase. This story adds `unitPrice` and updates the prompt to extract both values correctly.

### Target Schema (after TD-18-8 + this story)
```typescript
interface TransactionItem {
  name: string;
  qty?: number;           // quantity (default 1) — already exists
  unitPrice?: number;     // NEW: price per single unit
  totalPrice: number;     // RENAMED from price (TD-18-8): line total
  category?: ItemCategory | string;
  subcategory?: string;
  categorySource?: CategorySource;
  subcategorySource?: CategorySource;
}
```

## Acceptance Criteria

### Schema
- **AC-1:** `unitPrice?: number` added to `TransactionItem` in `src/types/transaction.ts`
- **AC-2:** Derivation logic: if only one price present, derive the other from `qty`. If both present, validate `unitPrice * qty ≈ totalPrice` (within 5% tolerance for rounding)
- **AC-3:** If `qty` absent: default to 1, `unitPrice = totalPrice`

### Prompt
- **AC-4:** V4 prompt updated to extract `unitPrice`, `quantity`, `totalPrice` per item with explicit disambiguation instructions
- **AC-5:** Prompt includes example: "if receipt shows 4 x 2,000 = 8,000, return unitPrice=2000, quantity=4, totalPrice=8000"
- **AC-6:** Cloud Function response parsing handles all three fields

### Display
- **AC-7:** QuickSaveCard shows `unitPrice x qty` format when `qty > 1` (e.g., "$2,000 x4")
- **AC-8:** EditorItemsSection shows unitPrice and qty as editable fields
- **AC-9:** Item price display falls back gracefully when `unitPrice` is missing (old data)

### Validation
- **AC-10:** Test with Manteca receipt (4x$2,000=$8,000) — must return correct values
- **AC-11:** Test with 5+ diverse receipts including: single items, multi-quantity, no unit price shown, both prices shown

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| TransactionItem type | `src/types/transaction.ts` | EDIT |
| V4 prompt | `functions/src/prompts/v4-spanish-taxonomy.ts` | EDIT |
| Cloud Function parsing | `functions/src/analyzeReceipt.ts` | EDIT |
| Transaction normalizer | `src/utils/transactionNormalizer.ts` | EDIT |
| Derivation util | `src/entities/transaction/utils/itemPriceDerivation.ts` | NEW |
| QuickSaveCard | `src/features/scan/components/QuickSaveCard.tsx` | EDIT |
| EditorItemsSection | `src/features/transaction-editor/views/EditViewItemsSection.tsx` | EDIT |
| EditorItemsSection | `src/features/transaction-editor/views/TransactionEditorView/EditorItemsSection.tsx` | EDIT |
| Total validation | `src/features/scan/utils/totalValidation.ts` | EDIT |
| Tests | `tests/unit/` | NEW/EDIT |
| Prompt test case | `prompt-testing/test-cases/edge-cases/` | READ |

## Tasks

### Task 1: Add unitPrice to schema (2 subtasks)
- [ ] 1.1: Add `unitPrice?: number` to TransactionItem in `src/types/transaction.ts`
- [ ] 1.2: Update local TransactionItem copies if any remain after TD-18-8

### Task 2: Create derivation logic (3 subtasks)
- [ ] 2.1: Create `itemPriceDerivation.ts` with `deriveItemPrices(item)`: fills missing unitPrice or totalPrice from qty
- [ ] 2.2: Add consistency validation: `unitPrice * qty ≈ totalPrice` (5% tolerance)
- [ ] 2.3: Integrate derivation into transaction normalizer — run on every scan result

### Task 3: Update prompt (2 subtasks)
- [ ] 3.1: Update V4 prompt item schema: request `unitPrice`, `quantity`, `totalPrice` with explicit disambiguation instructions
- [ ] 3.2: Update Cloud Function response parsing to handle new fields + coerce to numbers

### Task 4: Update display (2 subtasks)
- [ ] 4.1: QuickSaveCard: show `unitPrice x qty` format when `qty > 1`
- [ ] 4.2: EditorItemsSection: add unitPrice field, show derived totalPrice

### Task 5: Testing (3 subtasks)
- [ ] 5.1: Unit test derivation logic — all permutations (both prices, unit only, total only, neither, qty missing)
- [ ] 5.2: Unit test backward compat — old items with only `totalPrice` (no `unitPrice`) display correctly
- [ ] 5.3: Prompt test with Manteca receipt + 5 diverse receipts — document accuracy

## Sizing
- **Points:** 5 (LARGE — schema + prompt + display + derivation)
- **Tasks:** 5
- **Subtasks:** 12
- **Files:** ~10

## Dependencies
- **DEPENDS: TD-18-8** (price → totalPrice rename must ship first)
- Absorbs: 18-12 (item fields enrichment analysis)

## Risk Flags
- PROMPT_ITERATION (Gemini's ability to distinguish unit vs total needs testing)
- DISPLAY_CHANGES (QuickSaveCard and EditorItemsSection — follow UI patterns manifest)

## Review Findings (2026-03-14)

| # | Finding | Stage | Destination | Status |
|---|---------|-------|-------------|--------|
| 1 | unitPrice not sanitized in sanitizeTransactions | MVP | Fixed in review | Done |
| 2 | EditorItemsSection name+subcategory bypass sanitizeInput | MVP | Fixed in review | Done |
| 3 | Hardcoded "Unit"/"Unit price" placeholders not i18n | MVP | Fixed in review | Done |
| 4 | Missing aria-label on delete/confirm buttons | MVP | Fixed in review | Done |
| 5 | Keyboard inaccessible item rows in EditorItemsSection | MVP | Fixed in review | Done |
| 6 | Inline SVG pencil → Lucide Pencil | MVP | Fixed in review | Done |
| 7 | Touch target mismatch min-w-9 vs min-w-10 | MVP | Fixed in review | Done |
| 8 | No negative totalPrice guard in validateItemPriceConsistency | MVP | Fixed in review | Done |
| 9 | normalizeItems diverges from pipeline (missing deriveItemsPrices) | PROD | Backlog (deferred-findings.md) | Tracked |
| 10 | Math.round CLP-only assumption undocumented | MVP | Fixed in review | Done |
| 11 | unitPrice NaN from Gemini empty-string in Cloud Function | MVP | Fixed in review | Done |
| 12 | OriginalItemEditView totalPrice onBlur no reset | MVP | Fixed in review | Done |
| 13 | validateItemPriceConsistency unused export | — | Archived (future use) | — |
| 14 | Prompt "MUST equal" contradicts 5% tolerance | MVP | Fixed in review | Done |
| 15 | qty placeholder inline ternary bypasses t() | — | Archived (pre-existing) | — |

## Senior Developer Review (ECC)
- **Date:** 2026-03-14
- **Classification:** STANDARD (5 tasks, ~10 files, security files)
- **Agents:** code-reviewer (7/10), security-reviewer (6.5/10), ui-consistency (6/10)
- **Overall:** 6.5/10 → APPROVE (after 12 quick fixes)
- **Action items:** 12 fixed in session, 1 deferred to PROD backlog, 2 archived
- **Tests:** 148 pass, 7 pre-existing systemic failures (V3→V4 prompt tests)

<!-- CITED: L2-002 (sanitization), L2-005 (feature exports), L2-008 (SSoT) -->
