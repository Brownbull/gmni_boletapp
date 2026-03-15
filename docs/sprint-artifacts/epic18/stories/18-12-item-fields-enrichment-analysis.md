# Story 18-12: Item Fields Enrichment Analysis — Unit Price, Quantity, and Per-Item Total

## Status: absorbed-by-18-8

> **Note (2026-03-13):** Analysis scope absorbed into story 18-8 (Item Price Extraction). The schema design, prompt changes, and downstream impact assessment are folded into 18-8's implementation tasks. No separate analysis document needed — the Manteca receipt (4×$2,000=$8,000) provides a concrete, reproducible test case that makes a formal spike unnecessary.

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Count the items properly — every line item should tell you what one costs, how many, and the total"

## Story
As a developer, I want to analyze and design the enrichment of transaction item fields to support unit price, quantity, and per-item total, so that the app correctly represents line items regardless of whether the receipt shows unit price, total price, or both.

## Background

### Current State
The `TransactionItem` interface (`src/types/transaction.ts:48`) has:
```typescript
interface TransactionItem {
  name: string;
  qty?: number;       // optional, often missing
  price: number;      // AMBIGUOUS — unit price? total? depends on receipt
  category?: ItemCategory | string;
  subcategory?: string;
  categorySource?: CategorySource;
  subcategorySource?: CategorySource;
}
```

The V4 prompt (`functions/src/prompts/v4-spanish-taxonomy.ts`) asks Gemini for:
```json
{ "name": "...", "price": <integer>, "quantity": <number, default 1>, "category": "...", "subcategory": "..." }
```

### The Problem
Many Chilean receipts show **both** unit price and total per line item:
```
2 x Coca-Cola 600ml      $1.290 c/u      $2.580
1 x Pan Hallulla kg       $2.490          $2.490
3 x Yogurt Colun          $890 c/u        $2.670
```

The current prompt asks for a single `price` field. Gemini sometimes returns:
- The **unit price** (`1290` for the Coca-Cola) with `quantity: 2`
- The **line total** (`2580` for the Coca-Cola) with `quantity: 2`
- Or worse — the **unit price** with `quantity: 1` (ignoring the quantity entirely)

This ambiguity causes:
1. **Total mismatch dialogs** — `sum(items)` doesn't match the receipt total
2. **Incorrect transaction totals** when items are later edited
3. **Confusion in statement matching** (Epic 18) — matching by amount becomes unreliable if item prices are inconsistent

### Desired State
Each item should carry enough information to reconstruct both unit price and line total:
- `name`: item description
- `quantity`: how many (default 1)
- `unitPrice`: price per single unit
- `totalPrice`: line total (unitPrice * quantity) — **or** the value directly from the receipt if both are shown
- When only one price is visible, derive the other from quantity

### Relationship to 18-8
Story 18-8 ("Single Scan Prompt Spike") is a prompt-only spike testing accuracy improvements. This story (18-12) is the **design analysis** that 18-8's prompt changes should implement. After 18-12 produces the design, 18-8 should be updated to implement it.

## Acceptance Criteria

### Analysis Deliverables
- **AC-1:** Document current failure modes — collect 10+ examples from production scan results where price/quantity is ambiguous or incorrect
- **AC-2:** Design the target `TransactionItem` schema with `unitPrice`, `quantity`, `totalPrice` fields — including types, optionality, defaults, and backward compatibility with existing data
- **AC-3:** Design the prompt changes needed — what Gemini should extract, how to instruct it to distinguish unit vs total price, validation rules
- **AC-4:** Design the default/derivation logic:
  - If only one price is present: derive the other from quantity
  - If both are present: validate consistency (unitPrice * quantity ≈ totalPrice)
  - If quantity is absent: default to 1, unitPrice = totalPrice
  - If neither price is present: flag as extraction failure
- **AC-5:** Assess backward compatibility — how existing transactions (with single `price` field) migrate or coexist with new schema
- **AC-6:** Assess impact on downstream consumers — transaction editor, analytics, reports, statement matching, total validation
- **AC-7:** Document go/no-go decision with implementation story sizing

### Architectural
- **AC-ARCH-1:** Analysis results at `docs/architecture/proposals/item-fields-enrichment-analysis.md`
- **AC-ARCH-2:** No production code changes in this story — analysis only
- **AC-ARCH-3:** Must consider impact on statement scanning (Epic 18) — statement transactions also have items with amounts

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Analysis document | `docs/architecture/proposals/item-fields-enrichment-analysis.md` | NEW |
| Test receipt samples | `prompt-testing/test-cases/ItemFieldAnalysis/` | NEW (if needed) |

## Tasks

### Task 1: Collect failure examples (2 subtasks)
- [ ] 1.1: Review production scan data and prompt-testing results for price/quantity mismatches
- [ ] 1.2: Categorize failure modes (unit vs total confusion, missing quantity, multi-line items, bundled prices, discounts, tax-inclusive vs exclusive)

### Task 2: Design target schema (3 subtasks)
- [ ] 2.1: Define `TransactionItem` v2 with `unitPrice`, `quantity`, `totalPrice` — types, optionality, defaults
- [ ] 2.2: Define migration strategy for existing `price` field → new fields (read-time vs write-time migration)
- [ ] 2.3: Define Firestore rules impact (if item field validation exists)

### Task 3: Design prompt changes (2 subtasks)
- [ ] 3.1: Draft updated item schema for Gemini prompt with explicit unit/total distinction
- [ ] 3.2: Draft validation/derivation rules to include in the prompt (e.g., "if receipt shows 2x$1290=$2580, return unitPrice=1290, quantity=2, totalPrice=2580")

### Task 4: Assess downstream impact (3 subtasks)
- [ ] 4.1: Audit transaction editor — how items are displayed and edited (EditorItemsSection, EditViewItemsSection)
- [ ] 4.2: Audit analytics/reports — how item prices are aggregated (category statistics, reports)
- [ ] 4.3: Audit statement matching — how item amounts factor into matching logic

### Task 5: Document decision (1 subtask)
- [ ] 5.1: Write analysis doc with schema proposal, migration plan, downstream impact, and go/no-go + sizing for implementation stories

## Sizing
- **Points:** 3 (MEDIUM — analysis touches multiple subsystems)
- **Tasks:** 5
- **Subtasks:** 11
- **Files:** ~2

## Dependencies
- **Soft dependency on TD-18-2:** The coercion fix should ship first so we have clean scan data to analyze
- **Informs 18-8:** This analysis should produce the design that 18-8's prompt changes implement
- **Informs statement matching (18-10a/b):** Item-level matching accuracy depends on clean item data

## Risk Flags
- BACKWARD_COMPATIBILITY (existing transactions have single `price` field — migration needed)
- PROMPT_ITERATION (Gemini's ability to distinguish unit vs total needs testing)
- SCOPE_CREEP (analysis could expand into full item editor redesign — keep it focused on schema + prompt)
