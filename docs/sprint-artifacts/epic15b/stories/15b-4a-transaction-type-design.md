# Story 15b-4a: Design Transaction Type Refactoring Architecture

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture
**Points:** 2
**Priority:** HIGH
**Status:** ready-for-dev

## Overview

Analyze the current `transaction.ts` type hierarchy (143 lines, 101 consumers) and design a refactoring strategy to reduce coupling. The primary issue: ~15 files import only category types (`StoreCategory`, `ItemCategory`, `CategorySource`, `MerchantSource`) but depend on `@/types/transaction` as a side effect. This story produces a design document recommending the simpler approach of redirecting category-only consumers to `shared/schema/categories.ts` directly, eliminating the need for complex sub-typing.

## Functional Acceptance Criteria

- [ ] **AC1:** Design document exists at `docs/architecture/transaction-type-refactor-design.md`
- [ ] **AC2:** Document identifies all category-only consumers across config, utils, hooks, and types
- [ ] **AC3:** Document recommends redirect strategy (update imports in category-only files to use `shared/schema/categories` directly) vs. complex sub-type splitting
- [ ] **AC4:** Document justifies why flat `Transaction` type is appropriate (67/101 consumers need only the `Transaction` interface)
- [ ] **AC5:** No code changes — design only

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Design document at `docs/architecture/transaction-type-refactor-design.md`

### Pattern Requirements

- [ ] **AC-ARCH-PAT-1:** Design document follows ADR format (Problem, Analysis, Solution, Rationale, Impact)
- [ ] **AC-ARCH-PAT-2:** Consumer analysis is data-driven (cite actual import counts from grep)

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No code changes in this story (design only)
- [ ] **AC-ARCH-NO-2:** Document does NOT propose complex sub-types (TransactionBase, TransactionDisplay, TransactionMutation) — the flat interface is correct given the actual usage patterns

## File Specification

### New Files

| File | Exact Path | Purpose | Est. Lines |
|------|------------|---------|------------|
| Transaction Type Refactor Design | `docs/architecture/transaction-type-refactor-design.md` | ADR-style document recommending category-only consumer redirect strategy | ~150 |

### Modified Files

None — design-only story.

## Tasks / Subtasks

### Task 1: Research current consumer chain

- [ ] 1.1 `grep -rn "from.*types/transaction" src/ --include="*.ts" --include="*.tsx" | wc -l` — confirm 101 consumers
- [ ] 1.2 `grep -rn "from.*types/transaction" src/ --include="*.ts" --include="*.tsx" | grep -v "Transaction"` — find pure category-type consumers
- [ ] 1.3 Classify each consumer: Transaction-only / category-types-only / mixed

### Task 2: Analyze transaction.ts type structure

- [ ] 2.1 Confirm `StoreCategory` and `ItemCategory` are re-exported FROM `shared/schema/categories.ts` (not defined in transaction.ts)
- [ ] 2.2 Check whether `CategorySource` and `MerchantSource` exist in `shared/schema/categories.ts` — if not, they will need to move there in 15b-4b
- [ ] 2.3 Document that `Transaction` interface is flat (15 fields, no natural sub-type split)

### Task 3: Design refactoring strategy

- [ ] 3.1 Write problem statement: 101 consumers, ~15 only need category types
- [ ] 3.2 Propose solution: redirect ~15 category-only files to import from `shared/schema/categories` directly
- [ ] 3.3 Document why flat Transaction is correct (67/101 consumers only use `Transaction` as a prop/return type — sub-types add complexity with no benefit)
- [ ] 3.4 Document expected impact: reduce transaction.ts dependents from 101 to ~86

### Task 4: Write design document

- [ ] 4.1 Write `docs/architecture/transaction-type-refactor-design.md` with ADR sections
- [ ] 4.2 Include consumer analysis table (import category, count, files affected)
- [ ] 4.3 Include the explicit list of ~15 target files for 15b-4b refactoring
- [ ] 4.4 Include revised target: `<88` transaction.ts dependents (not `<50` — the original target was unreachable without sub-typing)

## Dev Notes

### Consumer Analysis (Pre-Researched)

**Total transaction.ts consumers: 101 files (not 109 — stub estimate was off)**

**Import breakdown:**
- 67 import only `{ Transaction }` — no change needed
- 7 import only `{ StoreCategory }` — redirect to categories
- 5 import `{ Transaction, TransactionItem }` — keep as is
- 4 import `{ Transaction, StoreCategory }` — split import (Transaction stays, StoreCategory redirects)
- 2 import `{ StoreCategory, ItemCategory }` — redirect to categories
- 2 import `{ ItemCategory }` — redirect to categories
- Others: various mixed imports

**Category-only consumers (can fully redirect to `shared/schema/categories.ts`):**
- `src/config/categoryColors.ts` — `import type { StoreCategory, ItemCategory }`
- `src/utils/categoryEmoji.ts` — `import { StoreCategory }` (runtime!)
- `src/hooks/useCategoryMappings.ts` — `import { StoreCategory }` (runtime!)
- `src/hooks/useItemNameMappings.ts` — `import type { ItemCategory }`
- `src/hooks/useMerchantMappings.ts` — `import type { StoreCategory }`
- `src/components/dialogs/LearnMerchantDialog.tsx` — `import type { ItemCategory }`
- `src/features/transaction-editor/components/CategoryBadge.tsx` — `import type { CategorySource }`
- `src/types/categoryMapping.ts` — `import { StoreCategory }`
- `src/types/itemNameMapping.ts` — `import { ItemCategory }`
- `src/types/merchantMapping.ts` — `import { StoreCategory }`

### Why NOT sub-typing (TransactionBase, TransactionDisplay, TransactionMutation)

The stub proposed this approach. The actual data shows it's overkill:
1. `Transaction` is a flat, coherent domain object with 15 fields
2. 67 of 101 consumers use only `{ Transaction }` — they'd keep the same import regardless of sub-typing
3. Sub-types would require migrating 101 files across 4c/4d/4e — high blast radius, low benefit
4. No natural "display only" vs "mutation only" split exists — most fields are needed in both contexts

### Important Path Note

The canonical categories file is at `shared/schema/categories.ts` (repo root, NOT inside `src/`). In `src/types/transaction.ts`, it's imported via relative path: `../../shared/schema/categories`. The correct import path for other files needs verification based on their depth. There may NOT be an `@/shared/schema/categories` alias — check tsconfig aliases before specifying this in 15b-4b.

## ECC Analysis Summary

- **Risk Level:** LOW (design-only, no code changes)
- **Complexity:** Low — analysis and documentation
- **Sizing:** 4 tasks / 10 subtasks / 1 new file
- **Agents consulted:** Architect

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (stub) |
| 2026-02-23 | Full rewrite with codebase research. Key finding: 101 actual consumers (not 109), Transaction is a flat type that doesn't benefit from sub-typing. Redirecting ~15 category-only consumers to shared/schema/categories is the correct approach. Target revised from <50 to <88. |
| 2026-02-27 | ECC re-creation validation: Consumer count corrected 101→110. Category-only count verified ~12 (not 48 from initial exploration). `CategorySource`/`MerchantSource` must be added to `shared/schema/categories.ts`. Target revised ≤88→≤100. Status: ready-for-dev. |
