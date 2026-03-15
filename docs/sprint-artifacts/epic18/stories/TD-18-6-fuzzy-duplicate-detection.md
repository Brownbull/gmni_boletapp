# Tech Debt Story TD-18-6: Fuzzy Merchant Name Duplicate Detection

Status: done

> **Source:** Production UX issue (2026-03-13)
> **Priority:** MEDIUM | **Estimated Effort:** 3 points

## Intent
**Epic Handle:** "One statement in, many verified transactions out"
**Story Handle:** "Same store, same bill, different spelling — still a duplicate"
**Value:** V2 — "Would you bet money on this number?" — prevent duplicates from slipping through due to merchant name variations.

## Story
As a **user**, I want **duplicate detection to catch transactions from the same store even when the merchant name varies slightly** (e.g., "SAUKO" vs "Sauko Emporio"), so that **I don't see phantom spending from what is clearly the same purchase**.

## Background
Current `duplicateDetectionService.ts` uses exact lowercase merchant match via `getBaseGroupKey()`: `date|merchant|total`. Two receipts from the same purchase with slightly different merchant names (OCR variations, abbreviated names, full legal names) are missed.

### Real Example
- Transaction 1: merchant="SAUKO", total=$32,305, date=06/03/2026, Villarrica
- Transaction 2: merchant="Sauko Emporio", total=$32,305, date=06/03/2026, Villarrica
- Current: NOT flagged (lowercase "sauko" !== "sauko emporio")
- Expected: flagged as duplicate ("sauko" is contained in "sauko emporio")

## Acceptance Criteria

### Functional
- **AC-1:** Transactions with same date + same total are candidate duplicates regardless of merchant name
- **AC-2:** Within candidate group, merchants are compared using **lowercase containment**: if `nameA.includes(nameB)` or `nameB.includes(nameA)` → duplicate
- **AC-3:** Minimum merchant name length for containment match: shorter name must be >= 4 characters (prevents "La" matching "La Vega", "La Barra", etc.)
- **AC-4:** Exact lowercase match still works as before (no regression)
- **AC-5:** Different merchants with same amount+date are NOT flagged (e.g., "Jumbo" vs "Lider")

### Performance
- **AC-6:** Detection completes in < 100ms for 1000 transactions
- **AC-7:** Algorithm: O(n) grouping by date+total, then O(k^2) containment within small groups (k is typically 2-5)

## File Specification

| File/Component | EXACT Path | Status |
|----------------|------------|--------|
| Duplicate detection | `src/services/duplicateDetectionService.ts` | EDIT |
| Tests | `tests/unit/services/duplicateDetectionService.test.ts` | EDIT |

## Tasks

### Task 1: Refactor grouping key (2 subtasks)
- [x] 1.1: Change `getBaseGroupKey()` to group by `date|total` only (drop merchant from key)
- [x] 1.2: Add merchant containment check in the pairwise comparison loop (inside `findDuplicates`)

### Task 2: Implement containment matching (3 subtasks)
- [x] 2.1: Create `areMerchantsMatching(name1, name2)` function: exact match OR containment (shorter name >= 4 chars included in longer name)
- [x] 2.2: Integrate into `findDuplicates()` — replace current implicit exact match with `areMerchantsMatching()`
- [x] 2.3: Keep existing `areLocationsMatching()` country refinement — applied after merchant match

### Task 3: Tests (4 subtasks)
- [x] 3.1: "SAUKO" vs "Sauko Emporio" same amount+date → duplicate
- [x] 3.2: "La" vs "La Vega" same amount+date → NOT duplicate (too short)
- [x] 3.3: "H&M" vs "H&M" same amount+date → duplicate (exact match)
- [x] 3.4: "Jumbo" vs "Lider" same amount+date → NOT duplicate (no containment)

### Task 4: Performance validation (1 subtask)
- [x] 4.1: Add benchmark test with 1000 transactions — assert < 100ms

## Sizing
- **Points:** 3 (MEDIUM)
- **Tasks:** 4
- **Subtasks:** 10
- **Files:** ~2

## Dependencies
- None (standalone)

## Risk Flags
- FALSE_POSITIVES (minimum length guard mitigates — test thoroughly)
- PERFORMANCE (O(k^2) within small groups is fine — k is typically 2-5 for same date+amount)

## Senior Developer Review (KDBP)

- **Date:** 2026-03-14
- **Agents:** code-reviewer (sonnet), tdd-guide (sonnet)
- **Classification:** SIMPLE
- **Outcome:** APPROVE 6.5/10
- **Quick fixes:** 4 applied (empty-merchant doc, containment perf test, variable naming, stale header)
- **Backlog deferrals:** 6 (5 PROD, 1 SCALE)

<!-- CITED: none -->

## Review Findings (2026-03-14)

| # | Finding | Stage | Destination | Status |
|---|---------|-------|-------------|--------|
| 1 | `getDuplicateKey` deprecation path incomplete | PROD | Backlog | Deferred |
| 2 | No group size cap on O(k^2) | SCALE | Backlog | Deferred |
| 3 | Document empty-merchant behavior | — | — | Fixed |
| 4 | Perf test doesn't exercise containment path | — | — | Fixed |
| 5 | Variable naming for equal-length case | — | — | Fixed |
| 6 | Dead time exports | PROD | Backlog | Deferred |
| 7 | Stale test file header | — | — | Fixed |
| 8 | `filterToDuplicatesGrouped` double call | PROD | Backlog | Deferred |
| 9 | Test file exceeds 300-line limit | PROD | Backlog | Deferred |
| 10 | Missing wrapper tests | PROD | Backlog | Deferred |
