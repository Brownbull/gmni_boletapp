# Story 15b-4a: Design Transaction Type Refactoring Architecture

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture
**Points:** 2
**Priority:** HIGH
**Status:** done

## Overview

Analyze the current `transaction.ts` type hierarchy (143 lines, 101 consumers) and design a refactoring strategy to reduce coupling. The primary issue: ~15 files import only category types (`StoreCategory`, `ItemCategory`, `CategorySource`, `MerchantSource`) but depend on `@/types/transaction` as a side effect. This story produces a design document recommending the simpler approach of redirecting category-only consumers to `shared/schema/categories.ts` directly, eliminating the need for complex sub-typing.

## Functional Acceptance Criteria

- [x] **AC1:** Design document exists at `docs/architecture/transaction-type-refactor-design.md`
- [x] **AC2:** Document identifies all category-only consumers across config, utils, hooks, and types
- [x] **AC3:** Document recommends redirect strategy (update imports in category-only files to use `shared/schema/categories` directly) vs. complex sub-type splitting
- [x] **AC4:** Document justifies why flat `Transaction` type is appropriate (68/120 consumers need only the `Transaction` interface)
- [x] **AC5:** No code changes — design only

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** Design document at `docs/architecture/transaction-type-refactor-design.md`

### Pattern Requirements

- [x] **AC-ARCH-PAT-1:** Design document follows ADR format (Problem, Analysis, Solution, Rationale, Impact)
- [x] **AC-ARCH-PAT-2:** Consumer analysis is data-driven (cite actual import counts from grep)

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No code changes in this story (design only)
- [x] **AC-ARCH-NO-2:** Document does NOT propose complex sub-types (TransactionBase, TransactionDisplay, TransactionMutation) — the flat interface is correct given the actual usage patterns

## File Specification

### New Files

| File | Exact Path | Purpose | Est. Lines |
|------|------------|---------|------------|
| Transaction Type Refactor Design | `docs/architecture/transaction-type-refactor-design.md` | ADR-style document recommending category-only consumer redirect strategy | ~150 |

### Modified Files

None — design-only story.

## Tasks / Subtasks

### Task 1: Research current consumer chain

- [x] 1.1 `grep -rn "from.*types/transaction" src/ --include="*.ts" --include="*.tsx" | wc -l` — **120 consumers** (updated from 101)
- [x] 1.2 `grep -rn "from.*types/transaction" src/ --include="*.ts" --include="*.tsx" | grep -v "Transaction"` — found 15 pure category-type consumers + 2 CategorySource/MerchantSource-only
- [x] 1.3 Classify each consumer: 68 Transaction-only / 15 category-types-only / 2 CategorySource-MerchantSource-only / rest mixed

### Task 2: Analyze transaction.ts type structure

- [x] 2.1 Confirmed: `StoreCategory` and `ItemCategory` ARE re-exported FROM `shared/schema/categories.ts` (transaction.ts line 11)
- [x] 2.2 Confirmed: `CategorySource` and `MerchantSource` do NOT exist in `shared/schema/categories.ts` — defined in transaction.ts (lines 55, 63). Re-export via new `src/types/categories.ts` barrel recommended for 15b-4b.
- [x] 2.3 Documented: `Transaction` interface is flat (20+ fields including timestamps, v2.6.0 prompt fields). No natural sub-type split.

### Task 3: Design refactoring strategy

- [x] 3.1 Problem statement: 120 consumers, ~15-17 only need category types
- [x] 3.2 Solution: create `src/types/categories.ts` re-export barrel, redirect 15-17 category-only files to `@/types/categories`
- [x] 3.3 Documented why flat Transaction is correct (68/120 consumers only use `{ Transaction }` — sub-types add complexity with no benefit)
- [x] 3.4 Expected impact: reduce transaction.ts dependents from 120 to ~103-105. Revised target: ≤105.

### Task 4: Write design document

- [x] 4.1 Written: `docs/architecture/transaction-type-refactor-design.md` with ADR sections (Problem, Analysis, Solution, Rationale, Impact)
- [x] 4.2 Included consumer analysis table (import category, count, files affected)
- [x] 4.3 Included explicit list of 15-17 target files for 15b-4b refactoring
- [x] 4.4 Included revised target: ≤105 transaction.ts dependents (not <50 — unreachable without sub-typing)

## Dev Notes

### Consumer Analysis (Verified 2026-02-28)

**Total transaction.ts consumers: 120 files** (includes relative `./transaction` imports in src/types/)

**Import breakdown:**
- 68 import only `{ Transaction }` — no change needed
- 9 import `{ Transaction, TransactionItem }` — keep as is
- 6 import `{ Transaction, StoreCategory }` — mixed (keep transaction.ts dep)
- 3 import `{ Transaction, StoreCategory, ItemCategory }` — mixed
- 3 re-export barrels (`entities/transaction/types.ts`, `entities/transaction/index.ts`, `types/index.ts`)
- 1 import only `{ TransactionPeriods }` — keep as is
- 1 import only `{ TransactionItem }` — keep as is
- 15 import only `{ StoreCategory }` and/or `{ ItemCategory }` — **redirect to categories**
- 2 import only `{ CategorySource }` and/or `{ MerchantSource }` — **conditionally redirectable**
- 12 other mixed

**Category-only consumers (15 files — verified for redirect):**
See design doc `docs/architecture/transaction-type-refactor-design.md` for full table.

### Path Resolution (Verified 2026-02-28)

- `@shared/*` resolves to `src/shared/*` — does NOT cover `shared/schema/categories.ts` (repo root)
- **Solution:** Create `src/types/categories.ts` re-export barrel → consumers use `@/types/categories`
- This avoids creating a new tsconfig alias

### Why NOT sub-typing

See design doc — 68/120 consumers use only `{ Transaction }`, sub-types add no value.

## ECC Analysis Summary

- **Risk Level:** LOW (design-only, no code changes)
- **Complexity:** Low — analysis and documentation
- **Sizing:** 4 tasks / 10 subtasks / 1 new file
- **Agents consulted:** Architect

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Classification | SIMPLE |
| Agents | code-reviewer, tdd-guide |
| Outcome | APPROVE 9.5/10 |
| Quick Fixes | 2 (doc status field, barrel back-reference note) |
| TD Stories | 0 |

**Findings:** All 10 ACs validated. Consumer analysis data verified (math checks out: 120 total). Design document follows ADR format with data-driven recommendations. No code changes (AC5 confirmed). Two LOW cosmetic fixes applied.

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (stub) |
| 2026-02-23 | Full rewrite with codebase research. Key finding: 101 actual consumers (not 109), Transaction is a flat type that doesn't benefit from sub-typing. Redirecting ~15 category-only consumers to shared/schema/categories is the correct approach. Target revised from <50 to <88. |
| 2026-02-27 | ECC re-creation validation: Consumer count corrected 101→110. Category-only count verified ~12 (not 48 from initial exploration). `CategorySource`/`MerchantSource` must be added to `shared/schema/categories.ts`. Target revised ≤88→≤100. Status: ready-for-dev. |
| 2026-02-28 | Implementation complete. Actual consumer count: 120 (includes relative imports in src/types/). Category-only: 15 files + 2 CategorySource/MerchantSource files. Solution: create `src/types/categories.ts` barrel (solves path alias issue). Target revised: ≤105. Design doc written. |
