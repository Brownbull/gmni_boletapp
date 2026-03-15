# Tech Debt Story TD-18-8: Rename TransactionItem.price to totalPrice

Status: done

> **Source:** Schema cleanup for item fields enrichment (2026-03-13)
> **Priority:** HIGH | **Estimated Effort:** 3 points

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Call the number what it is — total price, not just price"
**Value:** V1 — "Can they see the items, not just the total?" + V2 — "Would you bet money on this number?" — ambiguous `price` field causes unit vs total confusion in AI extraction.

## Story
As a **developer**, I want **TransactionItem.price renamed to totalPrice across the entire codebase**, so that **the field name is unambiguous and ready for unitPrice addition without backward compatibility code**.

## Background
`TransactionItem.price` is ambiguous — sometimes it's the unit price, sometimes the line total. This ambiguity causes Gemini to return wrong values (e.g., Manteca receipt: 4x$2,000=$8,000 but extracted as price=2,000). Renaming to `totalPrice` makes the semantics explicit and prepares the schema for adding `unitPrice` in story 18-8.

### Scope
- 3 TransactionItem interface definitions (canonical + 2 local copies)
- ~79 occurrences of `item.price` / `.price` across 33 files
- Firestore existing documents store `price` — need read-time normalization at repository boundary
- AI prompt returns `price` — update to return `totalPrice`

## Acceptance Criteria

### Functional
- **AC-1:** `TransactionItem.price` renamed to `totalPrice` in `src/types/transaction.ts`
- **AC-2:** Local TransactionItem copies in TransactionCard and editViewHelpers updated to match
- **AC-3:** All 33 consumer files updated — `item.price` → `item.totalPrice`
- **AC-4:** V4 prompt updated to request `totalPrice` instead of `price` in item schema
- **AC-5:** `tsc --noEmit` passes with zero errors after rename
- **AC-6:** All existing tests pass (update test fixtures as needed)

### Data Compatibility
- **AC-7:** Transaction normalizer handles old Firestore documents with `price` field — maps to `totalPrice` on read (single line, at boundary)
- **AC-8:** New documents written with `totalPrice` field name
- **AC-9:** No separate backward-compatibility layer — compat is ONE mapping in the normalizer, not scattered

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| TransactionItem type | `src/types/transaction.ts` | EDIT |
| TransactionCard type | `src/features/history/components/TransactionCard.tsx` | EDIT |
| editViewHelpers type | `src/features/transaction-editor/views/editViewHelpers.ts` | EDIT |
| V4 prompt | `functions/src/prompts/v4-spanish-taxonomy.ts` | EDIT |
| Transaction normalizer | `src/utils/transactionNormalizer.ts` | EDIT |
| ~28 more consumer files | various | EDIT |

## Tasks

### Task 1: Rename type field (3 subtasks)
- [x] 1.1: Rename `price: number` → `totalPrice: number` in canonical `TransactionItem` (`src/types/transaction.ts`)
- [x] 1.2: Update local TransactionItem in TransactionCard.tsx and editViewHelpers.ts
- [x] 1.3: Run `tsc --noEmit` to get complete list of broken references

### Task 2: Update all consumers (3 subtasks)
- [x] 2.1: Fix all TypeScript errors from Task 1 — mechanical rename of `item.price` → `item.totalPrice`
- [x] 2.2: Update V4 prompt to request `totalPrice` instead of `price` in item response schema
- [x] 2.3: Update transaction normalizer to map old Firestore `price` → `totalPrice` on read

### Task 3: Update tests (2 subtasks)
- [x] 3.1: Update all test fixtures that create TransactionItem objects with `price` → `totalPrice`
- [x] 3.2: Run `test:quick` — all tests pass

## Sizing
- **Points:** 3 (MEDIUM — many files but mechanical rename)
- **Tasks:** 3
- **Subtasks:** 8
- **Files:** ~33

## Dependencies
- None (standalone — unblocks 18-8)

## Risk Flags
- WIDE_BLAST_RADIUS (33 files — use TypeScript compiler to catch all references)
- DATA_COMPAT (old Firestore docs have `price` — normalizer must handle)

## Review Findings (2026-03-13)

| # | Finding | Stage | Destination | Status |
|---|---------|-------|-------------|--------|
| 1 | Missed rename: airlock.ts:85 | MVP | Fixed in review | Done |
| 2 | Cloud Function coercion missing price→totalPrice remap | MVP | Fixed in review | Done |
| 3 | JSON_FORMAT_INSTRUCTIONS says "price" (2 copies) | MVP | Fixed in review | Done |
| 4 | buildBasePrompt inline text says "price" (2 copies) | MVP | Fixed in review | Done |
| 5 | No test for compat fallback (AC-7) | MVP | Fixed in review | Done |
| 6 | Two compat locations instead of one (AC-9) | PROD | Backlog (deferred-findings.md) | Tracked |
| 7 | Stale comment in security test | MVP | Fixed in review | Done |
| 8 | TODO for (i as any).price removal | PROD | Fixed in review | Done |

## Senior Developer Review (ECC)
- **Date:** 2026-03-13
- **Classification:** COMPLEX (33 files, security + architecture)
- **Agents:** code-reviewer (7.5/10), security-reviewer (8/10), architect (6.5/10), tdd-guide (6/10)
- **Overall:** 7.0/10 → APPROVE (after 7 quick fixes)
- **Action items:** 7 fixed in session, 1 deferred to PROD backlog
- **Tests:** 319 files, 7422 tests pass, 0 failures
- **Cost:** $17.50

<!-- CITED: L2-008 (SSoT), L2-001 (git staging) -->
